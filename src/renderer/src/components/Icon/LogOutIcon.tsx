import { IconProps } from ".";

export default function LogOutIcon({
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
          d="M15.016 7.38948V6.45648C15.016 4.42148 13.366 2.77148 11.331 2.77148H6.45597C4.42197 2.77148 2.77197 4.42148 2.77197 6.45648V17.5865C2.77197 19.6215 4.42197 21.2715 6.45597 21.2715H11.341C13.37 21.2715 15.016 19.6265 15.016 17.5975V16.6545"
          stroke={color || "#8D8D8D"}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M21.8096 12.0215H9.76855"
          stroke={color || "#8D8D8D"}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M18.8811 9.1062L21.8091 12.0212L18.8811 14.9372"
          stroke={color || "#8D8D8D"}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}