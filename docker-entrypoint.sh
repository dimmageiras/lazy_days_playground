#!/bin/bash
set -e

# Ensure correct permissions for git and ssh configs
if [ -f "/home/.gitconfig" ]; then
    sudo chown full_stack:full_stack "/home/full_stack/.gitconfig"
fi

if [ -d "/home/.ssh" ]; then
    sudo chown -R full_stack:full_stack "/home/full_stack/.ssh"
    sudo chmod 600 "/home/full_stack/.ssh/"* 2>/dev/null || true
    sudo chmod 700 "/home/full_stack/.ssh"
    echo "SSH and Git configuration permissions updated successfully."
fi

exec "$@"
