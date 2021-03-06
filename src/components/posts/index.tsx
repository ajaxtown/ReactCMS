import { getImageAttrs } from "@/graphql/utils/imageAttributs";
import { Image, PostStatusOptions, Tags } from "@/__generated__/__types__";
import { Breakpoint } from "antd/lib/_util/responsiveObserve";

export const columns = [
  {
    title: "Image",
    dataIndex: "cover_image",
    key: "cover_image",
    responsive: ["md"] as Breakpoint[],
    render: (cover_image: Image) => {
      if (!cover_image.src) return null;
      const imageAttrs = getImageAttrs(cover_image.src);
      return (
        <img
          {...imageAttrs}
          width={80}
          height={50}
          style={{ objectFit: "cover" }}
        />
      );
    },
  },
  {
    title: "Title",
    dataIndex: "title",
    key: "title",
    width: "45%",
  },
  // {
  //   title: "Description",
  //   dataIndex: "excerpt",
  //   key: "excerpt",
  //   width: "45%",
  //   responsive: ["md"] as Breakpoint[],
  // },
  {
    title: "Status",
    dataIndex: "status",
    key: "status",
    render: (status: PostStatusOptions) => (
      <span className={`post-status post-status-${status}`} />
    ),
  },
  {
    title: "Updated",
    dataIndex: "updatedAt",
    key: "updatedAt",
  },
];

export const postsColumns = [
  ...columns,
  {
    title: "Tags",
    dataIndex: "tags",
    key: "tags",
    responsive: ["md"] as Breakpoint[],
    render: (tags: Tags[]) => tags.map((tag) => tag.name).join(", "),
  },
];
