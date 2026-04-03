#!/bin/sh
# Start the API server in the background
cd /app && node server/index.js &

# Wait for the API server to be ready
sleep 2

# Start nginx in the foreground
nginx -g 'daemon off;'
