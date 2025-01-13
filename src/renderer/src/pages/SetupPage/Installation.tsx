import { useGlobalStore } from '@renderer/state/global';
import { Spinner } from 'flowbite-react';
import { useEffect, useState } from 'react';

const Installation = () => {
  const {installProgress} = useGlobalStore()
  const [step, setStep] = useState<string>('')

  useEffect(() => {
    if (installProgress !== '') {
      console.log(installProgress)
      setStep(installProgress)
    }
  }, [installProgress])

  return (
    <div className="w-full flex flex-col pt-6 justify-end h-full">
      <div className='w-full flex flex-col gap-2 items-center'>
        <h3>
          Subnet Client by U2U Network
        </h3>
        <div className='text-white/50'>
          Starting node, please wait...
        </div>
      </div>
      {step && (
        <div className='flex w-full mt-12 justify-center items-center gap-4'>
          <Spinner className='loader' color="success" />
          <div className='body-sm text-white'>
            {step}
          </div>
        </div>
      )}
    </div>
  )
}

export default Installation;
