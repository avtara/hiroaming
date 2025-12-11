import { createClient } from "@/lib/supabase/server"
import type { Country, Region } from "@/types/location"
import {
  POPULAR_COUNTRY_CODES,
  REGIONS,
  getLocationImageUrl,
  getRegionCodeFromSlug,
} from "@/lib/locations"

export interface LocationWithPackageCount extends Country {
  packageCount: number
  hasUnlimitedPackages: boolean
  minPriceUsdCents: number
  minPriceIdr: number
}

export interface RegionWithPackageCount extends Region {
  packageCount: number
  hasUnlimitedPackages: boolean
  minPriceUsdCents: number
  minPriceIdr: number
}

interface LocationNameData {
  name: string
  logo: string
}

interface PackageLocationData {
  slug: string
  name: string
  location_codes: string[]
  price_usd_cents: number
  price_idr: number
  data_type: number | null
  location_names: Record<string, LocationNameData> | null
  image_url: string | null
}

// Fetch all countries with their package counts and prices
export async function getCountriesWithPackages(): Promise<LocationWithPackageCount[]> {
  const supabase = await createClient()

  // Get all active packages with single location (countries only)
  const { data, error } = await supabase
    .from("esim_packages")
    .select("slug, name, location_codes, price_usd_cents, price_idr, data_type, location_names, image_url")
    .eq("is_active", true)

  if (error) {
    console.error("Error fetching packages for countries:", error)
    return []
  }

  const packages = data as PackageLocationData[]

  // Group packages by country code (single location packages only)
  const countryMap = new Map<
    string,
    {
      name: string
      packageCount: number
      hasUnlimited: boolean
      minPriceUsd: number
      minPriceIdr: number
      logoUrl: string | null
    }
  >()

  packages.forEach((pkg) => {
    // Only process single-country packages
    if (pkg.location_codes?.length !== 1) return

    const code = pkg.location_codes[0]
    const countryName = extractCountryNameFromPackage(pkg.name)
    const isUnlimited = pkg.data_type === 2 || pkg.data_type === 3 || pkg.data_type === 4

    // Extract logo URL from location_names or image_url
    let logoUrl: string | null = pkg.image_url || null
    if (!logoUrl && pkg.location_names) {
      // Try to find logo from location_names JSON
      const locationData = pkg.location_names[code] || Object.values(pkg.location_names)[0]
      if (locationData?.logo) {
        logoUrl = locationData.logo
      }
    }

    const existing = countryMap.get(code)
    if (existing) {
      existing.packageCount++
      existing.hasUnlimited = existing.hasUnlimited || isUnlimited
      existing.minPriceUsd = Math.min(existing.minPriceUsd, pkg.price_usd_cents)
      existing.minPriceIdr = Math.min(existing.minPriceIdr, pkg.price_idr)
      // Update logo if we didn't have one before
      if (!existing.logoUrl && logoUrl) {
        existing.logoUrl = logoUrl
      }
    } else {
      countryMap.set(code, {
        name: countryName,
        packageCount: 1,
        hasUnlimited: isUnlimited,
        minPriceUsd: pkg.price_usd_cents,
        minPriceIdr: pkg.price_idr,
        logoUrl,
      })
    }
  })

  // Convert to array of Country objects
  const countries: LocationWithPackageCount[] = []
  countryMap.forEach((data, code) => {
    countries.push({
      code,
      name: data.name,
      type: "country",
      flagUrl: getLocationImageUrl(data.logoUrl, code),
      popular: POPULAR_COUNTRY_CODES.includes(code),
      packageCount: data.packageCount,
      hasUnlimitedPackages: data.hasUnlimited,
      minPriceUsdCents: data.minPriceUsd,
      minPriceIdr: data.minPriceIdr,
    })
  })

  // Sort: popular first, then alphabetically
  return countries.sort((a, b) => {
    if (a.popular && !b.popular) return -1
    if (!a.popular && b.popular) return 1
    return a.name.localeCompare(b.name)
  })
}

// Fetch all regions with their package counts
export async function getRegionsWithPackages(): Promise<RegionWithPackageCount[]> {
  const supabase = await createClient()

  // Get all active packages with multiple locations (regions)
  const { data, error } = await supabase
    .from("esim_packages")
    .select("slug, name, location_codes, price_usd_cents, price_idr, data_type, location_names, image_url")
    .eq("is_active", true)

  if (error) {
    console.error("Error fetching packages for regions:", error)
    return []
  }

  const packages = data as PackageLocationData[]

  // Group packages by region
  const regionMap = new Map<
    string,
    {
      packageCount: number
      hasUnlimited: boolean
      minPriceUsd: number
      minPriceIdr: number
    }
  >()

  packages.forEach((pkg) => {
    // Only process multi-country packages (regions)
    if (!pkg.location_codes || pkg.location_codes.length <= 1) return

    const regionCode = getRegionCodeFromSlug(pkg.slug)
    if (!regionCode) return

    const isUnlimited = pkg.data_type === 2 || pkg.data_type === 3 || pkg.data_type === 4

    const existing = regionMap.get(regionCode)
    if (existing) {
      existing.packageCount++
      existing.hasUnlimited = existing.hasUnlimited || isUnlimited
      existing.minPriceUsd = Math.min(existing.minPriceUsd, pkg.price_usd_cents)
      existing.minPriceIdr = Math.min(existing.minPriceIdr, pkg.price_idr)
    } else {
      regionMap.set(regionCode, {
        packageCount: 1,
        hasUnlimited: isUnlimited,
        minPriceUsd: pkg.price_usd_cents,
        minPriceIdr: pkg.price_idr,
      })
    }
  })

  // Merge with predefined regions
  const regionsWithCounts: RegionWithPackageCount[] = REGIONS.filter((region) =>
    regionMap.has(region.code)
  ).map((region) => {
    const data = regionMap.get(region.code)!
    return {
      ...region,
      packageCount: data.packageCount,
      hasUnlimitedPackages: data.hasUnlimited,
      minPriceUsdCents: data.minPriceUsd,
      minPriceIdr: data.minPriceIdr,
    }
  })

  // Sort: popular first, then by package count
  return regionsWithCounts.sort((a, b) => {
    if (a.popular && !b.popular) return -1
    if (!a.popular && b.popular) return 1
    return b.packageCount - a.packageCount
  })
}

// Get packages for a specific country
export async function getPackagesForCountry(countryCode: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("esim_packages")
    .select("*")
    .eq("is_active", true)
    .contains("location_codes", [countryCode])
    .order("price_usd_cents", { ascending: true })

  if (error) {
    console.error("Error fetching packages for country:", error)
    return []
  }

  // Filter to only single-country packages for this country
  return (data || []).filter(
    (pkg) =>
      pkg.location_codes?.length === 1 && pkg.location_codes[0] === countryCode
  )
}

// Get packages for a specific region by region code
export async function getPackagesForRegion(regionCode: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("esim_packages")
    .select("*")
    .eq("is_active", true)
    .order("price_usd_cents", { ascending: true })

  if (error) {
    console.error("Error fetching packages for region:", error)
    return []
  }

  // Filter to multi-country packages matching this region
  return (data || []).filter((pkg) => {
    if (!pkg.location_codes || pkg.location_codes.length <= 1) return false
    if (!pkg.slug) return false
    return getRegionCodeFromSlug(pkg.slug) === regionCode
  })
}

// Get country info by code
export async function getCountryByCode(
  code: string
): Promise<LocationWithPackageCount | null> {
  const countries = await getCountriesWithPackages()
  return countries.find((c) => c.code === code) || null
}

// Get region info by code
export async function getRegionByCode(
  code: string
): Promise<RegionWithPackageCount | null> {
  const regions = await getRegionsWithPackages()
  return regions.find((r) => r.code === code) || null
}

// Helper to extract country name from package name
function extractCountryNameFromPackage(packageName: string): string {
  // Remove data spec from end (e.g., "Japan 1GB 7Days" -> "Japan")
  // Handle various patterns
  return packageName
    .replace(/\s+\d+(\.\d+)?(GB|MB)\/Day.*$/i, "") // "Japan 1GB/Day" -> "Japan"
    .replace(/\s+\d+(\.\d+)?(GB|MB)\s+\d+Days.*$/i, "") // "Japan 1GB 7Days" -> "Japan"
    .replace(/\s+Unlimited.*$/i, "") // "Japan Unlimited 7Days" -> "Japan"
    .trim()
}
