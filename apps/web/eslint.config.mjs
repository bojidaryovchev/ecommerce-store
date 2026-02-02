import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import { defineConfig, globalIgnores } from "eslint/config";
import rootConfig from "../../eslint.config.mjs";

const eslintConfig = defineConfig([
  ...rootConfig,
  ...nextVitals,
  ...nextTs,
  // Additional Next.js-specific ignores (node_modules, dist, .next already handled by root)
  globalIgnores(["out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
