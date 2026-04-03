#!/bin/sh
# Start the API server in the background
cd /app && node server/index.js &

# Start nginx in the foreground
nginx -g 'daemon off;'
