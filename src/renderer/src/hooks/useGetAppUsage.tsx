import { useQuery } from '@tanstack/react-query'
import { AppUsage } from '@/interface/app'
import { useRequestRPC } from './useRequestRPC'

export const useGetAppUsage = (appId?: `0x${string}`) => {
  const { requestRPC } = useRequestRPC()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['get-app-usage', appId],
    enabled: !!appId,
    queryFn: async (): Promise<AppUsage | null> => {
      if (!appId) return null
      return requestRPC('app_getUsage', [appId])
    }
  })

  return {
    data,
    isLoading,
    isError
  }
}
