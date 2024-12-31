import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRequestRPC } from "./useRequestRPC";

export const useStartApp = (
  appId: `0x${string}`,
  onSuccess?: () => void,
  onError?: () => void,
) => {
  const { requestRPC } = useRequestRPC();
  const queryClient = useQueryClient();

  const runAppMutaion = useMutation({
    mutationKey: ["start-app", appId],
    mutationFn: async () => {
      if (!appId) throw new Error("App id not provided");
      try {
        await requestRPC("app_runApp", [appId]);
        return true;
      } catch (err) {
        throw err;
      }
    },
    onSuccess: () => {
      onSuccess?.();
      queryClient.invalidateQueries({ queryKey: ["get-app-details", appId] });
      queryClient.invalidateQueries({ queryKey: ["get-app-usage", appId] });
    },
    onError: () => {
      onError?.();
    },
  });

  return runAppMutaion;
};
