// import {
//   async,
//   ComponentFixture,
//   TestBed,
// } from '@angular/core/testing';
// import { TestUtils } from '../../test';

// // providers
// import { ClipboardProvider } from '../../providers/clipboard/clipboard';
// import { PlatformProvider } from '../../providers/platform/platform';

// // pages
// import { SendPage } from './send';

// describe('SendPage', () => {
//   let fixture: ComponentFixture<SendPage>;
//   let instance;
//   let testBed: typeof TestBed;
//   let clipboardProvider: ClipboardProvider;

//   class PlatformProviderMock {
//     isCordova: boolean;
//     isElectron: boolean;
//     constructor() {}
//     getOS() {
//       return { OSName: 'Clipboard Unit Test' };
//     }
//   }

//   const wallet = {
//     coin: 'xpi',
//     network: 'livenet',
//     status: {
//       totalBalanceStr: '1.000000'
//     }
//   };

//   beforeEach(async(() => {
//     testBed = TestUtils.configureProviderTestingModule([
//       { provide: PlatformProvider, useClass: PlatformProviderMock }
//     ]);
//     TestUtils.configurePageTestingModule([SendPage]).then(testEnv => {
//       fixture = testEnv.fixture;
//       instance = testEnv.instance;
//       instance.navParams = {
//         data: {}
//       };
//       instance.wallet = wallet;
//       fixture.detectChanges();
//     });
//   }));
//   afterEach(() => {
//     fixture.destroy();
//   });

//   describe('Lifecycle Hooks', () => {
//     describe('ionViewWillLeave', () => {
//       it('should unsubscribe from events', () => {
//         const spy = spyOn(instance.events, 'unsubscribe');
//         instance.ngOnDestroy();
//         expect(spy).toHaveBeenCalledWith(
//           'Local/AddressScan',
//           instance.updateAddressHandler
//         );
//       });
//     });
//   });

//   describe('setValidDataFromClipboard', () => {
//     beforeEach(() => {
//       PlatformProviderMock.prototype.isCordova = true;
//       PlatformProviderMock.prototype.isElectron = false;
//       clipboardProvider = testBed.get(ClipboardProvider);
//     });
//     it('should ignore data from the clipboard', async () => {
//       spyOn(clipboardProvider, 'getValidData').and.returnValue(
//         Promise.resolve()
//       );
//       await instance.setDataFromClipboard();
//       expect(instance.validDataFromClipboard).toBeUndefined();
//     });
//     it('should set data from the clipboard', async () => {
//       const data = 'lotus_16PSJLR4Xpf5YYj8UpWE9LHVyATnwpPRiEAv6XkcY';
//       instance.wallet.coin = 'xpi';
//       spyOn(clipboardProvider, 'getValidData').and.returnValue(
//         Promise.resolve(data)
//       );
//       await instance.setDataFromClipboard();
//       expect(instance.validDataFromClipboard).toEqual(data);
//     });
//   });

//   describe('processInput', () => {
//     describe('for wallets xpi livenet', () => {
//       beforeEach(() => {
//         instance.wallet.coin = 'xpi';
//         instance.wallet.network = 'livenet';
//         instance.navParams.data = {
//           amount: 11111111,
//           coin: 'xpi'
//         };

//         const checkIfContact = Promise.resolve(false);
//         spyOn(instance, 'checkIfContact').and.returnValue(checkIfContact);
//       });

//       it('should handle addresses xpi livenet and call to redir function', async () => {
//         const redirSpy = spyOn(instance.incomingDataProvider, 'redir');
//         instance.search = 'lotus_16PSJLR4Xpf5YYj8UpWE9LHVyATnwpPRiEAv6XkcY';
//         await instance.processInput();
//         expect(instance.invalidAddress).toBeFalsy();
//         expect(redirSpy).toHaveBeenCalledWith(
//           'lotus_16PSJLR4Xpf5YYj8UpWE9LHVyATnwpPRiEAv6XkcY',
//           {
//             activePage: 'SendPage',
//             amount: 11111111,
//             coin: 'xpi'
//           }
//         );
//       });

//       it('should handle addresses bch testnet and call to error modal', async () => {
//         const errorModalSpy = spyOn(instance, 'showErrorMessage');
//         instance.search = 'qp7j7pdealmxfv7755vgvh05v7hf34sme5phep2xvs';
//         await instance.processInput();
//         expect(instance.invalidAddress).toBeTruthy();
//         expect(errorModalSpy).toHaveBeenCalled();
//       });

//       it('should handle address bch livenet and call to error modal', async () => {
//         const errorModalSpy = spyOn(instance, 'showErrorMessage');
//         instance.search = 'qzcy06mxsk7hw0ru4kzwtrkxds6vf8y34vrm5sf9z7';
//         await instance.processInput();
//         expect(instance.invalidAddress).toBeTruthy();
//         expect(errorModalSpy).toHaveBeenCalled();
//       });

//       it('should handle address bch 1 testnet and call error modal', async () => {
//         const errorModalSpy = spyOn(instance, 'showErrorMessage');
//         instance.search = 'qqfs4tjymy5cs0j4lz78y2lvensl0l42wu80z5jass';
//         await instance.processInput();
//         expect(instance.invalidAddress).toBeTruthy();
//         expect(errorModalSpy).toHaveBeenCalled();
//       });
//     });

//     describe('for wallets xpi livenet', () => {
//       beforeEach(() => {
//         instance.wallet.coin = 'xpi';
//         instance.wallet.network = 'livenet';
//         instance.navParams.data.amount = 11111111;
//         instance.navParams.data.coin = 'xpi';

//         const checkIfContact = Promise.resolve(false);
//         spyOn(instance, 'checkIfContact').and.returnValue(checkIfContact);
//       });

//       it('should handle addresses xpi livenet and call to redir function', async () => {
//         const redirSpy = spyOn(instance.incomingDataProvider, 'redir');
//         instance.search = 'lotus_16PSJLR4Xpf5YYj8UpWE9LHVyATnwpPRiEAv6XkcY';
//         await instance.processInput();
//         expect(instance.invalidAddress).toBeFalsy();
//         expect(redirSpy).toHaveBeenCalledWith(
//           'lotus_16PSJLR4Xpf5YYj8UpWE9LHVyATnwpPRiEAv6XkcY',
//           {
//             activePage: 'SendPage',
//             amount: 11111111,
//             coin: 'xpi'
//           }
//         );
//       });

//       it('should handle address bch 3 testnet and call error modal', async () => {
//         const errorModalSpy = spyOn(instance, 'showErrorMessage');
//         instance.search = 'qqfs4tjymy5cs0j4lz78y2lvensl0l42wu80z5jass';
//         await instance.processInput();
//         expect(instance.invalidAddress).toBeTruthy();
//         expect(errorModalSpy).toHaveBeenCalled();
//       });
//     });

//     describe('for wallets bch testnet', () => {
//       beforeEach(() => {
//         instance.wallet.coin = 'bch';
//         instance.wallet.network = 'testnet';
//         instance.navParams.data.amount = 11111111;
//         instance.navParams.data.coin = 'bch';

//         const checkIfContact = Promise.resolve(false);
//         spyOn(instance, 'checkIfContact').and.returnValue(checkIfContact);
//       });

//       it('should handle addresses bch testnet and call to redir function', async () => {
//         const redirSpy = spyOn(instance.incomingDataProvider, 'redir');
//         instance.search = 'qqycye950l689c98l7z5j43n4484ssnp4y3uu4ramr';
//         await instance.processInput();
//         expect(instance.invalidAddress).toBeFalsy();
//         expect(redirSpy).toHaveBeenCalledWith(
//           'qqycye950l689c98l7z5j43n4484ssnp4y3uu4ramr',
//           {
//             activePage: 'SendPage',
//             amount: 11111111,
//             coin: 'bch'
//           }
//         );
//       });

//       it('should handle addresses bch livenet and call to error modal', async () => {
//         const errorModalSpy = spyOn(instance, 'showErrorMessage');
//         instance.search =
//           'bitcoincash:qz8ds306px5n65gffn8u69vvnksfw6huwyjczrvkh3';
//         await instance.processInput();
//         expect(instance.invalidAddress).toBeTruthy();
//         expect(errorModalSpy).toHaveBeenCalled();
//       });

//       it('should handle address xec livenet and call to error modal', async () => {
//         const errorModalSpy = spyOn(instance, 'showErrorMessage');
//         instance.search = 'qpfqlkt4y7v533qfrqu7lg8fwp4evqunegzsngaqae';
//         await instance.processInput();
//         expect(instance.invalidAddress).toBeTruthy();
//         expect(errorModalSpy).toHaveBeenCalled();
//       });
//     });

//     it('should set input as valid if hasContacts', async () => {
//       const checkIfContact = Promise.resolve(undefined);
//       spyOn(instance, 'checkIfContact').and.returnValue(checkIfContact);
//       instance.search = 'Contact';
//       await instance.processInput();
//       expect(instance.invalidAddress).toBeFalsy();
//     });
//   });
// });
