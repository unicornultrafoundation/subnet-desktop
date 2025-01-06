import { create } from "zustand";

interface GlobalState {
  installStep: string;
  setInstallStep: (installStep: string) => void;
  installProgress: string;
  setInstallProgress: (installProgress: string) => void;
}

export const useGlobalStore = create<GlobalState>()((set) => ({
  installStep: "introduction",
  setInstallStep: (installStep) => {
    set({ installStep });
  },
  installProgress: "",
  setInstallProgress: (installProgress) => {
    set({ installProgress })
  }
}));
