# Governing-Docs Copilot

Ask a question about an HOA or condo association's governing documents (CC&Rs, bylaws, rules) and get an answer that quotes and cites the exact section. Each association is a separate tenant, and Postgres row-level security keeps one association's documents invisible to another.

**Live demo:** https://governing-docs-copilot.braylo777.workers.dev
The two sample associations, Oak Hollow HOA and Lakeside Commons, are fictional.

## What it shows

- **Next.js 15 App Router + TypeScript** front end.
- **Postgres with row-level security.** `documents` and `chunks` have `FORCE ROW LEVEL SECURITY` and policies on `current_setting('app.tenant_id')`. All app queries run through `withTenant()`, which opens a transaction, drops to the non-privileged `app_user` role (`NOBYPASSRLS`) and sets the tenant for that transaction only.
- **pgvector + Postgres full-text search**, fused with reciprocal rank fusion (k = 60).
- **Cited, extractive answers.** Every sentence in an answer is quoted from a retrieved chunk and tagged `[n]`. When nothing in the documents covers the question, the app says so instead of guessing.
- **Uploads** of PDF (pdf.js), .txt or .md, chunked by section heading.

## How the demo runs

The demo is a static export on Cloudflare Workers. The database is [PGlite](https://pglite.dev), the real Postgres 17 engine compiled to WebAssembly, with the pgvector extension, running in the browser. Uploaded files stay on the visitor's device. The schema, policies and SQL in `lib/` are plain Postgres and are written against a small `Queryable` interface (`query(sql, params)`) that both PGlite and `node-postgres` satisfy, so the same code targets Supabase or Neon by passing a `pg` client.

Embeddings are a deterministic 256-dimension feature-hashing model (`lib/embed.ts`) so the demo needs no API key. A hosted embedding model drops in without changing the table or queries.

## Run it

```bash
npm install
npm test            # Vitest: core + isolation suites against PGlite
npm run build       # static export to out/
npm run e2e         # Playwright against out/
npm run dev
```

## Tests

25 tests: 23 Vitest, 2 Playwright.

- `tests/isolation.test.ts` (7): tenant A sees only its rows; an explicit `WHERE tenant_id = 'B'` returns nothing; retrieval never returns B's text; inserting a row tagged with B is rejected by RLS; no tenant set returns zero rows; malformed tenant ids are rejected; new uploads stay inside their tenant.
- `tests/core.test.ts` (16): chunking, embedding, 12 gold questions across both associations (each must answer with the right fact and a citation), and one off-topic question that must be refused.
- `e2e/app.spec.ts` (2): ask in the browser, check the citation, run the in-app isolation check, upload a document and confirm the other association can't see it.

The 12-question gold set is small and author-written; it checks behaviour, not general accuracy.

## Layout

```
app/            Next.js App Router UI (client component boots Postgres in the browser)
lib/schema.ts   tables, indexes, RLS policies, app_user role
lib/db.ts       Queryable interface, migrate(), withTenant()
lib/chunk.ts    section-aware chunking
lib/embed.ts    feature-hashing embedding + synonym expansion
lib/retrieve.ts hybrid pgvector + full-text retrieval with RRF
lib/answer.ts   extractive cited answers with refusal
lib/seed.ts     two fictional associations
```

## Deploy and rollback

Deployed as a Cloudflare Worker that serves the static export. Each deploy is a Worker version; rollback is `wrangler rollback <version-id>` or the dashboard's Deployments tab. Version ids are recorded in `DEPLOYS.md`.

No keys or secrets are needed or committed.
