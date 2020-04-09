import { Setting, SettingOptions } from "../../../__generated__/gqlTypes";
import { WithNamespaces, translate } from "react-i18next";

import Input from "../../components/input";
import React from "react";

interface IMessagesProps extends WithNamespaces {
  updateOption: (option: SettingOptions, value: string) => void;
  data: { [option in SettingOptions]: Setting };
}
const Messages: React.FC<IMessagesProps> = ({ t, updateOption, data }) => {
  return (
    <div>
      <Input
        label={t("settings.messages.translationNotFound")}
        defaultValue={data.text_notfound.value || ""}
        type="text"
        onBlur={e => updateOption(SettingOptions.TextNotfound, e.target.value)}
      />
      <Input
        label={t("settings.messages.emptyPost")}
        defaultValue={data.text_posts_empty.value || ""}
        type="text"
        onBlur={e =>
          updateOption(SettingOptions.TextPostsEmpty, e.target.value)
        }
      />
    </div>
  );
};

export default translate("translations")(Messages);
