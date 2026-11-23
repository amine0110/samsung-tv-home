# One-time TV setup: Developer Mode and Samsung certificate

Both steps need the user. Give them one step at a time and ask for a screenshot or photo when unsure.

## Developer Mode (remote control, ~2 minutes)

1. Press **Home**, open **Apps**.
2. On the Apps screen type **1 2 3 4 5** (number keys, or the on-screen number pad if the remote has none).
3. Switch **Developer mode** to **On**.
4. **Host PC IP**: the computer's LAN address (first address printed by `find_tv.py`; not a VPN address).
5. Restart the TV fully: **hold the power button** until the Samsung logo appears (a short press only goes to standby).

Check: `python3 scripts/tv.py <tv-ip> info` shows `developerMode 1` and the right `developerIP`.
If the computer's IP changes later (new router lease), redo step 4.

## Samsung certificate (computer, ~5 minutes)

Open `~/tizen-studio/tools/certificate-manager/Certificate-manager.app` (macOS) or
`certificate-manager` (Linux). The TV should be reachable in developer mode at this point
(`~/tizen-studio/tools/sdb connect <tv-ip>`) so its device id (DUID) is filled in automatically.

1. Click **+** → choose **Samsung** → device type **TV**.
2. **Certificate profile**: create a new one; any name (e.g. their first name). Put it in `project.json` → `profile`.
3. **Author certificate**: "Create a new author certificate" → Next → author name + a password of their choice.
   Keep "Apply the same password for the distributor certificate" ticked. They keep the password; you don't need it.
4. A **Samsung account** sign-in window opens — the user logs in (or creates a free account).
5. **Distributor certificate**: "Create a new distributor certificate" → privilege **Public** → check the
   DUID list contains the TV (get it with `~/tizen-studio/tools/sdb shell 0 getduid` if it's empty) → Next → **Finish**.

Files land in `~/SamsungCertificate/<profile>/`; the active profile is recorded in
`~/tizen-studio-data/profile/profiles.xml` (deploy.sh uses it by name). One certificate covers
every TV whose DUID was added; to add another TV, edit the profile's distributor certificate.

## Pairing the remote-control channel (optional)

Only needed to send button presses (`tv.py key`). `python3 scripts/tv.py <tv-ip> pair` shows an
**Allow / Deny** prompt on the TV that the user must accept within ~60 s. Listing installed
apps over this channel hangs on 2020 models — use `tv.py apps` (REST) instead.
