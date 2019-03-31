#! /usr/local/bin/node
/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */


const fs = require('fs');
const { execSync } = require('child_process');

const CONTRACTS_BUILD_FOLDER = '../ethereum/build/contracts';
const CONTRACTS_FOLDER_PATH = './src/contracts';
const CONTRACTS_INFO_FILE_PATH = './src/contracts-info.js';

const copyContracts = () => {
  execSync(`rm -rf ${CONTRACTS_FOLDER_PATH}`);
  fs.mkdirSync(CONTRACTS_FOLDER_PATH);
  console.log('Start copying contracts...');
  const contractsInfoFiles = fs.readdirSync(CONTRACTS_BUILD_FOLDER);
  console.log(contractsInfoFiles);
  contractsInfoFiles.forEach(fileName => {
    fs.copyFileSync(
      `${CONTRACTS_BUILD_FOLDER}/${fileName}`,
      `${CONTRACTS_FOLDER_PATH}/${fileName}`
    );
  });
  console.log('Coping is successful');
};

const updateContractAddresses = () => {
  console.log('\n');
  execSync(`rm -rf ${CONTRACTS_INFO_FILE_PATH}`);
  console.log('Start updating contract addresses');
  const contractsInfoFiles = fs.readdirSync(CONTRACTS_FOLDER_PATH);
  const info = contractsInfoFiles.reduce((acc, fileName) => {
    const content = fs.readFileSync(`${CONTRACTS_FOLDER_PATH}/${fileName}`, {encoding: 'utf8'});
    const json = JSON.parse(content);
    if (Object.keys(json.networks).length) {
      acc[json.contractName] = {
        address: json.networks[Object.keys(json.networks)[0]].address
      };
    }
    return acc;
  }, {});
  fs.writeFileSync(
    CONTRACTS_INFO_FILE_PATH,
    `module.exports=${JSON.stringify(info)};`
  );
  execSync('npm run lint');
  console.log('Updating contract addresses is successful');
};

copyContracts();
updateContractAddresses();