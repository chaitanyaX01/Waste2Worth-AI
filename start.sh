#!/usr/bin/env bash
# Waste2Worth AI — All-in-One Startup Script

set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
cd "$DIR"

echo "================================================="
echo "   🌱 Starting Waste2Worth AI Platform"
echo "================================================="

# Check PostgreSQL
if command -v pg_isready >/dev/null 2>&1; then
    if ! pg_isready >/dev/null 2>&1; then
        echo "⚠️ PostgreSQL is not ready. Attempting to start via brew..."
        brew services start postgresql@14 || brew services start postgresql || true
        sleep 2
    fi
fi

# 1. Start FastAPI Backend
echo "1️⃣ Starting Backend API (port 8000)..."
"$DIR/.venv/bin/python" -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

# 2. Start Next.js Frontend
echo "2️⃣ Starting Frontend Server (port 3000)..."
cd "$DIR/frontend"
npm run start -- -p 3000 -H 0.0.0.0 &
FRONTEND_PID=$!
cd "$DIR"

# Cleanup on exit (Ctrl+C)
cleanup() {
    echo ""
    echo "================================================="
    echo "   🛑 Shutting down Waste2Worth AI services..."
    echo "================================================="
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    echo "All services stopped."
    exit 0
}
trap cleanup SIGINT SIGTERM

sleep 3

# 3. Start Cloudflare Tunnel
echo "3️⃣ Starting Cloudflare Public Online Tunnel..."
echo "================================================="
echo " Your public HTTPS website link will appear below:"
echo " (Press Ctrl + C anytime to stop all servers)"
echo "================================================="
cloudflared tunnel --url http://localhost:3000
