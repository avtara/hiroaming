"use client"

import Link from "next/link"
import {
  ArrowLeft,
  Wifi,
  Clock,
  Globe,
  Signal,
  CheckCircle,
  Smartphone,
  Zap,
  Info,
  MapPin
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useCurrencyStore, formatPriceForCurrency } from "@/stores/currency-store"
import { formatDataSize } from "@/lib/utils"
import { isUnlimitedPackage, getDataTypeLabel } from "@/types/location"
import { AddToCartButton } from "./add-to-cart-button"
import type { EsimPackage } from "@/types/database"

interface PackageDetailContentProps {
  pkg: EsimPackage
  relatedPackages: EsimPackage[]
  locationName: string
}

const features = [
  { icon: Zap, text: "Aktivasi Instan" },
  { icon: Signal, text: "Jaringan 4G/LTE" },
  { icon: Globe, text: "Tethering/Hotspot" },
  { icon: Smartphone, text: "Mudah Digunakan" },
]

export function PackageDetailContent({ pkg, relatedPackages, locationName }: PackageDetailContentProps) {
  const currency = useCurrencyStore((state) => state.currency)

  const isUnlimited = isUnlimitedPackage(pkg.data_type)

  const durationText = pkg.duration_unit === "day"
    ? `${pkg.duration} Hari`
    : `${pkg.duration} ${pkg.duration_unit || "Hari"}`

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Link */}
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/store">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Store
          </Link>
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Package Header */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {pkg.category && <Badge variant="outline">{pkg.category}</Badge>}
                    {pkg.is_featured && <Badge variant="default">Featured</Badge>}
                    {pkg.is_bestseller && <Badge variant="destructive">Bestseller</Badge>}
                    {pkg.is_new && <Badge variant="outline">Baru</Badge>}
                  </div>
                  <CardTitle className="text-2xl md:text-3xl">{pkg.display_name || pkg.name}</CardTitle>
                  <CardDescription className="mt-2">
                    {pkg.description || pkg.custom_description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <Wifi className="h-6 w-6 mx-auto text-primary mb-2" />
                  <p className="font-semibold">{formatDataSize(pkg.volume_bytes)}</p>
                  <p className="text-sm text-muted-foreground">Data</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <Clock className="h-6 w-6 mx-auto text-primary mb-2" />
                  <p className="font-semibold">{durationText}</p>
                  <p className="text-sm text-muted-foreground">Masa Aktif</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <MapPin className="h-6 w-6 mx-auto text-primary mb-2" />
                  <p className="font-semibold">{locationName || pkg.location_codes?.join(", ") || pkg.category || "-"}</p>
                  <p className="text-sm text-muted-foreground">Lokasi</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <Signal className="h-6 w-6 mx-auto text-primary mb-2" />
                  <p className="font-semibold">{pkg.speed || "4G/LTE"}</p>
                  <p className="text-sm text-muted-foreground">Jaringan</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Fitur Paket</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {features.map((feature) => (
                  <div key={feature.text} className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <feature.icon className="h-5 w-5 text-primary" />
                    </div>
                    <span className="font-medium">{feature.text}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* How to Use */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cara Menggunakan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 font-semibold">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Beli Paket</p>
                    <p className="text-sm text-muted-foreground">
                      Pilih dan selesaikan pembelian paket eSIM ini.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 font-semibold">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Terima QR Code</p>
                    <p className="text-sm text-muted-foreground">
                      QR code aktivasi akan dikirim ke email Anda.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 font-semibold">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Scan & Aktifkan</p>
                    <p className="text-sm text-muted-foreground">
                      Scan QR code di pengaturan perangkat Anda sebelum keberangkatan.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 font-semibold">
                    4
                  </div>
                  <div>
                    <p className="font-medium">Gunakan di Destinasi</p>
                    <p className="text-sm text-muted-foreground">
                      Aktifkan data roaming saat tiba di negara tujuan.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Price & CTA */}
        <div className="space-y-6">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="text-lg">
                {isUnlimited ? "Paket Harian Fleksibel" : "Ringkasan Harga"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isUnlimited ? (
                <div className="text-center p-6 rounded-lg bg-muted/50">
                  <Badge variant="secondary" className="mb-3">
                    {getDataTypeLabel(pkg.data_type)}
                  </Badge>
                  <p className="text-3xl font-bold text-primary">
                    {formatPriceForCurrency(pkg.price_usd_cents, pkg.price_idr, currency)}
                    <span className="text-lg font-normal text-muted-foreground">/hari</span>
                  </p>
                  {currency === "USD" && pkg.price_idr > 0 && (
                    <p className="text-sm text-muted-foreground">
                      ~{formatPriceForCurrency(pkg.price_usd_cents, pkg.price_idr, "IDR")}/hari
                    </p>
                  )}
                  {currency === "IDR" && pkg.price_usd_cents > 0 && (
                    <p className="text-sm text-muted-foreground">
                      ~{formatPriceForCurrency(pkg.price_usd_cents, pkg.price_idr, "USD")}/hari
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground mt-2">
                    {formatDataSize(pkg.volume_bytes)}/hari • Pilih 1-365 hari
                  </p>
                </div>
              ) : (
                <div className="text-center p-6 rounded-lg bg-muted/50">
                  <p className="text-3xl font-bold text-primary">
                    {formatPriceForCurrency(pkg.price_usd_cents, pkg.price_idr, currency)}
                  </p>
                  {currency === "USD" && pkg.price_idr > 0 && (
                    <p className="text-sm text-muted-foreground">
                      ~{formatPriceForCurrency(pkg.price_usd_cents, pkg.price_idr, "IDR")}
                    </p>
                  )}
                  {currency === "IDR" && pkg.price_usd_cents > 0 && (
                    <p className="text-sm text-muted-foreground">
                      ~{formatPriceForCurrency(pkg.price_usd_cents, pkg.price_idr, "USD")}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatDataSize(pkg.volume_bytes)} / {durationText}
                  </p>
                </div>
              )}

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

              <Separator />

              <AddToCartButton pkg={pkg} />

              <p className="text-xs text-center text-muted-foreground">
                Tidak perlu login untuk membeli
              </p>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">Catatan Penting</p>
                  <ul className="space-y-1">
                    <li>• Pastikan perangkat Anda mendukung eSIM</li>
                    <li>• Aktifkan eSIM sebelum keberangkatan</li>
                    <li>• Masa aktif dimulai saat koneksi pertama</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Related Packages */}
      {relatedPackages.length > 0 && (
        <section className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Paket Lainnya{pkg.category ? ` di ${pkg.category}` : ""}</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {relatedPackages.map((relatedPkg) => (
              <Link key={relatedPkg.id} href={`/package/${relatedPkg.id}`}>
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      {relatedPkg.category && <Badge variant="outline">{relatedPkg.category}</Badge>}
                    </div>
                    <CardTitle className="text-lg">{relatedPkg.display_name || relatedPkg.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Wifi className="h-4 w-4" />
                        {formatDataSize(relatedPkg.volume_bytes)}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {relatedPkg.duration} {relatedPkg.duration_unit === "day" ? "Hari" : relatedPkg.duration_unit || "Hari"}
                      </div>
                    </div>
                    <p className="font-bold text-primary">
                      {formatPriceForCurrency(relatedPkg.price_usd_cents, relatedPkg.price_idr, currency)}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
