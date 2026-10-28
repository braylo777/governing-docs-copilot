import { PGlite } from "@electric-sql/pglite";
import { vector } from "@electric-sql/pglite-pgvector";
import { migrate } from "./db";
import { seed } from "./seed";

export async function createDemoDb() {
  const db = new PGlite({ extensions: { vector } });
  await migrate(db as any);
  await seed(db as any);
  return db;
}
