import { readFile } from "node:fs/promises"
import path from "node:path"
import { Document, Image, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer"
import { lineTotal, longDate, money, splitTotal, subtotal, paymentMethodLabels, type BillTo, type LineItem } from "@/lib/billing/schemas"
import type { BillingSettings } from "@/lib/billing/schemas"
import type { Invoice, Quote } from "@/lib/billing/store"
import { pakistanDate } from "@/lib/crm/schemas"

// A4 PDFs for quotes and invoices, in the brand colours. Built-in Helvetica
// keeps them small and readable in every PDF viewer.

const c = { forest: "#0F2D23", sage: "#557363", mint: "#CFE5D7", neutral: "#F4F1EA", charcoal: "#1E1E1E", line: "#DCE6DF" }

const s = StyleSheet.create({
  page: { padding: 40, paddingBottom: 60, fontFamily: "Helvetica", fontSize: 10, color: c.charcoal, lineHeight: 1.4 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: 18, borderBottom: `2 solid ${c.forest}` },
  logo: { width: 150, height: 37.5 },
  logoText: { fontFamily: "Helvetica-Bold", fontSize: 20, color: c.forest },
  docType: { fontFamily: "Helvetica-Bold", fontSize: 22, lineHeight: 1.1, color: c.forest, textAlign: "right", marginBottom: 4 },
  meta: { textAlign: "right", color: c.sage, marginTop: 2 },
  parties: { flexDirection: "row", marginTop: 20, gap: 24 },
  party: { flex: 1 },
  label: { fontFamily: "Helvetica-Bold", fontSize: 8, color: c.sage, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  strong: { fontFamily: "Helvetica-Bold" },
  title: { fontFamily: "Helvetica-Bold", fontSize: 14, color: c.forest, marginTop: 22 },
  table: { marginTop: 14 },
  row: { flexDirection: "row", paddingVertical: 7, borderBottom: `1 solid ${c.line}` },
  head: { backgroundColor: c.forest, color: "#FFFFFF", fontFamily: "Helvetica-Bold", fontSize: 9, paddingHorizontal: 6, borderBottom: 0 },
  cellDesc: { flex: 1, paddingHorizontal: 6 },
  cellQty: { width: 40, textAlign: "right", paddingHorizontal: 6 },
  cellMoney: { width: 90, textAlign: "right", paddingHorizontal: 6 },
  details: { color: c.sage, fontSize: 8.5, marginTop: 2 },
  totals: { marginTop: 10, marginLeft: "auto", width: 230 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  grand: { flexDirection: "row", justifyContent: "space-between", marginTop: 4, paddingVertical: 7, paddingHorizontal: 8, backgroundColor: c.mint, fontFamily: "Helvetica-Bold", fontSize: 12, color: c.forest },
  section: { marginTop: 20 },
  box: { backgroundColor: c.neutral, padding: 10, borderRadius: 4 },
  footer: { position: "absolute", bottom: 24, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between", fontSize: 8, color: c.sage, borderTop: `1 solid ${c.line}`, paddingTop: 6 },
})

// The email logo, read from /public (bundled with the PDF routes in next.config).
let logo: Promise<Buffer | null> | null = null
const loadLogo = () => (logo ??= readFile(path.join(process.cwd(), "public/brand/email-signature-logo-600x150-white-bg.png")).catch(() => null))

const lines = (text: string) => text.split("\n").filter((line) => line.trim())

function Header({ kind, number, rows, logoData }: { kind: string; number: string; rows: string[]; logoData: Buffer | null }) {
  return (
    <View style={s.header}>
      {logoData ? <Image src={logoData} style={s.logo} /> : <Text style={s.logoText}>CodeMotive</Text>}
      <View>
        <Text style={s.docType}>{kind}</Text>
        <Text style={[s.meta, s.strong, { color: c.forest }]}>{number}</Text>
        {rows.map((row) => (
          <Text key={row} style={s.meta}>
            {row}
          </Text>
        ))}
      </View>
    </View>
  )
}

function Parties({ settings, billTo }: { settings: BillingSettings; billTo: BillTo }) {
  return (
    <View style={s.parties}>
      <View style={s.party}>
        <Text style={s.label}>From</Text>
        <Text style={s.strong}>{settings.businessName}</Text>
        {lines(settings.details).map((line) => (
          <Text key={line}>{line}</Text>
        ))}
      </View>
      <View style={s.party}>
        <Text style={s.label}>For</Text>
        <Text style={s.strong}>{billTo.business || billTo.name}</Text>
        {billTo.business && <Text>{billTo.name}</Text>}
        {lines(billTo.address).map((line) => (
          <Text key={line}>{line}</Text>
        ))}
        {billTo.email && <Text>{billTo.email}</Text>}
      </View>
    </View>
  )
}

function Items({ items, currency, discount, extra }: { items: LineItem[]; currency: "PKR" | "USD"; discount: number; extra?: [string, string][] }) {
  const sub = subtotal(items)
  return (
    <>
      <View style={s.table}>
        <View style={[s.row, s.head]} fixed>
          <Text style={s.cellDesc}>Description</Text>
          <Text style={s.cellQty}>Qty</Text>
          <Text style={s.cellMoney}>Price</Text>
          <Text style={s.cellMoney}>Amount</Text>
        </View>
        {items.map((item, i) => (
          <View key={i} style={s.row} wrap={false}>
            <View style={s.cellDesc}>
              <Text style={s.strong}>{item.description}</Text>
              {item.details && <Text style={s.details}>{item.details}</Text>}
            </View>
            <Text style={s.cellQty}>{item.quantity}</Text>
            <Text style={s.cellMoney}>{money(item.unitPrice, currency)}</Text>
            <Text style={s.cellMoney}>{money(lineTotal(item), currency)}</Text>
          </View>
        ))}
      </View>
      <View style={s.totals} wrap={false}>
        {discount > 0 && (
          <>
            <View style={s.totalRow}>
              <Text>Subtotal</Text>
              <Text>{money(sub, currency)}</Text>
            </View>
            <View style={s.totalRow}>
              <Text>Discount</Text>
              <Text>-{money(discount, currency)}</Text>
            </View>
          </>
        )}
        <View style={s.grand}>
          <Text>Total ({currency})</Text>
          <Text>{money(Math.max(0, sub - discount), currency)}</Text>
        </View>
        {extra?.map(([label, value]) => (
          <View key={label} style={[s.totalRow, { paddingHorizontal: 8 }]}>
            <Text style={label.startsWith("Balance") ? s.strong : {}}>{label}</Text>
            <Text style={label.startsWith("Balance") ? s.strong : {}}>{value}</Text>
          </View>
        ))}
      </View>
    </>
  )
}

function Footer({ settings, text }: { settings: BillingSettings; text: string }) {
  return (
    <View style={s.footer} fixed>
      <Text>{text || settings.businessName}</Text>
      <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
    </View>
  )
}

function QuotePdf({ quote, settings, logoData }: { quote: Quote; settings: BillingSettings; logoData: Buffer | null }) {
  const parts = splitTotal(quote.total, quote.schedule)
  const created = pakistanDate(quote.createdAt)
  return (
    <Document title={`Quote ${quote.number}`} author={settings.businessName}>
      <Page size="A4" style={s.page}>
        <Header kind="QUOTE" number={quote.number} logoData={logoData} rows={[`Date: ${longDate(created)}`, `Valid until: ${longDate(quote.validUntil)}`]} />
        <Parties settings={settings} billTo={quote.billTo} />
        <Text style={s.title}>{quote.title}</Text>
        <Items items={quote.items} currency={quote.currency} discount={quote.discount} />

        <View style={s.section} wrap={false}>
          <Text style={s.label}>How it's paid</Text>
          {parts.map((part) => (
            <View key={part.label} style={[s.totalRow, { borderBottom: `1 solid ${c.line}` }]}>
              <Text>
                {part.label} ({part.percent}%)
              </Text>
              <Text style={s.strong}>{money(part.amount, quote.currency)}</Text>
            </View>
          ))}
        </View>

        {quote.notes && (
          <View style={s.section}>
            <Text style={s.label}>Scope and notes</Text>
            {lines(quote.notes).map((line, i) => (
              <Text key={i}>{line}</Text>
            ))}
          </View>
        )}
        {settings.quoteTerms && (
          <View style={s.section}>
            <Text style={s.label}>Terms</Text>
            {lines(settings.quoteTerms).map((line, i) => (
              <Text key={i}>• {line}</Text>
            ))}
          </View>
        )}
        <View style={[s.section, s.box]} wrap={false}>
          <Text>To accept, use the link in our email or reply to it. Questions? {lines(settings.details).find((l) => l.includes("@")) ?? ""}</Text>
        </View>
        <Footer settings={settings} text={`${settings.businessName} · Quote ${quote.number}`} />
      </Page>
    </Document>
  )
}

function InvoicePdf({ invoice, settings, logoData }: { invoice: Invoice; settings: BillingSettings; logoData: Buffer | null }) {
  const instructions = invoice.currency === "PKR" ? settings.pkrInstructions : settings.usdInstructions
  const extra: [string, string][] = invoice.paid > 0 ? [["Paid", money(invoice.paid, invoice.currency)], ["Balance due", money(invoice.balance, invoice.currency)]] : []
  return (
    <Document title={`Invoice ${invoice.number}`} author={settings.businessName}>
      <Page size="A4" style={s.page}>
        <Header
          kind={invoice.state === "paid" ? "INVOICE · PAID" : "INVOICE"}
          number={invoice.number}
          logoData={logoData}
          rows={[`Issued: ${longDate(invoice.issueDate)}`, `Due: ${longDate(invoice.dueDate)}`]}
        />
        <Parties settings={settings} billTo={invoice.billTo} />
        <Items items={invoice.items} currency={invoice.currency} discount={invoice.discount} extra={extra} />

        {invoice.payments.length > 0 && (
          <View style={s.section} wrap={false}>
            <Text style={s.label}>Payments received</Text>
            {invoice.payments.map((p) => (
              <View key={p.id} style={[s.totalRow, { borderBottom: `1 solid ${c.line}` }]}>
                <Text>
                  {longDate(p.date)} · {paymentMethodLabels[p.method]}
                  {p.reference ? ` · ${p.reference}` : ""}
                </Text>
                <Text>{money(p.amount, invoice.currency)}</Text>
              </View>
            ))}
          </View>
        )}

        {invoice.balance > 0 && instructions && (
          <View style={[s.section, s.box]} wrap={false}>
            <Text style={s.label}>How to pay</Text>
            {lines(instructions).map((line, i) => (
              <Text key={i}>{line}</Text>
            ))}
            <Text style={{ marginTop: 6 }}>Please use {invoice.number} as the payment reference.</Text>
          </View>
        )}

        {invoice.notes && (
          <View style={s.section}>
            <Text style={s.label}>Notes</Text>
            {lines(invoice.notes).map((line, i) => (
              <Text key={i}>{line}</Text>
            ))}
          </View>
        )}
        <Footer settings={settings} text={settings.invoiceFooter} />
      </Page>
    </Document>
  )
}

export async function quotePdf(quote: Quote, settings: BillingSettings) {
  return renderToBuffer(<QuotePdf quote={quote} settings={settings} logoData={await loadLogo()} />)
}

export async function invoicePdf(invoice: Invoice, settings: BillingSettings) {
  return renderToBuffer(<InvoicePdf invoice={invoice} settings={settings} logoData={await loadLogo()} />)
}
