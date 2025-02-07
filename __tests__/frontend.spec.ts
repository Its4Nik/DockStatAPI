import supertest from "supertest";
import { startServer } from "../src/utils/startServer";
import app from "../src/server";

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

startServer(app, 13004);

const server = supertest("http://localhost:13004");

describe("Test frontend specific configurations", () => {
  it(
    "Setup the configuration file",
    async () => {
      // Hide container
      let res = await server.delete(`/frontend/hide/${mockContainer}`);

      expect(res.status).toEqual(200);

      // Add Tag(s)
      res = await server.post(`/frontend/tag/${mockContainer}/${mockTag1}`);

      expect(res.status).toEqual(200);
      res = await server.post(`/frontend/tag/${mockContainer}/${mockTag2}`);

      expect(res.status).toEqual(200);

      // Pin container
      res = await server.post(`/frontend/pin/${mockContainer}`);

      expect(res.status).toEqual(200);

      // Add link
      res = await server.post(
        `/frontend/add-link/${mockContainer}/${encodeURIComponent(mockLink)}`,
      );

      expect(res.status).toEqual(200);

      // Add icon
      res = await server.post(
        `/frontend/add-icon/${mockContainer}/${mockIcon}/false`,
      );

      expect(res.status).toEqual(200);
    },
    60 * sec,
  );

  it("Verify the configuration", async () => {
    const res = await server.get("/api/frontend-config");

    expect(res.status).toEqual(200);
    expect(res.body).toEqual(verifiedResponse);
  });

  it(
    "Reset configuration",
    async () => {
      // Show container
      let res = await server.post(`/frontend/show/${mockContainer}`);

      expect(res.status).toEqual(200);

      // Remove tag(s)
      res = await server.delete(
        `/frontend/remove-tag/${mockContainer}/${mockTag1}`,
      );

      expect(res.status).toEqual(200);

      res = await server.delete(
        `/frontend/remove-tag/${mockContainer}/${mockTag2}`,
      );

      expect(res.status).toEqual(200);

      // Unpin
      res = await server.delete(`/frontend/unpin/${mockContainer}`);

      expect(res.status).toEqual(200);

      // Remove link
      res = await server.delete(`/frontend/remove-link/${mockContainer}`);

      expect(res.status).toEqual(200);

      // Remove icon
      res = await server.delete(`/frontend/remove-icon/${mockContainer}`);

      expect(res.status).toEqual(200);
    },
    60 * sec,
  );

  it("Verify the reset configuration", async () => {
    const res = await server.get("/api/frontend-config");

    expect(res.status).toEqual(200);
    expect(res.body).toEqual([]);
  });
});
