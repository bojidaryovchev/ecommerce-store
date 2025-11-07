declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: "development" | "production" | "test";
    PORT: string;
    DEPLOYMENT_ENV?: "dev" | "prod";
    // Common
    DATABASE_URL: string;
    NEXT_PUBLIC_APP_URL: string;
    NEXT_PUBLIC_UPLOADS_BUCKET: string;
    // Auth
    AUTH_SECRET: string;
    AUTH_GOOGLE_ID: string;
    AUTH_GOOGLE_SECRET: string;
    // Stripe
    STRIPE_SECRET_KEY: string;
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: string;
    STRIPE_WEBHOOK_SECRET: string;
  }
}
