import React, { useState, createRef } from "react";
import { translate, WithNamespaces } from "react-i18next";
import styled from "styled-components";
import { notify } from "react-notify-toast";

import { uploadFile } from "../../server/util";
import Input, { TextArea } from "../../components/input";
import StyledSelect from "../../components/select";
import { SettingOptions } from "../../../../types/globalTypes";
import { getOptions_settings } from "../../../shared/queries/types/getOptions";
import config from "../../../config";

const ImageWrapper = styled.div`
  margin-top: 15px;
  margin-bottom: 15px;
  .logo-image,
  .banner-image {
    display: flex;
    align-items: center;
  }
  label {
    color: var(--base-shade-3);
    font-weight: 500;
    font-size: 13px;
    display: inline-block;
    max-width: 100%;
    margin-bottom: 15px;
  }
  .material-icons {
    font-size: 18px !important;
  }
  .danger {
    color: #9e1b1b;
  }
`;

interface IGeneralProps extends WithNamespaces {
  data: { [option in SettingOptions]: getOptions_settings };
  updateOption: (option: SettingOptions, value: string) => void;
  label: string;
}

const General: React.FC<IGeneralProps> = ({ data, updateOption, t, i18n }) => {
  const [banner, setBanner] = useState<string>(data.banner.value || "");
  const [site_logo, setSiteLogo] = useState<string>(data.site_logo.value || "");

  const uploadLogoInputRef = createRef<HTMLInputElement>();
  const uploadBannerRef = createRef<HTMLInputElement>();

  const { langOptions, selectedLanguage } = getLanguageOptions(
    data.locale.value,
  );

  const switchLanguage = (value: string) => {
    const locales = {};
    Object.keys(langOptions).map(lang => {
      locales[lang] = value === lang;
    });
    updateOption(SettingOptions.locale, JSON.stringify(locales));
    i18n.changeLanguage(value);
  };

  const updateBanner = (banner: string) => {
    updateOption(SettingOptions.banner, banner);
    setBanner(banner);
  };

  const updateLogo = (site_logo: string) => {
    updateOption(SettingOptions.site_logo, site_logo);
    setSiteLogo(site_logo);
  };

  const uploadBanner = async (files: FileList | null) => {
    if (!files) return;
    const uploadedFiles = await uploadFile({ files });
    let { src, errors } = uploadedFiles[0];
    if (errors) {
      notify.show(errors, "error", 3000);
      return;
    }
    updateBanner(src);
  };

  const uploadLogo = async (files: FileList | null) => {
    if (!files) return;
    const uploadedFiles = await uploadFile({ files });
    let { src, errors } = uploadedFiles[0];
    if (errors) {
      notify.show(errors, "error", 3000);
      return;
    }
    updateLogo(src);
  };

  return (
    <div>
      <Input
        label={t("settings.general.site.title")}
        defaultValue={data.site_title.value}
        type="text"
        placeholder={t("settings.general.site.title.placeholder")}
        onBlur={e => updateOption(SettingOptions.site_title, e.target.value)}
      />
      <Input
        label={t("settings.general.site.tagline")}
        defaultValue={data.site_tagline.value}
        type="text"
        placeholder={t("settings.general.site.tagline.placeholder")}
        onBlur={e => updateOption(SettingOptions.site_tagline, e.target.value)}
      />
      <Input
        label={t("settings.general.site.email")}
        defaultValue={data.site_email.value}
        type="email"
        placeholder="someone@somewhere.com"
        onBlur={e => updateOption(SettingOptions.site_email, e.target.value)}
      />
      <TextArea
        label={t("settings.general.site.description")}
        defaultValue={data.site_description.value}
        placeholder={t("settings.general.site.description.placeholder")}
        onBlur={e =>
          updateOption(SettingOptions.site_description, e.target.value)
        }
      />
      <Input
        label={t("settings.general.site.url")}
        defaultValue={data.site_url.value}
        type="text"
        placeholder={t("settings.general.site.url.placeholder")}
        onBlur={e => updateOption(SettingOptions.site_url, e.target.value)}
      />
      <TextArea
        label={t("settings.general.site.footer") + "(html allowed)"}
        defaultValue={data.site_footer.value}
        className="form-control"
        placeholder={t("settings.general.site.footer.placeholder")}
        onBlur={e => updateOption(SettingOptions.site_footer, e.target.value)}
      />
      <ImageWrapper>
        <label className="custom-label">Upload Logo</label>
        <div className="logo-wrapper">
          {!site_logo ? (
            <a
              href="#"
              onClick={e => {
                e.preventDefault();
                if (uploadLogoInputRef.current) {
                  uploadLogoInputRef.current.click();
                }
              }}
            >
              <i className="material-icons">add</i>
            </a>
          ) : (
            <div className="logo-image">
              <img width="100" alt="" src={config.baseName + site_logo} />
              <a
                href="#"
                onClick={e => {
                  e.preventDefault();
                  updateLogo("");
                }}
              >
                <i className="material-icons danger">delete</i>
              </a>
            </div>
          )}
        </div>
        <input
          ref={uploadLogoInputRef}
          onChange={input => uploadLogo(input.target.files)}
          type="file"
          className="hide"
          name="uploads[]"
        />
      </ImageWrapper>
      <ImageWrapper>
        <label className="custom-label">Upload Hero Banner</label>
        <div className="banner-wrapper">
          {!banner ? (
            <a
              href="#"
              onClick={e => {
                e.preventDefault();
                if (uploadBannerRef.current) {
                  uploadBannerRef.current.click();
                }
              }}
            >
              <i className="material-icons">add</i>
            </a>
          ) : (
            <div className="banner-image">
              <img width="300" alt="" src={config.baseName + banner} />
              <a
                href="#"
                onClick={e => {
                  e.preventDefault();
                  updateBanner("");
                }}
              >
                <i className="material-icons danger">delete</i>
              </a>
            </div>
          )}
        </div>
        <input
          ref={uploadBannerRef}
          onChange={input => uploadBanner(input.target.files)}
          type="file"
          className="hide"
          name="uploads[]"
        />
      </ImageWrapper>
      <Input
        label={t("settings.general.site.ga")}
        defaultValue={data.google_analytics.value}
        type="text"
        placeholder={t("settings.general.site.ga.placeholder")}
        onBlur={e =>
          updateOption(SettingOptions.google_analytics, e.target.value)
        }
      />
      <StyledSelect
        label="Select language"
        selected={selectedLanguage}
        options={langOptions}
        onChange={switchLanguage}
      />
    </div>
  );
};

export default translate("translations")(General);

function getLanguageOptions(locale: string) {
  const parsedLangOptions = JSON.parse(locale);
  let selectedLanguage = "en";

  const langOptions = Object.keys(parsedLangOptions).map(key => {
    if (parsedLangOptions[key]) {
      selectedLanguage = key;
    }
    return {
      name: key,
      value: key,
    };
  });

  return {
    selectedLanguage,
    langOptions,
  };
}
