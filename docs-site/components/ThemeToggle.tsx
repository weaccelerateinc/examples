"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";

type Mode = "light" | "system" | "dark";

export const themeInitScript = `(function(){try{var m=localStorage.getItem('theme')||'system';var d=m==='dark'||(m==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=d?'dark':'light';}catch(e){}})();`;

function apply(mode: Mode) {
  const dark = mode === "dark" || (mode === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
}

export function ThemeToggle() {
  const [mode, setMode] = useState<Mode>("system");
  useEffect(() => {
    setMode((localStorage.getItem("theme") as Mode) || "system");
  }, []);
  useEffect(() => {
    apply(mode);
    if (mode !== "system") return;
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const fn = () => apply("system");
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, [mode]);

  const set = (m: Mode) => {
    localStorage.setItem("theme", m);
    setMode(m);
  };
  const opts: [Mode, React.ReactNode, string][] = [
    ["light", <Sun key="l" size={16} />, "Light theme"],
    ["system", <Monitor key="s" size={16} />, "System theme"],
    ["dark", <Moon key="d" size={16} />, "Dark theme"],
  ];
  return (
    <div className="theme-toggle" role="group" aria-label="Theme">
      {opts.map(([m, icon, label]) => (
        <button key={m} aria-label={label} aria-pressed={mode === m} className={mode === m ? "on" : ""} onClick={() => set(m)}>
          {icon}
        </button>
      ))}
    </div>
  );
}
