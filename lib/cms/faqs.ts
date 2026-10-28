import type { FaqItem } from "@/data/faq"
import type { PricingSettings } from "@/lib/content-schema"
import type { FaqContent } from "@/lib/cms/schemas"
import { fillTokens, type SiteInfo } from "@/lib/cms/site-info"

export type FilledFaqs = { general: FaqItem[]; pricing: FaqItem[] }

// FAQ answers can use {deliveryPromise} {replyPromise} {paymentSplit}
// {pkrMethods} {pkrMethodsLower} {usdMethods}, so they follow the settings.
export function fillFaqs(faqs: FaqContent, site: Pick<SiteInfo, "deliveryPromise" | "replyPromise">, settings: PricingSettings): FilledFaqs {
  const values = {
    deliveryPromise: site.deliveryPromise,
    replyPromise: site.replyPromise,
    paymentSplit: settings.paymentTerms.split,
    pkrMethods: settings.paymentTerms.methods.PKR,
    pkrMethodsLower: settings.paymentTerms.methods.PKR.toLowerCase(),
    usdMethods: settings.paymentTerms.methods.USD,
  }
  const fill = (list: FaqItem[]) => list.map((f) => ({ question: f.question, answer: fillTokens(f.answer, values) }))
  return { general: fill(faqs.general), pricing: fill(faqs.pricing) }
}
