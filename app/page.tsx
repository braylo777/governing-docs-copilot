import Copilot from "./copilot";
export default function Page() {
  return (
    <main>
      <h1>Governing-Docs <span>Copilot</span></h1>
      <p className="sub">Ask a question about an association&apos;s CC&amp;Rs, bylaws or rules and get an answer that cites the exact section.
        Each association is a separate tenant, isolated by Postgres row-level security. The two sample associations are fictional.</p>
      <Copilot />
      <p className="foot">This demo runs a real Postgres 17 engine (PGlite, with pgvector) inside your browser, so nothing you upload leaves your device.
        The same schema, RLS policies and queries run against hosted Postgres in production. Answers are extractive: every sentence is quoted from a cited chunk, and the app says so when the documents don&apos;t cover a question.
        Source: <a style={{color:"#c9a96a"}} href="https://github.com/braylo777/governing-docs-copilot">github.com/braylo777/governing-docs-copilot</a></p>
    </main>
  );
}
