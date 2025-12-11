// Location types for country and region display

export type LocationType = "country" | "region"

export interface Location {
  code: string // ISO code for countries, slug prefix for regions
  name: string
  type: LocationType
  flagUrl?: string // URL to flag image (for countries)
  iconUrl?: string // URL to icon (for regions)
  countryCount?: number // Number of countries (for regions)
  popular?: boolean // Featured/popular locations
}

// Regions defined in the system
export interface Region extends Location {
  type: "region"
  countryCount: number
  countries?: string[] // Array of country codes included
}

// Countries
export interface Country extends Location {
  type: "country"
  flagUrl: string
}

// Package data type from API
export type DataType = 1 | 2 | 3 | 4
// 1 = Fixed data package
// 2 = Daily Limit (Speed Reduced after limit)
// 3 = Daily Limit (Service Cut-off after limit)
// 4 = Daily Unlimited

export function isUnlimitedPackage(dataType: number | null | undefined): boolean {
  return dataType === 2 || dataType === 3 || dataType === 4
}

export function getDataTypeLabel(dataType: number | null | undefined): string {
  switch (dataType) {
    case 2:
      return "Daily (Speed Reduced)"
    case 3:
      return "Daily (Service Cut-off)"
    case 4:
      return "Daily Unlimited"
    default:
      return "Fixed Data"
  }
}

// Cart item with period support for daily packages
export interface CartItemWithPeriod {
  id: string
  packageId: string
  packageSlug: string
  packageName: string
  pricePerDay: number // Price per day in esim-access format (10000 = $1)
  priceIdrPerDay: number
  periodNum: number // Number of days (1-365)
  quantity: number
  dataType: number
  locationCode: string
  locationName: string
}
