# code-motive.dev

Website for CodeMotive (Software & Digital Solutions), Lahore. Next.js 16 (App Router), TypeScript, Tailwind CSS 4, GSAP, MongoDB.

## Run it locally

```bash
npm install
cp .env.example .env.local   # then fill in what you have
npm run dev                  # http://localhost:3000
npm test                     # unit + API route tests (Vitest)
npm run test:e2e             # end-to-end tests in Chrome (Playwright); all external services off
```

Before launch, work through `docs/launch-checklist.md`. `docs/audit-coverage.md` maps every issue from the site review to the fix.

Every integration is optional. Missing keys switch a feature off instead of breaking the site, and the server logs which ones are off when it starts. The admin dashboard (`/admin`) shows the same list.

| Without… | What happens |
| --- | --- |
| `MONGODB_URI` | Site shows the default prices and projects from `data/`; the admin can't save; leads aren't stored |
| `ADMIN_PASSWORD` | `/admin/login` says login isn't set up |
| `GROQ_API_KEY` and `GEMINI_API_KEY` | Visitors get a fixed thank-you reply instead of an AI answer |
| `RESEND_API_KEY` | No emails (leads are still saved in the database and shown in the admin) |
| Turnstile keys | No human check on the forms (rate limit still applies) |
| Jira keys | No Jira issues |

## Where content lives

Everything below is edited in the admin and goes live as soon as it's saved. Each save keeps the previous version (last 30), and the first save keeps the original text, so any change can be undone from **Version history**.

- **Prices, packages and payment terms:** `/admin/pricing`
- **Portfolio projects:** `/admin/portfolio`
- **Website text** (`/admin/website/...`): site settings (email, WhatsApp, address, social links, promises, mockup turnaround), homepage, services, industries, team (with photos), testimonials, FAQs, guides (publish or hide), page titles for Google, and the AI assistant (on/off, greeting, extra facts)

The code only holds the defaults used until the first save: `lib/cms/defaults.ts` (built from `data/` and `config/site.ts`), `data/pricing.ts` and `data/projects.ts`. Service, industry and guide pages themselves (their addresses, icons and guide articles) are still added in code.

To make something new editable: add it to the schema in `lib/cms/schemas.ts`, a default in `lib/cms/defaults.ts`, and a field in `lib/cms/fields.ts`; the admin form is built from that list.

## Setup checklist

### 1. MongoDB Atlas (prices, projects, leads)

1. Create a free cluster, a database user, and copy the connection string into `MONGODB_URI`.
2. Network Access: allow your hosting provider (on Vercel: `0.0.0.0/0`, or use the Vercel integration).
3. Optional: `MONGODB_DB` (default `codemotive`).

If your local network's DNS breaks `mongodb+srv://` lookups (error *"Server record does not share hostname with parent URI"*), use the standard `mongodb://host1,host2,host3/?tls=true&replicaSet=…&authSource=admin` string from Atlas → Connect → Drivers instead, or switch your computer's DNS to 1.1.1.1 / 8.8.8.8.

### 2. Admin

Set `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` (a long random string). Open `/admin/setup`, enter `ADMIN_PASSWORD` once to create the first owner account, then sign in at `/admin/login` with your own email and password. Add other people under **Admin users**. `ADMIN_PASSWORD` is only used for that first setup.

### 3. Instant AI reply

- Groq: create a key at console.groq.com → `GROQ_API_KEY` (model `GROQ_MODEL`, default `qwen/qwen3.8-27b`; the free tier allows roughly 2–3 replies a minute, after which Gemini answers).
- Gemini (fallback): create a key at aistudio.google.com → `GEMINI_API_KEY` (model `GEMINI_MODEL`, default `gemini-3.5-flash-lite`).

The reply is built only from the site's own data (prices, services, projects, FAQ). Any reply that mentions a price not on the pricing page, or a percentage that isn't in the company facts (e.g. a discount), is thrown away and the template is used instead. Free tiers and model names change; check both providers' docs if replies fall back to the template.

### 4. Email (Resend)

1. Create a free Resend account (about 3,000 emails/month, 100/day; check resend.com/pricing).
2. Add the domain `code-motive.dev` and add the DNS records Resend shows (SPF, DKIM, optionally DMARC). Wait until it says *Verified*.
3. In the domain settings, keep **open and click tracking off** (no tracking pixels in our emails).
4. Create an API key → `RESEND_API_KEY`.

Emails: lead details to `CONTACT_TO_EMAIL` (Reply goes straight to the visitor), and a confirmation copy of the AI reply to the visitor (Reply goes to `CONTACT_TO_EMAIL`).

### 5. Cloudflare Turnstile (spam check, free)

Cloudflare dashboard → Turnstile → add a widget for `code-motive.dev` (and `localhost` for testing) → `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY`.

### 6. Jira (one issue per lead)

1. Create a project **CodeMotive Leads** (key `LEAD`) so leads don't mix with client work. Kanban columns: *New lead · Contacted · Proposal sent · Won · Lost*.
2. Create an API token at id.atlassian.com → Security → API tokens, ideally under a dedicated bot account.
3. Set `TASK_PROVIDER=jira`, `JIRA_BASE_URL` (`https://<site>.atlassian.net`), `JIRA_EMAIL`, `JIRA_API_TOKEN`, `JIRA_PROJECT_KEY`, `JIRA_ISSUE_TYPE` (e.g. `Task`).

Contact leads get labels `lead` + the service and are due tomorrow. Mockup requests get the label `mockup`, the prefix *Mockup:*, a due date (the mockup turnaround from Site settings, in working days), and a checklist (review site, design, send, follow up). When a lead is won, create its build tasks in the normal dev project.

### 7. Daily follow-up digest (Vercel Cron)

`vercel.json` calls `/api/cron/digest` every day at 04:00 UTC (9:00 in Pakistan). Each run it first creates the invoices for care plans that are due (as drafts, or emailed, per plan), then reminds clients about late invoices if automatic reminders are on (3 and 10 days after the due date). Then it emails `CONTACT_TO_EMAIL` the leads due for a follow-up, new leads nobody has answered for 24 hours, project deadlines in the next 3 days, overdue invoices, the care plan invoices it created, and renewals coming up (30, 14, 7, 3 and 1 days before, then daily once overdue). On days with nothing to report, no email is sent. Running it twice on the same day never bills a care plan period twice. Set `CRON_SECRET` to a long random string in Vercel (Vercel sends it with each cron call; anyone without it gets 401). Needs Resend.

## Sales pipeline (CRM)

`/admin/leads` is a board with the stages *New → Contacted → Quote sent → Won / Lost*: drag a card to move it, or use its "Move to" menu on a phone. Each lead has a deal value, source, owner, next follow-up date, tags and a timeline. Logging a call, WhatsApp, email or meeting on a new lead moves it to Contacted. Leads from WhatsApp, Instagram or referrals are added with **Add lead**.

**Won: make client** on a lead creates a client from its details (or links it to the existing client with the same email). Clients (`/admin/clients`) hold the billing currency and address used by quotes and invoices. Only owners can delete a client; their leads are kept.

## Quotes and invoices

- **Quotes** (`/admin/quotes`, owners and members): pick a package from your live pricing, add add-ons or custom lines, a discount and the payment split (50/50 by default). **Email to client** sends the PDF and a private link (`/quote/…`) where the client can accept by typing their name, or decline. Sending moves the lead to *Quote sent*; accepting makes the lead a client and emails you. If the client answers on WhatsApp, use **Mark accepted / declined**. Numbers run per year: `Q-2026-001`.
- **Invoices** (`/admin/invoices`, owners only): on an accepted quote, **Create invoice** for each payment (deposit, balance). Invoices can also be created by hand. Clients get a PDF and a link (`/invoice/…`) with your payment details. There is no card payment: record each bank transfer, JazzCash, Payoneer or Wise payment yourself; the invoice shows *Part paid*, *Paid* or *Overdue* on its own. Sent invoices can be voided, drafts deleted.
- **Billing settings** (`/admin/settings/billing`, owners): bank and Payoneer/Wise details, default payment split, quote validity, payment terms, invoice due days, automatic reminders.
- PDFs are made with `@react-pdf/renderer` (`lib/billing/pdf.tsx`); amounts are whole rupees or dollars, with no tax lines.

## Dashboard and reports

- **Dashboard** (`/admin`): the day's to-do list (follow-ups, deadlines in the next 3 days, renewals in the next 2 weeks, overdue invoices), new leads and pipeline for the last 30 days, and for owners the money received, owed, overdue and monthly care plan income. Setup status is folded away at the bottom.
- **Reports** (`/admin/reports`): one period filter (30 days, 90 days, 12 months) for everything on the page: new leads per month, where leads come from and how many were won, the current stage of the period's leads, quote acceptance, payments received per month (rupees and dollars on separate charts, never added together), and what visitors ask the chat. Money is owners-only.
- **Chat insights:** each chat question is saved without the conversation, name or IP, with emails and phone numbers removed, and deleted automatically after 90 days (a MongoDB TTL index; stated in the privacy policy). Questions the AI couldn't answer are listed so you can add the missing facts under **AI assistant**.
- Charts (`components/admin/reports/charts.tsx`) are plain SVG/HTML: one brand green, tooltips on hover and keyboard focus, and a table view under each. The report maths is in `lib/reports/compute.ts`.

## Projects, care plans and renewals

- **Projects** (`/admin/projects`): **Start project** on an accepted quote, or add one by hand. Each has a stage (*Planning → Design → Build → Client review → Launched*, or *On hold*), a deadline, an owner, links (live, staging, Jira, code, design), a checklist that starts from a template for websites, Shopify stores or other work, notes and a timeline. Owners also see **Costs** (domain, apps, freelancers) against the money received on the quote's invoices. **Handover pack** is a printable page for the client: what was built, their links, what renews and when, the care plan and how to reach you. Never put passwords in it.
- **Care plans** (`/admin/care-plans`, owners): monthly or yearly plans per client, started from a care plan package in Pricing. On the plan's date the daily job creates the invoice and moves the date on; **Invoice the next period now** does it by hand. The page shows monthly recurring income.
- **Renewals** (`/admin/renewals`): domains, hosting, SSL, email and app subscriptions, with who pays and whether they auto-renew. **Renewed** moves the date on a year.

## Forms

- `/contact` (and the homepage form) → `POST /api/contact`
- `/free-mockup` (short link `/mockup?ref=batch-3`) → `POST /api/free-mockup`. Not in the nav or search results; send the link in outreach emails. The `ref` shows which batch a request came from.

Both: zod validation, honeypot field, Turnstile, 3 submissions per IP per 10 minutes, then the AI reply is returned straight away. Saving the lead, the Jira issue and both emails run after the response, so a failure there never affects the visitor.

## AI chat widget

Every public page has an "Ask our AI" button (`components/chat/`). It answers from the same company facts as the form replies (services, live prices, timelines, payment terms, projects, FAQ), in the visitor's language, through `POST /api/chat`:

- Groq first, Gemini as fallback, then a fixed "Bilal can help you directly" message.
- Every answer passes the price safety check: amounts must be published starting prices and percentages must appear in the facts (blocks invented prices and discounts). It checks the amounts, not which package they belong to.
- 20 messages per IP per 10 minutes; messages up to 600 characters; the last 12 turns are sent to the model.
- Conversations aren't stored on the server (the visitor's tab keeps them until it's closed).
- The panel's code loads only when someone opens the chat, so it doesn't slow pages down.
- Groq's free tier allows roughly 2 to 3 answers a minute; busier moments fall back to Gemini automatically. Upgrade the Groq plan if chat gets popular.
- Events: `chat_open` and `chat_message` (first message) in Vercel Analytics and GA4.

## SEO and analytics

- **Sitemap and robots** are generated (`app/sitemap.ts`, `app/robots.ts`). New services, industries and published guides appear automatically. `/free-mockup` and `/admin` are excluded.
- **`/llms.txt`** summarises the company, services and live starting prices for AI assistants. It refreshes when prices or projects are saved in the admin.
- **Guides** live in `data/blog/`. They start as drafts (reachable by URL, `noindex`, not listed). Review, then set `published: true` and redeploy. Prices and timelines inside guides come from the live pricing data.
- **Industry pages** live in `data/industries.ts`.
- **Google Analytics 4:** set `NEXT_PUBLIC_GA_ID`. Visitors see a cookie banner; analytics cookies are only used after "Accept" (Consent Mode v2). Form submissions send a `generate_lead` event; mark it as a key event in GA4.
- **IndexNow:** after deploying changed pages, run `npm run indexnow` (key file: `public/db4a622595f709242231bdb47ee9e629.txt`).
- Keyword map, off-site checklist and AI-visibility log: `docs/seo/`.
