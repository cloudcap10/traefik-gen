#!/bin/bash

# Bob doesn't need to edit this! It finds the folder automatically.
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
cd "$SCRIPT_DIR"

# 1. Get the latest code from Bob's GitHub
git fetch origin master

LOCAL=$(git rev-parse @)
REMOTE=$(git rev-parse @{u})

if [ $LOCAL != $REMOTE ]; then
    echo "Changes detected! Updating your Home Lab..."
    git pull origin master
    
    # 2. Find every folder with a compose.yml and make sure it is running
    # This also handles NEW apps Bob just added via the web tool!
    find . -maxdepth 2 -name "compose.yml" | while read -r file; do
        app_dir=$(dirname "$file")
        echo "Checking app in: $app_dir"
        cd "$app_dir"
        docker compose up -d --remove-orphans
        cd "$SCRIPT_DIR"
    done
    echo "All apps are up to date."
else
    echo "No changes on GitHub. Everything is stable."
fi
