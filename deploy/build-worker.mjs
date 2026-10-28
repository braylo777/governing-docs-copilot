// Packs out/ into a single Worker module (static file server) for upload through the Cloudflare API.
import { readdirSync, readFileSync, statSync, writeFileSync } from "fs";
import { join, relative, extname } from "path";
const CT = { ".html":"text/html; charset=utf-8", ".js":"application/javascript", ".css":"text/css", ".json":"application/json", ".txt":"text/plain; charset=utf-8", ".svg":"image/svg+xml", ".ico":"image/x-icon", ".png":"image/png", ".woff2":"font/woff2" };
const files = {};
const walk = (d) => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) walk(p); else files["/" + relative("out", p)] = { ct: CT[extname(p)] ?? "application/octet-stream", b64: readFileSync(p).toString("base64") }; } };
walk("out");
const worker = `const FILES=${JSON.stringify(files)};
const CSP="default-src 'self'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://cdn.jsdelivr.net; worker-src 'self' blob: https://cdn.jsdelivr.net; connect-src 'self' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src 'self' data:";
function b(s){const r=atob(s),u=new Uint8Array(r.length);for(let i=0;i<r.length;i++)u[i]=r.charCodeAt(i);return u}
export default{async fetch(req){const u=new URL(req.url);let p=decodeURIComponent(u.pathname);if(p.endsWith("/"))p+="index.html";
let f=FILES[p]||FILES[p+".html"]||FILES[p+"/index.html"];const st=f?200:404;if(!f)f=FILES["/404.html"];
const h={"content-type":f.ct,"x-content-type-options":"nosniff","referrer-policy":"strict-origin-when-cross-origin"};
if(f.ct.startsWith("text/html"))h["content-security-policy"]=CSP;else if(p.startsWith("/_next/static/"))h["cache-control"]="public, max-age=31536000, immutable";
return new Response(b(f.b64),{status:st,headers:h})}};`;
writeFileSync("deploy/worker.js", worker);
console.log(Object.keys(files).length, "files,", (worker.length/1e6).toFixed(2), "MB");
