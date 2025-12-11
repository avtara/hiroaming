import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Package, Smartphone, User, Settings, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"

const sidebarLinks = [
  {
    href: "/orders",
    label: "Pesanan Saya",
    icon: Package,
  },
  {
    href: "/esims",
    label: "eSIM Saya",
    icon: Smartphone,
  },
  {
    href: "/profile",
    label: "Profil",
    icon: User,
  },
  {
    href: "/settings",
    label: "Pengaturan",
    icon: Settings,
  },
]

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?redirect=/orders")
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-4">
        {/* Sidebar */}
        <aside className="lg:col-span-1">
          <nav className="space-y-2 sticky top-24">
            {sidebarLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors"
              >
                <link.icon className="h-5 w-5" />
                <span>{link.label}</span>
              </Link>
            ))}
            <form action="/signout" method="post">
              <button
                type="submit"
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-destructive/10 text-destructive transition-colors w-full text-left"
              >
                <LogOut className="h-5 w-5" />
                <span>Keluar</span>
              </button>
            </form>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="lg:col-span-3">{children}</main>
      </div>
    </div>
  )
}
