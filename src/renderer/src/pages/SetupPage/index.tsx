import Footer from "@renderer/components/Footer";
import { useMemo } from "react";
import Installation from "./Installation";
import { useGlobalStore } from "@renderer/state/global";

export type SetupStep = {
  title: string;
  desc: string;
  hideTitle?: boolean;
}

export default function SetupPage() {
  const { installProgress } = useGlobalStore()

  const progress = useMemo(() => {
    switch (installProgress) {
      case 'Installing containerd...':
        return 0
      case 'containerd installed successfully.':
      case 'Installing CNI plugins':
        return 25
      case 'CNI plugins installed successfully.':
        // setInstallSuccess(true)
        return 100
      default:
        return 0
    }
  }, [installProgress])

  return (
    <main
      className="flex flex-col min-h-screen items-center justify-center bg-cover bg-center"
    >
      <div className="flex flex-row flex-1 w-full">
        <div className="w-full flex flex-col absolute">
          <div
            style={{
              height: 'calc(100vh - 100px)',
            }}
            className="w-full overflow-y-auto p-6"
          >
            <Installation
              progress={progress}
            />
          </div>
        </div>
      </div>
      <div className="w-full fixed bottom-0 left-0 bg-neutral-1000">
        <Footer />
      </div>
    </main>
  )
}
