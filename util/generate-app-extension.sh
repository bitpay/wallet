#! /bin/bash

#Description: A simple script to compile and copy only the needed files for the web app.

ROOTDIR=`pwd`
BASENAME=`basename $ROOTDIR`

if [ $BASENAME = "util" ]; then
  # Moving to root path
  cd ../
fi

# Configs
APPDIR="./webapp"
CHROMEDIR="./chrome-extension"
FIREFOXDIR="./firefox-addon"

LIBDIR="$APPDIR/lib"
DOWNLOADDIR="$APPDIR/download"
CHROMEDOWNLOADDIR="$DOWNLOADDIR/chrome"
FIREFOXDOWNLOADDIR="$DOWNLOADDIR/firefox"

ZIPFILE="copay.zip"
CHROMEZIPFILE="copay-chrome-extension.zip"

OpenColor="\033["
Red="1;31m"
Yellow="1;33m"
Green="1;32m"
CloseColor="\033[0m"

# Check function OK
checkOK() {
  if [ $? != 0 ]; then
    echo -e "${OpenColor}${Red}* ERROR. Exiting...${CloseColor}"
    exit 1
  fi
}

# Create/Clean temp dir
echo -e "${OpenColor}${Green}* Checking temp dir...${CloseColor}"
if [ -d $APPDIR ]; then
  rm -rf $APPDIR
fi

mkdir -p $APPDIR

# Create/Clean chrome-extension dir
if [ -d $CHROMEDIR ]; then
  rm -rf $CHROMEDIR
fi

mkdir -p $CHROMEDIR

# Create/Clean chrome-extension dir
if [ -d $FIREFOXDIR ]; then
  rm -rf $FIREFOXDIR
fi

mkdir -p $FIREFOXDIR

# Re-compile copayBundle.js
echo -e "${OpenColor}${Green}* Generating copay bundle...${CloseColor}"
grunt --target=dev shell
checkOK

# Copy all app files
echo -e "${OpenColor}${Green}* Copying all app files...${CloseColor}"
cp -af {css,font,img,js,lib,sound,config.js,version.js,index.html} $APPDIR
checkOK

# Copy all chrome-extension files
echo -e "${OpenColor}${Green}* Copying all chrome-extension files...${CloseColor}"
cp -af {css,font,img,js,lib,sound,config.js,version.js,index.html,popup.html,manifest.json} $CHROMEDIR
checkOK

# Copy all firefox-addon files
echo -e "${OpenColor}${Green}* Copying all firefox-addon files...${CloseColor}"
cp -af {css,font,img,js,lib,sound,config.js,version.js,index.html,popup.html} $FIREFOXDIR
checkOK

# Zipping apps
echo -e "${OpenColor}${Green}* Zipping all app files...${CloseColor}"
zip -r $ZIPFILE $APPDIR
checkOK

# Zipping chrome-extension
echo -e "${OpenColor}${Green}* Zipping all chrome-extension files...${CloseColor}"
zip -r $CHROMEZIPFILE $CHROMEDIR
checkOK

mkdir -p $CHROMEDOWNLOADDIR
mv $ZIPFILE $DOWNLOADDIR
mv $CHROMEZIPFILE $CHROMEDOWNLOADDIR
cp index-download-chrome.html $CHROMEDOWNLOADDIR/index.html
cp index-download-firefox.html $FIREFOXDOWNLOADDIR/index.html

echo -e "${OpenColor}${Yellow}\nAwesome! Now you have the webapp in ./webapp and the chrome extension files in ./webapp/download/.${CloseColor}"
