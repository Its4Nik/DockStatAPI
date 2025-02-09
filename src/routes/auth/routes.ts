import { Router, Request, Response } from "express";
import { createAuthenticationHandler } from "../../handlers/auth";

const router = Router();

router.post("/enable", async (req: Request, res: Response): Promise<void> => {
  const password = req.query.password as string;
  const handler = createAuthenticationHandler(req, res);
  await handler.enable(password);
});

router.post("/disable", async (req: Request, res: Response): Promise<void> => {
  const password = req.query.password as string;
  const handler = createAuthenticationHandler(req, res);
  await handler.disable(password);
});

export default router;
