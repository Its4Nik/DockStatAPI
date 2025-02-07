import { Router, Request, Response } from "express";
import { createApiHandler } from "../../handlers/api";
const router = Router();

router.get("/hosts", (req: Request, res: Response) => {
  const ApiHandler = createApiHandler(req, res);
  return ApiHandler.hosts();
});

router.get("/system", (req: Request, res: Response) => {
  const ApiHandler = createApiHandler(req, res);
  return ApiHandler.system();
});

router.get("/host/:hostName/stats", async (req: Request, res: Response) => {
  const { hostName } = req.params;
  const ApiHandler = createApiHandler(req, res);
  return ApiHandler.hostStats(hostName);
});

router.get("/containers", async (req: Request, res: Response) => {
  const ApiHandler = createApiHandler(req, res);
  return ApiHandler.containers();
});

router.get("/config", async (req: Request, res: Response) => {
  const ApiHandler = createApiHandler(req, res);
  return ApiHandler.config();
});

router.get("/current-schedule", (req: Request, res: Response) => {
  const ApiHandler = createApiHandler(req, res);
  return ApiHandler.currentSchedule();
});

router.get("/status", async (req: Request, res: Response) => {
  const ApiHandler = createApiHandler(req, res);
  return ApiHandler.status();
});

router.get("/frontend-config", (req: Request, res: Response) => {
  const ApiHandler = createApiHandler(req, res);
  return ApiHandler.frontendConfig();
});

export default router;
