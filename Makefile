VERSION=`cut -d '"' -f2 $BUILDDIR/../version.js`

sign:
	gpg -u 1112CFA1 --output browser-extensions/chrome/copay-chrome-extension.zip.sig --detach-sig browser-extensions/chrome/copay-chrome-extension.zip
verify: 
	gpg --verify browser-extensions/chrome/copay-chrome-extension.zip.sig browser-extensions/chrome/copay-chrome-extension.zip

chrome:
	grunt prod
	browser-extensions/chrome/build.sh


cordova-base:
	grunt dist-mobile

ios:  cordova-base
	make -C cordova ios
	open cordova/project/platforms/ios/Copay

android: cordova-base
	make -C cordova run-android

release-android: cordova-base
	make -C cordova release-android

wp8:
	cordova/build.sh WP8 
	cordova/wp/fix-svg.sh
	echo -e "\a"


