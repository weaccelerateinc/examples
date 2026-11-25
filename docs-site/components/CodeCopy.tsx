"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const COPY_SVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>';
const CHECK_SVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';

/** Adds a copy button to every rendered code block. */
export function CodeCopy() {
  const path = usePathname();
  useEffect(() => {
    document.querySelectorAll<HTMLElement>(".prose figure[data-rehype-pretty-code-figure]").forEach((fig) => {
      if (fig.querySelector(".code-copy")) return;
      const btn = document.createElement("button");
      btn.className = "code-copy";
      btn.setAttribute("aria-label", "Copy code");
      btn.innerHTML = COPY_SVG;
      btn.onclick = async () => {
        await navigator.clipboard.writeText(fig.querySelector("pre")?.innerText ?? "");
        btn.innerHTML = CHECK_SVG;
        setTimeout(() => (btn.innerHTML = COPY_SVG), 1500);
      };
      fig.appendChild(btn);
    });
  }, [path]);
  return null;
}
