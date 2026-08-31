"use client";

import { useState, useCallback } from "react";
import { useQuery } from "convex/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@convex/_generated/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  ShoppingBag,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  Smartphone,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/provider";

function fmtMoney(n: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}
function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

type PaymentProvider = "pesapal" | "stripe";
type PesapalMethod = "mtn" | "airtel" | "card";

const paymentProviders: {
  value: PaymentProvider;
  label: string;
  note: string;
  icon: typeof Smartphone;
}[] = [
  { value: "pesapal", label: "Pesapal", note: "Mobile Money & Card", icon: Smartphone },
  { value: "stripe", label: "Stripe", note: "International Cards", icon: CreditCard },
];

const pesapalMethods: {
  value: PesapalMethod;
  label: string;
  icon: typeof Smartphone;
}[] = [
  { value: "mtn", label: "MTN Mobile Money", icon: Smartphone },
  { value: "airtel", label: "Airtel Money", icon: Smartphone },
  { value: "card", label: "Visa / Mastercard", icon: CreditCard },
];

export default function OrdersContent() {
  const router = useRouter();
  const { getToken } = useAuth();
  const orders = useQuery(api.orders.listMine);

  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<(typeof orders extends undefined ? never : NonNullable<typeof orders>[number]) | null>(null);
  const [paymentProvider, setPaymentProvider] = useState<PaymentProvider>("pesapal");
  const [pesapalMethod, setPesapalMethod] = useState<PesapalMethod>("mtn");
  const [phone, setPhone] = useState("");
  const [paying, setPaying] = useState(false);
  const [pesapalRedirectUrl, setPesapalRedirectUrl] = useState<string | null>(null);

  const openPayDialog = useCallback((order: NonNullable<typeof orders>[number]) => {
    setSelectedOrder(order);
    setPaymentProvider("pesapal");
    setPesapalMethod("mtn");
    setPhone("");
    setPesapalRedirectUrl(null);
    setPayDialogOpen(true);
  }, []);

  const closePayDialog = useCallback(() => {
    setPayDialogOpen(false);
    setSelectedOrder(null);
    setPesapalRedirectUrl(null);
  }, []);

  const initiatePayment = useCallback(async () => {
    if (!selectedOrder) return;
    setPaying(true);
    try {
      const token = await getToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      if (paymentProvider === "pesapal") {
        const res = await fetch("/api/pesapal/initiate", {
          method: "POST",
          headers,
          body: JSON.stringify({
            orderId: selectedOrder._id,
            phone,
            method:
              pesapalMethod === "mtn"
                ? "MTN MoMo"
                : pesapalMethod === "airtel"
                ? "Airtel Money"
                : "Card",
          }),
        });
        const data = await res.json();
        if (data.success && data.redirectUrl) {
          setPesapalRedirectUrl(data.redirectUrl);
          toast.success("Opening payment page...");
        } else {
          toast.error(data.error ?? "Failed to initiate payment");
        }
      } else {
        const res = await fetch("/api/stripe/create-payment-intent", {
          method: "POST",
          headers,
          body: JSON.stringify({ orderId: selectedOrder._id }),
        });
        const data = await res.json();
        if (data.success && data.clientSecret) {
          const stripe = await loadStripeKey();
          if (stripe) {
            const { error } = await stripe.confirmCardPayment(data.clientSecret);
            if (error) {
              toast.error(error.message ?? "Payment failed");
            } else {
              toast.success("Payment successful!");
              closePayDialog();
              router.refresh();
            }
          }
        } else {
          toast.error(data.error ?? "Failed to create payment");
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setPaying(false);
    }
  }, [selectedOrder, paymentProvider, pesapalMethod, phone, getToken, closePayDialog, router]);

  if (orders === undefined) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }
  if (orders.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBag className="h-12 w-12" />}
        title="No orders yet"
        description="When you purchase a product, it will appear here."
      />
    );
  }

  const completed = orders.filter((o) => o.paymentStatus === "completed").length;
  const pending = orders.filter((o) => o.paymentStatus === "pending");
  const totalSpent = orders
    .filter((o) => o.paymentStatus === "completed")
    .reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Total Orders", value: orders.length, icon: ShoppingBag, color: "text-[#0B2545]" },
          { label: "Total Spent", value: fmtMoney(totalSpent), icon: CreditCard, color: "text-[#3E6990]" },
          { label: "Completed", value: completed, icon: CheckCircle2, color: "text-emerald-600" },
          { label: "Pending Payment", value: pending.length, icon: Clock, color: "text-amber-600" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs uppercase tracking-wide text-muted">{s.label}</p>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <p className={`font-heading text-2xl font-bold ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pending Payments Section */}
      {pending.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/30">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-100 p-2">
                <AlertCircle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Pending Payments</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Complete payment for these orders to access your downloads.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pending.map((o) => (
                <div
                  key={o._id}
                  className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-amber-100 p-2">
                      <Clock className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-primary">{o.orderNumber}</p>
                        <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                          Pending
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {fmtDate(o._creationTime)} · {o.items.length} item{o.items.length === 1 ? "" : "s"} · {o.paymentMethod}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-heading text-lg font-bold text-primary">{fmtMoney(o.total)}</p>
                    <Button
                      size="sm"
                      onClick={() => openPayDialog(o)}
                      className="gradient-gold text-primary-dark font-semibold"
                    >
                      <CreditCard className="h-4 w-4 mr-1.5" />
                      Pay Now
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Orders Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-center">Payment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o._id}>
                  <TableCell className="font-medium">
                    <Link href={`/account/orders/${o._id}`} className="text-primary hover:underline">
                      {o.orderNumber}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {fmtDate(o._creationTime)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={o.orderStatus} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {o.items.length} item{o.items.length === 1 ? "" : "s"}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {fmtMoney(o.total)}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                      <CreditCard className="h-3.5 w-3.5" />
                      {o.paymentMethod}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pay Now Dialog */}
      <Dialog open={payDialogOpen} onOpenChange={(open) => !open && closePayDialog()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Payment</DialogTitle>
            <DialogDescription>
              {selectedOrder && (
                <>Order {selectedOrder.orderNumber} · {fmtMoney(selectedOrder.total)}</>
              )}
            </DialogDescription>
          </DialogHeader>

          {pesapalRedirectUrl ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
                <Smartphone className="h-5 w-5 text-blue-600 mt-0.5" />
                <p className="text-sm text-blue-800">Complete your payment in the window below. You&apos;ll return here once confirmed.</p>
              </div>
              <iframe
                src={pesapalRedirectUrl}
                title="Payment"
                className="h-[60vh] w-full rounded-lg border bg-white"
                allow="payment"
                allowFullScreen
              />
              <Button variant="outline" className="w-full" onClick={closePayDialog}>
                Close
              </Button>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Provider Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Payment Provider</Label>
                <RadioGroup
                  value={paymentProvider}
                  onValueChange={(v) => setPaymentProvider(v as PaymentProvider)}
                  className="grid grid-cols-2 gap-3"
                >
                  {paymentProviders.map((provider) => {
                    const selected = paymentProvider === provider.value;
                    return (
                      <Label
                        key={provider.value}
                        className={cn(
                          "relative flex cursor-pointer flex-col gap-1.5 rounded-xl border-2 p-3 transition-all",
                          selected
                            ? "border-amber-400 bg-amber-50/50"
                            : "border-border hover:border-primary/30"
                        )}
                      >
                        <RadioGroupItem value={provider.value} className="sr-only" />
                        <div className="flex items-center gap-2">
                          <provider.icon className={cn("h-4 w-4", selected ? "text-amber-600" : "text-muted-foreground")} />
                          <span className={cn("text-sm font-semibold", selected ? "text-primary" : "text-foreground/80")}>
                            {provider.label}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">{provider.note}</span>
                      </Label>
                    );
                  })}
                </RadioGroup>
              </div>

              {/* Pesapal Method Selection */}
              {paymentProvider === "pesapal" && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Mobile Money Provider</Label>
                  <RadioGroup
                    value={pesapalMethod}
                    onValueChange={(v) => setPesapalMethod(v as PesapalMethod)}
                    className="grid grid-cols-3 gap-2"
                  >
                    {pesapalMethods.map((method) => {
                      const selected = pesapalMethod === method.value;
                      return (
                        <Label
                          key={method.value}
                          className={cn(
                            "flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border p-3 transition-all",
                            selected
                              ? "border-amber-400 bg-amber-50/50"
                              : "border-border hover:border-primary/30"
                          )}
                        >
                          <RadioGroupItem value={method.value} className="sr-only" />
                          <method.icon className={cn("h-4 w-4", selected ? "text-amber-600" : "text-muted-foreground")} />
                          <span className={cn("text-xs font-medium", selected ? "text-primary" : "text-foreground/80")}>
                            {method.label}
                          </span>
                        </Label>
                      );
                    })}
                  </RadioGroup>
                </div>
              )}

              {/* Phone for Pesapal */}
              {paymentProvider === "pesapal" && (
                <div className="space-y-2">
                  <Label htmlFor="pay-phone" className="text-sm font-medium">Phone Number</Label>
                  <input
                    id="pay-phone"
                    type="tel"
                    placeholder="+256 700 000 000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                  <p className="text-xs text-muted-foreground">You&apos;ll receive a prompt to authorize payment on this number.</p>
                </div>
              )}

              {/* Stripe note */}
              {paymentProvider === "stripe" && (
                <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  Secure card payment powered by Stripe.
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  className="flex-1 gradient-gold text-primary-dark font-semibold"
                  onClick={initiatePayment}
                  disabled={paying}
                >
                  {paying ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CreditCard className="h-4 w-4 mr-2" />
                  )}
                  {paymentProvider === "pesapal" ? "Pay with Pesapal" : "Pay with Card"}
                </Button>
                <Button variant="outline" onClick={closePayDialog} disabled={paying}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

async function loadStripeKey() {
  const { loadStripe } = await import("@stripe/stripe-js");
  return loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "");
}
