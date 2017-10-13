import { Injectable } from '@angular/core';
import { PlatformProvider } from '../platform/platform';

import { TouchID } from '@ionic-native/touch-id';
import { AndroidFingerprintAuth } from '@ionic-native/android-fingerprint-auth';

@Injectable()
export class TouchIdProvider {

    private _isAvailable: boolean = false;

    constructor(
        private touchId: TouchID,
        private androidFingerprintAuth: AndroidFingerprintAuth,
        private platform: PlatformProvider
    ) { }

    init() {
        if (this.platform.isAndroid) this.checkAndroid();
        if (this.platform.isIOS) this.checkIOS();
    }

    checkIOS() {
        this.touchId.isAvailable()
            .then(
            res => this._isAvailable = true,
            err => console.log("Fingerprint is not available")
            );
    }

    checkAndroid() {
        this.androidFingerprintAuth.isAvailable()
            .then(
            res => {
                if (res.isAvailable) this._isAvailable = true
                else console.log("Fingerprint is not available")
            });
    }

    verifyIOSFingerprint(): Promise<any> {
        return new Promise((resolve, reject) => {
            this.touchId.verifyFingerprint('Scan your fingerprint please')
                .then(
                res => resolve(),
                err => reject()
                );
        });
    }

    verifyAndroidFingerprint(): Promise<any> {
        return new Promise((resolve, reject) => {
            this.androidFingerprintAuth.encrypt({ clientId: 'Copay' })
                .then(result => {
                    if (result.withFingerprint) {
                        console.log('Successfully authenticated with fingerprint.');
                        resolve();
                    } else if (result.withBackup) {
                        console.log('Successfully authenticated with backup password!');
                        resolve();
                    } else console.log('Didn\'t authenticate!');
                })
                .catch(error => {
                    if (error === this.androidFingerprintAuth.ERRORS.FINGERPRINT_CANCELLED) {
                        console.log('Fingerprint authentication cancelled');
                        reject();
                    } else {
                        console.error(error);
                        resolve();
                    }
                });
        });
    }

    isAvailable() {
        return this._isAvailable;
    }

    check(): Promise<any> {
        return new Promise((resolve, reject) => {
            if (!this.isAvailable()) reject();
            if (this.platform.isIOS) {
                this.verifyIOSFingerprint()
                    .then(() => {
                        resolve();
                    })
                    .catch(() => {
                        reject();
                    });
            }
            if (this.platform.isAndroid) {
                this.verifyAndroidFingerprint()
                    .then(() => {
                        resolve();
                    })
                    .catch(() => {
                        reject();
                    });
            }
        });
    }
}
