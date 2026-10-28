"use client"

import { useMemo, useState, useTransition } from "react"
import { buildPackageIds, carePlanIds, customQuoteIds } from "@/data/pricing"
import type { PricingContent, PricingPackage } from "@/lib/content-schema"
import { savePricingAction } from "@/app/admin/actions/content"
import type { SaveResult } from "@/app/admin/actions/types"
import { Field, SaveBar, inputClass, linesToList, toNumberOrNull } from "@/components/admin/fields"

// Form state keeps numbers and lists as text so fields can be edited freely.
type PackageForm = {
  id: string
  name: string
  audience: string
  pkr: string
  usd: string
  unit: PricingPackage["unit"]
  popular: boolean
  features: string
  notIncluded: string
  minDays: string
  maxDays: string
  revisions: string
}

type SettingsForm = {
  split: string
  pkrMethods: string
  usdMethods: string
  hostingNote: string
  priceFactors: string
  notIncludedAnywhere: string
}

const text = (value: number | null) => (value === null ? "" : String(value))

const toPackageForm = (pkg: PricingPackage): PackageForm => ({
  id: pkg.id,
  name: pkg.name,
  audience: pkg.audience,
  pkr: text(pkg.priceFrom.PKR),
  usd: text(pkg.priceFrom.USD),
  unit: pkg.unit,
  popular: Boolean(pkg.popular),
  features: pkg.features.join("\n"),
  notIncluded: pkg.notIncluded.join("\n"),
  minDays: text(pkg.deliveryDays?.[0] ?? null),
  maxDays: text(pkg.deliveryDays?.[1] ?? null),
  revisions: text(pkg.revisions),
})

const fromPackageForm = (form: PackageForm): PricingPackage => {
  const min = toNumberOrNull(form.minDays)
  const max = toNumberOrNull(form.maxDays)
  return {
    id: form.id,
    name: form.name,
    audience: form.audience,
    priceFrom: { PKR: toNumberOrNull(form.pkr), USD: toNumberOrNull(form.usd) },
    unit: form.unit,
    ...(form.popular && { popular: true }),
    features: linesToList(form.features),
    notIncluded: linesToList(form.notIncluded),
    // Both or neither: a half-filled range is sent as-is and fails validation.
    deliveryDays: min === null && max === null ? null : ([min ?? NaN, max ?? NaN] as [number, number]),
    revisions: toNumberOrNull(form.revisions),
  }
}

const toSettingsForm = ({ settings }: PricingContent): SettingsForm => ({
  split: settings.paymentTerms.split,
  pkrMethods: settings.paymentTerms.methods.PKR,
  usdMethods: settings.paymentTerms.methods.USD,
  hostingNote: settings.hostingNote,
  priceFactors: settings.priceFactors.join("\n"),
  notIncludedAnywhere: settings.notIncludedAnywhere.join("\n"),
})

const groups = [
  { title: "Website & store packages", hint: "Shown on /pricing, the homepage and service pages.", ids: buildPackageIds },
  { title: "Custom quote services", hint: "Leave both prices empty to show \"Custom quote\".", ids: customQuoteIds },
  { title: "Care plans", hint: "Monthly prices.", ids: carePlanIds },
]

export function PricingEditor({ initial, canSave }: { initial: PricingContent; canSave: boolean }) {
  const [packages, setPackages] = useState(() => initial.packages.map(toPackageForm))
  const [settings, setSettings] = useState(() => toSettingsForm(initial))
  const [saved, setSaved] = useState(() => JSON.stringify({ packages, settings }))
  const [result, setResult] = useState<SaveResult | null>(null)
  const [saving, startSaving] = useTransition()

  const dirty = useMemo(() => JSON.stringify({ packages, settings }) !== saved, [packages, settings, saved])

  const updatePackage = (id: string, patch: Partial<PackageForm>) =>
    setPackages((list) => list.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  const updateSettings = (patch: Partial<SettingsForm>) => setSettings((s) => ({ ...s, ...patch }))

  const save = () => {
    const content: PricingContent = {
      packages: packages.map(fromPackageForm),
      settings: {
        paymentTerms: { split: settings.split, methods: { PKR: settings.pkrMethods, USD: settings.usdMethods } },
        hostingNote: settings.hostingNote,
        priceFactors: linesToList(settings.priceFactors),
        notIncludedAnywhere: linesToList(settings.notIncludedAnywhere),
      },
    }
    startSaving(async () => {
      const outcome = await savePricingAction(content)
      setResult(outcome)
      if (outcome.ok) setSaved(JSON.stringify({ packages, settings }))
    })
  }

  return (
    <div className="space-y-12">
      {groups.map((group) => (
        <section key={group.title}>
          <h2 className="font-heading font-bold text-xl text-forest">{group.title}</h2>
          <p className="text-sm text-charcoal/80 mb-5">{group.hint}</p>
          <div className="space-y-5">
            {packages
              .filter((p) => group.ids.includes(p.id))
              .map((pkg) => (
                <fieldset key={pkg.id} className="rounded-2xl border border-sage/25 bg-white p-5 sm:p-6">
                  <legend className="px-2 font-heading font-semibold text-forest">{pkg.name || pkg.id}</legend>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Name">
                      <input className={inputClass} value={pkg.name} onChange={(e) => updatePackage(pkg.id, { name: e.target.value })} />
                    </Field>
                    <Field label="Who it's for">
                      <input className={inputClass} value={pkg.audience} onChange={(e) => updatePackage(pkg.id, { audience: e.target.value })} />
                    </Field>
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Price from (PKR)" hint="Empty = Custom quote">
                        <input className={inputClass} inputMode="numeric" value={pkg.pkr} onChange={(e) => updatePackage(pkg.id, { pkr: e.target.value.replace(/[^\d]/g, "") })} />
                      </Field>
                      <Field label="Price from (USD)" hint="Empty = Custom quote">
                        <input className={inputClass} inputMode="numeric" value={pkg.usd} onChange={(e) => updatePackage(pkg.id, { usd: e.target.value.replace(/[^\d]/g, "") })} />
                      </Field>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <Field label="Min days">
                        <input className={inputClass} inputMode="numeric" value={pkg.minDays} onChange={(e) => updatePackage(pkg.id, { minDays: e.target.value.replace(/[^\d]/g, "") })} />
                      </Field>
                      <Field label="Max days">
                        <input className={inputClass} inputMode="numeric" value={pkg.maxDays} onChange={(e) => updatePackage(pkg.id, { maxDays: e.target.value.replace(/[^\d]/g, "") })} />
                      </Field>
                      <Field label="Revisions">
                        <input className={inputClass} inputMode="numeric" value={pkg.revisions} onChange={(e) => updatePackage(pkg.id, { revisions: e.target.value.replace(/[^\d]/g, "") })} />
                      </Field>
                    </div>
                    <Field label="What's included" hint="One per line">
                      <textarea rows={6} className={inputClass} value={pkg.features} onChange={(e) => updatePackage(pkg.id, { features: e.target.value })} />
                    </Field>
                    <Field label="Not included" hint="One per line">
                      <textarea rows={6} className={inputClass} value={pkg.notIncluded} onChange={(e) => updatePackage(pkg.id, { notIncluded: e.target.value })} />
                    </Field>
                    <div className="flex flex-wrap items-center gap-6 md:col-span-2">
                      <Field label="Billing" className="w-48">
                        <select className={inputClass} value={pkg.unit} onChange={(e) => updatePackage(pkg.id, { unit: e.target.value as PackageForm["unit"] })}>
                          <option value="one-time">One-time</option>
                          <option value="monthly">Monthly</option>
                        </select>
                      </Field>
                      <label className="inline-flex items-center gap-2 text-sm font-semibold text-forest mt-6">
                        <input type="checkbox" className="w-4 h-4 accent-forest" checked={pkg.popular} onChange={(e) => updatePackage(pkg.id, { popular: e.target.checked })} />
                        Mark as &quot;Most popular&quot;
                      </label>
                    </div>
                  </div>
                </fieldset>
              ))}
          </div>
        </section>
      ))}

      <section>
        <h2 className="font-heading font-bold text-xl text-forest">Payment terms & notes</h2>
        <p className="text-sm text-charcoal/80 mb-5">Used on /pricing, /about, /terms and in the FAQs.</p>
        <fieldset className="rounded-2xl border border-sage/25 bg-white p-5 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <legend className="sr-only">Payment terms and notes</legend>
          <Field label="Payment split">
            <input className={inputClass} value={settings.split} onChange={(e) => updateSettings({ split: e.target.value })} />
          </Field>
          <Field label="Payment methods (PKR)">
            <input className={inputClass} value={settings.pkrMethods} onChange={(e) => updateSettings({ pkrMethods: e.target.value })} />
          </Field>
          <Field label="Payment methods (USD)">
            <input className={inputClass} value={settings.usdMethods} onChange={(e) => updateSettings({ usdMethods: e.target.value })} />
          </Field>
          <Field label="What hosting covers" className="md:col-span-3">
            <textarea rows={3} className={inputClass} value={settings.hostingNote} onChange={(e) => updateSettings({ hostingNote: e.target.value })} />
          </Field>
          <Field label="What affects the price" hint="One per line" className="md:col-span-1">
            <textarea rows={6} className={inputClass} value={settings.priceFactors} onChange={(e) => updateSettings({ priceFactors: e.target.value })} />
          </Field>
          <Field label="Not included (all packages)" hint="One per line" className="md:col-span-2">
            <textarea rows={6} className={inputClass} value={settings.notIncludedAnywhere} onChange={(e) => updateSettings({ notIncludedAnywhere: e.target.value })} />
          </Field>
        </fieldset>
      </section>

      <SaveBar dirty={dirty} saving={saving} disabled={!canSave} result={result} onSave={save} />
    </div>
  )
}
