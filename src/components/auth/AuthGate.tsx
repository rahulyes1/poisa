"use client";

import { ReactNode, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import SignInScreen from "./SignInScreen";
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
  children: (params: { user: AppAuthUser; onSignOut: () => Promise<void> }) => ReactNode;
}

const toAppAuthUser = (user: User): AppAuthUser => ({
  id: user.id,
  email: user.email ?? null,
  fullName: (user.user_metadata?.full_name as string | undefined) ?? null,
  avatarUrl: (user.user_metadata?.avatar_url as string | undefined) ?? null,
});

export default function AuthGate({ children }: AuthGateProps) {
  const [ready, setReady] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
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

      setError(null);
      setReady(true);
    };

    const init = async () => {
      if (!supabase) {
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

  const onGoogleSignIn = async () => {
    if (!supabase) {
      setError("Google sign-in is unavailable because Supabase config is missing.");
      return;
    }

    try {
      setSigningIn(true);
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
      setSigningIn(false);
    }
  };

  const onSignOut = async () => {
    if (!supabase) {
      await setFinanceStoreNamespace(null);
      stopCloudSync();
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

  if (!user) {
    return (
      <SignInScreen
        loading={signingIn}
        error={error}
        onGoogleSignIn={onGoogleSignIn}
        authConfigured={isSupabaseConfigured}
      />
    );
  }

  return <>{children({ user, onSignOut })}</>;
}
