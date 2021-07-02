import { callbacks } from "../../shared/callbacks";
import { Subjects } from "./../../mail/index";
import Cryptr from "cryptr";
import jwt from "jsonwebtoken";
import {
  MutationResolvers,
  InputAuthor,
  PostStatusOptions,
  PostTypes,
  QueryResolvers,
  Social,
  Author as AuthorType,
} from "@/__generated__/__types__";
import { ResolverContext } from "../apollo";
import models from "../db/models";
import bcrypt from "bcryptjs";
import { settingsData } from "../db/models/setting";
import { validateCaptcha } from "./helpers";
import generatePost from "../db/seed/contentGenerator";
import sendMail from "../../mail";
import templates from "../../mail/templates";
import siteConfig from "../../../config/site.config";
import { seed } from "../db/seed/seed";
import { getDateTime } from "./../../shared/utils";
import { ROLES } from "../types";
import logger from "../../shared/logger";

const cryptr = new Cryptr(process.env.SECRET_KEY);

interface InputAuthorForDb extends Omit<InputAuthor, "social"> {
  social: string;
}

const Author = {
  role: async ({ id }) => {
    const author = await models.Author.findOne({ where: { id } });
    if (!author) return;
    try {
      const role = await author.getRole();
      return role.name;
    } catch (e) {
      logger.error(e);
    }
  },
  permissions: async ({ id }) => {
    const author = await models.Author.findOne({ where: { id } });
    if (!author) return;

    try {
      const role = await author.getRole();
      const permissions = await role.getPermissions();
      return permissions.map((p) => p.name);
    } catch (e) {
      logger.error(e);
    }
  },
};

const Query: QueryResolvers<ResolverContext> = {
  async me(_parent, _args, { session }, _info) {
    if (!session?.user.id) {
      return { __typename: "AuthorNotFoundError", message: "Invalid Session" };
    }

    const author = await models.Author.findOne({
      where: {
        id: session.user.id,
      },
    });
    if (!author) {
      return { __typename: "AuthorNotFoundError", message: "" };
    }

    if (author.avatar && author.avatar.startsWith("/")) {
      author.avatar = new URL(author.avatar, process.env.ROOT_URL).href;
    }
    const resolvedAuthor = author.get() as unknown as AuthorType;
    return { ...resolvedAuthor, __typename: "Author" };
  },
};

const Mutation: MutationResolvers<ResolverContext> = {
  async createAuthor(_, args) {
    if (args.data.token) {
      const response = await validateCaptcha(
        process.env.RECAPTCHA_KEY,
        args.data.token,
      );
      if (!response && process.env.NODE_ENV === "production") {
        return {
          __typename: "CreateAuthorError",
          message: "We cannot allow you at the moment.",
        };
      }
    }

    const dbSeeded = await isDatabaseSeeded();
    if (!dbSeeded) {
      logger.debug("Database not seeded. Seeding now.");
      await seed(models, false);
      await createAuthor({
        email: "admin@xxx.com",
        username: "admin",
        rolename: ROLES.ADMIN,
        site_title: "",
        verified: true,
        password: "admin",
        name: "Admin",
      });
    }

    let author = await models.Author.findOne({
      where: { email: args.data?.email },
    });

    if (author) {
      return {
        __typename: "CreateAuthorError",
        message: "Author already exist",
      };
    }

    author = await models.Author.findOne({
      where: { username: args.data?.username },
    });

    if (author) {
      return {
        __typename: "CreateAuthorError",
        message: "Username already exist",
      };
    }

    const newAuthor = await createAuthor({
      email: args.data.email,
      username: args.data.username,
      site_title: args.data.site_title || "",
      password: args.data.password,
      name: args.data.name,
    });

    if (newAuthor) {
      const { post, page } = getWelcomePostAndPage();
      const newPost = await newAuthor.createPost(post);
      const newTag = await newAuthor.createTag({
        name: siteConfig.first_post_tag,
        slug: siteConfig.first_post_tag,
      });
      await newPost.addTag(newTag);
      await newAuthor.createPost(page);

      await sendMail({
        to: newAuthor.email,
        subject: Subjects.VERIFY_EMAIL,
        html: templates.verifyEmail({
          name: newAuthor.name,
          verifyToken: cryptr.encrypt(newAuthor.email),
        }),
      });
      const a = newAuthor.get() as unknown as AuthorType;
      return { ...a, __typename: "Author" };
    }
    return {
      __typename: "CreateAuthorError",
      message: "Something went wrong and we dont know what.",
    };
  },
  async login(_parent, args, _context, _info) {
    const author = await models.Author.findOne({
      where: { email: args.data?.email },
      raw: true,
    });

    if (author) {
      if (!author?.verified) {
        return {
          __typename: "LoginError",
          message: "Your email id is not verified yet.",
        };
      }
      const authenticated = await bcrypt.compare(
        args.data?.password || "",
        author.password,
      );

      if (!authenticated)
        return {
          __typename: "LoginError",
          message: "Incorrect credentials",
        };

      try {
        return {
          __typename: "Author",
          ...author,
        };
      } catch (e) {
        logger.error(e);
      }
    }
    return {
      __typename: "LoginError",
      message: "Incorrect email id",
    };
  },
  async updateAuthor(_root, args, { session }) {
    if (session?.user.id !== args.author.id) {
      return {
        ok: true,
        errors: [{ message: "No session", path: "updateAuthor resolver" }],
      };
    }
    try {
      const dataToUpdate = { ...args.author } as InputAuthorForDb;

      if (args.author.password) {
        dataToUpdate.password = await bcrypt.hash(args.author.password, 12);
      }

      await models.Author.update(dataToUpdate as any, {
        where: { id: args.author.id },
      });
      callbacks.AUTHOR_UPDATE();
      return {
        ok: true,
        errors: [],
      };
    } catch (e) {
      logger.error(e);
      return {
        ok: false,
        errors: e, //utils.parseErrors(e),
      };
    }
  },
  async forgotPassword(_root, args) {
    try {
      const email = args.email;
      const token = jwt.sign({ email }, process.env.SECRET_KEY, {
        expiresIn: 10 * 60 * 1000,
      });
      const author = await models.Author.findOne({
        where: { email },
      });
      if (!author) {
        throw new Error("Email does not exist");
      }

      await sendMail({
        to: author.email,
        subject: Subjects.FORGOT_PASSWORD,
        html: templates.forgotPasswordEmail({
          name: author.name,
          token: token,
        }),
      });

      return {
        ok: true,
        msg: "Check your email to recover your password",
      };
    } catch (e) {
      logger.error(e);
      return {
        ok: false,
        msg: "Something unexpected happened",
      };
    }
  },
  async resetPassword(_root, args) {
    try {
      const token = args.token;
      const isValidToken = jwt.verify(token, process.env.SECRET_KEY);
      if (!isValidToken) {
        throw new Error("Token is not valid");
      }

      const authorEmail = jwt.decode(token);

      const author = await models.Author.findOne({
        where: { email: authorEmail },
      });

      if (!author) {
        throw new Error("Invalid token for changing password");
      }
      const newPassword = await bcrypt.hash(args.password, 12);

      await models.Author.update(
        { password: newPassword },
        { where: { id: author.id } },
      );

      return {
        ok: true,
        msg: "Password changed successfully",
      };
    } catch (e) {
      logger.error(e);
      return {
        ok: false,
        msg: e.message,
      };
    }
  },
};

export default { Mutation, Author, Query };

function getWelcomePostAndPage() {
  const post_cover =
    "https://images.unsplash.com/photo-1516035054744-d474c5209db5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1500&q=80";

  let { md, html } = generatePost(PostTypes.Post);
  let title = "Welcome to Letterpad";

  const post = {
    title: "Welcome to Letterpad",
    md: md,
    html: html,
    excerpt:
      "You can use this space to write a small description about the topic. This will be helpful in SEO.",
    cover_image: post_cover,
    cover_image_width: 1500,
    cover_image_height: 900,
    type: PostTypes.Post,
    status: PostStatusOptions.Published,
    slug: title.toLocaleLowerCase().replace(/ /g, "-"),
    createdAt: getDateTime(),
    publishedAt: getDateTime(),
    reading_time: "5 mins",
  };

  const pageContent = generatePost(PostTypes.Page);
  title = "Letterpad Typography";

  const page = {
    title,
    type: PostTypes.Page,
    md: pageContent.md,
    html: pageContent.html,
    status: PostStatusOptions.Published,
    excerpt:
      "You can use this space to write a small description about this page. This will be helpful in SEO.",
    slug: title.toLocaleLowerCase().replace(/ /g, "-"),
    cover_image:
      "https://images.unsplash.com/photo-1505682634904-d7c8d95cdc50?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1500&q=80",
    cover_image_width: 1482,
    cover_image_height: 900,
    createdAt: getDateTime(),
    publishedAt: getDateTime(),
    md_draft: "",
  };

  return { page, post };
}

async function isDatabaseSeeded(): Promise<boolean> {
  try {
    await models.sequelize.query("SELECT * FROM authors");
    return true;
  } catch (e) {
    logger.error(e);
    if (e.name === "SequelizeDatabaseError") {
      return false;
    }
  }
  return false;
}

interface ICreateAuthor {
  email: string;
  name: string;
  username: string;
  rolename?: ROLES;
  verified?: boolean;
  password: string;
  site_title: string;
  bio?: string;
  avatar?: string;
  social?: Social;
}

export async function createAuthor({
  email,
  name,
  username,
  rolename = ROLES.AUTHOR,
  verified = false,
  password,
  site_title,
  bio = "",
  avatar = "",
  social = {
    twitter: "",
    facebook: "",
    github: "",
    instagram: "",
  },
}: ICreateAuthor) {
  const role = await models.Role.findOne({ where: { name: rolename } });
  const author = await models.Author.create({
    name,
    bio,
    username,
    verified,
    email,
    password: bcrypt.hashSync(password, 12),
    avatar,
    social: social,
  });
  if (author && role) {
    author.setRole(role);
    const setting = await models.Setting.create({
      ...settingsData,
      site_url: `https://${username}.letterpad.app`,
      site_title,
      client_token: jwt.sign(
        {
          id: author.id,
        },
        process.env.SECRET_KEY,
        {
          algorithm: "HS256",
        },
      ),
    });
    author.setSetting(setting);
  }
  return author;
}
