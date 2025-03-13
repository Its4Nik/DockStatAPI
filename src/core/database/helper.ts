import { logger } from "../utils/logger";

export function executeDbOperation<T>(
  label: string,
  operation: () => T,
  validate?: () => void,
): T {
  const startTime = Date.now();
  logger.debug(`__task__ __db__ ${label} �3`);
  if (validate) {
    validate();
  }
  const result = operation();
  const duration = Date.now() - startTime;
  logger.debug(`__task__ __db__ ${label} �4f  (${duration}ms)`);
  return result;
}
