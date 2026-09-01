"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
  MapPin,
  Loader2,
  Tag,
  AlertCircle,
} from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { useAuth } from "@/lib/auth/provider";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { api } from "@convex/_generated/api";
import { convexClient } from "@/lib/convex";
import { cn } from "@/lib/utils";
import { useCart, cartItemKey } from "@/components/layout/cart-context";
import { useAnalytics } from "@/lib/use-analytics";
import { useFormatPrice } from "@/lib/use-format-price";
import { useSettings } from "@/lib/settings-context";
import { COUNTRIES } from "@/lib/countries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";

type PaymentProvider = "pesapal" | "stripe";
type PesapalMethod = "mtn" | "airtel" | "card";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ""
);

const steps = [
  { label: "Cart", href: "/cart", done: true },
  { label: "Checkout", href: "/checkout", done: false },
  { label: "Confirmation", href: "/order-confirmation", done: false },
];

const pesapalMethods: {
  value: PesapalMethod;
  label: string;
  note: string;
  icon: typeof Smartphone;
}[] = [
  { value: "mtn", label: "MTN Mobile Money", note: "Pay with your MTN line", icon: Smartphone },
  { value: "airtel", label: "Airtel Money", note: "Pay with your Airtel line", icon: Smartphone },
  { value: "card", label: "Visa / Mastercard", note: "Debit or credit card", icon: CreditCard },
];

function StripePaymentForm({
  onSuccess,
  onError,
}: {
  clientSecret: string;
  onSuccess: () => void;
  onError: (msg: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/order-confirmation`,
        },
        redirect: "if_required",
      });

      if (error) {
        onError(error.message ?? "Payment failed");
      } else {
        onSuccess();
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <PaymentElement />
      <Button
        size="lg"
        disabled={!stripe || processing}
        onClick={handleSubmit}
        className="w-full gradient-gold text-sm font-semibold text-primary-dark shadow-md shadow-accent/20 hover:brightness-105"
      >
        {processing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          "Pay with Card"
        )}
      </Button>
    </div>
  );
}

export default function CheckoutContent() {
  const formatPrice = useFormatPrice();
  const router = useRouter();
  const { track } = useAnalytics();
  const { items, totalItems, totalPrice, clearCart } = useCart();
  const { loading: authLoaded, isAuthenticated: isSignedIn, getToken, user } = useAuth();
  const { currency, pesapalEnabled, stripeEnabled, taxRate, taxAutoCalculate } = useSettings();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address, setAddress] = useState({
    street: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
  });
  const [paymentProvider, setPaymentProvider] = useState<PaymentProvider>("pesapal");
  const [pesapalMethod, setPesapalMethod] = useState<PesapalMethod>("mtn");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(
    null
  );
  const [couponLoading, setCouponLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [convexOrderId, setConvexOrderId] = useState<string | null>(null);
  const [pesapalDialogOpen, setPesapalDialogOpen] = useState(false);
  const [pesapalRedirectUrl, setPesapalRedirectUrl] = useState<string | null>(null);

  useEffect(() => {
    track("reach_checkout", { value: totalPrice });
  }, [track, totalPrice]);

  // Prefill contact fields from the signed-in user.
  useEffect(() => {
    if (!user) return;
    const primaryEmail = user.email ?? "";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (primaryEmail && !email) setEmail(primaryEmail);
    if (user.name && !firstName && !lastName) {
      const parts = user.name.trim().split(/\s+/);
      if (parts.length > 1) {
        setFirstName(parts[0] ?? "");
        setLastName(parts.slice(1).join(" "));
      } else {
        setFirstName(user.name.trim());
      }
    }
  }, [user, email, firstName, lastName]);

  const getConvexToken = useCallback(async (): Promise<string | null> => {
    try {
      return await getToken();
    } catch {
      return null;
    }
  }, [getToken]);

  const authHeaders = useCallback(async (): Promise<Record<string, string>> => {
    const token = await getConvexToken();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
  }, [getConvexToken]);

  const discountAmount = appliedCoupon?.discount ?? 0;
  const displayTotal = Math.max(0, totalPrice - discountAmount);

  const paymentProviders = useMemo(() => {
    return [
      ...(pesapalEnabled ? [{ value: "pesapal" as const, label: "Pesapal", note: "Mobile Money & Card", icon: Smartphone as typeof Smartphone }] : []),
      ...(stripeEnabled ? [{ value: "stripe" as const, label: "Stripe", note: "International Cards", icon: CreditCard as typeof CreditCard }] : []),
    ];
  }, [pesapalEnabled, stripeEnabled]);

  // Ensure paymentProvider is always a valid available provider
  const safePaymentProvider: PaymentProvider =
    paymentProviders.find((p) => p.value === paymentProvider)?.value ??
    paymentProviders[0]?.value ??
    "pesapal";

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    if (!convexClient) {
      toast.error("Service unavailable", { description: "Please try again later" });
      return;
    }
    setCouponLoading(true);
    try {
      const result = await convexClient.query(api.coupons.validate, {
        code: couponCode.trim().toUpperCase(),
      });
      if (!result.valid || !result.coupon) {
        setAppliedCoupon(null);
        toast.error("Invalid coupon", { description: result.error ?? "This coupon cannot be used" });
        return;
      }
      const coupon = result.coupon;
      if (coupon.minPurchase && totalPrice < coupon.minPurchase) {
        setAppliedCoupon(null);
        toast.error("Minimum purchase not met", {
          description: `This coupon requires a minimum purchase of ${coupon.minPurchase.toLocaleString()}`,
        });
        return;
      }
      const discount =
        coupon.type === "percentage"
          ? Math.round(totalPrice * (coupon.value / 100))
          : Math.min(coupon.value, totalPrice);
      setAppliedCoupon({ code: coupon.code, discount });
      // Force a new payment intent with the discounted amount
      setStripeClientSecret(null);
      toast.success("Coupon applied", {
        description: `You save ${discount.toLocaleString()} on this order`,
      });
    } catch {
      toast.error("Could not validate coupon", { description: "Please try again" });
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setStripeClientSecret(null);
  };

  const createStripePaymentIntent = useCallback(async () => {
    try {
      const response = await fetch(`/api/stripe/create-payment-intent`, {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({
          orderId: convexOrderId,
          currency: currency.toLowerCase(),
        }),
      });
      const data = await response.json();
      if (data.success) {
        setStripeClientSecret(data.clientSecret);
      } else {
        throw new Error(data.error || "Failed to initialize payment");
      }
    } catch (err) {
      toast.error("Payment initialization failed", {
        description: err instanceof Error ? err.message : "Please try again",
      });
    }
  }, [authHeaders, convexOrderId, currency]);

  useEffect(() => {
    if (safePaymentProvider !== "stripe" || !convexOrderId || stripeClientSecret) return;
    // Defer to a macrotask so state updates happen outside the effect body.
    const t = window.setTimeout(() => {
      void createStripePaymentIntent();
    }, 0);
    return () => window.clearTimeout(t);
  }, [safePaymentProvider, convexOrderId, stripeClientSecret, createStripePaymentIntent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    if (authLoaded && !isSignedIn) {
      toast.error("Sign in required", {
        description: "Please sign in to complete your order",
      });
      router.push("/sign-in?redirect_url=/checkout");
      return;
    }

    if (safePaymentProvider === "stripe" && orderId) {
      return;
    }

    setIsSubmitting(true);
    try {
      track("payment_start", {
        value: totalPrice,
        email: email.trim() || undefined,
      });
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({
          items: items.map((item) => ({
            slug: item.slug,
            quantity: item.quantity,
            tier: item.tier,
          })),
          customerEmail: email,
          customerName: `${firstName} ${lastName}`.trim(),
          paymentMethod:
            safePaymentProvider === "pesapal"
              ? pesapalMethod === "mtn"
                ? "MTN MoMo"
                : pesapalMethod === "airtel"
                ? "Airtel Money"
                : "Card"
              : "Stripe Card",
          couponCode: appliedCoupon?.code || undefined,
          billingAddress: {
            street: address.street.trim() || undefined,
            city: address.city.trim() || undefined,
            state: address.state.trim() || undefined,
            country: address.country.trim() || undefined,
            postalCode: address.postalCode.trim() || undefined,
          },
        }),
      });

      const result = await response.json();

      if (result.success) {
        setOrderId(result.orderNumber);
        setConvexOrderId(result.orderId);

        if (safePaymentProvider === "pesapal") {
          const initiateResponse = await fetch("/api/pesapal/initiate", {
            method: "POST",
            headers: await authHeaders(),
            body: JSON.stringify({
              orderId: result.orderId,
              phone,
              method:
                pesapalMethod === "mtn"
                  ? "MTN MoMo"
                  : pesapalMethod === "airtel"
                  ? "Airtel Money"
                  : "Card",
            }),
          });
          const pesapalResult = await initiateResponse.json();
          if (pesapalResult.success && pesapalResult.redirectUrl) {
            clearCart();
            track("purchase", {
              value: displayTotal,
              email: email.trim() || undefined,
            });
            // Mark abandoned cart as recovered
            if (convexClient) {
              convexClient.mutation(api.abandonedCarts.markRecovered, { email }).catch(() => {});
            }
            // Open the Pesapal payment page in a popup dialog instead of a full-page redirect
            setPesapalRedirectUrl(pesapalResult.redirectUrl);
            setPesapalDialogOpen(true);
          } else {
            throw new Error(pesapalResult.error || "Failed to initialize Pesapal payment");
          }
        }
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

  const handleStripeSuccess = () => {
    clearCart();
    track("purchase", {
      value: displayTotal,
      email: email.trim() || undefined,
    });
    // Mark abandoned cart as recovered
    if (convexClient) {
      convexClient.mutation(api.abandonedCarts.markRecovered, { email }).catch(() => {});
    }
    router.push(`/order-confirmation?order=${orderId}&total=${displayTotal}`);
  };

  const handleStripeError = (msg: string) => {
    toast.error("Payment failed", { description: msg });
  };

  const pesapalPaymentDialog = (
    <Dialog
      open={pesapalDialogOpen}
      onOpenChange={(open) => {
        setPesapalDialogOpen(open);
        if (!open && orderId) {
          router.push(`/order-confirmation?order=${orderId}&status=pending`);
        }
      }}
    >
      <DialogContent className="flex h-[85vh] w-full max-w-[calc(100%-1rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
        <DialogHeader className="border-b border-border px-5 py-3">
          <DialogTitle>Complete Your Payment</DialogTitle>
          <DialogDescription>
            You&apos;ll be returned to the confirmation page once your payment is confirmed.
          </DialogDescription>
        </DialogHeader>
        {pesapalRedirectUrl && (
          <iframe
            src={pesapalRedirectUrl}
            title="Pesapal payment"
            className="min-h-0 flex-1 border-0 bg-white"
            allow="payment"
            allowFullScreen
          />
        )}
        <div className="border-t border-border px-5 py-3">
          <a
            href={pesapalRedirectUrl ?? undefined}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted underline hover:text-foreground"
          >
            Trouble viewing the payment page? Open it in a new tab
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );

  if (authLoaded && !isSignedIn) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-surface">
        <div className="mx-auto max-w-md px-6 text-center">
          <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-card">
            <ShieldCheck className="h-9 w-9 text-muted/60" />
          </span>
          <h1 className="mt-6 font-heading text-2xl font-semibold text-primary">
            Sign in to continue checkout
          </h1>
          <p className="mt-2 text-sm text-muted">
            You must be signed in before completing your order. Your cart is saved and will be
            waiting for you.
          </p>
          <Link href="/sign-in?redirect_url=/checkout" className="mt-8 inline-block">
            <Button
              size="lg"
              className="gradient-gold px-7 font-semibold text-primary-dark hover:brightness-105"
            >
              Sign in to Checkout
            </Button>
          </Link>
          <div className="mt-4">
            <Link href="/store" className="text-sm text-muted underline hover:text-foreground">
              Continue browsing the store
            </Link>
          </div>
        </div>
        {pesapalPaymentDialog}
      </div>
    );
  }

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
            <Button
              size="lg"
              className="gradient-gold px-7 font-semibold text-primary-dark hover:brightness-105"
            >
              Browse the Store
            </Button>
          </Link>
        </div>
        {pesapalPaymentDialog}
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
            You&apos;re signed in — your order will be linked to your account.
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
                    step.label === "Checkout"
                      ? "bg-white/20 text-white"
                      : "bg-white text-muted shadow-sm"
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
                      <MapPin className="h-4 w-4 text-primary" />
                    </span>
                    Billing Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="street">Street address</Label>
                    <Input
                      id="street"
                      placeholder="Street address, P.O. Box"
                      value={address.street}
                      onChange={(e) => setAddress((a) => ({ ...a, street: e.target.value }))}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      placeholder="Kampala"
                      value={address.city}
                      onChange={(e) => setAddress((a) => ({ ...a, city: e.target.value }))}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State / Region</Label>
                    <Input
                      id="state"
                      placeholder="Central Region"
                      value={address.state}
                      onChange={(e) => setAddress((a) => ({ ...a, state: e.target.value }))}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postal code</Label>
                    <Input
                      id="postalCode"
                      placeholder="256"
                      value={address.postalCode}
                      onChange={(e) => setAddress((a) => ({ ...a, postalCode: e.target.value }))}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Select
                      value={address.country}
                      onValueChange={(v) => {
                        if (v) setAddress((a) => ({ ...a, country: v }));
                      }}
                    >
                      <SelectTrigger id="country" className="h-11">
                        <SelectValue placeholder="Select your country" />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-muted sm:col-span-2">
                    Your address helps us understand where our customers are so we can tailor our
                    templates and support to your region.
                  </p>
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
                      disabled={couponLoading || !couponCode.trim()}
                      onClick={applyCoupon}
                    >
                      {couponLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Apply"
                      )}
                    </Button>
                  </div>
                  {appliedCoupon && (
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-sm text-success">
                        Coupon &quot;{appliedCoupon.code}&quot; applied — you save{" "}
                        {formatPrice(appliedCoupon.discount)}
                      </p>
                      <button
                        type="button"
                        onClick={removeCoupon}
                        className="text-xs text-muted underline hover:text-foreground"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {paymentProviders.length === 0 ? (
                <Card className="border-red-200 bg-red-50/30">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-900">No payment methods available</p>
                        <p className="text-xs text-red-700 mt-1">All payment gateways are currently disabled. Please contact support or try again later.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (

              <Card className="border-border/70 shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2.5 text-lg">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/[0.06]">
                      <CreditCard className="h-4 w-4 text-primary" />
                    </span>
                    Payment Provider
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <RadioGroup
                    value={safePaymentProvider}
                    onValueChange={(v) => {
                      if (v) {
                        setPaymentProvider(v as PaymentProvider);
                        setStripeClientSecret(null);
                        setOrderId(null);
                      }
                    }}
                    className="grid grid-cols-1 gap-3 sm:grid-cols-2"
                  >
                    {paymentProviders.map((provider) => {
                      const selected = safePaymentProvider === provider.value;
                      return (
                        <Label
                          key={provider.value}
                          className={cn(
                            "relative flex cursor-pointer flex-col gap-2 rounded-xl border-2 p-4 transition-all",
                            selected
                              ? "border-accent bg-accent/[0.06] shadow-sm"
                              : "border-border bg-white hover:border-primary/30"
                          )}
                        >
                          <RadioGroupItem value={provider.value} className="sr-only" />
                          <div className="flex items-center justify-between">
                            <span
                              className={cn(
                                "flex h-9 w-9 items-center justify-center rounded-lg",
                                selected ? "gradient-gold text-primary-dark" : "bg-surface text-muted"
                              )}
                            >
                              <provider.icon className="h-4 w-4" />
                            </span>
                            {selected && (
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent">
                                <Check className="h-3 w-3 text-primary-dark" />
                              </span>
                            )}
                          </div>
                          <span
                            className={cn(
                              "text-sm font-semibold",
                              selected ? "text-primary" : "text-foreground/80"
                            )}
                          >
                            {provider.label}
                          </span>
                          <span className="text-xs text-muted">{provider.note}</span>
                        </Label>
                      );
                    })}
                  </RadioGroup>

                  {safePaymentProvider === "pesapal" && (
                    <div className="space-y-3">
                      <p className="text-xs font-medium text-muted-foreground">
                        Select mobile money provider:
                      </p>
                      <RadioGroup
                        value={pesapalMethod}
                        onValueChange={(v) => {
                          if (v) setPesapalMethod(v as PesapalMethod);
                        }}
                        className="grid grid-cols-1 gap-2 sm:grid-cols-3"
                      >
                        {pesapalMethods.map((method) => {
                          const selected = pesapalMethod === method.value;
                          return (
                            <Label
                              key={method.value}
                              className={cn(
                                "flex cursor-pointer items-center gap-2 rounded-lg border p-3 transition-all",
                                selected
                                  ? "border-accent bg-accent/[0.06]"
                                  : "border-border hover:border-primary/30"
                              )}
                            >
                              <RadioGroupItem value={method.value} className="sr-only" />
                              <method.icon
                                className={cn(
                                  "h-4 w-4",
                                  selected ? "text-accent" : "text-muted"
                                )}
                              />
                              <span
                                className={cn(
                                  "text-sm",
                                  selected ? "font-semibold text-primary" : "text-foreground/80"
                                )}
                              >
                                {method.label}
                              </span>
                            </Label>
                          );
                        })}
                      </RadioGroup>
                      <p className="flex items-center gap-2 text-xs text-muted">
                        <ShieldCheck className="h-4 w-4 text-success" />
                        You will receive a prompt to authorize the payment on your phone.
                      </p>
                    </div>
                  )}

                  {safePaymentProvider === "stripe" && (
                    <div className="space-y-3">
                      <p className="flex items-center gap-2 text-xs text-muted">
                        <ShieldCheck className="h-4 w-4 text-success" />
                        Secure card payment powered by Stripe.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
              )}

              {safePaymentProvider === "stripe" && stripeClientSecret && (
                <Card className="border-border/70 shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2.5 text-lg">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/[0.06]">
                        <CreditCard className="h-4 w-4 text-primary" />
                      </span>
                      Card Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Elements
                      stripe={stripePromise}
                      options={{
                        clientSecret: stripeClientSecret,
                        appearance: {
                          theme: "stripe",
                          variables: {
                            colorPrimary: "#0B2545",
                            colorBackground: "#ffffff",
                            colorText: "#0B2545",
                            borderRadius: "8px",
                          },
                        },
                      }}
                    >
                      <StripePaymentForm
                        clientSecret={stripeClientSecret}
                        onSuccess={handleStripeSuccess}
                        onError={handleStripeError}
                      />
                    </Elements>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-28 rounded-xl border border-border/70 bg-white p-6 shadow-card">
                <h2 className="font-heading text-lg font-semibold text-primary">
                  Order Summary
                </h2>

                <div className="mt-4 max-h-60 divide-y divide-border overflow-y-auto">
                  {items.map((item) => (
                    <div
                      key={cartItemKey(item)}
                      className="flex items-center justify-between gap-3 py-3 first:pt-0"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className={cn(
                            "h-10 w-10 shrink-0 rounded-lg bg-gradient-to-br",
                            item.image || "from-primary to-primary-light"
                          )}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {item.name}
                            {item.tier && (
                              <span className="ml-1.5 text-xs font-medium text-accent-dark">
                                ({item.tier})
                              </span>
                            )}
                          </p>
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
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-success">
                      <dt>Discount ({appliedCoupon?.code})</dt>
                      <dd className="font-medium">-{formatPrice(discountAmount)}</dd>
                    </div>
                  )}
                  {taxAutoCalculate && taxRate > 0 && (
                    <div className="flex justify-between text-muted">
                      <dt>Tax ({taxRate}%)</dt>
                      <dd className="font-medium">{formatPrice(Math.round(displayTotal * (taxRate / 100) * 100) / 100)}</dd>
                    </div>
                  )}
                  <div className="flex items-baseline justify-between pt-1">
                    <dt className="font-heading text-base font-semibold text-primary">Total</dt>
                    <dd className="font-heading text-xl font-bold text-primary">
                      {formatPrice(taxAutoCalculate && taxRate > 0
                        ? Math.round((displayTotal + displayTotal * (taxRate / 100)) * 100) / 100
                        : displayTotal)}
                    </dd>
                  </div>
                </dl>

                {safePaymentProvider === "pesapal" && (
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
                      `Pay ${formatPrice(displayTotal)}`
                    )}
                  </Button>
                )}

                {safePaymentProvider === "stripe" && !stripeClientSecret && (
                  <Button
                    type="submit"
                    size="lg"
                    disabled={isSubmitting}
                    className="mt-5 w-full gradient-gold text-sm font-semibold text-primary-dark shadow-md shadow-accent/20 hover:brightness-105"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Order...
                      </>
                    ) : (
                      "Continue to Card Payment"
                    )}
                  </Button>
                )}

                <div className="mt-5 space-y-2.5">
                  <p className="flex items-center gap-2.5 text-xs text-muted">
                    <ShieldCheck className="h-4 w-4 text-success" />
                    SSL-secured payment
                  </p>
                  <p className="flex items-center gap-2.5 text-xs text-muted">
                    <RotateCcw className="h-4 w-4 text-secondary" />
                    4-day money-back guarantee
                  </p>
                </div>

                <p className="mt-5 border-t border-border pt-4 text-center text-xs text-muted">
                  By completing this purchase you agree to our terms of service and privacy policy.
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>

      {pesapalPaymentDialog}
    </div>
  );
}
