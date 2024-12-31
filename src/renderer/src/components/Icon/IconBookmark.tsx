import classNames from "classnames";
import { FC } from "react";
import { IconProps } from "@/components/ImageBase/ImageBase.tsx";

interface BaseProps extends IconProps {}

const IconBookmark: FC<BaseProps> = (props) => {
  const { ...rest } = props;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      {...rest}
      className={classNames(rest?.className ?? "")}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M15.5531 24.8422L7.64461 29.1747C7.01318 29.5029 6.23528 29.2706 5.88717 28.6499V28.6499C5.78646 28.4577 5.73213 28.2445 5.72852 28.0275V8.82996C5.72852 5.16863 8.23042 3.7041 11.8307 3.7041H20.2884C23.7789 3.7041 26.3906 5.071 26.3906 8.58587V28.0275C26.3906 28.3739 26.253 28.706 26.0081 28.9509C25.7632 29.1958 25.4311 29.3334 25.0847 29.3334C24.8638 29.3299 24.6467 29.2756 24.4501 29.1747L16.4928 24.8422C16.1996 24.6838 15.8463 24.6838 15.5531 24.8422Z"
        stroke="#33CC99"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11.1597 12.4302H20.8866"
        stroke="#33CC99"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default IconBookmark;
