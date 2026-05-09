import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Briefcase,
  Crown,
  Flag,
  LockKeyhole,
  Mail,
  Megaphone,
  MessageSquare,
  Settings,
  Shield,
  Trophy,
  UserRound,
  UsersRound
} from "lucide-react";

export type Stat = {
  label: string;
  value: string;
};

export type PageConfig = {
  route: string;
  title: string;
  eyebrow: string;
  description: string;
  icon: LucideIcon;
  stats: Stat[];
  successTitle: string;
  emptyTitle: string;
  errorTitle: string;
};

export const dashboardPages = {
  profile: {
    route: "/profile",
    title: "Profile",
    eyebrow: "Creator dashboard",
    description: "Tour card, socials, sponsors, golf bag, active challenges, and accepted matches.",
    icon: UserRound,
    stats: [
      { label: "Points", value: "5,591" },
      { label: "Challenges", value: "3" },
      { label: "Matches", value: "2" }
    ],
    successTitle: "Profile shell ready",
    emptyTitle: "No profile sections loaded",
    errorTitle: "Profile data unavailable"
  },
  compete: {
    route: "/compete",
    title: "Leaderboard",
    eyebrow: "Season 2026",
    description: "Ranks, exempt podium, activity feed, filters, and creator profile sheet entry points.",
    icon: Trophy,
    stats: [
      { label: "Your Rank", value: "#0" },
      { label: "Your Points", value: "0" },
      { label: "Total", value: "100" }
    ],
    successTitle: "Leaderboard shell ready",
    emptyTitle: "No ranked creators yet",
    errorTitle: "Leaderboard unavailable"
  },
  create: {
    route: "/create",
    title: "Brand Challenges",
    eyebrow: "Create",
    description: "Challenge filters, challenge detail sheet, submission flow, and upgrade entry points.",
    icon: Crown,
    stats: [
      { label: "Your Points", value: "5,591" },
      { label: "Completed", value: "3" },
      { label: "Active", value: "0" }
    ],
    successTitle: "Create shell ready",
    emptyTitle: "No challenges available",
    errorTitle: "Challenges unavailable"
  },
  connect: {
    route: "/connect",
    title: "Connect",
    eyebrow: "Matches",
    description: "Browse creators nearby, manage requests, active matches, and sent challenges.",
    icon: UsersRound,
    stats: [
      { label: "Nearby", value: "6" },
      { label: "Sent", value: "3" },
      { label: "Requests", value: "0" }
    ],
    successTitle: "Connect shell ready",
    emptyTitle: "No creators found nearby",
    errorTitle: "Matches unavailable"
  },
  messages: {
    route: "/messages",
    title: "Messages",
    eyebrow: "Inbox",
    description: "Creator match conversations and message settings placeholder.",
    icon: MessageSquare,
    stats: [
      { label: "Unread", value: "0" },
      { label: "Threads", value: "0" },
      { label: "Matches", value: "0" }
    ],
    successTitle: "Messages route ready",
    emptyTitle: "No messages yet",
    errorTitle: "Messages unavailable"
  },
  home: {
    route: "/home",
    title: "GCO 2026",
    eyebrow: "Event hub",
    description: "Golf Creator Open event details and updates placeholder.",
    icon: Flag,
    stats: [
      { label: "Season", value: "2026" },
      { label: "Status", value: "Live" },
      { label: "Spots", value: "100" }
    ],
    successTitle: "GCO route ready",
    emptyTitle: "No event updates yet",
    errorTitle: "Event details unavailable"
  },
  howToCompete: {
    route: "/how-to-compete",
    title: "How to Compete",
    eyebrow: "Tour loop",
    description: "Connect socials, complete challenges, play matches, earn points, climb the leaderboard.",
    icon: BookOpen,
    stats: [
      { label: "Steps", value: "5" },
      { label: "Tabs", value: "4" },
      { label: "Goal", value: "GCO" }
    ],
    successTitle: "Guide route ready",
    emptyTitle: "No guide sections loaded",
    errorTitle: "Guide unavailable"
  },
  referrals: {
    route: "/referrals",
    title: "Referral Program",
    eyebrow: "Invite rewards",
    description: "Referral tracking and invite reward placeholder.",
    icon: Megaphone,
    stats: [
      { label: "Invites", value: "0" },
      { label: "Pending", value: "0" },
      { label: "Rewards", value: "$0" }
    ],
    successTitle: "Referral route ready",
    emptyTitle: "No referrals yet",
    errorTitle: "Referral data unavailable"
  },
  settings: {
    route: "/settings",
    title: "Settings",
    eyebrow: "Account",
    description: "Account, language, notification, and help settings placeholder.",
    icon: Settings,
    stats: [
      { label: "Account", value: "OK" },
      { label: "Alerts", value: "On" },
      { label: "Locale", value: "EN" }
    ],
    successTitle: "Settings route ready",
    emptyTitle: "No settings loaded",
    errorTitle: "Settings unavailable"
  },
  admin: {
    route: "/admin",
    title: "Admin Dashboard",
    eyebrow: "Tour ops",
    description: "Members, challenges, matches, revenue, applications, and notifications placeholder.",
    icon: Shield,
    stats: [
      { label: "Members", value: "100" },
      { label: "Challenges", value: "9" },
      { label: "Applications", value: "0" }
    ],
    successTitle: "Admin route ready",
    emptyTitle: "No admin records loaded",
    errorTitle: "Admin data unavailable"
  }
} satisfies Record<string, PageConfig>;

export const publicPages = {
  auth: {
    route: "/auth",
    title: "Enter Tour",
    eyebrow: "Invite-only access",
    description: "Member sign-in and external application entry placeholder.",
    icon: LockKeyhole,
    stats: [
      { label: "Access", value: "Invite" },
      { label: "Season", value: "2026" },
      { label: "Status", value: "Ready" }
    ],
    successTitle: "Auth route ready",
    emptyTitle: "No saved session",
    errorTitle: "Sign-in unavailable"
  },
  resetPassword: {
    route: "/auth/reset-password",
    title: "Account Activation",
    eyebrow: "Set password",
    description: "First login password reset placeholder.",
    icon: LockKeyhole,
    stats: [
      { label: "Rules", value: "4" },
      { label: "Minimum", value: "8" },
      { label: "Next", value: "Onboard" }
    ],
    successTitle: "Activation route ready",
    emptyTitle: "No activation session",
    errorTitle: "Activation unavailable"
  },
  onboarding: {
    route: "/onboarding",
    title: "Onboarding",
    eyebrow: "First setup",
    description: "Welcome, location, socials, and finish steps placeholder.",
    icon: UserRound,
    stats: [
      { label: "Steps", value: "4" },
      { label: "Socials", value: "1+" },
      { label: "Next", value: "Profile" }
    ],
    successTitle: "Onboarding route ready",
    emptyTitle: "No onboarding progress",
    errorTitle: "Onboarding unavailable"
  },
  apply: {
    route: "/apply",
    title: "Apply",
    eyebrow: "Public funnel",
    description: "Creator application funnel placeholder.",
    icon: Mail,
    stats: [
      { label: "Type", value: "Public" },
      { label: "Signup", value: "External" },
      { label: "Invite", value: "Only" }
    ],
    successTitle: "Apply route ready",
    emptyTitle: "No application content",
    errorTitle: "Application unavailable"
  },
  brands: {
    route: "/brands",
    title: "Brands",
    eyebrow: "Public funnel",
    description: "Brand partnership funnel placeholder.",
    icon: Briefcase,
    stats: [
      { label: "Type", value: "Public" },
      { label: "Partners", value: "TBD" },
      { label: "Season", value: "2026" }
    ],
    successTitle: "Brands route ready",
    emptyTitle: "No brand content",
    errorTitle: "Brand page unavailable"
  },
  terms: {
    route: "/terms",
    title: "Terms",
    eyebrow: "Legal",
    description: "Terms placeholder.",
    icon: Shield,
    stats: [
      { label: "Route", value: "OK" },
      { label: "Legal", value: "TBD" },
      { label: "Version", value: "V5" }
    ],
    successTitle: "Terms route ready",
    emptyTitle: "No terms content",
    errorTitle: "Terms unavailable"
  },
  privacyPolicy: {
    route: "/privacy-policy",
    title: "Privacy Policy",
    eyebrow: "Legal",
    description: "Privacy policy placeholder.",
    icon: Shield,
    stats: [
      { label: "Route", value: "OK" },
      { label: "Legal", value: "TBD" },
      { label: "Version", value: "V5" }
    ],
    successTitle: "Privacy route ready",
    emptyTitle: "No privacy content",
    errorTitle: "Privacy policy unavailable"
  },
  termsOfService: {
    route: "/terms-of-service",
    title: "Terms of Service",
    eyebrow: "Legal",
    description: "Terms of service placeholder.",
    icon: Shield,
    stats: [
      { label: "Route", value: "OK" },
      { label: "Legal", value: "TBD" },
      { label: "Version", value: "V5" }
    ],
    successTitle: "Terms route ready",
    emptyTitle: "No service terms content",
    errorTitle: "Terms of service unavailable"
  }
} satisfies Record<string, PageConfig>;
