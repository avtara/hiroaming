import { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Smartphone, Wifi, Globe, Shield, Zap, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export const metadata: Metadata = {
  title: "Apa itu eSIM?",
  description: "Pelajari tentang eSIM, cara kerjanya, dan keunggulannya dibandingkan kartu SIM fisik.",
}

const benefits = [
  {
    icon: Smartphone,
    title: "Tanpa Kartu Fisik",
    description: "Tidak perlu mengganti kartu SIM fisik. eSIM tertanam langsung di perangkat Anda.",
  },
  {
    icon: Zap,
    title: "Aktivasi Instan",
    description: "Cukup scan QR code dan eSIM Anda langsung aktif dalam hitungan menit.",
  },
  {
    icon: Globe,
    title: "Ganti Profil dengan Mudah",
    description: "Simpan hingga beberapa profil eSIM dan ganti dengan mudah sesuai kebutuhan.",
  },
  {
    icon: Shield,
    title: "Lebih Aman",
    description: "eSIM tidak bisa dicuri atau dipindahkan tanpa izin, lebih aman dari pencurian.",
  },
  {
    icon: Wifi,
    title: "Dual SIM Ready",
    description: "Gunakan bersama SIM fisik untuk memiliki dua nomor sekaligus.",
  },
]

const howItWorks = [
  {
    step: 1,
    title: "Pilih Paket",
    description: "Pilih paket eSIM sesuai destinasi dan kebutuhan data Anda.",
  },
  {
    step: 2,
    title: "Selesaikan Pembayaran",
    description: "Bayar menggunakan metode pembayaran pilihan Anda.",
  },
  {
    step: 3,
    title: "Terima QR Code",
    description: "QR code aktivasi akan dikirim ke email Anda.",
  },
  {
    step: 4,
    title: "Scan & Aktifkan",
    description: "Scan QR code di pengaturan perangkat Anda.",
  },
  {
    step: 5,
    title: "Mulai Gunakan",
    description: "eSIM siap digunakan saat Anda tiba di destinasi.",
  },
]

const faqs = [
  {
    question: "Apa perbedaan eSIM dengan SIM fisik?",
    answer: "eSIM (embedded SIM) adalah SIM digital yang tertanam langsung di perangkat, sementara SIM fisik adalah kartu kecil yang harus dimasukkan ke slot SIM. eSIM tidak memerlukan penggantian kartu fisik dan bisa diaktifkan secara digital.",
  },
  {
    question: "Apakah perangkat saya mendukung eSIM?",
    answer: "Sebagian besar smartphone keluaran 2018 ke atas mendukung eSIM, termasuk iPhone XS dan lebih baru, Samsung Galaxy S20 dan lebih baru, Google Pixel 3 dan lebih baru. Cek halaman Kompatibilitas Perangkat kami untuk daftar lengkap.",
  },
  {
    question: "Berapa banyak eSIM yang bisa disimpan di perangkat?",
    answer: "Tergantung perangkat, umumnya bisa menyimpan 5-10 profil eSIM. Namun, hanya satu atau dua profil yang bisa aktif bersamaan (tergantung dukungan dual SIM perangkat).",
  },
  {
    question: "Bagaimana cara mengaktifkan eSIM?",
    answer: "Setelah pembelian, Anda akan menerima QR code via email. Buka Pengaturan > Seluler > Tambah Paket Seluler, lalu scan QR code tersebut. eSIM akan langsung terdaftar di perangkat Anda.",
  },
  {
    question: "Apakah bisa top-up atau memperpanjang eSIM?",
    answer: "Ya, beberapa paket kami mendukung top-up. Anda bisa menambah kuota data tanpa perlu membeli eSIM baru selama profil eSIM masih aktif.",
  },
  {
    question: "Kapan sebaiknya mengaktifkan eSIM?",
    answer: "Sebaiknya aktifkan eSIM sebelum keberangkatan (saat masih terhubung WiFi) tetapi jangan aktifkan data roaming sampai tiba di destinasi. Ini memastikan eSIM sudah siap saat Anda mendarat.",
  },
]

export default function EsimInfoPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold md:text-5xl mb-4">
          Apa itu <span className="text-primary">eSIM</span>?
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          eSIM (embedded SIM) adalah SIM digital yang tertanam di perangkat Anda.
          Tidak perlu kartu fisik, cukup scan QR code dan langsung terhubung.
        </p>
      </div>

      {/* Benefits */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-center mb-8">Keunggulan eSIM</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {benefits.map((benefit) => (
            <Card key={benefit.title}>
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
                  <benefit.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{benefit.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{benefit.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="mb-16 bg-muted/50 -mx-4 px-4 py-16 md:rounded-3xl md:mx-0 md:px-12">
        <h2 className="text-2xl font-bold text-center mb-8">Cara Menggunakan eSIM</h2>
        <div className="relative">
          {/* Desktop Timeline */}
          <div className="hidden lg:block absolute top-8 left-0 right-0 h-0.5 bg-border" />
          <div className="grid gap-8 lg:grid-cols-5">
            {howItWorks.map((item, index) => (
              <div key={item.step} className="relative text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground relative z-10">
                  {item.step}
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
                {index < howItWorks.length - 1 && (
                  <ArrowRight className="hidden lg:block absolute top-8 -right-4 h-4 w-4 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mb-16">
        <div className="text-center mb-8">
          <HelpCircle className="h-12 w-12 mx-auto text-primary mb-4" />
          <h2 className="text-2xl font-bold">Pertanyaan yang Sering Diajukan</h2>
        </div>
        <div className="mx-auto max-w-3xl">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="text-center bg-primary text-primary-foreground rounded-3xl p-12">
        <h2 className="text-2xl font-bold mb-4">Siap Mencoba eSIM?</h2>
        <p className="mb-6 text-primary-foreground/80 max-w-xl mx-auto">
          Jelajahi paket eSIM kami dan nikmati konektivitas tanpa batas di seluruh dunia.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" variant="secondary" asChild>
            <Link href="/store">
              Lihat Paket eSIM
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary" asChild>
            <Link href="/device-compatibility">Cek Kompatibilitas</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
