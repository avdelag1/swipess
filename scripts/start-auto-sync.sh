#!/bin/bash

# Start GitHub auto-sync in background
# Usage: ./scripts/start-auto-sync.sh

cd "$(dirname "$0")/.."

echo "🚀 Starting GitHub auto-sync (runs every 5 minutes)..."
echo "📝 Logs saved to: .git/auto-sync.log"
echo ""
echo "To check sync status: tail -f .git/auto-sync.log"
echo "To stop: pkill -f auto-sync-github.js"
echo ""

nohup node scripts/auto-sync-github.js > /dev/null 2>&1 &
echo "✅ Auto-sync started in background"
