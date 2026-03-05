#!/bin/bash
set -e

echo ">> Variabili ambiente GitHub:" > logEntryPoint.log
echo "   > GITHUB_EMAIL: ${GITHUB_EMAIL}" >> logEntryPoint.log
echo "   > GITHUB_USERNAME: ${GITHUB_USERNAME}">> logEntryPoint.log

# Copy SSH keys from host-mounted staging dir and fix permissions
if [ -d /root/.ssh-host ]; then
    mkdir -p /root/.ssh
    cp /root/.ssh-host/* /root/.ssh/ 2>/dev/null || true
    chmod 700 /root/.ssh
    chmod 600 /root/.ssh/id_ed25519 2>/dev/null || true
    chmod 644 /root/.ssh/id_ed25519.pub 2>/dev/null || true
    # Add github.com to known_hosts to avoid interactive prompt
    ssh-keyscan -H github.com >> /root/.ssh/known_hosts 2>/dev/null
fi

# Set git identity at runtime from environment variables
if [ -n "${GITHUB_EMAIL}" ]; then
    git config --global user.email "${GITHUB_EMAIL}"
fi

if [ -n "${GITHUB_USERNAME}" ]; then
    git config --global user.name "${GITHUB_USERNAME}"
fi

exec "$@"
