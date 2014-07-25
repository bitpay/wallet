Building Android
================

## Building localy ##

Steps if you have Netbeans setup for Android or want to do that.

1. Setup Netbeans for Android development.
	1. Download and install JDK (be sure to set JAVA_HOME - it will be important for the SDK).
	2. Download and install Netebeans.
	3. Download and install Android SDK (do NOT use ADT boundle).
	4. Download and install NBAndroid: http://www.nbandroid.org/p/installation.html
	5. Set path of Android SDK in Netbeans (for installation for all users this is: ```c:\Program Files (x86)\Android\android-sdk\```).

2. Install Phonegap:

	1. Add to Windows PATH Android SDK tools: ```;C:\...[android-sdk]\platform-tools;C:\...[android-sdk]\tools```
	2. Copy ANT home from Netbeans and add it your PATH too.
	3. Add Java bin to PATH: ```;%JAVA_HOME%\bin;%ANT_HOME%\bin```

3. Install cordova command line
	1. Install node.js.
	2. Install cordova command line:
	```
	npm install -g cordova
	```

4. Create and build test project to check command line tools:
	```
	cordova create hello com.example.hello "Hello World"
	cd hello
	cordova platform add android
	cordova build
	```

5. To open project in Netbeans just use Open Project and in the folder you created the project navigate to platforms\android.

6. Add the plugin following instructions from this page: https://github.com/phonegap/phonegap-plugins/tree/master/Android/BarcodeScanner

## Preparing for PhoneGap Build ##

The process may vary depending on version of Zxing project, but base steps should be the same.

1. Get latest zxing-android project and create a LibraryProject from that:
	1. Checked out zxing-android from SVN (http://zxing.googlecode.com/svn/trunk/).
	2. Overlayed the source from zxing-core.
	3. Set to library project.
	4. Change intent names to avoid conflict with ZXing app.
	5. Remove two lines from AndroidManifest.xml to avoid shortcuts being created.
2. Update plugin.xml with any needed resources (you can use ```plugin.xml.generate.php``` to generate some stuff for Android).
3. Refactor LibraryProject for usage with PGB:
	1. Commented out call to showHelpOnFirstLaunch (it will probably not work anyway).
	2. Replace R class with FakeR class calls (this is needed beacuse R class will be in a different namespace).
	3. Add FakeR initialization in each class it was added (note that if some classes extened other then you might want to add a protected fakeR variable to their parent - see e.g. ResultHandler class and it's children).
	4. Comment out ```(<string name="app_name">[^<>]+</string>)``` from strings.xml (to avoid replacing original application name).
4. Build LibraryProject, rename and copy it.

## Building with plugman ##

[Plugman](https://github.com/apache/cordova-plugman) is a Node.js tool used by PG Build.

Workflow for creating and building example project with the plugin:

1. Create and build example project:
	```
	cordova create hello com.example.hello "HelloWorld"
	cd hello
	cordova platform add android
	cordova build
	```
	
	Warning! White space characters are not allowed in app name (and any other that cannot be used in an activity or class name). See: https://issues.apache.org/jira/browse/CB-4148
	
	Note. If you wish to remove Android platform (to e.g. generate it with your www assests) you will need to remove "platforms\android" and "merges\android\".

2. Copy plugin files to "hello\plugins\com.phonegap.plugins.barcodescanner\". You can simply download from github:
	```
	git clone https://github.com/wildabeast/BarcodeScanner.git plugins\com.phonegap.plugins.barcodescanner
	```

3. Install the plugin (current dir. being "hello"):
	```
	plugman --plugins_dir plugins --plugin com.phonegap.plugins.barcodescanner --platform android --project platforms\android
	plugman install --plugins_dir plugins --plugin com.phonegap.plugins.barcodescanner --platform android --project platforms\android
	```
	
	Note. To manually remove plugin you need to re-create plugins\android.json (and remove changes done by the plugin - you can simply remove whole platform as described in first step and re-create).

4. Build & deploy Android project with whatever Android IDE (or ANT + ADK tools).

Note. Plugin sub-dir (here "com.phonegap.plugins.barcodescanner") need to be the same as the plugin ID only since PhoneGap 3.0.
