
# Warning

This NEEDS to be updated.

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


# Development

## Native Shell

To add features that enhance the native experience of Copay, first follow the
directions above under "Running in the Native Shell". It's important to ensure
that functionality within this context should either hook into existing features
or supplement the experience of those features. Copay should continue to operate
full-featured from within a modern web browser.

Shell functionality works by sending and receiving messages between the Copay
application and the shell wrapper. Native functionality should be handled mostly
from within `shell/lib/message-handler.js`, which receives messages conditionally
from the front-end Angular controllers.

Look at `js/shell.js` to see how we determine if Copay is running from within the
native shell context. If we are running within the shell, Copay has access to the
global variable `window.cshell`, which provides access to the messenger. For
instance, to Copay might want to use a native dialog alert in favor of a regular
one if running in this context. You would do this like so:

```js
if (window.cshell) {
  window.cshell.send('alert', 'info', 'Please select a wallet.');
}
else {
  window.alert('Please select a wallet.');
}
```
