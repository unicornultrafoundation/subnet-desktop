import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import os from 'os';
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import {installCNIPlugins, installContainerd, isInstalled, startContainerd, startSubnetNode, stopContainerd, stopSubnetNode} from './deamon/deamon'

let mainWindow: BrowserWindow

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

  // Install containerd if not installed
  if (!await isInstalled('containerd --version')) {
    await installContainerd(mainWindow);
  }

  // Install CNI plugins if not installed
  if (os.platform() === 'win32') {
    if (!await isInstalled('test -d /opt/cni/bin')) {
      await installCNIPlugins(mainWindow);
    }
  } else {
    if (!await isInstalled('ls /opt/cni/bin')) {
      await installCNIPlugins(mainWindow);
    }
  }

  // Start containerd and then start subnet node
  await startContainerd();
  await startSubnetNode();

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', async () => {
  if (process.platform !== 'darwin') {
    stopSubnetNode();
    await stopContainerd();
    app.quit()
  } else {
    stopSubnetNode();
    await stopContainerd();
    stopLima();
    app.quit();
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
// Handle app restart
// app.on('restart', async function () {
//   await restartAll();
// });

// // Handle app start
// app.on('start', async function () {
//   await startContainerd();
//   await startSubnetNode();
// });

// // Handle app stop
app.on('before-quit', async function () {
  stopSubnetNode();
  await stopContainerd();
  if (os.platform() === 'darwin') {
    stopLima();
  }
});