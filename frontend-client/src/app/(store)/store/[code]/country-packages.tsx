"use client"

import { useState, useMemo } from "react"
import { Wifi, Clock, ShoppingCart, Minus, Plus, Zap, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useCartStore } from "@/stores/cart-store"
import { useCurrencyStore } from "@/stores/currency-store"
import { formatDataSize } from "@/lib/utils"
import { isUnlimitedPackage, getDataTypeLabel } from "@/types/location"
import type { EsimPackage } from "@/types/database"
import {
  calculateEffectivePrice,
  formatPriceWithDiscount,
  type PriceSchedule,
} from "@/lib/price-utils"
import { toast } from "sonner"

interface CountryPackagesProps {
  packages: EsimPackage[]
  countryName: string
  priceSchedules: PriceSchedule[]
}

export function CountryPackages({
  packages,
  countryName,
  priceSchedules,
}: CountryPackagesProps) {
  const currency = useCurrencyStore((state) => state.currency)
  const addItem = useCartStore((state) => state.addItem)

  // Separate packages into fixed and unlimited
  const { fixedPackages, unlimitedPackages } = useMemo(() => {
    const fixed: EsimPackage[] = []
    const unlimited: EsimPackage[] = []

    packages.forEach((pkg) => {
      if (isUnlimitedPackage(pkg.data_type)) {
        unlimited.push(pkg)
      } else {
        fixed.push(pkg)
      }
    })

    return { fixedPackages: fixed, unlimitedPackages: unlimited }
  }, [packages])

  // Calculate effective prices
  const packagePrices = useMemo(() => {
    const priceMap = new Map<string, ReturnType<typeof calculateEffectivePrice>>()
    packages.forEach((pkg) => {
      priceMap.set(
        pkg.id,
        calculateEffectivePrice(pkg.id, pkg.price_usd_cents, pkg.price_idr, priceSchedules)
      )
    })
    return priceMap
  }, [packages, priceSchedules])

  const handleAddToCart = (pkg: EsimPackage) => {
    addItem(pkg)
    toast.success(`${pkg.display_name || pkg.name} ditambahkan ke keranjang`)
  }

  const hasUnlimited = unlimitedPackages.length > 0
  const hasFixed = fixedPackages.length > 0

  // Default tab
  const defaultTab = hasFixed ? "fixed" : "unlimited"

  return (
    <div>
      {hasFixed && hasUnlimited ? (
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="fixed" className="gap-2">
              <Wifi className="h-4 w-4" />
              Paket Data Tetap
            </TabsTrigger>
            <TabsTrigger value="unlimited" className="gap-2">
              <Zap className="h-4 w-4" />
              Paket Unlimited/Harian
            </TabsTrigger>
          </TabsList>

          <TabsContent value="fixed">
            <FixedPackagesGrid
              packages={fixedPackages}
              packagePrices={packagePrices}
              currency={currency}
              onAddToCart={handleAddToCart}
            />
          </TabsContent>

          <TabsContent value="unlimited">
            <UnlimitedPackagesSection
              packages={unlimitedPackages}
              packagePrices={packagePrices}
              currency={currency}
              countryName={countryName}
            />
          </TabsContent>
        </Tabs>
      ) : hasFixed ? (
        <FixedPackagesGrid
          packages={fixedPackages}
          packagePrices={packagePrices}
          currency={currency}
          onAddToCart={handleAddToCart}
        />
      ) : hasUnlimited ? (
        <UnlimitedPackagesSection
          packages={unlimitedPackages}
          packagePrices={packagePrices}
          currency={currency}
          countryName={countryName}
        />
      ) : (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">
            Tidak ada paket tersedia untuk negara ini.
          </p>
        </div>
      )}
    </div>
  )
}

// Fixed Packages Grid Component
function FixedPackagesGrid({
  packages,
  packagePrices,
  currency,
  onAddToCart,
}: {
  packages: EsimPackage[]
  packagePrices: Map<string, ReturnType<typeof calculateEffectivePrice>>
  currency: "USD" | "IDR"
  onAddToCart: (pkg: EsimPackage) => void
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {packages.map((pkg) => {
        const effectivePrice = packagePrices.get(pkg.id)
        const formatted = effectivePrice
          ? formatPriceWithDiscount(effectivePrice, currency)
          : null

        return (
          <Card key={pkg.id} className="flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">
                  {pkg.display_name || pkg.name}
                </CardTitle>
                {pkg.is_bestseller && (
                  <Badge variant="destructive" className="text-xs">
                    Bestseller
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1 pb-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Wifi className="h-4 w-4 text-primary" />
                  <span className="font-medium">{formatDataSize(pkg.volume_bytes)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>
                    {pkg.duration} {pkg.duration_unit === "day" ? "Hari" : pkg.duration_unit}
                  </span>
                </div>
              </div>
              {/* Price */}
              {formatted && effectivePrice && (
                <div className="mt-4 pt-3 border-t">
                  {effectivePrice.hasDiscount && (
                    <p className="text-sm text-muted-foreground line-through">
                      {formatted.original}
                    </p>
                  )}
                  <p className="text-xl font-bold text-primary">{formatted.final}</p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={() => onAddToCart(pkg)}>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Tambah ke Keranjang
              </Button>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}

// Unlimited Packages Section with Day Selector
function UnlimitedPackagesSection({
  packages,
  packagePrices,
  currency,
  countryName,
}: {
  packages: EsimPackage[]
  packagePrices: Map<string, ReturnType<typeof calculateEffectivePrice>>
  currency: "USD" | "IDR"
  countryName: string
}) {
  // Group unlimited packages by data limit (e.g., 500MB/day, 1GB/day, 2GB/day, Unlimited)
  const groupedPackages = useMemo(() => {
    const groups = new Map<string, EsimPackage>()

    packages.forEach((pkg) => {
      // Extract the daily data limit from the name
      const dailyMatch = pkg.name.match(/(\d+(\.\d+)?)(GB|MB)\/Day/i)
      const key = dailyMatch ? `${dailyMatch[1]}${dailyMatch[3]}/Day` : "Unlimited"

      // Only keep one package per group (they should have same base price)
      if (!groups.has(key)) {
        groups.set(key, pkg)
      }
    })

    return Array.from(groups.entries()).map(([label, pkg]) => ({
      label,
      package: pkg,
    }))
  }, [packages])

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <p className="font-medium text-sm">Paket Harian Fleksibel</p>
            <p className="text-sm text-muted-foreground">
              Pilih jumlah hari sesuai kebutuhan Anda (1-365 hari). Harga akan
              dihitung berdasarkan jumlah hari yang dipilih.
            </p>
          </div>
        </div>
      </div>

      {/* Package Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {groupedPackages.map(({ label, package: pkg }) => (
          <UnlimitedPackageCard
            key={pkg.id}
            pkg={pkg}
            label={label}
            packagePrices={packagePrices}
            currency={currency}
            countryName={countryName}
          />
        ))}
      </div>
    </div>
  )
}

// Individual Unlimited Package Card with Day Selector
function UnlimitedPackageCard({
  pkg,
  label,
  packagePrices,
  currency,
  countryName,
}: {
  pkg: EsimPackage
  label: string
  packagePrices: Map<string, ReturnType<typeof calculateEffectivePrice>>
  currency: "USD" | "IDR"
  countryName: string
}) {
  const [days, setDays] = useState(7)
  const addItemWithPeriod = useCartStore((state) => state.addItemWithPeriod)

  // Calculate price based on days
  const pricePerDay = useMemo(() => {
    const effectivePrice = packagePrices.get(pkg.id)
    if (!effectivePrice) {
      return { usd: pkg.price_usd_cents, idr: pkg.price_idr }
    }
    return {
      usd: effectivePrice.finalUsdCents,
      idr: effectivePrice.finalIdr,
    }
  }, [pkg, packagePrices])

  const totalPrice = useMemo(() => {
    const total = currency === "USD"
      ? (pricePerDay.usd * days) / 10000
      : pricePerDay.idr * days

    return currency === "USD"
      ? `$${total.toFixed(2)}`
      : `Rp ${total.toLocaleString("id-ID")}`
  }, [pricePerDay, days, currency])

  const pricePerDayFormatted = useMemo(() => {
    return currency === "USD"
      ? `$${(pricePerDay.usd / 10000).toFixed(2)}`
      : `Rp ${pricePerDay.idr.toLocaleString("id-ID")}`
  }, [pricePerDay, currency])

  const handleDaysChange = (value: number[]) => {
    setDays(value[0])
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value)
    if (!isNaN(value) && value >= 1 && value <= 365) {
      setDays(value)
    }
  }

  const handleAddToCart = () => {
    // Use the new addItemWithPeriod function
    addItemWithPeriod(pkg, days)
    toast.success(`${label} ${countryName} (${days} hari) ditambahkan ke keranjang`)
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <Badge variant="secondary" className="mb-2">
              {getDataTypeLabel(pkg.data_type)}
            </Badge>
            <CardTitle className="text-lg">{label}</CardTitle>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>
                  {pkg.data_type === 2 && "Kecepatan berkurang setelah batas harian tercapai"}
                  {pkg.data_type === 3 && "Layanan berhenti setelah batas harian tercapai"}
                  {pkg.data_type === 4 && "Data unlimited tanpa batasan harian"}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <p className="text-sm text-muted-foreground">
          {pricePerDayFormatted}/hari
        </p>
      </CardHeader>

      <CardContent className="flex-1 pb-3">
        {/* Day Selector */}
        <div className="space-y-4">
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
          <div className="flex flex-wrap gap-2">
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
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">Total ({days} hari)</span>
            <span className="text-2xl font-bold text-primary">{totalPrice}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <Button className="w-full" onClick={handleAddToCart}>
          <ShoppingCart className="mr-2 h-4 w-4" />
          Tambah ke Keranjang
        </Button>
      </CardFooter>
    </Card>
  )
}
