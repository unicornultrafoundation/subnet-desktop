import { Dependency, DownloadContext, findChecksum, getPublishedVersions } from "../lib/dependencies";
import { download } from "../lib/download";
import semver from 'semver';
import path from 'path';

export class Subnet implements Dependency {
    name = 'subnet';
    githubOwner = 'unicornultrafoundation';
    githubRepo = 'subnet-node';
  
    async download(context: DownloadContext): Promise<void> {
      const version = context.versions.subnet
      const arch = context.isM1 ? 'arm64' : 'amd64';
      const baseUrl = `https://github.com/${ this.githubOwner }/${ this.githubRepo }/releases/download/v${ version }`;
      const executableName = `subnet-${version}-linux-${arch}`
      const url = `${ baseUrl }/${executableName}`;
      await download(url, path.join(context.resourcesDir, "linux", "internal", "subnet"));
    }
  
    async getAvailableVersions(includePrerelease = false): Promise<string[]> {
      return await getPublishedVersions(this.githubOwner, this.githubRepo, includePrerelease);
    }
  
    rcompareVersions(version1: string, version2: string): -1 | 0 | 1 {
      return semver.rcompare(version1, version2);
    }
  }