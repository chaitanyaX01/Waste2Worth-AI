"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CitizenRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return (
    <div className="flex-1 flex items-center justify-center min-h-[50vh] text-[#86868b] text-sm">
      Navigating to Citizen Portal...
    </div>
  );
}
