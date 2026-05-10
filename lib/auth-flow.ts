import { createClient } from "@/lib/supabase/client";
import type { CreatorRole, CreatorStatus } from "@/types/database";
import type { User } from "@supabase/supabase-js";

export type CreatorAuthSnapshot = {
  id: string;
  name: string;
  status: CreatorStatus;
  role: CreatorRole;
  must_reset_password: boolean;
  onboarding_completed: boolean;
};

export type CreatorSocialPlatform = "instagram" | "tiktok" | "youtube";

type AuthDestination = "/auth/reset-password" | "/onboarding" | "/profile";

export function firstNameFromCreator(name?: string | null) {
  return name?.trim().split(/\s+/)[0] || "Creator";
}

export function getPostAuthDestination(creator: CreatorAuthSnapshot): AuthDestination {
  if (creator.must_reset_password) return "/auth/reset-password";
  if (!creator.onboarding_completed) return "/onboarding";
  return "/profile";
}

export async function getCurrentUserAndCreator(): Promise<{
  user: User | null;
  creator: CreatorAuthSnapshot | null;
}> {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, creator: null };
  }

  const { data: creator, error } = await supabase
    .from("creators")
    .select("id,name,status,role,must_reset_password,onboarding_completed")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (error || !creator) {
    return { user, creator: null };
  }

  return {
    user,
    creator: {
      id: creator.id,
      name: creator.name,
      status: creator.status,
      role: creator.role,
      must_reset_password: creator.must_reset_password,
      onboarding_completed: creator.onboarding_completed
    }
  };
}

export async function signInAndResolveCreator(email: string, password: string) {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message, creator: null };
  }

  const { user, creator } = await getCurrentUserAndCreator();
  if (!user || !creator) {
    await supabase.auth.signOut();
    return {
      error: "No approved creator profile is linked to this account.",
      creator: null
    };
  }

  if (["pending", "invited", "suspended", "banned", "rejected"].includes(creator.status)) {
    await supabase.auth.signOut();
    return {
      error: "This Tour account is not active. Contact GCT support if this looks wrong.",
      creator: null
    };
  }

  try {
    await supabase.rpc("record_login", { p_auth_user_id: user.id });
  } catch {
    // Login timestamp is non-critical for routing.
  }

  return { error: null, creator };
}

export async function activatePassword(newPassword: string) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Your activation session expired. Please sign in again." };
  }

  const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
  if (updateError) {
    return { error: updateError.message };
  }

  const { data: rpcResult, error: rpcError } = await supabase.rpc("activate_creator", {
    p_auth_user_id: user.id
  });

  if (rpcError || !rpcResult?.success) {
    const { error: fallbackError } = await supabase
      .from("creators")
      .update({
        must_reset_password: false,
        status: "active",
        activated_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("auth_user_id", user.id);

    if (fallbackError) {
      return { error: rpcResult?.error || rpcError?.message || fallbackError.message };
    }
  }

  return { error: null };
}

export async function loadOnboardingState() {
  const { user, creator } = await getCurrentUserAndCreator();
  if (!user || !creator) {
    return { error: "Please sign in to continue onboarding.", creator: null, socials: [] };
  }

  const supabase = createClient();
  const { data: socials } = await supabase
    .from("social_connections")
    .select("platform,handle,connected")
    .eq("creator_id", creator.id);

  return {
    error: null,
    creator,
    socials: socials ?? []
  };
}

export async function saveCreatorLocation(creatorId: string, latitude: number, longitude: number) {
  try {
    window.localStorage.setItem(
      "gct_location_hint",
      JSON.stringify({ creatorId, latitude, longitude, savedAt: new Date().toISOString() })
    );
  } catch {
    // Non-essential browser storage.
  }

  return { error: null };
}

export async function connectSocialPlatform(
  creatorId: string,
  platform: CreatorSocialPlatform,
  handle: string
) {
  const supabase = createClient();
  const cleanHandle = handle.trim().replace(/^@/, "");

  if (!cleanHandle) {
    return { error: "Enter your profile handle to connect this platform.", points: 0 };
  }

  const { data: existing } = await supabase
    .from("social_connections")
    .select("id,connected")
    .eq("creator_id", creatorId)
    .eq("platform", platform)
    .maybeSingle();

  const { error: saveError } = await supabase.from("social_connections").upsert(
    {
      creator_id: creatorId,
      platform,
      handle: cleanHandle,
      followers: 0,
      connected: true,
      last_synced_at: new Date().toISOString()
    },
    { onConflict: "creator_id,platform" }
  );

  if (saveError) {
    return { error: saveError.message, points: 0 };
  }

  if (existing?.connected) {
    return { error: null, points: 0 };
  }

  const { data: season } = await supabase.from("seasons").select("id").eq("status", "active").maybeSingle();
  if (!season?.id) {
    return { error: null, points: 50 };
  }

  const { data: points } = await supabase.rpc("award_connection_bonus", {
    p_creator_id: creatorId,
    p_season_id: season.id,
    p_platform: platform
  });

  return { error: null, points: points ?? 50 };
}

export async function finishOnboarding(creatorId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("creators")
    .update({
      onboarding_completed: true,
      updated_at: new Date().toISOString()
    })
    .eq("id", creatorId);

  if (error) {
    return { error: error.message };
  }

  try {
    window.localStorage.setItem("gct_onboarding_done", "1");
  } catch {
    // Non-essential browser storage.
  }

  return { error: null };
}
