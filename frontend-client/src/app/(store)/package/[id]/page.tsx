import { Metadata } from "next"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { formatDataSize } from "@/lib/utils"
import { PackageDetailContent } from "./package-detail-content"
import type { EsimPackage } from "@/types/database"

interface PackageDetailPageProps {
  params: Promise<{ id: string }>
}

// Helper to get display name from location_names JSON
function getLocationDisplayName(locationNames: unknown): string {
  if (!locationNames) return ""
  if (typeof locationNames === "string") return locationNames
  if (typeof locationNames === "object" && locationNames !== null) {
    const names = locationNames as Record<string, unknown>

    // Handle structure like {logo: "...", name: "..."} - extract name directly
    if ("name" in names && typeof names.name === "string") {
      return names.name
    }

    // Try common language keys (en, id)
    if (typeof names.en === "string") return names.en
    if (typeof names.id === "string") return names.id

    // Fallback: find first string value
    for (const value of Object.values(names)) {
      if (typeof value === "string") return value
      // Handle nested objects with name property
      if (typeof value === "object" && value !== null && "name" in value) {
        const nested = value as Record<string, unknown>
        if (typeof nested.name === "string") return nested.name
      }
    }
  }
  return ""
}

async function getPackage(id: string): Promise<EsimPackage | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("esim_packages")
    .select("*")
    .eq("id", id)
    .eq("is_active", true)
    .single()

  if (error) {
    console.error("Error fetching package:", error)
    return null
  }

  return data as EsimPackage
}

async function getRelatedPackages(currentId: string, category: string | null): Promise<EsimPackage[]> {
  const supabase = await createClient()

  let query = supabase
    .from("esim_packages")
    .select("*")
    .eq("is_active", true)
    .neq("id", currentId)
    .limit(3)

  if (category) {
    query = query.eq("category", category)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching related packages:", error)
    return []
  }

  return (data as EsimPackage[]) || []
}

export async function generateMetadata({ params }: PackageDetailPageProps): Promise<Metadata> {
  const { id } = await params
  const pkg = await getPackage(id)

  if (!pkg) {
    return {
      title: "Paket Tidak Ditemukan",
    }
  }

  const locationName = getLocationDisplayName(pkg.location_names)

  return {
    title: pkg.display_name || pkg.name,
    description: pkg.description || `Paket eSIM ${pkg.display_name || pkg.name} - ${formatDataSize(pkg.volume_bytes)} untuk ${pkg.duration} ${pkg.duration_unit === "day" ? "hari" : pkg.duration_unit}${locationName ? ` di ${locationName}` : ""}`,
  }
}

export default async function PackageDetailPage({ params }: PackageDetailPageProps) {
  const { id } = await params
  const pkg = await getPackage(id)

  if (!pkg) {
    notFound()
  }

  const relatedPackages = await getRelatedPackages(id, pkg.category)
  const locationName = getLocationDisplayName(pkg.location_names)

  return (
    <PackageDetailContent
      pkg={pkg}
      relatedPackages={relatedPackages}
      locationName={locationName}
    />
  )
}
