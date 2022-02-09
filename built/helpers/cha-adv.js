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
exports.CharacterAdvancement = void 0;
var ard20_1 = require("../ard20");
var CharacterAdvancement = /** @class */ (function (_super) {
    __extends(CharacterAdvancement, _super);
    function CharacterAdvancement() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(CharacterAdvancement, "defaultOptions", {
        get: function () {
            //@ts-expect-error
            return foundry.utils.mergeObject(_super.defaultOptions, {
                classes: ["ard20"],
                title: "Character Advancement",
                template: "systems/ard20/templates/actor/parts/actor-adv.html",
                id: "actor-adv",
                width: 1000,
                height: "auto",
                tabs: [
                    {
                        navSelector: ".sheet-tabs",
                        contentSelector: ".sheet-body",
                        initial: "stats",
                    },
                ],
                closeOnSubmit: false,
            });
        },
        enumerable: false,
        configurable: true
    });
    //@ts-expect-error
    CharacterAdvancement.prototype.getData = function () {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
        return __awaiter(this, void 0, void 0, function () {
            var pack_list, pack_name_1, folder_list, folder_name, temp_feat_list, _loop_1, _i, _q, key, _loop_2, _r, _s, key, race_pack_list, race_folder_list, feat_pack_list, feat_folder_list, name_array_1, _t, _u, i, _loop_3, this_1, _v, _w, _x, k, v, _y, _z, _0, k, v, _1, _2, _3, k, v, _4, _5, _6, k, v, race_abil, race_sign, _7, _8, _9, k, v, _10, _11, _12, k, v, _loop_4, this_2, _13, _14, _15, k, object, _16, _17, _18, key, race, dieNumber, firstDie, race_mod, abil_sum, _19, _20, _21, key, abil, allow_list, _22, _23, _24, key, item, templateData;
            var _this = this;
            return __generator(this, function (_25) {
                switch (_25.label) {
                    case 0:
                        if (!!this.data) return [3 /*break*/, 5];
                        //@ts-expect-error
                        this.data = {
                            //@ts-expect-error
                            isReady: duplicate(this.object.data.data.isReady),
                            //@ts-expect-error
                            attributes: duplicate(this.object.data.data.attributes),
                            //@ts-expect-error
                            skills: duplicate(this.object.data.data.skills),
                            //@ts-expect-error
                            xp: duplicate(this.object.data.data.attributes.xp),
                            //@ts-expect-error
                            profs: duplicate(this.object.data.data.profs),
                            //@ts-expect-error
                            health: duplicate(this.object.data.data.health),
                            races: { list: [], chosen: null },
                            count: {
                                // counter for skills and feats
                                skills: {
                                    // count skills by their level
                                    0: 0,
                                    1: 0,
                                    2: 0,
                                },
                                feats: {
                                    // count feats by their source
                                    mar: 0,
                                    mag: 0,
                                    div: 0,
                                    pri: 0,
                                    psy: 0,
                                },
                            },
                            content: {
                                // descriptions for skills and feats
                                skills: {},
                                feats: {},
                            },
                            feats: {
                                learned: [],
                                awail: [], // array of feats that are available to learn
                            },
                            allow: {
                                ability: false,
                                race: false,
                                final: false,
                            },
                            hover: {
                                ability: null,
                                skill: null,
                                race: null,
                                feat: null,
                            },
                        };
                        pack_list = [];
                        pack_name_1 = [];
                        folder_list = [];
                        folder_name = [];
                        temp_feat_list = [];
                        //@ts-expect-error
                        this.data.xp.get = this.data.isReady || this.data.xp.used !== 0 ? this.data.xp.get : 10000;
                        _loop_1 = function (key) {
                            var feat_list, _26, feat_list_1, feat, new_key, doc, item;
                            return __generator(this, function (_27) {
                                switch (_27.label) {
                                    case 0:
                                        if (!(game.packs.filter(function (pack) { return pack.metadata.label === key; }).length !== 0)) return [3 /*break*/, 5];
                                        feat_list = [];
                                        //@ts-expect-error
                                        feat_list.push(Array.from(game.packs.filter(function (pack) { return pack.metadata.label === key && pack.metadata.type === "Item"; })[0].index));
                                        feat_list = feat_list.flat();
                                        _26 = 0, feat_list_1 = feat_list;
                                        _27.label = 1;
                                    case 1:
                                        if (!(_26 < feat_list_1.length)) return [3 /*break*/, 4];
                                        feat = feat_list_1[_26];
                                        new_key = game.packs.filter(function (pack) { return pack.metadata.label === key; })[0].metadata.package + "." + key;
                                        return [4 /*yield*/, game.packs.get(new_key).getDocument(feat._id)];
                                    case 2:
                                        doc = _27.sent();
                                        if (doc !== null || doc !== undefined) {
                                            item = doc.toObject();
                                            item.data = foundry.utils.deepClone(doc.data.data);
                                            pack_list.push(item);
                                            pack_name_1.push(item.name);
                                        }
                                        _27.label = 3;
                                    case 3:
                                        _26++;
                                        return [3 /*break*/, 1];
                                    case 4:
                                        pack_list = pack_list.flat();
                                        _27.label = 5;
                                    case 5: return [2 /*return*/];
                                }
                            });
                        };
                        _i = 0, _q = game.settings.get("ard20", "feat").packs;
                        _25.label = 1;
                    case 1:
                        if (!(_i < _q.length)) return [3 /*break*/, 4];
                        key = _q[_i];
                        return [5 /*yield**/, _loop_1(key)];
                    case 2:
                        _25.sent();
                        _25.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4:
                        _loop_2 = function (key) {
                            if (game.folders.filter(function (folder) { return folder.data.name === key; }).length !== 0) {
                                var feat_list = [];
                                feat_list.push(game.folders.filter(function (folder) { return folder.data.name === key && folder.data.type === "Item"; })[0].contents);
                                feat_list = feat_list.flat();
                                for (var _28 = 0, feat_list_2 = feat_list; _28 < feat_list_2.length; _28++) {
                                    var feat = feat_list_2[_28];
                                    console.log("item added from folder ", feat);
                                    var item = feat.toObject();
                                    item.data = foundry.utils.deepClone(feat.data.data);
                                    folder_list.push(item);
                                    folder_name.push(item.name);
                                }
                                folder_list = folder_list.flat();
                            }
                        };
                        /*
                         * Same as above, but for folders
                         */
                        for (_r = 0, _s = game.settings.get("ard20", "feat").folders; _r < _s.length; _r++) {
                            key = _s[_r];
                            _loop_2(key);
                        }
                        race_pack_list = pack_list.filter(function (item) { return item.type === "race"; });
                        race_folder_list = folder_list.filter(function (item) { return item.type === "race"; });
                        //@ts-expect-error
                        this.data.races.list = race_pack_list.concat(race_folder_list.filter(function (item) { return !pack_name_1.includes(item.name); }));
                        feat_pack_list = pack_list.filter(function (item) { return item.type === "feature"; });
                        feat_folder_list = folder_list.filter(function (item) { return item.type === "feature"; });
                        temp_feat_list = feat_pack_list.concat(feat_folder_list.filter(function (item) { return !pack_name_1.includes(item.name); }));
                        //@ts-expect-error
                        this.data.feats.learned = foundry.utils.deepClone(this.object.data.items).filter(function (item) { return item.data.type === "feature"; });
                        name_array_1 = [];
                        //@ts-expect-error
                        for (_t = 0, _u = this.data.feats.learned; _t < _u.length; _t++) {
                            i = _u[_t];
                            name_array_1.push(i.data.name);
                        }
                        _loop_3 = function (k, v) {
                            if (name_array_1.includes(v.name)) {
                                //@ts-expect-error
                                temp_feat_list[k] = this_1.data.feats.learned.filter(function (item) { return item.name === v.name; })[0].data.toObject();
                                console.log("this item is already learned", temp_feat_list[k]);
                                //@ts-expect-error
                                temp_feat_list[k].data = foundry.utils.deepClone(this_1.data.feats.learned.filter(function (item) { return item.name === v.name; })[0].data.data);
                            }
                        };
                        this_1 = this;
                        for (_v = 0, _w = (0, ard20_1.obj_entries)(temp_feat_list); _v < _w.length; _v++) {
                            _x = _w[_v], k = _x[0], v = _x[1];
                            _loop_3(k, v);
                        }
                        temp_feat_list = temp_feat_list.filter(function (item) { return (item.type === "feature" && !name_array_1.includes(item.name)) || item.data.level.current !== item.data.level.max; });
                        //@ts-expect-error
                        this.data.feats.awail = temp_feat_list;
                        // count skills by rank
                        for (_y = 0, _z = (0, ard20_1.obj_entries)(CONFIG.ARd20.Skills); _y < _z.length; _y++) {
                            _0 = _z[_y], k = _0[0], v = _0[1];
                            //@ts-expect-error
                            if (this.data.skills[k].rank === 0) {
                                //@ts-expect-error
                                this.data.count.skills[0] += 1;
                                //@ts-expect-error
                            }
                            else if (this.data.skills[k].rank === 1) {
                                //@ts-expect-error
                                this.data.count.skills[1] += 1;
                                //@ts-expect-error
                            }
                            else if (this.data.skills[k].rank === 2) {
                                //@ts-expect-error
                                this.data.count.skills[2] += 1;
                            }
                        }
                        // count feats by source
                        //@ts-expect-error
                        for (_1 = 0, _2 = (0, ard20_1.obj_entries)(this.data.feats.learned); _1 < _2.length; _1++) {
                            _3 = _2[_1], k = _3[0], v = _3[1];
                            console.log(v);
                            v.data.data.source.value.forEach(function (val) {
                                console.log(val);
                                //@ts-expect-error
                                _this.data.count.feats[val] += 1;
                            });
                        }
                        //@ts-expect-error
                        this.data.hover.feat = TextEditor.enrichHTML((_a = this.data.feats.awail[0]) === null || _a === void 0 ? void 0 : _a.data.description);
                        _25.label = 5;
                    case 5:
                        //@ts-expect-error
                        this.data.count.feats.all = 0;
                        //@ts-expect-error
                        this.data.count.feats.all = Object.values(this.data.count.feats).reduce(function (a, b) {
                            return a + b;
                        }, 0);
                        /*
                         * Calculate attributes' modifiers and xp cost
                         */
                        for (_4 = 0, _5 = (0, ard20_1.obj_entries)(CONFIG.ARd20.Attributes); _4 < _5.length; _4++) {
                            _6 = _5[_4], k = _6[0], v = _6[1];
                            //@ts-expect-error
                            this.data.attributes[k].mod = Math.floor((this.data.attributes[k].value - 10) / 2);
                            //@ts-expect-error
                            this.data.attributes[k].xp = CONFIG.ARd20.AbilXP[this.data.attributes[k].value - 5];
                            //@ts-expect-error
                            this.data.attributes[k].isEq = this.data.attributes[k].value === this.object.data.data.attributes[k].value;
                            //@ts-expect-error
                            this.data.attributes[k].isXP = this.data.xp.get < this.data.attributes[k].xp;
                            race_abil = (_d = (_c = (_b = this.data.races.list.filter(function (race) { return race.chosen === true; })) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.data.bonus.abil[k].value) !== null && _d !== void 0 ? _d : 0;
                            race_sign = ((_f = (_e = this.data.races.list.filter(function (race) { return race.chosen === true; })) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.data.bonus.abil[k].sign) ? 1 : -1;
                            //@ts-expect-error
                            this.data.attributes[k].final = this.data.isReady ? this.data.attributes[k].value : this.data.attributes[k].value + race_abil * race_sign;
                            //@ts-expect-error
                            this.data.attributes[k].mod = Math.floor((this.data.attributes[k].final - 10) / 2);
                        }
                        /*
                         * Calculate Character's hp
                         */
                        //@ts-expect-error
                        this.data.health.max = (_h = (_g = this.data.races.list.filter(function (race) { return race.chosen === true; })) === null || _g === void 0 ? void 0 : _g[0]) === null || _h === void 0 ? void 0 : _h.data.startHP;
                        /*
                         * Calculate skills' xp cost
                         */
                        for (_7 = 0, _8 = (0, ard20_1.obj_entries)(CONFIG.ARd20.Skills); _7 < _8.length; _7++) {
                            _9 = _8[_7], k = _9[0], v = _9[1];
                            //@ts-expect-error
                            this.data.skills[k].rank_name = (_j = game.i18n.localize(CONFIG.ARd20.Rank[this.data.skills[k].rank])) !== null && _j !== void 0 ? _j : this.data.skills[k].rank;
                            //@ts-expect-error
                            this.data.skills[k].xp = this.data.skills[k].rank < 2 ? CONFIG.ARd20.SkillXp[this.data.skills[k].rank][this.data.count.skills[this.data.skills[k].rank + 1]] : false;
                            //@ts-expect-error
                            this.data.skills[k].isEq = this.data.skills[k].rank === this.object.data.data.skills[k].rank;
                            //@ts-expect-error
                            this.data.skills[k].isXP = this.data.xp.get < this.data.skills[k].xp || this.data.skills[k].rank > 1;
                        }
                        //@ts-expect-error
                        for (_10 = 0, _11 = (0, ard20_1.obj_entries)(this.data.profs.weapon); _10 < _11.length; _10++) {
                            _12 = _11[_10], k = _12[0], v = _12[1];
                            v.value_hover = (_k = game.i18n.localize(CONFIG.ARd20.Rank[v.value])) !== null && _k !== void 0 ? _k : CONFIG.ARd20.Rank[v.value];
                        }
                        _loop_4 = function (k, object) {
                            //@ts-expect-error
                            var pass = [];
                            //@ts-expect-error
                            var allCount = this_2.data.count.feats.all;
                            var featCount = 0;
                            //@ts-expect-error
                            (_l = object.data.source) === null || _l === void 0 ? void 0 : _l.value.forEach(function (val) { return (featCount += _this.data.count.feats[val]); });
                            object.data.level.xp = object.data.level.xp || {};
                            for (var i = object.data.level.initial; i < object.data.level.max; i++) {
                                object.data.level.xp[i] = ((_m = object.data.xp) === null || _m === void 0 ? void 0 : _m[i]) ? Math.ceil((object.data.xp[i] * (1 + 0.01 * (allCount - featCount))) / 5) * 5 : 0;
                            }
                            object.data.current_xp = object.data.level.xp[object.data.level.initial];
                            object.isEq = object.data.level.initial === object.data.level.current || object.data.level.initial === 0;
                            //@ts-expect-error
                            object.isXP = object.data.level.initial === object.data.level.max || object.data.level.xp[object.data.level.initial] > this_2.data.xp.get;
                            var _loop_5 = function (key, r) {
                                switch (r.type) {
                                    case "ability": //check if character's ability is equal or higher than value entered in feature requirements
                                        //@ts-expect-error
                                        r.pass.forEach(function (item, index) { return (r.pass[index] = r.input[index] <= _this.data.attributes[r.value].final); });
                                        break;
                                    case "skill": //check if character's skill rank is equal or higher than value entered in feature requirements
                                        //@ts-expect-error
                                        r.pass.forEach(function (item, index) { return (r.pass[index] = r.input[index] <= _this.data.skills[r.value].rank); });
                                        break;
                                    case "feat": //check if character has features (and their level is equal or higher) that listed in feature requirements
                                        //@ts-expect-error
                                        if (((_o = this_2.data.feats.awail.filter(function (item) { return item.name === r.name; })) === null || _o === void 0 ? void 0 : _o[0]) !== undefined) {
                                            //@ts-expect-error
                                            r.pass.forEach(function (item, index) { return (r.pass[index] = r.input[index] <= _this.data.feats.awail.filter(function (item) { return item.name === r.name; })[0].data.level.initial); });
                                            //@ts-expect-error
                                        }
                                        else if (((_p = this_2.data.feats.learned.filter(function (item) { return item.name === r.name; })) === null || _p === void 0 ? void 0 : _p[0]) !== undefined) {
                                            //@ts-expect-error
                                            r.pass = r.pass.forEach(function (item, index) { return (r.pass[index] = r.input[index] <= _this.data.feats.learned.filter(function (item) { return item.name === r.name; })[0].data.data.level.initial); });
                                        }
                                        break;
                                }
                                pass.push(r.pass);
                            };
                            for (var _29 = 0, _30 = (0, ard20_1.obj_entries)(object.data.req.values); _29 < _30.length; _29++) {
                                var _31 = _30[_29], key = _31[0], r = _31[1];
                                _loop_5(key, r);
                            }
                            object.pass = [];
                            var _loop_6 = function (i) {
                                if (i === object.data.level.max || pass.length === 0)
                                    return "break";
                                var exp = object.data.req.logic[i];
                                //@ts-expect-error
                                var lev_array = exp.match(/\d*/g).filter(function (item) { return item !== ""; });
                                var f = {};
                                //@ts-expect-error
                                lev_array.forEach(function (item, index) {
                                    exp = exp.replace(item, "c".concat(item));
                                    //@ts-expect-error
                                    f["c" + item] = pass[item - 1][i];
                                });
                                //@ts-expect-error
                                var filter = filtrex.compileExpression(exp);
                                object.pass[i] = Boolean(filter(f));
                            };
                            /*
                             * Check the custom logic in feature requirements. For example "Strength 15 OR Arcana Basic"
                             */
                            for (var i = 0; i <= object.data.level.initial; i++) {
                                var state_1 = _loop_6(i);
                                if (state_1 === "break")
                                    break;
                            }
                            object.isXP = object.pass[object.data.level.initial] || object.pass.length === 0 ? object.isXP : true;
                        };
                        this_2 = this;
                        /*
                         * Calculate features cost and their availability
                         */
                        //@ts-expect-error
                        for (_13 = 0, _14 = (0, ard20_1.obj_entries)(this.data.feats.awail); _13 < _14.length; _13++) {
                            _15 = _14[_13], k = _15[0], object = _15[1];
                            _loop_4(k, object);
                        }
                        /*
                         * Calculate starting HP based on character's CON and race
                         */
                        //@ts-expect-error
                        for (_16 = 0, _17 = (0, ard20_1.obj_entries)(this.data.races.list); _16 < _17.length; _16++) {
                            _18 = _17[_16], key = _18[0], race = _18[1];
                            dieNumber = Math.ceil(Math.max(this.data.attributes.con.value + race.data.bonus.abil.con.value - 7, 0) / 4);
                            firstDie = CONFIG.ARd20.HPDice.slice(CONFIG.ARd20.HPDice.indexOf(race.data.FhpDie));
                            race_mod = Math.floor((this.data.attributes.con.value + race.data.bonus.abil.con.value - 10) / 2);
                            //@ts-expect-error
                            race.data.startHP = new Roll(firstDie[dieNumber]).evaluate({ maximize: true }).total + race_mod;
                            //@ts-expect-error
                            race.chosen = this.data.races.chosen === race._id ? true : false;
                        }
                        // At character creation, check all conditions
                        //@ts-expect-error
                        if (!this.object.data.isReady) {
                            abil_sum = null;
                            //@ts-expect-error
                            for (_19 = 0, _20 = (0, ard20_1.obj_entries)(this.data.attributes); _19 < _20.length; _19++) {
                                _21 = _20[_19], key = _21[0], abil = _21[1];
                                abil_sum += abil.value;
                            }
                            //@ts-expect-error
                            this.data.allow.ability = abil_sum >= 60 && abil_sum <= 80 ? true : false;
                            //@ts-expect-error
                            this.data.allow.race = Boolean(this.data.races.chosen) ? true : false;
                            allow_list = [];
                            //@ts-expect-error
                            for (_22 = 0, _23 = (0, ard20_1.obj_entries)(this.data.allow); _22 < _23.length; _22++) {
                                _24 = _23[_22], key = _24[0], item = _24[1];
                                if (key === "final") {
                                    continue;
                                }
                                allow_list.push(item);
                            }
                            //@ts-expect-error
                            this.data.allow.final = !allow_list.includes(false) || this.data.isReady ? true : false;
                        }
                        templateData = {
                            //@ts-expect-error
                            attributes: this.data.attributes,
                            //@ts-expect-error
                            xp: this.data.xp,
                            //@ts-expect-error
                            skills: this.data.skills,
                            //@ts-expect-error
                            count: this.data.count,
                            //@ts-expect-error
                            content: this.data.content,
                            //@ts-expect-error
                            hover: this.data.hover,
                            //@ts-expect-error
                            profs: this.data.profs,
                            //@ts-expect-error
                            feats: this.data.feats,
                            //@ts-expect-error
                            races: this.data.races,
                            //@ts-expect-error
                            health: this.data.health,
                            //@ts-expect-error
                            allow: this.data.allow,
                            //@ts-expect-error
                            isReady: this.data.isReady,
                        };
                        console.log(this.form);
                        console.log(templateData);
                        return [2 /*return*/, templateData];
                }
            });
        });
    };
    //@ts-expect-error
    CharacterAdvancement.prototype.activateListeners = function (html) {
        _super.prototype.activateListeners.call(this, html);
        html.find(".change").click(this._onChange.bind(this));
        html.find("td:not(.description)").hover(this._onHover.bind(this));
    };
    //@ts-expect-error
    CharacterAdvancement.prototype._onChange = function (event) {
        var _a, _b;
        var button = event.currentTarget;
        //@ts-expect-error
        var data = this.data;
        switch (button.dataset.type) {
            case "ability":
                switch (button.dataset.action) {
                    case "plus":
                        data.attributes[button.dataset.key].value += 1;
                        data.xp.get -= data.attributes[button.dataset.key].xp;
                        data.xp.used += data.attributes[button.dataset.key].xp;
                        break;
                    case "minus":
                        data.attributes[button.dataset.key].value -= 1;
                        data.xp.get += (_a = CONFIG.ARd20.AbilXP[data.attributes[button.dataset.key].value - 5]) !== null && _a !== void 0 ? _a : CONFIG.ARd20.AbilXP[data.attributes[button.dataset.key].value - 5];
                        data.xp.used -= (_b = CONFIG.ARd20.AbilXP[data.attributes[button.dataset.key].value - 5]) !== null && _b !== void 0 ? _b : CONFIG.ARd20.AbilXP[data.attributes[button.dataset.key].value - 5];
                        break;
                }
                break;
            case "skill":
                switch (button.dataset.action) {
                    case "plus":
                        data.skills[button.dataset.key].rank += 1;
                        data.xp.get -= data.skills[button.dataset.key].xp;
                        data.xp.used += data.skills[button.dataset.key].xp;
                        //@ts-expect-error
                        this.data.count.skills[this.data.skills[button.dataset.key].rank] += 1;
                        break;
                    case "minus":
                        data.skills[button.dataset.key].rank -= 1;
                        //@ts-expect-error
                        this.data.count.skills[this.data.skills[button.dataset.key].rank + 1] -= 1;
                        //@ts-expect-error
                        data.xp.get += CONFIG.ARd20.SkillXP[data.skills[button.dataset.key].rank][this.data.count.skills[this.data.skills[button.dataset.key].rank + 1]];
                        //@ts-expect-error
                        data.xp.used -= CONFIG.ARd20.SkillXP[data.skills[button.dataset.key].rank][this.data.count.skills[this.data.skills[button.dataset.key].rank + 1]];
                        break;
                }
                break;
            case "prof":
                switch (button.dataset.action) {
                    case "plus":
                        data.profs.weapon[button.dataset.key].value += 1;
                        data.count.feats.mar += 1;
                        break;
                    case "minus":
                        data.profs.weapon[button.dataset.key].value -= 1;
                        data.count.feats.mar -= 1;
                        break;
                }
                break;
            case "feat":
                switch (button.dataset.action) {
                    case "plus":
                        //@ts-expect-error
                        data.feats.awail[button.dataset.key].data.source.value.forEach(function (val) { return (data.count.feats[val] += data.feats.awail[button.dataset.key].data.level.initial === 0 ? 1 : 0); });
                        data.xp.get -= data.feats.awail[button.dataset.key].data.level.xp[data.feats.awail[button.dataset.key].data.level.initial];
                        data.xp.used += data.feats.awail[button.dataset.key].data.level.xp[data.feats.awail[button.dataset.key].data.level.initial];
                        data.feats.awail[button.dataset.key].data.level.initial += 1;
                        break;
                    case "minus":
                        data.feats.awail[button.dataset.key].data.level.initial -= 1;
                        //@ts-expect-error
                        data.feats.awail[button.dataset.key].data.source.value.forEach(function (val) { return (data.count.feats[val] -= data.feats.awail[button.dataset.key].data.level.initial === 0 ? 1 : 0); });
                        data.xp.get += data.feats.awail[button.dataset.key].data.level.xp[data.feats.awail[button.dataset.key].data.level.initial];
                        data.xp.used -= data.feats.awail[button.dataset.key].data.level.xp[data.feats.awail[button.dataset.key].data.level.initial];
                        break;
                }
                break;
        }
        this.render();
    };
    //@ts-expect-error
    CharacterAdvancement.prototype._onChangeInput = function (event) {
        _super.prototype._onChangeInput.call(this, event);
        var button = event.currentTarget.id;
        var k = event.currentTarget.dataset.key;
        //@ts-expect-error
        for (var _i = 0, _a = (0, ard20_1.obj_entries)(this.data.races.list); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], race = _b[1];
            //@ts-expect-error
            this.data.races.list[key].chosen = key === k ? true : false;
            //@ts-expect-error
            this.data.races.chosen = this.data.races.list[key].chosen ? race._id : this.data.races.chosen;
        }
        this.render();
    };
    //@ts-expect-error
    CharacterAdvancement.prototype._onHover = function (event) {
        var _a, _b, _c;
        event.preventDefault();
        var element = event.currentTarget;
        var table = element.closest("div.tab");
        var tr = element.closest("tr");
        var trDOM = tr.querySelectorAll("td:not(.description)");
        var tdDesc = table.querySelector("td.description");
        var bColor = window.getComputedStyle(element).getPropertyValue("background-color");
        tdDesc.style["background-color"] = bColor;
        //@ts-expect-error
        trDOM === null || trDOM === void 0 ? void 0 : trDOM.forEach(function (td) {
            td.classList.toggle("chosen", event.type == "mouseenter");
            if (td.nextElementSibling === null || td.nextElementSibling.classList[0] === "description") {
                td.classList.toggle("last", event.type == "mouseenter");
            }
        });
        //@ts-expect-error
        (_a = tr.nextElementSibling) === null || _a === void 0 ? void 0 : _a.querySelectorAll("td:not(.description)").forEach(function (td) { return td.classList.toggle("under-chosen", event.type == "mouseenter"); });
        //@ts-expect-error
        (_b = tr.previousElementSibling) === null || _b === void 0 ? void 0 : _b.querySelectorAll("th:not(.description)").forEach(function (th) { return th.classList.toggle("over-chosen", event.type == "mouseenter"); });
        //@ts-expect-error
        (_c = tr.previousElementSibling) === null || _c === void 0 ? void 0 : _c.querySelectorAll("td:not(.description)").forEach(function (td) { return td.classList.toggle("over-chosen", event.type == "mouseenter"); });
        var type = table.dataset.tab;
        if (type !== "feats")
            return;
        var key = tr.dataset.key;
        //@ts-expect-error
        var hover_desc = TextEditor.enrichHTML(this.data.feats.awail[key].data.description);
        //@ts-expect-error
        if (hover_desc === this.data.hover.feat)
            return;
        //@ts-expect-error
        this.data.hover.feat = hover_desc;
        this.render();
    };
    //@ts-expect-error
    CharacterAdvancement.prototype._updateObject = function (event, formData) {
        return __awaiter(this, void 0, void 0, function () {
            var updateData, actor, obj, _i, _a, _b, key, abil, feats_data, feats, _c, _d, _e, k, v, _f, _g, _h, n, m, pass, _j, _k, _l, k, v, _m, _o, _p, k, v, race_list;
            return __generator(this, function (_q) {
                switch (_q.label) {
                    case 0:
                        updateData = expandObject(formData);
                        actor = this.object;
                        this.render();
                        obj = {};
                        //@ts-expect-error
                        for (_i = 0, _a = (0, ard20_1.obj_entries)(this.data.attributes); _i < _a.length; _i++) {
                            _b = _a[_i], key = _b[0], abil = _b[1];
                            //@ts-expect-error
                            obj["data.attributes.".concat(key, ".value")] = this.data.attributes[key].final;
                        }
                        //@ts-expect-error
                        obj["data.health.max"] = this.data.health.max;
                        //@ts-expect-error
                        if (this.data.isReady) {
                            obj["data.attributes.xp"] = updateData.xp;
                        }
                        obj["data.skills"] = updateData.skills;
                        obj["data.profs"] = updateData.profs;
                        //@ts-expect-error
                        obj["data.isReady"] = this.data.allow.final;
                        console.log(obj);
                        feats_data = {
                            new: [],
                            exist: [],
                        };
                        feats = this.data.feats.awail.filter(function (item) { return item.data.level.initial > item.data.level.current; });
                        for (_c = 0, _d = (0, ard20_1.obj_entries)(feats); _c < _d.length; _c++) {
                            _e = _d[_c], k = _e[0], v = _e[1];
                            //@ts-expect-error
                            if (this.data.feats.learned.length > 0) {
                                //@ts-expect-error
                                for (_f = 0, _g = (0, ard20_1.obj_entries)(this.data.feats.learned); _f < _g.length; _f++) {
                                    _h = _g[_f], n = _h[0], m = _h[1];
                                    if (v._id === m.id) {
                                        //@ts-expect-error
                                        feats_data.exist.push(v);
                                    }
                                    else {
                                        //@ts-expect-error
                                        feats_data.new.push(v);
                                    }
                                }
                            }
                            else {
                                //@ts-expect-error
                                feats_data.new.push(v);
                            }
                        }
                        pass = [];
                        for (_j = 0, _k = (0, ard20_1.obj_entries)(feats_data.exist); _j < _k.length; _j++) {
                            _l = _k[_j], k = _l[0], v = _l[1];
                            //@ts-expect-error
                            pass.push(v.pass.slice(0, v.pass.length - 1));
                        }
                        for (_m = 0, _o = (0, ard20_1.obj_entries)(feats_data.new); _m < _o.length; _m++) {
                            _p = _o[_m], k = _p[0], v = _p[1];
                            //@ts-expect-error
                            pass.push(v.pass.slice(0, v.pass.length - 1));
                        }
                        pass = pass.flat();
                        console.log(pass);
                        if (!(!this.data.isReady && !this.data.allow.final)) return [3 /*break*/, 1];
                        ui.notifications.error("Something not ready for your character to be created. Check the list");
                        return [3 /*break*/, 10];
                    case 1:
                        if (!pass.includes(false)) return [3 /*break*/, 2];
                        ui.notifications.error("Some changes in your features do not comply with the requirements");
                        return [3 /*break*/, 10];
                    case 2: 
                    //@ts-expect-error
                    return [4 /*yield*/, actor.update(obj)];
                    case 3:
                        //@ts-expect-error
                        _q.sent();
                        if (!(actor.itemTypes.race.length === 0)) return [3 /*break*/, 5];
                        race_list = this.data.races.list.filter(function (race) { return race.chosen === true; });
                        //@ts-expect-error
                        return [4 /*yield*/, actor.createEmbeddedDocuments("Item", race_list)];
                    case 4:
                        //@ts-expect-error
                        _q.sent();
                        _q.label = 5;
                    case 5:
                        if (!(feats_data.exist.length > 0)) return [3 /*break*/, 7];
                        //@ts-expect-error
                        return [4 /*yield*/, actor.updateEmbeddedDocuments("Item", feats_data.exist.map(function (item) { return ({
                                //@ts-expect-error
                                _id: item._id,
                                //@ts-expect-error
                                "data.level.initial": item.data.level.initial,
                            }); }))];
                    case 6:
                        //@ts-expect-error
                        _q.sent();
                        _q.label = 7;
                    case 7:
                        if (!(feats_data.new.length > 0)) return [3 /*break*/, 9];
                        //@ts-expect-error
                        return [4 /*yield*/, actor.createEmbeddedDocuments("Item", feats_data.new)];
                    case 8:
                        //@ts-expect-error
                        _q.sent();
                        _q.label = 9;
                    case 9:
                        this.close();
                        _q.label = 10;
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    return CharacterAdvancement;
}(FormApplication));
exports.CharacterAdvancement = CharacterAdvancement;
