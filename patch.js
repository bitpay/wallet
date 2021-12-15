/* eslint-disable @typescript-eslint/no-var-requires */

const {
  readFileSync,
  writeFileSync,
  existsSync
} = require('fs');

const fix = `fallback:{
  http: require.resolve("stream-http"),
  https: require.resolve("https-browserify"),
  crypto: require.resolve("crypto-browserify"),
  stream:require.resolve("stream-browserify"),
  os:require.resolve("os-browserify/browser"),
  assert:require.resolve("assert/")
},`;


const patchTag = '//-patched';

const fileToPatch = 'node_modules/@angular-devkit/build-angular/src/webpack/configs/browser.js';
const codeToPatch = 'mainFields: [\'es2015\', \'browser\', \'module\', \'main\'],';
const patch =codeToPatch+ fix +patchTag;


function getAllIndexes(arr, val) {
  const indexes = [];
  let  i;
  for (i = 0; i < arr.length; i++)
  {if (arr[i].indexOf(val) !== -1)
  {indexes.push(i);}}
  return indexes;
}
function doPatch(fileName, sourceCode, patchCode, patchIdentifier) {
  if (!existsSync(fileName)) {
    console.log('file not found ' + fileName);
    return;
  }
  const contents = readFileSync(fileName).toString().split('\n');
  // Check if code has been patched already
  const hasBeenPatched = contents.find(line => line.indexOf(patchIdentifier) !== -1);

  if (!hasBeenPatched) {
    const lineNumbers = getAllIndexes(contents, sourceCode);
    if (lineNumbers.length < 1) {
      console.error('Could not find source code. Please check ' + fileName + ' and update the patch accordingly');
      return;
    }
    // replace the line
    lineNumbers.forEach((lineNumber) => {
      contents.splice(lineNumber, 1, patchCode);
    });
    const updatedContents = contents.join('\n');
    writeFileSync(fileName, updatedContents);

    console.log('Monkey patched');
  } else {
    console.log('already been patched');
  }
}
doPatch(fileToPatch, codeToPatch, patch, patchTag);