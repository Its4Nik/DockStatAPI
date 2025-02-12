import { createPreviousResponse } from "./util/previousResponse";
import supertest from "supertest";
import { startServer } from "../src/utils/startServer";
import app from "../src/server";
import { Server } from "http";

const port = 13005;
const server = new Server(app);

startServer(app, server, port);

const request = supertest(`http://localhost:${port}`);
const PreviousResponse = createPreviousResponse();

describe("Get endpoints", () => {
  it("GET /api/hosts", async () => {
    const res = await request.get("/api/hosts");
    expect(res.status).toEqual(200);
    expect(res.type).toEqual(expect.stringContaining("json"));

    const hosts: string[] = res.body;

    if (hosts.length >= 1) {
      expect(Array.isArray(hosts)).toBe(true);
      expect(hosts.length).toBeGreaterThan(0);
      expect(typeof hosts[0]).toBe("string");
      PreviousResponse.set(hosts[0]);
    }
  });

  it("GET /api/host/:host/stats", async () => {
    const host = PreviousResponse.get();

    if (!host) {
      console.log("No hosts found, skipping /api/host/:host/stats test");
      return;
    }

    const res = await request.get(`/api/host/${host}/stats`);

    expect(res.status).toEqual(200);
    expect(res.type).toEqual(expect.stringContaining("json"));
  });

  it("GET /api/system", async () => {
    const res = await request.get("/api/system");
    expect(res.status).toEqual(200);
    expect(res.type).toEqual(expect.stringContaining("json"));
  });

  it("GET /api/status", async () => {
    const res = await request.get("/api/status");
    expect(res.status).toEqual(200);
    expect(res.type).toEqual(expect.stringContaining("json"));
    expect(res.body).toHaveProperty("ApiReachable", true);
  });

  it("GET /api/containers", async () => {
    const res = await request.get("/api/containers");
    expect(res.status).toEqual(200);
    expect(res.type).toEqual(expect.stringContaining("json"));
  });

  it("GET /api/config", async () => {
    const res = await request.get("/api/config");
    expect(res.status).toEqual(200);
    expect(res.type).toEqual(expect.stringContaining("json"));
    expect(res.body).toHaveProperty("hosts");
  });

  it("GET /api/current-schedule", async () => {
    const res = await request.get("/api/current-schedule");

    expect(res.status).toEqual(200);
    expect(res.type).toEqual(expect.stringContaining("json"));
    expect(res.body).toHaveProperty("interval");
  });

  it("GET /api/frontend-config", async () => {
    const res = await request.get("/api/frontend-config");

    expect(res.status).toEqual(200);
    expect(res.type).toEqual(expect.stringContaining("json"));
  });

  it("GET /ha/config", async () => {
    const res = await request.get("/ha/config");
    expect(res.status).toEqual(200);
    expect(res.type).toEqual(expect.stringContaining("json"));
  });

  it("GET /notification-service/get-template", async () => {
    const res = await request.get("/notification-service/get-template");

    expect(res.status).toEqual(200);
    expect(res.type).toEqual(expect.stringContaining("json"));
    expect(res.body).toHaveProperty("text");
  });
});
