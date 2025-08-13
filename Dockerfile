# Base image with Node.js 24 (matches package.json engine requirement)
FROM node:24.5-bookworm

# Set shell to bash
SHELL ["/bin/bash", "-c"]


# Entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Install sudo
RUN  apt-get update && apt-get install -y sudo

# Add sudoers file
RUN echo "node ALL=(ALL) NOPASSWD: ALL" > /etc/sudoers.d/node && chmod 0440 /etc/sudoers.d/node

# Switch to node user
USER node

# Install pnpm
RUN wget -qO- https://get.pnpm.io/install.sh | ENV="$HOME/.bashrc" SHELL="$(which bash)" bash -

# Upgrade npm
RUN sudo npm -g upgrade

# Install npm-check-updates
RUN sudo npm -g i npm-check-updates

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["tail", "-f", "/dev/null"]
