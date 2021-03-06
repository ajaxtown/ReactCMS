import React, { useState } from "react";
import { Row, Col, Tooltip, Input, Drawer, Button, Space, Switch } from "antd";
import { EyeOutlined, SettingOutlined } from "@ant-design/icons";
import ImageUpload from "../ImageUpload";
import {
  InputUpdatePost,
  PostStatusOptions,
  PostTypes,
} from "@/__generated__/__types__";
import Tags from "./tags";
import { PostQuery } from "@/__generated__/queries/queries.graphql";
import { useSettingsQuery } from "@/graphql/queries/queries.graphql";

const { TextArea } = Input;

interface IProps {
  post: PostQuery["post"];
  setPostAttribute: (attrs: Omit<InputUpdatePost, "id">) => void;
  deletePost: () => void;
  postHash: string;
}
const Actions = ({ post, setPostAttribute, deletePost, postHash }: IProps) => {
  const [visible, setVisible] = useState(false);
  const settings = useSettingsQuery();

  const showDrawer = () => {
    setVisible(true);
  };
  const onClose = () => {
    setVisible(false);
  };

  if (post.__typename !== "Post") return null;

  const isPublished = post.status === PostStatusOptions.Published;
  const isPost = post.type === PostTypes.Post;
  const postVerb = isPost ? "Post" : "Page";
  const rePublishBtnDisabled = post.md_draft === "" || post.md_draft == post.md;

  return (
    <>
      <Tooltip title="Preview">
        <Button
          type="ghost"
          shape="circle"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => {
            if (settings.data?.settings.__typename === "Setting") {
              window.open(
                settings.data.settings.site_url + "/preview/" + postHash,
              );
            }
          }}
        />
      </Tooltip>
      <Button
        size="small"
        type="primary"
        disabled={rePublishBtnDisabled}
        onClick={() => {
          setPostAttribute({
            status: PostStatusOptions.Published,
          });
        }}
      >
        Republish
      </Button>
      <Button type="primary" onClick={showDrawer} size="small">
        <SettingOutlined />
      </Button>
      <Drawer
        title="Settings"
        placement="right"
        closable={false}
        onClose={onClose}
        visible={visible}
        width={320}
      >
        <Space direction="vertical" size="middle">
          <Row justify="space-between">
            <Col span={20}>Published</Col>
            <Col span={4}>
              <Switch
                size="small"
                checked={isPublished}
                onChange={(change) => {
                  setPostAttribute({
                    status: change
                      ? PostStatusOptions.Published
                      : PostStatusOptions.Draft,
                  });
                }}
              />
            </Col>
          </Row>
          <Row justify="space-between" hidden={!isPost}>
            <Col span={20}>Featured</Col>
            <Col span={4}>
              <Switch
                size="small"
                checked={post.featured}
                onChange={(change) => {
                  setPostAttribute({
                    featured: change,
                  });
                }}
              />
            </Col>
          </Row>
          <div>
            <label>{postVerb} Description</label>
            <TextArea
              showCount
              rows={3}
              maxLength={160}
              onChange={(e) => setPostAttribute({ excerpt: e.target.value })}
              value={post.excerpt}
            />
          </div>
          <div>
            <label>Path</label>
            <Input
              onChange={(e) => setPostAttribute({ slug: e.target.value })}
              value={post.slug}
            />
          </div>
          {isPost && <Tags post={post} setPostAttribute={setPostAttribute} />}
          <div>
            <label>Cover Image</label>
            <ImageUpload
              name="Cover Image"
              url={post.cover_image.src}
              onDone={([res]) => {
                setPostAttribute({
                  cover_image: {
                    src: res.src,
                    width: res.size.width,
                    height: res.size.height,
                  },
                });
              }}
            />
          </div>
          <Button type="primary" danger onClick={deletePost}>
            Delete {postVerb}
          </Button>
        </Space>
      </Drawer>
    </>
  );
};

export default Actions;
