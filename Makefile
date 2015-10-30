VERSION=`cut -d '"' -f2 $BUILDDIR/../version.js`

sign:
	gpg -u 1112CFA1 --output browser-extensions/chrome/copay-chrome-extension.zip.sig --detach-sig browser-extensions/chrome/copay-chrome-extension.zip
verify: 
	gpg --verify browser-extensions/chrome/copay-chrome-extension.zip.sig browser-extensions/chrome/copay-chrome-extension.zip

sign-desktop:
	gpg -u 1112CFA1 --output webkitbuilds/copay-linux32.zip.sig --detach-sig webkitbuilds/copay-linux32.zip
	gpg -u 1112CFA1 --output webkitbuilds/copay-linux64.zip.sig --detach-sig webkitbuilds/copay-linux64.zip
	gpg -u 1112CFA1 --output webkitbuilds/copay-osx32.dmg.sig --detach-sig webkitbuilds/copay-osx32.dmg
	gpg -u 1112CFA1 --output webkitbuilds/copay-osx64.dmg.sig --detach-sig webkitbuilds/copay-osx64.dmg
	gpg -u 1112CFA1 --output webkitbuilds/copay-win32.exe.sig --detach-sig webkitbuilds/copay-win32.exe
	gpg -u 1112CFA1 --output webkitbuilds/copay-win64.exe.sig --detach-sig webkitbuilds/copay-win64.exe

verify-desktop:
	gpg --verify webkitbuilds/copay-linux32.zip.sig webkitbuilds/copay-linux32.zip
	gpg --verify webkitbuilds/copay-linux64.zip.sig webkitbuilds/copay-linux64.zip
	gpg --verify webkitbuilds/copay-osx32.dmg.sig webkitbuilds/copay-osx32.dmg
	gpg --verify webkitbuilds/copay-osx64.dmg.sig webkitbuilds/copay-osx64.dmg
	gpg --verify webkitbuilds/copay-win32.exe.sig webkitbuilds/copay-win32.exe
	gpg --verify webkitbuilds/copay-win64.exe.sig webkitbuilds/copay-win64.exe

chrome:
	browser-extensions/chrome/build.sh

cordova-base:
	grunt dist-mobile

# ios:  cordova-base
# 	make -C cordova ios
# 	open cordova/project/platforms/ios/Copay
#
# android: cordova-base
# 	make -C cordova run-android
#
# release-android: cordova-base
# 	make -C cordova release-android
#
wp8-prod:
	cordova/build.sh WP8 --clear
	cordova/wp/fix-svg.sh
	echo -e "\a"

wp8-debug:
	cordova/build.sh WP8 --dbgjs
	cordova/wp/fix-svg.sh
	echo -e "\a"

ios-prod:
	cordova/build.sh IOS --clear
	cd cordova/project && cordova build ios
	open cordova/project/platforms/ios/Copay.xcodeproj

ios-debug:
	cordova/build.sh IOS --dbgjs
	cd cordova/project && cordova build ios
	open cordova/project/platforms/ios/Copay.xcodeproj

android-prod:
	cordova/build.sh ANDROID --clear
	cp ./etc/beep.ogg ./cordova/project/plugins/phonegap-plugin-barcodescanner/src/android/LibraryProject/res/raw/beep.ogg
	cd cordova/project && cordova build android --release
	jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore ../copay.keystore -signedjar cordova/project/platforms/android/build/outputs/apk/android-release-signed.apk  cordova/project/platforms/android/build/outputs/apk/android-release-unsigned.apk copay_play 
	../android-sdk-macosx/build-tools/21.1.1/zipalign -v 4 cordova/project/platforms/android/build/outputs/apk/android-release-signed.apk cordova/project/platforms/android/build/outputs/apk/android-release-signed-aligned.apk 
	

android-debug:
	cordova/build.sh ANDROID --dbgjs --clear
	cp ./etc/beep.ogg ./cordova/project/plugins/phonegap-plugin-barcodescanner/src/android/LibraryProject/res/raw/beep.ogg
	cd cordova/project && cordova run android

android-debug-fast:
	cordova/build.sh ANDROID --dbgjs
	cp ./etc/beep.ogg ./cordova/project/plugins/phonegap-plugin-barcodescanner/src/android/LibraryProject/res/raw/beep.ogg
	cd cordova/project && cordova run android	
