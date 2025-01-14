import { IconProps } from '.'

export default function ProfileIcon({ width, height, style, color }: Omit<IconProps, 'name'>) {
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
        <circle
          cx="11.5791"
          cy="7.27803"
          r="4.77803"
          stroke={color || '#8D8D8D'}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M4.00002 18.7013C3.99873 18.3654 4.07385 18.0336 4.2197 17.7311C4.67736 16.8157 5.96798 16.3306 7.03892 16.1109C7.81128 15.9461 8.59431 15.836 9.38217 15.7814C10.8408 15.6533 12.3079 15.6533 13.7666 15.7814C14.5544 15.8366 15.3374 15.9467 16.1099 16.1109C17.1808 16.3306 18.4714 16.77 18.9291 17.7311C19.2224 18.3479 19.2224 19.0639 18.9291 19.6807C18.4714 20.6418 17.1808 21.0812 16.1099 21.2917C15.3384 21.4633 14.5551 21.5766 13.7666 21.6304C12.5794 21.731 11.3866 21.7494 10.1968 21.6853C9.92221 21.6853 9.65677 21.6853 9.38217 21.6304C8.59663 21.5772 7.81632 21.464 7.04807 21.2917C5.96798 21.0812 4.68652 20.6418 4.2197 19.6807C4.0746 19.3746 3.99955 19.04 4.00002 18.7013Z"
          stroke={color || '#8D8D8D'}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}
