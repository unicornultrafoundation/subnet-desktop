import { useToast } from './useToast'

const useToastNotification = () => {
  const { addToast } = useToast()

  const showToast = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    addToast(message, type)
  }

  return { showToast }
}

export default useToastNotification
