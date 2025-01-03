import Logo from '@/assets/images/logo.png';
import Port from '@/assets/images/port.png';
import IcoPort from '@/assets/images/svg/icon-location.svg';
import Password from '@/assets/images/password.png';
import IcoPassword from '@/assets/images/svg/icon-password.svg';
import NodeUsage from '@/assets/images/node-usage.png';
import IcoChart from '@/assets/images/svg/icon-chart.svg';
import Username from '@/assets/images/username.png';
import IcoUsername from '@/assets/images/svg/icon-profile.svg';
import IcoShow from '@/assets/images/svg/icon-show.svg';
import { useState } from 'react';
import Button from '@renderer/components/Button';

function HomePage() {
  const [isShowPassword, setIsShowPassword] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  return (
    <main className="relative flex min-h-screen flex-col">
      <div className="p-6 flex gap-3 items-center justify-start border-b-[1px] border-neutral-900">
        <img src={Logo} width={40} height={40} alt='logo' />
        <h4>Node Desktop App by U2U Network</h4>
      </div>
      <div className="grid w-full grid-cols-1 flex-col flex-wrap py-6 px-10 justify-between tablet:grid-cols-2 laptop:grid-cols-2 desktop:grid-cols-2">
        <div className='flex gap-6 items-center pb-8'>
          <img src={Port} width={124} height={124} alt='port-img' />
          <div className='flex-1 flex flex-col gap-4'>
            <div className='font-semibold text-[14px] text-[#8D8D8D] tracking-[2px]'>
              PORT
            </div>
            <div className='flex items-center gap-2'>
              <img src={IcoPort} width={24} height={24} alt='ico-port' />
              <div className='text-[18px] font-semibold'>https://192.168.1.1</div>
            </div>
          </div>
        </div>
        <div className='flex gap-6 items-center pb-8'>
          <img src={NodeUsage} width={124} height={124} alt='port-img' />
          <div className='flex-1 flex flex-col gap-4'>
            <div className='font-semibold text-[14px] text-[#8D8D8D] tracking-[2px]'>
              NODE USAGE
            </div>
            <div className='flex items-center gap-2'>
              <img src={IcoChart} width={24} height={24} alt='ico-port' />
              <div className='text-[18px] font-semibold'>0 MB/s</div>
            </div>
          </div>
        </div>
        <div className='flex gap-6 items-center pb-8'>
          <img src={Username} width={124} height={124} alt='port-img' />
          <div className='flex-1 flex flex-col gap-4'>
            <div className='font-semibold text-[14px] text-[#8D8D8D] tracking-[2px]'>
              USERNAME
            </div>
            <div className='flex items-center gap-2'>
              <img src={IcoUsername} width={24} height={24} alt='ico-port' />
              <div className='text-[18px] font-semibold'>admin</div>
            </div>
          </div>
        </div>
        <div className='flex gap-6 items-center pb-8'>
          <img src={Password} width={124} height={124} alt='port-img' />
          <div className='flex-1 flex flex-col gap-4'>
            <div className='font-semibold text-[14px] text-[#8D8D8D] tracking-[2px]'>
              PASSWORD
            </div>
            <div className='flex items-center gap-2'>
              <img src={IcoPassword} width={24} height={24} alt='ico-port' />
              <div className='text-[18px] font-semibold'>
                <input disabled type={isShowPassword ? 'text' : 'password'} value="12345" className='bg-transparent !outline-none !border-none !px-0 !py-0' />
              </div>
              <button onClick={() => setIsShowPassword(!isShowPassword)}><img src={IcoShow} width={24} height={24} alt='ico-show' /></button>
            </div>
          </div>
        </div>
      </div>
      <div className='w-full flex items-center py-6 px-10 absolute bottom-0'>
        <Button
          onClick={() => setIsRunning(!isRunning)}
          type={isRunning ? 'danger' : 'primary'} className='w-full !py-4'>
          <span className='font-semibold text-[14px] tracking-[1px]'>{isRunning ? 'STOP' : 'START'} RUNNING</span>
        </Button>
      </div>
    </main>
  );
}

export default HomePage;
