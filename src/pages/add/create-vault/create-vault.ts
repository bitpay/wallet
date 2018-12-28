import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { NavController } from 'ionic-angular';

// Providers
import { DerivationPathHelperProvider } from '../../../providers/derivation-path-helper/derivation-path-helper';
import { PopupProvider } from '../../../providers/popup/popup';
import { ProfileProvider } from '../../../providers/profile/profile';

@Component({
  selector: 'page-create-vault',
  templateUrl: 'create-vault.html'
})
export class CreateVaultPage {
  private derivationPathByDefault: string;
  private derivationPathForTestnet: string;

  public showAdvOpts: boolean;
  public seedOptions;
  public okText: string;
  public cancelText: string;
  public createVaultForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private profileProvider: ProfileProvider,
    private derivationPathHelperProvider: DerivationPathHelperProvider,
    private popupProvider: PopupProvider,
    private translate: TranslateService,
    private navCtrl: NavController
  ) {
    this.okText = this.translate.instant('Ok');
    this.cancelText = this.translate.instant('Cancel');

    this.derivationPathByDefault = this.derivationPathHelperProvider.default;
    this.derivationPathForTestnet = this.derivationPathHelperProvider.defaultTestnet;
    this.showAdvOpts = false;

    this.createVaultForm = this.fb.group({
      vaultName: [null, Validators.required],
      selectedSeed: ['new'],
      recoveryPhrase: [null],
      derivationPath: [this.derivationPathByDefault]
    });
    this.updateSeedSourceSelect();
  }

  private updateSeedSourceSelect(): void {
    this.seedOptions = [
      {
        id: 'new',
        label: this.translate.instant('Random'),
        supportsTestnet: true
      },
      {
        id: 'set',
        label: this.translate.instant('Specify Recovery Phrase'),
        supportsTestnet: false
      }
    ];
    this.createVaultForm.controls['selectedSeed'].setValue(
      this.seedOptions[0].id
    ); // new or set
  }

  public seedOptionsChange(seed): void {
    if (seed === 'set') {
      this.createVaultForm
        .get('recoveryPhrase')
        .setValidators([Validators.required]);
    } else {
      this.createVaultForm.get('recoveryPhrase').setValidators(null);
    }
    this.createVaultForm.controls['selectedSeed'].setValue(seed); // new or set
    this.createVaultForm.controls['recoveryPhrase'].setValue(null);
  }

  public setDerivationPath(): void {
    const path: string = this.createVaultForm.value.testnet
      ? this.derivationPathForTestnet
      : this.derivationPathByDefault;
    this.createVaultForm.controls['derivationPath'].setValue(path);
  }

  public setOptsAndCreate(): void {
    const opts: any = {};

    const setSeed = this.createVaultForm.value.selectedSeed == 'set';
    if (setSeed) {
      const words = this.createVaultForm.value.recoveryPhrase || '';
      if (
        words.indexOf(' ') == -1 &&
        words.indexOf('prv') == 1 &&
        words.length > 108
      ) {
        opts.extendedPrivateKey = words;
      } else {
        opts.mnemonic = words;
      }

      const derivationPath = this.createVaultForm.value.derivationPath;
      opts.networkName = this.derivationPathHelperProvider.getNetworkName(
        derivationPath
      );
      opts.derivationStrategy = this.derivationPathHelperProvider.getDerivationStrategy(
        derivationPath
      );
      opts.account = this.derivationPathHelperProvider.getAccount(
        derivationPath
      );

      if (
        !opts.networkName ||
        !opts.derivationStrategy ||
        !Number.isInteger(opts.account)
      ) {
        const title = this.translate.instant('Error');
        const subtitle = this.translate.instant('Invalid derivation path');
        this.popupProvider.ionicAlert(title, subtitle);
        return;
      }
    }

    if (setSeed && !opts.mnemonic && !opts.extendedPrivateKey) {
      const title = this.translate.instant('Error');
      const subtitle = this.translate.instant(
        'Please enter the wallet recovery phrase'
      );
      this.popupProvider.ionicAlert(title, subtitle);
      return;
    }

    const id = 0; // Default Id
    const vault = {
      id,
      name: this.createVaultForm.value.vaultName,
      walletIds: []
    };

    this.profileProvider.createVault(vault, opts);
    this.navCtrl.popToRoot();
  }
}
