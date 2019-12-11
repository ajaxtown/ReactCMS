import React from "react";
import { translate, WithNamespaces } from "react-i18next";

import Input from "../../components/input";
import { SettingOptions } from "../../../../types/globalTypes";
import { getOptions_settings } from "../../../shared/queries/types/getOptions";

interface ISocialProps extends WithNamespaces {
  data: { [option in SettingOptions]: getOptions_settings };
  updateOption: (option: SettingOptions, value: string) => void;
  label?: string;
}
const Social: React.FC<ISocialProps> = ({ t, data, updateOption }) => {
  return (
    <div>
      <Input
        label={t("common.github")}
        defaultValue={data.social_github.value}
        type="text"
        placeholder={t("social.gh.placeholder")}
        onBlur={e => updateOption(SettingOptions.social_github, e.target.value)}
      />

      <Input
        label={t("common.facebook")}
        defaultValue={data.social_facebook.value}
        type="text"
        placeholder={t("social.fb.placeholder")}
        aria-invalid="false"
        onBlur={e =>
          updateOption(SettingOptions.social_facebook, e.target.value)
        }
      />

      <Input
        label={t("common.twitter")}
        defaultValue={data.social_twitter.value}
        type="text"
        placeholder={t("social.twitter.placeholder")}
        onBlur={e =>
          updateOption(SettingOptions.social_twitter, e.target.value)
        }
      />

      <Input
        label={t("common.instagram")}
        defaultValue={data.social_instagram.value}
        type="text"
        placeholder={t("social.ig.placeholder")}
        onBlur={e =>
          updateOption(SettingOptions.social_instagram, e.target.value)
        }
      />
    </div>
  );
};

export default translate("translations")(Social);