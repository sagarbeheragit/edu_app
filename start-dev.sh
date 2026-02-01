#!/usr/bin/env bash
set -e

# Run from the project root (script auto-changes to its directory)
cd "$(dirname "$0")"

echo "Starting Vite dev server (accessible on network)..."

# Start Vite and make the dev server available on the local network
npm run dev -- --host
