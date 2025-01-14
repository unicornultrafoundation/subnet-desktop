import classNames from 'classnames'
import { FC } from 'react'
import { IconProps } from '@/components/ImageBase/ImageBase'

interface BaseProps extends IconProps {}

const IconNetwork: FC<BaseProps> = (props) => {
  const { ...rest } = props

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="25"
      height="24"
      viewBox="0 0 25 24"
      fill="none"
      {...rest}
      className={classNames(rest?.className ?? '')}
    >
      <path
        d="M1.35596 6.99659C4.44677 4.49704 8.38176 3 12.6664 3C16.951 3 20.886 4.49704 23.9769 6.99659L22.7201 8.55252C19.9727 6.3307 16.475 5 12.6664 5C8.85783 5 5.36006 6.3307 2.61267 8.55252L1.35596 6.99659ZM4.49774 10.8864C6.73 9.08119 9.57194 8 12.6664 8C15.7609 8 18.6028 9.08119 20.8351 10.8864L19.5783 12.4424C17.6895 10.9149 15.2848 10 12.6664 10C10.048 10 7.64329 10.9149 5.75446 12.4424L4.49774 10.8864ZM7.63954 14.7763C9.01323 13.6653 10.7621 13 12.6664 13C14.5707 13 16.3196 13.6653 17.6933 14.7763L16.4366 16.3322C15.4063 15.499 14.0946 15 12.6664 15C11.2382 15 9.92652 15.499 8.89625 16.3322L7.63954 14.7763ZM10.7813 18.6661C11.2965 18.2495 11.9523 18 12.6664 18C13.3805 18 14.0363 18.2495 14.5515 18.6661L12.6664 21L10.7813 18.6661Z"
        fill="#8D8D8D"
      />
    </svg>
  )
}

export default IconNetwork
