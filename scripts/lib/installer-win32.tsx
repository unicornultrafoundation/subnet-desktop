/**
 * Windows Installer generation.
 *
 * While Electron-Builder has built-in MSI support, it's not quite as flexible
 * as we desired.  This runs WiX manually instead.
 */

/** @jsx Element.new */

import fs from 'fs';
import path from 'path';

import { extractFile } from '@electron/asar';
import Mustache from 'mustache';
import yaml from 'yaml';

import generateFileList from './installer-win32-gen';

import { simpleSpawn } from '../simple_process';

/**
 * Return the contents of package.json embedded in the application.
 */
function getPackageJson(appDir: string): Record<string, any> {
  const packageBytes = extractFile(path.join(appDir, 'resources', 'app.asar'), 'package.json');

  return JSON.parse(packageBytes.toString('utf-8'));
}

/**
 * Given an unpacked application directory, return the application version.
 */
function getAppVersion(appDir: string): string {
  const packageVersion = getPackageJson(appDir).version;
  // We have a git describe style version, 1.2.3-1234-gabcdef
  const [, semver, offset] = /^v?(\d+\.\d+\.\d+)(?:-(\d+))?/.exec(packageVersion) ?? [];

  if (!semver) {
    throw new Error(`Could not parse version string ${ packageVersion }`);
  }

  return offset ? `${ semver }.${ offset }` : semver;
}

/**
 * Given an unpacked build, produce a MSI installer.
 * @param workDir Directory in which we can write temporary work files.
 * @param appDir Directory containing extracted application zip file.
 * @param outFile Override for the file name to emit.
 * @returns The path of the built installer.
 */
export default async function buildInstaller(workDir: string, appDir: string, outFile = ''): Promise<string> {
  const appVersion = getAppVersion(appDir);

  outFile ||= path.join(process.cwd(), 'dist', `Rancher.Desktop.Setup.${ appVersion }.msi`);

  await writeUpdateConfig(appDir);
  const fileList = await generateFileList(appDir);
  const template = await fs.promises.readFile(path.join(process.cwd(), 'build', 'wix', 'main.wxs'), 'utf-8');
  const output = Mustache.render(template, {
    appVersion, fileList, compressionLevel: 'high',
  });
  const wixDir = path.join(process.cwd(), 'resources', 'host', 'wix');

  console.log('Writing out WiX definition...');
  await fs.promises.writeFile(path.join(workDir, 'project.wxs'), output);
  console.log('Compiling WiX...');
  const iconPath = path.join(appDir, 'resources', 'resources', 'win32', 'bin', 'rdctl.exe');
  const inputs = [
    path.join(workDir, 'project.wxs'),
    path.join(process.cwd(), 'build', 'wix', 'dialogs.wxs'),
    path.join(process.cwd(), 'build', 'wix', 'welcome.wxs'),
    path.join(process.cwd(), 'build', 'wix', 'scope.wxs'),
    path.join(process.cwd(), 'build', 'wix', 'verify.wxs'),
  ];

  await Promise.all(inputs.map(input => simpleSpawn(
    path.join(wixDir, 'candle.exe'),
    [
      '-arch', 'x64',
      `-dappDir=${ appDir }`,
      `-diconPath=${ iconPath }`, // spellcheck-ignore-line
      `-dlicenseFile=${ path.join(appDir, 'build', 'license.rtf') }`,
      '-nologo',
      '-out', path.join(workDir, `${ path.basename(input, '.wxs') }.wixobj`),
      '-pedantic',
      '-wx',
      '-ext', 'WixFirewallExtension',
      input,
    ])));
  console.log('Linking WiX...');
  await simpleSpawn(path.join(wixDir, 'light.exe'), [
    // Skip ICE 60, which checks for files with versions but no language (since
    // Windows Installer will always need to reinstall the file on a repair, in
    // case it's the wrong language).  This trips up our icon fonts, which we
    // do not install system-wide.
    // https://learn.microsoft.com/en-us/windows/win32/msi/ice60
    '-sice:ICE60',
    // Skip ICE 61, which is incompatible AllowSameVersionUpgrades and which emits:
    // error LGHT1076 : ICE61: This product should remove only older versions of itself.
    // https://learn.microsoft.com/en-us/windows/win32/msi/ice61
    '-sice:ICE61',
    `-dappDir=${ appDir }`,
    `-dlicenseFile=${ path.join(appDir, 'build', 'license.rtf') }`,
    `-dWixUIBannerBmp=${ path.join(appDir, 'build', 'wix', 'bannrbmp.png') }`,
    `-dWixUIDialogBmp=${ path.join(appDir, 'build', 'wix', 'dlgbmp.png') }`,
    '-ext', 'WixUIExtension',
    '-ext', 'WixUtilExtension',
    '-ext', 'WixFirewallExtension',
    '-nologo',
    '-out', outFile,
    '-pedantic',
    '-wx',
    '-cc', path.join(process.cwd(), 'dist', 'wix-cache'),
    '-reusecab',
    '-loc', path.join(path.join(process.cwd(), 'build', 'wix', 'string-overrides.wxl')),
    ...inputs.map(n => path.join(workDir, `${ path.basename(n, '.wxs') }.wixobj`)),
  ], { cwd: appDir });
  console.log(`Built Windows installer: ${ outFile }`);

  return outFile;
}

/**
 * writeUpdateConfig writes out app-update.yml, because electron-builder won't
 * create that for us if we're not building the NSIS installer.
 * @param appDir The directory containing the extracted application.
 * @postcondition The file <appDir>\resources\app-update.yml exists.
 */
async function writeUpdateConfig(appDir: string) {
  const packageJson = getPackageJson(appDir);
  const electronBuilderConfig = yaml.parse(await fs.promises.readFile(path.join(appDir, 'electron-builder.yml'), 'utf-8'));
  const repoURL = new URL(packageJson.repository.url.replace(/\.git$/, ''));

  if (repoURL.hostname !== 'github.com') {
    throw new Error(`Unexpect repository reference ${ repoURL }`);
  }

  const [owner, repo] = repoURL.pathname.split('/').filter(x => x);
  const result = {
    owner,
    repo,
    updaterCacheDirName: packageJson.name, // AppData\Local\rancher-desktop\update-info.json
    ...electronBuilderConfig.publish,
  };

  await fs.promises.writeFile(path.join(appDir, 'resources', 'app-update.yml'), yaml.stringify(result), 'utf-8');
  console.log('app-update.yml written.');
}