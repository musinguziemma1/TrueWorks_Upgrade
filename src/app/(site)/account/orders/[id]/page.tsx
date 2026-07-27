import { Suspense } from "react";
import OrderDetailLoader from "./content";

export const dynamic = "force-dynamic";

export default function OrderDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <OrderDetailLoader />
    </Suspense>
  );
}
