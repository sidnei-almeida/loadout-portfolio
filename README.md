# Loadout

React Native application for tracking your Steam item portfolio (CS2 skins, etc.). Sign in with Steam, view dashboard and inventory, run snapshot simulations, and manage your profile.

**Backend:** `https://skinfolio-backend-v2.onrender.com`

---

## Requirements

- Node.js 20+
- Android Studio (Android) or Xcode and CocoaPods (iOS)
- Device or emulator

## Installation

```bash
npm install --legacy-peer-deps
```

The project uses React 19; `react-native-fast-image` declares peer React 17/18, so `legacy-peer-deps` is required. A `.npmrc` file is already configured.

## Running the app

1. **Terminal 1 — start Metro (required):**
   ```bash
   npm start
   ```

2. **Terminal 2 — run on Android or iOS:**
   ```bash
   npm run android
   # or
   npm run ios
   ```

**iOS (first time or after changing native dependencies):**
```bash
bundle install
bundle exec pod install
```

**Via Android Studio:** open the `android/` folder (not the repo root), wait for Gradle sync, then run the app with Metro already running.

## Scripts

| Command | Description |
|--------|-------------|
| `./build-apk.sh` | Build **release** APK (default). Standalone: no Metro needed; users install and run. |
| `./build-apk.sh debug` | Build debug APK to `android/app/build/outputs/apk/debug/` |
| `./prepare-android.sh` | Prepare the Android project before opening in Android Studio |
| `./run-android-dev.sh` | Check device, run `adb reverse`, and start Metro |

## Troubleshooting

- **"Unable to load script" / "No connected targets"** — Start Metro before launching the app: run `npm start`, then `npm run android` (or Run from Android Studio).
- **Physical device not loading bundle:** run `adb reverse tcp:8081 tcp:8081`.
- **Metro cache issues:** `npm start -- --reset-cache`.
- **Android build failure:** `cd android && ./gradlew clean && cd ..`, then try again.
- **Gradle download timeout:** In `android/gradle/wrapper/gradle-wrapper.properties`, `networkTimeout` is set to 120000 ms; increase it if your connection is slow.
- **CMake "non-existent path" / ReactAndroid::jsi during build or clean:** The script no longer runs `./gradlew clean` by default (it can break the native build cache). If you need a clean build, run `./build-apk.sh release --clean` to clear local build dirs only. If the error persists, clear Gradle transform cache: `rm -rf ~/.gradle/caches/transforms-3*` then run the build again.

## Reload vs rebuild

- **JS/TS/styles only:** Reload in the app (press `r` in the Metro terminal or shake device → Reload).
- **Changes to `metro.config.js` or `babel.config.js`:** Stop Metro and run `npm start -- --reset-cache`.
- **Changes to `android/` or `package.json` (dependencies):** Run `npm install`, then `cd android && ./gradlew clean` and `npm run android`.

## Release APK (for testers, no Metro)

Run:

```bash
./build-apk.sh
```

or explicitly:

```bash
./build-apk.sh release
```

The APK is written to `android/app/build/outputs/apk/release/app-release.apk`. It is **standalone**: testers install it on their Android device and open the app; Metro is not required. The project is currently set to sign release builds with the debug keystore, which is fine for internal/testing distribution. For Play Store you would configure a release keystore in `android/gradle.properties` and `android/app/build.gradle` (signingConfigs).

## Additional notes

- **Fonts:** Orbitron, Rajdhani, and JetBrains Mono are in `assets/fonts/`. For Android, copy them to `android/app/src/main/assets/fonts/` if needed.
- **DevTools on Linux:** `CHROME_PATH=/usr/bin/brave npm start` (or use `npm run start:devtools` if configured).
- **Deep link:** `loadout://auth-callback` is used for Steam sign-in callback.

Previous documentation from multiple `.md` files has been consolidated here. For security or feature-backlog details, see the repository history.
