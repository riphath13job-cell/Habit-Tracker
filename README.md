# Blueprint 🎯📝

A personal mini-app hub for iPhone — **Blueprint** — built and maintained
**completely free, with no Mac and no $99/year Apple Developer Program**. It installs on your
iPhone via free-app-identity sideloading (Sideloadly), and includes a native home-screen
**"Blueprint" widget** (today's habit progress, streak, and habit list).

**Blueprint (core habits):** daily check-offs with a progress ring, streaks (current + best), weekday
schedules, per-habit colors & emoji, daily local-notification reminders, 30-day stats, weekly
chart, per-habit calendar, automatic dark mode.

**Notes:** quick notes with title + body, autosave as you type, list with previews and relative
dates, favorites ⭐, and a Trash page with restore / delete-forever / empty-trash.

**Hub:** the app opens on a launcher screen with a tile per mini-app. Every mini-app's glass
bottom bar has an **Apps folder button** that opens an iOS-style liquid-glass folder overlay for
switching apps. The app icon is generated from code (`assets/icon.png`). Backups
(Settings → Export) include habits **and** notes (also trashed ones).

---

## Rule for AI tools and agents editing this app

> **After changing any JavaScript-only code (UI, logic, screens), an AI (or any editor) MAY publish
> the change to the user's iPhone with:**
>
> ```bash
> npx eas update --branch default --message "my change"
> ```
>
> This uploads the JS update to the `default` channel served to the sideloaded app, and the phone
> downloads it the next time the app is opened (needs internet once).
>
> **Native changes — the **home-screen widget** included — can NOT be shipped by `eas update`.**
> Widget layout, the `app.json` widget config, and any native module change require a **fresh IPA
> build** (see "Build the installable app" below): push to GitHub, run the **Build unsigned iOS
> IPA** workflow, then re-install via Sideloadly. The widget appears on the home screen after you
> add it (long-press the home screen → `+` → search "Blueprint").

---

## How the whole setup works

| Step | Tool | Cost |
|---|---|---|
| Develop & preview instantly on your iPhone | Expo Go (App Store, free) | free |
| Compile the iOS app (.ipa) | GitHub Actions macOS runner | free (repo must stay **public**) |
| Sign & install onto your iPhone | Sideloadly on Windows + your Apple ID | free |

Apple limits free accounts: the installed app **expires every 7 days** (re-sign weekly), max
3 sideloaded apps at once, 10 app IDs per 7 days (we always reuse `com.richa.habittracker`, so
you'll only ever use one).

---

## Two ways to run: Expo Go (JS preview only) vs the standalone app (with widget)

The **home-screen widget is a native feature**, so it only works in the **standalone sideloaded
app** (Build → Sideloadly below), never in Expo Go. For quick JS-only previews you can still use
Expo Go during development, but the installed phone app that shows the widget is the one you get
from the GitHub Actions build. Things to know:

- **Expo Go only previews the JS.** It cannot render the native widget and cannot run the new
  native `@expo/ui` widget extension, so the widget won't show and some SwiftUI-only views may
  not render inside Expo Go. Use it just for quick UI iteration; use the standalone app for the
  real experience.
- **The standalone app needs the PC on the same network in dev, or an OTA update.**
  `npx expo start` serves the JS; `npx eas update --branch default` pushes a JS update that the
  installed app fetches on next launch (internet needed once). Native/widget changes still need a
  fresh IPA build.
- **Data care.** Each install's database lives in that app's own sandbox. Keep a JSON backup via
  **Settings → Export backup**; the same file restores into the standalone app and moves history
  across installs.

---

## 1) Daily development on Windows (instant preview)

```bash
cd habit-tracker
npx expo start
```

Install **Expo Go** from the App Store on your iPhone, make sure the phone and PC are on the same
Wi-Fi, scan the QR code from the terminal with the iPhone camera, and the app opens with live
reload. No signing, no cables, no limits.

## 2) Build the installable app (GitHub Actions)

1. Create a **public** GitHub repository (e.g. `habit-tracker`).
2. Push this folder:
   ```bash
   git remote add origin https://github.com/YOUR_NAME/habit-tracker.git
   git push -u origin main
   ```
3. On GitHub: **Actions** tab → **Build unsigned iOS IPA** → **Run workflow** → run on `main`.
4. Wait ~15–25 min, open the finished run, scroll to **Artifacts**, download `HabitTracker-ipa`
   and unzip it → you get `HabitTracker.ipa`.

Re-run the workflow only when you want a new version (e.g. after changing code). The same IPA can
be re-signed every week — you don't need a fresh build to renew it.

## 3) One-time setup to install on your iPhone

1. Install [Sideloadly](https://sideloadly.io/) (free) on Windows.
2. Install the **Apple Devices** app from the Microsoft Store (or iTunes) — this provides the USB
   drivers Sideloadly needs.
3. Connect the iPhone via USB cable and unlock it.
4. In Sideloadly: pick `HabitTracker.ipa`, enter your Apple ID and password
   (with 2FA you'll be asked for an app-specific password — create one at
   [appleid.apple.com](https://appleid.apple.com) → Sign-In and Security → App-Specific Passwords).
   Keep the default/normal signing mode and the bundle ID unchanged.
5. Click **Start**. First time takes a few minutes.
6. On the iPhone: **Settings → General → VPN & Device Management** → tap your Apple ID → **Trust**.
   If asked (iOS 16+), enable Developer Mode.
7. The **Blueprint** icon appears on your home screen. Done 🎉

> Tip: use a secondary Apple ID just for sideloading. Signing is done locally — your password is
> only used to talk to Apple's servers from your own PC.

## 4) The weekly ritual (7-day expiry)

Apple expires free-signed apps after 7 days — the icon literally stops launching. To restore:

1. Plug the iPhone into the PC.
2. Open Sideloadly, pick the same `HabitTracker.ipa`, same Apple ID, **Start**.
3. That's it (~2 min). Your habits and history are preserved — do **not** delete the app icon,
   deleting the app deletes its data (so export a JSON backup from Settings occasionally).

## Data safety

Everything is stored locally in SQLite on the device. **Settings → Export backup** shares a JSON
file with all habits and check-ins; **Import backup** restores it.

## Project structure

```
App.tsx                     app root: launcher → Habit app (tabs) / Notes app (stack)
src/db.ts                   SQLite schema + queries (habits, completions, notes) + backups
src/date-utils.ts           day keys, schedules, streak math, completion rates
src/notifications.ts        local daily reminders (expo-notifications)
src/screens/LauncherScreen.tsx  app hub with one tile per mini-app
src/hub/                     shared app tiles, glass folder overlay, app switching
src/components/HabitForm.tsx    add/edit habit (emoji, color, days, reminder time)
src/components/CalendarView.tsx per-habit month history grid
src/components/ProgressRing.tsx SVG progress ring
src/components/GlassTabBar.tsx   floating "liquid glass" bottom bar with sliding pill
src/screens/                Today / Habits / Stats / Settings
src/screens/notes/          Notes list + autosaving editor
src/widgets/                home-screen widget: TodayWidget.tsx (layout), refreshTodayWidget.ts (snapshot push)
.github/workflows/build-ipa.yml  free cloud build → unsigned IPA
```

## Troubleshooting

- **"Project is incompatible with this version of Expo Go"**: the App Store Expo Go may lag behind
  the project's SDK. This project targets the latest Expo SDK (57) so it can build the native
  widget. If you only need JS previews and Expo Go complains, either open the project in the
  matching SDK or, better, use the **standalone app** from the GitHub Actions build instead of
  Expo Go.
- **Widget doesn't appear on the home screen**: the widget ships inside the standalone IPA, not
  Expo Go. After installing via Sideloadly, long-press the home screen → tap **+** → search
  "Blueprint" → Add Widget. If you changed the widget layout, you must rebuild a fresh IPA
  (push → GitHub Actions → Sideloadly); an `eas update` won't change native widget code.
- **Workflow fails at xcodebuild**: open the run log; if it complains about Xcode/iOS SDK
  versions, try changing `runs-on:` to `macos-latest`, or pin a newer Xcode with
  `sudo xcode-select -s /Applications/Xcode_<version>.app` before the build step.
- **Sideloadly can't see the iPhone**: check the phone trusts the PC, iTunes/Apple Devices is
  installed, and the cable is data-capable.
- **App "untrusted developer"**: Settings → General → VPN & Device Management → Trust.
- **Reminders don't fire**: Settings tab in the app → allow notifications.
