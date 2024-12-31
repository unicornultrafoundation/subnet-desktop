// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('node:path')
const { createDaemon } = require('./daemon/daemon')

let mainWindow;

app.disableHardwareAcceleration();

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false
    }
  })


  // and load the index.html of the app.
  mainWindow.loadFile('assets/pages/index.html')

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}

async function run () {
  try {
    await app.whenReady()
  } catch (e) {
    dialog.showErrorBox('Electron could not start', e.stack)
    app.exit(1)
  }

  try {
    await Promise.all([
      createDaemon(app, mainWindow),
      createWindow(),
    ]);
  } catch (error) {
    console.error('Error creating daemon:', error);
  }
}

run()