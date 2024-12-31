import Button from "@/components/Button";
import Input from "@/components/Input";
import { useAuthStore } from "@/state/auth";
import { isURL } from "@/utils/string";
import { Label } from "flowbite-react";
import { useState } from "react";

export default function NodeAddressStep({
  onConfirm,
}: {
  onConfirm: () => void;
}) {
  const { setNodeURL } = useAuthStore();

  const [url, setURL] = useState("");
  const [error, setError] = useState("");

  const handleConfirm = () => {
    // TODO: validate url
    setError("");
    if (!isURL(url)) {
      setError("Invalid URL");
      return;
    }

    setNodeURL(url);
    onConfirm();
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="mb-2 block">
          <Label htmlFor="node_address" value="Node Address" />
        </div>
        <Input
          id="node_address"
          type="text"
          placeholder="Enter your node address"
          required
          value={url}
          onChange={(e) => setURL(e.target.value)}
          color={error ? "error" : undefined}
          helperText={
            <>
              <span className="text-medium text-error-300">{error}</span>
            </>
          }
        />
      </div>
      <Button type="primary" onClick={handleConfirm}>
        Continue
      </Button>
    </div>
  );
}
