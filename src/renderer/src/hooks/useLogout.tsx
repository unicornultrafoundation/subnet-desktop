import { useAuthStore } from "@/state/auth";
import { useMutation } from "@tanstack/react-query";

export const useLogout = () => {
  const { setNodeURL, nodeURL, setToken } = useAuthStore();

  return useMutation({
    mutationKey: ["logout", nodeURL],
    mutationFn: async () => {
      setNodeURL("");
      setToken("");
    },
  });
};
