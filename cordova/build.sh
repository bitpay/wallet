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
  echo "## Android project"

  mkdir -p $PROJECT/platforms/android/res/xml/
  checkOK

#  cp android/AndroidManifest.xml $PROJECT/platforms/android/AndroidManifest.xml
#  checkOK

  cp android/build-extras.gradle $PROJECT/platforms/android/build-extras.gradle
  checkOK

  cp android/project.properties $PROJECT/platforms/android/project.properties
  checkOK

  mkdir -p $PROJECT/scripts
  checkOK

  cp scripts/* $PROJECT/scripts
  checkOK

  cp -R android/res/* $PROJECT/platforms/android/res
  checkOK
fi

if [ $CURRENT_OS == "WP8" ]; then
  echo "## WP8 PROJECT, $PWD, $PROJECT"
  cp -R $PROJECT/www/* $PROJECT/platforms/wp8/www
  # if ! $CLEAR
  # then
  #   cp -vf wp/Properties/* $PROJECT/platforms/wp8/Properties/
  #   checkOK
  #   cp -vf wp/MainPage.xaml $PROJECT/platforms/wp8/
  #   checkOK
  #   cp -vf wp/Package.appxmanifest $PROJECT/platforms/wp8/
  #   checkOK
  #   cp -vf wp/Assets/* $PROJECT/platforms/wp8/Assets/
  #   cp -vf wp/SplashScreenImage.jpg $PROJECT/platforms/wp8/
  #   cp -vf wp/ApplicationIcon.png $PROJECT/platforms/wp8/
  #   cp -vf wp/Background.png $PROJECT/platforms/wp8/
  #   checkOK
  # fi
  wp/fix-svg.sh
fi
