import { useQuery } from '@tanstack/react-query'
import { useRequestRPC } from './useRequestRPC'
import { AppUsage } from '@/interface/app'
import { useGlobalStore } from '@renderer/state/global'

export const useNodeUsage = () => {
  const { requestRPC } = useRequestRPC()
  const { token } = useGlobalStore()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['get-node-usage', token],
    queryFn: async (): Promise<AppUsage | null> => {
      const rs = await requestRPC('app_getAllUsage', [])
      return rs
    },
    refetchInterval: 5000
  })

  return {
    data,
    isLoading,
    isError
  }
}
