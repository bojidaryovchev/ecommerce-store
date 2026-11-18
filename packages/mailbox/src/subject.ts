/**
 * Subjects and message headers: what decides which conversation a message belongs to.
 */

/*
 * "Re: Re: Отн: поръчка", "AW: поръчка" and "поръчка" are the same conversation. The prefix comes from
 * the sender's mail client, not from the language they write in: Bulgarian clients mix the English and
 * Bulgarian ones, German Outlook answers "AW:" and forwards "WG:", and so on. A counter some clients add
 * ("Re[2]:", "AW^2:") is part of the prefix.
 */
const REPLY_WORDS = ["re", "aw", "antw", "sv", "vs", "odp", "r", "rif", "res", "отн", "относно", "отг", "отговор"];
const FORWARD_WORDS = ["fwd", "fw", "wg", "tr", "rv", "enc", "i", "vl", "vb", "doorst", "pd", "пр", "препратено"];

const prefixPattern = (words: string[]) =>
  new RegExp(`^\\s*(?:${words.join("|")})(?:\\[\\d+\\]|\\^\\d+)?\\s*:\\s*`, "i");

const ANY_PREFIX = prefixPattern([...REPLY_WORDS, ...FORWARD_WORDS]);
const REPLY_PREFIX = prefixPattern(REPLY_WORDS);

/** Every leading reply and forward prefix off, lowercased, for comparing subjects. */
export function normalizeSubject(subject: string): string {
  let value = subject.trim();
  while (ANY_PREFIX.test(value)) value = value.replace(ANY_PREFIX, "");
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * "поръчка" → "Re: поръчка", "AW: Re: поръчка" → "Re: поръчка". One "Re:", the prefix RFC 5322 names
 * and every client threads on; forward prefixes stay (an answer to a forward is still "Re: Fwd: …").
 */
export function replySubject(subject: string): string {
  let value = subject.trim();
  while (REPLY_PREFIX.test(value)) value = value.replace(REPLY_PREFIX, "");
  return `Re: ${value}`;
}

/** The `<…>` ids out of a References or In-Reply-To header. */
export function parseMessageIds(header: string | null | undefined): string[] {
  if (!header) return [];
  return [...header.matchAll(/<[^<>\s]+>/g)].map((m) => m[0]);
}

/** Header lookup that ignores case, because senders do not agree on it. */
export function headerValue(headers: Record<string, string> | null | undefined, name: string): string | undefined {
  if (!headers) return undefined;
  const wanted = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === wanted) return value;
  }
  return undefined;
}

/**
 * The order references a subject quotes: "#" and the eight hex characters our order emails show
 * ("Order Confirmed — #7a1ffab1", and every reply to it). At most three, since a subject is a stranger's
 * and each one is a lookup.
 */
export function orderReferences(subject: string): string[] {
  const found = [...subject.matchAll(/#([0-9a-f]{8})(?![0-9a-z])/gi)].map((m) => m[1]!.toLowerCase());
  return [...new Set(found)].slice(0, 3);
}

/** How an order is referred to in subjects and on screen. */
export const orderReference = (orderId: string): string => orderId.slice(0, 8);

/**
 * The ids to quote back in References: every Message-ID the conversation has seen, oldest first,
 * deduplicated and capped (the header grows by one id per exchange and some clients choke on a long
 * one). The first ids matter most for threading, so the cap keeps the head and the tail.
 */
export function referenceChain(
  messages: ReadonlyArray<{ messageId: string | null; inReplyTo: string | null }>,
): string[] {
  const ids = messages
    .flatMap((m) => [...parseMessageIds(m.inReplyTo), ...(m.messageId ? [m.messageId] : [])])
    .filter((id, index, all) => all.indexOf(id) === index);
  return ids.length <= 20 ? ids : [...ids.slice(0, 10), ...ids.slice(-10)];
}
