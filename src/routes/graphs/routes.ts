import { Request, Response, Router } from "express";
import { createResponseHandler } from "../../handlers/response";
import { getGraphFilePaths } from "../../handlers/graph";
import path from "path";
const router = Router();

router.get("/", async (req: Request, res: Response) => {
  const ResponseHandler = createResponseHandler(res);
  try {
    const graphPaths = getGraphFilePaths();
    const graphPath = path.join(__dirname, "/../../../" + graphPaths.html);
    return res.contentType("html").status(200).sendFile(graphPath);
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return ResponseHandler.critical(errorMsg);
  }
});

export default router;
