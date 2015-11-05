
Copay accepts three base derivation paths:

  * m/44' 
  * m/48' (only used for MULTISIGNATURE, HARDWARE Wallets)
  * m/45' (deprecated and it is only supported for old wallets)

Both m/44 and m/48 follow the BIP44 standard:

m/XX'/<coin_type>'/<account'>

Supported cointypes are: 0: Livenet, and 1: Testnet

If you need to import a wallet from a mnemonic using an account different
from the default (0), use, for example:

  m/44'/0'/11'

to import account 11.

In case you have a multisignature wallet originally created from a hardware device, and you had loose access to the device, you will need to enter the 24 mnemonic backup (from the device) and a path like:


  m/48'/0'/8'

for a multisignature wallet, account 8.

Finally, note that TREZOR use 1-based account numbers, so if your are trying for example to recover TREZOR multisig account #8, you should enter `m/48'/0'/7'`.
