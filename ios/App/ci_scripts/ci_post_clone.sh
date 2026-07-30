#!/bin/sh
set -e

echo "Navigating to project root..."
cd ../../../

echo "Installing Node dependencies..."
npm install

echo "Syncing Capacitor plugins and running pod install..."
npx cap sync ios

echo "Done!"
