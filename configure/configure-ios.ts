import { CapacitorProject } from '@capacitor/project';
import { CapacitorConfig } from '@capacitor/cli';

const configProvider = require("../src/assets/appConfig.json");


// This takes a CapacitorConfig, such as the one in capacitor.config.ts, but only needs a few properties
// to know where the ios and android projects are
const config: CapacitorConfig = {
  ios: {
    path: 'ios',
  }
};
const updateIos = async() => {
    const project = new CapacitorProject(config);
    await project.load();
    const appTarget = project.ios?.getAppTarget();
    project.ios.setVersion(appTarget.name, null , configProvider.iOSBuildVersion);
    await project.ios?.updateInfoPlist(appTarget.name, null, {
      NSCameraUsageDescription: '"AbcPay Wallet" Would Like to Access the Camera',
      NSFaceIDUsageDescription: 'This allows you to securely sign into "AbcPay Wallet".'
    });
    // project.ios.setDisplayName(appTarget.name, 'Release', '')
    project.commit();
}
updateIos();