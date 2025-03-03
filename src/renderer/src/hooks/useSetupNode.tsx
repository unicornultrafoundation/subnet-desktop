import { useMutation } from '@tanstack/react-query'
import { useNodeStatus } from './useNodeStatus'
import { NodeAuth } from '@/interface/node'
import { useRequestRPC } from './useRequestRPC'
import { sleep } from '@renderer/utils/promise'

export const useSetupNode = (onSuccess?: () => void, onError?: () => void) => {
  const { requestRPC } = useRequestRPC()
  const { refetch: refetchNodeStatus } = useNodeStatus()

  return useMutation({
    mutationKey: ['setup-node'],
    mutationFn: async ({ username, password }: NodeAuth) => {
      // if (!nodeURL) throw new Error("Node URL not found");
      try {
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
        await sleep(5000)
        console.log('setup node result', result)
        return true
      } catch (err) {
        console.log(err)
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
