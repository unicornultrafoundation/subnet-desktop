import path from 'path';

import { AlpineLimaISOVersion, Dependency, DownloadContext } from '../lib/dependencies';
import { simpleSpawn } from '../simple_process';

type GoDependencyOptions = {
  /**
   * The output file name, relative to the platform-specific resources directory.
   * If this does not contain any directory separators ('/'), it is assumed to
   * be a directory name (defaults to `bin`) and the leaf name of the source
   * path is appended as the executable name.
   */
  outputPath: string;
  /**
   * Additional environment for the go compiler; e.g. for GOARCH overrides.
   */
  env?: NodeJS.ProcessEnv;
};

/**
 * GoDependency represents a golang binary that is built from the local source
 * code.
 */
export class GoDependency implements Dependency {
  /**
   * Construct a new GoDependency.
   * @param sourcePath The path to be compiled, relative to .../src/go
   * @param options Additional configuration option; if a string is given, this
   * is the outputPath option, defaulting to `bin`.
   */
  constructor(sourcePath: string, options: string | GoDependencyOptions = 'bin') {
    this.sourcePath = sourcePath;
    this.options = typeof options === 'string' ? { outputPath: options } : options;
  }

  get name(): string {
    if (this.options.outputPath.includes('/')) {
      return path.basename(this.options.outputPath);
    }

    return path.basename(this.sourcePath);
  }

  sourcePath: string;
  options: GoDependencyOptions;

  async download(context: DownloadContext): Promise<void> {
    // Rather than actually downloading anything, this builds the source code.
    const sourceDir = path.join(process.cwd(), 'src', 'go', this.sourcePath);
    const outFile = this.outFile(context);

    console.log(`Building go utility \x1B[1;33;40m${ this.name }\x1B[0m from ${ sourceDir } to ${ outFile }...`);
    await simpleSpawn('go', ['build', '-ldflags', '-s -w', '-o', outFile, '.'], {
      cwd: sourceDir,
      env: this.environment(context),
    });
  }

  environment(context: DownloadContext): NodeJS.ProcessEnv {
    return {
      ...process.env,
      GOOS:   context.goPlatform,
      GOARCH: context.isM1 ? 'arm64' : 'amd64',
      ...this.options.env ?? {},
    };
  }

  outFile(context: DownloadContext): string {
    const suffix = context.platform === 'win32' ? '.exe' : '';
    let outputPath = `${ this.options.outputPath }${ suffix }`;

    if (!this.options.outputPath.includes('/')) {
      outputPath = `${ this.options.outputPath }/${ this.name }${ suffix }`;
    }

    return path.join(context.resourcesDir, context.platform, outputPath);
  }

  getAvailableVersions(_includePrerelease?: boolean | undefined): Promise<string[]> {
    throw new Error('Go dependencies do not have available versions.');
  }

  rcompareVersions(_version1: string | AlpineLimaISOVersion, _version2: string): 0 | 1 | -1 {
    throw new Error('Go dependencies do not have available versions.');
  }
}



export class WSLHelper extends GoDependency {
  constructor() {
    super('wsl-helper', { outputPath: 'internal', env: { CGO_ENABLED: '0' } });
  }

  dependencies(_context: DownloadContext): string[] {
    return ['mobyOpenAPISpec:win32'];
  }
}

