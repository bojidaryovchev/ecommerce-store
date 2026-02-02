import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import { defineConfig } from "eslint/config";
import rootConfig from "../../eslint.config.mjs";

const eslintConfig = defineConfig([...rootConfig, ...nextVitals, ...nextTs]);

export default eslintConfig;
