import { ToastContext, ToastContextType } from "@/components/ToastProvider";
import { useContext } from "react";

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
