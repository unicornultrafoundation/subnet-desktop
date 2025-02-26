/**
 * This module describes the various paths we use to store state & data.
 */
import os from 'os'
import path from 'path'

import electron from 'electron'

export interface Paths {
  /** appHome: the location of the main appdata directory. */
  appHome: string
  /** altAppHome is a secondary directory for application data. */
  altAppHome: string
  /** Directory which holds configuration. */
  config: string
  /** Directory which holds logs. */
  logs: string
  /** Directory which holds caches that may be removed. */
  cache: string
  /** Directory that holds resource files in the RD installation. */
  resources: string
  /** Directory holding Lima state (Unix-specific). */
  lima: string
  /** Directory holding provided binary resources */
  integration: string
  /** Deployment Profile System-wide startup settings path. */
  deploymentProfileSystem: string
  /** Deployment Profile User startup settings path. */
  deploymentProfileUser: string
  /** Directory that will hold extension data. */
  readonly extensionRoot: string
  /** Directory holding the WSL distribution (Windows-specific). */
  wslDistro: string
  /** Directory holding the WSL data distribution (Windows-specific). */
  wslDistroData: string
  /** Directory that holds snapshots. */
  snapshots: string
  /** Directory that holds user-managed containerd-shims. */
  containerdShims: string
}

export class UnixPaths implements Paths {
  appHome = ''
  altAppHome = ''
  config = ''
  logs = ''
  cache = ''
  resources = ''
  lima = ''
  integration = ''
  deploymentProfileSystem = ''
  deploymentProfileUser = ''
  extensionRoot = ''
  snapshots = ''
  containerdShims = ''

  constructor(pathsData: Record<string, unknown>) {
    Object.assign(this, pathsData)
  }

  get wslDistro(): string {
    throw new Error('wslDistro not available for Unix')
  }

  get wslDistroData(): string {
    throw new Error('wslDistroData not available for Unix')
  }
}

export class WindowsPaths implements Paths {
  appHome = ''
  altAppHome = ''
  config = ''
  logs = ''
  cache = ''
  resources = ''
  extensionRoot = ''
  wslDistro = ''
  wslDistroData = ''
  snapshots = ''
  containerdShims = ''

  constructor(pathsData: Record<string, unknown>) {
    Object.assign(this, pathsData)
  }

  get lima(): string {
    throw new Error('lima not available for Windows')
  }

  get integration(): string {
    throw new Error('Internal error: integration path not available for Windows')
  }

  get deploymentProfileSystem(): string {
    throw new Error('Internal error: Windows profiles will be read from Registry')
  }

  get deploymentProfileUser(): string {
    throw new Error('Internal error: Windows profiles will be read from Registry')
  }
}

function getPaths(): Paths {
  const pathsData = {}

  let resourcesPath: string
  // If we are running as a script (i.e. yarn postinstall), electron.app is undefined
  if (electron.app?.isPackaged) {
    resourcesPath = process.resourcesPath
  } else {
    resourcesPath = electron.app?.getAppPath() || ''
  }

  switch (process.platform) {
    case 'darwin':
      Object.assign(pathsData, {
        appHome: path.join(os.homedir(), 'Library', 'Application Support', 'SubnetDesktop'),
        altAppHome: path.join(os.homedir(), '.subnet-desktop'),
        config: path.join(os.homedir(), 'Library', 'Preferences', 'SubnetDesktop'),
        logs: path.join(os.homedir(), 'Library', 'Logs', 'SubnetDesktop'),
        cache: path.join(os.homedir(), 'Library', 'Caches', 'SubnetDesktop'),
        resources: path.join(resourcesPath, 'resources'),
        lima: path.join(os.homedir(), '.lima'),
        integration: path.join(
          os.homedir(),
          'Library',
          'Application Support',
          'SubnetDesktop',
          'integration'
        ),
        deploymentProfileSystem:
          '/Library/Application Support/SubnetDesktop/deploymentProfileSystem',
        deploymentProfileUser: path.join(
          os.homedir(),
          'Library',
          'Application Support',
          'SubnetDesktop',
          'deploymentProfileUser'
        ),
        extensionRoot: path.join(
          os.homedir(),
          'Library',
          'Application Support',
          'SubnetDesktop',
          'extensions'
        ),
        snapshots: path.join(
          os.homedir(),
          'Library',
          'Application Support',
          'SubnetDesktop',
          'snapshots'
        ),
        containerdShims: path.join(
          os.homedir(),
          'Library',
          'Application Support',
          'SubnetDesktop',
          'containerd-shims'
        )
      })
      return new UnixPaths(pathsData)
    case 'linux':
      Object.assign(pathsData, {
        appHome: path.join(os.homedir(), '.local', 'share', 'SubnetDesktop'),
        altAppHome: path.join(os.homedir(), '.subnet-desktop'),
        config: path.join(os.homedir(), '.config', 'SubnetDesktop'),
        logs: path.join(os.homedir(), '.local', 'share', 'SubnetDesktop', 'logs'),
        cache: path.join(os.homedir(), '.cache', 'SubnetDesktop'),
        resources: path.join(resourcesPath, 'resources'),
        lima: path.join(os.homedir(), '.lima'),
        integration: path.join(os.homedir(), '.local', 'share', 'SubnetDesktop', 'integration'),
        deploymentProfileSystem: '/etc/subnet-desktop/deploymentProfileSystem',
        deploymentProfileUser: path.join(
          os.homedir(),
          '.local',
          'share',
          'SubnetDesktop',
          'deploymentProfileUser'
        ),
        extensionRoot: path.join(os.homedir(), '.local', 'share', 'SubnetDesktop', 'extensions'),
        snapshots: path.join(os.homedir(), '.local', 'share', 'SubnetDesktop', 'snapshots'),
        containerdShims: path.join(
          os.homedir(),
          '.local',
          'share',
          'SubnetDesktop',
          'containerd-shims'
        )
      })
      return new UnixPaths(pathsData)
    case 'win32':
      Object.assign(pathsData, {
        appHome: path.join(os.homedir(), 'AppData', 'Roaming', 'SubnetDesktop'),
        altAppHome: path.join(os.homedir(), 'AppData', 'Local', 'SubnetDesktop'),
        config: path.join(os.homedir(), 'AppData', 'Roaming', 'SubnetDesktop', 'config'),
        logs: path.join(os.homedir(), 'AppData', 'Roaming', 'SubnetDesktop', 'logs'),
        cache: path.join(os.homedir(), 'AppData', 'Local', 'SubnetDesktop', 'cache'),
        resources: path.join(resourcesPath, 'resources'),
        extensionRoot: path.join(os.homedir(), 'AppData', 'Roaming', 'SubnetDesktop', 'extensions'),
        wslDistro: path.join(os.homedir(), 'AppData', 'Local', 'SubnetDesktop', 'wsl-distro'),
        wslDistroData: path.join(
          os.homedir(),
          'AppData',
          'Local',
          'SubnetDesktop',
          'wsl-distro-data'
        ),
        snapshots: path.join(os.homedir(), 'AppData', 'Roaming', 'SubnetDesktop', 'snapshots'),
        containerdShims: path.join(
          os.homedir(),
          'AppData',
          'Roaming',
          'SubnetDesktop',
          'containerd-shims'
        )
      })
      return new WindowsPaths(pathsData)
    default:
      throw new Error(`Platform "${process.platform}" is not supported.`)
  }
}

export default getPaths()
