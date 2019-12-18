import { NextFunction, Request, Response, Express } from "express";
import bodyParser from "body-parser";
import cors from "cors";
import constants from "./utils/constants";

const fileUpload = require("express-fileupload");
const jwt = require("jsonwebtoken");
const corsMiddleWare = cors({
  exposedHeaders: ["x-refresh-token"],
});
const bodyParserMiddleWare = bodyParser.urlencoded({
  extended: true,
});

/**
 * For every request from dashboard, we will keep updating the token with the expiry date.
 * This is useful in logging out the user due to inactivity.
 */

const addAdminToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = req.headers.authorization;
  delete req.user;
  const operationName = req.body && req.body.operationName;

  if (operationName === "getOptions" || operationName === "login") {
    return next();
  }
  if (!token) return next();

  try {
    const data = await jwt.verify(token, constants.SECRET);
    req.user = { ...data };
    // while generating the new token we dont need the below data. This gets attached by jwt automatically.
    delete data.iat;
    delete data.exp;

    const newToken = jwt.sign(data, constants.SECRET, {
      expiresIn: req.user.expiresIn,
    });
    res.setHeader("x-refresh-token", newToken);
  } catch (error) {
    console.log("Invalid token or token expired");
    res.status(401);
    res.set("Location", constants.LOGIN_URL);
  }
  next();
};

const MAX_UPLOAD_SIZE = parseInt(process.env["MAX_IMAGE_UPLOAD_SIZE"] || "10");

export default function(app: Express) {
  app.use(corsMiddleWare);
  app.options("*", cors());
  app.use(bodyParserMiddleWare);
  app.use(bodyParser.json());
  app.use(addAdminToken);
  app.use(
    fileUpload({
      limits: { fileSize: MAX_UPLOAD_SIZE * 1024 * 1024 },
      abortOnLimit: true,
      useTempFiles: true,
      tempFileDir: "/tmp/",
    }),
  );
}