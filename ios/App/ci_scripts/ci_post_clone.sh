#!/bin/sh

echo "Navigating to ios/App directory..."
cd ..

echo "Installing CocoaPods..."
export HOMEBREW_NO_AUTO_UPDATE=1
brew install cocoapods

echo "Running pod install..."
pod install
