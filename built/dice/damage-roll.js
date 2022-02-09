"use strict";
/**
 * A type of Roll specific to a damage (or healing) roll in the 5e system.
 * @param {string} formula                       The string formula to parse
 * @param {object} data                          The data object against which to parse attributes within the formula
 * @param {object} [options={}]                  Extra optional arguments which describe or modify the DamageRoll
 * @param {number} [options.criticalBonusDice=0]      A number of bonus damage dice that are added for critical hits
 * @param {number} [options.criticalMultiplier=2]     A critical hit multiplier which is applied to critical hits
 * @param {boolean} [options.multiplyNumeric=false]   Multiply numeric terms by the critical multiplier
 * @param {boolean} [options.powerfulCritical=false]  Apply the "powerful criticals" house rule to critical hits
 *
 */
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
//@ts-expect-error
var DamageRoll = /** @class */ (function (_super) {
    __extends(DamageRoll, _super);
    //@ts-expect-error
    function DamageRoll(formula, data, options) {
        var _this = _super.call(this, formula, data, options) || this;
        // For backwards compatibility, skip rolls which do not have the "critical" option defined
        //@ts-expect-error
        if (_this.options.critical !== undefined)
            _this.configureDamage();
        return _this;
    }
    Object.defineProperty(DamageRoll.prototype, "isCritical", {
        /* -------------------------------------------- */
        /**
         * A convenience reference for whether this DamageRoll is a critical hit
         * @type {boolean}
         */
        get: function () {
            //@ts-expect-error
            return this.options.critical;
        },
        enumerable: false,
        configurable: true
    });
    /* -------------------------------------------- */
    /*  Damage Roll Methods                         */
    /* -------------------------------------------- */
    /**
     * Apply optional modifiers which customize the behavior of the d20term
     * @private
     */
    DamageRoll.prototype.configureDamage = function () {
        var _a, _b, _c;
        var critBonus = 0;
        //@ts-expect-error
        for (var _i = 0, _d = this.terms.entries(); _i < _d.length; _i++) {
            var _e = _d[_i], i = _e[0], term = _e[1];
            if (!(term instanceof OperatorTerm)) {
                //@ts-expect-error
                term.options.damageType = i !== 0 && this.terms[i - 1] instanceof OperatorTerm ? this.options.damageType[i - 1] : this.options.damageType[i];
            }
            // Multiply dice terms
            if (term instanceof DiceTerm) {
                //@ts-expect-error
                term.options.baseNumber = (_a = term.options.baseNumber) !== null && _a !== void 0 ? _a : term.number; // Reset back
                //@ts-expect-error
                term.number = term.options.baseNumber;
                if (this.isCritical) {
                    critBonus += term.number * term.faces;
                    var _f = [new OperatorTerm({ operator: "+" }), new NumericTerm({ number: critBonus, options: { flavor: "Crit" } })], oper = _f[0], num = _f[1];
                    this.terms.splice(1, 0, oper);
                    this.terms.splice(2, 0, num);
                    //@ts-expect-error
                    var cb = this.options.criticalBonusDice && i === 0 ? this.options.criticalBonusDice : 0;
                    term.alter(1, cb);
                    //@ts-expect-error
                    term.options.critical = true;
                }
            }
            // Multiply numeric terms
            //@ts-expect-error
            else if (this.options.multiplyNumeric && term instanceof NumericTerm) {
                //@ts-expect-error
                term.options.baseNumber = (_b = term.options.baseNumber) !== null && _b !== void 0 ? _b : term.number; // Reset back
                //@ts-expect-error
                term.number = term.options.baseNumber;
                if (this.isCritical) {
                    //@ts-expect-error
                    term.number *= (_c = this.options.criticalMultiplier) !== null && _c !== void 0 ? _c : 2;
                    //@ts-expect-error
                    term.options.critical = true;
                }
            }
        }
        //@ts-expect-error
        this._formula = this.constructor.getFormula(this.terms);
    };
    /* -------------------------------------------- */
    /** @inheritdoc */
    DamageRoll.prototype.toMessage = function (messageData, options) {
        var _a;
        if (messageData === void 0) { messageData = {}; }
        if (options === void 0) { options = {}; }
        //@ts-expect-error
        messageData.flavor = messageData.flavor || this.options.flavor;
        if (this.isCritical) {
            var label = game.i18n.localize("ARd20.CriticalHit");
            //@ts-expect-error
            messageData.flavor = messageData.flavor ? "".concat(messageData.flavor, " (").concat(label, ")") : label;
        }
        //@ts-expect-error
        options.rollMode = (_a = options.rollMode) !== null && _a !== void 0 ? _a : this.options.rollMode;
        return _super.prototype.toMessage.call(this, messageData, options);
    };
    /* -------------------------------------------- */
    /*  Configuration Dialog                        */
    /* -------------------------------------------- */
    /**
     * Create a Dialog prompt used to configure evaluation of an existing D20Roll instance.
     * @param {object} data                     Dialog configuration data
     * @param {string} [data.title]               The title of the shown dialog window
     * @param {number} [data.defaultRollMode]     The roll mode that the roll mode select element should default to
     * @param {string} [data.defaultCritical]     Should critical be selected as default
     * @param {string} [data.template]            A custom path to an HTML template to use instead of the default
     * @param {boolean} [data.allowCritical=true] Allow critical hit to be chosen as a possible damage mode
     * @param {object} options                  Additional Dialog customization options
     * @returns {Promise<D20Roll|null>}         A resulting D20Roll object constructed with the dialog, or null if the dialog was closed
     */
    //@ts-expect-error
    DamageRoll.prototype.configureDialog = function (_a, options) {
        var _b = _a === void 0 ? {} : _a, title = _b.title, defaultRollMode = _b.defaultRollMode, canMult = _b.canMult, damType = _b.damType, mRoll = _b.mRoll, _c = _b.defaultCritical, defaultCritical = _c === void 0 ? false : _c, template = _b.template, _d = _b.allowCritical, allowCritical = _d === void 0 ? true : _d;
        if (options === void 0) { options = {}; }
        return __awaiter(this, void 0, void 0, function () {
            var content;
            var _this = this;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0: return [4 /*yield*/, renderTemplate(template !== null && template !== void 0 ? template : this.constructor.EVALUATION_TEMPLATE, {
                            formula: "".concat(this.formula, " + @bonus"),
                            defaultRollMode: defaultRollMode,
                            rollModes: CONFIG.Dice.rollModes,
                            canMult: canMult,
                            damType: damType,
                            mRoll: mRoll
                        })];
                    case 1:
                        content = _e.sent();
                        // Create the Dialog window and await submission of the form
                        return [2 /*return*/, new Promise(function (resolve) {
                                new Dialog({
                                    title: title,
                                    content: content,
                                    buttons: {
                                        critical: {
                                            //@ts-expect-error
                                            condition: allowCritical,
                                            label: game.i18n.localize("ARd20.CriticalHit"),
                                            callback: function (html) { return resolve(_this._onDialogSubmit(html, true)); },
                                        },
                                        normal: {
                                            label: game.i18n.localize(allowCritical ? "ARd20.Normal" : "ARd20.Roll"),
                                            callback: function (html) { return resolve(_this._onDialogSubmit(html, false)); },
                                        },
                                    },
                                    default: defaultCritical ? "critical" : "normal",
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
     * @param {boolean} isCritical      Is the damage a critical hit?
     * @private
     */
    //@ts-expect-error
    DamageRoll.prototype._onDialogSubmit = function (html, isCritical) {
        var _this = this;
        var _a;
        var form = html[0].querySelector("form");
        // Append a situational bonus term
        if (form.bonus.value) {
            var bonus = new Roll(form.bonus.value, this.data);
            if (!(bonus.terms[0] instanceof OperatorTerm))
                this.terms.push(new OperatorTerm({ operator: "+" }));
            this.terms = this.terms.concat(bonus.terms);
        }
        // Apply advantage or disadvantage
        //@ts-expect-error
        this.options.critical = isCritical;
        //@ts-expect-error
        this.options.rollMode = form.rollMode.value;
        //@ts-expect-error
        this.options.damageType.forEach(function (part, ind) { return (_this.options.damageType[ind] = form["damageType.".concat(ind)] ? part[form["damageType.".concat(ind)].value] : part[0]); });
        //@ts-expect-error
        this.options.mRoll = (_a = form.mRoll) === null || _a === void 0 ? void 0 : _a.checked;
        this.configureDamage();
        return this;
    };
    /* -------------------------------------------- */
    /** @inheritdoc */
    //@ts-expect-error
    DamageRoll.fromData = function (data) {
        var roll = _super.fromData.call(this, data);
        //@ts-expect-error
        roll._formula = this.getFormula(roll.terms);
        return roll;
    };
    /**
     * The HTML template path used to configure evaluation of this Roll
     * @type {string}
     */
    DamageRoll.EVALUATION_TEMPLATE = "systems/ard20/templates/chat/roll-dialog.html";
    return DamageRoll;
}(Roll));
exports.default = DamageRoll;
