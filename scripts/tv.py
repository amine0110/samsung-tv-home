#!/usr/bin/env python3
"""Small Samsung TV helper over the local network.

    python3 tv.py <tv-ip> info                 # model, power, developer mode
    python3 tv.py <tv-ip> apps                 # which well-known apps are installed (no pairing needed)
    python3 tv.py <tv-ip> app <app-id>         # status of one app (running / visible)
    python3 tv.py <tv-ip> launch <app-id>      # open an installed app, incl. your own home page
    python3 tv.py <tv-ip> pair                 # pair once (TV shows Allow/Deny) -> saves .tv-token
    python3 tv.py <tv-ip> key KEY_HOME         # send a remote button (needs pairing)

info/apps/app/launch use the TV's open REST API on port 8001 and need no pairing.
pair/key use the secure remote-control channel (port 8002): `pip install samsungtvws`.
"""
import json, os, sys, urllib.request

# Store ids of common apps (checked on a 2020 TU-series TV; ids are the same across most models).
KNOWN = {
    "111299001912": "YouTube",
    "3201907018807": "Netflix",
    "3201910019365": "Prime Video",
    "3201901017640": "Disney+",
    "3201807016597": "Apple TV",
    "3201907018784": "Internet (browser)",
    "3201710015037": "Gallery",
    "3201606009684": "Spotify",
    "3201808016802": "Pluto TV",
    "3201512006963": "Plex",
}


def rest(ip, path, method="GET"):
    req = urllib.request.Request(f"http://{ip}:8001/api/v2/{path}", method=method)
    with urllib.request.urlopen(req, timeout=5) as r:
        body = r.read().decode()
    try:
        return json.loads(body)
    except ValueError:
        return body


def remote(ip):
    from samsungtvws import SamsungTVWS  # pip install samsungtvws
    return SamsungTVWS(host=ip, port=8002, token_file=".tv-token", name="TV Home Setup", timeout=60)


def main():
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    ip, cmd, args = sys.argv[1], sys.argv[2], sys.argv[3:]
    if cmd == "info":
        d = rest(ip, "")["device"]
        for k in ("name", "modelName", "OS", "PowerState", "developerMode", "developerIP", "networkType"):
            print(f"{k:14} {d.get(k)}")
    elif cmd == "apps":
        for app_id, name in KNOWN.items():
            try:
                r = rest(ip, f"applications/{app_id}")
                print(f"installed  {name:20} {app_id}  running={r.get('running')} visible={r.get('visible')}")
            except Exception:
                print(f"-          {name:20} {app_id}")
    elif cmd == "app":
        print(rest(ip, f"applications/{args[0]}"))
    elif cmd == "launch":
        print(rest(ip, f"applications/{args[0]}", method="POST"))
    elif cmd == "pair":
        print("Look at the TV and choose Allow (you have about a minute)…")
        tv = remote(ip)
        tv.open()
        print("Paired — token saved to .tv-token" if os.path.exists(".tv-token") else "No token saved — try again")
    elif cmd == "key":
        remote(ip).send_key(args[0])
    else:
        sys.exit(__doc__)


if __name__ == "__main__":
    main()
