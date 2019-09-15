module.exports = {
  "roots": [
    "<rootDir>/src",
  ],
  "transform": {
    "^.+\\.tsx?$": "ts-jest",
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
  "transformIgnorePatterns": ['<rootDir>/node_modules/']
};