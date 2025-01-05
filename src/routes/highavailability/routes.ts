import { Router, Request, Response } from "express";
import { SyncRequestBody } from "../../typings/syncRequestBody";
import { createHaHandler } from "../../handlers/ha";
const router = Router();

router.get("/config", async (req: Request, res: Response) => {
  const HaHandler = createHaHandler(req, res);
  return HaHandler.config();
});

router.post(
  "/sync",
  async (
    req: Request<{}, {}, SyncRequestBody>, // eslint-disable-line
    res: Response,
  ): Promise<void> => {
    const HaHandler = createHaHandler(req, res);
    return HaHandler.sync(req);
  },
);

router.get("/prepare-sync", async (req: Request, res: Response) => {
  const HaHandler = createHaHandler(req, res);
  return HaHandler.prepare();
});

export default router;
