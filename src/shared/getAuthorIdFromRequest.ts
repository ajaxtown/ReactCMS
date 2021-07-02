import jwt from "jsonwebtoken";
import models from "@/graphql/db/models";
import logger from "./logger";
import { Context } from "@apollo/client";

const authHeaderPrefix = "Basic ";

export default async (context: Context) => {
  const authHeader = context.req?.headers.authorization || "";
  let author_id;
  try {
    author_id = await getAuthorFromSubdomain(context);
    if (author_id) {
      logger.debug("Author from subdomain - ", author_id);
    }

    if (!author_id && authHeader.length > authHeaderPrefix.length) {
      author_id = getAuthorFromAuthHeader(authHeader);
      if (author_id) {
        logger.debug(
          "Author from Authorization header after decrypting - ",
          author_id,
        );
      }
    }
    if (process.env.NODE_ENV !== "production") {
      logger.debug("development mode");
      const author = await models.Author.findOne({
        where: { email: "demo@demo.com" },
      });
      if (author) {
        author_id = author.id;
      }
    }
  } catch (e) {
    logger.error(e);
  }
  return author_id;
};

async function getAuthorFromSubdomain(context) {
  const { identifier } = context.req.headers;
  logger.debug("Host for checking subdomain - ", identifier);
  if (identifier && identifier.includes("letterpad.app")) {
    const username = identifier.split(".")[0];
    const author = await models.Author.findOne({
      attributes: ["id"],
      where: { username },
    });
    return author ? author.id : null;
  }
  return null;
}

function getAuthorFromAuthHeader(authHeader: string) {
  const token = authHeader.split(/\s+/).pop() || "";
  const tokenData = jwt.verify(token, process.env.SECRET_KEY);
  logger.debug("Authorisation Header to tokenData  - ", tokenData);
  //@ts-ignore
  return tokenData?.id;
}
