import { SwaggerOptions } from "swagger-ui-express";
import { css } from "./swaggerTheme";

export const options: SwaggerOptions = {
  swaggerOptions: {
    tryItOutEnabled: true,
  },
  customCss: css,
  explorer: false,
};
