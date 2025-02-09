import cytoscape from "cytoscape";
import logger from "../utils/logger";
import { AllContainerData, ContainerData } from "./../typings/dockerConfig";
import { atomicWrite } from "../utils/atomicWrite";
import { rateLimitedReadFile } from "../utils/rateLimitFS";

const CACHE_DIR_JSON = "./src/data/graph.json";
const CACHE_DIR_HTML = "./src/data/graph.html";
const _assets = "./src/utils/assets";
const serverSvg = `${_assets}/server-icon.svg`;
const containerSvg = `${_assets}/container-icon.svg`;
const pngPath = "./src/data/graph.png";

async function getPathData(path: string) {
  try {
    return await rateLimitedReadFile(path);

  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(errorMsg);
    return false;
  }
}

async function renderGraphToImage(
  htmlContent: string,
  outputImagePath: string,
): Promise<void> {
  let puppeteer;
  try {
    puppeteer = await import("puppeteer");
  } catch (error) {
    logger.error("Puppeteer is not installed. Please install it to generate images.");
    throw new Error(`Puppeteer is not installed (${error})`);
  }

  let browser;
  try {
    browser = await puppeteer.default.launch({
      headless: "shell",
      args: ["--disable-setuid-sandbox", "--no-sandbox"],
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });
    await page.waitForSelector("#cy", { visible: true, timeout: 15000 });

    await page.waitForFunction(
      () => {
        const cyElement = document.querySelector("#cy");
        return cyElement ? cyElement.children.length > 0 : false;
      },
      { timeout: 10000 }
    );

    await page.screenshot({
      path: outputImagePath,
      type: outputImagePath.endsWith(".jpg") ? "jpeg" : "png",
      fullPage: true,
      captureBeyondViewport: true,
    });
  } catch (error: unknown) {
    let errorMessage = "Unknown error occurred during browser operation";

    if (error instanceof Error) {
      errorMessage = error.message;

      // Detect common dependency errors
      if (errorMessage.includes("libnss3") || errorMessage.includes("libxcb")) {
        errorMessage = `❗ Missing system dependencies (libnss3)`;
      }

      // Detect Chrome not found errors
      if (errorMessage.includes("Failed to launch")) {
        errorMessage = `❗ Chrome not found!`;
      }
    }

    throw new Error(`Graph rendering failed - ${errorMessage}`);
  } finally {
    if (browser) {
      await browser.close().catch(() => { });
    }
  }

  logger.info(`Graph rendered and image saved to - ${outputImagePath}`);
}

async function generateGraphFiles(
  allContainerData: AllContainerData,
): Promise<boolean> {
  if (process.env.CI === "true") {
    logger.warn("Running inside a CI/CD Action, wont generated graphs");
    return false;
  } else {
    try {
      logger.info("generateGraphFiles >>> Starting generation");
      const graphElements: cytoscape.ElementDefinition[] = [];

      for (const [hostName, containers] of Object.entries(allContainerData)) {
        if ("error" in containers) {
          // TODO: make error'ed hosts better
          // Issue URL: https://github.com/Its4Nik/DockStatAPI/issues/32
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
        let iconData = "";
        switch (ele.data("type")) {
          case "server":
            iconData = encodeURIComponent(\`${await getPathData(serverSvg)}\`);
            break;
          default:
            iconData = encodeURIComponent(\`${await getPathData(containerSvg)}\`);
            break;
        }
        return \`url("data:image/svg+xml,\${iconData}")\`; // Return the SVG as a data URL
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
      await renderGraphToImage(htmlContent, pngPath)
        .then(() => logger.debug("HTML converted to image successfully!"))
        .catch((err) => logger.error("Error:", err));

      logger.info("generateGraphFiles <<< Files generated successfully");
      return true;
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(errorMsg);
      return false;
    }
  }
}

function getGraphFilePaths() {
  return { json: CACHE_DIR_JSON, html: CACHE_DIR_HTML };
}

export { generateGraphFiles, getGraphFilePaths };
