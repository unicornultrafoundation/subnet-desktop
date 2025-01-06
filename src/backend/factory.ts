import os from 'os';

import { Architecture, VMBackend } from './backend';
import { LimaBackend } from './lima';
import WSLBackend from './wsl';


export default function factory(arch: Architecture): VMBackend {
  const platform = os.platform();

  switch (platform) {
  case 'linux':
  case 'darwin':
    return new LimaBackend(arch);
  case 'win32':
    return new WSLBackend(arch);
  default:
    throw new Error(`OS "${ platform }" is not supported.`);
  }
}