import ImageBase from "@/components/ImageBase/ImageBase.tsx";
import Icon from "@/components/Icon";
import { useNodeResource } from "@/hooks/useNodeResource";
import { formatBytes, formatDisplayedNumber } from "@/utils";
import { useNodeUsage } from "@/hooks/useNodeUsage";
import { formatEther, formatUnits, hexToBigInt } from "viem";
import { useNodeBalance } from "@/hooks/useNodeBalance";
import { truncate } from "@/utils/string";
import { Tooltip } from "flowbite-react";

export default function Section1() {
  const { data: resource } = useNodeResource();
  const { data: nodeUsage } = useNodeUsage();
  const { data: nodeBalance } = useNodeBalance();

  return (
    <div
      className="flex w-full flex-col items-stretch gap-4 p-4 laptop:flex-row laptop:gap-6 laptop:p-6"
      style={{
        background:
          "linear-gradient(180deg, rgba(24, 24, 24, 0.00) 0%, #181818 100%), linear-gradient(180deg, #3C9 0%, #714CF9 100%)",
      }}
    >
      {/*Coin balance*/}
      <div className="flex w-full items-start gap-6 rounded-xl border border-[#3C9] bg-neutral-1000 p-6 laptop:items-center">
        <ImageBase.CoinBalance className="w-[60px] laptop:w-auto" />
        <div className="flex flex-1 flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="text-[10px] font-semibold text-neutral-700">
              BALANCE
            </div>
            <div className="flex items-center gap-2">
              <ImageBase.IconToken />
              <p className="text-[12px] laptop:text-base">
                {nodeBalance &&
                  formatDisplayedNumber(formatEther(BigInt(nodeBalance)))}{" "}
                U2U
              </p>
            </div>
          </div>
          <hr className="w-full border-[#343434]" />
          <div className="flex flex-col gap-2">
            <div className="text-[10px] font-semibold text-neutral-700">
              Total Subnet Contributional Units
            </div>
            <div className="flex items-center gap-2">
              <p className="text-[12px] laptop:text-base">23,721 SCU</p>
            </div>
          </div>
        </div>
      </div>

      {/*Explore*/}
      <div className="flex w-full items-start gap-6 rounded-xl border border-[#3C9] bg-neutral-1000 p-6 laptop:items-center">
        <ImageBase.Explorer className="w-[60px] laptop:w-auto" />
        <div className="flex flex-1 flex-col gap-3 laptop:gap-4">
          <div className="flex flex-col items-center gap-3 laptop:flex-row laptop:gap-0">
            <div className="flex w-full flex-col gap-2">
              <div className="text-[10px] font-semibold text-neutral-700">
                CPU
              </div>
              <div className="flex items-center gap-2">
                <Icon name="cpu" />
                <Tooltip content={resource?.cpu.name}>
                  <p className="text-[12px] laptop:text-base">
                    {resource?.cpu.name
                      ? truncate(resource?.cpu.name, 10, -1)
                      : "----"}
                  </p>
                </Tooltip>
              </div>
            </div>
            <div className="flex w-full flex-col gap-2">
              <div className="text-[10px] font-semibold text-neutral-700">
                GPU
              </div>
              <div className="flex items-center gap-2">
                <Icon name="gpu" />
                <p className="text-[12px] laptop:text-base">
                  {resource?.gpu.name || "----"}
                </p>
              </div>
            </div>
          </div>
          <hr className="hidden w-full border-[#343434] laptop:block" />
          <div className="flex items-center">
            <div className="flex w-full flex-col gap-2">
              <div className="text-[10px] font-semibold text-neutral-700">
                Storage
              </div>
              <div className="flex items-center gap-1">
                <Icon name="storage" />
                <p className="text-[12px] laptop:text-base">512GB</p>
              </div>
            </div>
            <div className="flex w-full flex-col gap-2">
              <div className="text-[10px] font-semibold text-neutral-700">
                RAM
              </div>
              <div className="flex items-center gap-1">
                <Icon name="ram" />
                <p className="text-[12px] laptop:text-base">
                  {resource?.memory.total
                    ? formatBytes(resource?.memory.total)
                    : "----"}
                </p>
              </div>
            </div>
            <div className="flex w-full flex-col gap-2">
              <div className="text-[10px] font-semibold text-neutral-700">
                Latency
              </div>
              <div className="flex items-center gap-1">
                <Icon name="network" />
                <p className="text-[12px] laptop:text-base">
                  {resource?.bandwidth?.latency
                    ? `${formatDisplayedNumber(
                        formatUnits(BigInt(resource?.bandwidth?.latency), 6),
                        // undefined,
                        // 2
                      )} ms
                    `
                    : "----"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/*Chart*/}
      <div className="flex w-full items-start gap-6 rounded-xl border border-[#3C9] bg-neutral-1000 p-6 laptop:items-center">
        <ImageBase.Chart className="w-[60px] laptop:w-auto" />
        <div className="flex flex-1 flex-col gap-4">
          <div className="flex w-full items-center justify-between">
            <div className="flex w-full flex-1 flex-col gap-2">
              <div className="text-[10px] font-semibold text-neutral-700">
                Status
              </div>
              <div className="flex items-center gap-2">
                <p className="text-[12px] laptop:text-base">
                  3 tasks are running
                </p>
              </div>
            </div>
            <a href="#" className="flex items-center gap-1">
              <p className="hidden text-sm text-[#3C9] laptop:block">
                Show all
              </p>
              <Icon name="plus" />
            </a>
          </div>
          <hr className="w-full border-[#343434]" />
          <div className="grid grid-cols-2 gap-3 laptop:grid-cols-4">
            <div className="flex w-full flex-col gap-2">
              <div className="text-[10px] font-semibold text-neutral-700">
                CPU USAGE
              </div>
              <div className="flex items-center gap-2">
                <p className="text-[12px] laptop:text-base">
                  {formatBytes(
                    Number(hexToBigInt(nodeUsage?.usedCpu ?? "0x0")),
                  )}
                </p>
              </div>
            </div>
            <div className="flex w-full flex-col gap-2">
              <div className="text-[10px] font-semibold text-neutral-700">
                GPU USAGE
              </div>
              <div className="flex items-center gap-2">
                <p className="text-[12px] laptop:text-base">
                  {formatBytes(
                    Number(hexToBigInt(nodeUsage?.usedGpu ?? "0x0")),
                  )}
                </p>
              </div>
            </div>
            <div className="flex w-full flex-col gap-2">
              <div className="text-[10px] font-semibold text-neutral-700">
                RAM USAGE
              </div>
              <div className="flex items-center gap-2">
                <p className="text-[12px] laptop:text-base">
                  {formatBytes(
                    Number(hexToBigInt(nodeUsage?.usedMemory ?? "0x0")),
                  )}
                </p>
              </div>
            </div>
            <div className="flex w-full flex-col gap-2">
              <div className="text-[10px] font-semibold text-neutral-700">
                INTERNET
              </div>
              <div className="flex items-center gap-2">
                <p className="text-[12px] laptop:text-base">
                  {formatBytes(
                    Number(
                      hexToBigInt(nodeUsage?.usedDownloadBytes ?? "0x0") +
                        hexToBigInt(nodeUsage?.usedUploadBytes ?? "0x0"),
                    ),
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
