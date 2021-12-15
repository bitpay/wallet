import { Component, ComponentRef, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertController, AlertOptions, AnimationController } from '@ionic/angular';
import { InfoSheetType } from 'src/app/providers/action-sheet/action-sheet';
import { AppProvider } from 'src/app/providers/app/app';
import { DomProvider } from 'src/app/providers/dom/dom';
import { InfoSheetComponent } from '../../components/info-sheet/info-sheet';
import { ActionSheetParent } from '../action-sheet/action-sheet-parent';

@Component({
  selector: 'encrypt-password',
  templateUrl: 'encrypt-password.html',
  styleUrls: ['encrypt-password.scss'],
})
export class EncryptPasswordComponent extends ActionSheetParent {
  public showForm: boolean;
  public encryptPasswordForm: FormGroup;
  public isCopay: boolean;
  public passwordInputType: string = 'password';
  public confirmPasswordInputType: string = 'password';
  zone;
  constructor(
    private domProvider: DomProvider,
    private fb: FormBuilder,
    private appProvider: AppProvider,
    private alert: AlertController,
    public animationCtrl: AnimationController
  ) {
    super();
    this.zone = new NgZone({ enableLongStackTrace: false });
    this.isCopay = this.appProvider.info.name === 'copay';
    this.encryptPasswordForm = this.fb.group(
      {
        password: ['', Validators.required],
        confirmPassword: ['', Validators.required]
      },
      { validator: this.matchingPasswords('password', 'confirmPassword') }
    );
  }

  private matchingPasswords(passwordKey: string, confirmPasswordKey: string) {
    return (group: FormGroup) => {
      const password = group.controls[passwordKey];
      const confirmPassword = group.controls[confirmPasswordKey];
      if (password.value !== confirmPassword.value) {
        return {
          mismatchedPasswords: true
        };
      }
      return undefined;
    };
  }

  public showInfoSheet() {
    const _this = this;
    const opts: AlertOptions = {
      header: 'Are you sure?',
      message: 'Without encrypting your wallet, a thief or another app on this device could potentially access your money.',
      buttons: [
        {
          text: 'GO BACK',
          role: 'cancel',
          handler: (value) => {
            //do nothing
          }
        },
        {
          text: "I'M SURE",
          handler: (value) => {
            _this.dismiss();
          }
        }
      ],
      cssClass: 'custom',
    };
    this.alert.create(opts).then((alertElement) => {
      alertElement.present();
    });
  }

  public createInfoSheet(type: InfoSheetType, params?): InfoSheetComponent {
    return this.setupSheet<InfoSheetComponent>(InfoSheetComponent, type, params)
      .instance;
  }

  private setupSheet<T extends ActionSheetParent>(
    componentType: { new(...args): T },
    sheetType?: string,
    params?
  ): ComponentRef<T> {
    const sheet = this.domProvider.appendComponentToBody<T>(componentType);
    sheet.instance.componentRef = sheet;
    sheet.instance.sheetType = sheetType;
    sheet.instance.params = params;
    return sheet;
  }

  public next(): void {
    this.showForm = true;
  }

  public confirm(password: string): void {
    this.dismiss(password);
  }
}
