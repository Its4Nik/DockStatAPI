import { Elysia, error, t } from "elysia";
import { responseHandler } from "~/core/utils/respone-handler";
import {
    deployStack,
    stopStack,
    pullStackImages,
    restartStack,
    getStackStatus,
    startStack
} from "~/core/stacks/controller";
import { dbFunctions } from "~/core/database/repository";
import { logger } from "~/core/utils/logger";

export const stackRoutes = new Elysia({ prefix: "/stacks" })
    .post(
        "/deploy",
        async ({ set, body }) => {
            try {
                const isCustom = body.isCustom
                    ? body.isCustom
                    : false;

                const image_updates = body.image_updates || false;


                let errMsg: string = "";
                if (!body.compose_spec) {
                    errMsg = "compose_spec"
                }

                if (!body.automatic_reboot_on_error) {
                    errMsg = `${errMsg} automatic_reboot_on_error`
                }

                if (!body.source) {
                    errMsg = `${errMsg} source`
                }

                if (!body.name) {
                    errMsg = `${errMsg} name`
                }

                if (errMsg) {
                    errMsg = errMsg.trim();
                    errMsg = `Missing values of: ${errMsg.replaceAll(" ", "; ")}`
                    return responseHandler.error(set, errMsg, errMsg)
                }

                await deployStack(
                    body.compose_spec,
                    body.name,
                    body.version,
                    body.source,
                    body.automatic_reboot_on_error,
                    isCustom,
                    image_updates,
                    body.stack_prefix
                );
                logger.info(`Deployed Stack (${body.name})`)
                return responseHandler.ok(
                    set,
                    `Stack ${body.name} deployed successfully`
                );
            } catch (error: any) {
                return responseHandler.error(
                    set,
                    error.message || error,
                    "Error deploying stack"
                );
            }
        },
        {
            detail: { tags: ["Stacks"] },
            body: t.Object({
                compose_spec: t.Any(),
                name: t.String(),
                version: t.Number(),
                automatic_reboot_on_error: t.Boolean(),
                isCustom: t.Boolean(),
                image_updates: t.Boolean(),
                source: t.String(),
                stack_prefix: t.Optional(t.String()),
            }),
        }
    )
    .post(
        "/start",
        async ({ set, body }) => {
            try {
                if (!body.stack) {
                    throw new Error("Stack needed")
                }
                await startStack(body.stack);
                logger.info(`Started Stack (${body.stack})`)
                return responseHandler.ok(
                    set,
                    `Stack ${body.stack} started successfully`
                );
            } catch (error: any) {
                return responseHandler.error(
                    set,
                    error.message || error,
                    "Error starting stack"
                );
            }
        },
        {
            detail: { tags: ["Stacks"] },
            body: t.Object({
                stack: t.Any(),
            }),
        }
    )
    .post(
        "/stop",
        async ({ set, body }) => {
            try {
                if (!body.stack) {
                    throw new Error("Stack needed")
                }
                await stopStack(body.stack);
                logger.info(`Stopped Stack (${body.stack})`)
                return responseHandler.ok(
                    set,
                    `Stack ${body.stack} stopped successfully`
                );
            } catch (error: any) {
                return responseHandler.error(
                    set,
                    error.message || error,
                    "Error stopping stack"
                );
            }
        },
        {
            detail: { tags: ["Stacks"] },
            body: t.Object({
                stack: t.Any(),
            }),
        }
    )
    .post(
        "/restart",
        async ({ set, body }) => {
            try {
                if (!body.stack) {
                    throw new Error("Stack needed")
                }
                await restartStack(body.stack);
                logger.info(`Restarted Stack (${body.stack})`)
                return responseHandler.ok(
                    set,
                    `Stack ${body.stack} restarted successfully`
                );
            } catch (error: any) {
                return responseHandler.error(
                    set,
                    error.message || error,
                    "Error restarting stack"
                );
            }
        },
        {
            detail: { tags: ["Stacks"] },
            body: t.Object({
                stack: t.Any(),
            }),
        }
    )
    .post(
        "/pull-images",
        async ({ set, body }) => {
            try {
                if (!body.stack) {
                    throw new Error("Stack needed")
                }
                await pullStackImages(body.stack);
                logger.info(`Pulled Stack images (${body.stack})`)
                return responseHandler.ok(
                    set,
                    `Images for stack ${body.stack} pulled successfully`
                );
            } catch (error: any) {
                return responseHandler.error(
                    set,
                    error.message || error,
                    "Error pulling images"
                );
            }
        },
        {
            detail: { tags: ["Stacks"] },
            body: t.Object({
                stack: t.Any(),
            }),
        }
    )
    .get(
        "/status",
        async ({ set, query }) => {
            try {
                if (!query.stack_name) {
                    throw new Error("Stack needed")
                }
                logger.debug(query.stack_name)
                const status = await getStackStatus(query.stack_name);
                const res = responseHandler.ok(
                    set,
                    `Stack ${query.stack_name} status retrieved successfully`
                );
                logger.info("Fetched Stack status")
                return { ...res, status: status };
            } catch (error: any) {
                return responseHandler.error(
                    set,
                    error.message || error,
                    "Error getting stack status"
                );
            }
        },
        {
            detail: { tags: ["Stacks"] },
            query: t.Object({
                stack_name: t.Any(),
            }),
        }
    )
    .get("/", async ({ set }) => {
        try {
            const stacks = dbFunctions.getStacks();
            logger.info("Fetched Stacks")
            return stacks;
        } catch (error: any) {
            return responseHandler.error(
                set,
                error.message || error,
                "Error getting stacks"
            );
        }
    },
        {
            detail: { tags: ["Stacks"] },
        }
    );
