import { Modal, Popover } from 'flowbite-react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { ReactNode, useState } from 'react'
import Button from '@/components/Button'
import U2U_WALLET from '@/assets/images/wallets/u2u.png'
import METAMASK_WALLET from '@/assets/images/wallets/metamask.png'
import WC_WALLET from '@/assets/images/wallets/wallet_connect.png'
import { HiChevronDown } from 'react-icons/hi2'
import { shortenAddress } from '@/utils/string'
import U2U_LOGO from '@/assets/images/u2u_logo.png'
import LogOutIcon from '@/components/Icon/LogOutIcon'
import CopyIcon from '../Icon/CopyIcon'

export default function ConnectWalletButton({
  className,
  trigger
}: {
  className?: string
  trigger?: (onClick: () => void) => ReactNode
}) {
  const { connectors, connect } = useConnect()
  const { disconnect } = useDisconnect()
  const account = useAccount()

  const [openModal, setOpenModal] = useState(false)

  const renderLogo = (connectorName: string) => {
    switch (connectorName) {
      case 'MetaMask':
        return METAMASK_WALLET
      case 'WalletConnect':
        return WC_WALLET
      default:
        return U2U_WALLET
    }
  }

  const handleDisconnect = () => {
    disconnect()
  }

  if (account.status === 'connected') {
    return (
      <Popover
        aria-labelledby="wallet-popover"
        arrow={false}
        content={
          <div className="mt-[20px] min-w-[333px] gap-2 rounded-md border-[1px] border-[#262626] bg-[#181818] p-2">
            <button
              className="flex w-full cursor-pointer items-center gap-2 rounded-[8px] px-3 py-2 hover:bg-[#1F2225]"
              // onClick={handleDisconnect}
            >
              <CopyIcon />
              <div className="w-full text-left text-[16px] leading-[24px] text-white">
                Copy Address
              </div>
            </button>
            <button
              className="flex w-full cursor-pointer items-center gap-2 rounded-[8px] px-3 py-2 hover:bg-[#1F2225]"
              onClick={handleDisconnect}
            >
              <LogOutIcon />
              <div className="w-full text-left text-[16px] leading-[24px] text-white">
                Disconnect
              </div>
            </button>
          </div>
        }
        theme={{
          base: 'absolute z-20 inline-block w-max max-w-[100vw] border-none bg-transparent shadow-sm outline-none'
        }}
      >
        <div>
          <Button type="primary" className="rounded-[8px] border-[1px] border-[#8C8C99]">
            <div className="flex items-center gap-2">
              <img src={U2U_LOGO} className="h-6 w-6" />
              <span className="text-[16px] font-[600] leading-[24px] text-white">
                {shortenAddress(account.address, 6, 6)}
              </span>
              <HiChevronDown size={14} color="white" />
            </div>
          </Button>
        </div>
      </Popover>
    )
  }

  return (
    <>
      {trigger ? (
        trigger(() => setOpenModal(true))
      ) : (
        <Button className={className} type="primary" onClick={() => setOpenModal(true)}>
          <div className="flex items-center justify-center gap-2">
            <span className="text-[14px] font-[600] leading-[24px] tracking-[1px]">
              Connect Wallet
            </span>
          </div>
        </Button>
      )}
      <Modal
        size="md"
        show={openModal}
        onClose={() => setOpenModal(false)}
        theme={{
          content: {
            inner: 'relative flex max-h-[90dvh] flex-col rounded-lg bg-[#1F2225]'
          },
          header: {
            title: 'text-[24px] font-[500] leading-[32px] text-white',
            base: 'flex items-start justify-between rounded-t p-5'
          }
        }}
      >
        <Modal.Header>Connect wallet</Modal.Header>
        <Modal.Body>
          <div className="space-y-3">
            {connectors.map((connector) => {
              // @ts-ignore
              // if (connector.name === 'Injected' && !window.u2u) {
              //   return null
              // }
              return (
                <button
                  className="flex w-full items-center justify-between rounded-lg border-[1px] border-[#383846] bg-[#1F1F1F] px-[24px] py-[18px] text-white hover:border-[#7EFFC5] hover:bg-[#4A4A4A]"
                  onClick={() => {
                    connect({ connector })
                    setOpenModal(false)
                  }}
                  key={`connector-${connector.name}`}
                >
                  <span>{connector.name}</span>
                  <img src={renderLogo(connector.name)} className="h-8 w-8" />
                </button>
              )
            })}
            <p className="text-[12px] leading-[16px] text-[#65636F]">
              Wallets are provided by External Providers and by selecting you agree to Terms of
              those Providers. Your access to the wallet might be reliant on the External Provider
              being operational.
            </p>
          </div>
        </Modal.Body>
      </Modal>
    </>
  )
}
