# Mobile building

## Requisites
* [Install Android SDK](https://developer.android.com/sdk/installing/index.html?pkg=tools)
* [Install XCode for IOS](https://itunes.apple.com/en/app/xcode/id497799835?mt=12)
* Install Cordova: ``sudo npm install -g cordova``
* Install Copay dependecies: ``bower install && npm install``
* Install Java-SDK and Apache Ant

## Build the project

    $ sh cordova/build.sh [--android]
    $ cd cordova/project
    $ cordova run android
    $ cordova emulate ios

## Build for release

    $ cordova build android --release
