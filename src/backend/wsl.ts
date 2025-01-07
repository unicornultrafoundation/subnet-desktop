import events from 'events';
import { Architecture, BackendError, BackendEvents, BackendProgress, BackendSettings, execOptions, FailureDetails, RestartReasons, State, VMBackend, VMExecutor } from './backend';
import * as childProcess from '../utils/childProcess';
import ProgressTracker, { getProgressErrorDescription } from './progressTracker';
import BackgroundProcess from '../utils/backgroundProcess';
import path from 'path';
import paths from '../utils/paths'
import Logging from '../utils/logging';
import fs from 'fs';
import util from 'util';
import * as reg from 'native-reg';
import os from 'os';
import DEPENDENCY_VERSIONS from '../assets/dependencies.yaml';
import { defined, RecursivePartial } from '../utils/typeUtils';
import _ from 'lodash';


/** The version of the WSL distro we expect. */

const DISTRO_VERSION = DEPENDENCY_VERSIONS.WSLDistro;
const INSTANCE_NAME = 'subnet-desktop';
const DATA_INSTANCE_NAME = 'subnet-desktop-data';
const WSL_PATH_CONVERT_RETRIES = 10;

const console = Logging.wsl;

type wslExecOptions = execOptions & {
    /** Output encoding; defaults to utf16le. */
    encoding?: BufferEncoding;
    /** The distribution to execute within. */
    distro?: string;
};

/**
 * Enumeration for tracking what operation the backend is undergoing.
 */
export enum Action {
    NONE = 'idle',
    STARTING = 'starting',
    STOPPING = 'stopping',
}

export default class WSLBackend extends events.EventEmitter implements VMBackend, VMExecutor {
    progressTracker: ProgressTracker
    progress: BackendProgress = { current: 0, max: 0 };
    debug = false;
    readonly executor = this;
    /**
     * Reference to the _init_ process in WSL.  All other processes should be
     * children of this one.  Note that this is busybox init, running in a custom
     * mount & pid namespace.
     */
    protected process: childProcess.ChildProcess | null = null;

    /**
     * The current operation underway; used to avoid responding to state changes
     * when we're in the process of doing a different one.
     */
    currentAction: Action = Action.NONE;

    /** The current user-visible state of the backend. */
    protected internalState: State = State.STOPPED;
    get state() {
        return this.internalState;
    }

    protected async setState(state: State) {
        this.internalState = state;
        this.emit('state-changed', this.state);
        switch (this.state) {
            case State.STOPPING:
            case State.STOPPED:
            case State.ERROR:
            case State.STARTING:
            case State.STARTED:
            /* nothing */
        }
    }

    /**
     * Windows-side process for the subnet Desktop Networking,
     * it is used to provide DNS, DHCP and Port Forwarding
     * to the vm-switch that is running in the WSL VM.
     */
    protected hostSwitchProcess: BackgroundProcess;

    constructor(_arch: Architecture) {
        super();
        this.progressTracker = new ProgressTracker((progress) => {
            this.progress = progress;
            this.emit('progress');
        }, console);

        this.hostSwitchProcess = new BackgroundProcess('host-switch.exe', {
            spawn: async () => {
                const exe = path.join(paths.resources, 'win32', 'internal', 'host-switch.exe');
                const stream = await Logging['host-switch'].fdStream;
                const args: string[] = [];
                return childProcess.spawn(exe, args, {
                    stdio: ['ignore', stream, stream],
                    windowsHide: true,
                });
            },
            shouldRun: () => Promise.resolve([State.STARTING, State.STARTED, State.DISABLED].includes(this.state)),
        });

    }
    get backend(): 'wsl' {
        return 'wsl';
    }
    get cpus(): Promise<number> {
        // This doesn't make sense for WSL2, since that's a global configuration.
        return Promise.resolve(0);
    }

    get memory(): Promise<number> {
        // This doesn't make sense for WSL2, since that's a global configuration.
        return Promise.resolve(0);
    }

    getBackendInvalidReason(): Promise<BackendError | null> {
        throw new Error('Method not implemented.');
    }
    handleSettingsUpdate(_config: BackendSettings): Promise<void> {
        throw new Error('Method not implemented.');
    }
    requiresRestartReasons(_config: RecursivePartial<BackendSettings>): Promise<RestartReasons> {
        throw new Error('Method not implemented.');
    }


    /** Get the IPv4 address of the VM, assuming it's already up. */
    get ipAddress(): Promise<string | undefined> {
        return (async () => {
            // When using mirrored-mode networking, 127.0.0.1 works just fine
            // ...also, there may not even be an `eth0` to find the IP of!
            try {
                const networkModeString = await this.captureCommand('wslinfo', '-n', '--networking-mode');

                if (networkModeString === 'mirrored') {
                    return '127.0.0.1';
                }
            } catch {
                // wslinfo is missing (wsl < 2.0.4) - fall back to old behavior
            }

            // We need to locate the _local_ route (netmask) for eth0, and then
            // look it up in /proc/net/fib_trie to find the local address.
            const routesString = await this.captureCommand('cat', '/proc/net/route');
            const routes = routesString.split(/\r?\n/).map(line => line.split(/\s+/));
            const route = routes.find(route => route[0] === 'eth0' && route[1] !== '00000000');

            if (!route) {
                return undefined;
            }
            const net = Array.from(route[1].matchAll(/../g)).reverse().map(n => parseInt(n.toString(), 16)).join('.');
            const trie = await this.captureCommand('cat', '/proc/net/fib_trie');
            const lines = _.takeWhile(trie.split(/\r?\n/).slice(1), line => /^\s/.test(line));
            const iface = _.dropWhile(lines, line => !line.includes(`${net}/`));
            const addr = iface.find((_, i, array) => array[i + 1]?.includes('/32 host LOCAL'));

            return addr?.split(/\s+/).pop();
        })();
    }

    /** A transient property that prevents prompting via modal UI elements. */
    #noModalDialogs = false;

    get noModalDialogs() {
        return this.#noModalDialogs;
    }

    set noModalDialogs(value: boolean) {
        this.#noModalDialogs = value;
    }

    /** Indicates whether the current installation is an Admin Install. */
    #isAdminInstall: Promise<boolean> | undefined;

    protected getIsAdminInstall(): Promise<boolean> {
        this.#isAdminInstall ??= new Promise((resolve) => {
            let key;

            try {
                key = reg.openKey(reg.HKLM, 'SOFTWARE', reg.Access.READ);

                if (key) {
                    const parsedValue = reg.getValue(key, 'SUSE\\SubnetDesktop', 'AdminInstall');
                    const isAdmin = parsedValue !== null;

                    return resolve(isAdmin);
                } else {
                    console.debug('Failed to open registry key: HKEY_LOCAL_MACHINE\SOFTWARE');
                }
            } catch (error) {
                console.error(`Error accessing registry: ${error}`);
            } finally {
                reg.closeKey(key);
            }

            return resolve(false);
        });

        return this.#isAdminInstall;
    }

    protected async killStaleProcesses() {
        // Attempting to terminate a terminated distribution is a no-op.
        await Promise.all([
            this.execWSL('--terminate', INSTANCE_NAME),
            this.execWSL('--terminate', DATA_INSTANCE_NAME),
            this.hostSwitchProcess.stop(),
        ]);
    }

    /**
     * Copy a file from Windows to the WSL distribution.
     */
    protected async wslInstall(windowsPath: string, targetDirectory: string, targetBasename: string = ''): Promise<void> {
        const wslSourcePath = await this.wslify(windowsPath);
        const basename = path.basename(windowsPath);
        // Don't use `path.join` or the backslashes will come back.
        const targetFile = `${targetDirectory}/${targetBasename || basename}`;

        console.log(`Installing ${windowsPath} as ${wslSourcePath} into ${targetFile} ...`);
        try {
            const stdout = await this.captureCommand('cp', wslSourcePath, targetFile);

            if (stdout) {
                console.log(`cp ${windowsPath} as ${wslSourcePath} to ${targetFile}: ${stdout}`);
            }
        } catch (err) {
            console.log(`Error trying to cp ${windowsPath} as ${wslSourcePath} to ${targetFile}: ${err}`);
            throw err;
        }
    }

    /**
     * Read the given file in a WSL distribution
     * @param [filePath] the path of the file to read.
     * @param [options] Optional configuration for reading the file.
     * @param [options.distro=INSTANCE_NAME] The distribution to read from.
     * @param [options.encoding='utf-8'] The encoding to use for the result.
     */
    async readFile(filePath: string, options?: Partial<{
        distro: typeof INSTANCE_NAME | typeof DATA_INSTANCE_NAME,
        encoding: BufferEncoding,
    }>) {
        const distro = options?.distro ?? INSTANCE_NAME;
        const encoding = options?.encoding ?? 'utf-8';

        filePath = (await this.execCommand({ distro, capture: true }, 'busybox', 'readlink', '-f', filePath)).trim();

        // Run wslpath here, to ensure that WSL generates any files we need.
        for (let i = 1; i <= WSL_PATH_CONVERT_RETRIES; ++i) {
            const windowsPath = (await this.execCommand({
                distro, encoding, capture: true,
            }, '/bin/wslpath', '-w', filePath)).trim();

            if (!windowsPath) {
                // Failed to convert for some reason; try again.
                await util.promisify(setTimeout)(100);
                continue;
            }

            return await fs.promises.readFile(windowsPath, options?.encoding ?? 'utf-8');
        }

        throw new Error(`Failed to convert ${filePath} to a Windows path.`);
    }

    /**
     * Write the given contents to a given file name in the given WSL distribution.
     * @param filePath The destination file path, in the WSL distribution.
     * @param fileContents The contents of the file.
     * @param [options] An object with fields .permissions=0o644 (the file permissions); and .distro=INSTANCE_NAME (WSL distribution to write to).
     */
    async writeFileWSL(filePath: string, fileContents: string, options?: Partial<{ permissions: fs.Mode, distro: typeof INSTANCE_NAME | typeof DATA_INSTANCE_NAME }>) {
        const distro = options?.distro ?? INSTANCE_NAME;
        const workdir = await fs.promises.mkdtemp(path.join(os.tmpdir(), `rd-${path.basename(filePath)}-`));

        try {
            const scriptPath = path.join(workdir, path.basename(filePath));
            const wslScriptPath = await this.wslify(scriptPath, distro);

            await fs.promises.writeFile(scriptPath, fileContents.replace(/\r/g, ''), 'utf-8');
            await this.execCommand({ distro }, 'busybox', 'cp', wslScriptPath, filePath);
            await this.execCommand({ distro }, 'busybox', 'chmod', (options?.permissions ?? 0o644).toString(8), filePath);
        } finally {
            await fs.promises.rm(workdir, { recursive: true, maxRetries: 3 });
        }
    }

    /**
     * Runs wsl-proxy process in the default namespace. This is to proxy
     * other distro's traffic from default namespace into the network namespace.
     */
    protected async runWslProxy() {
        const debug = this.debug ? 'true' : 'false';

        try {
            await this.execCommand('/usr/local/bin/wsl-proxy', '-debug', debug);
        } catch (err: any) {
            console.log('Error trying to start wsl-proxy in default namespace:', err);
        }
    }


    /**
     * Convert a Windows path to a path in the WSL subsystem:
     * - Changes \s to /s
     * - Figures out what the /mnt/DRIVE-LETTER path should be
     */
    async wslify(windowsPath: string, distro?: string): Promise<string> {
        for (let i = 1; i <= WSL_PATH_CONVERT_RETRIES; i++) {
            const result: string = (await this.captureCommand({ distro }, 'wslpath', '-a', '-u', windowsPath)).trimEnd();

            if (result) {
                return result;
            }
            console.log(`Failed to convert '${windowsPath}' to a wsl path, retry #${i}`);
            await util.promisify(setTimeout)(100);
        }

        return '';
    }

    async start(): Promise<void> {
        await this.setState(State.STARTING);
        this.currentAction = Action.STARTING;

        await this.progressTracker.action('Initializing Subnet Desktop', 10, async () => {

        })
    }

    async stop(): Promise<void> {
        // When we manually call stop, the subprocess will terminate, which will
        // cause stop to get called again.  Prevent the reentrancy.
        // If we're in the middle of starting, also ignore the call to stop (from
        // the process terminating), as we do not want to shut down the VM in that
        // case.
        if (this.currentAction !== Action.NONE) {
            return;
        }
        this.currentAction = Action.STOPPING;
        try {
            await this.setState(State.STOPPING);

            await this.progressTracker.action('Shutting Down...', 10, async () => {
                if (await this.isDistroRegistered({ runningOnly: true })) {
                    const services = ['docker', 'containerd'];

                    for (const service of services) {
                        try {
                            await this.stopService(service);
                        } catch (ex) {
                            // Do not allow errors here to prevent us from stopping.
                            console.error(`Failed to stop service ${service}:`, ex);
                        }
                    }
                    try {
                        await this.stopService('local');
                    } catch (ex) {
                        // Do not allow errors here to prevent us from stopping.
                        console.error('Failed to run user provisioning scripts on stopping:', ex);
                    }
                }
                const initProcess = this.process;

                this.process = null;
                if (initProcess) {
                    initProcess.kill('SIGTERM');
                    try {
                        await this.execCommand({ expectFailure: true }, '/usr/bin/killall', '/usr/local/bin/network-setup');
                    } catch (ex) {
                        // `killall` returns failure if it fails to kill (e.g. if the
                        // process does not exist); `-q` only suppresses printing any error
                        // messages.
                        console.error('Ignoring error shutting down network-setup:', ex);
                    }
                }
                await this.hostSwitchProcess.stop();
                if (await this.isDistroRegistered({ runningOnly: true })) {
                    await this.execWSL('--terminate', INSTANCE_NAME);
                }
            });
            await this.setState(State.STOPPED);
        } catch (ex) {
            await this.setState(State.ERROR);
            throw ex;
        } finally {
            this.currentAction = Action.NONE;
        }
    }

    async del(): Promise<void> {
        await this.progressTracker.action('Deleting Kubernetes', 20, async () => {
            await this.stop();
            if (await this.isDistroRegistered()) {
                await this.execWSL('--unregister', INSTANCE_NAME);
            }
            if (await this.isDistroRegistered({ distribution: DATA_INSTANCE_NAME })) {
                await this.execWSL('--unregister', DATA_INSTANCE_NAME);
            }
        });
    }

    async reset(): Promise<void> {
        await this.progressTracker.action('Resetting Kubernetes state...', 5, async () => {
            await this.stop();
            await this.start();
        });
    }

    /**
   * List the registered WSL2 distributions.
   */
    protected async registeredDistros({ runningOnly = false } = {}): Promise<string[]> {
        const args = ['--list', '--quiet', runningOnly ? '--running' : undefined];
        const distros = (await this.execWSL({ capture: true }, ...args.filter(defined)))
            .split(/\r?\n/g)
            .map(x => x.trim())
            .filter(x => x);

        if (distros.length < 1) {
            // Return early if we find no distributions in this list; listing again
            // with verbose will fail if there are no distributions.
            return [];
        }

        const stdout = await this.execWSL({ capture: true }, '--list', '--verbose');
        // As wsl.exe may be localized, don't check state here.
        const parser = /^[\s*]+(?<name>.*?)\s+\w+\s+(?<version>\d+)\s*$/;

        const result = stdout.trim()
            .split(/[\r\n]+/)
            .slice(1) // drop the title row
            .map(line => line.match(parser))
            .filter(defined)
            .filter(result => result.groups?.version === '2')
            .map(result => result.groups?.name)
            .filter(defined);

        return result.filter(x => distros.includes(x));
    }

    protected async isDistroRegistered({ distribution = INSTANCE_NAME, runningOnly = false } = {}): Promise<boolean> {
        const distros = await this.registeredDistros({ runningOnly });

        console.log(`Registered distributions: ${distros}`);

        return distros.includes(distribution || INSTANCE_NAME);
    }

    protected async getDistroVersion(): Promise<string> {
        // ESLint doesn't realize we're doing inline shell scripts.
        // eslint-disable-next-line no-template-curly-in-string
        const script = '[ -e /etc/os-release ] && . /etc/os-release ; echo ${VERSION_ID:-0.1}';

        return (await this.captureCommand('/bin/sh', '-c', script)).trim();
    }

    protected get distroFile() {
        return path.join(paths.resources, os.platform(), `distro-${DISTRO_VERSION}.tar`);
    }

    /**
     * Ensure that the distribution has been installed into WSL2.
     * Any upgrades to the distribution should be done immediately after this.
     */
    protected async ensureDistroRegistered(): Promise<void> {
        if (!await this.isDistroRegistered()) {
            await this.progressTracker.action('Registering WSL distribution', 100, async () => {
                await fs.promises.mkdir(paths.wslDistro, { recursive: true });
                try {
                    await this.execWSL({ capture: true },
                        '--import', INSTANCE_NAME, paths.wslDistro, this.distroFile, '--version', '2');
                } catch (ex: any) {
                    if (!String(ex.stdout ?? '').includes('ensure virtualization is enabled')) {
                        throw ex;
                    }
                    throw new BackendError('Virtualization not supported', ex.stdout, true);
                }
            });
        }

        if (!await this.isDistroRegistered()) {
            throw new Error(`Error registering WSL2 distribution`);
        }
    }


    /**
       * Stop the given OpenRC service.
       *
       * @param service The name of the OpenRC service to stop.
       */
    async stopService(service: string) {
        await this.execService(service, 'stop', '--ifstarted');
    }

    /**
     * Execute a command on a given OpenRC service.
     *
     * @param service The name of the OpenRC service to execute.
     * @param action The name of the OpenRC service action to execute.
     * @param argument Argument to pass to `wsl-service` (`--ifnotstart`, `--ifstarted`)
     */
    async execService(service: string, action: string, argument = '') {
        await this.execCommand('/usr/local/bin/wsl-service', argument, service, action);
    }

    /**
     * execWSL runs wsl.exe with the given arguments, redirecting all output to
     * the log files.
     */
    protected async execWSL(...args: string[]): Promise<void>;
    protected async execWSL(options: wslExecOptions, ...args: string[]): Promise<void>;
    protected async execWSL(options: wslExecOptions & { capture: true }, ...args: string[]): Promise<string>;
    protected async execWSL(optionsOrArg: wslExecOptions | string, ...args: string[]): Promise<void | string> {
        let options: wslExecOptions & { capture?: boolean } = {};

        if (typeof optionsOrArg === 'string') {
            args = [optionsOrArg].concat(...args);
        } else {
            options = optionsOrArg;
        }
        try {
            let stream = options.logStream;

            if (!stream) {
                const logFile = Logging['wsl-exec'];

                // Write a duplicate log line so we can line up the log files.
                logFile.log(`Running: wsl.exe ${args.join(' ')}`);
                stream = await logFile.fdStream;
            }

            // We need two separate calls so TypeScript can resolve the return values.
            if (options.capture) {
                console.debug(`Capturing output: wsl.exe ${args.join(' ')}`);
                const { stdout } = await childProcess.spawnFile('wsl.exe', args, {
                    ...options,
                    encoding: options.encoding ?? 'utf16le',
                    stdio: ['ignore', 'pipe', stream],
                });

                return stdout;
            }
            console.debug(`Running: wsl.exe ${args.join(' ')}`);
            await childProcess.spawnFile('wsl.exe', args, {
                ...options,
                encoding: options.encoding ?? 'utf16le',
                stdio: ['ignore', stream, stream],
            });
        } catch (ex) {
            if (!options.expectFailure) {
                console.log(`WSL failed to execute wsl.exe ${args.join(' ')}: ${ex}`);
            }
            throw ex;
        }
    }

    async execCommand(...command: string[]): Promise<void>;
    async execCommand(options: wslExecOptions, ...command: string[]): Promise<void>;
    async execCommand(options: wslExecOptions & { capture: true }, ...command: string[]): Promise<string>;
    async execCommand(optionsOrArg: wslExecOptions | string, ...command: string[]): Promise<void | string> {
        let options: wslExecOptions = {};
        const cwdOptions: string[] = [];

        if (typeof optionsOrArg === 'string') {
            command = [optionsOrArg].concat(command);
        } else {
            options = optionsOrArg;
        }

        if (options.cwd) {
            cwdOptions.push('--cd', options.cwd.toString());
            delete options.cwd;
        }

        const expectFailure = options.expectFailure ?? false;

        try {
            // Print a slightly different message if execution fails.
            return await this.execWSL({
                encoding: 'utf-8', ...options, expectFailure: true,
            }, '--distribution', options.distro ?? INSTANCE_NAME, ...cwdOptions, '--exec', ...command);
        } catch (ex) {
            if (!expectFailure) {
                console.log(`WSL: executing: ${command.join(' ')}: ${ex}`);
            }
            throw ex;
        }
    }

    spawn(...command: string[]): childProcess.ChildProcess;
    spawn(options: execOptions, ...command: string[]): childProcess.ChildProcess;
    spawn(optionsOrCommand: execOptions | string, ...command: string[]): childProcess.ChildProcess {
        const args = ['--distribution', INSTANCE_NAME, '--exec', '/usr/local/bin/wsl-exec'];

        if (typeof optionsOrCommand === 'string') {
            args.push(optionsOrCommand);
        } else {
            throw new TypeError('Not supported yet');
        }
        args.push(...command);

        return childProcess.spawn('wsl.exe', args);
    }

    /**
     * captureCommand runs the given command in the K3s WSL environment and returns
     * the standard output.
     * @param command The command to execute.
     * @returns The output of the command.
     */
    protected async captureCommand(...command: string[]): Promise<string>;
    protected async captureCommand(options: wslExecOptions, ...command: string[]): Promise<string>;
    protected async captureCommand(optionsOrArg: wslExecOptions | string, ...command: string[]): Promise<string> {
        let result: string;
        let debugArg: string;

        if (typeof optionsOrArg === 'string') {
            result = await this.execCommand({ capture: true }, optionsOrArg, ...command);
            debugArg = optionsOrArg;
        } else {
            result = await this.execCommand({ ...optionsOrArg, capture: true }, ...command);
            debugArg = JSON.stringify(optionsOrArg);
        }
        console.debug(`captureCommand:\ncommand: (${debugArg} ${command.map(s => `'${s}'`).join(' ')})\noutput: <${result}>`);

        return result;
    }

    async getFailureDetails(exception: any): Promise<FailureDetails> {
        const loglines = (await fs.promises.readFile(console.path, 'utf-8')).split('\n').slice(-10);

        return {
            lastCommand: exception[childProcess.ErrorCommand],
            lastCommandComment: getProgressErrorDescription(exception) ?? 'Unknown',
            lastLogLines: loglines,
        };
    }

    // #region Events
    eventNames(): Array<keyof BackendEvents> {
        return super.eventNames() as Array<keyof BackendEvents>;
    }

    listeners<eventName extends keyof BackendEvents>(
        event: eventName,
    ): BackendEvents[eventName][] {
        return super.listeners(event) as BackendEvents[eventName][];
    }

    rawListeners<eventName extends keyof BackendEvents>(
        event: eventName,
    ): BackendEvents[eventName][] {
        return super.rawListeners(event) as BackendEvents[eventName][];
    }
    // #endregion

    /**
   * Write the given contents to a given file name in the VM.
   * The file will be owned by root.
   * @param filePath The destination file path, in the VM.
   * @param fileContents The contents of the file.
   * @param permissions The file permissions.
   */
    async writeFile(filePath: string, fileContents: string, permissions: fs.Mode = 0o644) {
        await this.writeFileWSL(filePath, fileContents, { permissions });
    }

    async copyFileIn(hostPath: string, vmPath: string): Promise<void> {
        // Sometimes WSL has issues copying _from_ the VM.  So we instead do the
        // copying from inside the VM.
        await this.execCommand('/bin/cp', '-f', '-T', await this.wslify(hostPath), vmPath);
    }

    async copyFileOut(vmPath: string, hostPath: string): Promise<void> {
        // Sometimes WSL has issues copying _from_ the VM.  So we instead do the
        // copying from inside the VM.
        await this.execCommand('/bin/cp', '-f', '-T', vmPath, await this.wslify(hostPath));
    }
}
