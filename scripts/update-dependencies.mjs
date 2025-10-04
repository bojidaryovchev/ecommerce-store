#!/usr/bin/env node

import { execSync } from "child_process";
import { copyFileSync, existsSync, readFileSync, unlinkSync, writeFileSync } from "fs";
import { join } from "path";
import { cwd } from "process";

/**
 * Dependency Update Script
 *
 * This script checks for the latest stable non-breaking versions of dependencies
 * and updates package.json with exact versions (no ^ or ~ prefixes).
 * Only considers proper major.minor.patch versions (no pre-release versions).
 *
 * Features:
 * - Converts all version constraints (^, ~) to exact versions
 * - Only considers stable releases (no rc, beta, alpha, etc.)
 * - Respects semver compatibility for finding latest versions
 * - Creates backup before making changes
 */

const PACKAGE_JSON_PATH = join(cwd(), "package.json");
const BACKUP_PATH = join(cwd(), "package.json.backup");

// Color codes for console output
const colors = {
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  reset: "\x1b[0m",
  bright: "\x1b[1m",
};

function log(message, color = "white") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logBright(message, color = "white") {
  console.log(`${colors.bright}${colors[color]}${message}${colors.reset}`);
}

/**
 * Check if a version is a proper stable version (major.minor.patch only)
 */
function isStableVersion(version) {
  // Check if version matches exactly major.minor.patch pattern
  const stableVersionPattern = /^\d+\.\d+\.\d+$/;
  return stableVersionPattern.test(version);
}

/**
 * Get the latest stable version that satisfies the semver range and return as exact version
 */
async function getLatestCompatibleVersion(packageName, currentVersion) {
  try {
    // Get package information from npm
    const result = execSync(`npm view ${packageName} versions --json`, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "ignore"], // Suppress stderr to avoid noise
    });

    const versions = JSON.parse(result);
    const allVersions = Array.isArray(versions) ? versions : [versions];

    // Filter to only stable versions (major.minor.patch)
    const stableVersions = allVersions.filter(isStableVersion);

    if (stableVersions.length === 0) {
      log(`  ⚠️  No stable versions found for ${packageName}`, "yellow");
      return currentVersion;
    }

    // Determine version constraint pattern
    const hasCaretPrefix = currentVersion.startsWith("^");
    const hasTildePrefix = currentVersion.startsWith("~");
    const isExact = !hasCaretPrefix && !hasTildePrefix;

    // Clean current version (remove ^, ~, etc.)
    const cleanCurrentVersion = currentVersion.replace(/^[\^~>=<]/, "");

    // Parse current version parts
    const currentParts = cleanCurrentVersion.split(".");
    const currentMajor = parseInt(currentParts[0]) || 0;
    const currentMinor = parseInt(currentParts[1]) || 0;
    const currentPatch = parseInt(currentParts[2]) || 0;

    // Filter versions based on constraint type
    const compatibleVersions = stableVersions.filter((version) => {
      const parts = version.split(".");
      const major = parseInt(parts[0]) || 0;
      const minor = parseInt(parts[1]) || 0;
      const patch = parseInt(parts[2]) || 0;

      if (isExact) {
        // For exact versions, only allow patch updates
        return major === currentMajor && minor === currentMinor && patch >= currentPatch;
      } else if (hasTildePrefix) {
        // ~ allows patch-level changes: ~1.2.3 := >=1.2.3 <1.(2+1).0
        return major === currentMajor && minor === currentMinor && patch >= currentPatch;
      } else if (hasCaretPrefix) {
        // ^ allows changes that do not modify left-most non-zero digit
        if (currentMajor > 0) {
          return major === currentMajor && (minor > currentMinor || (minor === currentMinor && patch >= currentPatch));
        } else if (currentMinor > 0) {
          return major === 0 && minor === currentMinor && patch >= currentPatch;
        } else {
          return major === 0 && minor === 0 && patch >= currentPatch;
        }
      }

      return false;
    });

    if (compatibleVersions.length === 0) {
      // If no compatible versions found, at least convert to exact version
      return cleanCurrentVersion;
    }

    // Sort versions and get the latest compatible one
    const sortedVersions = compatibleVersions.sort((a, b) => {
      const aParts = a.split(".").map((x) => parseInt(x) || 0);
      const bParts = b.split(".").map((x) => parseInt(x) || 0);

      for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
        const aPart = aParts[i] || 0;
        const bPart = bParts[i] || 0;
        if (aPart !== bPart) return bPart - aPart; // Descending order
      }
      return 0;
    });

    const latestCompatible = sortedVersions[0];

    // Always return exact version (no ^ or ~ prefix)
    return latestCompatible;
  } catch (error) {
    log(`  ❌ Error checking ${packageName}: ${error.message}`, "red");
    // Convert current version to exact even on error
    return currentVersion.replace(/^[\^~>=<]/, "");
  }
}

/**
 * Check if a version needs updating (including conversion to exact version)
 */
function needsUpdate(current, latest) {
  const cleanCurrent = current.replace(/^[\^~>=<]/, "");
  const cleanLatest = latest.replace(/^[\^~>=<]/, "");

  // Update if versions are different OR if current has prefix (needs conversion to exact)
  const versionsDifferent = cleanCurrent !== cleanLatest;
  const hasPrefix = current.match(/^[\^~>=<]/);

  return versionsDifferent || hasPrefix;
}

/**
 * Update dependencies in package.json
 */
async function updateDependencies() {
  logBright("🔍 Dependency Update Script Starting...", "cyan");

  // Create backup
  try {
    copyFileSync(PACKAGE_JSON_PATH, BACKUP_PATH);
    log(`📋 Backup created: ${BACKUP_PATH}`, "yellow");
  } catch (error) {
    log(`❌ Failed to create backup: ${error.message}`, "red");
    process.exit(1);
  }

  // Read package.json
  let packageJson;
  try {
    const content = readFileSync(PACKAGE_JSON_PATH, "utf-8");
    packageJson = JSON.parse(content);
  } catch (error) {
    log(`❌ Failed to read package.json: ${error.message}`, "red");
    process.exit(1);
  }

  const updates = {
    dependencies: [],
    devDependencies: [],
  };

  // Process dependencies
  if (packageJson.dependencies) {
    logBright("\n📦 Checking dependencies...", "blue");

    for (const [packageName, currentVersion] of Object.entries(packageJson.dependencies)) {
      log(`  Checking ${packageName}@${currentVersion}...`, "white");

      const latestVersion = await getLatestCompatibleVersion(packageName, currentVersion);

      if (needsUpdate(currentVersion, latestVersion)) {
        packageJson.dependencies[packageName] = latestVersion;
        updates.dependencies.push({
          name: packageName,
          from: currentVersion,
          to: latestVersion,
        });
        log(`  ✅ ${packageName}: ${currentVersion} → ${latestVersion}`, "green");
      } else {
        log(`  ℹ️  ${packageName}: already up to date`, "cyan");
      }
    }
  }

  // Process devDependencies
  if (packageJson.devDependencies) {
    logBright("\n🛠️  Checking devDependencies...", "blue");

    for (const [packageName, currentVersion] of Object.entries(packageJson.devDependencies)) {
      log(`  Checking ${packageName}@${currentVersion}...`, "white");

      const latestVersion = await getLatestCompatibleVersion(packageName, currentVersion);

      if (needsUpdate(currentVersion, latestVersion)) {
        packageJson.devDependencies[packageName] = latestVersion;
        updates.devDependencies.push({
          name: packageName,
          from: currentVersion,
          to: latestVersion,
        });
        log(`  ✅ ${packageName}: ${currentVersion} → ${latestVersion}`, "green");
      } else {
        log(`  ℹ️  ${packageName}: already up to date`, "cyan");
      }
    }
  }

  // Write updated package.json
  const totalUpdates = updates.dependencies.length + updates.devDependencies.length;

  if (totalUpdates > 0) {
    try {
      writeFileSync(PACKAGE_JSON_PATH, JSON.stringify(packageJson, null, 2) + "\n");
      logBright(`\n✅ Updated package.json with ${totalUpdates} package updates!`, "green");

      // Summary
      logBright("\n📊 Summary:", "magenta");

      if (updates.dependencies.length > 0) {
        log(`\n  Dependencies (${updates.dependencies.length} updates):`, "blue");
        updates.dependencies.forEach((update) => {
          log(`    • ${update.name}: ${update.from} → ${update.to}`, "white");
        });
      }

      if (updates.devDependencies.length > 0) {
        log(`\n  DevDependencies (${updates.devDependencies.length} updates):`, "blue");
        updates.devDependencies.forEach((update) => {
          log(`    • ${update.name}: ${update.from} → ${update.to}`, "white");
        });
      }

      logBright("\n🎉 Next steps:", "yellow");
      log('  1. Run "npm install" to install the updated packages', "white");
      log("  2. Test your application to ensure everything works correctly", "white");
      log("  3. If there are issues, you can restore from the backup:", "white");
      log(`     cp "${BACKUP_PATH}" "${PACKAGE_JSON_PATH}"`, "cyan");
    } catch (error) {
      log(`❌ Failed to write package.json: ${error.message}`, "red");
      process.exit(1);
    }
  } else {
    logBright("\n🎉 All dependencies are already up to date!", "green");

    // Clean up backup since no changes were made
    try {
      unlinkSync(BACKUP_PATH);
      log("🗑️  Backup removed (no updates needed)", "yellow");
    } catch {
      // Ignore cleanup errors
    }
  }
}

// Handle process termination
process.on("SIGINT", () => {
  log("\n\n❌ Process interrupted. Restoring backup...", "red");
  try {
    if (existsSync(BACKUP_PATH)) {
      copyFileSync(BACKUP_PATH, PACKAGE_JSON_PATH);
      unlinkSync(BACKUP_PATH);
      log("✅ Backup restored successfully", "green");
    }
  } catch (error) {
    log(`❌ Failed to restore backup: ${error.message}`, "red");
  }
  process.exit(0);
});

// Check if npm is available
try {
  execSync("npm --version", { stdio: "ignore" });
} catch {
  log("❌ npm is not available. Please ensure npm is installed and in your PATH.", "red");
  process.exit(1);
}

// Run the update process
updateDependencies().catch((error) => {
  log(`❌ Unexpected error: ${error.message}`, "red");

  // Try to restore backup on error
  try {
    if (existsSync(BACKUP_PATH)) {
      copyFileSync(BACKUP_PATH, PACKAGE_JSON_PATH);
      unlinkSync(BACKUP_PATH);
      log("✅ Backup restored after error", "yellow");
    }
  } catch (restoreError) {
    log(`❌ Failed to restore backup: ${restoreError.message}`, "red");
  }

  process.exit(1);
});
