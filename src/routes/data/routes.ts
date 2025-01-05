import express, { Request, Response } from "express";
const router = express.Router();
import { createDatabaseHandler } from "../../handlers/data";

router.get("/latest", (req: Request, res: Response) => {
  const DatabaseHandler = createDatabaseHandler(req, res);
  return DatabaseHandler.latest();
});

router.get("/all", (req: Request, res: Response) => {
  const DatabaseHandler = createDatabaseHandler(req, res);
  return DatabaseHandler.all();
});

router.delete("/clear", (req: Request, res: Response) => {
  const DatabaseHandler = createDatabaseHandler(req, res);
  return DatabaseHandler.clear();
});

export default router;
