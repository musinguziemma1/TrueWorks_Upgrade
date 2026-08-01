import { SignUp } from "@clerk/nextjs";
import { AuthLayout } from "@/components/auth/auth-layout";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <AuthLayout mode="signup">
      <SignUp
        routing="path"
        path="/sign-up"
        appearance={{
          variables: {
            colorPrimary: "#0B2545",
            colorBackground: "#ffffff",
            borderRadius: "0.5rem",
          },
          elements: {
            formButtonPrimary:
              "bg-[#0B2545] hover:bg-[#0B2545]/90 text-white font-medium py-2.5 px-4 rounded-lg transition-colors",
            footerActionLink:
              "text-[#0B2545] hover:text-[#4A6FA5] font-medium",
            card: "shadow-none border-0",
            headerTitle: "text-[#0B2545] font-display text-xl font-bold",
            headerSubtitle: "text-muted-foreground text-sm",
            socialButtonsBlockButton:
              "border-border text-foreground hover:bg-surface rounded-lg transition-colors",
            formFieldInput:
              "rounded-lg border-border focus:ring-[#0B2545] focus:border-[#0B2545]",
            dividerLine: "bg-border",
            dividerText: "text-muted-foreground text-xs",
          },
        }}
      />
    </AuthLayout>
  );
}
