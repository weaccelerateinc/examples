"use client";

import { useEffect, useState } from "react";
import { ListTree } from "lucide-react";
import type { TocItem } from "@/lib/markdown";

export function Toc({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState<string | null>(items[0]?.id ?? null);

  useEffect(() => {
    const els = items.map((i) => document.getElementById(i.id)).filter((e): e is HTMLElement => !!e);
    const onScroll = () => {
      let current = els[0]?.id ?? null;
      for (const el of els) {
        if (el.getBoundingClientRect().top < 120) current = el.id;
        else break;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [items]);

  if (items.length === 0) return <aside className="toc" />;
  return (
    <aside className="toc">
      <div className="toc-inner">
        <div className="toc-title">
          <ListTree size={14} /> On this page
        </div>
        <ul>
          {items.map((i) => (
            <li key={i.id} className={`depth-${i.depth} ${active === i.id ? "active" : ""}`}>
              <a href={`#${i.id}`}>{i.text}</a>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
