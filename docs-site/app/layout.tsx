import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Shell } from "@/components/Shell";
import { CodeCopy } from "@/components/CodeCopy";
import { Mermaid } from "@/components/Mermaid";
import { themeInitScript } from "@/components/ThemeToggle";
import { navGroups } from "@/lib/nav";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
  icons: { icon: "/icon.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <Shell groups={navGroups()}>{children}</Shell>
        <CodeCopy />
        <Mermaid />
      </body>
    </html>
  );
}
