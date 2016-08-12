# Configs
BUILDDIR=build
ZIPFILE=copay-chrome-extension.zip
VERSION=`cut -d '"' -f2 ../src/js/version.js|head -n 1`

INCLUDE=$(shell cat ./include)
INITIAL=./initial.js
BASE=$(CURDIR)


all: $(ZIPFILE)

dir: 
	rm -rf $(BUILDDIR)
	mkdir -p $(BUILDDIR)
	sed "s/APP_VERSION/$(VERSION)/g" manifest.json > $(BUILDDIR)/manifest.json
	cp -vf $(INITIAL) $(BUILDDIR)

files:
	cd ../public && rsync -rLRv --exclude-from $(BASE)/exclude $(INCLUDE) $(BASE)/$(BUILDDIR) && cd -
	cd .. && rsync -rLRv ./bower_components/trezor-connect/chrome/* $(BASE)/$(BUILDDIR)/ && cd -
	

$(ZIPFILE): dir files
	cd $(BUILDDIR)
	rm -f $(ZIPFILE)
	zip -qr $(ZIPFILE) "`basename $(BUILDDIR)`"
	@echo "** The Chrome Extension is ready at copay-chrome-extension.zip"
