import express, { Router, Request, Response } from "express";
const router: Router = express.Router();
import { createStackHandler } from "../../handlers/stack";

router.post("/create/:name", async (req: Request, res: Response) => {
  const StackHandler = createStackHandler(req, res);
  return StackHandler.createStack(req, res);
});

router.post("/start/:name", async (req: Request, res: Response) => {
  const StackHandler = createStackHandler(req, res);
  return StackHandler.start(req, res);
});

router.post("/stop/:name", async (req: Request, res: Response) => {
  const StackHandler = createStackHandler(req, res);
  return StackHandler.stop(req, res);
});

router.get("/get/:name", async (req: Request, res: Response) => {
  const StackHandler = createStackHandler(req, res);
  return await StackHandler.stackCompose(req, res);
});

router.post("/set-env/:name", async (req: Request, res: Response) => {
  const StackHandler = createStackHandler(req, res);
  return await StackHandler.setStackEnv(req, res);
});

router.get("/get-env/:name", async (req: Request, res: Response) => {
  const StackHandler = createStackHandler(req, res);
  return await StackHandler.getStackEnv(req, res);
});

export default router;
