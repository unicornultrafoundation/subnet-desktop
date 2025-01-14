import classNames from 'classnames'
import { FC } from 'react'
import { IconProps } from '@/components/ImageBase/ImageBase'

interface BaseProps extends IconProps {}

const IconSubnet: FC<BaseProps> = (props) => {
  const { ...rest } = props

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="33"
      viewBox="0 0 32 33"
      fill="none"
      {...rest}
      className={classNames(rest?.className ?? '')}
    >
      <path
        d="M4.39974 9.57443L15.9997 16.2411M15.9997 16.2411L27.5997 9.57443M15.9997 16.2411L16 29.5744M28 10.9078C27.9995 10.4401 27.8761 9.98084 27.6421 9.57597C27.408 9.17111 27.0717 8.83491 26.6667 8.60109L17.3333 3.26776C16.9279 3.03371 16.4681 2.91049 16 2.91049C15.5319 2.91049 15.0721 3.03371 14.6667 3.26776L5.33333 8.60109C4.92835 8.83491 4.59197 9.17111 4.35795 9.57597C4.12392 9.98084 4.00048 10.4401 4 10.9078V21.5744C4.00048 22.0421 4.12392 22.5013 4.35795 22.9062C4.59197 23.3111 4.92835 23.6473 5.33333 23.8811L14.6667 29.2144C15.0721 29.4485 15.5319 29.5717 16 29.5717C16.4681 29.5717 16.9279 29.4485 17.3333 29.2144L26.6667 23.8811C27.0717 23.6473 27.408 23.3111 27.6421 22.9062C27.8761 22.5013 27.9995 22.0421 28 21.5744V10.9078Z"
        stroke="#33CC99"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default IconSubnet
