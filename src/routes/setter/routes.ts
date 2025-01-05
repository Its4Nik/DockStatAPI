import express, { Router, Request, Response } from "express";
import { createConfHandler } from "../../handlers/conf";
const router: Router = express.Router();

router.put("/addHost", async (req: Request, res: Response): Promise<void> => {
  const ConfHandler = createConfHandler(req, res);
  return ConfHandler.addHost(req);
});

router.delete("/removeHost", (req: Request, res: Response): void => {
  const ConfHandler = createConfHandler(req, res);
  return ConfHandler.removeHost(req);
});

router.put("/scheduler", (req: Request, res: Response) => {
  const ConfHandler = createConfHandler(req, res);
  return ConfHandler.scheduler(req);
});

export default router;
