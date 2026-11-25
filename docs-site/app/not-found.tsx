import Link from "next/link";

export default function NotFound() {
  return (
    <main className="content">
      <h1 className="page-title">Page not found</h1>
      <p>The page you requested does not exist. Go to the <Link href="/">introduction</Link>.</p>
    </main>
  );
}
