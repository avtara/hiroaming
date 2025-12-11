"use client"

import { useState, useEffect } from "react"
import { Loader2, Wifi, Clock, ArrowRight, Check, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDataSize } from "@/lib/utils"
import { toast } from "sonner"

interface TopupPackage {
  id: string
  package_code: string
  name: string
  description: string | null
  volume_gb: string | null
  volume_bytes: number
  duration: number
  duration_unit: string
  data_type: number
  speed: string | null
  price_usd: string | null
  price_usd_cents: number
  price_idr: number
  image_url: string | null
}

interface TopupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  profileId: string
  profileIccid?: string | null
  customerEmail: string
  customerName?: string
  userId?: string
}

export function TopupDialog({
  open,
  onOpenChange,
  profileId,
  profileIccid,
  customerEmail,
  customerName,
  userId,
}: TopupDialogProps) {
  const [packages, setPackages] = useState<TopupPackage[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingCheckout, setLoadingCheckout] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null)
  const [profileInfo, setProfileInfo] = useState<{
    current_data_used: number
    current_data_total: number
    current_usage_percentage: number
    expires_at: string | null
    topup_count: number
    can_topup: boolean
  } | null>(null)

  useEffect(() => {
    if (open && profileId) {
      fetchTopupPackages()
    }
  }, [open, profileId])

  const fetchTopupPackages = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/get-topup-packages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
          },
          body: JSON.stringify({ esim_profile_id: profileId }),
        }
      )

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch topup packages")
      }

      if (!data.can_topup) {
        setError(data.reason || "This eSIM cannot be topped up")
        setPackages([])
      } else {
        setPackages(data.packages || [])
        setProfileInfo({
          current_data_used: data.current_data_used,
          current_data_total: data.current_data_total,
          current_usage_percentage: data.current_usage_percentage,
          expires_at: data.expires_at,
          topup_count: data.topup_count,
          can_topup: data.can_topup,
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load packages")
    } finally {
      setLoading(false)
    }
  }

  const handleTopup = async () => {
    if (!selectedPackage) {
      toast.error("Pilih paket top-up terlebih dahulu")
      return
    }

    setLoadingCheckout(true)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-topup-checkout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
          },
          body: JSON.stringify({
            esim_profile_id: profileId,
            package_code: selectedPackage,
            customer_email: customerEmail,
            customer_name: customerName,
            user_id: userId,
          }),
        }
      )

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to create checkout")
      }

      // Redirect to Paddle checkout
      if (data.checkout_url) {
        window.location.href = data.checkout_url
      } else {
        throw new Error("No checkout URL returned")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal membuat checkout")
      setLoadingCheckout(false)
    }
  }

  const selectedPkg = packages.find((p) => p.package_code === selectedPackage)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Top Up eSIM</DialogTitle>
          <DialogDescription>
            {profileIccid ? `ICCID: ${profileIccid}` : "Pilih paket untuk menambah kuota"}
          </DialogDescription>
        </DialogHeader>

        {/* Current Usage Info */}
        {profileInfo && (
          <div className="rounded-lg bg-muted p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <Wifi className="h-4 w-4" />
                Sisa Kuota
              </span>
              <span className="font-medium">
                {formatDataSize((profileInfo.current_data_total || 0) - (profileInfo.current_data_used || 0))} tersisa
              </span>
            </div>
            <div className="h-2 rounded-full bg-background overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${Math.min(profileInfo.current_usage_percentage || 0, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{profileInfo.current_usage_percentage || 0}% terpakai</span>
              {profileInfo.expires_at && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Berlaku hingga {new Date(profileInfo.expires_at).toLocaleDateString("id-ID")}
                </span>
              )}
            </div>
            {profileInfo.topup_count > 0 && (
              <Badge variant="secondary" className="text-xs">
                Sudah {profileInfo.topup_count}x top-up
              </Badge>
            )}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="rounded-lg bg-destructive/10 p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-destructive">Tidak dapat top-up</p>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Package List */}
        {!loading && !error && packages.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium">Pilih Paket Top-Up:</p>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {packages.map((pkg) => (
                <div
                  key={pkg.package_code}
                  className={`relative rounded-lg border p-4 cursor-pointer transition-all hover:border-primary ${
                    selectedPackage === pkg.package_code
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border"
                  }`}
                  onClick={() => setSelectedPackage(pkg.package_code)}
                >
                  {selectedPackage === pkg.package_code && (
                    <div className="absolute top-2 right-2">
                      <Check className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  <div className="flex justify-between items-start pr-6">
                    <div>
                      <p className="font-medium">{pkg.name}</p>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        {pkg.volume_gb && (
                          <span className="flex items-center gap-1">
                            <Wifi className="h-3 w-3" />
                            {pkg.volume_gb} GB
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {pkg.duration} {pkg.duration_unit === "days" ? "hari" : pkg.duration_unit}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary">
                        {formatCurrency(pkg.price_usd_cents, "USD", "paddle")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(pkg.price_idr, "IDR")}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Packages Available */}
        {!loading && !error && packages.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>Tidak ada paket top-up tersedia untuk eSIM ini.</p>
          </div>
        )}

        {/* Action Button */}
        {!loading && !error && packages.length > 0 && (
          <div className="pt-4 border-t space-y-3">
            {selectedPkg && (
              <div className="flex justify-between items-center text-sm">
                <span>Total Pembayaran:</span>
                <span className="font-semibold text-lg">
                  {formatCurrency(selectedPkg.price_usd_cents, "USD", "paddle")}
                </span>
              </div>
            )}
            <Button
              className="w-full"
              size="lg"
              onClick={handleTopup}
              disabled={!selectedPackage || loadingCheckout}
            >
              {loadingCheckout ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="mr-2 h-4 w-4" />
              )}
              {loadingCheckout ? "Memproses..." : "Lanjutkan Pembayaran"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
