"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { Search, Globe, MapPin, Sparkles, ChevronRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useCurrencyStore } from "@/stores/currency-store"
import type {
  LocationWithPackageCount,
  RegionWithPackageCount,
} from "@/services/locations"
import { filterLocations } from "@/lib/locations"

interface StoreContentProps {
  countries: LocationWithPackageCount[]
  regions: RegionWithPackageCount[]
}

function formatMinPrice(priceUsdCents: number, priceIdr: number, currency: "USD" | "IDR"): string {
  if (currency === "USD") {
    // esim-access format: 10000 = $1
    const dollars = priceUsdCents / 10000
    return `$${dollars.toFixed(2)}`
  }
  return `Rp ${priceIdr.toLocaleString("id-ID")}`
}

export function StoreContent({ countries, regions }: StoreContentProps) {
  const [search, setSearch] = useState("")
  const currency = useCurrencyStore((state) => state.currency)

  // Filter countries and regions based on search
  const filteredCountries = useMemo(() => {
    return filterLocations(countries, search)
  }, [countries, search])

  const filteredRegions = useMemo(() => {
    return filterLocations(regions, search)
  }, [regions, search])

  // Get popular countries
  const popularCountries = useMemo(() => {
    return countries.filter((c) => c.popular).slice(0, 12)
  }, [countries])

  // Group countries by first letter for alphabet navigation
  const countriesByLetter = useMemo(() => {
    const grouped: Record<string, LocationWithPackageCount[]> = {}
    filteredCountries.forEach((country) => {
      const letter = country.name.charAt(0).toUpperCase()
      if (!grouped[letter]) {
        grouped[letter] = []
      }
      grouped[letter].push(country)
    })
    return grouped
  }, [filteredCountries])

  const alphabet = Object.keys(countriesByLetter).sort()

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold md:text-4xl">Pilih Destinasi</h1>
        <p className="mt-2 text-muted-foreground">
          Pilih negara atau wilayah untuk menemukan paket eSIM terbaik
        </p>
      </div>

      {/* Search */}
      <div className="mb-8">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari negara atau wilayah..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-12 text-lg"
          />
        </div>
      </div>

      {/* Show search results if searching */}
      {search ? (
        <div className="space-y-8">
          {/* Filtered Regions */}
          {filteredRegions.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Wilayah ({filteredRegions.length})
              </h2>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {filteredRegions.map((region) => (
                  <RegionCard
                    key={region.code}
                    region={region}
                    currency={currency}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Filtered Countries */}
          {filteredCountries.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Negara ({filteredCountries.length})
              </h2>
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {filteredCountries.map((country) => (
                  <CountryCard
                    key={country.code}
                    country={country}
                    currency={currency}
                  />
                ))}
              </div>
            </section>
          )}

          {/* No results */}
          {filteredRegions.length === 0 && filteredCountries.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-lg text-muted-foreground">
                Tidak ada destinasi yang ditemukan untuk &quot;{search}&quot;
              </p>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Popular Destinations */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              Destinasi Populer
            </h2>
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {popularCountries.map((country) => (
                <CountryCard
                  key={country.code}
                  country={country}
                  currency={currency}
                  featured
                />
              ))}
            </div>
          </section>

          {/* Regions */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Paket Regional
            </h2>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {regions.map((region) => (
                <RegionCard
                  key={region.code}
                  region={region}
                  currency={currency}
                />
              ))}
            </div>
          </section>

          {/* All Countries by Letter */}
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Semua Negara
            </h2>

            {/* Alphabet Navigation */}
            <div className="flex flex-wrap gap-1 mb-6">
              {alphabet.map((letter) => (
                <a
                  key={letter}
                  href={`#country-${letter}`}
                  className="w-8 h-8 flex items-center justify-center rounded bg-muted hover:bg-primary hover:text-primary-foreground transition-colors text-sm font-medium"
                >
                  {letter}
                </a>
              ))}
            </div>

            {/* Countries grouped by letter */}
            <div className="space-y-8">
              {alphabet.map((letter) => (
                <div key={letter} id={`country-${letter}`}>
                  <h3 className="text-lg font-semibold mb-3 sticky top-0 bg-background py-2 border-b">
                    {letter}
                  </h3>
                  <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                    {countriesByLetter[letter].map((country) => (
                      <CountryCard
                        key={country.code}
                        country={country}
                        currency={currency}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  )
}

// Country Card Component
function CountryCard({
  country,
  currency,
  featured = false,
}: {
  country: LocationWithPackageCount
  currency: "USD" | "IDR"
  featured?: boolean
}) {
  return (
    <Link href={`/store/${country.code.toLowerCase()}`}>
      <Card className={`group cursor-pointer transition-all hover:shadow-md hover:border-primary/50 ${featured ? "border-yellow-500/30" : ""}`}>
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            {/* Flag */}
            <div className="relative w-10 h-7 rounded overflow-hidden bg-muted flex-shrink-0">
              <Image
                src={country.flagUrl || `/img/flags/${country.code.toLowerCase()}.png`}
                alt={country.name}
                fill
                className="object-cover"
                onError={(e) => {
                  // Fallback if flag image not found
                  e.currentTarget.style.display = "none"
                }}
              />
            </div>
            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                {country.name}
              </p>
              <p className="text-xs text-muted-foreground">
                Mulai {formatMinPrice(country.minPriceUsdCents, country.minPriceIdr, currency)}
              </p>
            </div>
            {/* Arrow */}
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
          </div>
          {/* Badges */}
          {country.hasUnlimitedPackages && (
            <Badge variant="secondary" className="mt-2 text-xs">
              Unlimited tersedia
            </Badge>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}

// Region Card Component
function RegionCard({
  region,
  currency,
}: {
  region: RegionWithPackageCount
  currency: "USD" | "IDR"
}) {
  return (
    <Link href={`/store/region/${region.code}`}>
      <Card className="group cursor-pointer transition-all hover:shadow-md hover:border-primary/50 h-full">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            {/* Icon/Image */}
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Globe className="h-6 w-6 text-primary" />
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          {/* Info */}
          <h3 className="font-semibold group-hover:text-primary transition-colors">
            {region.name}
          </h3>
          <p className="text-sm text-muted-foreground mb-2">
            {region.countryCount} negara
          </p>
          <div className="flex items-center justify-between">
            <p className="text-sm">
              Mulai <span className="font-semibold text-primary">{formatMinPrice(region.minPriceUsdCents, region.minPriceIdr, currency)}</span>
            </p>
            <Badge variant="outline" className="text-xs">
              {region.packageCount} paket
            </Badge>
          </div>
          {region.hasUnlimitedPackages && (
            <Badge variant="secondary" className="mt-2 text-xs">
              Unlimited tersedia
            </Badge>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
