import { useEffect } from "react";

type ToastProps = {
  id: number;
  message: string;
  onClose: (id: number) => void;
  type: "info" | "success" | "error";
};

const ToastItem: React.FC<ToastProps> = ({ id, message, onClose, type }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, 5000); // Automatically dismiss after 5 seconds

    return () => clearTimeout(timer);
  }, [id, onClose]);

  return (
    <div
      className={`toast toast-${type} mt-2 animate-appear`}
      style={{
        pointerEvents: "all",
        padding: "10px 20px",
        borderRadius: "5px",
        backgroundColor:
          type === "success"
            ? "#00695C"
            : type === "error"
              ? "#f44336"
              : "#2962FF",
        color: "#fff",
        zIndex: 9999,
      }}
      onClick={() => onClose(id)}
    >
      {message}
    </div>
  );
};

export default ToastItem;
