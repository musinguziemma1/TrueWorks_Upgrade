import Link from "next/link";
import { ArrowLeft, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-20 text-center">
      <p className="font-heading text-[6rem] font-semibold leading-none text-primary/[0.07] select-none sm:text-[8rem]">
        404
      </p>
      <h1 className="-mt-4 font-heading text-2xl font-semibold text-primary sm:text-3xl">
        Page Not Found
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
        The admin page you&apos;re looking for doesn&apos;t exist or may have been
        moved. Let&apos;s get you back to the dashboard.
      </p>
      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
        <Link href="/admin">
          <Button
            size="lg"
            className="gradient-gold px-6 font-semibold text-primary-dark shadow-md shadow-accent/20 hover:brightness-105"
          >
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <Link href="/">
          <Button
            variant="outline"
            size="lg"
            className="border-primary/20 px-6 font-semibold text-primary hover:bg-primary hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
