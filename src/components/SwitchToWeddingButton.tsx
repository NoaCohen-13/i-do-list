"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useOrganizationList } from "@clerk/nextjs";

export function SwitchToWeddingButton({ organizationId }: { organizationId: string }) {
  const router = useRouter();
  const { setActive, isLoaded } = useOrganizationList();
  const [isSwitching, setIsSwitching] = useState(false);

  async function handleClick() {
    if (!setActive) return;
    setIsSwitching(true);
    await setActive({ organization: organizationId });
    router.push("/");
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!isLoaded || isSwitching}
      className="btn-primary inline-block w-fit"
    >
      {isSwitching ? "Switching…" : "View this wedding"}
    </button>
  );
}
