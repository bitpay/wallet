#! /bin/bash

# Description: This script compiles and copy the needed files to later package the application for Chrome

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
APPDIR="$BUILDDIR/copay-chrome-extension"
ZIPFILE="copay-chrome-extension.zip"
VERSION=`git describe --tags --abbrev=0 | cut -c 2-`

# Move to the build directory
cd $BUILDDIR

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

# Copy all chrome-extension files
echo "${OpenColor}${Green}* Copying all chrome-extension files...${CloseColor}"
sed "s/APP_VERSION/$VERSION/g" manifest.json > $APPDIR/manifest.json
checkOK

cd $BUILDDIR/..
cp -af {css,font,img,js,lib,sound,config.js,version.js,index.html,./popup.html} $APPDIR
checkOK

# Zipping chrome-extension
echo "${OpenColor}${Green}* Zipping all chrome-extension files...${CloseColor}"
cd $BUILDDIR
zip -r $ZIPFILE "`basename $APPDIR`"
checkOK

echo "${OpenColor}${Yellow}\nAwesome! We have a brand new Chome Extension, enjoy it!${CloseColor}"
