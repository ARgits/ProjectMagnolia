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
exports.ARd20ActorSheet = void 0;
var effects_mjs_1 = require("../helpers/effects.mjs");
var cha_adv_mjs_1 = require("../helpers/cha-adv.mjs");
/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
var ARd20ActorSheet = /** @class */ (function (_super) {
    __extends(ARd20ActorSheet, _super);
    function ARd20ActorSheet() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(ARd20ActorSheet, "defaultOptions", {
        /** @override */
        get: function () {
            return mergeObject(_super.defaultOptions, {
                classes: ["ard20", "sheet", "actor"],
                template: "systems/ard20/templates/actor/actor-sheet.html",
                width: 600,
                height: 600,
                tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "main" }]
            });
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ARd20ActorSheet.prototype, "template", {
        /** @override */
        get: function () {
            return "systems/ard20/templates/actor/actor-".concat(this.actor.data.type, "-sheet.html");
        },
        enumerable: false,
        configurable: true
    });
    /* -------------------------------------------- */
    /** @override */
    ARd20ActorSheet.prototype.getData = function () {
        // Retrieve the data structure from the base sheet. You can inspect or log
        // the context variable to see the structure, but some key properties for
        // sheets are the actor object, the data object, whether or not it's
        // editable, the items array, and the effects array.
        var context = _super.prototype.getData.call(this);
        // Use a safe clone of the actor data for further operations.
        var actorData = context.actor.data;
        // Add the actor's data to context.data for easier access, as well as flags.
        context.data = actorData.data;
        context.flags = actorData.flags;
        context.config = CONFIG.ARd20;
        context.isGM = game.user.isGM;
        // Prepare character data and items.
        if (actorData.type == "character") {
            this._prepareItems(context);
            this._prepareCharacterData(context);
        }
        // Prepare NPC data and items.
        if (actorData.type == "npc") {
            this._prepareItems(context);
        }
        // Add roll data for TinyMCE editors.
        context.rollData = context.actor.getRollData();
        // Prepare active effects
        context.effects = (0, effects_mjs_1.prepareActiveEffectCategories)(this.actor.effects);
        return context;
    };
    /**
     * Organize and classify Items for Character sheets.
     *
     * @param {Object} actorData The actor to prepare.
     *
     * @return {undefined}
     */
    ARd20ActorSheet.prototype._prepareCharacterData = function (context) {
        var _a, _b, _c;
        // Handle ability scores.
        for (var _i = 0, _d = Object.entries(context.data.abilities); _i < _d.length; _i++) {
            var _e = _d[_i], k = _e[0], v = _e[1];
            v.label = (_a = game.i18n.localize(CONFIG.ARd20.abilities[k])) !== null && _a !== void 0 ? _a : k;
        }
        for (var _f = 0, _g = Object.entries(context.data.skills); _f < _g.length; _f++) {
            var _h = _g[_f], k = _h[0], v = _h[1];
            v.name = (_b = game.i18n.localize(CONFIG.ARd20.skills[k])) !== null && _b !== void 0 ? _b : k;
            v.rank_name = (_c = game.i18n.localize(CONFIG.ARd20.prof[v.rank])) !== null && _c !== void 0 ? _c : v.rank;
        }
    };
    /**
     * Organize and classify Items for Character sheets.
     *
     * @param {Object} actorData The actor to prepare.
     *
     * @return {undefined}
     */
    ARd20ActorSheet.prototype._prepareItems = function (context) {
        // Initialize containers.
        var gear = [];
        var features = [];
        var weapons = [];
        var armor = [];
        var spells = {
            0: [],
            1: [],
            2: [],
            3: [],
            4: [],
            5: [],
            6: [],
            7: [],
            8: [],
            9: []
        };
        // Iterate through items, allocating to containers
        for (var _i = 0, _a = context.items; _i < _a.length; _i++) {
            var i = _a[_i];
            i.img = i.img || DEFAULT_TOKEN;
            // Append to gear.
            if (i.type === "item") {
                gear.push(i);
            }
            // Append to features.
            else if (i.type === "feature") {
                features.push(i);
            }
            // Append to spells.
            else if (i.type === "spell") {
                if (i.data.spellLevel != undefined) {
                    spells[i.data.spellLevel].push(i);
                }
            }
            else if (i.type === "armor" || i.type === "weapon") {
                var isActive = getProperty(i.data, "equipped");
                i.toggleClass = isActive ? "active" : "";
                i.toggleTitle = game.i18n.localize(isActive ? "ARd20.Equipped" : "ARd20.Unequipped");
                i.data.equipped = !isActive;
                if (i.type === "armor")
                    armor.push(i);
                else
                    weapons.push(i);
            }
        }
        // Assign and return
        context.gear = gear;
        context.features = features;
        context.spells = spells;
        context.weapons = weapons;
        context.armor = armor;
    };
    /* -------------------------------------------- */
    /** @override */
    ARd20ActorSheet.prototype.activateListeners = function (html) {
        var _this = this;
        _super.prototype.activateListeners.call(this, html);
        $(".select2", html).select2();
        // Render the item sheet for viewing/editing prior to the editable check.
        html.find(".item-toggle").click(this._onToggleItem.bind(this));
        html.find(".item-edit").click(function (ev) {
            var li = $(ev.currentTarget).parents(".item");
            var item = _this.actor.items.get(li.data("itemId"));
            item.sheet.render(true);
        });
        // -------------------------------------------------------------
        // Everything below here is only needed if the sheet is editable
        if (!this.isEditable)
            return;
        // Add Inventory Item
        html.find(".item-create").click(this._onItemCreate.bind(this));
        // Delete Inventory Item
        html.find(".item-delete").click(function (ev) {
            var li = $(ev.currentTarget).parents(".item");
            var item = _this.actor.items.get(li.data("itemId"));
            item["delete"]();
            li.slideUp(200, function () { return _this.render(false); });
        });
        // Active Effect management
        html.find(".effect-control").click(function (ev) { return (0, effects_mjs_1.onManageActiveEffect)(ev, _this.actor); });
        //roll abilities and skills
        html.find(".ability-name").click(this._onRollAbilityTest.bind(this));
        html.find(".skill-name").click(this._onRollSkillCheck.bind(this));
        //open "character advancement" window
        html.find(".config-button").click(this._OnAdvanceMenu.bind(this));
        //item's roll
        html.find(".item-roll").click(this._onItemRoll.bind(this));
        // Drag events for macros.
        if (this.actor.isOwner) {
            var handler_1 = function (ev) { return _this._onDragStart(ev); };
            html.find("li.item").each(function (i, li) {
                if (li.classList.contains("inventory-header"))
                    return;
                li.setAttribute("draggable", true);
                li.addEventListener("dragstart", handler_1, false);
            });
        }
    };
    /**
     * Open @class CharacterAdvancement
     */
    ARd20ActorSheet.prototype._OnAdvanceMenu = function (event) {
        event.preventDefault();
        var button = event.currentTarget;
        var app;
        switch (button.dataset.action) {
            case "adv":
                app = new cha_adv_mjs_1.CharacterAdvancement(this.object);
                break;
        }
        app === null || app === void 0 ? void 0 : app.render(true);
    };
    /**
     * Change @param data.equipped
     * by toggling it on sheet
     */
    ARd20ActorSheet.prototype._onToggleItem = function (event) {
        var _a;
        event.preventDefault();
        var itemid = event.currentTarget.closest(".item").dataset.itemId;
        var item = this.actor.items.get(itemid);
        //const attr = item.data.type === "spell" ? "data.preparation.prepared" : "data.equipped";
        var attr = "data.equipped";
        return item.update((_a = {}, _a[attr] = !getProperty(item.data, attr), _a));
    };
    ARd20ActorSheet.prototype._onRollAbilityTest = function (event) {
        event.preventDefault();
        var ability = event.currentTarget.parentElement.dataset.ability;
        return this.actor.rollAbilityTest(ability, { event: event });
    };
    ARd20ActorSheet.prototype._onRollSkillCheck = function (event) {
        event.preventDefault();
        var skill = event.currentTarget.parentElement.dataset.skill;
        return this.actor.rollSkill(skill, { event: event });
    };
    ARd20ActorSheet.prototype._onItemRoll = function (event) {
        event.preventDefault();
        console.log("БРОСОК");
        var id = event.currentTarget.closest(".item").dataset.itemId;
        var item = this.actor.items.get(id);
        var _a = Array(2).fill(item.data.data.hasAttack, item.data.data.hasDamage), hasAttack = _a[0], hasDamage = _a[1];
        if (item)
            return item.roll({ hasAttack: hasAttack, hasDamage: hasDamage });
    };
    /**
     * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
     * @param {Event} event   The originating click event
     * @private
     */
    ARd20ActorSheet.prototype._onItemCreate = function (event) {
        return __awaiter(this, void 0, void 0, function () {
            var header, type, data, name, itemData;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        event.preventDefault();
                        header = event.currentTarget;
                        type = header.dataset.type;
                        data = duplicate(header.dataset);
                        name = "New ".concat(type.capitalize());
                        itemData = {
                            name: name,
                            type: type,
                            data: data
                        };
                        // Remove the type from the dataset since it's in the itemData.type prop.
                        delete itemData.data["type"];
                        return [4 /*yield*/, Item.create(itemData, { parent: this.actor })];
                    case 1: 
                    // Finally, create the item!
                    return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Handle clickable rolls.
     * @param {Event} event   The originating click event
     * @private
     */
    ARd20ActorSheet.prototype._onRoll = function (event) {
        event.preventDefault();
        var element = event.currentTarget;
        var dataset = element.dataset;
        // Handle item rolls.
        if (dataset.rollType) {
            if (dataset.rollType == "item") {
                var itemid = element.closest(".item").dataset.itemId;
                var item = this.actor.items.get(itemid);
                if (item)
                    return item.roll();
            }
            /*else if (dataset.rollType==='weapon'){
              const itemid = element.closest(".item").dataset.itemId
              const item = this.actor.items.get(itemid)
              if (item) return item.DamageRoll()
            }*/
        }
    };
    /**
     * _onDrop method with
     */
    ARd20ActorSheet.prototype._onDrop = function (event) {
        return __awaiter(this, void 0, void 0, function () {
            var data, actor, allowed;
            return __generator(this, function (_a) {
                if (!game.user.isGM) {
                    ui.notifications.error("you don't have permissions to add documents to this actor manually");
                    return [2 /*return*/];
                }
                try {
                    data = JSON.parse(event.dataTransfer.getData("text/plain"));
                }
                catch (err) {
                    return [2 /*return*/, false];
                }
                actor = this.actor;
                allowed = Hooks.call("dropActorSheetData", actor, this, data);
                if (allowed === false)
                    return [2 /*return*/];
                // Handle different data types
                switch (data.type) {
                    case "ActiveEffect":
                        return [2 /*return*/, this._onDropActiveEffect(event, data)];
                    case "Actor":
                        return [2 /*return*/, this._onDropActor(event, data)];
                    case "Item":
                        return [2 /*return*/, this._onDropItem(event, data)];
                    case "Folder":
                        return [2 /*return*/, this._onDropFolder(event, data)];
                }
                return [2 /*return*/];
            });
        });
    };
    return ARd20ActorSheet;
}(ActorSheet));
exports.ARd20ActorSheet = ARd20ActorSheet;
