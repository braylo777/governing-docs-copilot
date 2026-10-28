import { migrate } from "./db";
import { seed } from "./seed";

// Pinned versions, loaded from jsDelivr so the static site stays small. To self-host instead,
// run scripts/copy-pglite.sh and set NEXT_PUBLIC_PGLITE_BASE=/pglite.
const BASE = process.env.NEXT_PUBLIC_PGLITE_BASE ?? "https://cdn.jsdelivr.net/npm/@electric-sql/pglite@0.5.13/dist";
const VEC = process.env.NEXT_PUBLIC_PGLITE_BASE ? `${process.env.NEXT_PUBLIC_PGLITE_BASE}/vector` : "https://cdn.jsdelivr.net/npm/@electric-sql/pglite-pgvector@0.0.14/dist";

/** Browser build: load PGlite (real Postgres compiled to WASM) plus pgvector at runtime. */
export async function createBrowserDb() {
  const { PGlite } = await import(/* webpackIgnore: true */ `${BASE}/index.js`);
  const { vector } = await import(/* webpackIgnore: true */ `${VEC}/index.js`);
  const db = new PGlite({ extensions: { vector } });
  await migrate(db);
  await seed(db);
  return db;
}
