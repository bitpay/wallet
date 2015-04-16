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
VERSION=`cut -d '"' -f2 $BUILDDIR/../../src/js/version.js|head -n 1`

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
grunt
checkOK

# Copy all chrome-extension files
echo "${OpenColor}${Green}* Copying all chrome-extension files...${CloseColor}"
sed "s/APP_VERSION/$VERSION/g" manifest.json > $APPDIR/manifest.json
checkOK

 
INCLUDE=`cat ../include`
INITIAL=$BUILDDIR/initial.js
echo "INITIAL: $INITIAL"
cp -vf $INITIAL $APPDIR

cd $BUILDDIR/../../public
CMD="rsync -rLRv --exclude-from $BUILDDIR/../exclude $INCLUDE $APPDIR"
echo $CMD
$CMD
checkOK

# Zipping chrome-extension
echo "${OpenColor}${Green}* Zipping all chrome-extension files...${CloseColor}"
cd $BUILDDIR
rm $ZIPFILE
zip -qr $ZIPFILE "`basename $APPDIR`"
checkOK

echo "${OpenColor}${Yellow}\nThe Chrome Extension is ready at $BUILDDIR/copay-chrome-extension.zip${CloseColor}"
