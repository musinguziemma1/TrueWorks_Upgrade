import type { Metadata } from "next";
import CheckoutContent from "./content";

export const metadata: Metadata = {
  title: "Secure Checkout",
  description:
    "Complete your purchase securely with MTN Mobile Money, Airtel Money, Visa or Mastercard. Instant download after payment.",
};

export default function CheckoutPage() {
  return <CheckoutContent />;
}
