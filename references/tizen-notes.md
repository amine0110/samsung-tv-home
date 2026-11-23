# Tizen TV notes and troubleshooting

Lessons from building and running this on a 2020 Samsung TU7020 (Tizen 5.5). Newer models
are similar; older (2016–2018) ones run even older browsers.

## The TV's browser is old (Chromium 69 on Tizen 5.5)

The preview in a desktop browser will look right while the TV is broken. Things that silently fail:

| Don't use | Use instead |
|---|---|
| flex/grid `gap` (Chrome 84+) | margins: `.a > * + * { margin-left: 14px }` |
| `inset: 0` (Chrome 87+) | `top:0; right:0; bottom:0; left:0` |
| web fonts from fonts.googleapis.com | bundled woff2 via `scripts/fetch_assets.py` |
| `aspect-ratio`, `:is()`, `:where()`, container queries, optional chaining `?.`, `??` | explicit sizes, plain selectors, ES5-style JS |
| Apple-only glyphs (e.g. ) | text or inline SVG |

`-webkit-mask-image`, CSS variables, `background-clip: text` (with `-webkit-`), woff2 and variable fonts do work.
Symptoms you'll see in a photo: tiles touching each other (gap), elements jammed into a corner (inset), plain sans-serif greeting (fonts).

## What the TV does with apps

- **Standby closes sideloaded apps.** Only the app on screen when the TV is switched off is kept and resumed. `background-support="enable"` in config.xml doesn't change this. Don't build "come back to the front" logic; it was tried and logged (the app's last event is the standby).
- **No auto-start, no Home-button override** for apps installed with a public certificate.
- **Back key**: the template ignores Back on the main page, because leaving the app drops the TV to whatever source is underneath (often live TV). Back still closes overlays (adhkar reader).
- **Launching other apps**: `tizen.application.launch(appId)` with the ids from `tizen.application.getAppsInfo()`; the template matches config `match` regexes against app names/ids, so it works without knowing ids.
- **Audio** (Al-Kahf) pauses when another app comes to the front; the template remembers the position for that day.

## Developer connection (sdb, port 26101)

- After power-on, the port is open but `sdb connect` fails for ~1–2 minutes. Retry with `sdb kill-server` between attempts (deploy.sh does this). Only ask for a full restart (hold power) if it still fails after ~2 minutes.
- "Can not get the target option" from the `tizen` CLI = sdb isn't connected.
- Developer Mode trusts exactly one computer IP. A VPN doesn't matter as long as the TV's subnet routes over the LAN interface (`route get <tv-ip>` on macOS).

## Open REST API (port 8001, no pairing)

- `GET /api/v2/` — device info: `modelName`, `PowerState` (`on`/`standby`), `developerMode`, `developerIP`, `wifiMac`
- `GET /api/v2/applications/<id>` — `{running, visible}` or 404 if not installed
- `POST /api/v2/applications/<id>` — open an installed app (works for your own app id too: `<package>.Home`)
- `DELETE /api/v2/applications/<id>` — close it

Pairing (`wss://<ip>:8002/api/v2/channels/samsung.remote.control`, Allow/Deny on TV) is needed only for key presses.

## Remote key codes in the app

Left 37, Up 38, Right 39, Down 40, OK/Enter 13, Back 10009. Colour and media keys must be
registered with `tizen.tvinputdevice.registerKey()` before they arrive.

## Getting logs off the TV

1. On the computer: `python3 scripts/logserver.py tv.log` (listens on port 8899; allow it through the firewall).
2. In `config.js`: `debugLogUrl: "http://<computer-ip>:8899/log"`, then deploy.
3. The app posts `start`, uncaught `error`s and anything you `log()`; set `debugLogUrl` back to `null` afterwards.
