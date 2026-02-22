"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const run = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      if (supabase && code) {
        await supabase.auth.exchangeCodeForSession(code);
      }
      router.replace("/");
    };

    run();
  }, [router]);

  return (
    <div className="min-h-[100dvh] bg-[#0F172A] text-[#F1F5F9] flex items-center justify-center">
      <p className="text-sm text-white/75">Signing you in...</p>
    </div>
  );
}
