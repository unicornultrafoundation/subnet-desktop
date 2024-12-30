const { exec } = require('child_process');
const os = require('os');

function isInstalled(command, callback) {
  exec(command, (error) => {
    callback(!error);
  });
}

function installContainerd() {
  const platform = os.platform();
  let installCommand;

  if (platform === 'linux') {
    installCommand = 'sudo apt-get update && sudo apt-get install -y containerd';
  } else if (platform === 'darwin') {
    installCommand = 'brew install containerd';
  } else if (platform === 'win32') {
    installCommand = 'wsl --install -d Ubuntu && wsl sudo apt-get update && wsl sudo apt-get install -y containerd';
  } else {
    console.error(`Unsupported platform: ${platform}`);
    return;
  }

  isInstalled('containerd --version', (installed) => {
    if (installed) {
      console.log('containerd is already installed.');
    } else {
      exec(installCommand, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error installing containerd: ${error}`);
          return;
        }
        console.log(`stdout: ${stdout}`);
        console.error(`stderr: ${stderr}`);
      });
    }
  });
}

function startContainerd() {
  const platform = os.platform();
  let startCommand;

  if (platform === 'linux' || platform === 'darwin') {
    startCommand = 'sudo systemctl start containerd';
  } else if (platform === 'win32') {
    startCommand = 'wsl sudo systemctl start containerd';
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
  });
}

function installSubnetNode() {
  const platform = os.platform();
  let installCommand;

  if (platform === 'linux' || platform === 'darwin') {
    installCommand = 'sudo apt-get update && sudo apt-get install -y subnet-node';
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
      exec(installCommand, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error installing subnet node: ${error}`);
          return;
        }
        console.log(`stdout: ${stdout}`);
        console.error(`stderr: ${stderr}`);
      });
    }
  });
}

function startSubnetNode() {
  const platform = os.platform();
  let startCommand;

  if (platform === 'linux' || platform === 'darwin') {
    startCommand = 'sudo systemctl start subnet-node';
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
  });
}

module.exports = {
  installContainerd,
  startContainerd,
  installSubnetNode,
  startSubnetNode
};
