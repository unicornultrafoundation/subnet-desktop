// Modules to control application life and create native browser window
const { app, BrowserWindow } = require('electron')
const path = require('node:path')
const { createDaemon } = require('./daemon')

function createWindow () {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
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
      createDaemon(app),
      createWindow(),
    ]);
  } catch (error) {
    console.error('Error creating daemon:', error);
  }
}

run()