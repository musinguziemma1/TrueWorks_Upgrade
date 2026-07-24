"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  ShieldCheck,
  RotateCcw,
  Smartphone,
  CreditCard,
  Check,
  ChevronRight,
  Mail,
  User,
  Loader2,
  Tag,
} from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { useCart } from "@/components/layout/cart-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type PaymentMethod = "mtn" | "airtel" | "card";

const steps = [
  { label: "Cart", href: "/cart", done: true },
  { label: "Checkout", href: "/checkout", done: false },
  { label: "Confirmation", href: "/order-confirmation", done: false },
];

const paymentMethods: { value: PaymentMethod; label: string; note: string; icon: typeof Smartphone }[] = [
  { value: "mtn", label: "MTN Mobile Money", note: "Pay with your MTN line", icon: Smartphone },
  { value: "airtel", label: "Airtel Money", note: "Pay with your Airtel line", icon: Smartphone },
  { value: "card", label: "Visa / Mastercard", note: "Debit or credit card", icon: CreditCard },
];

export default function CheckoutContent() {
  const router = useRouter();
  const { items, totalItems, totalPrice, clearCart } = useCart();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("mtn");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    setIsSubmitting(true);
    try {
      const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
      const response = await fetch(`${convexUrl}/api/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            slug: item.slug,
            quantity: item.quantity,
          })),
          customerEmail: email,
          customerName: `${firstName} ${lastName}`,
          paymentMethod: paymentMethod === "mtn" ? "MTN MoMo" : paymentMethod === "airtel" ? "Airtel Money" : "Card",
          couponCode: appliedCoupon?.code || undefined,
        }),
      });

      const result = await response.json();

      if (result.success) {
        clearCart();
        router.push(`/order-confirmation?order=${result.orderNumber}&total=${result.total}`);
      } else {
        throw new Error(result.error || "Checkout failed");
      }
    } catch (error) {
      toast.error("Checkout failed", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-surface">
        <div className="mx-auto max-w-md px-6 text-center">
          <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-card">
            <ShoppingBag className="h-9 w-9 text-muted/60" />
          </span>
          <h1 className="mt-6 font-heading text-2xl font-semibold text-primary">
            Your cart is empty
          </h1>
          <p className="mt-2 text-sm text-muted">
            Add some templates before checking out.
          </p>
          <Link href="/store" className="mt-8 inline-block">
            <Button size="lg" className="gradient-gold px-7 font-semibold text-primary-dark hover:brightness-105">
              Browse the Store
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto max-w-6xl px-6 py-12 lg:px-8">
        <div className="mb-6">
          <h1 className="font-heading text-3xl font-semibold text-primary md:text-4xl">
            Secure Checkout
          </h1>
          <p className="mt-2 text-sm text-muted">
            Complete your purchase as a guest - no account required.
          </p>
        </div>

        <ol className="mb-10 flex flex-wrap items-center gap-2 text-sm">
          {steps.map((step, idx) => (
            <li key={step.label} className="flex items-center gap-2">
              <span
                className={cn(
                  "flex items-center gap-2 rounded-full px-3.5 py-1.5",
                  step.label === "Checkout"
                    ? "bg-primary font-semibold text-white"
                    : "text-muted"
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold",
                    step.label === "Checkout" ? "bg-white/20 text-white" : "bg-white text-muted shadow-sm"
                  )}
                >
                  {step.done ? <Check className="h-3 w-3" /> : idx + 1}
                </span>
                {step.label}
              </span>
              {idx < steps.length - 1 && <ChevronRight className="h-4 w-4 text-border" />}
            </li>
          ))}
        </ol>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Card className="border-border/70 shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2.5 text-lg">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/[0.06]">
                      <Mail className="h-4 w-4 text-primary" />
                    </span>
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-11"
                    />
                    <p className="text-xs text-muted">
                      Your download links will be sent here.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+256 700 000 000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      className="h-11"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/70 shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2.5 text-lg">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/[0.06]">
                      <User className="h-4 w-4 text-primary" />
                    </span>
                    Customer Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First name</Label>
                    <Input
                      id="firstName"
                      placeholder="John"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last name</Label>
                    <Input
                      id="lastName"
                      placeholder="Doe"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      className="h-11"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/70 shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2.5 text-lg">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/[0.06]">
                      <Tag className="h-4 w-4 text-primary" />
                    </span>
                    Coupon Code
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter coupon code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="h-11"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (couponCode) {
                          setAppliedCoupon({ code: couponCode, discount: 0 });
                          toast.success("Coupon applied", { description: "Discount will be calculated at payment" });
                        }
                      }}
                    >
                      Apply
                    </Button>
                  </div>
                  {appliedCoupon && (
                    <p className="mt-2 text-sm text-success">
                      Coupon "{appliedCoupon.code}" applied
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/70 shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2.5 text-lg">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/[0.06]">
                      <CreditCard className="h-4 w-4 text-primary" />
                    </span>
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={(v) => {
                      if (v) setPaymentMethod(v as PaymentMethod);
                    }}
                    className="grid grid-cols-1 gap-3 sm:grid-cols-3"
                  >
                    {paymentMethods.map((method) => {
                      const selected = paymentMethod === method.value;
                      return (
                        <Label
                          key={method.value}
                          className={cn(
                            "relative flex cursor-pointer flex-col gap-2 rounded-xl border-2 p-4 transition-all",
                            selected
                              ? "border-accent bg-accent/[0.06] shadow-sm"
                              : "border-border bg-white hover:border-primary/30"
                          )}
                        >
                          <RadioGroupItem value={method.value} className="sr-only" />
                          <div className="flex items-center justify-between">
                            <span
                              className={cn(
                                "flex h-9 w-9 items-center justify-center rounded-lg",
                                selected ? "gradient-gold text-primary-dark" : "bg-surface text-muted"
                              )}
                            >
                              <method.icon className="h-4 w-4" />
                            </span>
                            {selected && (
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent">
                                <Check className="h-3 w-3 text-primary-dark" />
                              </span>
                            )}
                          </div>
                          <span className={cn("text-sm font-semibold", selected ? "text-primary" : "text-foreground/80")}>
                            {method.label}
                          </span>
                          <span className="text-xs text-muted">{method.note}</span>
                        </Label>
                      );
                    })}
                  </RadioGroup>
                  <p className="mt-4 flex items-center gap-2 text-xs text-muted">
                    <ShieldCheck className="h-4 w-4 text-success" />
                    You will receive a prompt to authorize the payment on your
                    {paymentMethod === "card" ? " bank app or card" : " phone"}.
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-28 rounded-xl border border-border/70 bg-white p-6 shadow-card">
                <h2 className="font-heading text-lg font-semibold text-primary">
                  Order Summary
                </h2>

                <div className="mt-4 max-h-60 divide-y divide-border overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3 py-3 first:pt-0">
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className={cn(
                            "h-10 w-10 shrink-0 rounded-lg bg-gradient-to-br",
                            item.image || "from-primary to-primary-light"
                          )}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                          <p className="text-xs text-muted">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <span className="whitespace-nowrap text-sm font-medium">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                <dl className="mt-4 space-y-2.5 border-t border-border pt-4 text-sm">
                  <div className="flex justify-between text-muted">
                    <dt>Subtotal ({totalItems} items)</dt>
                    <dd className="font-medium text-foreground">{formatPrice(totalPrice)}</dd>
                  </div>
                  <div className="flex items-baseline justify-between pt-1">
                    <dt className="font-heading text-base font-semibold text-primary">Total</dt>
                    <dd className="font-heading text-xl font-bold text-primary">
                      {formatPrice(totalPrice)}
                    </dd>
                  </div>
                </dl>

                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="mt-5 w-full gradient-gold text-sm font-semibold text-primary-dark shadow-md shadow-accent/20 hover:brightness-105"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Pay ${formatPrice(totalPrice)}`
                  )}
                </Button>

                <div className="mt-5 space-y-2.5">
                  <p className="flex items-center gap-2.5 text-xs text-muted">
                    <ShieldCheck className="h-4 w-4 text-success" />
                    SSL-secured payment
                  </p>
                  <p className="flex items-center gap-2.5 text-xs text-muted">
                    <RotateCcw className="h-4 w-4 text-secondary" />
                    30-day money-back guarantee
                  </p>
                </div>

                <p className="mt-5 border-t border-border pt-4 text-center text-xs text-muted">
                  By completing this purchase you agree to our terms of service
                  and privacy policy.
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
