var fs = require('fs');
var txt = fs.readFileSync(__dirname + '/x.txt', 'utf8');
console.log(txt.toUpperCase());
