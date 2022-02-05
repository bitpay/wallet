import { CapacitorConfig } from '@capacitor/cli';
import * as configProvider from './src/assets/appConfig.json' ;
const config: CapacitorConfig = {
  appId: configProvider.packageNameId,
  appName: configProvider.packageName,
  webDir: 'www',
  bundledWebRuntime: false,
  plugins : {
    "SplashScreen" : {
      "launchShowDuration" : 0
    },
    "PushNotifications" : {
      "presentationOptions" : ["badge", "sound", "alert"]
    }
  },
  cordova: {
    preferences: {
      ScrollEnabled: 'false',
      BackupWebStorage: 'none',
      SplashMaintainAspectRatio: 'true',
      FadeSplashScreenDuration: '300',
      SplashShowOnlyFirstTime: 'false',
      SplashScreen: 'screen',
      SplashScreenDelay: '3000'
    }
  }
};

export default config;
