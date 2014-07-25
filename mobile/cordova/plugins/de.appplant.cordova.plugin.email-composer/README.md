Cordova EmailComposer Plugin
====================

The plugin provides access to the standard interface that manages the editing and sending an email message. You can use this view controller to display a standard email view inside your application and populate the fields of that view with initial values, such as the subject, email recipients, body text, and attachments. The user can edit the initial contents you specify and choose to send the email or cancel the operation.

Using this interface does not guarantee immediate delivery of the corresponding email message. The user may cancel the creation of the message, and if the user does choose to send the message, the message is only queued in the Mail application outbox. This allows you to generate emails even in situations where the user does not have network access, such as in airplane mode. This interface does not provide a way for you to verify whether emails were actually sent.

### Plugin's Purpose
The purpose of the plugin is to create an platform independent javascript interface for [Cordova][cordova] based mobile applications to access the specific email composition API on each platform.


## Supported Platforms
- **iOS**<br>
*See [MFMailComposeViewController Class Reference][ios_guide] for detailed informations and screenshots.*

- **Android**

- **WP8**<br>
*See [How to use the email compose task for Windows Phone][wp8_guide] for detailed informations.*


## Dependencies
- [MessageUI.framework][messageui_framework]


## Installation
The plugin can either be installed into the local development environment or cloud based through [PhoneGap Build][PGB].

### Adding the Plugin to your project
Through the [Command-line Interface][CLI]:
```bash
# ~~ from master ~~
cordova plugin add https://github.com/katzer/cordova-plugin-email-composer.git && cordova prepare
```
or to use the last stable version:
```bash
# ~~ stable version ~~
cordova plugin add de.appplant.cordova.plugin.email-composer && cordova prepare
```

### Removing the Plugin from your project
Through the [Command-line Interface][CLI]:
```bash
cordova plugin rm de.appplant.cordova.plugin.email-composer
```

### PhoneGap Build
Add the following xml to your config.xml to always use the latest version of this plugin:
```xml
<gap:plugin name="de.appplant.cordova.plugin.email-composer" />
```
or to use an specific version:
```xml
<gap:plugin name="de.appplant.cordova.plugin.email-composer" version="0.8.0" />
```
More informations can be found [here][PGB_plugin].


## ChangeLog
#### Version 0.8.2 (not yet released)
- [***change:***] Renamed `absolute:` to `file:`
- [***change:***] Removed `relative:` attachment prefix
- [enhancement:] New `res:` attachment prefix
- [enhancement:] New `www:` attachment prefix
- [feature:] Bring back simple callback support (Android, iOS)

#### Further informations
- See [CHANGELOG.md][changelog] to get the full changelog for the plugin.


## Using the plugin
The plugin creates the object ```window.plugin.email``` with following methods:

### Plugin initialization
The plugin and its methods are not available before the *deviceready* event has been fired.

```javascript
document.addEventListener('deviceready', function () {
    // window.plugin.email is now available
}, false);
```

### Determine if the device is able to send emails
The ability to send emails can be revised through the `email.isServiceAvailable` interface.<br>
The method takes a callback function, passed to which is a boolean property. Optionally the callback scope can be assigned as a second parameter.

The Email service is only available on devices capable which are able to send emails. E.g. which have configured an email account and installed an email app.<br>
You can use this function to hide email functionality from users who will be unable to use it.

```javascript
window.plugin.email.isServiceAvailable(
    function (isAvailable) {
        // alert('Service is not available') unless isAvailable;
    }
);
```

### Open a pre-filled email draft
A pre-filled email draft can be opened through the `email.open` or `email.openDraft` interface.<br>
The method takes a hash as an argument to specify the email's properties. All properties are optional. Further more it accepts an callback function to be called after the email view has been dismissed.

After opening the draft the user may have the possibilities to edit, delete or send the email.

#### Further informations
- An [configured email account][is_service_available] is required to send emails.
- Attachments can be either base64 encoded datas, files from the the device storage or assets from within the *www* folder.
- The default value for *isHTML* is *true*.
- See the [examples][examples] of how to create and show an email draft.

```javascript
window.plugin.email.open({
    to:          Array, // email addresses for TO field
    cc:          Array, // email addresses for CC field
    bcc:         Array, // email addresses for BCC field
    attachments: Array, // paths to the files you want to attach or base64 encoded data streams
    subject:    String, // subject of the email
    body:       String, // email body (could be HTML code, in this case set isHtml to true)
    isHtml:    Boolean, // indicats if the body is HTML or plain text
}, callback, scope);
```


## Examples

### Open an email draft
The following example shows how to create and show an email draft pre-filled with different kind of properties.

```javascript
window.plugin.email.open({
    to:      ['max.mustermann@appplant.de'],
    cc:      ['erika.mustermann@appplant.de'],
    bcc:     ['john.doe@appplant.com', 'jane.doe@appplant.com'],
    subject: 'Greetings',
    body:    'How are you? Nice greetings from Leipzig'
});
```

Of course its also possible to open a blank email draft.
```javascript
window.plugin.email.open();
```

### Send HTML encoded body
Its possible to send the email body either as text or HTML. In the case of HTML the `isHTML` properties needs to be set.

```javascript
window.plugin.email.open({
    to:      ['info@appplant.de'],
    subject: 'Congratulations',
    body:    '<h1>Happy Birthday!!!</h1>',
    isHtml:  true
});
```

### Get informed when the view has been dismissed
The `open` method supports additional callback to get informed when the view has been dismissed.

```javascript
window.plugin.email.open(properties, function () {
    console.log('email view dismissed');
}, this);
```

### Adding attachments
Attachments can be either base64 encoded datas, files from the the device storage or assets from within the *www* folder.

#### Attach Base64 encoded content
The code below shows how to attach an base64 encoded image which will be added as a image with the name *icon.png*.

```javascript
window.plugin.email.open({
    subject:     'Cordova Icon',
    attachments: ['base64:icon.png//iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAA6/...']
});
```

#### Attach files from the device storage
The path to the files must be defined absolute from the root of the file system. The kind of the path may vary between mobile platforms.

```javascript
window.plugin.email.open({
    attachments: [
        'file:///storage/sdcard/icon.jpg', //=> Android
        'file:///Users/.../Library/Application Support/iPhone Simulator/7.0.3/Applications/E7981856-.../HelloCordova.app/icon.jpg' //=> iOS
    ]
});
```

On iOS it is also possible to point to the relative app's Documents directory:

```javascript
window.plugin.email.open({
    attachments: [
        'file://icon.jpg' //=> points to /.../HelloCordova.app/../Documents/icon.jpg (iOS)
    ]
});
```

#### Attach app's resources
Each app has a resource folder, e.g. the *res* folder for Android apps or the *Resource* folder for iOS apps.<br>
The following examples shows how to attach files from within the app's resource folder.

```javascript
window.plugin.email.open({
    attachments: [
        'res://drawable/icon.png', //=> points to res/drawable/icon.png (Android)
        'res://icons/icon.jpg'     //=> points to Resource/icons/icon.png (iOS)
    ]
});
```

#### Attach assets from within the mobile web app folder
The path to the files must be defined relative from the root of the mobile web app folder, which is located under the *www* folder.

```javascript
window.plugin.email.open({
    attachments: [
        'www://img/logo.png' //=> e.g. assets/www/img/logo.png (Android)
    ]
});
```


## Quirks

### Email composer under Android and Windows Phone
An configured email account is required to send emails.

### Limited support for Windows Phone 8
Attachments and HTML formatted body are not supported.

### TypeError: Cannot read property 'currentVersion' of null
Along with Cordova 3 and Windows Phone 8 the `version.bat` script has to be renamed to `version`.

On Mac or Linux
```
mv platforms/wp8/cordova/version.bat platforms/wp8/cordova/version
```
On Windows
```
ren platforms\wp8\cordova\version.bat platforms\wp8\cordova\version
```

### Compile error on iOS
The error indicates, that the `MessageUI.framework` is not linked to your project. The framework is linked automatically when the plugin was installed, but may removed later.

```
Undefined symbols for architecture i386:
  "_OBJC_CLASS_$_MFMailComposeViewController", referenced from:
      objc-class-ref in APPEmailComposer.o
ld: symbol(s) not found for architecture i386
clang: error: linker command failed with exit code 1 (use -v to see invocation)
```


## Contributing

1. Fork it
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create new Pull Request


## License

This software is released under the [Apache 2.0 License][apache2_license].

© 2013-2014 appPlant UG, Inc. All rights reserved


[cordova]: https://cordova.apache.org
[ios_guide]: http://developer.apple.com/library/ios/documentation/MessageUI/Reference/MFMailComposeViewController_class/Reference/Reference.html
[wp8_guide]: http://msdn.microsoft.com/en-us/library/windowsphone/develop/hh394003.aspx
[CLI]: http://cordova.apache.org/docs/en/3.0.0/guide_cli_index.md.html#The%20Command-line%20Interface
[PGB]: http://docs.build.phonegap.com/en_US/3.3.0/index.html
[PGB_plugin]: https://build.phonegap.com/plugins/522
[messageui_framework]: #compile-error-on-ios
[changelog]: https://github.com/katzer/cordova-plugin-email-composer/blob/master/CHANGELOG.md
[is_service_available]: #determine-if-the-device-is-able-to-send-emails
[examples]: #examples
[apache2_license]: http://opensource.org/licenses/Apache-2.0
