// Copy GitBook image assets from ../docs into public/assets so pages can reference them.
import { cpSync, mkdirSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const docs = join(root, "..", "docs");
const out = join(root, "public", "assets");
mkdirSync(out, { recursive: true });

const gitbookAssets = join(docs, ".gitbook", "assets");
if (existsSync(gitbookAssets)) cpSync(gitbookAssets, out, { recursive: true });
for (const f of readdirSync(docs)) {
  if (/\.(png|jpe?g|gif|svg|webp)$/i.test(f)) cpSync(join(docs, f), join(out, f));
}
console.log("synced docs assets ->", out);
