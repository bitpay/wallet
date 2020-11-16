const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
module.exports = function (params) {
  const unpackFile = path.join(
    params.appOutDir,
    '*NAMECASENOSPACE*.app/Contents/Resources/app.asar.unpacked'
  );
  fse.removeSync(unpackFile);
};
