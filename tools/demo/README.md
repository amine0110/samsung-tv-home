# Recording the demo

How `media/` was made. Needs Node, ffmpeg and Google Chrome.

1. Create a demo project with every feature on: `python3 scripts/new_project.py /tmp/demo-home`, set
   `features` to true in its `app/config.js`, run `fetch_assets.py /tmp/demo-home/app --adhkar`,
   and copy `studio.html` into `/tmp/demo-home/`.
2. Serve it: `python3 -m http.server 8812 --directory /tmp/demo-home`.
3. `npm i playwright` here, then `node record.js` → `frames/`, `frames.txt`, `markers.json`.
   It captures real screen frames (CDP screencast) while pressing remote keys through `studio.html`.
4. Encode: `ffmpeg -f concat -safe 0 -i frames.txt -fps_mode cfr -r 30 -c:v libx264 -crf 19 -pix_fmt yuv420p demo.mp4`,
   then cut GIFs per scene using the times in `markers.json` (crop `1456:819:170:60` = the TV screen).
5. `node shot.js plain.jpg` renders the page with the Muslim features off.

The app's `?now=2026-11-27T07:40` URL parameter (browser preview only) fakes the clock, so any
time of day or a Friday can be shown on demand.
