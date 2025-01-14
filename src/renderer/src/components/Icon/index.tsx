import { CSSProperties } from 'react'
import ProfileIcon from './ProfileIcon'
import WalletIcon from './WalletIcon'
import LogOutIcon from './LogOutIcon'
import CopyIcon from './CopyIcon'
import CloseIcon from './CloseIcon'

export interface IconProps {
  name: string
  width?: number
  height?: number
  color?: string
  style?: CSSProperties
  className?: string
}

const Icon = (props: {
  name: string
  width?: number
  height?: number
  color?: string
  style?: CSSProperties
  className?: string
}) => {
  const renderIcon = () => {
    switch (props.name) {
      case 'profile':
        return <ProfileIcon {...props} />
      case 'wallet':
        return <WalletIcon {...props} />
      case 'logout':
        return <LogOutIcon {...props} />
      case 'copy':
        return <CopyIcon {...props} />
      case 'close':
        return <CloseIcon {...props} />
      default:
        return null
    }
  }

  return renderIcon()
}

export default Icon
