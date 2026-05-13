"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ShareRedirectClient({ target }: { target: string }) {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/?post=${encodeURIComponent(target)}`);
  }, [router, target]);

  return null;
}
