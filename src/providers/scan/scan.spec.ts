import { fakeAsync, tick } from '@angular/core/testing';
import { QRScanner } from '@ionic-native/qr-scanner';
import { Events } from 'ionic-angular';
import { Observable } from 'rxjs/Observable';
import { TestUtils } from '../../test';

// Providers
import { Logger, PlatformProvider, ScanProvider } from '..';

describe('ScanProvider', () => {
  let scanProvider: ScanProvider;
  let qrScanner: QRScanner;
  let logger: Logger;
  let events: Events;
  let testBed;
  let debugSpy;
  let eventsPublishSpy;

  class PlatformProviderMock {
    isCordova: boolean;
    isElectron: boolean;
    constructor() {}
  }

  function init() {
    testBed = TestUtils.configureProviderTestingModule([
      { provide: PlatformProvider, useClass: PlatformProviderMock }
    ]);
    scanProvider = testBed.get(ScanProvider);
    qrScanner = testBed.get(QRScanner);
    logger = testBed.get(Logger);
    debugSpy = spyOn(logger, 'debug');
    events = testBed.get(Events);
    eventsPublishSpy = spyOn(events, 'publish');
  }

  describe('Mobile: ', () => {
    beforeEach(() => {
      PlatformProviderMock.prototype.isCordova = true;
      init();
    });

    describe('getCapabilities', () => {
      it('should get capabilities correctly', () => {
        scanProvider.isAvailable = true;
        scanProvider.hasPermission = true;
        scanProvider.isDenied = false;
        scanProvider.isRestricted = false;
        scanProvider.canEnableLight = true;
        scanProvider.canChangeCamera = true;
        scanProvider.canOpenSettings = true;

        const capabilities = scanProvider.getCapabilities();
        expect(capabilities).toEqual({
          isAvailable: true,
          hasPermission: true,
          isDenied: false,
          isRestricted: false,
          canEnableLight: true,
          canChangeCamera: true,
          canOpenSettings: true
        });
      });
    });

    describe('gentleInitialize', () => {
      it('should get scanner status and complete initialization if initializations already started', async () => {
        scanProvider.initializeStarted = true;

        const statusMock = {
          authorized: true,
          denied: false,
          restricted: false,
          canEnableLight: true,
          canChangeCamera: true,
          canOpenSettings: true
        };

        spyOn(qrScanner, 'getStatus').and.returnValue(
          Promise.resolve(statusMock)
        );

        await scanProvider
          .gentleInitialize()
          .then(() => {
            expect().nothing();
          })
          .catch(err => {
            expect(err).not.toBeDefined();
          });

        expect(scanProvider.initializeCompleted).toBeTruthy();
        expect(eventsPublishSpy).toHaveBeenCalledWith(
          'scannerServiceInitialized'
        );
        expect(debugSpy).toHaveBeenCalledTimes(5); // logCapabilities()
      });

      it('should initialize scanner if it was authorized and set initializeStarted with true', async () => {
        scanProvider.initializeStarted = false;

        const statusMock = {
          authorized: true,
          denied: false,
          restricted: false,
          canEnableLight: true,
          canChangeCamera: true,
          canOpenSettings: true
        };

        spyOn(qrScanner, 'getStatus').and.returnValue(
          Promise.resolve(statusMock)
        );
        const initializeSpy = spyOn(scanProvider, 'initialize').and.returnValue(
          Promise.resolve()
        );

        await scanProvider
          .gentleInitialize()
          .then(() => {
            expect().nothing();
          })
          .catch(err => {
            expect(err).not.toBeDefined();
          });

        expect(scanProvider.initializeStarted).toBeTruthy();
        expect(initializeSpy).toHaveBeenCalled();
      });

      it("should not initialize scanner if it wasn't authorized and set initializeStarted with true", async () => {
        scanProvider.initializeStarted = false;

        const statusMock = {
          authorized: false,
          denied: false,
          restricted: false,
          canEnableLight: true,
          canChangeCamera: true,
          canOpenSettings: true
        };

        spyOn(qrScanner, 'getStatus').and.returnValue(
          Promise.resolve(statusMock)
        );

        await scanProvider
          .gentleInitialize()
          .then(() => {
            expect().nothing();
          })
          .catch(err => {
            expect(err).not.toBeDefined();
          });

        expect(scanProvider.initializeStarted).toBeTruthy();
        expect(eventsPublishSpy).toHaveBeenCalledWith(
          'scannerServiceInitialized'
        );
      });
    });

    describe('reinitialize', () => {
      it('should set initializeCompleted with false and initialize scanner again', fakeAsync(() => {
        const initializeSpy = spyOn(scanProvider, 'initialize');
        spyOn(qrScanner, 'destroy').and.returnValue(Promise.resolve());

        scanProvider.reinitialize();
        tick();
        expect(scanProvider.initializeCompleted).toBeFalsy();
        expect(initializeSpy).toHaveBeenCalled();
      }));
    });

    describe('initialize', () => {
      it('should initialize the scanner through prepare funtion', async () => {
        const statusMock = {
          authorized: true,
          denied: false,
          restricted: false,
          canEnableLight: true,
          canChangeCamera: true,
          canOpenSettings: true
        };

        spyOn(qrScanner, 'prepare').and.returnValue(
          Promise.resolve(statusMock)
        );

        await scanProvider
          .initialize()
          .then(() => {
            expect().nothing();
          })
          .catch(err => {
            expect(err).not.toBeDefined();
          });

        expect(scanProvider.initializeCompleted).toBeTruthy();
        expect(eventsPublishSpy).toHaveBeenCalledWith(
          'scannerServiceInitialized'
        );
      });

      it('should set isAvailable with false if prepare returns error, and call completeInitialization', async () => {
        const statusMock = {
          authorized: false,
          denied: false,
          restricted: false,
          canEnableLight: true,
          canChangeCamera: true,
          canOpenSettings: true
        };

        spyOn(qrScanner, 'prepare').and.returnValue(Promise.reject('Error'));

        spyOn(qrScanner, 'getStatus').and.returnValue(
          Promise.resolve(statusMock)
        );

        await scanProvider
          .initialize()
          .then(() => {
            expect().nothing();
          })
          .catch(err => {
            expect(err).not.toBeDefined();
          });

        expect(scanProvider.isAvailable).toBeFalsy();
        expect(scanProvider.initializeCompleted).toBeTruthy();
        expect(eventsPublishSpy).toHaveBeenCalledWith(
          'scannerServiceInitialized'
        );
      });
    });

    describe('isInitialized', () => {
      it('should get initializeCompleted correctly', () => {
        scanProvider.initializeCompleted = true;
        const result = scanProvider.isInitialized();
        expect(result).toBeTruthy();
      });
    });

    describe('isInitializeStarted', () => {
      it('should get initializeStarted correctly', () => {
        scanProvider.initializeStarted = true;
        const result = scanProvider.isInitializeStarted();
        expect(result).toBeTruthy();
      });
    });

    describe('activate', () => {
      it('should show the scanner and check capabilities', async () => {
        scanProvider.initializeCompleted = false;
        const statusMock = {
          authorized: true,
          denied: false,
          restricted: false,
          canEnableLight: true,
          canChangeCamera: true,
          canOpenSettings: true
        };

        spyOn(qrScanner, 'show').and.returnValue(Promise.resolve(statusMock));

        await scanProvider
          .activate()
          .then(() => {
            expect().nothing();
          })
          .catch(err => {
            expect(err).not.toBeDefined();
          });

        expect(scanProvider.initializeCompleted).toBeTruthy();
        expect(debugSpy).toHaveBeenCalledTimes(5); // logCapabilities()
      });
    });

    describe('scan', () => {
      it('should call scan function of qrScanner', () => {
        let scanSpy = spyOn(qrScanner, 'scan').and.returnValues({
          subscribe: (): Observable<string> => {
            return Observable.of('text1');
          }
        });

        scanProvider.scan().catch(err => {
          expect(err).not.toBeDefined();
        });

        expect(scanSpy).toHaveBeenCalled();
      });
    });

    describe('pausePreview', () => {
      it('should call pausePreview function of qrScanner', () => {
        const pausePreviewSpy = spyOn(qrScanner, 'pausePreview');
        scanProvider.pausePreview();
        expect(pausePreviewSpy).toHaveBeenCalled();
      });
    });

    describe('resumePreview', () => {
      it('should call resumePreview function of qrScanner', () => {
        const resumePreviewSpy = spyOn(qrScanner, 'resumePreview');
        scanProvider.resumePreview();
        expect(resumePreviewSpy).toHaveBeenCalled();
      });
    });

    describe('deactivate', () => {
      it('should disable light if it is on, and then hide and destroy the scanner', () => {
        scanProvider.lightEnabled = true;
        const disableLightSpy = spyOn(qrScanner, 'disableLight');
        const hideSpy = spyOn(qrScanner, 'hide');
        const destroySpy = spyOn(qrScanner, 'destroy');

        scanProvider.deactivate();
        expect(scanProvider.lightEnabled).toBeFalsy();
        expect(disableLightSpy).toHaveBeenCalled();
        expect(hideSpy).toHaveBeenCalled();
        expect(destroySpy).toHaveBeenCalled();
      });
    });

    describe('toggleLight', () => {
      it('should turn on the light of the camera', async () => {
        scanProvider.lightEnabled = false;
        const enableLightSpy = spyOn(qrScanner, 'enableLight').and.returnValue(
          Promise.resolve()
        );

        await scanProvider
          .toggleLight()
          .then((isLightEnabled: boolean) => {
            expect(isLightEnabled).toBeTruthy();
          })
          .catch(err => {
            expect(err).not.toBeDefined();
          });

        expect(scanProvider.lightEnabled).toBeTruthy();
        expect(enableLightSpy).toHaveBeenCalled();
      });

      it('should turn off the light of the camera', async () => {
        scanProvider.lightEnabled = true;
        const disableLightSpy = spyOn(
          qrScanner,
          'disableLight'
        ).and.returnValue(Promise.resolve());

        await scanProvider
          .toggleLight()
          .then((isLightEnabled: boolean) => {
            expect(isLightEnabled).toBeFalsy();
          })
          .catch(err => {
            expect(err).not.toBeDefined();
          });

        expect(scanProvider.lightEnabled).toBeFalsy();
        expect(disableLightSpy).toHaveBeenCalled();
      });
    });

    describe('toggleCamera', () => {
      it('should enable the front camera', async () => {
        scanProvider.frontCameraEnabled = false;
        const useFrontCameraSpy = spyOn(
          qrScanner,
          'useFrontCamera'
        ).and.returnValue(Promise.resolve());

        await scanProvider
          .toggleCamera()
          .then((isfrontCameraEnabled: boolean) => {
            expect(isfrontCameraEnabled).toBeTruthy();
          })
          .catch(err => {
            expect(err).not.toBeDefined();
          });

        expect(scanProvider.frontCameraEnabled).toBeTruthy();
        expect(useFrontCameraSpy).toHaveBeenCalled();
      });

      it('should enable the back camera', async () => {
        scanProvider.frontCameraEnabled = true;
        const useBackCameraSpy = spyOn(
          qrScanner,
          'useBackCamera'
        ).and.returnValue(Promise.resolve());

        await scanProvider
          .toggleCamera()
          .then((isfrontCameraEnabled: boolean) => {
            expect(isfrontCameraEnabled).toBeFalsy();
          })
          .catch(err => {
            expect(err).not.toBeDefined();
          });

        expect(scanProvider.frontCameraEnabled).toBeFalsy();
        expect(useBackCameraSpy).toHaveBeenCalled();
      });
    });

    describe('openSettings', () => {
      it('should call openSettings function of qrScanner', () => {
        const openSettingsSpy = spyOn(qrScanner, 'openSettings');
        scanProvider.openSettings();
        expect(openSettingsSpy).toHaveBeenCalled();
      });
    });
  });

  describe('Desktop: ', () => {
    beforeEach(() => {
      PlatformProviderMock.prototype.isCordova = false;
      init();
    });

    describe('gentleInitialize', () => {
      it('should not pre-initialize the camera on desktop', async () => {
        const getStatusSpy = spyOn(qrScanner, 'getStatus');

        await scanProvider
          .gentleInitialize()
          .then(() => {
            expect().nothing();
          })
          .catch(err => {
            expect(err).not.toBeDefined();
          });

        expect(getStatusSpy).not.toHaveBeenCalled();
        expect(eventsPublishSpy).not.toHaveBeenCalled();
        expect(debugSpy).toHaveBeenCalledTimes(2);
      });
    });
  });
});
