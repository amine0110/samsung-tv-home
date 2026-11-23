#!/usr/bin/env python3
"""Find Samsung smart TVs on the local network (no extra packages needed).

    python3 find_tv.py            # SSDP discovery, then a sweep of this machine's /24 (or /23) subnet
    python3 find_tv.py 192.168.1.50   # just ask one address

For each TV it prints the info from its open API (port 8001): name, model, IP, power state,
and whether Developer Mode is on and which computer IP it trusts.
"""
import concurrent.futures as cf, ipaddress, json, socket, subprocess, sys, urllib.request


def info(ip):
    try:
        d = json.load(urllib.request.urlopen(f"http://{ip}:8001/api/v2/", timeout=2))["device"]
        return {"ip": ip, "name": d.get("name"), "model": d.get("modelName"), "os": d.get("OS"),
                "power": d.get("PowerState"), "developerMode": d.get("developerMode"),
                "developerIP": d.get("developerIP"), "wifiMac": d.get("wifiMac")}
    except Exception:
        return None


def lan_ips():
    """IPv4 addresses of this computer's LAN interfaces (VPN / point-to-point tunnels skipped)."""
    import re
    out = []
    for cmd in (["ifconfig"], ["ip", "-4", "-o", "addr"]):
        try:
            txt = subprocess.run(cmd, capture_output=True, text=True, timeout=5).stdout
        except Exception:
            continue
        for line in txt.splitlines():
            m = re.search(r"inet (\d+\.\d+\.\d+\.\d+)(?:/(\d+))?", line)
            if not m or "-->" in line or " peer " in line:
                continue
            ip = m.group(1)
            if ipaddress.ip_address(ip).is_private and not ip.startswith("127."):
                out.append(ip)
        if out:
            break
    if not out:  # Windows / fallback
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        try:
            s.connect(("10.255.255.255", 1)); out.append(s.getsockname()[0])
        except Exception:
            pass
        finally:
            s.close()
    return list(dict.fromkeys(out))


def ssdp(iface_ip, timeout=3):
    msg = ('M-SEARCH * HTTP/1.1\r\nHOST: 239.255.255.250:1900\r\nMAN: "ssdp:discover"\r\n'
           "MX: 2\r\nST: urn:samsung.com:device:RemoteControlReceiver:1\r\n\r\n").encode()
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    s.settimeout(timeout)
    try:
        s.setsockopt(socket.IPPROTO_IP, socket.IP_MULTICAST_IF, socket.inet_aton(iface_ip))
    except Exception:
        pass
    ips = set()
    try:
        s.sendto(msg, ("239.255.255.250", 1900))
        while True:
            _, addr = s.recvfrom(4096)
            ips.add(addr[0])
    except Exception:
        pass
    return ips


def sweep(me):
    net = ipaddress.ip_network(me + "/23", strict=False) if me.startswith("192.168.") else ipaddress.ip_network(me + "/24", strict=False)
    hosts = [str(h) for h in net.hosts() if str(h) != me]

    def open8001(ip):
        try:
            with socket.create_connection((ip, 8001), timeout=0.6):
                return ip
        except Exception:
            return None
    with cf.ThreadPoolExecutor(128) as ex:
        return {ip for ip in ex.map(open8001, hosts) if ip}


if __name__ == "__main__":
    mine = lan_ips()
    print("this computer:", ", ".join(mine) or "no LAN address found")
    cands = set(sys.argv[1:])
    if not cands:
        for me in mine:
            cands |= ssdp(me) | sweep(me)
    found = [x for x in (info(ip) for ip in sorted(cands)) if x]
    if not found:
        print("No Samsung TV found. Is it switched on and on the same Wi-Fi as this computer?")
    for t in found:
        print(json.dumps(t, indent=2))
