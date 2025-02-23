import { Elysia } from "elysia";

export const logRoutes = new Elysia({ prefix: "/logs" }).ws("/:containerId", {
  open(ws) {
    const containerId = ws.data.params.containerId;
    console.log(`New log connection for ${containerId}`);
  },
  message(ws, message) {
    ws.send(message);
  },
});
