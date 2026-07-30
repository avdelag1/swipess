#!/bin/sh
set -e

# Install node (Xcode Cloud requires this to ensure npm/npx are available in PATH)
brew install node

echo "Navigating to project root..."
cd ../../../

echo "Installing Node dependencies..."
npm ci

echo "Syncing Capacitor plugins and running pod install..."
npx cap sync ios

echo "Done!"
