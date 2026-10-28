import type { Metadata } from "next"
import { pageMetadata } from "@/lib/seo"
import { LegalPage } from "@/components/legal-page"
import { getSite } from "@/lib/cms"

export const metadata: Metadata = pageMetadata({
  title: "Privacy Policy",
  description:
    "What information CodeMotive collects when you contact us, why we collect it and how to ask us to delete it.",
  path: "/privacy",
})

// TODO(Bilal): confirm the retention wording before launch (section 8 reviews this page).
export default async function PrivacyPage() {
  const site = await getSite()
  return (
    <LegalPage
      title="Privacy policy"
      intro="We only collect what we need to reply to you and to work on your project."
      updated="28 October 2026"
      sections={[
        {
          heading: "What we collect",
          body: (
            <>
              <p>When you use our contact form or free mockup form, email us or message us on WhatsApp, we receive the details you send:</p>
              <ul>
                <li>your name and email address</li>
                <li>your phone or WhatsApp number, if you share it</li>
                <li>your business name, country, the service you need, your budget range and your message</li>
                <li>for a free mockup: your business details, links you share and your logo, if you upload one</li>
              </ul>
              <p>
                With a form we also record the country your connection comes from (not your full address) to show
                prices in the right currency, and use your IP address briefly to stop spam. It is stored only in
                scrambled form.
              </p>
              <p>
                We also use Vercel Web Analytics to count page visits. It does not use cookies and does not
                identify you personally.
              </p>
            </>
          ),
        },
        {
          heading: "Why we use it",
          body: (
            <>
              <p>
                We use your details only to reply to your enquiry, prepare a quote or mockup and, if you hire us,
                deliver and support your project. We don&apos;t sell your information or send you marketing emails
                you didn&apos;t ask for.
              </p>
              <p>
                When you send a form, an AI assistant writes an instant first reply from your message and our
                published prices. Bilal reviews every enquiry personally and follows up by email.
              </p>
              <p>
                If you use the chat on our website, your messages are sent to the AI provider only to write an
                answer. We don&apos;t store chat conversations; the chat is kept in your browser tab until you close
                it. To improve our answers we keep the questions typed into the chat for 90 days, without your
                name, IP address or the rest of the conversation, and with email addresses and phone numbers
                removed. Please don&apos;t share passwords or payment details in the chat.
              </p>
            </>
          ),
        },
        {
          heading: "Who else sees it",
          body: (
            <>
              <p>These services process your details on our behalf, only to do the jobs listed:</p>
              <ul>
                <li>Vercel: hosts this website</li>
                <li>MongoDB Atlas: stores enquiries and uploaded logos</li>
                <li>Groq and Google (Gemini): write the instant reply to your message and the chat answers</li>
                <li>Resend: sends the confirmation email to you and the enquiry to us</li>
                <li>Atlassian Jira: our task board for following up enquiries</li>
                <li>Cloudflare Turnstile: checks that forms are sent by people, not bots</li>
                <li>Google Analytics: visit statistics, only with cookies if you accept them</li>
                <li>WhatsApp and our email provider: when you message us directly</li>
              </ul>
              <p>We don&apos;t share your details with anyone else unless the law requires it.</p>
            </>
          ),
        },
        {
          heading: "How long we keep it",
          body: (
            <p>
              We keep enquiries for as long as we need them to reply and to keep normal business records. Spam
              check records are deleted automatically within a day, and chat questions after 90 days. You can ask
              us to delete your enquiry at any time.
            </p>
          ),
        },
        {
          heading: "Cookies and analytics",
          body: (
            <>
              <p>
                We use Google Analytics to understand which pages are useful. Until you click &quot;Accept&quot; in
                the cookie banner, it doesn&apos;t set analytics cookies and only receives anonymous, cookieless
                signals. If you accept, it uses cookies to count visits and see how people move through the site. We
                don&apos;t use advertising cookies or sell any data.
              </p>
              <p>You can change your choice any time with &quot;Cookie settings&quot; at the bottom of every page.</p>
            </>
          ),
        },
        {
          heading: "Your choices",
          body: (
            <p>
              To see, correct or delete the information we hold about you, email{" "}
              <a href={`mailto:${site.email}`}>{site.email}</a>. {site.replyPromise}
            </p>
          ),
        },
      ]}
    />
  )
}
