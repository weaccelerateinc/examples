"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Hash, Search as SearchIcon } from "lucide-react";

type Entry = { href: string; title: string; section?: string; text: string };

let indexPromise: Promise<Entry[]> | null = null;
const loadIndex = () => (indexPromise ??= fetch("/search-index.json").then((r) => r.json()));

function snippet(text: string, q: string) {
  const i = text.toLowerCase().indexOf(q);
  if (i === -1) return text.slice(0, 120);
  const start = Math.max(0, i - 50);
  return (start > 0 ? "…" : "") + text.slice(start, i + q.length + 70) + "…";
}

export function Search() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [index, setIndex] = useState<Entry[]>([]);
  const [sel, setSel] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    loadIndex().then(setIndex);
    setTimeout(() => input.current?.focus(), 0);
  }, [open]);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    const words = term.split(/\s+/);
    return index
      .map((e) => {
        const title = (e.section ?? e.title).toLowerCase();
        const body = e.text.toLowerCase();
        if (!words.every((w) => title.includes(w) || body.includes(w))) return null;
        const score = (title.includes(term) ? 10 : 0) + (e.section ? 0 : 3) + words.filter((w) => title.includes(w)).length * 2;
        return { e, score };
      })
      .filter((x): x is { e: Entry; score: number } => !!x)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
      .map((x) => x.e);
  }, [q, index]);

  useEffect(() => setSel(0), [q]);

  const go = useCallback(
    (e: Entry) => {
      setOpen(false);
      setQ("");
      router.push(e.href);
    },
    [router],
  );

  return (
    <>
      <button className="search-trigger" onClick={() => setOpen(true)}>
        <SearchIcon size={16} />
        <span>Search…</span>
        <kbd>⌘</kbd>
        <kbd>K</kbd>
      </button>
      {open && (
        <div className="search-overlay" onMouseDown={() => setOpen(false)}>
          <div className="search-dialog" role="dialog" aria-label="Search documentation" onMouseDown={(e) => e.stopPropagation()}>
            <div className="search-input-row">
              <SearchIcon size={18} />
              <input
                ref={input}
                value={q}
                placeholder="Search documentation…"
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(s + 1, results.length - 1)); }
                  if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
                  if (e.key === "Enter" && results[sel]) go(results[sel]);
                }}
              />
              <kbd>Esc</kbd>
            </div>
            <ul className="search-results">
              {q && results.length === 0 && <li className="search-empty">No results for “{q}”</li>}
              {results.map((r, i) => (
                <li key={r.href + i}>
                  <button className={i === sel ? "sel" : ""} onMouseEnter={() => setSel(i)} onClick={() => go(r)}>
                    {r.section ? <Hash size={16} /> : <FileText size={16} />}
                    <span className="search-result-body">
                      <span className="search-result-title">
                        {r.section ? <><span className="muted">{r.title} › </span>{r.section}</> : r.title}
                      </span>
                      <span className="search-result-snippet">{snippet(r.text, q.trim().toLowerCase())}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
