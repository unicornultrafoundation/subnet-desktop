import { create } from "zustand";

interface GlobalState {
  searchQuery: string;
  setSearchQuery: (searchQuery: string) => void;
}

export const useGlobalStore = create<GlobalState>()((set) => ({
  searchQuery: "",
  setSearchQuery: (searchQuery) => {
    set({ searchQuery });
  },
}));
