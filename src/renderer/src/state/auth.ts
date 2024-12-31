import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  token: string;
  setToken: (token: string) => void;
  nodeURL: string;
  setNodeURL: (nodeURL: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: "",
      setToken: (token: string) => set({ token }),
      nodeURL: "",
      setNodeURL: (nodeURL: string) => set({ nodeURL }),
    }),
    {
      name: "auth-storage",
    },
  ),
);
