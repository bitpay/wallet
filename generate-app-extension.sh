#! /bin/bash

#Description: A simple script to compile and copy only the needed files for the web app.

# Configs
APPDIR="webapp"
CHROMEDIR="chrome-extension"

LIBDIR="$APPDIR/lib"
DOWNLOADDIR="$APPDIR/download"

ZIPFILE="copay.zip"
CHROMEZIPFILE="copay-chrome-extension.zip"

OpenColor="\033["
Red="1;31m"
Yellow="1;33m"
Green="1;32m"
CloseColor="\033[0m"

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

# Re-compile copayBundle.js
echo -e "${OpenColor}${Green}* Generating copay bundle...${CloseColor}"
grunt --target=dev shell

# Copy all app files
echo -e "${OpenColor}${Green}* Copying all app files...${CloseColor}"
cp -af {css,font,img,js,lib,sound,config.js,index.html} $APPDIR

# Copy all chrome-extension files
echo -e "${OpenColor}${Green}* Copying all chrome-extension files...${CloseColor}"
cp -af {css,font,img,js,lib,sound,config.js,index.html,popup.html,manifest.json} $CHROMEDIR

# Zipping apps
echo -e "${OpenColor}${Green}* Zipping all app files...${CloseColor}"
zip -r $ZIPFILE $APPDIR

# Zipping chrome-extension
echo -e "${OpenColor}${Green}* Zipping all chrome-extension files...${CloseColor}"
zip -r $CHROMEZIPFILE $CHROMEDIR

mkdir -p $DOWNLOADDIR
mv $ZIPFILE $DOWNLOADDIR
mv $CHROMEZIPFILE $DOWNLOADDIR

echo -e "${OpenColor}${Yellow}\nAwesome! Now you have the webapp in ./webapp and the chrome extension files in ./webapp/download/.${CloseColor}"
