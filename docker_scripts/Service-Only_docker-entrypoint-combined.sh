#!/bin/bash
set -e

# This script will:
# 1. Start MariaDB (via the official entrypoint) in the background
# 2. Wait until MariaDB is ready
# 3. Start the Node app using pm2-runtime

# If first argument looks like an option, assume it's for mysqld (same behavior as official entrypoint)
if [ "${1:0:1}" = '-' ]; then
  set -- mysqld "$@"
fi

# Start MariaDB using the original entrypoint in the background
# The official MariaDB image's entrypoint is still at this path
/usr/local/bin/docker-entrypoint.sh mysqld "$@" &

# Wait for MariaDB to be ready
echo "Waiting for MariaDB to be ready..."
until mariadb-admin ping -h "127.0.0.1" --silent; do
  sleep 1
done
echo "MariaDB is up."

# Load nvm and use Node 22
export NVM_DIR=/usr/local/nvm
# shellcheck disable=SC1091
. "$NVM_DIR/nvm.sh"

# Move to app directory
cd /usr/src/app

echo "Starting Node app with pm2-runtime..."
# pm2-runtime keeps the process in the foreground (PID 1) for Docker
exec pm2-runtime ecosystem.config.js
