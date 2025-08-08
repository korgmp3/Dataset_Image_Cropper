#!/bin/bash

# Version Update Script
# Usage: ./scripts/update-version.sh <new-version> <build-date>

NEW_VERSION=$1
BUILD_DATE=$2

if [ -z "$NEW_VERSION" ] || [ -z "$BUILD_DATE" ]; then
    echo "Usage: $0 <new-version> <build-date>"
    echo "Example: $0 1.3.0 2024-01-20"
    exit 1
fi

echo "Updating version to $NEW_VERSION ($BUILD_DATE)..."

# Update package.json
sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"$NEW_VERSION\"/" frontend/package.json

# Update version.js
sed -i "s/version: \"[^\"]*\"/version: \"$NEW_VERSION\"/" frontend/src/config/version.js
sed -i "s/buildDate: \"[^\"]*\"/buildDate: \"$BUILD_DATE\"/" frontend/src/config/version.js

echo "Version updated successfully!"
echo "New version: $NEW_VERSION"
echo "Build date: $BUILD_DATE"
