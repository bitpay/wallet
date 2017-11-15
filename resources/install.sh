echo "Installing sketchtool... (this requires Sketch.app)"
# This installs sketchtool: https://www.sketchapp.com/tool/
sh /Applications/Sketch.app/Contents/Resources/sketchtool/install.sh

echo "Installing imagemagick... (This requires Homebrew)"
# This requires Homebrew: http://brew.sh/
brew install imagemagick
# imagemagick provides the `convert` utility, used to generate ICO files
