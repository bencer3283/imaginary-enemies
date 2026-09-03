#!/bin/bash

# Ensure DISPLAY and XAUTHORITY are set
export PATH="/home/dev/.nvm/versions/node/v24.20.0/bin/:$PATH"
export DISPLAY=:0
export XAUTHORITY=$HOME/.Xauthority

# 1. Rotate Displays
xrandr --output HDMI-1 --rotate right
xrandr --output HDMI-2 --rotate right

# 2. Launch Backend Services

# Load user environment variables and NVM/Node if installed
[ -f "$HOME/.profile" ] && source "$HOME/.profile"
[ -f "$HOME/.bashrc" ] && source "$HOME/.bashrc"

# Run Node in background with output captured
(cd "$HOME/Desktop/imaginary-enemies-web/web-app/my-app" && /home/dev/.nvm/versions/node/v24.20.0/bin/npm run start) > "$HOME/node_startup.log" 2>&1 &

# Run Python in background with output captured
(cd "$HOME/Desktop/imaginary-enemies-web/gpio-websocket" && ./venv/bin/python server.py) > "$HOME/python_startup.log" 2>&1 &

# 3. Wait for Node.js server to become ready
sleep 5

# 4. Launch Chromium Instances
chromium \
  --no-first-run \
  --no-default-browser-check \
  --disable-sync \
  --disable-background-networking \
  --disable-session-crashed-bubble \
  --disable-infobars \
  --password-store=basic \
  --user-data-dir=/tmp/chrome-screen1 \
  --window-position=0,0 \
  --window-size=1080,1920 \
  --kiosk http://localhost:3000/blocks >/dev/null 2>&1 &

chromium \
  --no-first-run \
  --no-default-browser-check \
  --disable-sync \
  --disable-background-networking \
  --disable-session-crashed-bubble \
  --disable-infobars \
  --password-store=basic \
  --user-data-dir=/tmp/chrome-screen2 \
  --window-position=1080,0 \
  --window-size=1080,1920 \
  --kiosk http://localhost:3000/scenario >/dev/null 2>&1 &