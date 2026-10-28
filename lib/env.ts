import { z } from "zod"

// Server-side environment. Every integration is optional: when its keys are
// missing the feature switches off (with a log line) instead of crashing.
const optional = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : undefined))

const envSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().default("https://code-motive.dev"),
  MONGODB_URI: optional,
  MONGODB_DB: optional,
  ADMIN_PASSWORD: optional,

  GROQ_API_KEY: optional,
  GROQ_MODEL: z.string().default("qwen/qwen3.8-27b"),
  // Only for local testing against a mock server.
  GROQ_BASE_URL: z.string().url().default("https://api.groq.com/openai/v1"),
  GEMINI_API_KEY: optional,
  GEMINI_MODEL: z.string().default("gemini-3.5-flash-lite"),

  RESEND_API_KEY: optional,
  RESEND_FROM: z.string().default("CodeMotive Website <admin@code-motive.dev>"),
  RESEND_VISITOR_FROM: z.string().default("Bilal at CodeMotive <admin@code-motive.dev>"),
  CONTACT_TO_EMAIL: z.string().email().default("admin@code-motive.dev"),

  NEXT_PUBLIC_TURNSTILE_SITE_KEY: optional,
  TURNSTILE_SECRET_KEY: optional,

  TASK_PROVIDER: z.enum(["jira", "none"]).default("none").catch("none"),
  JIRA_BASE_URL: optional,
  JIRA_EMAIL: optional,
  JIRA_API_TOKEN: optional,
  JIRA_PROJECT_KEY: z.string().default("LEAD"),
  JIRA_ISSUE_TYPE: z.string().default("Task"),

  // Vercel Cron sends it as "Authorization: Bearer …" (daily follow-up digest).
  CRON_SECRET: optional,
})

export type Env = z.infer<typeof envSchema>

export function getEnv(): Env {
  const parsed = envSchema.safeParse(process.env)
  if (parsed.success) return parsed.data
  // A malformed value (e.g. a bad URL) shouldn't take the site down: log it
  // and fall back to defaults for the rest.
  console.error("[env] Invalid environment values:", parsed.error.issues.map((i) => i.path.join(".")).join(", "))
  return envSchema.parse({})
}

export function features(env = getEnv()) {
  return {
    database: Boolean(env.MONGODB_URI),
    admin: Boolean(env.ADMIN_PASSWORD),
    groq: Boolean(env.GROQ_API_KEY),
    gemini: Boolean(env.GEMINI_API_KEY),
    email: Boolean(env.RESEND_API_KEY),
    turnstile: Boolean(env.TURNSTILE_SECRET_KEY && env.NEXT_PUBLIC_TURNSTILE_SITE_KEY),
    jira: env.TASK_PROVIDER === "jira" && Boolean(env.JIRA_BASE_URL && env.JIRA_EMAIL && env.JIRA_API_TOKEN),
    digest: Boolean(env.CRON_SECRET && env.RESEND_API_KEY),
  }
}

export function logFeatureStatus() {
  const f = features()
  const off: string[] = []
  if (!f.database) off.push("Database (MONGODB_URI): default content, admin can't save, leads not stored")
  if (!f.admin) off.push("Admin login (ADMIN_PASSWORD)")
  if (!f.groq && !f.gemini) off.push("AI replies (GROQ_API_KEY / GEMINI_API_KEY): template reply used")
  else if (!f.groq || !f.gemini) off.push(`AI fallback: only ${f.groq ? "Groq" : "Gemini"} configured`)
  if (!f.email) off.push("Email (RESEND_API_KEY): no lead or confirmation emails")
  if (!f.turnstile) off.push("Turnstile spam check (NEXT_PUBLIC_TURNSTILE_SITE_KEY + TURNSTILE_SECRET_KEY)")
  if (!f.jira) off.push("Jira tasks (TASK_PROVIDER=jira + JIRA_* keys)")
  if (!f.digest) off.push("Daily follow-up digest email (CRON_SECRET + RESEND_API_KEY)")
  if (off.length) console.info(`[env] Optional features off:\n  - ${off.join("\n  - ")}`)
}
