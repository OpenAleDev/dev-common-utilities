FROM debian:bookworm-slim

# Install git, ssh client, and common utilities
RUN apt-get update && apt-get install -y \
    git \
    openssh-client \
    curl \
    ca-certificates \
    dos2unix \
    && rm -rf /var/lib/apt/lists/*

# Configure git safe directory for the mounted volume
RUN git config --global --add safe.directory /repos

# Copy and register the entrypoint (sets git identity at runtime from env vars)
COPY entrypoint.sh /entrypoint.sh
RUN dos2unix /entrypoint.sh && chmod +x /entrypoint.sh

WORKDIR /repos

ENTRYPOINT ["/entrypoint.sh"]
CMD ["bash"]
