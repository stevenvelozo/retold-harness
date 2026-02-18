#!/bin/bash

trap 'kill -TERM $PID' TERM INT

# Start the Visual Studio Code Server
/usr/bin/entrypoint.sh --bind-addr "0.0.0.0:8080" . &

PID=$!

sleep 2

# Install the latest pm2 process manager
export HOME=/home/coder
bash -i <(echo "npm install pm2 -g")
# Install the dependencies for node
bash -i <(echo "npm install")
# Rebuild native addons for the container platform (the volume mount
# brings in the host's node_modules which may have Mac/Windows binaries)
bash -i <(echo "npm rebuild better-sqlite3")
# Now run the harness API within the pm2 process manager
bash -i <(echo "pm2 start /home/coder/retold-harness/source/Retold-Harness.js")

wait $PID
trap - TERM INT
wait $PID
EXIT_STATUS=$?
echo "Service exited with status ${EXIT_STATUS}"
