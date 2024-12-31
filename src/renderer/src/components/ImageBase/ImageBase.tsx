import React, { ImgHTMLAttributes } from "react";

import Logo from "@/assets/images/logo.png";
import CoinBalance from "@/assets/images/coin-balance.png";
import TokenIcon from "@/assets/images/token.png";
import Explorer from "@/assets/images/explorer.png";
import Chart from "@/assets/images/chart.png";
import Example from "@/assets/images/example.png";

export type IconProps = React.SVGProps<SVGSVGElement>;

const ImageBase = () => {
  return null;
};

export default ImageBase;

ImageBase.LogoFull = function (
  props: Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt">,
) {
  return <img alt="U2U Network" src={Logo} {...props} />;
};
ImageBase.CoinBalance = function (
  props: Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt">,
) {
  return <img alt="Coin balance" src={CoinBalance} {...props} />;
};
ImageBase.IconToken = function (
  props: Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt">,
) {
  return <img alt="Token icon" src={TokenIcon} {...props} />;
};
ImageBase.Explorer = function (
  props: Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt">,
) {
  return <img alt="Explorer" src={Explorer} {...props} />;
};
ImageBase.Chart = function (
  props: Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt">,
) {
  return <img alt="Chart" src={Chart} {...props} />;
};
ImageBase.Example = function (
  props: Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt">,
) {
  return <img alt="Icon Network" src={Example} {...props} />;
};
