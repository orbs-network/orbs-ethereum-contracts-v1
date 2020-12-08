import fs from "fs";
import { TCompleteAddressInfoForRewardsPageWithAddress } from '../rewardsPageHooks';
import _ from 'lodash';

function main() {
  const baseDir = './output/shards/withLastElections';
  // Listing files
  const files = fs.readdirSync(baseDir);
  const unifiedArray: Array<TCompleteAddressInfoForRewardsPageWithAddress> = [];

  const map = new Map<string, TCompleteAddressInfoForRewardsPageWithAddress>();


  for (let fileName of files) {
    console.log('Reading file ', fileName);
    const content: Array<TCompleteAddressInfoForRewardsPageWithAddress> = JSON.parse(fs.readFileSync(baseDir + "/" + fileName).toString());

    for (let singleDataEntry of content){
      // DEV_NOTE : O.L : We add this because of a bug in the 'pull records' that cause some overlapping between the shards (many addresses appeared more than once)
      if (map.has(singleDataEntry.address)) {
        const previousEntry = map.get(singleDataEntry.address);

        if (!_.isEqual(previousEntry, singleDataEntry)) {
          console.warn(`Found un-equal pairs for ${singleDataEntry.address}!!!`);
        }

      } else {
        map.set(singleDataEntry.address, singleDataEntry);
        unifiedArray.push(singleDataEntry);
      }
    }

  }

  console.log(files);
  fs.writeFileSync('./allAddressesData.json', JSON.stringify(unifiedArray, null, 2));
}

main();