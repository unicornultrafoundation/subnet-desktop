import { useGlobalStore } from '@renderer/state/global';
import { useEffect, useState } from 'react';

type Props = {
  progress: number;
}

const Installation: React.FC<Props> = ({ progress }) => {
  const {installProgress} = useGlobalStore()
  const [steps, setSteps] = useState<string[]>([])

  useEffect(() => {
    if (installProgress !== '') {
      console.log(installProgress)
      setSteps([...steps, ...[installProgress]])
    }
  }, [installProgress])

  return (
    <div className="w-full flex flex-col pt-6 pb-16">
      <div className='w-full flex flex-col gap-6'>
        <div className='w-full bg-[#272727] h-[52px] rounded-[8px] overflow-hidden'>
          <div
            style={{
              width: `${progress}%`,
              transition: 'width 0.1s ease-in-out',
            }}
            className={`h-full bg-[#3C9]`} />
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
      <div className='bg-red-500 h-[40px]'>
        {steps.map((step, index) => {
          return <div key={`step-${index}`}>{step}</div>
        })}
      </div>
      {/* <div className='w-full flex items-center justify-between gap-6 mt-16'>
        <Button
          type="secondary"
          className='w-1/2'
          onClick={() => {
            setSteps([])
            onBack()
          }}
        >
          <span className="font-semibold text-[14px]">GO BACK</span>
        </Button>
        <Button
          disabled={progress < 100}
          type="primary"
          className='w-1/2'
          onClick={() => {
            setSteps([])
            onContinue()
          }}
        >
          <span className="font-semibold text-[14px]">CONTINUE</span>
        </Button>
      </div> */}
    </div>
  )
}

export default Installation;
