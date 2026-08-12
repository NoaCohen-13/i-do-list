import { TaskChooseOrganization } from "@clerk/nextjs";
import { clerkAppearance } from "@/lib/clerk-appearance";

export default function Page() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-bg px-4 text-center">
      <div>
        <h1 className="text-3xl">Create or join a wedding</h1>
        <p className="mt-2 text-text-muted">
          Start your own wedding workspace, or accept an invite to join your partner&apos;s.
        </p>
      </div>
      <TaskChooseOrganization appearance={clerkAppearance} redirectUrlComplete="/" />
    </div>
  );
}
