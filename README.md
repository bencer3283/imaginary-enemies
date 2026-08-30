```
XDG_RUNTIME_DIR=/run/user/$(id -u) WAYLAND_DISPLAY=wayland-0 /usr/lib/chromium/chromium --ozone-platform=wayland --password-store=basic --kiosk --new-window http://localhost:3000/blocks
```

```
XDG_RUNTIME_DIR=/run/user/$(id -u) WAYLAND_DISPLAY=wayland-0 /usr/lib/chromium/chromium --ozone-platform=wayland --password-store=basic --new-window http://localhost:3000/blocks
```

```
XDG_RUNTIME_DIR=/run/user/$(id -u) WAYLAND_DISPLAY=wayland-1 chromium --ozone-platform=wayland --password-store=basic --kiosk --new-window http://localhost:3000/blocks &
```

```
XDG_RUNTIME_DIR=/run/user/$(id -u) WAYLAND_DISPLAY=wayland-0 chromium \
  --ozone-platform=wayland \
  --password-store=basic \
  --user-data-dir=/tmp/chrome-screen1 \
  --window-position=0,0 \
  --window-size=1920,1080 \
  --kiosk \
  --app=http://localhost:3000/blocks &
```

```
XDG_RUNTIME_DIR=/run/user/$(id -u) WAYLAND_DISPLAY=wayland-0 chromium \
  --ozone-platform=wayland \
  --password-store=basic \
  --user-data-dir=/tmp/chrome-screen2 \
  --window-position=1920,0 \
  --window-size=1920,1080 \
  --kiosk \
  --app=http://localhost:3000/scenario &
```

```
XDG_RUNTIME_DIR=/run/user/$(id -u) WAYLAND_DISPLAY=wayland-0 chromium --ozone-platform=x11 --password-store=basic --display=HDMI-A-1 --kiosk --app=http://localhost:3000/blocks
```

under x11:
```
DISPLAY=:0 xrandr --output HDMI-1 --rotate right
```

```
DISPLAY=:0 chromium \
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
```

```
DISPLAY=:0 chromium \
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
```