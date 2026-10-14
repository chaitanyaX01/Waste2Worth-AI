#!/usr/bin/env bash
# Waste2Worth AI — Permanent Live Tunnel Manager
# Ensures a FIXED, STABLE live URL that does NOT regenerate random links.

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
cd "$DIR"

# Load settings from .env if present
if [ -f "$DIR/.env" ]; then
  export $(grep -v '^#' "$DIR/.env" | grep '=' | xargs 2>/dev/null)
fi

PORT="${TUNNEL_PORT:-3000}"

echo "=========================================================="
echo "   🌱 Waste2Worth AI — Permanent Live Tunnel Manager"
echo "=========================================================="
echo "Forwarding local port: $PORT (Frontend + API Gateway)"

# Cleanup on exit
cleanup() {
  echo ""
  echo "Stopping tunnel..."
  pkill -f "ngrok" 2>/dev/null || true
  pkill -f "cloudflared" 2>/dev/null || true
  exit 0
}
trap cleanup SIGINT SIGTERM

# Strategy 1: Ngrok with Permanent Static Domain (Primary & Recommended)
if [ -n "$NGROK_DOMAIN" ]; then
  echo ""
  echo "✨ Mode: Ngrok Permanent Static Domain"
  echo "🌐 Permanent Live URL: https://$NGROK_DOMAIN"
  echo "📱 Scanner Direct:     https://$NGROK_DOMAIN/scanner"
  echo "=========================================================="
  echo "This URL NEVER changes across restarts or disconnects."
  echo "Press Ctrl + C anytime to stop."
  echo "=========================================================="
  ngrok http "$PORT" --domain="$NGROK_DOMAIN"
  exit 0
fi

# Strategy 2: Ngrok with configured authtoken (automatic default domain)
if ngrok config check >/dev/null 2>&1; then
  echo ""
  echo "✨ Starting Ngrok Tunnel..."
  echo "💡 Tip: For a permanent static domain, run ./setup_ngrok.sh"
  echo "=========================================================="
  ngrok http "$PORT"
  exit 0
fi

# Strategy 3: Cloudflare Named Tunnel (If CLOUDFLARE_TUNNEL_TOKEN is set)
if [ -n "$CLOUDFLARE_TUNNEL_TOKEN" ]; then
  echo ""
  echo "✨ Mode: Cloudflare Named Tunnel (Custom Domain)"
  echo "=========================================================="
  cloudflared tunnel run --token "$CLOUDFLARE_TUNNEL_TOKEN"
  exit 0
fi

# Strategy 4: Cloudflare Quick Tunnel (Account-less fallback)
echo ""
echo "⚠️ NGROK_DOMAIN is not set in .env."
echo "👉 For a permanent URL that NEVER changes, run:"
echo "   ./setup_ngrok.sh"
echo ""
echo "Starting Cloudflare Quick Tunnel as temporary fallback..."
echo "=========================================================="
cloudflared tunnel --url "http://127.0.0.1:$PORT"
