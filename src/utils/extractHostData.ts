import { JsonData } from "../typings/hostData";
import logger from "./logger";

type ComponentMap = Record<string, string>;

// Export the function with type annotations
function extractRelevantData(jsonData: JsonData) {
  return {
    hostName: jsonData.hostName,
    info: {
      ID: jsonData.info.ID,
      Containers: jsonData.info.Containers,
      ContainersRunning: jsonData.info.ContainersRunning,
      ContainersPaused: jsonData.info.ContainersPaused,
      ContainersStopped: jsonData.info.ContainersStopped,
      Images: jsonData.info.Images,
      OperatingSystem: jsonData.info.OperatingSystem,
      KernelVersion: jsonData.info.KernelVersion,
      Architecture: jsonData.info.Architecture,
      MemTotal: jsonData.info.MemTotal,
      NCPU: jsonData.info.NCPU,
    },
    version: {
      Components: (() => {
        try {
          if (!Array.isArray(jsonData?.version?.Components)) {
            return {};
          }

          return jsonData.version.Components.reduce<ComponentMap>(
            (acc, component) => {
              if (
                typeof component?.Name === "string" &&
                typeof component?.Version === "string"
              ) {
                acc[component.Name] = component.Version;
              }
              return acc;
            },
            {},
          );
        } catch (error: unknown) {
          const errorMsg =
            error instanceof Error ? error.message : String(error);
          logger.error(errorMsg);
          return false;
        }
      })(),
    },
  };
}

export default extractRelevantData;
