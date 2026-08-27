import type { Metadata } from "next";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import OrderConfirmationContent from "./content";

export const metadata: Metadata = {
  title: "Order Confirmed",
  description: "Thank you for your purchase. Your templates are ready to download.",
};

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <OrderConfirmationContent />
    </Suspense>
  );
}
