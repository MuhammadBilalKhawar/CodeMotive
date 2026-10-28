export type Founder = {
  name: string
  initials: string
  role: string
  experience: string
  skills: string[]
  bio: string
  handles: string[]
  // Optional: only rendered when set.
  linkedinUrl?: string
}

// TODO(Bilal): confirm roles and the "handles" split between the two founders.
export const founders: Founder[] = [
  {
    name: "Muhammad Ahmad",
    initials: "MA",
    role: "Co-founder · Full-stack Developer",
    experience: "1 year of industry experience",
    skills: ["MERN stack", "Next.js", "React", "Git", "Deployment"],
    bio: "Builds web and software products with the MERN stack and Next.js. Focuses on clean, responsive interfaces and reliable deployments, so every site works well on any device.",
    handles: ["Front-end builds and responsive layouts", "Deployment and hosting setup", "Updates and changes after launch"],
  },
  {
    name: "Muhammad Bilal",
    initials: "MB",
    role: "Co-founder · Lead Developer",
    experience: "2 years of industry experience",
    skills: ["Shopify apps & stores", "MERN stack", "Next.js", "React", "Git", "Deployment"],
    bio: "Has shipped production Shopify apps, Shopify stores and MERN applications, taking each from first idea to live release. Leads planning so every project has a clear scope, a fixed quote and a clean handover.",
    handles: ["Project scoping and quotes", "Shopify stores and apps", "Back end, integrations and launch"],
  },
]
