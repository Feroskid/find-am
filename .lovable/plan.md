# Installable Find-am app (Add to Home Screen)

Like the video: visitors and signed-in users can install Find-am on their phone or computer. It gets its own icon and opens full screen, with no browser bar.

## What users will see
- **"Install Find-am" card**: a dark card with the Find-am icon, the text "Home-screen icon, full screen, opens faster" and an **Install** / **How** button.
  - It shows in the footer area for visitors, and on the Dashboard and Profile pages for signed-in users.
  - On a small screen, a slim banner can be closed, and the app remembers that it was closed.
- **Android / Chrome / Edge**: tapping **Install** opens the phone's own install prompt in one tap.
- **iPhone / iPad (Safari)**: tapping **How** opens a sheet titled "Add to Home Screen — Two taps in Safari" with three steps:
  1. Tap the Share button at the bottom (or top) of Safari
  2. Scroll and tap **Add to Home Screen**
  3. Tap **Add** — Find-am gets its own icon

  It also says: "Using Chrome on iPhone? Open find-am.com in Safari first." A green **Got it** button closes the sheet.
- When the app is already installed and opened from the icon, the card is hidden.
- App name: "Find-am", using the Find-am logo icon and the brand colours.

## Scope
- This adds the home-screen app only. Offline mode is not included, so the app still needs internet, the same as the website.
- Install works on the live site (find-am.com). The editor preview cannot show the real install prompt.

## Technical details
- `public/manifest.webmanifest`: name, short_name, start_url "/", display "standalone", theme/background colours, and icons 192/512 plus maskable icons generated from `src/assets/findam-logo.png` into `public/icons/`.
- `__root.tsx` head: manifest link, theme-color, apple-touch-icon, apple-mobile-web-app-capable/title/status-bar meta.
- `src/lib/install.tsx`: hook that captures `beforeinstallprompt` and detects iOS and standalone mode (`display-mode: standalone` / `navigator.standalone`).
- `src/components/InstallAppCard.tsx` + iOS instructions sheet (shadcn Sheet/Drawer), using semantic tokens and placed in the Footer, Dashboard and Profile pages.
- No service worker and no vite-plugin-pwa, following the manifest-only approach.
