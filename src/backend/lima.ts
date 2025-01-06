import path from "path";
import paths from '../utils/paths'
import os from 'os';
import * as childProcess from '../utils/childProcess';
import events from 'events';
import { Architecture, BackendError, BackendEvents, BackendProgress, BackendSettings, execOptions, FailureDetails, RestartReasons, State, VMBackend, VMExecutor } from "./backend";
import ProgressTracker from "./progressTracker";
import clone from '../utils/clone';
import { omit } from "lodash";
import { ChildProcess, spawn as spawnWithSignal } from 'child_process';
import { RecursivePartial } from "../utils/typeUtils";
import Logging from '../utils/logging';
import fs from 'fs';

export const MACHINE_NAME = '0';
const console = Logging.lima;
/**
 * Symbolic names for various SLIRP IP addresses.
 */
enum SLIRP {
    HOST_GATEWAY = '192.168.5.2',
    DNS = '192.168.5.3',
    GUEST_IP_ADDRESS = '192.168.5.15',
}

/**
 * One entry from `limactl list --json`
 */
interface LimaListResult {
    name: string;
    status: 'Broken' | 'Stopped' | 'Running';
    dir: string;
    arch: 'x86_64' | 'aarch64';
    vmType?: 'qemu' | 'vz';
    sshLocalPort?: number;
    hostAgentPID?: number;
    qemuPID?: number;
    errors?: string[];
}

/**
 * Options passed to spawnWithCapture method
 */
type SpawnOptions = {
    expectFailure?: boolean,
    stderr?: boolean,
    env?: NodeJS.ProcessEnv,
};

/**
 * Enumeration for tracking what operation the backend is undergoing.
 */
export enum Action {
    NONE = 'idle',
    STARTING = 'starting',
    STOPPING = 'stopping',
}

/** The following files, and their parents up to /, must only be writable by root,
 *  and none of them are allowed to be symlinks (lima-vm requirements).
 */
const VMNET_DIR = '/opt/subnet-desktop';

export class LimaBackend extends events.EventEmitter implements VMBackend,VMExecutor {
    readonly executor = this;


    rawListeners<eventName extends keyof BackendEvents>(event: eventName): BackendEvents[eventName][] {
        return super.rawListeners(event) as BackendEvents[eventName][];
    }
    listeners<eventName extends keyof BackendEvents>(event: eventName): BackendEvents[eventName][] {
        return super.listeners(event) as BackendEvents[eventName][];
    }
    eventNames(): (keyof BackendEvents)[] {
        return super.eventNames() as (keyof BackendEvents)[];
    }
    /** Helper object to manage progress notifications. */
    progressTracker;

    constructor(_arch: Architecture) {
        super()

        this.progressTracker = new ProgressTracker((progress) => {
            this.progress = progress;
            this.emit('progress');
        }, console);
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
        throw new Error("Method not implemented.");
    }
    del(): Promise<void> {
        throw new Error("Method not implemented.");
    }
    reset(_config: BackendSettings): Promise<void> {
        throw new Error("Method not implemented.");
    }
    handleSettingsUpdate(_config: BackendSettings): Promise<void> {
        throw new Error("Method not implemented.");
    }
    requiresRestartReasons(_config: RecursivePartial<BackendSettings>): Promise<RestartReasons> {
        throw new Error("Method not implemented.");
    }

    /**
     * Get the IPv4 address of the VM. This address should be routable from within the VM itself.
     * In Lima the SLIRP guest IP address is hard-coded.
     */
    get ipAddress(): Promise<string | undefined> {
        return Promise.resolve(SLIRP.GUEST_IP_ADDRESS);
    }

    getFailureDetails(_config: any): Promise<FailureDetails> {
        throw new Error("Method not implemented.");
    }
    /** A transient property that prevents prompting via modal UI elements. */
    #noModalDialogs = false;

    get noModalDialogs() {
        return this.#noModalDialogs;
    }

    set noModalDialogs(value: boolean) {
        this.#noModalDialogs = value;
    }


    progress: BackendProgress = { current: 0, max: 0 };
    debug = false;
    protected internalState: State = State.STOPPED;

    get state() {
        return this.internalState;
    }

    get backend(): 'lima' {
        return 'lima';
    }

    /**
    * The current operation underway; used to avoid responding to state changes
    * when we're in the process of doing a different one.
    */
    currentAction: Action = Action.NONE;

    protected static get qemuImg() {
        return path.join(paths.resources, os.platform(), 'lima', 'bin', 'qemu-img');
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

    async start(): Promise<void> {
        await this.setState(State.STARTING);
        this.currentAction = Action.STARTING;

        await this.progressTracker.action('Starting Backend', 10, async () => {
            // Start the VM; if it's already running, this does nothing.
            await this.startVm();
        })
    }

    protected async startVm(): Promise<void> {
        await this.progressTracker.action('Starting virtual machine', 100, async () => {
            try {
                await this.lima('start', '--tty=false');
            } finally {

            }
        })

    }

    /**
 * Get the current Lima VM status, or undefined if there was an error
 * (e.g. the machine is not registered).
 */
    protected get status(): Promise<LimaListResult | undefined> {
        return (async () => {
            try {
                const { stdout } = await this.limaWithCapture('list', '--json');
                const lines = stdout.split(/\r?\n/).filter(x => x.trim());
                const entries = lines.map(line => JSON.parse(line) as LimaListResult);

                return entries.find(entry => entry.name === MACHINE_NAME);
            } catch (ex) {
                console.error('Could not parse lima status, assuming machine is unavailable.');

                return undefined;
            }
        })();
    }

    spawn(...command: string[]): childProcess.ChildProcess;
    spawn(options: execOptions, ...command: string[]): childProcess.ChildProcess;
    spawn(optionsOrCommand: string | execOptions, ...command: string[]): ChildProcess {
        let options: execOptions = {};
        const args = command.concat();

        if (typeof optionsOrCommand === 'string') {
            args.unshift(optionsOrCommand);
        } else {
            options = optionsOrCommand;
        }

        return this.limaSpawn(options, args);
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

        await this.progressTracker.action('Stopping services', 10, async () => {
            try {
                await this.setState(State.STOPPING);

                const status = await this.status;

                if (status && status.status === 'Running') {
                    await this.execCommand({ root: true }, '/sbin/rc-service', '--ifstarted', 'containerd', 'stop');
                    await this.execCommand({ root: true }, '/sbin/fstrim', '/mnt/data');
                    await this.lima('stop', MACHINE_NAME);
                }
                await this.setState(State.STOPPED);
            } catch (ex) {
                await this.setState(State.ERROR);
                throw ex;
            } finally {
                this.currentAction = Action.NONE;
            }
        });
    }

    protected static get limactl() {
        return path.join(paths.resources, os.platform(), 'lima', 'bin', 'limactl');
    }

    protected static get limaEnv() {
        const binDir = path.join(paths.resources, os.platform(), 'lima', 'bin');
        const libDir = path.join(paths.resources, os.platform(), 'lima', 'lib');
        const VMNETDir = path.join(VMNET_DIR, 'bin');
        const pathList = (process.env.PATH || '').split(path.delimiter);
        const newPath = [binDir, VMNETDir].concat(...pathList).filter(x => x);

        // LD_LIBRARY_PATH is set for running from an extracted Linux zip file, that includes QEMU,
        // to make sure QEMU dependencies are loaded from the bundled lib directory,
        // LD_LIBRARY_PATH is ignored on macOS.
        return {
            ...process.env, LIMA_HOME: paths.lima, LD_LIBRARY_PATH: libDir, PATH: newPath.join(path.delimiter),
        };
    }


    /**
   * Run `limactl` with the given arguments.
   */
    async lima(this: Readonly<this>, ...args: string[]): Promise<void> {
        args = this.debug ? ['--debug'].concat(args) : args;
        try {
            const { stdout, stderr } = await childProcess.spawnFile(LimaBackend.limactl, args,
                { env: LimaBackend.limaEnv, stdio: ['ignore', 'pipe', 'pipe'] });
            const formatBreak = stderr || stdout ? '\n' : '';

            console.log(`> limactl ${args.join(' ')}${formatBreak}${stderr}${stdout}`);
        } catch (ex) {
            console.error(`> limactl ${args.join(' ')}\n$`, ex);
            throw ex;
        }
    }

    async spawnWithCapture(this: Readonly<this>, cmd: string, argOrOptions: string | SpawnOptions = {}, ...args: string[]): Promise<{ stdout: string, stderr: string }> {
        let options: SpawnOptions = {};

        if (typeof argOrOptions === 'string') {
            args.unshift(argOrOptions);
        } else {
            options = clone(argOrOptions);
        }
        options.env ??= process.env;

        try {
            const { stdout, stderr } = await childProcess.spawnFile(cmd, args, { env: options.env, stdio: ['ignore', 'pipe', 'pipe'] });
            const formatBreak = stderr || stdout ? '\n' : '';

            console.log(`> ${cmd} ${args.join(' ')}${formatBreak}${stderr}${stdout}`);

            return { stdout, stderr };
        } catch (ex: any) {
            if (!options?.expectFailure) {
                console.error(`> ${cmd} ${args.join(' ')}\n$`, ex);
                if (this.debug && 'stdout' in ex) {
                    console.error(ex.stdout);
                }
                if (this.debug && 'stderr' in ex) {
                    console.error(ex.stderr);
                }
            }
            throw ex;
        }
    }

    /**
  * Run the given command within the VM.
  */
    limaSpawn(options: execOptions, args: string[]): ChildProcess {
        const workDir = options.cwd ?? '.';

        if (options.root) {
            args = ['sudo'].concat(args);
        }
        args = ['shell', `--workdir=${workDir}`, MACHINE_NAME].concat(args);

        if (this.debug) {
            console.log(`> limactl ${args.join(' ')}`);
            args.unshift('--debug');
        }

        return spawnWithSignal(
            LimaBackend.limactl,
            args,
            { ...omit(options, 'cwd'), env: { ...LimaBackend.limaEnv, ...options.env ?? {} } });
    }

    async execCommand(...command: string[]): Promise<void>;
    async execCommand(options: execOptions, ...command: string[]): Promise<void>;
    async execCommand(options: execOptions & { capture: true }, ...command: string[]): Promise<string>;
    async execCommand(optionsOrArg: execOptions | string, ...command: string[]): Promise<void | string> {
        let options: execOptions & { capture?: boolean } = {};

        if (typeof optionsOrArg === 'string') {
            command = [optionsOrArg].concat(command);
        } else {
            options = optionsOrArg;
        }
        if (options.root) {
            command = ['sudo'].concat(command);
        }

        const expectFailure = options.expectFailure ?? false;
        const workDir = options.cwd ?? '.';

        try {
            // Print a slightly different message if execution fails.
            const { stdout } = await this.limaWithCapture({ expectFailure: true }, 'shell', `--workdir=${workDir}`, MACHINE_NAME, ...command);

            if (options.capture) {
                return stdout;
            }
        } catch (ex: any) {
            if (!expectFailure) {
                console.log(`Lima: executing: ${command.join(' ')}: ${ex}`);
                if (this.debug && 'stdout' in ex) {
                    console.error('stdout:', ex.stdout);
                }
                if (this.debug && 'stderr' in ex) {
                    console.error('stderr:', ex.stderr);
                }
            }
            throw ex;
        }
    }

    /**
   * Run `limactl` with the given arguments, and return stdout.
   */
    protected async limaWithCapture(this: Readonly<this>, ...args: string[]): Promise<{ stdout: string, stderr: string }>;
    protected async limaWithCapture(this: Readonly<this>, options: SpawnOptions, ...args: string[]): Promise<{ stdout: string, stderr: string }>;
    protected async limaWithCapture(this: Readonly<this>, argOrOptions: string | SpawnOptions, ...args: string[]): Promise<{ stdout: string, stderr: string }> {
        let options: SpawnOptions = {};

        if (typeof argOrOptions === 'string') {
            args.unshift(argOrOptions);
        } else {
            options = clone(argOrOptions);
        }
        if (this.debug) {
            args.unshift('--debug');
        }
        options['env'] = LimaBackend.limaEnv;

        return await this.spawnWithCapture(LimaBackend.limactl, options, ...args);
    }

    async readFile(filePath: string, options?: { encoding?: BufferEncoding }): Promise<string> {
        const encoding = options?.encoding ?? 'utf-8';
        const stdout: Buffer[] = [];
        const stderr: Buffer[] = [];
    
        try {
          // Use limaSpawn to avoid logging file contents (too verbose).
          const proc = this.limaSpawn({ root: true }, ['/bin/cat', filePath]);
    
          await new Promise<void>((resolve, reject) => {
            proc.stdout?.on('data', (chunk: Buffer | string) => {
              stdout.push(Buffer.from(chunk));
            });
            proc.stderr?.on('data', (chunk: Buffer | string) => {
              stderr.push(Buffer.from(chunk));
            });
            proc.on('error', reject);
            proc.on('exit', (code, signal) => {
              if (code || signal) {
                return reject(new Error(`Failed to read ${ filePath }: /bin/cat exited with ${ code || signal }`));
              }
              resolve();
            });
          });
    
          return Buffer.concat(stdout).toString(encoding);
        } catch (ex: any) {
          console.error(`Failed to read file ${ filePath }:`, ex);
          if (stderr.length) {
            console.error(Buffer.concat(stderr).toString('utf-8'));
          }
          if (stdout.length) {
            console.error(Buffer.concat(stdout).toString('utf-8'));
          }
          throw ex;
        }
      }
    
      /**
       * Write the given contents to a given file name in the VM.
       * The file will be owned by root.
       * @param filePath The destination file path, in the VM.
       * @param fileContents The contents of the file.
       * @param permissions The file permissions.
       */
      async writeFile(filePath: string, fileContents: string, permissions: fs.Mode = 0o644) {
        const workdir = await fs.promises.mkdtemp(path.join(os.tmpdir(), `rd-${ path.basename(filePath) }-`));
        const tempPath = `/tmp/${ path.basename(workdir) }.${ path.basename(filePath) }`;
    
        try {
          const scriptPath = path.join(workdir, path.basename(filePath));
    
          await fs.promises.writeFile(scriptPath, fileContents, 'utf-8');
          await this.lima('copy', scriptPath, `${ MACHINE_NAME }:${ tempPath }`);
          await this.execCommand('chmod', permissions.toString(8), tempPath);
          await this.execCommand({ root: true }, 'mv', tempPath, filePath);
        } finally {
          await fs.promises.rm(workdir, { recursive: true });
          await this.execCommand({ root: true }, 'rm', '-f', tempPath);
        }
      }
    
      async copyFileIn(hostPath: string, vmPath: string): Promise<void> {
        // TODO This logic is copied from writeFile() above and should be simplified.
        const workdir = await fs.promises.mkdtemp(path.join(os.tmpdir(), `rd-${ path.basename(hostPath) }-`));
        const tempPath = `/tmp/${ path.basename(workdir) }.${ path.basename(hostPath) }`;
    
        try {
          await this.lima('copy', hostPath, `${ MACHINE_NAME }:${ tempPath }`);
          await this.execCommand('chmod', '644', tempPath);
          await this.execCommand({ root: true }, 'mv', tempPath, vmPath);
        } finally {
          await fs.promises.rm(workdir, { recursive: true });
          await this.execCommand({ root: true }, 'rm', '-f', tempPath);
        }
      }
    
      copyFileOut(vmPath: string, hostPath: string): Promise<void> {
        return this.lima('copy', `${ MACHINE_NAME }:${ vmPath }`, hostPath);
      }
}