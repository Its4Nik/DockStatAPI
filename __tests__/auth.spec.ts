export const testPass: string = "123321";
import supertest from "supertest";
import { startServer } from "../src/utils/startServer";
import app from "../src/server";
const server = supertest("http://localhost:13001");

startServer(app, 13001);

describe("Authentication", () => {
  it("Enable Authentication", async () => {
    const res = await server.post(`/auth/enable?password=${testPass}`);
    expect(res.status).toEqual(200);
    expect(res.type).toEqual(expect.stringContaining("json"));
    expect(res.body).toHaveProperty(
      "message",
      "Authentication enabled successfully",
    );
  });

  it("Test no password", async () => {
    const res = await server.get("/api/status");
    expect(res.status).toEqual(403);
    expect(res.type).toEqual(expect.stringContaining("json"));
  });

  it("Disable authentication", async () => {
    const res = await server
      .post(`/auth/disable?password=${testPass}`)
      .set("x-password", testPass);
    expect(res.status).toEqual(200);
    expect(res.type).toEqual(expect.stringContaining("json"));
  });
});
