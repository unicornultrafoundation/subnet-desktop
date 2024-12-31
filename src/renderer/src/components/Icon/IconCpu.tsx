import classNames from "classnames";
import { FC } from "react";
import { IconProps } from "@/components/ImageBase/ImageBase.tsx";

interface BaseProps extends IconProps {}

const IconCpu: FC<BaseProps> = (props) => {
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
        d="M6 17.9999H18V5.99988H6V17.9999ZM14 19.9999H10V21.9999H8V19.9999H5C4.44772 19.9999 4 19.5522 4 18.9999V15.9999H2V13.9999H4V9.99988H2V7.99988H4V4.99988C4 4.4476 4.44772 3.99988 5 3.99988H8V1.99988H10V3.99988H14V1.99988H16V3.99988H19C19.5523 3.99988 20 4.4476 20 4.99988V7.99988H22V9.99988H20V13.9999H22V15.9999H20V18.9999C20 19.5522 19.5523 19.9999 19 19.9999H16V21.9999H14V19.9999ZM8 7.99988H16V15.9999H8V7.99988Z"
        fill="#8D8D8D"
      />
    </svg>
  );
};

export default IconCpu;
