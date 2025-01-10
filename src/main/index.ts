import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import VmFactory from '../backend/factory';
import * as settings from '../config/settings';
import * as settingsImpl from '../config/settingsImpl';
import { setLogLevel } from '../utils/logging';

let cfg: settings.Settings;
let deploymentProfiles: settings.DeploymentProfileType = { defaults: {}, locked: {} };

let mainWindow: BrowserWindow

// Do an early check for debugging enabled via the environment variable so that
// we can turn on extra logging to troubleshoot startup issues.
if (settingsImpl.runInDebugMode(true)) {
  setLogLevel('debug');
}


function newVmManager() {
  const arch = process.arch === 'arm64' ? 'aarch64' : 'x86_64';
  const mgr = VmFactory(arch);

  mgr.on('progress', () => {
    if (!mainWindow || mainWindow.isDestroyed()) return
    console.log('progress:', mgr.progress)
    mainWindow.webContents.send('install-progress', mgr.progress)
  });

  mgr.on('state-changed', (state: string) => {
    if (!mainWindow || mainWindow.isDestroyed()) return
    mainWindow.webContents.send('install-status', state)
  });

  return mgr;
}

const vmmanager = newVmManager();

async function startBackend() {
  try {
    await startVmManager();
  } catch (err) {
    handleFailure(err);
  }
}


async function startVmManager() {
  await vmmanager.start(cfg);
}

async function handleFailure(payload: any) {
  console.log(payload)
}


function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  try {
    cfg = settingsImpl.load(deploymentProfiles);
  } catch(err) {
    console.error(err)
  }

  await startBackend();

})

app.on('window-all-closed', async () => {
  try {
    await vmmanager.stop();
  } catch (err) {
    console.error('Error stopping vmmanager:', err);
  } finally {
    app.quit();
  }
});


// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.