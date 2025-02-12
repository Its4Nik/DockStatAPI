import supertest from "supertest";
import { startServer } from "../src/utils/startServer";
import app from "../src/server";
import { Server } from "http";

const port = 13004;
const server = new Server(app);

startServer(app, server, port);

const request = supertest(`http://localhost:${port}`);

const sec: number = 1000;

const mockContainer: string = "dockstatapi";
const mockLink: string = "https://github.com/its4nik/dockstatapi";
const mockIcon: string = "dockstatapi.png";
const mockTag1: string = "backend";
const mockTag2: string = "local";

const verifiedResponse = [
  {
    name: "dockstatapi",
    tags: ["backend", "local"],
    pinned: true,
    link: "https://github.com/its4nik/dockstatapi",
    icon: "dockstatapi.png",
    hidden: true,
  },
];

describe("Test frontend specific configurations", () => {
  it(
    "Setup the configuration file",
    async () => {
      // Hide container
      let res = await request.delete(`/frontend/hide/${mockContainer}`);

      expect(res.status).toEqual(200);

      // Add Tag(s)
      res = await request.post(`/frontend/tag/${mockContainer}/${mockTag1}`);

      expect(res.status).toEqual(200);
      res = await request.post(`/frontend/tag/${mockContainer}/${mockTag2}`);

      expect(res.status).toEqual(200);

      // Pin container
      res = await request.post(`/frontend/pin/${mockContainer}`);

      expect(res.status).toEqual(200);

      // Add link
      res = await request.post(
        `/frontend/add-link/${mockContainer}/${encodeURIComponent(mockLink)}`,
      );

      expect(res.status).toEqual(200);

      // Add icon
      res = await request.post(
        `/frontend/add-icon/${mockContainer}/${mockIcon}/false`,
      );

      expect(res.status).toEqual(200);
    },
    60 * sec,
  );

  it("Verify the configuration", async () => {
    const res = await request.get("/api/frontend-config");

    expect(res.status).toEqual(200);
    expect(res.body).toEqual(verifiedResponse);
  });

  it(
    "Reset configuration",
    async () => {
      // Show container
      let res = await request.post(`/frontend/show/${mockContainer}`);

      expect(res.status).toEqual(200);

      // Remove tag(s)
      res = await request.delete(
        `/frontend/remove-tag/${mockContainer}/${mockTag1}`,
      );

      expect(res.status).toEqual(200);

      res = await request.delete(
        `/frontend/remove-tag/${mockContainer}/${mockTag2}`,
      );

      expect(res.status).toEqual(200);

      // Unpin
      res = await request.delete(`/frontend/unpin/${mockContainer}`);

      expect(res.status).toEqual(200);

      // Remove link
      res = await request.delete(`/frontend/remove-link/${mockContainer}`);

      expect(res.status).toEqual(200);

      // Remove icon
      res = await request.delete(`/frontend/remove-icon/${mockContainer}`);

      expect(res.status).toEqual(200);
    },
    60 * sec,
  );

  it("Verify the reset configuration", async () => {
    const res = await request.get("/api/frontend-config");

    expect(res.status).toEqual(200);
    expect(res.body).toEqual([]);
  });
});
