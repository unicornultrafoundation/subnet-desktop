import { IconProps } from '.'

export default function SearchIcon({
  width,
  height,
  style,
  color,
  className
}: Omit<IconProps, 'name'>) {
  const w = width || 24
  const h = height || 24

  return (
    <div
      className={className}
      style={{
        ...{
          width: w,
          height: h,
          aspectRatio: 1
        },
        ...style
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="11.7666"
          cy="11.7664"
          r="8.98856"
          stroke={color || '#8D8D8D'}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M18.0183 18.4849L21.5423 21.9997"
          stroke={color || '#8D8D8D'}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}
