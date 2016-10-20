# This script requires Sketch on macOS – see readme.md for details

# export all slices marked for export to the proper directory
echo "Exporting all assets from src.sketch..."
sketchtool export layers src.sketch

function postprocess {
  echo "Beginning postprocessing for $1..."

  echo "Postprocessing assets for macOS..."
  iconset $1 app
  iconset $1 volume-icon

  echo "Creating Retina-ready DMG background..."
  tiffutil -cathidpicheck $1/mac/dmg-background.png $1/mac/dmg-background@2x.png -out $1/mac/dmg-background.tiff
  echo "Removing raw background pngs..."
  rm $1/mac/dmg-background.png $1/mac/dmg-background@2x.png
}

function iconset {
  echo "Converting $1 $2 iconset to icns..."
  iconutil --convert icns $1/mac/$2.iconset --output $1/mac/$2.icns
  echo "Removing $1 $2 iconset..."
  rm -r $1/mac/$2.iconset
}

postprocess copay
postprocess bitpay
