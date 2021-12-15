--> Ionic 5
--> Node 14

For MAC : 
Install bundletool --> run : brew install bundletool
### Android

When your development environment is ready, run the `start:android` package script.

```sh
npm run prepare:abcpay
- Option 1 : Build Android with Android studio
    + npm run start:android
    + Open android studio --> open source abcpay/android
    + Build and run with android studio
- Option 2 : Render .apk file without Android studio 
    + npm run build:android (.apk file in android/app/build/outputs/aps/debug/app-debug.apk)
    + npm run build:android-release (.apk file in android/app/build/outputs/aps/release/app-release-unsigned.apk)
-- Note: if build error Run --> : "npx jetify" to fix

### iOS

When your development environment is ready, run the `start:ios` package script.

```sh
npm run prepare:abcpay
npm run start:ios
Build and run with Xcode
```
 Note: if build error Run --> : "npx jetify" -->  run npm run start:ios 