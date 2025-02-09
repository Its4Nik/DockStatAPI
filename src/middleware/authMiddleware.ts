import bcrypt from "bcrypt";
import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger";
import { rateLimitedReadFile } from "../utils/rateLimitFS";
import { createResponseHandler } from "../handlers/response";
const passwordFile = "./src/data/password.json";
const passwordBool = "./src/data/usePassword.txt";

async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const ResponseHandler = createResponseHandler(res);
  try {
    const authStatusData = await rateLimitedReadFile(passwordBool);
    const isAuthEnabled = authStatusData.trim() === "true";

    if (!isAuthEnabled) {
      logger.warn("You are not using authentication, please enable it.");
      logger.debug("Authentication disabled, skipping login process...");
      return next();
    }

    const providedPassword = req.headers["x-password"];
    if (!providedPassword) {
      ResponseHandler.denied("Password required");
      return;
    }

    const passwordData = await rateLimitedReadFile(passwordFile);
    const storedData = JSON.parse(passwordData);

    const passwordMatch = await bcrypt.compare(
      providedPassword as string,
      storedData.hash,
    );
    if (!passwordMatch) {
      ResponseHandler.error("Invalid Password", 402);
      return;
    }

    logger.debug("Authentication succesfull");
    next();
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return ResponseHandler.critical(errorMsg);
  }
}

export default authMiddleware;
