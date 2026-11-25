"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Copy, FileCode } from "lucide-react";

/** "Copy page" control: copies the page Markdown, or opens the raw .md view. */
export function PageActions({ markdown, mdHref }: { markdown: string; mdHref: string }) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const copy = async () => {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="page-actions" ref={ref}>
      <button onClick={copy} className="pa-main">
        {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied" : "Copy"}
      </button>
      <button className="pa-more" aria-label="More page actions" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <ChevronDown size={14} />
      </button>
      {open && (
        <div className="pa-menu">
          <button onClick={() => { copy(); setOpen(false); }}>
            <Copy size={14} /> Copy page as Markdown
          </button>
          <a href={mdHref} target="_blank" rel="noopener">
            <FileCode size={14} /> View as Markdown
          </a>
        </div>
      )}
    </div>
  );
}
