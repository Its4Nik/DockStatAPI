import fs from "fs";
import logger from "./logger";
import { AtomicWriteOptions } from "../typings/atomicWrite";

export function atomicWrite(
  targetPath: string,
  data: object | string | Buffer | Record<string, string>,
  options: AtomicWriteOptions = {},
): void {
  const { mode = 0o600, exclusive = false } = options;
  const tempFile = `${targetPath}.tmp`;

  try {
    const writeData =
      typeof data === "object" && !(data instanceof Buffer)
        ? JSON.stringify(data, null, 2)
        : data;

    if (exclusive && fs.existsSync(targetPath)) {
      throw new Error(`File already exists: ${targetPath}`);
    }

    fs.writeFileSync(tempFile, writeData, { mode });

    fs.renameSync(tempFile, targetPath);

    logger.debug(`File successfully written to: ${targetPath}`);
  } catch (error: unknown) {
    if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    logger.error(
      `Failed to write file at ${targetPath}: ${(error as Error).message}`,
    );
    throw error;
  }
}
