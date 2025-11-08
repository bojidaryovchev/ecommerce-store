/**
 * Setup MongoDB Custom Indexes
 *
 * This script creates custom MongoDB indexes (like TTL) that can't be defined in Prisma schema.
 * Reads configuration from mongodb-indexes.json
 *
 * Usage:
 *   node scripts/setup-mongodb-indexes.mjs                    # Apply all collections
 *   node scripts/setup-mongodb-indexes.mjs carts              # Apply specific collection
 *   node scripts/setup-mongodb-indexes.mjs carts orders       # Apply multiple collections
 */

import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const prisma = new PrismaClient();

// Read index configuration
const configPath = join(__dirname, "mongodb-indexes.json");
const indexConfig = JSON.parse(readFileSync(configPath, "utf-8"));

// Get collections from command line args (e.g., node script.mjs carts orders)
const targetCollections = process.argv.slice(2);

async function setupIndexes() {
  console.log("🔗 Connecting to MongoDB...");

  try {
    console.log("✅ Connected to MongoDB via Prisma\n");

    // Determine which collections to process
    const collectionsToProcess =
      targetCollections.length > 0
        ? targetCollections.filter((col) => indexConfig[col])
        : Object.keys(indexConfig).filter((col) => indexConfig[col].length > 0);

    if (collectionsToProcess.length === 0) {
      console.log("⚠️  No collections to process");
      console.log("\nAvailable collections:", Object.keys(indexConfig).join(", "));
      return;
    }

    console.log("📦 Collections to process:", collectionsToProcess.join(", "));
    console.log("");

    let totalCreated = 0;
    let totalSkipped = 0;
    let totalDropped = 0;

    for (const collectionName of collectionsToProcess) {
      const indexes = indexConfig[collectionName];

      if (!indexes || indexes.length === 0) {
        console.log(`⏭️  Skipping ${collectionName} (no custom indexes defined)\n`);
        continue;
      }

      console.log(`\n📋 Processing collection: ${collectionName}`);
      console.log(`   Custom indexes to apply: ${indexes.length}`);

      // Get existing indexes
      let existingIndexes;
      try {
        const result = await prisma.$runCommandRaw({
          listIndexes: collectionName,
        });
        existingIndexes = result.cursor?.firstBatch || [];
      } catch {
        console.log(`   ⚠️  Collection ${collectionName} not found or has no indexes yet`);
        existingIndexes = [];
      }

      // Show existing indexes
      if (existingIndexes.length > 0) {
        console.log(`   Existing indexes: ${existingIndexes.length}`);
        existingIndexes.forEach((index) => {
          const ttlInfo = index.expireAfterSeconds !== undefined ? ` (TTL: ${index.expireAfterSeconds}s)` : "";
          console.log(`     - ${index.name}: ${JSON.stringify(index.key)}${ttlInfo}`);
        });
      }

      // Process each custom index
      for (const indexDef of indexes) {
        console.log(`\n   🔍 Processing: ${indexDef.name}`);
        if (indexDef.description) {
          console.log(`      ${indexDef.description}`);
        }

        // Check if this exact index already exists
        const exactMatch = existingIndexes.find(
          (idx) =>
            idx.name === indexDef.name &&
            JSON.stringify(idx.key) === JSON.stringify(indexDef.key) &&
            idx.expireAfterSeconds === indexDef.options?.expireAfterSeconds,
        );

        if (exactMatch) {
          console.log(`      ✅ Already exists with correct configuration`);
          totalSkipped++;
          continue;
        }

        // Check if index with same key but different options exists
        const conflictingIndex = existingIndexes.find(
          (idx) =>
            JSON.stringify(idx.key) === JSON.stringify(indexDef.key) &&
            (idx.name !== indexDef.name || idx.expireAfterSeconds !== indexDef.options?.expireAfterSeconds),
        );

        if (conflictingIndex) {
          console.log(`      ⚠️  Conflicting index exists: ${conflictingIndex.name}`);
          console.log(`      🗑️  Dropping conflicting index...`);

          await prisma.$runCommandRaw({
            dropIndexes: collectionName,
            index: conflictingIndex.name,
          });
          console.log(`      ✅ Dropped: ${conflictingIndex.name}`);
          totalDropped++;
        }

        // Create the index
        const indexSpec = {
          key: indexDef.key,
          name: indexDef.name,
          ...indexDef.options,
        };

        await prisma.$runCommandRaw({
          createIndexes: collectionName,
          indexes: [indexSpec],
        });
        console.log(`      ✅ Created: ${indexDef.name}`);
        totalCreated++;
      }
    }

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("✨ Setup complete!");
    console.log("=".repeat(60));
    console.log(`📊 Summary:`);
    console.log(`   - Indexes created: ${totalCreated}`);
    console.log(`   - Indexes skipped (already correct): ${totalSkipped}`);
    console.log(`   - Conflicting indexes dropped: ${totalDropped}`);
    console.log("");
  } catch (error) {
    console.error("\n❌ Error setting up indexes:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

// Run the setup
setupIndexes().catch(console.error);
