import React, { useRef } from "react";
import { translate } from "react-i18next";

import StyledCard from "../../components/card";
import Input, { TextArea } from "../../components/input";
import StyledButton from "../../components/button";
import { notify } from "react-notify-toast";
import { CREATE_POST } from "../../../shared/queries/Mutations";
import {
  createPost,
  createPostVariables,
} from "../../../shared/queries/types/createPost";
import apolloClient from "../../../shared/apolloClient";

const QuickDraft = ({ t }: any) => {
  const titleRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const quickDraftAction = async () => {
    if (!titleRef.current || !bodyRef.current) return;
    if (titleRef.current.value.length > 0) {
      await apolloClient().mutate<createPost, createPostVariables>({
        mutation: CREATE_POST,
        variables: {
          data: {
            title: titleRef.current.value,
            body: bodyRef.current.value,
          },
        },
      });
      notify.show("Draft Saved", "success", 3000, "var(--base-color");
      // titleRef.current.value = "";
      // bodyRef.current.value = "";
    }
  };
  return (
    <StyledCard
      title={t("home.quickDraft")}
      subtitle={t("home.quickDraft.tagline")}
    >
      <div>
        <Input
          ref={titleRef}
          label={t("home.quickDraft.title")}
          placeholder={t("home.quickDraft.title.placeholder")}
        />
        <TextArea
          ref={bodyRef}
          label={t("home.quickDraft.body")}
          placeholder={t("home.quickDraft.body.placeholder")}
          rows={2}
        />
        <StyledButton success onClick={() => quickDraftAction()}>
          {t("home.quickDraft.save")}
        </StyledButton>
      </div>
    </StyledCard>
  );
};

export default translate("translations")(QuickDraft);
