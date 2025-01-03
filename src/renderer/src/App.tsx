import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import HomePage from './pages/Home'
import ToastProvider from './components/ToastProvider'
import { useAuthStore } from './state/auth'
import { ReactNode, useEffect } from 'react'
import SetupPage from './pages/SetupPage'

const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />
  },
])

function App(): ReactNode {
  const { alreadySetup, setAlreadySetup } = useAuthStore()

  useEffect(() => {
    window.electron.ipcRenderer.on('install-status', (_, value) => {
      console.log('install-status', value)
      setAlreadySetup(value)
    })

    window.electron.ipcRenderer.on('install-progress', (_, value) => {
      console.log('install-progress', value)
    })
  }, [])

  return <ToastProvider>{alreadySetup ? <RouterProvider router={router} /> : <SetupPage />}</ToastProvider>
}

export default App
