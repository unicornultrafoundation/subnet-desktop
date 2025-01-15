import { useQuery } from "@tanstack/react-query";
import { useCountApps } from "./useCountApps";
import { useRequestRPC } from "./useRequestRPC";
import { App } from "@/interface/app";

export const useCountRunningApp = () => {
  const { requestRPC } = useRequestRPC();
  const { data: totalApps } = useCountApps();

  return useQuery({
    queryKey: ["running-app", totalApps],
    queryFn: async () => {
      if (!totalApps && totalApps !== 0) return 0;

      const total: App[] = await requestRPC("app_getApps", [
        0,
        totalApps,
        { status: "running" },
      ]);
      return total.length;
    },
  });
};
