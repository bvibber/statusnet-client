#!/bin/sh
#
# Script to build/run the iPhone version of StatusNet Mobile
# without having to go through Titanium Developer
#
SDK_VERSION=1.4.1
TITANIUM_DIR="/Library/Application Support/Titanium/mobilesdk/osx/$SDK_VERSION"
APP_DIR="$HOME/Documents/Projects/statusnet-client/StatusNet Mobile"

"$TITANIUM_DIR"/titanium.py run --dir="$APP_DIR" --platform=iPhone

