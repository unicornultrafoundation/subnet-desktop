import Footer from "@renderer/components/Footer";
import APP_LOGO from "@/assets/images/app_logo.png"
import SetupSteps from "./SetupSteps";
import { useCallback, useEffect, useRef, useState } from "react";
import StepContent from "./StepContent";
import LogoU2U from '@/assets/images/logo-u2u.png';
import ISuccess from '@/assets/images/i-success.png';
import IFailed from '@/assets/images/i-failed.png';
import Button from "@renderer/components/Button";
import SetupNode from "./SetupNode";
import Installation from "./Installation";

export type SetupStep = {
  title: string;
  desc: string;
  hideTitle?: boolean;
}

const initialSteps: SetupStep[] = [
  { title: "Introduction", desc: "Node Desktop Installation provides Node through the use of a desktop application" },
  { title: "Setup Node", desc: "Node Desktop Installation provides Node through the use of a desktop application" },
  { title: "Installation", desc: "Node Desktop Application is getting installed" },
  { title: "Result", desc: "", hideTitle: true },
]

export default function SetupPage() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [steps,] = useState<SetupStep[]>(initialSteps);
  const [progress, setProgress] = useState(100);
  const [isInstallSuccess,] = useState(false);
  const interval = useRef<any>(null);
  const [nodeDetails, setNodeDetails] = useState({
    port: 0,
    username: '',
    password: '',
  });

  const renderStepContent = useCallback(() => {
    switch (currentStepIndex) {
      case 0:
        return <div className="w-full flex flex-col items-center pb-16">
          <img src={LogoU2U} width={'65%'} className="max-w-[710px]" />
          <Button type="primary" className="w-full" onClick={() => setCurrentStepIndex(1)}>
            <span className="font-semibold text-[14px]">INSTALL</span>
          </Button>
        </div>
      case 1:
        return <SetupNode
          onBack={() => setCurrentStepIndex(0)}
          onContinue={() => setCurrentStepIndex(2)}
          nodeDetails={nodeDetails}
          setNodeDetails={(type, value) => setNodeDetails({ ...nodeDetails, [type]: value })}
        />;
      case 2:
        return <Installation
          onBack={() => setCurrentStepIndex(1)}
          onContinue={() => setCurrentStepIndex(3)}
          progress={progress}
        />
      case 3:
        if (!isInstallSuccess) {
          return (
            <div className="w-full h-full flex flex-col items-center justify-center pb-16">
              <img src={IFailed} width={100} className="max-w-[710px]" />
              <div className="w-full text-center text-balance font-semibold text-[24px] pt-8">
                Installed Failed
              </div>
              <div className="w-3/4 text-center text-balance font-normal text-[16px] text-[#B4B4B4] pt-4">
                Ooops! There was something wrong about the installation process. Please try to restart your computer and install it again to make sure everything is running properly.
              </div>
              <Button type="secondary" className="!px-16 !py-3 mt-8" onClick={() => setCurrentStepIndex(1)}>
                <span className="font-semibold text-[14px]">GO BACK</span>
              </Button>
            </div>
          )
        }
        return (
          <div className="w-full h-full flex flex-col items-center justify-center pb-16">
            <img src={ISuccess} width={100} className="max-w-[710px]" />
            <div className="w-full text-center text-balance font-semibold text-[24px] pt-8">
              Installed Successfully
            </div>
            <div className="w-3/4 text-center text-balance font-normal text-[16px] text-[#B4B4B4] pt-4">
              Congratulations! You’ve successfully installed Node Desktop Application by U2U Network
            </div>
            <Button type="primary" className="!px-16 !py-3 mt-8" onClick={() => setCurrentStepIndex(1)}>
              <span className="font-semibold text-[14px]">FINISH</span>
            </Button>
          </div>
        )
      default:
        return null;
    }
  }, [currentStepIndex, nodeDetails, progress]);

  return (
    <main
      className="flex flex-col min-h-screen items-center justify-center bg-cover bg-center"
    >
      <div className="flex flex-row flex-1 w-full">
        <div className="fixed top-0 left-0 w-1/4 h-screen border-r-[1px] border-neutral-900 px-4 py-6 bg-neutral-1000">
          <div className="w-full flex flex-col">
            <div className="flex gap-[10px] items-center justify-start">
              <img src={APP_LOGO} alt="DePIN Subnet Node" className="w-10 h-10" />
              <span className="font-bold text-[20px]">Node Desktop</span>
            </div>
            <div className="w-full pt-6">
              <SetupSteps steps={steps} currentStepIndex={currentStepIndex} />
            </div>
          </div>
        </div>
        <div className="left-1/4 w-3/4 flex flex-col absolute">
          <div className="p-6 items-center justify-start border-b-[1px] border-neutral-900">
            <h4>Welcome to DePIN Subnet by U2U Network</h4>
          </div>
          <div
            style={{
              height: 'calc(100vh - 100px)',
            }}
            className="w-full overflow-y-auto">
            <StepContent currStep={initialSteps[currentStepIndex]}>
              {renderStepContent()}
            </StepContent>
          </div>
        </div>
      </div>
      <div className="w-full fixed bottom-0 left-0 bg-neutral-1000">
        <Footer />
      </div>
    </main>
  )
}
