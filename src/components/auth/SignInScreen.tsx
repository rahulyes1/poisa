"use client";

interface SignInScreenProps {
  loading: boolean;
  error: string | null;
  onGoogleSignIn: () => void | Promise<void>;
  authConfigured: boolean;
}

export default function SignInScreen({
  loading,
  error,
  onGoogleSignIn,
  authConfigured,
}: SignInScreenProps) {
  return (
    <div className="min-h-[100dvh] bg-[#0F172A] text-[#F1F5F9] flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[rgba(17,17,24,0.94)] p-6 shadow-[0_20px_40px_rgba(0,0,0,0.45)]">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8FA1B8]">Poisa</p>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-white">Welcome Back</h1>
        <p className="mt-2 text-sm text-[#A5B4C8]">Sign in with Google to continue to your finance dashboard.</p>

        {!authConfigured && (
          <div className="mt-4 rounded-xl border border-red-400/35 bg-red-500/10 p-3 text-xs text-red-300">
            Supabase config is missing. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-xl border border-[#FF8C42]/35 bg-[rgba(255,140,66,0.12)] p-3 text-xs text-[#FFB88D]">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={onGoogleSignIn}
          disabled={!authConfigured || loading}
          className="mt-5 h-11 w-full rounded-xl border border-white/15 bg-white/[0.08] text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Signing In..." : "Continue With Google"}
        </button>
      </div>
    </div>
  );
}
