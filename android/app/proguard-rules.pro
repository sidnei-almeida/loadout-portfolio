# React Native / Hermes
-keep class com.facebook.hermes.unicode.** { *; }
-keep class com.facebook.jni.** { *; }
-keep class com.facebook.react.** { *; }

# react-native-reanimated (if used in the future)
-keep class com.swmansion.reanimated.** { *; }

# react-native-gesture-handler
-keep class com.swmansion.gesturehandler.** { *; }

# react-native-fast-image (Glide)
-keep public class * implements com.bumptech.glide.module.GlideModule
-keep class * extends com.bumptech.glide.module.AppGlideModule { <init>(...); }
-keep public enum com.bumptech.glide.load.ImageHeaderParser$** {
  **[] $VALUES;
  public *;
}
-keep class com.bumptech.glide.load.data.ParcelFileDescriptorRewinder$InternalRewinder { *** rewind(); }

# react-native-mmkv (JSI)
-keep class com.tencent.mmkv.** { *; }

# op-sqlite (JSI)
-keep class com.op.sqlite.** { *; }

# react-native-video
-keep class com.brentvatne.react.** { *; }
-keep class com.google.android.exoplayer2.** { *; }

# Keep native methods
-keepclassmembers class * { native <methods>; }

# Prevent stripping of annotations used by React Native
-keepattributes *Annotation*
-keepattributes SourceFile,LineNumberTable
-keepattributes Signature
-keepattributes Exceptions

# OkHttp (used by React Native networking)
-dontwarn okhttp3.**
-dontwarn okio.**
-keep class okhttp3.** { *; }

# Prevent R8 from removing BuildConfig
-keep class com.loadout.portfolio.BuildConfig { *; }
