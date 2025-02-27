import events from 'events'
import {
  Architecture,
  BackendError,
  BackendEvents,
  BackendProgress,
  BackendSettings,
  execOptions,
  FailureDetails,
  RestartReasons,
  State,
  VMBackend,
  VMExecutor
} from './backend'
import * as childProcess from '../utils/childProcess'
import ProgressTracker, { getProgressErrorDescription } from './progressTracker'
import path from 'path'
import stream from 'stream'
import paths from '../utils/paths'
import Logging from '../utils/logging'
import util from 'util'
import fs from 'fs'
import Registry from 'winreg'
import os from 'os'
import DEPENDENCY_VERSIONS from '../assets/dependencies.yaml'
import { defined, RecursivePartial } from '../utils/typeUtils'
import _, { clone } from 'lodash'
import { ContainerEngineClient } from './containerClient/types'
import semver from 'semver'
import SCRIPT_DATA_WSL_CONF from '../assets/scripts/wsl-data.conf?raw'
import WSL_INIT_SCRIPT from '../assets/scripts/wsl-init?raw'
import { ContainerEngine } from '../config/settings'
import { NerdctlClient } from './containerClient/nerdctlClient'
import WSL_EXEC from '../assets/scripts/wsl-exec?raw'
import NERDCTL from '../assets/scripts/nerdctl?raw'
import BackgroundProcess from '../utils/backgroundProcess'
import SERVICE_SUBNET from '../assets/scripts/service-subnet.initd?raw'
import yaml from 'yaml'
import {
  updateSubnetConfig as updateSubnetConfigUtil,
  checkStatus as checkStatusUtil
} from '../utils/subnet'
import { sleep } from '../main/utils/promise'
import { dialog } from 'electron' // Add this import

/** Number of times to retry converting a path between WSL & Windows. */
const WSL_PATH_CONVERT_RETRIES = 10
/**
 * The list of directories that are in the data distribution (persisted across
 * version upgrades).
 */
const DISTRO_DATA_DIRS = ['/var/lib']

/** The version of the WSL distro we expect. */

const DISTRO_VERSION = DEPENDENCY_VERSIONS.WSLDistro
const INSTANCE_NAME = 'subnet-desktop'
const DATA_INSTANCE_NAME = 'subnet-desktop-data'

const console = Logging.wsl

type wslExecOptions = execOptions & {
  /** Output encoding; defaults to utf16le. */
  encoding?: BufferEncoding
  /** The distribution to execute within. */
  distro?: string
}

/**
 * Enumeration for tracking what operation the backend is undergoing.
 */
export enum Action {
  NONE = 'idle',
  STARTING = 'starting',
  STOPPING = 'stopping'
}

export default class WSLBackend extends events.EventEmitter implements VMBackend, VMExecutor {
  progressTracker: ProgressTracker
  progress: BackendProgress = { current: 0, max: 0 }

  readonly executor = this

  #containerEngineClient: ContainerEngineClient | undefined
  get containerEngineClient() {
    if (this.#containerEngineClient) {
      return this.#containerEngineClient
    }

    throw new Error('Invalid state, no container engine client available.')
  }

  /** A transient property that prevents prompting via modal UI elements. */
  #noModalDialogs = false

  get noModalDialogs() {
    return this.#noModalDialogs
  }

  set noModalDialogs(value: boolean) {
    this.#noModalDialogs = value
  }

  /**
   * The current operation underway; used to avoid responding to state changes
   * when we're in the process of doing a different one.
   */
  currentAction: Action = Action.NONE

  /** Whether debug mode is enabled */
  debug = false

  get backend(): 'wsl' {
    return 'wsl'
  }

  /** The current user-visible state of the backend. */
  protected internalState: State = State.STOPPED
  get state() {
    return this.internalState
  }

  /**
   * Reference to the _init_ process in WSL.  All other processes should be
   * children of this one.  Note that this is busybox init, running in a custom
   * mount & pid namespace.
   */
  protected process: childProcess.ChildProcess | null = null

  /** The current config state. */
  protected cfg: BackendSettings | undefined

  /** Indicates whether the current installation is an Admin Install. */
  #isAdminInstall: Promise<boolean> | undefined

  protected get distroFile() {
    return path.join(paths.resources, os.platform(), `distro-${DISTRO_VERSION}.tar`)
  }

  get cpus(): Promise<number> {
    // This doesn't make sense for WSL2, since that's a global configuration.
    return Promise.resolve(0)
  }

  get memory(): Promise<number> {
    // This doesn't make sense for WSL2, since that's a global configuration.
    return Promise.resolve(0)
  }

  hostSwitchProcess: BackgroundProcess

  constructor(_arch: Architecture) {
    super()
    this.progressTracker = new ProgressTracker((progress) => {
      this.progress = progress
      this.emit('progress')
    }, console)

    this.hostSwitchProcess = new BackgroundProcess('host-switch.exe', {
      spawn: async () => {
        const exe = path.join(paths.resources, 'win32', 'internal', 'host-switch.exe')
        const stream = await Logging['host-switch'].fdStream
        const args: string[] = []

        return childProcess.spawn(exe, args, {
          stdio: ['ignore', stream, stream],
          windowsHide: true
        })
      },
      shouldRun: () =>
        Promise.resolve([State.STARTING, State.STARTED, State.DISABLED].includes(this.state))
    })
  }

  protected async setState(state: State) {
    this.internalState = state
    this.emit('state-changed', this.state)
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
   * List the registered WSL2 distributions.
   */
  protected async registeredDistros({ runningOnly = false } = {}): Promise<string[]> {
    const args = ['--list', '--quiet', runningOnly ? '--running' : undefined]
    const distros = (await this.execWSL({ capture: true }, ...args.filter(defined)))
      .split(/\r?\n/g)
      .map((x) => x.trim())
      .filter((x) => x)

    if (distros.length < 1) {
      // Return early if we find no distributions in this list; listing again
      // with verbose will fail if there are no distributions.
      return []
    }

    const stdout = await this.execWSL({ capture: true }, '--list', '--verbose')
    // As wsl.exe may be localized, don't check state here.
    const parser = /^[\s*]+(?<name>.*?)\s+\w+\s+(?<version>\d+)\s*$/

    const result = stdout
      .trim()
      .split(/[\r\n]+/)
      .slice(1) // drop the title row
      .map((line) => line.match(parser))
      .filter(defined)
      .filter((result) => result.groups?.version === '2')
      .map((result) => result.groups?.name)
      .filter(defined)

    return result.filter((x) => distros.includes(x))
  }

  protected async isDistroRegistered({
    distribution = INSTANCE_NAME,
    runningOnly = false
  } = {}): Promise<boolean> {
    const distros = await this.registeredDistros({ runningOnly })

    console.log(`Registered distributions: ${distros}`)

    return distros.includes(distribution || INSTANCE_NAME)
  }

  protected async getDistroVersion(): Promise<string> {
    // ESLint doesn't realize we're doing inline shell scripts.
    // eslint-disable-next-line no-template-curly-in-string
    const script = '[ -e /etc/os-release ] && . /etc/os-release ; echo ${VERSION_ID:-0.1}'

    return (await this.captureCommand('/bin/sh', '-c', script)).trim()
  }

  protected getIsAdminInstall(): Promise<boolean> {
    this.#isAdminInstall ??= new Promise((resolve) => {
      const regKey = new Registry({
        hive: Registry.HKLM,
        key: '\\SOFTWARE\\SUSE\\SubnetDesktop'
      })

      regKey.get('AdminInstall', (err, item) => {
        if (err || !item) {
          console.debug('Failed to get registry value: AdminInstall')
          resolve(false)
        } else {
          resolve(item.value !== null)
        }
      })
    })

    return this.#isAdminInstall
  }

  /**
   * Runs /sbin/init in the Subnet Desktop WSL2 distribution.
   * This manages {this.process}.
   */
  protected async runInit() {
    const logFile = Logging['wsl-init']
    const PID_FILE = '/run/wsl-init.pid'
    const streamReaders: Promise<void>[] = []

    await this.writeFile('/usr/local/bin/wsl-init', WSL_INIT_SCRIPT, 0o755)

    // The process should already be gone by this point, but make sure.
    this.process?.kill('SIGTERM')
    const env: Record<string, string> = {
      ...process.env,
      WSLENV: `${process.env.WSLENV}:DISTRO_DATA_DIRS:LOG_DIR/p:RD_DEBUG`,
      DISTRO_DATA_DIRS: DISTRO_DATA_DIRS.join(':'),
      LOG_DIR: paths.logs
    }

    if (this.debug) {
      env.RD_DEBUG = '1'
    }
    this.process = childProcess.spawn(
      'wsl.exe',
      ['--distribution', INSTANCE_NAME, '--exec', '/usr/local/bin/wsl-init'],
      {
        env,
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true
      }
    )
    for (const readable of [this.process.stdout, this.process.stderr]) {
      if (readable) {
        readable.on('data', (chunk: Buffer | string) => {
          logFile.log(chunk.toString().trimEnd())
        })
        streamReaders.push(stream.promises.finished(readable))
      }
    }
    this.process.on('exit', async (status, signal) => {
      await Promise.allSettled(streamReaders)
      if ([0, null].includes(status) && ['SIGTERM', null].includes(signal)) {
        console.log('/sbin/init exited gracefully.')
        await this.stop()
      } else {
        console.log(`/sbin/init exited with status ${status} signal ${signal}`)
        await this.stop()
        await this.setState(State.ERROR)
      }
    })

    // Wait for the PID file
    const startTime = Date.now()
    const waitTime = 1_000
    const maxWaitTime = 30_000

    while (true) {
      try {
        const stdout = await this.captureCommand({ expectFailure: true }, 'cat', PID_FILE)

        console.debug(`Read wsl-init.pid: ${stdout.trim()}`)
        break
      } catch (e) {
        console.debug(`Error testing for wsl-init.pid: ${e} (will retry)`)
      }
      if (Date.now() - startTime > maxWaitTime) {
        throw new Error(
          `Timed out after waiting for /run/wsl-init.pid: ${maxWaitTime / waitTime} secs`
        )
      }
      await util.promisify(setTimeout)(waitTime)
    }
  }

  /**
   * Write out /etc/hosts in the main distribution, copying the bulk of the
   * contents from the data distribution.
   */
  protected async writeHostsFile(_config: BackendSettings) {
    const virtualNetworkStaticAddr = '192.168.127.254'
    const virtualNetworkGatewayAddr = '192.168.127.1'

    await this.progressTracker.action('Updating /etc/hosts', 50, async () => {
      const contents = await fs.promises.readFile(
        `\\\\wsl$\\${DATA_INSTANCE_NAME}\\etc\\hosts`,
        'utf-8'
      )
      const lines = contents
        .split(/\r?\n/g)
        .filter((line) => !line.includes('host.docker.internal'))
      const hosts = ['host.subnet-desktop.internal', 'host.docker.internal']
      const extra = [
        '# BEGIN Subnet Desktop configuration.',
        `${virtualNetworkStaticAddr} ${hosts.join(' ')}`,
        `${virtualNetworkGatewayAddr} gateway.subnet-desktop.internal`,
        '# END Subnet Desktop configuration.'
      ]
        .map((l) => `${l}\n`)
        .join('')

      await fs.promises.writeFile(
        `\\\\wsl$\\${INSTANCE_NAME}\\etc\\hosts`,
        lines.join('\n') + extra,
        'utf-8'
      )
    })
  }

  protected async writeWSLConf() {
    const wslConfContent = `
[automount]
mountFsTab = false
ldconfig = false
options = metadata
[network]
generateHosts = true
generateResolvConf = true
[wsl2]
networkingMode=mirrored
`
    await this.writeFile('/etc/wsl.conf', wslConfContent, 0o755)
  }

  /**
   * Install WSL 2 on the system if not already installed.
   */
  protected async installWSL2() {
    const wslConfigPath = path.join(os.homedir(), '.wslconfig');
    try {
      await fs.promises.access(wslConfigPath);
      console.log('.wslconfig file already exists. Skipping WSL installation.');
      return;
    } catch {
      console.log('.wslconfig file does not exist. Proceeding with WSL installation.');
    }

    await this.progressTracker.action('Checking WSL installation', 10, async () => {
      // Enable Windows Subsystem for Linux with admin privileges
      await this.progressTracker.action('Enabling Windows Subsystem for Linux', 20, async () => {
        await new Promise<void>((resolve, reject) => {
          const command = `powershell.exe -Command "Start-Process powershell.exe -ArgumentList \\"dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart; dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart; Set-NetFirewallHyperVVMSetting -Name '{40E0AC32-46A5-438A-A0B2-2B479E8F2E90}' -DefaultInboundAction Allow\\" -Verb RunAs"`
          childProcess.exec(command, (error, stdout, stderr) => {
            if (error) {
              reject(stderr)
              console.error(`Error: ${error.message}`);
              return;
            }
            if (stderr) {
              reject(stderr)
              console.error(`Stderr: ${stderr}`);
              return;
            }
            console.log(`Output: ${stdout}`);
            resolve();
          });
        })
      })

      // Update WSL if available but not installed
      await this.progressTracker.action('Installing WSL', 50, async () => {
        await this.execWSL("--install")
        await this.execWSL("--set-default-version", "2")
        await this.execWSL('--update');
      })
    })
  }

  /**
   * Configure WSL and set firewall settings before installation.
   */
  protected async configureWSL() {
    await this.progressTracker.action('Configuring WSL', 50, async () => {
      try {
        await this.installWSL2() // Call the new method here

        const wslConfigContent = `
  [wsl2]
  networkingMode=mirrored
  `
        const wslConfigPath = path.join(os.homedir(), '.wslconfig')
        await fs.promises.writeFile(wslConfigPath, wslConfigContent, 'utf-8')
  
  
        // Shut down WSL to apply the configuration
        await this.execWSL('--shutdown');  
      } catch (err) {
        dialog.showMessageBoxSync({
          type: 'info',
          buttons: ['OK'],
          title: 'Restart Required',
          message: 'An error occurred during the WSL configuration. Please restart your computer to complete the WSL installation.'
        });
        throw new Error('WSL configuration failed. Restart required.');
      }
    })
  }

  async start(config_: BackendSettings): Promise<void> {
    await this.configureWSL() // Call the new method here
    const config = (this.cfg = _.defaultsDeep(clone(config_), {
      containerEngine: { name: ContainerEngine.CONTAINERD }
    }))
    await this.setState(State.STARTING)
    this.currentAction = Action.STARTING
    this.#containerEngineClient = undefined
    await this.progressTracker.action('Initializing Subnet Desktop', 10, async () => {
      try {
        const prepActions = [
          (async () => {
            await this.ensureDistroRegistered()
            await this.upgradeDistroAsNeeded()
            await this.writeHostsFile(config)
            await this.writeWSLConf() // Call the new method here
          })()
        ]

        await this.progressTracker.action('Preparing to start', 0, Promise.all(prepActions))

        if (this.currentAction !== Action.STARTING) {
          // User aborted before we finished
          return
        }

        // If we were previously running, stop it now.
        await this.progressTracker.action('Stopping existing instance', 100, async () => {
          this.process?.kill('SIGTERM')
          await this.killStaleProcesses()
        })

        const distroLock = await this.progressTracker.action(
          'Mounting WSL data',
          100,
          this.mountData()
        )

        try {
          await this.progressTracker.action(
            'Installing container engine',
            0,
            Promise.all([
              this.progressTracker.action('Starting WSL environment', 100, async () => {
                const rdNetworkingDNS = 'gateway.subnet-desktop.internal'
                await Promise.all([
                  this.progressTracker.action('DNS configuration', 50, () => {
                    return new Promise<void>((resolve) => {
                      console.debug(
                        `setting DNS server to ${rdNetworkingDNS} for subnet desktop networking`
                      )
                      try {
                        this.hostSwitchProcess.start()
                      } catch (error) {
                        console.error(
                          'Failed to run subnet desktop networking host-switch.exe process:',
                          error
                        )
                      }
                      resolve()
                    })
                  }),
                  this.progressTracker.action('container engine components', 50, async () => {
                    await this.writeConf('containerd', { log_owner: 'root' })
                    await this.writeFile('/usr/local/bin/nerdctl', NERDCTL, 0o755)
                  }),
                  // Remove any residual rc artifacts from previous version
                  await this.execCommand(
                    { root: true },
                    'rm',
                    '-f',
                    '/etc/init.d/vtunnel-peer',
                    '/etc/runlevels/default/vtunnel-peer'
                  ),
                  await this.execCommand(
                    { root: true },
                    'rm',
                    '-f',
                    '/etc/init.d/host-resolver',
                    '/etc/runlevels/default/host-resolver'
                  ),
                  await this.execCommand(
                    { root: true },
                    'rm',
                    '-f',
                    '/etc/init.d/dnsmasq-generate',
                    '/etc/runlevels/default/dnsmasq-generate'
                  ),
                  await this.execCommand(
                    { root: true },
                    'rm',
                    '-f',
                    '/etc/init.d/dnsmasq',
                    '/etc/runlevels/default/dnsmasq'
                  )
                ])

                await this.writeFile('/usr/local/bin/wsl-exec', WSL_EXEC, 0o755)
                await this.runInit()
              })
            ])
          )
        } catch (e) {
          globalThis.console.error(e)
        } finally {
          distroLock.kill('SIGTERM')
        }

        await this.progressTracker.action(
          'Running provisioning scripts',
          100,
          this.runProvisioningScripts()
        )
        await this.progressTracker.action(
          'Starting container engine',
          0,

          this.execCommand('/sbin/rc-service', 'containerd', 'start')
        )
        switch (config.containerEngine.name) {
          case ContainerEngine.CONTAINERD:
            try {
              await this.execCommand(
                {
                  root: true,
                  expectFailure: true
                },
                'ctr',
                '--address',
                '/run/containerd/containerd.sock',
                'namespaces',
                'create',
                'default'
              )
            } catch {
              // expecting failure because the namespace may already exist
            }
            this.#containerEngineClient = new NerdctlClient(this)
            break
        }
        // Do not await on this, as we don't want to wait until the proxy exits.
        //this.runWslProxy().catch(console.error)
        await this.progressTracker.action(
          'Waiting for container engine to be ready',
          0,
          this.containerEngineClient.waitForReady()
        )
        await this.progressTracker.action('Installing Subnet', 100, this.installSubnet())
        await this.progressTracker.action(
          'Starting Subnet',
          100,
          this.execCommand('/sbin/rc-service', 'subnet', 'start')
        )

        

        const subnetConfig = await this.getSubnetConfig()
        if (!subnetConfig.provider.enable) {
          await sleep(5000)
          await this.progressTracker.action(
            'Update Subnet Configuration',
            100,
            this.updateSubnetConfig({ provider: { enable: true } })
          )
        }
        const isOnline = await checkStatusUtil()
        console.log(`Subnet service is ${isOnline ? 'online' : 'offline'}`)
        await this.setState(State.STARTED)
      } catch (ex) {
        await this.setState(State.ERROR)
        throw ex
      } finally {
        this.currentAction = Action.NONE
      }
    })
  }

  protected async installSubnet() {
    await this.writeFile('/etc/init.d/subnet', SERVICE_SUBNET, 0o755)
  }

  /**
   * Run provisioning scripts; this is done after init is started.
   */
  protected async runProvisioningScripts() {
    const provisioningPath = path.join(paths.config, 'provisioning')

    await fs.promises.mkdir(provisioningPath, { recursive: true })
    await Promise.all([
      (async () => {
        // Write out the readme file.
        const ReadmePath = path.join(provisioningPath, 'README')

        try {
          await fs.promises.access(ReadmePath, fs.constants.F_OK)
        } catch {
          const contents = `${`
            Any files named '*.start' in this directory will be executed
            sequentially on Subnet Desktop startup, before the main services.
            Files are processed in lexical order, and startup will be delayed
            until they have all run to completion. Similarly, any files named
            '*.stop' will be executed on shutdown, after the main services have
            exited, and delay shutdown until they have run to completion.
            Note that the script file names may not include whitespace.
            `
            .replace(/\s*\n\s*/g, '\n')
            .trim()}\n`

          await fs.promises.writeFile(ReadmePath, contents, { encoding: 'utf-8' })
        }
      })(),
      (async () => {
        const linuxPath = await this.wslify(provisioningPath)

        // Stop the service if it's already running for some reason.
        // This should never be the case (because we tore down init).
        await this.stopService('local')

        // Clobber /etc/local.d and replace it with a symlink to our desired
        // path.  This is needed as /etc/init.d/local does not support
        // overriding the script directory.
        await this.execCommand('rm', '-r', '-f', '/etc/local.d')
        await this.execCommand('ln', '-s', '-f', '-T', linuxPath, '/etc/local.d')

        // Ensure all scripts are executable; Windows mounts are unlikely to
        // have it set by default.
        await this.execCommand(
          '/usr/bin/find',
          '/etc/local.d/',
          '(',
          '-name',
          '*.start',
          '-o',
          '-name',
          '*.stop',
          ')',
          '-print',
          '-exec',
          'chmod',
          'a+x',
          '{}',
          ';'
        )

        // Run the script.
        await this.startService('local')
      })()
    ])
  }

  async stop(): Promise<void> {
    // When we manually call stop, the subprocess will terminate, which will
    // cause stop to get called again.  Prevent the reentrancy.
    // If we're in the middle of starting, also ignore the call to stop (from
    // the process terminating), as we do not want to shut down the VM in that
    // case.
    if (this.currentAction !== Action.NONE) {
      return
    }
    this.currentAction = Action.STOPPING
    try {
      await this.setState(State.STOPPING)
      this.#containerEngineClient = undefined

      await this.progressTracker.action('Shutting Down...', 10, async () => {
        if (await this.isDistroRegistered({ runningOnly: true })) {
          try {
            await this.execCommand('/sbin/rc-service', 'containerd', 'stop')
            await this.execCommand('/sbin/rc-service', 'subnet', 'stop')
            await this.stopService('local')
          } catch (ex) {
            // Do not allow errors here to prevent us from stopping.
            console.error('Failed to run user provisioning scripts on stopping:', ex)
          }
        }
        const initProcess = this.process

        this.process = null
        if (initProcess) {
          initProcess.kill('SIGTERM')
          try {
            await this.execCommand(
              { expectFailure: true },
              '/usr/bin/killall',
              '/usr/local/bin/network-setup'
            )
          } catch (ex) {
            // `killall` returns failure if it fails to kill (e.g. if the
            // process does not exist); `-q` only suppresses printing any error
            // messages.
            console.error('Ignoring error shutting down network-setup:', ex)
          }
        }
        await this.hostSwitchProcess.stop()
        if (await this.isDistroRegistered({ runningOnly: true })) {
          await this.execWSL('--terminate', INSTANCE_NAME)
        }
      })
      await this.setState(State.STOPPED)
    } catch (ex) {
      await this.setState(State.ERROR)
      throw ex
    } finally {
      this.currentAction = Action.NONE
    }
  }

  /**
   * Write a configuration file for an OpenRC service.
   * @param service The name of the OpenRC service to configure.
   * @param settings A mapping of configuration values.  This should be shell escaped.
   */
  protected async writeConf(service: string, settings: Record<string, string>) {
    const contents = Object.entries(settings)
      .map(([key, value]) => `${key}="${value}"\n`)
      .join('')

    await this.writeFile(`/etc/conf.d/${service}`, contents)
  }

  /**
   * Read the configuration file for an OpenRC service.
   * @param service The name of the OpenRC service to read.
   */
  protected async readConf(service: string): Promise<Record<string, string>> {
    // Matches a k/v-pair and groups it into separated key and value, e.g.:
    // ["key1:"value1"", "key1", ""value1""]
    const confRegex =
      /(?:^|^)\s*?([\w]+)(?:\s*=\s*?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*(?:[\w.-])*|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/
    const conf = await this.readFile(`/etc/conf.d/${service}`)

    const confFields = conf
      .split(/\r?\n/) // Splits config in array of k/v-pairs (["key1:"value1"", "key2:"value2""])
      // Maps the array into [["key1:"value1"", "key1", ""value1""], ["key2:"value2"", "key2", ""value2""]]
      .map((line) => confRegex.exec(line))
      .filter(defined) as Array<RegExpExecArray>

    return confFields.reduce(
      (res, curr) => {
        const key = curr[1]
        const value = curr[2].replace(/^(['"])([\s\S]*)\1$/gm, '$2') // Removes redundant quotes from value

        return { ...res, ...{ [key]: value } }
      },
      {} as Record<string, string>
    )
  }

  /**
   * Updates a service config with the given settings.
   * @param service The name of the OpenRC service to configure.
   * @param settings A mapping of configuration values.
   */
  protected async modifyConf(service: string, settings: Record<string, string>) {
    const current = await this.readConf(service)
    const contents = { ...current, ...settings }

    await this.writeConf(service, contents)
  }

  /**
   * Execute a command on a given OpenRC service.
   *
   * @param service The name of the OpenRC service to execute.
   * @param action The name of the OpenRC service action to execute.
   * @param argument Argument to pass to `wsl-service` (`--ifnotstart`, `--ifstarted`)
   */
  async execService(service: string, action: string, argument = '') {
    await this.execCommand('/usr/local/bin/wsl-service', argument, service, action)
  }

  /**
   * Start the given OpenRC service.  This should only happen after
   * provisioning, to ensure that provisioning can modify any configuration.
   *
   * @param service The name of the OpenRC service to execute.
   */
  async startService(service: string) {
    await this.execCommand('/sbin/rc-update', '--update')
    await this.execService(service, 'start', '--ifnotstarted')
  }

  /**
   * Stop the given OpenRC service.
   *
   * @param service The name of the OpenRC service to stop.
   */
  async stopService(service: string) {
    await this.execService(service, 'stop', '--ifstarted')
  }

  /**
   * Verify that the given command runs successfully
   * @param command
   */
  async verifyReady(...command: string[]) {
    const startTime = Date.now()
    const maxWaitTime = 60_000
    const waitTime = 500

    while (true) {
      const currentTime = Date.now()

      if (currentTime - startTime > maxWaitTime) {
        console.log(
          `Waited more than ${maxWaitTime / 1000} secs for ${command.join(' ')} to succeed. Giving up.`
        )
        break
      }
      try {
        await this.execCommand({ expectFailure: true }, ...command)
        break
      } catch (err) {
        console.debug(`Command ${command} failed: `, err)
      }
      await util.promisify(setTimeout)(waitTime)
    }
  }

  /**
   * execWSL runs wsl.exe with the given arguments, redirecting all output to
   * the log files.
   */
  protected async execWSL(...args: string[]): Promise<void>
  protected async execWSL(options: wslExecOptions, ...args: string[]): Promise<void>
  protected async execWSL(
    options: wslExecOptions & { capture: true },
    ...args: string[]
  ): Promise<string>
  protected async execWSL(
    optionsOrArg: wslExecOptions | string,
    ...args: string[]
  ): Promise<void | string> {
    let options: wslExecOptions & { capture?: boolean } = {}

    if (typeof optionsOrArg === 'string') {
      args = [optionsOrArg].concat(...args)
    } else {
      options = optionsOrArg
    }
    try {
      let stream = options.logStream

      if (!stream) {
        const logFile = Logging['wsl-exec']

        // Write a duplicate log line so we can line up the log files.
        logFile.log(`Running: wsl.exe ${args.join(' ')}`)
        stream = await logFile.fdStream
      }

      // We need two separate calls so TypeScript can resolve the return values.
      if (options.capture) {
        console.debug(`Capturing output: wsl.exe ${args.join(' ')}`)
        const { stdout } = await childProcess.spawnFile('wsl.exe', args, {
          ...options,
          encoding: options.encoding ?? 'utf16le',
          stdio: ['ignore', 'pipe', stream]
        })

        return stdout
      }
      console.debug(`Running: wsl.exe ${args.join(' ')}`)
      await childProcess.spawnFile('wsl.exe', args, {
        ...options,
        encoding: options.encoding ?? 'utf16le',
        stdio: ['ignore', stream, stream]
      })
    } catch (ex) {
      if (!options.expectFailure) {
        console.log(`WSL failed to execute wsl.exe ${args.join(' ')}: ${ex}`)
      }
      throw ex
    }
  }

  /**
   * Mount the data distribution over.
   *
   * @returns a process that ensures the mount points stay alive by preventing
   * the distribution from being terminated due to being idle.  It should be
   * killed once things are up.
   */
  protected async mountData(): Promise<childProcess.ChildProcess> {
    const mountRoot = '/mnt/wsl/subnet-desktop/run/data'

    await this.execCommand('mkdir', '-p', mountRoot)
    // Only bind mount the root if it doesn't exist; because this is in the
    // shared mount (/mnt/wsl/), it can persist even if all of our distribution
    // instances terminate, as long as the WSL VM is still running.  Once that
    // happens, it is no longer possible to unmount the bind mount...
    // However, there's an exception: the underlying device could have gone
    // missing (!); if that happens, we _can_ unmount it.
    const mountInfo = await this.execWSL(
      { capture: true, encoding: 'utf-8' },
      '--distribution',
      DATA_INSTANCE_NAME,
      '--exec',
      'busybox',
      'cat',
      '/proc/self/mountinfo'
    )
    // https://www.kernel.org/doc/html/latest/filesystems/proc.html#proc-pid-mountinfo-information-about-mounts
    // We want fields 5 "mount point" and 10 "mount source".
    const matchRegex = new RegExp(
      String.raw`
      (?<mountID>\S+)
      (?<parentID>\S+)
      (?<majorMinor>\S+)
      (?<root>\S+)
      (?<mountPoint>\S+)
      (?<mountOptions>\S+)
      (?<optionalFields>.*?)
      -
      (?<fsType>\S+)
      (?<mountSource>\S+)
      (?<superOptions>\S+)
    `
        .trim()
        .replace(/\s+/g, String.raw`\s+`)
    )
    const mountFields = mountInfo
      .split(/\r?\n/)
      .map((line) => matchRegex.exec(line))
      .filter(defined)
    let hasValidMount = false

    for (const mountLine of mountFields) {
      const { mountPoint, mountSource: device } = mountLine.groups ?? {}

      if (mountPoint !== mountRoot || !device) {
        continue
      }
      // Some times we can have the mount but the disk is missing.
      // In that case we need to umount it, and the re-mount.
      try {
        await this.execWSL(
          { expectFailure: true },
          '--distribution',
          DATA_INSTANCE_NAME,
          '--exec',
          'busybox',
          'test',
          '-e',
          device
        )
        console.debug(`Found a valid mount with ${device}: ${mountLine.input}`)
        hasValidMount = true
      } catch (ex) {
        // Busybox returned error, the devices doesn't exist.  Unmount.
        console.log(`Unmounting missing device ${device}: ${mountLine.input}`)
        await this.execWSL(
          '--distribution',
          DATA_INSTANCE_NAME,
          '--exec',
          'busybox',
          'umount',
          mountRoot
        )
      }
    }

    if (!hasValidMount) {
      console.log(`Did not find a valid mount, mounting ${mountRoot}`)
      await this.execWSL('--distribution', DATA_INSTANCE_NAME, 'mount', '--bind', '/', mountRoot)
    }
    await Promise.all(
      DISTRO_DATA_DIRS.map(async (dir) => {
        await this.execCommand('mkdir', '-p', dir)
        await this.execCommand(
          'mount',
          '-o',
          'bind',
          `${mountRoot}/${dir.replace(/^\/+/, '')}`,
          dir
        )
      })
    )

    return childProcess.spawn('wsl.exe', ['--distribution', INSTANCE_NAME, '--exec', 'sh'], {
      windowsHide: true
    })
  }

  protected async killStaleProcesses() {
    // Attempting to terminate a terminated distribution is a no-op.
    await Promise.all([
      this.execWSL('--terminate', INSTANCE_NAME),
      this.execWSL('--terminate', DATA_INSTANCE_NAME),
      this.hostSwitchProcess.stop()
    ])
  }

  /**
   * Copy a file from Windows to the WSL distribution.
   */
  protected async wslInstall(
    windowsPath: string,
    targetDirectory: string,
    targetBasename: string = ''
  ): Promise<void> {
    const wslSourcePath = await this.wslify(windowsPath)
    const basename = path.basename(windowsPath)
    // Don't use `path.join` or the backslashes will come back.
    const targetFile = `${targetDirectory}/${targetBasename || basename}`

    console.log(`Installing ${windowsPath} as ${wslSourcePath} into ${targetFile} ...`)
    try {
      const stdout = await this.captureCommand('cp', wslSourcePath, targetFile)

      if (stdout) {
        console.log(`cp ${windowsPath} as ${wslSourcePath} to ${targetFile}: ${stdout}`)
      }
    } catch (err) {
      console.log(`Error trying to cp ${windowsPath} as ${wslSourcePath} to ${targetFile}: ${err}`)
      throw err
    }
  }

  async execCommand(...command: string[]): Promise<void>
  async execCommand(options: wslExecOptions, ...command: string[]): Promise<void>
  async execCommand(
    options: wslExecOptions & { capture: true },
    ...command: string[]
  ): Promise<string>
  async execCommand(
    optionsOrArg: wslExecOptions | string,
    ...command: string[]
  ): Promise<void | string> {
    let options: wslExecOptions = {}
    const cwdOptions: string[] = []

    if (typeof optionsOrArg === 'string') {
      command = [optionsOrArg].concat(command)
    } else {
      options = optionsOrArg
    }

    if (options.cwd) {
      cwdOptions.push('--cd', options.cwd.toString())
      delete options.cwd
    }

    const expectFailure = options.expectFailure ?? false

    try {
      // Print a slightly different message if execution fails.
      return await this.execWSL(
        {
          encoding: 'utf-8',
          ...options,
          expectFailure: true
        },
        '--distribution',
        options.distro ?? INSTANCE_NAME,
        ...cwdOptions,
        '--exec',
        ...command
      )
    } catch (ex) {
      if (!expectFailure) {
        console.log(`WSL: executing: ${command.join(' ')}: ${ex}`)
      }
      throw ex
    }
  }

  spawn(...command: string[]): childProcess.ChildProcess
  spawn(options: execOptions, ...command: string[]): childProcess.ChildProcess
  spawn(optionsOrCommand: execOptions | string, ...command: string[]): childProcess.ChildProcess {
    const args = ['--distribution', INSTANCE_NAME, '--exec', '/usr/local/bin/wsl-exec']

    if (typeof optionsOrCommand === 'string') {
      args.push(optionsOrCommand)
    } else {
      throw new TypeError('Not supported yet')
    }
    args.push(...command)

    return childProcess.spawn('wsl.exe', args)
  }

  /**
   * captureCommand runs the given command in the K3s WSL environment and returns
   * the standard output.
   * @param command The command to execute.
   * @returns The output of the command.
   */
  protected async captureCommand(...command: string[]): Promise<string>
  protected async captureCommand(options: wslExecOptions, ...command: string[]): Promise<string>
  protected async captureCommand(
    optionsOrArg: wslExecOptions | string,
    ...command: string[]
  ): Promise<string> {
    let result: string
    let debugArg: string

    if (typeof optionsOrArg === 'string') {
      result = await this.execCommand({ capture: true }, optionsOrArg, ...command)
      debugArg = optionsOrArg
    } else {
      result = await this.execCommand({ ...optionsOrArg, capture: true }, ...command)
      debugArg = JSON.stringify(optionsOrArg)
    }
    console.debug(
      `captureCommand:\ncommand: (${debugArg} ${command.map((s) => `'${s}'`).join(' ')})\noutput: <${result}>`
    )

    return result
  }

  /** Get the IPv4 address of the VM, assuming it's already up. */
  get ipAddress(): Promise<string | undefined> {
    return (async () => {
      // When using mirrored-mode networking, 127.0.0.1 works just fine
      // ...also, there may not even be an `eth0` to find the IP of!
      try {
        const networkModeString = await this.captureCommand('wslinfo', '-n', 'v')

        if (networkModeString === 'mirrored') {
          return '127.0.0.1'
        }
      } catch {
        // wslinfo is missing (wsl < 2.0.4) - fall back to old behavior
      }

      // We need to locate the _local_ route (netmask) for eth0, and then
      // look it up in /proc/net/fib_trie to find the local address.
      const routesString = await this.captureCommand('cat', '/proc/net/route')
      const routes = routesString.split(/\r?\n/).map((line) => line.split(/\s+/))
      const route = routes.find((route) => route[0] === 'eth0' && route[1] !== '00000000')

      if (!route) {
        return undefined
      }
      const net = Array.from(route[1].matchAll(/../g))
        .reverse()
        .map((n) => parseInt(n.toString(), 16))
        .join('.')
      const trie = await this.captureCommand('cat', '/proc/net/fib_trie')
      const lines = _.takeWhile(trie.split(/\r?\n/).slice(1), (line) => /^\s/.test(line))
      const iface = _.dropWhile(lines, (line) => !line.includes(`${net}/`))
      const addr = iface.find((_, i, array) => array[i + 1]?.includes('/32 host LOCAL'))

      return addr?.split(/\s+/).pop()
    })()
  }

  /**
   * Runs wsl-proxy process in the default namespace. This is to proxy
   * other distro's traffic from default namespace into the network namespace.
   */

  protected async runWslProxy() {
    const debug = this.debug ? 'true' : 'false'

    try {
      await this.execCommand('/usr/local/bin/wsl-proxy', '-debug', debug)
    } catch (err: any) {
      console.log('Error trying to start wsl-proxy in default namespace:', err)
    }
  }

  async getBackendInvalidReason(): Promise<BackendError | null> {
    // Check if wsl.exe is available
    try {
      await this.isDistroRegistered()
    } catch (ex: any) {
      const stdout = String(ex.stdout || '')
      const isWSLMissing = (ex as NodeJS.ErrnoException).code === 'ENOENT'
      const isInvalidUsageError = stdout.includes('Usage: ') && !stdout.includes('--exec')

      if (isWSLMissing || isInvalidUsageError) {
        console.log('Error launching WSL: it does not appear to be installed.')
        const message = `
              Windows Subsystem for Linux does not appear to be installed.
    
              Please install it manually:
    
              https://docs.microsoft.com/en-us/windows/wsl/install
            `
          .replace(/[ \t]{2,}/g, '')
          .trim()

        return new BackendError('Error: WSL Not Installed', message, true)
      }
      throw ex
    }

    return null
  }

  /**
   * Check the WSL distribution version is acceptable; upgrade the distro
   * version if it is too old.
   * @precondition The distribution is already registered.
   */
  protected async upgradeDistroAsNeeded() {
    let existingVersion = await this.getDistroVersion()

    if (!semver.valid(existingVersion, true)) {
      existingVersion += '.0'
    }
    let desiredVersion = DISTRO_VERSION

    if (!semver.valid(desiredVersion, true)) {
      desiredVersion += '.0'
    }
    if (semver.lt(existingVersion, desiredVersion, true)) {
      // Make sure we copy the data over before we delete the old distro
      await this.progressTracker.action('Upgrading WSL distribution', 100, async () => {
        await this.initDataDistribution()
        await this.execWSL('--unregister', INSTANCE_NAME)
        await this.ensureDistroRegistered()
      })
    }
  }

  /**
   * Ensure that the distribution has been installed into WSL2.
   * Any upgrades to the distribution should be done immediately after this.
   */
  protected async ensureDistroRegistered(): Promise<void> {
    if (!(await this.isDistroRegistered())) {
      await this.progressTracker.action('Registering WSL distribution', 100, async () => {
        await fs.promises.mkdir(paths.wslDistro, { recursive: true })
        try {
          await this.execWSL(
            { capture: true },
            '--import',
            INSTANCE_NAME,
            paths.wslDistro,
            this.distroFile,
            '--version',
            '2'
          )
        } catch (ex: any) {
          if (!String(ex.stdout ?? '').includes('ensure virtualization is enabled')) {
            throw ex
          }
          throw new BackendError('Virtualization not supported', ex.stdout, true)
        }
      })
    }

    if (!(await this.isDistroRegistered())) {
      throw new Error(`Error registering WSL2 distribution`)
    }

    await this.initDataDistribution()
  }

  /**
   * If the WSL distribution we use to hold the data doesn't exist, create it
   * and copy the skeleton over from the active one.
   */
  protected async initDataDistribution() {
    const workdir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'rd-distro-'))

    try {
      if (!(await this.isDistroRegistered({ distribution: DATA_INSTANCE_NAME }))) {
        await this.progressTracker.action('Initializing WSL data', 100, async () => {
          try {
            // Create a distro archive from the main distro.
            // WSL seems to require a working /bin/sh for initialization.
            const OVERRIDE_FILES = { 'etc/wsl.conf': SCRIPT_DATA_WSL_CONF }
            const REQUIRED_FILES = [
              '/bin/busybox', // Base tools
              '/bin/mount', // Required for WSL startup
              '/bin/sh', // WSL requires a working shell to initialize
              '/lib', // Dependencies for busybox
              '/etc/passwd' // So WSL can spawn programs as a user
            ]
            const archivePath = path.join(workdir, 'distro.tar')

            console.log('Creating initial data distribution...')
            // Make sure all the extra data directories exist
            await Promise.all(
              DISTRO_DATA_DIRS.map((dir) => {
                return this.execCommand('/bin/busybox', 'mkdir', '-p', dir)
              })
            )
            // Figure out what required files actually exist in the distro; they
            // may not exist on various versions.
            const extraFiles = (
              await Promise.all(
                REQUIRED_FILES.map(async (path) => {
                  try {
                    await this.execCommand({ expectFailure: true }, 'busybox', '[', '-e', path, ']')

                    return path
                  } catch (ex) {
                    // Exception expected - the path doesn't exist
                    return undefined
                  }
                })
              )
            ).filter(defined)

            await this.execCommand(
              'tar',
              '-cf',
              await this.wslify(archivePath),
              '-C',
              '/',
              ...extraFiles,
              ...DISTRO_DATA_DIRS
            )

            // The tar-stream package doesn't handle appends well (needs to
            // stream to a temporary file), and busybox tar doesn't support
            // append either.  Luckily Windows ships with a bsdtar that
            // supports it, though it only supports short options.
            for (const [relPath, contents] of Object.entries(OVERRIDE_FILES)) {
              const absPath = path.join(workdir, 'tar', relPath)

              await fs.promises.mkdir(path.dirname(absPath), { recursive: true })
              await fs.promises.writeFile(absPath, contents)
            }
            // msys comes with its own "tar.exe"; ensure we use the version
            // shipped with Windows.
            const tarExe = path.join(process.env.SystemRoot ?? '', 'system32', 'tar.exe')

            await childProcess.spawnFile(
              tarExe,
              [
                '-r',
                '-f',
                archivePath,
                '-C',
                path.join(workdir, 'tar'),
                ...Object.keys(OVERRIDE_FILES)
              ],
              { stdio: 'pipe' }
            )
            await this.execCommand('tar', '-tvf', await this.wslify(archivePath))
            await this.execWSL(
              '--import',
              DATA_INSTANCE_NAME,
              paths.wslDistroData,
              archivePath,
              '--version',
              '2'
            )
          } catch (ex) {
            console.log(`Error registering data distribution: ${ex}`)
            await this.execWSL('--unregister', DATA_INSTANCE_NAME)
            throw ex
          }
        })
      } else {
        console.log('data distro already registered')
      }

      await this.progressTracker.action('Updating WSL data', 100, async () => {
        // We may have extra directories (due to upgrades); copy any new ones over.
        const missingDirs: string[] = []

        await Promise.all(
          DISTRO_DATA_DIRS.map(async (dir) => {
            try {
              await this.execWSL(
                { expectFailure: true, encoding: 'utf-8' },
                '--distribution',
                DATA_INSTANCE_NAME,
                '--exec',
                '/bin/busybox',
                '[',
                '!',
                '-d',
                dir,
                ']'
              )
              missingDirs.push(dir)
            } catch (ex) {
              // Directory exists.
            }
          })
        )
        if (missingDirs.length > 0) {
          // Copy the new directories into the data distribution.
          // Note that we're not using compression, since we (kind of) don't have gzip...
          console.log(`Data distribution missing directories ${missingDirs}, adding...`)
          const archivePath = await this.wslify(path.join(workdir, 'data.tar'))

          await this.execCommand('tar', '-cf', archivePath, '-C', '/', ...missingDirs)
          await this.execWSL(
            '--distribution',
            DATA_INSTANCE_NAME,
            '--exec',
            '/bin/busybox',
            'tar',
            '-xf',
            archivePath,
            '-C',
            '/'
          )
        }
      })
    } catch (ex) {
      console.log('Error setting up data distribution:', ex)
    } finally {
      await fs.promises.rm(workdir, { recursive: true, maxRetries: 3 })
    }
  }

  /**
   * Convert a Windows path to a path in the WSL subsystem:
   * - Changes \s to /s
   * - Figures out what the /mnt/DRIVE-LETTER path should be
   */
  async wslify(windowsPath: string, distro?: string): Promise<string> {
    for (let i = 1; i <= WSL_PATH_CONVERT_RETRIES; i++) {
      const result: string = (
        await this.captureCommand({ distro }, 'wslpath', '-a', '-u', windowsPath)
      ).trimEnd()

      if (result) {
        return result
      }
      console.log(`Failed to convert '${windowsPath}' to a wsl path, retry #${i}`)
      await util.promisify(setTimeout)(100)
    }

    return ''
  }

  /**
   * handleUpgrade removes all the left over files that
   * were renamed in between releases.
   */
  protected async handleUpgrade(files: string[]) {
    for (const file of files) {
      try {
        await fs.promises.rm(file, { force: true, maxRetries: 3 })
      } catch {
        // ignore the err from exception, since we are
        // removing renamed files from previous releases
      }
    }
  }

  /**
   * Read the given file in a WSL distribution
   * @param [filePath] the path of the file to read.
   * @param [options] Optional configuration for reading the file.
   * @param [options.distro=INSTANCE_NAME] The distribution to read from.
   * @param [options.encoding='utf-8'] The encoding to use for the result.
   */
  async readFile(
    filePath: string,
    options?: Partial<{
      distro: typeof INSTANCE_NAME | typeof DATA_INSTANCE_NAME
      encoding: BufferEncoding
    }>
  ) {
    const distro = options?.distro ?? INSTANCE_NAME
    const encoding = options?.encoding ?? 'utf-8'

    filePath = (
      await this.execCommand({ distro, capture: true }, 'busybox', 'readlink', '-f', filePath)
    ).trim()

    // Run wslpath here, to ensure that WSL generates any files we need.
    for (let i = 1; i <= WSL_PATH_CONVERT_RETRIES; ++i) {
      const windowsPath = (
        await this.execCommand(
          {
            distro,
            encoding,
            capture: true
          },
          '/bin/wslpath',
          '-w',
          filePath
        )
      ).trim()

      if (!windowsPath) {
        // Failed to convert for some reason; try again.
        await util.promisify(setTimeout)(100)
        continue
      }

      return await fs.promises.readFile(windowsPath, options?.encoding ?? 'utf-8')
    }

    throw new Error(`Failed to convert ${filePath} to a Windows path.`)
  }

  /**
   * debugArg returns the given arguments in an array if the debug flag is
   * set, else an empty array.
   */
  protected debugArg(...args: string[]): string[] {
    return this.debug ? args : []
  }

  /**
   * Write the given contents to a given file name in the given WSL distribution.
   * @param filePath The destination file path, in the WSL distribution.
   * @param fileContents The contents of the file.
   * @param [options] An object with fields .permissions=0o644 (the file permissions); and .distro=INSTANCE_NAME (WSL distribution to write to).
   */
  async writeFileWSL(
    filePath: string,
    fileContents: string,
    options?: Partial<{
      permissions: fs.Mode
      distro: typeof INSTANCE_NAME | typeof DATA_INSTANCE_NAME
    }>
  ) {
    const distro = options?.distro ?? INSTANCE_NAME
    const workdir = await fs.promises.mkdtemp(
      path.join(os.tmpdir(), `rd-${path.basename(filePath)}-`)
    )

    try {
      const scriptPath = path.join(workdir, path.basename(filePath))
      const wslScriptPath = await this.wslify(scriptPath, distro)

      await fs.promises.writeFile(scriptPath, fileContents.replace(/\r/g, ''), 'utf-8')
      await this.execCommand({ distro }, 'busybox', 'cp', wslScriptPath, filePath)
      await this.execCommand(
        { distro },
        'busybox',
        'chmod',
        (options?.permissions ?? 0o644).toString(8),
        filePath
      )
    } finally {
      await fs.promises.rm(workdir, { recursive: true, maxRetries: 3 })
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
    await this.writeFileWSL(filePath, fileContents, { permissions })
  }

  async copyFileIn(hostPath: string, vmPath: string): Promise<void> {
    // Sometimes WSL has issues copying _from_ the VM.  So we instead do the
    // copying from inside the VM.
    await this.execCommand('/bin/cp', '-f', '-T', await this.wslify(hostPath), vmPath)
  }

  async copyFileOut(vmPath: string, hostPath: string): Promise<void> {
    // Sometimes WSL has issues copying _from_ the VM.  So we instead do the
    // copying from inside the VM.
    await this.execCommand('/bin/cp', '-f', '-T', vmPath, await this.wslify(hostPath))
  }

  /**
   * Run the given installation script.
   * @param scriptContents The installation script contents to run (in WSL).
   * @param scriptName An identifying label for the script's temporary directory - has no impact on functionality
   * @param args Arguments for the script.
   */
  async runInstallScript(scriptContents: string, scriptName: string, ...args: string[]) {
    const workdir = await fs.promises.mkdtemp(path.join(os.tmpdir(), `rd-${scriptName}-`))

    try {
      const scriptPath = path.join(workdir, scriptName)
      const wslScriptPath = await this.wslify(scriptPath)

      await fs.promises.writeFile(scriptPath, scriptContents.replace(/\r/g, ''), 'utf-8')
      await this.execCommand('chmod', 'a+x', wslScriptPath)
      await this.execCommand(wslScriptPath, ...args)
    } finally {
      await fs.promises.rm(workdir, { recursive: true, maxRetries: 3 })
    }
  }

  async del(): Promise<void> {
    await this.progressTracker.action('Deleting', 20, async () => {
      await this.stop()
      if (await this.isDistroRegistered()) {
        await this.execWSL('--unregister', INSTANCE_NAME)
      }
      if (await this.isDistroRegistered({ distribution: DATA_INSTANCE_NAME })) {
        await this.execWSL('--unregister', DATA_INSTANCE_NAME)
      }
      this.cfg = undefined
    })
  }

  async reset(config: BackendSettings): Promise<void> {
    await this.progressTracker.action('Resetting state...', 5, async () => {
      await this.stop()
      // Mount the data first so they can be deleted correctly.
      await this.start(config)
    })
  }

  handleSettingsUpdate(_config: BackendSettings): Promise<void> {
    throw new Error('Method not implemented.')
  }
  requiresRestartReasons(_config: RecursivePartial<BackendSettings>): Promise<RestartReasons> {
    throw new Error('Method not implemented.')
  }
  async getFailureDetails(exception: any): Promise<FailureDetails> {
    const loglines = (await fs.promises.readFile(console.path, 'utf-8')).split('\n').slice(-10)

    return {
      lastCommand: exception[childProcess.ErrorCommand],
      lastCommandComment: getProgressErrorDescription(exception) ?? 'Unknown',
      lastLogLines: loglines
    }
  }

  /**
   * Read the subnet configuration from /root/.subnet-node/config.yaml
   */
  async getSubnetConfig(): Promise<any> {
    const configPath = '/root/.subnet-node/config.yaml'
    const configContent = await this.readFile(configPath)
    return yaml.parse(configContent)
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
    )
    await this.execCommand('/sbin/rc-service', 'subnet', 'restart')
  }

  // #region Events
  eventNames(): Array<keyof BackendEvents> {
    return super.eventNames() as Array<keyof BackendEvents>
  }

  listeners<eventName extends keyof BackendEvents>(event: eventName): BackendEvents[eventName][] {
    return super.listeners(event) as BackendEvents[eventName][]
  }

  rawListeners<eventName extends keyof BackendEvents>(
    event: eventName
  ): BackendEvents[eventName][] {
    return super.rawListeners(event) as BackendEvents[eventName][]
  }

  async checkSubnetNodeOnline() {
    await this.progressTracker.action('Checking Subnet Node status', 100,  checkStatusUtil())
  }
}
