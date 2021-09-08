const fs = require('fs');
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

const file = `${__dirname}/../app-template/config-template.xml`;
let content = fs.readFileSync(file, 'utf8');


readline.question('Enter Braze key: ', key => {
  readline.question('Enter Braze endpoint: ', endpoint => {

    content = content.replace(
      /BRAZE_API_KEY_REPLACE_ME/g,
      key
    );

    content = content.replace(
      /BRAZE_API_ENDPOINT_REPLACE_ME/g,
      endpoint
    );

    fs.writeFileSync(file, content);
    console.log('Braze config successfully updated');

    readline.close();
  });
});
