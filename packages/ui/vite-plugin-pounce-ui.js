var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { relative, dirname } from 'path';
/**
 * Vite plugin for @pounce/ui
 * 1. Wraps css`...` and sass`...` tagged templates in @layer pounce.components
 * 2. Validates that only --pounce-* variables are used
 * 3. Auto-prepends @use for SASS variables with correct relative path
 */
export function pounceUIPlugin() {
    return {
        name: 'vite-plugin-pounce-ui',
        enforce: 'pre',
        transform: function (code, id) {
            return __awaiter(this, void 0, void 0, function () {
                var csstags, regex, modified, newCode;
                return __generator(this, function (_a) {
                    // Only process .ts and .tsx files in src
                    if (!id.match(/\.tsx?$/) || !id.includes('/src/')) {
                        return [2 /*return*/, null];
                    }
                    csstags = ['css', 'sass', 'scss', 'componentStyle', 'baseStyle'];
                    regex = new RegExp("\\b(".concat(csstags.join('|'), ")(?:\\.(css|sass|scss))?\\s*`([^\\`]*)`"), 'g');
                    modified = false;
                    newCode = code;
                    newCode = newCode.replace(regex, function (match, tag, flavor, content) {
                        // Validation: Check for forbidden variables
                        var forbidden = content.match(/--pico-[a-zA-Z0-9-]+/g);
                        if (forbidden) {
                            throw new Error("[pounce-ui] Forbidden variables found in ".concat(id, ": ").concat(forbidden.join(', '), ". ") +
                                "Use --pounce-* variables instead.");
                        }
                        modified = true;
                        // Determine the layer
                        var layer = tag === 'baseStyle' ? 'pounce.base' : 'pounce.components';
                        // Auto-prepend @use for SASS/SCSS flavors with correct relative path
                        var isSass = flavor === 'sass' || flavor === 'scss';
                        var importStatement = '';
                        if (isSass && !content.includes('@use')) {
                            // Calculate relative path from current file to styles/_variables.sass
                            var currentDir = dirname(id);
                            var variablesPath = id.replace(/\/src\/.*$/, '/src/styles/_variables.sass');
                            var relativePath = relative(currentDir, variablesPath)
                                .replace(/\\/g, '/') // Normalize Windows paths
                                .replace(/^(?!\.)/, './'); // Ensure it starts with ./
                            importStatement = "@use '".concat(relativePath, "' as *\n");
                        }
                        // Wrap in the appropriate layer (needed for SASS @layer processing)
                        var layeredContent = "@layer ".concat(layer, " {\n").concat(importStatement).concat(content, "\n}");
                        var fullTag = flavor ? "".concat(tag, ".").concat(flavor) : tag;
                        return "".concat(fullTag, "`").concat(layeredContent, "`");
                    });
                    if (modified) {
                        return [2 /*return*/, {
                                code: newCode,
                                map: null // We should ideally provide a map but for now null is okay
                            }];
                    }
                    return [2 /*return*/, null];
                });
            });
        }
    };
}
