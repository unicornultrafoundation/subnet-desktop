import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import ViteYaml from '@modyfi/vite-plugin-yaml'
import VitePluginString from 'vite-plugin-string'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin(), ViteYaml(), VitePluginString()],
    resolve: {
      alias: {
        '@pkg':resolve('pkg')
      }
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@': resolve('src/renderer/src'),
      }
    },
    plugins: [react()],
    server: {
      host: true
    }
  },
  
})
