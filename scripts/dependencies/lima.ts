// This downloads the resources related to Lima.

import childProcess from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

import semver from 'semver';

import { download, downloadTarGZ, getResource } from '../lib/download';

import {
  DownloadContext, Dependency, AlpineLimaISOVersion, findChecksum, getOctokit, GitHubDependency, getPublishedReleaseTagNames, GitHubRelease,
} from 'scripts/lib/dependencies';
import { simpleSpawn } from 'scripts/simple_process';

/**
 * rcompareVersions implementation for version strings that look like 0.1.2.rd3????.
 * Note that anything after the number after "rd" is ignored.
 * @param version1 The first version to compare.
 * @param version2 The second version to compare.
 * @returns Whether version1 is higher (-1), equal to (0), or lower than (1) version2.
 */
function rcompareVersions(version1: string, version2: string): -1 | 0 | 1 {
  const semver1 = semver.coerce(version1);
  const semver2 = semver.coerce(version2);

  if (semver1 === null || semver2 === null) {
    throw new Error(`One of ${ version1 } and ${ version2 } failed to be coerced to semver`);
  }

  if (semver1.raw !== semver2.raw) {
    return semver.rcompare(semver1, semver2);
  }

  // If the two versions are equal, assume we have different build suffixes
  // e.g. "0.19.0.rd5" vs "0.19.0.rd6"
  const [, match1] = /^\d+\.\d+\.\d+\.rd(\d+)$/.exec(version1) ?? [];
  const [, match2] = /^\d+\.\d+\.\d+\.rd(\d+)$/.exec(version2) ?? [];

  if (!match1 || !match2) {
    // One or both are invalid; prefer the valid one.
    const fallback = Math.sign(version2.localeCompare(version1, 'en')) as -1 | 0 | 1;

    return match1 ? -1 : match2 ? 1 : fallback;
  }

  return Math.sign(parseInt(match2, 10) - parseInt(match1, 10)) as -1 | 0 | 1;
}

export class Lima implements Dependency, GitHubDependency {
  name = 'lima';
  githubOwner = 'rancher-sandbox';
  githubRepo = 'rancher-desktop-lima';

  async download(context: DownloadContext): Promise<void> {
    const baseUrl = `https://github.com/${ this.githubOwner }/${ this.githubRepo }/releases/download`;
    let platform: string = context.platform;

    if (platform === 'darwin') {
      platform = `macos-13.${ process.env.M1 ? 'arm64' : 'amd64' }`;
    } else {
      platform = 'linux.amd64';
    }

    const url = `${ baseUrl }/v${ context.versions.lima }/lima.${ platform }.tar.gz`;
    const expectedChecksum = (await getResource(`${ url }.sha512sum`)).split(/\s+/)[0];
    const limaDir = path.join(context.resourcesDir, context.platform, 'lima');
    const tarPath = path.join(context.resourcesDir, context.platform, `lima.${ platform }.v${ context.versions.lima }.tgz`);

    await download(url, tarPath, {
      expectedChecksum,
      checksumAlgorithm: 'sha512',
      access:            fs.constants.W_OK,
    });
    await fs.promises.mkdir(limaDir, { recursive: true });

    const child = childProcess.spawn('/usr/bin/tar', ['-xf', tarPath],
      { cwd: limaDir, stdio: 'inherit' });

    await new Promise<void>((resolve, reject) => {
      child.on('exit', (code, signal) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Lima extract failed with ${ code || signal }`));
        }
      });
    });
  }

  async getAvailableVersions(): Promise<string[]> {
    const tagNames = await getPublishedReleaseTagNames(this.githubOwner, this.githubRepo);

    return tagNames.map((tagName: string) => tagName.replace(/^v/, ''));
  }

  versionToTagName(version: string): string {
    return `v${ version }`;
  }

  rcompareVersions(version1: string, version2: string): -1 | 0 | 1 {
    return rcompareVersions(version1, version2);
  }
}

export class Qemu implements Dependency, GitHubDependency {
  name = 'qemu';
  githubOwner = 'rancher-sandbox';
  githubRepo = 'rancher-desktop-qemu';

  async download(context: DownloadContext): Promise<void> {
    const baseUrl = `https://github.com/${ this.githubOwner }/${ this.githubRepo }/releases/download`;
    const arch = context.isM1 ? 'aarch64' : 'x86_64';

    const url = `${ baseUrl }/v${ context.versions.qemu }/qemu-${ context.versions.qemu }-${ context.platform }-${ arch }.tar.gz`;
    const expectedChecksum = (await getResource(`${ url }.sha512sum`)).split(/\s+/)[0];
    const limaDir = path.join(context.resourcesDir, context.platform, 'lima');
    const tarPath = path.join(context.resourcesDir, context.platform, `qemu.v${ context.versions.qemu }.tgz`);

    await download(url, tarPath, {
      expectedChecksum, checksumAlgorithm: 'sha512', access: fs.constants.W_OK,
    });
    await fs.promises.mkdir(limaDir, { recursive: true });

    await simpleSpawn('/usr/bin/tar', ['-xf', tarPath], { cwd: limaDir });
  }

  async getAvailableVersions(): Promise<string[]> {
    const tagNames = await getPublishedReleaseTagNames(this.githubOwner, this.githubRepo);

    return tagNames.map((tagName: string) => tagName.replace(/^v/, ''));
  }

  versionToTagName(version: string): string {
    return `v${ version }`;
  }

  rcompareVersions(version1: string, version2: string): -1 | 0 | 1 {
    return rcompareVersions(version1, version2);
  }
}

export class SocketVMNet implements Dependency, GitHubDependency {
  name = 'socketVMNet';
  githubOwner = 'lima-vm';
  githubRepo = 'socket_vmnet';

  async download(context: DownloadContext): Promise<void> {
    const arch = context.isM1 ? 'arm64' : 'x86_64';
    const baseURL = `https://github.com/${ this.githubOwner }/${ this.githubRepo }/releases/download/v${ context.versions.socketVMNet }`;
    const archiveName = `socket_vmnet-${ context.versions.socketVMNet }-${ arch }.tar.gz`;
    const expectedChecksum = await findChecksum(`${ baseURL }/SHA256SUMS`, archiveName);

    await downloadTarGZ(`${ baseURL }/${ archiveName }`,
      path.join(context.resourcesDir, context.platform, 'lima', 'socket_vmnet', 'bin', 'socket_vmnet'),
      { expectedChecksum, entryName: './opt/socket_vmnet/bin/socket_vmnet' });
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

export class AlpineLimaISO implements Dependency, GitHubDependency {
  name = 'alpineLimaISO';
  githubOwner = 'rancher-sandbox';
  githubRepo = 'alpine-lima';

  async download(context: DownloadContext): Promise<void> {
    const baseUrl = `https://github.com/${ this.githubOwner }/${ this.githubRepo }/releases/download`;
    const edition = 'rd';
    const version = context.versions.alpineLimaISO;
    let arch = 'x86_64';

    if (context.platform === 'darwin' && process.env.M1) {
      arch = 'aarch64';
    }
    const isoName = `alpine-lima-${ edition }-${ version.alpineVersion }-${ arch }.iso`;
    const url = `${ baseUrl }/v${ version.isoVersion }/${ isoName }`;
    const destPath = path.join(process.cwd(), 'resources', os.platform(), `alpine-lima-v${ version.isoVersion }-${ edition }-${ version.alpineVersion }.iso`);
    const expectedChecksum = (await getResource(`${ url }.sha512sum`)).split(/\s+/)[0];

    await download(url, destPath, {
      expectedChecksum, checksumAlgorithm: 'sha512', access: fs.constants.W_OK,
    });
  }

  assembleAlpineLimaISOVersionFromGitHubRelease(release: GitHubRelease): AlpineLimaISOVersion {
    const matchingAsset = release.assets.find((asset: { name: string }) => asset.name.includes('rd'));

    if (!matchingAsset) {
      throw new Error(`Could not find matching asset name in set ${ release.assets }`);
    }
    const nameMatch = matchingAsset.name.match(/alpine-lima-rd-([0-9]+\.[0-9]+\.[0-9])-.*/);

    if (!nameMatch) {
      throw new Error(`Failed to parse name "${ matchingAsset.name }"`);
    }
    const alpineVersion = nameMatch[1];

    return {
      isoVersion: release.tag_name.replace(/^v/, ''),
      alpineVersion,
    };
  }

  async getAvailableVersions(): Promise<AlpineLimaISOVersion[]> {
    const response = await getOctokit().rest.repos.listReleases({ owner: this.githubOwner, repo: this.githubRepo });
    const releases = response.data;

    return await Promise.all(releases.map(this.assembleAlpineLimaISOVersionFromGitHubRelease));
  }

  versionToTagName(version: AlpineLimaISOVersion): string {
    return `v${ version.isoVersion }`;
  }

  rcompareVersions(version1: AlpineLimaISOVersion, version2: AlpineLimaISOVersion): -1 | 0 | 1 {
    return rcompareVersions(version1.isoVersion, version2.isoVersion);
  }
}