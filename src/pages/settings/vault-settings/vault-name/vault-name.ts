import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NavController } from 'ionic-angular';
import { Logger } from '../../../../providers/logger/logger';

// providers
import { PersistenceProvider } from '../../../../providers/persistence/persistence';

@Component({
  selector: 'page-vault-name',
  templateUrl: 'vault-name.html'
})
export class VaultNamePage {
  public vault;
  public vaultNameForm: FormGroup;

  constructor(
    private navCtrl: NavController,
    private formBuilder: FormBuilder,
    private logger: Logger,
    private persistenceProvider: PersistenceProvider
  ) {
    this.vaultNameForm = this.formBuilder.group({
      vaultName: [
        '',
        Validators.compose([Validators.minLength(1), Validators.required])
      ]
    });
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: VaultNamePage');
  }

  ionViewWillEnter() {
    this.persistenceProvider.getVault().then(vault => {
      this.vault = vault;
      this.vaultNameForm.controls['vaultName'].setValue(vault.name);
    });
  }

  public save(): void {
    this.vault.name = this.vaultNameForm.value.vaultName;
    this.persistenceProvider.storeVault(this.vault);
    this.navCtrl.pop();
  }
}
