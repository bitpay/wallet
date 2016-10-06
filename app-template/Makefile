.PHONY:  ios android wp

WORKDIR=project-

all:

clean:
	rm -Rf $(WORKDIR)*

wp-init: config.xml
	cordova create $(WORKDIR)$@ com.bitpay.*BUNDLENAME* "*USERVISIBLENAME*" || echo "Project Path Existed"
	cp ProjectMakefile $(WORKDIR)$@/Makefile
	mkdir -p $(WORKDIR)$@/www
	cp -Rf ../www/* $(WORKDIR)$@/www
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
	cp -rvf ../www/* $(WORKDIR)wp/www
	wp/fix-svg.sh
