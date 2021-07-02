import {
  PostDocument,
  PostQuery,
  PostQueryVariables,
} from "@/__generated__/queries/queries.graphql";
import {
  UpdatePostDocument,
  UpdatePostMutation,
  UpdatePostMutationVariables,
} from "@/__generated__/queries/mutations.graphql";
import LetterpadEditor from "letterpad-editor";
import { initializeApollo } from "@/graphql/apollo";
import { Input, Layout, PageHeader, Tag, Tooltip } from "antd";
import { useRouter } from "next/router";
import Actions from "@/components/post-meta";
import {
  Image,
  PostStatusOptions,
  PostTypes,
  InputUpdatePost,
} from "@/__generated__/__types__";
import { useEffect, useState } from "react";
import { debounce, uploadFile, removeTypenames } from "./../../shared/utils";
import FileExplorer from "@/components/file-explorer";
import withAuthCheck from "../../hoc/withAuth";
import ErrorMessage from "@/components/ErrorMessage";
import { LoadingOutlined } from "@ant-design/icons";
import Head from "next/head";
import logger from "../../shared/logger";

const { Content } = Layout;

export enum MediaProvider {
  Unsplash = "unsplash",
  Letterpad = "letterpad",
}

const updatePostRequest = async (
  attrs: Omit<InputUpdatePost, "id">,
  postId: number,
) => {
  const apolloClient = await initializeApollo();
  return apolloClient.mutate<UpdatePostMutation, UpdatePostMutationVariables>({
    mutation: UpdatePostDocument,
    variables: {
      data: { ...removeTypenames(attrs), id: postId },
    },
  });
};
const debounceUpdatePost = debounce(updatePostRequest, 1000);

let editor;

function Post() {
  const router = useRouter();

  const [updating, setUpdating] = useState(false);
  const [post, setPost] = useState<PostQuery["post"]>();
  const [error, setError] = useState("");
  const [fileExplorerOpen, setFileExplorerOpen] = useState(false);
  const [postHash, setPostHash] = useState("");

  useEffect(() => {
    const { postId } = router.query;
    if (!postId) return;
    getPost(parseInt(postId as string)).then((data) => {
      if (data.__typename === "Post") {
        setPost(data);

        fetch(process.env.basePath + "/api/getPostHash?id=" + data.id)
          .then((res) => res.text())
          .then(setPostHash);
      }

      if (data.__typename === "PostError") {
        setError(data.message);
      }
    });
  }, [router]);

  if (!post || post.__typename !== "Post") {
    return <ErrorMessage title="Error" description={error} />;
  }

  const uploadImage = async (files: File[]) => {
    const uploadedFiles = await uploadFile({ files, type: "post_image" });
    return uploadedFiles[0].src;
  };

  const setPostAttribute = async (attrs: Omit<InputUpdatePost, "id">) => {
    // if post is already published and new content is added, then save this as draft
    if (post.status === PostStatusOptions.Published && attrs.md) {
      setPost({ ...post, md_draft: attrs.md });
    }
    // if the post is published or republished, remove draft
    else if (attrs.status === PostStatusOptions.Published) {
      setPost({ ...post, ...attrs, md_draft: "", md: post.md_draft });
    }
    // save the other attributes of post
    else {
      setPost({ ...post, ...attrs });
    }
    setUpdating(true);
    await debounceUpdatePost(attrs, post.id);
    setUpdating(false);
  };

  const onMediaBrowse = () => {
    setFileExplorerOpen(true);
  };

  const onFileExplorerClose = () => {
    setFileExplorerOpen(false);
  };

  const insertImageUrlInEditor = async (images: {
    [url: string]: Image & { alt: string };
  }) => {
    const urls = Object.keys(images);
    const insertPromises = urls.map((url) => {
      return new Promise((resolve, reject) => {
        try {
          editor.insertImageUrl(url, images[url].alt || "");
          resolve(true);
        } catch (e) {
          reject();
          logger.error(e);
        }
      });
    });
    return Promise.all(insertPromises);
  };

  const tagColor =
    post.status === PostStatusOptions.Published ? "green" : "orange";

  const isPost = post.type === PostTypes.Post;

  const setRef = (_editor) => {
    editor = _editor;
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Head>
        <title>Editing - {post.title}</title>
      </Head>
      <PageHeader
        className="site-page-header"
        title="&nbsp;"
        style={{ padding: 10 }}
        onBack={() => router.push(isPost ? "/posts" : "/pages")}
        extra={[
          <LoadingOutlined spin hidden={!updating} key="updating" />,
          <Actions
            key="actions"
            post={post}
            setPostAttribute={setPostAttribute}
            postHash={postHash}
            deletePost={() => {
              setPostAttribute({ status: PostStatusOptions.Trashed });
              router.push(isPost ? "/posts" : "/pages");
            }}
          />,
        ]}
        tags={<Tag color={tagColor}>{post.status}</Tag>}
      ></PageHeader>

      <Content style={{ margin: "24px 16px 0" }}>
        <div
          className="site-layout-background"
          style={{ maxWidth: 760, margin: "auto" }}
        >
          <Input.TextArea
            style={{
              padding: 0,
              fontSize: 38,
              lineHeight: 1,
              marginBottom: 40,
            }}
            value={post.title}
            rows={2}
            autoSize={true}
            placeholder="Enter a title"
            bordered={false}
            onChange={(e) => {
              setPostAttribute({ title: e.target.value });
            }}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                editor.focus();
              }
            }}
          />
          <LetterpadEditor
            dark={localStorage.theme === "dark"}
            getEditorInstance={setRef}
            onImageBrowse={onMediaBrowse}
            uploadImage={(file: File) => uploadImage([file])}
            defaultValue={post.md_draft || post.md}
            tooltip={_Tooltip}
            onChange={(change) => {
              const { html, markdown } = change();
              if (markdown !== post.md) {
                setPostAttribute({ html, md: markdown });
              }
            }}
            placeholder="Write a story.."
            // ref={setRef}
          />
          <style jsx global>{`
            .block-toolbar span span {
              display: block;
            }
          `}</style>
          <FileExplorer
            multi={true}
            isVisible={fileExplorerOpen}
            handleCancel={onFileExplorerClose}
            onInsert={insertImageUrlInEditor}
          />
        </div>
      </Content>
    </Layout>
  );
}

export default withAuthCheck(Post);

async function getPost(postId: number) {
  const apolloClient = await initializeApollo();
  const post = await apolloClient.query<PostQuery, PostQueryVariables>({
    query: PostDocument,
    variables: {
      filters: {
        id: postId,
      },
    },
  });
  return post.data.post;
}

const _Tooltip: React.FC<any> = ({ children, tooltip }) => {
  return (
    <Tooltip title={tooltip}>
      <span>{children}</span>
    </Tooltip>
  );
};
