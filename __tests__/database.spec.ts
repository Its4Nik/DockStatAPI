import supertest from "supertest";
import { startServer } from "../src/utils/startServer";
import app from "../src/server";

startServer(app, 13003);
const server = supertest("http://localhost:13003");

describe("Database", () => {
  it("Get latest database entry", async () => {
    const res = await server.get("/data/latest");
    expect(res.status).toEqual(200);
  });

  it("Get all database entries", async () => {
    const res = await server.get("/data/all");
    expect(res.status).toEqual(200);
  });

  it("Clear database", async () => {
    let res = await server.delete("/data/clear");
    expect(res.status).toEqual(200);

    res = await server.get("/data/latest");
    expect(res.status).toEqual(404);
    expect(res.body).toHaveProperty(
      "message",
      "No data available for /data/latest",
    );
  });
});
