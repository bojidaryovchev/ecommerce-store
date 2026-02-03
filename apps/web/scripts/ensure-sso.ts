import { execSync } from "child_process";

const PROFILE = process.env.AWS_PROFILE || "dev-sso";

// Check if SSO session is valid
try {
  execSync(`aws sts get-caller-identity --profile ${PROFILE}`, { stdio: "ignore" });
  console.log(`✓ AWS SSO session valid (profile: ${PROFILE})`);
} catch {
  console.log(`AWS SSO session expired. Logging in...`);
  execSync(`aws sso login --profile ${PROFILE}`, { stdio: "inherit" });
}
