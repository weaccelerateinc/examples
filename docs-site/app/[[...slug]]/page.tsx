import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { findPage, loadSite, orderedVisiblePages, readDoc } from "@/lib/docs";
import { renderMarkdown } from "@/lib/markdown";
import { PageIcon } from "@/components/PageIcon";
import { PageActions } from "@/components/PageActions";
import { Toc } from "@/components/Toc";

export const dynamicParams = false;

export function generateStaticParams() {
  return loadSite().pages.map((p) => ({ slug: p.slug }));
}

type Props = { params: Promise<{ slug?: string[] }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug = [] } = await params;
  const page = findPage(slug);
  if (!page) return {};
  return {
    title: page.href === "/" ? { absolute: `${page.title} | Accelerate` } : page.title,
    description: page.description,
    alternates: { canonical: page.href },
    robots: page.hidden ? { index: false } : undefined,
  };
}

export default async function DocPage({ params }: Props) {
  const { slug = [] } = await params;
  const page = findPage(slug);
  if (!page) notFound();

  const { content } = readDoc(page.file);
  const { html, toc } = await renderMarkdown(content, page.file);
  const order = orderedVisiblePages();
  const i = order.findIndex((p) => p.href === page.href);
  const prev = i > 0 ? order[i - 1] : undefined;
  const next = i >= 0 && i < order.length - 1 ? order[i + 1] : undefined;
  const crumb = page.parent?.title ?? page.group;
  const mdHref = (page.href === "/" ? "/index" : page.href) + ".md";

  return (
    <>
      <main className="content">
        <div className="page-head">
          <div className="crumb">{crumb}</div>
          <PageActions markdown={readDoc(page.file).content.trim()} mdHref={mdHref} />
        </div>
        <h1 className="page-title">
          {page.icon && <PageIcon name={page.icon} size={28} className="title-icon" />}
          {page.title}
        </h1>
        {page.description && <p className="page-description">{page.description}</p>}
        <article className="prose" dangerouslySetInnerHTML={{ __html: html }} />
        <nav className="pager" aria-label="Pagination">
          {prev ? (
            <Link href={prev.href} className="pager-link prev">
              <ChevronLeft size={18} />
              <span><small>Previous</small>{prev.title}</span>
            </Link>
          ) : <span />}
          {next ? (
            <Link href={next.href} className="pager-link next">
              <span><small>Next</small>{next.title}</span>
              <ChevronRight size={18} />
            </Link>
          ) : <span />}
        </nav>
      </main>
      <Toc items={toc} />
    </>
  );
}
