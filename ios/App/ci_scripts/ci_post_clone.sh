#!/bin/sh
echo "Navigating to ios/App directory..."
cd ..

echo "Running pod install..."
# Xcode Cloud already has CocoaPods installed, no need to use brew.
pod install
