import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "AI Clinical Guideline Navigator",
  description: "RAG-powered clinical guideline Q&A with citations",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="border-b bg-white">
          <nav className="mx-auto flex max-w-5xl items-center gap-6 p-4 text-sm">
            <Link href="/upload" className="font-semibold hover:text-blue-600">
              Upload Guidelines
            </Link>
            <Link href="/ask" className="font-semibold hover:text-blue-600">
              Ask Question
            </Link>
          </nav>
        </header>
        <main className="mx-auto max-w-5xl p-4">{children}</main>
      </body>
    </html>
  );
}
