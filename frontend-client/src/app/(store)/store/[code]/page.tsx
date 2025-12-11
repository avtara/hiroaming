import { Suspense } from "react"
import { Metadata } from "next"
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { getCountryByCode, getPackagesForCountry } from "@/services/locations"
import { CountryPackages } from "./country-packages"
import type { EsimPackage } from "@/types/database"
import type { PriceSchedule } from "@/lib/price-utils"

export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{ code: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { code } = await params
  const country = await getCountryByCode(code.toUpperCase())

  if (!country) {
    return {
      title: "Negara tidak ditemukan - HIROAM",
    }
  }

  return {
    title: `Paket eSIM ${country.name} - HIROAM`,
    description: `Beli paket eSIM untuk ${country.name}. Mulai dari harga terjangkau dengan opsi unlimited tersedia.`,
  }
}

async function getActivePriceSchedules(): Promise<PriceSchedule[]> {
  const supabase = await createClient()
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from("price_schedules")
    .select("*")
    .eq("is_active", true)
    .lte("starts_at", now)
    .gte("ends_at", now)
    .order("priority", { ascending: false })

  if (error) {
    console.error("Error fetching price schedules:", error)
    return []
  }

  return (data as PriceSchedule[]) || []
}

function CountrySkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Skeleton className="h-6 w-32 mb-6" />
      <div className="flex items-center gap-4 mb-8">
        <Skeleton className="w-16 h-12 rounded" />
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-64" />
        ))}
      </div>
    </div>
  )
}

export default async function CountryDetailPage({ params }: PageProps) {
  const { code } = await params
  const upperCode = code.toUpperCase()

  const [country, packages, priceSchedules] = await Promise.all([
    getCountryByCode(upperCode),
    getPackagesForCountry(upperCode),
    getActivePriceSchedules(),
  ])

  if (!country) {
    notFound()
  }

  return (
    <Suspense fallback={<CountrySkeleton />}>
      <div className="container mx-auto px-4 py-8">
        {/* Back Link */}
        <Link href="/store">
          <Button variant="ghost" size="sm" className="mb-6 -ml-2">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Kembali ke Daftar Negara
          </Button>
        </Link>

        {/* Country Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="relative w-16 h-12 rounded-lg overflow-hidden bg-muted shadow-sm">
            <Image
              src={country.flagUrl || `/img/flags/${country.code.toLowerCase()}.png`}
              alt={country.name}
              fill
              className="object-cover"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">{country.name}</h1>
            <p className="text-muted-foreground">
              {country.packageCount} paket tersedia
              {country.hasUnlimitedPackages && " • Unlimited tersedia"}
            </p>
          </div>
        </div>

        {/* Packages */}
        <CountryPackages
          packages={packages as EsimPackage[]}
          countryName={country.name}
          priceSchedules={priceSchedules}
        />
      </div>
    </Suspense>
  )
}
