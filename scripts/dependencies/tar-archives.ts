import fs from 'fs'
import path from 'path'
import stream from 'stream'

import tar from 'tar-stream'

import { AlpineLimaISOVersion, Dependency, DownloadContext } from '../lib/dependencies'

export class WSLDistroImage implements Dependency {
  name = 'WSLDistroImage'
  dependencies(_: DownloadContext): string[] {
    return [
      'WSLDistro:win32',
      'subnet:linux',
      'vm-switch:linux',
      'network-setup:linux',
      'wsl-proxy:linux'
    ]
  }

  async download(context: DownloadContext): Promise<void> {
    const tarName = `distro-${context.versions.WSLDistro}.tar`
    const pristinePath = path.join(context.resourcesDir, context.platform, 'staging', tarName)
    const pristineFile = fs.createReadStream(pristinePath)
    const extractor = tar.extract()
    const destPath = path.join(context.resourcesDir, context.platform, tarName)
    const destFile = fs.createWriteStream(destPath)
    const packer = tar.pack()

    console.log('Building WSLDistro image...')

    // Copy the pristine tar file to the destination.
    packer.pipe(destFile)
    extractor.on('entry', (header, stream, callback) => {
      stream.pipe(packer.entry(header, callback))
    })
    await stream.promises.finished(pristineFile.pipe(extractor))

    async function addFile(
      fromPath: string,
      name: string,
      options: Omit<tar.Headers, 'name' | 'size'> = {}
    ) {
      const { size } = await fs.promises.stat(fromPath)
      const inputFile = fs.createReadStream(fromPath)

      console.log(`WSL Distro: Adding ${fromPath} to ${name}...`)
      await stream.promises.finished(
        inputFile.pipe(
          packer.entry({
            name,
            size,
            mode: 0o755,
            type: 'file',
            mtime: new Date(0),
            ...options
          })
        )
      )
    }

    // Add extra files.
    const extraFiles = {
      'linux/internal/subnet': 'usr/local/bin/subnet',
      'linux/staging/vm-switch': 'usr/local/bin/vm-switch',
      'linux/staging/network-setup': 'usr/local/bin/network-setup',
      'linux/staging/wsl-proxy': 'usr/local/bin/wsl-proxy'
    }

    await Promise.all(
      Object.entries(extraFiles).map(([src, dest]) => {
        return addFile(path.join(context.resourcesDir, ...src.split('/')), dest)
      })
    )

    // Finish the archive.
    packer.finalize()
    await stream.promises.finished(packer)
    console.log('Built WSLDistro image.')
  }

  getAvailableVersions(_?: boolean | undefined): Promise<string[] | AlpineLimaISOVersion[]> {
    throw new Error('WSLDistroImage does not have versions.')
  }

  rcompareVersions(
    _version1: string | AlpineLimaISOVersion,
    _version2: string | AlpineLimaISOVersion
  ): 0 | 1 | -1 {
    throw new Error('WSLDistroImage does not have versions.')
  }
}
