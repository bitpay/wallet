

# Copay Backup and Restore Notes

## Description

Copay is a Multisig HD Wallet. Copay app holds the extended private keys for the wallet. The private key never leaves the device, so for accessing a wallet funds it is necesary to have the device or a backup of the wallet.

## Definitions

### Backup Formats:
 * Wallet recovery phrase (RP): 12 words mnemonic backup (available from Copay v1.2+). The 12 words are used as wallet seed, following BIP39 specification. The wallet RP may require a passphrase to recreate the wallet (if one was specified at creation time).
 * Wallet Backup (WB): Exported data from Copay, containing an AES encrypted JSON with many wallet parameters (like extended private key, wallet name, extended public keys of copayers, etc. See #export-format). This data can be created from Copay v1.2+ (Settings -> Advanced -> Export) and it was the default backup format on previous Copay versions. WB can be a file (standard format for Copay desktop versions) or a text (standard for Copay mobile versions).

### Backup recovery cases
 * Case 1: Lost of device holding the wallet
 * Case 2: Change to a new Bitcore Wallet Service (BWS)
 * Case 3: Lost device + new Bitcore Wallet Service

### Wallet Recovery Scope
 * Basic Recovery: Wallet access is restored. It is possible to see wallet balance and past transactions. It is possible to send and receive payments.
 * Full Recovery: All the features of Partial Recovery + wallet name, copayer names are recovered, past payment proposal metadata (who signed, and notes) are recovered.

## Wallet Restore Scenarios

### Non-multisig wallets

  Case 1: From both RP and WB, full recovery is possible.
    - Enter the RP or the WB at 'Import wallet' in a new device.
    - Wallet access should be restored.

  Case 2: Basic recovery is possible using the device where the wallet is installed, pointing to the new server (Recreate wallet feature).
    - Point to the new server (Settings -> Bitcore Wallet Service).
    - If the wallet is not registered at the new Wallet service, a 'Recreate' button will appear at wallet's home. Click it to recreate the wallet.
    - Wallet should be recreated and access to funds should be restored.
    - If the wallet existed, it may be necessary to rescan Wallet's addresses for funds (from Settings -> Advanced -> Scan Addresses for Funds)

  Case 3: From both Backup Words and Backup file, basic recovery is possible.
    (Using RP)
    - Enter the RP at 'Import Wallet'
      If the error "This wallet is not registered at the wallet service" appears:
      - Go to 'Create Wallet', and enter the RP at 'Advanced Options'. Select a new name for the restored wallet. Total and required number of copayers should be set to 1.
      - Wallet should be recreated and access to funds should be restored.

    (Using WB)
    - Enter the WB at 'Import Wallet'
    - Wallet should be recreated and access to funds should be restored.


### Multisig wallets

  Case 1: From both RP and WB, full recovery is possible.
    - Enter RP or WB at 'Import wallet' in a new device.
    - Wallet access should be restored.

  Case 2: Basic recovery is possible using the device where the wallet is installed, pointing the the new server (Recreate Wallet feature).
    - Point to the new server (Settings -> Advanced -> Wallet Service URL).
    - If the wallet is not registered at the new Wallet service, a 'Recreate' button will appear at wallet's home. Click it to recreate the wallet.
    - Wallet should be recreated and access to funds should be restored.
    - If the wallet existed, it may be necessary to rescan Wallet's addresses for funds (from Settings -> Advanced -> Wallet information -> Scan Addresses for Funds)

  Case 3: Basic recovery is possible using:

    A) RP of all copayers in the wallet
      - Enter one RP at Create (at the Advanced option section). Note that the wallet configuration (M-of-N and network paramenters) needs to match the parameters that where entered when the wallet was first created. Wallet name and copayer nicknames need to be entered also, but there is no need for them to match the original wallet setup.
      - Ask other copayers to join the wallet using the given invitation code. All copayers need to enter their RP at Join (at -> Advanced Options -> Wallet Seed).
      - Wallet should be recreated and access to funds should be restored.

    B) One WB and a quorum of RP of the other members.
      - Using the WB, import the wallet.
      - Ask other copayers to import the wallet using their RP.
      - Wallet should be recreated and funds should be accesable

      In this case, Copayers will not be able to decrypt the 'notes' field on the new Spend Proposals, because the shared secret stored at the WB is not longer known by other copayers.


### Hardware wallets

In case hardware based wallet is created and then the hardware device is lost, it is possible, using Copay, to access the funds in case the hardware device seed (mnemonic) is available.

In order to recover a hardware wallet you need to enter the RP in
   Create or the Join wallet -> Advance options -> specify RP.

You can select the account you need to import and select if the wallet is multisig or not thru the `derivation path`: Copay uses `m/48'` for multisignature hardware wallets, and `m/44'` for all the other wallet types. The format is the following:

  m/XX'/<coin_type>'/<account'>

For harward wallets, `coin_type` is always `0`.

For example, if you need to import a non-multisignatured wallet, account 8, you should enter: `m/44'/0'/8'`
Note that TREZOR use 1-based account numbers, so if your are trying for example to recover TREZOR multisig account #8, you should enter `m/48'/0'/7'`.

