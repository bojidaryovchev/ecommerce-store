/**
 * Email addresses out of headers, taken apart properly.
 *
 * Everything the mailbox decides about a sender goes through `singleMailbox`, and nothing is ever sent
 * to a header string. A display name is free text: read naively, the header
 *
 *     "<customer@example.com>" <attacker@evil.example>
 *
 * looks like customer@example.com, and a reply "to the sender" would go to the attacker.
 *
 * Accepted, from an RFC 5322 mailbox list, is exactly one mailbox:
 *
 *     addr@example.com
 *     <addr@example.com>
 *     Display Name <addr@example.com>
 *     "Quoted, Name <even this>" <addr@example.com>
 *     addr@example.com (a comment)
 *
 * Quoted strings and comments are read as what they are, so nothing inside them can pass for the
 * address. Two or more mailboxes, a group ("team: a@x, b@y;"), more than one angle-address, an
 * unterminated quote or comment, an "@" or a bracket loose in a display name, or an address that is not
 * a plain addr-spec all answer null, and a sender we cannot name with certainty is never matched to a
 * conversation, never linked to an order and never replied to.
 *
 * Ported from the buy-a-vend mailbox, where the naive reading was a real bug.
 */

export type Mailbox = {
  /** The display name, unquoted and unescaped, or null. Shown, never trusted. */
  name: string | null;
  /** The addr-spec, lowercased: it is a key, and the same person types it both ways. */
  address: string;
};

/** Longer than any honest From header; a cap so the scan stays cheap. */
const HEADER_MAX = 2000;

/* A dot-atom local part and a domain of dot-separated labels. Quoted local parts ("john smith"@x) and
   address literals (x@[1.2.3.4]) are legal and refused: nobody writes from one, and every extra form is
   one more place for two parsers to disagree. */
const ATEXT = "[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]";
const LOCAL = `${ATEXT}+(?:\\.${ATEXT}+)*`;
const LABEL = "[\\p{L}\\p{N}](?:[\\p{L}\\p{N}-]{0,61}[\\p{L}\\p{N}])?";
const ADDR_SPEC = new RegExp(`^${LOCAL}@${LABEL}(?:\\.${LABEL})+$`, "u");

/** Characters that may not appear loose in an unquoted display name. */
const PHRASE_SPECIALS = /[<>@,;:\\"[\]()]/;

type Part = { kind: "text"; value: string } | { kind: "quoted"; value: string } | { kind: "angle"; value: string };

/**
 * One header value split into mailboxes, each a list of parts, with comments dropped. Null on anything
 * malformed: an unterminated quote, comment or angle-address, a stray closer, or a group.
 */
function lex(header: string): Part[][] | null {
  const mailboxes: Part[][] = [[]];
  let text = "";
  const current = () => mailboxes[mailboxes.length - 1]!;
  const flushText = () => {
    if (text) current().push({ kind: "text", value: text });
    text = "";
  };

  for (let i = 0; i < header.length; i++) {
    const ch = header[i]!;

    if (ch === '"') {
      flushText();
      let value = "";
      let closed = false;
      for (i += 1; i < header.length; i++) {
        const c = header[i]!;
        if (c === "\\") {
          if (i + 1 >= header.length) return null;
          value += header[++i];
        } else if (c === '"') {
          closed = true;
          break;
        } else {
          value += c;
        }
      }
      if (!closed) return null;
      current().push({ kind: "quoted", value });
      continue;
    }

    if (ch === "(") {
      // A comment: skipped whole, nesting and escapes included, and read as the whitespace it stands for.
      let depth = 1;
      for (i += 1; i < header.length && depth > 0; i++) {
        const c = header[i];
        if (c === "\\") i += 1;
        else if (c === "(") depth += 1;
        else if (c === ")") depth -= 1;
      }
      if (depth !== 0) return null;
      i -= 1;
      text += " ";
      continue;
    }

    if (ch === "<") {
      flushText();
      const end = header.indexOf(">", i + 1);
      if (end < 0) return null;
      const inner = header.slice(i + 1, end);
      if (/[<"()\\]/.test(inner)) return null;
      current().push({ kind: "angle", value: inner.trim() });
      i = end;
      continue;
    }

    if (ch === ">" || ch === ")") return null;
    // A group ("undisclosed-recipients:;" and its kind) is not a sender.
    if (ch === ":" || ch === ";") return null;

    if (ch === ",") {
      flushText();
      mailboxes.push([]);
      continue;
    }

    text += ch;
  }
  flushText();
  return mailboxes;
}

/** One lexed mailbox, checked. Null when it is not exactly one valid one. */
function mailboxOf(parts: Part[]): Mailbox | null {
  const angles = parts.filter((p) => p.kind === "angle");

  if (angles.length === 0) {
    // A bare addr-spec, perhaps with comments (already gone) around it.
    if (parts.some((p) => p.kind === "quoted")) return null;
    const value = parts
      .map((p) => p.value)
      .join("")
      .trim();
    return ADDR_SPEC.test(value) ? { name: null, address: value.toLowerCase() } : null;
  }

  // `name <addr>`: one angle-address, and it is the last thing there is.
  if (angles.length > 1) return null;
  const at = parts.findIndex((p) => p.kind === "angle");
  if (parts.slice(at + 1).some((p) => p.value.trim() !== "")) return null;

  const address = parts[at]!.value;
  if (!ADDR_SPEC.test(address)) return null;

  const words: string[] = [];
  for (const part of parts.slice(0, at)) {
    if (part.kind === "quoted") {
      words.push(part.value);
      continue;
    }
    if (PHRASE_SPECIALS.test(part.value)) return null;
    words.push(part.value);
  }
  const name = words.join("").replace(/\s+/g, " ").trim();
  return { name: name || null, address: address.toLowerCase() };
}

/** Every mailbox in a header value, or null when it is not a valid mailbox list. Empty is an empty list. */
export function parseMailboxes(header: string | null | undefined): Mailbox[] | null {
  if (typeof header !== "string" || header.length > HEADER_MAX) return null;
  if (/[\r\n]/.test(header)) return null;
  const lexed = lex(header);
  if (!lexed) return null;

  const mailboxes: Mailbox[] = [];
  for (const parts of lexed) {
    // An empty element ("a@x,,b@y") is tolerated, as RFC 5322 does.
    if (parts.every((p) => p.kind === "text" && p.value.trim() === "")) continue;
    const mailbox = mailboxOf(parts);
    if (!mailbox) return null;
    mailboxes.push(mailbox);
  }
  return mailboxes;
}

/** The one mailbox a header names, or null when it names none, several, or anything that does not parse. */
export function singleMailbox(header: string | null | undefined): Mailbox | null {
  const mailboxes = parseMailboxes(header);
  return mailboxes && mailboxes.length === 1 ? mailboxes[0]! : null;
}

/** The domain of a parsed address. */
export const domainOfAddress = (address: string): string =>
  address
    .slice(address.lastIndexOf("@") + 1)
    .replace(/\.$/, "")
    .toLowerCase();

/** Two addresses are the same mailbox: compared as the lowercase keys they are stored as. */
export const sameAddress = (a: string, b: string): boolean => a.trim().toLowerCase() === b.trim().toLowerCase();

/* -- recipients ------------------------------------------------------------- */

/**
 * The bare, lowercased addresses inside one recipient header value or list item. Lenient on purpose,
 * unlike `singleMailbox`: this only answers "was it addressed to us?", where a false "no" would drop a
 * customer's mail. `"Name" <a@b>`: the brackets are the address, and whatever precedes them is a display
 * name that may itself contain an "@" (`"shop@x.bg" <y@evil.example>` is addressed to evil.example).
 */
export function extractAddresses(value: string): string[] {
  if (typeof value !== "string") return [];
  const angled = [...value.matchAll(/<([^<>]*)>/g)].map((m) => m[1] ?? "");
  const bare = value
    .replace(/"(?:[^"\\]|\\.)*"/g, " ")
    .replace(/<[^<>]*>/g, " ")
    .split(/[\s,;]+/);
  return [...angled, ...bare].map((c) => c.trim().toLowerCase()).filter((c) => c.includes("@"));
}

type AddressLists = ReadonlyArray<ReadonlyArray<string> | null | undefined>;

/**
 * Is `address` among the recipients? Every list counts (to, cc, bcc and the envelope recipients), since
 * mail can reach us as a Bcc or through a forwarding rule with our address in none of the visible
 * headers. Exact match: the Resend account may receive for several domains and addresses, and only mail
 * to the shop's own address belongs in the shop's mailbox.
 */
export function isAddressedTo(lists: AddressLists, address: string): boolean {
  const wanted = address.trim().toLowerCase();
  if (!wanted) return false;
  return lists.some((list) => (list ?? []).some((item) => extractAddresses(item).includes(wanted)));
}

/** Does any list name any address at all? */
export function hasAddresses(lists: AddressLists): boolean {
  return lists.some((list) => (list ?? []).some((item) => extractAddresses(item).length > 0));
}
