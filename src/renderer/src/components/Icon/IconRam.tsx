import classNames from 'classnames'
import { FC } from 'react'
import { IconProps } from '@/components/ImageBase/ImageBase'

interface BaseProps extends IconProps {}

const IconRam: FC<BaseProps> = (props) => {
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
        d="M2.33374 4.99988H22.3337C22.886 4.99988 23.3337 5.4476 23.3337 5.99988V14.9999C23.3337 15.5522 22.886 15.9999 22.3337 15.9999V17.9999C22.3337 18.5522 21.886 18.9999 21.3337 18.9999H13.9195L12.9195 17.9999H11.7479L10.7479 18.9999H3.33374C2.78146 18.9999 2.33374 18.5522 2.33374 17.9999V15.9999C1.78146 15.9999 1.33374 15.5522 1.33374 14.9999V5.99988C1.33374 5.44759 1.78146 4.99988 2.33374 4.99988ZM4.33374 15.9999V16.9999H9.91953L10.9195 15.9999H4.33374ZM13.7479 15.9999L14.7479 16.9999H20.3337V15.9999H13.7479ZM7.33374 8.99988H5.33374V11.9999H7.33374V8.99988ZM9.33374 8.99988V11.9999H11.3337V8.99988H9.33374ZM15.3337 8.99988H13.3337V11.9999H15.3337V8.99988ZM17.3337 8.99988V11.9999H19.3337V8.99988H17.3337Z"
        fill="#8D8D8D"
      />
    </svg>
  )
}

export default IconRam
