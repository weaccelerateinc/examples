"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Sidebar, type NavGroupData } from "./Sidebar";
import { Search } from "./Search";
import { ThemeToggle } from "./ThemeToggle";

export function Shell({ groups, children }: { groups: NavGroupData[]; children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const path = usePathname();
  useEffect(() => setMenuOpen(false), [path]);

  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <button className="menu-button" aria-label={menuOpen ? "Close menu" : "Open menu"} onClick={() => setMenuOpen((o) => !o)}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <Link href="/" className="logo" aria-label="Accelerate home">
            <img src="/logo-light.png" alt="Accelerate" className="logo-light" />
            <img src="/logo-dark.png" alt="Accelerate" className="logo-dark" />
          </Link>
          <Search />
        </div>
      </header>
      <div className="layout">
        <Sidebar groups={groups} open={menuOpen} onNavigate={() => setMenuOpen(false)} />
        {menuOpen && <div className="scrim" onClick={() => setMenuOpen(false)} />}
        {children}
      </div>
      <ThemeToggle />
    </>
  );
}
