import { CSSProperties } from "react";
import ProfileIcon from "./ProfileIcon";
import WalletIcon from "./WalletIcon";
import LogOutIcon from "./LogOutIcon";
import IconArrowRight from "@/components/Icon/IconArrowRight.tsx";
import IconBookmark from "@/components/Icon/IconBookmark.tsx";
import IconCpu from "@/components/Icon/IconCpu.tsx";
import IconDotActive from "@/components/Icon/IconDotActive.tsx";
import IconDotInactive from "@/components/Icon/IconDotInactive.tsx";
import IconGpu from "@/components/Icon/IconGpu.tsx";
import IconMore from "@/components/Icon/IconMore.tsx";
import IconNetwork from "@/components/Icon/IconNetwork.tsx";
import IconPlus from "@/components/Icon/IconPlus.tsx";
import IconRam from "@/components/Icon/IconRam.tsx";
import IconStorage from "@/components/Icon/IconStorage.tsx";
import IconSubnet from "@/components/Icon/IconSubnet.tsx";
import CopyIcon from "./CopyIcon";
import CloseIcon from "./CloseIcon";

export interface IconProps {
  name: string;
  width?: number;
  height?: number;
  color?: string;
  style?: CSSProperties;
  className?: string;
}

const Icon = (props: {
  name: string;
  width?: number;
  height?: number;
  color?: string;
  style?: CSSProperties;
  className?: string;
}) => {
  const renderIcon = () => {
    switch (props.name) {
      case "profile":
        return <ProfileIcon {...props} />;
      case "wallet":
        return <WalletIcon {...props} />;
      case "logout":
        return <LogOutIcon {...props} />;
      case "arrowRight":
        return <IconArrowRight {...props} />;
      case "bookmark":
        return <IconBookmark {...props} />;
      case "cpu":
        return <IconCpu {...props} />;
      case "dotActive":
        return <IconDotActive {...props} />;
      case "dotInactive":
        return <IconDotInactive {...props} />;
      case "gpu":
        return <IconGpu {...props} />;
      case "more":
        return <IconMore {...props} />;
      case "network":
        return <IconNetwork {...props} />;
      case "plus":
        return <IconPlus {...props} />;
      case "ram":
        return <IconRam {...props} />;
      case "storage":
        return <IconStorage {...props} />;
      case "subnet":
        return <IconSubnet {...props} />;
      case "copy":
        return <CopyIcon {...props} />;
      case "close":
        return <CloseIcon {...props} />;
      default:
        return null;
    }
  };

  return renderIcon();
};

export default Icon;
