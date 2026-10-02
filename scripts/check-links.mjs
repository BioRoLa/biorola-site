// Fails if any page or stylesheet in _site links to a local file that doesn't
// exist. External links (http:, //host, mailto:) aren't checked.
import fs from "node:fs";
import path from "node:path";

const SITE = "_site";
const files = fs.readdirSync(SITE, { recursive: true }).map((f) => f.split(path.sep).join("/"));
const exists = (p) => {
  const full = path.join(SITE, p);
  return fs.existsSync(full) && (fs.statSync(full).isFile() || fs.existsSync(path.join(full, "index.html")));
};

const broken = new Map();
for (const f of files.filter((f) => /\.(html|css)$/.test(f))) {
  const text = fs.readFileSync(path.join(SITE, f), "utf8");
  const refs = [
    ...text.matchAll(/(?:href|src)\s*=\s*["']([^"'#]+)["']/gi),
    ...text.matchAll(/srcset\s*=\s*["']([^"']+)["']/gi),
    ...text.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g),
  ].flatMap((m) => (m[0].toLowerCase().startsWith("srcset") ? m[1].split(",").map((s) => s.trim().split(/\s+/)[0]) : [m[1]]));
  for (const ref of refs) {
    if (/^(https?:|mailto:|tel:|data:|javascript:|\/\/|#)/i.test(ref)) continue;
    let p = decodeURIComponent(ref.split("?")[0]);
    p = p.startsWith("/") ? p.replace(/^\/(biorola-site\/)?/, "") : path.posix.normalize(path.posix.join(path.posix.dirname(f), p));
    if (!exists(p)) broken.set(p, [...(broken.get(p) ?? []), f]);
  }
}

for (const [target, from] of broken) console.error(`BROKEN  ${target}  <- ${from.slice(0, 3).join(", ")}${from.length > 3 ? ", …" : ""}`);
console.log(`${files.filter((f) => /\.(html|css)$/.test(f)).length} pages and stylesheets checked, ${broken.size} broken targets`);
process.exit(broken.size ? 1 : 0);
