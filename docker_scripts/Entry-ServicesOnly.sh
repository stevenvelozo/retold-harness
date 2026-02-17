#!/bin/sh

# Rebuild native addons for the container platform (the volume mount
# brings in the host's node_modules which may have Mac/Windows binaries)
npm rebuild better-sqlite3
npm start
