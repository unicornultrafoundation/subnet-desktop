import Icon from "@/components/Icon";
import ImageError from "@/assets/images/image-error.png";
import LogoError from "@/assets/images/logo-error.png";

import { Link, useNavigate } from "react-router-dom";
import { useGetAppDetails } from "@/hooks/useGetAppDetails";
import AppHandlerButton from "../AppHandlerButton";
import { formatNumberCompact } from "@/utils";
import { readableFileSize } from "@/utils/string";
import { Popover, Tooltip } from "flowbite-react";
import BookMarkIcon from "@/components/Icon/BookMarkIcon.tsx";
import IconViewDetail from "@/components/Icon/IconViewDetail.tsx";

interface CardItemProps {
  appId: `0x${string}`;
}

export default function CardItem(props: CardItemProps) {
  const { appId } = props;

  const navigate = useNavigate();

  const { data: appDetails, isLoading: isLoadingAppDetails } =
    useGetAppDetails(appId);

  return (
    <div className="relative flex flex-col overflow-hidden rounded-2xl bg-neutral-900">
      <div className="absolute right-3 top-3 z-50 flex items-center gap-1 rounded-lg border border-[#ffffff66] bg-[#303030bf] p-2  backdrop-blur-[60px]">
        <Icon
          name={appDetails?.status === "notfound" ? "dotInactive" : "dotActive"}
        />
        <p className="text-sm font-semibold uppercase">
          {appDetails?.status === "notfound" ? "offline" : "online"}
        </p>
      </div>
      <Link to={`/app/${appId}`} className="cursor-pointer">
        <img
          src={appDetails?.metadata?.appInfo?.logo}
          alt=""
          className="h-[11.5rem] w-full laptop:h-[15.6rem]"
          onError={(e) => {
            e.currentTarget.src = ImageError;
          }}
        />
      </Link>
      <div className="flex flex-col gap-6 p-4">
        <div className="flex justify-between">
          <div className="flex gap-4">
            <Link
              to={`/app/${appId}`}
              className="size-10 overflow-hidden rounded-full"
            >
              {/*<ImageBase.IconToken className="w-full"/>*/}
              <img
                src={appDetails?.metadata?.appInfo?.logo}
                alt=""
                className="w-full hover:cursor-pointer"
                onError={(e) => {
                  e.currentTarget.src = LogoError;
                }}
              />
            </Link>
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-1">
                <Link to={`/app/${appId}`}>
                  <Tooltip content={appDetails?.name}>
                    <p className="cursor-pointer font-semibold hover:underline truncate max-w-48">
                      {appDetails?.name || "----"}
                    </p>
                  </Tooltip>
                </Link>
                <p className="text-[12px] text-[#ffffff99]">
                  {formatNumberCompact(
                    Number(BigInt(appDetails?.node_count || 0)),
                  )}{" "}
                  Download
                </p>
              </div>
              <div className="flex items-center gap-4">
                {appDetails && (
                  <div className="flex items-center gap-1">
                    <Icon name="network" className="size-4" />
                    <Tooltip content="Minimum download bandwith">
                      <p className="text-[12px]">
                        {BigInt(appDetails?.min_download_bandwidth).toString()}{" "}
                        ms
                      </p>
                    </Tooltip>
                  </div>
                )}
                {appDetails && (
                  <div className="flex items-center gap-1">
                    <Icon name="ram" className="size-4" />
                    <Tooltip content="Minimum memory">
                      <p className="text-[12px]">
                        {readableFileSize(
                          Number(BigInt(appDetails?.min_memory)),
                        )}
                      </p>
                    </Tooltip>
                  </div>
                )}
                {appDetails && (
                  <div className="flex items-center gap-1">
                    <Icon name="cpu" className="size-4" />
                    <Tooltip content="Minimum CPU">
                      <p className="text-[12px]">
                        {readableFileSize(Number(BigInt(appDetails?.min_cpu)))}
                      </p>
                    </Tooltip>
                  </div>
                )}
              </div>
            </div>
          </div>
          <Popover
            aria-labelledby="wallet-popover"
            arrow={false}
            content={
              <div className="gap-2 rounded-md border-[1px] border-neutral-900 bg-neutral-1000 p-2">
                <button
                  className="flex w-full cursor-pointer items-center gap-2 rounded-[8px] px-3 py-2 hover:bg-[#1F2225]"
                  onClick={() => navigate(`/app/${appDetails?.id}`)}
                >
                  <IconViewDetail />
                  <div className="w-full text-left text-[16px] leading-[24px] text-white">
                    View detail
                  </div>
                </button>
                <button
                  className="flex w-full cursor-pointer items-center gap-2 rounded-[8px] px-3 py-2 hover:bg-[#1F2225]"
                  onClick={() => navigate(`/my-bookmarks`)}
                >
                  <BookMarkIcon />
                  <div className="w-full text-left text-[16px] leading-[24px] text-white">
                    Bookmark
                  </div>
                </button>
              </div>
            }
            theme={{
              base: "absolute z-20 inline-block w-max max-w-[100vw] border-none bg-transparent shadow-sm outline-none",
            }}
          >
            <div className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full transition-all delay-150 duration-300 hover:bg-[#181818]">
              <Icon name="more" />
            </div>
          </Popover>
        </div>
        {appDetails && (
          <AppHandlerButton
            isLoading={isLoadingAppDetails}
            appDetails={appDetails}
          />
        )}
      </div>
    </div>
  );
}
