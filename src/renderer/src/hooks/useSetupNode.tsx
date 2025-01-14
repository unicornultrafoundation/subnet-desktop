import { useMutation } from '@tanstack/react-query'
import { useNodeStatus } from './useNodeStatus'
import { NodeAuth } from '@/interface/node'
import { useRequestRPC } from './useRequestRPC'

export const useSetupNode = (onSuccess?: () => void, onError?: () => void) => {
  const { requestRPC } = useRequestRPC()
  const { refetch: refetchNodeStatus } = useNodeStatus()

  return useMutation({
    mutationKey: ['setup-node'],
    mutationFn: async ({ username, password }: NodeAuth) => {
      // if (!nodeURL) throw new Error("Node URL not found");
      try {
        // TODO: implement setup node API
        const result = await requestRPC('config_update', [
          {
            api: {
              authorizations: {
                [username]: {
                  auth_secret: password,
                  allowed_methods: ['*']
                }
              }
            }
          }
        ])
        console.log('setup node result', result)
        return true
      } catch (err) {
        throw err
      }
    },
    onSuccess: () => {
      refetchNodeStatus()
      onSuccess?.()
    },
    onError: () => {
      onError?.()
    }
  })
}
