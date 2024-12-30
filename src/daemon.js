const { exec } = require('child_process');
const os = require('os');

function isInstalled(command, callback) {
  exec(command, (error) => {
    callback(!error);
  });
}

function installContainerd() {
  console.log('Starting installation of containerd...');
  const platform = os.platform();
  let installCommand;

  if (platform === 'linux') {
    installCommand = 'sudo apt-get update && sudo apt-get install -y containerd';
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

  isInstalled('containerd --version', (installed) => {
    if (installed) {
      console.log('containerd is already installed.');
    } else {
      console.log('Installing containerd...');
      exec(installCommand, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error installing containerd: ${error}`);
          return;
        }
        console.log(`stdout: ${stdout}`);
        console.error(`stderr: ${stderr}`);
        console.log('containerd installation completed.');
      });
    }
  });
}

function startContainerd() {
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

  exec(startCommand, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error starting containerd: ${error}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
    console.error(`stderr: ${stderr}`);
    console.log('containerd started successfully.');
  });
}

function stopContainerd() {
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

  exec(stopCommand, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error stopping containerd: ${error}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
    console.error(`stderr: ${stderr}`);
    console.log('containerd stopped successfully.');
  });
}

function installSubnetNode() {
  console.log('Starting installation of subnet node...');
  const platform = os.platform();
  let installCommand;

  if (platform === 'linux') {
    installCommand = 'sudo apt-get update && sudo apt-get install -y subnet-node';
  } else if (platform === 'darwin') {
    installCommand = 'limactl shell default sudo apt-get update && limactl shell default sudo apt-get install -y subnet-node';
  } else if (platform === 'win32') {
    installCommand = 'wsl sudo apt-get update && wsl sudo apt-get install -y subnet-node';
  } else {
    console.error(`Unsupported platform: ${platform}`);
    return;
  }

  isInstalled('subnet-node --version', (installed) => {
    if (installed) {
      console.log('subnet node is already installed.');
    } else {
      console.log('Installing subnet node...');
      exec(installCommand, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error installing subnet node: ${error}`);
          return;
        }
        console.log(`stdout: ${stdout}`);
        console.error(`stderr: ${stderr}`);
        console.log('subnet node installation completed.');
      });
    }
  });
}

function startSubnetNode() {
  console.log('Starting subnet node...');
  const platform = os.platform();
  let startCommand;

  if (platform === 'linux') {
    startCommand = 'sudo systemctl start subnet-node';
  } else if (platform === 'darwin') {
    startCommand = 'limactl shell default sudo systemctl start subnet-node';
  } else if (platform === 'win32') {
    startCommand = 'wsl sudo systemctl start subnet-node';
  } else {
    console.error(`Unsupported platform: ${platform}`);
    return;
  }

  exec(startCommand, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error starting subnet node: ${error}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
    console.error(`stderr: ${stderr}`);
    console.log('subnet node started successfully.');
  });
}

function stopSubnetNode() {
  console.log('Stopping subnet node...');
  const platform = os.platform();
  let stopCommand;

  if (platform === 'linux') {
    stopCommand = 'sudo systemctl stop subnet-node';
  } else if (platform === 'darwin') {
    stopCommand = 'limactl shell default sudo systemctl stop subnet-node';
  } else if (platform === 'win32') {
    stopCommand = 'wsl sudo systemctl stop subnet-node';
  } else {
    console.error(`Unsupported platform: ${platform}`);
    return;
  }

  exec(stopCommand, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error stopping subnet node: ${error}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
    console.error(`stderr: ${stderr}`);
    console.log('subnet node stopped successfully.');
  });
}


function createDaemon() {
  installContainerd();
  startContainerd();
  installSubnetNode();
  startSubnetNode();
}

module.exports = {
    createDaemon
}