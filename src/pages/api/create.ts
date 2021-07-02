import { NextApiResponse } from "next";
import { NextApiRequestWithFormData } from "./../../graphql/types";
import { initializeApollo } from "@/graphql/apollo";
import {
  CreatePostDocument,
  CreatePostMutation,
  CreatePostMutationVariables,
} from "@/__generated__/queries/mutations.graphql";
import { PostTypes } from "@/__generated__/__types__";
import logger from "../../shared/logger";

const Create = async (
  req: NextApiRequestWithFormData,
  res: NextApiResponse,
) => {
  try {
    const type = req.query.type;
    const apolloClient = await initializeApollo({}, { req });

    const post = await apolloClient.mutate<
      CreatePostMutation,
      CreatePostMutationVariables
    >({
      mutation: CreatePostDocument,
      variables: {
        data: { type: type as PostTypes },
      },
    });
    if (post.data?.createPost.__typename === "Post") {
      res.redirect(process.env.basePath + "/post/" + post.data.createPost.id);
      return;
    }
    res.send("Post creation failed");
  } catch (e) {
    logger.error(e);
    res.send(e.message);
  }
};

export default Create;
