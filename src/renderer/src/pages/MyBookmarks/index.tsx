import InfiniteCardList from "@/components/InfiniteCardList";
import NavigationHeader from "@/components/NavigationHeader";
import { useGetAllApps } from "@/hooks/useGetAllApps";
import { App } from "@/interface/app";
import { useCallback, useEffect, useState } from "react";

export default function MyBookmarks() {
  const { data, isFetching } = useGetAllApps();
  const [cards, setCards] = useState<App[]>([]);
  const [isFetchingMore] = useState(false);

  useEffect(() => {
    if (!isFetching && data) {
      const cards = data.pages.flatMap((page) => page);
      setCards(cards);
    }
  }, [data, isFetching]);

  const handleFetchMore = useCallback(async () => {
    // setIsFetchingMore(true);
    // await new Promise((resolve) => setTimeout(resolve, 2000));
    // setCards((prevCards) => [...prevCards, ...prevCards]);
    // setIsFetchingMore(false);
  }, []);

  return (
    <NavigationHeader
      className="!tablet:w-4/5 !tablet:flex-row !desktop:w-4/5 !w-4/5"
      title="My Bookmarks"
      paths={[
        {
          clickable: true,
          label: "Home",
          path: "/",
        },
        {
          clickable: false,
          label: "My Bookmarks",
          path: "/my-bookmarks",
        },
      ]}
    >
      <div className="flex w-full justify-center px-0 py-6 tablet:px-0 desktop:px-0">
        <InfiniteCardList
          cards={cards}
          hasMore={true}
          fetchMore={handleFetchMore}
          isFetchingMore={isFetchingMore}
        />
      </div>
    </NavigationHeader>
  );
}
