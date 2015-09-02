

# Copay Mnemonic Notes

## Definitions

### Backup Formats:
 * Backup Words: 12 words mnemonic created as backup in Copay (from version v1.2)
 * Backup File: Exported file from Copay, containing an AES encrypted JSON (see #export-format).

### Backup recovery cases
 * Case 1: Lost of device holding the wallet
 * Case 2: Change to a new Bitcore Wallet Service (BWS)
 * Case 3: Lost device + new Bitcore Wallet Service

### Wallet Recovery Scope
 * Partial Recovery: Wallet access is restored. It is possible to see wallet balance and past transactions. It is possible to send and receive coins.
 * Full Recovery: All the features of Partial Recovery + Wallet Name, Copayer Names are recovered, Past Spend proposal metadata (who signed, and notes) are recoved.
      
## Wallet Restore Scenarios

### Non multisig wallets

  Case 1: From both Backup Words and Backup file, full recovery is possible.
    - Enter the backup words or file at 'Import wallet' in a new device.
    
  Case 2: Partial recovery is possible using the device where the wallet is installed, pointing the the new server (Recreate Wallet feature).
    - Point to the new server
    - If the wallet is not registered at the new Wallet service, a "Recreate" buttom will appear at wallet's home. Click it to recreate the wallet.
    - If the wallet existed, it could be needed to rescan Wallet's addresses for fund (from Settings -> Advanced -> Scan Addresses for Funds)
    
  Case 3: From both Backup Words and Backup file, partial recovery is possible.
    (Using Backup Words)
    - Enter the Backup Words at 'Import Wallet'
      If the error "This wallet is not registered at the wallet service" appear:
      - Go to 'Create Wallet', and enter the Backup Words at 'Advanced Options'
    (Using Backup File)
    - Enter the Backup File at 'Import Wallet'
 

### Multisig wallets

  Case 1: From both Backup Words and Backup file, full recovery is possible.
    - Enter the backup words or file at 'Import wallet' in a new device.
   
  Case 2: Partial recovery is possible using the device where the wallet is installed, pointing the the new server (Recreate Wallet feature).
    - Point to the new server
    - If the wallet is not registered at the new Wallet service, a "Recreate" buttom will appear at wallet's home. Click it to recreate the wallet.
    - If the wallet existed, it could be needed to rescan Wallet's addresses for fund (from Settings -> Advanced -> Scan Addresses for Funds)
    
  Case 3: Partial recovery is possible using:

    A) All the Backup Words of the copayers of the wallet or 
    - Enter Backup Words at Create or Join Wallet ( at the Advanced option sections). Note that the wallet's configuration (M-N and network paramenters) need to be entered and need to match the parameters that where enterered when the wallet was created. Name and Nickname of Copayers need to be entered also, but there is no need for them to match the original wallet setup.
    - Ask other copayers to join the wallet using the given invitation code. All copayers need to enter their Backup Words at Join -> Advanced Options -> Backup Words.
    
    B) One File Backup and a quorum of Backup Words of the other members.
      - Using the File Backup, import the wallet.
      - Ask other copayers to import the wallet using the their Backup words.
