import { Suspense } from "react"
import { Metadata } from "next"
import { StoreContent } from "./store-content"
import { Skeleton } from "@/components/ui/skeleton"
import {
  getCountriesWithPackages,
  getRegionsWithPackages,
} from "@/services/locations"

// Force dynamic rendering to always get fresh data
export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Store - Pilih Destinasi eSIM",
  description: "Pilih negara atau wilayah untuk membeli paket eSIM perjalanan Anda.",
}

function StoreSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Skeleton className="h-10 w-64 mb-4" />
      <Skeleton className="h-6 w-96 mb-8" />
      <Skeleton className="h-12 w-full max-w-md mb-8" />
      <Skeleton className="h-8 w-48 mb-4" />
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 mb-8">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-8 w-48 mb-4" />
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {[...Array(12)].map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    </div>
  )
}

export default async function StorePage() {
  const [countries, regions] = await Promise.all([
    getCountriesWithPackages(),
    getRegionsWithPackages(),
  ])

  return (
    <Suspense fallback={<StoreSkeleton />}>
      <StoreContent
        countries={countries}
        regions={regions}
      />
    </Suspense>
  )
}
