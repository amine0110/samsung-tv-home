#!/usr/bin/env python3
"""Create a TV home-page project from the template.

    python3 new_project.py <project-dir> [--app-name "Our Home"] [--tv-ip 192.168.1.50] [--profile MyProfile]

Copies assets/app into <project-dir>/app, gives the app a unique Tizen package id,
and writes <project-dir>/project.json, which deploy.sh reads.
"""
import argparse, json, os, random, shutil, string, sys

SKILL = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("project_dir")
    ap.add_argument("--app-name", default="Our Home")
    ap.add_argument("--tv-ip", default="")
    ap.add_argument("--profile", default="", help="Samsung certificate profile name (Certificate Manager)")
    a = ap.parse_args()

    dest = os.path.abspath(a.project_dir)
    app = os.path.join(dest, "app")
    if os.path.exists(app):
        sys.exit(f"{app} already exists — edit it directly, or pick another folder.")
    os.makedirs(dest, exist_ok=True)
    shutil.copytree(os.path.join(SKILL, "assets", "app"), app)

    # Tizen package ids are exactly 10 alphanumeric characters.
    pkg = "TV" + "".join(random.choice(string.ascii_letters + string.digits) for _ in range(8))
    cfg = os.path.join(app, "config.xml")
    xml = open(cfg, encoding="utf-8").read().replace("{{PACKAGE_ID}}", pkg).replace("{{APP_NAME}}", a.app_name)
    open(cfg, "w", encoding="utf-8").write(xml)

    proj = {"package_id": pkg, "app_id": pkg + ".Home", "app_name": a.app_name,
            "tv_ip": a.tv_ip, "profile": a.profile}
    json.dump(proj, open(os.path.join(dest, "project.json"), "w"), indent=2)
    shutil.copy(os.path.join(SKILL, "scripts", "deploy.sh"), os.path.join(dest, "deploy.sh"))
    os.chmod(os.path.join(dest, "deploy.sh"), 0o755)
    print(json.dumps(proj, indent=2))
    print(f"\nNext: edit {app}/config.js, then run fetch_assets.py {app}")


if __name__ == "__main__":
    main()
