#! /bin/bash

#Description: A simple script to compile and copy only the needed files for the web app.

# Configs
APPDIR="webapp"
LIBDIR="$APPDIR/lib"
DOWNLOADDIR="$APPDIR/download"
ZIPFILE="copay_webapp_.zip"

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

# Generate and copy bitcore bundle
if [ ! -d node_modules/bitcore ]; then
  echo -e "${OpenColor}${Red}X The node_modules/bitcore dir does not exist. \nRun npm install and try again.${CloseColor}"
  exit 1
else
  echo -e "${OpenColor}${Green}* Generating bitcore bundle...${CloseColor}"
  cd node_modules/bitcore
  grunt --target=dev shell
  cd ../..
fi

# Re-compile copayBundle.js
echo -e "${OpenColor}${Green}* Generating copay bundle...${CloseColor}"
grunt --target=dev shell

# Copy all app files
echo -e "${OpenColor}${Green}* Copying all app files...${CloseColor}"
cp -af {css,font,img,js,lib,config.js,index.html} $APPDIR
cp -af node_modules/bitcore/browser/bundle.js $LIBDIR/
mv $LIBDIR/bundle.js $LIBDIR/bitcore.js

echo -e "${OpenColor}${Green}* Zipping all app files...${CloseColor}"
zip -r $ZIPFILE $APPDIR
mkdir -p $DOWNLOADDIR
mv $ZIPFILE $DOWNLOADDIR

echo -e "${OpenColor}${Yellow}\nAwesome! You just need to copy and paste the ./webapp content to your local repository and push it.${CloseColor}"
