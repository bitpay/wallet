import { fakeAsync, tick } from '@angular/core/testing';
import { Clipboard } from '@ionic-native/clipboard';

import { TestUtils } from '../../test';

// Providers
import {
  ClipboardProvider,
  ElectronProvider,
  IncomingDataProvider,
  Logger,
  PlatformProvider
} from '..';

describe('ClipboardProvider', () => {
  let clipboardProvider: ClipboardProvider;
  let clipboard: Clipboard;
  let electronProvider: ElectronProvider;
  let incomingDataProvider: IncomingDataProvider;
  let logger: Logger;
  let testBed;

  class PlatformProviderMock {
    isCordova: boolean;
    isElectron: boolean;
    constructor() {}
    getOS() {
      return { OSName: 'Clipboard Unit Test' };
    }
  }

  function init() {
    testBed = TestUtils.configureProviderTestingModule([
      { provide: PlatformProvider, useClass: PlatformProviderMock }
    ]);
    clipboardProvider = testBed.get(ClipboardProvider);
    incomingDataProvider = testBed.get(IncomingDataProvider);
    logger = testBed.get(Logger);
  }

  describe('Mobile: ', () => {
    beforeEach(() => {
      PlatformProviderMock.prototype.isCordova = true;
      PlatformProviderMock.prototype.isElectron = false;
      init();
      clipboard = testBed.get(Clipboard);
    });

    describe('getData', () => {
      it('should get copied data', () => {
        spyOn(clipboard, 'paste').and.returnValue(Promise.resolve('data1'));

        clipboardProvider
          .getData()
          .then(data => {
            expect(data).toEqual('data1');
          })
          .catch(err => {
            expect(err).toBeUndefined();
          });
      });
    });

    describe('getValidData', () => {
      it('should return copied value (1/2)', () => {
        const data = {
          coin: 'btc',
          data: 'mq8Hc2XwYqXw4sPTc8i7wPx9iJzTFTBWbQ'
        };
        spyOn(clipboard, 'paste').and.returnValue(Promise.resolve(data.data));

        clipboardProvider.getValidData(data.coin).then(res => {
          expect(res).toEqual(data.data);
        });
      });

      it('should return copied value (2/2)', () => {
        const data = {
          coin: 'btc',
          data: 'bitcoin:mq8Hc2XwYqXw4sPTc8i7wPx9iJzTFTBWbQ?amount=0.0001'
        };
        spyOn(clipboard, 'paste').and.returnValue(Promise.resolve(data.data));

        clipboardProvider.getValidData(data.coin).then(res => {
          expect(res).toEqual(data.data);
        });
      });

      it('should return empty if coin is not defined', () => {
        const address = 'mq8Hc2XwYqXw4sPTc8i7wPx9iJzTFTBWbQ';
        spyOn(clipboard, 'paste').and.returnValue(Promise.resolve(address));

        spyOn(clipboardProvider, 'getValidData').and.returnValue(
          Promise.resolve()
        );
      });
    });

    describe('copy', () => {
      it('should copy data', () => {
        const copySpy = spyOn(clipboard, 'copy').and.returnValue(
          Promise.resolve()
        );
        try {
          clipboardProvider.copy('value1');
        } catch (err) {
          expect(err).toBeUndefined();
        }
        expect(copySpy).toHaveBeenCalledWith('value1');
      });
    });

    describe('clear', () => {
      it('should clear data', () => {
        const copySpy = spyOn(clipboard, 'copy').and.returnValue(
          Promise.resolve()
        );
        try {
          clipboardProvider.clear();
        } catch (err) {
          expect(err).toBeUndefined();
        }
        expect(copySpy).toHaveBeenCalledWith(null);
      });
    });

    describe('clearClipboardIfValidData', () => {
      it('should clear clipboard if data type is valid', fakeAsync(() => {
        spyOn(clipboard, 'paste').and.returnValue(
          Promise.resolve('1CVuVALD6Zo7ms24n3iUXv162kvUzsHr69')
        ); // BitcoinAddress
        spyOn(incomingDataProvider, 'parseData').and.returnValue({
          type: 'BitcoinAddress'
        });
        spyOn(clipboard, 'copy').and.returnValue(Promise.resolve());
        const typeArray: string[] = ['BitcoinAddress'];
        const infoSpy = spyOn(logger, 'info');

        clipboardProvider.clearClipboardIfValidData(typeArray);
        tick();
        expect(infoSpy).toHaveBeenCalledTimes(1);
      }));

      it("should do nothing if data type isn't match", fakeAsync(() => {
        spyOn(clipboard, 'paste').and.returnValue(
          Promise.resolve('1CVuVALD6Zo7ms24n3iUXv162kvUzsHr69')
        ); // BitcoinAddress
        spyOn(incomingDataProvider, 'parseData').and.returnValue({
          type: 'privateKey'
        });
        spyOn(clipboard, 'copy').and.returnValue(Promise.resolve());
        const typeArray: string[] = ['BitcoinAddress'];
        const infoSpy = spyOn(logger, 'info');

        clipboardProvider.clearClipboardIfValidData(typeArray);
        tick();
        expect(infoSpy).not.toHaveBeenCalled();
      }));
    });
  });

  describe('Desktop: ', () => {
    beforeEach(() => {
      PlatformProviderMock.prototype.isCordova = false;
      PlatformProviderMock.prototype.isElectron = true;
      init();
      electronProvider = testBed.get(ElectronProvider);
    });

    describe('getData', () => {
      it('should get copied data', () => {
        spyOn(electronProvider, 'readFromClipboard').and.returnValue(
          Promise.resolve('data1')
        );

        clipboardProvider
          .getData()
          .then(data => {
            expect(data).toEqual('data1');
          })
          .catch(err => {
            expect(err).toBeUndefined();
          });
      });
    });

    describe('getValidData', () => {
      it('should return copied value (1/2)', () => {
        const data = {
          coin: 'btc',
          data: 'mq8Hc2XwYqXw4sPTc8i7wPx9iJzTFTBWbQ'
        };
        spyOn(electronProvider, 'readFromClipboard').and.returnValue(
          Promise.resolve(data.data)
        );

        clipboardProvider.getValidData(data.coin).then(res => {
          expect(res).toEqual(data.data);
        });
      });

      it('should return copied value (2/2)', () => {
        const data = {
          coin: 'btc',
          data: 'bitcoin:mq8Hc2XwYqXw4sPTc8i7wPx9iJzTFTBWbQ?amount=0.0001'
        };
        spyOn(electronProvider, 'readFromClipboard').and.returnValue(
          Promise.resolve(data.data)
        );

        clipboardProvider.getValidData(data.coin).then(res => {
          expect(res).toEqual(data.data);
        });
      });

      it('should return empty if coin is not defined', () => {
        const address = 'mq8Hc2XwYqXw4sPTc8i7wPx9iJzTFTBWbQ';
        spyOn(electronProvider, 'readFromClipboard').and.returnValue(
          Promise.resolve(address)
        );

        spyOn(clipboardProvider, 'getValidData').and.returnValue(
          Promise.resolve()
        );
      });
    });

    describe('copy', () => {
      it('should copy data', () => {
        const writeToClipboardSpy = spyOn(electronProvider, 'writeToClipboard');
        try {
          clipboardProvider.copy('value1');
        } catch (err) {
          expect(err).toBeUndefined();
        }
        expect(writeToClipboardSpy).toHaveBeenCalledWith('value1');
      });
    });

    describe('clear', () => {
      it('should clear data', () => {
        const clearClipboardSpy = spyOn(electronProvider, 'clearClipboard');
        try {
          clipboardProvider.clear();
        } catch (err) {
          expect(err).toBeUndefined();
        }
        expect(clearClipboardSpy).toHaveBeenCalledTimes(1);
      });
    });

    describe('clearClipboardIfValidData', () => {
      it('should clear clipboard if data type is valid', fakeAsync(() => {
        spyOn(electronProvider, 'readFromClipboard').and.returnValue(
          Promise.resolve('1CVuVALD6Zo7ms24n3iUXv162kvUzsHr69')
        ); // BitcoinAddress
        spyOn(incomingDataProvider, 'parseData').and.returnValue({
          type: 'BitcoinAddress'
        });
        spyOn(electronProvider, 'clearClipboard');
        const typeArray: string[] = ['BitcoinAddress'];
        const infoSpy = spyOn(logger, 'info');

        clipboardProvider.clearClipboardIfValidData(typeArray);
        tick();
        expect(infoSpy).toHaveBeenCalledTimes(1);
      }));
    });
  });

  describe('Other devices: ', () => {
    beforeEach(() => {
      PlatformProviderMock.prototype.isCordova = false;
      PlatformProviderMock.prototype.isElectron = false;
      init();
      electronProvider = testBed.get(ElectronProvider);
    });

    describe('getData', () => {
      it('should get error if clipboard is not supported', () => {
        clipboardProvider
          .getData()
          .then(data => {
            expect(data).toBeUndefined();
          })
          .catch(err => {
            expect(err).toBeDefined();
          });
      });
    });

    describe('copy', () => {
      it('should get error if clipboard is not supported', () => {
        try {
          clipboardProvider.copy('value1');
        } catch (err) {
          expect(err).toBeDefined();
        }
      });
    });

    describe('clear', () => {
      it('should do nothing', () => {
        try {
          clipboardProvider.clear();
        } catch (err) {
          expect(err).toBeUndefined();
        }
        expect().nothing();
      });
    });
  });
});
