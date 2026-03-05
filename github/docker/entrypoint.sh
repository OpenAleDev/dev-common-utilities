#!/bin/bash
set -e

echo ">> Variabili ambiente GitHub:" > logEntryPoint.log
echo "   > GITHUB_EMAIL: ${GITHUB_EMAIL}" >> logEntryPoint.log
echo "   > GITHUB_USERNAME: ${GITHUB_USERNAME}">> logEntryPoint.log


# Set git identity at runtime from environment variables
if [ -n "${GITHUB_EMAIL}" ]; then
    git config --global user.email "${GITHUB_EMAIL}"
fi

if [ -n "${GITHUB_USERNAME}" ]; then
    git config --global user.name "${GITHUB_USERNAME}"
fi

exec "$@"
