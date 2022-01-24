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
exports.ARd20Item = void 0;
var dice_js_1 = require("../dice/dice.js");
/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
var ARd20Item = /** @class */ (function (_super) {
    __extends(ARd20Item, _super);
    function ARd20Item() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * Augment the basic Item data model with additional dynamic data.
     */
    ARd20Item.prototype.prepareData = function () {
        // As with the actor class, items are documents that can have their data
        // preparation methods overridden (such as prepareBaseData()).
        _super.prototype.prepareData.call(this);
    };
    ARd20Item.prototype.prepareBaseData = function () { };
    ARd20Item.prototype.prepareDerivedData = function () {
        _super.prototype.prepareDerivedData.call(this);
        var itemData = this.data;
        var labels = (this.labels = {});
        this._prepareSpellData(itemData, labels);
        this._prepareWeaponData(itemData, labels);
        this._prepareFeatureData(itemData, labels);
        this._prepareRaceData(itemData, labels);
        this._prepareArmorData(itemData, labels);
        if (itemData.data.hasAttack)
            this._prepareAttack(itemData);
        if (itemData.data.hasDamage)
            this._prepareDamage(itemData);
        if (!this.isOwned)
            this.prepareFinalAttributes();
    };
    /**
     *Prepare data for Spells
     */
    ARd20Item.prototype._prepareSpellData = function (itemData, labels) {
        if (itemData.type !== "spell")
            return;
        var data = itemData.data;
        labels.school = CONFIG.ARd20.SpellSchool[data.school];
    };
    /**
     *Prepare data for weapons
     */
    ARd20Item.prototype._prepareWeaponData = function (itemData, labels) {
        if (itemData.type !== "weapon")
            return;
        var data = itemData.data;
        var flags = itemData.flags;
        data.hasAttack = data.hasAttack || true;
        data.hasDamage = data.hasDamage || true;
        this._SetProperties(data);
        this._setDeflect(data);
        this._setTypeAndSubtype(data, flags, labels);
        for (var _i = 0, _a = Object.entries(data.damage); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], type = _b[1];
            if (key !== "current") {
                var _loop_1 = function (key_1, prof) {
                    prof.formula = "";
                    prof.parts.forEach(function (part) {
                        if (Array.isArray(part[1])) {
                            prof.formula += "".concat(part[0]);
                            part[1].forEach(function (sub, ind) {
                                if (ind === 0) {
                                    prof.formula += " {".concat(sub[0], " ").concat(sub[1]);
                                    prof.formula += ind === part[1].length - 1 ? "}" : "";
                                }
                                else {
                                    prof.formula += " or ".concat(sub[0], " ").concat(sub[1]);
                                    prof.formula += ind === part[1].length - 1 ? "}" : "";
                                }
                            });
                        }
                        else
                            prof.formula += "".concat(part[0], " {").concat(part[1], " ").concat(part[2], "}; ");
                    });
                };
                for (var _c = 0, _d = Object.entries(type); _c < _d.length; _c++) {
                    var _e = _d[_c], key_1 = _e[0], prof = _e[1];
                    _loop_1(key_1, prof);
                }
            }
        }
    };
    ARd20Item.prototype._SetProperties = function (data) {
        var _a, _b, _c;
        for (var _i = 0, _d = Object.entries(data.property.untrained); _i < _d.length; _i++) {
            var _e = _d[_i], k = _e[0], v = _e[1];
            v = (_a = CONFIG.ARd20.Prop[k]) !== null && _a !== void 0 ? _a : k;
        }
        for (var _f = 0, _g = Object.entries(data.property.basic); _f < _g.length; _f++) {
            var _h = _g[_f], k = _h[0], v = _h[1];
            v = (_b = CONFIG.ARd20.Prop[k]) !== null && _b !== void 0 ? _b : k;
            if (data.property.untrained[k] === true && k != "awk") {
                data.property.basic[k] = true;
            }
        }
        for (var _j = 0, _k = Object.entries(data.property.master); _j < _k.length; _j++) {
            var _l = _k[_j], k = _l[0], v = _l[1];
            v = (_c = CONFIG.ARd20.Prop[k]) !== null && _c !== void 0 ? _c : k;
            if (data.property.basic[k] === true && k != "awk") {
                data.property.master[k] = true;
            }
        }
    };
    /**
     *Set deflect die equal to damage die, if not
     */
    ARd20Item.prototype._setDeflect = function (data) {
        var _a;
        for (var _i = 0, _b = Object.entries(CONFIG.ARd20.prof); _i < _b.length; _i++) {
            var _c = _b[_i], k = _c[0], v = _c[1];
            v = (_a = game.i18n.localize(CONFIG.ARd20.prof[k])) !== null && _a !== void 0 ? _a : k;
            v = v.toLowerCase();
            data.deflect[v] = data.property[v].def ? data.deflect[v] || data.damage.common[v] : 0;
        }
    };
    ARd20Item.prototype._setTypeAndSubtype = function (data, flags, labels) {
        var _a, _b, _c, _d;
        data.type.value = data.type.value || "amb";
        data.settings = game.settings.get("ard20", "profs").weapon.filter(function (prof) { return prof.type === data.type.value; });
        if ((_a = flags.core) === null || _a === void 0 ? void 0 : _a.sourceId) {
            var id = /Item.(.+)/.exec(flags.core.sourceId)[1] || null;
            data.sub_type = data.sub_type === undefined ? (_b = game.items) === null || _b === void 0 ? void 0 : _b.get(id).data.data.sub_type : data.sub_type;
        }
        data.sub_type = data.settings.filter(function (prof) { return prof.name === data.sub_type; }).length === 0 ? data.settings[0].name : data.sub_type || data.settings[0].name;
        labels.type = (_c = game.i18n.localize(CONFIG.ARd20.WeaponType[data.type.value])) !== null && _c !== void 0 ? _c : CONFIG.ARd20.WeaponType[data.type.value];
        labels.prof = (_d = game.i18n.localize(CONFIG.ARd20.prof[data.prof.value])) !== null && _d !== void 0 ? _d : CONFIG.ARd20.prof[data.prof.value];
        data.prof.label = labels.prof;
        data.type.label = labels.type;
    };
    /**
     *Prepare data for features
     */
    ARd20Item.prototype._prepareFeatureData = function (itemData, labels) {
        if (itemData.type !== "feature")
            return;
        var data = itemData.data;
        // Handle Source of the feature
        labels.source = [];
        data.source.label = "";
        data.source.value.forEach(function (value, key) {
            labels.source.push(game.i18n.localize(CONFIG.ARd20.source[value]));
            data.source.label += key === 0 ? labels.source[key] : ", ".concat(labels.source[key]);
        });
        //labels.source = game.i18n.localize(CONFIG.ARd20.source[data.source.value]);
        data.keys = [];
        //define levels
        data.level.has = data.level.has !== undefined ? data.level.has : false;
        data.level.max = data.level.has ? data.level.max || 4 : 1;
        data.level.current = this.isOwned ? Math.max(data.level.initial, 1) : 0;
        //define exp cost
        if (data.level.max > 1) {
            var n = (10 - data.level.max) / data.level.max;
            var k = 1.7 + (Math.round(Number((Math.abs(n) * 100).toPrecision(15))) / 100) * Math.sign(n);
            if (data.xp.length < data.level.max) {
                for (var i = 1; i < data.level.max; i++) {
                    data.xp.push(Math.round((data.xp[i - 1] * k) / 5) * 5);
                }
            }
            else {
                for (var i = 1; i < data.level.max; i++) {
                    data.xp[i] = Math.round((data.xp[i - 1] * k) / 5) * 5;
                }
            }
        }
        for (var _i = 0, _a = Object.entries(data.req.values); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], req = _b[1];
            req.pass = Array.from("0".repeat(data.level.max));
            switch (req.type) {
                case "ability":
                    for (var _c = 0, _d = Object.entries(CONFIG.ARd20.abilities); _c < _d.length; _c++) {
                        var _e = _d[_c], key_2 = _e[0], v = _e[1];
                        if (req.name === game.i18n.localize(CONFIG.ARd20.abilities[key_2]))
                            req.value = key_2;
                    }
                    break;
                case "skill":
                    for (var _f = 0, _g = Object.entries(CONFIG.ARd20.skills); _f < _g.length; _f++) {
                        var _h = _g[_f], key_3 = _h[0], v = _h[1];
                        if (req.name === game.i18n.localize(CONFIG.ARd20.skills[key_3]))
                            req.value = key_3;
                    }
                    break;
            }
        }
        for (var i = data.req.logic.length; data.level.max > data.req.logic.length; i++) {
            if (i === 0) {
                data.req.logic.push("1");
            }
            else {
                data.req.logic.push(data.req.logic[i - 1]);
            }
        }
        for (var i = data.req.logic.length; data.level.max < data.req.logic.length; i--) {
            data.req.logic.splice(data.req.logic.length - 1, 1);
        }
    };
    /**
     * Prepare data for 'race' type of item
     */
    ARd20Item.prototype._prepareRaceData = function (itemData, labels) {
        if (itemData.type !== "race")
            return;
        var data = itemData.data;
        data.HPdie = CONFIG.ARd20.HPdice.slice(0, 7);
    };
    /**
     * Prepare data for "armor" type item
     */
    ARd20Item.prototype._prepareArmorData = function (itemData, labels) {
        var _a, _b;
        if (itemData.type !== "armor")
            return;
        var data = itemData.data;
        for (var _i = 0, _c = Object.entries(CONFIG.ARd20.DamageSubTypes); _i < _c.length; _i++) {
            var _d = _c[_i], key = _d[0], dr = _d[1];
            if (!(key === "force" || key === "rad" || key === "psyhic")) {
                data.res.phys[key] = (_a = data.res.phys[key]) !== null && _a !== void 0 ? _a : 0;
            }
            data.res.mag[key] = (_b = data.res.mag[key]) !== null && _b !== void 0 ? _b : 0;
        }
        data.heavyPoints = CONFIG.ARd20.HeavyPoints[data.type][data.slot];
    };
    /**
    Prepare Data that uses actor's data
    */
    ARd20Item.prototype.prepareFinalAttributes = function () {
        var _a, _b, _c;
        var itemData = this.data;
        var data = itemData.data;
        var labels = this.labels;
        labels.abil = {};
        labels.skills = {};
        labels.feats = {};
        var abil = (data.abil = {});
        for (var _i = 0, _d = Object.entries(CONFIG.ARd20.abilities); _i < _d.length; _i++) {
            var _e = _d[_i], k = _e[0], v = _e[1];
            v = this.isOwned ? getProperty(this.actor.data, "data.abilities.".concat(k, ".mod")) : null;
            abil[k] = v;
        }
        var prof_bonus = 0;
        if (this.data.type === "weapon") {
            data.prof.value = this.isOwned ? (_b = Object.values((_a = this.actor) === null || _a === void 0 ? void 0 : _a.data.data.profs.weapon).filter(function (pr) { return pr.name === data.sub_type; })[0]) === null || _b === void 0 ? void 0 : _b.value : 0;
            this.labels.prof = (_c = game.i18n.localize(CONFIG.ARd20.prof[data.prof.value])) !== null && _c !== void 0 ? _c : CONFIG.ARd20.prof[data.prof.value];
            data.prof.label = this.labels.prof;
            if (data.prof.value === 0) {
                prof_bonus = 0;
            }
            else if (data.prof.value === 1) {
                prof_bonus = this.actor.data.data.attributes.prof_die;
            }
            else if (data.prof.value === 2) {
                prof_bonus = this.actor.data.data.attributes.prof_die + "+" + this.actor.data.data.attributes.prof_bonus;
            }
        }
        this._prepareAttack(itemData, prof_bonus, abil);
        this._prepareDamage(itemData, abil);
    };
    ARd20Item.prototype._prepareAttack = function (itemData, prof_bonus, abil) {
        var data = itemData.data;
        if (!data.hasAttack)
            return;
        if (data.atkMod) {
        }
        var mod = itemData.type === "weapon" && abil !== undefined ? abil.dex : data.atkMod;
        data.attack = {
            formula: "1d20+" + prof_bonus + "+" + mod,
            parts: [mod, prof_bonus]
        };
    };
    ARd20Item.prototype._prepareDamage = function (itemData, abil) {
        var data = itemData.data;
        if (!data.hasDamage)
            return;
        var mod = itemData.type === "weapon" && abil !== undefined ? abil.str : 0;
        var prop = itemData.type === "weapon" ? "damage.common.".concat(this.labels.prof.toLowerCase(), ".parts") : "damage.parts";
        var baseDamage = getProperty(data, prop);
        data.damage.current = {
            formula: "",
            parts: baseDamage
        };
        console.log(baseDamage);
        baseDamage.forEach(function (part) {
            data.damage.current.formula += part[0] + "[".concat(part[1], ", ").concat(part[2], "] ");
        });
    };
    /**
     * Prepare a data object which is passed to any Roll formulas which are created related to this Item
     * @private
     */
    ARd20Item.prototype.getRollData = function (hasAttack, hasDamage) {
        // If present, return the actor's roll data.
        if (!this.actor)
            return null;
        var rollData = this.actor.getRollData();
        rollData.item = foundry.utils.deepClone(this.data.data);
        rollData.damageDie = hasDamage ? this.data.data.damage.current.parts[0] : null;
        rollData.mod = hasAttack ? this.data.data.attack.parts[0] : hasDamage ? this.data.data.damage.current.parts[1] : null;
        rollData.prof = hasAttack ? this.data.data.attack.parts[1] : null;
        return rollData;
    };
    /**
     * Handle clickable rolls.
     * @param {Event} event   The originating click event
     * @private
     */
    ARd20Item.prototype.roll = function (_a) {
        var _b = _a === void 0 ? {} : _a, _c = _b.configureDialog, configureDialog = _c === void 0 ? true : _c, rollMode = _b.rollMode, _d = _b.hasDamage, hasDamage = _d === void 0 ? false : _d, _e = _b.hasAttack, hasAttack = _e === void 0 ? false : _e, _f = _b.createMessage, createMessage = _f === void 0 ? true : _f;
        return __awaiter(this, void 0, void 0, function () {
            var item, id, iData, actor, aData, speaker, iName, targets, mRoll;
            return __generator(this, function (_g) {
                item = this;
                id = item.id;
                iData = this.data.data;
                actor = this.actor;
                aData = actor.data.data;
                hasDamage = iData.hasDamage || hasDamage;
                hasAttack = iData.hasAttack || hasAttack;
                speaker = ChatMessage.getSpeaker({ actor: this.actor });
                iName = this.name;
                targets = Array.from(game.user.targets);
                mRoll = this.data.data.mRoll || false;
                return [2 /*return*/, item.displayCard({ rollMode: rollMode, createMessage: createMessage, hasAttack: hasAttack, hasDamage: hasDamage, targets: targets, mRoll: mRoll })];
            });
        });
    };
    /* -------------------------------------------- */
    /*  Chat Message Helpers                        */
    /* -------------------------------------------- */
    ARd20Item.chatListeners = function (html) {
        html.on("click", ".card-buttons button", this._onChatCardAction.bind(this));
        html.on("click", ".item-name", this._onChatCardToggleContent.bind(this));
        html.on("click", ".attack-roll .roll-controls .accept", this._rollDamage.bind(this));
        html.on("hover", ".attack-roll .flexrow .value", function (event) {
            var _a;
            event.preventDefault();
            var element = this.closest("li.flexrow");
            (_a = element.querySelector(".attack-roll .hover-roll")) === null || _a === void 0 ? void 0 : _a.classList.toggle("shown", event.type == "mouseenter");
        });
    };
    /* -------------------------------------------- */
    /**
     * Handle execution of a chat card action via a click event on one of the card buttons
     * @param {Event} event       The originating click event
     * @returns {Promise}         A promise which resolves once the handler workflow is complete
     * @private
     */
    ARd20Item._onChatCardAction = function (event) {
        return __awaiter(this, void 0, void 0, function () {
            var button, card, messageId, message, action, targetUuid, isTargetted, actor, storedData, item, spellLevel, _a, dam, html, targets, _i, targets_1, token, speaker, template;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        event.preventDefault();
                        button = event.currentTarget;
                        card = button.closest(".chat-card");
                        messageId = card.closest(".message").dataset.messageId;
                        message = game.messages.get(messageId);
                        action = button.dataset.action;
                        targetUuid = button.closest(".flexrow").dataset.targetId;
                        isTargetted = action === "save";
                        if (!(isTargetted || game.user.isGM || message.isAuthor))
                            return [2 /*return*/];
                        return [4 /*yield*/, this._getChatCardActor(card)];
                    case 1:
                        actor = _b.sent();
                        if (!actor)
                            return [2 /*return*/];
                        storedData = message.getFlag("ard20", "itemData");
                        item = storedData ? new this(storedData, { parent: actor }) : actor.items.get(card.dataset.itemId);
                        if (!item) {
                            return [2 /*return*/, ui.notifications.error(game.i18n.format("ARd20.ActionWarningNoItem", { item: card.dataset.itemId, name: actor.name }))];
                        }
                        spellLevel = parseInt(card.dataset.spellLevel) || null;
                        _a = action;
                        switch (_a) {
                            case "damage": return [3 /*break*/, 2];
                            case "versatile": return [3 /*break*/, 2];
                            case "formula": return [3 /*break*/, 6];
                            case "save": return [3 /*break*/, 8];
                            case "toolCheck": return [3 /*break*/, 13];
                            case "placeTemplate": return [3 /*break*/, 15];
                        }
                        return [3 /*break*/, 16];
                    case 2: return [4 /*yield*/, item.rollDamage({
                            critical: event.altKey,
                            event: event,
                            spellLevel: spellLevel,
                            versatile: action === "versatile"
                        })];
                    case 3:
                        dam = _b.sent();
                        html = $(message.data.content);
                        return [4 /*yield*/, dam.render()];
                    case 4:
                        dam = _b.sent();
                        //dom.querySelector('button').replaceWith(dam)
                        if (targetUuid) {
                            html.find("[data-targetId=\"".concat(targetUuid, "\"]")).find("button").replaceWith(dam);
                        }
                        else {
                            html.find(".damage-roll").find("button").replaceWith(dam);
                        }
                        //console.log(dom)
                        return [4 /*yield*/, message.update({ content: html[0].outerHTML })];
                    case 5:
                        //console.log(dom)
                        _b.sent();
                        return [3 /*break*/, 16];
                    case 6: return [4 /*yield*/, item.rollFormula({ event: event, spellLevel: spellLevel })];
                    case 7:
                        _b.sent();
                        return [3 /*break*/, 16];
                    case 8:
                        targets = this._getChatCardTargets(card);
                        _i = 0, targets_1 = targets;
                        _b.label = 9;
                    case 9:
                        if (!(_i < targets_1.length)) return [3 /*break*/, 12];
                        token = targets_1[_i];
                        speaker = ChatMessage.getSpeaker({ scene: canvas.scene, token: token });
                        return [4 /*yield*/, token.actor.rollAbilitySave(button.dataset.ability, { event: event, speaker: speaker })];
                    case 10:
                        _b.sent();
                        _b.label = 11;
                    case 11:
                        _i++;
                        return [3 /*break*/, 9];
                    case 12: return [3 /*break*/, 16];
                    case 13: return [4 /*yield*/, item.rollToolCheck({ event: event })];
                    case 14:
                        _b.sent();
                        return [3 /*break*/, 16];
                    case 15:
                        template = game.ard20.canvas.AbilityTemplate.fromItem(item);
                        if (template)
                            template.drawPreview();
                        return [3 /*break*/, 16];
                    case 16:
                        // Re-enable the button
                        button.disabled = false;
                        return [2 /*return*/];
                }
            });
        });
    };
    /* -------------------------------------------- */
    /**
     * Handle toggling the visibility of chat card content when the name is clicked
     * @param {Event} event   The originating click event
     * @private
     */
    ARd20Item._onChatCardToggleContent = function (event) {
        event.preventDefault();
        var header = event.currentTarget;
        var card = header.closest(".chat-card");
        var content = card.querySelector(".card-content");
        content.style.display = content.style.display === "none" ? "block" : "none";
    };
    ARd20Item.prototype._applyDamage = function (dam, tData, tHealth, tActor) {
        return __awaiter(this, void 0, void 0, function () {
            var value, obj;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        value = dam.total;
                        console.log("урон до резистов: ", value);
                        dam.terms.forEach(function (term) {
                            if (!(term instanceof OperatorTerm)) {
                                var damageType = term.options.damageType;
                                var res = tData.defences.damage[damageType[0]][damageType[1]];
                                if (res.type === "imm")
                                    console.log("Иммунитет");
                                console.log("урон уменьшился с ", value);
                                value -= res.type === "imm" ? term.total : Math.min(res.value, term.total);
                                console.log("до", value);
                            }
                        });
                        console.log(value, "итоговый урон");
                        tHealth -= value;
                        console.log("хп стало", tHealth);
                        obj = {};
                        obj["data.health.value"] = tHealth;
                        if (!game.user.isGM) return [3 /*break*/, 2];
                        return [4 /*yield*/, tActor.update(obj)];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        game.socket.emit("system.ard20", {
                            operation: "updateActorData",
                            actor: tActor,
                            update: obj,
                            value: value
                        });
                        _a.label = 3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    ARd20Item._rollDamage = function (event) {
        return __awaiter(this, void 0, void 0, function () {
            var element, card, message, targetUuid, token, tActor, tData, tHealth, actor, storedData, item, dam, html, damHTML;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        event.preventDefault();
                        element = event.currentTarget;
                        card = element.closest(".chat-card");
                        message = game.messages.get(card.closest(".message").dataset.messageId);
                        targetUuid = element.closest("li.flexrow").dataset.targetId;
                        return [4 /*yield*/, fromUuid(targetUuid)];
                    case 1:
                        token = _a.sent();
                        tActor = token.actor;
                        tData = tActor.data.data;
                        tHealth = tData.health.value;
                        console.log(tHealth, "здоровье цели");
                        return [4 /*yield*/, this._getChatCardActor(card)];
                    case 2:
                        actor = _a.sent();
                        if (!actor)
                            return [2 /*return*/];
                        storedData = message.getFlag("ard20", "itemData");
                        item = storedData ? new this(storedData, { parent: actor }) : actor.items.get(card.dataset.itemId);
                        if (!item) {
                            return [2 /*return*/, ui.notifications.error(game.i18n.format("ARd20.ActionWarningNoItem", { item: card.dataset.itemId, name: actor.name }))];
                        }
                        return [4 /*yield*/, item.rollDamage({
                                event: event,
                                canMult: false
                            })];
                    case 3:
                        dam = _a.sent();
                        html = $(message.data.content);
                        return [4 /*yield*/, dam.render()];
                    case 4:
                        damHTML = _a.sent();
                        console.log(html.find("[data-target-id=\"".concat(targetUuid, "\"]")).find(".damage-roll")[0]);
                        html.find("[data-target-id=\"".concat(targetUuid, "\"]")).find(".damage-roll").append(damHTML);
                        html.find("[data-target-id=\"".concat(targetUuid, "\"]")).find(".accept").remove();
                        console.log(html[0]);
                        return [4 /*yield*/, message.update({ content: html[0].outerHTML })];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, item._applyDamage(dam, tData, tHealth, tActor)];
                    case 6:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /* -------------------------------------------- */
    /**
     * Get the Actor which is the author of a chat card
     * @param {HTMLElement} card    The chat card being used
     * @return {Actor|null}         The Actor entity or null
     * @private
     */
    ARd20Item._getChatCardActor = function (card) {
        return __awaiter(this, void 0, void 0, function () {
            var token, actorId;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!card.dataset.tokenId) return [3 /*break*/, 2];
                        return [4 /*yield*/, fromUuid(card.dataset.tokenId)];
                    case 1:
                        token = _a.sent();
                        if (!token)
                            return [2 /*return*/, null];
                        return [2 /*return*/, token.actor];
                    case 2:
                        actorId = card.dataset.actorId;
                        return [2 /*return*/, game.actors.get(actorId) || null];
                }
            });
        });
    };
    /* -------------------------------------------- */
    /**
     * Get the Actor which is the author of a chat card
     * @param {HTMLElement} card    The chat card being used
     * @return {Actor[]}            An Array of Actor entities, if any
     * @private
     */
    ARd20Item._getChatCardTargets = function (card) {
        var targets = canvas.tokens.controlled.filter(function (t) { return !!t.actor; });
        if (!targets.length && game.user.character)
            targets = targets.concat(game.user.character.getActiveTokens());
        if (!targets.length)
            ui.notifications.warn(game.i18n.localize("ARd20.ActionWarningNoToken"));
        return targets;
    };
    /*showRollDetail(event){
      event.preventDefault();
      const elem = event.currentTarget;
      const
    }*/
    ARd20Item.prototype.displayCard = function (_a) {
        var _b, _c;
        var _d = _a === void 0 ? {} : _a, rollMode = _d.rollMode, _e = _d.createMessage, createMessage = _e === void 0 ? true : _e, _f = _d.hasAttack, hasAttack = _f === void 0 ? Boolean() : _f, _g = _d.hasDamage, hasDamage = _g === void 0 ? Boolean() : _g, _h = _d.targets, targets = _h === void 0 ? [] : _h, _j = _d.mRoll, mRoll = _j === void 0 ? Boolean() : _j;
        return __awaiter(this, void 0, void 0, function () {
            var atk, dc, atkHTML, dmgHTML, result, hit, dmg, dieResultCss, def, token, atkRoll, _k, dmgRoll, _l, _i, _m, _o, key, target, _p, _q, _r, _s, _t, _u, _v, d20, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, templateState, templateData, html, chatData;
            return __generator(this, function (_9) {
                switch (_9.label) {
                    case 0:
                        atk = {};
                        dc = {};
                        atkHTML = {};
                        dmgHTML = {};
                        result = {};
                        hit = {};
                        dmg = {};
                        dieResultCss = {};
                        def = (_c = (_b = this.data.data.attack) === null || _b === void 0 ? void 0 : _b.def) !== null && _c !== void 0 ? _c : "reflex";
                        token = this.actor.token;
                        if (!(targets.length !== 0)) return [3 /*break*/, 27];
                        if (!hasAttack) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.rollAttack(mRoll, { canMult: true })];
                    case 1:
                        _k = _9.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        _k = null;
                        _9.label = 3;
                    case 3:
                        atkRoll = _k;
                        if (!(hasDamage && !hasAttack)) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.rollDamage({ canMult: true })];
                    case 4:
                        _l = _9.sent();
                        return [3 /*break*/, 6];
                    case 5:
                        _l = null;
                        _9.label = 6;
                    case 6:
                        dmgRoll = _l;
                        _i = 0, _m = Object.entries(targets);
                        _9.label = 7;
                    case 7:
                        if (!(_i < _m.length)) return [3 /*break*/, 26];
                        _o = _m[_i], key = _o[0], target = _o[1];
                        if (!atkRoll) return [3 /*break*/, 16];
                        mRoll = atkRoll.options.mRoll;
                        dc[key] = target.actor.data.data.defences.stats[def].value;
                        _p = atk;
                        _q = key;
                        if (!hasAttack) return [3 /*break*/, 11];
                        if (!(Object.keys(atk).length === 0 || !mRoll)) return [3 /*break*/, 8];
                        _s = atkRoll;
                        return [3 /*break*/, 10];
                    case 8: return [4 /*yield*/, atkRoll.reroll()];
                    case 9:
                        _s = _9.sent();
                        _9.label = 10;
                    case 10:
                        _r = (_s);
                        return [3 /*break*/, 12];
                    case 11:
                        _r = null;
                        _9.label = 12;
                    case 12:
                        _p[_q] = _r;
                        console.log(atk[key]);
                        _t = atkHTML;
                        _u = key;
                        if (!hasAttack) return [3 /*break*/, 14];
                        return [4 /*yield*/, atk[key].render()];
                    case 13:
                        _v = _9.sent();
                        return [3 /*break*/, 15];
                    case 14:
                        _v = null;
                        _9.label = 15;
                    case 15:
                        _t[_u] = _v;
                        d20 = atk[key] ? atk[key].terms[0] : null;
                        atk[key] = atk[key].total;
                        dieResultCss[key] = d20.total >= d20.options.critical ? "d20crit" : d20.total <= d20.options.fumble ? "d20fumble" : "d20normal";
                        result[key] = atk[key] > dc[key] ? "hit" : "miss";
                        hit[key] = result[key] === "hit" ? true : false;
                        return [3 /*break*/, 25];
                    case 16:
                        mRoll = dmgRoll.options.mRoll;
                        _w = dmg;
                        _x = key;
                        if (!hasDamage) return [3 /*break*/, 20];
                        if (!(Object.keys(dmg).length === 0 || !mRoll)) return [3 /*break*/, 17];
                        _z = dmgRoll;
                        return [3 /*break*/, 19];
                    case 17: return [4 /*yield*/, dmgRoll.reroll()];
                    case 18:
                        _z = _9.sent();
                        _9.label = 19;
                    case 19:
                        _y = (_z);
                        return [3 /*break*/, 21];
                    case 20:
                        _y = null;
                        _9.label = 21;
                    case 21:
                        _w[_x] = _y;
                        _0 = dmgHTML;
                        _1 = key;
                        if (!hasDamage) return [3 /*break*/, 23];
                        return [4 /*yield*/, dmg[key].render()];
                    case 22:
                        _2 = _9.sent();
                        return [3 /*break*/, 24];
                    case 23:
                        _2 = null;
                        _9.label = 24;
                    case 24:
                        _0[_1] = _2;
                        _9.label = 25;
                    case 25:
                        _i++;
                        return [3 /*break*/, 7];
                    case 26: return [3 /*break*/, 34];
                    case 27:
                        _3 = atk;
                        _4 = 0;
                        if (!hasAttack) return [3 /*break*/, 29];
                        return [4 /*yield*/, this.rollAttack(mRoll)];
                    case 28:
                        _5 = _9.sent();
                        return [3 /*break*/, 30];
                    case 29:
                        _5 = null;
                        _9.label = 30;
                    case 30:
                        _3[_4] = _5;
                        mRoll = atk[0] ? atk[0].options.mRoll : false;
                        _6 = atkHTML;
                        _7 = 0;
                        if (!hasAttack) return [3 /*break*/, 32];
                        return [4 /*yield*/, atk[0].render()];
                    case 31:
                        _8 = _9.sent();
                        return [3 /*break*/, 33];
                    case 32:
                        _8 = null;
                        _9.label = 33;
                    case 33:
                        _6[_7] = _8;
                        _9.label = 34;
                    case 34:
                        templateState = targets.size !== 0 ? (mRoll ? "multiAttack" : "oneAttack") : "noTarget";
                        templateData = {
                            actor: this.actor.data,
                            tokenId: (token === null || token === void 0 ? void 0 : token.uuid) || null,
                            item: this.data,
                            data: this.getChatData(),
                            labels: this.labels,
                            hasAttack: hasAttack,
                            hasDamage: hasDamage,
                            atk: atk,
                            atkHTML: atkHTML,
                            targets: targets,
                            owner: this.actor.isOwner || game.user.isGM,
                            dc: dc,
                            result: result,
                            hit: hit,
                            dmgHTML: dmgHTML,
                            dieResultCss: dieResultCss
                        };
                        return [4 /*yield*/, renderTemplate("systems/ard20/templates/chat/item-card-multiAttack.html", templateData)];
                    case 35:
                        html = _9.sent();
                        chatData = {
                            user: game.user.data._id,
                            type: CONST.CHAT_MESSAGE_TYPES.OTHER,
                            content: html,
                            flavor: this.data.data.chatFlavor || this.name,
                            speaker: ChatMessage.getSpeaker({ actor: this.actor, token: token }),
                            flags: { "core.canPopout": true }
                        };
                        // If the Item was destroyed in the process of displaying its card - embed the item data in the chat message
                        if (this.data.type === "consumable" && !this.actor.items.has(this.id)) {
                            chatData.flags["ard20.itemData"] = this.data;
                        }
                        // Apply the roll mode to adjust message visibility
                        ChatMessage.applyRollMode(chatData, rollMode || game.settings.get("core", "rollMode"));
                        // Create the Chat Message or return its data
                        return [2 /*return*/, createMessage ? ChatMessage.create(chatData) : chatData];
                }
            });
        });
    };
    /**
     * Prepare an object of chat data used to display a card for the Item in the chat log.
     * @param {object} htmlOptions    Options used by the TextEditor.enrichHTML function.
     * @returns {object}              An object of chat data to render.
     */
    ARd20Item.prototype.getChatData = function (htmlOptions) {
        var _a;
        if (htmlOptions === void 0) { htmlOptions = {}; }
        var data = foundry.utils.deepClone(this.data.data);
        var labels = this.labels;
        // Rich text description
        //data.description.value = TextEditor.enrichHTML(data.description.value, htmlOptions);
        // Item type specific properties
        var props = [];
        // Equipment properties
        if (data.hasOwnProperty("equipped") && !["loot", "tool"].includes(this.data.type)) {
            /*if (data.attunement === CONFIG.ARd20.attunementTypes.REQUIRED) {
              props.push(game.i18n.localize(CONFIG.ARd20.attunements[CONFIG.ARd20.attunementTypes.REQUIRED]));
            }*/
            props.push(game.i18n.localize(data.equipped ? "ARd20.Equipped" : "ARd20.Unequipped"));
        }
        // Ability activation properties
        if (data.hasOwnProperty("activation")) {
            props.push(labels.activation + (((_a = data.activation) === null || _a === void 0 ? void 0 : _a.condition) ? " (".concat(data.activation.condition, ")") : ""), labels.target, labels.range, labels.duration);
        }
        // Filter properties and return
        data.properties = props.filter(function (p) { return !!p; });
        return data;
    };
    /* -------------------------------------------- */
    /**
     * Prepare chat card data for weapon type items.
     * @param {object} data     Copy of item data being use to display the chat message.
     * @param {object} labels   Specially prepared item labels.
     * @param {string[]} props  Existing list of properties to be displayed. *Will be mutated.*
     * @private
     */
    /* -------------------------------------------- */
    /**
     * Place an attack roll using an item (weapon, feat, spell, or equipment)
     * Rely upon the d20Roll logic for the core implementation
     *
     * @param {object} options        Roll options which are configured and provided to the d20Roll function
     * @returns {Promise<Roll|null>}   A Promise which resolves to the created Roll instance
     */
    ARd20Item.prototype.rollAttack = function (mRoll, canMult, options) {
        var _a;
        if (mRoll === void 0) { mRoll = Boolean(); }
        if (canMult === void 0) { canMult = Boolean(); }
        if (options === void 0) { options = {}; }
        return __awaiter(this, void 0, void 0, function () {
            var itemData, flags, title, _b, parts, rollData, targets, rollConfig, roll;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        console.log(canMult);
                        itemData = this.data.data;
                        flags = this.actor.data.flags.ard20 || {};
                        title = "".concat(this.name, " - ").concat(game.i18n.localize("ARd20.AttackRoll"));
                        _b = this.getAttackToHit(), parts = _b.parts, rollData = _b.rollData;
                        targets = game.user.targets;
                        if (((_a = options.parts) === null || _a === void 0 ? void 0 : _a.length) > 0) {
                            parts.push.apply(parts, options.parts);
                        }
                        rollConfig = {
                            parts: parts,
                            actor: this.actor,
                            data: rollData,
                            title: title,
                            flavor: title,
                            dialogOptions: {
                                width: 400
                            },
                            chatMessage: true,
                            options: {
                                create: false
                            },
                            targetValue: targets,
                            canMult: canMult,
                            mRoll: mRoll
                        };
                        rollConfig = mergeObject(rollConfig, options);
                        return [4 /*yield*/, (0, dice_js_1.d20Roll)(rollConfig)];
                    case 1:
                        roll = _c.sent();
                        if (roll === false)
                            return [2 /*return*/, null];
                        return [2 /*return*/, roll];
                }
            });
        });
    };
    ARd20Item.prototype.rollDamage = function (_a) {
        var _b;
        var _c = _a === void 0 ? {} : _a, _d = _c.critical, critical = _d === void 0 ? false : _d, _e = _c.event, event = _e === void 0 ? null : _e, _f = _c.spellLevel, spellLevel = _f === void 0 ? null : _f, _g = _c.versatile, versatile = _g === void 0 ? false : _g, _h = _c.options, options = _h === void 0 ? {} : _h, _j = _c.mRoll, mRoll = _j === void 0 ? Boolean() : _j, _k = _c.canMult, canMult = _k === void 0 ? Boolean() : _k;
        console.log(canMult);
        var iData = this.data.data;
        var aData = this.actor.data.data;
        var parts = iData.damage.current.parts.map(function (d) { return d[0]; });
        var damType = iData.damage.current.parts.map(function (d) {
            return d[1].map(function (c, ind) {
                var a = game.i18n.localize(CONFIG.ARd20.DamageTypes[c[0]]);
                var b = game.i18n.localize(CONFIG.ARd20.DamageSubTypes[c[1]]);
                var obj = { key: ind, label: "".concat(a, " ").concat(b) };
                return obj;
            });
        });
        options.damageType = iData.damage.current.parts.map(function (d) { return d[1]; });
        var hasAttack = false;
        var hasDamage = true;
        var rollData = this.getRollData(hasAttack, hasDamage);
        var rollConfig = {
            actor: this.actor,
            critical: (_b = critical !== null && critical !== void 0 ? critical : event === null || event === void 0 ? void 0 : event.altkey) !== null && _b !== void 0 ? _b : false,
            data: rollData,
            event: event,
            parts: parts,
            canMult: canMult,
            damType: damType,
            mRoll: mRoll
        };
        return (0, dice_js_1.damageRoll)(mergeObject(rollConfig, options));
    };
    /**
     * Update a label to the Item detailing its total to hit bonus.
     * Sources:
     * - item entity's innate attack bonus
     * - item's actor's proficiency bonus if applicable
     * - item's actor's global bonuses to the given item type
     * - item's ammunition if applicable
     *
     * @returns {{rollData: object, parts: string[]}|null}  Data used in the item's Attack roll.
     */
    ARd20Item.prototype.getAttackToHit = function () {
        var itemData = this.data.data;
        var hasAttack = true;
        var hasDamage = false;
        //if (!this.hasAttack || !itemData) return;
        var rollData = this.getRollData(hasAttack, hasDamage);
        console.log("ROLL DATA", rollData);
        // Define Roll bonuses
        var parts = [];
        // Include the item's innate attack bonus as the initial value and label
        if (itemData.attackBonus) {
            parts.push(itemData.attackBonus);
            this.labels.toHit = itemData.attackBonus;
        }
        // Take no further action for un-owned items
        if (!this.isOwned)
            return { rollData: rollData, parts: parts };
        // Ability score modifier
        parts.push("@prof", "@mod");
        /* Add proficiency bonus if an explicit proficiency flag is present or for non-item features
        if ( !["weapon", "consumable"].includes(this.data.type)) {
          parts.push("@prof");
          if ( this.data.data.prof?.hasProficiency ) {
            rollData.prof = this.data.data.prof.term;
          }
        }
        */
        /* Actor-level global bonus to attack rolls
        const actorBonus = this.actor.data.data.bonuses?.[itemData.actionType] || {};
        if (actorBonus.attack) parts.push(actorBonus.attack);
        */
        /* One-time bonus provided by consumed ammunition
        if (itemData.consume?.type === "ammo" && this.actor.items) {
          const ammoItemData = this.actor.items.get(itemData.consume.target)?.data;
    
          if (ammoItemData) {
            const ammoItemQuantity = ammoItemData.data.quantity;
            const ammoCanBeConsumed = ammoItemQuantity && ammoItemQuantity - (itemData.consume.amount ?? 0) >= 0;
            const ammoItemAttackBonus = ammoItemData.data.attackBonus;
            const ammoIsTypeConsumable = ammoItemData.type === "consumable" && ammoItemData.data.consumableType === "ammo";
            if (ammoCanBeConsumed && ammoItemAttackBonus && ammoIsTypeConsumable) {
              parts.push("@ammo");
              rollData.ammo = ammoItemAttackBonus;
            }
          }
        }
        */
        // Condense the resulting attack bonus formula into a simplified label
        var roll = new Roll(parts.join("+"), rollData);
        var formula = (0, dice_js_1.simplifyRollFormula)(roll.formula);
        this.labels.toHit = !/^[+-]/.test(formula) ? "+ ".concat(formula) : formula;
        // Update labels and return the prepared roll data
        return { rollData: rollData, parts: parts };
    };
    return ARd20Item;
}(Item));
exports.ARd20Item = ARd20Item;
