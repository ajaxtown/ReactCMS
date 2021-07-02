import { useEffect, useRef, useState } from "react";
import { Upload, message } from "antd";
import { LoadingOutlined, PlusOutlined } from "@ant-design/icons";
import { IMediaUploadResult } from "@/graphql/types";
import { UploadChangeParam } from "antd/lib/upload";
import Modal from "antd/lib/modal/Modal";
import FileExplorer from "./file-explorer";
import { getBase64 } from "./../shared/utils";

interface IProps {
  url: string;
  name: string;
  onDone: (response: IMediaUploadResult[]) => void;
}
const ImageUpload = ({ url, onDone, name }: IProps) => {
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewTitle, setPreviewTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [fileList, setFileList] = useState<UploadChangeParam["fileList"]>([]);
  const [explorerVisible, setExplorerVisible] = useState(false);

  const ref = useRef();
  useEffect(() => {
    if (url) {
      // @ts-ignore
      setFileList([{ url, status: "done", uid: "1", size: 200, name }]);
    }
  }, [url]);

  const handleChange = async (info: UploadChangeParam) => {
    if (info.file.status === "uploading") {
      setLoading(true);
    } else if (info.file.status === "done") {
      setLoading(false);
      onDone(info.file.response);
      setFileList(info.fileList);
      return;
    } else if (info.file.status === "removed") {
      onDone([
        {
          src: "",
          name: "",
          error: "",
          size: { width: 0, height: 0, type: "" },
        },
      ]);
    }
    setFileList(info.fileList);
  };

  const handlePreview = async (file) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj);
    }

    setPreviewVisible(true);
    setPreviewUrl(file.url || file.preview);
    setPreviewTitle(
      file.name || file.url.substring(file.url.lastIndexOf("/") + 1),
    );
  };

  const uploadButton = (
    <div>
      {loading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>Upload</div>
    </div>
  );

  return (
    <>
      <div
        onClick={() => {
          if (fileList.length > 0) return;
          setExplorerVisible(true);
        }}
      >
        <Upload
          openFileDialogOnClick={false}
          name="avatar"
          listType="picture-card"
          className="avatar-uploader"
          showUploadList={true}
          action={process.env.basePath + "/api/uploadApi"}
          beforeUpload={beforeUpload}
          onChange={handleChange}
          fileList={fileList}
          onPreview={handlePreview}
          ref={ref}
        >
          {fileList.length === 0 && uploadButton}
        </Upload>
      </div>
      <Modal
        visible={previewVisible}
        title={previewTitle}
        footer={null}
        onCancel={() => {
          setPreviewVisible(false);
          setPreviewUrl("");
          setPreviewTitle("");
        }}
      >
        <img alt="example" style={{ width: "100%" }} src={previewUrl} />
      </Modal>
      <FileExplorer
        isVisible={explorerVisible}
        handleCancel={() => setExplorerVisible(false)}
        onInsert={async (files) => {
          const result: IMediaUploadResult[] = [];
          for (url in files) {
            const item = files[url];
            result.push({
              src: url,
              name: "does-not-matter",
              error: "",
              size: {
                width: item.width || 0,
                height: item.height || 0,
                type: "",
              },
            });
          }
          onDone(result);
          setExplorerVisible(false);
          return Promise.resolve(result);
        }}
      />
    </>
  );
};

export default ImageUpload;

export function beforeUpload(file: File) {
  const isJpgOrPng =
    file.type === "image/jpeg" ||
    file.type === "image/png" ||
    file.type === "image/webp";
  if (!isJpgOrPng) {
    message.error("You can only upload JPG/PNG file!");
  }
  const isLt2M = file.size / 1024 / 1024 < 2;
  if (!isLt2M) {
    message.error("Image must smaller than 2MB!");
  }
  return isJpgOrPng && isLt2M;
}
