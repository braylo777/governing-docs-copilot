"use client";
import { useEffect, useRef, useState } from "react";
import type { Answer } from "../lib/answer";

type Api = {
  ask: (tenant: string, q: string) => Promise<Answer>;
  upload: (tenant: string, title: string, text: string) => Promise<{ chunks: number }>;
  leakCheck: (tenant: string) => Promise<{ own: number; foreign: number }>;
};

const TENANTS = [
  { id: "oak-hollow", name: "Oak Hollow HOA (fictional)", examples: ["How tall can my fence be?", "Can I rent my house on Airbnb for a weekend?", "How many guests can I bring to the pool?"] },
  { id: "lakeside-commons", name: "Lakeside Commons Condo Association (fictional)", examples: ["What is the minimum lease term?", "Do I need approval for hardwood floors?", "Can my car be towed?"] },
];

async function boot(): Promise<Api> {
  const [{ createBrowserDb }, { retrieve }, { answer }, { ingestDocument }, { withTenant }] = await Promise.all([
    import("../lib/pglite-browser"), import("../lib/retrieve"), import("../lib/answer"), import("../lib/ingest"), import("../lib/db"),
  ]);
  const db: any = await createBrowserDb();
  return {
    ask: async (t, q) => answer(q, await retrieve(db, t, q)),
    upload: async (t, title, text) => ingestDocument(db, t, title, text),
    leakCheck: (t) => withTenant(db, t, async (q) => {
      const own = await q.query<any>("SELECT count(*)::int n FROM chunks WHERE tenant_id = $1", [t]);
      const foreign = await q.query<any>("SELECT count(*)::int n FROM chunks WHERE tenant_id <> $1", [t]);
      return { own: own.rows[0].n, foreign: foreign.rows[0].n };
    }),
  };
}

const PDFJS = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build";

async function pdfText(file: File): Promise<string> {
  const pdfjs: any = await import(/* webpackIgnore: true */ `${PDFJS}/pdf.min.mjs`);
  pdfjs.GlobalWorkerOptions.workerSrc = `${PDFJS}/pdf.worker.min.mjs`;
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const c = await (await doc.getPage(i)).getTextContent();
    pages.push(c.items.map((x: any) => x.str + (x.hasEOL ? "\n" : " ")).join(""));
  }
  return pages.join("\n");
}

export default function Copilot() {
  const api = useRef<Api | null>(null);
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState("");
  const [tenant, setTenant] = useState(TENANTS[0].id);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [ans, setAns] = useState<Answer | null>(null);
  const [leak, setLeak] = useState<string>("");
  const [up, setUp] = useState<string>("");

  useEffect(() => { boot().then((a) => { api.current = a; setReady(true); }).catch((e) => setErr(String(e))); }, []);
  const t = TENANTS.find((x) => x.id === tenant)!;

  async function ask(question = q) {
    if (!api.current || !question.trim()) return;
    setQ(question); setBusy(true);
    try { setAns(await api.current.ask(tenant, question)); } finally { setBusy(false); }
  }
  async function onFile(f: File | undefined) {
    if (!f || !api.current) return;
    setUp("Reading " + f.name + "…");
    try {
      const text = /\.pdf$/i.test(f.name) ? await pdfText(f) : await f.text();
      const r = await api.current.upload(tenant, f.name.replace(/\.[^.]+$/, ""), text);
      setUp(`Added "${f.name}" to ${t.name}: ${r.chunks} chunks. Only this association can see it.`);
    } catch (e) { setUp("Couldn't read that file: " + String(e)); }
  }

  return (
    <>
      {err && <div className="card bad">Database failed to start: {err}</div>}
      <div className="card">
        <div className="row">
          <div>
            <label htmlFor="tenant">Association</label>
            <select id="tenant" value={tenant} onChange={(e) => { setTenant(e.target.value); setAns(null); setLeak(""); setUp(""); }}>
              {TENANTS.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
            </select>
          </div>
        </div>
        <label htmlFor="q" style={{ marginTop: 14 }}>Question</label>
        <input id="q" value={q} placeholder="e.g. How tall can my fence be?" onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && ask()} />
        <div className="chips">{t.examples.map((x) => <button key={x} onClick={() => ask(x)} disabled={!ready}>{x}</button>)}</div>
        <button data-testid="ask" onClick={() => ask()} disabled={!ready || busy}>{ready ? (busy ? "Searching…" : "Ask") : "Starting Postgres…"}</button>
      </div>

      {ans && (
        <div className="card" data-testid="answer">
          <div className="ans">{ans.text}</div>
          {ans.citations.map((c) => (
            <div className="cite" key={c.n}><b>[{c.n}] {c.title}</b>{c.section ? ` · ${c.section}` : ""}<br />“{c.quote}{c.quote.length >= 240 ? "…" : ""}”</div>
          ))}
        </div>
      )}

      <div className="card">
        <label>Upload a governing document to {t.name} (.pdf, .txt or .md)</label>
        <input type="file" accept=".pdf,.txt,.md" onChange={(e) => onFile(e.target.files?.[0])} disabled={!ready} />
        {up && <p>{up}</p>}
      </div>

      <div className="card">
        <label>Tenant isolation check</label>
        <p style={{ margin: 0, color: "var(--mut)" }}>Runs <code>SELECT count(*) FROM chunks WHERE tenant_id &lt;&gt; current tenant</code> as the app role. Row-level security should return 0.</p>
        <button className="ghost" data-testid="leak" disabled={!ready} onClick={async () => {
          const r = await api.current!.leakCheck(tenant);
          setLeak(`${r.own} own chunks visible · ${r.foreign} other-tenant chunks visible`);
        }}>Run check</button>
        {leak && <p className={leak.includes("· 0 other") ? "ok" : "bad"} data-testid="leak-result">{leak}</p>}
      </div>
    </>
  );
}
