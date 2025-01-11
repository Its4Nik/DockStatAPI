import { Request, Response } from "express";
import {
  authEnabled,
  readPasswordFile,
  writePasswordFile,
  setFalse,
} from "../controllers/auth";
import { createResponseHandler } from "./response";
import bcrypt from "bcrypt";

const saltRounds: number = 10;

class AuthenticationHandler {
  private req: Request;
  private res: Response;

  constructor(req: Request, res: Response) {
    this.req = req;
    this.res = res;
  }

  async enable(password: string) {
    const ResponseHandler = createResponseHandler(this.res);
    try {
      if (await authEnabled()) {
        return ResponseHandler.denied(
          "Password Authentication is already enabled, please deactivate it first",
        );
      }

      if (!password) {
        return ResponseHandler.denied("Password is required");
      }

      const salt = await bcrypt.genSalt(saltRounds);
      const hash = await bcrypt.hash(password, salt);

      const passwordData = { hash, salt };
      writePasswordFile(JSON.stringify(passwordData));

      return ResponseHandler.ok("Authentication enabled successfully");
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return ResponseHandler.critical(errorMsg);
    }
  }

  async disable(password: string) {
    const ResponseHandler = createResponseHandler(this.res);
    try {
      if (!password) {
        return ResponseHandler.denied("Password is required");
      }

      const storedData = JSON.parse(await readPasswordFile());
      const isPasswordValid = await bcrypt.compare(password, storedData.hash);

      if (!isPasswordValid) {
        return ResponseHandler.error("Invalid password", 401);
      }

      await setFalse();
      return ResponseHandler.ok("Authentication disabled successfully");
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return ResponseHandler.critical(errorMsg);
    }
  }
}

export const createAuthenticationHandler = (req: Request, res: Response) =>
  new AuthenticationHandler(req, res);
