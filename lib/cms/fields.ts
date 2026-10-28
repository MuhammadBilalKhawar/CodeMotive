import type { ContentKey } from "@/lib/content-registry"

// What the admin editor shows for each content type. The editor at
// /admin/website/[key] is built from these lists, so making something new
// editable means adding it to the schema, the defaults and a field here.

export type Field =
  | { type: "text"; key: string; label: string; hint?: string; max?: number; long?: boolean }
  | { type: "number"; key: string; label: string; hint?: string }
  | { type: "toggle"; key: string; label: string; hint?: string }
  // A list of short strings, edited one per line.
  | { type: "lines"; key: string; label: string; hint?: string }
  | { type: "image"; key: string; label: string; hint?: string }
  // Shown but not editable (e.g. slugs fixed in code).
  | { type: "readonly"; key: string; label: string; hint?: string }
  | { type: "group"; key: string; label: string; hint?: string; fields: Field[] }
  | {
      type: "list"
      key: string
      label: string
      hint?: string
      // Field whose value names each item in the list.
      titleKey: string
      itemLabel: string
      fields: Field[]
      // Fixed lists: no adding, removing or reordering.
      fixed?: boolean
      blank?: Record<string, unknown>
    }

export type EditorSpec = {
  title: string
  intro: string
  // "" as the key means the field edits the whole content value.
  field: Field
}

const faqList = (key: string, label: string, hint?: string): Field => ({
  type: "list",
  key,
  label,
  hint,
  titleKey: "question",
  itemLabel: "question",
  fields: [
    { type: "text", key: "question", label: "Question", max: 200 },
    { type: "text", key: "answer", label: "Answer", max: 1200, long: true },
  ],
  blank: { question: "", answer: "" },
})

const metaFields: Field[] = [
  { type: "text", key: "metaTitle", label: "Google title", max: 47, hint: '" | CodeMotive" is added automatically.' },
  { type: "text", key: "metaDescription", label: "Google description", max: 155, long: true },
]

const faqTokens = "You can write {deliveryPromise}, {replyPromise}, {paymentSplit}, {pkrMethods}, {pkrMethodsLower} or {usdMethods} and the current value is filled in."

export const editorSpecs: Record<ContentKey, EditorSpec> = {
  site: {
    title: "Site settings",
    intro: "Contact details, social links and the promises shown across the website, emails and the AI assistant.",
    field: {
      type: "group",
      key: "",
      label: "",
      fields: [
        { type: "text", key: "email", label: "Email address" },
        { type: "text", key: "whatsappNumber", label: "WhatsApp number", hint: "Digits only with the country code, no + or spaces, e.g. 923265152747" },
        {
          type: "group",
          key: "address",
          label: "Address",
          fields: [
            { type: "text", key: "street", label: "Street (optional)", hint: "Leave empty to show only the city." },
            { type: "text", key: "locality", label: "City" },
            { type: "text", key: "country", label: "Country" },
            { type: "text", key: "countryCode", label: "Country code", hint: "Two capital letters, e.g. PK" },
          ],
        },
        {
          type: "group",
          key: "social",
          label: "Social profiles",
          hint: "Full links. Leave a field empty to hide that profile.",
          fields: [
            { type: "text", key: "linkedin", label: "LinkedIn" },
            { type: "text", key: "instagram", label: "Instagram" },
            { type: "text", key: "facebook", label: "Facebook" },
            { type: "text", key: "upwork", label: "Upwork" },
          ],
        },
        { type: "text", key: "tagline", label: "Tagline", max: 80 },
        { type: "text", key: "summary", label: "Company summary", max: 300, long: true, hint: "The one sentence that describes CodeMotive (about page, Google, AI assistant)." },
        { type: "text", key: "replyPromise", label: "Reply promise", max: 120, hint: 'e.g. "We reply within 24 hours."' },
        { type: "text", key: "deliveryPromise", label: "Delivery promise", max: 160, hint: 'e.g. "Most websites go live in 1 to 3 weeks."' },
        { type: "number", key: "mockupDays", label: "Free mockup turnaround (working days)" },
      ],
    },
  },

  home: {
    title: "Homepage",
    intro: "The text in the homepage hero, the “who it's for” cards and the four steps.",
    field: {
      type: "group",
      key: "",
      label: "",
      fields: [
        {
          type: "group",
          key: "hero",
          label: "Hero",
          fields: [
            { type: "text", key: "title", label: "Headline", max: 120 },
            { type: "text", key: "titleAccent", label: "Headline ending (highlighted)", max: 80 },
            { type: "text", key: "subline", label: "Text under the headline", max: 300, long: true },
            { type: "lines", key: "chips", label: "Floating badges (4)", hint: "One per line. The first four are shown." },
            { type: "lines", key: "trust", label: "Trust points (3)", hint: "One per line, shown under the buttons." },
          ],
        },
        {
          type: "list",
          key: "audiences",
          label: "Who it's for (4 cards)",
          titleKey: "title",
          itemLabel: "card",
          fixed: true,
          fields: [
            { type: "text", key: "title", label: "Title", max: 60 },
            { type: "text", key: "text", label: "Text", max: 160, long: true },
            { type: "text", key: "href", label: "Link", hint: "A page on the site, e.g. /industries/restaurants" },
          ],
        },
        {
          type: "list",
          key: "steps",
          label: "How it works (4 steps)",
          titleKey: "title",
          itemLabel: "step",
          fixed: true,
          fields: [
            { type: "text", key: "title", label: "Title", max: 60 },
            { type: "text", key: "text", label: "Text", max: 200, long: true },
          ],
        },
      ],
    },
  },

  services: {
    title: "Services",
    intro: "The text on each service page and card. Prices come from Pricing; the list of services itself is fixed in code.",
    field: {
      type: "list",
      key: "",
      label: "",
      titleKey: "name",
      itemLabel: "service",
      fixed: true,
      fields: [
        { type: "readonly", key: "slug", label: "Page address", hint: "/services/…" },
        { type: "text", key: "name", label: "Name", max: 60 },
        { type: "text", key: "short", label: "Short description (cards)", max: 200, long: true },
        { type: "text", key: "intro", label: "Opening paragraph", max: 400, long: true },
        { type: "text", key: "problem", label: "The problem it solves", max: 400, long: true },
        { type: "lines", key: "included", label: "What's included", hint: "One per line." },
        { type: "text", key: "timeline", label: "Timeline", max: 200 },
        faqList("faqs", "FAQs"),
        ...metaFields,
      ],
    },
  },

  industries: {
    title: "Industry pages",
    intro: "The text on each industry page. Write {price} in the opening paragraph to show the live starting price.",
    field: {
      type: "list",
      key: "",
      label: "",
      titleKey: "name",
      itemLabel: "industry",
      fixed: true,
      fields: [
        { type: "readonly", key: "slug", label: "Page address", hint: "/industries/…" },
        { type: "text", key: "name", label: "Page title", max: 80 },
        { type: "text", key: "short", label: "Short name (cards, footer)", max: 40 },
        { type: "text", key: "intro", label: "Opening paragraph", max: 500, long: true },
        { type: "text", key: "problem", label: "The problem", max: 400, long: true },
        {
          type: "list",
          key: "needs",
          label: "What this business needs",
          titleKey: "title",
          itemLabel: "point",
          fields: [
            { type: "text", key: "title", label: "Title", max: 80 },
            { type: "text", key: "text", label: "Text", max: 300, long: true },
          ],
          blank: { title: "", text: "" },
        },
        faqList("faqs", "FAQs"),
        ...metaFields,
      ],
    },
  },

  team: {
    title: "Team",
    intro: "The founder cards on the homepage and about page. Also used by the AI assistant.",
    field: {
      type: "list",
      key: "",
      label: "",
      titleKey: "name",
      itemLabel: "person",
      fields: [
        { type: "text", key: "name", label: "Name", max: 80 },
        { type: "image", key: "photo", label: "Photo", hint: "Optional. A square photo looks best. Without one, the initials are shown." },
        { type: "text", key: "initials", label: "Initials", max: 3 },
        { type: "text", key: "role", label: "Role", max: 80 },
        { type: "text", key: "experience", label: "Experience", max: 80, hint: 'e.g. "2 years of industry experience"' },
        { type: "text", key: "bio", label: "Bio", max: 400, long: true },
        { type: "lines", key: "handles", label: "Handles for clients", hint: "One per line." },
        { type: "lines", key: "skills", label: "Skills", hint: "One per line." },
        { type: "text", key: "linkedinUrl", label: "LinkedIn profile (optional)" },
      ],
      blank: { name: "", photo: "", initials: "", role: "", experience: "", bio: "", handles: [], skills: [], linkedinUrl: "" },
    },
  },

  testimonials: {
    title: "Testimonials",
    intro: "Real client reviews only, each with a link where it can be checked. The section stays hidden while this list is empty.",
    field: {
      type: "list",
      key: "",
      label: "",
      titleKey: "name",
      itemLabel: "review",
      fields: [
        { type: "text", key: "name", label: "Client name", max: 80 },
        { type: "text", key: "business", label: "Business", max: 80 },
        { type: "text", key: "country", label: "Country", max: 60 },
        { type: "text", key: "quote", label: "Review", max: 600, long: true },
        { type: "text", key: "sourceUrl", label: "Link to the original review", hint: "Upwork, Google, Clutch…" },
      ],
      blank: { name: "", business: "", country: "", quote: "", sourceUrl: "" },
    },
  },

  faq: {
    title: "FAQs",
    intro: "The questions on the homepage and the pricing page. Service and industry FAQs are edited with those pages.",
    field: {
      type: "group",
      key: "",
      label: "",
      fields: [faqList("general", "Homepage FAQs", faqTokens), faqList("pricing", "Pricing page FAQs", faqTokens)],
    },
  },

  seo: {
    title: "Page titles & descriptions",
    intro: "What Google shows for each main page. Service, industry and guide pages are edited with those pages.",
    field: {
      type: "group",
      key: "",
      label: "",
      fields: [
        {
          type: "list",
          key: "pages",
          label: "Pages",
          titleKey: "path",
          itemLabel: "page",
          fixed: true,
          fields: [
            { type: "readonly", key: "path", label: "Page" },
            { type: "text", key: "title", label: "Google title", max: 47, hint: '" | CodeMotive" is added automatically.' },
            { type: "text", key: "description", label: "Google description", max: 155, long: true },
          ],
        },
      ],
    },
  },

  ai: {
    title: "AI assistant",
    intro: "The chat widget and the instant replies after the forms. Prices, services and FAQs reach the AI automatically.",
    field: {
      type: "group",
      key: "",
      label: "",
      fields: [
        { type: "toggle", key: "chatEnabled", label: "Show the “Ask our AI” chat on the website" },
        { type: "text", key: "greeting", label: "Chat greeting", max: 300, long: true },
        { type: "lines", key: "suggestions", label: "Suggested questions", hint: "One per line, up to 4." },
        { type: "lines", key: "extraFacts", label: "Extra facts the AI may use", hint: 'One per line, e.g. "We are closed on Sundays."' },
        { type: "lines", key: "notOffered", label: "Services we don't offer right now", hint: "One per line. The AI says so if asked." },
      ],
    },
  },

  guides: {
    title: "Guides",
    intro: "Publish or hide each guide. Hidden guides stay out of the blog, Google and the sitemap.",
    field: {
      type: "list",
      key: "",
      label: "",
      titleKey: "slug",
      itemLabel: "guide",
      fixed: true,
      fields: [{ type: "toggle", key: "published", label: "Published" }],
    },
  },
}

// Turns a validation path like [0, "metaTitle"] into what the admin sees:
// "Business Websites › Google title".
export function fieldPathLabel(field: Field, value: unknown, path: (string | number)[]): string {
  const parts: string[] = []
  let current: Field | undefined = field
  let data = value
  for (const step of path) {
    if (!current) break
    if (current.type === "list" && typeof step === "number") {
      const item = (Array.isArray(data) ? data[step] : undefined) as Record<string, unknown> | undefined
      const name = String(item?.[current.titleKey] ?? "").trim()
      parts.push(name || `${current.itemLabel} ${step + 1}`)
      data = item
      // Stay on the list; the next step names a field of the item.
      continue
    }
    const children: Field[] = current.type === "group" || current.type === "list" ? current.fields : []
    const child = children.find((f) => f.key === step)
    if (!child) break
    if (child.label) parts.push(child.label)
    data = (data as Record<string, unknown> | undefined)?.[String(step)]
    current = child
  }
  return parts.join(" › ")
}
