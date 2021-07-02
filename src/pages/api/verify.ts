import models from "@/graphql/db/models";
import { NextApiResponse } from "next";
import { NextApiRequestWithFormData } from "./../../graphql/types";
import Cryptr from "cryptr";
import logger from "../../shared/logger";

const cryptr = new Cryptr(process.env.SECRET_KEY);

const Verify = async (
  req: NextApiRequestWithFormData,
  res: NextApiResponse,
) => {
  try {
    const token = cryptr.decrypt(req.query.token);
    const update = await models.Author.update(
      { verified: true },
      { where: { email: token } },
    );
    if (!update) {
      throw Error("Either you are already verified or verification failed.");
    }
    res.redirect(process.env.basePath + "/messages/verified");
  } catch (e) {
    res.send(e.message);
    logger.error(e);
  }
};

export default Verify;
