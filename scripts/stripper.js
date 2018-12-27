const fs = require('fs');

for (let i = 2; i < process.argv.length; i++) {
  const filename = process.argv[i];
  if (!filename.endsWith('.json')) {
    throw new Error(`ERROR: given file ${filename} is not a JSON file`);
  }
  console.log(`stripping ${filename}...`);
  const file = JSON.parse(fs.readFileSync(filename));
  delete file.source;
  delete file.sourcePath;
  delete file.ast;
  delete file.legacyAST;
  const json = JSON.stringify(file, null, 2);
  fs.writeFileSync(filename, json, 'utf8');
}
