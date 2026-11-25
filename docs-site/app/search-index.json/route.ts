import Slugger from "github-slugger";
import { loadSite, readDoc } from "@/lib/docs";

export const dynamic = "force-static";

const strip = (s: string) =>
  s
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/[`*_>|#-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export function GET() {
  const entries: { href: string; title: string; section?: string; text: string }[] = [];
  for (const p of loadSite().pages) {
    if (p.hidden) continue;
    const { content } = readDoc(p.file);
    const slugger = new Slugger();
    const parts = content.split(/^(?=#{2,3}\s)/m);
    entries.push({ href: p.href, title: p.title, text: strip(p.description ?? "") + " " + strip(parts[0].replace(/^#\s.*$/m, "")) });
    for (const part of parts.slice(1)) {
      const m = part.match(/^#{2,3}\s+(.+)$/m);
      if (!m) continue;
      const heading = m[1].trim();
      entries.push({ href: `${p.href}#${slugger.slug(strip(heading))}`, title: p.title, section: strip(heading), text: strip(part.slice(m[0].length)) });
    }
  }
  return Response.json(entries);
}
