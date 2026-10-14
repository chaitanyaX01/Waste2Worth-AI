#!/usr/bin/env bash
# Waste2Worth AI — All-in-One Startup Script

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
cd "$DIR"

echo "================================================="
echo "   🌱 Starting Waste2Worth AI Platform"
echo "================================================="

# Free up ports 8000 and 3000 if they are already in use
echo "🧹 Freeing ports 8000 and 3000 from any previous runs..."
lsof -ti:8000 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
sleep 1

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
    lsof -ti:8000 | xargs kill -9 2>/dev/null || true
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    pkill -f "localtunnel" 2>/dev/null || true
    pkill -f "cloudflared" 2>/dev/null || true
    pkill -f "ngrok" 2>/dev/null || true
    echo "All services stopped."
    exit 0
}
trap cleanup SIGINT SIGTERM

echo "⏳ Waiting for servers to initialize..."
sleep 3

echo ""
echo "================================================="
echo "   ✅ Waste2Worth AI is LIVE and READY!"
echo "================================================="
echo " 🌐 Local Website:    http://localhost:3000"
echo " 📚 Backend API Docs: http://localhost:8000/docs"
echo "================================================="

# Automatically open in browser on macOS
if command -v open >/dev/null 2>&1; then
    open "http://localhost:3000" || true
fi

# 3. Permanent Public Online Tunnel
echo ""
echo "3️⃣ Launching Persistent Live Tunnel..."
"$DIR/tunnel.sh" || {
    echo "Falling back to local waiting..."
    wait $FRONTEND_PID $BACKEND_PID
}

