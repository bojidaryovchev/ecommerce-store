import { domainOfAddress } from "./address";
import { headerValue } from "./subject";

/**
 * Who really sent a message.
 *
 * A From header is only a claim. What the receiving server concluded about it (SPF, DKIM and DMARC,
 * each "pass", "fail", "gray", "processing_failed" or "unknown") comes from Resend's receiving server,
 * not from the message's own headers, so a sender cannot write it. The SDK's types predate the field,
 * hence the reading by hand.
 */
export type InboundAuthentication = {
  spf?: string | null;
  dkim?: string | null;
  dmarc?: string | null;
};

export function authenticationOf(email: unknown): InboundAuthentication | null {
  const value = (email as { authentication?: unknown } | null)?.authentication;
  return value && typeof value === "object" ? (value as InboundAuthentication) : null;
}

/** The `d=` domains of the DKIM-Signature header(s) a message carries. */
export function dkimSigningDomains(headers: Record<string, string> | null | undefined): string[] {
  const value = headerValue(headers ?? null, "dkim-signature") ?? "";
  const domains = [...value.matchAll(/(?:^|[;\s])d\s*=\s*([A-Za-z0-9.-]+)/g)].map((m) =>
    m[1]!.toLowerCase().replace(/\.$/, ""),
  );
  return [...new Set(domains)];
}

/** DMARC's relaxed alignment without a public-suffix list: the same domain, or one a subdomain of the
 *  other, neither of which a stranger can sign for without the From domain's own DNS. */
export function isAligned(fromDomain: string, signingDomain: string): boolean {
  const from = fromDomain.toLowerCase();
  const signer = signingDomain.toLowerCase();
  if (!signer.includes(".")) return false;
  return from === signer || from.endsWith(`.${signer}`) || signer.endsWith(`.${from}`);
}

/**
 * Whether the receiving server vouches for the address in From: true, false, or null when it said
 * nothing (mail received before Resend reported it).
 *
 * DMARC pass is exactly that: SPF or DKIM passed for a domain aligned with the From domain. Short of
 * it, a DKIM pass counts when the message carries ONE signature and its domain aligns with From; with
 * two or more, the pass could belong to a different one than we would check. SPF alone never counts: it
 * vouches for the envelope sender, which is not the From.
 */
export function senderVerdict(
  address: string,
  authentication: InboundAuthentication | null,
  headers: Record<string, string> | null | undefined,
): boolean | null {
  if (!authentication) return null;
  if (authentication.dmarc === "pass") return true;
  if (authentication.dkim === "pass") {
    const domains = dkimSigningDomains(headers);
    return domains.length === 1 && isAligned(domainOfAddress(address), domains[0]!);
  }
  return false;
}
