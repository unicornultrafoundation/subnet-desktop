import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: unknown
    // api: {
    //   onInstallStatusUpdate: (callback) => void,
    //   onInstallProgress: (callback) => void
    // }
  }
}
