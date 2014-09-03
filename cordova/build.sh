#! /bin/bash

# Usage:
# sh ./build.sh --android --reload

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
PROJECT="$BUILDDIR/project"
VERSION=`cut -d '"' -f2 $BUILDDIR/../version.js`

SKIPIOS=false
CLEAR=false

# Check Args
if [[ $1 = "--android" || $2 = "--android" ]]
then
  SKIPIOS=true
fi

if [[ $1 = "--clear" || $2 = "--clear" ]]
then
  CLEAR=true
fi


echo "${OpenColor}${Green}* Checking dependencies...${CloseColor}"
command -v cordova >/dev/null 2>&1 || { echo >&2 "Cordova is not present, please install it: sudo npm -g cordova."; exit 1; }
command -v xcodebuild >/dev/null 2>&1 || { echo >&2 "XCode is not present, install it or use [--android]."; exit 1; }


# Create project dir
if [[ CLEAR ]]
then
  if [ -d $PROJECT ]; then
    rm -rf $PROJECT
  fi
fi

if [ ! -d $PROJECT ]; then
  cd $BUILDDIR
  echo "${OpenColor}${Green}* Creating project... ${CloseColor}"
  cordova create project com.bitpay.copay Copay
  checkOK

  cd $PROJECT
  echo "${OpenColor}${Green}* Adding Android platform... ${CloseColor}"
  cordova platforms add android
  checkOK

  if [[ !SKIPIOS ]]; then
    echo "${OpenColor}${Green}* Adding IOS platform... ${CloseColor}"
    cordova platforms add ios
    checkOK
  fi

  echo "${OpenColor}${Green}* Installing plugins... ${CloseColor}"
  cordova plugin add https://github.com/Initsogar/cordova-webintent.git
  checkOK

  cordova plugin add https://github.com/wildabeast/BarcodeScanner.git
  checkOK

  cordova plugin add https://github.com/VersoSolutions/CordovaClipboard
  checkOK

  cordova plugin add de.appplant.cordova.plugin.email-composer && cordova prepare
  checkOK

  cordova plugin add https://github.com/EddyVerbruggen/Toast-PhoneGap-Plugin.git && cordova prepare
  checkOK

  cordova plugin add org.apache.cordova.splashscreen
  checkOK

  cordova plugin add org.apache.cordova.statusbar
  checkOK
fi

echo "${OpenColor}${Green}* Generating copay bundle...${CloseColor}"
cd $BUILDDIR/..
grunt
checkOK

echo "${OpenColor}${Green}* Coping files...${CloseColor}"
cd $BUILDDIR/..
cp -af {css,font,img,js,lib,sound,views,config.js,version.js} $PROJECT/www
checkOK

sed "s/<\!-- PLACEHOLDER: CORDOVA SRIPT -->/<script type='text\/javascript' charset='utf-8' src='cordova.js'><\/script>/g" index.html > $PROJECT/www/index.html
checkOK

cd $BUILDDIR
cp config.xml $PROJECT/config.xml
checkOK

cp android/AndroidManifest.xml $PROJECT/platforms/android/AndroidManifest.xml
checkOK

cp android/config.xml $PROJECT/platforms/android/res/xml/config.xml
checkOK

cp -R ios/icons $PROJECT/platforms/ios/Copay/Resources/icons
checkOK

cp -R ios/splash $PROJECT/platforms/ios/Copay/Resources/splash
checkOK



