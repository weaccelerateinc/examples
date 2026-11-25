import { readFileSync } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import GithubSlugger from "github-slugger";

/**
 * Content source: the GitBook-synced `docs/` folder at the repository root.
 * SUMMARY.md defines navigation order. URLs follow GitBook's published scheme:
 *   <group-slug>/<parent-slug>/<page-slug>
 * The first page is served at "/".
 */
export const DOCS_DIR = path.join(process.cwd(), "..", "docs");
export const REPO_BLOB_URL = "https://github.com/weaccelerateinc/examples/blob/main";

export type Page = {
  file: string; // path relative to docs/, e.g. "integrations/stripe.md"
  slug: string[]; // URL segments; [] for the home page
  href: string; // "/" or "/integrations/stripe"
  title: string; // title from SUMMARY.md
  group: string | null; // group heading from SUMMARY.md
  icon?: string;
  description?: string;
  hidden: boolean;
  children: Page[];
  parent?: Page;
};

export type NavGroup = { title: string | null; pages: Page[] };

const slugify = (s: string) => new GithubSlugger().slug(s);

function pageSlugFromFile(file: string) {
  const parts = file.replace(/\.md$/, "").split("/");
  const last = parts[parts.length - 1];
  if (last.toLowerCase() === "readme") return parts.length > 1 ? parts[parts.length - 2] : "readme";
  return last;
}

export function readDoc(file: string) {
  const raw = readFileSync(path.join(DOCS_DIR, file), "utf8");
  const parsed = matter(raw);
  return { raw, data: parsed.data as Record<string, unknown>, content: parsed.content };
}

let cache: { groups: NavGroup[]; pages: Page[] } | null = null;

export function loadSite() {
  if (cache && process.env.NODE_ENV === "production") return cache;
  const summary = readFileSync(path.join(DOCS_DIR, "SUMMARY.md"), "utf8");
  const groups: NavGroup[] = [];
  const pages: Page[] = [];
  let group: NavGroup | null = null;
  const stack: { indent: number; page: Page }[] = [];

  for (const line of summary.split("\n")) {
    const h = line.match(/^##\s+(.+)$/);
    if (h) {
      group = { title: h[1].trim(), pages: [] };
      groups.push(group);
      stack.length = 0;
      continue;
    }
    if (/^\s*(\*\*\*|---)\s*$/.test(line)) {
      group = { title: null, pages: [] };
      groups.push(group);
      stack.length = 0;
      continue;
    }
    const m = line.match(/^(\s*)[*-]\s+\[(.+?)\]\((.+?)\)/);
    if (!m) continue;
    if (!group) {
      group = { title: null, pages: [] };
      groups.push(group);
    }
    const indent = m[1].length;
    const file = m[3];
    while (stack.length && stack[stack.length - 1].indent >= indent) stack.pop();
    const parent = stack[stack.length - 1]?.page;
    const { data } = readDoc(file);
    const segs = parent
      ? [...parent.slug, pageSlugFromFile(file)]
      : [...(group.title ? [slugify(group.title)] : []), pageSlugFromFile(file)];
    const page: Page = {
      file,
      slug: segs,
      href: "/" + segs.join("/"),
      title: m[2],
      group: group.title,
      icon: typeof data.icon === "string" ? data.icon : undefined,
      description: typeof data.description === "string" ? data.description : undefined,
      hidden: data.hidden === true,
      children: [],
      parent,
    };
    if (parent) parent.children.push(page);
    else group.pages.push(page);
    pages.push(page);
    stack.push({ indent, page });
  }

  // GitBook serves the first page at the site root.
  if (pages[0]) {
    pages[0].slug = [];
    pages[0].href = "/";
  }
  cache = { groups, pages };
  return cache;
}

export function findPage(slug: string[]) {
  const key = "/" + slug.join("/");
  return loadSite().pages.find((p) => p.href === key);
}

export function pageByFile(file: string) {
  return loadSite().pages.find((p) => p.file === file);
}

/** Visible pages in sidebar order, used for previous/next links. */
export function orderedVisiblePages() {
  const out: Page[] = [];
  const walk = (ps: Page[]) => ps.forEach((p) => { if (!p.hidden) { out.push(p); walk(p.children); } });
  loadSite().groups.forEach((g) => walk(g.pages));
  return out;
}
