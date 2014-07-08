## Running in the Native Shell

Copay can be executed from within a "native" application shell, providing some
additional features such as native menus, notifications, tray integration, etc.
This is accomplished using [Atom Shell](https://github.com/atom/atom-shell).

To run and test Copay from within this context, first download the atom-shell
package to `shell/bin/{platform}` (ignored by git), by running:

```
npm run setup-shell
```

Once this script has completed, you can launch the shell-based Copay by running:

```
npm run shell
```

## Building Native Shell Binaries/Installers (OSX)

```
npm run dist
```

This script will download atom shell binaries and combine them with Copay sources
to build a DMG for osx-x64, an installer EXE for win32, and a .tar.gz for linux-x64.
It was developed to be run on OSX.  The outputs are copied to the dist directory.

DMG is created with hdiutil
EXE is created with makensis (brew install makensis)
