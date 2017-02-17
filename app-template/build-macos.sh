#!/bin/bash

SHOULD_SIGN=$1
if [ "$SHOULD_SIGN" ]
then
  echo "Will sign the APP"
fi

# by Andy Maloney
# http://asmaloney.com/2013/07/howto/packaging-a-mac-os-x-application-using-a-dmg/

# make sure we are in the correct dir when we double-click a .command file
dir=${0%/*}
if [ -d "$dir" ]; then
  cd "$dir"
fi

# set up your app name, architecture, and background image file name
APP_NAME="*USERVISIBLENAME*"
rm dmg-background.tiff
ln -s ../resources/*PACKAGENAME*/mac/dmg-background.tiff dmg-background.tiff
rm volume-icon.icns
ln -s ../resources/*PACKAGENAME*/mac/volume-icon.icns volume-icon.icns
DMG_VOLUME_ICON="volume-icon.icns"
DMG_BACKGROUND_IMG="dmg-background.tiff"

PATH_NAME="${APP_NAME}/osx64/"
# you should not need to change these
APP_EXE="${PATH_NAME}${APP_NAME}.app/Contents/MacOS/nwjs"

VOL_NAME="${APP_NAME}"
DMG_TMP="${VOL_NAME}-temp.dmg"
DMG_FINAL="${VOL_NAME}.dmg"
STAGING_DIR="tmp"

# Check the background image DPI and convert it if it isn't 72x72
_BACKGROUND_IMAGE_DPI_H=`sips -g dpiHeight ${DMG_BACKGROUND_IMG} | grep -Eo '[0-9]+\.[0-9]+'`
_BACKGROUND_IMAGE_DPI_W=`sips -g dpiWidth ${DMG_BACKGROUND_IMG} | grep -Eo '[0-9]+\.[0-9]+'`

if [ $(echo " $_BACKGROUND_IMAGE_DPI_H != 72.0 " | bc) -eq 1 -o $(echo " $_BACKGROUND_IMAGE_DPI_W != 72.0 " | bc) -eq 1 ]; then
   echo "WARNING: The background image's DPI is not 72.  This will result in distorted backgrounds on Mac OS X 10.7+."
   echo "         I will convert it to 72 DPI for you."

   _DMG_BACKGROUND_TMP="${DMG_BACKGROUND_IMG%.*}"_dpifix."${DMG_BACKGROUND_IMG##*.}"

   sips -s dpiWidth 72 -s dpiHeight 72 ${DMG_BACKGROUND_IMG} --out ${_DMG_BACKGROUND_TMP}

   DMG_BACKGROUND_IMG="${_DMG_BACKGROUND_TMP}"
fi

# clear out any old data
rm -rf "${STAGING_DIR}" "${DMG_TMP}" "${DMG_FINAL}"

# copy over the stuff we want in the final disk image to our staging dir
mkdir -p "${STAGING_DIR}"
cp -rpf "${PATH_NAME}${APP_NAME}.app" "${STAGING_DIR}"
# ... cp anything else you want in the DMG - documentation, etc.

pushd "${STAGING_DIR}"

popd

# Fix size to 250MB
SIZE=250

if [ $? -ne 0 ]; then
   echo "Error: Cannot compute size of staging dir"
   exit
 fi

# Sign Code (MATIAS)
if [ $SHOULD_SIGN ]
then
  echo "Signing ${APP_NAME} DMG"

  export IDENTITY="3rd Party Mac Developer Application: BitPay, Inc. (884JRH5R93)"

  # not need for 'out of app store' distribution (?)
#  export PARENT_PLIST=parent.plist
#  export CHILD_PLIST=child.plist
  export APP_PATH=${STAGING_DIR}/${APP_NAME}.app

  codesign --deep -s "${IDENTITY}"  $APP_PATH"/Contents/Versions/52.0.2743.82/nwjs Helper.app" && echo "Sign 1"
  codesign --deep -s "${IDENTITY}"  $APP_PATH"/Contents/Versions/52.0.2743.82/nwjs Framework.framework/Resources/app_mode_loader.app" && echo "Sign 2"
  codesign --deep -s "${IDENTITY}"  $APP_PATH && echo "Sign 3"
  echo "Signing Done"

fi

# create the temp DMG file
hdiutil create -srcfolder "${STAGING_DIR}" -volname "${VOL_NAME}" -fs HFS+ \
      -fsargs "-c c=64,a=16,e=16" -format UDRW -megabytes ${SIZE} "${DMG_TMP}"

echo "Created DMG: ${DMG_TMP}"

# mount it and save the device
DEVICE=$(hdiutil attach -readwrite -noverify "${DMG_TMP}" | \
         egrep '^/dev/' | sed 1q | awk '{print $1}')

sleep 2

# add a link to the Applications dir
echo "Adding link to /Applications"
pushd /Volumes/"${VOL_NAME}"
# We name the symlink with a *non-breaking space* to avoid displaying extra text
ln -s /Applications " " # <- not your ordinary space
popd

# "bless" the folder to open it in Finder automatically when the volume is mounted
echo "Blessing disk image"
bless --folder /Volumes/"${VOL_NAME}" --openfolder /Volumes/"${VOL_NAME}"

# add a background image
echo "Adding background to disk image"
mkdir /Volumes/"${VOL_NAME}"/.background
cp "${DMG_BACKGROUND_IMG}" /Volumes/"${VOL_NAME}"/.background/

echo "Adding volume icon to disk image"
# we install this here to avoid trying to install it on linux or windows, where
# it fails to install
npm install fileicon
# use fileicon node_module
cp "${DMG_VOLUME_ICON}" /Volumes/"${VOL_NAME}"/.VolumeIcon.icns
`npm bin`/fileicon set /Volumes/"${VOL_NAME}"/ /Volumes/"${VOL_NAME}"/.VolumeIcon.icns

# tell the Finder to resize the window, set the background,
#  change the icon size, place the icons in the right position, etc.
echo "Designing the unboxing experience..."
WINDOW_X=400
WINDOW_Y=100
WINDOW_WIDTH=500
WINDOW_HEIGHT=375
ICON_SIZE=100
ICON_LR_PADDING=140
ICON_Y=185

WINDOW_RIGHT=$(expr $WINDOW_X + $WINDOW_WIDTH)
WINDOW_BOTTOM=$(expr $WINDOW_Y + $WINDOW_HEIGHT)
RIGHT_ICON_PADDING_RIGHT=$(expr $WINDOW_WIDTH - $ICON_LR_PADDING)
HIDE_X=100 # no need to exceed WINDOW_WIDTH – will only create another scrollbar
HIDE_Y=$(expr $WINDOW_HEIGHT + $ICON_SIZE)

echo '
   tell application "Finder"
     tell disk "'${VOL_NAME}'"
           open
           set current view of container window to icon view
           set toolbar visible of container window to false
           set statusbar visible of container window to false
           set the bounds of container window to {'${WINDOW_X}', '${WINDOW_Y}', '${WINDOW_RIGHT}', '${WINDOW_BOTTOM}'}
           set viewOptions to the icon view options of container window
           set arrangement of viewOptions to not arranged
           set icon size of viewOptions to '${ICON_SIZE}'
           set background picture of viewOptions to file ".background:'${DMG_BACKGROUND_IMG}'"
           set position of item "'${APP_NAME}'.app" of container window to {'${ICON_LR_PADDING}', '${ICON_Y}'}
           set position of item " " of container window to {'${RIGHT_ICON_PADDING_RIGHT}', '${ICON_Y}'}
           set position of item ".background" of container window to {'${HIDE_X}', '${HIDE_Y}'}
           set position of item ".VolumeIcon.icns" of container window to {'${HIDE_X}', '${HIDE_Y}'}
           set position of item ".fseventsd" of container window to {'${HIDE_X}', '${HIDE_Y}'}
           set position of item "Icon?" of container window to {'${HIDE_X}', '${HIDE_Y}'}
           close
           open
           update without registering applications
           delay 2
     end tell
   end tell
' | osascript

sync

# unmount it
hdiutil detach "${DEVICE}"

# now make the final image a compressed disk image
echo "Creating compressed image"
hdiutil convert "${DMG_TMP}" -format UDZO -imagekey zlib-level=9 -o "${DMG_FINAL}"

# clean up
rm -rf "${DMG_TMP}"
rm -rf "${STAGING_DIR}"

echo 'Done.'

exit
