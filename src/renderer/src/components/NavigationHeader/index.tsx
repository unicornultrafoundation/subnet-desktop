import { useNavigate } from "react-router-dom";
import leftImg from "@/assets/images/left.png";

type NavigatePath = {
  path: string;
  label: string;
  clickable: boolean;
};

type Props = {
  children: React.ReactNode;
  paths: NavigatePath[];
  className?: string;
  title?: string;
};

const NavigationHeader: React.FC<Props> = ({
  children,
  paths,
  className = "",
  title = "",
}) => {
  const navigate = useNavigate();

  return (
    <div className={`flex flex-col flex-wrap items-center py-10`}>
      <div className={`${className} flex w-full items-center`}>
        {paths.map((path, i) => (
          <div key={path.path} className="flex items-center">
            <div
              onClick={() => path.clickable && navigate(path.path)}
              className={`text-[16px] font-medium ${path.clickable ? "cursor-pointer text-white hover:underline" : "cursor-default text-[#8D8D8D]"}`}
            >
              {path.label}
            </div>
            {i < paths.length - 1 && (
              <div className="ml-2 text-sm font-medium text-gray-500 hover:text-gray-700">
                / &nbsp;
              </div>
            )}
          </div>
        ))}
      </div>
      <div className={`${className} flex w-full items-center py-5`}>
        <button
          onClick={() => navigate(paths[paths.length - 2].path)}
          className="size-10 rounded-full"
        >
          <img src={leftImg} className="size-10" />
        </button>
        <div className="flex flex-1 items-center px-5 text-[20px] font-semibold text-white tablet:text-[32px] desktop:text-[32px]">
          {title}
        </div>
      </div>
      <div className="w-full">{children}</div>
    </div>
  );
};

export default NavigationHeader;
