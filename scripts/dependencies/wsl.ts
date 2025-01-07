import fs from 'fs';
import path from 'path';

import semver from 'semver';

import { download } from '../lib/download';

import {
  DownloadContext, Dependency, GitHubDependency, getPublishedReleaseTagNames,
} from '../lib/dependencies';


export class WSLDistro implements Dependency, GitHubDependency {
  name = 'WSLDistro';
  githubOwner = 'rancher-sandbox';
  githubRepo = 'rancher-desktop-wsl-distro';

  async download(context: DownloadContext): Promise<void> {
    const baseUrl = `https://github.com/${ this.githubOwner }/${ this.githubRepo }/releases/download`;
    const tarName = `distro-${ context.versions.WSLDistro }.tar`;
    const url = `${ baseUrl }/v${ context.versions.WSLDistro }/${ tarName }`;
    const destPath = path.join(context.resourcesDir, context.platform, 'staging', tarName);

    await download(url, destPath, { access: fs.constants.W_OK });
  }

  async getAvailableVersions(): Promise<string[]> {
    const tagNames = await getPublishedReleaseTagNames(this.githubOwner, this.githubRepo);

    return tagNames.map((tagName: string) => tagName.replace(/^v/, ''));
  }

  versionToTagName(version: string): string {
    return `v${ version }`;
  }

  rcompareVersions(version1: string, version2: string): -1 | 0 | 1 {
    const semver1 = semver.coerce(version1);
    const semver2 = semver.coerce(version2);

    if (semver1 === null || semver2 === null) {
      throw new Error(`One of ${ version1 } and ${ version2 } failed to be coerced to semver`);
    }

    return semver.rcompare(semver1, semver2);
  }
}