FROM debian:bookworm-slim

# Install git, ssh client, and common utilities
RUN apt-get update && apt-get install -y \
    git \
    openssh-client \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Configure git safe directory for the mounted volume
RUN git config --global --add safe.directory /repos

ARG GITHUB_EMAIL
ARG GITHUB_USERNAME
RUN git config --global user.email "${GITHUB_EMAIL}" && \
    git config --global user.name "${GITHUB_USERNAME}"

WORKDIR /repos

CMD ["bash"]
