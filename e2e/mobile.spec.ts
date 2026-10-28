import { expect, test } from "@playwright/test"

test("contact form on a phone: sends and shows the reply card", async ({ page }) => {
  await page.goto("/contact?package=shopify")
  // Wait for the form to hydrate (country list is filled in by the browser).
  await expect(page.locator("#contact-country option")).not.toHaveCount(1)
  await expect(page.getByText("Package: Shopify Store")).toBeVisible()
  await expect(page.locator("#contact-service")).toHaveValue("Shopify / online store")

  await page.getByLabel("Name *").fill("Ali Khan")
  await page.getByLabel("Email *").fill("ali@example.com")
  await page.locator("#contact-country").selectOption("PK")
  await page.getByLabel("Message *").fill("How much does a Shopify store cost, and can customers pay cash on delivery?")
  await page.getByRole("button", { name: "Send message" }).click()

  const reply = page.getByRole("status").filter({ hasText: "Thanks, Ali!" })
  await expect(reply).toBeVisible({ timeout: 20_000 })
  // No AI keys in tests, so this is the fixed template reply.
  await expect(reply).toContainText("We've received your message about Shopify / online store")
  await expect(reply).toBeInViewport()
})

test("empty contact form shows field errors instead of sending", async ({ page }) => {
  await page.goto("/contact")
  await expect(page.locator("#contact-country option")).not.toHaveCount(1)
  await page.getByRole("button", { name: "Send message" }).click()
  await expect(page.locator("#contact-name-error")).toContainText("Please enter your name")
  await expect(page.locator("#contact-message-error")).toBeVisible()
  await expect(page.locator("#contact-name")).toBeFocused()
})

test("mobile menu opens and navigates", async ({ page }) => {
  await page.goto("/")
  await page.getByRole("button", { name: "Open menu" }).click()
  const menu = page.locator("#mobile-menu")
  await expect(menu).toBeVisible()
  await menu.getByRole("link", { name: "Pricing" }).click()
  await expect(page).toHaveURL(/\/pricing$/)
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Simple, upfront pricing")
})

test("floating WhatsApp button links to the business number", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByRole("link", { name: "Chat with us on WhatsApp" })).toHaveAttribute("href", /^https:\/\/wa\.me\/\d+$/)
})

test("chat button and WhatsApp button don't overlap on a phone", async ({ page }) => {
  await page.goto("/")
  const chat = await page.getByRole("button", { name: "Ask our AI assistant" }).boundingBox()
  const whatsapp = await page.getByRole("link", { name: "Chat with us on WhatsApp" }).boundingBox()
  expect(chat && whatsapp).toBeTruthy()
  expect(whatsapp!.y + whatsapp!.height).toBeLessThanOrEqual(chat!.y)

  await page.getByRole("button", { name: "Ask our AI assistant" }).click()
  const panel = page.getByRole("region", { name: "Chat with CodeMotive's AI assistant" })
  await expect(panel).toBeInViewport()
  await page.getByLabel("Your message").fill("Do you do Shopify?")
  await page.getByLabel("Your message").press("Enter")
  await expect(panel.getByRole("log")).toContainText("Do you do Shopify?")
  await expect(panel.getByRole("log")).toContainText("Bilal can help you directly", { timeout: 20_000 })
})
