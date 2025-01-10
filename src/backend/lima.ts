import path from "path";
import paths from '../utils/paths'
import os from 'os';
import util from 'util';
import * as childProcess from '../utils/childProcess';
import events from 'events';
import { Architecture, BackendError, BackendEvents, BackendProgress, BackendSettings, execOptions, FailureDetails, RestartReasons, State, VMBackend, VMExecutor } from "./backend";
import ProgressTracker from "./progressTracker";
import clone from '../utils/clone';
import { merge, omit } from "lodash";
import { ChildProcess, spawn as spawnWithSignal } from 'child_process';
import { defined, RecursivePartial } from "../utils/typeUtils";
import Logging from '../utils/logging';
import fs from 'fs';
import yaml from 'yaml';
import DEFAULT_CONFIG from '../assets/lima-config.yaml';
import { ContainerEngine, MountType, VMType } from "../config/settings";
import DEPENDENCY_VERSIONS from '../assets/dependencies.yaml';
import net from 'net';
import semver from 'semver';
import { ContainerEngineClient } from "./containerClient/types";
import { NerdctlClient } from "./containerClient/nerdctlClient";
import stream from 'stream';
import tar from 'tar-stream';
import NETWORKS_CONFIG from '../assets/networks-config.yaml';
import SERVICE_SUBNET from '../assets/scripts/service-subnet.initd?raw'
import { app } from 'electron'
import { updateSubnetConfig as updateSubnetConfigUtil, checkStatus as checkStatusUtil } from '../utils/subnet';

export const MACHINE_NAME = '0';
const console = Logging.lima;

const IMAGE_VERSION = DEPENDENCY_VERSIONS.alpineLimaISO.isoVersion;
const ALPINE_EDITION = 'rd';
const ALPINE_VERSION = DEPENDENCY_VERSIONS.alpineLimaISO.alpineVersion;
const PREVIOUS_LIMA_SUDOERS_LOCATION = '/private/etc/sudoers.d/subnet-desktop-lima';
const LIMA_SUDOERS_LOCATION = '/private/etc/sudoers.d/zzzzz-subnet-desktop-lima';

/**
 * Lima networking configuration.
 * @see https://github.com/lima-vm/lima/blob/v0.8.0/pkg/networks/networks.go
 */
interface LimaNetworkConfiguration {
    paths: {
        socketVMNet: string;
        varRun: string;
        sudoers?: string;
    }
    group?: string;
    networks: Record<string, {
        mode: 'host' | 'shared';
        gateway: string;
        dhcpEnd: string;
        netmask: string;
    } | {
        mode: 'bridged';
        interface: string;
    }>;
}

/**
 * QEMU Image formats
 */
enum ImageFormat {
    QCOW2 = 'qcow2',
    RAW = 'raw',
}


/** SPNetworkDataType is output from /usr/sbin/system_profiler on darwin. */
interface SPNetworkDataType {
    _name: string;
    interface: string;
    dhcp?: unknown;
    IPv4?: {
        Addresses?: string[];
    };
}

/**
 * QEMU Image Information as returned by `qemu-img info --output=json ...`
 */
type QEMUImageInfo = {
    format: string;
};

/**
 * Symbolic names for various SLIRP IP addresses.
 */
enum SLIRP {
    HOST_GATEWAY = '192.168.5.2',
    DNS = '192.168.5.3',
    GUEST_IP_ADDRESS = '192.168.5.15',
}

/**
 * Lima mount
 */
export type LimaMount = {
    location: string;
    writable?: boolean;
    '9p'?: {
        securityModel: string;
        protocolVersion: string;
        msize: string;
        cache: string;
    }
};

/**
 * Lima configuration
 */
export type LimaConfiguration = {
    vmType?: 'qemu' | 'vz';
    rosetta?: {
        enabled?: boolean;
        binfmt?: boolean;
    },
    arch?: 'x86_64' | 'aarch64';
    images: {
        location: string;
        arch?: 'x86_64' | 'aarch64';
        digest?: string;
    }[];
    cpus?: number;
    memory?: number;
    disk?: number;
    mounts?: LimaMount[];
    mountType: 'reverse-sshfs' | '9p' | 'virtiofs';
    ssh: {
        localPort: number;
        loadDotSSHPubKeys?: boolean;
    }
    firmware?: {
        legacyBIOS?: boolean;
    }
    video?: {
        display?: string;
    }
    provision?: {
        mode: 'system' | 'user';
        script: string;
    }[]
    containerd?: {
        system?: boolean;
        user?: boolean;
    }
    probes?: {
        mode: 'readiness';
        description: string;
        script: string;
        hint: string;
    }[];
    hostResolver?: {
        hosts?: Record<string, string>;
    }
    portForwards?: Array<Record<string, any>>;
    networks?: Array<Record<string, string | boolean>>;
    env?: Record<string, string>;
};


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

export class LimaBackend extends events.EventEmitter implements VMBackend, VMExecutor {
    /** Whether we can prompt the user for administrative access - this setting persists in the config. */
    #adminAccess = true;
    protected readonly CONFIG_PATH = path.join(paths.lima, '_config', `${MACHINE_NAME}.yaml`);
    readonly executor = this;
    /** The current config state. */
    protected cfg: BackendSettings | undefined;

    #containerEngineClient: ContainerEngineClient | undefined;

    get containerEngineClient() {
        if (this.#containerEngineClient) {
            return this.#containerEngineClient;
        }

        throw new Error('Invalid state, no container engine client available.');
    }


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
    progressTracker: ProgressTracker;

    arch: Architecture

    constructor(arch: Architecture) {
        super()
        this.arch = arch;
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
 * Update the Lima configuration.  This may stop the VM if the base disk image
 * needs to be changed.
 */
    protected async updateConfig(allowRoot = true) {
        const currentConfig = await this.getLimaConfig();
        const baseConfig: Partial<LimaConfiguration> = currentConfig || {};
        // We use {} as the first argument because merge() modifies
        // it, and it would be less safe to modify baseConfig.
        const config: LimaConfiguration = merge({}, baseConfig, DEFAULT_CONFIG as LimaConfiguration, {
            vmType: this.cfg?.experimental.virtualMachine.type,
            rosetta: {
                enabled: this.cfg?.experimental.virtualMachine.useRosetta,
                binfmt: this.cfg?.experimental.virtualMachine.useRosetta,
            },
            images: [{
                location: this.baseDiskImage,
                arch: this.arch,
            }],
            cpus: this.cfg?.virtualMachine.numberCPUs || 4,
            memory: (this.cfg?.virtualMachine.memoryInGB || 4) * 1024 * 1024 * 1024,
            mounts: this.getMounts(),
            mountType: this.cfg?.experimental.virtualMachine.mount.type,
            ssh: { localPort: await this.sshPort },
            hostResolver: {
                hosts: {
                    // As far as lima is concerned, the instance name is 'lima-0'.
                    // We change the hostname in a provisioning script.
                    'lima-subnet-desktop': 'lima-0',
                    'host.subnet-desktop.internal': 'host.lima.internal',
                    'host.docker.internal': 'host.lima.internal',
                },
            },
        });

        // Alpine can boot via UEFI now
        if (config.firmware) {
            config.firmware.legacyBIOS = false;
        }

        // RD used to store additional keys in lima.yaml that are not supported by lima (and no longer used by RD).
        // They must be removed because lima intends to switch to strict YAML parsing, so typos can be detected.
        delete (config as Record<string, unknown>).k3s;
        delete (config as Record<string, unknown>).paths;

        if (os.platform() === 'darwin') {
            if (allowRoot) {
                const hostNetwork = (await this.getDarwinHostNetworks()).find((n) => {
                    return n.dhcp && n.IPv4?.Addresses?.some(addr => addr);
                });

                // Always add a shared network interface in case the bridged interface doesn't get an IP address.
                config.networks = [{
                    lima: 'subnet-desktop-shared',
                    interface: 'rd1',
                }];
                if (hostNetwork) {
                    config.networks.push({
                        lima: `subnet-desktop-bridged_${hostNetwork.interface}`,
                        interface: 'rd0',
                    });
                } else {
                    console.log('Could not find any acceptable host networks for bridging.');
                }
            } else if (this.cfg?.experimental.virtualMachine.type === VMType.VZ) {
                console.log('Using vzNAT networking stack');
                config.networks = [{
                    interface: 'vznat',
                    vzNAT: true,
                }];
            } else {
                console.log('Administrator access disallowed, not using socket_vmnet.');
                delete config.networks;
            }
        }

        this.updateConfigPortForwards(config);
        if (currentConfig) {
            // update existing configuration
            const configPath = path.join(paths.lima, MACHINE_NAME, 'lima.yaml');

            await this.progressTracker.action(
                'Updating outdated virtual machine',
                100,
                this.updateBaseDisk(currentConfig),
            );
            await fs.promises.writeFile(configPath, yaml.stringify(config, { lineWidth: 0 }), 'utf-8');
        } else {
            // new configuration
            await fs.promises.mkdir(path.dirname(this.CONFIG_PATH), { recursive: true });
            await fs.promises.writeFile(this.CONFIG_PATH, yaml.stringify(config, { lineWidth: 0 }));
            if (os.platform().startsWith('darwin')) {
                try {
                    await childProcess.spawnFile('tmutil', ['addexclusion', paths.lima]);
                } catch (ex) {
                    console.log('Failed to add exclusion to TimeMachine', ex);
                }
            }
        }
    }

    /**
   * Check if the base (alpine) disk image is out of date; if yes, update it
   * without removing existing data.  This is only ever called from updateConfig
   * to ensure that the passed-in lima configuration is the one before we
   * overwrote it.
   *
   * This will stop the VM if necessary.
   */
    protected async updateBaseDisk(currentConfig: LimaConfiguration) {
        // Lima does not have natively have any support for this; we'll need to
        // reach into the configuration and:
        // 1) Figure out what the old base disk version is.
        // 2) Confirm that it's out of date.
        // 3) Change out the base disk as necessary.
        // Unfortunately, we don't have a version string anywhere _in_ the image, so
        // we will have to rely on the path in lima.yml instead.

        const images = currentConfig.images.map(i => path.basename(i.location));
        // We had a typo in the name of the image; it was "alpline" instead of "alpine".
        // Image version may have a '+rd1' (or '.rd1') suffix after the upstream semver version.
        const versionMatch = images.map(i => /^alpl?ine-lima-v([0-9.]+)(?:[+.]rd(\d+))?-/.exec(i)).find(defined);
        const existingVersion = semver.coerce(versionMatch?.[1]);
        const existingRDVersion = versionMatch?.[2];

        if (!existingVersion) {
            console.log(`Could not find base image version from ${images}; skipping update of base images.`);

            return;
        }

        let versionComparison = semver.coerce(IMAGE_VERSION)?.compare(existingVersion);

        // Compare RD patch versions if upstream semver are matching
        if (versionComparison === 0) {
            const rdVersionMatch = IMAGE_VERSION.match(/[+.]rd(\d+)/);

            if (rdVersionMatch) {
                if (existingRDVersion) {
                    if (parseInt(existingRDVersion) < parseInt(rdVersionMatch[1])) {
                        versionComparison = 1;
                    }
                } else {
                    // If the new image has an RD patch version, but the old one doesn't, then the new version is newer.
                    versionComparison = 1;
                }
            } else if (existingRDVersion) {
                // If the old image has an RD patch version, but the new one doesn't, then the new version is older.
                versionComparison = -1;
            }
        }

        switch (versionComparison) {
            case undefined:
                // Could not parse desired image version
                console.log(`Error parsing desired image version ${IMAGE_VERSION}`);

                return;
            case -1: {
                // existing version is newer
                const message = `
          This subnet Desktop installation appears to be older than the version
          that created your existing Kubernetes cluster.  Please either update
          subnet Desktop or reset Kubernetes and container images.`;

                console.log(`Base disk is ${existingVersion}, newer than ${IMAGE_VERSION} - aborting.`);
                throw new BackendError('subnet Desktop Update Required', message.replace(/\s+/g, ' ').trim());
            }
            case 0:
                // The image is the same version as what we have
                return;
            case 1:
                // Need to update the image.
                break;
            default: {
                // Should never reach this.
                const message = `
        There was an error determining if your existing subnet Desktop cluster
        needs to be updated.  Please reset Kubernetes and container images, or
        file an issue with your subnet Desktop logs attached.`;

                console.log(`Invalid valid comparing ${existingVersion} to desired ${IMAGE_VERSION}: ${JSON.stringify(versionComparison)}`);

                throw new BackendError('Fatal Error', message.replace(/\s+/g, ' ').trim());
            }
        }

        console.log(`Attempting to update base image from ${existingVersion} to ${IMAGE_VERSION}...`);

        if ((await this.status)?.status === 'Running') {
            // This shouldn't be possible (it should only be running if we started it
            // in the same subnet Desktop instance); but just in case, we still stop
            // the VM anyway.
            await this.lima('stop', MACHINE_NAME);
        }

        const diskPath = path.join(paths.lima, MACHINE_NAME, 'basedisk');

        await fs.promises.copyFile(this.baseDiskImage, diskPath);
        // The config file will be updated in updateConfig() instead; no need to do it here.
        console.log(`Base image successfully updated.`);
    }


    /**
 * Get host networking information on a darwin system.
 */
    protected async getDarwinHostNetworks(): Promise<SPNetworkDataType[]> {
        const { stdout } = await childProcess.spawnFile('/usr/sbin/system_profiler',
            ['SPNetworkDataType', '-json', '-detailLevel', 'basic'],
            { stdio: ['ignore', 'pipe', console] });

        return JSON.parse(stdout).SPNetworkDataType;
    }

    protected get baseDiskImage() {
        const imageName = `alpine-lima-v${IMAGE_VERSION}-${ALPINE_EDITION}-${ALPINE_VERSION}.iso`;

        return path.join(paths.resources, os.platform(), imageName);
    }

    #sshPort = 0;
    get sshPort(): Promise<number> {
        return (async () => {
            if (this.#sshPort === 0) {
                if ((await this.status)?.status === 'Running') {
                    // if the machine is already running, we can't change the port.
                    const existingPort = (await this.getLimaConfig())?.ssh.localPort;

                    if (existingPort) {
                        this.#sshPort = existingPort;

                        return existingPort;
                    }
                }

                const server = net.createServer();

                await new Promise((resolve) => {
                    server.once('listening', resolve);
                    server.listen(0, '127.0.0.1');
                });
                this.#sshPort = (server.address() as net.AddressInfo).port;
                server.close();
            }

            return this.#sshPort;
        })();
    }

    protected getMounts(): LimaMount[] {
        const mounts: LimaMount[] = [];
        const locations = ['~', '/tmp/subnet-desktop'];
        const homeDir = `${os.homedir()}/`;
        const extraDirs = [paths.cache, paths.logs, paths.resources];

        if (os.platform() === 'darwin') {
            // /var and /tmp are symlinks to /private/var and /private/tmp
            locations.push('/Volumes', '/var/folders', '/private/tmp', '/private/var/folders');
        }
        for (const extraDir of extraDirs) {
            const found = locations.some((loc) => {
                loc = loc === '~' ? homeDir : path.normalize(loc);

                return !path.relative(loc, path.normalize(extraDir)).startsWith('../');
            });

            if (!found) {
                locations.push(extraDir);
            }
        }

        for (const location of locations) {
            const mount: LimaMount = { location, writable: true };

            if (this.cfg?.experimental.virtualMachine.mount.type === MountType.NINEP) {
                const nineP = this.cfg.experimental.virtualMachine.mount['9p'];

                mount['9p'] = {
                    securityModel: nineP.securityModel,
                    protocolVersion: nineP.protocolVersion,
                    msize: `${nineP.msizeInKib}KiB`,
                    cache: nineP.cacheMode,
                };
            }
            mounts.push(mount);
        }

        return mounts;
    }

    protected updateConfigPortForwards(config: LimaConfiguration) {
        let allPortForwards: Array<Record<string, any>> | undefined = config.portForwards;

        if (!allPortForwards) {
            // This shouldn't happen, but fix it anyway
            config.portForwards = allPortForwards = DEFAULT_CONFIG.portForwards ?? [];
        }
        const hostSocket = path.join(paths.altAppHome, 'docker.sock');
        const dockerPortForwards = allPortForwards?.find(entry => Object.keys(entry).length === 2 &&
            entry.guestSocket === '/var/run/docker.sock' &&
            ('hostSocket' in entry));

        if (!dockerPortForwards) {
            config.portForwards?.push({
                guestSocket: '/var/run/docker.sock',
                hostSocket,
            });
        } else {
            dockerPortForwards.hostSocket = hostSocket;
        }
    }

    protected async getLimaConfig(): Promise<LimaConfiguration | undefined> {
        try {
            const configPath = path.join(paths.lima, MACHINE_NAME, 'lima.yaml');
            const configRaw = await fs.promises.readFile(configPath, 'utf-8');

            return yaml.parse(configRaw) as LimaConfiguration;
        } catch (ex) {
            if ((ex as NodeJS.ErrnoException).code === 'ENOENT') {
                return undefined;
            }
        }
        return undefined;
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

    /**
   * Start the VM.  If the machine is already started, this does nothing.
   * Note that this does not start k3s.
   * @precondition The VM configuration is correct.
   */
    protected async startVM() {
        let allowRoot = this.#adminAccess;

        // We need both the lima config + the lima network config to correctly check if we need sudo
        // access; but if it's denied, we need to regenerate both again to account for the change.
        allowRoot &&= await this.progressTracker.action('Asking for permission to run tasks as administrator', 100, this.installToolsWithSudo());

        if (!allowRoot) {
            // sudo access was denied; re-generate the config.
            await this.progressTracker.action('Regenerating configuration to account for lack of permissions', 100, Promise.all([
                this.updateConfig(false),
                this.installCustomLimaNetworkConfig(false),
            ]));
        }

        await this.progressTracker.action('Starting virtual machine', 100, async () => {
            try {
                await this.lima('start', '--tty=false', await this.isRegistered ? MACHINE_NAME : this.CONFIG_PATH);
            } finally {
                // Symlink the logs (especially if start failed) so the users can find them
                const machineDir = path.join(paths.lima, MACHINE_NAME);

                // Start the process, but ignore the result.
                fs.promises.readdir(machineDir)
                    .then(filenames => filenames.filter(x => x.endsWith('.log'))
                        .forEach(filename => fs.promises.symlink(
                            path.join(path.relative(paths.logs, machineDir), filename),
                            path.join(paths.logs, `lima.${filename}`))
                            .catch(() => { })));
                try {
                    await fs.promises.rm(this.CONFIG_PATH, { force: true });
                } catch (e) {
                    console.debug(`Failed to delete ${this.CONFIG_PATH}: ${e}`);
                }
            }
        });
    }

    /**
 * Run the various commands that require privileged access after prompting the
 * user about the details.
 *
 * @returns Whether privileged access was successful; this will also be true
 *          if no privileged access was required.
 * @note This may request the root password.
 */
    protected async installToolsWithSudo(): Promise<boolean> {
        return true
    }


    async start(config_: BackendSettings): Promise<void> {
        const config = this.cfg = clone(config_);
        let isDowngrade = false;

        await this.setState(State.STARTING);
        this.currentAction = Action.STARTING;
        this.#adminAccess = config_.application.adminAccess ?? true;
        this.#containerEngineClient = undefined;
        await this.progressTracker.action('Starting Backend', 10, async () => {
            try {
                this.ensureArchitectureMatch();
                await Promise.all([
                    this.progressTracker.action('Ensuring virtualization is supported', 50, this.ensureVirtualizationSupported()),
                    this.progressTracker.action('Updating cluster configuration', 50, this.updateConfig(this.#adminAccess)),
                ]);

                if (this.currentAction !== Action.STARTING) {
                    // User aborted before we finished
                    return;
                }

                const vmStatus = await this.status;
                let isVMAlreadyRunning = vmStatus?.status === 'Running';

                // Virtualization Framework only supports RAW disks
                if (vmStatus && config.experimental.virtualMachine.type === VMType.VZ) {
                    const diffdisk = path.join(paths.lima, MACHINE_NAME, 'diffdisk');
                    const { format } = await this.imageInfo(diffdisk);

                    if (format === ImageFormat.QCOW2) {
                        if (isVMAlreadyRunning) {
                            await this.lima('stop', MACHINE_NAME);
                            isVMAlreadyRunning = false;
                        }
                        await this.convertToRaw(diffdisk);
                    }
                }


                // Start the VM; if it's already running, this does nothing.
                await this.startVM();

                if (this.currentAction !== Action.STARTING) {
                    // User aborted before we finished
                    return;
                }

                if ((await this.status)?.status === 'Running') {
                    await this.progressTracker.action('Stopping existing instance', 100, async () => {
                        if (isDowngrade && isVMAlreadyRunning) {
                            // If we're downgrading, stop the VM (and start it again immediately),
                            // to ensure there are no containers running (so we can delete files).
                            await this.lima('stop', MACHINE_NAME);
                            await this.startVM();
                        }
                    });
                }

                if (this.currentAction !== Action.STARTING) {
                    // User aborted before we finished
                    return;
                }
                switch (config.containerEngine.name) {
                    case ContainerEngine.CONTAINERD:
                        await this.startService('containerd');
                        try {
                            await this.execCommand({
                                root: true,
                                expectFailure: true,
                            },
                                'ctr', '--address', '/run/containerd/containerd.sock', 'namespaces', 'create', 'default');
                        } catch {
                            // expecting failure because the namespace may already exist
                        }
                        break;
                    case ContainerEngine.NONE:
                        throw new Error('No container engine is set');
                }

                if (this.currentAction !== Action.STARTING) {
                    // User aborted
                    return;
                }

                switch (config.containerEngine.name) {
                    case ContainerEngine.CONTAINERD:
                        // await this.execCommand({ root: true }, '/sbin/rc-service', '--ifnotstarted', 'buildkitd', 'start');
                        this.#containerEngineClient = new NerdctlClient(this);
                        break;
                }

                await this.#containerEngineClient?.waitForReady();

                await this.progressTracker.action('Installing Subnet', 100, this.installSubnet());
                await this.progressTracker.action("Starting Subnet", 100, this.startService('subnet'))
                await this.progressTracker.action("Update Subnet", 100, this.updateSubnetConfig({provider: {enable: true}}))

                await this.setState(State.DISABLED);
            } catch (err) {
                console.error('Error starting lima:', err);
                await this.setState(State.ERROR);
                if (err instanceof BackendError) {
                    if (!err.fatal) {
                        return;
                    }
                }
                throw err;
            } finally {
                this.currentAction = Action.NONE;
            }
        });


    }

    protected async installSubnet() {
        const subnetPath = path.join(paths.resources, 'linux', 'internal', 'subnet');
        await this.lima('copy', subnetPath, `${MACHINE_NAME}:./subnet`);
        await this.execCommand({ root: true }, 'mv', './subnet', '/usr/local/bin/subnet');
        await this.writeFile("/etc/init.d/subnet",SERVICE_SUBNET, 0o755)
    }

    /**
   * Provide a default network config file with subnet-desktop specific settings.
   *
   * If there's an existing file, replace it if it doesn't contain a
   * paths.varRun setting for subnet-desktop
   */
    protected async installCustomLimaNetworkConfig(allowRoot = true): Promise<LimaNetworkConfiguration> {
        const networkPath = path.join(paths.lima, '_config', 'networks.yaml');

        let config: LimaNetworkConfiguration;

        try {
            config = yaml.parse(await fs.promises.readFile(networkPath, 'utf8'));
            if (config?.paths?.varRun !== NETWORKS_CONFIG.paths.varRun) {
                const backupName = networkPath.replace(/\.yaml$/, '.orig.yaml');

                await fs.promises.rename(networkPath, backupName);
                console.log(`Lima network configuration has unexpected contents; existing file renamed as ${backupName}.`);
                config = clone(NETWORKS_CONFIG);
            }
        } catch (err) {
            if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
                console.log(`Existing networks.yaml file ${networkPath} not yaml-parsable, got error ${err}. It will be replaced.`);
            }
            config = clone(NETWORKS_CONFIG);
        }

        config.paths['socketVMNet'] = '/opt/subnet-desktop/bin/socket_vmnet';

        if (config.group === 'staff') {
            config.group = 'everyone';
        }

        for (const key of Object.keys(config.networks)) {
            if (key.startsWith('subnet-desktop-bridged_')) {
                delete config.networks[key];
            }
        }

        if (allowRoot) {
            for (const hostNetwork of await this.getDarwinHostNetworks()) {
                // Indiscriminately add all host networks, whether they _currently_ have
                // DHCP / IPv4 addresses.
                if (hostNetwork.interface) {
                    config.networks[`subnet-desktop-bridged_${hostNetwork.interface}`] = {
                        mode: 'bridged',
                        interface: hostNetwork.interface,
                    };
                }
            }
            const sudoersPath = config.paths.sudoers;

            // Explanation of this rename at definition of PREVIOUS_LIMA_SUDOERS_LOCATION
            if (!sudoersPath || sudoersPath === PREVIOUS_LIMA_SUDOERS_LOCATION) {
                config.paths.sudoers = LIMA_SUDOERS_LOCATION;
            }
        } else {
            delete config.paths.sudoers;
        }

        await fs.promises.writeFile(networkPath, yaml.stringify(config), { encoding: 'utf-8' });

        return config;
    }

    protected async startService(serviceName: string) {
        await this.progressTracker.action(`Starting ${serviceName}`, 50, async () => {
            await this.execCommand({ root: true }, '/sbin/rc-service', '--ifnotstarted', serviceName, 'start');
        });
    }

    protected async installCACerts(): Promise<void> {
        const certs: (string | Buffer)[] = await new Promise((_resolve) => {
        });

        const workdir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'rd-ca-'));

        try {
            await this.execCommand({ root: true }, '/bin/sh', '-c', 'rm -f /usr/local/share/ca-certificates/rd-*.crt');

            if (certs && certs.length > 0) {
                const writeStream = fs.createWriteStream(path.join(workdir, 'certs.tar'));
                const archive = tar.pack();
                const archiveFinished = util.promisify(stream.finished)(archive);

                archive.pipe(writeStream);

                for (const [index, cert] of certs.entries()) {
                    const curried = archive.entry.bind(archive, {
                        name: `rd-${index}.crt`,
                        mode: 0o600,
                    }, cert);

                    await util.promisify(curried)();
                }
                archive.finalize();
                await archiveFinished;

                await this.lima('copy', path.join(workdir, 'certs.tar'), `${MACHINE_NAME}:/tmp/certs.tar`);
                await this.execCommand({ root: true }, 'tar', 'xf', '/tmp/certs.tar', '-C', '/usr/local/share/ca-certificates/');
            }
        } finally {
            await fs.promises.rm(workdir, { recursive: true, force: true });
        }
        await this.execCommand({ root: true }, 'update-ca-certificates');
    }


    protected async imageInfo(fileName: string): Promise<QEMUImageInfo> {
        try {
            const { stdout } = await this.spawnWithCapture(LimaBackend.qemuImg, { env: LimaBackend.qemuImgEnv },
                'info', '--output=json', '--force-share', fileName);

            return JSON.parse(stdout) as QEMUImageInfo;
        } catch {
            return { format: 'unknown' } as QEMUImageInfo;
        }
    }

    protected async startVm(): Promise<void> {
        await this.progressTracker.action('Starting virtual machine', 100, async () => {
            try {
                await this.lima('start', '--tty=false');
            } finally {

            }
        })

    }

    protected ensureArchitectureMatch() {
        if (os.platform().startsWith('darwin')) {
            // Since we now use native Electron, the only case this might be an issue
            // is the user is running under Rosetta. Flag that.
            console.log('app.runningUnderARM64Translation', app.runningUnderARM64Translation)
            if (app.runningUnderARM64Translation) {
                // Using 'aarch64' and 'x86_64' in the error because that's what we use
                // for the DMG suffix, e.g. "subnet Desktop.aarch64.dmg"
                throw new BackendError('Fatal Error', `subnet Desktop for x86_64 does not work on aarch64.`, true);
            }
        }
    }

    protected async ensureVirtualizationSupported() {
        if (os.platform().startsWith('linux')) {
            const cpuInfo = await fs.promises.readFile('/proc/cpuinfo', 'utf-8');

            if (!/flags.*(vmx|svm)/g.test(cpuInfo)) {
                console.log(`Virtualization support error: got ${cpuInfo}`);
                throw new Error('Virtualization does not appear to be supported on your machine.');
            }
        } else if (os.platform().startsWith('darwin')) {
            const { stdout } = await childProcess.spawnFile(
                'sysctl', ['kern.hv_support'],
                { stdio: ['inherit', 'pipe', console] });

            if (!/:\s*1$/.test(stdout.trim())) {
                console.log(`Virtualization support error: got ${stdout.trim()}`);
                throw new Error('Virtualization does not appear to be supported on your machine.');
            }
        }
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
                    await this.execCommand({ root: true }, '/sbin/rc-service', '--ifstarted', 'subnet', 'stop');
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

    protected static get qemuImgEnv() {
        return { ...process.env, LD_LIBRARY_PATH: path.join(paths.resources, os.platform(), 'lima', 'lib') };
    }

    protected async convertToRaw(fileName: string): Promise<void> {
        const rawFileName = `${fileName}.raw`;

        await this.spawnWithCapture(LimaBackend.qemuImg, { env: LimaBackend.qemuImgEnv },
            'convert', fileName, rawFileName);
        await fs.promises.unlink(fileName);
        await fs.promises.rename(rawFileName, fileName);
    }

    protected get isRegistered(): Promise<boolean> {
        return this.status.then(defined);
    }

    /**
     * Show the dialog box describing why sudo is required.
     *
     * @param explanations Map of why we want sudo, and what files are affected.
     * @return Whether the user wants to allow the prompt.
     */
    protected async showSudoReason(this: Readonly<this> & this, _explanations: Record<string, string[]>): Promise<boolean> {
        if (this.noModalDialogs || !this.cfg?.application.adminAccess) {
            return false;
        }
        // const neverAgain = await openSudoPrompt(explanations);

        // if (neverAgain && this.cfg) {
        //     this.writeSetting({ application: { adminAccess: false } });

        //     return false;
        // }

        return true;
    }

    writeSetting(changed: RecursivePartial<BackendSettings>) {
        this.cfg = merge({}, this.cfg, changed);
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
                        return reject(new Error(`Failed to read ${filePath}: /bin/cat exited with ${code || signal}`));
                    }
                    resolve();
                });
            });

            return Buffer.concat(stdout).toString(encoding);
        } catch (ex: any) {
            console.error(`Failed to read file ${filePath}:`, ex);
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
        const workdir = await fs.promises.mkdtemp(path.join(os.tmpdir(), `rd-${path.basename(filePath)}-`));
        const tempPath = `/tmp/${path.basename(workdir)}.${path.basename(filePath)}`;
        try {
            const scriptPath = path.join(workdir, path.basename(filePath));

            await fs.promises.writeFile(scriptPath, fileContents, 'utf-8');
            await this.lima('copy', scriptPath, `${MACHINE_NAME}:${tempPath}`);
            await this.execCommand('chmod', permissions.toString(8), tempPath);
            await this.execCommand({ root: true }, 'mv', tempPath, filePath);
        } finally {
            await fs.promises.rm(workdir, { recursive: true });
            await this.execCommand({ root: true }, 'rm', '-f', tempPath);
        }
    }

    async copyFileIn(hostPath: string, vmPath: string): Promise<void> {
        // TODO This logic is copied from writeFile() above and should be simplified.
        const workdir = await fs.promises.mkdtemp(path.join(os.tmpdir(), `rd-${path.basename(hostPath)}-`));
        const tempPath = `/tmp/${path.basename(workdir)}.${path.basename(hostPath)}`;

        try {
            await this.lima('copy', hostPath, `${MACHINE_NAME}:${tempPath}`);
            await this.execCommand('chmod', '644', tempPath);
            await this.execCommand({ root: true }, 'mv', tempPath, vmPath);
        } finally {
            await fs.promises.rm(workdir, { recursive: true });
            await this.execCommand({ root: true }, 'rm', '-f', tempPath);
        }
    }

    copyFileOut(vmPath: string, hostPath: string): Promise<void> {
        return this.lima('copy', `${MACHINE_NAME}:${vmPath}`, hostPath);
    }

    /**
     * Read the subnet configuration from /root/.subnet-node/config.yaml
     */
    async getSubnetConfig(): Promise<any> {
        const configPath = '/root/.subnet-node/config.yaml';
        const configContent = await this.readFile(configPath);
        return yaml.parse(configContent);
    }

    /**
     * Update the subnet configuration in /root/.subnet-node/config.yaml
     * @param newConfig The new configuration to be merged and written.
     */
    async updateSubnetConfig(newConfig: any): Promise<void> {
        await updateSubnetConfigUtil(
            this.readFile.bind(this),
            this.writeFile.bind(this),
            this.execCommand.bind(this),
            newConfig
        );
        await this.execCommand({root: true}, '/sbin/rc-service', 'subnet', 'restart');
        const isOnline = await checkStatusUtil();
        console.log(`Subnet service is ${isOnline ? 'online' : 'offline'}`);
    }
}