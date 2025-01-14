import { createHashRouter, RouterProvider } from 'react-router-dom'
import HomePage from './pages/Home'
import ToastProvider from './components/ToastProvider'
import { ReactNode, useEffect } from 'react'
import SetupPage from './pages/SetupPage'
import { useGlobalStore } from './state/global'
import AccountPage from './pages/AccountPage'

const router = createHashRouter([
  {
    path: '/',
    element: <HomePage />
  },
  {
    path: '/setup',
    element: <AccountPage />
  },
])

function App(): ReactNode {
  const { alreadySetup, setAlreadySetup, setNodeStatus, setInstallProgress } = useGlobalStore()

  useEffect(() => {
    window.electron.ipcRenderer.on('subnet-status', (_, value) => {
      setAlreadySetup(value === 'STARTED')
      setNodeStatus(value)
    })

    window.electron.ipcRenderer.on('install-progress', (_, value) => {
      if (!value || !value.description) return
      value.description && setInstallProgress(value.description)
    })
  }, [])

  return (
    <ToastProvider>
      {alreadySetup ? <RouterProvider router={router} /> : <SetupPage />}
    </ToastProvider>
  )
}

export default App
