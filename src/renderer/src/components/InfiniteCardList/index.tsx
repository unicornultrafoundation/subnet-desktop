import { App } from "@/interface/app";
import CardItem from "../Card";
import { useEffect, useRef } from "react";
import Loading from "../Loading";

type Props = {
  cards: App[];
  hasMore: boolean;
  fetchMore: () => void;
  isFetchingMore: boolean;
};

const InfiniteCardList: React.FC<Props> = ({
  cards,
  hasMore,
  fetchMore,
  isFetchingMore,
}) => {
  const pageEndRef = useRef(null);

  useEffect(() => {
    if (hasMore) {
      const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          fetchMore();
        }
      });

      if (pageEndRef.current) {
        observer.observe(pageEndRef.current);
      }

      return () => {
        if (pageEndRef.current) {
          observer.unobserve(pageEndRef.current);
        }
      };
    }
  }, [hasMore, fetchMore]);

  return (
    <div className="flex w-full flex-col items-center">
      <div className="grid w-full grid-cols-1 flex-col flex-wrap justify-between gap-6 px-4 tablet:grid-cols-2 laptop:grid-cols-2 laptop:px-6 desktop:w-4/5 desktop:grid-cols-3">
        {cards.map((item) => (
          <CardItem key={item.id} appId={item.id as `0x${string}`} />
        ))}
      </div>
      {hasMore ? (
        <div ref={pageEndRef} className=" w-full">
          {isFetchingMore ? <Loading className="w-full" size={30} /> : null}
        </div>
      ) : null}
    </div>
  );
};

export default InfiniteCardList;
