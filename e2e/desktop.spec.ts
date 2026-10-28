import { expect, test } from "@playwright/test"
import { defaultPackages, formatPrice } from "../data/pricing"

const starter = defaultPackages.find((p) => p.id === "starter")!

test("homepage loads without errors", async ({ page }) => {
  const errors: string[] = []
  page.on("pageerror", (e) => errors.push(String(e)))
  await page.goto("/")
  await expect(page.getByRole("heading", { level: 1 })).toContainText("bring you customers")
  await expect(page.getByRole("link", { name: "Get a free quote" }).first()).toBeVisible()
  expect(errors).toEqual([])
})

test("currency toggle switches every price between PKR and USD", async ({ page }) => {
  await page.goto("/pricing")
  const starterCard = page.locator("article").filter({ hasText: starter.name }).first()

  await page.getByRole("button", { name: "Pakistan (PKR)" }).click()
  await expect(starterCard).toContainText(formatPrice(starter.priceFrom.PKR!, "PKR"))

  await page.getByRole("button", { name: "International (USD)" }).click()
  await expect(starterCard).toContainText(formatPrice(starter.priceFrom.USD!, "USD"))
  await expect(page.getByRole("button", { name: "International (USD)" })).toHaveAttribute("aria-pressed", "true")
})

test("'Get a quote' pre-selects the package on the contact form", async ({ page }) => {
  await page.goto("/pricing")
  await page.getByRole("link", { name: `Get a quote for ${starter.name}` }).click()
  await expect(page).toHaveURL(/\/contact\?package=starter$/)
  await expect(page.getByText(`Package: ${starter.name}`)).toBeVisible()
  await expect(page.locator("#contact-service")).toHaveValue("Business website")
})

test("free mockup form sends with a logo and keeps the outreach ref", async ({ page }) => {
  await page.goto("/mockup?ref=email-batch-3")
  await expect(page).toHaveURL(/\/free-mockup\?ref=email-batch-3$/)
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/)

  await page.getByLabel("Your name *").fill("Hina Malik")
  await page.getByLabel("Email *").fill("hina@example.com")
  await page.getByLabel("Business name *").fill("Hina's Kitchen")
  await page.getByLabel("Business type *").selectOption("Restaurant / cafe")
  await page.getByLabel("City and country *").fill("Lahore, Pakistan")
  await page.getByLabel("What do you sell, or what are your main services? *").fill("Home-style food and catering")
  await page.getByText("WhatsApp us", { exact: true }).click()
  await page.locator("#mockup-logo").setInputFiles("public/work/umar-collections.jpg")
  await expect(page.getByText("umar-collections.jpg")).toBeVisible()
  await page.getByRole("button", { name: "Request my free mockup" }).click()

  const reply = page.getByRole("status").filter({ hasText: "Thanks, Hina!" })
  await expect(reply).toBeVisible({ timeout: 20_000 })
  await expect(reply).toContainText("hina@example.com")
})

test("unknown pages return a helpful 404", async ({ page }) => {
  const res = await page.goto("/this-page-does-not-exist")
  expect(res?.status()).toBe(404)
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("This page doesn't exist.")
  await expect(page.getByRole("link", { name: "Back to the homepage" })).toBeVisible()
})

test("SEO files are served", async ({ request }) => {
  const sitemap = await (await request.get("/sitemap.xml")).text()
  expect(sitemap).toContain("https://code-motive.dev/services/shopify")
  expect(sitemap).not.toContain("free-mockup")
  expect(await (await request.get("/robots.txt")).text()).toContain("Disallow: /admin")
  expect(await (await request.get("/llms.txt")).text()).toContain("# CodeMotive")
})

test("AI chat widget opens, answers and closes with Escape", async ({ page }) => {
  await page.goto("/services")
  const launcher = page.getByRole("button", { name: "Ask our AI assistant" })
  await launcher.click()
  const panel = page.getByRole("region", { name: "Chat with CodeMotive's AI assistant" })
  await expect(panel).toBeVisible()
  await expect(page.getByLabel("Your message")).toBeFocused()

  await panel.getByRole("button", { name: "How much does a website cost?" }).click()
  // No AI keys in tests, so the assistant gives its fallback answer.
  await expect(panel.getByRole("log")).toContainText("Bilal can help you directly", { timeout: 20_000 })
  await expect(panel.getByRole("link", { name: "Get a free quote" })).toBeVisible()

  await page.keyboard.press("Escape")
  await expect(panel).toBeHidden()
  await expect(page.getByRole("button", { name: "Ask our AI assistant" })).toBeFocused()
})
