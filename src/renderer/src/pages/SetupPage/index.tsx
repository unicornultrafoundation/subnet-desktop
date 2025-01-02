import Footer from "@renderer/components/Footer";
import APP_LOGO from "@/assets/images/app_logo.png"

export default function SetupPage() {
  return (
    <main
      className="flex flex-col min-h-screen items-center justify-center bg-cover bg-center"
    >
      <div className="flex flex-row flex-1 w-full">
        <div className="basis-1/4 border-r-[1px] border-neutral-900 px-4 py-6">
          <div className="flex gap-[10px] items-center justify-start">
            <img src={APP_LOGO} alt="DePIN Subnet Node" className="w-10 h-10" />
            <span>DePIN Subnet Node</span>
          </div>
        </div>
        <div className="basis-3/4">
          <div className="p-6 items-center justify-start border-b-[1px] border-neutral-900">
            <h4>Welcome to DePIN Subnet by U2U Network</h4>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}