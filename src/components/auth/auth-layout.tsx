"use client";

import Link from "next/link";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import { Shield, Zap, BarChart3, ArrowRight } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Secure & Reliable",
    desc: "Enterprise-grade security for your business data.",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    desc: "Get started in seconds with our streamlined platform.",
  },
  {
    icon: BarChart3,
    title: "Powerful Analytics",
    desc: "Track performance and make data-driven decisions.",
  },
];

export function AuthLayout({
  children,
  mode,
}: {
  children: React.ReactNode;
  mode: "signin" | "signup";
}) {
  const { user } = useUser();

  return (
    <div className="flex min-h-screen">
      {/* Left Panel — Brand */}
      <div className="relative hidden w-1/2 lg:flex lg:flex-col lg:justify-between overflow-hidden bg-[#0B2545] p-12 text-white">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-[#C9A227]" />
          <div className="absolute bottom-12 right-12 h-64 w-64 rounded-full bg-[#4A6FA5]" />
          <div className="absolute top-1/2 left-1/3 h-48 w-48 rounded-full bg-[#C9A227]/30" />
        </div>

        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-3">
            <Image
              src="/images/logo-icon.svg"
              alt="TrueWorks"
              width={44}
              height={44}
              className="brightness-0 invert"
            />
            <span className="font-display text-2xl font-bold tracking-tight">
              TrueWorks
            </span>
          </Link>
        </div>

        <div className="relative z-10 space-y-10">
          <div>
            <h1 className="font-display text-4xl font-bold leading-tight lg:text-5xl">
              {mode === "signin"
                ? "Welcome back to TrueWorks"
                : "Build something great"}
            </h1>
            <p className="mt-4 max-w-md text-lg text-white/70">
              {mode === "signin"
                ? "Sign in to access your dashboard, products, and business tools."
                : "Create your account and start building better business systems today."}
            </p>
          </div>

          <div className="space-y-5">
            {features.map((f) => (
              <div key={f.title} className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <f.icon className="h-5 w-5 text-[#C9A227]" />
                </div>
                <div>
                  <p className="font-medium">{f.title}</p>
                  <p className="text-sm text-white/60">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-sm text-white/40">
          &copy; {new Date().getFullYear()} TrueWorks Limited. All rights reserved.
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 xl:px-20">
        <div className="mx-auto w-full max-w-sm">
          {/* Mobile logo */}
          <div className="mb-8 lg:hidden">
            <Link href="/" className="inline-flex items-center gap-2">
              <Image
                src="/images/logo-icon.svg"
                alt="TrueWorks"
                width={36}
                height={36}
              />
              <span className="font-display text-xl font-bold text-[#0B2545]">
                TrueWorks
              </span>
            </Link>
          </div>

          <div className="mb-8">
            <h2 className="font-display text-2xl font-bold text-[#0B2545]">
              {mode === "signin" ? "Sign in to your account" : "Create your account"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {mode === "signin" ? (
                <>
                  Don&apos;t have an account?{" "}
                  <Link
                    href="/sign-up"
                    className="font-medium text-[#0B2545] hover:text-[#4A6FA5] transition-colors"
                  >
                    Sign up free
                  </Link>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <Link
                    href="/sign-in"
                    className="font-medium text-[#0B2545] hover:text-[#4A6FA5] transition-colors"
                  >
                    Sign in
                  </Link>
                </>
              )}
            </p>
          </div>

          {children}

          <div className="mt-8">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-[#0B2545] transition-colors"
            >
              <ArrowRight className="h-3.5 w-3.5 rotate-180" />
              Back to homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
