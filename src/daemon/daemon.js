const { exec, execFile } = require('child_process');
const os = require('os');
const fs = require('fs');
const path = require('path');
const util = require('util');
const https = require('https');

const execAsync = util.promisify(exec);
const execFileAsync = util.promisify(execFile);

let subnetNodeProcess;

async function isInstalled(command) {
  try {
    await execAsync(command);
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
      fs.unlink(dest);
      reject(err.message);
    });
  });
}

async function installContainerd() {
  console.log('Installing containerd...');
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
    installCommand = `
      powershell.exe -Command "
      Stop-Service containerd;
      $Version='1.7.13';
      $Arch='amd64';
      curl.exe -LO https://github.com/containerd/containerd/releases/download/v$Version/containerd-$Version-windows-$Arch.tar.gz;
      tar.exe xvf .\\containerd-$Version-windows-$Arch.tar.gz;
      Copy-Item -Path .\\bin -Destination $Env:ProgramFiles\\containerd -Recurse -Force;
      $Path = [Environment]::GetEnvironmentVariable('PATH', 'Machine') + [IO.Path]::PathSeparator + '$Env:ProgramFiles\\containerd';
      [Environment]::SetEnvironmentVariable('Path', $Path, 'Machine');
      $Env:Path = [System.Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path','User');
      containerd.exe config default | Out-File $Env:ProgramFiles\\containerd\\config.toml -Encoding ascii;
      containerd.exe --register-service;
      Start-Service containerd;
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
    console.log('containerd installed successfully.');
  } catch (error) {
    console.error(`Error installing containerd: ${error}`);
  }
}

async function startContainerd() {
  console.log('Starting containerd...');
  const platform = os.platform();
  let startCommand;

  if (platform === 'linux') {
    startCommand = 'sudo systemctl start containerd';
  } else if (platform === 'darwin') {
    startCommand = 'limactl shell default sudo systemctl start containerd';
  } else if (platform === 'win32') {
    startCommand = 'powershell.exe -Command "Start-Service containerd"';
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

async function stopContainerd() {
  console.log('Stopping containerd...');
  const platform = os.platform();
  let stopCommand;

  if (platform === 'linux') {
    stopCommand = 'sudo systemctl stop containerd';
  } else if (platform === 'darwin') {
    stopCommand = 'limactl shell default sudo systemctl stop containerd';
  } else if (platform === 'win32') {
    stopCommand = 'powershell.exe -Command "Stop-Service containerd"';
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

async function startSubnetNode() {
  console.log('Starting subnet node...');
  const binaryPath = path.join(__dirname, 'subnet-node-binary');
  const platform = os.platform();

  if (!fs.existsSync(binaryPath)) {
    console.error('Subnet node binary not found.');
    return;
  }

  let startCommand;

  if (platform === 'linux' || platform === 'darwin') {
    startCommand = binaryPath;
  } else if (platform === 'win32') {
    startCommand = `wsl ${binaryPath}`;
  } else {
    console.error(`Unsupported platform: ${platform}`);
    return;
  }

  try {
    subnetNodeProcess = await execFileAsync(startCommand);
    console.log('Subnet node started successfully.');
  } catch (error) {
    console.error(`Error starting subnet node: ${error}`);
  }
}

function stopSubnetNode() {
  console.log('Stopping subnet node...');
  if (subnetNodeProcess) {
    subnetNodeProcess.kill();
    console.log('Subnet node stopped successfully.');
  } else {
    console.error('Subnet node process not found.');
  }
}

async function createDaemon(app) {
  app.whenReady().then(async () => {
    // Install containerd if not installed
    if (!await isInstalled('containerd --version')) {
      await installContainerd();
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

module.exports = {
  createDaemon
};