import CardItem from "@/components/Card";
import Icon from "@/components/Icon";
import { Link } from "react-router-dom";
export default function Section2() {
  const data = [
    {
      id: "0x1",
    },
  ];
  return (
    <div className="flex flex-col gap-4 px-4 py-6 laptop:gap-6 laptop:px-6 laptop:py-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Icon name="bookmark" />
          <p className="text-2xl font-semibold">Bookmark</p>
        </div>
        <Link
          to={`/my-bookmarks`}
          className="hidden cursor-pointer items-center gap-1 laptop:flex"
        >
          <p className="hidden text-sm text-[#3C9] laptop:block laptop:text-base">
            View all
          </p>
          <Icon name="arrowRight" />
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-6 laptop:grid-cols-4">
        {data.map((item) => (
          <CardItem key={item.id} appId={item.id as `0x${string}`} />
        ))}
      </div>
    </div>
  );
}
