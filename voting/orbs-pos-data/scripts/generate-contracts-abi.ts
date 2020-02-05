#!/usr/bin/env ts-node --compiler-options {"module":"commonjs","moduleResolution":"node","lib":["esnext"],"types":["node"],"allowSyntheticDefaultImports":true}

import rimraf from "rimraf";
import path from "path";
import fs from "fs";
import chalk from "chalk";

const rmDir = (path: string): Promise<void> => new Promise(resolve => rimraf(path, () => resolve()));

(async () => {
  const contractsTargetDir = path.join(__dirname, "..", "src", "contracts");
  const sourceContracts = [
    {
      path: path.join(__dirname, "..", "..", "build", "ethereum"),
      files: ["OrbsVoting.json", "OrbsGuardians.json", "OrbsValidators.json", "OrbsValidatorsRegistry.json"],
    },
    {
      path: path.join(__dirname, "..", "..", "..", "rewards-distribution", "ethereum", "build", "contracts"),
      files: ["OrbsRewardsDistribution.json"],
    },
  ];
  console.log(`Removing old CONTRACTS dir: "${contractsTargetDir}"\n`);
  await rmDir(contractsTargetDir);

  console.log(`Creating a new CONTRACTS dir: "${contractsTargetDir}"\n`);
  fs.mkdirSync(contractsTargetDir);

  sourceContracts.forEach(source => {
    console.log(`Coping contracts abi from "${source.path}"`);
    source.files.forEach(contractJsonFilePath => {
      console.log(chalk.greenBright(`  ${contractJsonFilePath}`));
      const json = require(path.join(source.path, contractJsonFilePath));
      fs.writeFileSync(path.join(contractsTargetDir, contractJsonFilePath), JSON.stringify({ abi: json.abi }));
    });
    console.log("\n");
  });
  console.log(chalk.green("Done!"));
})();
