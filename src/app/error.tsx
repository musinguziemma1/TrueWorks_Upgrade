"use client";

import { ErrorPage } from "@/components/error-page";

export default function RootError({
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
      title="Something went wrong"
      description="An unexpected error occurred. Please try again or return to the homepage."
    />
  );
}
