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
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeatRequirements = void 0;
var FeatRequirements = /** @class */ (function (_super) {
    __extends(FeatRequirements, _super);
    function FeatRequirements() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(FeatRequirements, "defaultOptions", {
        get: function () {
            return foundry.utils.mergeObject(_super.defaultOptions, {
                classes: ["ard20"],
                title: "Feature Requirements",
                template: "systems/ard20/templates/app/feat_req.html",
                id: "feat_req",
                width: 800,
                height: "auto",
            });
        },
        enumerable: false,
        configurable: true
    });
    FeatRequirements.prototype.getData = function (options) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x;
        return __awaiter(this, void 0, void 0, function () {
            var pack_list_1, folder_list, _loop_1, _i, _y, key, _loop_2, _z, _0, key, _1, _2, _3, k, v, _4, _5, _6, k, v, name_array_1, _7, _8, i, _loop_3, this_1, _9, _10, _11, k, v, name_array, _12, _13, i, _loop_4, this_2, _14, _15, _16, k, value, _17, _18, _19, k, value, FormData;
            var _this = this;
            return __generator(this, function (_20) {
                switch (_20.label) {
                    case 0:
                        if (!!this.data) return [3 /*break*/, 5];
                        console.log("First launch");
                        this.formApp = null;
                        this.data = [];
                        this.req = foundry.utils.deepClone(this.object.data.data.req);
                        pack_list_1 = [];
                        folder_list = [];
                        this.type_list = ["ability", "skill", "feat"];
                        if (!this.req.logic) return [3 /*break*/, 4];
                        _loop_1 = function (key) {
                            var feat_list, _21, feat_list_1, feat, new_key, doc, item;
                            return __generator(this, function (_22) {
                                switch (_22.label) {
                                    case 0:
                                        if (!(game.packs.filter(function (pack) { return pack.metadata.label === key; }).length !== 0)) return [3 /*break*/, 4];
                                        feat_list = [];
                                        feat_list.push(Array.from(game.packs.filter(function (pack) { return pack.metadata.label === key && pack.metadata.entity === "Item"; })[0].index));
                                        feat_list = feat_list.flat();
                                        _21 = 0, feat_list_1 = feat_list;
                                        _22.label = 1;
                                    case 1:
                                        if (!(_21 < feat_list_1.length)) return [3 /*break*/, 4];
                                        feat = feat_list_1[_21];
                                        new_key = game.packs.filter(function (pack) { return pack.metadata.label === key; })[0].metadata.package + "." + key;
                                        return [4 /*yield*/, game.packs.get(new_key).getDocument(feat._id)];
                                    case 2:
                                        doc = _22.sent();
                                        if (doc.data.type === 'feature') {
                                            item = {
                                                name: duplicate(feat.name),
                                                maxLevel: duplicate(doc.data.data.level.max),
                                            };
                                            pack_list_1.push(item);
                                        }
                                        _22.label = 3;
                                    case 3:
                                        _21++;
                                        return [3 /*break*/, 1];
                                    case 4: return [2 /*return*/];
                                }
                            });
                        };
                        _i = 0, _y = game.settings.get("ard20", "feat").packs;
                        _20.label = 1;
                    case 1:
                        if (!(_i < _y.length)) return [3 /*break*/, 4];
                        key = _y[_i];
                        return [5 /*yield**/, _loop_1(key)];
                    case 2:
                        _20.sent();
                        _20.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4:
                        _loop_2 = function (key) {
                            if (game.folders.filter(function (folder) { return folder.data.name === key; }).length !== 0) {
                                var feat_list = [];
                                feat_list.push(game.folders.filter(function (folder) { return folder.data.name === key && folder.data.type === "Item"; })[0].content);
                                feat_list = feat_list.flat();
                                for (var _23 = 0, _24 = feat_list.filter(function (item) { return item.type === "feature"; }); _23 < _24.length; _23++) {
                                    var feat = _24[_23];
                                    var doc = {
                                        name: duplicate(feat.name),
                                        maxLevel: duplicate(feat.data.data.level.max),
                                    };
                                    folder_list.push(doc);
                                }
                            }
                        };
                        /* Same as above, but for folders*/
                        for (_z = 0, _0 = game.settings.get("ard20", "feat").folders; _z < _0.length; _z++) {
                            key = _0[_z];
                            _loop_2(key);
                        }
                        this.feat = {
                            awail: pack_list_1.concat(folder_list.filter(function (item) { return pack_list_1.indexOf(item) < 0; })),
                            current: Object.values(foundry.utils.deepClone(this.object.data.data.req.values.filter(function (item) { return item.type === "feature"; }))),
                        };
                        for (_1 = 0, _2 = Object.entries(CONFIG.ARd20.abilities); _1 < _2.length; _1++) {
                            _3 = _2[_1], k = _3[0], v = _3[1];
                            this.data.push({
                                name: (_a = game.i18n.localize(CONFIG.ARd20.abilities[k])) !== null && _a !== void 0 ? _a : k,
                                value: k,
                                type: "ability",
                            });
                        }
                        for (_4 = 0, _5 = Object.entries(CONFIG.ARd20.skills); _4 < _5.length; _4++) {
                            _6 = _5[_4], k = _6[0], v = _6[1];
                            this.data.push({
                                name: (_b = game.i18n.localize(CONFIG.ARd20.skills[k])) !== null && _b !== void 0 ? _b : k,
                                value: k,
                                type: "skill",
                            });
                        }
                        name_array_1 = [];
                        for (_7 = 0, _8 = this.feat.current; _7 < _8.length; _7++) {
                            i = _8[_7];
                            name_array_1.push(i.name);
                        }
                        console.log(this.feat.awail);
                        _loop_3 = function (k, v) {
                            if (v.name === this_1.object.name) {
                                console.log(v.name, " matches name of the feat");
                                this_1.feat.awail.splice(k, 1);
                            }
                            else if (name_array_1.includes(v.name)) {
                                console.log(v.name, "this feat is already included", k);
                                v.input = this_1.feat.current[this_1.feat.current.indexOf(this_1.feat.current.filter(function (item) { return item.name === v.name; })[0])].input;
                                this_1.feat.awail.splice(k, 1);
                            }
                            console.log(this_1.feat.awail);
                            if (this_1.feat.awail.filter(function (item) { return item.name === v.name; }).length !== 0) {
                                console.log(this_1.feat.awail.filter(function (item) { return item.name === v.name; }));
                                console.log(v.name);
                                this_1.data.push({
                                    name: v.name,
                                    type: "feat",
                                    maxLevel: v.maxLevel,
                                });
                            }
                        };
                        this_1 = this;
                        for (_9 = 0, _10 = Object.entries(this.feat.awail); _9 < _10.length; _9++) {
                            _11 = _10[_9], k = _11[0], v = _11[1];
                            _loop_3(k, v);
                        }
                        _20.label = 5;
                    case 5:
                        console.log("data created");
                        name_array = [];
                        for (_12 = 0, _13 = this.data; _12 < _13.length; _12++) {
                            i = _13[_12];
                            name_array.push(i.name);
                        }
                        _loop_4 = function (k, value) {
                            this_2.req.values[k].type = ((_e = (_d = (_c = this_2.formApp) === null || _c === void 0 ? void 0 : _c.values) === null || _d === void 0 ? void 0 : _d[k]) === null || _e === void 0 ? void 0 : _e.type) ? (_h = (_g = (_f = this_2.formApp) === null || _f === void 0 ? void 0 : _f.values) === null || _g === void 0 ? void 0 : _g[k]) === null || _h === void 0 ? void 0 : _h.type : this_2.req.values[k].type || "ability";
                            var subtype_list = this_2.data.filter(function (item) { return item.type === _this.req.values[k].type; });
                            this_2.req.values[k].name =
                                subtype_list.filter(function (item) { var _a, _b, _c; return item.name === ((_c = (_b = (_a = _this.formApp) === null || _a === void 0 ? void 0 : _a.values) === null || _b === void 0 ? void 0 : _b[k]) === null || _c === void 0 ? void 0 : _c.name); }).length > 0
                                    ? ((_l = (_k = (_j = this_2.formApp) === null || _j === void 0 ? void 0 : _j.values) === null || _k === void 0 ? void 0 : _k[k]) === null || _l === void 0 ? void 0 : _l.name) || this_2.req.values[k].name
                                    : this_2.req.values[k].name || subtype_list[0].name;
                            this_2.req.values[k].subtype_list = [];
                            subtype_list.forEach(function (item) { return _this.req.values[k].subtype_list.push(item.name); });
                            this_2.req.values[k].input = ((_p = (_o = (_m = this_2.formApp) === null || _m === void 0 ? void 0 : _m.values) === null || _o === void 0 ? void 0 : _o[k]) === null || _p === void 0 ? void 0 : _p.input) ? (_s = (_r = (_q = this_2.formApp) === null || _q === void 0 ? void 0 : _q.values) === null || _r === void 0 ? void 0 : _r[k]) === null || _s === void 0 ? void 0 : _s.input : this_2.req.values[k].input || "";
                            if (this_2.req.values[k].type === "feat") {
                                this_2.req.values[k].maxLevel = this_2.data.filter(function (item) { return item.name === _this.req.values[k].name; })[0].maxLevel;
                            }
                            this_2.req.values[k].input = this_2.req.values[k].input || [];
                            for (var i = 0; i < this_2.object.data.data.level.max; i++) {
                                console.log(this_2.req.values[k].input[i], (_v = (_u = (_t = this_2.formApp) === null || _t === void 0 ? void 0 : _t.values) === null || _u === void 0 ? void 0 : _u[k]) === null || _v === void 0 ? void 0 : _v.input[i]);
                                this_2.req.values[k].input[i] = this_2.req.values[k].type !== "skill"
                                    ? Number(this_2.req.values[k].input[i]) || 10
                                    : this_2.req.values[k].input[i] > 2
                                        ? 1
                                        : this_2.req.values[k].input[i] || 1;
                                if (this_2.req.values[k].input[i + 1] < this_2.req.values[k].input[i]) {
                                    this_2.req.values[k].input[i + 1] = this_2.req.values[k].input[i];
                                }
                            }
                        };
                        this_2 = this;
                        /**
                         * Data created
                         */
                        for (_14 = 0, _15 = Object.entries(this.req.values); _14 < _15.length; _14++) {
                            _16 = _15[_14], k = _16[0], value = _16[1];
                            _loop_4(k, value);
                        }
                        for (_17 = 0, _18 = Object.entries(this.req.logic); _17 < _18.length; _17++) {
                            _19 = _18[_17], k = _19[0], value = _19[1];
                            this.req.logic[k] = ((_x = (_w = this.formApp) === null || _w === void 0 ? void 0 : _w.logic) === null || _x === void 0 ? void 0 : _x[k]) ? this.formApp.logic[k] : this.req.logic[k];
                        }
                        this.formApp = this.req;
                        this.prof = Object.values(CONFIG.ARd20.prof)
                            .slice(1)
                            .reduce(function (result, item, index, array) {
                            result[index + 1] = item;
                            return result;
                        }, {});
                        FormData = {
                            data: this.data,
                            type: this.type_list,
                            config: CONFIG.ARd20,
                            req: this.req,
                            formApp: this.formApp,
                            prof: this.prof,
                        };
                        console.log("FormData", FormData);
                        console.log("Form html", this.form);
                        return [2 /*return*/, FormData];
                }
            });
        });
    };
    FeatRequirements.prototype.activateListeners = function (html) {
        _super.prototype.activateListeners.call(this, html);
        html.find(".item-create").click(this._onAdd.bind(this));
        html.find(".item-delete").click(this._Delete.bind(this));
    };
    FeatRequirements.prototype._onAdd = function (event) {
        return __awaiter(this, void 0, void 0, function () {
            var req;
            return __generator(this, function (_a) {
                event.preventDefault();
                req = this.req;
                req.values.push({});
                this.render();
                return [2 /*return*/];
            });
        });
    };
    FeatRequirements.prototype._Delete = function (event) {
        return __awaiter(this, void 0, void 0, function () {
            var req;
            return __generator(this, function (_a) {
                event.preventDefault();
                req = this.req;
                req.values.splice(event.currentTarget.dataset.key, 1);
                this.render();
                return [2 /*return*/];
            });
        });
    };
    FeatRequirements.prototype._onChangeInput = function (event) {
        _super.prototype._onChangeInput.call(this, event);
        var k = event.currentTarget.dataset.key;
        var i = event.currentTarget.dataset.order;
        console.log(foundry.utils.expandObject(this._getSubmitData()));
        var req = foundry.utils.expandObject(this._getSubmitData()).req;
        switch (event.currentTarget.dataset.type) {
            case "value":
                this.formApp.values[k].type = req.values[k].type;
                this.formApp.values[k].name = req.values[k].name;
                this.formApp.values[k].input[i] = req.values[k].input[i];
                break;
            case "logic":
                this.formApp.logic[k] = req.logic[k];
                break;
        }
        this.getData();
        this.render();
    };
    FeatRequirements.prototype._updateObject = function (event, formData) {
        return __awaiter(this, void 0, void 0, function () {
            var item, obj;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        item = this.object;
                        this.render();
                        obj = {};
                        obj["data.req.values"] = this.req.values;
                        obj["data.req.logic"] = this.req.logic;
                        console.log(obj);
                        return [4 /*yield*/, item.update(obj)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return FeatRequirements;
}(FormApplication));
exports.FeatRequirements = FeatRequirements;
