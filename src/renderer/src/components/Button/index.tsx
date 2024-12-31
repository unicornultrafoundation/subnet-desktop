import { ReactNode, useMemo } from "react";

export default function Button({
  type = "primary",
  onClick,
  children,
  className,
  disabled,
  isProcessing,
  fill,
}: {
  type?: "primary" | "danger" | "secondary" | "info" | "transparent";
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  children?: ReactNode;
  disabled?: boolean;
  isProcessing?: boolean;
  fill?: boolean;
}) {
  const _className = useMemo(() => {
    switch (type) {
      case "primary":
        return "btn-primary";
      case "secondary":
        return "btn-secondary";
      case "danger":
        return "btn-danger";
      default:
        return "";
    }
  }, [type]);

  return (
    <button
      disabled={disabled}
      className={`rounded-[8px] px-[12px] py-[10px] text-white ${className} flex items-center justify-center gap-4 ${_className} ${fill && "w-full"}`}
      onClick={onClick}
    >
      {isProcessing && (
        <div
          style={{
            width: `24px`,
            height: `24px`,
          }}
          className={`loader`}
        />
      )}
      {children}
    </button>
  );
}
