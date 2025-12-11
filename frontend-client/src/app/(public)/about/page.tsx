import { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Users, Globe, Shield, Heart, Target, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Tentang Kami",
  description: "Kenali lebih dekat HIROAM, penyedia layanan eSIM terpercaya di Indonesia.",
}

const values = [
  {
    icon: Globe,
    title: "Konektivitas Global",
    description: "Kami berkomitmen untuk menghubungkan Anda dengan dunia, di mana pun Anda berada.",
  },
  {
    icon: Shield,
    title: "Keamanan Terjamin",
    description: "Data dan privasi Anda adalah prioritas utama kami dengan enkripsi tingkat tinggi.",
  },
  {
    icon: Heart,
    title: "Pelayanan Sepenuh Hati",
    description: "Tim support kami siap membantu Anda 24/7 dengan respons cepat dan ramah.",
  },
  {
    icon: Zap,
    title: "Inovasi Berkelanjutan",
    description: "Terus berinovasi untuk memberikan solusi konektivitas terbaik dan terdepan.",
  },
]

const stats = [
  { value: "100K+", label: "Pengguna Aktif" },
  { value: "150+", label: "Negara Terjangkau" },
  { value: "99.9%", label: "Uptime Layanan" },
  { value: "4.9/5", label: "Rating Pengguna" },
]

const team = [
  {
    name: "Ahmad Rizki",
    role: "CEO & Founder",
    image: "/team/ceo.jpg",
    description: "Visioner di balik HIROAM dengan pengalaman 15 tahun di industri telekomunikasi.",
  },
  {
    name: "Sarah Wijaya",
    role: "CTO",
    image: "/team/cto.jpg",
    description: "Ahli teknologi yang memastikan infrastruktur kami selalu terdepan.",
  },
  {
    name: "Budi Santoso",
    role: "Head of Operations",
    image: "/team/ops.jpg",
    description: "Menjaga operasional berjalan lancar untuk pengalaman pengguna terbaik.",
  },
  {
    name: "Maya Putri",
    role: "Customer Success Lead",
    image: "/team/cs.jpg",
    description: "Memastikan setiap pelanggan mendapatkan pengalaman luar biasa.",
  },
]

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold md:text-5xl mb-4">
          Tentang <span className="text-primary">HIROAM</span>
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          Kami adalah pelopor layanan eSIM di Indonesia, berkomitmen untuk menghubungkan
          Anda dengan dunia tanpa batas.
        </p>
      </div>

      {/* Mission Section */}
      <section className="mb-16">
        <div className="grid gap-8 md:grid-cols-2 items-center">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Target className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Misi Kami</h2>
            </div>
            <p className="text-muted-foreground mb-4">
              HIROAM hadir dengan misi untuk membuat konektivitas global menjadi lebih
              mudah, terjangkau, dan dapat diakses oleh semua orang. Kami percaya bahwa
              setiap orang berhak untuk tetap terhubung, di mana pun mereka berada.
            </p>
            <p className="text-muted-foreground mb-6">
              Dengan teknologi eSIM, kami menghilangkan kerumitan kartu SIM fisik dan
              memberikan kebebasan untuk beralih antar paket data dengan mudah.
            </p>
            <Button asChild>
              <Link href="/store">
                Jelajahi Paket Kami
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="relative h-[300px] md:h-[400px] rounded-3xl overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
            <div className="absolute inset-0 flex items-center justify-center">
              <Globe className="h-32 w-32 text-primary/30" />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="mb-16 bg-muted/50 -mx-4 px-4 py-12 md:rounded-3xl md:mx-0 md:px-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-primary">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Values Section */}
      <section className="mb-16">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">Nilai-Nilai Kami</h2>
          <p className="text-muted-foreground">
            Prinsip yang menjadi fondasi setiap keputusan kami
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {values.map((value) => (
            <Card key={value.title}>
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
                  <value.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{value.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{value.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Team Section */}
      <section className="mb-16">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Users className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">Tim Kami</h2>
          </div>
          <p className="text-muted-foreground">
            Orang-orang hebat di balik HIROAM
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {team.map((member) => (
            <Card key={member.name} className="text-center">
              <CardHeader>
                <div className="mx-auto h-24 w-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 mb-4 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">
                    {member.name.split(" ").map(n => n[0]).join("")}
                  </span>
                </div>
                <CardTitle className="text-lg">{member.name}</CardTitle>
                <CardDescription className="text-primary font-medium">
                  {member.role}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{member.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center bg-primary text-primary-foreground rounded-3xl p-12">
        <h2 className="text-2xl font-bold mb-4">Siap Bergabung dengan Kami?</h2>
        <p className="mb-6 text-primary-foreground/80 max-w-xl mx-auto">
          Mulai perjalanan Anda dengan HIROAM dan nikmati konektivitas tanpa batas di seluruh dunia.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" variant="secondary" asChild>
            <Link href="/store">
              Lihat Paket eSIM
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary" asChild>
            <Link href="/esim-info">Pelajari eSIM</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
