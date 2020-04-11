import React, { createRef, useState } from "react";
import { Setting, SettingOptions } from "../../../__generated__/gqlTypes";
import { WithNamespaces, translate } from "react-i18next";

import { TextArea } from "../../components/input";
import { notify } from "react-notify-toast";
import styled from "styled-components";
import { uploadFile } from "../../server/util";

interface IMessagesProps extends WithNamespaces {
  updateOption: (option: SettingOptions, value: string) => void;
  data: { [option in SettingOptions]: Setting };
}
const Messages: React.FC<IMessagesProps> = ({ t, updateOption, data }) => {
  const parsedBanner = JSON.parse(data.banner.value);

  return (
    <div>
      <EditableImage
        name={SettingOptions.SiteLogo}
        updateOption={updateOption}
        image={data.site_logo.value}
        label="Upload Logo"
        height={50}
      />
      <EditableImage
        name={SettingOptions.SiteFavicon}
        updateOption={updateOption}
        image={data.site_favicon.value}
        label="Upload Favicon"
        height={20}
      />
      <EditableImage
        name={SettingOptions.Banner}
        updateOption={updateOption}
        image={parsedBanner.src}
        label="Upload Banner"
        addSize={true}
        height={100}
      />
      <br />
      <TextArea
        label="Write CSS to further customize the theme"
        rows={7}
        defaultValue={data.css.value || ""}
        placeholder="Additional CSS"
        onChange={e => updateOption(SettingOptions.Css, e.target.value)}
      />
    </div>
  );
};

export default translate("translations")(Messages);

interface IProps {
  image: string;
  updateOption: (name: SettingOptions, value: string) => void;
  name: SettingOptions;
  label: string;
  addSize?: boolean;
  height: number;
}
const EditableImage: React.FC<IProps> = ({
  image,
  updateOption,
  name,
  label,
  addSize,
  height,
}) => {
  const [src, setSrc] = useState<string>(image || "");
  const uploadInputRef = createRef<HTMLInputElement>();

  const update = (value: string, size: { width: number; height: number }) => {
    if (addSize) {
      const { width, height } = size;
      updateOption(name, JSON.stringify({ src: value, width, height }));
    } else {
      updateOption(name, value);
    }
    setSrc(value);
  };

  const upload = async (files: FileList | null) => {
    if (!files) return;
    const uploadedFiles = await uploadFile({ files });
    let { src, errors, size } = uploadedFiles[0];
    if (errors) {
      notify.show(errors, "error", 3000);
      return;
    }
    update(src, size);
  };

  const onUploadAction = e => {
    e.preventDefault();
    if (uploadInputRef.current) {
      uploadInputRef.current.click();
    }
  };

  const onDeleteAction = e => {
    e.preventDefault();
    update("", { width: 0, height: 0 });
  };

  const clickAction = !src ? onUploadAction : onDeleteAction;
  const actionLabel = !src ? "Upload" : "Delete";

  const notNullSrc =
    src ||
    "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
  return (
    <ImageWrapper hasImage={src !== ""}>
      <label className="custom-label">{label}</label>
      <div className="logo-wrapper">
        <div className="logo-image">
          <img src={notNullSrc} height={height} />
        </div>
        <a href="#" onClick={clickAction}>
          {actionLabel}
        </a>
      </div>
      <input
        ref={uploadInputRef}
        onChange={input => upload(input.target.files)}
        type="file"
        className="hide"
        name="uploads[]"
      />
    </ImageWrapper>
  );
};

const ImageWrapper = styled.div<{ hasImage: boolean }>`
  margin-top: 15px;
  margin-bottom: 15px;
  img {
    max-width: 400px;
    background: #eee;
  }
  a {
    text-transform: uppercase;
    font-size: 0.7rem;
    color: ${p => (p.hasImage ? "red" : "var(--color-base)")};
  }
  label {
    opacity: 0.6;
    font-weight: 400;
    font-size: 0.8rem;
    display: inline-block;
    max-width: 100%;
    margin-bottom: 15px;
  }
`;