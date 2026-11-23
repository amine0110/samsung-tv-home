#!/bin/bash
# Install Samsung's Tizen command-line tools plus the TV and certificate extensions.
# macOS and Linux. About 300 MB download for the base tools, then ~1 GB of extensions that
# download slowly from download.tizen.org (expect 30–60 minutes). Run it in the background.
#
# Usage: install_tizen_cli.sh [install-dir]      (default ~/tizen-studio)
# Installing means accepting the Tizen SDK licence (--accept-license): ask the user first.
set -euo pipefail
DEST="${1:-$HOME/tizen-studio}"
VER="6.1"
case "$(uname -s)" in
  Darwin) OS="macos-64" ;;   # Intel build; runs under Rosetta on Apple Silicon
  Linux)  OS="ubuntu-64" ;;
  *) echo "Windows: download the CLI installer from https://developer.tizen.org/development/tizen-studio/download"; exit 1 ;;
esac
URL="https://download.tizen.org/sdk/Installer/tizen-studio_${VER}/web-cli_Tizen_Studio_${VER}_${OS}.bin"
WORK="$(mktemp -d)"

if [ ! -x "$DEST/package-manager/package-manager-cli.bin" ]; then
  echo "Downloading $URL"
  curl -fL -o "$WORK/installer.bin" "$URL"
  chmod +x "$WORK/installer.bin"
  (cd "$WORK" && ./installer.bin --accept-license "$DEST")
fi

PM="$DEST/package-manager/package-manager-cli.bin"
echo "Installing Samsung TV + certificate extensions (slow server, be patient)…"
"$PM" install --accept-license cert-add-on Certificate-Manager TV-SAMSUNG-Extension-Tools TV-SAMSUNG-Public-WebAppDevelopment
rm -rf "$WORK"
echo "Done. Certificate Manager: $DEST/tools/certificate-manager/"
