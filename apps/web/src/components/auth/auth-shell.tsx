import React from "react";

/** The card every sign-in page sits in: a title, a line under it, and the form. */
const AuthShell: React.FC<{ title: string; description?: string; children: React.ReactNode }> = ({
  title,
  description,
  children,
}) => (
  <main className="max-w-container flex min-h-[70vh] items-center justify-center py-12 md:py-16">
    <div className="bg-card w-full max-w-md rounded-3xl border p-6 shadow-sm sm:p-8">
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      {description && <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">{description}</p>}
      <div className="mt-6 space-y-5">{children}</div>
    </div>
  </main>
);

export { AuthShell };
