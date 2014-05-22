System Requirements

* Download [Android SDK](http://developer.android.com/sdk/index.html)
* Download [Crosswalk](https://crosswalk-project.org/#documentation/getting_started/linux_host_setup) and setup the environment

Add to your ~/.bash_profile or ~/.bashrc

```
export CROSSWALK="<path to Crosswalk directory>"
```

To build the APK run the script:

```
sh android/build.sh
```

To install the APK in your device run:

```
adb install -r Copay_VERSION_arm.apk
```

