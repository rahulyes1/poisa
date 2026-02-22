"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    let active = true;

    const run = async () => {
      let redirectTarget = "/?auth_error=google_signin_failed";

      try {
        const queryParams = new URLSearchParams(window.location.search);
        const hashValue = window.location.hash.startsWith("#")
          ? window.location.hash.slice(1)
          : window.location.hash;
        const hashParams = new URLSearchParams(hashValue);

        const hasProviderError = Boolean(
          queryParams.get("error") ||
            queryParams.get("error_description") ||
            hashParams.get("error") ||
            hashParams.get("error_description"),
        );

        if (hasProviderError || !supabase) {
          return;
        }

        const code = queryParams.get("code");
        if (!code) {
          return;
        }

        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          return;
        }

        const { data, error: sessionError } = await supabase.auth.getSession();
        if (!sessionError && data.session) {
          redirectTarget = "/";
        }
      } finally {
        if (active) {
          router.replace(redirectTarget);
        }
      }
    };

    void run();
    return () => {
      active = false;
    };
  }, [router]);

  return (
    <div className="min-h-[100dvh] bg-[#0F172A] text-[#F1F5F9] flex items-center justify-center">
      <p className="text-sm text-white/75">Signing you in...</p>
    </div>
  );
}
