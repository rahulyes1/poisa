"use client";

import { ReactNode, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { setFinanceStoreNamespace } from "../shared/store";
import { startCloudSync, stopCloudSync } from "../shared/cloudSync";

export interface AppAuthUser {
  id: string;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
}

interface AuthGateProps {
  children: (params: {
    user: AppAuthUser | null;
    onSignIn: () => Promise<void>;
    onSignOut: () => Promise<void>;
    authConfigured: boolean;
    authError?: string;
  }) => ReactNode;
}

const toAppAuthUser = (user: User): AppAuthUser => ({
  id: user.id,
  email: user.email ?? null,
  fullName: (user.user_metadata?.full_name as string | undefined) ?? null,
  avatarUrl: (user.user_metadata?.avatar_url as string | undefined) ?? null,
});

export default function AuthGate({ children }: AuthGateProps) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<AppAuthUser | null>(null);

  useEffect(() => {
    let active = true;

    const applyAuthUser = async (supabaseUser: User | null) => {
      if (!active) {
        return;
      }

      await setFinanceStoreNamespace(supabaseUser?.id ?? null);

      if (supabaseUser) {
        await startCloudSync(supabaseUser.id);
        setUser(toAppAuthUser(supabaseUser));
      } else {
        stopCloudSync();
        setUser(null);
      }

      setReady(true);
    };

    const init = async () => {
      if (!supabase) {
        await setFinanceStoreNamespace(null);
        stopCloudSync();
        setReady(true);
        return;
      }

      const { data } = await supabase.auth.getSession();
      await applyAuthUser(data.session?.user ?? null);
    };

    init();

    const { data: listener } =
      supabase?.auth.onAuthStateChange(async (_event, session) => {
        await applyAuthUser(session?.user ?? null);
      }) ?? { data: { subscription: null } };

    return () => {
      active = false;
      listener?.subscription?.unsubscribe();
      stopCloudSync();
    };
  }, []);

  const onSignIn = async () => {
    if (!supabase) {
      setError("Supabase config is missing. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.");
      return;
    }

    try {
      setError(null);
      const redirectBase = window.location.origin;
      const redirectTo = `${redirectBase}/auth/callback`;
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });

      if (signInError) {
        throw signInError;
      }
    } catch {
      setError("Unable to start Google sign-in. Please try again.");
    }
  };

  const onSignOut = async () => {
    if (!supabase) {
      await setFinanceStoreNamespace(null);
      stopCloudSync();
      setUser(null);
      return;
    }

    stopCloudSync();
    await supabase.auth.signOut();
  };

  if (!ready) {
    return (
      <div className="min-h-[100dvh] bg-[#0F172A] text-[#F1F5F9] flex items-center justify-center">
        <p className="text-sm text-white/75">Checking account...</p>
      </div>
    );
  }

  return (
    <>
      {children({
        user,
        onSignIn,
        onSignOut,
        authConfigured: isSupabaseConfigured,
        authError: error ?? undefined,
      })}
    </>
  );
}
