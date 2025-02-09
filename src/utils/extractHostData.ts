import { JsonData } from "../typings/hostData";
import logger from "./logger";

type ComponentMap = Record<string, string>;

interface RelevantData {
  hostName: string;
  info: {
    ID: string;
    Containers: number;
    ContainersRunning: number;
    ContainersPaused: number;
    ContainersStopped: number;
    Images: number;
    OperatingSystem: string;
    KernelVersion: string;
    Architecture: string;
    MemTotal: number;
    NCPU: number;
  };
  version: {
    Components: ComponentMap;
  };
}

function processComponents(components: unknown): ComponentMap {
  try {
    if (!Array.isArray(components)) return {};

    return components.reduce<ComponentMap>((acc, component) => {
      if (
        typeof component === 'object' &&
        component !== null &&
        'Name' in component &&
        'Version' in component
      ) {
        const { Name, Version } = component;
        if (typeof Name === 'string' && typeof Version === 'string') {
          acc[Name] = Version;
        }
      }
      return acc;
    }, {});
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Error processing components: ${errorMessage}`);
    return {};
  }
}

export function extractRelevantData(jsonData: JsonData): RelevantData {
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
      Components: processComponents(jsonData?.version?.Components),
    },
  };
}

export default extractRelevantData;
