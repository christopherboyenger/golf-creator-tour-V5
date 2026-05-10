"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Check, Eye, EyeOff, Loader2, LockKeyhole } from "lucide-react";
import { GctMark } from "@/components/gct-mark";
import { activatePassword, getCurrentUserAndCreator } from "@/lib/auth-flow";

type Strength = {
  score: number;
  label: string;
  color: string;
};

export function ResetPasswordExperience() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loadingSession, setLoadingSession] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let mounted = true;

    getCurrentUserAndCreator()
      .then(({ user, creator }) => {
        if (!mounted) return;
        if (!user) {
          router.push("/auth");
          return;
        }
        if (creator && !creator.must_reset_password && creator.status === "active") {
          router.push(creator.onboarding_completed ? "/profile" : "/onboarding");
          return;
        }
        setLoadingSession(false);
      })
      .catch(() => {
        if (mounted) setLoadingSession(false);
      });

    return () => {
      mounted = false;
    };
  }, [router]);

  const strength = useMemo(() => getPasswordStrength(newPassword), [newPassword]);
  const passwordStartsWithMemberNumber = newPassword.trim().toUpperCase().startsWith("GCT-");
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const canSubmit =
    newPassword.length >= 8 && confirmPassword.length > 0 && passwordsMatch && !passwordStartsWithMemberNumber;

  const handleSubmit = async () => {
    setError("");

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (passwordStartsWithMemberNumber) {
      setError("Your new password cannot be your Tour Member Number.");
      return;
    }

    setSubmitting(true);
    const result = await activatePassword(newPassword);
    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setSuccess(true);
    window.setTimeout(() => router.push("/onboarding"), 1200);
  };

  if (loadingSession) {
    return (
      <main className="fixed inset-0 z-50 flex items-center justify-center bg-[#0e1626] text-white">
        <Loader2 className="animate-spin text-[#c9a84c]" size={30} />
      </main>
    );
  }

  return (
    <main className="fixed inset-0 z-50 flex justify-center overflow-hidden bg-[#0e1626] text-white">
      <div className="relative flex min-h-screen w-full max-w-[var(--app-max-w)] flex-col justify-end overflow-hidden px-4">
        <div className="absolute left-1/2 top-[32%] h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(22,35,64,0.74)_0%,rgba(201,168,76,0.06)_42%,transparent_70%)]" />
        <div className="absolute inset-x-0 top-16 flex justify-center">
          <div className="flex h-28 w-28 items-center justify-center rounded-full bg-[#0e1626]/60 shadow-[0_0_60px_rgba(201,168,76,0.12)]">
            <GctMark size="lg" />
          </div>
        </div>

        <section className="relative rounded-t-[24px] border border-b-0 border-white/10 bg-[rgba(17,18,20,0.94)] px-5 pb-[max(38px,env(safe-area-inset-bottom))] pt-7 shadow-[0_-20px_80px_rgba(201,168,76,0.06),0_8px_40px_rgba(0,0,0,0.55)] backdrop-blur-3xl">
          {success ? (
            <div className="animate-[gctFadeUp_0.35s_ease_both] py-6 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[linear-gradient(135deg,#c9a84c,#e8d48b)] text-[#08090a] shadow-[0_0_32px_rgba(201,168,76,0.4)]">
                <Check size={30} strokeWidth={3} />
              </div>
              <h1 className="text-xl font-black text-white">Account Activated</h1>
              <p className="mt-2 text-sm font-semibold text-white/45">Let us get you set up.</p>
            </div>
          ) : (
            <form
              className="animate-[gctFadeUp_0.35s_ease_both]"
              onSubmit={(event) => {
                event.preventDefault();
                void handleSubmit();
              }}
            >
              <div className="mb-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-[#c9a84c]/25 bg-[#c9a84c]/10 text-[#c9a84c]">
                  <LockKeyhole size={22} />
                </div>
                <h1 className="text-xl font-black text-white">Set Your Password</h1>
                <p className="mt-2 text-xs font-semibold leading-5 text-white/45">
                  Create a permanent password before entering the Tour.
                </p>
              </div>

              <PasswordField
                label="New Password"
                onChange={setNewPassword}
                onToggle={() => setShowNewPassword((value) => !value)}
                show={showNewPassword}
                value={newPassword}
              />

              {newPassword ? (
                <div className="mb-4 mt-2 flex items-center gap-3">
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ background: strength.color, width: `${(strength.score / 5) * 100}%` }}
                    />
                  </div>
                  <span className="min-w-10 text-[10px] font-black" style={{ color: strength.color }}>
                    {strength.label}
                  </span>
                </div>
              ) : null}

              <PasswordField
                label="Confirm Password"
                onChange={setConfirmPassword}
                onToggle={() => setShowConfirmPassword((value) => !value)}
                show={showConfirmPassword}
                value={confirmPassword}
              />

              {confirmPassword && !passwordsMatch ? (
                <p className="mt-2 text-xs font-bold text-red-300">Passwords do not match.</p>
              ) : null}

              <div className="mt-5 grid gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <RuleItem active={newPassword.length >= 8} label="Minimum 8 characters" />
                <RuleItem active={!passwordStartsWithMemberNumber && newPassword.length > 0} label="Cannot start with GCT-" />
                <RuleItem active={passwordsMatch} label="Confirmation matches" />
              </div>

              {error ? (
                <div className="mt-4 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-xs font-bold leading-5 text-red-200">
                  {error}
                </div>
              ) : null}

              <button
                className="tap-row mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,#c9a84c,#8b7636)] px-4 py-4 text-sm font-black text-[#08090a] disabled:cursor-not-allowed disabled:opacity-45"
                disabled={!canSubmit || submitting}
                type="submit"
              >
                {submitting ? <Loader2 className="animate-spin" size={17} /> : <LockKeyhole size={17} />}
                {submitting ? "Activating..." : "Set Password & Activate"}
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}

function PasswordField({
  label,
  onChange,
  onToggle,
  show,
  value
}: {
  label: string;
  onChange: (value: string) => void;
  onToggle: () => void;
  show: boolean;
  value: string;
}) {
  return (
    <div className="mt-4">
      <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.16em] text-white/45">{label}</label>
      <div className="relative">
        <input
          autoComplete="new-password"
          className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-4 pr-12 text-sm font-semibold text-white outline-none transition placeholder:text-white/20 focus:border-[#c9a84c]/50"
          onChange={(event) => onChange(event.target.value)}
          placeholder="At least 8 characters"
          type={show ? "text" : "password"}
          value={value}
        />
        <button
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-white/45 transition hover:bg-white/5 hover:text-[#c9a84c]"
          onClick={onToggle}
          title={show ? "Hide password" : "Show password"}
          type="button"
        >
          {show ? <Eye size={18} /> : <EyeOff size={18} />}
        </button>
      </div>
    </div>
  );
}

function RuleItem({ active, label }: { active: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs font-bold text-white/55">
      <span
        className={`flex h-4 w-4 items-center justify-center rounded-full ${
          active ? "bg-[#10b981] text-[#071225]" : "border border-white/15 text-transparent"
        }`}
      >
        <Check size={11} strokeWidth={3} />
      </span>
      {label}
    </div>
  );
}

function getPasswordStrength(password: string): Strength {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) return { score, label: "Weak", color: "#ef4444" };
  if (score <= 2) return { score, label: "Fair", color: "#f59e0b" };
  if (score <= 3) return { score, label: "Good", color: "#3b82f6" };
  return { score, label: "Strong", color: "#10b981" };
}
