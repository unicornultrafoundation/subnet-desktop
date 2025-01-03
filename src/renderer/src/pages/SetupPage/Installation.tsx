import { useState } from 'react'
import Button from '@renderer/components/Button'

type Props = {
  onContinue: () => void;
  onBack: () => void;
  progress: number;
}

const Installation: React.FC<Props> = ({ onBack, onContinue, progress }) => {
  const [isShowPassword, setIsShowPassword] = useState(false);

  return (
    <div className="w-full flex flex-col border-t-[1px] border-neutral-900 py-6 ">
      <div className='w-full flex flex-col gap-6'>
        <div className='w-full bg-[#272727] h-[52px] rounded-[8px] overflow-hidden'>
          <div
            style={{
              width: `${progress}%`,
              transition: 'width 0.1s ease-in-out',
            }}
            className="h-full bg-[#3C9]" />
        </div>
        <div className='w-full flex items-center justify-between'>
          <div className='text-[#33CC99] text-[16px] font-semibold'>
            {progress < 100 ? 'Installing' : 'Completed'} {Math.floor(progress)}%
          </div>
          <div className='text-[#8D8D8D] text-[16px] font-semibold'>
            Estimate ~14s
          </div>
        </div>
      </div>
      <div className='w-full flex items-center justify-between gap-6 mt-16'>
        <Button type="secondary" className='w-1/2' onClick={onBack}>
          <span className="font-semibold text-[14px]">GO BACK</span>
        </Button>
        <Button disabled={progress < 100} type="primary" className='w-1/2' onClick={onContinue}>
          <span className="font-semibold text-[14px]">CONTINUE</span>
        </Button>
      </div>
    </div>
  )
}

export default Installation;
