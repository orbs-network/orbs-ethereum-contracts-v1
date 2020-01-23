module.exports = {
  "roots": [
    "<rootDir>/src",
  ],
  "testEnvironment": "node",
  "transform": {
    "^.+\\.ts$": "ts-jest",
  },
  "testRegex": "/__tests__/.*\\.test\\.ts$",
  "moduleFileExtensions": [
    "ts",
    "tsx",
    "js",
    "jsx",
    "json",
    "node"
  ],
  "transformIgnorePatterns": ['<rootDir>/node_modules/'],
  "setupFilesAfterEnv": ["jest-expect-message"]
};