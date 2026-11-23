---
name: samsung-tv-home
description: Build and install a personal welcome / home page app on a Samsung smart TV (Tizen) from a computer on the same Wi-Fi — greeting by name, clock and weather, big tiles for YouTube, Netflix and the apps people actually use, an ambient clock, and optional Muslim features (next prayer + Hijri date, morning/evening adhkar reader, Surat Al-Kahf on Fridays). Use this skill whenever someone wants to customize their Samsung TV's home screen, make a "welcome page" or dashboard for their TV, find their TV on the network, install their own app on a Samsung / Tizen TV, sideload a web app with Developer Mode, set up a Samsung certificate, or add prayer times / adhkar / Quran to their TV — even if they only say "make my TV nicer" or "can you change what my TV shows".
---

# Samsung TV home page

Turn a Samsung smart TV into a personal home screen: a full-screen web app that runs on the TV itself, signed with the user's own Samsung certificate and installed over Wi-Fi from their computer. After setup the TV doesn't depend on the computer at all — the computer is only for customizing and re-installing.

The template in `assets/app/` is a finished, tested app (1920×1080, remote-control navigation). Most of the work is personalizing `config.js` and getting through Samsung's one-time developer setup, which needs the user's hands on the remote and their Samsung account.

## Be honest about what's possible first

Tell the user this up front, because it's the first thing they'll want and it shaped this whole design (all verified on a 2020 TU-series TV):

- **The TV can't be made to open the page by itself at power-on, and the Home button can't be redirected.** Samsung reserves both for its own apps. Sideloaded apps are closed when the TV goes into standby (only the app that was on screen survives and resumes), so background tricks don't work either.
- **What does work:** pin the app first in the Smart Hub home bar, so **Home → OK** always opens it. If the TV is turned off while the page is showing, it comes back on the page.
- Recommend that, set expectations, and move on. Don't promise auto-start.

## Workflow

Keep a task list; several steps wait on the user (remote, Samsung login), and slow downloads should run in the background while you do other steps.

### 1. Understand what they want
Ask (or infer from the conversation): names to greet (one person, a couple, a family), city for weather, which apps they use (default: YouTube, Netflix, Prime Video, Disney+, Apple TV, Internet, Gallery), whether they watch live TV (if not, don't add a live-TV tile — exiting to live TV is what they're escaping), language touches for the rotating messages, and whether they want the Muslim features (prayer, adhkar, Al-Kahf). Never put people's real names or locations anywhere outside their own project folder.

### 2. Find the TV
```bash
python3 scripts/find_tv.py
```
Prints IP, model, power state and Developer Mode status. It scans every LAN interface and skips VPN tunnels (a VPN as default route is common and hides the TV from naive scans). Then check installed apps — no pairing needed:
```bash
python3 scripts/tv.py <tv-ip> apps
```

### 3. Create the project and personalize it
```bash
python3 scripts/new_project.py ~/tv-home --app-name "Our Home" --tv-ip <tv-ip>
```
Edit `~/tv-home/app/config.js` (names, city lat/lon, `features`, `apps`, messages). Details and every option: `references/customize.md`. Then bundle fonts (and adhkar if enabled):
```bash
python3 scripts/fetch_assets.py ~/tv-home/app [--adhkar]
```

### 4. Preview on the computer
```bash
python3 -m http.server 8811 --directory ~/tv-home/app
```
Open `http://localhost:8811`. Arrow keys / Enter / Esc act as the remote. Add `?now=2026-11-27T07:30` to see another time of day (morning adhkar + Friday Al-Kahf at that example). Take screenshots and check layout before touching the TV — iterating here is seconds, on the TV it's minutes.

### 5. One-time developer setup (needs the user)
Start the slow part early, in the background, after the user agrees to the download and the Tizen SDK licence:
```bash
bash scripts/install_tizen_cli.sh            # ~1.3 GB total, 30–60 min, mostly the extensions
```
While it runs, walk the user through **Developer Mode** on the TV and, once the tools are installed, the **Samsung certificate** — exact click-by-click steps in `references/tv-setup.md`. The certificate needs the user to sign in to their Samsung account in a window that the Certificate Manager opens; you never see or type their password. Write the profile name they chose into `project.json`.

### 6. Install
```bash
~/tv-home/deploy.sh
```
It retries the developer connection for up to two minutes (the TV refuses the first attempts after power-on — don't ask the user to restart the TV unless it still fails), signs, installs and opens the app. Ask the user what they see, or ask for a photo — the TV browser is an old Chromium and can render differently from your preview (see `references/tizen-notes.md`).

### 7. Make it reachable
Have the user pin it: **Home → Apps → (app) → Add to Home**, then move it to the first position. Mention turning off any Samsung TV Plus auto-start if the TV keeps landing on live channels.

## When things go wrong
Read `references/tizen-notes.md`: CSS the TV can't render (flex `gap`, `inset`), fonts, the developer connection, the REST API, key codes, what standby does to apps, and how to get logs off the TV with `scripts/logserver.py`.

## Files
- `assets/app/` — the template app (`config.js` is the only file most users touch)
- `scripts/find_tv.py` — discover TVs; `scripts/tv.py` — info, installed apps, launch, pair, keys
- `scripts/new_project.py` — copy template, unique package id, `project.json`, `deploy.sh`
- `scripts/fetch_assets.py` — fonts (+ adhkar text) into the app
- `scripts/install_tizen_cli.sh` — Tizen CLI + Samsung extensions
- `scripts/deploy.sh` — sign, install, launch
- `scripts/logserver.py` — receive diagnostic logs from the TV
- `references/customize.md`, `references/tv-setup.md`, `references/tizen-notes.md`
