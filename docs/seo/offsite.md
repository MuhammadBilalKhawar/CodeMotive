# Off-site SEO checklist (for Bilal)

Things that can't be done in code. Do them once, then keep them up to date. Use exactly the same name, description, address, phone and logo everywhere, because search engines and AI assistants learn who you are from these listings.

**Use everywhere:** CodeMotive · "CodeMotive is a Lahore-based web development firm that builds business websites, Shopify stores, integrations and AI automation for businesses in Pakistan and worldwide." · Lahore, Pakistan · +92 326 5152747 · admin@code-motive.dev · https://code-motive.dev · logo from `brand-kit/03-social-profile-pictures/`.

## After the first deploy

- [ ] **Domain:** in Vercel, add both `code-motive.dev` and `www.code-motive.dev`; the site redirects www to non-www (and Vercel redirects http to https).
- [ ] **Google Search Console:** verify the domain (DNS TXT record), submit `https://code-motive.dev/sitemap.xml`, check "Pages" for indexing problems weekly at first.
- [ ] **Bing Webmaster Tools:** import from Search Console or verify, submit the sitemap. ChatGPT search uses Bing's index, so this matters for AI answers.
- [ ] **IndexNow:** after each deploy with new or changed pages, run `npm run indexnow` (pings Bing, Yandex and others).
- [ ] **Google Analytics 4:** create a property, add `NEXT_PUBLIC_GA_ID`, mark `generate_lead` as a key event (conversion), and link GA4 to Search Console.
- [ ] **Rich results:** test a service page, `/pricing` and a published guide at https://search.google.com/test/rich-results.

## Listings and profiles

- [ ] **Google Business Profile** (Lahore): category "Website designer", services, photos, weekly posts, and ask every client for a review.
- [ ] **LinkedIn company page:** already live; add the website, description and logo above.
- [ ] **Clutch**, **GoodFirms**, **DesignRush**: create agency profiles; ask clients to leave verified reviews.
- [ ] **Upwork agency profile:** once created, add the URL as `UPWORK_URL` so it appears in the footer and structured data.
- [ ] **Shopify Partner directory** (if eligible after a few stores).
- [ ] **GitHub organisation** and **Crunchbase**: same name, description and link.
- [ ] Local Pakistani business directories with the same details.

## Backlinks

- [ ] Ask clients for a small "Website by CodeMotive" link in their footer (with permission).
- [ ] Short case-study posts on LinkedIn linking to `/work`.
- [ ] Answer relevant questions on Reddit and Quora where allowed, linking to a guide only when it genuinely answers the question.
- [ ] Guest posts on Pakistani business, startup or ecommerce blogs.

## Monthly

- [ ] Search Console → Performance: find queries where a page ranks in positions 5 to 20 and improve that page.
- [ ] Publish 2 to 4 new guides (see ideas in `keyword-map.md`).
- [ ] Ask ChatGPT, Gemini, Perplexity and Claude the prompts in `ai-visibility-log.md` and record the results.
