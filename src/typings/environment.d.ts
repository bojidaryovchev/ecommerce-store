declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: "development" | "production" | "test";
    PORT: string;
    DEPLOYMENT_ENV?: "dev" | "prod";
    DATABASE_URL: string;
  }
}
