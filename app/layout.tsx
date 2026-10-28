import "./globals.css";
export const metadata = {
  title: "Governing-Docs Copilot",
  description: "Cited answers from HOA and condo governing documents, isolated per association with Postgres row-level security.",
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="en"><body>{children}</body></html>);
}
