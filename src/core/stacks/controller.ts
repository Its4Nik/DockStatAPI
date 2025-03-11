import { dbFunctions } from "../database/repository";
import YAML from "yaml";
import { logger } from "../utils/logger";
import DockerCompose from "docker-compose";
import type { Stack, ComposeSpec } from "~/typings/docker-compose";
import type { stacks_config } from "~/typings/database";

async function getStackPath(stack: Stack): Promise<string> {
    const stackName = stack.name.trim().replace(/\s+/g, "_");
    return `stacks/${stackName}`;
}

async function createStackYAML(compose_spec: Stack): Promise<void> {
    const yaml = YAML.stringify(compose_spec.compose_spec);
    const stackPath = await getStackPath(compose_spec);
    await Bun.write(`${stackPath}/docker-compose.yaml`, yaml, { createPath: true });
}

export async function deployStack(
    stack: ComposeSpec,
    name: string,
    version: number,
    source: string,
    automatic_reboot_on_error: boolean,
    isCustom: boolean,
    image_updates: boolean,
    stack_prefix?: string
): Promise<void> {
    try {
        logger.debug(`Deploying Stack: ${JSON.stringify(stack)}`)

        const serviceCount = stack.services
            ? Object.keys(stack.services).length
            : 0;

        const resolvedPrefix = stack_prefix ?? "";

        const stack_config: stacks_config = {
            name: name,
            version: version,
            source,
            stack_prefix: resolvedPrefix,
            automatic_reboot_on_error,
            container_count: serviceCount,
            custom: isCustom,
            image_updates,
        };

        if (!stack.name) {
            logger.debug(`${JSON.stringify(stack)}`)
            throw new Error("Stack name needed")
        }

        dbFunctions.addStack(stack_config);

        const stackYaml: Stack = {
            name: name,
            source: source,
            version: version,
            compose_spec: stack,
        }
        await createStackYAML(stackYaml);
        const stackPath = await getStackPath(stackYaml);
        await DockerCompose.upAll({ cwd: stackPath });
    } catch (error: any) {
        throw new Error(`Error while deploying Stack: ${error.message || error}`);
    }
}

export async function stopStack(stack_name: string): Promise<void> {
    try {
        const stack = {
            name: stack_name
        }
        const stackPath = await getStackPath(stack as Stack);
        await DockerCompose.downAll({ cwd: stackPath });
    } catch (error: any) {
        throw new Error(`Error while stopping stack "${stack_name}": ${error.message || error}`);
    }
}

export async function startStack(stack_name: string): Promise<void> {
    try {
        const stack = {
            name: stack_name
        }
        const stackPath = await getStackPath(stack as Stack);
        await DockerCompose.upAll({ cwd: stackPath });
    } catch (error: any) {
        throw new Error(`Error while starting stack "${stack_name}": ${error.message || error}`);
    }
}

export async function pullStackImages(stack_name: string): Promise<void> {
    try {
        const stack = {
            name: stack_name
        }
        const stackPath = await getStackPath(stack as Stack);
        await DockerCompose.pullAll({ cwd: stackPath });
    } catch (error: any) {
        throw new Error(`Error while pulling images for stack "${stack_name}": ${error.message || error}`);
    }
}

export async function restartStack(stack_name: string): Promise<void> {
    try {
        const stack = {
            name: stack_name
        }
        const stackPath = await getStackPath(stack as Stack);
        await DockerCompose.restartAll({ cwd: stackPath });
    } catch (error: any) {
        throw new Error(`Error while restarting stack "${stack_name}": ${error.message || error}`);
    }
}

export async function getStackStatus(stack_name: string): Promise<any> {
    try {
        logger.debug("Retrieving status for Stack:", stack_name);
        const stackYaml = { name: stack_name };
        const stackPath = await getStackPath(stackYaml as Stack);
        const rawStatus = await DockerCompose.ps({ cwd: stackPath });

        return rawStatus.data.services.reduce((acc: any, service: any) => {
                    acc[(service.name)] = service.state;
                    return acc;
                }, {});

    } catch (error: any) {
        throw new Error(`Error while retrieving status for stack "${stack_name}": ${error.message || error}`);
    }
}

