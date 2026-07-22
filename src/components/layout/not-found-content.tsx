import Link from "next/link";
import { ArrowLeft, Store } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFoundContent() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center bg-surface px-6 py-20 text-center">
      <p className="font-heading text-[7rem] font-semibold leading-none text-primary/[0.07] select-none sm:text-[10rem]">
        404
      </p>
      <h1 className="-mt-6 font-heading text-3xl font-semibold text-primary sm:text-4xl">
        Page Not Found
      </h1>
      <p className="mt-4 max-w-md leading-relaxed text-muted">
        The page you&apos;re looking for doesn&apos;t exist or may have been
        moved. Let&apos;s get you back on track.
      </p>
      <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
        <Link href="/">
          <Button
            size="lg"
            className="gradient-gold px-7 font-semibold text-primary-dark shadow-md shadow-accent/20 hover:brightness-105"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>
        <Link href="/store">
          <Button
            variant="outline"
            size="lg"
            className="border-primary/20 px-7 font-semibold text-primary hover:bg-primary hover:text-white"
          >
            <Store className="mr-2 h-4 w-4" />
            Browse the Store
          </Button>
        </Link>
      </div>
    </div>
  );
}
