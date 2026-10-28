import type { FaqItem } from "@/data/faq"

// Industry pages (/industries/[slug]). Each one is written for that business
// type; prices come from the live pricing data through `packageId`.
export type Industry = {
  slug: string
  name: string
  // Label for cards and breadcrumbs.
  short: string
  icon: "restaurant" | "salon" | "clinic" | "retail" | "home"
  // Answer-first opening an AI assistant can quote. "{price}" is replaced with
  // the live starting price for `packageId`.
  intro: string
  problem: string
  needs: { title: string; text: string }[]
  // Services that fit, best first (slugs from data/services.ts).
  serviceSlugs: string[]
  packageId: string
  // Projects whose industry contains one of these words are shown as examples.
  projectIndustries: string[]
  faqs: FaqItem[]
  metaTitle: string
  metaDescription: string
}

export const industries: Industry[] = [
  {
    slug: "restaurants",
    name: "Websites for Restaurants & Cafes",
    short: "Restaurants & cafes",
    icon: "restaurant",
    intro:
      "CodeMotive builds restaurant and cafe websites with your menu, location, opening hours and a WhatsApp order button, so hungry customers can find you and order in a few taps. Restaurant websites start from {price}.",
    problem:
      "Customers decide where to eat on their phone in under a minute. If your menu is a blurry photo on Instagram and your hours aren't on Google, they order from the place that made it easy.",
    needs: [
      { title: "A menu that's easy to update", text: "Prices and dishes change. Your menu is real text, not an image, so it loads fast, reads well on phones and is quick to edit." },
      { title: "Order on WhatsApp in one tap", text: "A WhatsApp button opens a chat with your number already filled in. Full online ordering with payment can be added as a custom quote." },
      { title: "Location, hours and directions", text: "Google Maps, opening hours, delivery areas and a call button, so nobody has to ask how to reach you." },
      { title: "Table bookings", text: "Optional booking through Google Calendar or Cal.com, so reservations stop getting lost in DMs." },
      { title: "Photos that load on mobile data", text: "Food photos are compressed and resized automatically, so pages stay fast on 4G." },
      { title: "Linked to your Google Business Profile", text: "Your website and Google listing point to each other, which helps people searching for food nearby." },
    ],
    serviceSlugs: ["websites", "integrations", "care-plans"],
    packageId: "starter",
    projectIndustries: ["restaurant", "food", "cafe"],
    faqs: [
      { question: "Can I update menu prices myself?", answer: "Yes. We can set up simple editing for your menu and show you how to use it at handover. On Care Plan Plus, we make small edits like price changes for you each month." },
      { question: "Can customers order and pay online?", answer: "Every restaurant site includes a WhatsApp order button. Full online ordering with card or wallet payments is available as a custom quote, depending on how you handle delivery." },
      { question: "Will my restaurant show up on Google Maps?", answer: "Maps rankings come from your Google Business Profile and reviews. We link your website and profile together and make sure your name, address and hours match, which supports it." },
    ],
    metaTitle: "Restaurant & Cafe Website Design",
    metaDescription: "Restaurant and cafe websites with your menu, WhatsApp ordering, location, hours and table booking. Fast on mobile. Fixed quote before we start.",
  },
  {
    slug: "salons",
    name: "Websites for Salons & Beauty Studios",
    short: "Salons & beauty",
    icon: "salon",
    intro:
      "CodeMotive builds salon and beauty studio websites with your services, prices, gallery and online appointment booking, so clients can book a slot without calling. Salon websites with booking start from {price}.",
    problem:
      "When bookings only happen by phone or DM, you miss clients while you're busy with a client, and no-shows are hard to track.",
    needs: [
      { title: "Online appointment booking", text: "Clients pick a service and a free slot through Cal.com, Calendly or Google Calendar. The booking tool sends them a confirmation email." },
      { title: "Services and prices in one place", text: "A clear service menu with durations and prices, so clients know what to expect before they book." },
      { title: "A gallery of your work", text: "Before-and-after photos and styles, compressed so they look sharp without slowing the page." },
      { title: "WhatsApp for quick questions", text: "A one-tap WhatsApp button for clients who'd rather message first." },
      { title: "Your team and location", text: "Stylist profiles, opening hours, a map and parking notes." },
      { title: "Linked to Instagram", text: "Your website links to your Instagram, and your Instagram bio links back to bookings." },
    ],
    serviceSlugs: ["websites", "integrations", "ai-automation"],
    packageId: "business",
    projectIndustries: ["salon", "beauty", "spa"],
    faqs: [
      { question: "Do clients get booking reminders?", answer: "Booking tools like Cal.com and Calendly send confirmation and reminder emails. WhatsApp reminders can be set up as a custom integration." },
      { question: "Can clients pay a deposit when they book?", answer: "Some booking tools can take payment at booking. Whether it works depends on the tool and your payment provider, so we confirm it in your quote." },
      { question: "I already get bookings on Instagram. Why add a website?", answer: "A website shows up on Google, lets clients book 24/7 without waiting for a reply, and keeps your prices and services in one place. Your Instagram can point straight to it." },
    ],
    metaTitle: "Salon & Beauty Website with Online Booking",
    metaDescription: "Salon and beauty websites with online appointment booking, service menu, prices, gallery and WhatsApp. Fixed quote, live in weeks, not months.",
  },
  {
    slug: "clinics",
    name: "Websites for Clinics & Doctors",
    short: "Clinics & doctors",
    icon: "clinic",
    intro:
      "CodeMotive builds clinic websites that show your doctors, specialties, timings and location, with online appointment requests and a direct WhatsApp line. Clinic websites start from {price}.",
    problem:
      "Patients want to know who the doctor is, when they're available and how to get an appointment. If they can't find that quickly, they call the next clinic.",
    needs: [
      { title: "Doctors and specialties", text: "Profiles with qualifications and specialties, written from the details you provide." },
      { title: "Timings and appointments", text: "Clear clinic hours per doctor, plus online appointment booking or a request form." },
      { title: "Location you can't miss", text: "Google Maps, directions, parking notes and a click-to-call button." },
      { title: "WhatsApp for quick questions", text: "Patients can message the front desk directly instead of waiting on hold." },
      { title: "Careful with patient data", text: "Forms collect only contact details and preferred times. We don't store medical records on the website." },
      { title: "Fast, readable, mobile-first", text: "Large text and simple navigation, because many patients will visit on their phone." },
    ],
    serviceSlugs: ["websites", "integrations", "care-plans"],
    packageId: "business",
    projectIndustries: ["clinic", "health", "pharmacy", "medical"],
    faqs: [
      { question: "Can patients book appointments online?", answer: "Yes, through a booking tool connected to your doctors' timings, or a simple request form your front desk confirms. We set up whichever fits how your clinic works." },
      { question: "Is patient information safe?", answer: "The website only collects contact details and appointment preferences. It doesn't store medical records. Linking to a clinic management system is possible as a custom quote." },
      { question: "Who writes the medical content?", answer: "You or your doctors provide the medical information, and we structure and present it clearly. We don't write medical claims ourselves." },
    ],
    metaTitle: "Clinic & Doctor Website Design",
    metaDescription: "Clinic websites with doctor profiles, timings, online appointments, maps and WhatsApp. Mobile-first and careful with patient data. Fixed quote.",
  },
  {
    slug: "retail",
    name: "Online Stores for Clothing Brands & Shops",
    short: "Clothing & retail",
    icon: "retail",
    intro:
      "CodeMotive builds online stores for clothing brands and shops, with your products, sizes, cash on delivery, local payments and courier delivery, so customers can order day or night. Online stores start from {price}.",
    problem:
      "Selling through Instagram DMs and Daraz means answering the same size and price questions all day, checking payments by hand, and paying commission on every sale.",
    needs: [
      { title: "Products, sizes and colours", text: "A catalogue with variants, stock and clear photos, so customers can order without asking first." },
      { title: "Cash on delivery and local payments", text: "COD, plus JazzCash and Easypaisa through supported gateways. International: Shopify Payments, Stripe or PayPal." },
      { title: "Courier integration", text: "Shipping set up with couriers such as TCS, Leopards or PostEx, depending on where you deliver." },
      { title: "Move from Instagram or Daraz", text: "We migrate your existing products, photos and prices, so you don't start from zero." },
      { title: "WhatsApp support", text: "A WhatsApp button for size questions and order updates." },
      { title: "Fast on phones", text: "Most fashion shoppers browse on mobile, so every page is built mobile-first." },
    ],
    serviceSlugs: ["shopify", "integrations", "care-plans"],
    packageId: "shopify",
    projectIndustries: ["fashion", "retail", "clothing"],
    faqs: [
      { question: "Shopify or a custom-built store?", answer: "Most shops start on Shopify: it's quick to launch and easy to run. We also build custom stores, like Umar Collections, when you need features Shopify doesn't offer. We'll recommend one in your quote." },
      { question: "Can you move my products from Instagram or Daraz?", answer: "Yes. We migrate your products, photos and prices as part of setting up the store." },
      { question: "Do I pay Shopify separately?", answer: "Yes. Shopify charges you a monthly plan fee directly, and some apps and themes have their own fees. These aren't part of our price." },
    ],
    metaTitle: "Online Store for Clothing Brands & Shops",
    metaDescription: "Online stores for clothing brands and shops: products, sizes, cash on delivery, JazzCash, Easypaisa and courier delivery. Shopify or custom-built.",
  },
  {
    slug: "home-services",
    name: "Websites for Home Services & Contractors",
    short: "Home services",
    icon: "home",
    intro:
      "CodeMotive builds websites for plumbers, electricians, AC technicians, cleaners and builders, with your services, areas covered, quote requests and one-tap calling, so people who need help today can reach you. Websites start from {price}.",
    problem:
      "People looking for a plumber or AC repair want someone they can trust, fast. Without a website showing your services, areas and past work, they call whoever looks most professional on Google.",
    needs: [
      { title: "Services and areas covered", text: "Each service and the areas you work in, so customers know straight away if you can help." },
      { title: "Quote requests", text: "A short form that asks the right questions for your trade, so you can price the job before you visit." },
      { title: "Call and WhatsApp in one tap", text: "Big call and WhatsApp buttons, because urgent jobs don't wait for an email." },
      { title: "Photos of past work", text: "A gallery of finished jobs builds trust before the first call." },
      { title: "Instant replies after hours", text: "Optional AI replies answer enquiries straight away, even when you're on a job." },
      { title: "Linked to Google Business Profile", text: "Your website and Google listing support each other in local searches." },
    ],
    serviceSlugs: ["websites", "ai-automation", "care-plans"],
    packageId: "starter",
    projectIndustries: ["home", "construction", "repair", "cleaning"],
    faqs: [
      { question: "Can customers send photos of the problem?", answer: "Yes, a quote form can include photo uploads so you see the job before you go. It's included in your quote if you need it." },
      { question: "Can enquiries be answered when I'm on a job?", answer: "Yes. Our AI automation service can send an instant, accurate reply to every enquiry and flag urgent ones for you." },
      { question: "Can you show the areas I cover?", answer: "Yes. We list your service areas clearly, and can add a map or a list of neighbourhoods." },
    ],
    metaTitle: "Websites for Home Services & Contractors",
    metaDescription: "Websites for plumbers, electricians, AC repair, cleaners and builders: services, areas, quote requests, call and WhatsApp buttons. Fixed quote.",
  },
]

export const getIndustry = (slug: string) => industries.find((i) => i.slug === slug)
