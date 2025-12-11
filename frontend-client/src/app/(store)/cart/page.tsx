"use client"

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, AlertTriangle, Percent, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useCartStore } from "@/stores/cart-store"
import { useCurrencyStore, formatPriceForCurrency } from "@/stores/currency-store"
import { formatDataSize } from "@/lib/utils"
import { toast } from "sonner"
import { usePriceSchedules, calculateCartTotals } from "@/hooks/use-price-schedules"
import { formatPriceWithDiscount } from "@/lib/price-utils"
import { isUnlimitedPackage, getDataTypeLabel } from "@/types/location"

export default function CartPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const {
    items,
    removeItem,
    updateQuantity,
    getDiscountAmount,
    promoCode,
    isCouponValidForCurrency,
    clearCart,
  } = useCartStore()
  const currency = useCurrencyStore((state) => state.currency)
  const { priceSchedules, getEffectivePriceForPackage } = usePriceSchedules()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Calculate totals with effective prices
  const cartTotals = useMemo(() => {
    return calculateCartTotals(items, priceSchedules, currency)
  }, [items, priceSchedules, currency])

  // Get effective prices for each item
  const itemPrices = useMemo(() => {
    const prices = new Map<string, ReturnType<typeof getEffectivePriceForPackage>>()
    for (const item of items) {
      prices.set(item.package.id, getEffectivePriceForPackage(item.package))
    }
    return prices
  }, [items, getEffectivePriceForPackage])

  const handleCheckout = () => {
    if (currency === "IDR") {
      toast.info("Fitur pembayaran IDR akan segera tersedia. Silakan gunakan USD untuk saat ini.")
      return
    }
    router.push("/checkout")
  }

  if (!mounted) {
    return null
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center text-center">
          <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Keranjang Kosong</h1>
          <p className="text-muted-foreground mb-6">
            Anda belum menambahkan paket eSIM ke keranjang.
          </p>
          <Button asChild>
            <Link href="/store">Jelajahi Paket</Link>
          </Button>
        </div>
      </div>
    )
  }

  // Use effective prices for totals
  const { subtotal, originalSubtotal, scheduleDiscount, hasScheduleDiscount } = cartTotals
  const couponDiscount = getDiscountAmount(currency)
  const isCouponValid = isCouponValidForCurrency(currency)
  const validCouponDiscount = isCouponValid ? couponDiscount : 0
  const total = Math.max(0, subtotal - validCouponDiscount)

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Keranjang Belanja</h1>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        {item.package.category && (
                          <Badge variant="secondary" className="mb-1">
                            {item.package.category}
                          </Badge>
                        )}
                        <h3 className="font-semibold">{item.package.display_name || item.package.name}</h3>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-sm text-muted-foreground">
                      <span>{formatDataSize(item.package.volume_bytes)}</span>
                      <span>•</span>
                      {item.periodNum ? (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {item.periodNum} Hari
                        </span>
                      ) : (
                        <span>
                          {item.package.duration}{" "}
                          {item.package.duration_unit === "day" ? "Hari" : item.package.duration_unit || "Hari"}
                        </span>
                      )}
                      {isUnlimitedPackage(item.package.data_type) && (
                        <>
                          <span>•</span>
                          <Badge variant="secondary" className="text-xs">
                            {getDataTypeLabel(item.package.data_type)}
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Quantity */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Price */}
                    <div className="text-right min-w-[100px]">
                      {(() => {
                        const effectivePrice = itemPrices.get(item.package.id)
                        if (!effectivePrice) return null
                        const formatted = formatPriceWithDiscount(effectivePrice, currency)
                        // For daily packages, multiply by periodNum
                        const periodMultiplier = item.periodNum || 1
                        const totalMultiplier = item.quantity * periodMultiplier

                        return (
                          <>
                            {effectivePrice.hasDiscount && (
                              <p className="text-xs text-muted-foreground line-through">
                                {formatPriceForCurrency(
                                  effectivePrice.originalUsdCents * totalMultiplier,
                                  effectivePrice.originalIdr * totalMultiplier,
                                  currency
                                )}
                              </p>
                            )}
                            <p className="font-semibold">
                              {formatPriceForCurrency(
                                effectivePrice.finalUsdCents * totalMultiplier,
                                effectivePrice.finalIdr * totalMultiplier,
                                currency
                              )}
                            </p>
                            {(item.quantity > 1 || item.periodNum) && (
                              <p className="text-xs text-muted-foreground">
                                {formatted.final}{item.periodNum ? "/hari" : ""} {item.quantity > 1 ? `x${item.quantity}` : ""}
                              </p>
                            )}
                            {effectivePrice.hasDiscount && effectivePrice.badgeText && (
                              <Badge
                                variant="secondary"
                                className="text-xs mt-1"
                                style={effectivePrice.badgeColor ? { backgroundColor: effectivePrice.badgeColor, color: "white" } : undefined}
                              >
                                {effectivePrice.badgeText}
                              </Badge>
                            )}
                          </>
                        )
                      })()}
                    </div>

                    {/* Remove */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        removeItem(item.id)
                        toast.success("Item dihapus dari keranjang")
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              clearCart()
              toast.success("Keranjang dikosongkan")
            }}
          >
            Kosongkan Keranjang
          </Button>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Ringkasan Pesanan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Currency Warning for Coupon */}
              {promoCode && !isCouponValid && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Kupon "{promoCode}" tidak berlaku untuk mata uang {currency}.
                    Ganti mata uang atau hapus kupon.
                  </AlertDescription>
                </Alert>
              )}

              {/* IDR Warning */}
              {currency === "IDR" && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Pembayaran dengan IDR akan segera tersedia. Saat ini hanya USD yang didukung.
                  </AlertDescription>
                </Alert>
              )}

              {/* Summary */}
              <div className="space-y-2">
                {/* Original subtotal if there's schedule discount */}
                {hasScheduleDiscount && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Harga Normal</span>
                    <span className="line-through">
                      {currency === "USD"
                        ? formatPriceForCurrency(originalSubtotal * 10000, 0, "USD")
                        : formatPriceForCurrency(0, originalSubtotal, "IDR")
                      }
                    </span>
                  </div>
                )}
                {/* Schedule discount */}
                {hasScheduleDiscount && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span className="flex items-center gap-1">
                      <Percent className="h-3 w-3" />
                      Diskon Promo
                    </span>
                    <span>
                      -{currency === "USD"
                        ? formatPriceForCurrency(scheduleDiscount * 10000, 0, "USD")
                        : formatPriceForCurrency(0, scheduleDiscount, "IDR")
                      }
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>
                    {currency === "USD"
                      ? formatPriceForCurrency(subtotal * 10000, 0, "USD")
                      : formatPriceForCurrency(0, subtotal, "IDR")
                    }
                  </span>
                </div>
                {validCouponDiscount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Kupon ({promoCode})</span>
                    <span>-{currency === "USD"
                      ? formatPriceForCurrency(validCouponDiscount * 10000, 0, "USD")
                      : formatPriceForCurrency(0, validCouponDiscount, "IDR")
                    }</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span className="text-lg text-primary">
                    {currency === "USD"
                      ? formatPriceForCurrency(total * 10000, 0, "USD")
                      : formatPriceForCurrency(0, total, "IDR")
                    }
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button
                className="w-full"
                size="lg"
                onClick={handleCheckout}
                disabled={currency === "IDR"}
              >
                {currency === "IDR" ? (
                  "Fitur Segera Tersedia"
                ) : (
                  <>
                    Lanjut ke Pembayaran
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/store">Lanjut Belanja</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
