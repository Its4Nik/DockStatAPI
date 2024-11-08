import extractRelevantData from "../../utils/extractHostData.js";
import express from "express";
import {
  writeOfflineLog,
  readOfflineLog,
} from "../../utils/writeOfflineLog.js";
import getDockerClient from "../../utils/dockerClient.js";
import fetchAllContainers from "../../utils/containerService.js";
import { getCurrentSchedule } from "../../controllers/scheduler.js";
import logger from "../../utils/logger.js";
import path from "path";
import fs from "fs";
const configPath = "./config/dockerConfig.json";
const router = express.Router();

/**
 * @swagger
 * /api/hosts:
 *   get:
 *     summary: Retrieve a list of all available Docker hosts
 *     tags: [Hosts]
 *     responses:
 *       200:
 *         description: A JSON object containing an array of host names.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 hosts:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["local", "remote1"]
 */

router.get("/hosts", (req, res) => {
  const hosts = configPath.hosts.map((host) => host.name);
  logger.info("Fetching all available Docker hosts");
  res.status(200).json({ hosts });
});

/**
 * @swagger
 * /api/host/{hostName}/stats:
 *   get:
 *     summary: Retrieve statistics for a specified Docker host
 *     tags: [Hosts]
 *     parameters:
 *       - name: hostName
 *         in: path
 *         required: true
 *         description: The name of the host for which to fetch statistics.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A JSON object containing relevant statistics for the specified host.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 hostName:
 *                   type: string
 *                   description: The name of the Docker host.
 *                 info:
 *                   type: object
 *                   description: Information about the Docker host (e.g., storage, running containers).
 *                 version:
 *                   type: object
 *                   description: Version details of the Docker installation on the host.
 *       500:
 *         description: An error occurred while fetching host statistics.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message detailing the issue encountered.
 */
router.get("/host/:hostName/stats", async (req, res) => {
  const hostName = req.params.hostName;
  logger.info(`Fetching stats for host: ${hostName}`);
  if (process.env.OFFLINE === "true") {
    logger.info("Fetching offline Host Stats");
    res.status(200).json(readOfflineLog);
  } else {
    try {
      const docker = getDockerClient(hostName);
      const info = await docker.info();
      const version = await docker.version();
      const relevantData = extractRelevantData({ hostName, info, version });

      writeOfflineLog(JSON.stringify(relevantData));
      res.status(200).json(relevantData);
    } catch (error) {
      logger.error(
        `Error fetching stats for host: ${hostName} - ${error.message || "Unknown error"}`,
      );
      res.status(500).json({
        error: `Error fetching host stats: ${error.message || "Unknown error"}`,
      });
    }
  }
});

/**
 * @swagger
 * /api/containers:
 *   get:
 *     summary: Retrieve all Docker containers across all configured hosts
 *     tags: [Containers]
 *     responses:
 *       200:
 *         description: A JSON object containing container data for all hosts.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                     description: Name of the container.
 *                   id:
 *                     type: string
 *                     description: Unique identifier for the container.
 *                   hostName:
 *                     type: string
 *                     description: The host on which the container is running.
 *                   state:
 *                     type: string
 *                     description: Current state of the container (e.g., running, exited).
 *                   cpu_usage:
 *                     type: number
 *                     format: double
 *                     description: CPU usage in nanoseconds.
 *                   mem_usage:
 *                     type: number
 *                     description: Memory usage in bytes.
 *                   mem_limit:
 *                     type: number
 *                     description: Memory limit in bytes.
 *                   net_rx:
 *                     type: number
 *                     description: Total received bytes over the network.
 *                   net_tx:
 *                     type: number
 *                     description: Total transmitted bytes over the network.
 *                   current_net_rx:
 *                     type: number
 *                     description: Current received bytes over the network.
 *                   current_net_tx:
 *                     type: number
 *                     description: Current transmitted bytes over the network.
 *                   networkMode:
 *                     type: string
 *                     description: Network mode configured for the container.
 *                   link:
 *                     type: string
 *                     description: Optional link to additional information.
 *                   icon:
 *                     type: string
 *                     description: Optional icon representing the container.
 *                   tags:
 *                     type: string
 *                     description: Optional tags associated with the container.
 *       500:
 *         description: An error occurred while fetching container data.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message detailing the issue encountered.
 */
router.get("/containers", async (req, res) => {
  logger.info("Fetching all containers across all hosts");
  try {
    const allContainerData = await fetchAllContainers();
    res.status(200).json(allContainerData);
  } catch (error) {
    logger.error(`Error fetching containers: ${error.message}`);
    res.status(500).json({ error: "Failed to fetch containers" });
  }
});

/**
 * @swagger
 * /api/config:
 *   get:
 *     summary: Retrieve Docker configuration
 *     tags: [Configuration]
 *     responses:
 *       200:
 *         description: A JSON object containing the Docker configuration.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties: true
 *       500:
 *         description: An error occurred while loading the Docker configuration.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message detailing the issue encountered.
 */
router.get("/config", async (req, res) => {
  try {
    const rawData = fs.readFileSync(configPath);
    const jsonData = JSON.parse(rawData.toString());
    res.status(200).json(jsonData);
  } catch (error) {
    logger.error("Error loading dockerConfig.json: " + error.message);
    res.status(500).json({ error: "Failed to load Docker configuration" });
  }
});

/**
 * @swagger
 * /api/current-schedule:
 *   get:
 *     summary: Get the current fetch schedule in seconds
 *     tags: [Configuration]
 *     responses:
 *       200:
 *         description: Current fetch schedule retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 interval:
 *                   type: integer
 *                   description: Current fetch interval in seconds.
 */
router.get("/current-schedule", (req, res) => {
  const currentSchedule = getCurrentSchedule();
  res.json(currentSchedule);
});

/**
 * @swagger
 * /api/status:
 *   get:
 *     summary: Check server status
 *     tags: [Misc]
 *     description: Returns a 200 status with an "up" message to indicate the server is up and running. Used for Healthchecks
 *     responses:
 *       200:
 *         description: Server is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "up"
 */
router.get("/status", (req, res) => {
  res.status(200).json({ status: "up" });
});

/**
 * @swagger
 * /api/frontend-config:
 *   get:
 *     summary: Get Frontend Configuration
 *     tags: [Configuration]
 *     description: Retrieves the frontend configuration data.
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                     description: Container Name
 *                   hidden:
 *                     type: boolean
 *                     description: Whether the container is hidden
 *                   tags:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: Tags associated with the container
 *                   pinned:
 *                     type: boolean
 *                     description: Whether the container is pinned
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 */
router.get("/frontend-config", (req, res) => {
  const configPath = "/data/frontendConfiguration.json";
  try {
    const rawData = fs.readFileSync(configPath);
    const jsonData = JSON.parse(rawData.toString());
    res.status(200).json(jsonData);
  } catch (error) {
    logger.error("Error loading frontendConfiguration.json: " + error.message);
    res.status(500).json({ error: "Failed to load Frontend configuration" });
  }
});

export default router;
