# Google Search status

<!-- Maintained by /seo:audit and /seo:fix. Edit waiver reasons and Notes freely; the other rows are regenerated on each audit. -->

|            |                                                                                                                                                 |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Checklist  | seo 0.2.0, Google docs retrieved 2026-07-21                                                                                                     |
| Last audit | 2026-11-18, first audit, all 517 items in four reviews; statuses updated after the fixes made the same night                                    |
| Stack      | Next.js 16.4 App Router, Cache Components (prerendered shells, streamed request-time parts), next-intl 4 (bg at the root, en under /en), Vercel |
| Site       | https://justpurrrfect.com (noindex until launch) · dev: http://localhost:3456 (`SITE_INDEXING=on npx next dev -p 3456` in apps/web)             |
| Applies    | all, ecommerce, multilingual, images, reviews, ugc, faceted, paginated, articles, local                                                         |

Why these tags:

- `ecommerce`: product pages with prices, cart and Stripe checkout.
- `multilingual`: Bulgarian at the root, English under /en (next-intl routing).
- `images`: product photos and the shop's own category pictures.
- `reviews`, `ugc`: signed-in buyers review products they bought.
- `faceted`: filter and sort query parameters on category and listing pages.
- `paginated`: `?page=N` on listings.
- `articles`: guides at /saveti with Article markup.
- `local`: serves Bulgaria with installation; no public street address yet.

The live checks ran against the launch configuration (`SITE_INDEXING=on`); production is noindex on purpose until the
descriptions are rewritten (docs/enrichment.md). check-site after the fixes: 27 pass, 3 warn, 1 info-level
duplicate-description note, 0 fail (the one fail in the second run was a dev-server hiccup; the production build answers 200).

## Regressions

None (first audit).

## To do

| ID       | Level    | Item                                                                                 | Status  | Evidence / what's missing                                                                                                                                                                     |
| -------- | -------- | ------------------------------------------------------------------------------------ | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CQ-010   | must     | Don't mass-produce pages to manipulate rankings (scaled content abuse)               | partial | 387 pages from the supplier feed; the rewrite now adds the shop's own sizing, installation and guide notes per section.                                                                       |
| CQ-011   | must     | Don't republish scraped or lightly reworded content                                  | fail    | Launch blocker: descriptions are the supplier's text until the rewrite runs; photos come from the supplier.                                                                                   |
| CQ-028   | must     | Don't impersonate businesses or publish false business information                   | partial | /produkt/italianski-peletni-kamini-artel repeats the supplier's "ХИДРО ТЕРМ ЕООД е изключителен представител…"; the rewrite drops supplier names.                                             |
| CQ-001   | should   | Create content primarily to help people                                              | partial | Home, guides and installation pages pass; product pages are supplier text; subcategories have no text.                                                                                        |
| CQ-002   | should   | Add original information and value                                                   | fail    | Product text is the supplier's; guides are original but have no first-hand data.                                                                                                              |
| CQ-003   | should   | Avoid search engine-first content patterns                                           | fail    | Product pages restate supplier copy (the rewrite prompt no longer sets word counts).                                                                                                          |
| CQ-004   | should   | Publish carefully produced, readable content under honest headings                   | partial | Trader placeholders in [brackets] on legal pages; 19 supplier texts still say "ПОИСКАЙТЕ ОФЕРТА…"; typos fixed.                                                                               |
| CQ-007   | should   | Make content trustworthy: sourced, accurate and backed by expertise                  | fail    | Supplier specs contradict names on several heat pumps (R32 Mono 5 kW listed at 17.6 kW); guides are unsigned.                                                                                 |
| CQ-008   | should   | Show who is behind the site                                                          | fail    | /za-nas has the placeholder trader and brand; no people or address.                                                                                                                           |
| CQ-009   | should   | Add accurate bylines that lead to author information                                 | fail    | No named author on guides.                                                                                                                                                                    |
| CQ-033   | should   | Review automatically generated content and metadata                                  | fail    | Imported specs aren't checked against names; 15 MHP/SHPO heat pumps have no category.                                                                                                         |
| CQ-035   | should   | Base review content on first-hand research                                           | partial | Guides go beyond specs but show no own tests or photos.                                                                                                                                       |
| CQ-040   | should   | Use the words your audience searches with, in prominent places                       | partial | 77 product names are bare model codes; the rewrite now adds the product type to names.                                                                                                        |
| EC-007   | should   | Link menus to categories, categories to subcategories, and subcategories to products | partial | Pagination is now links; 15 heat pumps without a category are reachable only from the sitemap and listings.                                                                                   |
| EC-015   | should   | Use `key=value` query parameters, each key once                                      | partial | Multi-select filters repeat keys (brand=A&brand=B).                                                                                                                                           |
| EC-024   | consider | Prefetch the next listing page                                                       | partial | Next-page links prefetch on hover and in view (next/link); no explicit preload.                                                                                                               |
| EC-033   | should   | Write product and category descriptions in shoppers' words                           | partial | 10 sections have curated text; 20 subsections none; products await the rewrite.                                                                                                               |
| EC-038   | should   | Show first-hand experience and expertise, with evidence                              | fail    | Stock photos, no own installation photos or named expert.                                                                                                                                     |
| EC-039   | should   | Measure products on the factors that decide the purchase                             | partial | Guides quantify sizing; the comparison bars use supplier specs, some wrong.                                                                                                                   |
| EC-040   | should   | Compare alternatives and go beyond the manufacturer's claims                         | partial | Guides compare types; no own testing.                                                                                                                                                         |
| EC-042   | consider | Link to useful resources and to several sellers                                      | partial | Guides link to own tools only.                                                                                                                                                                |
| OPS-021  | should   | Keep site software, plugins and the server patched                                   | partial | `pnpm audit --prod`: 1 high (picomatch via next-intl > @parcel/watcher), no patched release yet.                                                                                              |
| OPS-029  | consider | Use industry-standard providers for basic support services                           | partial | Google sign-in through Auth.js plus our own email-and-password sign-in (scrypt).                                                                                                              |
| OPS-030  | should   | Publish an abuse policy and let users report spam                                    | fail    | No content policy page or report control on reviews.                                                                                                                                          |
| OPS-032  | should   | Moderate suspicious user interactions                                                | partial | Reviews need a paid order and admins can delete them; no approval step.                                                                                                                       |
| OPS-033  | should   | Spot spam accounts from sign-up patterns                                             | fail    | No sign-up scoring (low risk: reviews need a paid order).                                                                                                                                     |
| OPS-034  | should   | Block repeat spammers with a blocklist                                               | fail    | No account or IP ban.                                                                                                                                                                         |
| OPS-037  | consider | Block automated sign-ups with reCAPTCHA or similar                                   | partial | Forms have a honeypot and timing; registration has email confirmation only.                                                                                                                   |
| OPS-045  | should   | Don't let unmoderated user content make the site look explicit                       | partial | No uploads; review text is unmoderated but needs a purchase.                                                                                                                                  |
| CI-025   | must     | Return 404 or 410 for pages that don't exist                                         | partial | Unknown products, categories, legacy URLs and listing pages past the end answer 404 from the proxy; unknown guides, calculators and other paths render the not-found page with noindex (200). |
| CI-042   | must     | Don't use robots.txt, the removal tool or noindex to pick canonicals                 | partial | English product pages are noindex without a canonical to the Bulgarian page; filtered views pair noindex with a canonical.                                                                    |
| CI-099   | must     | Return 404 for empty, duplicate or nonsensical filter and page URLs                  | partial | Plain listing pages past the end are 404; filter combinations with no results render (noindex, and now disallowed in robots.txt).                                                             |
| CI-026   | should   | Make the custom 404 page helpful while keeping the 404 status                        | partial | Not-found pages offer the catalogue's sections and contact; the 404 status covers catalogue paths (CI-025).                                                                                   |
| CI-033   | should   | Use 302, 303 or 307 only for temporary redirects                                     | partial | /bg/* → 307 to the unprefixed URL (next-intl).                                                                                                                                                |
| CI-037   | should   | Redirect duplicate host and protocol variants to one preferred URL                   | partial | http://www takes two hops (Vercel upgrades to https first).                                                                                                                                   |
| CI-041   | should   | Link internally to canonical URLs                                                    | partial | Contact links carry ?tema=/?produkt= prefills (canonical /kontakti).                                                                                                                          |
| CI-064   | should   | Link every important page from at least one other page                               | partial | Pagination is now links; 16 products have no category and are reachable only from the sitemap and listings.                                                                                   |
| CI-072   | should   | Use readable, hyphenated words in the audience's language                            | partial | /products and /categories are English words on a Bulgarian site.                                                                                                                              |
| CI-073   | should   | Trim needless parameters and keep session IDs out of URLs                            | partial | Contact prefill parameters (canonical to /kontakti).                                                                                                                                          |
| CI-075   | should   | Avoid infinite URL spaces                                                            | partial | Catalogue paths 404; other unknown deep paths render noindex.                                                                                                                                 |
| CI-115   | should   | Pause sales by limiting functionality, not by taking pages down                      | partial | Unavailable products stay live with buying off; no store-wide pause switch.                                                                                                                   |
| CI-031   | consider | Support conditional requests with ETag or Last-Modified                              | partial | robots.txt and sitemap send ETag; HTML pages don't.                                                                                                                                           |
| SD-004   | must     | Include every required property and pass the Rich Results Test                       | partial | Empty image lists and the incomplete shipping block are fixed; run the Rich Results Test on a product, a guide and the home page.                                                             |
| SD-008   | must     | Use relevant, crawlable image URLs in markup                                         | partial | Some supplier image lists include icons and badges (200×200 icons, CE.png, an A++ badge).                                                                                                     |
| SD-009   | must     | Keep marked-up information current and original                                      | partial | Descriptions are the supplier's text until the rewrite runs; unpublished products are now Discontinued.                                                                                       |
| PM-007   | must     | Give merchant listing products a name, image and Offer                               | partial | Two priced products have no photo (luksozen-kran-za-lira-kvadrat-inoks, guardian-xl-cheren-mat-694-1300-kopie).                                                                               |
| PM-009   | must     | Make product image URLs crawlable, representative and in a supported format          | partial | 6 of 387 products list icons, badges or banners as photos.                                                                                                                                    |
| PS-001   | should   | Give every page a descriptive, concise `<title>`                                     | partial | Home title is now descriptive; the brand in every title is still the placeholder "Ecommerce Store".                                                                                           |
| PS-004   | should   | Write titles in the page's language and script                                       | partial | The brand placeholder is Latin-script English.                                                                                                                                                |
| PS-006   | should   | Write a unique meta description for each page                                        | partial | Variant products share supplier descriptions; the rewrite adds a meta description per product.                                                                                                |
| PS-007   | should   | Make meta descriptions informative summaries, not keyword lists                      | partial | Categories now use their curated text; products use the opening of the supplier text until the rewrite.                                                                                       |
| PS-008   | should   | Keep "Read more" deep-link targets reachable                                         | partial | Low impact: product descriptions over 900 characters fold behind "Покажи цялото описание" (text stays in the HTML).                                                                           |
| PS-016   | should   | Choose a concise, unique site name and use it consistently                           | fail    | The brand is the placeholder "Ecommerce Store" (messages/*/metadata.json, navigation.json).                                                                                                   |
| PS-027   | should   | Give meaningful images descriptive alt text                                          | partial | Product photos have alt text; decorative pictures beside text links use `alt=""`.                                                                                                             |
| PS-033   | consider | Use short, descriptive image filenames                                               | partial | Supplier photos are named `6.jpg`, `h4.jpg`; the shop's own pictures are descriptive.                                                                                                         |
| PS-057   | should   | Provide large images and allow large previews                                        | partial | `max-image-preview:large` is on with indexing; guide images are 4:3, not 16:9.                                                                                                                |
| INTL-012 | consider | Use one hreflang method                                                              | partial | HTML links and the sitemap (consistent); next-intl's Link header is off.                                                                                                                      |
| INTL-016 | should   | Target countries explicitly on gTLDs and generic ccTLDs                              | fail    | Language-only `bg`/`en` on a .com that serves Bulgaria; moot on a .bg domain.                                                                                                                 |
| INTL-019 | consider | Show local signals on country versions                                               | partial | Euro prices, delivery in Bulgaria; no phone or address yet.                                                                                                                                   |
| INTL-020 | should   | Use one language per page for content and navigation                                 | partial | English pages show Bulgarian category and product names (the catalogue is Bulgarian).                                                                                                         |
| SD-010   | should   | Prefer accurate recommended properties over many                                     | partial | Icons inside some image lists (SD-008).                                                                                                                                                       |
| SD-022   | should   | Use the site name as the organization name                                           | partial | WebSite and OnlineStore share a name, but it is the placeholder.                                                                                                                              |
| SD-023   | should   | Give the organization's url and sameAs profiles                                      | partial | `url` is set; no social profiles exist for `sameAs`.                                                                                                                                          |
| SD-026   | should   | Give the organization's address and contact details                                  | partial | Email only; address and phone wait for the company details.                                                                                                                                   |
| SD-027   | should   | Declare store-wide return, shipping and loyalty policies                             | partial | Return policy on the OnlineStore; no store-wide shipping service until delivery times are set.                                                                                                |
| SD-029   | should   | Mark up each physical location with a LocalBusiness subtype                          | fail    | Blocked: no public address (content/legal.ts placeholders).                                                                                                                                   |
| SD-032   | should   | Mark up the visible breadcrumb trail with BreadcrumbList                             | partial | Products, categories, guides, installation pages done; info pages say "Информация" where the markup names the page; calculators have none.                                                    |
| SD-039   | should   | Give articles a headline and representative images                                   | partial | One 4:3 image per guide; no 16:9 or 1:1 versions.                                                                                                                                             |
| SD-040   | should   | Add datePublished and dateModified with a time zone                                  | partial | Dates are present and shown; date-only, without a time zone.                                                                                                                                  |
| SD-041   | should   | Follow the author markup best practices                                              | partial | Author is the shop (Organization); no named person or visible byline.                                                                                                                         |
| SD-061   | should   | Keep rights metadata when optimizing images                                          | fail    | The shop's pictures carry no EXIF/XMP rights; credits live in docs/image-credits.md.                                                                                                          |
| PM-010   | should   | Provide several high-resolution product images in 16x9, 4x3 and 1x1                  | partial | Supplier photos are mostly 1:1, some 200×200 icons.                                                                                                                                           |
| PM-014   | should   | Set availability to exactly one supported value                                      | partial | In stock, out of stock and Discontinued are right; supplier backorders are not modelled.                                                                                                      |
| PM-020   | should   | Use referenceQuantity for unit pricing                                               | fail    | Goods sold by the metre show no unit price.                                                                                                                                                   |
| PM-021   | should   | Add GTINs and the MPN                                                                | fail    | The catalogue holds no barcodes; supplier model codes exist for 7 of 387 products.                                                                                                            |
| PM-026   | should   | Declare EU energy labels and vehicle CO2 classes with hasCertification               | fail    | No EPREL codes in the catalogue.                                                                                                                                                              |
| PM-038   | should   | Publish a standard shipping policy as ShippingService under Organization             | fail    | Waits for stated delivery times.                                                                                                                                                              |
| PM-047   | should   | Override returns per offer only with the supported subset                            | partial | Each offer repeats the store-wide policy instead of referencing it.                                                                                                                           |
| SD-028   | consider | Add the business identifiers that apply                                              | fail    | Blocked: company name, UIC and VAT number are placeholders.                                                                                                                                   |
| SD-058   | consider | Add image metadata for images you license or credit                                  | fail    | Credits only in docs/image-credits.md.                                                                                                                                                        |
| SD-062   | consider | Label AI-generated images with IPTC Digital Source Type                              | unknown | No AI images; one category photo had a logo retouched by hand.                                                                                                                                |
| SD-067   | consider | Consider the EEA host carousel (beta)                                                | fail    | Category pages carry no ItemList.                                                                                                                                                             |

## Manual

| ID      | Item                                                                             | What to do                                                                                                |
| ------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| CQ-018  | Don't build or exchange links to manipulate rankings                             | Keep launch promotion free of paid links and directories.                                                 |
| CQ-026  | Don't repurpose an expired domain for low-value content                          | Confirm justpurrrfect.com's history and settle the brand domain.                                          |
| CQ-029  | Don't host infringing content                                                    | Confirm the supplier agreement covers its photos and texts.                                               |
| CQ-032  | Label AI-generated product data for Merchant Center                              | After the rewrite, label the descriptions as AI-written in the feed.                                      |
| CQ-034  | Disclose how automation or AI was used                                           | Decide whether to note how product copy is written.                                                       |
| CQ-037  | Track generative AI visibility in Search Console                                 | Monthly after launch.                                                                                     |
| CQ-038  | Use Merchant Center and Business Profile to appear in AI responses               | Set up both, matching the site.                                                                           |
| CQ-044  | Promote the site without overdoing it                                            | After the brand is final.                                                                                 |
| EC-001  | Register the store with Google as soon as it goes live                           | Verify Search Console and submit the sitemap on launch day.                                               |
| EC-002  | Have product pages indexed and purchasable before Merchant Center checks them    | Live Stripe and indexing on before Merchant Center verification.                                          |
| EC-005  | Pick a launch approach and time the registration steps to it                     | Verify Search Console now (works while noindex).                                                          |
| EC-025  | Join Merchant Center to be eligible for the Shopping tab                         | Create the account and submit products.                                                                   |
| EC-028  | Let Merchant Center update price and availability from the site                  | Turn on automatic item updates.                                                                           |
| EC-029  | Pick a Merchant Center feed method                                               | Scheduled feed or Content API (stock changes every 4 hours).                                              |
| EC-030  | Connect a physical store's Business Profile with Merchant Center                 | Only if a showroom opens.                                                                                 |
| EC-032  | Prepare products for Google Images and Google Lens                               | Opt in to product listings in Merchant Center.                                                            |
| OPS-001 | Verify the site in Search Console                                                | Verify the domain property.                                                                               |
| OPS-002 | Send Search Console messages to a monitored inbox                                | Set up forwarding.                                                                                        |
| OPS-003 | Submit the sitemap in Search Console                                             | At launch.                                                                                                |
| OPS-004 | Keep the Manual Actions report clear                                             | After verification, then monthly.                                                                         |
| OPS-005 | Keep the Security Issues report clear                                            | After verification, then monthly.                                                                         |
| OPS-006 | Review Search Console about monthly and after site changes                       | Calendar it.                                                                                              |
| OPS-007 | Fix the errors in the Page indexing report                                       | After launch.                                                                                             |
| OPS-008 | Fix errors in the rich result status reports                                     | Product, review snippet, Breadcrumb reports.                                                              |
| OPS-009 | Search `site:` periodically for pages you didn't create                          | Monthly.                                                                                                  |
| OPS-012 | Keep Search performance data beyond 16 months                                    | Bulk export to BigQuery.                                                                                  |
| OPS-013 | Find query opportunities with a bubble chart                                     | Once data exists.                                                                                         |
| OPS-014 | Plan seasonal content with Google Trends                                         | Heating peaks in autumn, cooling in spring.                                                               |
| OPS-020 | Fix security issues for good before requesting a review                          | No history yet.                                                                                           |
| OPS-023 | Watch logs for open-redirect abuse                                               | Alerts for "=http:" and "=//" in Vercel logs.                                                             |
| OPS-024 | Protect admin access and work machines                                           | Strong passwords or 2FA.                                                                                  |
| OPS-025 | Check Search Console owners for unknown accounts                                 | After verification.                                                                                       |
| OPS-028 | Label third-party services such as payments                                      | Check Stripe Checkout shows the real shop name once registered.                                           |
| OPS-035 | Monitor user content for abuse signals                                           | Alerts and `site:` checks after launch.                                                                   |
| CI-027  | Make sure working pages don't look like errors to Google                         | After launch, URL Inspection live tests on home, category, product, guide.                                |
| CI-028  | Keep 5xx and 429 responses rare and short-lived                                  | Watch Crawl Stats after launch.                                                                           |
| CI-046  | Check that Google picks your canonical                                           | After launch, compare Google's canonical with the declared one in URL Inspection.                         |
| CI-047  | Have syndication partners block indexing of syndicated content                   | Only if the guides are ever syndicated.                                                                   |
| CI-103  | Request recrawls the right way                                                   | Submit the sitemap at launch; request indexing only for a few key URLs.                                   |
| CI-118  | Make removals permanent and cover every URL variant                              | Back any removal request with 404/410, auth or noindex.                                                   |
| PS-017  | Add `alternateName` fallbacks for the site name                                  | After choosing the brand, add `alternateName` to the WebSite node.                                        |
| PS-018  | Achieve good Core Web Vitals                                                     | After launch, read field data in Search Console or PageSpeed Insights for home, category, product, guide. |
| PS-031  | Optimize images for speed without losing quality                                 | Run PageSpeed Insights on production product and category pages.                                          |
| PS-049  | Claim your Business Profile and keep it and Merchant Center current              | Claim a Business Profile (service area) and keep Merchant Center in step.                                 |
| PS-050  | Correct knowledge panel details through official channels                        | After launch and the brand choice, check the brand's knowledge panel.                                     |
| PS-054  | Minimize other dates on the page                                                 | Only if Search shows wrong dates for guides after launch.                                                 |
| PS-055  | Follow Discover's content policies                                               | After launch, check Manual actions in Search Console.                                                     |
| PS-070  | Invite readers to choose the site as a preferred source                          | After launch, look the domain up in the source preferences tool.                                          |
| SD-015  | Check for structured data manual actions                                         | After launch, Search Console › Manual actions.                                                            |
| SD-016  | Monitor rich result reports after releases                                       | Merchant listings and Breadcrumbs reports; URL Inspection on changed templates.                           |
| PM-049  | Pair on-page markup with a Merchant Center feed                                  | Create the Merchant Center account; a feed can be built from the same catalogue.                          |
| PM-050  | Account for Merchant Center and Search Console settings overriding policy markup | Keep the shipping and return settings there equal to /dostavka and /vrashtane.                            |
| PM-064  | Watch the Merchant listings and Product snippets reports                         | After launch and after each release.                                                                      |

## Done

| ID       | Item                                                                    | Evidence                                                                                    |
| -------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| CQ-005   | Keep published content up to date                                       | The privacy policy covers email-and-password accounts.                                      |
| CQ-006   | Don't change dates or churn content just to look fresh                  | updatedAt moves only on real changes.                                                       |
| CQ-012   | Don't create doorway pages or sites                                     | No per-city or keyword generators.                                                          |
| CQ-013   | Don't stuff pages with keywords or numbers                              | None.                                                                                       |
| CQ-014   | Don't hide text or links from visitors                                  | Only screen-reader text and honeypots.                                                      |
| CQ-015   | Don't cloak                                                             | Same content for browsers and Googlebot.                                                    |
| CQ-016   | Don't redirect users deceptively                                        | None.                                                                                       |
| CQ-019   | Don't publish thin affiliate pages                                      | No affiliate links.                                                                         |
| CQ-020   | Don't host third-party content to exploit ranking signals               | None.                                                                                       |
| CQ-021   | Keep user-generated spam off the site                                   | Reviews need a paid order; one per product.                                                 |
| CQ-022   | Keep the site free of hacked content                                    | CSP script-src 'self'.                                                                      |
| CQ-023   | Don't host malware or unwanted software                                 | No downloads.                                                                               |
| CQ-024   | Don't hijack the back button                                            | No history manipulation.                                                                    |
| CQ-025   | Don't promise content or tools the site doesn't deliver                 | Calculators compute results.                                                                |
| CQ-027   | Don't send automated queries to Google Search                           | None.                                                                                       |
| CQ-030   | Don't keep violating policies through new subdomains                    | New site.                                                                                   |
| CQ-031   | Don't run exploitative removal practices                                | None.                                                                                       |
| CQ-039   | Use semantic HTML where practical                                       | Landmarks, dl specs, breadcrumb nav, link pagination.                                       |
| CQ-041   | Put key information in text, not only in images                         | Prices, specs, headings are text.                                                           |
| CQ-042   | Link only to resources you trust                                        | No outbound links.                                                                          |
| CQ-045   | Tag content made for children                                           | Nothing for children.                                                                       |
| CQ-046   | Verify SEO advice against Google's guidance                             | Changes follow the plugin's checklist.                                                      |
| CQ-047   | Vet anyone doing SEO for the site                                       | In-house.                                                                                   |
| CQ-051   | Keep indexable text in the DOM                                          | No canvas or CSS text.                                                                      |
| EC-003   | Stop sales by marking products out of stock                             | Per product; no global switch.                                                              |
| EC-008   | Use the product name as link text                                       | Cards and similar products.                                                                 |
| EC-009   | Link more often to the products and categories that matter most         | Home links all sections and seasonal picks.                                                 |
| EC-010   | Serve each product and category from one URL form                       | lib/routes.ts; legacy forms 308.                                                            |
| EC-012   | Give each product variant its own URL                                   | Colour versions are separate products.                                                      |
| EC-014   | Keep session and tracking values out of linked URLs                     | None.                                                                                       |
| EC-016   | Put descriptive words in product and category URLs                      | Transliterated slugs.                                                                       |
| EC-017   | Noindex or remove empty category pages                                  | A section with no products is noindex.                                                      |
| EC-018   | Give every listing page its own URL                                     | ?page=N.                                                                                    |
| EC-019   | Give each paginated page its own canonical                              | Self-canonical.                                                                             |
| EC-020   | Link each listing page to the next one with `<a href>`                  | Pagination links.                                                                           |
| EC-022   | Keep filtered and re-sorted listings out of the index                   | noindex,follow with the unfiltered canonical.                                               |
| EC-023   | Link paginated pages back to the first page                             | "First page" link.                                                                          |
| EC-026   | Add Product structured data to product pages                            | Product, Offer, return policy, ratings.                                                     |
| EC-027   | Add the other ecommerce structured data types that fit                  | BreadcrumbList, OnlineStore, Review.                                                        |
| EC-034   | Make return, shipping and support details clear                         | Footer links to delivery, returns, warranty, contact.                                       |
| EC-035   | Accept customer ratings and reviews                                     | Verified buyers.                                                                            |
| EC-036   | Publish content for other stages of the shopping journey                | Guides, installation pages, calculators, FAQ.                                               |
| OPS-018  | Don't host malware or unwanted software                                 | No downloads.                                                                               |
| OPS-022  | Check for common vulnerabilities                                        | Bound SQL, escaped output, JSON-LD escaping.                                                |
| OPS-026  | Don't publish phishing or deceptive content                             | None.                                                                                       |
| OPS-027  | Keep ads and embedded third-party content non-deceptive                 | None.                                                                                       |
| OPS-039  | Use the adult rating only on sexually explicit pages                    | Not used.                                                                                   |
| CI-001   | Let Googlebot reach every page you want indexed                         | 200 to Googlebot Smartphone without cookies or login.                                       |
| CI-002   | Serve indexable pages with HTTP 200                                     | All sitemap URLs and internal links answer 200 directly.                                    |
| CI-003   | Publish content in an indexable file type with an accurate Content-Type | text/html, text/plain, application/xml, image types.                                        |
| CI-004   | Keep indexable content within Googlebot's 2MB fetch limit               | HTML 180–330 KB.                                                                            |
| CI-005   | Don't let firewalls or bot protection shut out Googlebot                | No firewall rules or user-agent blocks.                                                     |
| CI-006   | Verify Googlebot before blocking a crawler that claims to be it         | Nothing blocks by user agent.                                                               |
| CI-007   | Don't use robots.txt to keep pages out of search results                | /login and /account are no longer Disallowed; /login says noindex.                          |
| CI-008   | Don't block resources needed to render pages                            | /_next/static and /_next/image allowed at launch.                                           |
| CI-009   | Serve robots.txt with 200 or 404, never 503                             | 200.                                                                                        |
| CI-011   | Disallow crawl traps and action URLs                                    | Search, sort and filter parameters disallowed; /checkout, /api/, /admin too.                |
| CI-013   | Address Google's crawlers with the right user-agent groups              | One `*` group.                                                                              |
| CI-014   | Let Google crawl every URL whose robots rules must be obeyed            | Noindexed templates are crawlable.                                                          |
| CI-015   | Use noindex for pages that must stay out of Search                      | Sign-in, register, password, confirmation, facet and English product pages.                 |
| CI-016   | Never send noindex in the initial HTML of pages you want indexed        | None in the launch configuration.                                                           |
| CI-017   | Use X-Robots-Tag for PDFs, images and other non-HTML files              | No such files to exclude.                                                                   |
| CI-018   | Write robots rules Google can parse                                     | Valid values only.                                                                          |
| CI-019   | Limit snippets and previews only where you mean to                      | Only max-image-preview:large, on purpose.                                                   |
| CI-020   | Give unavailable_after a valid date                                     | Not used.                                                                                   |
| CI-021   | Use noimageindex, notranslate and the like deliberately                 | Not used.                                                                                   |
| CI-022   | Exclude text from snippets with data-nosnippet on span, div or section  | Not used.                                                                                   |
| CI-023   | Keep the head valid                                                     | Only meta, link, script, title.                                                             |
| CI-024   | Declare the character encoding correctly                                | utf-8 first in the head and in the header.                                                  |
| CI-029   | Slow Googlebot down only with temporary 503 or 429                      | No throttling.                                                                              |
| CI-030   | Answer login-protected URLs with 401 or a noindexed login page          | Protected pages redirect to /login, which is noindex and crawlable.                         |
| CI-032   | Use server-side 301 or 308 for permanent URL changes                    | Outdated category paths and legacy /products/{id}, /categories/{slug} → 308 from the proxy. |
| CI-034   | Prefer server-side redirects over meta refresh and JavaScript           | The legacy URLs redirect in the proxy.                                                      |
| CI-035   | Redirect straight to the final URL                                      | No internal redirects; worst host variant two hops.                                         |
| CI-036   | Redirect removed pages only to a relevant replacement                   | No mass redirects.                                                                          |
| CI-038   | Put a self-referencing canonical on every indexable page                | All sitemap URLs.                                                                           |
| CI-039   | Emit exactly one absolute canonical in the head                         | For crawlers, in the head.                                                                  |
| CI-040   | Don't declare different canonicals through different methods            | Sitemap, canonical and final URL agree.                                                     |
| CI-044   | Make the HTTPS URL the unambiguous canonical                            | https://justpurrrfect.com everywhere.                                                       |
| CI-045   | Use the canonical Link header for non-HTML duplicates                   | No such documents.                                                                          |
| CI-048   | Provide a sitemap                                                       | /sitemap.xml from the database, in robots.txt at launch.                                    |
| CI-049   | Keep each sitemap under 50MB and 50,000 URLs                            | 469 URLs.                                                                                   |
| CI-050   | Use UTF-8, escaped values and absolute URLs, hosted at the root         | Valid XML at /sitemap.xml.                                                                  |
| CI-051   | List only the canonical URLs you want in search results                 | Indexable, self-canonical entries only.                                                     |
| CI-052   | Keep lastmod accurate                                                   | products.updatedAt, guide dates.                                                            |
| CI-053   | Tell Google where the sitemap is                                        | robots.txt at launch.                                                                       |
| CI-055   | Reference sitemaps hosted elsewhere from robots.txt                     | Same host.                                                                                  |
| CI-056   | Keep sitemaps current without resubmitting them needlessly              | Cached, expired by each sync.                                                               |
| CI-057   | Declare the right namespace for each sitemap extension                  | xhtml and image namespaces.                                                                 |
| CI-058   | List important images with image sitemap tags                           | Product photos under each product URL.                                                      |
| CI-062   | Keep news sitemaps to articles from the last two days                   | No news sitemap.                                                                            |
| CI-063   | Use real a-href links for navigation                                    | Menus, cards, footer and now pagination are links.                                          |
| CI-065   | Write descriptive anchor text                                           | The account icon link now carries text.                                                     |
| CI-066   | Mark paid links with rel="sponsored" or nofollow                        | No paid links.                                                                              |
| CI-067   | Mark user-inserted links with rel="ugc" or nofollow                     | Review text renders as plain text.                                                          |
| CI-068   | Use nofollow sparingly                                                  | None.                                                                                       |
| CI-069   | Use valid, percent-encoded URLs                                         | Yes.                                                                                        |
| CI-070   | Don't use URL fragments to load different content                       | Path routing.                                                                               |
| CI-071   | Encode URL parameters with = and &                                      | URLSearchParams.                                                                            |
| CI-074   | Use one consistent letter case in URLs                                  | Lowercase.                                                                                  |
| CI-086   | Load lazy content when it enters the viewport                           | Native lazy images.                                                                         |
| CI-087   | Don't lazy-load content that is visible immediately                     | First image eager with high priority.                                                       |
| CI-088   | Back infinite scroll with paginated, persistent URLs                    | ?page=N links.                                                                              |
| CI-089   | Serve a mobile-friendly site                                            | Responsive.                                                                                 |
| CI-090   | Give the mobile version the same content and links as desktop           | Same HTML.                                                                                  |
| CI-091   | Use the same robots rules on mobile                                     | One set.                                                                                    |
| CI-092   | Keep metadata, structured data and image text identical on mobile       | Same HTML.                                                                                  |
| CI-093   | Use stable media URLs                                                   | Same on reloads and devices.                                                                |
| CI-094   | Annotate separate mobile URLs                                           | No separate mobile URLs.                                                                    |
| CI-095   | Map every desktop URL to a mobile URL                                   | No separate mobile URLs.                                                                    |
| CI-096   | Keep mobile ads from crowding out content                               | No ads.                                                                                     |
| CI-097   | Block crawling of facet URLs that don't need to be indexed              | Filter and sort parameters disallowed.                                                      |
| CI-098   | Keep crawlable facet URLs clean and consistent                          | ?a=x&b=y, no duplicates.                                                                    |
| CI-101   | Make pages and resources fast to fetch and render                       | TTFB about 0.2 s on cache hits.                                                             |
| CI-112   | Don't cloak test variants                                               | No experiments.                                                                             |
| CI-113   | Canonicalize variant URLs                                               | No variants.                                                                                |
| CI-114   | End experiments promptly                                                | None.                                                                                       |
| CI-116   | If the site must go offline, use a short 503                            | No maintenance mode; don't use SITE_INDEXING as a pause.                                    |
| CI-117   | Protect private content with authentication                             | Account, orders, admin, mail attachments.                                                   |
| CI-119   | Remove images with robots.txt or X-Robots-Tag, not both                 | robots.txt only, pre-launch.                                                                |
| CI-120   | Redact documents properly before publishing                             | None published.                                                                             |
| PS-002   | Make each page's title distinct                                         | check-site: no duplicate titles; paged listings say "страница 2".                           |
| PS-003   | Make the main title the page's most prominent heading                   | The first h1 is the page subject on every template.                                         |
| PS-005   | Brand titles concisely with the site name                               | Template `%s \| <brand>` (app/[locale]/layout.tsx).                                         |
| PS-009   | Apply snippet controls only on purpose                                  | No nosnippet or max-snippet anywhere.                                                       |
| PS-011   | Make important content available as text                                | Price, specifications and description are HTML text.                                        |
| PS-012   | Let Googlebot crawl the home page and the favicon                       | robots.txt allows /; home 200 in the launch configuration.                                  |
| PS-013   | Declare the favicon on the home page with a supported `rel`             | app/icon.svg, favicon.ico and apple-icon.png; `rel="icon"` in every head.                   |
| PS-014   | Use a square, brand-representative favicon at a stable URL              | The flame-and-snowflake mark, 16–180 px.                                                    |
| PS-015   | Declare the site name with `WebSite` structured data on the home page   | WebSite node on / (app/[locale]/page.tsx).                                                  |
| PS-019   | Serve pages over HTTPS                                                  | HTTPS with HSTS; http and www redirect to the apex.                                         |
| PS-020   | Make content display well on mobile devices                             | 390 px: no overflow, readable sizes, viewport meta.                                         |
| PS-021   | Overlay consent and age gates instead of redirecting                    | No gates (only necessary cookies).                                                          |
| PS-022   | Use small banners instead of intrusive interstitials                    | Only the slim delivery strip.                                                               |
| PS-023   | Keep the main content distinguishable and free of excessive ads         | No ads; CSP `script-src 'self'`.                                                            |
| PS-025   | Embed images with `<img src>`, not CSS                                  | next/image everywhere.                                                                      |
| PS-026   | Use a supported image format                                            | WebP, PNG, JPEG.                                                                            |
| PS-028   | Indicate a representative preferred image                               | Products, guides, home (hero) and categories (section picture) set og:image.                |
| PS-029   | Give responsive images a `src` fallback                                 | next/image renders src with srcset.                                                         |
| PS-030   | Place images near relevant text on relevant pages                       | Product photos beside name, price and specs.                                                |
| PS-032   | Reference each image with one consistent URL                            | Deterministic /_next/image URLs.                                                            |
| PS-034   | Opt out of inline linking only with a 200 or 204                        | No hotlink protection.                                                                      |
| PS-046   | Structure the site so Google can find good sitelinks                    | Home links every section, installation, guides, calculators.                                |
| PS-048   | Specify your logo with `Organization` structured data                   | OnlineStore with logo (apple-icon.png) on /.                                                |
| PS-051   | Use the page's own publish or update date                               | Guides carry their own dates.                                                               |
| PS-052   | Show a visible, labelled date                                           | "Публикувано на 18 ноември 2026 г." on guides.                                              |
| PS-053   | Mark up `datePublished`/`dateModified` matching the visible date        | Article markup on guides.                                                                   |
| PS-056   | Avoid clickbait and sensationalism in previews                          | Guide titles are plain questions.                                                           |
| PS-068   | Keep enriched-search markup complete, relevant and on leaf pages        | No Job, Recipe or Event markup.                                                             |
| PS-069   | Publish only curated, independent "top places" lists                    | None.                                                                                       |
| INTL-001 | Annotate every localized version of a page with hreflang                | HTML hreflang on every bilingual page (lib/seo.ts).                                         |
| INTL-002 | List the page itself and every other version in each set                | Self and other version plus x-default; the middleware Link header is off.                   |
| INTL-003 | Make every hreflang link reciprocal                                     | bg↔en both ways.                                                                            |
| INTL-004 | Use fully-qualified URLs in hreflang                                    | Absolute URLs in HTML and sitemap.                                                          |
| INTL-005 | Start every hreflang value with an ISO 639-1 language code              | bg, en, x-default.                                                                          |
| INTL-006 | Use only assigned ISO 3166-1 Alpha 2 region codes                       | No region subtags.                                                                          |
| INTL-007 | Add an `x-default` fallback                                             | x-default → the Bulgarian URL.                                                              |
| INTL-008 | Provide a language-only version alongside regional variants             | Language-only codes only.                                                                   |
| INTL-009 | Put HTML hreflang links inside a well-formed `<head>`                   | In the head for crawlers (htmlLimitedBots).                                                 |
| INTL-010 | Send a complete hreflang `Link` HTTP header                             | No hreflang header is sent any more (`alternateLinks: false`); HTML and sitemap carry it.   |
| INTL-011 | List every alternate under each sitemap `<url>`                         | Each language version has its own `<url>` with bg, en, x-default (469 URLs).                |
| INTL-013 | Give each language or locale version its own URL                        | /en prefix.                                                                                 |
| INTL-014 | Don't adapt content by IP location                                      | No GeoIP.                                                                                   |
| INTL-015 | Put the locale in a ccTLD, subdomain or subdirectory                    | /en.                                                                                        |
| INTL-017 | Pick a preferred URL for same-language duplicates across regions        | English product and listing pages are noindex and no longer named as alternates.            |
| INTL-018 | Use UTF-8 and escape localized URLs                                     | ASCII slugs, UTF-8.                                                                         |
| INTL-021 | Don't auto-redirect users between language versions                     | No locale detection.                                                                        |
| INTL-022 | Link to the other language and region versions                          | The switch is an `<a href hreflang>` to the same page.                                      |
| INTL-023 | Keep robots rules identical in every locale                             | One robots.txt.                                                                             |
| INTL-024 | Treat Googlebot like any user from the country it appears to come from  | No geo rules.                                                                               |
| INTL-025 | Don't block translated results by accident                              | No notranslate.                                                                             |
| INTL-026 | Decode Google Translate proxy URLs in ad code                           | No ad code.                                                                                 |
| SD-001   | Mark up only content that users can see on the page                     | Marked-up values are visible.                                                               |
| SD-002   | Make the markup a true representation of the page                       | Product, Article, Service, OnlineStore match their pages.                                   |
| SD-003   | Don't use markup to deceive or impersonate                              | Brands are the manufacturers'.                                                              |
| SD-005   | Use JSON-LD                                                             | JSON-LD only; all blocks parse.                                                             |
| SD-006   | Don't block pages that carry structured data                            | Allowed and indexable in the launch configuration.                                          |
| SD-007   | Put the markup on the page it describes                                 | Each template marks up its own entity.                                                      |
| SD-011   | Mark up the page's main entity and connect related items                | OnlineStore on /, Service → provider @id.                                                   |
| SD-012   | Mark up all visible items of a kind                                     | Breadcrumb items equal the visible trail.                                                   |
| SD-013   | Use the most specific type and property names                           | Product, Offer, Article, Service, OnlineStore.                                              |
| SD-014   | Repeat the markup on duplicate URLs                                     | Same JSON-LD on query variants.                                                             |
| SD-020   | Describe the organization on the home or about page                     | OnlineStore on /.                                                                           |
| SD-021   | Use OnlineStore or another specific Organization subtype                | OnlineStore.                                                                                |
| SD-024   | Provide the organization logo                                           | apple-icon.png, 180×180.                                                                    |
| SD-025   | Meet the logo image requirements                                        | Square PNG over 112 px at a stable URL.                                                     |
| SD-033   | Give BreadcrumbList its required properties                             | ≥2 items, positions from 1, absolute URLs.                                                  |
| SD-034   | Base breadcrumbs on typical user paths                                  | Products follow the category tree.                                                          |
| SD-038   | Add Article to article pages                                            | Guides.                                                                                     |
| SD-085   | Add LocalBusiness reviews only if the site reviews other businesses     | None.                                                                                       |
| SD-086   | Use ProfilePage only for pages about one person or organization         | None.                                                                                       |
| SD-089   | Use DiscussionForumPosting only for user-generated posts                | None.                                                                                       |
| SD-093   | Use QAPage only for single questions users can answer                   | None.                                                                                       |
| PM-001   | Add Product markup to every product detail page                         | Every product with a price or ratings.                                                      |
| PM-002   | Put Product markup only on single-product pages                         | Listings carry none.                                                                        |
| PM-003   | Use merchant listing markup only where shoppers buy from you            | Offers only on buyable products.                                                            |
| PM-004   | Use a distinct URL per currency                                         | EUR only.                                                                                   |
| PM-005   | Serve Product markup in the initial HTML                                | Prerendered product pages.                                                                  |
| PM-006   | Don't mark up prohibited or regulated goods                             | Heating and cooling only.                                                                   |
| PM-008   | Give the Offer a price above zero and an ISO 4217 currency              | "3740.00" EUR.                                                                              |
| PM-011   | Give product snippet markup a name plus a review, rating or offer       | Offer and, when reviewed, aggregateRating.                                                  |
| PM-012   | Use AggregateOffer only for offers from several sellers                 | Not used.                                                                                   |
| PM-013   | Keep pros and cons markup for editorial product reviews                 | Not used.                                                                                   |
| PM-015   | Set itemCondition to one supported value                                | NewCondition.                                                                               |
| PM-016   | Don't leave priceValidUntil in the past                                 | Not emitted.                                                                                |
| PM-017   | Point Offer.url at one page where the product can be bought             | Canonical product URL.                                                                      |
| PM-022   | Give each product a single whitespace-free sku                          | The slug.                                                                                   |
| PM-023   | Add the brand and a description                                         | Brand when known; description cut at a word.                                                |
| PM-027   | Add category and Google product category codes                          | `category` = the category trail.                                                            |
| PM-028   | Describe color with supported values                                    | `color` from the "цвят" specification.                                                      |
| PM-041   | Write shipping regions in the supported formats                         | Not emitted until delivery times exist.                                                     |
| PM-042   | Make offer-level OfferShippingDetails complete                          | Not emitted until delivery times exist (no incomplete block).                               |
| PM-043   | Publish a standard return policy under Organization                     | MerchantReturnPolicy on the OnlineStore.                                                    |
| PM-044   | Include the required return policy properties                           | BG, finite window, 14 days.                                                                 |
| PM-045   | Keep returnFees and returnShippingFeesAmount consistent                 | Customer responsibility, no amount.                                                         |
| PM-046   | Add return window, method, fee, refund details                          | Days, method, fees, FullRefund.                                                             |
| PM-055   | Mark up genuine product ratings and reviews                             | aggregateRating and reviews from verified buyers when there are any.                        |
| PM-060   | Don't put self-serving review stars on your own Organization            | None.                                                                                       |
| PM-061   | Don't mark up reviews aggregated from other websites                    | Own reviews only.                                                                           |
| PM-063   | Accept ratings only together with a comment and the author's name       | The form and the action now require a comment; the author is the first name.                |

## Waived

| ID     | Item                                                       | Reason (kept between audits)                                                                         |
| ------ | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| PS-010 | Keep pages indexable and snippet-eligible for AI features  | Production is noindex until the product descriptions are rewritten; the launch configuration passes. |
| CI-010 | Remove development-time crawl and index blocks at launch   | Deliberate until the rewrite; set SITE_INDEXING=on for the launch build.                             |
| CQ-036 | Meet the eligibility conditions for generative AI features | Pre-launch noindex; nothing blocks snippets at launch.                                               |
| EC-004 | If the store is public before it can fulfil orders, say so | Noindex, Stripe test mode, not in Merchant Center.                                                   |

## Not applicable

no search traffic yet: CQ-048–CQ-050, OPS-015–OPS-017 · `explicit`: OPS-038, OPS-041–OPS-044 · no such content:
EC-013, EC-021, EC-031, EC-037, EC-041, OPS-010, OPS-011, OPS-019, OPS-036, OPS-040, OPS-046 · `js-app`: CI-043, CI-076–CI-084 · `large`: CI-012, CI-054, CI-100, CI-102 · `video`: CI-059–CI-061 ·
`paywall`: CI-085 · `site-move`: CI-104–CI-111 · `amp`: CI-121–CI-126 · `explicit`: PS-024, PM-024 · `video`: PS-035–PS-045, SD-051–SD-057, SD-096, SD-097 · `amp`: PS-058–PS-067 ·
`paywall`: PS-071, SD-063–SD-066 · `js-app`: SD-017–SD-019 · no such content yet: SD-030, SD-031, SD-035–SD-037,
SD-042–SD-050, SD-059, SD-060, SD-068–SD-084, SD-087, SD-088, SD-090–SD-092, SD-094, SD-095, PM-018, PM-019,
PM-025, PM-029–PM-037, PM-039, PM-040, PM-048, PM-051–PM-054, PM-056–PM-059, PM-062

## Notes

- Missing catalogue pages answer 404 and outdated category paths 308 from the proxy (lib/route-index.ts): with Cache
  Components a page can only stream a 200 once its shell is sent. Other unknown paths render the not-found page with
  `noindex` (200), which Google accepts.
- The plugin's check-site `has()` treats an empty array as present, so `"image": []` passed its Product check.
