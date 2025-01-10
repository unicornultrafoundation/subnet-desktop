import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import HomePage from './pages/Home'
import ToastProvider from './components/ToastProvider'
import { ReactNode, useEffect } from 'react'
import SetupPage from './pages/SetupPage'
import { useGlobalStore } from './state/global'

const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />
  },
])

function App(): ReactNode {
  const { alreadySetup, setAlreadySetup } = useGlobalStore()
  const { setInstallProgress } = useGlobalStore()

  useEffect(() => {
    window.electron.ipcRenderer.on('install-status', (_, value) => {
      console.log('install-status', value)
      setAlreadySetup(value)
    })

    window.electron.ipcRenderer.on('install-progress', (_, value) => {
      console.log('install-progress', value)
      value.description && setInstallProgress(value.description)
    })
  }, [])

  return <ToastProvider>{alreadySetup ? <RouterProvider router={router} /> : <SetupPage />}</ToastProvider>
}

export default App
