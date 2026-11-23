#!/bin/bash
# Sign the app with your Samsung certificate profile, install it on the TV and open it.
# Usage (from the project folder that holds app/ and project.json):  ./deploy.sh
# Overrides: TV_IP=…  PROFILE=…  TIZEN_HOME=~/tizen-studio
set -euo pipefail
cd "$(dirname "$0")"

read_json() { python3 -c "import json;print(json.load(open('project.json')).get('$1',''))"; }
TV_IP="${TV_IP:-$(read_json tv_ip)}"
PROFILE="${PROFILE:-$(read_json profile)}"
APP_ID="$(read_json app_id)"
TIZEN_HOME="${TIZEN_HOME:-$HOME/tizen-studio}"
T="$TIZEN_HOME/tools/ide/bin/tizen"; S="$TIZEN_HOME/tools/sdb"
[ -n "$TV_IP" ] || { echo "Set tv_ip in project.json (or TV_IP=…)"; exit 1; }
[ -n "$PROFILE" ] || { echo "Set profile in project.json (your Certificate Manager profile name)"; exit 1; }
[ -x "$T" ] || { echo "Tizen CLI not found in $TIZEN_HOME — run install_tizen_cli.sh"; exit 1; }

# The TV's developer port only accepts connections a minute or two after it is switched on,
# and refuses the first attempts — so keep retrying instead of asking for a restart.
for i in $(seq 1 15); do
  "$S" devices | grep -q "$TV_IP:26101" && break
  "$S" kill-server >/dev/null 2>&1 || true; sleep 8
  "$S" connect "$TV_IP" >/dev/null 2>&1 || true
done
"$S" devices | grep -q "$TV_IP:26101" || {
  echo "TV not reachable in developer mode. Check: TV on, same Wi-Fi, Developer Mode on with this computer's IP."
  exit 1; }

rm -rf build && mkdir build && cp -R app build/app
"$T" package -t wgt -s "$PROFILE" -- build/app >/dev/null
mv build/app/*.wgt build/home.wgt
"$T" install -n build/home.wgt -s "$TV_IP:26101" | tail -1
"$T" run -p "$APP_ID" -s "$TV_IP:26101" | tail -1
