import express, { Router, Request, Response } from "express";
import { createConfHandler } from "../../handlers/conf";
const router: Router = express.Router();

/**
 * @swagger
 * /conf/addHost:
 *   put:
 *     summary: Add a new host to the Docker configuration
 *     tags: [Configuration]
 *     parameters:
 *       - name: name
 *         in: query
 *         required: true
 *         description: The name of the new host.
 *       - name: url
 *         in: query
 *         required: true
 *         description: The URL of the new host.
 *       - name: port
 *         in: query
 *         required: true
 *         description: The port of the new host.
 *     responses:
 *       200:
 *         description: Host added successfully.
 *       400:
 *         description: Bad request, invalid input.
 *       500:
 *         description: An error occurred while adding the host.
 */
router.put("/addHost", async (req: Request, res: Response): Promise<void> => {
  const ConfHandler = createConfHandler(req, res);
  return ConfHandler.addHost(req);
});

/**
 * @swagger
 * /conf/scheduler:
 *   put:
 *     summary: Set fetch interval for data fetching
 *     tags: [Configuration]
 *     parameters:
 *       - name: interval
 *         in: query
 *         required: true
 *         description: The new interval for fetching data, e.g., "6h 20m", "300s".
 *     responses:
 *       200:
 *         description: Fetch interval set successfully.
 *       400:
 *         description: Invalid interval format or out of range.
 */
router.put("/scheduler", (req: Request, res: Response) => {
  const ConfHandler = createConfHandler(req, res);
  return ConfHandler.scheduler(req);
});

/**
 * @swagger
 * /conf/removeHost:
 *   delete:
 *     summary: Remove a host from the Docker configuration
 *     tags: [Configuration]
 *     parameters:
 *       - name: hostName
 *         in: query
 *         required: true
 *         description: The name of the host to remove.
 *     responses:
 *       200:
 *         description: Host removed successfully.
 *       404:
 *         description: Host not found.
 *       500:
 *         description: An error occurred while removing the host.
 */
router.delete("/removeHost", (req: Request, res: Response): void => {
  const ConfHandler = createConfHandler(req, res);
  return ConfHandler.removeHost(req);
});

export default router;
