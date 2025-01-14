import { IconProps } from '.'

export default function InstallAppIcon({ width, height, style, color }: Omit<IconProps, 'name'>) {
  const w = width || 24
  const h = height || 24

  return (
    <div
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
        <path
          d="M12.1223 15.436L12.1223 3.39502"
          stroke={color || '#8D8D8D'}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M15.0383 12.5083L12.1223 15.4363L9.20633 12.5083"
          stroke={color || '#8D8D8D'}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M16.7551 8.12793H17.6881C19.7231 8.12793 21.3721 9.77693 21.3721 11.8129V16.6969C21.3721 18.7269 19.7271 20.3719 17.6971 20.3719L6.55707 20.3719C4.52207 20.3719 2.87207 18.7219 2.87207 16.6869V11.8019C2.87207 9.77293 4.51807 8.12793 6.54707 8.12793L7.48907 8.12793"
          stroke={color || '#8D8D8D'}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}
