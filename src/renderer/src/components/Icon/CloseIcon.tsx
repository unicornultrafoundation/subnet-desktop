import { IconProps } from ".";

export default function CloseIcon({
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
          d="M18 6L6 18"
          stroke={color || "#8D8D8D"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6 6L18 18"
          stroke={color || "#8D8D8D"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
