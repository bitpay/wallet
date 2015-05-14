CHANGES
=======

v0.2.1
------

New features
------------
 * Smart backup restore procedure: now it is possible to restore all wallet's fund with an old backup  (thanks Ian for the feedback).
 * Transaction proposals can now have a short note attached for reference (thanks Gentry for the feedback).
 * New wallet settings: Bitcoin Unit, defaults to *bits* (thanks Eric for the suggestion)
 * Backup is now auto generated on wallet completion (thanks Eric for the suggestion)
 * A wallet now can be removed from a particular system from the UX.
 * New address book shared between copayers.
 
Security
--------
 * Asymmetric encryption and signing using ECIES. Details at https://gist.github.com/ryanxcharles/c29fc94d31de7c8c89dc
 * Default SSL connection to Insight and PeerJs servers 
  
Code quality
------------
 * Test coverage from  60.9% to 74% (1) (thanks Ryan for insisting on this)
 * Mayor refactoring of Angular services (backupService, controllerUtils, wallet's Indexes handling, txProposal merge related functions, 
 * Add +30 karma tests for Angular controllers and services
 * Unified js-beautifier format throw all the code
 
Other
-----
 * Backup to email have been removed
 * Performance improvements when signing transactions
 * Review of Copay 1-of-1 UX
 * Minor UX and wording fixes (address list on receiving funds, notifications fixes, error handling on bad passwords, network timeouts, feedback at importing process, etc).

Next steps
----------
 * Make Copay available in other platforms (update Gordon's Atom shell packages, Android bundle, Firefox / Chrome extensions).
 * Implement Copay 2.0 design: http://invis.io/FWZGJWUS  (please take a look at leave comments)


Please check https://github.com/bitpay/copay/wiki/Copay-Known-issues before using Copay.


(1) not including Karma tests, not included on Coveralls yet.

