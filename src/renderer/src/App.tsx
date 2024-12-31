import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import HomePage from './pages/Home'
import AppDetails from './pages/AppDetails'
import Apps from './pages/Apps'
import MyBookmarks from './pages/MyBookmarks'
import ToastProvider from './components/ToastProvider'
import { useAuthStore } from './state/auth'
import LoginPage from './pages/Login'
import { ReactNode } from 'react'

const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />
  },
  {
    path: '/app/:appId',
    element: <AppDetails />
  },
  {
    path: '/apps',
    element: <Apps />
  },
  {
    path: '/my-bookmarks',
    element: <MyBookmarks />
  }
])

function App(): ReactNode {
  const { token } = useAuthStore()
  return <ToastProvider>{token ? <RouterProvider router={router} /> : <LoginPage />}</ToastProvider>
}

export default App
