import { Metadata } from "next"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Package, Clock, CheckCircle, XCircle, AlertCircle, ArrowRight, ShoppingBag } from "lucide-react"
import type { Order, OrderItem } from "@/types/database"

export const metadata: Metadata = {
  title: "Pesanan Saya",
  description: "Lihat riwayat pesanan eSIM Anda.",
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ElementType }> = {
  pending: { label: "Menunggu Pembayaran", variant: "secondary", icon: Clock },
  paid: { label: "Dibayar", variant: "default", icon: CheckCircle },
  processing: { label: "Diproses", variant: "secondary", icon: Package },
  completed: { label: "Selesai", variant: "default", icon: CheckCircle },
  cancelled: { label: "Dibatalkan", variant: "destructive", icon: XCircle },
  failed: { label: "Gagal", variant: "destructive", icon: AlertCircle },
}

interface OrderWithItems extends Order {
  order_items: OrderItem[]
}

async function getOrdersWithItems(userId: string): Promise<OrderWithItems[]> {
  const supabase = await createClient()

  // Get orders first
  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (ordersError) {
    console.error("Error fetching orders:", ordersError)
    return []
  }

  if (!orders || orders.length === 0) return []

  // Get order items for all orders
  const orderIds = orders.map(o => o.id)
  const { data: orderItems, error: itemsError } = await supabase
    .from("order_items")
    .select("*")
    .in("order_id", orderIds)

  if (itemsError) {
    console.error("Error fetching order items:", itemsError)
  }

  // Combine orders with their items
  const ordersWithItems: OrderWithItems[] = orders.map(order => ({
    ...order,
    order_items: (orderItems || []).filter(item => item.order_id === order.id)
  }))

  return ordersWithItems
}

export default async function OrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const orders = await getOrdersWithItems(user.id)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Pesanan Saya</h1>
        <p className="text-muted-foreground">
          Lihat dan kelola semua pesanan eSIM Anda.
        </p>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">Belum Ada Pesanan</h3>
            <p className="text-muted-foreground mb-6">
              Anda belum memiliki pesanan. Mulai jelajahi paket eSIM kami!
            </p>
            <Button asChild>
              <Link href="/store">
                Jelajahi Paket eSIM
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const status = order.status || "pending"
            const config = statusConfig[status] || statusConfig.pending
            const StatusIcon = config.icon

            const itemCount = order.order_items?.length || 0
            const hasDiscount = (order.total_discount_cents || 0) > 0

            return (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg">{order.order_number}</CardTitle>
                      <CardDescription>
                        Dipesan pada {order.created_at ? formatDate(order.created_at) : "-"}
                      </CardDescription>
                    </div>
                    <Badge variant={config.variant}>
                      <StatusIcon className="mr-1 h-3 w-3" />
                      {config.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      {order.order_items && order.order_items.length > 0 ? (
                        <>
                          {order.order_items.map((item, idx) => (
                            <div key={item.id} className={idx > 0 ? "mt-2" : ""}>
                              <p className="font-medium">{item.package_name}</p>
                              <p className="text-sm text-muted-foreground">
                                Qty: {item.quantity || 1}
                              </p>
                            </div>
                          ))}
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          {itemCount} item
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary">
                        {formatCurrency(order.total_cents, order.currency_code || "IDR", "paddle")}
                      </p>
                      {hasDiscount && (
                        <p className="text-xs text-muted-foreground line-through">
                          {formatCurrency(order.subtotal_cents, order.currency_code || "IDR", "paddle")}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Pending order - show pay button or expired message */}
                  {status === "pending" && (() => {
                    const createdAt = order.created_at ? new Date(order.created_at) : null
                    const now = new Date()
                    const hoursSinceCreated = createdAt
                      ? (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)
                      : 0
                    const isExpired = hoursSinceCreated > 24

                    if (isExpired) {
                      return (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-sm text-destructive">
                            Pesanan ini telah kedaluwarsa. Silakan buat pesanan baru.
                          </p>
                          <Button variant="outline" size="sm" className="mt-2" asChild>
                            <Link href="/store">
                              Beli Lagi
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      )
                    }

                    if (order.paddle_checkout_url) {
                      return (
                        <div className="mt-4 pt-4 border-t">
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                              Selesaikan pembayaran dalam {Math.ceil(24 - hoursSinceCreated)} jam
                            </p>
                            <Button size="sm" asChild>
                              <a href={order.paddle_checkout_url} target="_blank" rel="noopener noreferrer">
                                Lanjutkan Pembayaran
                                <ArrowRight className="ml-2 h-4 w-4" />
                              </a>
                            </Button>
                          </div>
                        </div>
                      )
                    }

                    return null
                  })()}

                  {status === "completed" && (
                    <div className="mt-4 pt-4 border-t">
                      <Button variant="outline" size="sm" asChild>
                        <Link href="/esims">
                          Lihat eSIM
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
