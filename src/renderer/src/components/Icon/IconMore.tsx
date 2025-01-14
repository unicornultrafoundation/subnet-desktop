import classNames from 'classnames'
import { FC } from 'react'
import { IconProps } from '@/components/ImageBase/ImageBase'

interface BaseProps extends IconProps {}

const IconMore: FC<BaseProps> = (props) => {
  const { ...rest } = props

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      {...rest}
      className={classNames(rest?.className ?? '')}
    >
      <path
        d="M10 4.00269C10 2.89918 10.8969 2.00269 11.9992 2.00269C13.1015 2.00269 14 2.89918 14 4.00269C14 5.10619 13.1015 6.00269 11.9992 6.00269C10.8969 6.00269 10 5.10619 10 4.00269Z"
        fill="white"
      />
      <path
        d="M10 12.0027C10 10.8992 10.8969 10.0027 11.9992 10.0027C13.1015 10.0027 14 10.8992 14 12.0027C14 13.1062 13.1015 14.0027 11.9992 14.0027C10.8969 14.0027 10 13.1062 10 12.0027Z"
        fill="white"
      />
      <path
        d="M10 20.0027C10 18.8992 10.8969 18.0027 11.9992 18.0027C13.1015 18.0027 14 18.8992 14 20.0027C14 21.1062 13.1015 22.0027 11.9992 22.0027C10.8969 22.0027 10 21.1062 10 20.0027Z"
        fill="white"
      />
    </svg>
  )
}

export default IconMore
