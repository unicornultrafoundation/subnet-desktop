import { SetupStep } from '.'

type Props = {
  steps: SetupStep[]
  currentStepIndex: number
}

const SetupSteps: React.FC<Props> = ({ steps, currentStepIndex }) => {
  return (
    <div className="w-full flex flex-col">
      {steps.map((step, index) => (
        <div
          key={index}
          className={`flex rounded-[8px] items-center py-3 px-4 ${index === currentStepIndex ? 'bg-[#272727]' : 'transparent'}`}
        >
          <div
            className={`w-[10px] h-[10px] rounded-full flex items-center justify-center ${
              index <= currentStepIndex ? 'bg-[#33CC99]' : 'bg-[#363636]'
            }`}
          />
          <div
            className={`ml-3 text-[16px] font-semibold ${index <= currentStepIndex ? 'text-white' : 'text-[#363636]'}`}
          >
            {step.title}
          </div>
        </div>
      ))}
    </div>
  )
}

export default SetupSteps
