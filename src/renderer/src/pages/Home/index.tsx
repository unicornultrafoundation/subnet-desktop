import Logo from '@/assets/images/logo.png'
import Port from '@/assets/images/port.png'
import IcoPort from '@/assets/images/svg/icon-location.svg'
import Password from '@/assets/images/password.png'
import IcoPassword from '@/assets/images/svg/icon-password.svg'
import NodeUsage from '@/assets/images/node-usage.png'
// import IcoChart from '@/assets/images/svg/icon-chart.svg';
import Username from '@/assets/images/username.png'
import IcoUsername from '@/assets/images/svg/icon-profile.svg'
import IcoShow from '@/assets/images/svg/icon-show.svg'
import { useMemo, useState } from 'react'
import Button from '@renderer/components/Button'
import { useNodeStatus } from '@renderer/hooks/useNodeStatus'
import { useNavigate } from 'react-router-dom'
import { useGlobalStore } from '@renderer/state/global'
import { useAuthStore } from '@renderer/state/auth'
import { useNodeConfig } from '@renderer/hooks/useNodeConfig'
// import { useNodeUsage } from '@renderer/hooks/useNodeUsage'
import LoginForm from './LoginForm'
// import { useCountRunningApp } from '@renderer/hooks/useCountRunningApp'
import { useNodeUsage } from '@renderer/hooks/useNodeUsage'
import { formatBytes } from '@renderer/utils'
import { hexToBigInt } from 'viem'
import Footer from '@renderer/components/Footer'

function HomePage() {
  const [isShowPassword, setIsShowPassword] = useState(false)

  const navigate = useNavigate()
  const { data: haveAccount } = useNodeStatus()
  const { data: nodeConfig } = useNodeConfig()
  const { data: nodeUsage } = useNodeUsage()
  // const { data: countRunningApp } = useCountRunningApp();

  const { token } = useGlobalStore()
  const authStore = useAuthStore()

  const nodeEndpoint = useMemo(() => {
    if (!nodeConfig || !nodeConfig.addresses || !nodeConfig.addresses.api) return ''
    const apiEndpoint = nodeConfig.addresses.api[0]
    if (!apiEndpoint) return ''

    const [_, __, ipAddress, ___, port] = apiEndpoint.split('/')
    return `http://${ipAddress}:${port}`
  }, [nodeConfig])

  if (!token) {
    return <LoginForm />
  }

  return (
    <main className="relative flex min-h-screen flex-col">
      <div className="p-6 flex gap-3 items-center justify-start border-b-[1px] border-neutral-900">
        <img src={Logo} width={40} height={40} alt="logo" />
        <h4>Node Desktop App by U2U Network</h4>
      </div>
      <div className="grid w-full grid-cols-1 flex-col flex-wrap py-6 px-10 justify-between tablet:grid-cols-2 laptop:grid-cols-2 desktop:grid-cols-2">
        <div className="flex gap-6 items-center pb-8">
          <img src={Port} width={124} height={124} alt="port-img" />
          <div className="flex-1 flex flex-col gap-4">
            <div className="font-semibold text-[14px] text-[#8D8D8D] tracking-[2px]">URL</div>
            <div className="flex items-center gap-2">
              <img src={IcoPort} width={24} height={24} alt="ico-port" />
              <div className="text-[18px] font-semibold">{nodeEndpoint}</div>
            </div>
          </div>
        </div>
        <div className="flex gap-6 items-center pb-8">
          <img src={NodeUsage} width={124} height={124} alt="port-img" />
          <div className="flex-1 flex flex-col gap-4">
            <div className="font-semibold text-[14px] text-[#8D8D8D] tracking-[2px]">
              NODE STATUS
            </div>
            <div className="flex items-center gap-2">
              {/* <img src={IcoChart} width={24} height={24} alt='ico-port' /> */}
              {/* <div className="text-[18px] font-semibold">{nodeStatus}</div> */}
              <div className="grid grid-cols-2 gap-3 laptop:grid-cols-4">
                <div className="flex w-full flex-col gap-2">
                  <div className="text-[10px] font-semibold text-neutral-700">
                    CPU USAGE
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-[12px] laptop:text-base">
                      {formatBytes(
                        Number(hexToBigInt(nodeUsage?.usedCpu ?? "0x0")),
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex w-full flex-col gap-2">
                  <div className="text-[10px] font-semibold text-neutral-700">
                    GPU USAGE
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-[12px] laptop:text-base">
                      {formatBytes(
                        Number(hexToBigInt(nodeUsage?.usedGpu ?? "0x0")),
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex w-full flex-col gap-2">
                  <div className="text-[10px] font-semibold text-neutral-700">
                    RAM USAGE
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-[12px] laptop:text-base">
                      {formatBytes(
                        Number(hexToBigInt(nodeUsage?.usedMemory ?? "0x0")),
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex w-full flex-col gap-2">
                  <div className="text-[10px] font-semibold text-neutral-700">
                    INTERNET
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-[12px] laptop:text-base">
                      {formatBytes(
                        Number(
                          hexToBigInt(nodeUsage?.usedDownloadBytes ?? "0x0") +
                            hexToBigInt(nodeUsage?.usedUploadBytes ?? "0x0"),
                        ),
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {haveAccount && (
          <>
            <div className="flex gap-6 items-center pb-8">
              <img src={Username} width={124} height={124} alt="port-img" />
              <div className="flex-1 flex flex-col gap-4">
                <div className="font-semibold text-[14px] text-[#8D8D8D] tracking-[2px]">
                  USERNAME
                </div>
                <div className="flex items-center gap-2">
                  <img src={IcoUsername} width={24} height={24} alt="ico-port" />
                  <div className="text-[18px] font-semibold">{authStore.username}</div>
                </div>
              </div>
            </div>
            <div className="flex gap-6 items-center pb-8">
              <img src={Password} width={124} height={124} alt="port-img" />
              <div className="flex-1 flex flex-col gap-4">
                <div className="font-semibold text-[14px] text-[#8D8D8D] tracking-[2px]">
                  PASSWORD
                </div>
                <div className="flex items-center gap-2">
                  <img src={IcoPassword} width={24} height={24} alt="ico-port" />
                  <div className="text-[18px] font-semibold">
                    <input
                      disabled
                      type={isShowPassword ? 'text' : 'password'}
                      value={authStore.password}
                      className="bg-transparent !outline-none !border-none !px-0 !py-0"
                    />
                  </div>
                  <button onClick={() => setIsShowPassword(!isShowPassword)}>
                    <img src={IcoShow} width={24} height={24} alt="ico-show" />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      {/* <Footer /> */}
      <div className="w-full flex flex-col items-center justify-center py-6 absolute bottom-0">
        {!haveAccount && (
          <div className='px-10'>
            <Button onClick={() => navigate('/setup')} type="primary" className="w-full !py-4">
              <span className="font-semibold text-[14px] tracking-[1px]">SETUP ACCOUNT</span>
            </Button>
          </div>
        )}
        <Footer />
      </div>
    </main>
  )
}

export default HomePage
