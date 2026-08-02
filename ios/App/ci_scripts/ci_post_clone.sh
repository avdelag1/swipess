#!/bin/sh
set -e

# Export UTF-8 encoding for CocoaPods
export LANG=en_US.UTF-8

# Install node (Xcode Cloud requires this to ensure npm/npx are available in PATH)
brew install node

echo "Navigating to project root..."
cd ../../../

echo "Installing Node dependencies..."
npm ci

echo "Building web app..."
npm run build

echo "Syncing Capacitor plugins and running pod install..."
npx cap sync ios

echo "Done!"
