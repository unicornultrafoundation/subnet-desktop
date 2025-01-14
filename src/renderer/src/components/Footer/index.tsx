export default function Footer() {
  return (
    <div className="flex justify-between items-center p-4 w-full border-t-[1px] border-neutral-900">
      <span className="body-md text-[#65636F]">© 2025 U2U Network. All rights reserved.</span>
      <div className="flex gap-4">
        <span>Version: 1.0.0</span>
        <div className="h-full w-[1px] bg-neutral-900" />
        <span>Network status: ONLINE</span>
      </div>
    </div>
  )
}
