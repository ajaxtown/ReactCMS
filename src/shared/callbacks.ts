import * as Sentry from "@sentry/nextjs";
import models from "@/graphql/db/models";
import Session from "./session";
import { debounce } from "./utils";
import logger from "./logger";

const pingUrl = debounce(async () => {
  if (!Session.email) {
    return Sentry.captureMessage(
      "Email not found in session to ping deploy url",
    );
  }
  const author = await models.Author.findOne({
    where: { email: Session.email },
  });
  if (author) {
    const setting = await author.getSetting();
    if (setting && setting.ping_url) {
      fetch(setting.ping_url)
        .then(() => {
          Sentry.captureMessage("Pinged deploy url for - " + author.email);
        })
        .catch((e) => {
          logger.error(e);
        });
    }
  }
}, 2000);

export const callbacks = {
  TAG_NEW: () => pingUrl(),
  TAG_DELETE: () => pingUrl(),
  TAG_UPDATE: () => pingUrl(),

  POST_NEW: () => pingUrl(),
  POST_UPDATE: () => pingUrl(),
  POST_DELETE: () => pingUrl(),

  PAGE_NEW: () => pingUrl(),
  PAGE_UPDATE: () => pingUrl(),
  PAGE_DELETE: () => pingUrl(),

  PUBLISHED: () => pingUrl(),

  SETTINGS_CHANGED: () => pingUrl(),
  AUTHOR_UPDATE: () => pingUrl(),
};
