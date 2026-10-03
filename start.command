#!/bin/bash
# STRATA — local preview. Double-click this file in Finder.
cd "$(dirname "$0")"
export PATH="/opt/homebrew/bin:/usr/local/bin:$HOME/.bun/bin:$HOME/.volta/bin:$PATH"
[ -s "$HOME/.nvm/nvm.sh" ] && . "$HOME/.nvm/nvm.sh"
if ! command -v npm >/dev/null 2>&1; then
  echo "Node.js не найден. Установите его с https://nodejs.org (LTS) и запустите этот файл снова."
  read -n 1 -s -r -p "Нажмите любую клавишу…"; exit 1
fi
[ -d node_modules ] || npm install
echo ""
echo "STRATA → http://localhost:5288"
npm run dev
