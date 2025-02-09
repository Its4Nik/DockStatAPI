export const testPass = "123456789";
import { Server } from 'http';
import supertest from "supertest";
import { startServer } from "../src/utils/startServer";
import app from "../src/server";

const port = 13001;
const server = new Server(app);

startServer(app, server, port);

const request = supertest(`http://localhost:${port}`);

describe("Authentication", () => {
  it("Enable Authentication", async () => {
    const res = await request.post(`/auth/enable?password=${testPass}`);
    expect(res.status).toEqual(200);
    expect(res.type).toEqual(expect.stringContaining("json"));
    expect(res.body).toHaveProperty(
      "message",
      "Authentication enabled successfully",
    );
  });

  it("Test no password", async () => {
    const res = await request.get("/api/status");
    expect(res.status).toEqual(403);
    expect(res.type).toEqual(expect.stringContaining("json"));
  });

  it("Disable authentication", async () => {
    const res = await request
      .post(`/auth/disable?password=${testPass}`)
      .set("x-password", testPass);
    expect(res.status).toEqual(200);
    expect(res.type).toEqual(expect.stringContaining("json"));
  });
});