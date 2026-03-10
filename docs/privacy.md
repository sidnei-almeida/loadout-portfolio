# Loadout Portfolio — Privacy Policy

**Last updated: March 2025**

Loadout Portfolio is a **100% Local-First** application. This policy describes how we handle — and, importantly, how we do *not* handle — your data.

---

## 1. Local-First Architecture

Loadout Portfolio is built on a fully **Local-First** architecture. All your data — including inventory items, price history, portfolio snapshots, and preferences — is stored **exclusively on your device** using on-device databases (SQLite and MMKV).

We do **not** operate servers, cloud databases, or any remote data collection infrastructure. Your information never leaves your device to reach systems we control, because we control none.

---

## 2. Data We Do Not Collect

We do not collect, transmit, store, or process any personal data on external servers. Specifically, we do **not** collect:

- Personal identification information  
- Steam credentials or passwords  
- Usage analytics or telemetry  
- Location data  
- Device identifiers for tracking  
- Advertising identifiers  

---

## 3. Steam Authentication

When you sign in, your Steam credentials are exchanged **directly** between your device and Valve Corporation’s servers through a secure WebView. Loadout Portfolio never intercepts, reads, transmits, or stores your Steam password.

The only data retained locally on your device are **session cookies** (`sessionid` and `steamLoginSecure`) necessary to access your public inventory on Steam. These cookies are stored in encrypted local storage (MMKV) on your device and are never sent to any server we operate.

---

## 4. Steam API Usage

The app makes direct API calls **from your device** to Steam’s public APIs to fetch:

- Your CS2 inventory data  
- Steam Community Market prices  
- Public profile information (when you choose to sync your profile)  

These requests go **directly from your device to Valve’s servers** — they never pass through any intermediary server operated by us. We do not proxy, relay, or log these requests.

---

## 5. On-Device Storage

All data is stored locally on your device:

| Storage       | Purpose                                                |
|---------------|--------------------------------------------------------|
| **SQLite**    | Inventory items, price history, portfolio snapshots     |
| **MMKV**      | Session tokens, language preference, currency, cooldowns |

This data **never leaves your device** and is not backed up to any cloud service we control. On Android, we explicitly exclude app data from cloud backup and device-transfer rules. On iOS, we declare no data collection in our privacy manifests.

---

## 6. Data Deletion

- **Uninstall:** If you uninstall Loadout Portfolio, all locally stored data is permanently and irreversibly deleted from your device.  
- **App data:** You can also clear all app data at any time through your device’s system settings (Settings → Apps → Loadout Portfolio → Storage → Clear data).

There is no “account” to delete on our side — because we do not have accounts or servers.

---

## 7. Third-Party Services

The **only** third-party service the app communicates with is **Valve Corporation’s Steam platform** (`steamcommunity.com`, `steampowered.com`, `api.steampowered.com`).

We do not integrate any:

- Third-party analytics  
- Advertising SDKs  
- Crash reporting or telemetry  
- Social or tracking SDKs  

---

## 8. Children’s Privacy

Loadout Portfolio does not knowingly collect any data from children under 13. Since we do not collect personal data from any user, this applies universally. The app is intended for users who have a valid Steam account, which requires compliance with Steam’s terms of service.

---

## 9. Changes to This Policy

We may update this Privacy Policy from time to time. Changes will be reflected with an updated “Last updated” date. Continued use of the app after changes constitutes acceptance of the updated policy. For significant changes, we encourage you to review this page periodically.

---

## 10. Contact

If you have questions about this Privacy Policy, please contact us through our official support channels or the project repository.

---

*Loadout Portfolio — Local-first. Your data stays on your device.*
