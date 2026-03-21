// NOTE: This file is a placeholder for a future server-side database setup.
// drizzle-orm/pg is not yet installed. To use this, run:
//   bun add drizzle-orm pg && bun add -d @types/pg
// Then create the schema at src/db/schema.ts and update the import below.
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool);
