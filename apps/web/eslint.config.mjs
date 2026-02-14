import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import rootConfig from "../../eslint.config.mjs";

const eslintConfig = [...rootConfig, ...nextVitals, ...nextTs];

export default eslintConfig;
