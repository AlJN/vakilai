# Mac Mini Hosting Setup — Claude Runbook
**Execute this file step-by-step using Bash tool. Every command is designed to be run by Claude.**

## Context
- **Goal:** Host adeyas.in and vakilai.in from Mac Mini via Cloudflare Tunnel
- **Method:** Python static servers (per site) + single Cloudflare Tunnel routing both domains
- **Existing:** Mac Mini already has at least one Cloudflare Tunnel running — we extend it
- **Repos:** github.com/AlJN/adeyas-website · github.com/AlJN/vakilai
- **Local ports:** Adeyas → 3001 · VakilAI → 3000

## How to use this file
Open Claude Code on the Mac Mini and say:
> "Follow CLAUDE_SETUP.md step by step"
Claude reads each step, runs the Bash command, checks the output, and proceeds.

---

## PHASE 1 — Verify Environment

### 1.1 Check OS and user
```bash
sw_vers && whoami && echo "Home: $HOME"
```
Expected: macOS version, your username, home directory path.

### 1.2 Check workspace and repos
```bash
ls ~/ws/ 2>/dev/null || echo "ws directory missing"
```
If `adeyas` and `vakilai` folders are missing, clone them:
```bash
mkdir -p ~/ws && cd ~/ws
git clone https://github.com/AlJN/adeyas-website adeyas
git clone https://github.com/AlJN/vakilai vakilai
```

### 1.3 Check Homebrew
```bash
brew --version 2>/dev/null || echo "MISSING: install Homebrew first"
```
If missing:
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 1.4 Check cloudflared
```bash
which cloudflared && cloudflared --version
```
If missing:
```bash
brew install cloudflare/cloudflare/cloudflared
```

### 1.5 Check cloudflared authentication
```bash
cloudflared tunnel list 2>&1
```
Expected: a list of tunnels (even if empty list).
If you see "not authenticated" or an error:
```bash
cloudflared tunnel login
# This opens a browser — user must click Authorize in Cloudflare dashboard
```

### 1.6 Discover existing tunnel setup
```bash
# Find existing tunnel configs
find ~/.cloudflared /etc/cloudflared ~/Library -name "*.yml" -o -name "*.yaml" 2>/dev/null | grep -i cloudflare | head -20
```
```bash
# List all tunnels
cloudflared tunnel list
```
**Save the output — you need the tunnel NAME and tunnel ID for Phase 3.**

### 1.7 Check what's already running on our ports
```bash
lsof -i :3000 -i :3001 | grep LISTEN
```
If anything is on 3000 or 3001, note the PID and process name.

---

## PHASE 2 — Set Up Static File Servers

We use Python's built-in HTTP server for each site. Both run as permanent launchd services (auto-start on boot, auto-restart on crash).

### 2.1 Create launchd plist for Adeyas (port 3001)

**Replace `/Users/alokjain` below with the actual home directory from Step 1.1 if different.**

```bash
sudo tee /Library/LaunchDaemons/in.adeyas.website.plist > /dev/null << 'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>in.adeyas.website</string>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/bin/python3</string>
    <string>-m</string>
    <string>http.server</string>
    <string>3001</string>
  </array>
  <key>WorkingDirectory</key>
  <string>/Users/alokjain/ws/adeyas</string>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>/tmp/adeyas-website.log</string>
  <key>StandardErrorPath</key>
  <string>/tmp/adeyas-website-error.log</string>
</dict>
</plist>
PLIST
```

### 2.2 Create launchd plist for VakilAI (port 3000)

```bash
sudo tee /Library/LaunchDaemons/in.vakilai.website.plist > /dev/null << 'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>in.vakilai.website</string>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/bin/python3</string>
    <string>-m</string>
    <string>http.server</string>
    <string>3000</string>
  </array>
  <key>WorkingDirectory</key>
  <string>/Users/alokjain/ws/vakilai</string>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>/tmp/vakilai-website.log</string>
  <key>StandardErrorPath</key>
  <string>/tmp/vakilai-website-error.log</string>
</dict>
</plist>
PLIST
```

### 2.3 Load and start both services

```bash
# Unload first if already loaded (safe to run even if not loaded)
sudo launchctl unload /Library/LaunchDaemons/in.adeyas.website.plist 2>/dev/null
sudo launchctl unload /Library/LaunchDaemons/in.vakilai.website.plist 2>/dev/null

# Load and start
sudo launchctl load /Library/LaunchDaemons/in.adeyas.website.plist
sudo launchctl load /Library/LaunchDaemons/in.vakilai.website.plist
```

### 2.4 Verify both sites are up
```bash
sleep 2
curl -s -o /dev/null -w "Adeyas (3001): %{http_code}\n" http://localhost:3001
curl -s -o /dev/null -w "VakilAI (3000): %{http_code}\n" http://localhost:3000
```
Both must return `200`. If not, check logs:
```bash
cat /tmp/adeyas-website-error.log
cat /tmp/vakilai-website-error.log
```

---

## PHASE 3 — Configure Cloudflare Tunnel

### 3.1 Decide: extend existing tunnel OR create new ones

**Option A — Extend existing tunnel (recommended if one already exists)**
```bash
# Get your existing tunnel name from Step 1.6 output
# Then find its config file:
cloudflared tunnel list
```
Note the tunnel name (e.g. `macmini-home`) and ID (UUID).

```bash
# Find the config file location
ls ~/.cloudflared/
```
There will be a `<tunnel-id>.json` (credentials) and possibly a `config.yml`.

**Option B — Create a new dedicated tunnel for these sites**
```bash
cloudflared tunnel create adeyas-vakilai
# Note the tunnel ID printed — you need it below
```

### 3.2 Write the tunnel config file

**If extending existing tunnel** — edit `~/.cloudflared/config.yml` to add the new ingress rules.

**If creating new tunnel** — create `~/.cloudflared/config.yml` fresh.

Replace `YOUR_TUNNEL_ID` with the actual UUID from Step 3.1:

```bash
# First check if config.yml already exists
cat ~/.cloudflared/config.yml 2>/dev/null || echo "No config.yml yet"
```

**If config.yml exists and has ingress rules already**, add to it carefully.
**If config.yml does not exist**, create it:

```bash
# Replace YOUR_TUNNEL_ID with actual UUID
TUNNEL_ID="YOUR_TUNNEL_ID"

cat > ~/.cloudflared/config.yml << EOF
tunnel: ${TUNNEL_ID}
credentials-file: /Users/alokjain/.cloudflared/${TUNNEL_ID}.json

ingress:
  - hostname: adeyas.in
    service: http://localhost:3001
  - hostname: www.adeyas.in
    service: http://localhost:3001
  - hostname: vakilai.in
    service: http://localhost:3000
  - hostname: www.vakilai.in
    service: http://localhost:3000
  - hostname: app.vakilai.in
    service: http://localhost:3000
  # ADD YOUR EXISTING SITE RULES ABOVE THIS LINE
  - service: http_status:404
EOF
```

> **If you already had ingress rules**, add the new ones BEFORE the final `http_status:404` catch-all line.

### 3.3 Validate the config
```bash
cloudflared tunnel --config ~/.cloudflared/config.yml ingress validate
```
Expected: `OK` for each rule. Fix any errors before proceeding.

### 3.4 Add DNS routes (run once per hostname)
```bash
TUNNEL_ID="YOUR_TUNNEL_ID"
cloudflared tunnel route dns $TUNNEL_ID adeyas.in
cloudflared tunnel route dns $TUNNEL_ID www.adeyas.in
cloudflared tunnel route dns $TUNNEL_ID vakilai.in
cloudflared tunnel route dns $TUNNEL_ID www.vakilai.in
cloudflared tunnel route dns $TUNNEL_ID app.vakilai.in
```
Each command creates a CNAME record in Cloudflare DNS automatically.
Expected output: `Added CNAME ... to DNS`

### 3.5 Set up cloudflared as a launchd service

```bash
# This installs cloudflared as a system service (auto-start on boot)
sudo cloudflared service install
```

If you already had it installed as a service (from your existing project), just restart it:
```bash
sudo launchctl stop com.cloudflare.cloudflared
sudo launchctl start com.cloudflare.cloudflared
```

### 3.6 Verify tunnel is running
```bash
sleep 3
cloudflared tunnel info 2>/dev/null | head -20
# OR check the process
pgrep -la cloudflared
```

---

## PHASE 4 — End-to-End Verification

### 4.1 Test sites are reachable via Cloudflare
```bash
# Give Cloudflare DNS ~30 seconds to propagate first
sleep 30
curl -s -o /dev/null -w "adeyas.in: %{http_code}\n" https://adeyas.in
curl -s -o /dev/null -w "vakilai.in: %{http_code}\n" https://vakilai.in
```
Both should return `200`. If you get `000` or `5xx`, wait another 60 seconds and try again.

### 4.2 Verify HTTPS is working
```bash
curl -vI https://adeyas.in 2>&1 | grep -E "SSL|HTTP|issuer|subject"
```
Should show Cloudflare as the SSL issuer.

### 4.3 Check all services are running
```bash
echo "=== Port check ==="
lsof -i :3000 -i :3001 | grep LISTEN

echo "=== launchd services ==="
sudo launchctl list | grep -E "adeyas|vakilai|cloudflare"

echo "=== Tunnel status ==="
cloudflared tunnel list
```

---

## PHASE 5 — Update Workflow (Day-to-day)

### Pull latest code from GitHub and deploy instantly
```bash
cd ~/ws/adeyas && git pull && echo "Adeyas updated"
cd ~/ws/vakilai && git pull && echo "VakilAI updated"
# Static files — no restart needed, changes live immediately
```

### Restart a site server if needed
```bash
sudo launchctl stop in.adeyas.website && sudo launchctl start in.adeyas.website
sudo launchctl stop in.vakilai.website && sudo launchctl start in.vakilai.website
```

### Restart the Cloudflare tunnel
```bash
sudo launchctl stop com.cloudflare.cloudflared
sudo launchctl start com.cloudflare.cloudflared
```

### Check logs
```bash
tail -50 /tmp/adeyas-website.log
tail -50 /tmp/vakilai-website.log
sudo tail -50 /var/log/cloudflared.log 2>/dev/null || journalctl -u cloudflared 2>/dev/null | tail -50
```

---

## PHASE 6 — Troubleshooting Playbook

### Site returns 404 or 502
```bash
# Step 1: Is the local server running?
curl http://localhost:3001   # Should return HTML
curl http://localhost:3000

# Step 2: Is cloudflared running?
pgrep -la cloudflared

# Step 3: Is the tunnel connected?
cloudflared tunnel list

# Step 4: Check config is valid
cloudflared tunnel --config ~/.cloudflared/config.yml ingress validate

# Step 5: Restart everything
sudo launchctl stop in.adeyas.website && sudo launchctl start in.adeyas.website
sudo launchctl stop in.vakilai.website && sudo launchctl start in.vakilai.website
sudo launchctl stop com.cloudflare.cloudflared && sudo launchctl start com.cloudflare.cloudflared
```

### Domain not resolving
```bash
# Check DNS propagation
dig adeyas.in CNAME +short
# Should return something like: <tunnel-id>.cfargotunnel.com
```
If empty, re-run Step 3.4 (DNS route commands).

### cloudflared login expired
```bash
cloudflared tunnel login
# Re-authenticate in browser, then restart service
sudo launchctl stop com.cloudflare.cloudflared && sudo launchctl start com.cloudflare.cloudflared
```

### Ports 3000/3001 already in use after reboot
```bash
# Find conflicting process
lsof -i :3000 | grep LISTEN
lsof -i :3001 | grep LISTEN
# Kill it, then restart launchd service
kill -9 <PID>
sudo launchctl start in.vakilai.website
sudo launchctl start in.adeyas.website
```

---

## Summary — What Runs After Full Setup

| Service | Port | URL | Auto-starts | Managed by |
|---------|------|-----|-------------|------------|
| Adeyas website | 3001 | https://adeyas.in | ✅ Boot | launchd |
| VakilAI website | 3000 | https://vakilai.in | ✅ Boot | launchd |
| Cloudflare Tunnel | — | Routes both domains | ✅ Boot | launchd |
| Existing website | unchanged | unchanged | unchanged | unchanged |

**No ports open on your router. No static IP needed. Automatic HTTPS. Free.**

---

## One-liner health check (run anytime)
```bash
echo "--- Services ---" && sudo launchctl list | grep -E "adeyas|vakilai|cloudflare" && echo "--- Ports ---" && lsof -i :3000 -i :3001 | grep LISTEN && echo "--- Tunnel ---" && cloudflared tunnel list
```
