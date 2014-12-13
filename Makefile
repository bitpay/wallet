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
	cordova/build.sh --android --dbgjs
	cd cordova/project && cordova run android

android-prod:
	cordova/build.sh --release
	cd cordova/project && cordova build android --release



chrome:
	grunt prod
	browser-extensions/chrome/build.sh

