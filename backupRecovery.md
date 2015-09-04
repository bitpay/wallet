

# Copay Backup and Restore Notes

## Description

Copay is a Multisig HD Wallet. Copay apps hold the extended private keys for the wallet. The private key never leave the device, so for accessing a wallet funds it is necesary to have the device or the backup of the wallet. 

## Definitions

### Backup Formats:
 * Wallet Seed (WS): 12 words mnemonic backup (available from Copay v1.2+). The 12 words are used as wallet seed, following BIP39 specification. The wallet seed may require a passphrase to recreate the wallet (if that was specified at creation time).
 * Wallet Backup (WB): Exported data from Copay, containing an AES encrypted JSON with many wallet parameters (like extended Private Key, wallet Name, extended public keys of Copayers, etc. See #export-format). This data can be created from Copay v1.2+ (Settings->Export) and it was the default backup format on previous Copay versions. WB can be a file (standart format for Copay desktop versions) or a text (standart from Copay mobile versions).

### Backup recovery cases
 * Case 1: Lost of device holding the wallet
 * Case 2: Change to a new Bitcore Wallet Service (BWS)
 * Case 3: Lost device + new Bitcore Wallet Service

### Wallet Recovery Scope
 * Partial Recovery: Wallet access is restored. It is possible to see wallet balance and past transactions. It is possible to send and receive coins.
 * Full Recovery: All the features of Partial Recovery + Wallet Name, Copayer Names are recovered, Past Spend proposal metadata (who signed, and notes) are recoved.
      
## Wallet Restore Scenarios

### Non multisig wallets

  Case 1: From both WS and WB, full recovery is possible.
    - Enter the WS or the WB at 'Import wallet' in a new device.
    - Wallet access should be restored
    
  Case 2: Partial recovery is possible using the device where the wallet is installed, pointing the the new server (Recreate Wallet feature).
    - Point to the new server
    - If the wallet is not registered at the new Wallet service, a "Recreate" buttom will appear at wallet's home. Click it to recreate the wallet.
    - Wallet should be recreated and funds can be acceded
    - If the wallet existed, it could be needed to rescan Wallet's addresses for fund (from Settings -> Advanced -> Scan Addresses for Funds)
    
  Case 3: From both Backup Words and Backup file, partial recovery is possible.
    (Using WS)
    - Enter the WS at 'Import Wallet'
      If the error "This wallet is not registered at the wallet service" will appear:
      - Go to 'Create Wallet', and enter the WS at 'Advanced Options'. Select a new name for the restored wallet. Total and required number of copayers should be set to 1.
      - Wallet should be recreated and funds can be acceded
      
    (Using WD)
    - Enter the WD at 'Import Wallet'
    - Wallet should be recreated and funds should be accesable 
 

### Multisig wallets

  Case 1: From both WS and WD, full recovery is possible.
    - Enter WS or WD at 'Import wallet' in a new device.
    - Wallet access should be restored
   
  Case 2: Partial recovery is possible using the device where the wallet is installed, pointing the the new server (Recreate Wallet feature).
    - Point to the new server
    - If the wallet is not registered at the new Wallet service, a "Recreate" buttom will appear at wallet's home. Click it to recreate the wallet.
    - Wallet should be recreated and funds should be accesable 
    
    - If the wallet existed, it could be needed to rescan Wallet's addresses for fund (from Settings -> Advanced -> Scan Addresses for Funds)
    
  Case 3: Partial recovery is possible using:

    A) All WS's of the copayers of the wallet 
    - Enter one WS at Create ( at the Advanced option section). Note that the wallet's configuration (M-N and network paramenters) need to be entered and need to match the parameters that where enterered when the wallet was created. Name and Nickname of Copayers need to be entered also, but there is no need for them to match the original wallet setup.
    - Ask other copayers to join the wallet using the given invitation code. All copayers need to enter their WS at Join (at -> Advanced Options -> Wallet Seed).
    - Wallet should be recreated and funds should be accesable 
    
    B) One WD and a quorum of WS of the other members.
      - Using the WD, import the wallet.
      - Ask other copayers to import the wallet using the their WS.
      - Wallet should be recreated and funds should be accesable 
