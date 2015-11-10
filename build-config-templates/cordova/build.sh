#! /bin/bash
#
# Usage:
# sh ./build.sh --android --reload
#
#
# Check function OK
checkOK() {
  if [ $? != 0 ]; then
    echo "${OpenColor}${Red}* ERROR. Exiting...${CloseColor}"
    exit 1
  fi
}

generateIconsAndSplash() {
  mkdir -p project/resources
  checkOK

  cp ../brands/%BRAND-ID%/resources/psd/icon.psd project/resources
  checkOK

  cp ../brands/%BRAND-ID%/resources/psd/splash.psd project/resources
  checkOK

  cd project
  ionic resources
  checkOK
  cd ..
}

# Configs
BUILDDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT="$BUILDDIR/project"

CURRENT_OS=$1
CURRENT_BRAND=$2

if [ -z "CURRENT_OS" ]
then
 echo "Build.sh WP8|ANDROID|IOS <brand-id>"
fi

CLEAR=false
DBGJS=false

if [[ $3 == "--clear" || $4 == "--clear" ]]
then
  CLEAR=true
fi

if [[ $3 == "--dbgjs" || $4 == "--dbgjs" ]]
then
  DBGJS=true
fi


echo "${OpenColor}${Green}* Checking dependencies...${CloseColor}"
command -v cordova >/dev/null 2>&1 || { echo >&2 "Cordova is not present, please install it: sudo npm -g cordova."; exit 1; }
#command -v xcodebuild >/dev/null 2>&1 || { echo >&2 "XCode is not present, install it or use [--android]."; exit 1; }

# Create project dir
if $CLEAR
then
  if [ -d $PROJECT ]; then
    rm -rf $PROJECT
  fi
fi

echo "Build directory is $BUILDDIR"
echo "Project directory is $PROJECT"
echo "Brand is $CURRENT_BRAND"


if [ ! -d $PROJECT ]; then
  cd $BUILDDIR
  echo "${OpenColor}${Green}* Creating project... ${CloseColor}"
  cordova create project %APP-PACKAGE-NAME% %APP-SHORT-CAMEL-NAME%
  checkOK

  cd $PROJECT

  if [ $CURRENT_OS == "ANDROID" ]; then
    echo "${OpenColor}${Green}* Adding Android platform... ${CloseColor}"
    cordova platforms add android
    checkOK
  fi

  if [ $CURRENT_OS == "IOS" ]; then
    echo "${OpenColor}${Green}* Adding IOS platform... ${CloseColor}"
    cordova platforms add ios
    checkOK
  fi

  if [ $CURRENT_OS == "WP8" ]; then
    echo "${OpenColor}${Green}* Adding WP8 platform... ${CloseColor}"
    cordova platforms add wp8
    checkOK
  fi

  echo "${OpenColor}${Green}* Installing plugins... ${CloseColor}"

  cordova plugin add https://github.com/florentvaldelievre/virtualartifacts-webIntent.git
  checkOK

  cordova plugin add https://github.com/phonegap/phonegap-plugin-barcodescanner.git
  checkOK

  cordova plugin add cordova-plugin-splashscreen
  checkOK

  cordova plugin add cordova-plugin-statusbar
  checkOK

  cordova plugin add https://github.com/EddyVerbruggen/LaunchMyApp-PhoneGap-Plugin.git --variable URL_SCHEME=bitcoin
  checkOK

  cordova plugin add cordova-plugin-inappbrowser
  checkOK

  cordova plugin add cordova-plugin-x-toast && cordova prepare
  checkOK

  cordova plugin add https://github.com/VersoSolutions/CordovaClipboard
  checkOK

  cordova plugin add https://github.com/katzer/cordova-plugin-email-composer.git#f53df5c31c50d4f39d214a5cbe49abb0c5727a49
  checkOK

  cordova plugin add https://github.com/EddyVerbruggen/SocialSharing-PhoneGap-Plugin.git && cordova prepare
  checkOK

  cordova plugin add hu.dpal.phonegap.plugins.spinnerdialog
  checkOK

  cordova plugin add cordova-plugin-dialogs
  checkOK

  cordova plugin add cordova-plugin-network-information
  checkOK

  cordova plugin add cordova-plugin-console
  checkOK

  cordova plugin add hu.dpal.phonegap.plugins.uniquedeviceid
  checkOK

  cordova plugin add cordova-plugin-file
  checkOK

  cordova plugin add cordova-plugin-touch-id && cordova prepare
  checkOK

  cordova plugin add cordova-plugin-transport-security
  checkOK

  cordova plugin add cordova-ios-requires-fullscreen
  checkOK

fi

if $DBGJS
then
  echo "${OpenColor}${Green}* Generating %APP-SHORT-CAMEL-NAME% bundle (debug js)...${CloseColor}"
  cd $BUILDDIR/..
  grunt --target=$CURRENT_BRAND
  checkOK
else
  echo "${OpenColor}${Green}* Generating %APP-SHORT-CAMEL-NAME% bundle...${CloseColor}"
  cd $BUILDDIR/..
  grunt --target=$CURRENT_BRAND prod
  checkOK
fi

echo "${OpenColor}${Green}* Copying files...${CloseColor}"
cd $BUILDDIR/..
cp -af public/** $PROJECT/www
checkOK

sed "s/<\!-- PLACEHOLDER: CORDOVA SRIPT -->/<script type='text\/javascript' charset='utf-8' src='cordova.js'><\/script>/g" public/index.html > $PROJECT/www/index.html
checkOK

cd $BUILDDIR

cp config.xml $PROJECT/config.xml
checkOK

if [ $CURRENT_OS == "ANDROID" ]; then
  echo "Android project!!!"

  cp android/build-extras.gradle $PROJECT/platforms/android/build-extras.gradle
  checkOK

  cp android/project.properties $PROJECT/platforms/android/project.properties
  checkOK

  generateIconsAndSplash

fi

if [ $CURRENT_OS == "IOS" ]; then

  echo "IOS project!!!"

  cp ios/%APP-SHORT-CAMEL-NAME%-Info.plist $PROJECT/platforms/ios/%APP-SHORT-CAMEL-NAME%-Info.plist
  checkOK

  generateIconsAndSplash

fi

if [ $CURRENT_OS == "WP8" ]; then
  echo "Wp8 project!!!"
  cp -af $PROJECT/www/* $PROJECT/platforms/wp8/www
  checkOK

  generateIconsAndSplash

  if ! $CLEAR
  then
    cp wp/Properties/* $PROJECT/platforms/wp8/Properties/
    checkOK

    cp wp/MainPage.xaml $PROJECT/platforms/wp8/
    checkOK

    cp wp/Package.appxmanifest $PROJECT/platforms/wp8/
    checkOK
  fi
fi
