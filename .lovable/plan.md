
Issue understood: signup likely succeeded after the trigger fix, but the app still has a fragile login/session restore flow. The main problem is not the credentials themselves anymore; it is that the app depends only on `onAuthStateChange` and immediately runs protected profile/packet queries inside that callback. On a fresh reopen or later login, the auth client can emit an initial event before the stored session is fully ready, so the app queries too early, gets incomplete auth context, and can end up stuck, blank, or behave as if login failed.

What I found
- `src/context/AppContext.tsx` subscribes to auth changes but never restores the initial session with `getSession()`.
- The same file immediately queries `profiles` and packet membership from inside the auth callback.
- `AppShell` blocks the app behind `loading`, `user`, and `onboarded`, so if auth/profile/packet hydration is out of order the user gets stuck in onboarding or a blank/loading state.
- The backend trigger/function now looks corrected in the schema context, so this appears to be a frontend auth-readiness bug layered on top of the earlier signup bug.

Implementation plan
1. Add an auth-ready initialization flow
- Update `AppContext` so it:
  - subscribes to auth state changes
  - separately calls `supabase.auth.getSession()` on mount
  - tracks an `authReady` flag
- Do not treat the app as ready until the initial session restore finishes.

2. Move post-login data loading out of the raw auth callback
- Create a small internal `hydrateUserState(user)` flow in `AppContext` that:
  - fetches the profile
  - fetches packets
  - updates `onboarded` only after packet results are known
  - handles failures gracefully instead of leaving the app half-loaded
- Keep the auth callback lightweight: just update the user/session state and trigger hydration.

3. Protect against race conditions and false onboarding resets
- Prevent `fetchPackets` from marking users as “not onboarded” until auth is truly ready.
- Ensure sign-out fully clears profile, packet, and loading state.
- Make sure later sign-ins and page refreshes follow the same path as first login.

4. Improve login/signup UX feedback
- In `OnboardingFlow`, keep the success/error handling but make the post-auth transition depend on hydrated app state instead of assuming the session is instantly usable.
- If credentials are actually invalid, continue showing the auth error toast.
- If auth succeeds but data is still loading, show a proper loading state instead of returning the user to a misleading screen.

5. Validate role/dashboard access after hydration
- Keep `DashboardShell` gated by `profile.role`, but only after profile loading is complete.
- This avoids professional/admin users briefly hitting restricted states before their profile arrives.

Technical details
```text
Current risky sequence:
sign in -> auth callback fires -> profile query + packet query immediately ->
session token may not be fully restored yet -> protected reads can fail or return empty ->
UI decides user is not onboarded / not ready

Target sequence:
app mount ->
subscribe to auth changes ->
restore session with getSession() ->
set authReady=true ->
if user exists, hydrate profile + packets ->
render app only after hydration finishes
```

Files to update
- `src/context/AppContext.tsx` — main fix
- `src/components/onboarding/OnboardingFlow.tsx` — smoother auth transition/loading behavior
- `src/components/layout/AppShell.tsx` — respect auth readiness/hydration state
- optionally `src/components/dashboard/DashboardShell.tsx` — avoid premature restricted rendering while profile is loading

Expected outcome
- A user can sign up, close/reopen, and log in again reliably.
- Returning users no longer get stuck in a white screen, loading loop, or accidental onboarding fallback caused by auth timing.
- Professional/admin access remains intact once profile hydration completes.
