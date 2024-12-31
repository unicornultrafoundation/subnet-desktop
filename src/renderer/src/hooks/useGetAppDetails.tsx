import { InfiniteData, useQuery, useQueryClient } from "@tanstack/react-query";
import { App } from "@/interface/app";
import { useCountApps } from "./useCountApps";
import { useRequestRPC } from "./useRequestRPC";

export const useGetAppDetails = (appId?: `0x${string}`) => {
  const { requestRPC } = useRequestRPC();
  const { data: totalApps } = useCountApps();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ["get-app-details", appId],
    enabled: !!appId,
    queryFn: async (): Promise<App | null> => {
      if (!appId) return null;
      const rs = await requestRPC("app_getApp", [appId]);
      return rs;
    },
    initialData: () => {
      const cached = queryClient.getQueryData<InfiniteData<App[], unknown>>([
        "get-all-apps",
        totalApps,
      ]);
      if (!cached) return undefined;
      const allApps = cached.pages.flat();
      const item = allApps.find((item) => item.id === appId);
      return item;
    },
    initialDataUpdatedAt: () => {
      const state = queryClient.getQueryState(["get-all-apps", totalApps]);
      return state?.dataUpdatedAt;
    },
    staleTime: 1000,
  });

  return {
    data,
    isLoading,
    isFetching,
    isError,
  };
};
