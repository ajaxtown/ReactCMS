import withAuthCheck from "../hoc/withAuth";
import {
  PostsDocument,
  PostsQuery,
  PostsQueryVariables,
} from "@/__generated__/queries/queries.graphql";
import { PostsFilters, PostTypes } from "@/__generated__/__types__";
import { useRouter } from "next/router";
import { initializeApollo } from "@/graphql/apollo";
import { Button, Layout, PageHeader, Table } from "antd";
const { Content } = Layout;
import CustomLayout from "@/components/layouts/Layout";
import { useEffect, useState } from "react";
import ErrorMessage from "@/components/ErrorMessage";
import Filters from "@/components/filters";
import Head from "next/head";
import { postsStyles } from "@/components/posts.css";
import { columns } from "@/components/posts";

function Pages() {
  const [loading, setLoading] = useState(true);
  const [postsNode, setPostsNode] = useState<PostsQuery["posts"]>({
    count: 0,
    rows: [],
  });
  const [filters, setFilters] = useState<PostsFilters>({});
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchPosts(filters);
  }, [JSON.stringify(filters)]);

  const fetchPosts = async (args = {}) => {
    const posts = await fetchPostsFromAPI(args);
    setLoading(false);
    if (posts.__typename === "PostsNode") {
      const rows = posts.rows.map((post) => {
        return {
          ...post,
          key: post.id,
        };
      });
      setPostsNode({ ...posts, rows });
    }

    if (posts.__typename === "PostError") {
      setError(posts.message);
    }
  };

  if (error) {
    return <ErrorMessage description={error} title="Error" />;
  }
  const source = postsNode.__typename === "PostsNode" ? postsNode.rows : [];
  return (
    <>
      <Head>
        <title>Pages</title>
      </Head>
      <PageHeader
        className="site-page-header"
        title="Pages"
        extra={[
          <Button
            key="1"
            type="primary"
            onClick={() => router.push(`/api/create?type=${PostTypes.Page}`)}
          >
            New Page
          </Button>,
        ]}
      ></PageHeader>
      <Content>
        <div className="site-layout-background" style={{ padding: 16 }}>
          <Filters
            onStatusChange={(status) => setFilters({ ...filters, status })}
            onOrderChange={(sortBy) => setFilters({ ...filters, sortBy })}
          />
          <Table
            columns={columns}
            dataSource={source}
            loading={loading}
            onRow={(row) => ({
              onClick: () => router.push("/post/" + row.id),
            })}
          />
        </div>
        <style jsx>{postsStyles}</style>
      </Content>
    </>
  );
}

const PagesWithAuth = withAuthCheck(Pages);
PagesWithAuth.layout = CustomLayout;
export default PagesWithAuth;

async function fetchPostsFromAPI(filters: PostsFilters) {
  const apolloClient = await initializeApollo();

  const post = await apolloClient.query<PostsQuery, PostsQueryVariables>({
    query: PostsDocument,
    variables: {
      filters: {
        type: PostTypes.Page,
        ...filters,
      },
    },
  });
  return post.data.posts;
}
