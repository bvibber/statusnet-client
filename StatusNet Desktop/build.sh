#!/bin/sh
#
# Script to build the Desktop Client without having to use Titanium Developer. Locations of
# The various directories changes from platform to platform. Should work on OS X and Linux;
# Windows, I dunno.
#
# Where the StatusNet Desktop project lives
APP_DIR="$HOME/Documents/Projects/statusnet-client/StatusNet Desktop"
# Main Titanium dir 
TITANIUM_DIR="/Library/Application Support/Titanium"
# Specific SDK version dir
SDK_DIR="$TITANIUM_DIR/sdk/osx/1.0.0"
# Where the build script lives
BUILD_SCRIPT="$SDK_DIR/tibuild.py"
# Output directory for the executable
DIST_DIR="$APP_DIR/dist/osx"

"$BUILD_SCRIPT" -d "$DIST_DIR" -a "$SDK_DIR" -n -r -v -s "$TITANIUM_DIR" "$APP_DIR"
