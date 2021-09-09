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

      content = content.replace(
        `${platform}_BRAZE_API_KEY_REPLACE_ME`,
        key
      );

      content = content.replace(
        `${platform}_BRAZE_API_ENDPOINT_REPLACE_ME`,
        endpoint
      );

      fs.writeFileSync(file, content);
      console.log(`Braze config successfully updated for ${platform}`);


      readline.close();
    });
  });

});

