import { useQuery } from '@tanstack/react-query'

export const useNodeConfig = () => {
  return useQuery({
    queryKey: ['node-config'],
    queryFn: async () => {
      const config = await window.electron.ipcRenderer.invoke('get-config')
      return config
    }
  })
}
