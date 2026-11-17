import Link from "next/link";
import React from "react";

/**
 * 404 for URLs that match no route (served with a real 404 status). Pages that call notFound()
 * inside the storefront get the localized app/[locale]/not-found.tsx instead.
 */
const GlobalNotFound: React.FC = () => {
  return (
    <html lang="bg">
      <body className="bg-background text-foreground flex min-h-screen items-center justify-center font-sans antialiased">
        <main className="space-y-4 px-6 text-center">
          <p className="text-muted-foreground text-sm font-medium">404</p>
          <h1 className="text-3xl font-bold">Страницата не е намерена</h1>
          <p className="text-muted-foreground">Page not found</p>
          <div className="flex justify-center gap-4 pt-2 text-sm font-medium">
            <Link href="/" className="underline underline-offset-4">
              Към началната страница
            </Link>
            <Link href="/en" className="underline underline-offset-4">
              Home (English)
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
};

export default GlobalNotFound;
