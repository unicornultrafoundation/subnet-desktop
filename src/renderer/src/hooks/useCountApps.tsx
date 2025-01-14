import { useQuery } from '@tanstack/react-query'
import { useRequestRPC } from './useRequestRPC'

export const useCountApps = () => {
  const { requestRPC } = useRequestRPC()

  return useQuery({
    queryKey: ['count-apps'],
    queryFn: async () => {
      const rs = await requestRPC('app_getAppCount')
      return Number(rs)
    }
  })
}
