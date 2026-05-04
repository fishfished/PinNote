#!/usr/bin/env bash
# Start Next.js production server on port 3001 for Tauri to connect to.
# Called automatically by `bun run tauri:build` via beforeBuildCommand.
set -e

echo "→ Building Next.js..."
bun run build

echo "→ Starting Next.js server on :3001 (background)..."
PORT=3001 bun run start &
NEXT_PID=$!

# Wait until the server is accepting connections
echo "→ Waiting for server..."
for i in $(seq 1 30); do
  if curl -sf http://localhost:3001 > /dev/null 2>&1; then
    echo "→ Server ready."
    break
  fi
  sleep 1
done

# Keep server alive for Tauri build; Tauri will kill it when done
wait $NEXT_PID
