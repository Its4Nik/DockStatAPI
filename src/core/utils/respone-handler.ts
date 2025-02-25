import { logger } from "~/core/utils/logger";
import type { HTTPHeaders } from "elysia/dist/types";
import type { ElysiaCookie } from "elysia/dist/cookies";
import type { StatusMap } from "elysia";

interface set {
  headers: HTTPHeaders;
  status?: number | keyof StatusMap;
  redirect?: string;
  cookie?: Record<string, ElysiaCookie>;
}

export const responseHandler = {
  error(
    set: set,
    error: string,
    response_message: string,
    error_code?: number,
  ) {
    set.status = error_code || 500;
    logger.error(`${response_message} - ${error}`);
    return { error: `${response_message}` };
  },

  ok(set: set, response_message: string) {
    set.status = 200;
    logger.debug(response_message);
    return { success: true };
  },

  simple_error(set: set, response_massage: string, status_code?: number) {
    set.status = status_code || 502;
    logger.warn(response_massage);
    return { error: response_massage };
  },

  reject(set: set, reject: any, response_message: string, error?: string) {
    set.status = 501;
    if (error) {
      logger.error(`${response_message} - ${error}`);
    } else {
      logger.error(response_message);
    }
    return reject(new Error(response_message));
  },
};
