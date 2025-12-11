import Link from "next/link"
import { ArrowRight, Globe, Zap, Shield, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

const features = [
  {
    icon: Globe,
    title: "Jangkauan Global",
    description: "Tersedia di lebih dari 100+ negara dengan jaringan operator terpercaya.",
  },
  {
    icon: Zap,
    title: "Aktivasi Instan",
    description: "Aktifkan eSIM Anda dalam hitungan menit, tanpa perlu menunggu pengiriman fisik.",
  },
  {
    icon: Shield,
    title: "Aman & Terjamin",
    description: "Pembayaran aman dengan berbagai metode pembayaran yang tersedia.",
  },
  {
    icon: Smartphone,
    title: "Mudah Digunakan",
    description: "Cukup scan QR code dan eSIM Anda siap digunakan.",
  },
]

const popularDestinations = [
  { name: "Jepang", flag: "🇯🇵", startingPrice: 75000 },
  { name: "Korea Selatan", flag: "🇰🇷", startingPrice: 85000 },
  { name: "Thailand", flag: "🇹🇭", startingPrice: 55000 },
  { name: "Singapura", flag: "🇸🇬", startingPrice: 65000 },
  { name: "Malaysia", flag: "🇲🇾", startingPrice: 45000 },
  { name: "Vietnam", flag: "🇻🇳", startingPrice: 50000 },
]

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-background to-background py-20 md:py-32">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
                Konektivitas Tanpa Batas dengan{" "}
                <span className="text-primary">eSIM</span>
              </h1>
              <p className="mb-8 text-lg text-muted-foreground md:text-xl">
                Nikmati internet cepat di seluruh dunia tanpa ribet ganti kartu SIM.
                Aktivasi instan, harga terjangkau, dan tanpa biaya roaming mahal.
              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button size="lg" asChild>
                  <Link href="/store">
                    Belanja Sekarang
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/esim-info">Pelajari eSIM</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">
                Kenapa Memilih HIROAM?
              </h2>
              <p className="mx-auto max-w-2xl text-muted-foreground">
                Kami menyediakan solusi eSIM terbaik dengan layanan pelanggan yang
                responsif.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <Card key={feature.title} className="text-center">
                  <CardHeader>
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Popular Destinations */}
        <section className="bg-muted/50 py-20">
          <div className="container mx-auto px-4">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">
                Destinasi Populer
              </h2>
              <p className="mx-auto max-w-2xl text-muted-foreground">
                Jelajahi paket eSIM untuk destinasi favorit Anda.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {popularDestinations.map((destination) => (
                <Link
                  key={destination.name}
                  href={`/store?country=${destination.name.toLowerCase()}`}
                  className="group"
                >
                  <Card className="transition-colors hover:border-primary">
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{destination.flag}</span>
                        <div>
                          <p className="font-semibold">{destination.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Mulai dari Rp {destination.startingPrice.toLocaleString("id-ID")}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Button variant="outline" asChild>
                <Link href="/store">Lihat Semua Destinasi</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">
                Cara Kerja eSIM
              </h2>
              <p className="mx-auto max-w-2xl text-muted-foreground">
                Hanya 3 langkah mudah untuk mulai menggunakan eSIM.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                  1
                </div>
                <h3 className="mb-2 text-xl font-semibold">Pilih Paket</h3>
                <p className="text-muted-foreground">
                  Pilih paket eSIM sesuai dengan destinasi dan kebutuhan data Anda.
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                  2
                </div>
                <h3 className="mb-2 text-xl font-semibold">Bayar & Terima QR</h3>
                <p className="text-muted-foreground">
                  Selesaikan pembayaran dan terima QR code aktivasi via email.
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                  3
                </div>
                <h3 className="mb-2 text-xl font-semibold">Scan & Aktifkan</h3>
                <p className="text-muted-foreground">
                  Scan QR code di perangkat Anda dan nikmati koneksi internet.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-primary py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="mb-4 text-3xl font-bold text-primary-foreground md:text-4xl">
              Siap untuk Memulai?
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-primary-foreground/80">
              Dapatkan eSIM Anda sekarang dan nikmati konektivitas tanpa batas di
              seluruh dunia.
            </p>
            <Button size="lg" variant="secondary" asChild>
              <Link href="/store">
                Jelajahi Paket eSIM
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
