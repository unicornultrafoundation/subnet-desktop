import React, { useMemo } from "react";
import { App, AppStatus } from "@/interface/app";
import Loading from "@/components/Loading";
import { useStartApp } from "@/hooks/useStartApp";
import { useStopApp } from "@/hooks/useStopApp";
import Button from "../Button";
import useToastNotification from "@/hooks/useToastNotification";
import EnvModal from "../EnvModal";

type Props = {
  appDetails: App;
  className?: string;
  isLoading?: boolean;
};

const AppHandlerButton: React.FC<Props> = ({
  appDetails,
  className = '',
  isLoading = false,
}) => {
  const { showToast } = useToastNotification();
  const runAppMutation = useStartApp(
    appDetails.id,
    () => {
      showToast("App started successfully", "success");
    },
    () => {
      showToast("Failed to start app", "error");
    },
  );
  const stopAppMutation = useStopApp(
    appDetails.id,
    () => {
      showToast("App stopped successfully", "success");
    },
    () => {
      showToast("Failed to stop app", "error");
    },
  );

  const isLoadingOrMutating = useMemo(() => {
    return isLoading || runAppMutation.isPending || stopAppMutation.isPending;
  }, [isLoading, runAppMutation.isPending, stopAppMutation.isPending]);

  return (
    <div className={`${className} flex w-full gap-6`}>
      <Button
        fill
        disabled={isLoadingOrMutating}
        onClick={() => {
          switch (appDetails.status) {
            case AppStatus.notfound:
              runAppMutation.mutate();
              break;
            case AppStatus.running:
              stopAppMutation.mutate();
              break;
            default:
              break;
          }
        }}
        type={appDetails.status === AppStatus.running ? "danger" : "primary"}
        className={`items-center justify-center gap-4 rounded-[12px] border border-solid py-4 text-[18px]  font-semibold tracking-[1px] disabled:cursor-not-allowed disabled:brightness-50`}
      >
        {isLoadingOrMutating ? (
          <Loading size={20} className="!py-1" />
        ) : appDetails.status === AppStatus.running ? (
          "SHUTDOWN"
        ) : (
          "RUN CLIENT"
        )}
      </Button>
      <EnvModal appDetails={appDetails} />
    </div>
  );
};

export default AppHandlerButton;
