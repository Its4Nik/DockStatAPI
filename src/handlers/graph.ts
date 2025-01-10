import cytoscape from "cytoscape";
import logger from "../utils/logger";
import { AllContainerData, ContainerData } from "./../typings/dockerConfig";
import { atomicWrite } from "../utils/atomicWrite";

const CACHE_DIR_JSON = "./src/data/graph.json";
const CACHE_DIR_HTML = "./src/data/graph.html";
const CACHE_DIR_RES = "/src/data/graph.html";

async function generateGraphFiles(
  allContainerData: AllContainerData,
): Promise<boolean> {
  try {
    logger.info("generateGraphFiles >>> Starting generation");
    const graphElements: cytoscape.ElementDefinition[] = [];

    for (const [hostName, containers] of Object.entries(allContainerData)) {
      if ("error" in containers) {
        // TODO: make error'ed hosts better
        graphElements.push({
          data: {
            id: hostName,
            label: `Host: ${hostName} Error: ${containers.error}`,
            type: "server",
          },
        });
      } else {
        const containerList = containers as ContainerData[];

        // host node with container count
        graphElements.push({
          data: {
            id: hostName,
            label: `${hostName} - ${containerList.length} Containers`,
            type: "server",
          },
        });

        for (const container of containerList) {
          // container node
          graphElements.push({
            data: {
              id: container.id,
              label: `${container.name} (${container.state})`,
              type: "container",
            },
          });

          // edge between host and container
          graphElements.push({
            data: {
              source: hostName,
              target: container.id,
            },
          });
        }
      }
    }

    atomicWrite(CACHE_DIR_JSON, JSON.stringify(graphElements, null, 2));

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cytoscape Graph</title>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/cytoscape/3.24.0/cytoscape.min.js"></script>
        <style>
          #cy {
            width: 100%;
            height: 100vh;
            display: block;
          }
        </style>
      </head>
      <body>
        <div id="cy"></div>
        <script>
          const graphElements = ${JSON.stringify(graphElements)};

          const options = {
              container: document.getElementById("cy"),
              elements: graphElements,
              autoungrabify: false,
          };
          const cy = cytoscape(options);

          cy.style()
            .selector("node")
            .style({
      label: "data(label)",
      "background-color": "#0074D9",
      "text-valign": "bottom", // Vertical alignment to the center
      "text-halign": "center", // Horizontal alignment to the center
      "color": "#000000",
      "text-margin-y": 10,
      "background-image": (ele) => {
        let iconName = "container-icon.svg"; // Default icon
        switch (ele.data("type")) {
          case "server":
            iconName = "server-icon.svg";
            break;
          case "master":
            iconName = "dockstatapi-icon.svg";
            break;
        }
        return \`url(\${ iconName })\`; // Return the icon path
      },
      "background-fit": "contain",
      "background-clip": "none",
      "background-opacity": 0,
      width: 70,  // Adjust the width for more room
      height: 70, // Adjust the height for more room
      "font-size": 15,  // Adjust font size to avoid cutting off text
    })
    .update();

          cy.style()
              .selector("edge")
              .style({
                  width: 1,
                  "line-color": "#A9A9A9",
                  "curve-style": "bezier",
              })
              .update();

          cy.layout({
              name: "concentric",
              evelWidth: function (nodes) {
                  return 2;
              },
              fit: true,
              padding: 40,
              avoidOverlap: true,
              nodeDimensionsIncludeLabels: true,
              animate: false,
              spacingFactor: 0.8,
          }).run();

          cy.on("tap", "node", (event) => {
              const node = event.target;
              const nodeId = node.id();
              const nodeLabel = node.data("label");
              alert(\`Clicked on: \${nodeLabel}\`);
          });

        </script>
      </body>
      </html>
    `;

    atomicWrite(CACHE_DIR_HTML, htmlContent);

    logger.info("generateGraphFiles <<< Files generated successfully");
    return true;
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(errorMsg);
    return false;
  }
}

function getGraphFilePaths() {
  return { json: CACHE_DIR_JSON, html: CACHE_DIR_HTML, res: CACHE_DIR_RES };
}

export { generateGraphFiles, getGraphFilePaths };
