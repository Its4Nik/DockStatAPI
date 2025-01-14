import express, { Router, Request, Response } from "express";
const router: Router = express.Router();
import { createStackHandler } from "../../handlers/stack";

router.post("/create/:name", async (req: Request, res: Response) => {
  const StackHandler = createStackHandler(req, res);
  StackHandler.createStack(req, res);
});

router.post("/start/:name", async (req: Request, res: Response) => {
  const StackHandler = createStackHandler(req, res);
  StackHandler.start(req, res);
});

router.post("/stop/:name", async (req: Request, res: Response) => {
  const StackHandler = createStackHandler(req, res);
  StackHandler.stop(req, res);
});

export default router;
