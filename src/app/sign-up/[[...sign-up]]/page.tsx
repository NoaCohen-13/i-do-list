import { SignUp } from "@clerk/nextjs";
import { clerkAppearance } from "@/lib/clerk-appearance";

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <SignUp appearance={clerkAppearance} />
    </div>
  );
}
