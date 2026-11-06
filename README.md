# PSY — 2D Tactical Jetpack Arena (Web & Android APK)

**PSY** is a 2D Mini Militia-inspired tactical jetpack shooter featuring **Parth (`P`)**, **Siddharth (`S`)**, and **Yug (`Y`)**, ground weapon pickups, Sniper-only Scope Zoom-Out (`1X` → `0.5X`), an instant-heal Medkit inventory (up to `10/10`), and 5 upgradable companion pets led by **Sheru** (**1. Sheru**, **2. Wolfs**, **3. Draky**, **4. Pegasus**, **5. Poink**).

---

## 📱 Download Android APK on GitHub

This repository includes an automated **GitHub Actions Android APK Build & Release pipeline** at [`.github/workflows/build-apk.yml`](.github/workflows/build-apk.yml) powered by Capacitor & Gradle.

### How to Get `PSY-Arena.apk` from GitHub:
1. Push or sync this repository to GitHub (onto the `main` or `master` branch).
2. Open the **Actions** tab in your GitHub repository → select **"Build Android APK (PSY Arena)"**.
3. Once the workflow completes (~2 minutes):
   - **Option A (GitHub Releases)**: Go to your repo's **Releases** section (`latest-apk` tag) and download **`PSY-Arena.apk`** directly onto your Android phone.
   - **Option B (Workflow Artifacts)**: Open the completed workflow run and download **`PSY-Arena-APK`** under the **Artifacts** section.

---

## 🛠️ Build `PSY-Arena.apk` Locally

If you have Node.js and Android Studio / Android SDK installed locally:

```bash
npm install
npm run build
npm install @capacitor/core @capacitor/cli @capacitor/android --no-save
npx cap add android
npx cap sync android
cd android && ./gradlew assembleDebug
```

The compiled APK will be generated at:
`android/app/build/outputs/apk/debug/app-debug.apk`
