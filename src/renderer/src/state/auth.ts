import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  username: string
  setUsername: (username: string) => void
  password: string
  setPassword: (password: string) => void
  port: string
  setPort: (port: string) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      username: '',
      setUsername: (username: string) => set({ username }),
      password: '',
      setPassword: (password: string) => set({ password }),
      port: '',
      setPort: (port: string) => set({ port })
    }),
    {
      name: 'config-storage'
    }
  )
)
