// Fails if any banned word appears in the codebase.
// Capital Lane Ltd never uses these words in copy, metadata or code.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const banned = ["ta" + "xi", "ta" + "xis", "c" + "ab", "c" + "abs"];
const pattern = new RegExp(`\\b(${banned.join("|")})\\b`, "i");
const skipDirs = new Set(["node_modules", ".next", ".git", "research", "out", "dist"]);
const exts = new Set([".ts", ".tsx", ".js", ".mjs", ".json", ".md", ".css", ".html", ".yaml", ".yml", ".txt"]);

const hits = [];
function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (skipDirs.has(name)) continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path);
    else if (exts.has(extname(name)) && !name.startsWith("pnpm-lock")) {
      readFileSync(path, "utf8").split("\n").forEach((line, i) => {
        if (pattern.test(line) && !line.includes("wording-check:allow")) hits.push(`${path}:${i + 1}: ${line.trim()}`);
      });
    }
  }
}
walk(process.cwd());
if (hits.length) {
  console.error("Banned wording found:\n" + hits.join("\n"));
  process.exit(1);
}
console.log("Wording check passed.");
