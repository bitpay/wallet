.PHONY:  ios android wp

WORKDIR=project-

all:

clean:
	rm -Rf $(WORKDIR)*


$(WORKDIR)android $(WORKDIR)ios $(WORKDIR)wp:  config.xml
	cordova create $@ com.bitpay.*NAMENOSPACE* *NAMECASENOSPACE* || echo "Project Path Existed"
	cp ProjectMakefile $@/Makefile
	rm -r $@/www && ln -sF ../../public $@/www
	cp config.xml $@/config.xml
	make -C $@  $(subst $(WORKDIR),, $@)

ios: $(WORKDIR)ios
	make -C $(WORKDIR)ios build-ios

android: project-android
	mkdir -p android/platforms/android/res/xml/
	cp android/build-extras.gradle  $(WORKDIR)android/platforms/android/build-extras.gradle
	cp android/project.properties  $(WORKDIR)android/platforms/android/project.properties
	cp -R android/res/*  $(WORKDIR)android/platforms/android/res
	make -C $(WORKDIR)android build-android


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


androidrun:
	make -C $(WORKDIR)android run
	adb logcat | grep copay.js
