// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { withSentry } from "@sentry/nextjs";

const handler = async () => {
  throw new Error("API throw error for testing sentry");
};

export default withSentry(handler);
