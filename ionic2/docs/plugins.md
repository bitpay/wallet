# Copay Plugins

Most of Copay is powered by plugins – secure, self-contained applications which add functionality to Copay.

Copay plugins run in tightly-controlled containers, and are only able to access resources with user permission. This allows Copay to be safely extended by developers.

## Getting Started

The Copay repo includes several plugins which are built into the published app. The `starter` plugin is intended to demonstrate the functionality of the plugin API and help new developers get off the ground quickly.

To get started, simply clone the Copay repo, and begin editing the plugin in `src/plugins/starter`. The `npm start` command will also make the `starter` plugin available in the app.

## Copay Plugin Architecture

Like the app, Copay plugins are built with standard web technologies (HTML, CSS, and Javascript) – code can be written once and run on all platforms.

Particularly for the Copay ecosystem, this serves an important security function: with more consumers, critical code is more stable, better code-reviewed, and more thoroughly tested. This network effect improves security for all users, and significantly boosts security of less popular platforms.

### Plugin Sandboxing

All Copay plugins run inside "sandboxes", containers which prevent them from accessing or modifying Copay's source code or data. Plugins must connect to the Internet, receive data, and perform other permissioned operations through Copay's Plugin API.

This layer of security reduces the potential impact of bugs and malicious code, while providing users with the control and flexibility to safely try new plugins.

### Plugin Service

All Copay plugins must provide a `service` – an ongoing process which handles core functionality for the plugin. A service is instantiated in a web worker for each active plugin instance when Copay starts up. The service is responsible for reporting the plugin's status to Copay.

### Plugin User-Interface

Copay plugins can also provide a user-interface. Each instance runs in a restricted `iframe` HTML element, communicating with it's service through the Plugin API. This allows plugins to provide a complete, interactive user-interface. The built-in bitcoin wallet is a plugin, for example.

Plugins developers are free to develop unique and complex interfaces within the plugin's iframe view, and can provide a further enhanced experience with various hooks into Copay's scanner, settings, and other systems.

### Communicating with Copay

Plugin's communicate with Copay via an RPC-like, `PostMessage`-based Plugin API. A Javascript/Typescript wrapper-library, `CopayPluginClient`, makes interacting with the Copay Plugin API simple.

# Copay Plugin API

# Copay Plugin Client API Reference

The Copay Plugin Client API is designed to be intuitive, well-namespaced, and easily typechecked.

#### `copay.ready()`

#### `copay.close()`

## Preferences

#### `copay.preferences.notifications.getEmail() => Promise<String>` (Requires permission)

#### `copay.preferences.getLanguage() => Promise<Language>`

#### `copay.preferences.getDisplayUnit() => Promise<DisplayUnit>`

#### `copay.preferences.getValueEstimationCurrency() => Promise<Currency>`

#### `copay.preferences.getNetworkFeePolicy() => Promise<NetworkFeePolicy>`

## Instance

#### `copay.instance.setName(name: string) => Promise<boolean>`

#### `copay.instance.setStatus(status: string) => Promise<boolean>`

#### `copay.instance.setNextBitcoinAddress(address: string) => Promise<boolean>`
- used by receive view
- QR code uses this if another QRString isn't set

#### `copay.instance.setQRString(string: string) => Promise<boolean>`
- for plugins using their QR code for non-bitcoin address data

#### `copay.instance.getInstallParams() => Promise<Object>`

Instance install params can be set by installing a plugin instance from a deeplink URI, where the `p` parameter is a JSON object of install params, eg: `copay://install?id=PLUGINID&p={"join":"ABCDEFG"}`

Which would return:
```
{
  "join": "ABCDEFG"
}
```

#### `copay.instance.archive()`

Immediately shut down and archive this plugin. All data is kept and can be restored.

The user can archive and unarchive plugins from their preferences.

#### `copay.instance.setPrivacy(on: true)`

If privacy is enabled, the plugin is not visible unless the 'Show Private Wallets' option is active in preferences.

#### `copay.instance.getMasterPrivateKey()`

## Storage

#### `copay.storage.get(key: string)`

#### `copay.storage.set(key: string, value: any)`

## Scanner

#### `copay.scanner.registerURI()`

#### `copay.scanner.registerPattern()`

#### `copay.scanner.getRegistrations()`

### Special Patterns

#### `copay.scanner.registerForBitcoinAddresses()`
#### `copay.scanner.registerForBitcoinPrivateKeys()`
#### `copay.scanner.registerForEncryptedBitcoinPrivateKeys()`
#### `copay.scanner.registerForBitcoinTransactionIds()`
#### `copay.scanner.registerForBitcoinPaymentRequests()`

## Deep Linking

#### `copay.deeplink.setHandler()`


## Capabilities

#### `copay.capabilities.get_______()`


## Miscellaneous

#### `copay.openURI(uri: string) => Promise<boolean>`


## Bitcore?

#### copay.bitcore. [...]

## BWS?

#### `copay.bws.monitorAddresses()`

#### `copay.bws.unmonitorAddresses()`
