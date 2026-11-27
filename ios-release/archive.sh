#!/usr/bin/env bash
set -euo pipefail
root="$PWD"
archive="$root/build/Afterlight.xcarchive"
args=(-workspace ios/App/App.xcworkspace -scheme App -configuration Release -destination 'generic/platform=iOS' -archivePath "$archive")
if [[ "${UPLOAD_TESTFLIGHT:-false}" == true ]]; then
  : "${APPLE_TEAM_ID:?Set the Apple development team ID in GitHub secrets}"
  : "${ASC_KEY_ID:?Set the App Store Connect API key ID in GitHub secrets}"
  : "${ASC_ISSUER_ID:?Set the API issuer ID in GitHub secrets}"
  : "${ASC_PRIVATE_KEY:?Set the App Store Connect private key in GitHub secrets}"
  umask 077
  keyfile="$(mktemp -d)/AuthKey_${ASC_KEY_ID}.p8"
  trap 'rm -f "$keyfile"' EXIT
  printf '%s\n' "$ASC_PRIVATE_KEY" > "$keyfile"
  unset ASC_PRIVATE_KEY
  auth=(-allowProvisioningUpdates -authenticationKeyPath "$keyfile" -authenticationKeyID "$ASC_KEY_ID" -authenticationKeyIssuerID "$ASC_ISSUER_ID")
  xcodebuild "${args[@]}" "${auth[@]}" DEVELOPMENT_TEAM="$APPLE_TEAM_ID" CODE_SIGN_STYLE=Automatic CURRENT_PROJECT_VERSION="$GITHUB_RUN_NUMBER" archive
  plist="$RUNNER_TEMP/afterlight-export.plist"
  plutil -create xml1 "$plist"
  for pair in method:app-store-connect destination:upload signingStyle:automatic teamID:"$APPLE_TEAM_ID"; do
    plutil -insert "${pair%%:*}" -string "${pair#*:}" "$plist"
  done
  xcodebuild -exportArchive -archivePath "$archive" -exportOptionsPlist "$plist" -exportPath "$root/build/export" "${auth[@]}"
else
  xcodebuild "${args[@]}" CODE_SIGNING_ALLOWED=NO CURRENT_PROJECT_VERSION="$GITHUB_RUN_NUMBER" archive
fi
app="$archive/Products/Applications/App.app"
test "$(plutil -extract CFBundleIdentifier raw "$app/Info.plist")" = com.fieldnot.afterlight
test "$(plutil -extract DTPlatformName raw "$app/Info.plist")" = iphoneos
test -s "$app/public/index.html"
test -s "$app/Assets.car"
lipo "$app/App" -verify_arch arm64
ditto -c -k --keepParent "$archive" "$root/build/Afterlight-device.zip"
