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
exports.ARd20ItemSheet = void 0;
var effects_mjs_1 = require("../helpers/effects.mjs");
var feat_req_mjs_1 = require("../helpers/feat_req.mjs");
/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
var ARd20ItemSheet = /** @class */ (function (_super) {
    __extends(ARd20ItemSheet, _super);
    function ARd20ItemSheet() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(ARd20ItemSheet, "defaultOptions", {
        /** @override */
        get: function () {
            return mergeObject(_super.defaultOptions, {
                classes: ["ard20", "sheet", "item"],
                width: 520,
                height: 480,
                tabs: [
                    { navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" },
                    { navSelector: ".data-tabs", contentSelector: ".data-section", initial: "untrained" },
                ]
            });
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ARd20ItemSheet.prototype, "template", {
        /** @override */
        get: function () {
            var path = "systems/ard20/templates/item";
            return "".concat(path, "/item-").concat(this.item.data.type, "-sheet.html");
        },
        enumerable: false,
        configurable: true
    });
    /* -------------------------------------------- */
    /** @override */
    ARd20ItemSheet.prototype.getData = function () {
        var _a, _b;
        // Retrieve base data structure.
        var context = _super.prototype.getData.call(this);
        // Use a safe clone of the item data for further operations.
        var itemData = context.item.data;
        context.labels = this.item.labels;
        context.config = CONFIG.ARd20;
        // Retrieve the roll data for TinyMCE editors.
        context.rollData = {};
        var props = [];
        var actor = (_b = (_a = this.object) === null || _a === void 0 ? void 0 : _a.parent) !== null && _b !== void 0 ? _b : null;
        if (actor) {
            context.rollData = actor.getRollData();
        }
        // Add the actor's data to context.data for easier access, as well as flags.
        context.data = itemData.data;
        context.flags = itemData.flags;
        context.isGM = game.user.isGM;
        context.type = context.item.type;
        context.effects = (0, effects_mjs_1.prepareActiveEffectCategories)(this.item.effects);
        return context;
    };
    ARd20ItemSheet.prototype._getSubmitData = function (updateData) {
        var _a;
        if (updateData === void 0) { updateData = {}; }
        // Create the expanded update data object
        var fd = new FormDataExtended(this.form, { editors: this.editors });
        var data = fd.toObject();
        if (updateData)
            data = mergeObject(data, updateData);
        else
            data = expandObject(data);
        // Handle Damage array
        var damage = (_a = data.data) === null || _a === void 0 ? void 0 : _a.damage;
        if (damage) {
            if (damage.parts) {
                damage.damType = Object.values((damage === null || damage === void 0 ? void 0 : damage.damType) || {});
                damage.parts = Object.values((damage === null || damage === void 0 ? void 0 : damage.parts) || {}).map(function (d, ind) {
                    var a = [];
                    if (damage.damType[ind].length !== 0) {
                        damage.damType[ind].forEach(function (sub, i) { return a.push(JSON.parse(damage.damType[ind][i])); });
                    }
                    return [d[0] || "", a];
                });
            }
            else {
                for (var _i = 0, _b = Object.entries(damage); _i < _b.length; _i++) {
                    var _c = _b[_i], key = _c[0], type = _c[1];
                    var _loop_1 = function (k, prof) {
                        prof.damType = Object.values((prof === null || prof === void 0 ? void 0 : prof.damType) || {});
                        prof.parts = Object.values((prof === null || prof === void 0 ? void 0 : prof.parts) || {}).map(function (d, ind) {
                            var a = [];
                            if (prof.damType[ind].length !== 0 && prof.damType[ind][0] !== "") {
                                prof.damType[ind].forEach(function (sub, i) { return a.push(JSON.parse(prof.damType[ind][i])); });
                            }
                            return [d[0] || "", a];
                        });
                    };
                    for (var _d = 0, _e = Object.entries(type); _d < _e.length; _d++) {
                        var _f = _e[_d], k = _f[0], prof = _f[1];
                        _loop_1(k, prof);
                    }
                }
            }
        }
        return flattenObject(data);
    };
    /* -------------------------------------------- */
    /** @override */
    ARd20ItemSheet.prototype.activateListeners = function (html) {
        var _this = this;
        _super.prototype.activateListeners.call(this, html);
        var edit = !this.isEditable;
        var context = this.getData();
        function formatSelection(state) {
            var parent = $(state.element).parent().prop("tagName");
            if (!state.id || parent !== "OPTGROUP")
                return state.text;
            var optgroup = $(state.element).parent().attr("label");
            var subtype = state.element.value.match(/(\w+)/g)[1];
            var url = "systems/ard20/css/".concat(subtype, ".svg");
            return "<div><img style=\"width:15px; background-color:black; margin-left:2px\" src=".concat(url, " />").concat(optgroup, " ").concat(state.text, "</div>");
        }
        function formatResult(state) {
            var parent = $(state.element).parent().prop("tagName");
            if (!state.id || parent !== "OPTGROUP")
                return state.text;
            var subtype = state.element.value.match(/(\w+)/g)[1];
            var url = "systems/ard20/css/".concat(subtype, ".svg");
            return "<div><img style=\"width:15px; background-color:black; margin-left:2px\" src=".concat(url, " /> ").concat(state.text, "</div>");
        }
        $("select.select2", html).select2({
            theme: "filled",
            width: "auto",
            dropdownAutoWidth: true,
            disabled: edit,
            templateSelection: formatSelection,
            templateResult: formatResult,
            escapeMarkup: function (m) {
                return m;
            }
        }).val(function (index, valu) {
            var name = $('select.select2', html)[index].name;
            var val = getProperty(context, name);
            return val;
        }).trigger('change');
        $("select").on("select2:unselect", function (evt) {
            if (!evt.params.originalEvent) {
                return;
            }
            evt.params.originalEvent.stopPropagation();
        });
        // Everything below here is only needed if the sheet is editable
        if (!this.isEditable)
            return;
        html.find(".effect-control").click(function (ev) { return (0, effects_mjs_1.onManageActiveEffect)(ev, _this.item); });
        // Roll handlers, click handlers, etc. would go here.
        html.find(".config-button").click(this._FeatReq.bind(this));
        html.find("i.rollable").click(this._ChangeSign.bind(this));
        html.find(".damage-control").click(this._onDamageControl.bind(this));
    };
    ARd20ItemSheet.prototype._ChangeSign = function (event) {
        var _a;
        if (this.item.data.type !== "race")
            return;
        var button = event.currentTarget;
        var key = button.dataset.key;
        var attr = "data.bonus.abil.".concat(key, ".sign");
        this.item.update((_a = {}, _a[attr] = !getProperty(this.item.data, attr), _a));
    };
    ARd20ItemSheet.prototype._FeatReq = function (event) {
        event.preventDefault();
        var button = event.currentTarget;
        var app;
        switch (button.dataset.action) {
            case "feat-req":
                app = new feat_req_mjs_1.FeatRequirements(this.object);
                break;
        }
        app === null || app === void 0 ? void 0 : app.render(true);
    };
    ARd20ItemSheet.prototype._onDamageControl = function (event) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var a, path, damage, partsPath, damTypePath, update, li, path, damage, partsPath, damTypePath, update;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        event.preventDefault();
                        a = event.currentTarget;
                        if (!a.classList.contains("add-damage")) return [3 /*break*/, 2];
                        path = a.dataset.type ? "data.damage" + a.dataset.type : "data.damage";
                        damage = getProperty(this.item.data, path);
                        damage.damType = damage.damType || [];
                        partsPath = path + ".parts";
                        damTypePath = path + ".damType";
                        update = {};
                        update[partsPath] = damage.parts.concat([["", ["", ""]]]);
                        update[damTypePath] = (_a = damage.damType) === null || _a === void 0 ? void 0 : _a.concat([[""]]);
                        return [4 /*yield*/, this.item.update(update)];
                    case 1:
                        _b.sent();
                        _b.label = 2;
                    case 2:
                        if (!a.classList.contains("delete-damage")) return [3 /*break*/, 4];
                        li = a.closest(".damage-part");
                        path = a.dataset.type ? "data.damage" + a.dataset.type : "data.damage";
                        damage = getProperty(this.item.data, path);
                        console.log(damage);
                        damage.parts.splice(Number(li.dataset.damagePart), 1);
                        damage.damType.splice(Number(li.dataset.damagePart), 1);
                        partsPath = path + ".parts";
                        damTypePath = path + ".damType";
                        update = {};
                        update[partsPath] = damage.parts;
                        update[damTypePath] = damage.damType;
                        return [4 /*yield*/, this.item.update(update)];
                    case 3:
                        _b.sent();
                        _b.label = 4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    ARd20ItemSheet.prototype._onSubmit = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this._tabs[0].active === "data")
                            this.position.height = "auto";
                        return [4 /*yield*/, _super.prototype._onSubmit.apply(this, args)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return ARd20ItemSheet;
}(ItemSheet));
exports.ARd20ItemSheet = ARd20ItemSheet;
