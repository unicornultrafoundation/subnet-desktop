import fs from 'fs';
import yaml from 'yaml';
import { merge } from 'lodash';
import axios from 'axios';

/**
 * Update the subnet configuration in /root/.subnet-node/config.yaml
 * @param readFile Function to read a file from the VM
 * @param writeFile Function to write a file to the VM
 * @param execCommand Function to execute a command in the VM
 * @param newConfig The new configuration to be merged and written.
 */
export async function updateSubnetConfig(
  readFile: (filePath: string) => Promise<string>,
  writeFile: (filePath: string, fileContents: string, permissions?: fs.Mode) => Promise<void>,
  _execCommand: (...command: string[]) => Promise<void>,
  newConfig: any
): Promise<void> {
  const configPath = '/root/.subnet-node/config.yaml';
  const configContent = await readFile(configPath);
  const existingConfig = yaml.parse(configContent);
  const mergedConfig = merge({}, existingConfig, newConfig);
  const updatedConfigContent = yaml.stringify(mergedConfig);
  await writeFile(configPath, updatedConfigContent);
}

/**
 * Check if a service is online by making a POST request to the API at localhost:8080/status
 * @returns A promise that resolves to a boolean indicating if the service is online
 */
export async function checkStatus(retries = 5, delay = 3000): Promise<boolean> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axios.post('http://localhost:8080/status');
      return response.data.online;
    } catch (error) {
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  return false;
}
