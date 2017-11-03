import { Injectable } from '@angular/core';
import { QRScanner, QRScannerStatus } from '@ionic-native/qr-scanner';
import { PlatformProvider } from '../platform/platform';
import 'rxjs/add/operator/map';

@Injectable()
export class ScanProvider {

  public text: string;
  public scannerVisible: boolean;
  public lightEnabled: boolean;
  public frontCameraEnabled: boolean;

  private scanSub: any;

  constructor(
    private qrScanner: QRScanner,
    private platform: PlatformProvider
  ) {
    this.scannerVisible = false;
    this.lightEnabled = false;
    this.frontCameraEnabled = false;
  }

  public pausePreview(): void {
    this.qrScanner.pausePreview();
  };

  public activate(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.platform.isCordova) {
        this.qrScanner.show();
        this.scannerVisible = true;
        // start scanning
        this.scanSub = this.qrScanner.scan().subscribe((text: string) => {
          console.log('Scanned something' + text);
          this.text = text;
          resolve(this.text);
          this.scannerVisible = false;
          this.pausePreview();
          this.scanSub.unsubscribe(); // stop scanning
        });
      } else {
        reject("ERROR - No Cordova device");
      }
    });
  }

  deactivate(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.platform.isCordova) {
        if (this.lightEnabled) {
          this.scanSub.unsubscribe();
          this.qrScanner.disableLight();
          this.lightEnabled = false;
        }
        this.qrScanner.hide(); // hide camera preview
      } else {
        reject("ERROR - No Cordova device");
      }
    });
  }

  toggleLight(): Promise<any> {
    return new Promise((resolve, reject) => {
      console.log('Toggling light...');
      if (this.lightEnabled) {
        this.qrScanner.disableLight()
          .then(resp => {
            this.lightEnabled = false;
            resolve(this.lightEnabled);
            console.log(resp);
          })
          .catch(err => {
            console.log("Error: ", err);
            reject(err);
          });
      } else {
        this.qrScanner.enableLight()
          .then(resp => {
            this.lightEnabled = true;
            resolve(this.lightEnabled);
            console.log(resp);
          })
          .catch(err => {
            console.log("Error: ", err);
            reject(err);
          });
      }
    });
  };

  toggleCamera(): Promise<any> {
    return new Promise((resolve, reject) => {
      console.log('Toggling camera...');
      if (this.frontCameraEnabled) {
        this.qrScanner.useBackCamera()
          .then(resp => {
            this.frontCameraEnabled = false;
            resolve(this.frontCameraEnabled);
            console.log(resp);
          })
          .catch(err => {
            console.log("Error: ", err);
            reject(err);
          });
      } else {
        this.qrScanner.useFrontCamera()
          .then(resp => {
            this.frontCameraEnabled = true;
            resolve(this.frontCameraEnabled);
            console.log(resp);
          })
          .catch(err => {
            console.log("Error: ", err);
            reject(err);
          });
      }
    });
  };

}
