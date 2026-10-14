#!/usr/bin/env bash
# Waste2Worth AI — 1-Minute Permanent Ngrok Live URL Setup

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
cd "$DIR"

echo "=========================================================="
echo "   🚀 Waste2Worth AI — Permanent Ngrok Live URL Setup"
echo "=========================================================="
echo "Ngrok gives 1 FREE permanent static domain for life."
echo "Your URL will NEVER change, NEVER expire, and NEVER drop."
echo "=========================================================="
echo ""

# 1. Check / prompt for Authtoken
if ! ngrok config check >/dev/null 2>&1; then
  echo "📌 STEP 1: Get your free Ngrok Authtoken"
  echo "   Open: https://dashboard.ngrok.com/get-started/your-authtoken"
  echo "   (Sign in free with Google or GitHub)"
  echo ""
  read -r -p "👉 Paste your Ngrok Authtoken: " AUTHTOKEN
  AUTHTOKEN=$(echo "$AUTHTOKEN" | tr -d '[:space:]')
  
  if [ -n "$AUTHTOKEN" ]; then
    ngrok config add-authtoken "$AUTHTOKEN"
    echo "✅ Authtoken configured successfully!"
  else
    echo "⚠️ No token provided. Exiting."
    exit 1
  fi
else
  echo "✅ Ngrok authtoken is already configured on this machine."
fi

echo ""
# 2. Check / prompt for Static Domain
echo "📌 STEP 2: Claim your free Static Domain"
echo "   Open: https://dashboard.ngrok.com/cloud-edge/domains"
echo "   Click 'New Domain' (e.g. happy-tiger-123.ngrok-free.app)"
echo ""
read -r -p "👉 Paste your Static Domain (e.g. happy-tiger-123.ngrok-free.app): " DOMAIN
DOMAIN=$(echo "$DOMAIN" | tr -d '[:space:]' | sed 's~http[s]*://~~g' | sed 's~/.*~~g')

if [ -z "$DOMAIN" ]; then
  echo "⚠️ No domain provided. Please rerun ./setup_ngrok.sh when ready."
  exit 1
fi

# Save to .env
if [ -f "$DIR/.env" ]; then
  if grep -q "^NGROK_DOMAIN=" "$DIR/.env"; then
    sed -i '' "s|^NGROK_DOMAIN=.*|NGROK_DOMAIN=\"$DOMAIN\"|g" "$DIR/.env"
  elif grep -q "^# NGROK_DOMAIN=" "$DIR/.env"; then
    sed -i '' "s|^# NGROK_DOMAIN=.*|NGROK_DOMAIN=\"$DOMAIN\"|g" "$DIR/.env"
  else
    echo "NGROK_DOMAIN=\"$DOMAIN\"" >> "$DIR/.env"
  fi
else
  echo "NGROK_DOMAIN=\"$DOMAIN\"" > "$DIR/.env"
fi

echo "✅ Saved NGROK_DOMAIN=\"$DOMAIN\" in .env"
echo ""
echo "=========================================================="
echo "🎉 SUCCESS! Your permanent live URL is configured:"
echo "🌐 Website URL: https://$DOMAIN"
echo "📱 Scanner URL: https://$DOMAIN/scanner"
echo "=========================================================="
echo ""
echo "To launch everything (Backend + Frontend + Permanent Tunnel):"
echo "👉 ./start.sh"
echo ""
