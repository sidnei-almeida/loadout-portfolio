---
layout: default
title: Privacy Policy — Loadout Portfolio
---

# Privacy Policy

**Loadout Portfolio**
*Last updated: February 28, 2026*

---

## Overview

Loadout Portfolio ("the App") is a **100% Local-First** application. We do not operate servers, cloud databases, analytics platforms, or any remote data collection infrastructure. All user data is stored exclusively on the user's device.

This Privacy Policy explains what information the App accesses, how it is handled, and what control you have over it.

---

## 1. Data We Do NOT Collect

We want to be unambiguous:

- **We do NOT collect personal data.**
- **We do NOT transmit data to our servers** — because we have none.
- **We do NOT use analytics, tracking, or telemetry SDKs.**
- **We do NOT share, sell, or license any user data to third parties.**
- **We do NOT store your Steam password.** Ever.

---

## 2. Data Stored Locally on Your Device

The App stores the following data **exclusively on your device** using on-device databases (SQLite and MMKV):

| Data | Purpose | Storage |
|---|---|---|
| Steam ID (64-bit) | Identify which inventory to display | MMKV (encrypted key-value store) |
| Session cookies | Authenticate requests to Steam on your behalf | Device cookie jar / MMKV |
| Inventory items | Display your CS2 skins, quantities, and values | SQLite (on-device) |
| Price history | Power charts and financial analysis | SQLite (on-device) |
| Portfolio snapshots | Enable historical "what-if" simulations | SQLite (on-device) |
| Skin catalog (images, names) | Display item metadata | SQLite (on-device) |
| User preferences | Currency, theme, and display options | MMKV (on-device) |

**None of this data ever leaves your device through our App.**

---

## 3. How Authentication Works

The App uses a **WebView** that loads the official Steam Community login page (`https://steamcommunity.com/login/home/`). Your credentials (username and password) are entered directly into Steam's own page and transmitted exclusively between your device and Valve Corporation's servers via HTTPS.

After successful authentication, the App reads the resulting session cookies to make authorized requests to Steam's public APIs on your behalf. At no point does the App intercept, read, log, or store your Steam password.

---

## 4. Third-Party Services

The App communicates directly with the following Valve Corporation services:

- **Steam Community** (`steamcommunity.com`) — to fetch your inventory and market price data.
- **Steam Web API** (`api.steampowered.com`) — to fetch your public profile information (display name, avatar, Steam level).

These requests are made **directly from your device** to Valve's servers. We do not proxy, relay, or intercept this traffic. Valve's own Privacy Policy governs the data they collect: [https://store.steampowered.com/privacy_agreement/](https://store.steampowered.com/privacy_agreement/)

---

## 5. Data Retention and Deletion

Because all data is stored on your device:

- **Uninstalling the App permanently deletes all data.** There is no backup, no cloud sync, and no residual data on any server.
- **You can clear all App data** at any time through your device's Settings > Apps > Loadout Portfolio > Clear Data.
- **Signing out** within the App clears all stored credentials and cached profile data.

We cannot recover your data after deletion because we never had access to it.

---

## 6. Children's Privacy

The App does not knowingly collect information from children under the age of 13 (or the applicable age of consent in your jurisdiction). Use of the App requires a valid Steam account, which itself requires the user to meet Valve's minimum age requirements.

---

## 7. Monetary Values Disclaimer

The App displays estimated monetary values based on publicly available Steam Community Market data. These values are for **informational and educational purposes only**. The App does not facilitate, broker, or enable any purchase, sale, or exchange of virtual items for real currency. No financial advice is provided.

---

## 8. Intellectual Property

Loadout Portfolio is an independent, third-party application. It is **not** affiliated with, endorsed by, sponsored by, or in any way officially connected to Valve Corporation. Counter-Strike, Counter-Strike 2 (CS2), Steam, and the Steam logo are registered trademarks of Valve Corporation.

---

## 9. Changes to This Policy

We may update this Privacy Policy from time to time. The "Last updated" date at the top of this page will reflect the most recent revision. Continued use of the App after changes constitutes acceptance of the revised policy.

---

## 10. Contact

If you have questions about this Privacy Policy, please contact us at:

**Email:** loadout.portfolio.app@gmail.com
**GitHub:** [https://github.com/sidneioliveira/loadout-portfolio](https://github.com/sidneioliveira/loadout-portfolio)

---

*This policy is effective as of February 28, 2026.*
