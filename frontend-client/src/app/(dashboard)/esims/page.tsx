import { Metadata } from "next"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Smartphone, ArrowRight } from "lucide-react"
import type { EsimProfile, EsimPackage } from "@/types/database"
import { EsimDetailCard } from "@/components/esim/EsimDetailCard"

export const metadata: Metadata = {
  title: "eSIM Saya",
  description: "Kelola dan pantau eSIM Anda.",
}

interface EsimProfileWithPackage extends EsimProfile {
  packageInfo?: Partial<EsimPackage> | null
}

async function getUserEsimProfiles(): Promise<EsimProfileWithPackage[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  // Get user's orders first
  const { data: orders } = await supabase
    .from("orders")
    .select("id")
    .eq("user_id", user.id)

  if (!orders || orders.length === 0) return []

  const orderIds = orders.map(o => o.id)

  // Get esim profiles for those orders
  const { data: profiles, error } = await supabase
    .from("esim_profiles")
    .select("*")
    .in("order_id", orderIds)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching eSIM profiles:", error)
    return []
  }

  if (!profiles || profiles.length === 0) return []

  // Get order_items to find package codes
  const orderItemIds = profiles
    .map(p => p.order_item_id)
    .filter((id): id is string => id !== null)

  const { data: orderItems } = await supabase
    .from("order_items")
    .select("id, package_id, package_code")
    .in("id", orderItemIds)

  // Get unique package IDs
  const packageIds = [...new Set(
    orderItems?.map(item => item.package_id).filter((id): id is string => id !== null) || []
  )]

  // Fetch package info for coverage, support_topup, etc.
  let packages: Record<string, Partial<EsimPackage>> = {}
  if (packageIds.length > 0) {
    const { data: packageData } = await supabase
      .from("esim_packages")
      .select("id, support_topup, operator_list, ip_export, speed, duration, duration_unit, location_codes, location_names")
      .in("id", packageIds)

    if (packageData) {
      packages = packageData.reduce((acc, pkg) => {
        acc[pkg.id] = pkg
        return acc
      }, {} as Record<string, Partial<EsimPackage>>)
    }
  }

  // Map package info to profiles
  const profilesWithPackage: EsimProfileWithPackage[] = profiles.map(profile => {
    const orderItem = orderItems?.find(item => item.id === profile.order_item_id)
    const packageInfo = orderItem?.package_id ? packages[orderItem.package_id] : null
    return {
      ...profile,
      packageInfo
    }
  })

  return profilesWithPackage
}

export default async function EsimsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const esimProfiles = await getUserEsimProfiles()

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">eSIM Saya</h1>
        <p className="text-muted-foreground">
          Kelola dan pantau semua eSIM Anda.
        </p>
      </div>

      {esimProfiles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Smartphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">Belum Ada eSIM</h3>
            <p className="text-muted-foreground mb-6">
              Anda belum memiliki eSIM. Beli paket eSIM untuk mulai!
            </p>
            <Button asChild>
              <Link href="/store">
                Beli eSIM
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {esimProfiles.map((esim) => (
            <EsimDetailCard
              key={esim.id}
              esim={esim}
              packageInfo={esim.packageInfo}
              userEmail={user.email || ""}
              userId={user.id}
              showActivationCodes={true}
            />
          ))}
        </div>
      )}
    </div>
  )
}
