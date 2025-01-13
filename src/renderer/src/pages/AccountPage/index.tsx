import Button from "@renderer/components/Button";
import Input from "@renderer/components/Input";
import { useSetupNode } from "@renderer/hooks/useSetupNode";
import { Label } from "flowbite-react";
import { useState } from "react";

export default function AccountPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const { mutate: setupNode, isPending } = useSetupNode();

  const handleSetupNode = async () => {
    // TODO: validate password confirm
    setupNode({ username, password });
  };

  return (
    <main className="p-6 relative flex min-h-screen flex-col">
      <div className="flex flex-col gap-4">
        <div>
          <div className="mb-2 block">
            <Label htmlFor="username" value="Username" />
          </div>
          <Input
            id="username"
            type="email"
            placeholder="Enter your username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
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
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div>
          <div className="mb-2 block">
            <Label htmlFor="password1" value="Confirm password" />
          </div>
          <Input
            id="password2"
            type="password"
            placeholder="Confirm your password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
        <Button isProcessing={isPending} type="primary" onClick={handleSetupNode}>
          Setup node
        </Button>
      </div>
    </main>
  )
}