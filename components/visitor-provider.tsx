"use client"

import { createContext, useContext, useEffect, useState } from "react"
import type { Currency } from "@/data/pricing"

type VisitorContextValue = {
  currency: Currency
  setCurrency: (currency: Currency) => void
  // ISO country code from the visitor's IP, or null if unknown.
  country: string | null
}

const VisitorContext = createContext<VisitorContextValue>({
  currency: "USD",
  setCurrency: () => {},
  country: null,
})

const STORAGE_KEY = "cm-currency"

export function VisitorProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>("USD")
  const [country, setCountry] = useState<string | null>(null)

  useEffect(() => {
    let saved: string | null = null
    try {
      saved = localStorage.getItem(STORAGE_KEY)
    } catch {}
    if (saved === "PKR" || saved === "USD") setCurrencyState(saved)

    fetch("/api/geo")
      .then((res) => res.json())
      .then(({ country }: { country: string | null }) => {
        setCountry(country)
        if (!saved) setCurrencyState(country === "PK" ? "PKR" : "USD")
      })
      .catch(() => {})
  }, [])

  const setCurrency = (next: Currency) => {
    setCurrencyState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {}
  }

  return <VisitorContext.Provider value={{ currency, setCurrency, country }}>{children}</VisitorContext.Provider>
}

export const useVisitor = () => useContext(VisitorContext)
