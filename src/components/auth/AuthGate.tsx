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
    isSigningIn: boolean;
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
  const [isSigningIn, setIsSigningIn] = useState(false);

  const getReadableSignInError = (value: unknown) => {
    const message = value instanceof Error ? value.message.trim() : "";
    if (!message) {
      return "Unable to start Google sign-in. Please try again.";
    }

    const normalized = message.toLowerCase();
    if (normalized.includes("redirect") || normalized.includes("requested path is invalid")) {
      return `${message}. Check Supabase Auth URL Configuration and include localhost + production callback URLs.`;
    }

    return message;
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authError = params.get("auth_error");
    if (authError !== "google_signin_failed") {
      return;
    }

    setError("Sign-in failed. Check OAuth redirect URLs and try again.");
    params.delete("auth_error");
    const nextQuery = params.toString();
    const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ""}${window.location.hash}`;
    window.history.replaceState({}, "", nextUrl);
  }, []);

  useEffect(() => {
    let active = true;

    const applyAuthUser = async (supabaseUser: User | null) => {
      if (!active) {
        return;
      }

      await setFinanceStoreNamespace(supabaseUser?.id ?? null);
      if (!active) {
        return;
      }

      if (supabaseUser) {
        setError(null);
        setUser(toAppAuthUser(supabaseUser));
        setReady(true);
        setIsSigningIn(false);
        void startCloudSync(supabaseUser.id).catch(() => {
          if (!active) {
            return;
          }
          setError((current) => current ?? "Signed in, but cloud sync is unavailable right now.");
        });
      } else {
        stopCloudSync();
        setUser(null);
        setReady(true);
        setIsSigningIn(false);
      }
    };

    const init = async () => {
      if (!supabase) {
        await setFinanceStoreNamespace(null);
        stopCloudSync();
        setReady(true);
        return;
      }

      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError && active) {
        setError("Unable to read your session. You can still use the app signed out.");
      }
      await applyAuthUser(data.session?.user ?? null);
    };

    void init();

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
      setIsSigningIn(true);
      const redirectBase = window.location.origin;
      const redirectTo = `${redirectBase}/auth/callback`;
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });

      if (signInError) {
        throw signInError;
      }
    } catch (signInError) {
      setIsSigningIn(false);
      setError(getReadableSignInError(signInError));
    }
  };

  const onSignOut = async () => {
    setIsSigningIn(false);
    if (!supabase) {
      await setFinanceStoreNamespace(null);
      stopCloudSync();
      setUser(null);
      return;
    }

    stopCloudSync();
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      setError("Unable to sign out right now. Please try again.");
      return;
    }
    await setFinanceStoreNamespace(null);
    setUser(null);
    setReady(true);
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
        isSigningIn,
        authError: error ?? undefined,
      })}
    </>
  );
}
