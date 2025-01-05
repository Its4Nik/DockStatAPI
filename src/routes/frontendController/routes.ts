import express from "express";
const router = express.Router();
import { createFrontendHandler } from "../../handlers/frontend";

router.post("/show/:containerName", async (req, res) => {
  const FrontendHandler = createFrontendHandler(req, res);
  const containerName = req.params.containerName;
  return FrontendHandler.show(containerName);
});

router.post("/tag/:containerName/:tag", async (req, res) => {
  const { containerName, tag } = req.params;
  const FrontendHandler = createFrontendHandler(req, res);
  return FrontendHandler.addTag(containerName, tag);
});

router.post("/pin/:containerName", async (req, res) => {
  const { containerName } = req.params;
  const FrontendHandler = createFrontendHandler(req, res);
  return FrontendHandler.pin(containerName);
});

router.post("/add-link/:containerName/:link", async (req, res) => {
  const { containerName, link } = req.params;
  const FrontendHandler = createFrontendHandler(req, res);
  return FrontendHandler.addLink(containerName, link);
});

router.post(
  "/add-icon/:containerName/:icon/:useCustomIcon",
  async (req, res) => {
    const { containerName, icon, useCustomIcon } = req.params;
    const FrontendHandler = createFrontendHandler(req, res);
    return FrontendHandler.addIcon(containerName, icon, useCustomIcon);
  },
);

/*
 ____  _____ _     _____ _____ _____
|  _ \| ____| |   | ____|_   _| ____|
| | | |  _| | |   |  _|   | | |  _|
| |_| | |___| |___| |___  | | | |___
|____/|_____|_____|_____| |_| |_____|
*/

router.delete("/hide/:containerName", async (req, res) => {
  const { containerName } = req.params;
  const FrontendHandler = createFrontendHandler(req, res);
  return FrontendHandler.hide(containerName);
});

router.delete("/remove-tag/:containerName/:tag", async (req, res) => {
  const { containerName, tag } = req.params;
  const FrontendHandler = createFrontendHandler(req, res);
  return FrontendHandler.removeTag(containerName, tag);
});

router.delete("/unpin/:containerName", async (req, res) => {
  const { containerName } = req.params;
  const FrontendHandler = createFrontendHandler(req, res);
  return FrontendHandler.unPin(containerName);
});

router.delete("/remove-link/:containerName", async (req, res) => {
  const { containerName } = req.params;
  const FrontendHandler = createFrontendHandler(req, res);
  return FrontendHandler.removeLink(containerName);
});

router.delete("/remove-icon/:containerName", async (req, res) => {
  const { containerName } = req.params;
  const FrontendHandler = createFrontendHandler(req, res);
  return FrontendHandler.removeIcon(containerName);
});

export default router;
