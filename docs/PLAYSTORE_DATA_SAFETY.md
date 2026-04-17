# MixMate Play Store Compliance Checklist

Use this checklist when filling Google Play Console.

## 1) Privacy Policy URL

1. Host `docs/PRIVACY_POLICY.md` publicly (GitHub Pages, Google Sites, Notion public page, etc.).
2. Copy public URL.
3. In Play Console: `App content` -> `Privacy policy` -> paste URL.

## 2) Data Safety Form (Current MixMate Behavior)

Play Console: `App content` -> `Data safety`

- Does your app collect or share any user data? -> **No**
- Is all app data processed only on device? -> **Yes**
- Is data encrypted in transit? -> **Not applicable (no transmitted data)**
- Can users request data deletion? -> **Not applicable (no server-side account data)**

## 3) Internal Reality Check (must stay true)

Current policy assumes all below are true:

- No login/account
- No analytics SDK
- No ads SDK
- No remote API storing user data
- Favorites/history/preferences are local-only

If you later add ads, analytics, sign-in, or cloud sync, update both:

1. `docs/PRIVACY_POLICY.md`
2. Play Console Data Safety answers
