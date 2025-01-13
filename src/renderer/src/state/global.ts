import { create } from "zustand";

interface GlobalState {
  installStep: string;
  setInstallStep: (installStep: string) => void;
  installProgress: string;
  setInstallProgress: (installProgress: string) => void;
  alreadySetup: boolean;
  setAlreadySetup: (alreadySetup: boolean) => void;
  token: string;
  setToken: (token: string) => void;
}

export const useGlobalStore = create<GlobalState>()((set) => ({
  installStep: "introduction",
  setInstallStep: (installStep) => {
    set({ installStep });
  },
  installProgress: "",
  setInstallProgress: (installProgress) => {
    set({ installProgress })
  },
  alreadySetup: false,
  setAlreadySetup: (alreadySetup: boolean) => set({ alreadySetup }),
  token: "",
  setToken: (token: string) => set({ token })
}));
