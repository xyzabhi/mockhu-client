# Navigation — high-level guide

This app uses **React Navigation** with a **root stack** and a **nested auth stack**. Types live in one place so new screens stay consistent as the app grows.

## Big picture

```
App.tsx
  └── SafeAreaProvider / SafeAreaView
        └── RootNavigator (NavigationContainer)
              ├── Auth          → AuthNavigator (nested stack)
              ├── Onboarding    → OnboardingLayout (+ onFinish → Home)
              └── Home          → HomeScreen (dummy; replace with tabs later)
```

- **Auth**: sign up / login entry, phone & email flows, phone verification.
- **Onboarding**: multi-step wizard (optional; not the default after login today).
- **Home**: placeholder for the signed-in app (tabs, feed, etc.).

The **first screen** users see is **`Auth`** (stack starts at **Sign up**).

## Folder layout

| File / folder | Purpose |
|---------------|---------|
| `types.ts` | `RootStackParamList`, `AuthStackParamList` — **add new route names and params here first** |
| `navigationRef.ts` | Root `navigationRef` + `resetToRoute()` for jumping between root flows without prop drilling |
| `RootNavigator.tsx` | `NavigationContainer`, root stack: Auth / Onboarding / Home |
| `AuthNavigator.tsx` | Nested stack + thin wrappers that connect your feature screens to navigation |
| `screens/HomeScreen.tsx` | Dummy home until you build real signed-in navigation |
| `index.ts` | Re-exports for clean imports (e.g. `import { RootNavigator } from './src/navigation'`) |

## How users move between flows

1. **After any auth that returns tokens** (email login/signup, phone verify, etc.)  
   Tokens and `user` (including `is_onboarded`) are persisted, then **`resetToRootAfterAuth()`** runs: **`Home`** if `user.is_onboarded === true`, else **`Onboarding`**.  
   That **replaces** the navigation state so the user isn’t stuck “under” the auth stack.

2. **After onboarding “Finish”**  
   `OnboardingLayout` calls **`onFinish`** → **`resetToRoute('Home')`**.

3. **Inside auth only**  
   Sign up ↔ Login, Phone, Email, Verify use normal **`navigate`** / **`goBack`** on the **auth** stack (see `AuthNavigator.tsx`).

## Extending safely

1. **New auth screen**  
   - Add a route + params in `AuthStackParamList` (`types.ts`).  
   - Add a `<Stack.Screen />` in `AuthNavigator.tsx`.  
   - Prefer a small wrapper component that passes `navigation` / `route` into your dumb UI screen.

2. **New root-level area** (e.g. “Modal”, “Deep link landing”)  
   - Add to `RootStackParamList` and `RootNavigator.tsx`.  
   - Use `resetToRoute` or `navigationRef.navigate` when switching major phases.

3. **Real home app**  
   - Replace `HomeScreen` with a **tab** or **drawer** navigator (new file under `navigation/`), then set `RootNavigator`’s `Home` screen to that component.

## Imports from the app

```ts
import { RootNavigator, resetToRoute, navigationRef } from './src/navigation';
```

- **`RootNavigator`**: mount once under `App` (already wired in `App.tsx`).
- **`resetToRoute('Home' | 'Onboarding' | 'Auth')`**: use when a flow completes and you want a clean stack (auth finished, onboarding finished, sign-out, etc.).
- **`navigationRef`**: advanced use (dispatch from outside React components, tests); prefer typed navigators in UI when possible.

## Relation to feature folders

- **`src/features/auth/…`**: UI + logic; **does not** own the navigator — `AuthNavigator` wires them in.
- **`src/features/onboarding/…`**: Same; `OnboardingLayout` is a **screen** on the root stack and receives **`onFinish`** from `RootNavigator`.

This keeps **navigation structure** in `src/navigation/` and **screens** in feature modules, which scales as you add modules.
