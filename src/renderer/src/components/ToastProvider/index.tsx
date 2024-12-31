import React, { createContext, useState, ReactNode } from "react";
import ToastItem from "./ToastItem";

type ToastType = "info" | "success" | "error";

interface ToastData {
  id: number;
  message: string;
  type: ToastType;
}

export interface ToastContextType {
  addToast: (message: string, type: ToastType) => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(
  undefined,
);

interface ToastProviderProps {
  children: ReactNode;
}

const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = (message: string, type: ToastType) => {
    const id = new Date().getTime(); // Use timestamp as a unique ID
    setToasts((prevToasts) => [...prevToasts, { id, message, type }]);
  };

  const removeToast = (id: number) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      <div className="justify-top pointer-events-none fixed left-0 top-0 z-50 flex h-full w-full flex-col flex-wrap items-end pr-6 pt-2">
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            id={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={removeToast}
          />
        ))}
      </div>
      {children}
    </ToastContext.Provider>
  );
};

export default ToastProvider;
