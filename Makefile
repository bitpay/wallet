sign:
	gpg -u 1112CFA1 --output browser-extensions/chrome/copay-chrome-extension.zip.sig --detach-sig browser-extensions/chrome/copay-chrome-extension.zip
verify: 
	gpg --verify browser-extensions/chrome/copay-chrome-extension.zip.sig browser-extensions/chrome/copay-chrome-extension.zip

ios:
	cordova/build.sh
	cd cordova/project && cordova build ios
	open cordova/project/platforms/ios/Copay.xcodeproj

ios-debug:
	cordova/build.sh --dbgjs
	cd cordova/project && cordova build ios
	open cordova/project/platforms/ios/Copay.xcodeproj

android:
	cordova/build.sh --android 
	cd cordova/project && cordova run android

chrome:
	browser-extensions/chrome/build.sh

