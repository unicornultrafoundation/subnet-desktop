import { useInfiniteQuery } from '@tanstack/react-query'
import { useCountApps } from './useCountApps'
import { App } from '@/interface/app'
import { useRequestRPC } from './useRequestRPC'

const APP_LIMIT = 10

export const useGetAllApps = () => {
  const { requestRPC } = useRequestRPC()
  const { data: totalApps } = useCountApps()

  const { data, fetchNextPage, isFetching, refetch, isLoading } = useInfiniteQuery({
    queryKey: ['get-all-apps', totalApps],
    enabled: !!totalApps,
    queryFn: async ({ pageParam = 1 }): Promise<App[]> => {
      if (!totalApps && totalApps !== 0) return []

      const start = (pageParam - 1) * APP_LIMIT
      const end = Math.min(start + APP_LIMIT, totalApps)

      if (start > end) {
        return []
      }

      return requestRPC('app_getApps', [start, end])
    },
    getNextPageParam: (lastPage, pages) => {
      const nextPageParam = !lastPage || lastPage.length === 0 ? undefined : pages.length + 1
      return nextPageParam
    },
    initialPageParam: 1
  })

  return {
    data,
    isFetching,
    isLoading,
    refetch,
    fetchNextPage
  }
}
