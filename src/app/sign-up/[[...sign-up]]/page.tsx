import { SignUp } from "@clerk/nextjs";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <div className="flex flex-1 items-center justify-center p-6 py-16">
      <SignUp routing="path" path="/sign-up" />
    </div>
  );
}
