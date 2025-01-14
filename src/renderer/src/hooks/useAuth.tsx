import { NodeAuth } from '@/interface/node'
import { useMutation } from '@tanstack/react-query'
import { useRequestRPC } from './useRequestRPC'
import { useGlobalStore } from '@renderer/state/global'
import { useAuthStore } from '@renderer/state/auth'

export const useAuth = () => {
  const { requestRPC } = useRequestRPC()
  const { setToken } = useGlobalStore()
  const { setUsername, setPassword } = useAuthStore()

  return useMutation({
    mutationKey: ['auth'],
    mutationFn: async ({ username, password }: NodeAuth) => {
      const token = btoa(`${username}:${password}`)

      try {
        await requestRPC('node_getResource', [], {
          Authorization: `Basic ${token}`
        })
        setToken(token)
        setUsername(username)
        setPassword(password)
        return true
      } catch (error) {
        throw error
      }
    }
  })
}
