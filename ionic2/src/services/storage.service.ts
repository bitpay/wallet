import { Injectable } from '@angular/core';

@Injectable()
export class StorageService {

  getConfig(cb) {

  }

  storeConfig(config, cb) {

  }

  removeConfig(cb) {

  }

  setBackupFlag(walletId, cb) {}

  getBackupFlag(walletId, cb) {}

  getHideBalanceFlag(walletId, cb) {}

  getProfile(cb) {}

  storeProfile(profile, cb) {}

  storeNewProfile(profile, cb) {}

  clearLastAddress(walletId, cb){}

  removeAllWalletData(walletId, cb) {}

  getAddressbook(network, cb) {}

  setAddressbook(network, addressBook, cb) {}

  setHideBalanceFlag(walletId, balanceHidden, cb) {}

  getCopayDisclaimerFlag(cb) {}

  tryToMigrate(cb) {}

}
