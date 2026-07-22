import { SignIn } from "@clerk/nextjs";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <div className="flex flex-1 items-center justify-center p-6 py-16">
      <SignIn routing="path" path="/sign-in" />
    </div>
  );
}
