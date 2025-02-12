import cytoscape from "cytoscape";
import logger from "../utils/logger";
import { AllContainerData, ContainerData } from "./../typings/dockerConfig";
import { atomicWrite } from "../utils/atomicWrite";

const CACHE_DIR_JSON = "./src/data/graph.json";

async function generateGraphJSON(
  allContainerData: AllContainerData,
): Promise<boolean> {
  try {
    logger.info("generateGraphJSON >>> Starting generation");

    // Define the new JSON structure
    const graphData = {
      nodes: [] as cytoscape.ElementDefinition[],
      edges: [] as cytoscape.ElementDefinition[],
    };

    for (const [hostName, containers] of Object.entries(allContainerData)) {
      if ("error" in containers) {
        graphData.nodes.push({
          data: {
            id: hostName,
            label: `Host: ${hostName} Error: ${containers.error}`,
            type: "server",
            error: true,
          },
        });
      } else {
        const containerList = containers as ContainerData[];

        // Host node with container count and metadata
        graphData.nodes.push({
          data: {
            id: hostName,
            label: `${hostName}\n${containerList.length} Containers`,
            type: "server",
            hostName,
            containerCount: containerList.length,
          },
        });

        for (const container of containerList) {
          const { id, ...otherContainerProps } = container;

          graphData.nodes.push({
            data: {
              id: id,
              label: `${container.name}\n${container.state.toUpperCase()}`,
              type: "container",
              ...otherContainerProps,
            },
          });

          // Edge between host and container
          graphData.edges.push({
            data: {
              id: `${hostName}-${container.id}`,
              source: hostName,
              target: container.id,
              connectionType: "host-container",
            },
          });
        }
      }
    }

    // Write the new structured JSON to file
    atomicWrite(CACHE_DIR_JSON, JSON.stringify(graphData, null, 2));
    logger.info("generateGraphJSON <<< JSON file generated successfully");
    return true;
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(errorMsg);
    return false;
  }
}

function getGraphFilePath() {
  return { json: CACHE_DIR_JSON };
}

export { generateGraphJSON, getGraphFilePath };
