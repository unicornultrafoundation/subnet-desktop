import { useQuery } from "@tanstack/react-query";
import { useRequestRPC } from "./useRequestRPC";

export const useNodeAccount = () => {
  const { requestRPC } = useRequestRPC();

  return useQuery({
    queryKey: ["node-account"],
    queryFn: async () => {
      const rs = await requestRPC("account_getAddress");
      return rs;
    },
  });
};
