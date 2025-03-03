import { useQuery } from '@tanstack/react-query'
import { useRequestRPC } from './useRequestRPC'
import { useGlobalStore } from '@renderer/state/global';

export const useNodeStatus = () => {
  const { requestRPC } = useRequestRPC()
  const { token } = useGlobalStore();

  return useQuery({
    queryKey: ['node-status', token],
    queryFn: async () => {
      try {
        // if (!nodeURL) return false;
        const rs = await requestRPC('config_get')
        if (rs.api?.authorizations) return true
        return false
      } catch (error) {
        console.log(error)
        return true
      }
    },
    refetchInterval: 2000
  })
}
