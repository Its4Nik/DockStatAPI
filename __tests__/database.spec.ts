import supertest from "supertest";
import { startServer } from "../src/utils/startServer";
import app from "../src/server";
import { Server } from "http";

const port = 13003;
const server = new Server(app);

startServer(app, server, port);

const request = supertest(`http://localhost:${port}`);

describe("Database", () => {
  it("Get latest database entry", async () => {
    const res = await request.get("/data/latest");
    expect(res.status).toEqual(200);
  });

  it("Get all database entries", async () => {
    const res = await request.get("/data/all");
    expect(res.status).toEqual(200);
  });

  it("Clear database", async () => {
    let res = await request.delete("/data/clear");
    expect(res.status).toEqual(200);

    res = await request.get("/data/latest");
    expect(res.status).toEqual(404);
    expect(res.body).toHaveProperty(
      "message",
      "No data available for /data/latest",
    );
  });
});
