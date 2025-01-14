import Button from '@renderer/components/Button'
import Input from '@renderer/components/Input'
import { useAuth } from '@renderer/hooks/useAuth'
import { useNodeStatus } from '@renderer/hooks/useNodeStatus'
import { Label } from 'flowbite-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function LoginForm() {
  const navigate = useNavigate()
  const { data: haveAccount } = useNodeStatus()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const { mutate: login, status: loginStatus, error: loginError, reset } = useAuth()

  const handleLogin = async () => {
    reset()
    login({ username, password })
  }

  if (!haveAccount) {
    navigate('/setup')
    return
  }

  return (
    <main className="flex flex-col items-center justify-center h-screen">
      <div className="flex flex-col gap-4 w-1/2">
        <div>
          <div className="mb-2 block">
            <Label htmlFor="username" value="Username" />
          </div>
          <Input
            id="username"
            type="text"
            placeholder="Enter your username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value.trim())}
          />
        </div>
        <div>
          <div className="mb-2 block">
            <Label htmlFor="password1" value="Password" />
          </div>
          <Input
            id="password1"
            type="password"
            placeholder="Enter your password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value.trim())}
            color={loginError ? 'error' : undefined}
            helperText={
              loginError && (
                <span className="font-medium text-error-500">Invalid username or password</span>
              )
            }
          />
        </div>
        <Button type="primary" onClick={handleLogin} isProcessing={loginStatus === 'pending'}>
          Login
        </Button>
      </div>
    </main>
  )
}
