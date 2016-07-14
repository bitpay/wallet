.PHONY:  ios android wp 

all:

clean: 
	rm -Rf build-*



build-android build-ios build-wp:  config.xml
	cordova create $@ com.bitpay.copay Copay
	cp ProjectMakefile $@/Makefile
	sed "s/<\!-- PLACEHOLDER: CORDOVA SRIPT -->/<script type='text\/javascript' charset='utf-8' src='cordova.js'><\/script>/g" ../public/index.html > $@/www/index.html
	cp config.xml $@/config.xml
	make -C $@  $(subst build-,, $@)	

android: build-android 
	mkdir -p build-android/platforms/android/res/xml/
	cp android/build-extras.gradle build-android/platforms/android/build-extras.gradle
	cp android/project.properties build-android/platforms/android/project.properties
	cp -R android/res/* build-android/platforms/android/res
	cp -af ../public/** $</www

ios: build-ios
	cp -af ../public/** $</www
	open build-ios/platforms/ios/Copay.xcodeproj
	
wp: build-wp
	cp -vf wp/Properties/* $</platforms/wp8/Properties/
	cp -vf wp/MainPage.xaml $</platforms/wp8/
	cp -vf wp/Package.appxmanifest $</platforms/wp8/
	cp -vf wp/Assets/* $</platforms/wp8/Assets/
	cp -vf wp/SplashScreenImage.jpg $</platforms/wp8/
	cp -vf wp/ApplicationIcon.png $</platforms/wp8/
	cp -vf wp/Background.png $</platforms/wp8/
	cp -af ../public/** $</www
	wp/fix-svg.sh


run-android:
	make -C $(subst run-,build-,$@) run
	adb logcat | grep copay.js
