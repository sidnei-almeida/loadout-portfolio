# App Store Reviewer Notes

> Copy-paste the text below into the "Notes to Reviewer" field in App Store Connect (Apple) or the internal testing notes in Google Play Console.

---

Dear Reviewer,

Thank you for reviewing Loadout Portfolio. Below are clarifications on three areas we anticipate may require additional context.

---

**1. Third-Party Login (Guideline 4.8 — Sign in with Apple Exception)**

This app uses Steam Login as its sole authentication method. We do NOT use Steam Login to create a generic user account within our own system. The entire core functionality of the app — displaying the user's Counter-Strike 2 (CS2) inventory, calculating portfolio values, and running financial simulations — is inherently and exclusively tied to the user's Steam account data.

Per Apple's own exception to Guideline 4.8: "Sign in with Apple is not required if your app exclusively uses your company's own account setup and sign-in systems" or if the third-party login is required to access the user's existing data on that platform. Since our app cannot function without access to the user's Steam inventory, and there is no alternative data source, Steam Login is a functional necessity — not a social/convenience login.

No user account is created on our side. The app is 100% Local-First with zero cloud infrastructure.

---

**2. Monetary Values and In-App Purchases**

The app displays estimated monetary values (e.g., "$127.45") next to virtual items. These values are:

- Derived from publicly available Steam Community Market price history.
- Displayed for **informational and analytical purposes only** (portfolio tracking, historical charting, ROI simulation).
- **NOT purchasable, sellable, or tradeable** within this app.

The app does not facilitate, broker, or enable any transaction involving real currency or virtual items. It is strictly a read-only financial tracker and mathematical analysis tool — comparable to a stock portfolio viewer that shows prices but does not execute trades.

There are no In-App Purchases, subscriptions, or any form of monetization in this version.

---

**3. Intellectual Property — Valve Corporation Disclaimer**

This app is an independent, third-party tool. It is NOT affiliated with, endorsed by, or connected to Valve Corporation.

A visible intellectual property disclaimer is displayed in two locations within the app:

- **Login Screen:** At the bottom of the screen, below the "Sign in with Steam" button.
- **Profile Screen:** Below the "Sign Out" button, alongside a link to our Privacy Policy.

Additionally, Section 7 of our Terms of Service (accessible via the "terms of service" link on the Login Screen) contains a full IP attribution statement.

The disclaimer text reads:
*"Loadout Portfolio is not affiliated with, endorsed by, or connected to Valve Corporation. Counter-Strike, CS2, and the Steam logo are registered trademarks of Valve Corporation."*

---

**4. Privacy Architecture (Local-First)**

For additional reviewer confidence, we want to highlight that this app has a unique privacy posture:

- **Zero cloud infrastructure.** All data (inventory, price history, snapshots, preferences) is stored exclusively on-device via SQLite and MMKV.
- **Zero data collection.** We do not operate servers, databases, analytics, or telemetry.
- **Direct-to-Valve communication.** All API requests go directly from the user's device to Steam's servers (`steamcommunity.com`, `api.steampowered.com`). We do not proxy or relay traffic.
- **Full data deletion on uninstall.** Since no data exists outside the device, uninstalling the app permanently destroys all user data.

Our full Privacy Policy is hosted at: https://sidneioliveira.dev/loadout-portfolio/privacy

---

**Test Account:**

If a test Steam account is needed, please let us know and we will provide one with a populated CS2 inventory. Alternatively, any Steam account with a public CS2 inventory can be used for testing.

Thank you for your time and consideration.

Regards,
Loadout Portfolio Team
