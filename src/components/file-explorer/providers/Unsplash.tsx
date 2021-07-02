import React, { useEffect, useState } from "react";

import InfiniteScrollList from "../InfiniteScrollList";
import { Media } from "@/__generated__/__types__";
import { Input } from "antd";

interface IProps {
  renderer: (items: Media[]) => JSX.Element[];
}
const Unsplash: React.FC<IProps> = ({ renderer }) => {
  const url = (process.env.basePath + "/api/unsplash").replace("//api", "");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Media[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  const fetchUnsplashMedia = async () => {
    // unsplash.com/page/1/query/forest
    const endpoint = url + "?page=" + page + "&query=" + query;

    const { rows, count }: { rows: any; count: number } = await fetch(
      endpoint,
    ).then((data) => {
      return data.json();
    });

    const images = {
      rows: rows.map((item) => {
        return {
          id: item.id,
          url: item.urls.regular,
          description: `Unsplash - ${item.user.name} | ${item.links.html}`,
          createdAt: item.created_at,
          width: item.width,
          height: item.height,
        };
      }),
      count,
    };

    setData([...data, ...images.rows]);

    setTotalCount(images.count);
  };

  useEffect(() => {
    fetchUnsplashMedia();
  }, [query, page]);

  const onKeyUp = async (e) => {
    const search = e.target.value.trim();
    if (search.length > 0) {
      if (e.keyCode === 13) {
        setQuery(search);
        setData([]);
      }
    }
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
  };

  const jsxElements = renderer(data);
  return (
    <div>
      <Input
        data-testid="input-unsplash"
        onKeyUp={onKeyUp}
        placeholder="Search free high resolution photos from Unsplash"
        autoFocus
      />
      <InfiniteScrollList
        data={jsxElements}
        count={totalCount}
        loadMore={loadMore}
      />
    </div>
  );
};

export default Unsplash;
