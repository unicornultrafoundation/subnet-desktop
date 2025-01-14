import { ReactNode } from 'react'
import { Modal as FlowbiteModal, FlowbiteSizes } from 'flowbite-react'

export default function Modal({
  header,
  children,
  trigger,
  visible,
  setVisible,
  size = 'md'
}: {
  visible: boolean
  setVisible: (visible: boolean) => void
  header?: ReactNode
  children?: ReactNode
  trigger: (onClick: () => void) => ReactNode
  size?: keyof Omit<FlowbiteSizes, 'xs'>
}) {
  return (
    <>
      {trigger(() => setVisible(true))}
      <FlowbiteModal
        size={size}
        show={visible}
        onClose={() => setVisible(false)}
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
        {header && <FlowbiteModal.Header>{header}</FlowbiteModal.Header>}
        <FlowbiteModal.Body>{children}</FlowbiteModal.Body>
      </FlowbiteModal>
    </>
  )
}
