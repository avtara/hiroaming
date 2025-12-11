"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ShoppingCart, Check, Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { useCartStore } from "@/stores/cart-store"
import { useCurrencyStore, formatPriceForCurrency } from "@/stores/currency-store"
import { toast } from "sonner"
import { isUnlimitedPackage, getDataTypeLabel } from "@/types/location"
import type { EsimPackage } from "@/types/database"

interface AddToCartButtonProps {
  pkg: EsimPackage
}

export function AddToCartButton({ pkg }: AddToCartButtonProps) {
  const [isAdded, setIsAdded] = useState(false)
  const [days, setDays] = useState(7)
  const router = useRouter()
  const { addItem, addItemWithPeriod, items } = useCartStore()
  const currency = useCurrencyStore((state) => state.currency)

  const isUnlimited = isUnlimitedPackage(pkg.data_type)

  // Check if already in cart (for unlimited, check if same package with any periodNum)
  const isInCart = items.some((item) =>
    item.package.id === pkg.id && (!isUnlimited || item.periodNum === days)
  )

  // Calculate total price for unlimited packages
  const totalPrice = isUnlimited
    ? currency === "USD"
      ? (pkg.price_usd_cents * days) / 10000
      : pkg.price_idr * days
    : currency === "USD"
      ? pkg.price_usd_cents / 10000
      : pkg.price_idr

  const totalPriceFormatted = currency === "USD"
    ? `$${totalPrice.toFixed(2)}`
    : `Rp ${totalPrice.toLocaleString("id-ID")}`

  const pricePerDayFormatted = currency === "USD"
    ? `$${(pkg.price_usd_cents / 10000).toFixed(2)}`
    : `Rp ${pkg.price_idr.toLocaleString("id-ID")}`

  const handleAddToCart = () => {
    if (isUnlimited) {
      addItemWithPeriod(pkg, days)
      toast.success(`${pkg.display_name || pkg.name} (${days} hari) ditambahkan ke keranjang`)
    } else {
      addItem(pkg)
      toast.success("Berhasil ditambahkan ke keranjang")
    }
    setIsAdded(true)

    setTimeout(() => {
      setIsAdded(false)
    }, 2000)
  }

  const handleGoToCart = () => {
    router.push("/cart")
  }

  const handleDaysChange = (value: number[]) => {
    setDays(value[0])
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value)
    if (!isNaN(value) && value >= 1 && value <= 365) {
      setDays(value)
    }
  }

  // Render for unlimited packages with day selector
  if (isUnlimited) {
    return (
      <div className="space-y-4">
        {/* Data Type Badge */}
        <div className="flex items-center justify-center">
          <Badge variant="secondary" className="text-sm">
            {getDataTypeLabel(pkg.data_type)}
          </Badge>
        </div>

        {/* Price per day */}
        <div className="text-center text-sm text-muted-foreground">
          Harga: {pricePerDayFormatted}/hari
        </div>

        {/* Day Selector */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Jumlah Hari</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setDays(Math.max(1, days - 1))}
                disabled={days <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                type="number"
                value={days}
                onChange={handleInputChange}
                className="w-16 h-8 text-center"
                min={1}
                max={365}
              />
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setDays(Math.min(365, days + 1))}
                disabled={days >= 365}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Slider */}
          <Slider
            value={[days]}
            onValueChange={handleDaysChange}
            min={1}
            max={365}
            step={1}
            className="w-full"
          />

          {/* Quick Select Buttons */}
          <div className="flex flex-wrap gap-2 justify-center">
            {[3, 7, 14, 30].map((d) => (
              <Button
                key={d}
                variant={days === d ? "default" : "outline"}
                size="sm"
                onClick={() => setDays(d)}
                className="text-xs"
              >
                {d} hari
              </Button>
            ))}
          </div>
        </div>

        {/* Total Price */}
        <div className="pt-3 border-t">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">Total ({days} hari)</span>
            <span className="text-xl font-bold text-primary">{totalPriceFormatted}</span>
          </div>
        </div>

        {/* Add to Cart / View Cart Button */}
        {isInCart ? (
          <div className="space-y-2">
            <Button className="w-full" variant="outline" disabled>
              <Check className="mr-2 h-4 w-4" />
              Sudah di Keranjang ({days} hari)
            </Button>
            <Button className="w-full" onClick={handleGoToCart}>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Lihat Keranjang
            </Button>
          </div>
        ) : (
          <Button
            className="w-full"
            size="lg"
            onClick={handleAddToCart}
            disabled={isAdded}
          >
            {isAdded ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Ditambahkan!
              </>
            ) : (
              <>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Tambah ke Keranjang
              </>
            )}
          </Button>
        )}
      </div>
    )
  }

  // Render for fixed packages (original behavior)
  if (isInCart) {
    return (
      <div className="space-y-2">
        <Button className="w-full" variant="outline" disabled>
          <Check className="mr-2 h-4 w-4" />
          Sudah di Keranjang
        </Button>
        <Button className="w-full" onClick={handleGoToCart}>
          <ShoppingCart className="mr-2 h-4 w-4" />
          Lihat Keranjang
        </Button>
      </div>
    )
  }

  return (
    <Button
      className="w-full"
      size="lg"
      onClick={handleAddToCart}
      disabled={isAdded}
    >
      {isAdded ? (
        <>
          <Check className="mr-2 h-4 w-4" />
          Ditambahkan!
        </>
      ) : (
        <>
          <ShoppingCart className="mr-2 h-4 w-4" />
          Tambah ke Keranjang
        </>
      )}
    </Button>
  )
}
