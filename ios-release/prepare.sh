#!/usr/bin/env bash
set -euo pipefail
assets=ios/App/App/Assets.xcassets/AppIcon.appiconset
cp ios-release/AppIcon.png "$assets/Afterlight.png"
cat > "$assets/Contents.json" <<'JSON'
{"images":[{"filename":"Afterlight.png","idiom":"universal","platform":"ios","size":"1024x1024"}],"info":{"author":"xcode","version":1}}
JSON
