import { router, t } from "./trpc";
import { configProcedure } from "./procedures/api-config.procedure";
import { dockerManagerProcedure } from "./procedures/docker-manager.procedure";
import { dockerStatsProcedure } from "./procedures/docker-stats.procedure";
import { logsProcedure } from "./procedures/logs.procedure";
import { stacksProcedure } from "./procedures/stacks.procedure";

export const appRouter = router({
  config: configProcedure,
  docker: router({
    manager: dockerManagerProcedure,
    stats: dockerStatsProcedure,
  }),
  logs: logsProcedure,
  stacks: stacksProcedure,
  health: router({
    check: t.procedure.query(() => ({ status: "healthy" })),
  }),
});

export type AppRouter = typeof appRouter;
