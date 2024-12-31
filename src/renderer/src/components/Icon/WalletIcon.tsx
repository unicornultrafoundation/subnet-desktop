import { IconProps } from ".";

export default function WalletIcon({
  width,
  height,
  style,
  color,
}: Omit<IconProps, "name">) {
  const w = width || 24;
  const h = height || 24;

  return (
    <div
      style={{
        ...{
          width: w,
          height: h,
          aspectRatio: 1,
        },
        ...style,
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M21.6389 14.3957H17.5906C16.1042 14.3948 14.8993 13.1909 14.8984 11.7045C14.8984 10.218 16.1042 9.01409 17.5906 9.01318H21.6389"
          stroke={color || "white"}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M18.0485 11.6429H17.7369"
          stroke={color || "white"}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M7.74766 3H16.3911C19.2892 3 21.6388 5.34951 21.6388 8.24766V15.4247C21.6388 18.3229 19.2892 20.6724 16.3911 20.6724H7.74766C4.84951 20.6724 2.5 18.3229 2.5 15.4247V8.24766C2.5 5.34951 4.84951 3 7.74766 3Z"
          stroke={color || "white"}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M7.03564 7.5382H12.4346"
          stroke={color || "white"}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
