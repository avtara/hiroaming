import Link from "next/link"

const footerNavigation = {
  product: [
    { name: "Store", href: "/store" },
    { name: "Cek Pesanan", href: "/check-order" },
  ],
  info: [
    { name: "Apa itu eSIM?", href: "/esim-info" },
    { name: "Kompatibilitas Perangkat", href: "/device-compatibility" },
    { name: "Blog", href: "/blog" },
  ],
  company: [
    { name: "Tentang Kami", href: "/about" },
    { name: "Kontak", href: "/contact" },
  ],
  legal: [
    { name: "Syarat & Ketentuan", href: "/terms" },
    { name: "Kebijakan Privasi", href: "/privacy" },
  ],
}

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-primary">HIROAM</span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground">
              Solusi eSIM terbaik untuk kebutuhan konektivitas internasional Anda.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-sm font-semibold">Produk</h3>
            <ul className="mt-4 space-y-3">
              {footerNavigation.product.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h3 className="text-sm font-semibold">Informasi</h3>
            <ul className="mt-4 space-y-3">
              {footerNavigation.info.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold">Perusahaan</h3>
            <ul className="mt-4 space-y-3">
              {footerNavigation.company.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold">Legal</h3>
            <ul className="mt-4 space-y-3">
              {footerNavigation.legal.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t pt-8">
          <p className="text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} HIROAM. Semua hak dilindungi.
          </p>
        </div>
      </div>
    </footer>
  )
}
