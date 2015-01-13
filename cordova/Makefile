.PHONY: plugins android wp8 ios clean

all:

#  grunt dist-mobile-dbg

plugins:
	make -C project plugins

project: 
	cordova create project com.bitpay.copay DGBWallet
	cp config.xml project/config.xml
	cp ProjectMakefile project/Makefile
	cp -af ../dist/web/** project/www
	sed "s/<\!-- PLACEHOLDER: CORDOVA SRIPT -->/<script type='text\/javascript' charset='utf-8' src='cordova.js'><\/script>/g" ../index.html > project/www/index.html

 
android: project plugins
	mkdir -p project/platforms/android/res/xml/
	cp android/AndroidManifest.xml project/platforms/android/AndroidManifest.xml
	cp android/project.properties project/platforms/android/project.properties
	cp -R android/res/* project/platforms/android/res
	make -C project android

wp8: project plugins
	make -C project wp8
	cp -R project/www/* project/platforms/wp8/www
	cp -R wp/res/* project/platforms/wp/res

ios: project plugins
	make -C project ios
	cp ios/DGBWallet-Info.plist project/platforms/ios/DGBWallet-Info.plist
	mkdir -p project/platforms/ios/DGBWallet/Resources/icons
	mkdir -p project/platforms/ios/DGBWallet/Resources/splash
	cp -R ios/icons/* project/platforms/ios/DGBWallet/Resources/icons
	cp -R ios/splash/* project/platforms/ios/DGBWallet/Resources/splash

open-ios: ios
	open project/platforms/ios/DGBWallet.xcodeproj

run-android: android
	make -C project run-android

release-android: android 
	make -C project release-android

clean:
	rm -rf project


