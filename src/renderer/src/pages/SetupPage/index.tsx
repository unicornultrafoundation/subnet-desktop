import BACKGROUND from '@renderer/assets/images/background.png'
import LOGO_FADE from '@renderer/assets/images/logo_fade.png'
import Installation from './Installation'

export type SetupStep = {
  title: string
  desc: string
  hideTitle?: boolean
}

export default function SetupPage() {
  return (
    <main
      className="flex flex-col min-h-screen items-center justify-center bg-cover bg-center"
      style={{
        backgroundImage: `url(${BACKGROUND})`
      }}
    >
      <div
        className="flex flex-row flex-1 w-full bg-contain bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${LOGO_FADE})`
        }}
      >
        <div className="w-full flex flex-col absolute">
          <div className="w-full h-screen overflow-y-auto p-6">
            <Installation />
          </div>
        </div>
      </div>
    </main>
  )
}
