import { useGetAppDetails } from "@/hooks/useGetAppDetails";
import { useGetAppUsage } from "@/hooks/useGetAppUsage";
import React, { useState } from "react";
import { useParams } from "react-router-dom";
import discordImage from "@/assets/images/socials/discord.png";
import xImage from "@/assets/images/socials/x.png";
import linkedinImage from "@/assets/images/socials/linkedin.png";
import telegramImage from "@/assets/images/socials/telegram.png";
import shareImage from "@/assets/images/share.png";
import reportImage from "@/assets/images/report.png";
import { hexToBigInt } from "viem";
import { formatBytes } from "@/utils";
import NavigationHeader from "@/components/NavigationHeader";
import OverviewCarousel from "./OverviewCarousel";
import AppHandlerButton from "../../components/AppHandlerButton";
import LogoError from "@/assets/images/logo-error.png";
import Header from "@/components/Header";

const AppDetails: React.FC = () => {
  const [isImageError, setIsImageError] = useState(false);
  const params = useParams<{ appId: `0x${string}` }>();
  const {
    data: appDetails,
    isLoading: isLoadingAppDetails,
    isFetching: isFetchingAppDetails,
  } = useGetAppDetails(params.appId);
  const {
    data: appUsage,
    isError: isErrorAppUsage,
    isLoading: isLoadingAppUsage,
  } = useGetAppUsage(params.appId);

  const redirectPage = (url: string) => {
    window.open(url, "_blank");
  };

  return (
    <main className="flex min-h-screen flex-col">
      <Header />
      <NavigationHeader
        className="!tablet:w-4/5 !tablet:flex-row !desktop:w-4/5 !w-4/5"
        paths={[
          {
            clickable: true,
            label: "Home",
            path: "/",
          },
          {
            clickable: true,
            label: "All Subnet Nodes",
            path: "/apps",
          },
          {
            clickable: false,
            label: appDetails?.name ?? "",
            path: `/app/${params.appId}`,
          },
        ]}
      >
        <div className="flex w-full justify-center py-6">
          <div className="flex w-[90%] flex-col flex-wrap justify-between  gap-6 tablet:w-4/5 tablet:flex-row desktop:w-4/5 desktop:flex-row">
            <div className="flex w-full flex-col gap-6 desktop:w-3/5">
              <div className="flex w-full flex-row flex-wrap items-center rounded-[16px] border border-solid border-[#272A2F] p-6">
                <div className="size-8 tablet:size-16 desktop:size-16">
                  <img
                    src={
                      !isImageError
                        ? appDetails?.metadata.appInfo.logo
                        : LogoError
                    }
                    onError={() => setIsImageError(true)}
                    alt="app-logo"
                    className="size-8 tablet:size-16 desktop:size-16"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-1 pl-4">
                  <div className="text-[32px] font-medium">
                    {appDetails?.name}
                  </div>
                  <div className="cursor-pointer text-[16px] font-normal text-[#8D8D8D] hover:underline">
                    {appDetails?.metadata.appInfo.website}
                  </div>
                </div>
                {!isLoadingAppUsage && !isErrorAppUsage && appUsage && (
                  <div className="flex w-full flex-row pt-8">
                    <div className="flex w-1/3 flex-col gap-2 desktop:w-1/5">
                      <div className="text-[12px] font-semibold uppercase text-[#8D8D8D]">
                        CPU USAGE
                      </div>
                      <div className="text-[20px] font-medium uppercase text-white">
                        {formatBytes(
                          Number(hexToBigInt(appUsage.usedCpu ?? "0x0")),
                        )}
                      </div>
                    </div>
                    <div className="flex w-1/3 flex-col gap-2 desktop:w-1/5">
                      <div className="text-[12px] font-semibold uppercase text-[#8D8D8D]">
                        RAM USAGE
                      </div>
                      <div className="text-[20px] font-medium uppercase text-white">
                        {formatBytes(
                          Number(hexToBigInt(appUsage.usedMemory ?? "0x0")),
                        )}
                      </div>
                    </div>
                    <div className="flex w-1/3 flex-col gap-2 desktop:w-1/5">
                      <div className="text-[12px] font-semibold uppercase text-[#8D8D8D]">
                        GPU USAGE
                      </div>
                      <div className="text-[20px] font-medium uppercase text-white">
                        {formatBytes(
                          Number(hexToBigInt(appUsage.usedGpu ?? "0x0")),
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {appDetails && (
                  <AppHandlerButton
                    isLoading={isLoadingAppDetails || isFetchingAppDetails}
                    appDetails={appDetails}
                    className="mt-5 flex w-full tablet:hidden desktop:hidden"
                  />
                )}
              </div>

              <div className="flex w-full flex-row flex-wrap items-center rounded-[16px] border border-solid border-[#272A2F] p-6">
                <div className="flex w-full flex-row flex-wrap">
                  <div className="mb-7 flex w-full flex-col gap-2 tablet:w-1/2 desktop:w-1/2">
                    <div className="text-[12px] font-semibold uppercase text-[#33CC99]">
                      PROVIDER
                    </div>
                    <div className="text-[20px] font-medium text-white">
                      {appDetails?.name}
                    </div>
                  </div>
                  <div className="mb-7 flex w-full flex-col gap-2 tablet:w-1/2 desktop:w-1/2">
                    <div className="text-[12px] font-semibold uppercase text-[#33CC99]">
                      SIZE
                    </div>
                    <div className="text-[20px] font-medium text-white">
                      {appDetails?.metadata.containerConfig.resources.storage}
                    </div>
                  </div>
                  <div className="mb-7 flex w-full flex-col gap-2 tablet:mb-0 tablet:w-1/2 desktop:mb-0 desktop:w-1/2">
                    <div className="text-[12px] font-semibold uppercase text-[#33CC99]">
                      CATEGORY
                    </div>
                    <div className="text-[20px] font-medium text-white">
                      DePIN
                    </div>
                  </div>
                  <div className="flex w-full flex-col gap-2 tablet:w-1/2 desktop:w-1/2">
                    <div className="text-[12px] font-semibold uppercase text-[#33CC99]">
                      Compatibility
                    </div>
                    <div className="text-[20px] font-medium text-white">
                      Window, MacOS
                    </div>
                  </div>
                </div>
              </div>

              <OverviewCarousel />

              <div className="flex w-full flex-row flex-wrap items-center rounded-[16px] border border-solid border-[#272A2F] p-6">
                <div className="flex w-full text-[12px] font-semibold uppercase tracking-[2px] text-[#8D8D8D]">
                  Description
                </div>
                <div className="w-full pt-4 text-[16px] font-normal">
                  {appDetails?.metadata.appInfo.description}
                </div>
              </div>
            </div>
            <div className="flex-1">
              <div className="sticky top-10 flex flex-col gap-6">
                {appDetails && (
                  <AppHandlerButton
                    isLoading={isLoadingAppDetails || isFetchingAppDetails}
                    appDetails={appDetails}
                    className="hidden tablet:flex desktop:flex"
                  />
                )}
                <div className="flex w-full flex-row flex-wrap items-center rounded-[16px] border border-solid border-[#272A2F] p-6">
                  <div className="flex w-full flex-row flex-wrap">
                    <div className="flex w-1/2 flex-col gap-2">
                      <div className="text-[12px] font-semibold uppercase text-[#33CC99]">
                        TOKEN
                      </div>
                      <div className="text-[20px] font-medium text-white">
                        U2U
                      </div>
                    </div>
                    <div className="flex w-1/2 flex-col gap-2 text-right">
                      <div className="text-[12px] font-semibold uppercase text-[#33CC99]">
                        PRICE
                      </div>
                      <div className="text-[20px] font-medium text-white">
                        $ 0.007
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex w-full flex-row flex-wrap items-center rounded-[16px] border border-solid border-[#272A2F] p-6">
                  <div className="flex w-full flex-row flex-wrap">
                    <div className="w-full text-center text-[12px] font-semibold uppercase tracking-[2px] text-[#8d8d8d]">
                      Social links
                    </div>
                    <div className="flex w-full justify-center gap-6 pt-4">
                      <div
                        onClick={() => {
                          redirectPage(
                            appDetails?.metadata.contactInfo.github ?? "",
                          );
                        }}
                        className="cursor-pointer"
                      >
                        <img src={xImage} className="size-6" alt="x-image" />
                      </div>
                      <div className="cursor-pointer">
                        <img
                          src={telegramImage}
                          className="size-6"
                          alt="telegram-image"
                        />
                      </div>
                      <div className="cursor-pointer">
                        <img
                          src={discordImage}
                          className="size-6"
                          alt="discord-image"
                        />
                      </div>
                      <div className="cursor-pointer">
                        <img
                          src={linkedinImage}
                          className="size-6"
                          alt="linkedin-image"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex w-full justify-between gap-6">
                  <div className="flex flex-1 cursor-pointer flex-col items-center justify-center gap-3 rounded-[16px] border border-solid border-[#272A2F] p-6">
                    <img src={shareImage} className="size-6" alt="share-img" />
                    <div className="text-[20px] font-medium">Share</div>
                  </div>
                  <div className="flex flex-1 cursor-pointer flex-col items-center justify-center gap-3 rounded-[16px] border border-solid border-[#272A2F] p-6">
                    <img
                      src={reportImage}
                      className="size-6"
                      alt="report-img"
                    />
                    <div className="text-[20px] font-medium">Report</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </NavigationHeader>
    </main>
  );
};

export default AppDetails;
