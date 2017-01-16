#/bin/bash
PROJECT=./platforms

cp -rvf ./cordova/wp/Properties/* $PROJECT/wp8/Properties/
cp -rvf ./cordova/wp/MainPage.xaml $PROJECT/wp8/
cp -rvf ./cordova/wp/Package.appxmanifest $PROJECT/wp8/