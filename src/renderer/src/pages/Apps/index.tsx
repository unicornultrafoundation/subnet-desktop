import Header from "@/components/Header";
import InfiniteCardList from "@/components/InfiniteCardList";
import NavigationHeader from "@/components/NavigationHeader";
import { useGetAllApps } from "@/hooks/useGetAllApps";
import { App } from "@/interface/app";
import { useCallback, useEffect, useState } from "react";

export default function Apps() {
  const { data, isLoading } = useGetAllApps();
  const [cards, setCards] = useState<App[]>([]);
  const [isFetchingMore] = useState(false);

  useEffect(() => {
    if (!isLoading && data) {
      const cards = data.pages.flatMap((page) => page);
      setCards(cards);
    }
  }, [data, isLoading]);

  const handleFetchMore = useCallback(async () => {
    // setIsFetchingMore(true);
    // cards.pages.forEach(page => {
    //     setCards(prevCards => [...prevCards, ...page]);
    // });
    // setIsFetchingMore(false);
  }, []);

  return (
    <main className="flex min-h-screen flex-col">
      <Header />
      <NavigationHeader
        className="!tablet:w-4/5 !tablet:flex-row !desktop:w-4/5 !w-4/5"
        title="All Subnet Nodes"
        paths={[
          {
            clickable: true,
            label: "Home",
            path: "/",
          },
          {
            clickable: false,
            label: "All Subnet Nodes",
            path: "/apps",
          },
        ]}
      >
        {!isLoading && cards.length > 0 && (
          <div className="flex w-full justify-center px-0 py-6 tablet:px-0 desktop:px-0">
            <InfiniteCardList
              cards={cards}
              hasMore={true}
              fetchMore={handleFetchMore}
              isFetchingMore={isFetchingMore}
            />
          </div>
        )}
      </NavigationHeader>
    </main>
  );
}
