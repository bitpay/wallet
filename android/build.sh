#! /bin/bash

# Description: This script compiles and copy the needed files to later package the application for Android

OpenColor="\033["
Red="1;31m"
Yellow="1;33m"
Green="1;32m"
CloseColor="\033[0m"

# Check function OK
checkOK() {
  if [ $? != 0 ]; then
    echo "${OpenColor}${Red}* ERROR. Exiting...${CloseColor}"
    exit 1
  fi
}

# Configs
BUILDDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
APPDIR="$BUILDDIR/package"
VERSION=`git describe --tags --abbrev=0 | cut -c 2-`

# Move to the build directory
cd $BUILDDIR

[ -z "$CROSSWALK" ] && { echo "${OpenColor}${Red}* Need to set CROSSWALK environment variable${CloseColor}"; exit 1; }

# Create/Clean temp dir
echo "${OpenColor}${Green}* Checking temp dir...${CloseColor}"
if [ -d $APPDIR ]; then
  rm -rf $APPDIR
fi

mkdir -p $APPDIR

# Re-compile copayBundle.js
echo "${OpenColor}${Green}* Generating copay bundle...${CloseColor}"
grunt --target=dev shell
checkOK

# Copy all app files
echo "${OpenColor}${Green}* Copying all app files...${CloseColor}"
sed "s/APP_VERSION/$VERSION/g" manifest.json > $APPDIR/manifest.json
cd $BUILDDIR/..
cp -af {css,font,img,js,lib,sound,config.js,version.js,index.html,./android/icon.png} $APPDIR
checkOK

# Building the APK
echo "${OpenColor}${Green}* Building APK file...${CloseColor}"
cd $CROSSWALK
python make_apk.py --manifest=$APPDIR/manifest.json --target-dir=$BUILDDIR --arch=arm
checkOK
cd $BUILDDIR

echo "${OpenColor}${Yellow}\nAwesome! We have a brand new APK, enjoy it!${CloseColor}"
