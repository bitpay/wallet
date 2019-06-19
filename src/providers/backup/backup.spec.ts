import { TestUtils } from '../../test';
import { AppProvider } from '../app/app';
import { BwcProvider } from '../bwc/bwc';
import { ConfigProvider } from '../config/config';
import { DownloadProvider } from '../download/download';
import { PersistenceProvider } from '../persistence/persistence';
import { ProfileProvider } from '../profile/profile';
import { WalletMock } from '../wallet/mocks/wallet.mock';
import { BackupProvider } from './backup';

describe('BackupProvider', () => {
  let backupProvider: BackupProvider;
  let configProvider: ConfigProvider;
  let profileProvider: ProfileProvider;
  let downloadProvider: DownloadProvider;
  let appProvider: AppProvider;
  let persistenceProvider: PersistenceProvider;
  let bwcProvider: BwcProvider;

  const walletMock = {
    id: 'id1',
    credentials: {
      coin: 'btc',
      network: 'livenet',
      n: 1,
      m: 1,
      walletId: 'id1'
    },
    toString: _opts => {
      return '{"walletId": "id1", "xPrivKey": "xPrivKey1", "xPrivKeyEncrypted": "xPrivKeyEncrypted1", "mnemonicEncrypted": "mnemonicEncrypted1", "n": 1}';
    }
  };

  beforeEach(async () => {
    const testBed = TestUtils.configureProviderTestingModule();
    backupProvider = testBed.get(BackupProvider);
    downloadProvider = testBed.get(DownloadProvider);
    profileProvider = testBed.get(ProfileProvider);
    persistenceProvider = testBed.get(PersistenceProvider);
    await persistenceProvider.load();
    configProvider = testBed.get(ConfigProvider);
    configProvider.load();
    bwcProvider = testBed.get(BwcProvider);
    appProvider = testBed.get(AppProvider);
    appProvider.load();
  });

  describe('walletDownload function', () => {
    it('If wallet can not be exported, walletDownload function will be rejected', () => {
      const wallet: WalletMock = new WalletMock();
      const password = '1';
      const opts = {};
      spyOn(profileProvider, 'getWallet').and.returnValue(wallet);
      backupProvider.walletDownload(password, opts, wallet.id).catch(err => {
        expect(err).toEqual('Could not create backup');
      });
    });
    it('If wallet can be exported, walletDownload function will not fail', () => {
      const password = '1';
      const opts = { noSign: true };
      appProvider.info.nameCase = 'test';
      spyOn(profileProvider, 'getWallet').and.returnValue(walletMock);
      spyOn(downloadProvider, 'download').and.returnValue(Promise.resolve());
      backupProvider
        .walletDownload(password, opts, walletMock.credentials.walletId)
        .then(() => {
          expect(downloadProvider.download).toHaveBeenCalled();
        })
        .catch(err => expect(err).toBeNull());
    });
  });

  describe('walletExport function', () => {
    it('If password does not exist, walletExport function will be rejected', () => {
      const password = null;
      const opts = {};
      const walletId = '1ac9a660-c55b-440a-bf40-a66291dcf17a';
      const walletExport = backupProvider.walletExport(
        password,
        opts,
        walletId
      );
      expect(walletExport).toBeNull();
    });
    it('If password exist but wallet can not be exported, walletExport function will be rejected', () => {
      spyOn(bwcProvider, 'getSJCL').and.returnValue({
        encrypt: () => {
          throw new Error('Error');
        }
      });

      const password = '1';
      const opts = {};
      spyOn(profileProvider, 'getWallet').and.returnValue(walletMock);
      const walletId = walletMock.id;
      const walletExport = backupProvider.walletExport(
        password,
        opts,
        walletId
      );
      expect(walletExport).toBeNull();
    });
    it('If everything is ok, walletExport function will not fail', () => {
      const password = '1';
      const opts = {
        addressBook: {
          mnH3XUZ8CmH8CMruEfCDXGc83XLSn8szbm: {
            address: 'mnH3XUZ8CmH8CMruEfCDXGc83XLSn8szbm',
            email: 'asd@sad.com',
            name: 'jp'
          }
        },
        noSign: false,
        password: '1'
      };
      spyOn(profileProvider, 'getWallet').and.returnValue(walletMock);
      const walletExport = backupProvider.walletExport(
        password,
        opts,
        walletMock.credentials.walletId
      );
      expect(walletExport).toBeDefined();
    });
  });
});
