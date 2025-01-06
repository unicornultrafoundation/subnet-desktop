import os from 'os';

import { Architecture, VMBackend } from './backend';
import { LimaBackend } from './lima';
import WSLBackend from './wsl';


export default function factory(): VMBackend {
  const platform = os.platform();

  switch (platform) {
  case 'linux':
  case 'darwin':
    return new LimaBackend();
  case 'win32':
    return new WSLBackend();
  default:
    throw new Error(`OS "${ platform }" is not supported.`);
  }
}