# Golf Creator Tour App — Current Build UI Flow Specification

**Project:** Golf Creator Tour  
**Repo:** `christopherboyenger/golf-creator-tour`  
**Branch reviewed:** `main`  
**Generated:** May 9, 2026  
**Stack:** Next.js 15, React 19, Supabase, Stripe, Vercel  
**Build context:** V4 / V4.1 production app

---

## 1. Current Build Summary

The Golf Creator Tour app is an invite-only, member-gated web app for approved golf content creators.

Creators apply outside the app, are approved/admin-onboarded through Supabase, then sign in with their email and Tour Member Number. The app routes them through password activation, onboarding, social connection, and into the core dashboard.

The current dashboard is built around four bottom navigation tabs:

1. **Profile**
2. **Compete**
3. **Create**
4. **Connect**

The app also includes global header actions for notifications, messages, and the hamburger drawer.

---

## 2. Core User Access Model

### Invite-Only Membership

The current app does **not** support open public signup inside the app.

Current intended access path:

```text
Creator applies on external website
→ Admin approves creator
→ Admin links email to creator profile in Supabase
→ Admin creates Supabase Auth user
→ Creator signs in with email + member number
→ Creator sets new password
→ Creator completes onboarding
→ Creator enters dashboard
```

### Root Route

Route: `/`

| User State | Result |
|---|---|
| Authenticated user | Redirect to `/profile` |
| Unauthenticated user | Redirect to `/auth` |

---

## 3. Middleware / Route Protection

The middleware controls public/protected access and prevents users from bypassing required setup.

### Public Routes

```text
/auth
/api/auth/callback
/onboarding
/terms
/privacy-policy
/terms-of-service
/apply
/brands
```

### Middleware Rules

| Condition | Result |
|---|---|
| Logged-out user visits protected route | Redirect to `/auth` |
| Logged-in user has no linked creator profile | Allow only auth/public pages |
| Creator must reset password | Force `/auth` or `/auth/reset-password` |
| Creator is suspended, banned, pending, or invited | Redirect to `/auth` |
| Creator is active but onboarding is incomplete | Force `/onboarding` |
| Active creator visits `/auth` or `/auth/reset-password` | Redirect to `/profile` or `/onboarding` |
| Non-admin visits `/admin` | Redirect to `/profile` |
| `/apply` or `/brands` | Public funnel access |

---

## 4. Global Dashboard Layout

The authenticated dashboard uses a mobile-first app shell with a fixed bottom nav.

### Bottom Navigation

| Tab | Route | Purpose |
|---|---|---|
| Profile | `/profile` | Creator dashboard, social connections, sponsors, golf bag, challenges, matches |
| Compete | `/compete` | Leaderboard, ranks, activity feed, creator profiles |
| Create | `/create` | Brand challenges and admin challenge management |
| Connect | `/connect` | Creator discovery, match requests, active matches |

### Global Layout Behavior

| State | Behavior |
|---|---|
| Auth still resolving | Show dashboard skeleton |
| Signed out | Redirect to `/auth` |
| Inactive creator | Sign out or redirect based on status |
| Creator status fetch fails | Show connection error with Retry + Sign Out |
| Must reset password | Redirect to `/auth/reset-password` |
| Global celebration exists | Show achievement celebration overlay |

---

## 5. Global Header Flow

The shared header appears across the dashboard pages.

### Header Elements

| Element | Flow |
|---|---|
| GCT logo | Display-only, centered |
| Notifications bell | Opens notifications panel |
| Messages icon | Routes to `/messages` |
| Hamburger menu | Opens Settings Drawer |
| LIVE badge | Display-only when live/simulation state is active |

### Notifications Panel

| Action | Flow |
|---|---|
| Tap notifications bell | Open full-screen notifications panel |
| Panel loads | Fetch notifications for current creator |
| Notifications load | Mark notifications as read |
| Tap notification | Route based on notification type |
| Tap close X | Close panel and clear unread badge |
| Tap overlay | Close panel |

### Notification Routing

| Notification Type | Route |
|---|---|
| Match request / accepted / declined / completed | `/connect` |
| Challenge update / challenge completed / new challenge | `/create` |
| Achievement unlocked | `/profile` |
| Streak milestone | `/profile` |
| Follower milestone | `/profile` |
| Admin announcement | `/home` |
| System / unknown | No route unless configured |

### Messages Button

Current header behavior:

```text
Tap Messages icon
→ Clear messages badge
→ router.push('/messages')
```

**Current build note:** The header references `/messages`, but the route should be verified. If no `app/messages/page.tsx` exists, this button will create a dead-end route.

---

## 6. Hamburger / Settings Drawer Flow

The hamburger opens a right-side drawer.

### Drawer Menu Order

| Button | Flow |
|---|---|
| Upgrade Membership | Close drawer → open Upgrade Membership Sheet |
| GCO 2026 | Navigate to `/home` |
| How to Compete | Navigate to `/how-to-compete` |
| Referral Program | Navigate to `/referrals` |
| Settings | Navigate to `/settings` |
| Admin Dashboard | Admin-only → navigate to `/admin` |
| Log Out | Open logout confirmation |
| Yes, Log Out | Close drawer → sign out |
| Cancel | Cancel logout confirmation |
| X / Overlay | Close drawer |

---

## 7. Auth Page Flow

Route: `/auth`

The auth screen uses a globe splash experience and then displays a bottom auth card.

### Splash State

| Element | Flow |
|---|---|
| Globe animation | Visual splash |
| GCT logo | Visual brand mark |
| Tagline | Display-only |
| Season 2026 | Display-only |
| Enter Tour button | Opens auth card |
| Returning user state | Button displays “Welcome Back, [Name]” |

### Auth Card Tabs

The auth card has:

1. **Log In**
2. **Sign Up**

The Sign Up tab does not create an app account. It routes users to the external application funnel.

### Login Flow

| Field / Button | Flow |
|---|---|
| Email input | Required |
| Password input | Required |
| Show password toggle | Shows/hides password |
| Remember Me | Saves email/session preference locally |
| Enter key | Attempts login when email + password are present |
| Log In button | Calls Supabase sign-in |
| Missing email | Show “Please enter your email address” |
| Missing password | Show “Please enter your password” |
| Login error | Show returned auth error |
| Login fetch/server failure | Show server error |
| Success + must reset password | Route to `/auth/reset-password` |
| Success + active user | Route to `/profile` |

### Returning User Flow

| Button / State | Flow |
|---|---|
| Welcome Back CTA | Opens returning-user password step |
| Password field | Required |
| Sign In | Signs in with saved session email + entered password |
| Use different account | Clears returning flow and returns to normal login |
| Missing password | Show validation error |
| Session expired | Return to normal login |

### Sign Up Flow

| Button | Flow |
|---|---|
| Sign Up / Apply CTA | Open `https://golfcreatortour.com/join` in a new tab |
| Popup blocked | Fallback to current-window redirect |

---

## 8. Password Reset / Account Activation Flow

Route: `/auth/reset-password`

This route is used for first login activation after the creator signs in with their temporary member-number password.

### Password Reset Screen

| Field / Button | Flow |
|---|---|
| New Password | Required, minimum 8 characters |
| Confirm Password | Must match New Password |
| Password strength meter | Displays Weak / Fair / Good / Strong |
| Set Password & Activate | Validates password and calls reset function |
| Sign out and go back | Signs user out |

### Validation Rules

| Rule | Behavior |
|---|---|
| New password under 8 characters | Show error |
| Passwords do not match | Show error |
| Password starts with `GCT-` | Block; cannot use member number |
| Reset API returns error | Show error |
| Reset succeeds | Show Account Activated success state |
| Success complete | Route to `/onboarding` |

### Success State

```text
Account Activated
→ “Let's get you set up…”
→ route to /onboarding
```

---

## 9. First-Time Onboarding Flow

Route: `/onboarding`

Onboarding is displayed after account activation and before dashboard access.

### Current Onboarding Steps

```text
Welcome
→ Location
→ Socials
→ Finish
→ /profile
```

There is also a password gate inside onboarding if the creator still has `must_reset_password = true`.

### Onboarding Password Step

| Field / Button | Flow |
|---|---|
| New password | Required |
| Confirm password | Required |
| Show/hide icons | Toggle password visibility |
| Submit | Calls `/api/auth/reset-password` |
| Success | Advance to Welcome step |

### Password Requirements

| Requirement | Required |
|---|---|
| 8+ characters | Yes |
| Lowercase letter | Yes |
| Uppercase letter | Yes |
| Number | Yes |
| Confirmation match | Yes |

### Welcome Step

| Button | Flow |
|---|---|
| Continue / Get Started | Advance to Location |

Recommended copy:

```text
Welcome, [First Name].
Let's get you started.
```

### Location Step

| Button / State | Flow |
|---|---|
| Allow Location | Request geolocation permission |
| Location granted | Reverse geocode coordinates |
| Location saved | Save state/city to creator profile |
| Location denied | Show denied state |
| Skip | Advance to Socials |
| Continue | Advance to Socials |

Current geocoding source:

```text
Nominatim OpenStreetMap reverse geocoding
```

### Socials Step

| Button | Flow |
|---|---|
| Connect Instagram | Open connect-handle sheet |
| Connect TikTok | Open connect-handle sheet |
| Connect YouTube | Open connect-handle sheet |
| Verify platform | Calls `/api/social/connect-handle` |
| Verification success | Save connection, follower count, points |
| Verification failure | Show error |
| Cancel | Close connect sheet |
| Finish | Save onboarding completion and route to `/profile` |

### Social Requirement

Current logic tracks whether any platform is connected.

Recommended enforcement:

```text
User must connect at least one platform before finishing onboarding.
```

### Onboarding Completion

| Action | Flow |
|---|---|
| Finish onboarding | Update `onboarding_completed = true` in Supabase |
| DB update succeeds | Save local tutorial flags and route to `/profile` |
| DB update fails | Show error and do not route forward |

---

## 10. Profile Page Flow

Route: `/profile`

The Profile page is the creator’s home dashboard.

### Profile Page Internal Tabs

| Tab | Purpose |
|---|---|
| Overview | Tour card, snapshot, active challenges, sponsors, golf bag, matches |
| Social | Connect and sync social media accounts |
| Badges | Achievements and milestones |

### Profile Header Actions

| Button | Flow |
|---|---|
| Avatar | Open Avatar Sheet |
| Notifications | Open notifications panel |
| Messages | Route to `/messages` |
| Hamburger | Open Settings Drawer |

### Avatar Flow

| Action | Flow |
|---|---|
| Tap avatar | Open avatar sheet |
| Select/upload image | Upload avatar file |
| Save avatar | Update creator avatar |
| Close | Dismiss sheet |

### Overview Tab Flow

#### Location

| Button / Field | Flow |
|---|---|
| Edit location | Enable location editing |
| Country dropdown | Select country |
| State dropdown | Select state |
| City input | Enter city |
| Save location | Update Supabase creator profile |
| Save error | Show error toast |
| Save success | Refetch profile |

#### Tour Card

| Element | Flow |
|---|---|
| Tour Card display | Shows member card / qualification status |
| Tour Card deadline | Pulled from active season if configured |

#### Active Challenges

| Button | Flow |
|---|---|
| Submit Challenge | Open submission form |
| Submission URL | Required |
| Submission Notes | Optional |
| Submit | Validate URL → call `submitChallenge` |
| Success | Refetch profile, close form, show success/haptic |
| Error | Show error toast |
| Drop Challenge | Call `dropChallenge` |
| Drop success | Refetch profile |
| Drop error | Show error toast |

#### Accepted Matches

| Button | Flow |
|---|---|
| Chat | Open Match Chat Sheet |
| Submit Match Score | Open match score submission |
| Upload scorecard | Required proof |
| Optional video link | Adds additional proof URL |
| Submit Score | Upload scorecard → call `submitMatchScore` |
| Submit success | Refresh accepted matches |
| Submit error | Show error |

#### Sponsors

| Button / Field | Flow |
|---|---|
| Add Sponsor | Open sponsor modal |
| Sponsor name | Required |
| Website | Optional |
| Note | Optional |
| Category | Required |
| Logo URL | Optional |
| Save Sponsor | Add sponsor to Supabase |
| Sponsor Search | Filter sponsors |
| Category Filter | Filter by category |
| Sponsor Filter | Filter by sponsor name |
| Sponsor card | Open sponsor detail |
| Delete Sponsor | Delete sponsor from Supabase |

#### Golf Bag

| Button / Field | Flow |
|---|---|
| Edit Golf Bag | Enable editing |
| Add Club | Open club form |
| Club Type | Required |
| Brand | Optional |
| Model | Optional |
| Save Club | Save golf bag item |
| Delete Club | Delete golf bag item |
| Club card | Open item details |

### Social Tab Flow

| Button | Flow |
|---|---|
| Connect Instagram | Open connect-handle sheet |
| Connect TikTok | Open connect-handle sheet |
| Connect YouTube | Open connect-handle sheet |
| Verify platform | Calls `/api/social/connect-handle` |
| Success | Save connection, show points celebration |
| Error | Show error |
| Sync Socials | Calls `/api/social/scrape-sync` |
| Sync success | Show synced platforms and points awarded |
| Sync failure | Show error toast |

### Social OAuth / Query Return Handling

The Profile page handles query params including:

```text
?tab=social
?connected=instagram|tiktok|youtube
?followers=...
?pts=...
?error=...
?upgrade=success
?upgrade=cancelled
```

### Badges Tab Flow

| Element | Flow |
|---|---|
| Badges tab | Shows achievements/badges |
| Milestone celebration | Can appear after social connection or point milestone |

Current note:

```text
If badges are intended to be clickable, define badge-detail modal behavior.
If not, keep badges read-only.
```

---

## 11. Compete Page Flow

Route: `/compete`

The Compete page is the leaderboard and competitive ranking hub.

### Main Sections

| Section | Purpose |
|---|---|
| Hero stats | Your rank, points, visible creator count |
| Exempt podium | Top exempt creators |
| Activity feed | Recent leaderboard/points activity |
| Leaderboard list | Ranked creators |
| Sticky rank pill | Current user rank while scrolling |
| Full leaderboard sheet | Expanded leaderboard view |

### Hero / Filters

| Control | Flow |
|---|---|
| Search input | Filter leaderboard by creator name or handle |
| Country filter | Filter by country |
| Gender filter | Filter by gender |
| Filter toggle | Show/hide filters |
| Clear filters | Reset filters |

### Activity Feed

| Button | Flow |
|---|---|
| View all | Expand activity feed |
| Collapse | Collapse feed |

### Leaderboard

| Element | Flow |
|---|---|
| Podium creator | Open Creator Profile Sheet |
| Leaderboard row | Open Creator Profile Sheet |
| Full Leaderboard button | Open expanded leaderboard |
| Expanded row | Close sheet → open Creator Profile Sheet |
| Close expanded leaderboard | Close sheet |

### Ranking Logic

| Logic | Behavior |
|---|---|
| Exempt creators | Separated from regular leaderboard |
| Tied ranks | Display as `T#` |
| Zero-point creators | Show rank as `—` |
| Current user row | Highlighted |
| Rank movement | Shows up/down movement |

---

## 12. Creator Profile Sheet Flow

The Creator Profile Sheet is shared by Compete and Connect.

### Sheet Entry Points

| Source | Trigger |
|---|---|
| Compete podium | Tap creator |
| Compete leaderboard row | Tap creator |
| Expanded leaderboard row | Tap creator |
| Connect creator card | Tap creator |
| Deep link | `/connect?challenge=<creatorId>` |

### Sheet Header

| Button / Element | Flow |
|---|---|
| Back arrow | Close sheet |
| X button | Close sheet |
| Avatar/name/handle | Display-only |
| Rank/points/followers/status | Display-only |

### Sheet Sections

| Section | Flow |
|---|---|
| Tour Card Qualified | Tap to open tour card modal/details |
| Sponsors | Sponsor links open externally if website exists |
| Golf Bag | Tap club item to open item details |
| Creator Snapshot | Shows creator score/followers/challenges/points data |
| Social Links | Open creator social profiles externally |
| Rival / nearby creators | Can open another Creator Profile Sheet if enabled |
| Head-to-head | Shows record if available |

### Sheet Action Buttons

| Button | Flow |
|---|---|
| Challenge | Start challenge creator flow |
| Message | Open message/chat flow if accepted match exists |
| Submit Match | Open submit score flow if accepted match exists |
| Close | Dismiss sheet |

---

## 13. Create Page Flow

Route: `/create`

The Create page is the Brand Challenges hub.

### Challenge Filters

| Filter | Flow |
|---|---|
| All | Show all visible challenges |
| Standard | Show Standard tier challenges |
| Premium | Show Premium tier challenges |
| Elite | Show Elite tier challenges |
| GCT | Show GCT/platform challenges |
| Submitted | Show submitted challenges |

### Challenge Loading

| State | Flow |
|---|---|
| Regular creator | Load available/open challenges |
| Admin | Load all challenges |
| Profile loaded | Load challenge participations |
| Realtime change | Insert/update/delete challenge in UI |

### Challenge Card Flow

| Action | Flow |
|---|---|
| Tap challenge card | Open Challenge Detail Sheet |
| Challenge already joined | Detail sheet shows Submit + Drop |
| Challenge submitted | Detail sheet shows Submitted state |
| Challenge gated by tier | Detail sheet shows Upgrade CTA |
| Challenge closed/not open | Detail sheet shows Coming Soon or disabled state |

---

## 14. Challenge Detail Sheet Flow

### Detail Sheet Content

| Section | Purpose |
|---|---|
| Tier badge | Standard/Premium/Elite/GCT |
| Points | Points awarded |
| Brand logo/name | Brand identity |
| Description | Challenge description |
| Participants | Shows joined creators |
| Spots | Shows spots left / filled percent |
| Deadline | Shows deadline or TBD |
| Requirements | Checklist style requirements |
| CTA area | Join, Submit, Drop, Upgrade, Submitted, or Coming Soon |

### Join Flow

| Button | Flow |
|---|---|
| Join Challenge | Calls enroll function |
| Success | Show “You’re In!” celebration |
| Error | Show join error |

### Submit Flow

| Button / Field | Flow |
|---|---|
| Submit Challenge | Open submit form |
| Submission URL | Required |
| Notes | Optional |
| Submit | Validate URL → call submit function |
| Success | Close form/detail and show confirmation |
| Error | Show submit error |

### Drop Flow

| Button | Flow |
|---|---|
| Drop Challenge | Show confirmation |
| Yes, Drop | Calls drop function |
| Cancel | Cancel drop confirmation |
| Error | Show drop error |

### Upgrade Flow

| Button | Flow |
|---|---|
| Upgrade to Premium/Elite | Open Upgrade Membership Sheet |

---

## 15. Admin Challenge Management Flow

Admin challenge management lives inside the Create page.

### Admin Form Entry Points

| Button | Flow |
|---|---|
| Create Challenge | Open empty Admin Challenge Form |
| Edit Challenge | Open populated Admin Challenge Form |

### Admin Challenge Form Fields

| Field | Requirement |
|---|---|
| Brand Logo | Optional image upload |
| Title | Required |
| Brand | Required |
| Description | Optional |
| Tier | Required |
| Points | Required |
| Max Slots | Optional |
| Duration | Optional |
| Status | Open / Active / Completed |
| Brand Color | Optional |
| Requirements | Optional list |

### Admin Form Buttons

| Button | Flow |
|---|---|
| Add Requirement | Add requirement to form |
| Remove Requirement | Remove requirement |
| Create Challenge | Create challenge |
| Save Changes | Update challenge |
| Delete Challenge | Show confirmation |
| Confirm Delete | Delete challenge |
| Cancel | Cancel delete confirmation |
| X / overlay | Close form |

---

## 16. Connect Page Flow

Route: `/connect`

The Connect page is the creator discovery and match hub.

### Connect Tabs

| Tab | Purpose |
|---|---|
| Browse | Browse creators by location and challenge them |
| Requests | Incoming match requests |
| Matches | Accepted/active matches |
| Sent | Outgoing match requests |

### Hero Stats

| Element | Flow |
|---|---|
| Nearby count | Display nearby creators |
| Sent count | Tap to switch to Sent tab |
| Requests count | Shows pending request count/badge |

---

## 17. Connect — Browse Tab Flow

### Location Filters

| Control | Flow |
|---|---|
| Country dropdown | Select country |
| Region dropdown | Select region/state |
| Country change | Reset region to All |
| Sort dropdown | Sort creators |
| Tap outside | Close open dropdowns |

### Sort Options

| Sort | Behavior |
|---|---|
| Name | A-Z |
| Followers | Highest followers first |
| Handicap | Lowest handicap first |
| Rank | Best rank first |

### Missing Location State

| Button | Flow |
|---|---|
| Go to Profile | Route to `/profile` so user can set location |

### Creator Cards

| Action | Flow |
|---|---|
| Tap creator card | Open Creator Profile Sheet |
| Challenge creator | Open challenge match flow |
| View profile | Open profile sheet |

---

## 18. Connect — Challenge Creator Flow

### Challenge Sheet

| Field / Button | Flow |
|---|---|
| Select match type | Required |
| Send Challenge | Calls `sendMatchChallenge` |
| Send success | Show sent state, increment sent count, refresh sent requests |
| Send error | Show error |
| Auto close | Sheet closes after success delay |

### Deep Link Support

The page supports:

```text
/connect?challenge=<creatorId>
```

Flow:

```text
Load ranked creators
→ Find target creator
→ Open Creator Profile Sheet
→ Strip query param
```

---

## 19. Connect — Requests Tab Flow

### Incoming Requests

| Button | Flow |
|---|---|
| Accept | Calls `respondToMatch(..., true)` |
| Accept success | Remove request, load accepted matches, show toast, switch to Matches tab |
| Decline | Calls `respondToMatch(..., false)` |
| Decline success | Remove request, show toast |
| Error | Show error toast |

---

## 20. Connect — Matches Tab Flow

### Accepted Matches

| Button | Flow |
|---|---|
| Chat / Message | Open Match Chat Sheet |
| Submit Score | Open score submission |
| Upload scorecard | Required |
| Add video link | Optional |
| Challenger holes | Score field |
| Opponent holes | Score field |
| Submit | Upload proof → submit score |
| Success | Refresh accepted matches |
| Upload error | Show upload error |
| Submit error | Show submit error |

---

## 21. Connect — Sent Tab Flow

### Sent Requests

| State | Behavior |
|---|---|
| Sent requests | Display outgoing match challenges |
| Pending sent request | Read-only in currently visible flow |

Recommended addition:

```text
Add “Cancel Request” for stale match requests.
```

---

## 22. Upgrade Membership Sheet Flow

The Upgrade Membership Sheet opens from:

1. Hamburger Drawer → Upgrade Membership
2. Locked Premium/Elite challenge → Upgrade CTA

### Billing Toggle

| Button | Flow |
|---|---|
| Monthly | Show monthly pricing |
| Annual | Show annual pricing and savings badge |

### Plans

| Plan | Current Display |
|---|---|
| Standard | Free |
| Premium | $20/month or $100/year |
| Elite | $40/month or $200/year |
| Founding Member | Limited 1 of 100 Elite Annual positioning |

### Upgrade Buttons

| Button | Flow |
|---|---|
| Upgrade to Premium | Calls `/api/checkout` with Premium Stripe price |
| Upgrade to Elite | Calls `/api/checkout` with Elite Stripe price |
| Stripe returns URL | Redirect browser to Stripe Checkout |
| Missing Stripe config | Show Stripe configuration error |
| Request timeout | Unlock buttons and show timeout error |
| Checkout error | Show connection/start checkout error |
| Current Plan | Display-only disabled state |
| Close X / overlay | Close sheet |

### Native iOS Handling

If running as native iOS through Capacitor:

```text
Do not show Stripe checkout button.
Show iOS subscription instruction text instead.
```

---

## 23. Current Build Route Inventory

### Confirmed Core Routes

```text
/
/auth
/auth/reset-password
/onboarding
/profile
/compete
/create
/connect
```

### Referenced Routes To Verify

These routes are referenced by navigation/menu/header logic and should be confirmed in the app directory:

```text
/messages
/home
/how-to-compete
/referrals
/settings
/admin
/apply
/brands
/terms
/privacy-policy
/terms-of-service
```

---

## 24. Current Build Data / API Touchpoints

### Supabase Areas Used

| Area | Usage |
|---|---|
| Auth | Sign-in, session management, password reset |
| Creators table | Profile, status, location, onboarding, role |
| Social connections | Connected platforms, handles, followers |
| Challenges | Brand challenge data |
| Challenge participations | Enrollments/submissions |
| Matches | Creator match requests and results |
| Match messages | Match chat and unread message count |
| Notifications | Notification panel and badges |
| Creator sponsors | Sponsor cards on profile |
| Golf bag | WITB / creator equipment |
| Avatar storage | Profile images |

### API Routes Referenced

```text
/api/auth/callback
/api/auth/reset-password
/api/auth/status
/api/checkout
/api/webhooks/stripe
/api/social/connect-handle
/api/social/scrape-sync
/api/social/application-handles
```

---

## 25. Current Build UX Gaps / Fix List

### Priority 1 — Must Fix

#### 1. Verify `/messages`

The header routes users to `/messages`.

If no messages page exists, create it or update the route.

```text
Tap Messages icon
→ /messages
→ must render valid screen
```

#### 2. Clean Up Activation / Onboarding Flow

Current build contains both:

```text
/auth/reset-password
/onboarding password gate
```

Recommended clean path:

```text
Login with member number
→ Set new password
→ Welcome
→ Allow location
→ Connect social
→ Points celebration
→ Profile
```

#### 3. Make Social Connection Requirement Obvious

Current social onboarding should clearly state:

```text
Connect at least one social platform to continue.
```

Do not bury this in button disabled states.

### Priority 2 — Strong UX Improvements

#### 4. Add Cancel Request To Sent Matches

Creators will expect to cancel stale match requests.

Recommended flow:

```text
Sent tab
→ Tap pending request
→ Cancel Request
→ Confirm
→ Request removed
```

#### 5. Define Badge Click Behavior

Current Badges tab needs a clear decision:

```text
Option A: Read-only badge grid
Option B: Click badge → badge detail sheet
```

#### 6. Add Empty States Everywhere

Each major section should have a useful empty state:

```text
No active challenges
No sponsors yet
No golf bag items
No matches yet
No requests yet
No creators found nearby
No submitted challenges
No notifications
```

---

## 26. Recommended Master User Flow

```text
External website application
→ Admin approval
→ Supabase onboarding
→ Creator receives login credentials
→ Creator signs into app
→ Password reset activation
→ Welcome screen
→ Allow location
→ Connect at least one social platform
→ Follower/points celebration
→ Profile dashboard
→ Compete / Create / Connect loops
```

---

## 27. Product Positioning In-App

The current app should communicate this simple loop everywhere:

```text
Connect your socials.
Complete brand challenges.
Play creator matches.
Earn Tour Points.
Climb the leaderboard.
Qualify for the Golf Creator Open.
```

That is the whole app. Everything else is decoration. Good decoration, but decoration.

---

## 28. Current Build Flow Map

```text
/
├── if authenticated → /profile
└── if unauthenticated → /auth

/auth
├── Enter Tour
├── Log In
│   ├── success + must reset → /auth/reset-password
│   └── success + active → /profile or /onboarding via middleware
└── Sign Up → external /join page

/auth/reset-password
├── set new password
├── success
└── /onboarding

/onboarding
├── welcome
├── location
├── connect socials
└── /profile

/dashboard shell
├── Profile → /profile
├── Compete → /compete
├── Create → /create
└── Connect → /connect

/profile
├── Overview
│   ├── tour card
│   ├── active challenges
│   ├── matches
│   ├── sponsors
│   └── golf bag
├── Social
│   ├── connect Instagram
│   ├── connect TikTok
│   ├── connect YouTube
│   └── sync socials
└── Badges

/compete
├── leaderboard
├── podium
├── activity feed
├── filters
├── expanded leaderboard
└── creator profile sheet

/create
├── challenge filters
├── challenge cards
├── challenge detail sheet
├── join challenge
├── submit challenge
├── drop challenge
├── upgrade membership
└── admin challenge CRUD

/connect
├── Browse
│   ├── country filter
│   ├── region filter
│   ├── sort
│   ├── creator profile sheet
│   └── send match challenge
├── Requests
│   ├── accept
│   └── decline
├── Matches
│   ├── chat
│   └── submit score
└── Sent
    └── view sent requests

Global
├── notifications panel
├── messages button
├── hamburger drawer
├── upgrade sheet
└── achievement / milestone celebrations
```

---

## 29. Build Status Assessment

### What Is Strong

- Clear four-tab app structure
- Strong invite-only positioning
- Good authentication gating
- Premium mobile-first design
- Real-time challenge updates
- Social connection and point celebration flow
- Challenge join/submit/drop lifecycle
- Match request and score submission logic
- Sponsor and golf bag profile depth
- Admin challenge CRUD inside Create page

### What Needs Tightening

- Confirm `/messages` route
- Make first-time activation path feel like one flow
- Make onboarding social requirement obvious
- Add cancel action for sent match requests
- Define badge-detail behavior
- Strengthen empty states
- Verify all drawer routes exist

---

## 30. Developer Handoff Notes

### Do Not Change

- Four bottom tabs
- Invite-only sign-in model
- Premium dark theme
- Dashboard shell structure
- Creator Profile Sheet as shared discovery surface
- Challenge Detail Sheet as main challenge CTA surface
- Upgrade Membership Sheet pattern
- Onboarding after activation

### Clean Up First

1. Route verification
2. Dead button checks
3. Empty state consistency
4. Onboarding copy
5. Sent request cancellation
6. Messages page completion

---

## 31. Recommended Immediate Next Prompt For Claude

```md
Review the current Golf Creator Tour app routes and UI components.

Goal:
Clean up the current build without changing the core design.

Tasks:
1. Verify every route referenced by navigation exists:
   - /messages
   - /home
   - /how-to-compete
   - /referrals
   - /settings
   - /admin

2. If /messages does not exist, create a mobile-first Messages page that matches the current app design and uses existing match_messages / matches data.

3. Tighten onboarding copy:
   - Welcome [First Name], let's get you started.
   - Allow Location.
   - Connect Social Media.
   - Require at least one connected platform before Finish is enabled.
   - Show clear helper text: "Connect at least one platform to continue."

4. Add Cancel Request flow to the Connect → Sent tab:
   - Tap sent request.
   - Show cancel confirmation.
   - Cancel request in Supabase.
   - Refresh sent requests.
   - Show success/error toast.

5. Add consistent empty states for:
   - No active challenges.
   - No sponsors.
   - No golf bag.
   - No matches.
   - No sent requests.
   - No incoming requests.
   - No nearby creators.
   - No notifications.

6. Do not redesign the app.
7. Keep all styling aligned with the current GCT dark premium theme.
8. Preserve current Supabase query patterns and auth guards.
```

---

# End of Current Build Spec
