import { Request, Response, Router } from "express";
import { createNotificationHandler } from "../../handlers/notification";
const router = Router();

router.get("/get-template", (req: Request, res: Response) => {
  const NotificationHandler = createNotificationHandler(req, res);
  return NotificationHandler.getTemplate();
});

router.post("/set-template", (req: Request, res: Response): void => {
  const NotificationHandler = createNotificationHandler(req, res);
  return NotificationHandler.setTemplate(req);
});

router.post("/test/:type/:containerId", async (req: Request, res: Response) => {
  const NotificationHandler = createNotificationHandler(req, res);
  NotificationHandler.test(req);
});

export default router;
