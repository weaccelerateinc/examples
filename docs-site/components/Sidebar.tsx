"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { PageIcon } from "./PageIcon";

export type NavPage = { href: string; title: string; icon?: string; children: NavPage[] };
export type NavGroupData = { title: string | null; pages: NavPage[] };

function containsPath(p: NavPage, path: string): boolean {
  return p.href === path || p.children.some((c) => containsPath(c, path));
}

function Item({ page, path, depth, onNavigate }: { page: NavPage; path: string; depth: number; onNavigate: () => void }) {
  const active = page.href === path;
  const hasChildren = page.children.length > 0;
  const [open, setOpen] = useState(() => containsPath(page, path));
  useEffect(() => {
    if (containsPath(page, path)) setOpen(true);
  }, [page, path]);

  return (
    <li>
      <div className={`nav-item ${active ? "active" : ""}`} style={{ paddingLeft: depth ? 12 + depth * 16 : undefined }}>
        <Link href={page.href} onClick={onNavigate} aria-current={active ? "page" : undefined} className="nav-link">
          {page.icon && depth === 0 ? <PageIcon name={page.icon} className="nav-icon" /> : null}
          <span>{page.title}</span>
        </Link>
        {hasChildren && (
          <button
            className={`nav-toggle ${open ? "open" : ""}`}
            aria-label={open ? `Collapse ${page.title}` : `Expand ${page.title}`}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            <ChevronRight size={14} />
          </button>
        )}
      </div>
      {hasChildren && open && (
        <ul className="nav-children">
          {page.children.map((c) => (
            <Item key={c.href} page={c} path={path} depth={depth + 1} onNavigate={onNavigate} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function Sidebar({ groups, open, onNavigate }: { groups: NavGroupData[]; open: boolean; onNavigate: () => void }) {
  const path = usePathname() || "/";
  return (
    <aside className={`sidebar ${open ? "open" : ""}`}>
      <nav aria-label="Documentation">
        {groups.map((g, i) => (
          <div key={i} className={`nav-group ${g.title ? "" : "untitled"}`}>
            {g.title && <div className="nav-group-title">{g.title}</div>}
            <ul>
              {g.pages.map((p) => (
                <Item key={p.href} page={p} path={path} depth={0} onNavigate={onNavigate} />
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
