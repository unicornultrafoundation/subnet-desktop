import classNames from "classnames";
import { FC } from "react";
import { IconProps } from "@/components/ImageBase/ImageBase.tsx";

interface BaseProps extends IconProps {}

const IconDotInactive: FC<BaseProps> = (props) => {
  const { ...rest } = props;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      {...rest}
      className={classNames(rest?.className ?? "")}
    >
      <path
        d="M7.99992 14.6638C11.6818 14.6638 14.6666 11.679 14.6666 7.99711C14.6666 4.31521 11.6818 1.33044 7.99992 1.33044C4.31802 1.33044 1.33325 4.31521 1.33325 7.99711C1.33325 11.679 4.31802 14.6638 7.99992 14.6638Z"
        fill="#B4B4B4"
      />
    </svg>
  );
};

export default IconDotInactive;
