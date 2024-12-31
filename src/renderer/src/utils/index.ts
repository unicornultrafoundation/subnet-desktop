import { formatUnits } from "viem";

export const truncate = ({
  str,
  headCount = 6,
  tailCount = 4,
}: {
  str: string;
  headCount?: number;
  tailCount?: number;
}) => {
  if (!str || headCount > str.length - tailCount) {
    return str;
  }
  return `${str.substring(0, headCount - 1)}...${str.substring(
    str.length - tailCount - 1,
  )}`;
};

export const formatDisplayedNumber = (
  value: string | number,
  threshold?: number,
  decimal?: number,
) => {
  if (threshold) {
    if (Number(value) < threshold) {
      return parseFloat(String(value)).toFixed(decimal || 2);
    }
  }

  if (!value) return "0.00";

  const usFormatter = Intl.NumberFormat("en-US", {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 3,
  });

  return usFormatter.format(Number(value));
};

export const formatDisplayedTokenAmount = (
  value?: bigint | string | number,
  decimal?: number,
) => {
  const _valueBN = typeof value === "bigint" ? value : BigInt(value || 0);
  const _value = formatUnits(_valueBN, decimal || 6).toString();

  return formatDisplayedNumber(_value, 1e4);
};

export function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KiB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export const formatNumberCompact = (value: number): string => {
  const formatter = new Intl.NumberFormat("en-US", {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1,
  });
  return formatter.format(value);
};
