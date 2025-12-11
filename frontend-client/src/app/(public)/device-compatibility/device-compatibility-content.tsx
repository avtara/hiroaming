"use client"

import { useState } from "react"
import Link from "next/link"
import { Search, CheckCircle, XCircle, ArrowRight, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

// Local type definition for compatible devices (no database table exists)
interface CompatibleDevice {
  id: string
  brand: string
  model: string
  is_compatible: boolean
}

interface DeviceCompatibilityContentProps {
  devicesByBrand: Record<string, CompatibleDevice[]>
}

export function DeviceCompatibilityContent({ devicesByBrand }: DeviceCompatibilityContentProps) {
  const [search, setSearch] = useState("")

  const filteredBrands = Object.entries(devicesByBrand).reduce((acc, [brand, devices]) => {
    if (search) {
      const searchLower = search.toLowerCase()
      const filteredDevices = devices.filter(
        (device) =>
          device.brand.toLowerCase().includes(searchLower) ||
          device.model.toLowerCase().includes(searchLower)
      )
      if (filteredDevices.length > 0) {
        acc[brand] = filteredDevices
      }
    } else {
      acc[brand] = devices
    }
    return acc
  }, {} as Record<string, CompatibleDevice[]>)

  const brands = Object.keys(filteredBrands).sort()

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <Smartphone className="h-16 w-16 mx-auto text-primary mb-4" />
        <h1 className="text-4xl font-bold md:text-5xl mb-4">
          Kompatibilitas Perangkat
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          Cek apakah perangkat Anda mendukung eSIM. Sebagian besar smartphone keluaran 2018 ke atas sudah mendukung eSIM.
        </p>
      </div>

      {/* Search */}
      <div className="mx-auto max-w-md mb-12">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari merek atau model perangkat..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Quick Check Guide */}
      <Card className="mb-12 mx-auto max-w-3xl">
        <CardHeader>
          <CardTitle>Cara Cek Manual</CardTitle>
          <CardDescription>
            Jika perangkat Anda tidak ada di daftar, cek secara manual dengan langkah berikut:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">iPhone</h4>
              <p className="text-sm text-muted-foreground">
                Buka <strong>Pengaturan → Seluler → Tambah Paket Seluler</strong>. Jika opsi ini tersedia, iPhone Anda mendukung eSIM.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Android</h4>
              <p className="text-sm text-muted-foreground">
                Buka <strong>Pengaturan → Jaringan & Internet → Kartu SIM → Tambah eSIM</strong>. Lokasi menu mungkin berbeda tergantung merek.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Device List */}
      {brands.length > 0 ? (
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold mb-6">Daftar Perangkat</h2>
          <Accordion type="multiple" className="space-y-4">
            {brands.map((brand) => (
              <AccordionItem key={brand} value={brand} className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{brand}</span>
                    <Badge variant="secondary">{filteredBrands[brand].length} model</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid gap-2">
                    {filteredBrands[brand].map((device) => (
                      <div
                        key={device.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <span>{device.model}</span>
                        {device.is_compatible ? (
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm">Kompatibel</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-destructive">
                            <XCircle className="h-4 w-4" />
                            <span className="text-sm">Tidak Kompatibel</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Tidak ada perangkat yang ditemukan.</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => setSearch("")}
          >
            Reset Pencarian
          </Button>
        </div>
      )}

      {/* CTA */}
      <div className="mt-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Perangkat Anda Kompatibel?</h2>
        <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
          Jelajahi paket eSIM kami dan nikmati konektivitas tanpa batas.
        </p>
        <Button size="lg" asChild>
          <Link href="/store">
            Lihat Paket eSIM
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  )
}
