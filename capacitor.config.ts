import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.app',
  appName: 'abcpay-new',
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
