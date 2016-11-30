# Seeds &amp; Profiles

All private keys within the standard Copay system are derived from a root, hardened private key called the `profile`. Each profile is derived from a `seed` and the profile's `seedPosition`. Copay can handle multiple profiles, derived from multiple seeds.

## Overview

Below is a graphical summary of the BIP0032 tree structure used to derive plugins' `masterPrivateKey`s. For simplicity, some branches of the tree have been omitted with `...`.

```
Seed            Profile            Plugin ID         Instance

[Seed A] ------ 0 ---------------- id("backup") ---- 0
             |                  |
             |                  |- id("wallet") ---- 0
             |                  |                 |- 1
             |                  |                 |- 2
             |                  |                 |- 3
             |                  |                 |- hash("dog")
             |                  |
             |                  |- id("hivemind") -- 0
             |- 1 ...
             |- 2 ...
             |- hash("cat") ...

[Seed B] ------ 0 ...
```

This graphic includes two (hypothetical) functions, each of which return a very large number:
- `hash` – creates a hash using the provided password.
- `id` – returns the `Authbase` of the BitAuth Identity authenticating the plugin's codebase.

This user has 5 profiles, 4 derived from `Seed A`, and 1 derived from `Seed B`. Only the first profile is expanded, but inside we can see that 3 plugins are being used: `backup`, `wallet`, and `hivemind`. Only the `wallet` plugin has more than one instance – the user has 5 separate wallets in this profile.

The user has one "side profile" (derived from `Seed A` using the password: `cat`). The user also has one "side wallet" (derived from `Seed A`, Profile `0`, and the password: `dog`). These entities are intentionally unrecoverable without the password, and their existence is plausibly-deniable.

Note, BIP0032 hardened-derivation is used for all tree levels.

## Seeds

The seed is 128-256 bits of entropy, displayed to the user as 12-24 words using BIP0039 encoding-only mode (which can be physically record or memorized).

Copay can store multiple seeds, and multiple profiles can be derived from a single seed.

## Profile

## Plugin ID

## Instance
