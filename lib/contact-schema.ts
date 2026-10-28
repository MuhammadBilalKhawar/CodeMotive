import { z } from "zod"
import { contactServiceOptions } from "@/data/services"

export const budgetOptions = {
  PKR: ["Under 50k", "50k–150k", "150k–400k", "400k+", "Not sure"],
  USD: ["Under $500", "$500–$1,500", "$1,500–$5,000", "$5,000+", "Not sure"],
} as const

export const phoneField = z
  .string()
  .trim()
  .max(30)
  .regex(/^$|^\+?[0-9 ()-]{7,}$/, "Please include your country code, e.g. +92 300 1234567")

// Shared by the contact form and the /api/contact route.
export const contactSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name").max(100),
  email: z.string().trim().email("Please enter a valid email address"),
  phone: phoneField,
  business: z.string().trim().max(120),
  country: z.string().trim().min(1, "Please choose your country"),
  service: z.enum(contactServiceOptions as [string, ...string[]], { message: "Please choose a service" }),
  budget: z.string().trim().max(40),
  message: z
    .string()
    .trim()
    .min(20, "Please tell us a little more (at least 20 characters)")
    .max(2000, "Please keep your message under 2,000 characters"),
  package: z.string().trim().max(40).optional(),
  // Honeypot: real visitors never see or fill this.
  company_website: z.string().max(0).optional(),
  // Cloudflare Turnstile token (only when Turnstile is configured).
  turnstileToken: z.string().max(2048).optional(),
})

export type ContactInput = z.infer<typeof contactSchema>
