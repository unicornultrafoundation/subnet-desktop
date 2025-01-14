import { SetupStep } from '.'

type Props = {
  currStep: SetupStep
  children: React.ReactNode
}

const StepContent: React.FC<Props> = ({ currStep, children }) => {
  const { title, desc } = currStep

  return (
    <div className="w-full h-full flex flex-col p-6">
      <div className="w-full flex flex-col">
        {!currStep.hideTitle && <div className="font-semibold text-[18px]">{title}</div>}
        <div className="font-normal text-[16px] pt-4 pb-6">{desc}</div>
      </div>
      <div className="w-full flex-1">{children}</div>
    </div>
  )
}

export default StepContent
