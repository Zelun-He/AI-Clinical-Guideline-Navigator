import "./globals.css";

export const metadata = {
  title: "AI Clinical Guideline Navigator",
  description: "Grounded clinical guideline search with semantic retrieval and citations",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  );
}
