import { expect, test, type Page } from "@playwright/test"
import { ukCarePlans, ukCareNote, ukCustomProject, ukExtras, ukPlans, ukTerms } from "../data/pricing-uk"

// UK (GBP) pricing, checked on the rendered pages. Strings come from the same
// data file the pages use, plus a few spec literals typed out here.

const useMarket = (page: Page, market: "GBP" | "USD" | "PKR") =>
  page.addInitScript((m) => localStorage.setItem("cm-currency", m), market)

const mainText = (page: Page) => page.locator("main").innerText()

test("UK pricing page shows every plan, extra, care plan and term", async ({ page }) => {
  await useMarket(page, "GBP")
  await page.goto("/pricing")

  for (const plan of ukPlans) {
    const card = page.locator("article").filter({ has: page.getByRole("heading", { name: plan.name, exact: true }) })
    await expect(card).toContainText(`from £${plan.from.toLocaleString("en-GB")}`)
    for (const item of plan.includes) await expect(card).toContainText(item)
    await expect(card).toContainText(`Raises the price: ${plan.raisesPrice}`)
    await expect(card).toContainText(plan.delivery!)
    // The same quote link the PKR/USD cards use.
    await expect(card.getByRole("link", { name: `Get a free mockup for ${plan.name}` })).toHaveAttribute("href", `/contact?package=${plan.contactPackage}`)
  }
  await expect(page.getByText("Most popular")).toHaveCount(1)

  for (const extra of ukExtras) {
    await expect(page.locator("article").filter({ has: page.getByRole("heading", { name: extra.name }) })).toContainText(`from £${extra.from}`)
  }
  await expect(page.getByText(`from £1,500, ${ukCustomProject.note}`)).toBeVisible()

  for (const care of ukCarePlans) {
    const card = page.locator("article").filter({ has: page.getByRole("heading", { name: care.name, exact: true }) })
    await expect(card).toContainText(`£${care.from}/month`)
    for (const item of care.includes) await expect(card).toContainText(item)
  }
  await expect(page.getByText(ukCareNote)).toBeVisible()

  // The seven terms, in order, word for word.
  const items = page.getByRole("heading", { name: "Terms" }).locator("xpath=following-sibling::ol[1]/li")
  await expect(items).toHaveText(ukTerms)
  await expect(items.nth(6)).toHaveText(
    "Prices are in GBP. Pay through Payoneer, or by Taptap Send to our PKR bank account. We give a fixed quote after a complete discussion of your project.",
  )
})

test("UK pricing page hides the PKR/USD-only boxes, other delivery rows, and the word 'call'", async ({ page }) => {
  await useMarket(page, "GBP")
  await page.goto("/pricing")
  await expect(page.getByText("from £595").first()).toBeVisible()
  const text = await mainText(page)

  for (const gone of ["Payoneer or bank transfer", "first year of hosting", "No lock-in", "Refunds:", "Revisions", "bakery", "cake", "Launch offer", "$"]) {
    expect(text, gone).not.toContain(gone)
  }
  expect(text).not.toMatch(/\bcalls?\b/i)
  expect(text).not.toMatch(/PKR\s?\d/)
})

test("USD and PKR views are unchanged and show no pounds", async ({ page }) => {
  for (const market of ["USD", "PKR"] as const) {
    await useMarket(page, market)
    await page.goto("/pricing")
    await expect(page.getByRole("button", { name: market === "USD" ? "International (USD)" : "Pakistan (PKR)" })).toHaveAttribute("aria-pressed", "true")
    const text = await mainText(page)
    expect(text).not.toContain("£")
    expect(text).toContain("Starter Website")
    expect(text).toContain(market === "USD" ? "$299" : "PKR 35,000")
    expect(text).toContain("Payoneer or bank transfer")
  }
})

test("GB visitors start on GBP, and the switch stays visible and usable", async ({ page }) => {
  await page.route("**/api/geo", (route) => route.fulfill({ json: { country: "GB" } }))
  await page.goto("/pricing")
  const uk = page.getByRole("button", { name: "United Kingdom (GBP)" })
  await expect(uk).toHaveAttribute("aria-pressed", "true")
  await expect(page.getByText("from £595").first()).toBeVisible()

  await page.getByRole("button", { name: "International (USD)" }).click()
  await expect(page.getByText("$299").first()).toBeVisible()
  await uk.focus()
  await page.keyboard.press("Enter")
  await expect(uk).toHaveAttribute("aria-pressed", "true")
  await expect(page.getByText("from £595").first()).toBeVisible()
})

test("home page, service cards and service pages use the UK prices", async ({ page }) => {
  await useMarket(page, "GBP")

  await page.goto("/")
  for (const plan of ukPlans) await expect(page.locator("article").filter({ has: page.getByRole("heading", { name: plan.name, exact: true }) })).toContainText(`£${plan.from.toLocaleString("en-GB")}`)

  await page.goto("/services")
  const text = await mainText(page)
  for (const from of ["From £595", "From £1,495", "From £195", "From £395", "From £29/month"]) expect(text, from).toContain(from)
  expect(text).not.toContain("$")

  await page.goto("/services/care-plans")
  await expect(page.getByText("From £29/month").first()).toBeVisible()
  for (const care of ukCarePlans) await expect(page.locator("article").filter({ has: page.getByRole("heading", { name: care.name, exact: true }) })).toContainText(`£${care.from}/month`)
  expect(await mainText(page)).not.toContain("Timeline")
})

test("/llms.txt lists the UK prices and terms", async ({ request }) => {
  const text = await (await request.get("/llms.txt")).text()
  const section = text.slice(text.indexOf("## UK pricing (GBP)"), text.indexOf("## Industries"))
  for (const plan of ukPlans) expect(section).toContain(`${plan.name}: from £${plan.from.toLocaleString("en-GB")}`)
  for (const care of ukCarePlans) expect(section).toContain(`${care.name}: £${care.from}/month`)
  for (const term of ukTerms) expect(section).toContain(term)
  expect(section).not.toMatch(/\bcalls?\b/i)
})

for (const width of [360, 768, 1280]) {
  test(`UK pricing has no horizontal scroll at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await useMarket(page, "GBP")
    for (const url of ["/pricing", "/"]) {
      await page.goto(url)
      await expect(page.getByText("from £595").first()).toBeVisible()
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
    }
  })
}
