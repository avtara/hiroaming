import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format currency with support for different cent formats
 * @param amount - Amount in cents (or whole numbers for IDR)
 * @param currency - Currency code (USD, IDR)
 * @param source - Data source format:
 *   - "esim" (default): 1 USD = 10000 (eSIM Access format)
 *   - "paddle": 1 USD = 100 (Paddle/standard cents format)
 */
export function formatCurrency(
  amount: number,
  currency: string = "IDR",
  source: "esim" | "paddle" = "esim"
): string {
  let displayAmount: number

  if (currency === "USD") {
    // USD conversion based on source format
    displayAmount = source === "paddle" ? amount / 100 : amount / 10000
  } else {
    // IDR is stored as whole numbers, no division needed
    displayAmount = amount
  }

  const locale = currency === "USD" ? "en-US" : "id-ID"

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
    minimumFractionDigits: currency === "USD" ? 2 : 0,
  }).format(displayAmount)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date))
}

export function formatDateShort(date: string | Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date))
}

export function formatDataSize(amount: number, unit?: string): string {
  if (amount === 0) return "0 B"

  // If unit is provided, just format with the unit
  if (unit) {
    return `${amount} ${unit}`
  }

  // Otherwise, treat as bytes and convert
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(amount) / Math.log(k))
  return parseFloat((amount / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + "..."
}

export function generateOrderId(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `HR-${timestamp}-${random}`
}
