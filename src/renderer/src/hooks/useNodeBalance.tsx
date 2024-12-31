import { useQuery } from "@tanstack/react-query";
import { useRequestRPC } from "./useRequestRPC";

export const useNodeBalance = () => {
  const { requestRPC } = useRequestRPC();

  return useQuery({
    queryKey: ["node-balance"],
    queryFn: async () => {
      const rs = await requestRPC("account_getBalance");
      return rs;
    },
  });
};
