"use client"

import {
  Wifi,
  Clock,
  Signal,
  CheckCircle,
  Smartphone,
  Zap,
  MapPin,
  Globe,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useCurrencyStore } from "@/stores/currency-store"
import { useCartStore } from "@/stores/cart-store"
import { formatDataSize } from "@/lib/utils"
import { toast } from "sonner"
import type { EsimPackage } from "@/types/database"
import { formatPriceWithDiscount, type EffectivePrice } from "@/lib/price-utils"

interface PackageDetailModalProps {
  pkg: EsimPackage | null
  open: boolean
  onOpenChange: (open: boolean) => void
  locationName?: string
  effectivePrice?: EffectivePrice | null
}

const features = [
  { icon: Zap, text: "Aktivasi Instan" },
  { icon: Signal, text: "Jaringan 4G/LTE" },
  { icon: Globe, text: "Tethering/Hotspot" },
  { icon: Smartphone, text: "Mudah Digunakan" },
]

export function PackageDetailModal({
  pkg,
  open,
  onOpenChange,
  locationName,
  effectivePrice,
}: PackageDetailModalProps) {
  const currency = useCurrencyStore((state) => state.currency)
  const addItem = useCartStore((state) => state.addItem)

  if (!pkg) return null

  const durationText =
    pkg.duration_unit === "day"
      ? `${pkg.duration} Hari`
      : `${pkg.duration} ${pkg.duration_unit || "Hari"}`

  const handleAddToCart = () => {
    addItem(pkg)
    toast.success(`${pkg.display_name || pkg.name} ditambahkan ke keranjang`)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {pkg.category && <Badge variant="outline">{pkg.category}</Badge>}
            {pkg.is_featured && <Badge variant="default">Featured</Badge>}
            {pkg.is_bestseller && <Badge variant="destructive">Bestseller</Badge>}
            {pkg.is_new && <Badge variant="outline">Baru</Badge>}
          </div>
          <DialogTitle className="text-xl">
            {pkg.display_name || pkg.name}
          </DialogTitle>
          {pkg.description && (
            <p className="text-sm text-muted-foreground mt-1">
              {pkg.description || pkg.custom_description}
            </p>
          )}
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="p-6 pt-4 space-y-6">
            {/* Package Specs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <Wifi className="h-5 w-5 mx-auto text-primary mb-1" />
                <p className="font-semibold text-sm">{formatDataSize(pkg.volume_bytes)}</p>
                <p className="text-xs text-muted-foreground">Data</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <Clock className="h-5 w-5 mx-auto text-primary mb-1" />
                <p className="font-semibold text-sm">{durationText}</p>
                <p className="text-xs text-muted-foreground">Masa Aktif</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <MapPin className="h-5 w-5 mx-auto text-primary mb-1" />
                <p className="font-semibold text-sm truncate">
                  {locationName || pkg.location_codes?.join(", ") || pkg.category || "-"}
                </p>
                <p className="text-xs text-muted-foreground">Lokasi</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <Signal className="h-5 w-5 mx-auto text-primary mb-1" />
                <p className="font-semibold text-sm">{pkg.speed || "4G/LTE"}</p>
                <p className="text-xs text-muted-foreground">Jaringan</p>
              </div>
            </div>

            {/* Features */}
            <div>
              <h4 className="font-medium mb-3">Fitur Paket</h4>
              <div className="grid grid-cols-2 gap-2">
                {features.map((feature) => (
                  <div key={feature.text} className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <feature.icon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm">{feature.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* How to Use */}
            <div>
              <h4 className="font-medium mb-3">Cara Menggunakan</h4>
              <div className="space-y-3">
                {[
                  { step: 1, title: "Beli Paket", desc: "Selesaikan pembelian paket eSIM ini." },
                  { step: 2, title: "Terima QR Code", desc: "QR code aktivasi dikirim ke email Anda." },
                  { step: 3, title: "Scan & Aktifkan", desc: "Scan QR code di pengaturan perangkat." },
                  { step: 4, title: "Gunakan di Destinasi", desc: "Aktifkan data roaming saat tiba." },
                ].map((item) => (
                  <div key={item.step} className="flex gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 text-xs font-semibold">
                      {item.step}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Benefits */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Aktivasi instan setelah pembayaran</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>QR code dikirim via email</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Support 24/7</span>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Footer with Price and CTA */}
        <div className="p-6 pt-0 border-t bg-background">
          <div className="flex items-center justify-between gap-4 pt-4">
            <div>
              {effectivePrice ? (
                <div className="space-y-1">
                  {effectivePrice.hasDiscount && (
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-muted-foreground line-through">
                        {formatPriceWithDiscount(effectivePrice, currency).original}
                      </p>
                      {effectivePrice.discountPercentage && (
                        <Badge
                          variant="destructive"
                          className="text-xs"
                          style={effectivePrice.badgeColor ? { backgroundColor: effectivePrice.badgeColor } : undefined}
                        >
                          {effectivePrice.badgeText || `-${effectivePrice.discountPercentage}%`}
                        </Badge>
                      )}
                    </div>
                  )}
                  <p className="text-2xl font-bold text-primary">
                    {formatPriceWithDiscount(effectivePrice, currency).final}
                  </p>
                </div>
              ) : (
                <p className="text-2xl font-bold text-primary">
                  {formatPriceWithDiscount({
                    originalUsdCents: pkg.price_usd_cents,
                    originalIdr: pkg.price_idr,
                    finalUsdCents: pkg.price_usd_cents,
                    finalIdr: pkg.price_idr,
                    hasDiscount: false,
                    discountPercentage: null,
                    badgeText: null,
                    badgeColor: null,
                    scheduleName: null,
                  }, currency).final}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {formatDataSize(pkg.volume_bytes)} / {durationText}
              </p>
            </div>
            <Button size="lg" onClick={handleAddToCart}>
              Tambah ke Keranjang
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
