import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import HomePage from './pages/Home'
import ToastProvider from './components/ToastProvider'
import { useAuthStore } from './state/auth'
import { ReactNode } from 'react'
import SetupPage from './pages/SetupPage'

const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />
  },
])

function App(): ReactNode {
  const { alreadySetup } = useAuthStore()
  return <ToastProvider>{alreadySetup ? <RouterProvider router={router} /> : <SetupPage />}</ToastProvider>
}

export default App
