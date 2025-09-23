#!/bin/bash
# Install additional ESLint plugins for enterprise-grade security and healthcare compliance

echo "Installing additional ESLint plugins for backend..."

npm install --save-dev \
  eslint-plugin-header@latest \
  eslint-plugin-jsdoc@latest \
  eslint-plugin-no-secrets@latest \
  eslint-plugin-pii@latest

echo "ESLint plugins installation complete!"