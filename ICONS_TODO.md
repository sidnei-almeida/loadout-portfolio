# App Icon Checklist

Before building for production, replace all placeholder icons with your
custom "Loadout" icon.  Use a **1024 x 1024 px** master PNG (no transparency
for iOS) and export the sizes below.

Tools like [Icon Kitchen](https://icon.kitchen), [App Icon Generator](https://www.appicon.co/),
or Figma plugins can batch-export every size from a single source image.

---

## iOS (place in `ios/Loadout/Images.xcassets/AppIcon.appiconset/`)

The filenames must match those declared in `Contents.json`.

| Filename             | Size (px)  | Purpose                  |
|----------------------|------------|--------------------------|
| `icon-20@2x.png`    | 40 x 40   | Notifications @2x        |
| `icon-20@3x.png`    | 60 x 60   | Notifications @3x        |
| `icon-29@2x.png`    | 58 x 58   | Settings @2x             |
| `icon-29@3x.png`    | 87 x 87   | Settings @3x             |
| `icon-40@2x.png`    | 80 x 80   | Spotlight @2x            |
| `icon-40@3x.png`    | 120 x 120 | Spotlight @3x            |
| `icon-60@2x.png`    | 120 x 120 | Home Screen @2x          |
| `icon-60@3x.png`    | 180 x 180 | Home Screen @3x          |
| `icon-1024.png`     | 1024 x 1024 | App Store Marketing    |

> **Important:** The App Store icon (`icon-1024.png`) must have NO
> transparency and NO rounded corners — Apple applies the mask automatically.

---

## Android (place in `android/app/src/main/res/mipmap-*/`)

Each density folder needs both `ic_launcher.png` (square) and
`ic_launcher_round.png` (circular).  Currently these folders contain the
default React Native robot icon — replace them.

| Folder            | Size (px)  |
|-------------------|------------|
| `mipmap-mdpi`     | 48 x 48   |
| `mipmap-hdpi`     | 72 x 72   |
| `mipmap-xhdpi`    | 96 x 96   |
| `mipmap-xxhdpi`   | 144 x 144  |
| `mipmap-xxxhdpi`  | 192 x 192  |

For adaptive icons (Android 8+), also consider creating:
- `ic_launcher_foreground.png` (108 dp with safe zone)
- `ic_launcher_background.png` or a `@color/` reference
- `mipmap-anydpi-v26/ic_launcher.xml` pointing to the above

> **Play Store:** Google Play also requires a **512 x 512 px** "High-res
> icon" uploaded through the Play Console (not in the APK).

---

## Quick Generate Command

If you have a `master-icon.png` (1024x1024), you can use ImageMagick:

```bash
# iOS
for s in 40 60 58 87 80 120 180 1024; do
  convert master-icon.png -resize ${s}x${s} icon-${s}.png
done

# Android
for entry in "mdpi 48" "hdpi 72" "xhdpi 96" "xxhdpi 144" "xxxhdpi 192"; do
  read folder size <<< "$entry"
  convert master-icon.png -resize ${size}x${size} mipmap-${folder}/ic_launcher.png
done
```

---

**Status:** Pending — icons must be replaced before App Store / Play Store submission.
