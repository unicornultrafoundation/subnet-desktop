import { IconProps } from '.'

export default function BookMarkIcon({ width, height, style, color }: Omit<IconProps, 'name'>) {
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
          fillRule="evenodd"
          clipRule="evenodd"
          d="M11.6648 18.6316L5.73346 21.8811C5.25989 22.1272 4.67646 21.953 4.41538 21.4875V21.4875C4.33985 21.3433 4.2991 21.1834 4.29639 21.0206V6.62247C4.29639 3.87647 6.17282 2.77808 8.87305 2.77808H15.2163C17.8341 2.77808 19.793 3.80325 19.793 6.4394V21.0206C19.793 21.2804 19.6898 21.5295 19.5061 21.7132C19.3224 21.8969 19.0733 22 18.8135 22C18.6479 21.9974 18.485 21.9567 18.3376 21.8811L12.3696 18.6316C12.1497 18.5128 11.8847 18.5128 11.6648 18.6316Z"
          stroke={color || '#8D8D8D'}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M8.36963 9.32266H15.6648"
          stroke={color || '#8D8D8D'}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}
