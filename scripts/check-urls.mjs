// Fails if a live URL disappeared from the build, or if anything that must
// never be published (server software, secrets, repo tooling) got into it.
import fs from "node:fs";
import path from "node:path";

const SITE = "_site";
const urls = fs
  .readFileSync("scripts/live-urls.txt", "utf8")
  .split("\n")
  .filter((l) => l && !l.startsWith("#"));

const isFile = (p) => fs.statSync(p, { throwIfNoEntry: false })?.isFile() ?? false;
const missing = urls.filter((u) => !isFile(path.join(SITE, u)));

const FORBIDDEN = [/^\.ssh\//, /^phpMyAdmin\//, /^@eaDir\//, /\/_notes\//, /^node_modules\//, /^CLAUDE\.md$/];
const published = fs.readdirSync(SITE, { recursive: true }).map((f) => f.split(path.sep).join("/"));
const leaked = published.filter((f) => FORBIDDEN.some((re) => re.test(f)));

for (const u of missing) console.error(`MISSING  ${u}`);
for (const f of leaked) console.error(`LEAKED   ${f}`);
console.log(`${urls.length - missing.length}/${urls.length} live URLs present, ${leaked.length} forbidden files published`);
process.exit(missing.length || leaked.length ? 1 : 0);
