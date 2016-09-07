.PHONY:  ios android wp

WORKDIR=project-

all:

clean:
	rm -Rf $(WORKDIR)*


$(WORKDIR)android $(WORKDIR)ios:  config.xml
	cordova create $@ com.bitpay.*NAMENOSPACE* *NAMECASENOSPACE* || echo "Project Path Existed"
	cp ProjectMakefile $@/Makefile
	rm -r $@/www && ln -sF ../../public $@/www
	cp config.xml $@/config.xml
	make -C $@  $(subst $(WORKDIR),, $@)

ios: $(WORKDIR)ios
	make -C $(WORKDIR)ios build-ios

android: project-android
	mkdir -p android/platforms/android/res/xml/
	mkdir -p $(WORKDIR)android/scripts
	cp -R scripts/* $(WORKDIR)android/scripts
	cp android/build-extras.gradle  $(WORKDIR)android/platforms/android/build-extras.gradle
	cp android/project.properties  $(WORKDIR)android/platforms/android/project.properties
	cp -R android/res/*  $(WORKDIR)android/platforms/android/res
	make -C $(WORKDIR)android build-android

wp-init: config.xml
	cordova create $(WORKDIR)$@ com.bitpay.*NAMENOSPACE* *NAMECASENOSPACE* || echo "Project Path Existed"
	cp ProjectMakefile $(WORKDIR)$@/Makefile
	mkdir -p $(WORKDIR)$@/www
	cp -Rf ../public/* $(WORKDIR)$@/www
	cp config.xml $(WORKDIR)$@/config.xml
	make -C $(WORKDIR)$@  $(subst $(WORKDIR),, $(WORKDIR)$@)

wp-copy: 
	cp -rvf wp/Properties/* $(WORKDIR)wp/platforms/wp8/Properties/
	cp -rvf wp/MainPage.xaml $(WORKDIR)wp/platforms/wp8/
	cp -rvf wp/Package.appxmanifest $(WORKDIR)wp/platforms/wp8/
	cp -rvf wp/Assets/* $(WORKDIR)wp/platforms/wp8/Assets/
	cp -rvf wp/SplashScreenImage.jpg $(WORKDIR)wp/platforms/wp8/
	cp -rvf wp/ApplicationIcon.png $(WORKDIR)wp/platforms/wp8/
	cp -rvf wp/Background.png $(WORKDIR)wp/platforms/wp8/
	cp -rvf ../public/* $(WORKDIR)wp/www
	wp/fix-svg.sh


androidrun:
	make -C $(WORKDIR)android run
	adb logcat | grep chromium
