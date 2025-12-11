import { Suspense } from "react"
import { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, Globe } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { getRegionByCode, getPackagesForRegion } from "@/services/locations"
import { CountryPackages } from "../../[code]/country-packages"
import type { EsimPackage } from "@/types/database"
import type { PriceSchedule } from "@/lib/price-utils"

export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{ code: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { code } = await params
  const region = await getRegionByCode(code)

  if (!region) {
    return {
      title: "Wilayah tidak ditemukan - HIROAM",
    }
  }

  return {
    title: `Paket eSIM ${region.name} - HIROAM`,
    description: `Beli paket eSIM untuk ${region.name} (${region.countryCount} negara). Mulai dari harga terjangkau dengan opsi unlimited tersedia.`,
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

function RegionSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Skeleton className="h-6 w-32 mb-6" />
      <div className="flex items-center gap-4 mb-8">
        <Skeleton className="w-16 h-16 rounded-lg" />
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

export default async function RegionDetailPage({ params }: PageProps) {
  const { code } = await params

  const [region, packages, priceSchedules] = await Promise.all([
    getRegionByCode(code),
    getPackagesForRegion(code),
    getActivePriceSchedules(),
  ])

  if (!region) {
    notFound()
  }

  return (
    <Suspense fallback={<RegionSkeleton />}>
      <div className="container mx-auto px-4 py-8">
        {/* Back Link */}
        <Link href="/store">
          <Button variant="ghost" size="sm" className="mb-6 -ml-2">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Kembali ke Daftar Negara
          </Button>
        </Link>

        {/* Region Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Globe className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">{region.name}</h1>
            <p className="text-muted-foreground">
              {region.countryCount} negara • {region.packageCount} paket tersedia
              {region.hasUnlimitedPackages && " • Unlimited tersedia"}
            </p>
          </div>
        </div>

        {/* Countries Covered */}
        {region.countries && region.countries.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-3">Negara yang Tercakup</h2>
            <div className="flex flex-wrap gap-2">
              {region.countries.map((country) => (
                <Badge key={country} variant="secondary">
                  {country}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Packages */}
        <CountryPackages
          packages={packages as EsimPackage[]}
          countryName={region.name}
          priceSchedules={priceSchedules}
        />
      </div>
    </Suspense>
  )
}
