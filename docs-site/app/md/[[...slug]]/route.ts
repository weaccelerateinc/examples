import { findPage, loadSite, readDoc } from "@/lib/docs";

export const dynamicParams = false;

export function generateStaticParams() {
  return loadSite().pages.map((p) => ({ slug: p.slug.length ? p.slug : ["index"] }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug = [] } = await params;
  const page = findPage(slug.length === 1 && slug[0] === "index" ? [] : slug);
  if (!page) return new Response("Not found", { status: 404 });
  return new Response(readDoc(page.file).content.trim() + "\n", {
    headers: { "content-type": "text/markdown; charset=utf-8" },
  });
}
