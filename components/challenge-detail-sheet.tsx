"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Crown, LockKeyhole, Send, Star } from "lucide-react";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { CreatorAvatar } from "@/components/creator-card";
import { ModalSheet } from "@/components/modal-sheet";
import { toast } from "@/components/toast";
import type { Challenge } from "@/lib/mock-data";

type ChallengeDetailSheetProps = {
  challenge: Challenge | null;
  isOpen: boolean;
  onClose: () => void;
  onUpgrade?: () => void;
};

const tierClass = {
  Standard: "bg-[#6b7280] text-white",
  Premium: "bg-[#7c3aed] text-white",
  Elite: "bg-[#c9a84c] text-[#071225]",
  GCT: "bg-[#0f1b2e] text-[#c9a84c]"
};

export function ChallengeDetailSheet({ challenge, isOpen, onClose, onUpgrade }: ChallengeDetailSheetProps) {
  const [joined, setJoined] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [confirmDrop, setConfirmDrop] = useState(false);

  useEffect(() => {
    if (!challenge || !isOpen) {
      return;
    }

    setJoined(challenge.status === "Joined" || challenge.status === "Submitted");
    setSubmitted(challenge.status === "Submitted");
    setConfirmDrop(false);
  }, [challenge, isOpen]);

  const fillPercent = useMemo(() => {
    if (!challenge?.spots) {
      return 0;
    }
    return Math.round((challenge.filled / challenge.spots) * 100);
  }, [challenge]);

  if (!challenge) {
    return null;
  }

  const needsUpgrade = challenge.tier === "Elite";
  const closed = challenge.status === "Coming Soon";
  const spotsLeft = challenge.spots > 0 ? challenge.spots - challenge.filled : null;

  return (
    <>
      <ModalSheet isOpen={isOpen} onClose={onClose} showHandle tone="light" variant="bottom">
        <div className="-mx-1">
          <section
            className="rounded-2xl border p-4"
            style={{
              background: `linear-gradient(135deg,${challenge.color}14 0%,#ffffff 72%)`,
              borderColor: `${challenge.color}35`
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-md px-2 py-1 text-[8px] font-black uppercase tracking-[0.14em] ${tierClass[challenge.tier]}`}>
                    {challenge.tier}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#c9a84c]">
                    {challenge.points} pts
                  </span>
                </div>
                <h2 className="mt-3 text-xl font-black leading-6 text-[#071a33]">{challenge.title}</h2>
                <p className="mt-2 text-sm font-bold text-[#6d7789]">{challenge.brand}</p>
              </div>
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border text-sm font-black"
                style={{
                  backgroundColor: `${challenge.color}18`,
                  borderColor: `${challenge.color}35`,
                  color: challenge.color
                }}
              >
                {challenge.brand
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-[#5f6b7d]">{challenge.description}</p>
          </section>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <InfoTile label="Deadline" value={challenge.deadline} />
            <InfoTile label="Spots" value={spotsLeft === null ? "Open" : String(spotsLeft)} detail={spotsLeft === null ? "No limit" : `of ${challenge.spots} left`} />
          </div>

          {challenge.spots > 0 && (
            <div className="mt-4 rounded-2xl border border-[#d7dde8] bg-white p-4">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.14em] text-[#9aa4b5]">
                <span>Participation</span>
                <span>{fillPercent}% full</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#dce3ef]">
                <div className="h-full rounded-full bg-[#c9a84c]" style={{ width: `${Math.min(fillPercent, 100)}%` }} />
              </div>
              {challenge.participants.length > 0 && (
                <div className="mt-4 flex items-center gap-2">
                  <div className="flex">
                    {challenge.participants.slice(0, 4).map((participant, index) => (
                      <span className={index > 0 ? "-ml-2" : ""} key={participant.id}>
                        <CreatorAvatar creator={participant} size="sm" />
                      </span>
                    ))}
                  </div>
                  <p className="text-xs font-bold text-[#7b8596]">
                    {challenge.participants[0]?.handle ? `@${challenge.participants[0].handle}` : "Creators"} joined
                    {challenge.participants.length > 1 ? ` with ${challenge.participants.length - 1} others` : ""}
                  </p>
                </div>
              )}
            </div>
          )}

          <section className="mt-4">
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#9aa4b5]">Requirements</p>
            <div className="overflow-hidden rounded-2xl border border-[#d7dde8] bg-white">
              {challenge.requirements.map((requirement, index) => (
                <div
                  className={`flex items-start gap-3 px-4 py-3 ${
                    index < challenge.requirements.length - 1 ? "border-b border-[#d7dde8]" : ""
                  }`}
                  key={requirement}
                >
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                      joined ? "border-[#c9a84c] bg-[#c9a84c] text-[#071225]" : "border-[#cbd3df] text-transparent"
                    }`}
                  >
                    <Check size={13} />
                  </span>
                  <span className="text-sm leading-6 text-[#5f6b7d]">{requirement}</span>
                </div>
              ))}
            </div>
          </section>

          {needsUpgrade && !joined && (
            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-[#d7dde8] bg-white p-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#fff8df] text-[#c9a84c]">
                <LockKeyhole size={19} />
              </div>
              <div>
                <p className="text-sm font-black text-[#071a33]">Elite plan required</p>
                <p className="mt-1 text-xs leading-5 text-[#7b8596]">Upgrade access is mocked for Phase 2.</p>
              </div>
            </div>
          )}

          <div className="mt-5 grid gap-3 pb-1">
            {closed ? (
              <button
                className="min-h-12 rounded-xl border border-[#d7dde8] bg-[#eef2f8] text-sm font-black text-[#9aa4b5]"
                disabled
                type="button"
              >
                Coming Soon
              </button>
            ) : submitted ? (
              <button
                className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 text-sm font-black text-emerald-700"
                onClick={() => toast.success("Submission review state is mocked for Phase 2.")}
                type="button"
              >
                <Check size={16} />
                Submitted
              </button>
            ) : joined ? (
              <>
                <button
                  className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#0f1b2e] text-sm font-black text-white"
                  onClick={() => {
                    setSubmitted(true);
                    toast.success("Mock submission marked as ready for review.");
                  }}
                  type="button"
                >
                  <Send size={16} />
                  Submit Challenge
                </button>
                <button
                  className="min-h-11 rounded-xl border border-red-200 bg-red-50 text-sm font-black text-red-500"
                  onClick={() => setConfirmDrop(true)}
                  type="button"
                >
                  Drop Challenge
                </button>
              </>
            ) : needsUpgrade ? (
              <button
                className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#c9a84c] text-sm font-black text-[#071225]"
                onClick={onUpgrade}
                type="button"
              >
                <Crown size={16} />
                Upgrade to Elite
              </button>
            ) : (
              <button
                className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#0f1b2e] text-sm font-black text-white"
                onClick={() => {
                  setJoined(true);
                  toast.success(`Joined ${challenge.title} with mock data.`);
                }}
                type="button"
              >
                <Star size={16} />
                Join Challenge
              </button>
            )}
          </div>
        </div>
      </ModalSheet>

      <ConfirmationDialog
        body="This only changes the local mock state in Phase 2."
        confirmLabel="Drop"
        destructive
        isOpen={confirmDrop}
        onCancel={() => setConfirmDrop(false)}
        onConfirm={() => {
          setJoined(false);
          setSubmitted(false);
          setConfirmDrop(false);
          toast.info("Mock challenge spot released.");
        }}
        title="Drop this challenge?"
      />
    </>
  );
}

function InfoTile({ detail, label, value }: { detail?: string; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#d7dde8] bg-white px-4 py-3">
      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#9aa4b5]">{label}</p>
      <p className="mt-2 text-lg font-black text-[#071a33]">{value}</p>
      {detail && <p className="mt-1 text-[11px] text-[#8b95a7]">{detail}</p>}
    </div>
  );
}
