"""Prepare the generated Capacitor Android project for an API 36 release."""
import os
import re
from pathlib import Path


def replace_setting(filename, pattern, replacement):
    path = Path(filename)
    updated, matches = re.subn(pattern, replacement, path.read_text())
    if matches != 1:
        raise ValueError(f"Expected one {pattern} setting in {filename}")
    path.write_text(updated)


for setting in ("compileSdkVersion", "targetSdkVersion"):
    replace_setting("android/variables.gradle", rf"{setting} = [0-9]+", f"{setting} = 36")
replace_setting("android/build.gradle", r"com.android.tools.build:gradle:[0-9.]+", "com.android.tools.build:gradle:8.9.2")
replace_setting("android/gradle/wrapper/gradle-wrapper.properties", r"gradle-[0-9.]+-(all|bin)", r"gradle-8.11.1-\1")
build = int(os.environ["GITHUB_RUN_NUMBER"])
replace_setting("android/app/build.gradle", r"versionCode [0-9]+", f"versionCode {build}")
