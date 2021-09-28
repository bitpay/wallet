const fs = require('fs');
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

const file = `${__dirname}/../app-template/config-template.xml`;
let content = fs.readFileSync(file, 'utf8');

readline.question('Which platform? (ios or android): ', entry => {
  if (!['ios', 'android'].includes(entry)) {
    console.error('invalid platform');
    readline.close();
    return;
  }
  readline.question('Enter Braze key: ', key => {
    readline.question('Enter Braze endpoint: ', endpoint => {
      const platform = entry.toUpperCase();
      if (platform === 'ANDROID') {
        readline.question('Enter fcm senderId: ', senderId => {
          const brazeXML = `<?xml version="1.0" encoding="utf-8"?>
              <resources>
                <string name="com_appboy_api_key">${key}</string>
                <string name="com_appboy_custom_endpoint">${endpoint}</string>
                <bool name="com_appboy_firebase_cloud_messaging_registration_enabled">true</bool>
                <bool name="com_appboy_handle_push_deep_links_automatically">true</bool>
                <string name="com_appboy_firebase_cloud_messaging_sender_id">${senderId}</string>
              </resources>`;
          fs.writeFileSync(`${__dirname}/../app-template/braze.xml`, brazeXML);
          console.log('Braze XML successfully created');
          readline.close();
        });
      } else {
        content = content.replace(`${platform}_BRAZE_API_KEY_REPLACE_ME`, key);
        content = content.replace(
          `${platform}_BRAZE_API_ENDPOINT_REPLACE_ME`,
          endpoint
        );
        fs.writeFileSync(file, content);
        console.log(`Braze config successfully updated for ${platform}`);
        readline.close();
      }
    });
  });
});
