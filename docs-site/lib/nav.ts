import { loadSite, type Page } from "./docs";
import type { NavGroupData, NavPage } from "@/components/Sidebar";

const toNav = (p: Page): NavPage => ({
  href: p.href,
  title: p.title,
  icon: p.icon,
  children: p.children.filter((c) => !c.hidden).map(toNav),
});

export function navGroups(): NavGroupData[] {
  return loadSite().groups.map((g) => ({ title: g.title, pages: g.pages.filter((p) => !p.hidden).map(toNav) }));
}
