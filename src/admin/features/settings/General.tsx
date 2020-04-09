import Input, { TextArea } from "../../components/input";
import React, { createRef, useState } from "react";
import { Setting, SettingOptions } from "../../../__generated__/gqlTypes";
import { WithNamespaces, translate } from "react-i18next";

import StyledSelect from "../../components/select";
import config from "../../../config";
import { notify } from "react-notify-toast";
import styled from "styled-components";
import { uploadFile } from "../../server/util";

const host = config.ROOT_URL + config.BASE_NAME;

interface IGeneralProps extends WithNamespaces {
  data: { [option in SettingOptions]: Setting };
  updateOption: (option: SettingOptions, value: string) => void;
}

const General: React.FC<IGeneralProps> = ({ data, updateOption, t, i18n }) => {
  const parsedBanner = JSON.parse(data.banner.value);
  const [banner, setBanner] = useState<string>(parsedBanner.src || "");
  const [site_logo, setSiteLogo] = useState<string>(data.site_logo.value || "");
  const [site_favicon, setSiteFavicon] = useState<string>(
    data.site_favicon.value || "",
  );

  const uploadLogoInputRef = createRef<HTMLInputElement>();
  const uploadBannerRef = createRef<HTMLInputElement>();
  const uploadFaviconRef = createRef<HTMLInputElement>();

  const { langOptions, selectedLanguage } = getLanguageOptions(
    data.locale.value,
  );

  const switchLanguage = (value: string) => {
    const locales = {};
    Object.keys(langOptions).map(lang => {
      locales[lang] = value === lang;
    });
    updateOption(SettingOptions.Locale, JSON.stringify(locales));
    i18n.changeLanguage(value);
  };

  const updateBanner = ({ src, width, height }) => {
    updateOption(SettingOptions.Banner, JSON.stringify({ src, width, height }));
    setBanner(src);
  };

  const updateLogo = (site_logo: string) => {
    updateOption(SettingOptions.SiteLogo, site_logo);
    setSiteLogo(site_logo);
  };

  const updateFavicon = (site_favicon: string) => {
    updateOption(SettingOptions.SiteFavicon, site_favicon);
    setSiteFavicon(site_favicon);
  };

  const uploadBanner = async (files: FileList | null) => {
    if (!files) return;
    const uploadedFiles = await uploadFile({ files });
    let { src, errors, size } = uploadedFiles[0];
    if (errors) {
      notify.show(errors, "error", 3000);
      return;
    }
    updateBanner({ src, ...size });
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

  const uploadFavicon = async (files: FileList | null) => {
    if (!files) return;
    const uploadedFiles = await uploadFile({ files });
    let { src, errors } = uploadedFiles[0];
    if (errors) {
      notify.show(errors, "error", 3000);
      return;
    }
    updateFavicon(src);
  };

  return (
    <div>
      <Input
        label={t("settings.general.site.title")}
        defaultValue={data.site_title.value}
        type="text"
        placeholder={t("settings.general.site.title.placeholder")}
        onBlur={e => updateOption(SettingOptions.SiteTitle, e.target.value)}
      />
      <Input
        label={t("settings.general.site.tagline")}
        defaultValue={data.site_tagline.value}
        type="text"
        placeholder={t("settings.general.site.tagline.placeholder")}
        onBlur={e => updateOption(SettingOptions.SiteTagline, e.target.value)}
      />
      <Input
        label={t("settings.general.site.email")}
        defaultValue={data.site_email.value}
        type="email"
        placeholder="someone@somewhere.com"
        onBlur={e => updateOption(SettingOptions.SiteEmail, e.target.value)}
      />
      <TextArea
        label={t("settings.general.site.description")}
        defaultValue={data.site_description.value}
        placeholder={t("settings.general.site.description.placeholder")}
        onBlur={e =>
          updateOption(SettingOptions.SiteDescription, e.target.value)
        }
      />
      <Input
        label={t("settings.general.site.url")}
        defaultValue={data.site_url.value}
        type="text"
        placeholder={t("settings.general.site.url.placeholder")}
        onBlur={e => updateOption(SettingOptions.SiteUrl, e.target.value)}
      />
      <TextArea
        label={t("settings.general.site.footer") + "(html allowed)"}
        defaultValue={data.site_footer.value}
        className="form-control"
        placeholder={t("settings.general.site.footer.placeholder")}
        onBlur={e => updateOption(SettingOptions.SiteFooter, e.target.value)}
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
              <img width="100" alt="" src={site_logo} />
              <a
                href="#"
                onClick={e => {
                  e.preventDefault();
                  updateLogo("");
                }}
              >
                <i className="material-icons danger">delete_outline</i>
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
        <label className="custom-label">Upload Favicon</label>
        <div className="logo-wrapper favicon">
          {!site_favicon ? (
            <a
              href="#"
              onClick={e => {
                e.preventDefault();
                if (uploadFaviconRef.current) {
                  uploadFaviconRef.current.click();
                }
              }}
            >
              <i className="material-icons">add</i>
            </a>
          ) : (
            <div className="favicon">
              <img width="50" alt="" src={site_favicon} />
              <a
                href="#"
                onClick={e => {
                  e.preventDefault();
                  updateFavicon("");
                }}
              >
                <i className="material-icons danger">delete_outline</i>
              </a>
            </div>
          )}
        </div>
        <input
          ref={uploadFaviconRef}
          onChange={input => uploadFavicon(input.target.files)}
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
              <img width="300" alt="" src={banner} />
              <a
                href="#"
                onClick={e => {
                  e.preventDefault();
                  updateBanner({ src: "", width: 0, height: 0 });
                }}
              >
                <i className="material-icons danger">delete_outline</i>
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
          updateOption(SettingOptions.GoogleAnalytics, e.target.value)
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

const ImageWrapper = styled.div`
  margin-top: 15px;
  margin-bottom: 15px;

  .logo-wrapper {
    height: 100px;
    width: 100px;
    overflow: hidden;
    border: 1px solid var(--color-border);
    position: relative;
    background: var(--color-base);
    a {
      left: calc(100% - 20px);
      top: 2px;
      position: absolute;
      i {
        font-size: 1.6rem !important;
      }
    }

    &.favicon {
      height: 50px;
      width: 50px;
    }
  }
  .banner-wrapper {
    height: 150px;
    width: 250px;
    overflow: hidden;
    border: 1px solid var(--color-border);
    position: relative;
    a {
      left: calc(100% - 29px);
      top: 6px;
      position: absolute;
      i {
        font-size: 2rem !important;
      }
    }
  }

  .logo-image,
  .banner-image {
    display: flex;
    align-items: center;
    height: 100%;
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
