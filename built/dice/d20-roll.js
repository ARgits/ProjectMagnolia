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
/**
 * A type of Roll specific to a d20-based check, save, or attack roll in the 5e system.
 * @param {string} formula                       The string formula to parse
 * @param {object} data                          The data object against which to parse attributes within the formula
 * @param {object} [options={}]                  Extra optional arguments which describe or modify the D20Roll
 * @param {number} [options.advantageMode]             What advantage modifier to apply to the roll (none, advantage, disadvantage)
 * @param {number} [options.critical]                  The value of d20 result which represents a critical success
 * @param {number} [options.fumble]                    The value of d20 result which represents a critical failure
 * @param {(number)} [options.targetValue]             Assign a target value against which the result of this roll should be compared
 * @param {boolean} [options.elvenAccuracy=false]      Allow Elven Accuracy to modify this roll?
 * @param {boolean} [options.halflingLucky=false]      Allow Halfling Luck to modify this roll?
 * @param {boolean} [options.reliableTalent=false]     Allow Reliable Talent to modify this roll?
 */
var D20Roll = /** @class */ (function (_super) {
    __extends(D20Roll, _super);
    function D20Roll(formula, data, options) {
        var _this = _super.call(this, formula, data, options) || this;
        if (!(_this.terms[0] instanceof Die && _this.terms[0].faces === 20)) {
            throw new Error("Invalid D20Roll formula provided ".concat(_this._formula));
        }
        _this.configureModifiers();
        return _this;
    }
    Object.defineProperty(D20Roll.prototype, "hasAdvantage", {
        /* -------------------------------------------- */
        /**
         * A convenience reference for whether this D20Roll has advantage
         * @type {boolean}
         */
        get: function () {
            return this.options.advantageMode === D20Roll.ADV_MODE.ADVANTAGE;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(D20Roll.prototype, "hasDisadvantage", {
        /**
         * A convenience reference for whether this D20Roll has disadvantage
         * @type {boolean}
         */
        get: function () {
            return this.options.advantageMode === D20Roll.ADV_MODE.DISADVANTAGE;
        },
        enumerable: false,
        configurable: true
    });
    /* -------------------------------------------- */
    /*  D20 Roll Methods                            */
    /* -------------------------------------------- */
    /**
     * Apply optional modifiers which customize the behavior of the d20term
     * @private
     */
    D20Roll.prototype.configureModifiers = function () {
        var d20 = this.terms[0];
        d20.modifiers = [];
        // Handle Advantage or Disadvantage
        if (this.hasAdvantage) {
            d20.number = 2;
            d20.modifiers.push("kh");
            d20.options.advantage = true;
        }
        else if (this.hasDisadvantage) {
            d20.number = 2;
            d20.modifiers.push("kl");
            d20.options.disadvantage = true;
        }
        else
            d20.number = 1;
        // Assign critical and fumble thresholds
        if (this.options.critical)
            d20.options.critical = this.options.critical;
        if (this.options.fumble)
            d20.options.fumble = this.options.fumble;
        if (this.options.targetValue)
            d20.options.target = this.options.targetValue;
        // Re-compile the underlying formula
        this._formula = this.constructor.getFormula(this.terms);
    };
    /* -------------------------------------------- */
    /** @inheritdoc */
    D20Roll.prototype.toMessage = function (messageData, options) {
        var _a;
        if (messageData === void 0) { messageData = {}; }
        if (options === void 0) { options = {}; }
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!!this._evaluated) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.evaluate({ async: true })];
                    case 1:
                        _b.sent();
                        _b.label = 2;
                    case 2:
                        // Add appropriate advantage mode message flavor and ard20 roll flags
                        messageData.flavor = messageData.flavor || this.options.flavor;
                        if (this.hasAdvantage)
                            messageData.flavor += " (".concat(game.i18n.localize("ARd20.Advantage"), ")");
                        else if (this.hasDisadvantage)
                            messageData.flavor += " (".concat(game.i18n.localize("ARd20.Disadvantage"), ")");
                        // Record the preferred rollMode
                        options.rollMode = (_a = options.rollMode) !== null && _a !== void 0 ? _a : this.options.rollMode;
                        return [2 /*return*/, _super.prototype.toMessage.call(this, messageData, options)];
                }
            });
        });
    };
    /* -------------------------------------------- */
    /*  Configuration Dialog                        */
    /* -------------------------------------------- */
    /**
     * Create a Dialog prompt used to configure evaluation of an existing D20Roll instance.
     * @param {object} data                     Dialog configuration data
     * @param {string} [data.title]               The title of the shown dialog window
     * @param {number} [data.defaultRollMode]     The roll mode that the roll mode select element should default to
     * @param {number} [data.defaultAction]       The button marked as default
     * @param {boolean} [data.chooseModifier]     Choose which ability modifier should be applied to the roll?
     * @param {string} [data.defaultAbility]      For tool rolls, the default ability modifier applied to the roll
     * @param {string} [data.template]            A custom path to an HTML template to use instead of the default
     * @param {object} options                  Additional Dialog customization options
     * @returns {Promise<D20Roll|null>}         A resulting D20Roll object constructed with the dialog, or null if the dialog was closed
     */
    D20Roll.prototype.configureDialog = function (_a, options) {
        var _b = _a === void 0 ? {} : _a, title = _b.title, defaultRollMode = _b.defaultRollMode, canMult = _b.canMult, _c = _b.defaultAction, defaultAction = _c === void 0 ? D20Roll.ADV_MODE.NORMAL : _c, mRoll = _b.mRoll, _d = _b.chooseModifier, chooseModifier = _d === void 0 ? false : _d, defaultAbility = _b.defaultAbility, template = _b.template;
        if (options === void 0) { options = {}; }
        return __awaiter(this, void 0, void 0, function () {
            var content, defaultButton;
            var _this = this;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0: return [4 /*yield*/, renderTemplate(template !== null && template !== void 0 ? template : this.constructor.EVALUATION_TEMPLATE, {
                            formula: "".concat(this.formula, " + @bonus"),
                            defaultRollMode: defaultRollMode,
                            rollModes: CONFIG.Dice.rollModes,
                            chooseModifier: chooseModifier,
                            defaultAbility: defaultAbility,
                            abilities: CONFIG.ARd20.abilities,
                            canMult: canMult,
                            mRoll: mRoll,
                        })];
                    case 1:
                        content = _e.sent();
                        defaultButton = "normal";
                        switch (defaultAction) {
                            case D20Roll.ADV_MODE.ADVANTAGE:
                                defaultButton = "advantage";
                                break;
                            case D20Roll.ADV_MODE.DISADVANTAGE:
                                defaultButton = "disadvantage";
                                break;
                        }
                        // Create the Dialog window and await submission of the form
                        return [2 /*return*/, new Promise(function (resolve) {
                                new Dialog({
                                    title: title,
                                    content: content,
                                    buttons: {
                                        advantage: {
                                            label: game.i18n.localize("ARd20.Advantage"),
                                            callback: function (html) { return resolve(_this._onDialogSubmit(html, D20Roll.ADV_MODE.ADVANTAGE)); },
                                        },
                                        normal: {
                                            label: game.i18n.localize("ARd20.Normal"),
                                            callback: function (html) { return resolve(_this._onDialogSubmit(html, D20Roll.ADV_MODE.NORMAL)); },
                                        },
                                        disadvantage: {
                                            label: game.i18n.localize("ARd20.Disadvantage"),
                                            callback: function (html) { return resolve(_this._onDialogSubmit(html, D20Roll.ADV_MODE.DISADVANTAGE)); },
                                        },
                                    },
                                    default: defaultButton,
                                    close: function () { return resolve(null); },
                                }, options).render(true);
                            })];
                }
            });
        });
    };
    /* -------------------------------------------- */
    /**
     * Handle submission of the Roll evaluation configuration Dialog
     * @param {jQuery} html             The submitted dialog content
     * @param {number} advantageMode    The chosen advantage mode
     * @private
     */
    D20Roll.prototype._onDialogSubmit = function (html, advantageMode) {
        var _a, _b;
        var form = html[0].querySelector("form");
        console.log(this);
        console.log(form, "ФОРМА");
        if (form.bonus.value) {
            var bonus = new Roll(form.bonus.value, this.data);
            if (!(bonus.terms[0] instanceof OperatorTerm))
                this.terms.push(new OperatorTerm({ operator: "+" }));
            this.terms = this.terms.concat(bonus.terms);
        }
        // Customize the modifier
        if ((_a = form.ability) === null || _a === void 0 ? void 0 : _a.value) {
            var abl = this.data.abilities[form.ability.value];
            console.log(abl);
            this.terms.findSplice(function (t) { return t.term === "@mod"; }, new NumericTerm({ number: abl.mod }));
            this.options.flavor += " (".concat(game.i18n.localize(CONFIG.ARd20.abilities[form.ability.value]), ")");
        }
        /* if (form.prof_type?.value) {
           const pr = this.data[form.prof_type.value][form.prof_value.value];
           console.log(pr);
           this.terms.findSplice((t) => t.term === "@prof_die", new Die({ number: 1, faces: pr.prof_die }));
           this.terms.findSplice((t) => t.term === "@prof_bonus", new NumericTerm({ number: pr.prof_bonus }));
         }*/
        // Apply advantage or disadvantage
        this.options.advantageMode = advantageMode;
        this.options.rollMode = form.rollMode.value;
        this.options.mRoll = (_b = form.mRoll) === null || _b === void 0 ? void 0 : _b.checked;
        this.configureModifiers();
        return this;
    };
    /* -------------------------------------------- */
    /**
     * Advantage mode of a 5e d20 roll
     * @enum {number}
     */
    D20Roll.ADV_MODE = {
        NORMAL: 0,
        ADVANTAGE: 1,
        DISADVANTAGE: -1,
    };
    /**
     * The HTML template path used to configure evaluation of this Roll
     * @type {string}
     */
    D20Roll.EVALUATION_TEMPLATE = "systems/ard20/templates/chat/roll-dialog.html";
    return D20Roll;
}(Roll));
exports.default = D20Roll;
