#!/usr/bin/env python3
"""Download the fonts (and optionally the adhkar text) into the app folder.

    python3 fetch_assets.py <app-dir> [--adhkar]

Why: the TV's built-in browser is slow to load web fonts at start-up, and in practice the
greeting fell back to a plain font, so fonts are bundled inside the app. They are Google
Fonts under the SIL Open Font License. The adhkar come from github.com/osamayy/azkar-db
(Hisn al-Muslim); that dataset has no licence file, so it is downloaded on your machine
instead of being shipped with this skill.
"""
import argparse, hashlib, json, os, re, sys, urllib.request

UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/120.0 Safari/537.36")  # makes Google Fonts serve woff2
FONTS = ("https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,500;"
         "1,9..144,300&family=Inter:wght@200;300;400;500;600;700;800"
         "&family=Noto+Kufi+Arabic:wght@300;500&family=Amiri:wght@400;700&display=swap")
SUBSETS = {"latin", "latin-ext", "arabic"}
ADHKAR_URL = "https://raw.githubusercontent.com/osamayy/azkar-db/master/azkar.json"


def get(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA}), timeout=30).read()


def fonts(app):
    os.makedirs(os.path.join(app, "fonts"), exist_ok=True)
    css = get(FONTS).decode()
    faces, seen = [], {}
    for subset, body in re.findall(r"/\* ([\w-]+) \*/\s*@font-face \{(.*?)\}", css, re.S):
        if subset not in SUBSETS:
            continue
        url = re.search(r"url\((https://[^)]+)\)", body).group(1)
        if url not in seen:
            name = hashlib.md5(url.encode()).hexdigest()[:10] + ".woff2"
            open(os.path.join(app, "fonts", name), "wb").write(get(url))
            seen[url] = name
        faces.append("@font-face {" + body.replace(url, "fonts/" + seen[url]) + "}")
    open(os.path.join(app, "fonts.css"), "w").write("\n".join(faces) + "\n")
    print(f"fonts: {len(faces)} faces, {len(seen)} files")


def adhkar(app):
    d = json.loads(get(ADHKAR_URL))
    out = {"morning": [], "evening": []}
    cats = {"أذكار الصباح": "morning", "أذكار المساء": "evening"}

    def clean(s):
        s = re.sub(r"[ \t]+", " ", (s or "").replace("\r", "").strip())
        return s.replace("أبن السني", "ابن السني")

    for cat, zekr, desc, count, ref, *_ in d["rows"]:
        if cat in cats:
            out[cats[cat]].append({"t": clean(zekr), "n": int(count or 1), "d": clean(desc), "r": clean(ref)})
    if not out["morning"] or not out["evening"]:
        sys.exit("adhkar: unexpected dataset format — nothing written")
    js = ("// Morning & evening adhkar (Hisn al-Muslim), downloaded from github.com/osamayy/azkar-db\n"
          "window.ADHKAR = " + json.dumps(out, ensure_ascii=False) + ";\n")
    open(os.path.join(app, "adhkar.js"), "w", encoding="utf-8").write(js)
    print(f"adhkar: {len(out['morning'])} morning, {len(out['evening'])} evening")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("app_dir")
    ap.add_argument("--adhkar", action="store_true")
    a = ap.parse_args()
    fonts(a.app_dir)
    if a.adhkar:
        adhkar(a.app_dir)
