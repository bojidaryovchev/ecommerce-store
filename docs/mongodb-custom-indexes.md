# MongoDB Custom Indexes

This guide covers managing custom MongoDB indexes that can't be defined in the Prisma schema (like TTL indexes).

## Overview

The project uses a configuration-driven approach for managing MongoDB indexes that require special options not supported by Prisma's `@@index()` directive.

## Files

- **`scripts/mongodb-indexes.json`** - Index configuration file
- **`scripts/setup-mongodb-indexes.mjs`** - Script to apply indexes from config

## Configuration Format

The `scripts/mongodb-indexes.json` file defines indexes per collection:

```json
{
  "collection_name": [
    {
      "name": "index_name",
      "key": { "field": 1 }, // 1 = ascending, -1 = descending
      "options": {
        "expireAfterSeconds": 0, // For TTL indexes
        "unique": true, // For unique indexes
        "sparse": true // For sparse indexes
      },
      "description": "Human-readable description"
    }
  ]
}
```

## Usage

### Apply all custom indexes:

```bash
npm run mongodb:indexes
```

### Apply indexes for specific collection(s):

```bash
npm run mongodb:indexes:carts
node scripts/setup-mongodb-indexes.mjs carts orders users
```

### Apply after schema changes:

```bash
npm run prisma:push && npm run mongodb:indexes
```

## Features

- ✅ **Idempotent** - Safe to run multiple times
- ✅ **Conflict Resolution** - Automatically drops conflicting indexes
- ✅ **Detailed Logging** - Shows what's being created/skipped/dropped
- ✅ **Collection Filtering** - Apply to specific collections only
- ✅ **Validation** - Checks existing indexes before applying

## Common Index Types

### TTL (Time To Live) Index

Automatically deletes documents when a date field is reached:

```json
{
  "name": "carts_expiresAt_ttl",
  "key": { "expiresAt": 1 },
  "options": {
    "expireAfterSeconds": 0
  },
  "description": "TTL index - automatically delete carts when expiresAt time is reached"
}
```

**Usage Example:**

```typescript
// Set cart to expire in 30 days
await prisma.cart.create({
  data: {
    sessionId: "guest-123",
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  },
});
```

### Compound Index

Index on multiple fields for efficient queries:

```json
{
  "name": "orders_status_date",
  "key": { "status": 1, "createdAt": -1 },
  "options": {},
  "description": "Optimize queries filtering by status and sorting by date"
}
```

### Unique Index

Ensure field uniqueness:

```json
{
  "name": "users_email_unique",
  "key": { "email": 1 },
  "options": {
    "unique": true,
    "sparse": true
  },
  "description": "Ensure email uniqueness, allowing nulls"
}
```

### Text Index

Full-text search across multiple fields:

```json
{
  "name": "products_text_search",
  "key": {
    "name": "text",
    "description": "text"
  },
  "options": {
    "weights": {
      "name": 10,
      "description": 5
    }
  },
  "description": "Full-text search on product name and description"
}
```

### Partial Index

Index only documents matching a filter:

```json
{
  "name": "orders_pending_only",
  "key": { "createdAt": -1 },
  "options": {
    "partialFilterExpression": {
      "status": "PENDING"
    }
  },
  "description": "Index only pending orders for fast queries"
}
```

## When to Use Custom Indexes

Use this system for indexes that:

- ❌ Can't be defined in Prisma schema (TTL, text search, partial indexes)
- ❌ Need special MongoDB options not supported by Prisma
- ❌ Require weights, filters, or other advanced MongoDB features
- ✅ Need fine-grained control over index options

For regular single-field or compound indexes, use Prisma's `@@index()` directive in `prisma/schema.prisma`.

## Current Indexes

### Carts Collection

**`carts_expiresAt_ttl`** - TTL index for automatic guest cart expiration

- Deletes carts immediately when `expiresAt` time is reached
- MongoDB checks every 60 seconds for expired documents
- Set `expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)` for 30-day expiration

**Configuration:**

```json
{
  "name": "carts_expiresAt_ttl",
  "key": { "expiresAt": 1 },
  "options": {
    "expireAfterSeconds": 0
  },
  "description": "TTL index - automatically delete carts when expiresAt time is reached"
}
```

## Deployment Checklist

Add to your deployment pipeline:

```bash
# 1. Apply schema changes
npm run prisma:push

# 2. Apply custom indexes
npm run mongodb:indexes

# 3. Verify indexes were created
# (Script shows detailed output automatically)
```

## Troubleshooting

### Index Conflicts

**Error:** "Index already exists with different options"

**Solution:** The script automatically handles this:

- Detects conflicting indexes
- Drops the old index
- Creates the new one

Alternatively, manually drop:

```javascript
db.collection.dropIndex("index_name");
```

### Collection Not Found

**Error:** "Collection not found or has no indexes yet"

**Cause:** MongoDB collections don't exist until they have at least one document

**Solution:**

1. Ensure your database has data
2. Run `npm run prisma:seed` to create initial data
3. Then run `npm run mongodb:indexes`

### TTL Not Working

**Symptoms:** Documents not being deleted automatically

**Checklist:**

- ✅ Verify index has `expireAfterSeconds` option
- ✅ Ensure `expiresAt` field is `Date` type, not string
- ✅ Wait up to 60 seconds (MongoDB's background check interval)
- ✅ Check MongoDB logs for TTL monitor activity

**Verify TTL index:**

```bash
npm run mongodb:indexes:carts
# Should show: (TTL: 0s) after the index
```

### Script Fails to Connect

**Error:** "Error setting up indexes"

**Solution:**

1. Verify MongoDB is running: `docker compose up mongodb`
2. Check `DATABASE_URL` in `.env` is correct
3. Ensure Prisma client is generated: `npx prisma generate`

## Advanced Examples

### Multi-Field Text Search

```json
{
  "name": "products_search",
  "key": {
    "name": "text",
    "description": "text",
    "tags": "text"
  },
  "options": {
    "weights": {
      "name": 10,
      "tags": 5,
      "description": 1
    },
    "default_language": "english"
  }
}
```

**Query:**

```typescript
const products = await prisma.$runCommandRaw({
  find: "products",
  filter: { $text: { $search: "laptop computer" } },
});
```

### Geospatial Index

```json
{
  "name": "stores_location_2dsphere",
  "key": { "location": "2dsphere" },
  "options": {},
  "description": "Geospatial queries for store locations"
}
```

### Case-Insensitive Unique Index

```json
{
  "name": "users_email_case_insensitive",
  "key": { "email": 1 },
  "options": {
    "unique": true,
    "collation": {
      "locale": "en",
      "strength": 2
    }
  }
}
```

## Monitoring Index Performance

After creating indexes, monitor their usage:

```javascript
// In MongoDB shell or Compass
db.carts.stats();
db.carts.aggregate([{ $indexStats: {} }]);
```

Look for:

- **`accesses.ops`** - Number of times index was used
- **`accesses.since`** - Last access time
- Remove unused indexes to save storage and improve write performance

## Best Practices

1. **Test indexes in development first** before applying to production
2. **Monitor index size** - Large indexes can impact performance
3. **Use sparse indexes** for optional fields to save space
4. **Keep index names descriptive** - Include collection and field names
5. **Document index purpose** in the `description` field
6. **Review indexes quarterly** - Remove unused indexes
7. **Run after schema migrations** - Add to deployment pipeline

## Related Documentation

- [Prisma Schema](../prisma/schema.prisma) - Regular indexes defined here
- [Testing Guide](./TESTING_GUIDE.md) - How to test cart expiration
- [Schema Analysis](./SCHEMA_ANALYSIS.md) - Complete schema documentation

---

**Last Updated:** November 8, 2025  
**Status:** Production Ready ✅
