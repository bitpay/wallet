import { CapacitorConfig } from '@capacitor/cli';
import * as configProvider from './src/assets/appConfig.json' ;
const config: CapacitorConfig = {
  appId: configProvider.packageNameId,
  appName: configProvider.packageName,
  webDir: 'www',
  bundledWebRuntime: false,
  plugins : {
    "SplashScreen" : {
      "launchAutoHide": false,
      "showSpinner": false
    },
    "PushNotifications" : {
      "presentationOptions" : ["badge", "sound", "alert"]
    }
  },
  cordova: {
    preferences: {
      ScrollEnabled: 'false',
      BackupWebStorage: 'none'
      // ,
      // SplashMaintainAspectRatio: 'true',
      // FadeSplashScreenDuration: '300',
      // SplashShowOnlyFirstTime: 'false',
      // SplashScreen: 'screen',
      // SplashScreenDelay: '3000'
    }
  }
};

export default config;
