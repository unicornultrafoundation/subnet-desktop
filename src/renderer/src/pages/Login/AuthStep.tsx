import Button from "@/components/Button";
import Input from "@/components/Input";
import Loading from "@/components/Loading";
import { useAuth } from "@/hooks/useAuth";
import { useNodeStatus } from "@/hooks/useNodeStatus";
import { useSetupNode } from "@/hooks/useSetupNode";
import { Label } from "flowbite-react";
import { useState } from "react";

export default function AuthStep() {
  const { data: alreadySetup, isFetching } = useNodeStatus();
  const { mutate: setupNode } = useSetupNode();
  const { mutate: login, status: loginStatus } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSetupNode = async () => {
    // TODO: validate password confirm
    setupNode({ username, password });
  };

  const handleLogin = async () => {
    login({ username, password });
  };

  if (isFetching) {
    return <Loading />;
  }

  if (!alreadySetup) {
    return (
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
        <Button type="primary" onClick={handleSetupNode}>
          Setup node
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
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
      <Button
        type="primary"
        onClick={handleLogin}
        isProcessing={loginStatus === "pending"}
      >
        Login
      </Button>
    </div>
  );
}
