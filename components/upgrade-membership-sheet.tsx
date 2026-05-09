"use client";

import { Check, Crown, X } from "lucide-react";
import { useState } from "react";

type UpgradeMembershipSheetProps = {
  isOpen: boolean;
  onClose: () => void;
};

const plans = [
  {
    tier: "Standard",
    price: "Free",
    description: "Access Standard tier challenges and leaderboard tracking.",
    features: ["Current plan", "Creator profile", "Leaderboard access"],
    cta: "Current Plan",
    accent: "border-[#d7dde8] bg-white text-[#071a33]"
  },
  {
    tier: "Premium",
    price: "$8.33",
    suffix: "/mo",
    description: "Unlock Premium challenges with top brands and earn more points faster.",
    features: ["Premium brand challenges", "Priority challenge slots", "Profile badge"],
    cta: "Upgrade to Premium",
    accent: "border-violet-500/30 bg-[#2a0f55] text-white"
  },
  {
    tier: "Elite",
    price: "$16.67",
    suffix: "/mo",
    description: "Full access to every challenge tier and highest level competition.",
    features: ["Elite brand challenges", "2x points multiplier", "Direct brand opportunities"],
    cta: "Upgrade to Elite",
    accent: "border-[#c9a84c]/45 bg-[#13233f] text-white"
  }
];

export function UpgradeMembershipSheet({ isOpen, onClose }: UpgradeMembershipSheetProps) {
  const [annual, setAnnual] = useState(true);

  if (!isOpen) {
    return null;
  }

  return (
    <>
      <button
        aria-label="Close upgrade overlay"
        className="gct-fixed fixed inset-y-0 z-50 bg-black/55 backdrop-blur-sm"
        onClick={onClose}
        type="button"
      />
      <aside className="gct-fixed fixed bottom-0 z-[80] max-h-[92vh] overflow-y-auto rounded-t-[28px] border border-white/10 bg-[#0f1b2e] px-4 pb-8 pt-4 text-white shadow-sheet">
        <div className="mx-auto h-1.5 w-12 rounded-full bg-white/20" />
        <header className="mt-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#c9a84c]">Upgrade Membership</p>
            <h2 className="mt-1 text-2xl font-black">Choose your tour tier</h2>
          </div>
          <button
            aria-label="Close upgrade membership"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white/70"
            onClick={onClose}
            type="button"
          >
            <X size={18} />
          </button>
        </header>

        <div className="mt-5 grid grid-cols-2 rounded-2xl border border-white/10 bg-white/5 p-1">
          <button
            className={`rounded-xl py-3 text-sm font-black ${annual ? "bg-[#c9a84c] text-[#071225]" : "text-white/55"}`}
            onClick={() => setAnnual(true)}
            type="button"
          >
            Annual
          </button>
          <button
            className={`rounded-xl py-3 text-sm font-black ${!annual ? "bg-[#c9a84c] text-[#071225]" : "text-white/55"}`}
            onClick={() => setAnnual(false)}
            type="button"
          >
            Monthly
          </button>
        </div>

        <section className="mt-5 rounded-2xl border border-[#c9a84c]/35 bg-[linear-gradient(135deg,#2d2602,#161108)] p-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#c9a84c] text-[#071225]">
              <Crown size={28} />
            </div>
            <div>
              <p className="text-base font-black text-[#d5b64f]">Founding Member</p>
              <p className="mt-1 text-xs text-white/70">Limited 1 of 100 Elite Annual positioning.</p>
            </div>
          </div>
        </section>

        <div className="mt-4 grid gap-3">
          {plans.map((plan) => (
            <article className={`rounded-2xl border p-4 ${plan.accent}`} key={plan.tier}>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">{plan.tier}</p>
              <div className="mt-2 flex items-end gap-1">
                <span className="text-3xl font-black">{plan.price}</span>
                {plan.suffix && <span className="pb-1 text-sm font-bold opacity-70">{plan.suffix}</span>}
              </div>
              <p className="mt-3 text-xs leading-5 opacity-75">{plan.description}</p>
              <ul className="mt-4 grid gap-2">
                {plan.features.map((feature) => (
                  <li className="flex items-center gap-2 text-xs font-semibold" key={feature}>
                    <Check size={15} className="text-[#c9a84c]" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                className={`mt-5 w-full rounded-xl py-3 text-sm font-black ${
                  plan.tier === "Standard" ? "border border-[#d7dde8] bg-white text-[#7b8596]" : "bg-[#c9a84c] text-[#071225]"
                }`}
                disabled={plan.tier === "Standard"}
                type="button"
              >
                {plan.cta}
              </button>
            </article>
          ))}
        </div>
      </aside>
    </>
  );
}
