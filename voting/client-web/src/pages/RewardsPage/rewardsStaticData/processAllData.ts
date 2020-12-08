import fs from "fs";
import { TCompleteAddressInfoForRewardsPageWithAddress } from '../rewardsPageHooks';

function main () {
  const allDataArray: TCompleteAddressInfoForRewardsPageWithAddress[] = JSON.parse(fs.readFileSync('./processedOutput/allAddressesData.json').toString());
  const addresses = allDataArray.map(data => data.address);
  const addressesSet = new Set(addresses);
  console.log(allDataArray.length);
  console.log(addresses.length);
  console.log(addressesSet.size);
}

main();