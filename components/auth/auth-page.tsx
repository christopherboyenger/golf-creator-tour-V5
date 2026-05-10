"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ExternalLink, Eye, EyeOff, Loader2, LockKeyhole, UserPlus } from "lucide-react";
import { getPostAuthDestination, signInAndResolveCreator } from "@/lib/auth-flow";
import { LAND_MASK_B64 } from "@/lib/globe-data";
import gctFullLogo from "../../logo-gct-full.png.png";

type AuthTab = "login" | "signup";

const externalApplicationUrl = "https://golfcreatortour.com/join";

export function AuthExperience() {
  const router = useRouter();
  const [showCta, setShowCta] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<AuthTab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowCta(true), 2800);

    try {
      const savedEmail = window.localStorage.getItem("gct_saved_email");
      const savedRemember = window.localStorage.getItem("gct_remember_me");
      if (savedEmail) setEmail(savedEmail);
      if (savedRemember === "0") setRememberMe(false);
    } catch {
      // Local browser storage is optional.
    }

    return () => window.clearTimeout(timer);
  }, []);

  const handleLogin = async () => {
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!password.trim()) {
      setError("Please enter your password or temporary Tour Member Number.");
      return;
    }

    setSubmitting(true);

    try {
      window.localStorage.setItem("gct_remember_me", rememberMe ? "1" : "0");
      window.sessionStorage.setItem("gct_active_session", "1");
      if (rememberMe) window.localStorage.setItem("gct_saved_email", email.trim());
      else window.localStorage.removeItem("gct_saved_email");
    } catch {
      // Storage failure should not block sign-in.
    }

    try {
      const result = await signInAndResolveCreator(email.trim(), password);

      if (result.error || !result.creator) {
        setError(result.error || "Sign-in failed. Please try again.");
        setSubmitting(false);
        return;
      }

      router.push(getPostAuthDestination(result.creator));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in is unavailable right now.");
      setSubmitting(false);
    }
  };

  const handleExternalSignup = () => {
    const opened = window.open(externalApplicationUrl, "_blank", "noopener,noreferrer");
    if (!opened) window.location.href = externalApplicationUrl;
  };

  return (
    <main className="fixed inset-0 z-50 flex justify-center overflow-hidden bg-[#0e1626] text-white">
      <div className="relative flex min-h-screen w-full max-w-[var(--app-max-w)] flex-col items-center justify-center overflow-hidden px-5">
        <div
          className={`absolute left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(15,27,46,0.44)_0%,rgba(201,168,76,0.018)_45%,transparent_70%)] transition-[top] duration-700 ${
            sheetOpen ? "top-[30%]" : "top-[42%]"
          }`}
        />

        <section
          className={`relative flex flex-col items-center transition duration-700 ease-out ${
            sheetOpen ? "-translate-y-28 scale-[0.72] opacity-70" : "translate-y-0 scale-100 opacity-100"
          }`}
        >
          <TourGlobe />
          <p className="mt-7 text-center text-[10px] font-bold uppercase tracking-[0.42em] text-[#c9a84c] opacity-0 animate-[gctFadeUp_0.6s_ease_1.8s_forwards]">
            Compete · Create · Connect
          </p>
          <p className="mt-2.5 text-[9px] font-semibold uppercase tracking-[0.28em] text-white opacity-0 animate-[gctFadeUp_0.5s_ease_2.2s_forwards]">
            Season 2026
          </p>
        </section>

        {showCta && !sheetOpen ? (
          <button
            className="tap-row absolute bottom-14 rounded-xl border border-[#c9a84c]/20 px-9 py-3.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#c9a84c] opacity-0 transition hover:border-[#c9a84c]/50 hover:bg-[#c9a84c]/5 animate-[gctFadeUp_0.5s_ease_0.1s_forwards]"
            onClick={() => setSheetOpen(true)}
            type="button"
          >
            Enter Tour
          </button>
        ) : null}

        {sheetOpen ? (
          <section className="gct-fixed fixed bottom-0 z-20 px-4">
            <div className="max-h-[72vh] overflow-y-auto rounded-t-[24px] border border-b-0 border-white/10 bg-[rgba(17,18,20,0.94)] px-5 pb-[max(30px,env(safe-area-inset-bottom))] pt-6 shadow-[0_-20px_80px_rgba(201,168,76,0.06),0_8px_40px_rgba(0,0,0,0.55)] backdrop-blur-3xl">
              <div className="mb-6 grid grid-cols-2 rounded-xl bg-white/[0.04] p-1">
                <TabButton active={activeTab === "login"} label="Log In" onClick={() => setActiveTab("login")} />
                <TabButton active={activeTab === "signup"} label="Sign Up" onClick={() => setActiveTab("signup")} />
              </div>

              {activeTab === "login" ? (
                <form
                  className="animate-[gctFadeUp_0.35s_ease_both]"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void handleLogin();
                  }}
                >
                  <div className="mb-5 text-center">
                    <h1 className="text-xl font-black text-white">Welcome Back</h1>
                    <p className="mt-1 text-xs font-semibold text-white/45">Sign in with your member account</p>
                  </div>

                  <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.16em] text-white/45">
                    Email Address
                  </label>
                  <input
                    autoComplete="username"
                    className="mb-4 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-4 text-sm font-semibold text-white outline-none transition placeholder:text-white/20 focus:border-[#c9a84c]/50"
                    inputMode="email"
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="your@email.com"
                    type="email"
                    value={email}
                  />

                  <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.16em] text-white/45">
                    Password / Tour Member Number
                  </label>
                  <div className="relative mb-4">
                    <input
                      autoComplete="current-password"
                      className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-4 pr-12 text-sm font-semibold text-white outline-none transition placeholder:text-white/20 focus:border-[#c9a84c]/50"
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="GCT-0000 or password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                    />
                    <button
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-white/45 transition hover:bg-white/5 hover:text-[#c9a84c]"
                      onClick={() => setShowPassword((value) => !value)}
                      title={showPassword ? "Hide password" : "Show password"}
                      type="button"
                    >
                      {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  </div>

                  <button
                    className="tap-row mb-4 flex items-center gap-3 text-left text-xs font-bold text-white/75"
                    onClick={() => setRememberMe((value) => !value)}
                    type="button"
                  >
                    <span
                      aria-checked={rememberMe}
                      className={`flex h-[18px] w-[18px] items-center justify-center rounded-[5px] border ${
                        rememberMe ? "border-[#c9a84c] bg-[#c9a84c]" : "border-white/25"
                      }`}
                      role="checkbox"
                    >
                      {rememberMe ? <span className="h-2 w-2 rounded-sm bg-[#08090a]" /> : null}
                    </span>
                    Remember Me
                  </button>

                  {error ? (
                    <div className="mb-4 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-xs font-bold leading-5 text-red-200">
                      {error}
                    </div>
                  ) : null}

                  <button
                    className="tap-row flex w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,#c9a84c,#8b7636)] px-4 py-4 text-sm font-black text-[#08090a] disabled:cursor-wait disabled:opacity-60"
                    disabled={submitting}
                    type="submit"
                  >
                    {submitting ? <Loader2 className="animate-spin" size={17} /> : <LockKeyhole size={17} />}
                    {submitting ? "Signing in..." : "Sign In"}
                  </button>
                </form>
              ) : (
                <div className="animate-[gctFadeUp_0.35s_ease_both] text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[#c9a84c]/25 bg-[#c9a84c]/10 text-[#c9a84c]">
                    <UserPlus size={24} />
                  </div>
                  <h1 className="text-xl font-black text-white">Join the Tour</h1>
                  <p className="mx-auto mt-2 max-w-xs text-sm font-semibold leading-6 text-white/50">
                    GCT is invite-only. Apply through the public tour site, then return here after approval.
                  </p>
                  <button
                    className="tap-row mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,#c9a84c,#8b7636)] px-4 py-4 text-sm font-black text-[#08090a]"
                    onClick={handleExternalSignup}
                    type="button"
                  >
                    Apply at golfcreatortour.com
                    <ExternalLink size={16} />
                  </button>
                  <button
                    className="mt-4 text-xs font-bold text-[#c9a84c]"
                    onClick={() => setActiveTab("login")}
                    type="button"
                  >
                    Already approved? Log In
                  </button>
                </div>
              )}
            </div>
          </section>
        ) : null}

      </div>
    </main>
  );
}

function TabButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      className={`rounded-[10px] py-3 text-[11px] font-black uppercase tracking-[0.12em] transition ${
        active ? "bg-[#c9a84c]/15 text-[#c9a84c]" : "text-white/40"
      }`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

type GlobePoint = {
  x: number;
  y: number;
  z: number;
};

function TourGlobe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotationRef = useRef(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssSize = 360;
    const cx = cssSize / 2;
    const cy = cssSize / 2;
    const radius = cssSize / 2 - 20;

    canvas.width = cssSize * dpr;
    canvas.height = cssSize * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const raw = atob(LAND_MASK_B64);
    const maskBytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i += 1) maskBytes[i] = raw.charCodeAt(i);

    const maskWidth = 360;
    const maskHeight = 180;
    const landGrid = new Uint8Array(maskWidth * maskHeight);
    for (let i = 0; i < maskWidth * maskHeight; i += 1) {
      const byteIndex = i >> 3;
      const bitIndex = 7 - (i & 7);
      landGrid[i] = (maskBytes[byteIndex] >> bitIndex) & 1;
    }

    const isLand = (latDeg: number, lonDeg: number) => {
      const row = Math.floor(89.5 - latDeg);
      let col = Math.floor(lonDeg + 179.5);
      if (col < 0) col += 360;
      else if (col >= 360) col -= 360;
      if (row < 0 || row >= maskHeight) return false;
      return landGrid[row * maskWidth + col] === 1;
    };

    const tilt = 0.3;
    const cosTilt = Math.cos(tilt);
    const sinTilt = Math.sin(tilt);
    const radians = Math.PI / 180;
    const dotSpacing = 1.4;
    const landDots: GlobePoint[] = [];

    for (let lat = -90; lat <= 90; lat += dotSpacing) {
      const latRad = lat * radians;
      const cosLat = Math.cos(latRad);
      const sinLat = Math.sin(latRad);
      const rowCircumference = cosLat * 360;
      const dotsInRow = Math.max(1, Math.round(rowCircumference / dotSpacing));

      for (let index = 0; index < dotsInRow; index += 1) {
        const lon = -180 + index * (360 / dotsInRow);
        if (!isLand(lat, lon)) continue;
        const lonRad = -lon * radians;
        landDots.push({
          x: cosLat * Math.cos(lonRad),
          y: sinLat,
          z: cosLat * Math.sin(lonRad)
        });
      }
    }

    const markerLocations = [
      { lat: 27.5, lon: -81.5 },
      { lat: 35.6, lon: -79.8 },
      { lat: 33.4, lon: -111.9 },
      { lat: 36.2, lon: -115.1 },
      { lat: 36.8, lon: -119.4 },
      { lat: 20.8, lon: -156.3 },
      { lat: -37.8, lon: 144.9 },
      { lat: 25.2, lon: 55.3 },
      { lat: 56.5, lon: -4.2 }
    ];

    const markerDots = markerLocations.map((marker) => {
      const latRad = marker.lat * radians;
      const lonRad = -marker.lon * radians;
      return {
        x: Math.cos(latRad) * Math.cos(lonRad),
        y: Math.sin(latRad),
        z: Math.cos(latRad) * Math.sin(lonRad)
      };
    });

    let destroyed = false;
    let paused = document.hidden;

    const render = () => {
      if (destroyed) return;
      if (paused) {
        frameRef.current = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, cssSize, cssSize);

      const rotation = rotationRef.current;
      const cosRotation = Math.cos(rotation);
      const sinRotation = Math.sin(rotation);
      const oceanGradient = ctx.createRadialGradient(cx - 20, cy - 20, 0, cx, cy, radius);
      oceanGradient.addColorStop(0, "rgba(26,38,60,1)");
      oceanGradient.addColorStop(0.7, "rgba(18,28,48,1)");
      oceanGradient.addColorStop(1, "rgba(14,22,38,0.85)");

      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = oceanGradient;
      ctx.fill();

      for (const dot of landDots) {
        const rotatedX = dot.x * cosRotation + dot.z * sinRotation;
        const rotatedZ = -dot.x * sinRotation + dot.z * cosRotation;
        const rotatedY = dot.y * cosTilt - rotatedZ * sinTilt;
        const depthZ = dot.y * sinTilt + rotatedZ * cosTilt;
        if (depthZ < -0.05) continue;

        const screenX = cx + rotatedX * radius;
        const screenY = cy - rotatedY * radius;
        ctx.beginPath();
        ctx.arc(screenX, screenY, 0.65, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(210,225,245,${0.08 + ((depthZ + 1) / 2) * 0.88})`;
        ctx.fill();
      }

      for (const marker of markerDots) {
        const rotatedX = marker.x * cosRotation + marker.z * sinRotation;
        const rotatedZ = -marker.x * sinRotation + marker.z * cosRotation;
        const rotatedY = marker.y * cosTilt - rotatedZ * sinTilt;
        const depthZ = marker.y * sinTilt + rotatedZ * cosTilt;
        if (depthZ < 0) continue;

        const screenX = cx + rotatedX * radius;
        const screenY = cy - rotatedY * radius;
        const depth = (depthZ + 1) / 2;
        const glow = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, 8);
        glow.addColorStop(0, `rgba(0,180,255,${0.35 * depth})`);
        glow.addColorStop(0.5, `rgba(0,140,255,${0.12 * depth})`);
        glow.addColorStop(1, "rgba(0,100,255,0)");

        ctx.beginPath();
        ctx.arc(screenX, screenY, 8, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(screenX, screenY, 1.8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(50,200,255,${0.6 + 0.4 * depth})`;
        ctx.fill();
      }

      const edgeGradient = ctx.createRadialGradient(cx, cy, radius * 0.88, cx, cy, radius * 1.08);
      edgeGradient.addColorStop(0, "rgba(40,80,140,0)");
      edgeGradient.addColorStop(0.5, "rgba(40,80,140,0.03)");
      edgeGradient.addColorStop(1, "rgba(30,60,110,0.06)");
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.08, 0, Math.PI * 2);
      ctx.fillStyle = edgeGradient;
      ctx.fill();

      if (!reduceMotion) rotationRef.current += 0.0018;
      if (reduceMotion) return;
      frameRef.current = requestAnimationFrame(render);
    };

    render();

    const handleVisibilityChange = () => {
      paused = document.hidden;
      if (!paused && reduceMotion) render();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      destroyed = true;
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
    <div
      className="relative h-[min(84vw,360px)] max-h-[360px] w-[min(84vw,360px)] max-w-[360px] rounded-full"
      style={{ animation: "gctGlowPulse 4s ease infinite" }}
    >
      <canvas
        aria-hidden="true"
        className="relative z-[1] h-full w-full rounded-full opacity-100 transition-opacity duration-1000"
        ref={canvasRef}
      />
      <div className="pointer-events-none absolute inset-0 z-[2] flex items-center justify-center">
        <Image
          alt="The Golf Creator Tour"
          className="h-[250px] w-[250px] object-contain opacity-0"
          height={250}
          priority
          src={gctFullLogo}
          unoptimized
          width={250}
          style={{
            animation: "gctLogoReveal 1.2s cubic-bezier(0.16, 1, 0.3, 1) 1.2s forwards",
            filter: "drop-shadow(0 0 30px rgba(255,255,255,0.15)) drop-shadow(0 0 60px rgba(201,168,76,0.1))"
          }}
        />
      </div>
    </div>
  );
}
