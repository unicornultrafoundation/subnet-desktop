import classNames from 'classnames'
import { FC } from 'react'
import { IconProps } from '@/components/ImageBase/ImageBase'

interface BaseProps extends IconProps {}

const IconDotActive: FC<BaseProps> = (props) => {
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
        d="M8.00016 14.6639C11.682 14.6639 14.6668 11.6791 14.6668 7.99723C14.6668 4.31533 11.682 1.33057 8.00016 1.33057C4.31826 1.33057 1.3335 4.31533 1.3335 7.99723C1.3335 11.6791 4.31826 14.6639 8.00016 14.6639Z"
        fill="#5CD6AD"
      />
    </svg>
  )
}

export default IconDotActive
