import type { Metadata } from "next"
import { pageMetadata } from "@/lib/seo"
import { LegalPage } from "@/components/legal-page"
import { getSite } from "@/lib/cms"
import { getPricing } from "@/lib/content"

export const metadata: Metadata = pageMetadata({
  title: "Terms of Service",
  description:
    "How CodeMotive quotes, bills and delivers projects: payment terms, revisions, ownership and support.",
  path: "/terms",
})

// TODO(Bilal): confirm payment terms and ownership wording before launch (section 8 finalises this page).
export default async function TermsPage() {
  const [{ settings }, site] = await Promise.all([getPricing(), getSite()])
  const { paymentTerms } = settings

  return (
    <LegalPage
      title="Terms of service"
      intro="The short version of how we work together. Your written quote has the details for your project."
      updated="24 October 2026"
      sections={[
        {
          heading: "Quotes",
          body: (
            <p>
              Before any work starts we send a written quote with the scope, price, timeline and number of
              revision rounds. Work outside that scope is quoted separately before we do it.
            </p>
          ),
        },
        {
          heading: "Payment",
          body: (
            <p>
              Unless your quote says otherwise, payment is {paymentTerms.split}. Third-party costs such as
              your domain, paid Shopify plans, paid themes, apps or other subscriptions are paid by you directly
              and are not part of our fee unless the quote includes them.
            </p>
          ),
        },
        {
          heading: "Revisions",
          body: (
            <p>
              Each project includes the revision rounds listed in your quote. Extra changes after that are billed
              at the rate we agree with you in advance.
            </p>
          ),
        },
        {
          heading: "Ownership",
          body: (
            <p>
              Once the project is paid in full, you own your website content, design and domain. We may show the
              finished project in our portfolio unless you ask us not to.
            </p>
          ),
        },
        {
          heading: "Support after launch",
          body: (
            <p>
              We fix bugs caused by our work that you report within the support period stated in your quote.
              Ongoing hosting, updates and edits are available as a monthly care plan.
            </p>
          ),
        },
        {
          heading: "Questions",
          body: (
            <p>
              Email <a href={`mailto:${site.email}`}>{site.email}</a> or message us on{" "}
              <a href={site.whatsappUrl} target="_blank" rel="noopener noreferrer">
                WhatsApp
              </a>
              .
            </p>
          ),
        },
      ]}
    />
  )
}
