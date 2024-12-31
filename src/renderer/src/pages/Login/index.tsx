import BG from "@/assets/images/login_bg.png";
import { Card } from "flowbite-react";
import { useState } from "react";
import NodeAddressStep from "./NodeAddressStep";
import AuthStep from "./AuthStep";
import LOGO from "@/assets/images/app_logo.png";

export default function LoginPage() {
  const [step, setStep] = useState("NODE_ADDRESS");
  return (
    <main
      className="flex min-h-screen items-center justify-center bg-cover bg-center"
      style={{
        backgroundImage: `url(${BG})`,
      }}
    >
      <Card
        className="max-w-md flex-1"
        theme={{
          root: {
            base: "flex rounded-lg border border-neutral-800 bg-transparent shadow-md backdrop-blur-[100px]",
          },
        }}
      >
        <div className="flex flex-col items-center gap-6">
          <img src={LOGO} className="h-16 w-16" />
          <h4>Log In</h4>
        </div>
        <div className="flex gap-4">
          <div
            className="h-1 flex-1 cursor-pointer rounded-full bg-primary-500"
            onClick={() => setStep("NODE_ADDRESS")}
          />
          <div
            className={`h-1 flex-1 ${step === "AUTH" ? "bg-primary-500" : "bg-neutral-800"} rounded-full`}
          />
        </div>
        <div>
          <h6>Step {step === "NODE_ADDRESS" ? 1 : 2} / 2</h6>
        </div>
        {step === "NODE_ADDRESS" && (
          <NodeAddressStep onConfirm={() => setStep("AUTH")} />
        )}
        {step === "AUTH" && <AuthStep />}
      </Card>
    </main>
  );
}
