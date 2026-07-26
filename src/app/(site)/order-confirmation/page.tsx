import type { Metadata } from "next";
import { Suspense } from "react";
import OrderConfirmationContent from "./content";

export const metadata: Metadata = {
  title: "Order Confirmed",
  description: "Thank you for your purchase. Your templates are ready to download.",
};

export default function OrderConfirmationPage() {
  return (
    <Suspense>
      <OrderConfirmationContent />
    </Suspense>
  );
}
