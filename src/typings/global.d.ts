export {}; // Ensures this file is treated as a module

declare global {
  interface Response {
    json<T>(): Promise<T>;
  }
}
