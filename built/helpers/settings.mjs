"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
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
exports.__esModule = true;
exports.registerSystemSettings = void 0;
var registerSystemSettings = function () {
    game.settings.register('ard20', 'profs', {
        scope: "world",
        config: false,
        "default": {
            weapon: [
                { name: "Punch Dagger", type: 'amb' },
                { name: 'Whip Dagger', type: 'amb' },
                { name: 'Gauntlet', type: 'amb' },
                { name: 'Hidden Blade', typel: 'amb' },
                { name: 'Knucke Axe', type: 'amb' },
                { name: 'Side Baton', type: 'amb' },
                { name: 'Unarmed strike', type: 'amb' },
                { name: 'Battle Axe', type: 'axe' },
                { name: 'Great Axe', type: 'axe' },
                { name: 'Handaxe', type: 'axe' },
                { name: 'Hook Sword', type: 'axe' },
                { name: 'Khopesh', type: 'axe' },
                { name: 'Poleaxe', type: 'axe' },
                { name: 'Tomahawk', type: 'axe' },
                { name: 'Great club', type: 'blu' },
                { name: 'Heavy club', type: 'blu' },
                { name: 'Light Club', type: 'blu' }
            ],
            armor: [],
            tools: []
        },
        type: Object,
        onChange: function (value) {
            console.log('Настройка изменилась ', value);
        }
    });
    game.settings.registerMenu("ard20", "gearProfManage", {
        name: "SETTINGS.ProfManage",
        label: "SETTINGS.ProfManage",
        scope: "world",
        type: ProfFormApp,
        restricted: false,
        icon: "fab fa-buffer"
    });
    game.settings.register('ard20', 'feat', {
        scope: 'world',
        config: false,
        "default": {
            packs: [],
            folders: []
        },
        type: Object,
        onChange: function (value) {
            console.log('Настройка изменилась', value);
        }
    });
    game.settings.registerMenu('ard20', 'featManage', {
        name: 'SETTINGS.FeatureManage',
        label: 'SETTINGS.FeatureManage',
        scope: 'world',
        type: FeatFormApp,
        restricted: false
    });
};
exports.registerSystemSettings = registerSystemSettings;
var ProfFormApp = /** @class */ (function (_super) {
    __extends(ProfFormApp, _super);
    function ProfFormApp() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(ProfFormApp, "defaultOptions", {
        get: function () {
            return foundry.utils.mergeObject(_super.defaultOptions, {
                classes: ["ard20"],
                title: 'Armor/Weapon Proficiencies',
                template: 'systems/ard20/templates/app/prof-settings.html',
                id: 'prof-settings',
                width: 600,
                height: 'auto',
                submitOnChange: true,
                closeOnSubmit: false,
                tabs: [{ navSelector: '.sheet-tabs', contentSelector: '.sheet-body', initial: 'weapons' }]
            });
        },
        enumerable: false,
        configurable: true
    });
    ProfFormApp.prototype.getData = function (options) {
        var sheetData = {
            profs: game.settings.get('ard20', 'profs'),
            config: CONFIG.ARd20
        };
        return sheetData;
    };
    ProfFormApp.prototype.activateListeners = function (html) {
        _super.prototype.activateListeners.call(this, html);
        html.find('.add').click(this._onAdd.bind(this));
        html.find('.minus').click(this._Delete.bind(this));
    };
    ProfFormApp.prototype._onAdd = function (event) {
        return __awaiter(this, void 0, void 0, function () {
            var profs;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        event.preventDefault();
                        profs = game.settings.get('ard20', 'profs');
                        profs.weapon.push({ name: 'name', type: 'amb' });
                        return [4 /*yield*/, game.settings.set('ard20', 'profs', profs)];
                    case 1:
                        _a.sent();
                        this.render();
                        return [2 /*return*/];
                }
            });
        });
    };
    ProfFormApp.prototype._Delete = function (event) {
        return __awaiter(this, void 0, void 0, function () {
            var profs;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        event.preventDefault();
                        profs = game.settings.get('ard20', 'profs');
                        profs.weapon.splice(event.currentTarget.dataset.key, 1);
                        return [4 /*yield*/, game.settings.set('ard20', 'profs', profs)];
                    case 1:
                        _a.sent();
                        this.render();
                        return [2 /*return*/];
                }
            });
        });
    };
    ProfFormApp.prototype._updateObject = function (event, formData) {
        return __awaiter(this, void 0, void 0, function () {
            var profs, dirty, _i, _a, _b, fieldName, value, _c, type, index, propertyName;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        profs = game.settings.get('ard20', 'profs');
                        console.log(formData);
                        dirty = false;
                        _i = 0, _a = Object.entries(foundry.utils.flattenObject(formData));
                        _d.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 4];
                        _b = _a[_i], fieldName = _b[0], value = _b[1];
                        _c = fieldName.split('.'), type = _c[0], index = _c[1], propertyName = _c[2];
                        if (profs[type][index][propertyName] !== value) {
                            //log({index, propertyName, value});
                            profs[type][index][propertyName] = value;
                            dirty = dirty || true;
                        }
                        if (!dirty) return [3 /*break*/, 3];
                        return [4 /*yield*/, game.settings.set('ard20', 'profs', profs)];
                    case 2:
                        _d.sent();
                        _d.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return ProfFormApp;
}(FormApplication));
var FeatFormApp = /** @class */ (function (_super) {
    __extends(FeatFormApp, _super);
    function FeatFormApp() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(FeatFormApp, "defaultOptions", {
        get: function () {
            return foundry.utils.mergeObject(_super.defaultOptions, {
                classes: ["ard20"],
                title: 'Features Management',
                template: 'systems/ard20/templates/app/feat-settings.html',
                id: 'feat-settings',
                width: 600,
                height: 'auto',
                submitOnChange: true,
                closeOnSubmit: false
            });
        },
        enumerable: false,
        configurable: true
    });
    FeatFormApp.prototype.getData = function (options) {
        var sheetData = {
            feat: game.settings.get('ard20', 'feat')
        };
        return sheetData;
    };
    FeatFormApp.prototype.activateListeners = function (html) {
        _super.prototype.activateListeners.call(this, html);
        html.find('.add').click(this._onAdd.bind(this));
        html.find('.minus').click(this._Delete.bind(this));
    };
    FeatFormApp.prototype._onAdd = function (event) {
        return __awaiter(this, void 0, void 0, function () {
            var feat, button, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        event.preventDefault();
                        feat = game.settings.get('ard20', 'feat');
                        button = event.currentTarget;
                        _a = button.dataset.type;
                        switch (_a) {
                            case 'pack': return [3 /*break*/, 1];
                            case 'folder': return [3 /*break*/, 3];
                        }
                        return [3 /*break*/, 5];
                    case 1:
                        feat.packs.push('new compendium');
                        return [4 /*yield*/, game.settings.set('ard20', 'feat', feat)];
                    case 2:
                        _b.sent();
                        return [3 /*break*/, 5];
                    case 3:
                        feat.folders.push('new folder');
                        return [4 /*yield*/, game.settings.set('ard20', 'feat', feat)];
                    case 4:
                        _b.sent();
                        _b.label = 5;
                    case 5:
                        this.render();
                        return [2 /*return*/];
                }
            });
        });
    };
    FeatFormApp.prototype._Delete = function (event) {
        return __awaiter(this, void 0, void 0, function () {
            var feat, button, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        event.preventDefault();
                        feat = game.settings.get('ard20', 'feat');
                        button = event.currentTarget;
                        _a = button.dataset.type;
                        switch (_a) {
                            case 'pack': return [3 /*break*/, 1];
                            case 'folder': return [3 /*break*/, 3];
                        }
                        return [3 /*break*/, 5];
                    case 1:
                        feat.packs.splice(button.dataset.key, 1);
                        return [4 /*yield*/, game.settings.set('ard20', 'feat', feat)];
                    case 2:
                        _b.sent();
                        return [3 /*break*/, 5];
                    case 3:
                        feat.folders.splice(button.dataset.key, 1);
                        return [4 /*yield*/, game.settings.set('ard20', 'feat', feat)];
                    case 4:
                        _b.sent();
                        return [3 /*break*/, 5];
                    case 5:
                        this.render();
                        return [2 /*return*/];
                }
            });
        });
    };
    FeatFormApp.prototype._updateObject = function (event, formData) {
        return __awaiter(this, void 0, void 0, function () {
            var feat, dirty, _i, _a, _b, fieldName, value, _c, type, index;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        feat = game.settings.get('ard20', 'feat');
                        console.log(formData);
                        dirty = false;
                        _i = 0, _a = Object.entries(foundry.utils.flattenObject(formData));
                        _d.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 4];
                        _b = _a[_i], fieldName = _b[0], value = _b[1];
                        _c = fieldName.split('.'), type = _c[0], index = _c[1];
                        if (feat[type][index] !== value) {
                            //log({index, propertyName, value});
                            feat[type][index] = value;
                            dirty = dirty || true;
                        }
                        if (!dirty) return [3 /*break*/, 3];
                        return [4 /*yield*/, game.settings.set('ard20', 'feat', feat)];
                    case 2:
                        _d.sent();
                        _d.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return FeatFormApp;
}(FormApplication));
