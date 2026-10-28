import { describe, it, expect, beforeAll } from "vitest";
import { createDemoDb } from "../lib/pglite";
import { withTenant } from "../lib/db";
import { retrieve } from "../lib/retrieve";
import { ingestDocument } from "../lib/ingest";

let db: any;
beforeAll(async () => { db = await createDemoDb(); }, 60_000);

describe("tenant isolation (Postgres row-level security)", () => {
  it("tenant A sees only its own documents", async () => {
    const rows = await withTenant(db, "oak-hollow", (q) => q.query<any>("SELECT DISTINCT tenant_id FROM documents"));
    expect(rows.rows.map((r) => r.tenant_id)).toEqual(["oak-hollow"]);
  });
  it("a query that explicitly asks for tenant B's rows returns nothing", async () => {
    const r = await withTenant(db, "oak-hollow", (q) => q.query("SELECT * FROM chunks WHERE tenant_id = 'lakeside-commons'"));
    expect(r.rows).toHaveLength(0);
  });
  it("retrieval never returns another tenant's text", async () => {
    const hits = await retrieve(db, "oak-hollow", "parking towing garage space 48 hours");
    for (const h of hits) expect(h.title).toMatch(/^Oak Hollow/);
  });
  it("cannot insert a row tagged with another tenant", async () => {
    await expect(withTenant(db, "oak-hollow", (q) =>
      q.query("INSERT INTO documents (tenant_id, title) VALUES ('lakeside-commons', 'smuggled')"))).rejects.toThrow(/row-level security/);
  });
  it("no tenant set means no rows", async () => {
    await db.query("BEGIN"); await db.query("SET LOCAL ROLE app_user");
    const r = await db.query("SELECT count(*)::int AS n FROM chunks");
    await db.query("ROLLBACK");
    expect(r.rows[0].n).toBe(0);
  });
  it("rejects malformed tenant ids", async () => {
    await expect(withTenant(db, "x'; DROP TABLE chunks; --", async () => 1)).rejects.toThrow(/invalid tenant/);
  });
  it("new uploads stay inside their tenant", async () => {
    await ingestDocument(db, "lakeside-commons", "Lakeside Grill Policy", "Section 1 Grills\nCharcoal grills are prohibited on balconies.");
    const a = await retrieve(db, "oak-hollow", "charcoal grills balconies");
    expect(a.find((h) => /Grill/.test(h.title))).toBeUndefined();
    const b = await retrieve(db, "lakeside-commons", "charcoal grills balconies");
    expect(b[0].title).toBe("Lakeside Grill Policy");
  });
});
