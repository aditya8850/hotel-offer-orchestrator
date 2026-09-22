#!/bin/sh
set -e

# If running embedded without a separate external Temporal container, start Temporal dev server
if [ -z "$TEMPORAL_ADDRESS" ] || [ "$TEMPORAL_ADDRESS" = "localhost:7233" ] || [ "$TEMPORAL_ADDRESS" = "127.0.0.1:7233" ]; then
  echo "[Startup] Starting embedded Temporal server on 127.0.0.1:7233..."
  temporal server start-dev --ip 127.0.0.1 --port 7233 --headless &
  sleep 4
fi

echo "[Startup] Starting Node.js application..."
exec node dist/index.js
