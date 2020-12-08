import fs from "fs";
import { TCompleteAddressInfoForRewardsPage } from '../rewardsPageHooks';

function main() {
  const baseDir = './output/shards/withLastElections';
  // Listing files
  const files = fs.readdirSync(baseDir);
  const unifiedArray: Array<TCompleteAddressInfoForRewardsPage> = [];

  for (let fileName of files) {
    console.log('Reading file ', fileName);
    const content: Array<TCompleteAddressInfoForRewardsPage> = JSON.parse(fs.readFileSync(baseDir + "/" + fileName).toString());
    unifiedArray.push(...content);
  }

  console.log(files);
  fs.writeFileSync('./allAddressesData.json', JSON.stringify(unifiedArray, null, 2));
}

main();