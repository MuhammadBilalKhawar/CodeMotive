import type { FaqItem } from "@/data/faq"
import type { ProjectTag } from "@/lib/content-schema"

export type Service = {
  slug: string
  name: string
  // Label used in the contact form's "Service needed" select.
  contactLabel: string
  short: string
  // Answer-first opening line for the page (section 8b).
  intro: string
  problem: string
  included: string[]
  timeline: string
  // Packages whose lowest "starting from" price applies to this service.
  packageIds: string[]
  // Matches Project.services to pick the example project.
  projectTag: ProjectTag
  faqs: FaqItem[]
  metaTitle: string
  metaDescription: string
}

export const services: Service[] = [
  {
    slug: "websites",
    name: "Business Websites",
    contactLabel: "Business website",
    short: "Company sites and landing pages for restaurants, salons, clinics and service businesses.",
    intro:
      "CodeMotive builds fast, mobile-first business websites for companies in Pakistan and worldwide. Most websites go live in 1 to 3 weeks.",
    problem:
      "Customers search for you on their phone before they call. Without a clear, fast website they can't find your services, prices or location, so they pick someone else.",
    included: [
      "5 to 10 pages, designed for your business",
      "Mobile-first layout that loads fast",
      "WhatsApp chat button and contact form",
      "Google Maps location and opening hours",
      "Basic SEO so customers can find you on Google",
      "SSL security certificate",
    ],
    timeline: "Most websites go live in 1 to 3 weeks.",
    packageIds: ["starter", "business"],
    projectTag: "Websites",
    faqs: [
      {
        question: "Can I update the website myself?",
        answer:
          "Yes. We can add a blog or simple editing for the content you change often, and show you how to use it at handover. If you'd rather not, a care plan covers small edits each month.",
      },
      {
        question: "I only have an Instagram page. Do I still need a website?",
        answer:
          "A website shows up on Google, can't be taken away by a platform change, and gives customers your prices, location and contact in one place. Your Instagram can link straight to it.",
      },
      {
        question: "Can you redesign my existing website?",
        answer: "Yes. We review what you have, keep what works, and rebuild the rest so it's faster and easier to use.",
      },
    ],
    metaTitle: "Business Website Design in Lahore & Worldwide",
    metaDescription:
      "Fast, mobile-first business websites with WhatsApp, Google Maps and basic SEO. Fixed quote, live in 1 to 3 weeks. Based in Lahore.",
  },
  {
    slug: "shopify",
    name: "Shopify & Ecommerce Stores",
    contactLabel: "Shopify / online store",
    short: "Store setup, themes, product upload, payments, shipping and migration.",
    intro:
      "CodeMotive sets up Shopify stores for shops and brands in Pakistan and worldwide, with local payments and courier delivery or international checkout.",
    problem:
      "Selling through DMs and Daraz means lost orders, manual payment checks and fees on every sale. Your own store takes orders and payments around the clock.",
    included: [
      "Store setup and theme customisation",
      "Product upload with photos, variants and prices",
      "Pakistan: cash on delivery, JazzCash and Easypaisa through supported gateways",
      "Courier integration, e.g. TCS, Leopards, PostEx",
      "International: Shopify Payments, Stripe or PayPal",
      "Migration from Daraz, Instagram or WooCommerce",
      "Essential apps installed and configured",
    ],
    timeline: "Most stores launch in 2 to 4 weeks, depending on the number of products.",
    packageIds: ["shopify"],
    projectTag: "Ecommerce",
    faqs: [
      {
        question: "Do I need to pay for Shopify separately?",
        answer:
          "Yes. Shopify charges a monthly plan fee directly to you, and some apps and themes have their own fees. We help you choose the plan that fits.",
      },
      {
        question: "Can you move my products from Daraz, Instagram or WooCommerce?",
        answer: "Yes. We migrate your products, photos and prices so you don't start from zero.",
      },
      {
        question: "Can customers pay cash on delivery?",
        answer:
          "Yes. We set up cash on delivery and, where your business qualifies, local and international card payments.",
      },
    ],
    metaTitle: "Shopify Store Setup in Pakistan & Worldwide",
    metaDescription:
      "Shopify store setup with COD, local gateways and courier integration in Pakistan, or Shopify Payments and PayPal internationally. Fixed quote.",
  },
  {
    slug: "integrations",
    name: "Integrations",
    contactLabel: "Integration",
    short: "Payments, WhatsApp, booking, CRM, email and Google Business Profile.",
    intro:
      "CodeMotive connects your website to the tools you already use: payments, WhatsApp, booking calendars, CRMs and email, so leads and orders land in the right place.",
    problem:
      "When your website, calendar, inbox and CRM don't talk to each other, you copy details by hand and leads slip through the cracks.",
    included: [
      "WhatsApp Business click-to-chat and API",
      "Booking with Calendly, Cal.com or Google Calendar",
      "Payment gateways",
      "CRM: HubSpot (free plan) or Zoho",
      "Email: Resend or Mailchimp",
      "Google Business Profile setup and link-up",
    ],
    timeline: "Most integrations take a few days to 2 weeks, depending on the tools involved.",
    packageIds: ["integrations"],
    projectTag: "Integrations",
    faqs: [
      {
        question: "Can you add an integration to a website you didn't build?",
        answer: "Usually, yes. We check your current site first and tell you what's possible before quoting.",
      },
      {
        question: "Do I pay for the tools themselves?",
        answer:
          "Yes. Subscriptions for tools like HubSpot, Mailchimp or the WhatsApp Business API are billed by those companies directly. Many have free plans that are enough to start.",
      },
      {
        question: "Why is this a custom quote?",
        answer:
          "Each integration depends on your tools and how you work. After a short call we send a fixed quote for exactly what you need.",
      },
    ],
    metaTitle: "Integrations: WhatsApp, Payments & Booking",
    metaDescription:
      "Connect your website to WhatsApp, payments, booking calendars, HubSpot or Zoho CRM and email. Custom quote after a free call.",
  },
  {
    slug: "ai-automation",
    name: "AI Automation & Chatbots",
    contactLabel: "AI automation / chatbot",
    short: "AI chat assistants, instant lead replies and workflow automation.",
    intro:
      "CodeMotive builds AI chat assistants and automations that reply to enquiries instantly, tag leads and handle repetitive tasks for small businesses.",
    problem:
      "Customers expect an answer in minutes. If enquiries wait until you're free, they go to whoever replied first.",
    included: [
      "AI chat assistant on your website, trained on your business details",
      "Instant AI replies to contact form enquiries",
      "Automatic lead tagging and routing",
      "Workflows with n8n, Make or Zapier",
    ],
    timeline: "Most automations take 1 to 3 weeks, depending on the workflow.",
    packageIds: ["ai-automation"],
    projectTag: "AI",
    faqs: [
      {
        question: "Will the chatbot make things up?",
        answer:
          "We limit it to your own business information and set it to hand over to you when it doesn't know the answer.",
      },
      {
        question: "Are there running costs?",
        answer:
          "AI providers and automation tools charge for usage. For most small businesses this is low, and we tell you the expected cost before you decide.",
      },
      {
        question: "Can it reply in Urdu?",
        answer: "Yes. The assistant can reply in English, Urdu or Roman Urdu, matching the customer's message.",
      },
    ],
    metaTitle: "AI Chatbots & Automation for Small Businesses",
    metaDescription:
      "AI chat assistants, instant replies to enquiries, lead tagging and n8n, Make or Zapier workflows for small businesses. Custom quote.",
  },
  {
    slug: "care-plans",
    name: "Care Plans",
    contactLabel: "Care plan",
    short: "Hosting, backups, updates, uptime checks and small edits every month.",
    intro:
      "CodeMotive care plans keep your website online, secure and up to date for a fixed monthly fee, with small edits included on the Plus plan.",
    problem:
      "A website needs updates, backups and the odd change. Without someone looking after it, small problems turn into downtime at the worst moment.",
    included: [
      "Hosting for the site we built, with SSL",
      "Regular backups",
      "Security and software updates",
      "Uptime monitoring",
      "Small edits each month on the Plus plan",
    ],
    timeline: "Billed monthly, starting the month your website goes live.",
    packageIds: ["care-basic", "care-plus"],
    projectTag: "Websites",
    faqs: [
      {
        question: "Is a care plan required?",
        answer: "No. It's optional. You can host the site yourself and ask us for one-off changes when you need them.",
      },
      {
        question: "What counts as a small edit?",
        answer:
          "Changes like updating text, prices, photos, opening hours or adding a team member. New pages or features are quoted separately.",
      },
      {
        question: "Do care plans cover Shopify stores?",
        answer:
          "Shopify hosts Shopify stores on your Shopify plan. A care plan can still cover updates, edits and app checks for your store.",
      },
    ],
    metaTitle: "Website Care Plans: Hosting & Maintenance",
    metaDescription:
      "Monthly website care plans: hosting with SSL, backups, security updates, uptime checks and small edits. Fixed monthly price.",
  },
]

export const getService = (slug: string) => services.find((s) => s.slug === slug)

export const contactServiceOptions = [...services.map((s) => s.contactLabel), "Not sure"]
