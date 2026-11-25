"use client"

import { createContext, useContext, useEffect, useState } from "react"
import type { Currency } from "@/data/pricing"
import type { Market } from "@/data/pricing-uk"

type VisitorContextValue = {
  // The market the visitor is looking at: Pakistan, international or UK.
  market: Market
  setMarket: (market: Market) => void
  // PKR or USD for the existing price components. The UK market has its own
  // components, so it reads as USD here.
  currency: Currency
  // ISO country code from the visitor's IP, or null if unknown.
  country: string | null
}

const VisitorContext = createContext<VisitorContextValue>({
  market: "USD",
  setMarket: () => {},
  currency: "USD",
  country: null,
})

const STORAGE_KEY = "cm-currency"

const isMarket = (value: string | null): value is Market => value === "PKR" || value === "USD" || value === "GBP"

// The market a country starts on, unless the visitor has already chosen one.
const marketFor = (country: string | null): Market => (country === "PK" ? "PKR" : country === "GB" ? "GBP" : "USD")

export function VisitorProvider({ children }: { children: React.ReactNode }) {
  const [market, setMarketState] = useState<Market>("USD")
  const [country, setCountry] = useState<string | null>(null)

  useEffect(() => {
    let saved: string | null = null
    try {
      saved = localStorage.getItem(STORAGE_KEY)
    } catch {}
    if (isMarket(saved)) setMarketState(saved)

    fetch("/api/geo")
      .then((res) => res.json())
      .then(({ country }: { country: string | null }) => {
        setCountry(country)
        if (!isMarket(saved)) setMarketState(marketFor(country))
      })
      .catch(() => {})
  }, [])

  const setMarket = (next: Market) => {
    setMarketState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {}
  }

  return (
    <VisitorContext.Provider value={{ market, setMarket, currency: market === "GBP" ? "USD" : market, country }}>
      {children}
    </VisitorContext.Provider>
  )
}

export const useVisitor = () => useContext(VisitorContext)
