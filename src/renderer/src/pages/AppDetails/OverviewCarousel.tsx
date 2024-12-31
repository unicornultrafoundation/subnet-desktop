import { EmblaCarouselType, EmblaOptionsType } from "embla-carousel";
import useEmblaCarousel from "embla-carousel-react";
import leftImage from "@/assets/images/left.png";
import { useCallback, useEffect, useState } from "react";

const placeholderImage =
  "https://assets.coingecko.com/posts/images/1311/large/What_is_Grass_Grass_Points_Airdrop.png?1715675046";

export default function OverviewCarousel() {
  const options: EmblaOptionsType = { loop: false };
  const [emblaRef, emblaApi] = useEmblaCarousel(options);
  const [prevBtnDisabled, setPrevBtnDisabled] = useState(true);
  const [nextBtnDisabled, setNextBtnDisabled] = useState(true);

  const onSelect = useCallback((emblaApi: EmblaCarouselType) => {
    setPrevBtnDisabled(!emblaApi.canScrollPrev());
    setNextBtnDisabled(!emblaApi.canScrollNext());
  }, []);

  useEffect(() => {
    if (!emblaApi) return;

    onSelect(emblaApi);
    emblaApi.on("reInit", onSelect).on("select", onSelect);
  }, [emblaApi, onSelect]);

  return (
    <div className="flex w-full flex-row flex-wrap items-center rounded-[16px] border border-solid border-[#272A2F] p-6">
      <div className="flex w-full items-center justify-between">
        <div className="text-[12px] font-semibold uppercase tracking-[2px] text-[#8D8D8D]">
          Overview
        </div>
        <div className="flex items-center gap-2">
          <button
            className="disabled:cursor-not-allowed disabled:brightness-[65%]"
            disabled={prevBtnDisabled}
            onClick={() => emblaApi?.scrollPrev()}
          >
            <img src={leftImage} alt="arrow-img" className="size-8" />
          </button>
          <button
            className="disabled:cursor-not-allowed disabled:brightness-[65%]"
            disabled={nextBtnDisabled}
            onClick={() => emblaApi?.scrollNext()}
          >
            <img
              src={leftImage}
              alt="arrow-img"
              className="size-8 rotate-180"
            />
          </button>
        </div>
      </div>
      <div className="w-full pt-5">
        <div className="w-full overflow-hidden" ref={emblaRef}>
          <div
            style={{
              display: "flex",
              touchAction: "pan-y pinch-zoom",
              marginLeft: "calc(1rem * -1)",
            }}
          >
            {Array(5)
              .fill("")
              .map((_, index) => (
                <div
                  style={{
                    transform: "translate3d(0, 0, 0)",
                    flex: "0 0 95%",
                    minWidth: 0,
                    paddingLeft: "1rem",
                  }}
                  key={index}
                >
                  <img src={placeholderImage} className="rounded-2xl" />
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
