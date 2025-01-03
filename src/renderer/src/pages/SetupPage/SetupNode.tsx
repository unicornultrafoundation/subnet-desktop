import Location from '@/assets/images/location.png'
import Profile from '@/assets/images/profile.png'
import Password from '@/assets/images/password.png'
import Show from '@/assets/images/show.png'
import { useState } from 'react'
import Button from '@renderer/components/Button'

type Props = {
  onContinue: () => void;
  onBack: () => void;
  nodeDetails: {
    port: string;
    username: string;
    password: string;
  }
  setNodeDetails: (type: 'port' | 'username' | 'password', value: string) => void;
}

const SetupNode: React.FC<Props> = ({ onBack, onContinue, nodeDetails, setNodeDetails }) => {
  const [isShowPassword, setIsShowPassword] = useState(false);

  return (
    <div className="w-full flex flex-col border-t-[1px] border-neutral-900 py-6 ">
      <div className='w-full flex flex-col gap-6'>
        <div className="w-full flex flex-col gap-3">
          <div className="w-full text-[14px] font-semibold">
            Port
          </div>
          <div className="w-full rounded-[8px] bg-[#272727] p-3 flex flex-row gap-2">
            <img src={Location} width={24} height={24} />
            <input
              className="flex-1 bg-transparent outline-none font-medium text-[16px]"
              placeholder="Enter your port"
              value={nodeDetails.port}
              onChange={(e) => setNodeDetails('port', e.target.value)} />
          </div>
        </div>
        <div className="w-full flex flex-col gap-3">
          <div className="w-full text-[14px] font-semibold">
            Username
          </div>
          <div className="w-full rounded-[8px] bg-[#272727] p-3 flex flex-row gap-2">
            <img src={Profile} width={24} height={24} />
            <input
              className="flex-1 bg-transparent outline-none font-medium text-[16px]"
              placeholder="Enter your username"
              value={nodeDetails.username}
              onChange={(e) => setNodeDetails('username', e.target.value)} />
          </div>
        </div>
        <div className="w-full flex flex-col gap-3">
          <div className="w-full text-[14px] font-semibold">
            Password
          </div>
          <div className="w-full rounded-[8px] bg-[#272727] p-3 flex flex-row gap-2 justify-between items-center">
            <img src={Password} className='w-6 h-6' />
            <input
              className="flex-1 !py-0 !px-0 bg-transparent !outline-none !border-none font-medium text-[16px]"
              placeholder="Enter your password"
              type={isShowPassword ? 'text' : 'password'}
              value={nodeDetails.password}
              onChange={(e) => setNodeDetails('password', e.target.value)} />
            <button
              onClick={() => setIsShowPassword(!isShowPassword)}
              className="!p-0 !m-0 !border-none !outline-none !bg-transparent">
              <img src={Show} width={24} height={24} />
            </button>
          </div>
        </div>
      </div>
      <div className='w-full flex items-center justify-between gap-6 mt-16'>
        <Button type="secondary" className='w-1/2' onClick={onBack}>
          <span className="font-semibold text-[14px]">GO BACK</span>
        </Button>
        <Button type="primary" className='w-1/2' onClick={onContinue}>
          <span className="font-semibold text-[14px]">CONTINUE</span>
        </Button>
      </div>
    </div>
  )
}

export default SetupNode;