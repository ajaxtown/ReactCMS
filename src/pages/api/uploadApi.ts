import { NextApiResponse } from "next";
import {
  BlobCorrected,
  IMediaUploadResult,
  NextApiRequestWithFormData,
  SessionData,
} from "@/graphql/types";
import {
  SettingsQuery,
  SettingsQueryVariables,
} from "@/__generated__/queries/queries.graphql";
import { getSession } from "next-auth/client";
import { initializeApollo } from "@/graphql/apollo";
import { SettingsDocument } from "@/graphql/queries/queries.graphql";
import logger from "./../../shared/logger";
import path from "path";
import multer from "multer";
import { uploadToCloudinary } from "./providers/cloudinary";
import { uploadToInternal } from "./providers/internal";
import models from "@/graphql/db/models";
import initMiddleware from "./middleware";
import crypto from "crypto";

const upload = multer();
const uploadDir = path.join(process.cwd(), "public/uploads/");
// for parsing multipart/form-data
// note that Multer limits to 1MB file size by default
const multerAny = initMiddleware(upload.any());

// Doc on custom API configuration:
// https://nextjs.org/docs/api-routes/api-middlewares#custom-config
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async (
  req: NextApiRequestWithFormData,
  res: NextApiResponse,
) => {
  await multerAny(req, res);
  const _session = await getSession({ req });
  const session = _session as unknown as { user: SessionData };
  if (!session || !session.user.id) return res.status(401).send("Unauthorized");

  // This operation expects a single file upload.
  if (!req.files?.length || req.files.length > 1) {
    res.statusCode = 400;
    res.status(501).end("The request can contain only 1 file");
    return;
  }

  let files: BlobCorrected[] = req.files;
  if (!Array.isArray(files)) {
    files = [files];
  }
  const apollo = await initializeApollo({}, { req });
  const settings = await apollo.query<SettingsQuery, SettingsQueryVariables>({
    query: SettingsDocument,
    fetchPolicy: "network-only",
  });
  if (settings.data.settings.__typename === "SettingError") {
    return res.status(501).end(settings.data.settings.message);
  }

  if (!settings || settings.data.settings.__typename !== "Setting") return null;

  const { cloudinary_key, cloudinary_name, cloudinary_secret } =
    settings.data.settings;

  const cdnEnabled = cloudinary_key && cloudinary_name && cloudinary_secret;

  logger.debug(`Received ${files.length} file/s to upload`);

  const output: IMediaUploadResult[] = [];

  for (const file of files) {
    if (file) {
      const hashSum = crypto.createHash("sha256");
      hashSum.update(file.buffer);

      const hex = hashSum.digest("hex");
      const extension = file.originalname.substr(
        file.originalname.lastIndexOf(".") + 1,
      );
      file.hash = hex;
      const filename = hex + "." + extension;
      const uploadPath = uploadDir + filename;
      try {
        let result: IMediaUploadResult;
        if (cdnEnabled) {
          result = await uploadToCloudinary(file, uploadPath, {
            api_key: cloudinary_key,
            cloud_name: cloudinary_name,
            api_secret: cloudinary_secret,
          });
        } else {
          result = await uploadToInternal(
            file,
            uploadPath,
            process.env.basePath + "/uploads/" + filename,
          );
        }
        await upsertMedia(result, session.user.id);
        output.push(result);
      } catch (e) {
        logger.error(e);
        output.push(e);
      }
    }
  }

  res.json(output);
};

export async function upsertMedia(result: IMediaUploadResult, id: number) {
  let media = await models.Media.findOne({
    where: {
      url: result.src,
    },
  });
  const author = await models.Author.findOne({ where: { id } });
  if (!author) {
    return;
  }
  if (!media) {
    /*@TODO - Convert this to a graphql query */
    media = await models.Media.create({
      url: result.src,
      name: result.name,
      description: "",
      height: result.size.height,
      width: result.size.width,
      createdAt: new Date(),
    });
  }
  if (media) {
    await author.addMedia(media);
  }
}
