#!/usr/bin/env node

/**
 * Generate a secure random token for CRON_SECRET
 * Usage: node scripts/generate-cron-secret.mjs
 */

import { randomBytes } from "crypto";

const cronSecret = randomBytes(32).toString("hex");

console.log("\n🔐 Generated CRON_SECRET:");
console.log("=".repeat(70));
console.log(cronSecret);
console.log("=".repeat(70));
console.log("\nAdd this to your .env file:");
console.log(`CRON_SECRET="${cronSecret}"`);
console.log("\nAlso add it to your production environment variables.\n");
