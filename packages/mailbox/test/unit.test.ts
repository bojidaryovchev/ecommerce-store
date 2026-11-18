import { describe, expect, it } from "vitest";
import { hasAddresses, isAddressedTo, parseMailboxes, sameAddress, singleMailbox } from "../src/address";
import { dkimSigningDomains, senderVerdict } from "../src/authentication";
import { composeMessage, mailIdentity } from "../src/compose";
import { parseTimestamp } from "../src/inbound";
import { normalizeSubject, orderReferences, parseMessageIds, referenceChain, replySubject } from "../src/subject";
import { htmlToText, snippet, withoutSignature } from "../src/text";

describe("singleMailbox", () => {
  it.each([
    ["ivan@example.bg", { name: null, address: "ivan@example.bg" }],
    ["<ivan@example.bg>", { name: null, address: "ivan@example.bg" }],
    ["Иван Иванов <ivan@example.bg>", { name: "Иван Иванов", address: "ivan@example.bg" }],
    ['"Doe, John" <john@example.com>', { name: "Doe, John", address: "john@example.com" }],
    ['John "Q" Public <q@example.com>', { name: "John Q Public", address: "q@example.com" }],
    ["john@example.com (John Doe)", { name: null, address: "john@example.com" }],
    [
      "Markus <Markus.Weber+frage@Kantine-Weber.DE>",
      { name: "Markus", address: "markus.weber+frage@kantine-weber.de" },
    ],
    ["  Name   <  a@b.example  >  ", { name: "Name", address: "a@b.example" }],
  ])("reads %s", (header, expected) => {
    expect(singleMailbox(header)).toEqual(expected);
  });

  it("is not fooled by an address inside a quoted display name or a comment", () => {
    expect(singleMailbox('"<Victim@Example.com>" <attacker@evil.example>')).toEqual({
      name: "<Victim@Example.com>",
      address: "attacker@evil.example",
    });
    expect(singleMailbox('"a\\" <victim@example.com> \\"" <attacker@evil.example>')?.address).toBe(
      "attacker@evil.example",
    );
    expect(singleMailbox("(victim@example.com) attacker@evil.example")?.address).toBe("attacker@evil.example");
    expect(singleMailbox("Name (nested (<victim@example.com>) comment) <attacker@evil.example>")?.address).toBe(
      "attacker@evil.example",
    );
  });

  it.each([
    ["two mailboxes", "victim@example.com, attacker@evil.example"],
    ["two angle-addresses", "Victim <victim@example.com> <attacker@evil.example>"],
    ["a group", "team: victim@example.com, attacker@evil.example;"],
    ["an empty group", "undisclosed-recipients:;"],
    ["an unquoted @ in the name", "victim@example.com <attacker@evil.example>"],
    ["an unterminated quote", '"victim@example.com <attacker@evil.example>'],
    ["an unterminated comment", "(victim@example.com attacker@evil.example"],
    ["text after the address", "<attacker@evil.example> victim@example.com"],
    ["no address", "Just A Name"],
    ["an empty header", ""],
    ["no domain dot", "root@localhost"],
    ["a header line break", "Name <a@example.com>\r\nBcc: b@example.com"],
    ["a nested angle bracket", "Name <<victim@example.com>>"],
  ])("refuses %s", (_, header) => {
    expect(singleMailbox(header)).toBeNull();
  });

  it("refuses what is not a string, or too long to be honest", () => {
    expect(singleMailbox(null)).toBeNull();
    expect(singleMailbox(`${"a".repeat(3000)}@example.com`)).toBeNull();
  });

  it("reads lists and compares addresses case-insensitively", () => {
    expect(parseMailboxes("a@x.example, B <b@y.example>,,")?.map((m) => m.address)).toEqual([
      "a@x.example",
      "b@y.example",
    ]);
    expect(parseMailboxes("a@x.example, not an address")).toBeNull();
    expect(sameAddress("Victim@Example.COM", " victim@example.com")).toBe(true);
  });
});

describe("recipients", () => {
  const shop = "contact@shop.example";

  it("finds the shop's address in any list, exactly", () => {
    expect(isAddressedTo([["Shop <Contact@Shop.example>"]], shop)).toBe(true);
    expect(isAddressedTo([[], null, ["contact@shop.example"]], shop)).toBe(true);
    expect(isAddressedTo([["sales@shop.example", "contact@shop.example.evil.example"]], shop)).toBe(false);
    // A display name that looks like our address does not make the message ours.
    expect(isAddressedTo([['"contact@shop.example" <someone@else.example>']], shop)).toBe(false);
  });

  it("tells an empty recipient list from one that names nobody of ours", () => {
    expect(hasAddresses([[], null, undefined])).toBe(false);
    expect(hasAddresses([["other@else.example"]])).toBe(true);
  });
});

describe("subjects and headers", () => {
  it("treats reply and forward prefixes in any language as the same conversation", () => {
    expect(normalizeSubject("Re: RE: Отн: Поръчка  #7a1ffab1")).toBe("поръчка #7a1ffab1");
    expect(normalizeSubject("AW: Re[2]: Fwd: Въпрос")).toBe("въпрос");
    expect(replySubject("Re: Отн: Въпрос")).toBe("Re: Въпрос");
    expect(replySubject("Fwd: Въпрос")).toBe("Re: Fwd: Въпрос");
  });

  it("reads order references the way our emails write them", () => {
    expect(orderReferences("Re: Order Confirmed — #7A1FFAB1")).toEqual(["7a1ffab1"]);
    expect(orderReferences("#7a1ffab1 and #7a1ffab1, #0123abcd #0123abcd9")).toEqual(["7a1ffab1", "0123abcd"]);
    expect(orderReferences("no reference 7a1ffab1")).toEqual([]);
  });

  it("builds a capped References chain from the conversation", () => {
    expect(parseMessageIds("<a@x> <b@y>\r\n <c@z>")).toEqual(["<a@x>", "<b@y>", "<c@z>"]);
    const messages = Array.from({ length: 30 }, (_, i) => ({
      messageId: `<m${i}@x>`,
      inReplyTo: i ? `<m${i - 1}@x>` : null,
    }));
    const chain = referenceChain(messages);
    expect(chain).toHaveLength(20);
    expect(chain[0]).toBe("<m0@x>");
    expect(chain.at(-1)).toBe("<m29@x>");
  });
});

describe("senderVerdict", () => {
  const signed = (...domains: string[]) => ({
    "DKIM-Signature": domains.map((d) => `v=1; a=rsa-sha256; d=${d}; s=k1`).join(", "),
  });

  it("trusts DMARC, or one DKIM signature aligned with the From domain", () => {
    expect(senderVerdict("ivan@abv.bg", { dmarc: "pass" }, null)).toBe(true);
    expect(senderVerdict("ivan@mail.abv.bg", { dkim: "pass" }, signed("abv.bg"))).toBe(true);
    expect(senderVerdict("ivan@abv.bg", { dkim: "pass" }, signed("evil.example"))).toBe(false);
    expect(senderVerdict("ivan@abv.bg", { dkim: "pass" }, signed("abv.bg", "evil.example"))).toBe(false);
  });

  it("never trusts SPF alone, and says nothing when the server said nothing", () => {
    expect(senderVerdict("ivan@abv.bg", { spf: "pass" }, null)).toBe(false);
    expect(senderVerdict("ivan@abv.bg", null, null)).toBeNull();
    expect(dkimSigningDomains({ "dkim-signature": "v=1; d=Example.COM.; s=x" })).toEqual(["example.com"]);
  });
});

describe("bodies", () => {
  it("flattens HTML-only mail into text without running any of it", () => {
    expect(
      htmlToText(
        "<style>p{}</style><p>Здравейте,</p><p>колко струва <b>доставка</b>?<br>Иван</p><script>alert(1)</script>",
      ),
    ).toBe("Здравейте,\nколко струва доставка?\nИван");
    expect(htmlToText("a &lt;b&gt; &amp; &#1040;")).toBe("a <b> & А");
  });

  it("previews the new part of a reply", () => {
    expect(snippet("Благодаря!\n\nOn Mon, 3 Nov 2026 at 10:00, Shop <contact@shop.example>\nwrote:\n> old text")).toBe(
      "Благодаря!",
    );
    expect(snippet("Здравейте\n\n--\nShop\ncontact@shop.example")).toBe("Здравейте");
    expect(withoutSignature("text\n--\nsig")).toBe("text");
  });

  it("signs outgoing mail and escapes what was typed", () => {
    const identity = mailIdentity("Shop <Contact@Shop.example>", "https://shop.example/")!;
    expect(identity).toEqual({
      from: "Shop <Contact@Shop.example>",
      address: "contact@shop.example",
      name: "Shop",
      siteUrl: "https://shop.example",
    });
    const { text, html } = composeMessage(identity, "Здравейте,\n\n<b>не</b> е HTML");
    expect(text).toBe("Здравейте,\n\n<b>не</b> е HTML\n\n--\nShop\ncontact@shop.example · shop.example");
    expect(html).toContain("&lt;b&gt;не&lt;/b&gt; е HTML");
    expect(mailIdentity("two@a.example, three@b.example")).toBeNull();
  });

  it("reads Resend's timestamps either way they are written", () => {
    expect(parseTimestamp("2026-11-18T10:00:00.000Z").toISOString()).toBe("2026-11-18T10:00:00.000Z");
    expect(parseTimestamp("2026-10-07 20:03:51.555725+00").toISOString()).toBe("2026-10-07T20:03:51.555Z");
  });
});
