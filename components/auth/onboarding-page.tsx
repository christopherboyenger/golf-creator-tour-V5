"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowRight,
  Bell,
  Check,
  Instagram,
  Loader2,
  MapPin,
  Music2,
  Trophy,
  X,
  Youtube
} from "lucide-react";
import { GctMark } from "@/components/gct-mark";
import {
  connectSocialPlatform,
  finishOnboarding,
  firstNameFromCreator,
  loadOnboardingState,
  saveCreatorLocation,
  type CreatorAuthSnapshot,
  type CreatorSocialPlatform
} from "@/lib/auth-flow";

type Step = "welcome" | "location" | "push" | "socials";
type LocationStatus = "idle" | "requesting" | "granted" | "denied";
type PushStatus = "idle" | "requesting" | "granted" | "denied" | "unsupported";
type SocialState = Record<CreatorSocialPlatform, { connected: boolean; handle: string }>;

const steps: Step[] = ["welcome", "location", "push", "socials"];

const emptySocials: SocialState = {
  instagram: { connected: false, handle: "" },
  tiktok: { connected: false, handle: "" },
  youtube: { connected: false, handle: "" }
};

const platformCopy: Record<
  CreatorSocialPlatform,
  { label: string; color: string; bg: string; border: string; icon: ReactNode }
> = {
  instagram: {
    label: "Instagram",
    color: "#f472b6",
    bg: "rgba(244,114,182,0.08)",
    border: "rgba(244,114,182,0.22)",
    icon: <Instagram size={22} />
  },
  tiktok: {
    label: "TikTok",
    color: "#ffffff",
    bg: "rgba(255,255,255,0.06)",
    border: "rgba(255,255,255,0.14)",
    icon: <Music2 size={22} />
  },
  youtube: {
    label: "YouTube",
    color: "#ef4444",
    bg: "rgba(239,68,68,0.09)",
    border: "rgba(239,68,68,0.22)",
    icon: <Youtube size={23} />
  }
};

export function OnboardingExperience() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("welcome");
  const [creator, setCreator] = useState<CreatorAuthSnapshot | null>(null);
  const [socials, setSocials] = useState<SocialState>(emptySocials);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle");
  const [pushStatus, setPushStatus] = useState<PushStatus>("idle");
  const [connectPlatform, setConnectPlatform] = useState<CreatorSocialPlatform | null>(null);
  const [connectHandle, setConnectHandle] = useState("");
  const [connectError, setConnectError] = useState("");
  const [connectSubmitting, setConnectSubmitting] = useState(false);
  const [celebration, setCelebration] = useState<{ title: string; detail: string; points: number } | null>(null);
  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    let mounted = true;

    loadOnboardingState()
      .then((state) => {
        if (!mounted) return;

        if (state.error || !state.creator) {
          setError(state.error || "Onboarding could not load.");
          setLoading(false);
          return;
        }

        if (state.creator.must_reset_password) {
          router.push("/auth/reset-password");
          return;
        }

        setCreator(state.creator);
        setSocials(() => {
          const next = structuredClone(emptySocials);
          state.socials.forEach((social: { platform: string; handle: string | null; connected: boolean | null }) => {
            const platform = social.platform as CreatorSocialPlatform;
            if (platform in next) {
              next[platform] = {
                connected: Boolean(social.connected),
                handle: social.handle || ""
              };
            }
          });
          return next;
        });
        setLoading(false);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Onboarding is unavailable right now.");
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [router]);

  const firstName = firstNameFromCreator(creator?.name);
  const stepIndex = steps.indexOf(step);
  const anyConnected = useMemo(
    () => Object.values(socials).some((social) => social.connected),
    [socials]
  );

  const advance = (next: Step) => {
    setStep(next);
    setError("");
  };

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("denied");
      return;
    }

    setLocationStatus("requesting");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        if (creator) {
          await saveCreatorLocation(creator.id, position.coords.latitude, position.coords.longitude);
        }
        setLocationStatus("granted");
      },
      () => setLocationStatus("denied"),
      { enableHighAccuracy: false, timeout: 8000 }
    );
  };

  const requestPush = async () => {
    if (!("Notification" in window)) {
      setPushStatus("unsupported");
      return;
    }

    setPushStatus("requesting");
    try {
      const permission = await window.Notification.requestPermission();
      setPushStatus(permission === "granted" ? "granted" : "denied");
    } catch {
      setPushStatus("denied");
    }
  };

  const openConnectSheet = (platform: CreatorSocialPlatform) => {
    setConnectPlatform(platform);
    setConnectHandle(socials[platform].handle ? `@${socials[platform].handle}` : "");
    setConnectError("");
  };

  const submitConnect = async () => {
    if (!connectPlatform || !creator) return;

    setConnectError("");
    if (!connectHandle.trim()) {
      setConnectError("Enter your profile handle.");
      return;
    }

    setConnectSubmitting(true);
    const result = await connectSocialPlatform(creator.id, connectPlatform, connectHandle);
    setConnectSubmitting(false);

    if (result.error) {
      setConnectError(result.error);
      return;
    }

    const cleanHandle = connectHandle.trim().replace(/^@/, "");
    const platformLabel = platformCopy[connectPlatform].label;
    setSocials((current) => ({
      ...current,
      [connectPlatform]: { connected: true, handle: cleanHandle }
    }));
    setConnectPlatform(null);
    setConnectHandle("");
    setCelebration({
      title: `${platformLabel} Connected`,
      detail: `@${cleanHandle}`,
      points: result.points || 50
    });
  };

  const handleFinish = async () => {
    if (!creator || !anyConnected || finishing) return;
    setFinishing(true);
    setError("");

    const result = await finishOnboarding(creator.id);
    if (result.error) {
      setError(result.error);
      setFinishing(false);
      return;
    }

    setCelebration({
      title: "Tour Ready",
      detail: "Your creator profile is active.",
      points: 50
    });
    window.setTimeout(() => router.push("/profile"), 1250);
  };

  if (loading) {
    return (
      <main className="fixed inset-0 z-50 flex items-center justify-center bg-[#111318] text-white">
        <Loader2 className="animate-spin text-[#c9a84c]" size={30} />
      </main>
    );
  }

  return (
    <main className="fixed inset-0 z-50 flex justify-center overflow-hidden bg-[#111318] text-white">
      <div className="relative flex min-h-screen w-full max-w-[var(--app-max-w)] flex-col overflow-hidden px-7 pb-10 pt-12">
        <header className="flex justify-center">
          <GctMark size="sm" />
        </header>

        <section className="flex flex-1 flex-col justify-center">
          {step === "welcome" ? <WelcomeStep firstName={firstName} onNext={() => advance("location")} /> : null}
          {step === "location" ? (
            <LocationStep
              onNext={() => advance("push")}
              onRequest={requestLocation}
              onSkip={() => advance("push")}
              status={locationStatus}
            />
          ) : null}
          {step === "push" ? (
            <PushStep
              onNext={() => advance("socials")}
              onRequest={requestPush}
              onSkip={() => advance("socials")}
              status={pushStatus}
            />
          ) : null}
          {step === "socials" ? (
            <SocialsStep
              anyConnected={anyConnected}
              error={error}
              finishing={finishing}
              onConnect={openConnectSheet}
              onFinish={handleFinish}
              socials={socials}
            />
          ) : null}
        </section>

        <ProgressDots activeIndex={stepIndex} />

        {connectPlatform ? (
          <ConnectSheet
            error={connectError}
            handle={connectHandle}
            onClose={() => {
              if (!connectSubmitting) setConnectPlatform(null);
            }}
            onSubmit={submitConnect}
            platform={connectPlatform}
            setHandle={setConnectHandle}
            submitting={connectSubmitting}
          />
        ) : null}

        {celebration ? <CelebrationOverlay celebration={celebration} onClose={() => setCelebration(null)} /> : null}
      </div>
    </main>
  );
}

function WelcomeStep({ firstName, onNext }: { firstName: string; onNext: () => void }) {
  return (
    <div className="animate-[gctSlideIn_0.42s_cubic-bezier(0.16,1,0.3,1)_both] text-center">
      <h1 className="text-4xl font-black leading-tight tracking-normal text-white">
        Welcome, {firstName}.
      </h1>
      <p className="mt-3 text-2xl font-black leading-tight text-white/55">Let us get you started.</p>
      <div className="mx-auto my-12 flex h-28 w-28 items-center justify-center rounded-[28px] border border-[#c9a84c]/25 bg-[#c9a84c]/10 text-[#c9a84c]">
        <Trophy size={52} strokeWidth={1.6} />
      </div>
      <PrimaryButton label="Get Started" onClick={onNext} />
    </div>
  );
}

function LocationStep({
  onNext,
  onRequest,
  onSkip,
  status
}: {
  onNext: () => void;
  onRequest: () => void;
  onSkip: () => void;
  status: LocationStatus;
}) {
  const complete = status === "granted" || status === "denied";

  return (
    <div className="animate-[gctSlideIn_0.42s_cubic-bezier(0.16,1,0.3,1)_both] text-center">
      <StepIcon>
        <MapPin size={46} strokeWidth={1.5} />
      </StepIcon>
      <h1 className="mt-7 text-3xl font-black tracking-normal text-white">Allow Location</h1>
      <p className="mx-auto mt-3 max-w-xs text-sm font-semibold leading-6 text-white/48">
        GCT uses your region for creator matches and local tour context.
      </p>

      {status === "granted" ? <StatusPill label="Location allowed" tone="success" /> : null}
      {status === "denied" ? <StatusPill label="Location skipped" tone="muted" /> : null}
      {status === "requesting" ? <InlineSpinner label="Requesting location..." /> : null}

      <div className="mt-9 grid gap-3">
        {complete ? (
          <PrimaryButton label="Continue" onClick={onNext} />
        ) : (
          <>
            <PrimaryButton disabled={status === "requesting"} label="Allow Location Access" onClick={onRequest} />
            <GhostButton label="Skip for now" onClick={onSkip} />
          </>
        )}
      </div>
      <p className="mt-5 text-[10px] font-semibold leading-5 text-white/30">
        Precise location is not shown on your public profile.
      </p>
    </div>
  );
}

function PushStep({
  onNext,
  onRequest,
  onSkip,
  status
}: {
  onNext: () => void;
  onRequest: () => void;
  onSkip: () => void;
  status: PushStatus;
}) {
  const complete = status === "granted" || status === "denied" || status === "unsupported";

  return (
    <div className="animate-[gctSlideIn_0.42s_cubic-bezier(0.16,1,0.3,1)_both] text-center">
      <StepIcon>
        <Bell size={46} strokeWidth={1.5} />
      </StepIcon>
      <h1 className="mt-7 text-3xl font-black tracking-normal text-white">Allow Push Notifications</h1>
      <p className="mx-auto mt-3 max-w-xs text-sm font-semibold leading-6 text-white/48">
        Match requests, challenge updates, and announcements can reach you immediately.
      </p>

      {status === "granted" ? <StatusPill label="Notifications allowed" tone="success" /> : null}
      {status === "denied" ? <StatusPill label="Notifications skipped" tone="muted" /> : null}
      {status === "unsupported" ? <StatusPill label="Not supported in this browser" tone="muted" /> : null}
      {status === "requesting" ? <InlineSpinner label="Requesting permission..." /> : null}

      <div className="mt-9 grid gap-3">
        {complete ? (
          <PrimaryButton label="Continue" onClick={onNext} />
        ) : (
          <>
            <PrimaryButton disabled={status === "requesting"} label="Allow Notifications" onClick={onRequest} />
            <GhostButton label="Skip for now" onClick={onSkip} />
          </>
        )}
      </div>
    </div>
  );
}

function SocialsStep({
  anyConnected,
  error,
  finishing,
  onConnect,
  onFinish,
  socials
}: {
  anyConnected: boolean;
  error: string;
  finishing: boolean;
  onConnect: (platform: CreatorSocialPlatform) => void;
  onFinish: () => void;
  socials: SocialState;
}) {
  return (
    <div className="animate-[gctSlideIn_0.42s_cubic-bezier(0.16,1,0.3,1)_both]">
      <div className="text-center">
        <h1 className="text-3xl font-black tracking-normal text-white">Connect Social Media</h1>
        <p className="mx-auto mt-3 max-w-xs text-sm font-semibold leading-6 text-white/48">
          Connect at least one platform to start earning Tour Points.
        </p>
      </div>

      <div className="mt-8 grid gap-3">
        {(Object.keys(platformCopy) as CreatorSocialPlatform[]).map((platform) => (
          <SocialRow
            connected={socials[platform].connected}
            handle={socials[platform].handle}
            key={platform}
            onConnect={() => onConnect(platform)}
            platform={platform}
          />
        ))}
      </div>

      {!anyConnected ? (
        <p className="mt-5 text-center text-[11px] font-bold text-white/32">
          At least one platform is required to continue.
        </p>
      ) : null}

      {error ? (
        <div className="mt-5 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-xs font-bold leading-5 text-red-200">
          {error}
        </div>
      ) : null}

      <div className="mt-6">
        <PrimaryButton disabled={!anyConnected || finishing} label={finishing ? "Saving..." : "Enter GCT"} onClick={onFinish} />
      </div>
    </div>
  );
}

function SocialRow({
  connected,
  handle,
  onConnect,
  platform
}: {
  connected: boolean;
  handle: string;
  onConnect: () => void;
  platform: CreatorSocialPlatform;
}) {
  const copy = platformCopy[platform];

  return (
    <div
      className="flex items-center justify-between rounded-2xl border p-4"
      style={{
        background: connected ? copy.bg : "#1a1d24",
        borderColor: connected ? copy.border : "#2a2e37"
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-xl border"
          style={{ borderColor: copy.border, color: copy.color, background: copy.bg }}
        >
          {copy.icon}
        </div>
        <div>
          <p className="text-sm font-black text-white">{copy.label}</p>
          <p className={`mt-1 text-[10px] font-bold ${connected ? "text-emerald-300" : "text-white/35"}`}>
            {connected ? `@${handle}` : "Not connected"}
          </p>
        </div>
      </div>

      {connected ? (
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-400/12 text-emerald-300">
          <Check size={18} strokeWidth={3} />
        </span>
      ) : (
        <button
          className="tap-row rounded-lg border px-4 py-2 text-xs font-black"
          onClick={onConnect}
          style={{ borderColor: copy.border, color: copy.color, background: copy.bg }}
          type="button"
        >
          Connect
        </button>
      )}
    </div>
  );
}

function ConnectSheet({
  error,
  handle,
  onClose,
  onSubmit,
  platform,
  setHandle,
  submitting
}: {
  error: string;
  handle: string;
  onClose: () => void;
  onSubmit: () => void;
  platform: CreatorSocialPlatform;
  setHandle: (value: string) => void;
  submitting: boolean;
}) {
  const copy = platformCopy[platform];

  return (
    <div className="absolute inset-0 z-30 flex items-end bg-black/55 px-4 backdrop-blur-sm">
      <section className="w-full rounded-t-[24px] border border-b-0 border-white/10 bg-[#111318] px-5 pb-[max(34px,env(safe-area-inset-bottom))] pt-5 shadow-[0_-20px_80px_rgba(0,0,0,0.45)]">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl border"
              style={{ borderColor: copy.border, color: copy.color, background: copy.bg }}
            >
              {copy.icon}
            </div>
            <div>
              <p className="text-base font-black text-white">{copy.label}</p>
              <p className="text-xs font-semibold text-white/38">Enter the approved profile handle.</p>
            </div>
          </div>
          <button
            aria-label="Close"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/45"
            onClick={onClose}
            title="Close"
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.16em] text-white/45">
          Profile Handle
        </label>
        <input
          autoCapitalize="none"
          autoComplete="off"
          className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-4 text-sm font-semibold text-white outline-none transition placeholder:text-white/20 focus:border-[#c9a84c]/50"
          onChange={(event) => setHandle(event.target.value)}
          placeholder="@yourhandle"
          value={handle}
        />

        {error ? (
          <div className="mt-4 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-xs font-bold leading-5 text-red-200">
            {error}
          </div>
        ) : null}

        <button
          className="tap-row mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,#c9a84c,#8b7636)] px-4 py-4 text-sm font-black text-[#08090a] disabled:cursor-wait disabled:opacity-60"
          disabled={submitting}
          onClick={onSubmit}
          type="button"
        >
          {submitting ? <Loader2 className="animate-spin" size={17} /> : <Check size={17} />}
          {submitting ? "Connecting..." : "Connect Platform"}
        </button>
      </section>
    </div>
  );
}

function CelebrationOverlay({
  celebration,
  onClose
}: {
  celebration: { title: string; detail: string; points: number };
  onClose: () => void;
}) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#111318]/92 px-8 backdrop-blur-md">
      <div className="animate-[gctFadeUp_0.35s_ease_both] text-center">
        <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-full bg-[linear-gradient(135deg,#c9a84c,#e8d48b)] text-[#111318] shadow-[0_0_42px_rgba(201,168,76,0.42)]">
          <Trophy size={46} strokeWidth={1.8} />
        </div>
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#c9a84c]">+{celebration.points} Tour Points</p>
        <h2 className="mt-3 text-3xl font-black text-white">{celebration.title}</h2>
        <p className="mt-2 text-sm font-bold text-white/45">{celebration.detail}</p>
        <button
          className="tap-row mt-8 rounded-xl border border-[#c9a84c]/30 px-6 py-3 text-xs font-black uppercase tracking-[0.12em] text-[#c9a84c]"
          onClick={onClose}
          type="button"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

function ProgressDots({ activeIndex }: { activeIndex: number }) {
  return (
    <div className="flex justify-center gap-2 pb-1">
      {steps.map((item, index) => (
        <span
          className={`h-[5px] rounded-full transition-all ${
            index === activeIndex ? "w-6 bg-[#c9a84c]" : index < activeIndex ? "w-2 bg-[#c9a84c]/45" : "w-2 bg-white/14"
          }`}
          key={item}
        />
      ))}
    </div>
  );
}

function StepIcon({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-[28px] border border-[#c9a84c]/25 bg-[#c9a84c]/10 text-[#c9a84c]">
      {children}
    </div>
  );
}

function StatusPill({ label, tone }: { label: string; tone: "muted" | "success" }) {
  return (
    <div
      className={`mx-auto mt-7 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-black ${
        tone === "success"
          ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-300"
          : "border-white/10 bg-white/5 text-white/45"
      }`}
    >
      <Check size={14} strokeWidth={3} />
      {label}
    </div>
  );
}

function InlineSpinner({ label }: { label: string }) {
  return (
    <div className="mx-auto mt-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black text-white/45">
      <Loader2 className="animate-spin text-[#c9a84c]" size={14} />
      {label}
    </div>
  );
}

function PrimaryButton({
  disabled,
  label,
  onClick
}: {
  disabled?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className="tap-row flex w-full items-center justify-center gap-2 rounded-[14px] bg-[linear-gradient(135deg,#c9a84c,#8b7636)] px-4 py-4 text-[15px] font-black text-[#111318] disabled:cursor-not-allowed disabled:opacity-40"
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {label}
      {!disabled ? <ArrowRight size={17} /> : null}
    </button>
  );
}

function GhostButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      className="tap-row w-full rounded-[14px] border border-white/10 px-4 py-4 text-sm font-black text-white/55"
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}
