import express, { Router, Request, Response } from "express";
const router: Router = express.Router();
import { createStackHandler } from "../../handlers/stack";

router.post("/create/:name", async (req: Request, res: Response) => {
  const StackHandler = createStackHandler(req, res);
  StackHandler.createStack(req, res)
});

export default router;
