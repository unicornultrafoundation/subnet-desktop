import {exec, execFile, spawn} from 'child_process';
import os from 'os';
import fs from 'fs';
import path from 'path';
import util from 'util';
import https from 'https';
import http from 'http';
import { BrowserWindow } from 'electron';

const execAsync = util.promisify(exec);
const execFileAsync = util.promisify(execFile);

let subnetNodeProcess;

export async function isInstalled(command) {
  try {
    if (os.platform() === 'win32') {
      await execAsync(`wsl -d Ubuntu-24.04 -- ${command}`);
    } else {
      await execAsync(command);
    }
    return true;
  } catch {
    return false;
  }
}

async function downloadFile(url, dest) {
  const file = fs.createWriteStream(dest);
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlinkSync(dest);
      reject(err.message);
    });
  });
}

async function enableWSL() {
  const commands = [
    'dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart',
    'dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart',
    'wsl.exe --install',
    'wsl --set-default-version 2',
    'wsl --install -d Ubuntu-24.04'
  ];

  for (const command of commands) {
    try {
      const { stdout, stderr } = await execAsync(command);
      console.log(`stdout: ${stdout}`);
      console.error(`stderr: ${stderr}`);
    } catch (error) {
      console.error(`Error executing command "${command}": ${error}`);
    }
  }
}

export async function installContainerd(mainWindow: BrowserWindow) {
  mainWindow.webContents.send('install-progress', 'Installing containerd...');
  const platform = os.platform();
  let installCommand;

  if (platform === 'linux') {
    const version = '1.7.13';
    const arch = os.arch() === 'x64' ? 'amd64' : 'arm64';
    const url = `https://github.com/containerd/containerd/releases/download/v${version}/containerd-${version}-linux-${arch}.tar.gz`;
    const dest = path.join('/tmp', `containerd-${version}-linux-${arch}.tar.gz`);

    await downloadFile(url, dest);
    installCommand = `sudo tar Cxzvf /usr/local ${dest}`;
  } else if (platform === 'darwin') {
    installCommand = 'brew install lima && limactl start';
  } else if (platform === 'win32') {
    await enableWSL();
    installCommand = `
      powershell.exe -Command "
      wsl -d Ubuntu-24.04 -- sudo apt-get update;
      wsl -d Ubuntu-24.04 -- sudo apt-get install -y containerd;
      wsl -d Ubuntu-24.04 -- sudo systemctl enable containerd;
      wsl -d Ubuntu-24.04 -- sudo systemctl start containerd;
      "
    `;
  } else {
    console.error(`Unsupported platform: ${platform}`);
    return;
  }

  try {
    const { stdout, stderr } = await execAsync(installCommand);
    console.log(`stdout: ${stdout}`);
    console.error(`stderr: ${stderr}`);
    mainWindow.webContents.send('install-progress', 'containerd installed successfully.');
  } catch (error) {
    console.error(`Error installing containerd: ${error}`);
    mainWindow.webContents.send('install-progress', `Error installing containerd: ${error}`);
  }
}

export async function installCNIPlugins(mainWindow) {
  mainWindow.webContents.send('install-progress', 'Installing CNI plugins...');
  const platform = os.platform();
  let installCommand;

  if (platform === 'linux') {
    const version = 'v1.1.1';
    const arch = os.arch() === 'x64' ? 'amd64' : 'arm64';
    const url = `https://github.com/containernetworking/plugins/releases/download/${version}/cni-plugins-linux-${arch}-${version}.tgz`;
    const dest = path.join('/tmp', `cni-plugins-linux-${arch}-${version}.tgz`);

    await downloadFile(url, dest);
    installCommand = `sudo mkdir -p /opt/cni/bin && sudo tar Cxzvf /opt/cni/bin ${dest}`;
  } else if (platform === 'darwin') {
    const version = 'v1.1.1';
    const arch = 'amd64';
    const url = `https://github.com/containernetworking/plugins/releases/download/${version}/cni-plugins-darwin-${arch}-${version}.tgz`;
    const dest = path.join('/tmp', `cni-plugins-darwin-${arch}-${version}.tgz`);

    await downloadFile(url, dest);
    installCommand = `sudo mkdir -p /opt/cni/bin && sudo tar Cxzvf /opt/cni/bin ${dest}`;
  } else if (platform === 'win32') {
    const version = 'v1.1.1';
    const arch = 'amd64';
    const url = `https://github.com/containernetworking/plugins/releases/download/${version}/cni-plugins-linux-${arch}-${version}.tgz`;
    const dest = path.join('C:\\tmp', `cni-plugins-linux-${arch}-${version}.tgz`);

    await downloadFile(url, dest);
    installCommand = `
      powershell.exe -Command "
      wsl -d Ubuntu-24.04 -- sudo mkdir -p /opt/cni/bin;
      wsl -d Ubuntu-24.04 -- sudo tar Cxzvf /opt/cni/bin ${dest};
      "
    `;
  } else {
    console.error(`Unsupported platform: ${platform}`);
    return;
  }

  try {
    const { stdout, stderr } = await execAsync(installCommand);
    console.log(`stdout: ${stdout}`);
    console.error(`stderr: ${stderr}`);
    mainWindow.webContents.send('install-progress', 'CNI plugins installed successfully.');
  } catch (error) {
    console.error(`Error installing CNI plugins: ${error}`);
    mainWindow.webContents.send('install-progress', `Error installing CNI plugins: ${error}`);
  }
}

export async function startContainerd() {
  console.log('Starting containerd...');
  const platform = os.platform();
  let startCommand;

  if (platform === 'linux') {
    startCommand = 'sudo systemctl start containerd';
  } else if (platform === 'darwin') {
    startCommand = 'limactl shell default sudo systemctl start containerd';
  } else if (platform === 'win32') {
    startCommand = 'powershell.exe -Command "wsl -d Ubuntu-24.04 -- sudo systemctl start containerd"';
  } else {
    console.error(`Unsupported platform: ${platform}`);
    return;
  }

  try {
    const { stdout, stderr } = await execAsync(startCommand);
    console.log(`stdout: ${stdout}`);
    console.error(`stderr: ${stderr}`);
    console.log('containerd started successfully.');
  } catch (error) {
    console.error(`Error starting containerd: ${error}`);
  }
}

export async function stopContainerd() {
  console.log('Stopping containerd...');
  const platform = os.platform();
  let stopCommand;

  if (platform === 'linux') {
    stopCommand = 'sudo systemctl stop containerd';
  } else if (platform === 'darwin') {
    stopCommand = 'limactl shell default sudo systemctl stop containerd';
  } else if (platform === 'win32') {
    stopCommand = 'powershell.exe -Command "wsl -d Ubuntu-24.04 -- sudo systemctl stop containerd"';
  } else {
    console.error(`Unsupported platform: ${platform}`);
    return;
  }

  try {
    const { stdout, stderr } = await execAsync(stopCommand);
    console.log(`stdout: ${stdout}`);
    console.error(`stderr: ${stderr}`);
    console.log('containerd stopped successfully.');
  } catch (error) {
    console.error(`Error stopping containerd: ${error}`);
  }
}

async function checkSubnetNodeStatus(retries = 5) {
  for (let i = 0; i < retries; i++) {
    const isRunning = await new Promise((resolve) => {
      http.get('http://localhost:8080/status', (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const status = JSON.parse(data);
            if (status.online) {
              resolve(true);
            } else {
              resolve(false);
            }
          } catch (error) {
            resolve(false);
          }
        });
      }).on('error', (err) => {
        resolve(false);
      });
    });

    if (isRunning) {
      return true;
    }

    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  return false;
}

export async function startSubnetNode() {
  console.log('Starting subnet node...');
  const binaryPath = path.join(__dirname, '../../assets/bin/subnet');
  const platform = os.platform();

  if (!fs.existsSync(binaryPath)) {
    console.error('Subnet node binary not found.');
    return;
  }

  let startCommand;

  if (platform === 'linux' || platform === 'darwin') {
    startCommand = binaryPath;
  } else if (platform === 'win32') {
    startCommand = `wsl -d Ubuntu-24.04 -- ${binaryPath}`;
  } else {
    console.error(`Unsupported platform: ${platform}`);
    return;
  }

  try {
    subnetNodeProcess = spawn(startCommand, [], {
      detached: true,
      stdio: 'ignore'
    });
    subnetNodeProcess.unref();
    console.log('Subnet node started successfully.');

    // Check if the subnet node is running
    const isRunning = await checkSubnetNodeStatus();
    if (isRunning) {
      console.log('Subnet node is running.');
    } else {
      console.error('Subnet node failed to start.');
    }
  } catch (error) {
    console.error(`Error starting subnet node: ${error}`);
  }
}

export function stopSubnetNode() {
  console.log('Stopping subnet node...');
  if (subnetNodeProcess) {
    subnetNodeProcess.kill();
    console.log('Subnet node stopped successfully.');
  } else {
    console.error('Subnet node process not found.');
  }
}

export default async function createDaemon(app, mainWindow: BrowserWindow) {
  app.whenReady().then(async () => {
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
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  // Quit when all windows are closed, except on macOS. There, it's common
  // for applications and their menu bar to stay active until the user quits
  // explicitly with Cmd + Q.
  app.on('window-all-closed', async function () {
    if (process.platform !== 'darwin') {
      stopSubnetNode();
      await stopContainerd();
      app.quit();
    } else {
      stopSubnetNode();
      await stopContainerd();
      stopLima();
      app.quit();
    }
  });

  // Handle app restart
  app.on('restart', async function () {
    await restartAll();
  });

  // Handle app start
  app.on('start', async function () {
    await startContainerd();
    await startSubnetNode();
  });

  // Handle app stop
  app.on('stop', async function () {
    stopSubnetNode();
    await stopContainerd();
    if (os.platform() === 'darwin') {
      stopLima();
    }
  });
}