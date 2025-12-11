"use client"

import { useState, useEffect, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  calculateEffectivePrice,
  type PriceSchedule,
  type EffectivePrice,
} from "@/lib/price-utils"
import type { EsimPackage } from "@/types/database"

interface UsePriceSchedulesReturn {
  priceSchedules: PriceSchedule[]
  isLoading: boolean
  error: Error | null
  getEffectivePriceForPackage: (pkg: EsimPackage) => EffectivePrice
  getEffectivePricesForPackages: (packages: EsimPackage[]) => Map<string, EffectivePrice>
}

/**
 * Hook to fetch active price schedules and calculate effective prices
 * Automatically refetches when schedules might have changed
 */
export function usePriceSchedules(): UsePriceSchedulesReturn {
  const [priceSchedules, setPriceSchedules] = useState<PriceSchedule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let isMounted = true

    const fetchPriceSchedules = async () => {
      try {
        const supabase = createClient()
        const now = new Date().toISOString()

        const { data, error: fetchError } = await supabase
          .from("price_schedules")
          .select("*")
          .eq("is_active", true)
          .lte("starts_at", now)
          .gte("ends_at", now)
          .order("priority", { ascending: false })

        if (fetchError) {
          throw new Error(fetchError.message)
        }

        if (isMounted) {
          setPriceSchedules((data as PriceSchedule[]) || [])
          setError(null)
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error("Failed to fetch price schedules"))
          console.error("Error fetching price schedules:", err)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchPriceSchedules()

    // Refetch every 5 minutes to catch schedule changes
    const interval = setInterval(fetchPriceSchedules, 5 * 60 * 1000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  const getEffectivePriceForPackage = useMemo(() => {
    return (pkg: EsimPackage): EffectivePrice => {
      return calculateEffectivePrice(
        pkg.id,
        pkg.price_usd_cents,
        pkg.price_idr,
        priceSchedules
      )
    }
  }, [priceSchedules])

  const getEffectivePricesForPackages = useMemo(() => {
    return (packages: EsimPackage[]): Map<string, EffectivePrice> => {
      const priceMap = new Map<string, EffectivePrice>()
      for (const pkg of packages) {
        priceMap.set(
          pkg.id,
          calculateEffectivePrice(pkg.id, pkg.price_usd_cents, pkg.price_idr, priceSchedules)
        )
      }
      return priceMap
    }
  }, [priceSchedules])

  return {
    priceSchedules,
    isLoading,
    error,
    getEffectivePriceForPackage,
    getEffectivePricesForPackages,
  }
}

/**
 * Get total with effective prices for cart items
 * @param items - Cart items including package, quantity, and optional periodNum for daily/unlimited packages
 * @param priceSchedules - Active price schedules for discounts
 * @param currency - Currency code (USD or IDR)
 */
export function calculateCartTotals(
  items: Array<{ package: EsimPackage; quantity: number; periodNum?: number }>,
  priceSchedules: PriceSchedule[],
  currency: "USD" | "IDR"
): {
  subtotal: number
  originalSubtotal: number
  scheduleDiscount: number
  hasScheduleDiscount: boolean
} {
  let subtotal = 0
  let originalSubtotal = 0

  for (const item of items) {
    const effectivePrice = calculateEffectivePrice(
      item.package.id,
      item.package.price_usd_cents,
      item.package.price_idr,
      priceSchedules
    )

    // For daily/unlimited packages, multiply by periodNum (number of days selected)
    const periodMultiplier = item.periodNum || 1
    const totalMultiplier = item.quantity * periodMultiplier

    if (currency === "USD") {
      subtotal += (effectivePrice.finalUsdCents / 10000) * totalMultiplier // esim-access format
      originalSubtotal += (effectivePrice.originalUsdCents / 10000) * totalMultiplier // esim-access format
    } else {
      subtotal += effectivePrice.finalIdr * totalMultiplier
      originalSubtotal += effectivePrice.originalIdr * totalMultiplier
    }
  }

  return {
    subtotal,
    originalSubtotal,
    scheduleDiscount: originalSubtotal - subtotal,
    hasScheduleDiscount: originalSubtotal > subtotal,
  }
}
