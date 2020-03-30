import { CoverImage, Post } from "../../../__generated__/gqlTypes";
import React, { Component } from "react";

import { EventBusInstance } from "../../../shared/eventBus";
import FileExplorerModal from "../modals/FileExplorerModal";
import LetterpadEditor from "letterpad-editor";
import PostActions from "./PostActions";
import PostTitle from "./PostTitle";
import ReactTooltip from "react-tooltip";
import StyledArticle from "./Article.css";
import { createGlobalStyle } from "styled-components";
import { uploadFile } from "../../server/util";

export enum MediaProvider {
  Unsplash = "unsplash",
  Letterpad = "letterpad",
}

interface IProps {
  theme: string;
  post: Post;
}
class Edit extends Component<IProps> {
  postSaveTimer: number = 0;
  hooks: any = null;
  editor: any = null;

  state = {
    fileExplorerOpen: false,
    mediaProvider: MediaProvider.Letterpad,
    pluginOperation: null, // enter the name of the plugin which is currently being overwritten.
  };

  imageInputRef = React.createRef<HTMLInputElement>();

  componentDidMount() {
    PostActions.setData(this.props.post);
  }

  onMediaBrowse = () => {
    this.setState({
      fileExplorerOpen: true,
      mediaProvider: MediaProvider.Letterpad,
    });
  };

  insertImageUrlInEditor = (images: { [url: string]: CoverImage }) => {
    const urls = Object.keys(images);
    const insertPromises = urls.map(url => {
      return new Promise((resolve, reject) => {
        try {
          this.editor.insertImageUrl(url);
          resolve();
        } catch (e) {
          reject();
          console.error(e);
        }
      });
    });
    return Promise.all(insertPromises);
  };

  toggleFileExplorer = () => {
    this.setState({
      fileExplorerOpen: !this.state.fileExplorerOpen,
      pluginOperation: null,
    });
  };

  onEditorChange = async change => {
    const { markdown, html } = change();
    if (markdown === PostActions.getData().md) return null;
    PostActions.setDraft({
      html,
      md: markdown,
    });
    clearInterval(this.postSaveTimer);
    this.postSaveTimer = setTimeout(async () => {
      const update = await PostActions.updatePost();
    }, 1000);
  };

  uploadImage = async (files: FileList) => {
    const uploadedFiles = await uploadFile({ files, type: "post_image" });
    return uploadedFiles[0].src;
  };

  uploadAndInsert = async (files: FileList) => {
    const uploadedFiles = await uploadFile({ files, type: "post_image" });
    uploadedFiles.forEach(item => {
      this.editor.insertImageUrl(item.src);
    });
  };

  onBeforeRender = editor => {
    this.editor = editor;
  };

  switchMediaProvider = (mediaProvider: MediaProvider) => {
    this.setState({ mediaProvider });
  };

  render() {
    const { post } = this.props;
    return (
      <StyledArticle className={post.type}>
        <div className="post-header">
          <PostTitle
            text={post.title}
            placeholder="Enter a title"
            onChange={(value: string) => {
              PostActions.setDraft({
                title: value,
              });
            }}
          />
        </div>
        <div className="post-content">
          <br />
          <br />
          <LetterpadEditor
            onImageBrowse={this.onMediaBrowse}
            getEditorInstance={this.onBeforeRender}
            //@ts-ignore
            uploadImage={(file: File) => this.uploadImage([file])}
            defaultValue={post.md}
            tooltip={Tooltip}
            onChange={this.onEditorChange}
            placeholder="Write a story.."
          />
          {this.state.fileExplorerOpen && (
            <FileExplorerModal
              mediaProvider={this.state.mediaProvider}
              switchProvider={this.switchMediaProvider}
              isOpen={this.state.fileExplorerOpen}
              onClose={this.toggleFileExplorer}
              onMediaInsert={this.insertImageUrlInEditor}
              addNewMedia={() => {
                const inputFile = this.imageInputRef.current;
                if (inputFile) {
                  inputFile.onchange = (change: any) => {
                    this.uploadAndInsert(change.target.files);
                    this.toggleFileExplorer();
                  };
                  inputFile.click();
                }
              }}
            />
          )}
        </div>
        <input
          ref={this.imageInputRef}
          className="hide post-image"
          type="file"
          multiple
        />
      </StyledArticle>
    );
  }
}

export default Edit;

const Tooltip: React.FC<any> = ({ children, tooltip }) => {
  return (
    <>
      <div data-tip={tooltip} className="flex" style={{ display: "flex" }}>
        {children}
      </div>
      <ReactTooltip />
    </>
  );
};
