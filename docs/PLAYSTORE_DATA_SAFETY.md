# MixMate Play Store Compliance Checklist

Use this checklist when filling Google Play Console.

## 1) Privacy Policy URL

1. Host `docs/PRIVACY_POLICY.md` publicly (GitHub Pages, Google Sites, Notion public page, etc.).
2. Copy public URL.
3. In Play Console: `App content` -> `Privacy policy` -> paste URL.

## 2) Data Safety Form (Current MixMate Behavior with Ads Enabled)

Play Console: `App content` -> `Data safety`

- Does your app collect or share any user data? -> **Yes** (through ad SDK behavior)
- Data collected (typical ad stack): -> **Device or other IDs**, **App interactions**, optionally **Approximate location**
- Is data shared with third parties? -> **Yes** (ad partners)
- Is all app data processed only on device? -> **No**
- Is data encrypted in transit? -> **Yes** (as provided by ad SDK/network transport)
- Can users request data deletion? -> **Not applicable for local-only app data; third-party ad data governed by provider controls**

## 3) Internal Reality Check (must stay true)

Current policy now assumes:

- No login/account
- Ads SDK may be present
- No remote API storing user data
- Favorites/history/preferences are local-only

If you later add analytics, sign-in, cloud sync, or additional SDKs, update both:

1. `docs/PRIVACY_POLICY.md`
2. Play Console Data Safety answers
