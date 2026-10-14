#!/usr/bin/env bash
# Waste2Worth AI — Stop All Services Script

echo "================================================="
echo "   🛑 Stopping Waste2Worth AI Services..."
echo "================================================="

echo "Killing any processes on port 8000 (Backend API)..."
lsof -ti:8000 | xargs kill -9 2>/dev/null || true

echo "Killing any processes on port 3000 (Frontend)..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

echo "Killing any tunnel processes (localtunnel, ngrok, cloudflared, ssh)..."
pkill -f "localtunnel" 2>/dev/null || true
pkill -f "cloudflared" 2>/dev/null || true
pkill -f "ngrok" 2>/dev/null || true
pkill -f "nokey@localhost.run" 2>/dev/null || true

echo "✅ All Waste2Worth AI services and tunnels have been stopped."
