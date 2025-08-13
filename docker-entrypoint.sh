#!/bin/bash
set -e

if [ -d "$HOME/.volume-config" ]; then
    sudo chown -R node:node "$HOME/.gitconfig"
    sudo chown -R node:node "$HOME/.ssh"
    sudo chmod 600 -R "$HOME/.ssh" && sudo chmod +x "$HOME/.ssh"  
    echo "Configuration files copied successfully."
fi

exec "$@"
