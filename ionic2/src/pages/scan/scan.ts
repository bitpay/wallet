import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';

import { ScannerService } from '../../services/scanner.service';

@Component({
  selector: 'page-scan',
  templateUrl: 'scan.html'
})
export class ScanPage {

  scannerStates:any = {
    unauthorized: 'unauthorized',
    denied: 'denied',
    unavailable: 'unavailable',
    loading: 'loading',
    visible: 'visible'
  };

  currentState: any;

  scannerIsAvailable: any = false;
  scannerHasPermission: boolean = false;
  scannerIsDenied: boolean = false;
  scannerIsRestricted: boolean = false;
  canEnableLight: boolean = false;
  canChangeCamera: boolean = false;
  canOpenSettings: boolean = false;

  cameraToggleActive: boolean = false;
  lightActive: boolean = false;

  incomingData: any = {
    redir: () => {}
  };

  constructor(
    public navCtrl: NavController,
    public scannerService: ScannerService
    //public incomingData: IncomingDataService
  ) {}

  _updateCapabilities() {
    let capabilities = this.scannerService.getCapabilities();
    this.scannerIsAvailable = capabilities.isAvailable;
    this.scannerHasPermission = capabilities.hasPermission;
    this.scannerIsDenied = capabilities.isDenied;
    this.scannerIsRestricted = capabilities.isRestricted;
    this.canEnableLight = capabilities.canEnableLight;
    this.canChangeCamera = capabilities.canChangeCamera;
    this.canOpenSettings = capabilities.canOpenSettings;
  }

  _handleCapabilities() {
    // always update the view
    setTimeout(() => {
      if(!this.scannerService.isInitialized()){
        this.currentState = this.scannerStates.loading;
      } else if(!this.scannerIsAvailable){
        this.currentState = this.scannerStates.unavailable;
      } else if(this.scannerIsDenied){
        this.currentState = this.scannerStates.denied;
      } else if(this.scannerIsRestricted){
        this.currentState = this.scannerStates.denied;
      } else if(!this.scannerHasPermission){
        this.currentState = this.scannerStates.unauthorized;
      }
      //$log.debug('Scan view state set to: ' + $scope.currentState);
    });
  }

  _refreshScanView(){
    this._updateCapabilities();
    this._handleCapabilities();
    if(this.scannerHasPermission){
      this.activate();
    }
  }

  // // This could be much cleaner with a Promise API
  // // (needs a polyfill for some platforms)
  // $rootScope.$on('scannerServiceInitialized', () => {
  //   //$log.debug('Scanner initialization finished, reinitializing scan view...');
  //   this._refreshScanView();
  // });
  //
  ionViewDidEnter() {
    // try initializing and refreshing status any time the view is entered
    this.scannerService.gentleInitialize(() => {
      this._refreshScanView();
    });
    this.scannerService.resumePreview();
  }

  activate(){
    this.scannerService.activate(() => {
      this._updateCapabilities();
      this._handleCapabilities();
      //$log.debug('Scanner activated, setting to visible...');
      this.currentState = this.scannerStates.visible;
        // pause to update the view
        setTimeout(() => {
          this.scannerService.scan((err, contents) => {
          if(err){
            //$log.debug('Scan canceled.');
          }
          // else if ($state.params.passthroughMode) {
          //   $rootScope.scanResult = contents;
          //   this.goBack();
          // }
          else {
            this.handleSuccessfulScan(contents);
          }
          });
        });
    });
  }

  authorize(){
    this.scannerService.initialize(() => {
      this._refreshScanView();
    });
  };

  ionViewDidLeave() {
    this.scannerService.deactivate();
  }

  handleSuccessfulScan(contents){
    //$log.debug('Scan returned: "' + contents + '"');
    this.scannerService.pausePreview();
    this.incomingData.redir(contents);
  }

  // $rootScope.$on('incomingDataMenu.menuHidden', () => {
  //   this.scannerService.resumePreview();
  //   this.activate();
  // });

  openSettings() {
    this.scannerService.openSettings();
  }

  attemptToReactivate() {
    this.scannerService.reinitialize();
  }

  toggleLight(){
    this.scannerService.toggleLight((lightEnabled) => {
      this.lightActive = lightEnabled;
    });
  }

  toggleCamera(){
    this.cameraToggleActive = true;
    this.scannerService.toggleCamera((status) => {
    // (a short delay for the user to see the visual feedback)
      setTimeout(() => {
        this.cameraToggleActive = false;
        //$log.debug('Camera toggle control deactivated.');
      }, 200);
    });
  };

  canGoBack(){
    //return $state.params.passthroughMode;
    return false;
  };
  goBack(){
    // $ionicHistory.nextViewOptions({
    //   disableAnimate: true
    // });
    // $ionicHistory.backView().go();
  }
}
