import { CapacitorProject } from '@capacitor/project';
import { CapacitorConfig } from '@capacitor/cli';
import { envName } from '../src/environments/environmentName'

const configProvider = require("../src/assets/appConfig.json");


// This takes a CapacitorConfig, such as the one in capacitor.config.ts, but only needs a few properties
// to know where the ios and android projects are
const config: CapacitorConfig = {
  ios: {
    path: 'ios',
  },
  android: {
    path: 'android',
  },
};
const updateIos = async() => {
    const project = new CapacitorProject(config);
    await project.load();
    const appTarget = project.ios?.getAppTarget();
    project.ios.setVersion(appTarget.name, null , configProvider.iOSBuildVersion);
    project.ios.setDisplayName(appTarget.name, 'Release', '')
    
    project.commit();
}
const updateAndroid = async() => {
  const project = new CapacitorProject(config);
  await project.load();
  if(envName === "development"){
    await project.android?.setVersionCode(5);
  }
  else await project.android?.setVersionCode(4);
  if(process.env)
  await project.android?.setVersionName('1.2.3');
  await project.android?.setPackageName('abc');
  // await project.android?.incrementVersionCode();
  await project.vfs.commitAll();
}
updateAndroid();
