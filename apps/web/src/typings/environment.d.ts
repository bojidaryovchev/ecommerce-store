declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: "development" | "production" | "test";
    PORT: string;

    // Database
    DATABASE_URL: string;

    // NextAuth
    AUTH_SECRET: string;
    AUTH_URL: string;

    // Google OAuth (optional)
    AUTH_GOOGLE_ID: string;
    AUTH_GOOGLE_SECRET: string;

    // AWS S3 (file uploads)
    AWS_REGION: string;
    AWS_S3_BUCKET_NAME: string;
    // Local dev: use SSO profile
    AWS_PROFILE: string;

    // Stripe
    STRIPE_SECRET_KEY: string;
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: string;
    STRIPE_WEBHOOK_SECRET: string;

    // Email (Resend)
    RESEND_API_KEY: string;
    EMAIL_FROM: string;
  }
}
