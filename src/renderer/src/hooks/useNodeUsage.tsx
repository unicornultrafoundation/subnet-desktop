import { useQuery } from "@tanstack/react-query";
import { useRequestRPC } from "./useRequestRPC";
import { AppUsage } from "@/interface/app";

export const useNodeUsage = () => {
  const { requestRPC } = useRequestRPC();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["get-node-usage"],
    queryFn: async (): Promise<AppUsage | null> => {
      return requestRPC("app_getAllUsage", []);
    },
  });

  return {
    data,
    isLoading,
    isError,
  };
};
