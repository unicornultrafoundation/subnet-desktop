import classNames from "classnames";
import { FC } from "react";
import { IconProps } from "@/components/ImageBase/ImageBase.tsx";

interface BaseProps extends IconProps {}

const IconArrowRight: FC<BaseProps> = (props) => {
  const { ...rest } = props;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      {...rest}
      className={classNames(rest?.className ?? "")}
    >
      <path
        d="M10 8L14 12L10 16"
        stroke="#33CC99"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default IconArrowRight;
