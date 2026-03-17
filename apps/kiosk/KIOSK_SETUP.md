# Kiosk Terminal Setup Guide

This guide explains how to configure a kiosk terminal to automatically launch the Timely DTR kiosk app in full-screen kiosk mode on boot.

---

## Serving the Built Kiosk App

Before configuring autostart, build the kiosk app and serve it statically.

```bash
# From the repo root
npx turbo run build --filter=@repo/kiosk

# Serve with the `serve` package (install once: npm install -g serve)
serve -s apps/kiosk/dist -l 5175
```

Alternatively, configure nginx to serve `apps/kiosk/dist` on port 5175. The autostart configurations below assume the app is reachable at `http://localhost:5175`.

---

## Linux (Raspberry Pi / Ubuntu Desktop)

### 1. Install Chromium

```bash
sudo apt update
sudo apt install chromium-browser
```

### 2. Create the autostart entry

Create the autostart file at `~/.config/autostart/kiosk.desktop`:

```ini
[Desktop Entry]
Type=Application
Name=Timely Kiosk
Exec=chromium-browser --kiosk --noerrdialogs --disable-infobars --no-first-run http://localhost:5175
Hidden=false
X-GNOME-Autostart-enabled=true
```

> On Raspberry Pi OS the binary may be `chromium-browser` or `chromium` — check with `which chromium-browser`.

### 3. Disable screen saver / DPMS

Add these lines to `~/.config/autostart/disable-screensaver.desktop` or run them in a startup script:

```bash
xset s off
xset -dpms
xset s noblank
```

Or create a second `.desktop` entry:

```ini
[Desktop Entry]
Type=Application
Name=Disable Screensaver
Exec=bash -c "xset s off && xset -dpms && xset s noblank"
Hidden=false
X-GNOME-Autostart-enabled=true
```

### 4. (Optional) Auto-login

For a dedicated kiosk machine, enable auto-login for the kiosk user so the desktop starts without interaction:

```bash
# Raspberry Pi OS
sudo raspi-config   # System Options → Auto Login → Desktop Autologin
```

---

## Windows

### Option A — Startup Shortcut

1. Press `Win + R`, type `shell:startup`, and press Enter.
2. Right-click inside the folder and choose **New → Shortcut**.
3. Set the target to:
   ```
   "C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk --no-first-run http://localhost:5175
   ```
4. Name the shortcut **Timely Kiosk** and click Finish.

Chrome will launch in kiosk mode the next time the user logs in.

### Option B — Task Scheduler (runs at login for any user)

1. Open **Task Scheduler** (`taskschd.msc`).
2. Click **Create Basic Task**.
3. Set the trigger to **When the user logs on**.
4. Set the action to **Start a program**:
   - Program: `C:\Program Files\Google\Chrome\Application\chrome.exe`
   - Arguments: `--kiosk --no-first-run http://localhost:5175`
5. Finish and enable the task.

### Option C — Group Policy (enterprise / managed devices)

Use the `HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run` registry key or a GPO startup script targeting the kiosk user account.

---

## Notes

- **Port**: The kiosk app runs on port `5175` by default. Update the URL if your deployment uses a different port or a remote server address.
- **Offline resilience**: The kiosk app caches employee photos locally. Network loss during operation only affects photo fetching; time-in/time-out scans still record locally.
- **Exiting kiosk mode**: Press `Alt + F4` (Linux/Windows) or `Ctrl + W` to close Chrome when kiosk mode is active.
