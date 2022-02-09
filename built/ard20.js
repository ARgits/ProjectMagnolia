"use strict";
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
exports.rollItemMacro = exports.array_keys = exports.obj_keys = exports.getValues = exports.obj_entries = void 0;
// Import document classes.
var actor_js_1 = require("./documents/actor.js");
var item_js_1 = require("./documents/item.js");
// Import sheet classes.
var actor_sheet_js_1 = require("./sheets/actor-sheet.js");
var item_sheet_js_1 = require("./sheets/item-sheet.js");
// Import helper/utility classes and constants.
var templates_js_1 = require("./helpers/templates.js");
var config_js_1 = require("./helpers/config.js");
var socket_js_1 = require("./helpers/socket.js");
var settings_js_1 = require("./helpers/settings.js");
var dice = require("./dice/dice.js");
var chat = require("./helpers/chat.js");
/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */
function obj_entries(obj) {
    return Object.entries(obj);
}
exports.obj_entries = obj_entries;
function getValues(SourceObject, key) {
    return SourceObject[key];
}
exports.getValues = getValues;
function obj_keys(obj) {
    return Object.keys(obj);
}
exports.obj_keys = obj_keys;
function array_keys(obj) {
    return Object.keys(obj);
}
exports.array_keys = array_keys;
Hooks.once("init", function () {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            // Add utility classes to the global game object so that they're more easily
            // accessible in global contexts.
            if (game instanceof Game) {
                game.ard20 = {
                    documents: {
                        ARd20Actor: actor_js_1.ARd20Actor,
                        ARd20Item: item_js_1.ARd20Item,
                    },
                    rollItemMacro: rollItemMacro,
                    config: config_js_1.ARd20,
                    dice: dice,
                };
                // Add custom constants for configuration.
                CONFIG.ARd20 = config_js_1.ARd20;
                //@ts-expect-error
                CONFIG.Dice.DamageRoll = dice.DamageRoll;
                //@ts-expect-error
                CONFIG.Dice.D20Roll = dice.D20Roll;
                CONFIG.Dice.rolls.push(dice.D20Roll);
                CONFIG.Dice.rolls.push(dice.DamageRoll);
                if (game.socket instanceof io.Socket) {
                    game.socket.on("system.ard20", function (data) {
                        if (data.operation === "updateActorData")
                            socket_js_1.default.updateActorData(data);
                    });
                }
                /**
                 * Set an initiative formula for the system
                 * @type {String}
                 */
                CONFIG.Combat.initiative = {
                    formula: "1d20 + @abilities.dex.mod",
                    decimals: 2,
                };
                // Define custom Document classes
                CONFIG.Actor.documentClass = actor_js_1.ARd20Actor;
                CONFIG.Item.documentClass = item_js_1.ARd20Item;
                // Register sheet application classes
                Actors.unregisterSheet("core", ActorSheet);
                Actors.registerSheet("ard20", actor_sheet_js_1.ARd20ActorSheet, { makeDefault: true });
                Items.unregisterSheet("core", ItemSheet);
                //@ts-expect-error
                Items.registerSheet("ard20", item_sheet_js_1.ARd20ItemSheet, { makeDefault: true });
                (0, settings_js_1.registerSystemSettings)();
                // Preload Handlebars templates.
                return [2 /*return*/, (0, templates_js_1.preloadHandlebarsTemplates)()];
            }
            else {
                throw new Error("game not initialized yet!");
            }
            return [2 /*return*/];
        });
    });
});
/* -------------------------------------------- */
/*  Handlebars Helpers                          */
/* -------------------------------------------- */
// If you need to add Handlebars helpers, here are a few useful examples:
Handlebars.registerHelper("concat", function () {
    var outStr = "";
    for (var arg in arguments) {
        if (typeof arguments[arg] != "object") {
            outStr += arguments[arg];
        }
    }
    return outStr;
});
Handlebars.registerHelper("toLowerCase", function (str) {
    return str.toLowerCase();
});
Handlebars.registerHelper("add", function (value1, value2) {
    return Number(value1) + Number(value2);
});
/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */
Hooks.once("ready", function () {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
            Hooks.on("hotbarDrop", function (bar, data, slot) { return createItemMacro(data, slot); });
            return [2 /*return*/];
        });
    });
});
/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */
/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
function createItemMacro(data, slot) {
    var _a;
    return __awaiter(this, void 0, void 0, function () {
        var item_1, command_1, macroList, macroCheck, macro;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!(game instanceof Game)) return [3 /*break*/, 3];
                    //@ts-expect-error
                    if (data.type !== "Item")
                        return [2 /*return*/];
                    if (!("data" in data) && ui.notifications instanceof Notifications)
                        return [2 /*return*/, ui.notifications.warn("You can only create macro buttons for owned Items")];
                    item_1 = data.data;
                    command_1 = "game.ard20.rollItemMacro(\"".concat(item_1.name, "\");");
                    macroList = game.macros.contents.filter(function (m) { return m.name === item_1.name && (m === null || m === void 0 ? void 0 : m.command) === command_1; });
                    macroCheck = macroList.length !== 0 ? macroList[0] : null;
                    if (!(macroCheck !== null)) return [3 /*break*/, 2];
                    return [4 /*yield*/, Macro.create({
                            name: item_1.name,
                            type: "script",
                            img: item_1.img,
                            command: command_1,
                            flags: { "ard20.itemMacro": true },
                        })];
                case 1:
                    macro = _b.sent();
                    if (macro instanceof Macro) {
                        (_a = game.user) === null || _a === void 0 ? void 0 : _a.assignHotbarMacro(macro, slot);
                    }
                    _b.label = 2;
                case 2: return [2 /*return*/, false];
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemName
 * @return {Promise}
 */
function rollItemMacro(itemName) {
    if (game instanceof Game) {
        var speaker = ChatMessage.getSpeaker();
        var actor = void 0;
        if (speaker.token)
            actor = game.actors.tokens[speaker.token];
        if (!actor && typeof speaker.actor === "string")
            actor = game.actors.get(speaker.actor);
        var item = actor ? actor.items.find(function (i) { return i.name === itemName; }) : null;
        if (!item)
            return ui.notifications.warn("Your controlled Actor does not have an item named ".concat(itemName));
        // Trigger the item roll
        //@ts-expect-error
        return item.roll();
    }
}
exports.rollItemMacro = rollItemMacro;
Hooks.on("renderChatMessage", function (app, html, data) {
    // Display action buttons
    chat.displayChatActionButtons(app, html, data);
    // Highlight critical success or failure die
    chat.highlightCriticalSuccessFailure(app, html, data);
    // Optionally collapse the content
});
Hooks.on("getChatLogEntryContext", chat.addChatMessageContextOptions);
//@ts-expect-error
Hooks.on("renderChatLog", function (app, html, data) { return item_js_1.ARd20Item.chatListeners(html); });
//@ts-expect-error
Hooks.on("renderChatPopout", function (app, html, data) { return item_js_1.ARd20Item.chatListeners(html); });
