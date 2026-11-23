# Customizing the home page

Everything lives in `app/config.js`. After editing, preview locally, then run `./deploy.sh`.

## Basics
- `names`: `["Sara"]`, `["Sara", "Adam"]` or a family `["Sara", "Adam", "Lina"]` → "Sara, Adam & Lina". The monogram uses the first and last initials.
- `city`: name shown under the weather, plus `lat`/`lon` (also used for prayer times). Look coordinates up rather than guessing.
- `messages`: rotate every 11 s under the greeting; any language, Arabic is shown right-to-left.
- `since: "YYYY-MM-DD"`: adds a "days together" chip.
- `photos`: copy images into `app/photos/` and list them; they slowly cross-fade behind the right-hand card. Keep each under ~500 KB (resize to 1000 px) — the TV has little memory.
- `ambientAfterMinutes`: idle time before the big floating clock.

The greeting, colour palette and eyebrow line follow the time of day (morning / day / evening / night); weekends say "Hello, weekend".

## App tiles
Each entry: `{ key, label, tag, match, theme }`. `match` is a regex tested against installed app names and ids on the TV; tiles for apps that aren't installed are hidden, so it's safe to list extras. `theme` picks a built-in style (`youtube`, `netflix`, `prime`, `disney`, `apple`, `spotify`, `browser`, `gallery`, `tvplus`, `vrt`, `auvio`, `vtm`, `goplay`, `pickx`, `streamz`, `pluto`); for anything else add a `.t-<theme>` rule in `style.css` with `--tbg` (background) and `--tglow` (focus glow). Wordmarks are typographic, not logos.

`python3 scripts/tv.py <tv-ip> apps` shows what's installed. To install a new store app, the user searches for it in **Apps** on the TV — faster than driving the store blind with key presses.

## Muslim features (`features.prayer`, `features.adhkar`, `features.kahf`)
- **Prayer**: next prayer with countdown, today's five times, Hijri date beside the date, and a 15-second banner when a prayer time arrives. Times come from api.aladhan.com for `city.lat/lon`, cached per day on the TV. Ask which mosque timetable they follow: set `prayer.method` (3 MWL, 2 ISNA, 4 Umm al-Qura, 5 Egypt, 12 UOIF/France, 13 Diyanet, 21 Morocco …) and fine-tune with `prayer.tune` minutes. `school: 1` for Hanafi Asr.
- **Adhkar**: a button above the app row (remote ▲) — أذكار الصباح from Fajr until Dhuhr, أذكار المساء from Asr on. Full-screen reader: OK counts down the repetitions and moves on at zero, ◀ next / ▶ previous (right-to-left), Back closes; "Done today ✓" afterwards. Needs `fetch_assets.py --adhkar` (Hisn al-Muslim text, 31 morning / 30 evening). Uses prayer times for its windows even if `features.prayer` is off.
- **Al-Kahf**: on Fridays a سورة الكهف button; with `kahf.autoplay` it starts by itself the first time the page opens that Friday. Change `kahf.url` for another reciter (mp3quran.net has many; check the URL returns `audio/mpeg`).

## App name, icon, id
- Name shown in the TV's app list: `--app-name` of `new_project.py` (stored in `config.xml` `<name>`).
- Icon: replace `app/icon.png` (512×512 PNG).
- Never change the package id after installing — it creates a second app.
