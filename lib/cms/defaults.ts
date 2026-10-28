import { siteConfig } from "@/config/site"
import { services } from "@/data/services"
import { industries } from "@/data/industries"
import { founders } from "@/data/founders"
import { testimonials } from "@/data/testimonials"
import { deliveryPromise } from "@/data/faq"
import { posts } from "@/data/blog"
import type {
  AiSettings,
  FaqContent,
  GuidesContent,
  HomeContent,
  IndustryText,
  SeoContent,
  ServiceText,
  SiteContent,
  TeamContent,
  TestimonialsContent,
} from "@/lib/cms/schemas"

// What the website shows until something is saved in the admin. Taken from
// the original code files, so turning on the CMS changes nothing visible.

const socialUrl = (name: string) => siteConfig.social.find((s) => s.name === name)?.url ?? ""

export const defaultSite: SiteContent = {
  email: siteConfig.email,
  whatsappNumber: siteConfig.whatsapp.number,
  address: { ...siteConfig.address },
  social: { linkedin: socialUrl("LinkedIn"), instagram: socialUrl("Instagram"), facebook: "", upwork: socialUrl("Upwork") },
  tagline: siteConfig.tagline,
  summary: siteConfig.summary,
  replyPromise: siteConfig.replyPromise,
  deliveryPromise,
  mockupDays: 3,
}

export const defaultHome: HomeContent = {
  hero: {
    title: "Websites, online stores and automations that",
    titleAccent: "bring you customers.",
    subline:
      "We build fast business websites, Shopify stores and AI-powered tools for businesses in Pakistan and worldwide. Fixed price, clear timeline.",
    chips: ["Fixed quote before we start", deliveryPromise, "WhatsApp, maps and booking built in", "Mobile-first and fast"],
    trust: ["Based in Lahore", "Working with clients locally and internationally", "Reply within 24 hours"],
  },
  audiences: [
    { title: "Restaurants & cafes", text: "Menu, location, WhatsApp orders and table bookings in one place.", href: "/industries/restaurants" },
    { title: "Salons & clinics", text: "Services, prices and online appointment booking.", href: "/industries/salons" },
    { title: "Shops & brands", text: "An online store with COD, card payments and courier delivery.", href: "/industries/retail" },
    { title: "Service businesses", text: "Contractors and trades that need enquiries, quotes and trust.", href: "/industries/home-services" },
  ],
  steps: [
    { title: "Free call", text: "Tell us about your business and what you need. No cost, no obligation." },
    { title: "Fixed quote", text: "You get a written quote with the scope, price and timeline before any work starts." },
    { title: "Build (1 to 4 weeks)", text: "We design and build, with a short update every week so you always know where things stand." },
    { title: "Launch & support", text: "We put your site live, show you how it works and stay available for changes." },
  ],
}

export const defaultServicesText: ServiceText[] = services.map((s) => ({
  slug: s.slug,
  name: s.name,
  short: s.short,
  intro: s.intro,
  problem: s.problem,
  included: s.included,
  timeline: s.timeline,
  faqs: s.faqs,
  metaTitle: s.metaTitle,
  metaDescription: s.metaDescription,
}))

export const defaultIndustriesText: IndustryText[] = industries.map((i) => ({
  slug: i.slug,
  name: i.name,
  short: i.short,
  intro: i.intro,
  problem: i.problem,
  needs: i.needs,
  faqs: i.faqs,
  metaTitle: i.metaTitle,
  metaDescription: i.metaDescription,
}))

export const defaultTeam: TeamContent = founders.map((f) => ({ ...f, linkedinUrl: f.linkedinUrl ?? "", photo: "" }))

export const defaultTestimonials: TestimonialsContent = testimonials

// Tokens: {paymentSplit} {pkrMethods} {usdMethods} {deliveryPromise} {replyPromise}
export const defaultFaqs: FaqContent = {
  general: [
    {
      question: "How long does it take?",
      answer:
        "{deliveryPromise} Shopify stores usually take 2 to 4 weeks, depending on the number of products. Your quote includes the timeline for your project.",
    },
    {
      question: "What do you need from me?",
      answer:
        "Your logo, the text and photos you'd like to use (we can help with these), your contact details and a few websites you like. After the first call we tell you exactly what we need.",
    },
    { question: "Do I own the website?", answer: "Yes. Once the project is paid in full, the website, its content and your domain are yours." },
    {
      question: "Can you work with my existing site or Shopify store?",
      answer:
        "Yes. We can redesign an existing website, improve or extend a Shopify store, or add integrations to it. We review what you have before quoting.",
    },
    {
      question: "How do payments work?",
      answer: "{paymentSplit}. In Pakistan we accept {pkrMethodsLower}; international clients can pay by {usdMethods}.",
    },
    {
      question: "Do you work with clients outside Pakistan?",
      answer:
        "Yes. We work with clients locally and internationally over WhatsApp, email and video calls, and quote international projects in USD.",
    },
  ],
  pricing: [
    {
      question: 'Why "starting from"?',
      answer:
        "Every business needs something slightly different. The starting price covers the package as listed; after a free call we send a fixed quote for your exact project, and that price doesn't change unless the scope does.",
    },
    {
      question: "Is there a monthly fee?",
      answer:
        "Not for the build itself. Care plans for hosting, updates and edits are optional. Third-party costs such as your domain or a Shopify plan are paid directly to those providers.",
    },
    { question: "Who owns the site?", answer: "You do. Once the project is paid in full, the website, its content and your domain are yours." },
    {
      question: "Do you offer installments?",
      answer: "Payment is split into two parts: {paymentSplit}. For larger projects we can agree milestone payments in the quote.",
    },
    {
      question: "What if I need changes later?",
      answer: "Care Plan Plus includes small edits every month. Without a care plan, we quote one-off changes before doing them.",
    },
    {
      question: "Do you charge in USD for international clients?",
      answer: "Yes. International projects are quoted and invoiced in USD, paid by {usdMethods}. Clients in Pakistan pay in PKR.",
    },
  ],
}

export const defaultSeo: SeoContent = {
  pages: [
    {
      path: "/",
      title: "Website & Shopify Development in Lahore",
      description:
        "Website and Shopify store development in Lahore for businesses in Pakistan and worldwide, plus integrations, AI chatbots and care plans. Fixed quote.",
    },
    {
      path: "/services",
      title: "Web Design, Shopify & AI Automation Services",
      description:
        "Business websites, Shopify stores, integrations, AI chatbots and monthly care plans for businesses in Pakistan and worldwide. Fixed quotes.",
    },
    {
      path: "/pricing",
      title: "Website & Shopify Store Pricing",
      description:
        "Starting prices for business websites, Shopify stores and monthly care plans, in PKR and USD. Fixed quote before we start, no hourly billing.",
    },
    {
      path: "/industries",
      title: "Websites by Industry",
      description:
        "Websites and online stores built for restaurants, salons, clinics, clothing brands and home services, with the features each business needs. Fixed quotes.",
    },
    {
      path: "/work",
      title: "Our Work: Websites, Stores & AI Projects",
      description:
        "Client projects and demo concepts by CodeMotive: business websites, online stores, integrations and AI tools. Each one is labelled honestly.",
    },
    {
      path: "/about",
      title: "About Us: Web Developers in Lahore",
      description:
        "Meet the founders of CodeMotive, a Lahore web development firm building websites, Shopify stores and automations for businesses in Pakistan and worldwide.",
    },
    {
      path: "/contact",
      title: "Contact Us: Get a Free Quote",
      description:
        "Tell us about your website, Shopify store or automation project and get a fixed quote. Email, WhatsApp or the form. We reply within 24 hours.",
    },
    {
      path: "/blog",
      title: "Guides for Small Business Websites",
      description:
        "Plain answers about website costs, timelines, Shopify and growing a small business online, from the team at CodeMotive in Lahore.",
    },
  ],
}

export const defaultAi: AiSettings = {
  chatEnabled: true,
  greeting: "Hi! I'm CodeMotive's AI assistant. Ask me about websites, Shopify stores, prices or timelines. You can write in English or Urdu.",
  suggestions: ["How much does a website cost?", "How long does a Shopify store take?", "Can customers pay cash on delivery?", "How do payments work?"],
  extraFacts: [],
  notOffered: ["Native mobile apps for the App Store or Play Store"],
}

export const defaultGuides: GuidesContent = posts.map((p) => ({ slug: p.slug, published: p.published }))
