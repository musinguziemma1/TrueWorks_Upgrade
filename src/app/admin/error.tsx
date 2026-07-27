"use client";

import { ErrorPage } from "@/components/error-page";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorPage
      error={error}
      reset={reset}
      title="Dashboard error"
      description="This section of the dashboard hit an unexpected error. Try again, or return to the dashboard overview."
    />
  );
}
