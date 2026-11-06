# PSY — 2D Tactical Jetpack Arena (Web & Android APK)

**PSY** is a 2D Mini Militia-inspired tactical jetpack shooter featuring **Parth (`P`)**, **Siddharth (`S`)**, and **Yug (`Y`)**, ground weapon pickups, Sniper-only Scope Zoom-Out (`1X` → `0.5X`), an instant-heal Medkit inventory (up to `10/10`), and 5 upgradable companion pets led by **Sheru** (**1. Sheru**, **2. Wolfs**, **3. Draky**, **4. Pegasus**, **5. Poink**).

---

## 📱 How to Build & Download `PSY-Arena.apk` in GitHub

> **Why isn't `.github/workflows/` pre-created?**
> GitHub blocks OAuth apps from exporting repositories that contain `.github/workflows/*.yml` unless the OAuth token has the special `workflow` scope. To ensure **"Export to GitHub"** works without any error, the workflow template is stored at [`public/build-apk.yml`](public/build-apk.yml).

### Step-by-Step in GitHub (Takes 30 Seconds):
1. Export or push this project to your GitHub repository.
2. In your GitHub repo, click **Add file → Create new file**, name it **`.github/workflows/build-apk.yml`**, and paste the contents of [`public/build-apk.yml`](public/build-apk.yml) (or download it directly from the in-app **APK** button in the top bar).
3. Commit the file — GitHub Actions will automatically build **`PSY-Arena.apk`** and publish it to your repository's **Releases (`latest-apk`)** and **Actions Artifacts**!
