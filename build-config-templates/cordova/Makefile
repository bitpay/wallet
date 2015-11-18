.PHONY: plugins android wp8 ios clean

all:

#  grunt --target=%APP-EXE-NAME% dist-mobile-dbg

plugins:
	make -C project plugins

project: 
	cordova create project %APP-PACKAGE-NAME% %APP-SHORT-CAMEL-NAME%
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
	cp ios/%APP-SHORT-NAME%-Info.plist project/platforms/ios/%APP-SHORT-NAME%-Info.plist
	mkdir -p project/platforms/ios/%APP-SHORT-CAMEL-NAME%/Resources/icons
	mkdir -p project/platforms/ios/%APP-SHORT-CAMEL-NAME%/Resources/splash

	mkdir project/resources
	cp ../brands/%BRAND-ID%/resources/icon.psd project/resources
	cp ../brands/%BRAND-ID%/resources/splash.psd project/resources
	cd project; ionic resources
	cp -R project/resources/ios/icon/* project/platforms/ios/%APP-SHORT-CAMEL-NAME%/Resources/icons
	cp -R project/resources/ios/splash/* project/platforms/ios/%APP-SHORT-CAMEL-NAME%/Resources/splash

open-ios: ios
	open project/platforms/ios/%APP-SHORT-CAMEL-NAME%.xcodeproj

run-android: android
	make -C project run-android

release-android: android 
	make -C project release-android

clean:
	rm -rf project


