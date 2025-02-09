import { Application } from "express";
import logger from "../utils/logger";
import { TRUSTED_PROXIES } from "../config/variables";

export default function trustedProxies(app: Application) {
  const trusted: string = TRUSTED_PROXIES;

  if (!trusted) {
    logger.warn(
      "No trusted Proxy configured, if ran behind a proxy please configure it according to the docs",
    );
  } else {
    app.set("trust proxy", trusted);
  }
}
