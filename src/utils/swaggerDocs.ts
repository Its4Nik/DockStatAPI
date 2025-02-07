import swaggerUi from "swagger-ui-express";
import { options } from "../config/swaggerConfig";
import yaml from "yamljs";
import express from "express";
import { SwaggerDefinition } from "swagger-jsdoc";

const swaggerDocs = (app: express.Application) => {
  const swaggerYaml: SwaggerDefinition = yaml.load("./src/config/swagger.yaml");
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerYaml, options));
};

export default swaggerDocs;
