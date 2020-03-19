/**
 * Copyright 2019 the staking-dashboard authors
 * This file is part of the staking-dashboard library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

// DEV_NOTE : For loading of assets : https://jestjs.io/docs/en/webpack.html

module.exports = {
  testRegex: '.*test.tsx?$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transform: {
    '^.+\\.[t|j]sx?$': 'ts-jest',
    '^.+\\.[t|j]s?$': 'ts-jest',
  },
  transformIgnorePatterns: ['<rootDir>/node_modules/'],
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/__mocks__/fileMock.js',
    // SVGs are handled separatley because of the 'svgr' import mechanism
    // TAKEN_FROM : https://medium.com/@karllsonVomDach/jest-typescript-and-svgs-44b4333a1164
    '\\.(svg)$': '<rootDir>/__mocks__/svgFileMock.js',
  },
  setupFilesAfterEnv: ['jest-expect-message', './setupTests.ts'],
};
