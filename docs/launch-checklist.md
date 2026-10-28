# Launch checklist

Status as of 25 October 2026. ✅ = done and verified · 🟡 = done, needs your confirmation · ⬜ = for Bilal.

## Automated tests

Run before every deploy:

```bash
npm test            # 40 unit + API route tests (Vitest)
npm run test:e2e    # 12 end-to-end tests in Chrome (Playwright), phone + desktop
```

The end-to-end tests build the site with every external service switched off, so they never send emails, call the AI, create Jira issues or write to the database. Note: they overwrite the `.next` build folder, so run `npm run build` again afterwards if you want to `npm start` with your real keys.

| What's covered | Where |
| --- | --- |
| Form schemas (contact, free mockup), admin content schemas | `lib/schemas.test.ts` |
| Price safety check, knowledge block, template fallback, prompt injection | `lib/ai/*.test.ts` |
| Task provider switch, Jira payload, working-day due dates | `lib/tasks/tasks.test.ts` |
| `/api/contact`: valid lead, honeypot, Resend + Jira failure still replies, 400, 429, Turnstile | `app/api/contact/route.test.ts` |
| `/api/chat`: fallback, conversation + currency, blocked invented prices, validation, 429 | `app/api/chat/route.test.ts` |
| Website CMS: defaults valid, editor fields match content, plain error labels, site info, FAQ tokens | `lib/cms/cms.test.ts` |
| CRM: lead/client rules, WhatsApp links, Pakistan dates, currency guess, digest rows | `lib/crm/crm.test.ts` |
| `/api/cron/digest`: off without secret, 401, nothing due, sends, overdue invoices, automatic reminders | `app/api/cron/digest/route.test.ts` |
| Billing: totals, payment splits, invoice states, quote/invoice/payment rules, quote and invoice PDFs | `lib/billing/billing.test.ts` |
| Delivery: billing periods (month ends, leap years), project/care plan/renewal rules, renewal reminder days, deadline rows | `lib/delivery/delivery.test.ts` |
| Reports: leads, conversion, win rate, pipeline per currency, sources, months, quote acceptance, payments, owed, care plan income, chat topics, redaction | `lib/reports/reports.test.ts` |
| Contact form on a phone, field errors, mobile menu, WhatsApp button, chat on a phone | `e2e/mobile.spec.ts` |
| Currency toggle, "Get a quote" pre-select, free mockup with logo, 404, sitemap/robots/llms.txt, chat widget | `e2e/desktop.spec.ts` |

## Plan checklist (section 9)

- ✅ No `href="#"` anywhere; social links come from `config/site.ts` and are hidden when empty
- ⬜ **Prices confirmed** and saved in `/admin/pricing` (the defaults are still the plan's placeholders)
- ✅ Address (Lahore, Pakistan) and WhatsApp filled in; founders use monogram avatars (no photos, by decision)
- 🟡 **Resend:** test lead emails were accepted by Resend. Check both arrived in admin@code-motive.dev (and not in spam), and that `code-motive.dev` shows *Verified* in Resend
- ✅ Jira issue created by a live test lead (KAN-30)
- ⬜ Jira issue from a live `/free-mockup` request (tested only against a stand-in so far)
- ✅ AI reply: Groq works live; Gemini key works; template fallback covered by tests
- ✅ AI chat widget: tested live (prices, follow-up questions, Roman Urdu, automatic Gemini fallback on a Groq rate limit)
- ⬜ Try the chat yourself with tricky questions (discounts, services we don't offer, other languages)
- 🟡 Lighthouse mobile ≥ 90 on `/`, `/pricing`, `/contact`: 93 / 98 / 100 locally. Re-check on pagespeed.web.dev after deploy
- ⬜ Site checked on a real Android phone and iPhone
- ✅ `/privacy` and `/terms` live and linked in the footer
- ✅ Copyright year is generated (`components/footer.tsx`)

## Before deploying (Bilal)

- ⬜ **Turnstile secret key:** Cloudflare rejects the current `TURNSTILE_SECRET_KEY`. Re-copy it from Cloudflare → Turnstile → your widget → Settings. Until fixed, the real forms reject every submission.
- ⬜ **MongoDB password:** change the Atlas user's password (it was printed in a terminal session) and update `MONGODB_URI`.
- ⬜ **Google Analytics:** add `NEXT_PUBLIC_GA_ID` (G-…).
- ⬜ **Clean up test data:** delete the "TEST Bilal" lead in `/admin/leads` and KAN-30 in Jira.
- ⬜ **Billing settings** (`/admin/settings/billing`): add your bank account (IBAN) and Payoneer/Wise details, and check the quote terms. Until then invoices don't say how to pay.
- ⬜ **Renewals and care plans:** add each existing client's domain and hosting renewal dates (`/admin/renewals`) and their care plans (`/admin/care-plans`).
- ⬜ **Create the admin accounts:** `/admin/setup` for the owner account, then add Ahmad under **Admin users**; turn on two-factor sign-in in **My account**.
- ⬜ **Content to confirm** (all in the admin): founders' roles, bios and photos (**Team**), contact details (**Site settings**), payment terms (**Pricing**), the three AI projects as "Demo concept" (**Portfolio**), and which guides to publish (**Guides**). "Our story" on `/about` and the legal wording on `/terms` are still in code.
- ⬜ **Guides:** review the 4 drafts at `/blog/...`, then publish them in the admin under **Guides**.
- ⬜ **Keyword map:** approve `docs/seo/keyword-map.md`.

## Deploying to Vercel (Bilal, when ready)

- ⬜ Import the repo in Vercel (framework: Next.js; npm is detected from `package-lock.json`).
- ⬜ Add every variable from `.env` in Project → Settings → Environment Variables. Either MongoDB connection string format works on Vercel.
- ⬜ MongoDB Atlas → Network Access: allow Vercel (`0.0.0.0/0` or the Vercel integration).
- ⬜ Domains: add `code-motive.dev` and `www.code-motive.dev` (www redirects to the bare domain in code).
- ⬜ Add `CRON_SECRET` (a long random string) so the daily 9:00 follow-up digest runs (`vercel.json`). Vercel → Project → Cron Jobs should list `/api/cron/digest`.
- ⬜ After the first deploy: one real contact form and one `/free-mockup` request from a phone; check emails, Jira and `/admin/leads`.
- ⬜ Search Console + Bing Webmaster Tools: verify, submit `/sitemap.xml`; run `npm run indexnow`; Rich Results Test on a service page. Full list: `docs/seo/offsite.md`.
