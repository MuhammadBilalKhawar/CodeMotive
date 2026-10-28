import { Body, Button, Column, Container, Head, Heading, Hr, Html, Img, Link, Preview, Row, Section, Text } from "@react-email/components"
import { siteConfig } from "@/config/site"
import type { SiteInfo } from "@/lib/cms/site-info"

// Email clients don't support CSS variables, so the brand palette is
// repeated here as literal values (same as app/globals.css).
const brand = {
  forest: "#0F2D23",
  sage600: "#557363",
  mint: "#CFE5D7",
  neutral: "#F4F1EA",
  charcoal: "#1E1E1E",
  white: "#FFFFFF",
}

const font = "Inter, 'Segoe UI', Helvetica, Arial, sans-serif"
const logoUrl = `${siteConfig.url}/brand/email-signature-logo-600x150-white-bg.png`

function Layout({ preview, children }: { preview: string; children: React.ReactNode }) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: brand.neutral, fontFamily: font, margin: 0, padding: "24px 0" }}>
        <Container style={{ backgroundColor: brand.white, maxWidth: 600, borderRadius: 16, padding: "28px 32px" }}>
          <Img src={logoUrl} width={200} height={50} alt="CodeMotive" style={{ marginBottom: 20 }} />
          {children}
        </Container>
      </Body>
    </Html>
  )
}

const paragraphs = (text: string) =>
  text
    .split(/\n+/)
    .filter(Boolean)
    .map((line, i) => (
      <Text key={i} style={{ color: brand.charcoal, fontSize: 15, lineHeight: "24px", margin: "0 0 12px" }}>
        {line}
      </Text>
    ))

type OwnerEmailProps = {
  title: string
  fields: [string, string][]
  reply: string
  replySource: string
  ipCountry: string | null
  receivedAt: string
  taskUrl?: string
  logoNote?: string
}

export function OwnerLeadEmail({ title, fields, reply, replySource, ipCountry, receivedAt, taskUrl, logoNote }: OwnerEmailProps) {
  return (
    <Layout preview={title}>
      <Heading as="h1" style={{ color: brand.forest, fontSize: 22, margin: "0 0 4px" }}>
        {title}
      </Heading>
      <Text style={{ color: brand.sage600, fontSize: 13, margin: "0 0 20px" }}>
        {receivedAt} (Pakistan time) · IP country: {ipCountry ?? "unknown"}
      </Text>

      <Section style={{ backgroundColor: brand.neutral, borderRadius: 12, padding: "8px 16px" }}>
        {fields.map(([label, value]) => (
          <Row key={label} style={{ borderBottom: `1px solid ${brand.mint}` }}>
            <Column style={{ width: 160, padding: "8px 0", color: brand.sage600, fontSize: 13, fontWeight: 600, verticalAlign: "top" }}>{label}</Column>
            <Column style={{ padding: "8px 0", color: brand.charcoal, fontSize: 14, whiteSpace: "pre-wrap" }}>{value || "—"}</Column>
          </Row>
        ))}
      </Section>

      {logoNote && <Text style={{ color: brand.charcoal, fontSize: 14 }}>{logoNote}</Text>}

      <Heading as="h2" style={{ color: brand.forest, fontSize: 16, margin: "24px 0 8px" }}>
        Reply shown on the website ({replySource})
      </Heading>
      <Section style={{ borderLeft: `3px solid ${brand.mint}`, paddingLeft: 14 }}>{paragraphs(reply)}</Section>

      <Hr style={{ borderColor: brand.mint, margin: "24px 0 16px" }} />
      <Text style={{ fontSize: 14, margin: 0 }}>
        {taskUrl ? (
          <Link href={taskUrl} style={{ color: brand.forest, fontWeight: 600 }}>
            Open the Jira issue
          </Link>
        ) : (
          "No Jira issue was created."
        )}
        {" · "}
        <Link href={`${siteConfig.url}/admin/leads`} style={{ color: brand.forest, fontWeight: 600 }}>
          All leads in the admin
        </Link>
      </Text>
      <Text style={{ color: brand.sage600, fontSize: 13, marginTop: 12 }}>Reply to this email to answer them directly.</Text>
    </Layout>
  )
}

type SignatureSite = Pick<SiteInfo, "tagline" | "fullAddress" | "whatsappUrl" | "whatsappDisplay">

export function VisitorReplyEmail({ heading, reply, site }: { heading: string; reply: string; site: SignatureSite }) {
  return (
    <Layout preview={heading}>
      <Heading as="h1" style={{ color: brand.forest, fontSize: 22, margin: "0 0 16px" }}>
        {heading}
      </Heading>
      {paragraphs(reply)}
      <Hr style={{ borderColor: brand.mint, margin: "24px 0 16px" }} />
      <Text style={{ color: brand.charcoal, fontSize: 14, lineHeight: "22px", margin: 0 }}>
        <strong>Bilal</strong>
        <br />
        {siteConfig.name} · {site.tagline}
        <br />
        {site.fullAddress}
        <br />
        WhatsApp:{" "}
        <Link href={site.whatsappUrl} style={{ color: brand.forest }}>
          {site.whatsappDisplay}
        </Link>
        <br />
        <Link href={siteConfig.url} style={{ color: brand.forest }}>
          {siteConfig.url.replace(/^https?:\/\//, "")}
        </Link>
      </Text>
      <Text style={{ color: brand.sage600, fontSize: 12, marginTop: 20 }}>
        You&apos;re getting this because you contacted us through our website. Just reply to this email to reach us.
      </Text>
    </Layout>
  )
}

export type DigestRow = { name: string; detail: string; note: string; url: string }

export type DigestSection = { title: string; rows: DigestRow[] }

// Morning email: follow-ups due, leads nobody has answered yet, overdue invoices.
export function DigestEmail({ date, sections, adminUrl }: { date: string; sections: DigestSection[]; adminUrl: string }) {
  const section = (title: string, rows: DigestRow[]) =>
    rows.length > 0 && (
      <>
        <Heading as="h2" style={{ color: brand.forest, fontSize: 16, margin: "24px 0 8px" }}>
          {title} ({rows.length})
        </Heading>
        <Section style={{ backgroundColor: brand.neutral, borderRadius: 12, padding: "4px 16px" }}>
          {rows.map((row) => (
            <Row key={row.url} style={{ borderBottom: `1px solid ${brand.mint}` }}>
              <Column style={{ padding: "10px 0", verticalAlign: "top" }}>
                <Link href={row.url} style={{ color: brand.forest, fontSize: 15, fontWeight: 600 }}>
                  {row.name}
                </Link>
                {row.detail && <Text style={{ color: brand.charcoal, fontSize: 13, margin: "2px 0 0" }}>{row.detail}</Text>}
              </Column>
              <Column style={{ padding: "10px 0", width: 150, color: brand.sage600, fontSize: 13, fontWeight: 600, textAlign: "right", verticalAlign: "top" }}>{row.note}</Column>
            </Row>
          ))}
        </Section>
      </>
    )

  return (
    <Layout preview={sections.map((s) => `${s.rows.length} ${s.title.toLowerCase()}`).join(", ")}>
      <Heading as="h1" style={{ color: brand.forest, fontSize: 22, margin: "0 0 4px" }}>
        Today&apos;s follow-ups
      </Heading>
      <Text style={{ color: brand.sage600, fontSize: 13, margin: 0 }}>{date}</Text>
      {sections.map((s) => (
        <Section key={s.title}>{section(s.title, s.rows)}</Section>
      ))}
      <Text style={{ fontSize: 14, marginTop: 24 }}>
        <Link href={adminUrl} style={{ color: brand.forest, fontWeight: 600 }}>
          Open the pipeline
        </Link>
      </Text>
    </Layout>
  )
}

type DocumentEmailProps = {
  heading: string
  paragraphs: string[]
  summary: [string, string][]
  buttonLabel: string
  url: string
  site: SignatureSite
}

// A quote, invoice or payment reminder sent to a client, with a link to view it online.
export function DocumentEmail({ heading, paragraphs: text, summary, buttonLabel, url, site }: DocumentEmailProps) {
  return (
    <Layout preview={heading}>
      <Heading as="h1" style={{ color: brand.forest, fontSize: 22, margin: "0 0 16px" }}>
        {heading}
      </Heading>
      {text.map((line, i) => (
        <Text key={i} style={{ color: brand.charcoal, fontSize: 15, lineHeight: "24px", margin: "0 0 12px" }}>
          {line}
        </Text>
      ))}
      <Section style={{ backgroundColor: brand.neutral, borderRadius: 12, padding: "8px 16px", margin: "8px 0 20px" }}>
        {summary.map(([label, value]) => (
          <Row key={label} style={{ borderBottom: `1px solid ${brand.mint}` }}>
            <Column style={{ padding: "8px 0", color: brand.sage600, fontSize: 13, fontWeight: 600 }}>{label}</Column>
            <Column style={{ padding: "8px 0", color: brand.charcoal, fontSize: 14, textAlign: "right" }}>{value}</Column>
          </Row>
        ))}
      </Section>
      <Button href={url} style={{ backgroundColor: brand.forest, color: brand.white, borderRadius: 10, padding: "12px 22px", fontSize: 15, fontWeight: 600 }}>
        {buttonLabel}
      </Button>
      <Text style={{ color: brand.sage600, fontSize: 12, marginTop: 14 }}>
        Or open this link: <Link href={url} style={{ color: brand.forest }}>{url}</Link>
      </Text>
      <Hr style={{ borderColor: brand.mint, margin: "24px 0 16px" }} />
      <Text style={{ color: brand.charcoal, fontSize: 14, lineHeight: "22px", margin: 0 }}>
        <strong>Bilal</strong>
        <br />
        {siteConfig.name} · {site.tagline}
        <br />
        WhatsApp:{" "}
        <Link href={site.whatsappUrl} style={{ color: brand.forest }}>
          {site.whatsappDisplay}
        </Link>
      </Text>
    </Layout>
  )
}

// Short notice to the team inbox (e.g. a client accepted a quote).
export function NoticeEmail({ heading, lines, url, linkLabel }: { heading: string; lines: string[]; url: string; linkLabel: string }) {
  return (
    <Layout preview={heading}>
      <Heading as="h1" style={{ color: brand.forest, fontSize: 20, margin: "0 0 12px" }}>
        {heading}
      </Heading>
      {lines.map((line, i) => (
        <Text key={i} style={{ color: brand.charcoal, fontSize: 14, margin: "0 0 8px", whiteSpace: "pre-wrap" }}>
          {line}
        </Text>
      ))}
      <Text style={{ fontSize: 14, marginTop: 16 }}>
        <Link href={url} style={{ color: brand.forest, fontWeight: 600 }}>
          {linkLabel}
        </Link>
      </Text>
    </Layout>
  )
}
