import { ResourceInfo } from "@/interface/node";
import { useQuery } from "@tanstack/react-query";
import { useRequestRPC } from "./useRequestRPC";

export const useNodeResource = () => {
  const { requestRPC } = useRequestRPC();

  return useQuery({
    queryKey: ["node-resource"],
    queryFn: async () => {
      const rs: ResourceInfo = await requestRPC("node_getResource");
      return rs;
    },
  });
};
