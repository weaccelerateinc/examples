import { NextResponse, type NextRequest } from "next/server";

// Serve raw Markdown for "<page>.md", matching GitBook's agent-readable URLs.
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.endsWith(".md")) {
    const url = req.nextUrl.clone();
    url.pathname = "/md" + pathname.slice(0, -3);
    return NextResponse.rewrite(url);
  }
}

export const config = { matcher: ["/((?!_next|assets|md/).*\\.md)"] };
