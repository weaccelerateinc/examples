import path from "node:path";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeStringify from "rehype-stringify";
import { visit } from "unist-util-visit";
import { toString } from "hast-util-to-string";
import type { Root, Element } from "hast";
import type { Root as MdRoot, Heading } from "mdast";
import { DOCS_DIR, REPO_BLOB_URL, pageByFile } from "./docs";

export type TocItem = { id: string; text: string; depth: 2 | 3 };

/** Remove the first H1; the page header renders the title. */
function remarkStripTitle() {
  return (tree: MdRoot) => {
    const i = tree.children.findIndex((n) => n.type === "heading" && (n as Heading).depth === 1);
    if (i !== -1) tree.children.splice(i, 1);
  };
}

/** Rewrite relative .md links and image paths to site URLs. */
function rehypeLinks(options: { file: string }) {
  const dir = path.posix.dirname(options.file);
  return (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      if (node.tagName === "a" && typeof node.properties.href === "string") {
        const href = node.properties.href;
        if (/^(https?:|mailto:|#)/.test(href)) {
          if (/^https?:/.test(href)) {
            node.properties.target = "_blank";
            node.properties.rel = ["noopener", "noreferrer"];
          }
          return;
        }
        const [p, hash] = href.split("#");
        const target = path.posix.normalize(path.posix.join(dir, p));
        if (target.endsWith(".md")) {
          const page = pageByFile(target);
          if (page) {
            node.properties.href = page.href + (hash ? "#" + hash : "");
            return;
          }
        }
        // Links that leave docs/ point at the source repository on GitHub.
        const repoPath = path.posix.normalize(path.posix.join("docs", dir, p));
        if (!repoPath.startsWith("..")) {
          node.properties.href = `${REPO_BLOB_URL}/${repoPath}${hash ? "#" + hash : ""}`;
          node.properties.target = "_blank";
          node.properties.rel = ["noopener", "noreferrer"];
        }
      }
      if (node.tagName === "img" && typeof node.properties.src === "string") {
        const src = node.properties.src;
        if (!/^(https?:|data:|\/)/.test(src)) {
          node.properties.src = "/assets/" + path.posix.basename(src);
          node.properties.loading = "lazy";
        }
      }
    });
  };
}

/** Turn ```mermaid fences into placeholders that the Mermaid client component renders. */
function rehypeMermaid() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element, index, parent) => {
      if (node.tagName !== "pre" || !parent || index === undefined) return;
      const code = node.children[0] as Element | undefined;
      const cls = (code?.properties?.className as string[] | undefined) ?? [];
      if (code?.tagName !== "code" || !cls.includes("language-mermaid")) return;
      (parent as Element).children[index] = {
        type: "element",
        tagName: "div",
        properties: { className: ["mermaid-diagram"], dataSource: toString(code) },
        children: [{ type: "element", tagName: "pre", properties: { className: ["mermaid-fallback"] }, children: [{ type: "text", value: toString(code) }] }],
      };
    });
  };
}

/** Wrap tables so they scroll horizontally on small screens. */
function rehypeTableWrap() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element, index, parent) => {
      if (node.tagName !== "table" || !parent || index === undefined) return;
      (parent as Element).children[index] = {
        type: "element",
        tagName: "div",
        properties: { className: ["table-wrap"] },
        children: [node],
      };
    });
  };
}

function rehypeCollectToc(toc: TocItem[]) {
  return () => (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      if ((node.tagName === "h2" || node.tagName === "h3") && node.properties.id) {
        toc.push({ id: String(node.properties.id), text: toString(node), depth: node.tagName === "h2" ? 2 : 3 });
        node.children = [
          {
            type: "element",
            tagName: "a",
            properties: { href: `#${node.properties.id}`, className: ["heading-anchor"] },
            children: node.children,
          },
        ];
      }
    });
  };
}

export async function renderMarkdown(content: string, file: string) {
  const toc: TocItem[] = [];
  const out = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkStripTitle)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSlug)
    .use(rehypeLinks, { file })
    .use(rehypeTableWrap)
    .use(rehypeMermaid)
    .use(rehypePrettyCode, {
      theme: { light: "github-light", dark: "github-dark" },
      keepBackground: false,
      defaultLang: "plaintext",
    })
    .use(rehypeCollectToc(toc))
    .use(rehypeStringify)
    .process(content);
  return { html: String(out), toc };
}

export { DOCS_DIR };
