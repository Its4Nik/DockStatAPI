import { trpc } from "@elysiajs/trpc";
import { appRouter } from "./router";

export default trpc(appRouter, { endpoint: "/trpc" });
