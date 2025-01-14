import classNames from 'classnames'
import { FC } from 'react'
import { IconProps } from '@/components/ImageBase/ImageBase'

interface BaseProps extends IconProps {}

const IconPlus: FC<BaseProps> = (props) => {
  const { ...rest } = props

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      {...rest}
      className={classNames(rest?.className ?? '')}
    >
      <path
        d="M8.00032 2.66663V13.3204"
        stroke="#33CC99"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.3312 7.99368H2.66724"
        stroke="#33CC99"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default IconPlus
