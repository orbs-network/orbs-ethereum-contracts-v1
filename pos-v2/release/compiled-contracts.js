"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs = __importStar(require("fs"));
var path = __importStar(require("path"));
function loadCompiledContracts(baseDir) {
    var artifacts = {};
    for (var _i = 0, _a = fs.readdirSync(baseDir); _i < _a.length; _i++) {
        var fname = _a[_i];
        var name_1 = fname.replace('.json', '');
        var abi = JSON.parse(fs.readFileSync(baseDir + '/' + fname, { encoding: 'utf8' }));
        artifacts[name_1] = abi;
    }
    return artifacts;
}
exports.compiledContracts = loadCompiledContracts(path.join(__dirname, 'build', 'contracts'));
