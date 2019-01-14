const fs = require('fs');
const path = require('path')

for (let i = 3; i < process.argv.length; i++) {
  const filename = process.argv[i];
  if (!filename.endsWith('.json')) {
    throw new Error(`ERROR: given file ${filename} is not a JSON file`);
  }
  console.log(`stripping ${filename} ...`);
  const file = JSON.parse(fs.readFileSync(filename));
  delete file.source;
  delete file.sourcePath;
  delete file.ast;
  delete file.legacyAST;
  const json = JSON.stringify(file, null, 2);
  let newFileName = path.join(process.argv[2], path.basename(filename));
  console.log(`writing ${newFileName} ...`);
  fs.writeFileSync(newFileName, json, 'utf8');
}
