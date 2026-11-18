/**
 * UI text lives in messages/<locale>/<namespace>.json, one file per area of the app,
 * so areas can be translated independently. Add a namespace here when you add a file.
 */
export const MESSAGE_NAMESPACES = [
  "common",
  "metadata",
  "navigation",
  "home",
  "products",
  "catalog",
  "categories",
  "cart",
  "checkout",
  "account",
  "orders",
  "auth",
  "installation",
  "contact",
  "guides",
  "tools",
  "info",
] as const;

export type MessageNamespace = (typeof MESSAGE_NAMESPACES)[number];

export async function loadMessages(locale: string) {
  const entries = await Promise.all(
    MESSAGE_NAMESPACES.map(
      async (namespace) => [namespace, (await import(`../../messages/${locale}/${namespace}.json`)).default] as const,
    ),
  );
  return Object.fromEntries(entries);
}
