import { NodeAuth } from "@/interface/node";
import { useMutation } from "@tanstack/react-query";
import { useRequestRPC } from "./useRequestRPC";
import { useGlobalStore } from "@renderer/state/global";

export const useAuth = () => {
  const { requestRPC } = useRequestRPC();
  const { setToken } = useGlobalStore();

  return useMutation({
    mutationKey: ["auth"],
    mutationFn: async ({ username, password }: NodeAuth) => {
      const token = btoa(`${username}:${password}`);

      try {
        await requestRPC("node_getResource", [], {
          Authorization: `Basic ${token}`,
        });
        setToken(token);
        return true;
      } catch (error) {
        console.log(error);
        return false;
      }
    },
  });
};
