import { useAuthStore } from "@/state/auth";
import { useQuery } from "@tanstack/react-query";
import { useRequestRPC } from "./useRequestRPC";

export const useNodeStatus = () => {
  const { requestRPC } = useRequestRPC();
  const { nodeURL } = useAuthStore();

  return useQuery({
    queryKey: ["node-status", nodeURL],
    queryFn: async () => {
      try {
        if (!nodeURL) return false;
        // TODO: implement node status API
        const rs = await requestRPC("config_get");
        if (rs.api?.authorizations) return true;
        return false;
      } catch (error) {
        console.log(error);
        return true;
      }
    },
  });
};
