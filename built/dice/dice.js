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
exports.damageRoll = exports.d20Roll = exports.simplifyRollFormula = exports.DamageRoll = exports.D20Roll = void 0;
var d20_roll_js_1 = require("./d20-roll.js");
Object.defineProperty(exports, "D20Roll", { enumerable: true, get: function () { return d20_roll_js_1.default; } });
var damage_roll_js_1 = require("./damage-roll.js");
Object.defineProperty(exports, "DamageRoll", { enumerable: true, get: function () { return damage_roll_js_1.default; } });
/**
 * A standardized helper function for simplifying the constant parts of a multipart roll formula
 *
 * @param {string} formula                 The original Roll formula
 * @param {Object} data                    Actor or item data against which to parse the roll
 * @param {Object} options                 Formatting options
 * @param {boolean} options.constantFirst   Puts the constants before the dice terms in the resulting formula
 *
 * @return {string}                        The resulting simplified formula
 */
function simplifyRollFormula(formula, data, _a) {
    var _b = _a === void 0 ? {} : _a, _c = _b.constantFirst, constantFirst = _c === void 0 ? false : _c;
    var roll = new Roll(formula, data); // Parses the formula and replaces any @properties
    var terms = roll.terms;
    // Some terms are "too complicated" for this algorithm to simplify
    // In this case, the original formula is returned.
    if (terms.some(_isUnsupportedTerm))
        return roll.formula;
    var rollableTerms = []; // Terms that are non-constant, and their associated operators
    var constantTerms = []; // Terms that are constant, and their associated operators
    var operators = []; // Temporary storage for operators before they are moved to one of the above
    for (var _i = 0, terms_1 = terms; _i < terms_1.length; _i++) {
        var term = terms_1[_i];
        // For each term
        if (term instanceof OperatorTerm)
            operators.push(term);
        // If the term is an addition/subtraction operator, push the term into the operators array
        else {
            // Otherwise the term is not an operator
            if (term instanceof DiceTerm) {
                // If the term is something rollable
                rollableTerms.push.apply(rollableTerms, operators); // Place all the operators into the rollableTerms array
                rollableTerms.push(term); // Then place this rollable term into it as well
            } //
            else {
                // Otherwise, this must be a constant
                constantTerms.push.apply(constantTerms, operators); // Place the operators into the constantTerms array
                constantTerms.push(term); // Then also add this constant term to that array.
            } //
            operators = []; // Finally, the operators have now all been assigend to one of the arrays, so empty this before the next iteration.
        }
    }
    var constantFormula = Roll.getFormula(constantTerms); // Cleans up the constant terms and produces a new formula string
    var rollableFormula = Roll.getFormula(rollableTerms); // Cleans up the non-constant terms and produces a new formula string
    // Mathematically evaluate the constant formula to produce a single constant term
    var constantPart = undefined;
    if (constantFormula) {
        try {
            constantPart = Roll.safeEval(constantFormula);
        }
        catch (err) {
            console.warn("Unable to evaluate constant term ".concat(constantFormula, " in simplifyRollFormula"));
        }
    }
    // Order the rollable and constant terms, either constant first or second depending on the optional argument
    var parts = constantFirst ? [constantPart, rollableFormula] : [rollableFormula, constantPart];
    // Join the parts with a + sign, pass them to `Roll` once again to clean up the formula
    return new Roll(parts.filterJoin(" + ")).formula;
}
exports.simplifyRollFormula = simplifyRollFormula;
/* -------------------------------------------- */
/**
 * Only some terms are supported by simplifyRollFormula, this method returns true when the term is not supported.
 * @param {*} term - A single Dice term to check support on
 * @return {Boolean} True when unsupported, false if supported
 */
function _isUnsupportedTerm(term) {
    var diceTerm = term instanceof DiceTerm;
    var operator = term instanceof OperatorTerm && ["+", "-"].includes(term.operator);
    var number = term instanceof NumericTerm;
    return !(diceTerm || operator || number);
}
/* -------------------------------------------- */
/* D20 Roll                                     */
/* -------------------------------------------- */
/**
 * A standardized helper function for managing core 5e d20 rolls.
 * Holding SHIFT, ALT, or CTRL when the attack is rolled will "fast-forward".
 * This chooses the default options of a normal attack with no bonus, Advantage, or Disadvantage respectively
 *
 * @param {string[]} parts          The dice roll component parts, excluding the initial d20
 * @param {object} data             Actor or item data against which to parse the roll
 *
 * @param {boolean} [advantage]       Apply advantage to the roll (unless otherwise specified)
 * @param {boolean} [disadvantage]    Apply disadvantage to the roll (unless otherwise specified)
 * @param {number} [critical]         The value of d20 result which represents a critical success
 * @param {number} [fumble]           The value of d20 result which represents a critical failure
 * @param {number} [targetValue]      Assign a target value against which the result of this roll should be compared

 * @param {boolean} [chooseModifier=false] Choose the ability modifier that should be used when the roll is made
 * @param {boolean} [fastForward=false] Allow fast-forward advantage selection
 * @param {Event} [event]             The triggering event which initiated the roll
 * @param {string} [rollMode]         A specific roll mode to apply as the default for the resulting roll
 * @param {string} [template]         The HTML template used to render the roll dialog
 * @param {string} [title]            The dialog window title
 * @param {Object} [dialogOptions]    Modal dialog options
 *
 * @param {boolean} [chatMessage=true] Automatically create a Chat Message for the result of this roll
 * @param {object} [messageData={}] Additional data which is applied to the created Chat Message, if any
 * @param {string} [rollMode]       A specific roll mode to apply as the default for the resulting roll
 * @param {object} [speaker]        The ChatMessage speaker to pass when creating the chat
 * @param {string} [flavor]         Flavor text to use in the posted chat message
 *
 * @return {Promise<D20Roll|null>}  The evaluated D20Roll, or null if the workflow was cancelled
 */
function d20Roll(_a) {
    var _b;
    var _c = _a === void 0 ? {} : _a, _d = _c.parts, parts = _d === void 0 ? [] : _d, _e = _c.data, data = _e === void 0 ? {} : _e, advantage = _c.advantage, disadvantage = _c.disadvantage, _f = _c.fumble, fumble = _f === void 0 ? 1 : _f, _g = _c.critical, critical = _g === void 0 ? 20 : _g, targetValue = _c.targetValue, _h = _c.chooseModifier, chooseModifier = _h === void 0 ? false : _h, _j = _c.fastForward, fastForward = _j === void 0 ? false : _j, event = _c.event, template = _c.template, title = _c.title, dialogOptions = _c.dialogOptions, _k = _c.chatMessage, chatMessage = _k === void 0 ? true : _k, _l = _c.messageData, messageData = _l === void 0 ? {} : _l, rollMode = _c.rollMode, speaker = _c.speaker, options = _c.options, flavor = _c.flavor, canMult = _c.canMult, mRoll = _c.mRoll;
    return __awaiter(this, void 0, void 0, function () {
        var formula, _m, advantageMode, isFF, defaultRollMode, roll, configured;
        return __generator(this, function (_o) {
            switch (_o.label) {
                case 0:
                    formula = ["1d20"].concat(parts).join(" + ");
                    _m = _determineAdvantageMode({ advantage: advantage, disadvantage: disadvantage, fastForward: fastForward, event: event }), advantageMode = _m.advantageMode, isFF = _m.isFF;
                    defaultRollMode = rollMode || game.settings.get("core", "rollMode");
                    if (chooseModifier && !isFF) {
                        data["mod"] = "@mod";
                    }
                    roll = new CONFIG.Dice.D20Roll(formula, data, {
                        flavor: flavor || title,
                        advantageMode: advantageMode,
                        defaultRollMode: defaultRollMode,
                        critical: critical,
                        fumble: fumble,
                        targetValue: targetValue,
                        mRoll: mRoll,
                    });
                    if (!!isFF) return [3 /*break*/, 2];
                    return [4 /*yield*/, roll.configureDialog({
                            title: title,
                            chooseModifier: chooseModifier,
                            defaultRollMode: defaultRollMode,
                            defaultAction: advantageMode,
                            defaultAbility: (_b = data === null || data === void 0 ? void 0 : data.item) === null || _b === void 0 ? void 0 : _b.ability,
                            template: template,
                            canMult: canMult,
                            mRoll: mRoll,
                        }, dialogOptions)];
                case 1:
                    configured = _o.sent();
                    if (configured === null)
                        return [2 /*return*/, null];
                    _o.label = 2;
                case 2: 
                // Evaluate the configured roll
                return [4 /*yield*/, roll.evaluate({ async: true })];
                case 3:
                    // Evaluate the configured roll
                    _o.sent();
                    // Create a Chat Message
                    if (speaker) {
                        console.warn("You are passing the speaker argument to the d20Roll function directly which should instead be passed as an internal key of messageData");
                        messageData.speaker = speaker;
                    }
                    if (!(roll && chatMessage)) return [3 /*break*/, 5];
                    return [4 /*yield*/, roll.toMessage(messageData, options)];
                case 4:
                    _o.sent();
                    _o.label = 5;
                case 5: return [2 /*return*/, roll];
            }
        });
    });
}
exports.d20Roll = d20Roll;
/* -------------------------------------------- */
/**
 * Determines whether this d20 roll should be fast-forwarded, and whether advantage or disadvantage should be applied
 * @returns {{isFF: boolean, advantageMode: number}}  Whether the roll is fast-forward, and its advantage mode
 */
function _determineAdvantageMode(_a) {
    var _b = _a === void 0 ? {} : _a, event = _b.event, _c = _b.advantage, advantage = _c === void 0 ? false : _c, _d = _b.disadvantage, disadvantage = _d === void 0 ? false : _d, _e = _b.fastForward, fastForward = _e === void 0 ? false : _e;
    var isFF = fastForward || (event && (event.shiftKey || event.altKey || event.ctrlKey || event.metaKey));
    var advantageMode = CONFIG.Dice.D20Roll.ADV_MODE.NORMAL;
    if (advantage || (event === null || event === void 0 ? void 0 : event.altKey))
        advantageMode = CONFIG.Dice.D20Roll.ADV_MODE.ADVANTAGE;
    else if (disadvantage || (event === null || event === void 0 ? void 0 : event.ctrlKey) || (event === null || event === void 0 ? void 0 : event.metaKey))
        advantageMode = CONFIG.Dice.D20Roll.ADV_MODE.DISADVANTAGE;
    return { isFF: isFF, advantageMode: advantageMode };
}
/* -------------------------------------------- */
/* Damage Roll                                  */
/* -------------------------------------------- */
/**
 * A standardized helper function for managing core 5e damage rolls.
 * Holding SHIFT, ALT, or CTRL when the attack is rolled will "fast-forward".
 * This chooses the default options of a normal attack with no bonus, Critical, or no bonus respectively
 *
 * @param {string[]} parts          The dice roll component parts, excluding the initial d20
 * @param {object} [data]           Actor or item data against which to parse the roll
 *
 * @param {boolean} [critical=false] Flag this roll as a critical hit for the purposes of fast-forward or default dialog action
 * @param {number} [criticalBonusDice=0] A number of bonus damage dice that are added for critical hits
 * @param {number} [criticalMultiplier=2] A critical hit multiplier which is applied to critical hits
 * @param {boolean} [multiplyNumeric=false] Multiply numeric terms by the critical multiplier
 * @param {boolean} [powerfulCritical=false] Apply the "powerful criticals" house rule to critical hits

 * @param {boolean} [fastForward=false] Allow fast-forward advantage selection
 * @param {Event}[event]            The triggering event which initiated the roll
 * @param {boolean} [allowCritical=true] Allow the opportunity for a critical hit to be rolled
 * @param {string} [template]       The HTML template used to render the roll dialog
 * @param {string} [title]          The dice roll UI window title
 * @param {object} [dialogOptions]  Configuration dialog options
 *
 * @param {boolean} [chatMessage=true] Automatically create a Chat Message for the result of this roll
 * @param {object} [messageData={}] Additional data which is applied to the created Chat Message, if any
 * @param {string} [rollMode]       A specific roll mode to apply as the default for the resulting roll
 * @param {object} [speaker]        The ChatMessage speaker to pass when creating the chat
 * @param {string} [flavor]         Flavor text to use in the posted chat message
 *
 * @return {Promise<DamageRoll|null>} The evaluated DamageRoll, or null if the workflow was canceled
 */
function damageRoll(_a) {
    var _b = _a === void 0 ? {} : _a, _c = _b.parts, parts = _c === void 0 ? [] : _c, data = _b.data, // Roll creation
    _d = _b.critical, // Roll creation
    critical = _d === void 0 ? false : _d, damType = _b.damType, damageType = _b.damageType, criticalBonusDice = _b.criticalBonusDice, criticalMultiplier = _b.criticalMultiplier, multiplyNumeric = _b.multiplyNumeric, // Damage customization
    _e = _b.fastForward, // Damage customization
    fastForward = _e === void 0 ? false : _e, event = _b.event, _f = _b.allowCritical, allowCritical = _f === void 0 ? true : _f, template = _b.template, title = _b.title, dialogOptions = _b.dialogOptions, // Dialog configuration
    _g = _b.chatMessage, // Dialog configuration
    chatMessage = _g === void 0 ? false : _g, _h = _b.messageData, messageData = _h === void 0 ? {} : _h, rollMode = _b.rollMode, speaker = _b.speaker, canMult = _b.canMult, flavor = _b.flavor, mRoll = _b.mRoll;
    return __awaiter(this, void 0, void 0, function () {
        var defaultRollMode, formula, _j, isCritical, isFF, roll, configured;
        return __generator(this, function (_k) {
            switch (_k.label) {
                case 0:
                    console.log(canMult);
                    defaultRollMode = rollMode || game.settings.get("core", "rollMode");
                    formula = parts.join(" + ");
                    _j = _determineCriticalMode({ critical: critical, fastForward: fastForward, event: event }), isCritical = _j.isCritical, isFF = _j.isFF;
                    roll = new CONFIG.Dice.DamageRoll(formula, data, {
                        flavor: flavor || title,
                        critical: isCritical,
                        criticalBonusDice: criticalBonusDice,
                        criticalMultiplier: criticalMultiplier,
                        multiplyNumeric: multiplyNumeric,
                        damType: damType,
                        mRoll: mRoll,
                        damageType: damageType
                    });
                    if (!!isFF) return [3 /*break*/, 2];
                    return [4 /*yield*/, roll.configureDialog({
                            title: title,
                            defaultRollMode: defaultRollMode,
                            defaultCritical: isCritical,
                            template: template,
                            allowCritical: allowCritical,
                            mRoll: mRoll,
                            canMult: canMult,
                            damType: damType
                        }, dialogOptions)];
                case 1:
                    configured = _k.sent();
                    if (configured === null)
                        return [2 /*return*/, null];
                    _k.label = 2;
                case 2: 
                // Evaluate the configured roll
                return [4 /*yield*/, roll.evaluate({ async: true })];
                case 3:
                    // Evaluate the configured roll
                    _k.sent();
                    // Create a Chat Message
                    if (speaker) {
                        console.warn("You are passing the speaker argument to the damageRoll function directly which should instead be passed as an internal key of messageData");
                        messageData.speaker = speaker;
                    }
                    if (!(roll && chatMessage)) return [3 /*break*/, 5];
                    return [4 /*yield*/, roll.toMessage(messageData)];
                case 4:
                    _k.sent();
                    _k.label = 5;
                case 5: return [2 /*return*/, roll];
            }
        });
    });
}
exports.damageRoll = damageRoll;
/* -------------------------------------------- */
/**
 * Determines whether this d20 roll should be fast-forwarded, and whether advantage or disadvantage should be applied
 * @returns {{isFF: boolean, isCritical: boolean}}  Whether the roll is fast-forward, and whether it is a critical hit
 */
function _determineCriticalMode(_a) {
    var _b = _a === void 0 ? {} : _a, event = _b.event, _c = _b.critical, critical = _c === void 0 ? false : _c, _d = _b.fastForward, fastForward = _d === void 0 ? false : _d;
    var isFF = fastForward || (event && (event.shiftKey || event.altKey || event.ctrlKey || event.metaKey));
    if (event === null || event === void 0 ? void 0 : event.altKey)
        critical = true;
    return { isFF: isFF, isCritical: critical };
}
