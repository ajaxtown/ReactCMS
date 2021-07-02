import { getSession } from "next-auth/client";
import { Author } from "./../../graphql/db/models/author";
import models from "@/graphql/db/models";
import multer from "multer";
import initMiddleware from "./middleware";
import { ROLES, SessionData } from "@/graphql/types";
import { Role } from "@/__generated__/__types__";
import {
  IAuthorData,
  IImportExportData,
  ITagSanitized,
} from "./importExportTypes";

import jwt from "jsonwebtoken";
import { convertGhostToLetterpad } from "./importers/ghost/ghost";
import { Post } from "@/graphql/db/models/post";
import { withSentry } from "@sentry/nextjs";
import logger from "../../shared/logger";

const upload = multer();
const multerAny = initMiddleware(upload.any());

export const config = {
  api: {
    bodyParser: false,
  },
};

const Import = async (req, res) => {
  try {
    await multerAny(req, res);
    const _session = await getSession({ req });
    const session = _session as unknown as { user: SessionData };
    if (!session?.user?.email)
      return res.status(401).send({
        success: false,
        message: "No session found",
      });

    let data: IImportExportData = JSON.parse(req.files[0].buffer.toString());

    const importName = req.files[0].fieldname;
    if (importName === "ghost") {
      const ghostData = JSON.parse(req.files[0].buffer.toString());
      data = convertGhostToLetterpad(ghostData, session.user);
    }
    const isLoggedInUserAdmin = session.user.role === Role.Admin;

    if (!isLoggedInUserAdmin) {
      const author = await validateSingleAuthorImport(res, data, session.user);
      if (!author) {
        return res.send({
          success: false,
          message: "This author does not exist",
        });
      }
      // when importing from other cms, set the current password of the author
      if (data.authors[session.user.email].author.password === "") {
        data.authors[session.user.email].author.password = author.password;
      }
    }

    const sanitizedData = sanitizeForeignData(data.authors);
    const response = await startImport(sanitizedData, isLoggedInUserAdmin);

    return res.send(response);
  } catch (e) {
    logger.error(e);
    res.status(501).send({
      success: false,
      message: e.message,
    });
  }
};

export default withSentry(Import);

async function startImport(
  data: { [email: string]: IAuthorData },
  isLoggedInUserAdmin: boolean,
) {
  const role = await models.Role.findOne({
    where: { name: ROLES.AUTHOR },
  });

  for (const email in data) {
    const authorsData = data[email];
    let author = await models.Author.findOne({ where: { email } });
    if (!author && isLoggedInUserAdmin) {
      //@ts-ignore author
      const { id, role_id, setting_id, ...sanitizedAuthor } =
        authorsData["author"];
      author = await models.Author.create(sanitizedAuthor);
    }

    if (!author) {
      return {
        success: false,
        message: `The author ${email} does not exist`,
      };
    }

    if (role) {
      author.setRole(role);
    }

    await removeUserData(author);

    authorsData.setting.client_token = jwt.sign(
      {
        id: author.id,
      },
      process.env.SECRET_KEY,
      {
        algorithm: "HS256",
      },
    );
    await author.createSetting(authorsData.setting);

    await Promise.all([
      ...authorsData.media.map((item) => author?.createMedia(item)),
    ]);

    for (const data of authorsData.posts) {
      //@ts-ignore
      const { tags, ...post } = data;
      const newPost = await author.createPost({
        ...data,
        cover_image: data.cover_image,
      });
      addTagsToPost(newPost, tags, author);
    }
  }
  return {
    success: true,
    message: "Import complete",
  };
}

async function addTagsToPost(
  post: Post,
  tags: ITagSanitized[],
  author: Author,
) {
  for (const tag of tags) {
    const existingTag = await models.Tags.findOne({
      where: { name: tag.name, author_id: author.id },
    });
    if (existingTag) {
      post.addTag(existingTag);
    } else {
      const created = await author.createTag({ ...tag });
      if (created) post.addTag(created);
    }
  }
}

async function removeUserData(author: Author) {
  if (author.setting_id) {
    // remove setting
    await models.Setting.destroy({ where: { id: author.setting_id } });
  }

  if (author.id) {
    // remove tags
    await models.Tags.destroy({ where: { author_id: author.id } });

    // remove posts. also removes relationship with tags
    await models.Post.destroy({ where: { author_id: author.id } });

    // remove media
    await models.Media.destroy({ where: { author_id: author.id } });
  }
}

function sanitizeForeignData(authors: IImportExportData["authors"]) {
  const sanitizedData: IImportExportData["authors"] = {};
  for (const email in authors) {
    const authorData: IAuthorData = authors[email];
    sanitizedData[email] = authorData;

    //posts
    const posts = authorData.posts.map((post) => {
      // @ts-ignore
      const { id, author_id, ...rest } = post;
      return rest;
    });

    sanitizedData[email].posts = posts;

    // tags
    const tags = authorData.tags.map((tag) => {
      // @ts-ignore
      const { id, author_id, ...rest } = tag;
      return rest;
    });

    sanitizedData[email].tags = tags;

    // settings
    // @ts-ignore
    const { id, ...setting } = authorData.setting;
    sanitizedData[email].setting = setting;

    // media
    const media = authorData.media.map((item) => {
      // @ts-ignore
      const { id, author_id, ...rest } = item;
      return rest;
    });

    sanitizedData[email].media = media;
  }
  return sanitizedData;
}

async function validateSingleAuthorImport(
  res,
  data: IImportExportData,
  sessionUser: SessionData,
): Promise<Author | null> {
  if (Object.keys(data.authors).length > 1) {
    res.status(401).send({
      success: false,
      message: "You are not allowed to import multiple authors",
    });
    return null;
  }
  return models.Author.findOne({
    where: { id: sessionUser.id },
  });
}
