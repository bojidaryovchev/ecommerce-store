export interface Logger {
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
}

export const consoleLogger: Logger = {
  info: (message, meta) => console.info(`[supplier-sync] ${message}`, meta ?? ""),
  warn: (message, meta) => console.warn(`[supplier-sync] ${message}`, meta ?? ""),
  error: (message, meta) => console.error(`[supplier-sync] ${message}`, meta ?? ""),
};

export const silentLogger: Logger = {
  info: () => {},
  warn: () => {},
  error: () => {},
};
