# This script requires Sketch on macOS – see readme.md for details

# export all slices marked for export to the proper directory
echo "Exporting all assets from src.sketch..."
# sketchtool is installed by install.sh
sketchtool export layers src.sketch

function postprocess {
  # $1 = distribution name
  echo "Beginning postprocessing for $1..."

  echo "Postprocessing assets for macOS..."
  iconset $1 app
  iconset $1 volume-icon

  echo "Creating Retina-ready DMG background..."
  tiffutil -cathidpicheck $1/mac/dmg-background.png $1/mac/dmg-background@2x.png -out $1/mac/dmg-background.tiff
  echo "Removing raw background pngs..."
  rm $1/mac/dmg-background.png $1/mac/dmg-background@2x.png

  echo "Postprocessing assets for Windows..."

  echo "Combining windows/ico pngs into a single ICO file..."
  # convert ships with imagemagick
  convert $1/windows/ico/ico_16x16.png $1/windows/ico/ico_24x24.png $1/windows/ico/ico_32x32.png $1/windows/ico/ico_48x48.png $1/windows/ico/ico_64x64.png $1/windows/ico/ico_128x128.png $1/windows/ico/ico_256x256.png $1/windows/icon.ico
  echo "Removing raw windows/ico pngs..."
  rm -r $1/windows/ico/* && rmdir $1/windows/ico
}

function iconset {
  echo "Converting $1 $2 iconset to icns..."
  iconutil --convert icns $1/mac/$2.iconset --output $1/mac/$2.icns
  echo "Removing $1 $2 iconset..."
  rm -r $1/mac/$2.iconset
}

postprocess copay
postprocess bitpay
