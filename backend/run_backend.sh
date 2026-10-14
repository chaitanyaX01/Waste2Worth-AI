#!/usr/bin/env bash
# Waste2Worth Backend Server Launcher
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
VENV_PYTHON="$PROJECT_ROOT/.venv/bin/python"

echo "=================================================="
echo "    Starting Waste2Worth FastAPI Backend Server   "
echo "=================================================="

if [ -f "$VENV_PYTHON" ]; then
    PYTHON_CMD="$VENV_PYTHON"
else
    PYTHON_CMD="python3"
fi

echo "Using Python: $PYTHON_CMD"
echo "Binding to: http://0.0.0.0:8000 (accessible by Android Emulator at http://10.0.2.2:8000)"

cd "$SCRIPT_DIR"
exec "$PYTHON_CMD" -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload

