import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

export type CurrencyCode = "USD" | "IDR"

interface CurrencyState {
  currency: CurrencyCode
  setCurrency: (currency: CurrencyCode) => void
}

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set) => ({
      currency: "USD", // Default to USD (checkout ready)
      setCurrency: (currency: CurrencyCode) => set({ currency }),
    }),
    {
      name: "hiroam-currency",
      storage: createJSONStorage(() => localStorage),
    }
  )
)

// Helper function to get price based on currency
export function getPrice(
  priceUsdCents: number,
  priceIdr: number,
  currency: CurrencyCode
): number {
  if (currency === "USD") {
    // USD stored in esim-access format (1 USD = 10000), convert to dollars
    return priceUsdCents / 10000
  }
  // IDR stored as full value
  return priceIdr
}

// Helper to format price with correct currency
export function formatPriceForCurrency(
  priceUsdCents: number,
  priceIdr: number,
  currency: CurrencyCode
): string {
  const amount = getPrice(priceUsdCents, priceIdr, currency)

  if (currency === "USD") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount)
}
