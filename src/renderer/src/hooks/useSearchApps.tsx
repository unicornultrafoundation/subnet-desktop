import { useQuery } from "@tanstack/react-query"
import { useCountApps } from "./useCountApps";
import { useRequestRPC } from "./useRequestRPC";
import { App } from "@/interface/app";

export const useSearchApp = (searchQuery: string) => {
  const { data: totalApps } = useCountApps();
  const { requestRPC } = useRequestRPC();

  return useQuery<App[]>({
    queryKey: ['search-apps', searchQuery, totalApps],
    queryFn: async () => {
      if (!totalApps && totalApps !== 0) return [];
      if (!searchQuery) return [];

      return requestRPC("app_getApps", [0, totalApps, {query: searchQuery}]);
    }
  })
}