"use client"

import { useEffect, useState } from "react"
import { DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useCurrencyStore, type CurrencyCode } from "@/stores/currency-store"
import { useCartStore } from "@/stores/cart-store"
import { toast } from "sonner"

const currencies: { code: CurrencyCode; label: string; flag: string }[] = [
  { code: "USD", label: "USD", flag: "🇺🇸" },
  { code: "IDR", label: "IDR", flag: "🇮🇩" },
]

export function CurrencySwitcher() {
  const [mounted, setMounted] = useState(false)
  const { currency, setCurrency } = useCurrencyStore()
  const { isCouponValidForCurrency, promoCode, removePromo } = useCartStore()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleCurrencyChange = (newCurrency: CurrencyCode) => {
    // Check if there's an applied coupon that won't be valid for the new currency
    if (promoCode && !isCouponValidForCurrency(newCurrency)) {
      toast.warning(`Kode promo "${promoCode}" tidak berlaku untuk ${newCurrency}. Kupon akan dihapus.`)
      removePromo()
    }

    setCurrency(newCurrency)
    toast.success(`Mata uang diubah ke ${newCurrency}`)
  }

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <DollarSign className="h-4 w-4 mr-1" />
        <span className="text-sm">---</span>
      </Button>
    )
  }

  const currentCurrency = currencies.find((c) => c.code === currency)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1">
          <span className="text-base">{currentCurrency?.flag}</span>
          <span className="text-sm font-medium">{currency}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {currencies.map((curr) => (
          <DropdownMenuItem
            key={curr.code}
            onClick={() => handleCurrencyChange(curr.code)}
            className={currency === curr.code ? "bg-muted" : ""}
          >
            <span className="mr-2">{curr.flag}</span>
            {curr.label}
            {curr.code === "IDR" && (
              <span className="ml-2 text-xs text-muted-foreground">(Segera)</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
