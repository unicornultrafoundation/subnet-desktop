import { NodeAuth } from "@/interface/node";
import { useAuthStore } from "@/state/auth";
import { useMutation } from "@tanstack/react-query";
import { useRequestRPC } from "./useRequestRPC";

export const useAuth = () => {
  const { requestRPC } = useRequestRPC();
  const { nodeURL, setToken } = useAuthStore();

  return useMutation({
    mutationKey: ["auth", nodeURL],
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
