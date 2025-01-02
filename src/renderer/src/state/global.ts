import { create } from "zustand";

interface GlobalState {
  installStep: string;
  setInstallStep: (installStep: string) => void;
}

export const useGlobalStore = create<GlobalState>()((set) => ({
  installStep: "introduction",
  setInstallStep: (installStep) => {
    set({ installStep });
  },
}));
