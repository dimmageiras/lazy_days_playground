
# syntax=docker/dockerfile:1.7
# Base image debian trixie
FROM debian:trixie

# Use bash for the shell
SHELL ["/bin/bash", "-c"]

# Entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Install packages (single layer) and clean apt lists to keep image small
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
     sudo wget curl git openssh-client locales ca-certificates \
  && rm -rf /var/lib/apt/lists/*
# clean in the same layer to actually shrink the image [3](https://stackoverflow.com/questions/61990329/benefits-of-repeated-apt-cache-cleans)

# Configure locale
RUN sed -i -e 's/# en_US.UTF-8 UTF-8/en_US.UTF-8 UTF-8/' /etc/locale.gen && locale-gen
ENV LANG=en_US.UTF-8 LANGUAGE=en_US:en LC_ALL=en_US.UTF-8

# Create user with a *normal* home
RUN groupadd -r full_stack && useradd -m -r -g full_stack -d /home/full_stack full_stack \
  && echo "full_stack ALL=(ALL) NOPASSWD: ALL" > /etc/sudoers.d/full_stack \
  && chmod 0440 /etc/sudoers.d/full_stack \
  && chown -R full_stack:full_stack /home/full_stack
USER full_stack
ENV HOME=/home/full_stack

# Install nvm
ENV NVM_DIR=/home/full_stack/.nvm
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash

# Install Node.js 24
RUN . "$NVM_DIR/nvm.sh" \
  && nvm install 24 \
  && mkdir -p "$NVM_DIR" \
  && ln -s "$(dirname "$(dirname "$(readlink -f "$(command -v node)")")")" "$NVM_DIR/current"

# Make Node available to every shell without sourcing
ENV PATH="$NVM_DIR/current/bin:${PATH}"

# Ensure future interactive shells load nvm and completion
RUN echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.bashrc \
 && echo '[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"' >> ~/.bashrc \
 && echo '[ -s "$NVM_DIR/bash_completion" ] && . "$NVM_DIR/bash_completion"' >> ~/.bashrc

# Install pnpm
RUN wget -qO- https://get.pnpm.io/install.sh | ENV="$HOME/.bashrc" SHELL="$(which bash)" bash -

# Install Gel CLI (installs into ~/.local/bin)
RUN curl https://www.geldata.com/sh --proto "=https" -sSf1 -1 | sh -s -- -y \
  && echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
ENV PATH="/home/full_stack/.local/bin:${PATH}"

# Create project directory and clone the repository
RUN mkdir -p /home/full_stack/lazy_days_playground
RUN git clone https://github.com/dimmageiras/lazy_days_playground.git /home/full_stack/lazy_days_playground

# Default working directory when the container starts (and for subsequent RUN)
WORKDIR /home/full_stack/lazy_days_playground
# docker exec will open here by default [1](https://docs.docker.com/reference/dockerfile/)[2](https://docs.docker.com/engine/containers/run/)

# Set up environment and initialize the project
ENTRYPOINT ["/docker-entrypoint.sh"]
# Keep the container running
CMD ["tail", "-f", "/dev/null"]
