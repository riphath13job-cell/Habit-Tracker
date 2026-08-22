# My Apps 🎯📝

A personal mini-app hub for iPhone — **Habit Tracker** and **Notes** — built and maintained
**completely free, with no Mac and no $99/year Apple Developer Program**. It installs on your
iPhone via free-app-identity sideloading (Sideloadly), or runs inside Expo Go.

**Habit Tracker:** daily check-offs with a progress ring, streaks (current + best), weekday
schedules, per-habit colors & emoji, daily local-notification reminders, 30-day stats, weekly
chart, per-habit calendar, automatic dark mode.

**Notes:** quick notes with title + body, autosave as you type, list with previews and relative
dates.

**Hub:** the app opens on a launcher screen with a tile per mini-app; your own icon
(`assets/hub-icon.png`) is the app icon. Backups (Settings → Export) include habits **and**
notes.

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

## Using it inside Expo Go (current setup — no install needed)

For now the app is used **inside the Expo Go app** instead of a sideloaded home-screen app.
Zero maintenance: no 7-day expiry, no cables, no weekly re-signing. Things to know:

- **The app needs the PC while in dev mode.** Expo Go loads it from `npx expo start`, so it only
  opens while the dev server runs and the phone is on the same Wi-Fi. If the connection is
  blocked (campus/hotel Wi-Fi), start with `npx expo start --tunnel` to route over the internet.
- **Use it anywhere without the PC (still free) — publish it:**
  ```bash
  npm install -g eas-cli
  npx expo login      # free expo.dev account
  eas init
  eas update --message "first version"
  ```
  The QR/link printed opens the app in Expo Go from anywhere; no PC needed. Habit data stays on
  the phone inside Expo Go either way.
- **Data care.** The database lives inside Expo Go's storage. Don't delete Expo Go (that wipes
  the data) and use **Settings → Export backup** occasionally. That same export is how you move
  your data into the standalone sideloaded app later — it lives in a separate sandbox.
- **Switching to the standalone app later** is not blocked by anything: push the repo to GitHub,
  run the Actions workflow, install via Sideloadly (see below). The export/import in Settings
  moves your history over.

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
7. The **Habit Tracker** icon appears on your home screen. Done 🎉

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
src/components/HabitForm.tsx    add/edit habit (emoji, color, days, reminder time)
src/components/CalendarView.tsx per-habit month history grid
src/components/ProgressRing.tsx SVG progress ring
src/components/GlassTabBar.tsx   floating "liquid glass" bottom bar with sliding pill
src/screens/                Today / Habits / Stats / Settings
src/screens/notes/          Notes list + autosaving editor
.github/workflows/build-ipa.yml  free cloud build → unsigned IPA
```

## Troubleshooting

- **"Project is incompatible with this version of Expo Go"**: throughout 2026 the iOS App Store
  version of Expo Go is stuck on **SDK 54** (Apple review delays), so this project is deliberately
  pinned to SDK 54. Updating Expo Go won't help — there is no newer store version. Before ever
  upgrading the project (`npm install expo@latest && npx expo install --fix`), check whether the
  store Expo Go caught up at [expo.dev/go](https://expo.dev/go).

- **Workflow fails at xcodebuild**: open the run log; if it complains about Xcode/iOS SDK
  versions, try changing `runs-on:` to `macos-latest`, or pin a newer Xcode with
  `sudo xcode-select -s /Applications/Xcode_<version>.app` before the build step.
- **Sideloadly can't see the iPhone**: check the phone trusts the PC, iTunes/Apple Devices is
  installed, and the cable is data-capable.
- **App "untrusted developer"**: Settings → General → VPN & Device Management → Trust.
- **Reminders don't fire**: Settings tab in the app → allow notifications.
