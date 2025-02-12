import supertest from "supertest";
import { startServer } from "../src/utils/startServer";
import app from "../src/server";
import { Server } from "http";

const port = 13002;
const server = new Server(app);

startServer(app, server, port);

const request = supertest(`http://localhost:${port}`);

const mockServerName: string = "mockstatapi";
const mockServerIP: string = "127.0.0.1";
const mockServerPort: number = 2375;

describe("Config endpoints", () => {
  it("Add an host", async () => {
    let res = await request.put(
      `/conf/addHost?name=${mockServerName}&url=${mockServerIP}&port=${mockServerPort}`,
    );
    expect(res.status).toEqual(200);

    res = await request.get("/api/hosts");
    expect(res.status).toEqual(200);
    expect(res.body).toContain("mockstatapi");
  });

  it("Adjust scheduler", async () => {
    let res = await request.put("/conf/scheduler?interval=10m");
    expect(res.status).toEqual(200);

    res = await request.get("/api/current-schedule");
    expect(res.status).toEqual(200);

    // Reset to standart 5m
    res = await request.put("/conf/scheduler?interval=5m");
    expect(res.status).toEqual(200);
  });

  it("Remove Host from config", async () => {
    let res = await request.delete(`/conf/removeHost?hostName=mockstatapi`);
    expect(res.status).toEqual(200);

    res = await request.get("/api/hosts");
    expect(res.status).toEqual(200);
    expect(res.body).not.toHaveProperty("mockstatapi");
  });
});
