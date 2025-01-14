import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRequestRPC } from './useRequestRPC'

export const useSaveAppEnv = (
  appId: `0x${string}`,
  onSuccess?: () => void,
  onError?: () => void
) => {
  const { requestRPC } = useRequestRPC()
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['save-app-env', appId],
    mutationFn: async (env: Record<string, any> = {}) => {
      if (!appId) throw new Error('App id not provided')
      try {
        await requestRPC('app_updateAppConfig', [appId, { env }])
        return true
      } catch (err) {
        throw err
      }
    },
    onSuccess: () => {
      onSuccess?.()
      queryClient.invalidateQueries({ queryKey: ['get-app-details', appId] })
      queryClient.invalidateQueries({ queryKey: ['get-app-usage', appId] })
    },
    onError: () => {
      onError?.()
    }
  })
}
