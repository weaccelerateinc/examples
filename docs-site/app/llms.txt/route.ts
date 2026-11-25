import { loadSite } from "@/lib/docs";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

export function GET() {
  const lines = ["# Accelerate", "", "## Accelerate", ""];
  for (const p of loadSite().pages) {
    const md = (p.href === "/" ? "/index" : p.href) + ".md";
    lines.push(`- [${p.title}](${SITE_URL}${md})${p.description ? `: ${p.description}` : ""}`);
  }
  return new Response(lines.join("\n") + "\n", { headers: { "content-type": "text/plain; charset=utf-8" } });
}
