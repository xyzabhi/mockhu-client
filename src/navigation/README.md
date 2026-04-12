# Navigation — high-level guide

This app uses **React Navigation** with a **root stack** and a **nested auth stack**. Types live in one place so new screens stay consistent as the app grows.

## Big picture

```
App.tsx
  └── SafeAreaProvider / SafeAreaView
        └── RootNavigator (NavigationContainer)
              ├── Auth          → AuthNavigator (nested stack)
              ├── Onboarding    → OnboardingCompletionScreen (+ onFinish → PostOnboardingSuggestions)
              ├── PostOnboardingSuggestions → tips + Skip / Continue → Main
              └── Main          → MainTabNavigator (tabs)
```

- **Auth**: sign up / login entry, email OTP flows, Google Sign-In.
- **Onboarding**: three-step flow (full name → split into first/last, exam multi-select, target year) → `POST /api/v1/onboarding`.
- **Main**: tab shell (home, progress, post, inbox, profile).

The **first screen** users see is **`Auth`** (stack starts at **Sign up**).

## Folder layout

| File / folder | Purpose |
|---------------|---------|
| `types.ts` | `RootStackParamList`, `AuthStackParamList` — **add new route names and params here first** |
| `navigationRef.ts` | Root `navigationRef` + `resetToRoute()` for jumping between root flows without prop drilling |
| `RootNavigator.tsx` | `NavigationContainer`, root stack: Auth / Onboarding / Main / … |
| `AuthNavigator.tsx` | Nested stack + thin wrappers that connect your feature screens to navigation |
| `MainTabNavigator.tsx` | Signed-in tab navigator |
| `index.ts` | Re-exports for clean imports (e.g. `import { RootNavigator } from './src/navigation'`) |

## How users move between flows

1. **After any auth that returns tokens** (email login/signup, Google, etc.)  
   Tokens and `user` (including `is_onboarded`) are persisted, then **`resetToRootAfterAuth()`** runs: **`Main`** if `user.is_onboarded === true`, else **`Onboarding`**.  
   That **replaces** the navigation state so the user isn’t stuck “under” the auth stack.

2. **After onboarding “Finish”**  
   `OnboardingCompletionScreen` calls **`onFinish`** → **`resetToRoute('PostOnboardingSuggestions')`**. Skip or Continue → **`resetToRoute('Main')`**.

3. **Inside auth only**  
   Sign up ↔ Login, Email, Verify use normal **`navigate`** / **`goBack`** on the **auth** stack (see `AuthNavigator.tsx`).

## Extending safely

1. **New auth screen**  
   - Add a route + params in `AuthStackParamList` (`types.ts`).  
   - Add a `<Stack.Screen />` in `AuthNavigator.tsx`.  
   - Prefer a small wrapper component that passes `navigation` / `route` into your dumb UI screen.

2. **New root-level area** (e.g. “Modal”, “Deep link landing”)  
   - Add to `RootStackParamList` and `RootNavigator.tsx`.  
   - Use `resetToRoute` or `navigationRef.navigate` when switching major phases.

3. **Real home app**  
   - Evolve `MainTabNavigator` (tabs, stacks, modals) as the signed-in shell grows.

## Imports from the app

```ts
import { RootNavigator, resetToRoute, navigationRef } from './src/navigation';
```

- **`RootNavigator`**: mount once under `App` (already wired in `App.tsx`).
- **`resetToRoute('Main' | 'Onboarding' | 'Auth')`**: use when a flow completes and you want a clean stack (auth finished, onboarding finished, sign-out, etc.).
- **`navigationRef`**: advanced use (dispatch from outside React components, tests); prefer typed navigators in UI when possible.

## Relation to feature folders

- **`src/features/auth/…`**: UI + logic; **does not** own the navigator — `AuthNavigator` wires them in.
- **`src/features/onboarding/…`**: `OnboardingCompletionScreen` is mounted from **`RootNavigator`** with **`onFinish`** → **`PostOnboardingSuggestions`** then **Main**.

This keeps **navigation structure** in `src/navigation/` and **screens** in feature modules, which scales as you add modules.
