import { setResponsiveImages } from "./../utils/imageAttributs";
import { PostAttributes } from "../db/models/post";
import { Op, Order } from "sequelize";
import {
  Permissions,
  PostFilters,
  PostStatusOptions,
  SortBy,
  PostTypes,
  QueryResolvers,
} from "@/__generated__/__types__";
import { ResolverContext } from "../apollo";
import { decrypt } from "../utils/crypto";
import models from "../db/models";
import logger from "./../../shared/logger";
import debug from "debug";
import { getHtmlFromMarkdown } from "letterpad-editor/dist/mdToHtml";
import { addGalleryWrapper } from "../utils/addGalleryWrappr";

interface IPostCondition {
  conditions: {
    order: Order;
    include: any;
    where: {
      id?: number | {};
      featured?: boolean;
      status: { [Op.ne]: PostStatusOptions.Trashed };
      type?: PostTypes;
      author_id?: number;
    };
    limit: number;
    offset?: number;
    sortBy: "ASC" | "DESC";
  };
}

const Post = {
  author: async ({ id }: PostAttributes) => {
    const post = await models.Post.findOne({ where: { id: id } });
    if (post) {
      const author = await post.getAuthor();
      return author.get();
    }
    return {};
  },
  tags: async ({ id }: PostAttributes) => {
    const post = await models.Post.findOne({ where: { id: id } });
    if (post) {
      const tags = await post.getTags();
      return tags.map((tag) => tag.get());
    }
  },
  html: async ({ html }) => {
    return addGalleryWrapper(setResponsiveImages(html));
  },
};

const Query: QueryResolvers<ResolverContext> = {
  /**
   * Query to take care of multiple post in one page.
   * Used for Search and Admin posts and pages list.
   */
  async posts(_parent, args, { session, author_id }, _info) {
    debug("letterpad:post:update")("Reached posts query");
    let authorId = session?.user.id || author_id;
    if (!authorId) {
      return { __typename: "PostError", message: "Author Id not found" };
    }
    const query: IPostCondition = {
      conditions: {
        order: [["publishedAt", SortBy.Desc]],
        include: [],
        sortBy: "DESC",
        where: {
          id: 0,
          featured: false,
          status: { [Op.ne]: PostStatusOptions.Trashed },
          type: PostTypes.Post,
          author_id: authorId,
        },
        limit: 20,
        offset: 0,
      },
    };
    try {
      // id
      if (args?.filters?.id) {
        query.conditions.where.id = args.filters.id;
      } else {
        delete query.conditions.where.id;
      }

      // pagination
      if (args?.filters?.cursor) {
        query.conditions.where.id = { [Op.gt]: args.filters.cursor };
      }

      if (args?.filters?.page) {
        query.conditions.offset =
          (args.filters.page - 1) * query.conditions.limit;
      } else {
        delete query.conditions.offset;
      }

      if (args?.filters?.limit) {
        query.conditions.limit = args.filters.limit;
      }

      // resolve status type and filter
      if (args?.filters?.featured) {
        query.conditions.where.featured = args.filters.featured;
      } else {
        delete query.conditions.where.featured;
      }

      // resolve type
      if (args?.filters?.type) {
        query.conditions.where.type = args.filters.type;
      }

      // resolve status
      if (args?.filters?.status) {
        query.conditions.where.status = { [Op.eq]: args.filters.status } as any;
      }

      if (!session?.user.id) {
        query.conditions.where.status = {
          [Op.eq]: PostStatusOptions.Published,
        } as any;
      }

      // sort
      if (args?.filters?.sortBy) {
        query.conditions.order = [["publishedAt", args.filters.sortBy]];
      }

      if (session?.user.id && args?.filters?.sortBy) {
        query.conditions.order = [["updatedAt", args.filters.sortBy]];
      }

      // resolve menu filter
      if (args?.filters?.tagSlug) {
        let { tagSlug } = args.filters;
        if (tagSlug === "/") {
          // get the first menu item.
          const author = await models.Author.findOne({
            where: { id: authorId },
          });
          const setting = await author?.getSetting();

          if (setting) {
            tagSlug = setting.menu[0].slug;
          }
        }

        const taxTag = await models.Tags.findOne({
          where: {
            slug: tagSlug.split("/").pop() as string,
            author_id: authorId,
          },
        });

        if (taxTag) {
          const posts = await taxTag.getPosts(query.conditions);
          return {
            __typename: "PostsNode",
            rows: posts.map((p) => p.get()),
            count: await taxTag.countPosts(query.conditions),
          };
        }
        return {
          __typename: "PostsNode",
          rows: [],
          count: 0,
        };
      }

      // resolve tag filter
      if (args?.filters?.tag) {
        const tag = await models.Tags.findOne({
          where: { name: args.filters.tag, author_id },
        });
        if (tag) {
          const posts = await tag.getPosts(query.conditions);
          return {
            rows: posts.map((p) => p.get()),
            count: await tag.countPosts(query.conditions),
          };
        } else {
          return {
            __typename: "PostsNode",
            rows: [],
            count: 0,
          };
        }
      }

      const posts = await models.Post.findAll(query.conditions);
      const count = await models.Post.count(query.conditions);
      debug("letterpad:post:update")(query.conditions);

      return {
        __typename: "PostsNode",
        rows: posts.map((post) => post.get()),
        count,
      };
    } catch (e) {
      logger.error(e);
      debug("letterpad:post:update")(e);
      return { __typename: "PostError", message: e.message };
    }
  },

  async post(_parent, args, { session, author_id }, _info) {
    const error = { __typename: "PostError", message: "" };
    if (!args.filters) return { ...error, message: "Missing arguments" };

    const authorId = session?.user.id || author_id;

    if (!authorId) {
      return { ...error, message: "No author found for this post." };
    }
    const { previewHash, ...filters } = args.filters;
    const conditions = {
      where: { ...filters, author_id: authorId } as PostFilters & {
        author_id?: number;
      },
    };
    if (session?.user.permissions) {
      //  Author should not see others posts from admin panel
      if (session.user.permissions.includes(Permissions.ManageOwnPosts)) {
        conditions.where.author_id = session.user.id;
      }
    }

    if (!session?.user.id) {
      conditions.where.status = PostStatusOptions.Published;
    }

    if (args.filters.id) {
      conditions.where.id = args.filters.id;
    }

    if (args.filters.slug) {
      conditions.where.slug = args.filters.slug.split("/").pop();
    }

    if (previewHash) {
      conditions.where.id = Number(decrypt(previewHash));
      delete conditions.where.status;
    }
    const post = await models.Post.findOne(conditions);
    if (post) {
      const html = previewHash
        ? getHtmlFromMarkdown(post.md_draft || post.md)
        : post.html;

      return { ...post.get(), html, __typename: "Post" };
    }
    return { ...error, message: "Post not found" };
  },

  async stats(_, _args, { session }) {
    logger.debug("Reached resolver: stats");
    const result = {
      posts: { published: 0, drafts: 0 },
      pages: { published: 0, drafts: 0 },
      tags: 0,
      media: 0,
    };
    const author_id = session?.user.id;

    if (!author_id) {
      return {
        __typename: "StatsError",
        message: "Couldnt find author in session",
      };
    }

    const author = await models.Author.findOne({ where: { id: author_id } });

    if (!author) {
      return {
        __typename: "StatsError",
        message: "Couldnt find author",
      };
    }

    result.posts.published = await author.countPosts({
      where: {
        status: PostStatusOptions.Published,
        type: PostTypes.Post,
      },
    });

    result.posts.drafts = await author.countPosts({
      where: {
        status: PostStatusOptions.Draft,
        type: PostTypes.Post,
      },
    });

    result.pages.published = await author.countPosts({
      where: {
        status: PostStatusOptions.Published,
        type: PostTypes.Page,
      },
    });

    result.pages.drafts = await author.countPosts({
      where: {
        status: PostStatusOptions.Draft,
        type: PostTypes.Page,
      },
    });

    result.tags = await author.countTags();

    result.media = await author.countMedia();

    return {
      __typename: "Stats",
      ...result,
    };
  },
};

export default { Query, Post };
