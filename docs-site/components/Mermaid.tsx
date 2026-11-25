"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/** Renders `.mermaid-diagram` placeholders produced by the Markdown pipeline. Re-renders on theme change. */
export function Mermaid() {
  const path = usePathname();
  const [theme, setTheme] = useState<string | undefined>();

  useEffect(() => {
    const read = () => setTheme(document.documentElement.dataset.theme);
    read();
    const obs = new MutationObserver(read);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const nodes = [...document.querySelectorAll<HTMLElement>(".mermaid-diagram")];
    if (!nodes.length || !theme) return;
    let cancelled = false;
    import("mermaid").then(async ({ default: mermaid }) => {
      mermaid.initialize({ startOnLoad: false, theme: theme === "dark" ? "dark" : "default", fontFamily: "Inter, system-ui, sans-serif", sequence: { useMaxWidth: false }, flowchart: { useMaxWidth: false } });
      for (const [i, el] of nodes.entries()) {
        try {
          const { svg } = await mermaid.render(`mmd-${i}-${Date.now()}`, el.dataset.source ?? "");
          if (!cancelled) el.innerHTML = svg;
        } catch {
          /* keep the source fallback */
        }
      }
    });
    return () => { cancelled = true; };
  }, [path, theme]);

  return null;
}
