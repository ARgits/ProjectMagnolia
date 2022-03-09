function ownKeys(object, enumerableOnly) {
  var keys = Object.keys(object);

  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);
    enumerableOnly && (symbols = symbols.filter(function (sym) {
      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
    })), keys.push.apply(keys, symbols);
  }

  return keys;
}

function _objectSpread2(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = null != arguments[i] ? arguments[i] : {};
    i % 2 ? ownKeys(Object(source), !0).forEach(function (key) {
      _defineProperty(target, key, source[key]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) {
      Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
    });
  }

  return target;
}

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

function _getPrototypeOf(o) {
  _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
    return o.__proto__ || Object.getPrototypeOf(o);
  };
  return _getPrototypeOf(o);
}

function _objectWithoutPropertiesLoose(source, excluded) {
  if (source == null) return {};
  var target = {};
  var sourceKeys = Object.keys(source);
  var key, i;

  for (i = 0; i < sourceKeys.length; i++) {
    key = sourceKeys[i];
    if (excluded.indexOf(key) >= 0) continue;
    target[key] = source[key];
  }

  return target;
}

function _objectWithoutProperties(source, excluded) {
  if (source == null) return {};

  var target = _objectWithoutPropertiesLoose(source, excluded);

  var key, i;

  if (Object.getOwnPropertySymbols) {
    var sourceSymbolKeys = Object.getOwnPropertySymbols(source);

    for (i = 0; i < sourceSymbolKeys.length; i++) {
      key = sourceSymbolKeys[i];
      if (excluded.indexOf(key) >= 0) continue;
      if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;
      target[key] = source[key];
    }
  }

  return target;
}

function _superPropBase(object, property) {
  while (!Object.prototype.hasOwnProperty.call(object, property)) {
    object = _getPrototypeOf(object);
    if (object === null) break;
  }

  return object;
}

function _get() {
  if (typeof Reflect !== "undefined" && Reflect.get) {
    _get = Reflect.get;
  } else {
    _get = function _get(target, property, receiver) {
      var base = _superPropBase(target, property);

      if (!base) return;
      var desc = Object.getOwnPropertyDescriptor(base, property);

      if (desc.get) {
        return desc.get.call(arguments.length < 3 ? target : receiver);
      }

      return desc.value;
    };
  }

  return _get.apply(this, arguments);
}

function _classPrivateFieldGet(receiver, privateMap) {
  var descriptor = _classExtractFieldDescriptor(receiver, privateMap, "get");

  return _classApplyDescriptorGet(receiver, descriptor);
}

function _classPrivateFieldSet(receiver, privateMap, value) {
  var descriptor = _classExtractFieldDescriptor(receiver, privateMap, "set");

  _classApplyDescriptorSet(receiver, descriptor, value);

  return value;
}

function _classPrivateFieldDestructureSet(receiver, privateMap) {
  var descriptor = _classExtractFieldDescriptor(receiver, privateMap, "set");

  return _classApplyDescriptorDestructureSet(receiver, descriptor);
}

function _classExtractFieldDescriptor(receiver, privateMap, action) {
  if (!privateMap.has(receiver)) {
    throw new TypeError("attempted to " + action + " private field on non-instance");
  }

  return privateMap.get(receiver);
}

function _classApplyDescriptorGet(receiver, descriptor) {
  if (descriptor.get) {
    return descriptor.get.call(receiver);
  }

  return descriptor.value;
}

function _classApplyDescriptorSet(receiver, descriptor, value) {
  if (descriptor.set) {
    descriptor.set.call(receiver, value);
  } else {
    if (!descriptor.writable) {
      throw new TypeError("attempted to set read only private field");
    }

    descriptor.value = value;
  }
}

function _classApplyDescriptorDestructureSet(receiver, descriptor) {
  if (descriptor.set) {
    if (!("__destrObj" in descriptor)) {
      descriptor.__destrObj = {
        set value(v) {
          descriptor.set.call(receiver, v);
        }

      };
    }

    return descriptor.__destrObj;
  } else {
    if (!descriptor.writable) {
      throw new TypeError("attempted to set read only private field");
    }

    return descriptor;
  }
}

function _classPrivateMethodGet(receiver, privateSet, fn) {
  if (!privateSet.has(receiver)) {
    throw new TypeError("attempted to get private field on non-instance");
  }

  return fn;
}

function _checkPrivateRedeclaration(obj, privateCollection) {
  if (privateCollection.has(obj)) {
    throw new TypeError("Cannot initialize the same private elements twice on an object");
  }
}

function _classPrivateFieldInitSpec(obj, privateMap, value) {
  _checkPrivateRedeclaration(obj, privateMap);

  privateMap.set(obj, value);
}

function _classPrivateMethodInitSpec(obj, privateSet) {
  _checkPrivateRedeclaration(obj, privateSet);

  privateSet.add(obj);
}

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
class D20Roll extends Roll {
  constructor(formula, data, options = {}) {
    super(formula, data, options);

    if (!(this.terms[0] instanceof Die && this.terms[0].faces === 20)) {
      throw new Error(`Invalid D20Roll formula provided ${this._formula}`);
    }

    this.configureModifiers();
  }
  /* -------------------------------------------- */

  /**
   * A convenience reference for whether this D20Roll has advantage
   * @type {boolean}
   */


  get hasAdvantage() {
    //@ts-expect-error
    return this.options.advantageMode === D20Roll.ADV_MODE.ADVANTAGE;
  }
  /**
   * A convenience reference for whether this D20Roll has disadvantage
   * @type {boolean}
   */


  get hasDisadvantage() {
    //@ts-expect-error
    return this.options.advantageMode === D20Roll.ADV_MODE.DISADVANTAGE;
  }
  /* -------------------------------------------- */

  /*  D20 Roll Methods                            */

  /* -------------------------------------------- */

  /**
   * Apply optional modifiers which customize the behavior of the d20term
   * @private
   */


  configureModifiers() {
    const d20 = this.terms[0]; //@ts-expect-error

    d20.modifiers = []; // Handle Advantage or Disadvantage

    if (this.hasAdvantage) {
      //@ts-expect-error
      d20.number = 2; //@ts-expect-error

      d20.modifiers.push("kh"); //@ts-expect-error

      d20.options.advantage = true;
    } else if (this.hasDisadvantage) {
      //@ts-expect-error
      d20.number = 2; //@ts-expect-error

      d20.modifiers.push("kl"); //@ts-expect-error

      d20.options.disadvantage = true; //@ts-expect-error
    } else d20.number = 1; // Assign critical and fumble thresholds
    //@ts-expect-error


    if (this.options.critical) d20.options.critical = this.options.critical; //@ts-expect-error

    if (this.options.fumble) d20.options.fumble = this.options.fumble; //@ts-expect-error

    if (this.options.targetValue) d20.options.target = this.options.targetValue; // Re-compile the underlying formula
    //@ts-expect-error

    this._formula = this.constructor.getFormula(this.terms);
  }
  /* -------------------------------------------- */

  /** @inheritdoc */


  async toMessage(messageData = {}, options = {}) {
    var _options$rollMode;

    // Evaluate the roll now so we have the results available to determine whether reliable talent came into play
    if (!this._evaluated) await this.evaluate({
      async: true
    }); // Add appropriate advantage mode message flavor and ard20 roll flags
    //@ts-expect-error

    messageData.flavor = messageData.flavor || this.options.flavor; //@ts-expect-error

    if (this.hasAdvantage) messageData.flavor += ` (${game.i18n.localize("ARd20.Advantage")})`; //@ts-expect-error
    else if (this.hasDisadvantage) messageData.flavor += ` (${game.i18n.localize("ARd20.Disadvantage")})`; // Record the preferred rollMode
    //@ts-expect-error

    options.rollMode = (_options$rollMode = options.rollMode) !== null && _options$rollMode !== void 0 ? _options$rollMode : this.options.rollMode;
    return super.toMessage(messageData, options);
  }
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
  //@ts-expect-error


  async configureDialog({
    title: string,
    defaultRollMode: number,
    canMult: boolean,
    defaultAction = D20Roll.ADV_MODE.NORMAL,
    mRoll,
    chooseModifier = false,
    defaultAttribute,
    template
  } = {}, options = {}) {
    // Render the Dialog inner HTML
    //@ts-expect-error
    const content = await renderTemplate(template !== null && template !== void 0 ? template : this.constructor.EVALUATION_TEMPLATE, {
      formula: `${this.formula} + @bonus`,
      //@ts-expect-error
      defaultRollMode,
      rollModes: CONFIG.Dice.rollModes,
      chooseModifier,
      defaultAttribute,
      attributes: CONFIG.ARd20.Attributes,
      //@ts-expect-error
      canMult,
      mRoll
    });
    let defaultButton = "normal";

    switch (defaultAction) {
      case D20Roll.ADV_MODE.ADVANTAGE:
        defaultButton = "advantage";
        break;

      case D20Roll.ADV_MODE.DISADVANTAGE:
        defaultButton = "disadvantage";
        break;
    } // Create the Dialog window and await submission of the form


    return new Promise(resolve => {
      new Dialog({
        //@ts-expect-error
        title,
        content,
        buttons: {
          advantage: {
            label: game.i18n.localize("ARd20.Advantage"),
            callback: html => resolve(this._onDialogSubmit(html, D20Roll.ADV_MODE.ADVANTAGE))
          },
          normal: {
            label: game.i18n.localize("ARd20.Normal"),
            callback: html => resolve(this._onDialogSubmit(html, D20Roll.ADV_MODE.NORMAL))
          },
          disadvantage: {
            label: game.i18n.localize("ARd20.Disadvantage"),
            callback: html => resolve(this._onDialogSubmit(html, D20Roll.ADV_MODE.DISADVANTAGE))
          }
        },
        default: defaultButton,
        close: () => resolve(null)
      }, options).render(true);
    });
  }
  /* -------------------------------------------- */

  /**
   * Handle submission of the Roll evaluation configuration Dialog
   * @param {jQuery} html             The submitted dialog content
   * @param {number} advantageMode    The chosen advantage mode
   * @private
   */
  //@ts-expect-error


  _onDialogSubmit(html, advantageMode) {
    var _form$ability, _form$mRoll;

    const form = html[0].querySelector("form");
    console.log(this);
    console.log(form, "ФОРМА");

    if (form.bonus.value) {
      const bonus = new Roll(form.bonus.value, this.data);
      if (!(bonus.terms[0] instanceof OperatorTerm)) this.terms.push(new OperatorTerm({
        operator: "+"
      }));
      this.terms = this.terms.concat(bonus.terms);
    } // Customize the modifier


    if ((_form$ability = form.ability) !== null && _form$ability !== void 0 && _form$ability.value) {
      //@ts-expect-error
      const abl = this.data.attributes[form.ability.value];
      console.log(abl); //@ts-expect-error

      this.terms.findSplice(t => t.term === "@mod", new NumericTerm({
        number: abl.mod
      })); //@ts-expect-error

      this.options.flavor += ` (${game.i18n.localize(CONFIG.ARd20.Attributes[form.ability.value])})`;
    }
    /* if (form.prof_type?.value) {
       const pr = this.data[form.prof_type.value][form.prof_value.value];
       console.log(pr);
       this.terms.findSplice((t) => t.term === "@prof_die", new Die({ number: 1, faces: pr.prof_die }));
       this.terms.findSplice((t) => t.term === "@prof_bonus", new NumericTerm({ number: pr.prof_bonus }));
     }*/
    // Apply advantage or disadvantage
    //@ts-expect-error


    this.options.advantageMode = advantageMode; //@ts-expect-error

    this.options.rollMode = form.rollMode.value; //@ts-expect-error

    this.options.mRoll = (_form$mRoll = form.mRoll) === null || _form$mRoll === void 0 ? void 0 : _form$mRoll.checked;
    this.configureModifiers();
    return this;
  }

}
/* -------------------------------------------- */

/**
 * Advantage mode of a 5e d20 roll
 * @enum {number}
 */

D20Roll.ADV_MODE = {
  NORMAL: 0,
  ADVANTAGE: 1,
  DISADVANTAGE: -1
};
/**
 * The HTML template path used to configure evaluation of this Roll
 * @type {string}
 */

D20Roll.EVALUATION_TEMPLATE = "systems/ard20/templates/chat/roll-dialog.html";

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
//@ts-expect-error
class DamageRoll extends Roll {
  //@ts-expect-error
  constructor(formula, data, options) {
    super(formula, data, options); // For backwards compatibility, skip rolls which do not have the "critical" option defined
    //@ts-expect-error

    if (this.options.critical !== undefined) this.configureDamage();
  }
  /* -------------------------------------------- */

  /**
   * A convenience reference for whether this DamageRoll is a critical hit
   * @type {boolean}
   */


  get isCritical() {
    //@ts-expect-error
    return this.options.critical;
  }
  /* -------------------------------------------- */

  /*  Damage Roll Methods                         */

  /* -------------------------------------------- */

  /**
   * Apply optional modifiers which customize the behavior of the d20term
   * @private
   */


  configureDamage() {
    let critBonus = 0;

    for (let [i, term] of this.terms.entries()) {
      if (!(term instanceof OperatorTerm)) {
        //@ts-expect-error
        term.options.damageType = i !== 0 && this.terms[i - 1] instanceof OperatorTerm ? this.options.damageType[i - 1] : this.options.damageType[i];
      } // Multiply dice terms


      if (term instanceof DiceTerm) {
        var _term$options$baseNum;

        //@ts-expect-error
        term.options.baseNumber = (_term$options$baseNum = term.options.baseNumber) !== null && _term$options$baseNum !== void 0 ? _term$options$baseNum : term.number; // Reset back
        //@ts-expect-error

        term.number = term.options.baseNumber;

        if (this.isCritical) {
          critBonus += term.number * term.faces;
          let [oper, num] = [new OperatorTerm({
            operator: "+"
          }), new NumericTerm({
            number: critBonus,
            options: {
              flavor: "Crit"
            }
          })];
          this.terms.splice(1, 0, oper);
          this.terms.splice(2, 0, num); //@ts-expect-error

          let cb = this.options.criticalBonusDice && i === 0 ? this.options.criticalBonusDice : 0;
          term.alter(1, cb); //@ts-expect-error

          term.options.critical = true;
        }
      } // Multiply numeric terms
      //@ts-expect-error
      else if (this.options.multiplyNumeric && term instanceof NumericTerm) {
        var _term$options$baseNum2;

        //@ts-expect-error
        term.options.baseNumber = (_term$options$baseNum2 = term.options.baseNumber) !== null && _term$options$baseNum2 !== void 0 ? _term$options$baseNum2 : term.number; // Reset back
        //@ts-expect-error

        term.number = term.options.baseNumber;

        if (this.isCritical) {
          var _this$options$critica;

          //@ts-expect-error
          term.number *= (_this$options$critica = this.options.criticalMultiplier) !== null && _this$options$critica !== void 0 ? _this$options$critica : 2; //@ts-expect-error

          term.options.critical = true;
        }
      }
    } //@ts-expect-error


    this._formula = this.constructor.getFormula(this.terms);
  }
  /* -------------------------------------------- */

  /** @inheritdoc */


  toMessage(messageData = {}, options = {}) {
    var _options$rollMode;

    //@ts-expect-error
    messageData.flavor = messageData.flavor || this.options.flavor;

    if (this.isCritical) {
      const label = game.i18n.localize("ARd20.CriticalHit"); //@ts-expect-error

      messageData.flavor = messageData.flavor ? `${messageData.flavor} (${label})` : label;
    } //@ts-expect-error


    options.rollMode = (_options$rollMode = options.rollMode) !== null && _options$rollMode !== void 0 ? _options$rollMode : this.options.rollMode;
    return super.toMessage(messageData, options);
  }
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


  async configureDialog({
    title,
    defaultRollMode,
    canMult,
    damType,
    mRoll,
    defaultCritical = false,
    template,
    allowCritical = true
  } = {}, options = {}) {
    // Render the Dialog inner HTML
    //@ts-expect-error
    const content = await renderTemplate(template !== null && template !== void 0 ? template : this.constructor.EVALUATION_TEMPLATE, {
      formula: `${this.formula} + @bonus`,
      defaultRollMode,
      rollModes: CONFIG.Dice.rollModes,
      canMult,
      damType,
      mRoll
    }); // Create the Dialog window and await submission of the form

    return new Promise(resolve => {
      new Dialog({
        title,
        content,
        buttons: {
          critical: {
            //@ts-expect-error
            condition: allowCritical,
            label: game.i18n.localize("ARd20.CriticalHit"),
            callback: html => resolve(this._onDialogSubmit(html, true))
          },
          normal: {
            label: game.i18n.localize(allowCritical ? "ARd20.Normal" : "ARd20.Roll"),
            callback: html => resolve(this._onDialogSubmit(html, false))
          }
        },
        default: defaultCritical ? "critical" : "normal",
        close: () => resolve(null)
      }, options).render(true);
    });
  }
  /* -------------------------------------------- */

  /**
   * Handle submission of the Roll evaluation configuration Dialog
   * @param {jQuery} html             The submitted dialog content
   * @param {boolean} isCritical      Is the damage a critical hit?
   * @private
   */
  //@ts-expect-error


  _onDialogSubmit(html, isCritical) {
    var _form$mRoll;

    const form = html[0].querySelector("form"); // Append a situational bonus term

    if (form.bonus.value) {
      const bonus = new Roll(form.bonus.value, this.data);
      if (!(bonus.terms[0] instanceof OperatorTerm)) this.terms.push(new OperatorTerm({
        operator: "+"
      }));
      this.terms = this.terms.concat(bonus.terms);
    } // Apply advantage or disadvantage
    //@ts-expect-error


    this.options.critical = isCritical; //@ts-expect-error

    this.options.rollMode = form.rollMode.value; //@ts-expect-error

    this.options.damageType.forEach((part, ind) => this.options.damageType[ind] = form[`damageType.${ind}`] ? part[form[`damageType.${ind}`].value] : part[0]); //@ts-expect-error

    this.options.mRoll = (_form$mRoll = form.mRoll) === null || _form$mRoll === void 0 ? void 0 : _form$mRoll.checked;
    this.configureDamage();
    return this;
  }
  /* -------------------------------------------- */

  /** @inheritdoc */
  //@ts-expect-error


  static fromData(data) {
    const roll = super.fromData(data); //@ts-expect-error

    roll._formula = this.getFormula(roll.terms);
    return roll;
  }

}
/**
 * The HTML template path used to configure evaluation of this Roll
 * @type {string}
 */

DamageRoll.EVALUATION_TEMPLATE = "systems/ard20/templates/chat/roll-dialog.html";

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

function simplifyRollFormula(formula, data, {
  constantFirst = false
}) {
  const roll = new Roll(formula, data); // Parses the formula and replaces any @properties

  const terms = roll.terms; // Some terms are "too complicated" for this algorithm to simplify
  // In this case, the original formula is returned.

  if (terms.some(_isUnsupportedTerm)) return roll.formula;
  const rollableTerms = []; // Terms that are non-constant, and their associated operators

  const constantTerms = []; // Terms that are constant, and their associated operators

  let operators = []; // Temporary storage for operators before they are moved to one of the above

  for (let term of terms) {
    // For each term
    if (term instanceof OperatorTerm) operators.push(term); // If the term is an addition/subtraction operator, push the term into the operators array
    else {
      // Otherwise the term is not an operator
      if (term instanceof DiceTerm) {
        // If the term is something rollable
        rollableTerms.push(...operators); // Place all the operators into the rollableTerms array

        rollableTerms.push(term); // Then place this rollable term into it as well
      } //
      else {
        // Otherwise, this must be a constant
        constantTerms.push(...operators); // Place the operators into the constantTerms array

        constantTerms.push(term); // Then also add this constant term to that array.
      } //


      operators = []; // Finally, the operators have now all been assigend to one of the arrays, so empty this before the next iteration.
    }
  }

  const constantFormula = Roll.getFormula(constantTerms); // Cleans up the constant terms and produces a new formula string

  const rollableFormula = Roll.getFormula(rollableTerms); // Cleans up the non-constant terms and produces a new formula string
  // Mathematically evaluate the constant formula to produce a single constant term

  let constantPart = undefined;

  if (constantFormula) {
    try {
      constantPart = Roll.safeEval(constantFormula);
    } catch (err) {
      console.warn(`Unable to evaluate constant term ${constantFormula} in simplifyRollFormula`);
    }
  } // Order the rollable and constant terms, either constant first or second depending on the optional argument


  const parts = constantFirst ? [constantPart, rollableFormula] : [rollableFormula, constantPart]; // Join the parts with a + sign, pass them to `Roll` once again to clean up the formula

  return new Roll(parts.filterJoin(" + ")).formula;
}
/* -------------------------------------------- */

/**
 * Only some terms are supported by simplifyRollFormula, this method returns true when the term is not supported.
 * @param {*} term - A single Dice term to check support on
 * @return {Boolean} True when unsupported, false if supported
 */

function _isUnsupportedTerm(term) {
  const diceTerm = term instanceof DiceTerm;
  const operator = term instanceof OperatorTerm && ["+", "-"].includes(term.operator);
  const number = term instanceof NumericTerm;
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
//@ts-expect-error


async function d20Roll({
  //@ts-expect-error
  parts = [],
  //@ts-expect-error
  data = {},
  //@ts-expect-error
  advantage,
  //@ts-expect-error
  disadvantage,
  //@ts-expect-error
  fumble = 1,
  //@ts-expect-error
  critical = 20,
  //@ts-expect-error
  targetValue,
  //@ts-expect-error
  chooseModifier = false,
  //@ts-expect-error
  fastForward = false,
  //@ts-expect-error
  event,
  //@ts-expect-error
  template,
  //@ts-expect-error
  title,
  //@ts-expect-error
  dialogOptions,
  //@ts-expect-error
  chatMessage = true,
  //@ts-expect-error
  messageData = {},
  //@ts-expect-error
  rollMode,
  //@ts-expect-error
  speaker,
  //@ts-expect-error
  options,
  //@ts-expect-error
  flavor,
  //@ts-expect-error
  canMult,
  //@ts-expect-error
  mRoll //@ts-expect-error

} = {}) {
  // Handle input arguments
  const formula = ["1d20"].concat(parts).join(" + ");

  const {
    advantageMode,
    isFF
  } = _determineAdvantageMode({
    advantage,
    disadvantage,
    fastForward,
    event
  });

  const defaultRollMode = rollMode || game.settings.get("core", "rollMode");

  if (chooseModifier && !isFF) {
    data["mod"] = "@mod";
  } // Construct the D20Roll instance
  //@ts-expect-error


  const roll = new CONFIG.Dice.D20Roll(formula, data, {
    flavor: flavor || title,
    advantageMode,
    defaultRollMode,
    critical,
    fumble,
    targetValue,
    mRoll
  }); // Prompt a Dialog to further configure the D20Roll

  if (!isFF) {
    var _data$item;

    const configured = await roll.configureDialog({
      title,
      chooseModifier,
      defaultRollMode: defaultRollMode,
      defaultAction: advantageMode,
      defaultAbility: data === null || data === void 0 ? void 0 : (_data$item = data.item) === null || _data$item === void 0 ? void 0 : _data$item.ability,
      template,
      canMult,
      mRoll
    }, dialogOptions);
    if (configured === null) return null;
  } // Evaluate the configured roll


  await roll.evaluate({
    async: true
  }); // Create a Chat Message

  if (speaker) {
    console.warn(`You are passing the speaker argument to the d20Roll function directly which should instead be passed as an internal key of messageData`);
    messageData.speaker = speaker;
  }

  if (roll && chatMessage) await roll.toMessage(messageData, options);
  return roll;
}
/* -------------------------------------------- */

/**
 * Determines whether this d20 roll should be fast-forwarded, and whether advantage or disadvantage should be applied
 * @returns {{isFF: boolean, advantageMode: number}}  Whether the roll is fast-forward, and its advantage mode
 */
//@ts-expect-error

function _determineAdvantageMode({
  event,
  advantage = false,
  disadvantage = false,
  fastForward = false
} = {}) {
  const isFF = fastForward || event && (event.shiftKey || event.altKey || event.ctrlKey || event.metaKey); //@ts-expect-error

  let advantageMode = CONFIG.Dice.D20Roll.ADV_MODE.NORMAL; //@ts-expect-error

  if (advantage || event !== null && event !== void 0 && event.altKey) advantageMode = CONFIG.Dice.D20Roll.ADV_MODE.ADVANTAGE; //@ts-expect-error
  else if (disadvantage || event !== null && event !== void 0 && event.ctrlKey || event !== null && event !== void 0 && event.metaKey) advantageMode = CONFIG.Dice.D20Roll.ADV_MODE.DISADVANTAGE;
  return {
    isFF,
    advantageMode
  };
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
//@ts-expect-error


async function damageRoll({
  //@ts-expect-error
  parts = [],
  //@ts-expect-error
  data,
  // Roll creation
  //@ts-expect-error
  critical = false,
  //@ts-expect-error
  damType,
  //@ts-expect-error
  damageType,
  //@ts-expect-error
  criticalBonusDice,
  //@ts-expect-error
  criticalMultiplier,
  //@ts-expect-error
  multiplyNumeric,
  // Damage customization
  //@ts-expect-error
  fastForward = false,
  //@ts-expect-error
  event,
  //@ts-expect-error
  allowCritical = true,
  //@ts-expect-error
  template,
  //@ts-expect-error
  title,
  //@ts-expect-error
  dialogOptions,
  // Dialog configuration
  //@ts-expect-error
  chatMessage = false,
  //@ts-expect-error
  messageData = {},
  //@ts-expect-error
  rollMode,
  //@ts-expect-error
  speaker,
  //@ts-expect-error
  canMult,
  //@ts-expect-error
  flavor,
  //@ts-expect-error
  mRoll //@ts-expect-error

} = {}) {
  console.log(canMult); // Handle input arguments

  const defaultRollMode = rollMode || game.settings.get("core", "rollMode"); // Construct the DamageRoll instance

  const formula = parts.join(" + ");

  const {
    isCritical,
    isFF
  } = _determineCriticalMode({
    critical,
    fastForward,
    event
  }); //@ts-expect-error


  const roll = new CONFIG.Dice.DamageRoll(formula, data, {
    flavor: flavor || title,
    critical: isCritical,
    criticalBonusDice,
    criticalMultiplier,
    multiplyNumeric,
    damType,
    mRoll,
    damageType
  }); // Prompt a Dialog to further configure the DamageRoll

  if (!isFF) {
    const configured = await roll.configureDialog({
      title,
      defaultRollMode: defaultRollMode,
      defaultCritical: isCritical,
      template,
      allowCritical,
      mRoll,
      canMult,
      damType
    }, dialogOptions);
    if (configured === null) return null;
  } // Evaluate the configured roll


  await roll.evaluate({
    async: true
  }); // Create a Chat Message

  if (speaker) {
    console.warn(`You are passing the speaker argument to the damageRoll function directly which should instead be passed as an internal key of messageData`);
    messageData.speaker = speaker;
  }

  if (roll && chatMessage) await roll.toMessage(messageData);
  return roll;
}
/* -------------------------------------------- */

/**
 * Determines whether this d20 roll should be fast-forwarded, and whether advantage or disadvantage should be applied
 * @returns {{isFF: boolean, isCritical: boolean}}  Whether the roll is fast-forward, and whether it is a critical hit
 */
//@ts-expect-error

function _determineCriticalMode({
  event,
  critical = false,
  fastForward = false
} = {}) {
  const isFF = fastForward || event && (event.shiftKey || event.altKey || event.ctrlKey || event.metaKey);
  if (event !== null && event !== void 0 && event.altKey) critical = true;
  return {
    isFF,
    isCritical: critical
  };
}

var dice = /*#__PURE__*/Object.freeze({
  __proto__: null,
  simplifyRollFormula: simplifyRollFormula,
  d20Roll: d20Roll,
  damageRoll: damageRoll,
  D20Roll: D20Roll,
  DamageRoll: DamageRoll
});

/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */

class ARd20Item extends Item {
  /**
   * Augment the basic Item data model with additional dynamic data.
   */
  prepareData() {
    // As with the actor class, items are documents that can have their data
    // preparation methods overridden (such as prepareBaseData()).
    super.prepareData();
  }

  prepareDerivedData() {
    super.prepareDerivedData();
    const itemData = this.data;

    this._prepareSpellData(itemData);

    this._prepareWeaponData(itemData);

    this._prepareFeatureData(itemData);

    this._prepareRaceData(itemData);

    this._prepareArmorData(itemData);

    if (itemData.data.hasAttack) this._prepareAttack(itemData);
    if (itemData.data.hasDamage) this._prepareDamage(itemData);
    if (!this.isOwned) this.prepareFinalAttributes();
  }
  /**
   *Prepare data for Spells
   */


  _prepareSpellData(itemData) {
    if (itemData.type !== "spell") return;
    itemData.data;
  }
  /**
   *Prepare data for weapons
   */


  _prepareWeaponData(itemData) {
    if (itemData.type !== "weapon") return;
    const data = itemData.data;
    const flags = itemData.flags;
    data.hasAttack = data.hasAttack || true;
    data.hasDamage = data.hasDamage || true; //TODO: this._setDeflect(data);

    this._setTypeAndSubtype(data, flags);

    for (let [key, type] of obj_entries$1(data.damage)) {
      if (key !== "current") {
        for (let [_key, prof] of obj_entries$1(type)) {
          prof.formula = "";
          prof.parts.forEach(part => {
            if (Array.isArray(part[1])) {
              prof.formula += `${part[0]}`;
              part[1].forEach((sub, ind) => {
                if (ind === 0) {
                  prof.formula += ` {${sub[0]} ${sub[1]}`;
                  prof.formula += ind === part[1].length - 1 ? "}" : "";
                } else {
                  prof.formula += ` or ${sub[0]} ${sub[1]}`;
                  prof.formula += ind === part[1].length - 1 ? "}" : "";
                }
              });
            } else prof.formula += `${part[0]} {${part[1]} ${part[2]}}; `;
          });
        }
      }
    }
  }
  /**
   *Set deflect die equal to damage die, if not
   */

  /* TODO:
  _setDeflect(data: object & WeaponDataPropertiesData) {
    for (let [k, v] of obj_entries(CONFIG.ARd20.Rank)) {
      v = game.i18n.localize(CONFIG.ARd20.prof[k]) ?? k;
      v = v.toLowerCase();
      data.deflect[v] = data.property[v].def ? data.deflect[v] || data.damage.common[v] : 0;
    }
  }
  */
  //@ts-expect-error


  _setTypeAndSubtype(data, flags) {
    var _flags$core, _game$i18n$localize, _game$i18n$localize2;

    data.sub_type_array = game.settings.get("ard20", "proficiencies").weapon.filter(prof => prof.type === data.type.value);

    if ((_flags$core = flags.core) !== null && _flags$core !== void 0 && _flags$core.sourceId) {
      const id = /Item.(.+)/.exec(flags.core.sourceId)[1];
      const item = game.items.get(id);

      if ((item === null || item === void 0 ? void 0 : item.data.type) === "weapon") {
        data.sub_type = data.sub_type === undefined ? item.data.data.sub_type : data.sub_type;
      }
    }

    data.sub_type = data.sub_type_array.filter(prof => prof.name === data.sub_type).length === 0 ? data.sub_type_array[0].name : data.sub_type || data.sub_type_array[0].name;
    data.proficiency.name = (_game$i18n$localize = game.i18n.localize(getValues$1(CONFIG.ARd20.Rank, data.proficiency.level))) !== null && _game$i18n$localize !== void 0 ? _game$i18n$localize : getValues$1(CONFIG.ARd20.Rank, data.proficiency.level);
    data.type.name = (_game$i18n$localize2 = game.i18n.localize(getValues$1(CONFIG.ARd20.Rank, data.type.value))) !== null && _game$i18n$localize2 !== void 0 ? _game$i18n$localize2 : getValues$1(CONFIG.ARd20.Rank, data.type.value);
  }
  /**
   *Prepare data for features
   */


  _prepareFeatureData(itemData) {
    if (itemData.type !== "feature") return;
    const data = itemData.data; // Handle Source of the feature

    data.source.label = "";
    data.source.value.forEach((value, key) => {
      let label = game.i18n.localize(getValues$1(CONFIG.ARd20.Source, value));
      data.source.label += key === 0 ? label : `, ${label}`;
    }); //labels.source = game.i18n.localize(CONFIG.ARd20.source[data.source.value]);
    //define levels

    data.level.has = data.level.has !== undefined ? data.level.has : false;
    data.level.max = data.level.has ? data.level.max || 4 : 1;
    data.level.initial = Math.min(data.level.max, data.level.initial);
    data.level.current = this.isOwned ? Math.max(data.level.initial, 1) : 0; //define exp cost

    if (data.level.max > 1) {
      let n = (10 - data.level.max) / data.level.max;
      let k = 1.7 + Math.round(Number((Math.abs(n) * 100).toPrecision(15))) / 100 * Math.sign(n);

      if (data.xp.basicCost.length < data.level.max) {
        for (let i = 1; i < data.level.max; i++) {
          data.xp.basicCost.push(Math.round(data.xp.basicCost[i - 1] * k / 5) * 5);
          data.xp.AdvancedCost.push(data.xp.basicCost[i]);
        }
      } else {
        for (let i = 1; i < data.level.max; i++) {
          var _data$xp$AdvancedCost;

          data.xp.basicCost[i] = Math.round(data.xp.basicCost[i - 1] * k / 5) * 5;
          data.xp.AdvancedCost[i] = (_data$xp$AdvancedCost = data.xp.AdvancedCost[i]) !== null && _data$xp$AdvancedCost !== void 0 ? _data$xp$AdvancedCost : data.xp.basicCost[i];
        }
      }
    }

    for (let [key, req] of Object.entries(data.req.values)) {
      req.pass = Array.from({
        length: data.level.max
      }, i => false);

      switch (req.type) {
        case "ability":
          for (let [_key2, v] of obj_entries$1(CONFIG.ARd20.Attributes)) {
            if (req.name === game.i18n.localize(CONFIG.ARd20.Attributes[_key2])) req.value = _key2;
          }

          break;

        case "skill":
          for (let [_key3, v] of obj_entries$1(CONFIG.ARd20.Skills)) {
            if (req.name === game.i18n.localize(CONFIG.ARd20.Skills[_key3])) req.value = _key3;
          }

          break;
      }
    }

    for (let i = data.req.logic.length; data.level.max > data.req.logic.length; i++) {
      if (i === 0) {
        data.req.logic.push("1");
      } else {
        data.req.logic.push(data.req.logic[i - 1]);
      }
    }

    for (let i = data.req.logic.length; data.level.max < data.req.logic.length; i--) {
      data.req.logic.splice(data.req.logic.length - 1, 1);
    }
  }
  /**
   * Prepare data for 'race' type of item
   */


  _prepareRaceData(itemData) {
    if (itemData.type !== "race") return;
  }
  /**
   * Prepare data for "armor" type item
   */


  _prepareArmorData(itemData) {
    var _data$mobility$value;

    if (itemData.type !== "armor") return;
    const data = itemData.data;

    for (let [key, dr] of obj_entries$1(CONFIG.ARd20.DamageSubTypes)) {
      var _data$res$mag$key;

      if (!(key === "force" || key === "radiant" || key === "psychic")) {
        var _data$res$phys$key;

        data.res.phys[key] = (_data$res$phys$key = data.res.phys[key]) !== null && _data$res$phys$key !== void 0 ? _data$res$phys$key : 0;
      }

      data.res.mag[key] = (_data$res$mag$key = data.res.mag[key]) !== null && _data$res$mag$key !== void 0 ? _data$res$mag$key : 0;
    }

    data.mobility.value = (_data$mobility$value = data.mobility.value) !== null && _data$mobility$value !== void 0 ? _data$mobility$value : CONFIG.ARd20.HeavyPoints[data.type][data.slot];
    data.mobility.value += data.mobility.bonus;
  }
  /**
  Prepare Data that uses actor's data
  */


  prepareFinalAttributes() {
    const itemData = this.data; //@ts-expect-error

    const abil = itemData.abil = {};

    for (let [k, v] of obj_entries$1(CONFIG.ARd20.Attributes)) {
      abil[k] = this.isOwned ? getProperty(this.actor.data, `data.attributes.${k}.mod`) : null;
    }

    let prof_bonus = 0;

    if (itemData.type === "weapon") {
      var _this$actor, _game$i18n$localize3;

      const data = itemData.data;
      data.proficiency.level = this.isOwned ? (_this$actor = this.actor) === null || _this$actor === void 0 ? void 0 : _this$actor.data.data.proficiencies.weapon.filter(pr => pr.name === data.sub_type)[0].value : 0;
      data.proficiency.levelName = (_game$i18n$localize3 = game.i18n.localize(CONFIG.ARd20.Rank[data.proficiency.level])) !== null && _game$i18n$localize3 !== void 0 ? _game$i18n$localize3 : CONFIG.ARd20.Rank[data.proficiency.level];
      prof_bonus = data.proficiency.level * 4;
    }

    if (itemData.data.hasAttack) this._prepareAttack(itemData, prof_bonus, abil);
    if (itemData.data.hasDamage) this._prepareDamage(itemData, abil);
  }

  _prepareAttack(itemData, prof_bonus, abil) {
    const data = itemData.data;
    if (!data.hasAttack) return; //@ts-expect-error

    let mod = itemData.type === "weapon" && abil !== undefined ? abil.dex : data.atkMod; //@ts-expect-error

    data.attack = {
      formula: "1d20+" + prof_bonus + "+" + mod,
      parts: [mod, prof_bonus]
    };
  }

  _prepareDamage(itemData, abil) {
    const data = itemData.data;
    if (!data.hasDamage) return;
    itemData.type === "weapon" && abil !== undefined ? abil.str : 0;
    const prop = "damage.parts";
    let baseDamage = getProperty(data, prop); //@ts-expect-error

    data.damage.current = {
      formula: "",
      parts: baseDamage
    };
    baseDamage.forEach(part => {
      //@ts-expect-error
      data.damage.current.formula += part[0] + `[${part[1]}, ${part[2]}] `;
    });
  }
  /**
   * Prepare a data object which is passed to any Roll formulas which are created related to this Item
   * @private
   */
  //@ts-expect-error


  getRollData() {
    // If present, return the actor's roll data.
    if (!this.actor) return null;
    const rollData = this.actor.getRollData();
    const hasDamage = this.data.data.hasDamage;
    const hasAttack = this.data.data.hasAttack; //@ts-expect-error

    rollData.item = foundry.utils.deepClone(this.data.data); //@ts-expect-error

    rollData.damageDie = hasDamage ? this.data.data.damage.current.parts[0] : null; //@ts-expect-error

    rollData.mod = hasAttack ? //@ts-expect-error
    this.data.data.attack.parts[0] : hasDamage ? //@ts-expect-error
    this.data.data.damage.current.parts[1] : null; //@ts-expect-error

    rollData.prof = hasAttack ? this.data.data.attack.parts[1] : null;
    return rollData;
  }
  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  //@ts-expect-error


  async roll({
    configureDialog = true,
    rollMode,
    hasDamage = false,
    hasAttack = false,
    createMessage = true
  }) {
    let item = this;
    item.id;
    const iData = this.data.data; //Item data

    const actor = this.actor;
    actor === null || actor === void 0 ? void 0 : actor.data.data;
    hasDamage = iData.hasDamage || hasDamage;
    hasAttack = iData.hasAttack || hasAttack; // Initialize chat data.

    ChatMessage.getSpeaker({
      actor: actor
    });
    this.name; // Otherwise, create a roll and send a chat message from it.

    const targets = Array.from(game.user.targets); //@ts-expect-error

    const mRoll = this.data.data.mRoll || false; //@ts-expect-error

    return item.displayCard({
      rollMode,
      createMessage,
      hasAttack,
      hasDamage,
      targets,
      mRoll
    });
  }
  /* -------------------------------------------- */

  /*  Chat Message Helpers                        */

  /* -------------------------------------------- */


  static chatListeners(html) {
    html.on("click", ".card-buttons button", this._onChatCardAction.bind(this));
    html.on("click", ".item-name", this._onChatCardToggleContent.bind(this));
    html.on("click", ".attack-roll .roll-controls .accept", this._rollDamage.bind(this));
    html.on("hover", ".attack-roll .flexrow .value", function (event) {
      var _element$querySelecto;

      event.preventDefault();
      const element = this.closest("li.flexrow");
      (_element$querySelecto = element.querySelector(".attack-roll .hover-roll")) === null || _element$querySelecto === void 0 ? void 0 : _element$querySelecto.classList.toggle("shown", event.type == "mouseenter");
    });
  }
  /* -------------------------------------------- */

  /**
   * Handle execution of a chat card action via a click event on one of the card buttons
   * @param {Event} event       The originating click event
   * @returns {Promise}         A promise which resolves once the handler workflow is complete
   * @private
   */
  //@ts-expect-error


  static async _onChatCardAction(event) {
    event.preventDefault(); // Extract card data

    const button = event.currentTarget;
    const card = button.closest(".chat-card");
    const messageId = card.closest(".message").dataset.messageId;
    const message = game.messages.get(messageId);
    const action = button.dataset.action;
    const targetUuid = button.closest(".flexrow").dataset.targetId; // Validate permission to proceed with the roll

    const isTargetted = action === "save";
    if (!(isTargetted || game.user.isGM || message.isAuthor)) return; // Recover the actor for the chat card

    const actor = await this._getChatCardActor(card);
    if (!actor) return; // Get the Item from stored flag data or by the item ID on the Actor

    const storedData = message.getFlag("ard20", "itemData"); //@ts-expect-error

    const item = storedData ? new this(storedData, {
      parent: actor
    }) : actor.items.get(card.dataset.itemId);

    if (!item) {
      return ui.notifications.error(game.i18n.format("ARd20.ActionWarningNoItem", {
        item: card.dataset.itemId,
        name: actor.name
      }));
    }

    const spellLevel = parseInt(card.dataset.spellLevel) || null; // Handle different actions

    switch (action) {
      case "damage":
      case "versatile":
        let dam = await item.rollDamage({
          critical: event.altKey,
          event: event,
          spellLevel: spellLevel,
          versatile: action === "versatile"
        }); //const dom = new DOMParser().parseFromString(message.data.content,"text/html")

        const html = $(message.data.content);
        dam = await dam.render(); //dom.querySelector('button').replaceWith(dam)

        if (targetUuid) {
          html.find(`[data-targetId="${targetUuid}"]`).find("button").replaceWith(dam);
        } else {
          html.find(".damage-roll").find("button").replaceWith(dam);
        } //console.log(dom)


        await message.update({
          content: html[0].outerHTML
        });
        break;

      case "formula":
        await item.rollFormula({
          event,
          spellLevel
        });
        break;

      case "save":
        const targets = this._getChatCardTargets(card);

        for (let token of targets) {
          //@ts-expect-error
          const speaker = ChatMessage.getSpeaker({
            scene: canvas.scene,
            token: token
          }); //@ts-expect-error

          await token.actor.rollAbilitySave(button.dataset.ability, {
            event,
            speaker
          });
        }

        break;

      case "toolCheck":
        await item.rollToolCheck({
          event
        });
        break;

      case "placeTemplate":
        ///@ts-expect-error
        const template = game.ard20.canvas.AbilityTemplate.fromItem(item);
        if (template) template.drawPreview();
        break;
    } // Re-enable the button


    button.disabled = false;
  }
  /* -------------------------------------------- */

  /**
   * Handle toggling the visibility of chat card content when the name is clicked
   * @param {Event} event   The originating click event
   * @private
   */


  static _onChatCardToggleContent(event) {
    event.preventDefault();
    const header = event.currentTarget;
    const card = header.closest(".chat-card");
    const content = card.querySelector(".card-content");
    content.style.display = content.style.display === "none" ? "block" : "none";
  }

  async _applyDamage(dam, tData, tHealth, tActor) {
    let value = dam.total;
    console.log("урон до резистов: ", value);
    dam.terms.forEach(term => {
      if (!(term instanceof OperatorTerm)) {
        let damageType = term.options.damageType;
        let res = tData.defences.damage[damageType[0]][damageType[1]];
        if (res.type === "imm") console.log("Иммунитет");
        console.log("урон уменьшился с ", value);
        value -= res.type === "imm" ? term.total : Math.min(res.value, term.total);
        console.log("до", value);
      }
    });
    console.log(value, "итоговый урон");
    tHealth -= value;
    console.log("хп стало", tHealth);
    let obj = {};
    obj["data.health.value"] = tHealth;

    if (game.user.isGM) {
      await tActor.update(obj);
    } else {
      game.socket.emit("system.ard20", {
        operation: "updateActorData",
        actor: tActor,
        update: obj,
        value: value
      });
    }
  }

  static async _rollDamage(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const card = element.closest(".chat-card");
    const message = game.messages.get(card.closest(".message").dataset.messageId);
    const targetUuid = element.closest("li.flexrow").dataset.targetId;
    const token = await fromUuid(targetUuid); //@ts-expect-error

    const tActor = token === null || token === void 0 ? void 0 : token.actor;
    const tData = tActor.data.data;
    let tHealth = tData.health.value;
    console.log(tHealth, "здоровье цели"); // Recover the actor for the chat card

    const actor = await this._getChatCardActor(card);
    if (!actor) return; // Get the Item from stored flag data or by the item ID on the Actor

    const storedData = message.getFlag("ard20", "itemData"); //@ts-expect-error

    const item = storedData ? new this(storedData, {
      parent: actor
    }) : actor.items.get(card.dataset.itemId);

    if (!item) {
      return ui.notifications.error(game.i18n.format("ARd20.ActionWarningNoItem", {
        item: card.dataset.itemId,
        name: actor.name
      }));
    }

    const dam = await item.rollDamage({
      event: event,
      canMult: false
    });
    const html = $(message.data.content);
    let damHTML = await dam.render();
    console.log(html.find(`[data-target-id="${targetUuid}"]`).find(".damage-roll")[0]);
    html.find(`[data-target-id="${targetUuid}"]`).find(".damage-roll").append(damHTML);
    html.find(`[data-target-id="${targetUuid}"]`).find(".accept").remove();
    console.log(html[0]);
    await message.update({
      content: html[0].outerHTML
    });
    await item._applyDamage(dam, tData, tHealth, tActor);
  }
  /* -------------------------------------------- */

  /**
   * Get the Actor which is the author of a chat card
   * @param {HTMLElement} card    The chat card being used
   * @return {Actor|null}         The Actor entity or null
   * @private
   */


  static async _getChatCardActor(card) {
    // Case 1 - a synthetic actor from a Token
    if (card.dataset.tokenId) {
      const token = await fromUuid(card.dataset.tokenId);
      if (!token) return null; //@ts-expect-error

      return token.actor;
    } // Case 2 - use Actor ID directory


    const actorId = card.dataset.actorId;
    return game.actors.get(actorId) || null;
  }
  /* -------------------------------------------- */

  /**
   * Get the Actor which is the author of a chat card
   * @param {HTMLElement} card    The chat card being used
   * @return {Actor[]}            An Array of Actor entities, if any
   * @private
   */


  static _getChatCardTargets(card) {
    let targets = canvas.tokens.controlled.filter(t => !!t.actor); //@ts-expect-error

    if (!targets.length && game.user.character) targets = targets.concat(game.user.character.getActiveTokens());
    if (!targets.length) ui.notifications.warn(game.i18n.localize("ARd20.ActionWarningNoToken"));
    return targets;
  }
  /*showRollDetail(event){
    event.preventDefault();
    const elem = event.currentTarget;
    const
  }*/


  async displayCard({
    //@ts-expect-error
    rollMode,
    createMessage = true,
    hasAttack = Boolean(),
    hasDamage = Boolean(),
    targets = [],
    mRoll = Boolean()
  } = {}) {
    var _this$data$data$attac, _this$data$data$attac2;

    // Render the chat card template
    let atk = {};
    let dc = {};
    let atkHTML = {};
    let dmgHTML = {};
    let result = {};
    let hit = {};
    let dmg = {};
    let dieResultCss = {}; //@ts-expect-error

    const def = (_this$data$data$attac = (_this$data$data$attac2 = this.data.data.attack) === null || _this$data$data$attac2 === void 0 ? void 0 : _this$data$data$attac2.def) !== null && _this$data$data$attac !== void 0 ? _this$data$data$attac : "reflex";
    const token = this.actor.token;

    if (targets.length !== 0) {
      //@ts-expect-error
      let atkRoll = hasAttack ? await this.rollAttack(mRoll, {
        canMult: true
      }) : null;
      let dmgRoll = hasDamage && !hasAttack ? await this.rollDamage({
        canMult: true
      }) : null;

      for (let [key, target] of Object.entries(targets)) {
        if (atkRoll) {
          mRoll = atkRoll.options.mRoll; //@ts-expect-error

          dc[key] = target.actor.data.data.defences.stats[def].value; //@ts-expect-error

          atk[key] = hasAttack ? Object.keys(atk).length === 0 || !mRoll ? atkRoll : await atkRoll.reroll() : null; //@ts-expect-error

          console.log(atk[key]); //@ts-expect-error

          atkHTML[key] = hasAttack ? await atk[key].render() : null; //@ts-expect-error

          let d20 = atk[key] ? atk[key].terms[0] : null; //@ts-expect-error

          atk[key] = atk[key].total; //@ts-expect-error

          dieResultCss[key] = d20.total >= d20.options.critical ? "d20crit" : d20.total <= d20.options.fumble ? "d20fumble" : "d20normal"; //@ts-expect-error

          result[key] = atk[key] > dc[key] ? "hit" : "miss"; //@ts-expect-error

          hit[key] = result[key] === "hit" ? true : false;
        } else {
          mRoll = dmgRoll.options.mRoll; //@ts-expect-error

          dmg[key] = hasDamage ? Object.keys(dmg).length === 0 || !mRoll ? dmgRoll : await dmgRoll.reroll() : null; //@ts-expect-error

          dmgHTML[key] = hasDamage ? await dmg[key].render() : null;
        }
      }
    } else {
      //@ts-expect-error
      atk[0] = hasAttack ? await this.rollAttack(mRoll) : null; //@ts-expect-error

      mRoll = atk[0] ? atk[0].options.mRoll : false; //@ts-expect-error

      atkHTML[0] = hasAttack ? await atk[0].render() : null;
    } //@ts-expect-error


    targets.size !== 0 ? mRoll ? "multiAttack" : "oneAttack" : "noTarget";
    const templateData = {
      //@ts-expect-error
      actor: this.actor.data,
      tokenId: (token === null || token === void 0 ? void 0 : token.uuid) || null,
      item: this.data,
      data: this.getChatData(),
      //@ts-expect-error
      labels: this.labels,
      hasAttack,
      hasDamage,
      atk,
      atkHTML,
      targets,
      //@ts-expect-error
      owner: this.actor.isOwner || game.user.isGM,
      dc,
      result,
      hit,
      dmgHTML,
      dieResultCss
    };
    const html = await renderTemplate(`systems/ard20/templates/chat/item-card-multiAttack.html`, templateData); // Create the ChatMessage data object

    const chatData = {
      user: game.user.data._id,
      type: CONST.CHAT_MESSAGE_TYPES.OTHER,
      content: html,
      //@ts-expect-error
      flavor: this.data.data.chatFlavor || this.name,
      //@ts-expect-error
      speaker: ChatMessage.getSpeaker({
        actor: this.actor,
        token
      }),
      flags: {
        "core.canPopout": true
      }
    }; // If the Item was destroyed in the process of displaying its card - embed the item data in the chat message

    /*
    if (this.data.type === "consumable" && !this.actor.items.has(this.id)) {
      chatData.flags["ard20.itemData"] = this.data;
    }*/
    // Apply the roll mode to adjust message visibility

    ChatMessage.applyRollMode(chatData, rollMode || game.settings.get("core", "rollMode")); // Create the Chat Message or return its data

    return createMessage ? ChatMessage.create(chatData) : chatData;
  }
  /**
   * Prepare an object of chat data used to display a card for the Item in the chat log.
   * @param {object} htmlOptions    Options used by the TextEditor.enrichHTML function.
   * @returns {object}              An object of chat data to render.
   */


  getChatData(htmlOptions = {}) {
    const data = foundry.utils.deepClone(this.data.data); // Rich text description

    /*if (data.hasOwnProperty("equipped") && !["loot", "tool"].includes(this.data.type)) {
      /*if (data.attunement === CONFIG.ARd20.attunementTypes.REQUIRED) {
        props.push(game.i18n.localize(CONFIG.ARd20.attunements[CONFIG.ARd20.attunementTypes.REQUIRED]));
      }*/

    /*props.push(game.i18n.localize(data.equipped ? "ARd20.Equipped" : "ARd20.Unequipped"));
    }
          // Ability activation properties
    if (data.hasOwnProperty("activation")) {
      props.push(labels.activation + (data.activation?.condition ? ` (${data.activation.condition})` : ""), labels.target, labels.range, labels.duration);
    }
          // Filter properties and return
    data.properties = props.filter((p) => !!p);
    */

    return data;
  }
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


  async rollAttack(mRoll = Boolean(), canMult = Boolean(), options = {}) {
    var _options$parts;

    console.log(canMult);
    this.data.data; //@ts-expect-error

    this.actor.data.flags.ard20 || {};
    let title = `${this.name} - ${game.i18n.localize("ARd20.AttackRoll")}`;
    const {
      parts,
      rollData
    } = this.getAttackToHit();
    const targets = game.user.targets; //@ts-expect-error

    if (((_options$parts = options.parts) === null || _options$parts === void 0 ? void 0 : _options$parts.length) > 0) {
      //@ts-expect-error
      parts.push(...options.parts);
    }

    let rollConfig = {
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
    }; //@ts-expect-error

    rollConfig = mergeObject(rollConfig, options); //@ts-expect-error

    const roll = await d20Roll(rollConfig);
    if (roll === false) return null;
    return roll;
  }

  rollDamage({
    critical = false,
    event = null,
    spellLevel = null,
    versatile = false,
    options = {},
    mRoll = Boolean(),
    canMult = Boolean()
  } = {}) {
    var _ref;

    console.log(canMult);
    const iData = this.data.data;
    this.actor.data.data; //@ts-expect-error

    const parts = iData.damage.current.parts.map(d => d[0]); //@ts-expect-error

    const damType = iData.damage.current.parts.map(d => d[1].map((c, ind) => {
      //@ts-expect-error
      let a = game.i18n.localize(CONFIG.ARd20.DamageTypes[c[0]]); //@ts-expect-error

      let b = game.i18n.localize(CONFIG.ARd20.DamageSubTypes[c[1]]);
      let obj = {
        key: ind,
        label: `${a} ${b}`
      };
      return obj;
    })); //@ts-expect-error

    options.damageType = iData.damage.current.parts.map(d => d[1]);
    const hasAttack = false;
    const hasDamage = true; //@ts-expect-error

    const rollData = this.getRollData(hasAttack, hasDamage);
    const rollConfig = {
      actor: this.actor,
      //@ts-expect-error
      critical: (_ref = critical !== null && critical !== void 0 ? critical : event === null || event === void 0 ? void 0 : event.altkey) !== null && _ref !== void 0 ? _ref : false,
      data: rollData,
      event: event,
      parts: parts,
      canMult: canMult,
      damType: damType,
      mRoll: mRoll
    }; //@ts-expect-error

    return damageRoll(mergeObject(rollConfig, options));
  }
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


  getAttackToHit() {
    const itemData = this.data.data;
    const hasAttack = true;
    const hasDamage = false; //if (!this.hasAttack || !itemData) return;
    //@ts-expect-error

    const rollData = this.getRollData(hasAttack, hasDamage);
    console.log("ROLL DATA", rollData); // Define Roll bonuses

    const parts = []; // Include the item's innate attack bonus as the initial value and label
    //@ts-expect-error

    if (itemData.attackBonus) {
      //@ts-expect-error
      parts.push(itemData.attackBonus); //@ts-expect-error

      this.labels.toHit = itemData.attackBonus;
    } // Take no further action for un-owned items


    if (!this.isOwned) return {
      rollData,
      parts
    }; // Ability score modifier

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
    //@ts-expect-error

    const roll = new Roll(parts.join("+"), rollData); //@ts-expect-error

    const formula = simplifyRollFormula(roll.formula); //@ts-expect-error

    this.labels.toHit = !/^[+-]/.test(formula) ? `+ ${formula}` : formula; // Update labels and return the prepared roll data

    return {
      rollData,
      parts
    };
  }

}

/**
 * Manage Active Effect instances through the Actor Sheet via effect control buttons.
 * @param {MouseEvent} event      The left-click event on the effect control
 * @param {Actor|Item} owner      The owning entity which manages this effect
 */
function onManageActiveEffect(event, owner) {
  event.preventDefault();
  const a = event.currentTarget; //@ts-expect-error

  const li = a.closest("li");
  const effect = li.dataset.effectId ? owner.effects.get(li.dataset.effectId) : null; //@ts-expect-error

  switch (a.dataset.action) {
    case "create":
      return owner.createEmbeddedDocuments("ActiveEffect", [{
        label: "New Effect",
        icon: "icons/svg/aura.svg",
        origin: owner.uuid,
        "duration.rounds": li.dataset.effectType === "temporary" ? 1 : undefined,
        disabled: li.dataset.effectType === "inactive"
      }]);

    case "edit":
      return effect.sheet.render(true);

    case "delete":
      return effect.delete();

    case "toggle":
      return effect.update({
        disabled: !effect.data.disabled
      });
  }
}
/**
 * Prepare the data structure for Active Effects which are currently applied to an Actor or Item.
 * @param {ActiveEffect[]} effects    The array of Active Effect instances to prepare sheet data for
 * @return {object}                   Data for rendering
 */

function prepareActiveEffectCategories(effects) {
  // Define effect header categories
  const categories = {
    temporary: {
      type: "temporary",
      label: "Temporary Effects",
      effects: []
    },
    passive: {
      type: "passive",
      label: "Passive Effects",
      effects: []
    },
    inactive: {
      type: "inactive",
      label: "Inactive Effects",
      effects: []
    }
  }; // Iterate over active effects, classifying them into categories

  for (let e of effects) {
    //@ts-expect-error
    e._getSourceName(); // Trigger a lookup for the source name
    //@ts-expect-error


    if (e.data.disabled) categories.inactive.effects.push(e); //@ts-expect-error
    else if (e.isTemporary) categories.temporary.effects.push(e); //@ts-expect-error
    else categories.passive.effects.push(e);
  }

  return categories;
}

class CharacterAdvancement extends FormApplication {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["ard20"],
      title: "Character Advancement",
      template: "systems/ard20/templates/actor/parts/actor-adv.html",
      id: "actor-adv",
      width: 1000,
      height: "auto",
      tabs: [{
        navSelector: ".sheet-tabs",
        contentSelector: ".sheet-body",
        initial: "stats"
      }],
      closeOnSubmit: false
    });
  }

  async InitilizeData() {
    var _startingData$feats$a;

    if (this.form) return;
    const pack = await this.getPacks();
    const folder = this.getFolders();
    const rList = await this.getRacesList(pack, folder);
    const fList = await this.getFeaturesList(pack, folder);
    const actorData = this.object.data.data;
    const startingData = {
      isReady: duplicate(actorData.isReady),
      attributes: duplicate(actorData.attributes),
      skills: duplicate(actorData.skills),
      xp: duplicate(actorData.advancement.xp),
      profs: duplicate(actorData.proficiencies),
      health: duplicate(actorData.health),
      races: {
        list: rList,
        chosen: ""
      },
      count: {
        // counter for skills and feats
        skills: {
          // count skills by their level
          0: 0,
          1: 0,
          2: 0,
          3: 0,
          4: 0
        },
        feats: {
          // count feats by their source
          mar: 0,
          mag: 0,
          div: 0,
          pri: 0,
          psy: 0
        }
      },
      content: {
        // descriptions for skills and feats
        skills: {},
        feats: {}
      },
      feats: {
        learned: fList.learnedFeatures,
        awail: fList.temp_feat_list // array of feats that are available to learn

      },
      allow: {
        attribute: actorData.isReady,
        race: actorData.isReady,
        final: actorData.isReady
      },
      hover: {
        attribute: "",
        skill: "",
        race: "",
        feat: ""
      }
    };
    startingData.xp.get = startingData.isReady || startingData.xp.used !== 0 ? startingData.xp.get : 10000;
    let awailFeats = startingData.feats.awail;
    let name_array = [];

    for (let i of startingData.feats.learned) {
      name_array.push(i.name);
    }

    awailFeats.forEach((v, k) => {
      if (name_array.includes(v.name)) {
        console.log("this item is already learned", awailFeats[k]);
        awailFeats[k] = foundry.utils.deepClone(startingData.feats.learned.filter(item => item.name === v.name)[0]);
      }
    });
    awailFeats = awailFeats.filter(item => {
      if (item.type === "feature") return !name_array.includes(item.name) || item.data.level.current !== item.data.level.max;
    });
    startingData.feats.awail = awailFeats; // count skills by rank

    for (let [k, v] of obj_entries$1(CONFIG.ARd20.Skills)) {
      if (startingData.skills[k].level === 0) {
        startingData.count.skills[0] += 1;
      } else if (startingData.skills[k].level === 1) {
        startingData.count.skills[1] += 1;
      } else if (startingData.skills[k].level === 2) {
        startingData.count.skills[2] += 1;
      }
    } // count feats by source


    for (let v of startingData.feats.learned) {
      console.log(v);
      if (v.type === "feature") v.data.source.value.forEach(val => {
        console.log(val);
        startingData.count.feats[val] += 1;
      });
    }

    startingData.hover.feat = TextEditor.enrichHTML((_startingData$feats$a = startingData.feats.awail[0]) === null || _startingData$feats$a === void 0 ? void 0 : _startingData$feats$a.data.description);
    return startingData;
  }

  async getPacks() {
    let pack_list = []; // array of feats from Compendium

    let pack_name = [];

    for (const key of game.settings.get("ard20", "feat").packs) {
      if (game.packs.filter(pack => pack.metadata.label === key).length !== 0) {
        let feat_list = [];
        feat_list.push(Array.from(game.packs.filter(pack => pack.metadata.label === key && pack.documentName === "Item")[0].index));
        feat_list = feat_list.flat();

        for (const feat of feat_list) {
          if (feat instanceof ARd20Item) {
            const new_key = game.packs.filter(pack => pack.metadata.label === key)[0].metadata.package + "." + key;
            const doc = await game.packs.get(new_key).getDocument(feat.id);

            if (doc instanceof ARd20Item) {
              const item = doc.toObject();
              item.data = foundry.utils.deepClone(doc.data.data);
              pack_list.push(item);
              pack_name.push(item.name);
            }
          }
        }

        pack_list = pack_list.flat();
      }
    }

    return {
      pack_list,
      pack_name
    };
  }

  getFolders() {
    let folder_list = []; // array of feats from game folders

    let folder_name = [];

    for (let key of game.settings.get("ard20", "feat").folders) {
      if (game.folders.filter(folder => folder.data.name === key).length !== 0) {
        let feat_list = [];
        feat_list.push(game.folders.filter(folder => folder.data.name === key && folder.data.type === "Item")[0].contents);
        feat_list = feat_list.flat();

        for (let feat of feat_list) {
          if (feat instanceof ARd20Item) {
            console.log("item added from folder ", feat);
            const item = feat.toObject();
            item.data = foundry.utils.deepClone(feat.data.data);
            folder_list.push(item);
            folder_name.push(item.name);
          }
        }

        folder_list = folder_list.flat();
      }
    }

    return {
      folder_list,
      folder_name
    };
  }

  async getRacesList(pack, folder) {
    const pack_list = pack.pack_list;
    const pack_name = pack.pack_name;
    const folder_list = folder.folder_list;
    let race_pack_list = [];
    let race_folder_list = [];
    pack_list.forEach(item => {
      if (item.type === "race") {
        let raceItem = _objectSpread2(_objectSpread2({}, item), {}, {
          chosen: false
        });

        race_pack_list.push(raceItem);
      }
    });
    folder_list.forEach(item => {
      if (item.type === "race") {
        let raceItem = _objectSpread2(_objectSpread2({}, item), {}, {
          chosen: false
        });

        race_folder_list.push(raceItem);
      }
    });
    return race_pack_list.concat(race_folder_list.filter(item => !pack_name.includes(item.name)));
  }

  async getFeaturesList(pack, folder) {
    const pack_list = pack.pack_list;
    const pack_name = pack.pack_name;
    const folder_list = folder.folder_list;
    let feat_pack_list = [];
    pack_list.forEach(item => {
      if (item.type === "feature") {
        let FeatureItem = _objectSpread2(_objectSpread2({}, item), {}, {
          currentXP: 0,
          isEq: false,
          isXP: false
        });

        feat_pack_list.push(FeatureItem);
      }
    });
    let feat_folder_list = [];
    folder_list.forEach(item => {
      if (item.type === "feature") {
        let FeatureItem = _objectSpread2(_objectSpread2({}, item), {}, {
          currentXP: 0,
          isEq: false,
          isXP: false
        });

        feat_folder_list.push(FeatureItem);
      }
    });
    let temp_feat_list = feat_pack_list.concat(feat_folder_list.filter(item => !pack_name.includes(item.name)));
    let learnedFeatures = [];
    this.object.itemTypes.feature.forEach(item => {
      if (item.data.type === "feature") {
        let FeatureItem = _objectSpread2(_objectSpread2({}, item.data), {}, {
          currentXP: 0,
          isEq: false
        });

        learnedFeatures.push(FeatureItem);
      }
    });
    return {
      temp_feat_list,
      learnedFeatures
    };
  }

  async getData() {
    this.options.data = !this.form ? await this.InitilizeData() : this.options.data;
    const templateData = this.options.data;
    const count = templateData.count;
    const attributes = templateData.attributes;
    const xp = templateData.xp;
    const raceList = templateData.races.list;
    const raceChosen = templateData.races.chosen;
    const isReady = templateData.isReady;
    const skills = templateData.skills;
    const featsAwail = templateData.feats.awail;
    const featsLearned = templateData.feats.learned;
    const health = templateData.health;
    count.feats.all = 0;
    count.feats.all = Object.values(count.feats).reduce(function (a, b) {
      return a + b;
    }, 0);
    /*
     * Calculate attributes' modifiers and xp cost
     */

    for (let [k, v] of obj_entries$1(CONFIG.ARd20.Attributes)) {
      var _raceList$filter$0$da, _raceList$filter, _raceList$filter$;

      const race_abil = (_raceList$filter$0$da = (_raceList$filter = raceList.filter(race => race.chosen === true)) === null || _raceList$filter === void 0 ? void 0 : (_raceList$filter$ = _raceList$filter[0]) === null || _raceList$filter$ === void 0 ? void 0 : _raceList$filter$.data.bonus.attributes[k].value) !== null && _raceList$filter$0$da !== void 0 ? _raceList$filter$0$da : 0;
      attributes[k].mod = Math.floor((attributes[k].value - 10) / 2);
      attributes[k].xp = CONFIG.ARd20.AbilXP[attributes[k].value - 5];
      attributes[k].isEq = attributes[k].value === this.object.data.data.attributes[k].value;
      attributes[k].isXP = xp.get < attributes[k].xp;
      attributes[k].total = isReady ? attributes[k].value : attributes[k].value + race_abil;
      attributes[k].mod = Math.floor((attributes[k].total - 10) / 2);
    }
    /*
     * Calculate skills' xp cost
     */


    for (let [k, v] of obj_entries$1(CONFIG.ARd20.Skills)) {
      var _game$i18n$localize;

      templateData.skills[k].rankName = (_game$i18n$localize = game.i18n.localize(CONFIG.ARd20.Rank[templateData.skills[k].level])) !== null && _game$i18n$localize !== void 0 ? _game$i18n$localize : CONFIG.ARd20.Rank[templateData.skills[k].level];
      templateData.skills[k].xp = templateData.skills[k].level < 2 ? CONFIG.ARd20.SkillXP[templateData.skills[k].level][templateData.count.skills[templateData.skills[k].level + 1]] : false;
      templateData.skills[k].isEq = templateData.skills[k].level === this.object.data.data.skills[k].level;
      templateData.skills[k].isXP = templateData.xp.get < templateData.skills[k].xp || templateData.skills[k].level > 1;
    }

    for (let v of templateData.profs.weapon) {
      var _game$i18n$localize2;

      //@ts-expect-error
      v.value_hover = (_game$i18n$localize2 = game.i18n.localize(CONFIG.ARd20.Rank[v.value])) !== null && _game$i18n$localize2 !== void 0 ? _game$i18n$localize2 : CONFIG.ARd20.Rank[v.value];
    }
    /*
     * Calculate features cost and their availattribute
     */


    featsAwail.forEach(object => {
      if (object.type === "feature") {
        let pass = [];
        object.pass = [];
        let allCount = templateData.count.feats.all;
        let featCount = 0;
        object.data.source.value.forEach(val => featCount += templateData.count.feats[val]);

        for (let i = object.data.level.initial; i < object.data.level.max; i++) {
          object.data.xp.AdvancedCost[i] = object.data.xp.basicCost[i] ? Math.ceil(object.data.xp.basicCost[i] * (1 + 0.01 * (allCount - featCount)) / 5) * 5 : 0;
        }

        object.currentXP = object.data.xp.AdvancedCost[object.data.level.initial];
        object.isEq = object.data.level.initial === object.data.level.current || object.data.level.initial === 0;
        object.isXP = object.data.level.initial === object.data.level.max || object.data.xp.AdvancedCost[object.data.level.initial] > templateData.xp.get;
        object.data.req.values.forEach(r => {
          var _featsAwail$filter, _featsLearned$filter;

          switch (r.type) {
            case "attribute":
              //check if character's attribute is equal or higher than value entered in feature requirements
              //@ts-expect-error
              r.pass.forEach((_item, index) => r.pass[index] = r.input[index] <= attributes[r.value].total);
              break;

            case "skill":
              //check if character's skill rank is equal or higher than value entered in feature requirements
              //@ts-expect-error
              r.pass.forEach((_item, index) => r.pass[index] = r.input[index] <= skills[r.value].level);
              break;

            case "feat":
              //check if character has features (and their level is equal or higher) that listed in feature requirements
              if (((_featsAwail$filter = featsAwail.filter(item => item.name === r.name)) === null || _featsAwail$filter === void 0 ? void 0 : _featsAwail$filter[0]) !== undefined) {
                const featLevel = featsAwail.filter(item => item.name === r.name)[0].data.level.initial;
                r.pass.forEach((_item, index) => r.pass[index] = r.input[index] <= featLevel);
              } else if (((_featsLearned$filter = featsLearned.filter(item => item.name === r.name)) === null || _featsLearned$filter === void 0 ? void 0 : _featsLearned$filter[0]) !== undefined) {
                const featLevel = featsLearned.filter(item => item.name === r.name)[0].data.level.initial;
                r.pass.forEach((_item, index) => r.pass[index] = r.input[index] <= featLevel);
              }

              break;
          }

          pass.push(r.pass);
        });
        object.pass = [];
        /*
         * Check the custom logic in feature requirements. For example "Strength 15 OR Arcana Basic"
         */

        for (let i = 0; i <= object.data.level.initial; i++) {
          if (i === object.data.level.max || pass.length === 0) break;
          let exp = object.data.req.logic[i];
          let lev_array = exp.match(/\d*/g).filter(item => item !== "");
          console.log(lev_array);
          let f = {};
          lev_array.forEach(item => {
            exp = exp.replace(item, `c${item}`);
            f["c" + item] = pass[parseInt(item) - 1][i];
          }); //@ts-expect-error

          let filter = filtrex.compileExpression(exp);
          object.pass[i] = Boolean(filter(f));
        }

        object.isXP = object.pass[object.data.level.initial] || object.pass.length === 0 ? object.isXP : true;
      }
    });
    /*
     * Calculate starting HP based on character's CON and race
     */

    raceList.forEach(race => {
      race.chosen = raceChosen === race._id ? true : false;
    });
    let raceHP = 0;
    raceList.forEach(race => {
      if (race._id === raceChosen) {
        raceHP = race.data.health;
      }
    });
    health.max = attributes.con.value + raceHP; // At character creation, check all conditions

    if (!this.object.data.data.isReady) {
      let abil_sum = 0;

      for (let [key, abil] of obj_entries$1(templateData.attributes)) {
        abil_sum += abil.value;
      }

      templateData.allow.attribute = abil_sum >= 60 && abil_sum <= 80 ? true : false;
      templateData.allow.race = Boolean(templateData.races.chosen) ? true : false;
      let allow_list = [];

      for (let [key, item] of obj_entries$1(templateData.allow)) {
        if (key === "final") {
          continue;
        }

        allow_list.push(item);
      }

      templateData.allow.final = !allow_list.includes(false) || templateData.isReady ? true : false;
    }
    /*
     * Final Template Data
     */


    console.log(this.form);
    console.log(templateData);
    return templateData;
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find(".change").on("click", this._onChange.bind(this));
    html.find("td:not(.description)").on("mouseover", this._onHover.bind(this));
  } //@ts-expect-error


  _onChange(event) {
    var _CONFIG$ARd20$AbilXP, _CONFIG$ARd20$AbilXP2;

    const button = event.currentTarget;
    const data = this.options.data;

    switch (button.dataset.type) {
      case "attribute":
        switch (button.dataset.action) {
          case "plus":
            //@ts-expect-error
            data.attributes[button.dataset.key].value += 1; //@ts-expect-error

            data.xp.get -= data.attributes[button.dataset.key].xp; //@ts-expect-error

            data.xp.used += data.attributes[button.dataset.key].xp;
            break;

          case "minus":
            //@ts-expect-error
            data.attributes[button.dataset.key].value -= 1;
            data.xp.get += //@ts-expect-error
            (_CONFIG$ARd20$AbilXP = CONFIG.ARd20.AbilXP[data.attributes[button.dataset.key].value - 5]) !== null && _CONFIG$ARd20$AbilXP !== void 0 ? _CONFIG$ARd20$AbilXP : //@ts-expect-error
            CONFIG.ARd20.AbilXP[data.attributes[button.dataset.key].value - 5];
            data.xp.used -= //@ts-expect-error
            (_CONFIG$ARd20$AbilXP2 = CONFIG.ARd20.AbilXP[data.attributes[button.dataset.key].value - 5]) !== null && _CONFIG$ARd20$AbilXP2 !== void 0 ? _CONFIG$ARd20$AbilXP2 : //@ts-expect-error
            CONFIG.ARd20.AbilXP[data.attributes[button.dataset.key].value - 5];
            break;
        }

        break;

      case "skill":
        switch (button.dataset.action) {
          case "plus":
            //@ts-expect-error
            data.skills[button.dataset.key].level += 1; //@ts-expect-error

            data.xp.get -= data.skills[button.dataset.key].xp; //@ts-expect-error

            data.xp.used += data.skills[button.dataset.key].xp; //@ts-expect-error

            data.count.skills[data.skills[button.dataset.key].level] += 1;
            break;

          case "minus":
            //@ts-expect-error
            data.skills[button.dataset.key].level -= 1; //@ts-expect-error

            data.count.skills[data.skills[button.dataset.key].level + 1] -= 1;
            data.xp.get += //@ts-expect-error
            CONFIG.ARd20.SkillXP[data.skills[button.dataset.key].level][//@ts-expect-error
            data.count.skills[data.skills[button.dataset.key].level + 1]];
            data.xp.used -= //@ts-expect-error
            CONFIG.ARd20.SkillXP[data.skills[button.dataset.key].level][//@ts-expect-error
            data.count.skills[data.skills[button.dataset.key].level + 1]];
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
            data.feats.awail[button.dataset.key].data.source.value.forEach(val => data.count.feats[val] += data.feats.awail[button.dataset.key].data.level.initial === 0 ? 1 : 0);
            data.xp.get -= data.feats.awail[button.dataset.key].data.xp.AdvancedCost[data.feats.awail[button.dataset.key].data.level.initial];
            data.xp.used += data.feats.awail[button.dataset.key].data.xp.AdvancedCost[data.feats.awail[button.dataset.key].data.level.initial];
            data.feats.awail[button.dataset.key].data.level.initial += 1;
            break;

          case "minus":
            data.feats.awail[button.dataset.key].data.level.initial -= 1;
            data.feats.awail[button.dataset.key].data.source.value.forEach(val => data.count.feats[val] -= data.feats.awail[button.dataset.key].data.level.initial === 0 ? 1 : 0);
            data.xp.get += data.feats.awail[button.dataset.key].data.xp.AdvancedCost[data.feats.awail[button.dataset.key].data.level.initial];
            data.xp.used -= data.feats.awail[button.dataset.key].data.xp.AdvancedCost[data.feats.awail[button.dataset.key].data.level.initial];
            break;
        }

        break;
    }

    this.render();
  } //@ts-expect-error


  _onChangeInput(event) {
    super._onChangeInput(event);

    const data = this.options.data;
    const k = parseInt(event.currentTarget.dataset.key);
    data.races.list.forEach((race, key) => {
      data.races.list[key].chosen = key === k ? true : false;
      data.races.chosen = data.races.list[key].chosen ? race._id : data.races.chosen;
    });
    this.render();
  } //@ts-expect-error


  _onHover(event) {
    var _tr$nextElementSiblin, _tr$previousElementSi, _tr$previousElementSi2;

    event.preventDefault();
    const data = this.options.data;
    const element = event.currentTarget;
    const table = element.closest("div.tab");
    const tr = element.closest("tr");
    const trDOM = tr.querySelectorAll("td:not(.description)");
    const tdDesc = table.querySelector("td.description");
    const bColor = window.getComputedStyle(element).getPropertyValue("background-color");
    tdDesc.style["background-color"] = bColor; //@ts-expect-error

    trDOM === null || trDOM === void 0 ? void 0 : trDOM.forEach(td => {
      td.classList.toggle("chosen", event.type == "mouseenter");

      if (td.nextElementSibling === null || td.nextElementSibling.classList[0] === "description") {
        td.classList.toggle("last", event.type == "mouseenter");
      }
    });
    (_tr$nextElementSiblin = tr.nextElementSibling) === null || _tr$nextElementSiblin === void 0 ? void 0 : _tr$nextElementSiblin.querySelectorAll("td:not(.description)") //@ts-expect-error
    .forEach(td => td.classList.toggle("under-chosen", event.type == "mouseenter"));
    (_tr$previousElementSi = tr.previousElementSibling) === null || _tr$previousElementSi === void 0 ? void 0 : _tr$previousElementSi.querySelectorAll("th:not(.description)") //@ts-expect-error
    .forEach(th => th.classList.toggle("over-chosen", event.type == "mouseenter"));
    (_tr$previousElementSi2 = tr.previousElementSibling) === null || _tr$previousElementSi2 === void 0 ? void 0 : _tr$previousElementSi2.querySelectorAll("td:not(.description)") //@ts-expect-error
    .forEach(td => td.classList.toggle("over-chosen", event.type == "mouseenter"));
    const type = table.dataset.tab;
    if (type !== "feats") return;
    const key = tr.dataset.key;
    const hover_desc = TextEditor.enrichHTML(data.feats.awail[key].data.description);
    if (hover_desc === data.hover.feat) return;
    data.hover.feat = hover_desc;
    this.render();
  }

  async _updateObject(_event, formData) {
    let updateData = expandObject(formData);
    const actor = this.object;
    const data = this.options.data;
    this.render();
    const obj = {};

    for (let [key, abil] of obj_entries$1(data.attributes)) {
      obj[`data.attributes.${key}.value`] = data.attributes[key].total;
    }

    obj["data.health.max"] = data.health.max;

    if (data.isReady) {
      obj["data.advancement.xp"] = updateData.xp;
    }

    obj["data.skills"] = updateData.skills;
    obj["data.profs"] = updateData.profs;
    obj["data.isReady"] = data.allow.final;
    console.log(obj);
    const feats_data = {
      new: [],
      exist: []
    };
    const feats = data.feats.awail.filter(item => item.data.level.initial > item.data.level.current);
    feats.forEach((awItem, _index) => {
      if (data.feats.learned.length > 0) {
        data.feats.learned.forEach((learnedItem, _index) => {
          if (awItem._id === learnedItem._id) {
            feats_data.exist.push(awItem);
          } else {
            feats_data.new.push(awItem);
          }
        });
      } else {
        feats_data.new.push(awItem);
      }
    });
    let pass = [];
    feats_data.exist.forEach(item => {
      //@ts-expect-error
      pass.push(item.pass.slice(0, item.pass.length - 1));
    });
    feats_data.new.forEach(item => {
      //@ts-expect-error
      pass.push(item.pass.slice(0, item.pass.length - 1));
    });
    pass = pass.flat();
    console.log(pass);

    if (!data.isReady && !data.allow.final) {
      ui.notifications.error(`Something not ready for your character to be created. Check the list`);
    } else if (pass.includes(false)) {
      ui.notifications.error(`Some changes in your features do not comply with the requirements`);
    } else {
      await actor.update(obj);

      if (actor.itemTypes.race.length === 0) {
        let race_list = this.options.data.races.list.filter(race => race.chosen === true); //@ts-expect-error

        await actor.createEmbeddedDocuments("Item", race_list);
      }

      if (feats_data.exist.length > 0) {
        await actor.updateEmbeddedDocuments("Item", feats_data.exist.map(item => ({
          _id: item._id,
          "data.level.initial": item.data.level.initial
        })));
      }

      if (feats_data.new.length > 0) {
        //@ts-expect-error
        await actor.createEmbeddedDocuments("Item", feats_data.new);
      }

      this.close();
    }
  }

}

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */

class ARd20ActorSheet extends ActorSheet {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["ard20", "sheet", "actor"],
      template: "systems/ard20/templates/actor/actor-sheet.html",
      width: 600,
      height: 600,
      tabs: [{
        navSelector: ".sheet-tabs",
        contentSelector: ".sheet-body",
        initial: "main"
      }]
    });
  }
  /** @override */


  get template() {
    return `systems/ard20/templates/actor/actor-${this.actor.data.type}-sheet.html`;
  }
  /* -------------------------------------------- */

  /** @override */


  getData() {
    // Retrieve the data structure from the base sheet. You can inspect or log
    // the context variable to see the structure, but some key properties for
    // sheets are the actor object, the data object, whether or not it's
    // editable, the items array, and the effects array.
    const context = super.getData(); // Use a safe clone of the actor data for further operations.

    const actorData = this.actor.data; // Add the actor's data to context.data for easier access, as well as flags.
    //@ts-expect-error

    context.data = actorData.data; //@ts-expect-error

    context.flags = actorData.flags; //@ts-expect-error

    context.config = CONFIG.ARd20; //@ts-expect-error

    context.isGM = game.user.isGM; // Prepare character data and items.

    if (actorData.type === "character") {
      //@ts-expect-error
      this._prepareItems(context);

      this._prepareCharacterData(context);
    } // Prepare NPC data and items.
    //@ts-expect-error


    if (actorData.type === "npc") {
      //@ts-expect-error
      this._prepareItems(context);
    } // Add roll data for TinyMCE editors.
    //@ts-expect-error


    context.rollData = context.actor.getRollData(); // Prepare active effects
    //@ts-expect-error

    context.effects = prepareActiveEffectCategories(this.actor.effects);
    return context;
  }
  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  //@ts-expect-error


  _prepareCharacterData(context) {
    // Handle ability scores.
    for (let [k, v] of obj_entries$1(context.data.attributes)) {
      var _game$i18n$localize;

      //@ts-expect-error
      v.label = (_game$i18n$localize = game.i18n.localize(getValues$1(CONFIG.ARd20.Attributes, k))) !== null && _game$i18n$localize !== void 0 ? _game$i18n$localize : k;
    }

    for (let [k, v] of obj_entries$1(context.data.skills)) {
      var _game$i18n$localize2, _game$i18n$localize3;

      //@ts-expect-error
      v.name = (_game$i18n$localize2 = game.i18n.localize(getValues$1(CONFIG.ARd20.Skills, k))) !== null && _game$i18n$localize2 !== void 0 ? _game$i18n$localize2 : k;
      v.rank_name = (_game$i18n$localize3 = game.i18n.localize(getValues$1(CONFIG.ARd20.Rank, v.rank))) !== null && _game$i18n$localize3 !== void 0 ? _game$i18n$localize3 : v.rank;
    }
  }
  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */


  _prepareItems(context) {
    // Initialize containers.
    const gear = [];
    const features = [];
    const weapons = [];
    const armor = [];
    const spells = {
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
    }; // Iterate through items, allocating to containers

    for (let i of context.items) {
      //@ts-expect-error
      i.img = i.img || DEFAULT_TOKEN; // Append to gear.

      if (i.type === "item") {
        gear.push(i);
      } // Append to features.
      else if (i.type === "feature") {
        features.push(i);
      } // Append to spells.
      else if (i.type === "spell") {
        //@ts-expect-error
        if (i.data.spellLevel != undefined) {
          //@ts-expect-error
          spells[i.data.spellLevel].push(i);
        }
      } else if (i.type === "armor" || i.type === "weapon") {
        const isActive = getProperty(i.data, "equipped"); //@ts-expect-error

        i.toggleClass = isActive ? "active" : ""; //@ts-expect-error

        i.toggleTitle = game.i18n.localize(isActive ? "ARd20.Equipped" : "ARd20.Unequipped"); //@ts-expect-error

        i.data.equipped = !isActive;
        if (i.type === "armor") armor.push(i);else weapons.push(i);
      }
    } // Assign and return
    //@ts-expect-error


    context.gear = gear; //@ts-expect-error

    context.features = features; //@ts-expect-error

    context.spells = spells; //@ts-expect-error

    context.weapons = weapons; //@ts-expect-error

    context.armor = armor;
  }
  /* -------------------------------------------- */

  /** @override */


  activateListeners(html) {
    super.activateListeners(html); //@ts-expect-error

    $(".select2", html).select2(); // Render the item sheet for viewing/editing prior to the editable check.

    html.find(".item-toggle").click(this._onToggleItem.bind(this));
    html.find(".item-edit").click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.sheet.render(true);
    }); // -------------------------------------------------------------
    // Everything below here is only needed if the sheet is editable

    if (!this.isEditable) return; // Add Inventory Item

    html.find(".item-create").click(this._onItemCreate.bind(this)); // Delete Inventory Item

    html.find(".item-delete").click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.delete();
      li.slideUp(200, () => this.render(false));
    }); // Active Effect management

    html.find(".effect-control").click(ev => onManageActiveEffect(ev, this.actor)); //roll abilities and skills

    html.find(".ability-name").click(this._onRollAbilityTest.bind(this));
    html.find(".skill-name").click(this._onRollSkillCheck.bind(this)); //open "character advancement" window

    html.find(".config-button").click(this._OnAdvanceMenu.bind(this)); //item's roll

    html.find(".item-roll").click(this._onItemRoll.bind(this)); // Drag events for macros.

    if (this.actor.isOwner) {
      let handler = ev => this._onDragStart(ev);

      html.find("li.item").each((i, li) => {
        if (li.classList.contains("inventory-header")) return;
        li.setAttribute("draggable", "true");
        li.addEventListener("dragstart", handler, false);
      });
    }
  }
  /**
   * Open @class CharacterAdvancement
   */


  _OnAdvanceMenu(event) {
    var _button$dataset, _app;

    event.preventDefault();
    const button = event.currentTarget;
    let app; //@ts-ignore

    switch ((_button$dataset = button.dataset) === null || _button$dataset === void 0 ? void 0 : _button$dataset.action) {
      case "adv":
        app = new CharacterAdvancement(this.object);
        break;
    }

    (_app = app) === null || _app === void 0 ? void 0 : _app.render(true);
  }
  /**
   * Change @param data.equipped
   * by toggling it on sheet
   */


  _onToggleItem(event) {
    event.preventDefault(); //@ts-ignore

    const itemid = event.currentTarget.closest(".item").dataset.itemId;
    const item = this.actor.items.get(itemid); //const attr = item.data.type === "spell" ? "data.preparation.prepared" : "data.equipped";

    const attr = "data.equipped";
    return item.update({
      [attr]: !getProperty(item.data, attr)
    });
  }

  _onRollAbilityTest(event) {
    event.preventDefault(); //@ts-ignore

    let ability = event.currentTarget.parentElement.dataset.ability;
    return this.actor.rollAbilityTest(ability, {
      event: event
    });
  }

  _onRollSkillCheck(event) {
    event.preventDefault(); //@ts-ignore

    let skill = event.currentTarget.parentElement.dataset.skill;
    return this.actor.rollSkill(skill, {
      event: event
    });
  }

  _onItemRoll(event) {
    event.preventDefault();
    console.log("БРОСОК"); //@ts-ignore

    const id = event.currentTarget.closest(".item").dataset.itemId;
    const item = this.actor.items.get(id);
    const hasAttack = item.data.data.hasAttack;
    const hasDamage = item.data.data.hasDamage; //@ts-expect-error

    if (item) return item.roll({
      hasAttack,
      hasDamage
    });
  }
  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */


  async _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget; // Get the type of item to create.
    //@ts-ignore

    const type = header.dataset.type; // Grab any data associated with this control.
    //@ts-ignore

    const data = duplicate(header.dataset); // Initialize a default name.

    const name = `New ${type.capitalize()}`; // Prepare the item object.

    const itemData = {
      name: name,
      type: type,
      data: data
    }; // Remove the type from the dataset since it's in the itemData.type prop.

    delete itemData.data["type"]; // Finally, create the item!

    return await Item.create(itemData, {
      parent: this.actor
    });
  }
  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */


  _onRoll(event) {
    event.preventDefault();
    const element = event.currentTarget; //@ts-expect-error

    const dataset = element.dataset; // Handle item rolls.

    if (dataset.rollType) {
      if (dataset.rollType == "item") {
        //@ts-ignore
        const itemid = element.closest(".item").dataset.itemId;
        const item = this.actor.items.get(itemid); //@ts-expect-error

        if (item) return item.roll();
      }
      /*else if (dataset.rollType==='weapon'){
        const itemid = element.closest(".item").dataset.itemId
        const item = this.actor.items.get(itemid)
        if (item) return item.DamageRoll()
      }*/

    }
  }
  /**
   * _onDrop method with
   */


  async _onDrop(event) {
    if (!game.user.isGM) {
      ui.notifications.error("you don't have permissions to add documents to this actor manually");
      return;
    } // Try to extract the data


    let data;

    try {
      data = JSON.parse(event.dataTransfer.getData("text/plain"));
    } catch (err) {
      return false;
    }

    const actor = this.actor;
    /**
     * A hook event that fires when some useful data is dropped onto an ActorSheet.
     * @function dropActorSheetData
     * @memberof hookEvents
     * @param {Actor} actor      The Actor
     * @param {ActorSheet} sheet The ActorSheet application
     * @param {object} data      The data that has been dropped onto the sheet
     */

    const allowed = Hooks.call("dropActorSheetData", actor, this, data);
    if (allowed === false) return; // Handle different data types

    switch (data.type) {
      case "ActiveEffect":
        return this._onDropActiveEffect(event, data);

      case "Actor":
        return this._onDropActor(event, data);

      case "Item":
        return this._onDropItem(event, data);

      case "Folder":
        return this._onDropFolder(event, data);
    }
  }

}

class FeatRequirements extends FormApplication {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["ard20"],
      title: "Feature Requirements",
      template: "systems/ard20/templates/app/feat_req.hbs",
      id: "feat_req",
      width: 800,
      height: "auto"
    });
  }

  async getData() {
    this.options.data = !this.form ? await this.InitializeData() : this.options.data; //create easier acces to templateData

    const templateData = this.options.data;
    const req = templateData.req;
    const reqValues = req.values;
    const reqLogic = req.logic;
    const data = templateData.data;
    let formApp = templateData.formApp;
    console.log("data created"); //creating array with all possible requirements' names

    let name_array = [];

    for (let i of data) {
      name_array.push(i.name);
    } //iterate through created requirements


    reqValues.forEach((value, index) => {
      var _formApp$values$index, _formApp$values, _formApp$values$index2, _formApp$values3, _formApp$values$index3, _formApp$values$index4;

      //setting correct type of reqirement
      reqValues[index].type = (_formApp$values$index = formApp === null || formApp === void 0 ? void 0 : (_formApp$values = formApp.values) === null || _formApp$values === void 0 ? void 0 : (_formApp$values$index2 = _formApp$values[index]) === null || _formApp$values$index2 === void 0 ? void 0 : _formApp$values$index2.type) !== null && _formApp$values$index !== void 0 ? _formApp$values$index : reqValues[index].type || "attribute"; //creating array with from data array with elements that are same type

      let subtype_list = data.filter(item => item.type === reqValues[index].type); //setting correct requirement name

      reqValues[index].name = subtype_list.filter(item => {
        var _formApp$values2, _formApp$values2$inde;

        item.name === ((_formApp$values2 = formApp.values) === null || _formApp$values2 === void 0 ? void 0 : (_formApp$values2$inde = _formApp$values2[index]) === null || _formApp$values2$inde === void 0 ? void 0 : _formApp$values2$inde.name);
      }).length > 0 ? ((_formApp$values3 = formApp.values) === null || _formApp$values3 === void 0 ? void 0 : _formApp$values3[index].name) || reqValues[index].name : reqValues[index].name || subtype_list[0].name;
      reqValues[index].subtype_list = subtype_list.map(item => item.name);
      reqValues[index].input = (_formApp$values$index3 = (_formApp$values$index4 = formApp.values[index]) === null || _formApp$values$index4 === void 0 ? void 0 : _formApp$values$index4.input) !== null && _formApp$values$index3 !== void 0 ? _formApp$values$index3 : reqValues[index].input || [];
      reqValues[index].value = data.filter(item => item.name === reqValues[index].name)[0].value;

      for (let i = 0; i < this.object.data.data.level.max; i++) {
        var _reqValues$index$inpu;

        let inputElement = reqValues[index].input[i];
        let previousElement = (_reqValues$index$inpu = reqValues[index].input[i - 1]) !== null && _reqValues$index$inpu !== void 0 ? _reqValues$index$inpu : 0;

        switch (reqValues[index].type) {
          case "skill":
            inputElement = inputElement > 4 ? 1 : inputElement || 1;
            break;

          case "attribute":
            inputElement = inputElement || 10;
            break;

          case "feature":
            const maxLevel = reqValues[index].value;
            inputElement = Math.min(inputElement, maxLevel);
        }

        inputElement = Math.max(inputElement, previousElement);
        reqValues[index].input[i] = inputElement;
      }
    });
    reqLogic.forEach((value, index) => {
      var _formApp$logic$index, _formApp$logic;

      reqLogic[index] = (_formApp$logic$index = (_formApp$logic = formApp.logic) === null || _formApp$logic === void 0 ? void 0 : _formApp$logic[index]) !== null && _formApp$logic$index !== void 0 ? _formApp$logic$index : reqLogic[index];
    });
    templateData.formApp = req;
    console.log(templateData);
    return templateData;
  }
  /**
   * Initialize Data for FormApplication
   * Data structure looks like this:
   * @param {Array} req - already existing requirements
   * @param {Array} type_list - list of types for requirements, can be attribute, skill or feat
   * @param feat.awail - array of Items with type feat from Folders and Compendium Packs
   * @param feat.current - array of Items that was already used
   * @returns {object} templateData
   */


  async InitializeData() {
    if (this.form) return;
    console.log("First launch");
    const featList = await this.getFeats();
    const pack_list = featList.pack_list;
    const folder_list = featList.folder_list;
    featList.folder_name;
    const data = []; //list of attributes, skills and feats that user can use as requirement

    for (let [k, v] of Object.entries(CONFIG.ARd20.Attributes)) {
      var _game$i18n$localize;

      data.push({
        name: (_game$i18n$localize = game.i18n.localize(getValues$1(CONFIG.ARd20.Attributes, k))) !== null && _game$i18n$localize !== void 0 ? _game$i18n$localize : k,
        value: k,
        type: "attribute"
      });
    }

    for (let [k, v] of obj_entries$1(CONFIG.ARd20.Skills)) {
      var _game$i18n$localize2;

      data.push({
        name: (_game$i18n$localize2 = game.i18n.localize(getValues$1(CONFIG.ARd20.Skills, k))) !== null && _game$i18n$localize2 !== void 0 ? _game$i18n$localize2 : k,
        value: k,
        type: "skill"
      });
    }

    const arr = Object.values(CONFIG.ARd20.Rank).filter((value, index) => {
      if (index !== 0) return CONFIG.ARd20.Rank[index];
    });
    const rank = Object.assign({}, arr);
    const templateData = {
      formApp: {
        values: [],
        logic: []
      },
      req: foundry.utils.deepClone(this.object.data.data.req),
      type_list: ["attribute", "skill", "feature"],
      feat: {
        awail: pack_list.concat(folder_list.filter(item => pack_list.indexOf(item) < 0)),
        current: this.object.data.data.req.values.filter(item => item.type === "feature")
      },
      data: data,
      rank: rank
    };
    const featAwail = templateData.feat.awail;
    const featCurrent = templateData.feat.current;
    let name_array = [];

    for (let i of featCurrent) {
      name_array.push(i.name);
    }

    featAwail.forEach((item, index) => {
      if (item.name === this.object.name) {
        console.log(item.name, " matches name of the feat");
        featAwail.splice(index, 1);
      } else if (name_array.includes(item.name)) {
        console.log(item.name, "this feat is already included", index);
        item.input = featCurrent[featCurrent.indexOf(featCurrent.filter(feat => feat.name === item.name)[0])].input;
        featAwail.splice(index, 1);
      }

      if (featAwail.filter(feat => feat.name === item.name).length !== 0) {
        data.push({
          name: item.name,
          type: "feature",
          value: item.value
        });
      }
    });
    return templateData;
  }
  /**
   * Get features from folders and packs that were configured in settings
   * @returns {} {pack_list, folder_list, folder_name}
   */


  async getFeats() {
    let pack_list = [];
    let folder_list = [];
    let folder_name = [];
    const packs = game.settings.get("ard20", "feat").packs;
    const folders = game.settings.get("ard20", "feat").folders;

    for (let key of packs) {
      if (game.packs.filter(pack => pack.metadata.label === key).length !== 0) {
        let feat_list = [];
        feat_list.push(Array.from(game.packs.filter(pack => pack.metadata.label === key && pack.metadata.entity === "Item")[0].index));
        feat_list = feat_list.flat();

        for (let feat of feat_list) {
          if (feat instanceof ARd20Item) {
            const new_key = game.packs.filter(pack => pack.metadata.label === key)[0].metadata.package + "." + key;
            const doc = await game.packs.get(new_key).getDocument(feat.id);

            if (doc instanceof ARd20Item) {
              if (doc.data.type === "feature") {
                let item = doc.toObject();
                item.data = doc.data.data;
                const feature = {
                  name: item.name,
                  type: "feature",
                  input: [],
                  pass: [],
                  subtype_list: [],
                  value: item.data.level.max
                };
                pack_list.push(feature);
              }
            }
          }
        }
      }
    }

    for (let key of folders) {
      if (game.folders.filter(folder => folder.data.name === key).length !== 0) {
        let feat_list = [];
        feat_list.push(game.folders.filter(folder => folder.data.name === key && folder.data.type === "Item")[0].contents);
        feat_list = feat_list.flat();

        for (let feat of feat_list) {
          if (feat instanceof ARd20Item && feat.data.type === "feature") {
            console.log("item added from folder ", feat);
            const item = feat.toObject();
            item.data = foundry.utils.deepClone(feat.data.data);
            const feature = {
              name: item.name,
              type: "feature",
              input: [],
              pass: [],
              subtype_list: [],
              value: item.data.level.max
            };
            folder_list.push(feature);
            folder_name.push(item.name);
          }
        }
      }
    }

    return {
      pack_list,
      folder_list,
      folder_name
    };
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find(".item-create").on("click", this._onAdd.bind(this));
    html.find(".item-delete").on("click", this._Delete.bind(this));
  }
  /**
   * Add new requirement. By default it "Strength>=10" for every feat's level.
   * @param event
   */


  async _onAdd(event) {
    event.preventDefault();
    const req = this.options.data.req;
    let sub_list = []; //temporary list with attributes

    for (let [k, i] of obj_entries$1(CONFIG.ARd20.Attributes)) {
      sub_list.push(k);
    } //create varible for easier access to maximum level of feature


    const maxLevel = this.object.data.data.level.max; //create default value object

    const defaultValue = {
      name: "Strength",
      type: "attribute",
      pass: new Array(maxLevel).fill(false),
      subtype_list: sub_list,
      value: "str",
      input: new Array(maxLevel).fill(10)
    };
    req.values.push(defaultValue);
    this.render();
  }
  /**
   * Delete existing requirement
   * @param event
   */


  async _Delete(event) {
    event.preventDefault();
    const req = this.options.data.req;
    req.values.splice(event.currentTarget.dataset.key, 1);
    this.render();
  }
  /**
   * Save typed-in values
   * @param event
   */


  _onChangeInput(event) {
    super._onChangeInput(event);

    const data = this.options.data;
    const formApp = data.formApp;
    const k = event.currentTarget.dataset.key;
    const i = event.currentTarget.dataset.order;
    console.log(foundry.utils.expandObject(this._getSubmitData()));
    const req = foundry.utils.expandObject(this._getSubmitData()).req;

    switch (event.currentTarget.dataset.type) {
      case "value":
        formApp.values[k].type = req.values[k].type;
        formApp.values[k].name = req.values[k].name;
        formApp.values[k].input[i] = req.values[k].input[i];
        break;

      case "logic":
        formApp.logic[k] = req.logic[k];
        break;
    }

    this.getData();
    this.render();
  }

  async _updateObject(event, formData) {
    const item = this.object;
    this.render();
    const req = this.options.data.req;
    const obj = {};
    obj["data.req.values"] = req.values;
    obj["data.req.logic"] = req.logic;
    console.log(obj);
    await item.update(obj);
  }

}

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */

class ARd20ItemSheet extends ItemSheet {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["ard20", "sheet", "item"],
      width: 520,
      height: 480,
      tabs: [{
        navSelector: ".sheet-tabs",
        contentSelector: ".sheet-body",
        initial: "description"
      }]
    });
  }
  /** @override */


  get template() {
    const path = "systems/ard20/templates/item";
    return `${path}/item-${this.item.data.type}-sheet.html`;
  }
  /* -------------------------------------------- */

  /** @override */


  getData() {
    var _this$object$parent, _this$object;

    // Retrieve base data structure.
    const context = super.getData(); // Use a safe clone of the item data for further operations.
    //@ts-expect-error

    const itemData = context.item.data; //@ts-expect-error

    context.config = CONFIG.ARd20; // Retrieve the roll data for TinyMCE editors.
    //@ts-expect-error

    context.rollData = {};
    let actor = (_this$object$parent = (_this$object = this.object) === null || _this$object === void 0 ? void 0 : _this$object.parent) !== null && _this$object$parent !== void 0 ? _this$object$parent : null;

    if (actor) {
      //@ts-expect-error
      context.rollData = actor.getRollData();
    } // Add the actor's data to context.data for easier access, as well as flags.
    //@ts-expect-error


    context.data = itemData.data; //@ts-expect-error

    context.flags = itemData.flags; //@ts-expect-error

    context.isGM = game.user.isGM; //@ts-expect-error

    context.type = context.item.type; //@ts-expect-error

    context.effects = prepareActiveEffectCategories(this.item.effects);
    return context;
  }

  _getSubmitData(updateData = {}) {
    var _data$data;

    // Create the expanded update data object
    if (this.form === null) return; //@ts-expect-error

    const fd = new FormDataExtended(this.form, {
      editors: this.editors
    });
    let data = fd.toObject();
    if (updateData) data = mergeObject(data, updateData);else data = expandObject(data); // Handle Damage array
    //@ts-expect-error

    const damage = (_data$data = data.data) === null || _data$data === void 0 ? void 0 : _data$data.damage;

    if (damage) {
      if (damage.parts) {
        damage.damType = Object.values((damage === null || damage === void 0 ? void 0 : damage.damType) || {});
        damage.parts = Object.values((damage === null || damage === void 0 ? void 0 : damage.parts) || {}).map(function (d, ind) {
          let a = [];

          if (damage.damType[ind].length !== 0) {
            damage.damType[ind].forEach((sub, i) => a.push(JSON.parse(damage.damType[ind][i])));
          } //@ts-expect-error


          return [d[0] || "", a];
        });
      } else {
        for (let [key, type] of obj_entries$1(damage)) {
          for (let [k, prof] of obj_entries$1(type)) {
            prof.damType = Object.values((prof === null || prof === void 0 ? void 0 : prof.damType) || {});
            prof.parts = Object.values((prof === null || prof === void 0 ? void 0 : prof.parts) || {}).map(function (d, ind) {
              let a = [];

              if (prof.damType[ind].length !== 0 && prof.damType[ind][0] !== "") {
                prof.damType[ind].forEach((sub, i) => a.push(JSON.parse(prof.damType[ind][i])));
              } //@ts-expect-error


              return [d[0] || "", a];
            });
          }
        }
      }
    }

    return flattenObject(data);
  }
  /* -------------------------------------------- */

  /** @override */


  activateListeners(html) {
    super.activateListeners(html);
    const edit = !this.isEditable;
    const context = this.getData(); //@ts-expect-error

    function formatSelection(state) {
      const parent = $(state.element).parent().prop("tagName");
      if (!state.id || parent !== "OPTGROUP") return state.text;
      const optgroup = $(state.element).parent().attr("label");
      const subtype = state.element.value.match(/(\w+)/g)[1];
      const url = `systems/ard20/css/${subtype}.svg`;
      return `<div><img style="width:15px; background-color:black; margin-left:2px" src=${url} />${optgroup} ${state.text}</div>`;
    } //@ts-expect-error


    function formatResult(state) {
      const parent = $(state.element).parent().prop("tagName");
      if (!state.id || parent !== "OPTGROUP") return state.text;
      const subtype = state.element.value.match(/(\w+)/g)[1];
      const url = `systems/ard20/css/${subtype}.svg`;
      return `<div><img style="width:15px; background-color:black; margin-left:2px" src=${url} /> ${state.text}</div>`;
    }

    $(`select.select2`, html) //@ts-expect-error
    .select2({
      theme: "filled",
      width: "auto",
      dropdownAutoWidth: true,
      disabled: edit,
      templateSelection: formatSelection,
      templateResult: formatResult,
      //@ts-expect-error
      escapeMarkup: function (m) {
        return m;
      }
    }) //@ts-expect-error
    .val(function (index, value) {
      //@ts-expect-error
      const name = $("select.select2", html)[index].name;
      const val = getProperty(context, name);
      return val;
    }).trigger("change");
    $("select").on("select2:unselect", function (evt) {
      //@ts-expect-error
      if (!evt.params.originalEvent) {
        return;
      } //@ts-expect-error


      evt.params.originalEvent.stopPropagation();
    }); // Everything below here is only needed if the sheet is editable

    if (!this.isEditable) return; //@ts-expect-error

    html.find(".effect-control").click(ev => onManageActiveEffect(ev, this.item)); // Roll handlers, click handlers, etc. would go here.

    html.find(".config-button").click(this._FeatReq.bind(this));
    html.find(".damage-control").click(this._onDamageControl.bind(this));
  } //@ts-expect-error


  _FeatReq(event) {
    var _app;

    event.preventDefault();
    const button = event.currentTarget;
    let app;

    switch (button.dataset.action) {
      case "feat-req":
        //@ts-expect-error
        app = new FeatRequirements(this.object);
        break;
    }

    (_app = app) === null || _app === void 0 ? void 0 : _app.render(true);
  } //@ts-expect-error


  async _onDamageControl(event) {
    event.preventDefault();
    const a = event.currentTarget;

    if (a.classList.contains("add-damage")) {
      var _damage$damType;

      //await this._onSubmit(event);
      let path = a.dataset.type ? "data.damage" + a.dataset.type : "data.damage";
      const damage = getProperty(this.item.data, path);
      damage.damType = damage.damType || [];
      const partsPath = path + ".parts";
      const damTypePath = path + ".damType";
      const update = {};
      update[partsPath] = damage.parts.concat([["", ["", ""]]]);
      update[damTypePath] = (_damage$damType = damage.damType) === null || _damage$damType === void 0 ? void 0 : _damage$damType.concat([[""]]);
      await this.item.update(update);
    }

    if (a.classList.contains("delete-damage")) {
      //await this._onSubmit(event);
      const li = a.closest(".damage-part");
      let path = a.dataset.type ? "data.damage" + a.dataset.type : "data.damage";
      const damage = getProperty(this.item.data, path);
      console.log(damage);
      damage.parts.splice(Number(li.dataset.damagePart), 1);
      damage.damType.splice(Number(li.dataset.damagePart), 1);
      const partsPath = path + ".parts";
      const damTypePath = path + ".damType";
      const update = {};
      update[partsPath] = damage.parts;
      update[damTypePath] = damage.damType;
      await this.item.update(update);
    }
  } //@ts-expect-error


  async _onSubmit(...args) {
    if (this._tabs[0].active === "data") this.position.height = "auto"; //@ts-expect-error

    await super._onSubmit(...args);
  }

}

/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
const preloadHandlebarsTemplates = async function preloadHandlebarsTemplates() {
  return loadTemplates([// Actor partials.
  "systems/ard20/templates/actor/parts/actor-features.html", "systems/ard20/templates/actor/parts/actor-items.html", "systems/ard20/templates/actor/parts/actor-spells.html", "systems/ard20/templates/actor/parts/actor-effects.html", "systems/ard20/templates/actor/parts/actor-equip.html", // Character Advancement
  "systems/ard20/templates/actor/parts/actor-adv.html", // Settings
  "systems/ard20/templates/app/prof-settings.html", "systems/ard20/templates/app/feat-settings.html", // Requirements for features
  "systems/ard20/templates/app/feat_req.hbs"]);
};

//@ts-expect-error
const ARd20 = {};
ARd20.Attributes = {
  str: "ARd20.AttributeStr",
  dex: "ARd20.AttributeDex",
  con: "ARd20.AttributeCon",
  int: "ARd20.AttributeInt",
  wis: "ARd20.AttributeWis",
  cha: "ARd20.AttributeCha"
};
ARd20.AttributeAbbreviations = {
  str: "ARd20.AttributeStrAbbr",
  dex: "ARd20.AttributeDexAbbr",
  con: "ARd20.AttributeConAbbr",
  int: "ARd20.AttributeIntAbbr",
  wis: "ARd20.AttributeWisAbbr",
  cha: "ARd20.AttributeChaAbbr"
};
ARd20.CHARACTER_EXP_LEVELS = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000];
ARd20.SpellSchool = {
  abj: "ARd20.SchoolAbj",
  con: "ARd20.SchoolCon",
  div: "ARd20.SchoolDiv",
  enc: "ARd20.SchoolEnc",
  evo: "ARd20.SchoolEvo",
  ill: "ARd20.SchoolIll",
  nec: "ARd20.SchoolNec",
  trs: "ARd20.SchoolTrs"
};
ARd20.Skills = {
  acr: "ARd20.SkillAcr",
  ani: "ARd20.SkillAni",
  arc: "ARd20.SkillArc",
  ath: "ARd20.SkillAth",
  dec: "ARd20.SkillDec",
  his: "ARd20.SkillHis",
  ins: "ARd20.SkillIns",
  itm: "ARd20.SkillItm",
  inv: "ARd20.SkillInv",
  med: "ARd20.SkillMed",
  nat: "ARd20.SkillNat",
  prc: "ARd20.SkillPrc",
  prf: "ARd20.SkillPrf",
  per: "ARd20.SkillPer",
  rel: "ARd20.SkillRel",
  slt: "ARd20.SkillSlt",
  ste: "ARd20.SkillSte",
  sur: "ARd20.SkillSur"
};
ARd20.Rank = {
  0: "ARd20.Untrained",
  1: "ARd20.Basic",
  2: "ARd20.Expert",
  3: "ARd20.Master",
  4: "ARd20.Legend"
};
ARd20.Source = {
  mar: "ARd20.Martial",
  mag: "ARd20.Magical",
  div: "ARd20.Divine",
  pri: "ARd20.Primal",
  psy: "ARd20.Psyhic"
};
ARd20.WeaponProp = {
  aff: "ARd20.Affixed",
  awk: "ARd20.Awkward",
  con: "ARd20.Conceal",
  bra: "ARd20.Brace",
  def: "ARd20.Deflect",
  dis: "ARd20.Disarm",
  dou: "ARd20.Double Ended",
  ent: "ARd20.Entangle",
  fin: "ARd20.Finesse",
  fir: "ARd20.Firearm",
  hea: "ARd20.Heavy",
  lau: "ARd20.Launch",
  lig: "ARd20.Light",
  lun: "ARd20.Lunge",
  mel: "ARd20.Melee",
  one: "ARd20.One-Handed",
  pen: "ARd20.Penetrate",
  ran: "ARd20.Ranged",
  rea: "ARd20.Reach",
  rel: "ARd20.Reload",
  sta: "Ard20.Stagger",
  thr: "ARd20.Thrown",
  tri: "ARd20.Trip",
  two: "ARd20.Two-Handed",
  ver: "ARd20.Versatile"
};
ARd20.WeaponType = {
  amb: "ARd20.Ambush",
  axe: "ARd20.Axe",
  blu: "ARd20.Bludgeon",
  bow: "ARd20.Bow",
  sli: "ARd20.Sling",
  cbl: "ARd20.Combat Blade",
  cro: "ARd20.Crossbow",
  dbl: "ARd20.Dueling Blade",
  fir: "ARd20.Firearm",
  fla: "ARd20.Flail",
  whi: "ARd20.Whip",
  ham: "ARd20.Hammer",
  pic: "ARd20.Pick",
  pol: "ARd20.Polearm",
  spe: "ARd20.Spear",
  thr: "ARd20.Throwing"
};
ARd20.AbilXP = [50, 50, 50, 50, 70, 90, 120, 150, 190, 290, 440, 660, 990, 1500, 2700, 4800, 8400, 14700, 25700, 51500, 103000, 206000, 412000, 824000, 2060000];
ARd20.SkillXP = {
  0: [50, 80, 125, 185, 260, 350, 455, 575, 710, 860, 1025, 1205, 1400, 1610, 1835, 2075, 2330, 2600],
  1: [115, 190, 295, 430, 595, 790, 1015, 1270, 1555, 1870, 2215, 2590, 2995, 3430, 3895, 4390, 4915, 5470]
};
ARd20.DamageTypes = {
  mag: "ARd20.Magical",
  phys: "ARd20.Physical"
};
ARd20.DamageSubTypes = {
  acid: "ARd20.DamageAcid",
  bludgeoning: "ARd20.DamageBludgeoning",
  cold: "ARd20.DamageCold",
  fire: "ARd20.DamageFire",
  force: "ARd20.DamageForce",
  lightning: "ARd20.DamageLightning",
  necr: "ARd20.DamageNecrotic",
  piercing: "ARd20.DamagePiercing",
  poison: "ARd20.DamagePoison",
  slashing: "ARd20.DamageSlashing",
  radiant: "ARd20.DamageRadiant",
  psychic: "ARd20.DamagePsychic"
};
ARd20.ResistTypes = {
  res: "ARd20.Resistance",
  vul: "Ard20.Vulnerability",
  imm: "ARd20.Immunity"
};
ARd20.HPDice = ["1d6", "1d8", "1d10", "1d12", "1d12+2", "1d12+4", "1d20", "1d20+2", "1d20+4", "1d20+6", "1d20+8", "1d20+10", "1d20+12"];
ARd20.HeavyPoints = {
  light: {
    chest: 3,
    gloves: 1,
    boots: 1,
    pants: 2,
    head: 1
  },
  medium: {
    chest: 5,
    gloves: 2,
    boots: 2,
    pants: 3,
    head: 2
  },
  heavy: {
    chest: 8,
    gloves: 3,
    boots: 3,
    pants: 5,
    head: 3
  }
};
ARd20.RollResult = {
  0: "ARd20.Fumble",
  1: "ARd20.Fail",
  2: "ARd20.Success",
  3: "ARd20.Crit"
};

class ARd20SocketHandler {
  //@ts-expect-error
  static async updateActorData(data) {
    if (game.user.isGM) {
      const actor = game.actors.get(data.actor._id); //@ts-expect-error

      if (actor) await actor.update(data.update, {
        "data.health.value": data.value
      });
    }
  }

}

function noop() {}

const identity = x => x;

function run(fn) {
  return fn();
}

function blank_object() {
  return Object.create(null);
}

function run_all(fns) {
  fns.forEach(run);
}

function is_function(thing) {
  return typeof thing === 'function';
}

function safe_not_equal(a, b) {
  return a != a ? b == b : a !== b || a && typeof a === 'object' || typeof a === 'function';
}

function is_empty(obj) {
  return Object.keys(obj).length === 0;
}

function subscribe(store, ...callbacks) {
  if (store == null) {
    return noop;
  }

  const unsub = store.subscribe(...callbacks);
  return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
}

function get_store_value(store) {
  let value;
  subscribe(store, _ => value = _)();
  return value;
}

function append(target, node) {
  target.appendChild(node);
}

function insert(target, node, anchor) {
  target.insertBefore(node, anchor || null);
}

function detach(node) {
  node.parentNode.removeChild(node);
}

function element(name) {
  return document.createElement(name);
}

function text(data) {
  return document.createTextNode(data);
}

function space() {
  return text(' ');
}

function listen(node, event, handler, options) {
  node.addEventListener(event, handler, options);
  return () => node.removeEventListener(event, handler, options);
}

function prevent_default(fn) {
  return function (event) {
    event.preventDefault(); // @ts-ignore

    return fn.call(this, event);
  };
}

function attr(node, attribute, value) {
  if (value == null) node.removeAttribute(attribute);else if (node.getAttribute(attribute) !== value) node.setAttribute(attribute, value);
}

function children(element) {
  return Array.from(element.childNodes);
}

function set_input_value(input, value) {
  input.value = value == null ? '' : value;
}

let current_component;

function set_current_component(component) {
  current_component = component;
}

function get_current_component() {
  if (!current_component) throw new Error('Function called outside component initialization');
  return current_component;
}

function getContext(key) {
  return get_current_component().$$.context.get(key);
}

const dirty_components = [];
const binding_callbacks = [];
const render_callbacks = [];
const flush_callbacks = [];
const resolved_promise = Promise.resolve();
let update_scheduled = false;

function schedule_update() {
  if (!update_scheduled) {
    update_scheduled = true;
    resolved_promise.then(flush);
  }
}

function add_render_callback(fn) {
  render_callbacks.push(fn);
}
// 1. All beforeUpdate callbacks, in order: parents before children
// 2. All bind:this callbacks, in reverse order: children before parents.
// 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
//    for afterUpdates called during the initial onMount, which are called in
//    reverse order: children before parents.
// Since callbacks might update component values, which could trigger another
// call to flush(), the following steps guard against this:
// 1. During beforeUpdate, any updated components will be added to the
//    dirty_components array and will cause a reentrant call to flush(). Because
//    the flush index is kept outside the function, the reentrant call will pick
//    up where the earlier call left off and go through all dirty components. The
//    current_component value is saved and restored so that the reentrant call will
//    not interfere with the "parent" flush() call.
// 2. bind:this callbacks cannot trigger new flush() calls.
// 3. During afterUpdate, any updated components will NOT have their afterUpdate
//    callback called a second time; the seen_callbacks set, outside the flush()
//    function, guarantees this behavior.


const seen_callbacks = new Set();
let flushidx = 0; // Do *not* move this inside the flush() function

function flush() {
  const saved_component = current_component;

  do {
    // first, call beforeUpdate functions
    // and update components
    while (flushidx < dirty_components.length) {
      const component = dirty_components[flushidx];
      flushidx++;
      set_current_component(component);
      update(component.$$);
    }

    set_current_component(null);
    dirty_components.length = 0;
    flushidx = 0;

    while (binding_callbacks.length) binding_callbacks.pop()(); // then, once components are updated, call
    // afterUpdate functions. This may cause
    // subsequent updates...


    for (let i = 0; i < render_callbacks.length; i += 1) {
      const callback = render_callbacks[i];

      if (!seen_callbacks.has(callback)) {
        // ...so guard against infinite loops
        seen_callbacks.add(callback);
        callback();
      }
    }

    render_callbacks.length = 0;
  } while (dirty_components.length);

  while (flush_callbacks.length) {
    flush_callbacks.pop()();
  }

  update_scheduled = false;
  seen_callbacks.clear();
  set_current_component(saved_component);
}

function update($$) {
  if ($$.fragment !== null) {
    $$.update();
    run_all($$.before_update);
    const dirty = $$.dirty;
    $$.dirty = [-1];
    $$.fragment && $$.fragment.p($$.ctx, dirty);
    $$.after_update.forEach(add_render_callback);
  }
}

const outroing = new Set();
let outros;

function group_outros() {
  outros = {
    r: 0,
    c: [],
    p: outros // parent group

  };
}

function check_outros() {
  if (!outros.r) {
    run_all(outros.c);
  }

  outros = outros.p;
}

function transition_in(block, local) {
  if (block && block.i) {
    outroing.delete(block);
    block.i(local);
  }
}

function transition_out(block, local, detach, callback) {
  if (block && block.o) {
    if (outroing.has(block)) return;
    outroing.add(block);
    outros.c.push(() => {
      outroing.delete(block);

      if (callback) {
        if (detach) block.d(1);
        callback();
      }
    });
    block.o(local);
  }
}

function mount_component(component, target, anchor, customElement) {
  const {
    fragment,
    on_mount,
    on_destroy,
    after_update
  } = component.$$;
  fragment && fragment.m(target, anchor);

  if (!customElement) {
    // onMount happens before the initial afterUpdate
    add_render_callback(() => {
      const new_on_destroy = on_mount.map(run).filter(is_function);

      if (on_destroy) {
        on_destroy.push(...new_on_destroy);
      } else {
        // Edge case - component was destroyed immediately,
        // most likely as a result of a binding initialising
        run_all(new_on_destroy);
      }

      component.$$.on_mount = [];
    });
  }

  after_update.forEach(add_render_callback);
}

function destroy_component(component, detaching) {
  const $$ = component.$$;

  if ($$.fragment !== null) {
    run_all($$.on_destroy);
    $$.fragment && $$.fragment.d(detaching); // TODO null out other refs, including component.$$ (but need to
    // preserve final state?)

    $$.on_destroy = $$.fragment = null;
    $$.ctx = [];
  }
}

function make_dirty(component, i) {
  if (component.$$.dirty[0] === -1) {
    dirty_components.push(component);
    schedule_update();
    component.$$.dirty.fill(0);
  }

  component.$$.dirty[i / 31 | 0] |= 1 << i % 31;
}

function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
  const parent_component = current_component;
  set_current_component(component);
  const $$ = component.$$ = {
    fragment: null,
    ctx: null,
    // state
    props,
    update: noop,
    not_equal,
    bound: blank_object(),
    // lifecycle
    on_mount: [],
    on_destroy: [],
    on_disconnect: [],
    before_update: [],
    after_update: [],
    context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
    // everything else
    callbacks: blank_object(),
    dirty,
    skip_bound: false,
    root: options.target || parent_component.$$.root
  };
  append_styles && append_styles($$.root);
  let ready = false;
  $$.ctx = instance ? instance(component, options.props || {}, (i, ret, ...rest) => {
    const value = rest.length ? rest[0] : ret;

    if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
      if (!$$.skip_bound && $$.bound[i]) $$.bound[i](value);
      if (ready) make_dirty(component, i);
    }

    return ret;
  }) : [];
  $$.update();
  ready = true;
  run_all($$.before_update); // `false` as a special case of no DOM component

  $$.fragment = create_fragment ? create_fragment($$.ctx) : false;

  if (options.target) {
    if (options.hydrate) {
      const nodes = children(options.target); // eslint-disable-next-line @typescript-eslint/no-non-null-assertion

      $$.fragment && $$.fragment.l(nodes);
      nodes.forEach(detach);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      $$.fragment && $$.fragment.c();
    }

    if (options.intro) transition_in(component.$$.fragment);
    mount_component(component, options.target, options.anchor, options.customElement);
    flush();
  }

  set_current_component(parent_component);
}
/**
 * Base class for Svelte components. Used when dev=false.
 */


class SvelteComponent {
  $destroy() {
    destroy_component(this, 1);
    this.$destroy = noop;
  }

  $on(type, callback) {
    const callbacks = this.$$.callbacks[type] || (this.$$.callbacks[type] = []);
    callbacks.push(callback);
    return () => {
      const index = callbacks.indexOf(callback);
      if (index !== -1) callbacks.splice(index, 1);
    };
  }

  $set($$props) {
    if (this.$$set && !is_empty($$props)) {
      this.$$.skip_bound = true;
      this.$$set($$props);
      this.$$.skip_bound = false;
    }
  }

}

/**
 * Provides a method to determine if the passed in Svelte component has a getter accessor.
 *
 * @param {*}        component - Svelte component.
 *
 * @param {string}   accessor - Accessor to test.
 *
 * @returns {boolean} Whether the component has the getter for accessor.
 */


function hasGetter(component, accessor) {
  if (component === null || component === void 0) {
    return false;
  } // Get the prototype which is the parent SvelteComponent that has any getter / setters.


  const prototype = Object.getPrototypeOf(component);
  const descriptor = Object.getOwnPropertyDescriptor(prototype, accessor);
  return !(descriptor === void 0 || descriptor.get === void 0);
}
/**
 * Performs linear interpolation between a start & end value by given amount between 0 - 1 inclusive.
 *
 * @param {number}   start - Start value.
 *
 * @param {number}   end - End value.
 *
 * @param {number}   amount - Current amount between 0 - 1 inclusive.
 *
 * @returns {number} Linear interpolated value between start & end.
 */


function lerp(start, end, amount) {
  return (1 - amount) * start + amount * end;
}
/**
 * Defines the application shell contract. If Svelte components export getter / setters for the following properties
 * then that component is considered an application shell.
 *
 * @type {string[]}
 */


const applicationShellContract$1 = ['elementRoot'];
Object.freeze(applicationShellContract$1);
/**
 * Provides a method to determine if the passed in object is ApplicationShell or TJSApplicationShell.
 *
 * @param {*}  component - Object / component to test.
 *
 * @returns {boolean} Whether the component is a ApplicationShell or TJSApplicationShell.
 */

function isApplicationShell(component) {
  if (component === null || component === void 0) {
    return false;
  } // Get the prototype which is the parent SvelteComponent that has any getter / setters.


  const prototype = Object.getPrototypeOf(component); // Verify the application shell contract. If the accessors (getters / setters) are defined for
  // `applicationShellContract`.

  for (const accessor of applicationShellContract$1) {
    const descriptor = Object.getOwnPropertyDescriptor(prototype, accessor);

    if (descriptor === void 0 || descriptor.get === void 0 || descriptor.set === void 0) {
      return false;
    }
  }

  return true;
}
/**
 * Provides basic duck typing to determine if the provided function is a constructor function for a Svelte component.
 *
 * @param {*}  comp - Data to check as a Svelte component.
 *
 * @returns {boolean} Whether basic duck typing succeeds.
 */


function isSvelteComponent(comp) {
  if (comp === null || comp === void 0 || typeof comp !== 'function') {
    return false;
  }

  return typeof window !== void 0 ? typeof comp.prototype.$destroy === 'function' && typeof comp.prototype.$on === 'function' : // client-side
  typeof comp.render === 'function'; // server-side
}
/**
 * Runs outro transition then destroys Svelte component.
 *
 * Workaround for https://github.com/sveltejs/svelte/issues/4056
 *
 * @param {*}  instance - A Svelte component.
 */


async function outroAndDestroy(instance) {
  return new Promise(resolve => {
    if (instance.$$.fragment && instance.$$.fragment.o) {
      group_outros();
      transition_out(instance.$$.fragment, 0, 0, () => {
        instance.$destroy();
        resolve();
      });
      check_outros();
    } else {
      instance.$destroy();
      resolve();
    }
  });
}
/**
 * Parses a TyphonJS Svelte config object ensuring that classes specified are Svelte components and props are set
 * correctly.
 *
 * @param {object}   config - Svelte config object.
 *
 * @param {*}        [thisArg] - `This` reference to set for invoking any props function.
 *
 * @returns {object} The processed Svelte config object.
 */


function parseSvelteConfig(config, thisArg = void 0) {
  if (typeof config !== 'object') {
    throw new TypeError(`parseSvelteConfig - 'config' is not an object:\n${JSON.stringify(config)}.`);
  }

  if (!isSvelteComponent(config.class)) {
    throw new TypeError(`parseSvelteConfig - 'class' is not a Svelte component constructor for config:\n${JSON.stringify(config)}.`);
  }

  if (config.hydrate !== void 0 && typeof config.hydrate !== 'boolean') {
    throw new TypeError(`parseSvelteConfig - 'hydrate' is not a boolean for config:\n${JSON.stringify(config)}.`);
  }

  if (config.intro !== void 0 && typeof config.intro !== 'boolean') {
    throw new TypeError(`parseSvelteConfig - 'intro' is not a boolean for config:\n${JSON.stringify(config)}.`);
  }

  if (config.target !== void 0 && typeof config.target !== 'string' && !(config.target instanceof HTMLElement) && !(config.target instanceof ShadowRoot) && !(config.target instanceof DocumentFragment)) {
    throw new TypeError(`parseSvelteConfig - 'target' is not a string, HTMLElement, ShadowRoot, or DocumentFragment for config:\n${JSON.stringify(config)}.`);
  }

  if (config.anchor !== void 0 && typeof config.anchor !== 'string' && !(config.anchor instanceof HTMLElement) && !(config.anchor instanceof ShadowRoot) && !(config.anchor instanceof DocumentFragment)) {
    throw new TypeError(`parseSvelteConfig - 'anchor' is not a string, HTMLElement, ShadowRoot, or DocumentFragment for config:\n${JSON.stringify(config)}.`);
  }

  if (config.context !== void 0 && typeof config.context !== 'function' && !(config.context instanceof Map) && typeof config.context !== 'object') {
    throw new TypeError(`parseSvelteConfig - 'context' is not a Map, function or object for config:\n${JSON.stringify(config)}.`);
  } // Validate extra TyphonJS options --------------------------------------------------------------------------------
  // `selectorTarget` optionally stores a target element found in main element.


  if (config.selectorTarget !== void 0 && typeof config.selectorTarget !== 'string') {
    throw new TypeError(`parseSvelteConfig - 'selectorTarget' is not a string for config:\n${JSON.stringify(config)}.`);
  } // `options` stores `injectApp`, `injectEventbus`, and `selectorElement`.


  if (config.options !== void 0 && typeof config.options !== 'object') {
    throw new TypeError(`parseSvelteConfig - 'options' is not an object for config:\n${JSON.stringify(config)}.`);
  } // Validate TyphonJS standard options.


  if (config.options !== void 0) {
    if (config.options.injectApp !== void 0 && typeof config.options.injectApp !== 'boolean') {
      throw new TypeError(`parseSvelteConfig - 'options.injectApp' is not a boolean for config:\n${JSON.stringify(config)}.`);
    }

    if (config.options.injectEventbus !== void 0 && typeof config.options.injectEventbus !== 'boolean') {
      throw new TypeError(`parseSvelteConfig - 'options.injectEventbus' is not a boolean for config:\n${JSON.stringify(config)}.`);
    } // `selectorElement` optionally stores a main element selector to be found in a HTMLElement target.


    if (config.options.selectorElement !== void 0 && typeof config.options.selectorElement !== 'string') {
      throw new TypeError(`parseSvelteConfig - 'selectorElement' is not a string for config:\n${JSON.stringify(config)}.`);
    }
  }

  const svelteConfig = _objectSpread2({}, config); // Delete extra Svelte options.


  delete svelteConfig.options;
  let externalContext = {}; // If a context callback function is provided then invoke it with `this` being the Foundry app.
  // If an object is returned it adds the entries to external context.

  if (typeof svelteConfig.context === 'function') {
    const contextFunc = svelteConfig.context;
    delete svelteConfig.context;
    const result = contextFunc.call(thisArg);

    if (typeof result === 'object') {
      externalContext = _objectSpread2({}, result);
    } else {
      throw new Error(`parseSvelteConfig - 'context' is a function that did not return an object for config:\n${JSON.stringify(config)}`);
    }
  } else if (svelteConfig.context instanceof Map) {
    externalContext = Object.fromEntries(svelteConfig.context);
    delete svelteConfig.context;
  } else if (typeof svelteConfig.context === 'object') {
    externalContext = svelteConfig.context;
    delete svelteConfig.context;
  } // If a props is a function then invoke it with `this` being the Foundry app.
  // If an object is returned set it as the props.


  svelteConfig.props = s_PROCESS_PROPS(svelteConfig.props, thisArg, config); // Process children components attaching to external context.

  if (Array.isArray(svelteConfig.children)) {
    const children = [];

    for (let cntr = 0; cntr < svelteConfig.children.length; cntr++) {
      const child = svelteConfig.children[cntr];

      if (!isSvelteComponent(child.class)) {
        throw new Error(`parseSvelteConfig - 'class' is not a Svelte component for child[${cntr}] for config:\n${JSON.stringify(config)}`);
      }

      child.props = s_PROCESS_PROPS(child.props, thisArg, config);
      children.push(child);
    }

    if (children.length > 0) {
      externalContext.children = children;
    }

    delete svelteConfig.children;
  } else if (typeof svelteConfig.children === 'object') {
    if (!isSvelteComponent(svelteConfig.children.class)) {
      throw new Error(`parseSvelteConfig - 'class' is not a Svelte component for children object for config:\n${JSON.stringify(config)}`);
    }

    svelteConfig.children.props = s_PROCESS_PROPS(svelteConfig.children.props, thisArg, config);
    externalContext.children = [svelteConfig.children];
    delete svelteConfig.children;
  }

  if (!(svelteConfig.context instanceof Map)) {
    svelteConfig.context = new Map();
  }

  svelteConfig.context.set('external', externalContext);
  return svelteConfig;
}
/**
 * Processes Svelte props. Potentially props can be a function to invoke with `thisArg`.
 *
 * @param {object|Function}   props - Svelte props.
 *
 * @param {*}                 thisArg - `This` reference to set for invoking any props function.
 *
 * @param {object}            config - Svelte config
 *
 * @returns {object|void}     Svelte props.
 */


function s_PROCESS_PROPS(props, thisArg, config) {
  // If a props is a function then invoke it with `this` being the Foundry app.
  // If an object is returned set it as the props.
  if (typeof props === 'function') {
    const result = props.call(thisArg);

    if (typeof result === 'object') {
      return result;
    } else {
      throw new Error(`parseSvelteConfig - 'props' is a function that did not return an object for config:\n${JSON.stringify(config)}`);
    }
  } else if (typeof props === 'object') {
    return props;
  } else if (props !== void 0) {
    throw new Error(`parseSvelteConfig - 'props' is not a function or an object for config:\n${JSON.stringify(config)}`);
  }

  return {};
}
/**
 * Provides common object manipulation utilities including depth traversal, obtaining accessors, safely setting values /
 * equality tests, and validation.
 */


const s_TAG_OBJECT = '[object Object]';
/**
 * Recursively deep merges all source objects into the target object in place. Like `Object.assign` if you provide `{}`
 * as the target a copy is produced. If the target and source property are object literals they are merged.
 * Deleting keys is supported by specifying a property starting with `-=`.
 *
 * @param {object}      target - Target object.
 *
 * @param {...object}   sourceObj - One or more source objects.
 *
 * @returns {object}    Target object.
 */

function deepMerge(target = {}, ...sourceObj) {
  if (Object.prototype.toString.call(target) !== s_TAG_OBJECT) {
    throw new TypeError(`deepMerge error: 'target' is not an 'object'.`);
  }

  for (let cntr = 0; cntr < sourceObj.length; cntr++) {
    if (Object.prototype.toString.call(sourceObj[cntr]) !== s_TAG_OBJECT) {
      throw new TypeError(`deepMerge error: 'sourceObj[${cntr}]' is not an 'object'.`);
    }
  }

  return _deepMerge(target, ...sourceObj);
}
/**
 * Tests for whether an object is iterable.
 *
 * @param {object} object - An object.
 *
 * @returns {boolean} Whether object is iterable.
 */


function isIterable(object) {
  if (object === null || object === void 0 || typeof object !== 'object') {
    return false;
  }

  return typeof object[Symbol.iterator] === 'function';
}
/**
 * Provides a way to safely access an objects data / entries given an accessor string which describes the
 * entries to walk. To access deeper entries into the object format the accessor string with `.` between entries
 * to walk.
 *
 * @param {object}   data - An object to access entry data.
 *
 * @param {string}   accessor - A string describing the entries to access.
 *
 * @param {*}        defaultValue - (Optional) A default value to return if an entry for accessor is not found.
 *
 * @returns {object} The data object.
 */


function safeAccess(data, accessor, defaultValue = void 0) {
  if (typeof data !== 'object') {
    return defaultValue;
  }

  if (typeof accessor !== 'string') {
    return defaultValue;
  }

  const access = accessor.split('.'); // Walk through the given object by the accessor indexes.

  for (let cntr = 0; cntr < access.length; cntr++) {
    // If the next level of object access is undefined or null then return the empty string.
    if (typeof data[access[cntr]] === 'undefined' || data[access[cntr]] === null) {
      return defaultValue;
    }

    data = data[access[cntr]];
  }

  return data;
}
/**
 * Provides a way to safely set an objects data / entries given an accessor string which describes the
 * entries to walk. To access deeper entries into the object format the accessor string with `.` between entries
 * to walk.
 *
 * @param {object}   data - An object to access entry data.
 *
 * @param {string}   accessor - A string describing the entries to access.
 *
 * @param {*}        value - A new value to set if an entry for accessor is found.
 *
 * @param {string}   [operation='set'] - Operation to perform including: 'add', 'div', 'mult', 'set',
 *                                       'set-undefined', 'sub'.
 *
 * @param {boolean}  [createMissing=true] - If true missing accessor entries will be created as objects
 *                                          automatically.
 *
 * @returns {boolean} True if successful.
 */


function safeSet(data, accessor, value, operation = 'set', createMissing = true) {
  if (typeof data !== 'object') {
    throw new TypeError(`safeSet Error: 'data' is not an 'object'.`);
  }

  if (typeof accessor !== 'string') {
    throw new TypeError(`safeSet Error: 'accessor' is not a 'string'.`);
  }

  const access = accessor.split('.'); // Walk through the given object by the accessor indexes.

  for (let cntr = 0; cntr < access.length; cntr++) {
    // If data is an array perform validation that the accessor is a positive integer otherwise quit.
    if (Array.isArray(data)) {
      const number = +access[cntr];

      if (!Number.isInteger(number) || number < 0) {
        return false;
      }
    }

    if (cntr === access.length - 1) {
      switch (operation) {
        case 'add':
          data[access[cntr]] += value;
          break;

        case 'div':
          data[access[cntr]] /= value;
          break;

        case 'mult':
          data[access[cntr]] *= value;
          break;

        case 'set':
          data[access[cntr]] = value;
          break;

        case 'set-undefined':
          if (typeof data[access[cntr]] === 'undefined') {
            data[access[cntr]] = value;
          }

          break;

        case 'sub':
          data[access[cntr]] -= value;
          break;
      }
    } else {
      // If createMissing is true and the next level of object access is undefined then create a new object entry.
      if (createMissing && typeof data[access[cntr]] === 'undefined') {
        data[access[cntr]] = {};
      } // Abort if the next level is null or not an object and containing a value.


      if (data[access[cntr]] === null || typeof data[access[cntr]] !== 'object') {
        return false;
      }

      data = data[access[cntr]];
    }
  }

  return true;
}
/**
 * Internal implementation for `deepMerge`.
 *
 * @param {object}      target - Target object.
 *
 * @param {...object}   sourceObj - One or more source objects.
 *
 * @returns {object}    Target object.
 */


function _deepMerge(target = {}, ...sourceObj) {
  // Iterate and merge all source objects into target.
  for (let cntr = 0; cntr < sourceObj.length; cntr++) {
    const obj = sourceObj[cntr];

    for (const prop in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, prop)) {
        var _target$prop, _obj$prop;

        // Handle the special property starting with '-=' to delete keys.
        if (prop.startsWith('-=')) {
          delete target[prop.slice(2)];
          continue;
        } // If target already has prop and both target[prop] and obj[prop] are object literals then merge them
        // otherwise assign obj[prop] to target[prop].


        target[prop] = Object.prototype.hasOwnProperty.call(target, prop) && ((_target$prop = target[prop]) === null || _target$prop === void 0 ? void 0 : _target$prop.constructor) === Object && ((_obj$prop = obj[prop]) === null || _obj$prop === void 0 ? void 0 : _obj$prop.constructor) === Object ? _deepMerge({}, target[prop], obj[prop]) : obj[prop];
      }
    }
  }

  return target;
}

const _excluded$1 = ["name"];

var _application$1 = /*#__PURE__*/new WeakMap();

var _dataSaved$1 = /*#__PURE__*/new WeakMap();

class ApplicationState {
  /**
   * @type {Map<string, ApplicationData>}
   */

  /**
   * @param {{ reactive: SvelteReactive, options: object }}   application - The application.
   */
  constructor(application) {
    _classPrivateFieldInitSpec(this, _application$1, {
      writable: true,
      value: void 0
    });

    _classPrivateFieldInitSpec(this, _dataSaved$1, {
      writable: true,
      value: new Map()
    });

    _classPrivateFieldSet(this, _application$1, application);
  }
  /**
   * Returns current application state along with any extra data passed into method.
   *
   * @param {object} [extra] - Extra data to add to application state.
   *
   * @returns {ApplicationData} Passed in object with current application state.
   */


  get(extra = {}) {
    var _classPrivateFieldGet2, _classPrivateFieldGet3, _classPrivateFieldGet4, _classPrivateFieldGet5, _classPrivateFieldGet6;

    return Object.assign(extra, {
      position: (_classPrivateFieldGet2 = _classPrivateFieldGet(this, _application$1)) === null || _classPrivateFieldGet2 === void 0 ? void 0 : (_classPrivateFieldGet3 = _classPrivateFieldGet2.position) === null || _classPrivateFieldGet3 === void 0 ? void 0 : _classPrivateFieldGet3.get(),
      options: Object.assign({}, (_classPrivateFieldGet4 = _classPrivateFieldGet(this, _application$1)) === null || _classPrivateFieldGet4 === void 0 ? void 0 : _classPrivateFieldGet4.options),
      ui: {
        minimized: (_classPrivateFieldGet5 = _classPrivateFieldGet(this, _application$1)) === null || _classPrivateFieldGet5 === void 0 ? void 0 : (_classPrivateFieldGet6 = _classPrivateFieldGet5.reactive) === null || _classPrivateFieldGet6 === void 0 ? void 0 : _classPrivateFieldGet6.minimized
      }
    });
  }
  /**
   * Returns any stored save state by name.
   *
   * @param {string}   name - Saved data set name.
   *
   * @returns {ApplicationData} The saved data set.
   */


  getSave({
    name
  }) {
    if (typeof name !== 'string') {
      throw new TypeError(`ApplicationState - getSave error: 'name' is not a string.`);
    }

    return _classPrivateFieldGet(this, _dataSaved$1).get(name);
  }
  /**
   * Removes and returns any application state by name.
   *
   * @param {object}   options - Options.
   *
   * @param {string}   options.name - Name to remove and retrieve.
   *
   * @returns {ApplicationData} Saved position data.
   */


  remove({
    name
  }) {
    if (typeof name !== 'string') {
      throw new TypeError(`Position - remove: 'name' is not a string.`);
    }

    const data = _classPrivateFieldGet(this, _dataSaved$1).get(name);

    _classPrivateFieldGet(this, _dataSaved$1).delete(name);

    return data;
  }
  /**
   * Restores a saved application state returning the data. Several optional parameters are available
   * to control whether the restore action occurs silently (no store / inline styles updates), animates
   * to the stored data, or simply sets the stored data. Restoring via {@link Position.animateTo} allows
   * specification of the duration, easing, and interpolate functions along with configuring a Promise to be
   * returned if awaiting the end of the animation.
   *
   * @param {object}            params - Parameters
   *
   * @param {string}            params.name - Saved data set name.
   *
   * @param {boolean}           [params.remove=false] - Remove data set.
   *
   * @param {boolean}           [params.async=false] - If animating return a Promise that resolves with any saved data.
   *
   * @param {boolean}           [params.animateTo=false] - Animate to restore data.
   *
   * @param {number}            [params.duration=100] - Duration in milliseconds.
   *
   * @param {Function}          [params.easing=linear] - Easing function.
   *
   * @param {Function}          [params.interpolate=lerp] - Interpolation function.
   *
   * @returns {ApplicationData} Saved application data.
   */


  restore({
    name,
    remove = false,
    async = false,
    animateTo = false,
    duration = 100,
    easing = identity,
    interpolate = lerp
  }) {
    if (typeof name !== 'string') {
      throw new TypeError(`ApplicationState - restore error: 'name' is not a string.`);
    }

    const dataSaved = _classPrivateFieldGet(this, _dataSaved$1).get(name);

    if (dataSaved) {
      if (remove) {
        _classPrivateFieldGet(this, _dataSaved$1).delete(name);
      }

      return this.set(dataSaved, {
        async,
        animateTo,
        duration,
        easing,
        interpolate
      });
    }

    return dataSaved;
  }
  /**
   * Saves current application state with the opportunity to add extra data to the saved state.
   *
   * @param {object}   options - Options.
   *
   * @param {string}   options.name - name to index this saved data.
   *
   * @param {...*}     [options.extra] - Extra data to add to saved data.
   *
   * @returns {ApplicationData} Current position data
   */


  save(_ref) {
    let {
      name
    } = _ref,
        extra = _objectWithoutProperties(_ref, _excluded$1);

    if (typeof name !== 'string') {
      throw new TypeError(`ApplicationState - save error: 'name' is not a string.`);
    }

    const data = this.get(extra);

    _classPrivateFieldGet(this, _dataSaved$1).set(name, data);

    return data;
  }
  /**
   * Restores a saved positional state returning the data. Several optional parameters are available
   * to control whether the restore action occurs silently (no store / inline styles updates), animates
   * to the stored data, or simply sets the stored data. Restoring via {@link Position.animateTo} allows
   * specification of the duration, easing, and interpolate functions along with configuring a Promise to be
   * returned if awaiting the end of the animation.
   *
   * @param {ApplicationData}   data - Saved data set name.
   *
   * @param {object}            opts - Optional parameters
   *
   * @param {boolean}           [opts.async=false] - If animating return a Promise that resolves with any saved data.
   *
   * @param {boolean}           [opts.animateTo=false] - Animate to restore data.
   *
   * @param {number}            [opts.duration=100] - Duration in milliseconds.
   *
   * @param {Function}          [opts.easing=linear] - Easing function.
   *
   * @param {Function}          [opts.interpolate=lerp] - Interpolation function.
   *
   * @returns {Application} application.
   */


  set(data, {
    async = false,
    animateTo = false,
    duration = 100,
    easing = identity,
    interpolate = lerp
  }) {
    if (typeof data !== 'object') {
      throw new TypeError(`ApplicationState - restore error: 'data' is not an object.`);
    }

    const application = _classPrivateFieldGet(this, _application$1);

    if (data) {
      // Merge in saved options to application.
      if (typeof (data === null || data === void 0 ? void 0 : data.options) === 'object') {
        application === null || application === void 0 ? void 0 : application.reactive.mergeOptions(data.options);
      }

      if (typeof (data === null || data === void 0 ? void 0 : data.ui) === 'object') {
        var _data$ui, _application$reactive, _application$reactive2;

        const minimized = typeof ((_data$ui = data.ui) === null || _data$ui === void 0 ? void 0 : _data$ui.minimized) === 'boolean' ? data.ui.minimized : false; // Application is currently minimized and stored state is not, so reset minimized state without animationn.

        if (application !== null && application !== void 0 && (_application$reactive = application.reactive) !== null && _application$reactive !== void 0 && _application$reactive.minimized && !minimized) {
          application.maximize({
            animate: false,
            duration: 0
          });
        } else if (!(application !== null && application !== void 0 && (_application$reactive2 = application.reactive) !== null && _application$reactive2 !== void 0 && _application$reactive2.minimized) && minimized) {
          application.minimize({
            animate: false,
            duration
          });
        }
      }

      if (typeof (data === null || data === void 0 ? void 0 : data.position) === 'object') {
        // Update data directly with no store or inline style updates.
        if (animateTo) // Animate to saved data.
          {
            // Provide special handling to potentially change transform origin as this parameter is not animated.
            if (data.position.transformOrigin !== application.position.transformOrigin) {
              application.position.transformOrigin = data.position.transformOrigin;
            } // Return a Promise with saved data that resolves after animation ends.


            if (async) {
              return application.position.animateTo(data.position, {
                duration,
                easing,
                interpolate
              }).then(() => application);
            } else // Animate synchronously.
              {
                application.position.animateTo(data.position, {
                  duration,
                  easing,
                  interpolate
                });
              }
          } else {
          // Default options is to set data for an immediate update.
          application.position.set(data.position);
        }
      }
    }

    return application;
  }

}
/**
 * @typedef {object} ApplicationData
 *
 * @property {PositionData}   position - Application position.
 *
 * @property {object}         options - Application options.
 *
 * @property {object}         ui - Application UI state.
 */

var _applicationShellHolder$1 = /*#__PURE__*/new WeakMap();

var _svelteData$1 = /*#__PURE__*/new WeakMap();

/**
 * Provides a helper class for {@link SvelteApplication} by combining all methods that work on the {@link SvelteData[]}
 * of mounted components. This class is instantiated and can be retrieved by the getter `svelte` via SvelteApplication.
 */
class GetSvelteData {
  /**
   * @type {MountedAppShell[]|null[]}
   */

  /**
   * @type {SvelteData[]}
   */

  /**
   * Keep a direct reference to the SvelteData array in an associated {@link SvelteApplication}.
   *
   * @param {MountedAppShell[]|null[]}  applicationShellHolder - A reference to the MountedAppShell array.
   *
   * @param {SvelteData[]}  svelteData - A reference to the SvelteData array of mounted components.
   */
  constructor(applicationShellHolder, svelteData) {
    _classPrivateFieldInitSpec(this, _applicationShellHolder$1, {
      writable: true,
      value: void 0
    });

    _classPrivateFieldInitSpec(this, _svelteData$1, {
      writable: true,
      value: void 0
    });

    _classPrivateFieldSet(this, _applicationShellHolder$1, applicationShellHolder);

    _classPrivateFieldSet(this, _svelteData$1, svelteData);
  }
  /**
   * Returns any mounted {@link MountedAppShell}.
   *
   * @returns {MountedAppShell|null} Any mounted application shell.
   */


  get applicationShell() {
    return _classPrivateFieldGet(this, _applicationShellHolder$1)[0];
  }
  /**
   * Returns the indexed Svelte component.
   *
   * @param {number}   index -
   *
   * @returns {object} The loaded Svelte component.
   */


  component(index) {
    const data = _classPrivateFieldGet(this, _svelteData$1)[index];

    return typeof data === 'object' ? data === null || data === void 0 ? void 0 : data.component : void 0;
  }
  /**
   * Returns the Svelte component entries iterator.
   *
   * @returns {Generator<Array<number|SvelteComponent>>} Svelte component entries iterator.
   * @yields
   */


  *componentEntries() {
    for (let cntr = 0; cntr < _classPrivateFieldGet(this, _svelteData$1).length; cntr++) {
      yield [cntr, _classPrivateFieldGet(this, _svelteData$1)[cntr].component];
    }
  }
  /**
   * Returns the Svelte component values iterator.
   *
   * @returns {Generator<SvelteComponent>} Svelte component values iterator.
   * @yields
   */


  *componentValues() {
    for (let cntr = 0; cntr < _classPrivateFieldGet(this, _svelteData$1).length; cntr++) {
      yield _classPrivateFieldGet(this, _svelteData$1)[cntr].component;
    }
  }
  /**
   * Returns the indexed SvelteData entry.
   *
   * @param {number}   index -
   *
   * @returns {SvelteData} The loaded Svelte config + component.
   */


  data(index) {
    return _classPrivateFieldGet(this, _svelteData$1)[index];
  }
  /**
   * Returns the {@link SvelteData} instance for a given component.
   *
   * @param {object} component - Svelte component.
   *
   * @returns {SvelteData} -  The loaded Svelte config + component.
   */


  dataByComponent(component) {
    for (const data of _classPrivateFieldGet(this, _svelteData$1)) {
      if (data.component === component) {
        return data;
      }
    }

    return void 0;
  }
  /**
   * Returns the SvelteData entries iterator.
   *
   * @returns {IterableIterator<[number, SvelteData]>} SvelteData entries iterator.
   */


  dataEntries() {
    return _classPrivateFieldGet(this, _svelteData$1).entries();
  }
  /**
   * Returns the SvelteData values iterator.
   *
   * @returns {IterableIterator<SvelteData>} SvelteData values iterator.
   */


  dataValues() {
    return _classPrivateFieldGet(this, _svelteData$1).values();
  }
  /**
   * Returns the length of the mounted Svelte component list.
   *
   * @returns {number} Length of mounted Svelte component list.
   */


  get length() {
    return _classPrivateFieldGet(this, _svelteData$1).length;
  }

}

/**
 * Instantiates and attaches a Svelte component to the main inserted HTML.
 *
 * @param {SvelteFormApplication} app - The application
 *
 * @param {JQuery}            html - The inserted HTML.
 *
 * @param {object}            config - Svelte component options
 *
 * @param {Function}          elementRootUpdate - A callback to assign to the external context.
 *
 * @returns {SvelteData} The config + instantiated Svelte component.
 */

function loadSvelteConfig(app, html, config, elementRootUpdate) {
  const svelteOptions = typeof config.options === 'object' ? config.options : {};
  let target;

  if (config.target instanceof HTMLElement) // A specific HTMLElement to append Svelte component.
    {
      target = config.target;
    } else if (typeof config.target === 'string') // A string target defines a selector to find in existing HTML.
    {
      target = html.find(config.target).get(0);
    } else // No target defined, create a document fragment.
    {
      target = document.createDocumentFragment();
    }

  if (target === void 0) {
    throw new Error(`SvelteFormApplication - s_LOAD_CONFIG - could not find target selector: ${config.target} for config:\n${JSON.stringify(config)}`);
  }

  const NewSvelteComponent = config.class;
  const svelteConfig = parseSvelteConfig(_objectSpread2(_objectSpread2({}, config), {}, {
    target
  }), app);
  const externalContext = svelteConfig.context.get('external'); // Inject the Foundry application instance and `elementRootUpdate` to the external context.

  externalContext.application = app;
  externalContext.elementRootUpdate = elementRootUpdate;
  let eventbus; // Potentially inject any TyphonJS eventbus and track the proxy in the SvelteData instance.

  if (typeof app._eventbus === 'object' && typeof app._eventbus.createProxy === 'function') {
    eventbus = app._eventbus.createProxy();
    externalContext.eventbus = eventbus;
  } // Create the Svelte component.

  /**
   * @type {import('svelte').SvelteComponent}
   */


  const component = new NewSvelteComponent(svelteConfig); // Set any eventbus to the config.

  svelteConfig.eventbus = eventbus;
  /**
   * @type {HTMLElement}
   */

  let element; // We can directly get the root element from components which follow the application store contract.

  if (isApplicationShell(component)) {
    element = component.elementRoot;
  } // Detect if target is a synthesized DocumentFragment with an child element. Child elements will be present
  // if the Svelte component mounts and renders initial content into the document fragment.


  if (config.target instanceof DocumentFragment && target.firstElementChild) {
    if (element === void 0) {
      element = target.firstElementChild;
    }

    html.append(target);
  } else if (config.target instanceof HTMLElement && element === void 0) {
    if (config.target instanceof HTMLElement && typeof svelteOptions.selectorElement !== 'string') {
      throw new Error(`SvelteFormApplication - s_LOAD_CONFIG - HTMLElement target with no 'selectorElement' defined for config:\n${JSON.stringify(config)}`);
    } // The target is an HTMLElement so find the Application element from `selectorElement` option.


    element = target.querySelector(svelteOptions.selectorElement);

    if (element === null || element === void 0) {
      throw new Error(`SvelteFormApplication - s_LOAD_CONFIG - HTMLElement target - could not find 'selectorElement' for config:\n${JSON.stringify(config)}`);
    }
  } // If the configuration / original target is an HTML element then do not inject HTML.


  const injectHTML = !(config.target instanceof HTMLElement);
  return {
    config: svelteConfig,
    component,
    element,
    injectHTML
  };
}

const s_REGEX = /(\d+)\s*px/;
/**
 * Parses a pixel string / computed styles. Ex. `100px` returns `100`.
 *
 * @param {string}   value - Value to parse.
 *
 * @returns {number|undefined} The integer component of a pixel string.
 */

function styleParsePixels(value) {
  if (typeof value !== 'string') {
    return void 0;
  }

  const isPixels = s_REGEX.test(value);
  const number = parseInt(value);
  return isPixels && Number.isFinite(number) ? number : void 0;
}

const subscriber_queue = [];
/**
 * Creates a `Readable` store that allows reading by subscription.
 * @param value initial value
 * @param {StartStopNotifier}start start and stop notifications for subscriptions
 */

function readable(value, start) {
  return {
    subscribe: writable(value, start).subscribe
  };
}
/**
 * Create a `Writable` store that allows both updating and reading by subscription.
 * @param {*=}value initial value
 * @param {StartStopNotifier=}start start and stop notifications for subscriptions
 */


function writable(value, start = noop) {
  let stop;
  const subscribers = new Set();

  function set(new_value) {
    if (safe_not_equal(value, new_value)) {
      value = new_value;

      if (stop) {
        // store is ready
        const run_queue = !subscriber_queue.length;

        for (const subscriber of subscribers) {
          subscriber[1]();
          subscriber_queue.push(subscriber, value);
        }

        if (run_queue) {
          for (let i = 0; i < subscriber_queue.length; i += 2) {
            subscriber_queue[i][0](subscriber_queue[i + 1]);
          }

          subscriber_queue.length = 0;
        }
      }
    }
  }

  function update(fn) {
    set(fn(value));
  }

  function subscribe(run, invalidate = noop) {
    const subscriber = [run, invalidate];
    subscribers.add(subscriber);

    if (subscribers.size === 1) {
      stop = start(set) || noop;
    }

    run(value);
    return () => {
      subscribers.delete(subscriber);

      if (subscribers.size === 0) {
        stop();
        stop = null;
      }
    };
  }

  return {
    set,
    update,
    subscribe
  };
}

function derived(stores, fn, initial_value) {
  const single = !Array.isArray(stores);
  const stores_array = single ? [stores] : stores;
  const auto = fn.length < 2;
  return readable(initial_value, set => {
    let inited = false;
    const values = [];
    let pending = 0;
    let cleanup = noop;

    const sync = () => {
      if (pending) {
        return;
      }

      cleanup();
      const result = fn(single ? values[0] : values, set);

      if (auto) {
        set(result);
      } else {
        cleanup = is_function(result) ? result : noop;
      }
    };

    const unsubscribers = stores_array.map((store, i) => subscribe(store, value => {
      values[i] = value;
      pending &= ~(1 << i);

      if (inited) {
        sync();
      }
    }, () => {
      pending |= 1 << i;
    }));
    inited = true;
    sync();
    return function stop() {
      run_all(unsubscribers);
      cleanup();
    };
  });
}

/**
 * Subscribes to the given store with the update function provided and ignores the first automatic
 * update. All future updates are dispatched to the update function.
 *
 * @param {import('svelte/store').Readable | import('svelte/store').Writable} store -
 *  Store to subscribe to...
 *
 * @param {import('svelte/store').Updater} update - function to receive future updates.
 *
 * @returns {import('svelte/store').Unsubscriber} Store unsubscribe function.
 */


function subscribeIgnoreFirst(store, update) {
  let firedFirst = false;
  return store.subscribe(value => {
    if (!firedFirst) {
      firedFirst = true;
    } else {
      update(value);
    }
  });
}
/**
 * @external Store
 * @see [Svelte stores](https://svelte.dev/docs#Store_contract)
 */

/**
 * Create a store similar to [Svelte's `derived`](https://svelte.dev/docs#derived), but which
 * has its own `set` and `update` methods and can send values back to the origin stores.
 * [Read more...](https://github.com/PixievoltNo1/svelte-writable-derived#default-export-writablederived)
 * 
 * @param {Store|Store[]} origins One or more stores to derive from. Same as
 * [`derived`](https://svelte.dev/docs#derived)'s 1st parameter.
 * @param {!Function} derive The callback to determine the derived value. Same as
 * [`derived`](https://svelte.dev/docs#derived)'s 2nd parameter.
 * @param {!Function|{withOld: !Function}} reflect Called when the
 * derived store gets a new value via its `set` or `update` methods, and determines new values for
 * the origin stores. [Read more...](https://github.com/PixievoltNo1/svelte-writable-derived#new-parameter-reflect)
 * @param [initial] The new store's initial value. Same as
 * [`derived`](https://svelte.dev/docs#derived)'s 3rd parameter.
 * 
 * @returns {Store} A writable store.
 */


function writableDerived(origins, derive, reflect, initial) {
  var childDerivedSetter,
      originValues,
      allowDerive = true;
  var reflectOldValues = ("withOld" in reflect);

  var wrappedDerive = (got, set) => {
    childDerivedSetter = set;

    if (reflectOldValues) {
      originValues = got;
    }

    if (allowDerive) {
      let returned = derive(got, set);

      if (derive.length < 2) {
        set(returned);
      } else {
        return returned;
      }
    }
  };

  var childDerived = derived(origins, wrappedDerive, initial);
  var singleOrigin = !Array.isArray(origins);

  var sendUpstream = setWith => {
    allowDerive = false;

    if (singleOrigin) {
      origins.set(setWith);
    } else {
      setWith.forEach((value, i) => {
        origins[i].set(value);
      });
    }

    allowDerive = true;
  };

  if (reflectOldValues) {
    reflect = reflect.withOld;
  }

  var reflectIsAsync = reflect.length >= (reflectOldValues ? 3 : 2);
  var cleanup = null;

  function doReflect(reflecting) {
    if (cleanup) {
      cleanup();
      cleanup = null;
    }

    if (reflectOldValues) {
      var returned = reflect(reflecting, originValues, sendUpstream);
    } else {
      var returned = reflect(reflecting, sendUpstream);
    }

    if (reflectIsAsync) {
      if (typeof returned == "function") {
        cleanup = returned;
      }
    } else {
      sendUpstream(returned);
    }
  }

  var tryingSet = false;

  function update(fn) {
    var isUpdated, mutatedBySubscriptions, oldValue, newValue;

    if (tryingSet) {
      newValue = fn(get_store_value(childDerived));
      childDerivedSetter(newValue);
      return;
    }

    var unsubscribe = childDerived.subscribe(value => {
      if (!tryingSet) {
        oldValue = value;
      } else if (!isUpdated) {
        isUpdated = true;
      } else {
        mutatedBySubscriptions = true;
      }
    });
    newValue = fn(oldValue);
    tryingSet = true;
    childDerivedSetter(newValue);
    unsubscribe();
    tryingSet = false;

    if (mutatedBySubscriptions) {
      newValue = get_store_value(childDerived);
    }

    if (isUpdated) {
      doReflect(newValue);
    }
  }

  return {
    subscribe: childDerived.subscribe,

    set(value) {
      update(() => value);
    },

    update
  };
}
/**
 * Create a store for a property value in an object contained in another store.
 * [Read more...](https://github.com/PixievoltNo1/svelte-writable-derived#named-export-propertystore)
 * 
 * @param {Store} origin The store containing the object to get/set from.
 * @param {string|number|symbol|Array<string|number|symbol>} propName The property to get/set, or a path of
 * properties in nested objects.
 *
 * @returns {Store} A writable store.
 */


function propertyStore(origin, propName) {
  if (!Array.isArray(propName)) {
    return writableDerived(origin, object => object[propName], {
      withOld(reflecting, object) {
        object[propName] = reflecting;
        return object;
      }

    });
  } else {
    let props = propName.concat();
    return writableDerived(origin, value => {
      for (let i = 0; i < props.length; ++i) {
        value = value[props[i]];
      }

      return value;
    }, {
      withOld(reflecting, object) {
        let target = object;

        for (let i = 0; i < props.length - 1; ++i) {
          target = target[props[i]];
        }

        target[props[props.length - 1]] = reflecting;
        return object;
      }

    });
  }
}

const storeState = writable(void 0);
/**
 * @type {GameState} Provides a Svelte store wrapping the Foundry runtime / global game state.
 */

const gameState = {
  subscribe: storeState.subscribe,
  get: () => game
};
Object.freeze(gameState);
Hooks.once('ready', () => storeState.set(game));

/**
 * Contains the reactive functionality / Svelte stores associated with SvelteApplication.
 */

var _application = /*#__PURE__*/new WeakMap();

var _initialized = /*#__PURE__*/new WeakMap();

var _storeAppOptions = /*#__PURE__*/new WeakMap();

var _storeAppOptionsUpdate = /*#__PURE__*/new WeakMap();

var _dataUIState = /*#__PURE__*/new WeakMap();

var _storeUIState = /*#__PURE__*/new WeakMap();

var _storeUIStateUpdate = /*#__PURE__*/new WeakMap();

var _storeUnsubscribe = /*#__PURE__*/new WeakMap();

var _storesInitialize = /*#__PURE__*/new WeakSet();

var _storesSubscribe = /*#__PURE__*/new WeakSet();

var _storesUnsubscribe = /*#__PURE__*/new WeakSet();

class SvelteReactive {
  /**
   * @type {SvelteApplication}
   */

  /**
   * @type {boolean}
   */

  /**
   * The Application option store which is injected into mounted Svelte component context under the `external` key.
   *
   * @type {StoreAppOptions}
   */

  /**
   * Stores the update function for `#storeAppOptions`.
   *
   * @type {import('svelte/store').Writable.update}
   */

  /**
   * Stores the UI state data to make it accessible via getters.
   *
   * @type {object}
   */

  /**
   * The UI option store which is injected into mounted Svelte component context under the `external` key.
   *
   * @type {StoreUIOptions}
   */

  /**
   * Stores the update function for `#storeUIState`.
   *
   * @type {import('svelte/store').Writable.update}
   */

  /**
   * Stores the unsubscribe functions from local store subscriptions.
   *
   * @type {import('svelte/store').Unsubscriber[]}
   */

  /**
   * @param {SvelteApplication} application - The host Foundry application.
   */
  constructor(application) {
    _classPrivateMethodInitSpec(this, _storesUnsubscribe);

    _classPrivateMethodInitSpec(this, _storesSubscribe);

    _classPrivateMethodInitSpec(this, _storesInitialize);

    _classPrivateFieldInitSpec(this, _application, {
      writable: true,
      value: void 0
    });

    _classPrivateFieldInitSpec(this, _initialized, {
      writable: true,
      value: false
    });

    _classPrivateFieldInitSpec(this, _storeAppOptions, {
      writable: true,
      value: void 0
    });

    _classPrivateFieldInitSpec(this, _storeAppOptionsUpdate, {
      writable: true,
      value: void 0
    });

    _classPrivateFieldInitSpec(this, _dataUIState, {
      writable: true,
      value: void 0
    });

    _classPrivateFieldInitSpec(this, _storeUIState, {
      writable: true,
      value: void 0
    });

    _classPrivateFieldInitSpec(this, _storeUIStateUpdate, {
      writable: true,
      value: void 0
    });

    _classPrivateFieldInitSpec(this, _storeUnsubscribe, {
      writable: true,
      value: []
    });

    _classPrivateFieldSet(this, _application, application);
  }
  /**
   * Initializes reactive support. Package private for internal use.
   *
   * @returns {SvelteStores} Internal methods to interact with Svelte stores.
   * @package
   */


  initialize() {
    if (_classPrivateFieldGet(this, _initialized)) {
      return;
    }

    _classPrivateFieldSet(this, _initialized, true);

    _classPrivateMethodGet(this, _storesInitialize, _storesInitialize2).call(this);

    return {
      appOptionsUpdate: _classPrivateFieldGet(this, _storeAppOptionsUpdate),
      uiOptionsUpdate: _classPrivateFieldGet(this, _storeUIStateUpdate),
      subscribe: _classPrivateMethodGet(this, _storesSubscribe, _storesSubscribe2).bind(this),
      unsubscribe: _classPrivateMethodGet(this, _storesUnsubscribe, _storesUnsubscribe2).bind(this)
    };
  } // Only reactive getters ---------------------------------------------------------------------------------------------

  /**
   * Returns the current dragging UI state.
   *
   * @returns {boolean} Dragging UI state.
   */


  get dragging() {
    return _classPrivateFieldGet(this, _dataUIState).dragging;
  }
  /**
   * Returns the current minimized UI state.
   *
   * @returns {boolean} Minimized UI state.
   */


  get minimized() {
    return _classPrivateFieldGet(this, _dataUIState).minimized;
  }
  /**
   * Returns the current resizing UI state.
   *
   * @returns {boolean} Resizing UI state.
   */


  get resizing() {
    return _classPrivateFieldGet(this, _dataUIState).resizing;
  } // Reactive getter / setters -----------------------------------------------------------------------------------------

  /**
   * Returns the draggable app option.
   *
   * @returns {boolean} Draggable app option.
   */


  get draggable() {
    var _classPrivateFieldGet2, _classPrivateFieldGet3;

    return (_classPrivateFieldGet2 = _classPrivateFieldGet(this, _application)) === null || _classPrivateFieldGet2 === void 0 ? void 0 : (_classPrivateFieldGet3 = _classPrivateFieldGet2.options) === null || _classPrivateFieldGet3 === void 0 ? void 0 : _classPrivateFieldGet3.draggable;
  }
  /**
   * Returns the headerButtonNoClose app option.
   *
   * @returns {boolean} Remove the close the button in header app option.
   */


  get headerButtonNoClose() {
    var _classPrivateFieldGet4, _classPrivateFieldGet5;

    return (_classPrivateFieldGet4 = _classPrivateFieldGet(this, _application)) === null || _classPrivateFieldGet4 === void 0 ? void 0 : (_classPrivateFieldGet5 = _classPrivateFieldGet4.options) === null || _classPrivateFieldGet5 === void 0 ? void 0 : _classPrivateFieldGet5.headerButtonNoClose;
  }
  /**
   * Returns the headerButtonNoLabel app option.
   *
   * @returns {boolean} Remove the labels from buttons in header app option.
   */


  get headerButtonNoLabel() {
    var _classPrivateFieldGet6, _classPrivateFieldGet7;

    return (_classPrivateFieldGet6 = _classPrivateFieldGet(this, _application)) === null || _classPrivateFieldGet6 === void 0 ? void 0 : (_classPrivateFieldGet7 = _classPrivateFieldGet6.options) === null || _classPrivateFieldGet7 === void 0 ? void 0 : _classPrivateFieldGet7.headerButtonNoLabel;
  }
  /**
   * Returns the minimizable app option.
   *
   * @returns {boolean} Minimizable app option.
   */


  get minimizable() {
    var _classPrivateFieldGet8, _classPrivateFieldGet9;

    return (_classPrivateFieldGet8 = _classPrivateFieldGet(this, _application)) === null || _classPrivateFieldGet8 === void 0 ? void 0 : (_classPrivateFieldGet9 = _classPrivateFieldGet8.options) === null || _classPrivateFieldGet9 === void 0 ? void 0 : _classPrivateFieldGet9.minimizable;
  }
  /**
   * @inheritDoc
   */


  get popOut() {
    return _classPrivateFieldGet(this, _application).popOut;
  }
  /**
   * Returns the resizable option.
   *
   * @returns {boolean} Resizable app option.
   */


  get resizable() {
    var _classPrivateFieldGet10, _classPrivateFieldGet11;

    return (_classPrivateFieldGet10 = _classPrivateFieldGet(this, _application)) === null || _classPrivateFieldGet10 === void 0 ? void 0 : (_classPrivateFieldGet11 = _classPrivateFieldGet10.options) === null || _classPrivateFieldGet11 === void 0 ? void 0 : _classPrivateFieldGet11.resizable;
  }
  /**
   * Returns the store for app options.
   *
   * @returns {StoreAppOptions} App options store.
   */


  get storeAppOptions() {
    return _classPrivateFieldGet(this, _storeAppOptions);
  }
  /**
   * Returns the store for UI options.
   *
   * @returns {StoreUIOptions} UI options store.
   */


  get storeUIState() {
    return _classPrivateFieldGet(this, _storeUIState);
  }
  /**
   * Returns the title accessor from the parent Application class.
   * TODO: Application v2; note that super.title localizes `this.options.title`; IMHO it shouldn't.
   *
   * @returns {string} Title.
   */


  get title() {
    return _classPrivateFieldGet(this, _application).title;
  }
  /**
   * Sets `this.options.draggable` which is reactive for application shells.
   *
   * @param {boolean}  draggable - Sets the draggable option.
   */


  set draggable(draggable) {
    if (typeof draggable === 'boolean') {
      this.setOptions('draggable', draggable);
    }
  }
  /**
   * Sets `this.options.headerButtonNoClose` which is reactive for application shells.
   *
   * @param {boolean}  headerButtonNoClose - Sets the headerButtonNoClose option.
   */


  set headerButtonNoClose(headerButtonNoClose) {
    if (typeof headerButtonNoClose === 'boolean') {
      this.setOptions('headerButtonNoClose', headerButtonNoClose);
    }
  }
  /**
   * Sets `this.options.headerButtonNoLabel` which is reactive for application shells.
   *
   * @param {boolean}  headerButtonNoLabel - Sets the headerButtonNoLabel option.
   */


  set headerButtonNoLabel(headerButtonNoLabel) {
    if (typeof headerButtonNoLabel === 'boolean') {
      this.setOptions('headerButtonNoLabel', headerButtonNoLabel);
    }
  }
  /**
   * Sets `this.options.minimizable` which is reactive for application shells that are also pop out.
   *
   * @param {boolean}  minimizable - Sets the minimizable option.
   */


  set minimizable(minimizable) {
    if (typeof minimizable === 'boolean') {
      this.setOptions('minimizable', minimizable);
    }
  }
  /**
   * Sets `this.options.popOut` which is reactive for application shells. This will add / remove this application
   * from `ui.windows`.
   *
   * @param {boolean}  popOut - Sets the popOut option.
   */


  set popOut(popOut) {
    if (typeof popOut === 'boolean') {
      this.setOptions('popOut', popOut);
    }
  }
  /**
   * Sets `this.options.resizable` which is reactive for application shells.
   *
   * @param {boolean}  resizable - Sets the resizable option.
   */


  set resizable(resizable) {
    if (typeof resizable === 'boolean') {
      this.setOptions('resizable', resizable);
    }
  }
  /**
   * Sets `this.options.title` which is reactive for application shells.
   *
   * @param {string}   title - Application title; will be localized, so a translation key is fine.
   */


  set title(title) {
    if (typeof title === 'string') {
      this.setOptions('title', title);
    }
  }
  /**
   * Provides a way to safely get this applications options given an accessor string which describes the
   * entries to walk. To access deeper entries into the object format the accessor string with `.` between entries
   * to walk.
   *
   * // TODO DOCUMENT the accessor in more detail.
   *
   * @param {string}   accessor - The path / key to set. You can set multiple levels.
   *
   * @param {*}        [defaultValue] - A default value returned if the accessor is not found.
   *
   * @returns {*} Value at the accessor.
   */


  getOptions(accessor, defaultValue) {
    return safeAccess(_classPrivateFieldGet(this, _application).options, accessor, defaultValue);
  }
  /**
   * Provides a way to merge `options` into this applications options and update the appOptions store.
   *
   * @param {object}   options - The options object to merge with `this.options`.
   */


  mergeOptions(options) {
    _classPrivateFieldGet(this, _storeAppOptionsUpdate).call(this, instanceOptions => deepMerge(instanceOptions, options));
  }
  /**
   * Provides a way to safely set this applications options given an accessor string which describes the
   * entries to walk. To access deeper entries into the object format the accessor string with `.` between entries
   * to walk.
   *
   * Additionally if an application shell Svelte component is mounted and exports the `appOptions` property then
   * the application options is set to `appOptions` potentially updating the application shell / Svelte component.
   *
   * // TODO DOCUMENT the accessor in more detail.
   *
   * @param {string}   accessor - The path / key to set. You can set multiple levels.
   *
   * @param {*}        value - Value to set.
   */


  setOptions(accessor, value) {
    const success = safeSet(_classPrivateFieldGet(this, _application).options, accessor, value); // If `this.options` modified then update the app options store.

    if (success) {
      _classPrivateFieldGet(this, _storeAppOptionsUpdate).call(this, () => _classPrivateFieldGet(this, _application).options);
    }
  }
  /**
   * Initializes the Svelte stores and derived stores for the application options and UI state.
   *
   * While writable stores are created the update method is stored in private variables locally and derived Readable
   * stores are provided for essential options which are commonly used.
   *
   * These stores are injected into all Svelte components mounted under the `external` context: `storeAppOptions` and
   * ` storeUIState`.
   */


  /**
   * Updates the UI Options store with the current header buttons. You may dynamically add / remove header buttons
   * if using an application shell Svelte component. In either overriding `_getHeaderButtons` or responding to the
   * Hooks fired return a new button array and the uiOptions store is updated and the application shell will render
   * the new buttons.
   *
   * Optionally you can set in the Foundry app options `headerButtonNoClose` to remove the close button and
   * `headerButtonNoLabel` to true and labels will be removed from the header buttons.
   *
   * @param {object} opts - Optional parameters (for internal use)
   *
   * @param {boolean} opts.headerButtonNoClose - The value for `headerButtonNoClose`.
   *
   * @param {boolean} opts.headerButtonNoLabel - The value for `headerButtonNoLabel`.
   */
  updateHeaderButtons({
    headerButtonNoClose = _classPrivateFieldGet(this, _application).options.headerButtonNoClose,
    headerButtonNoLabel = _classPrivateFieldGet(this, _application).options.headerButtonNoLabel
  } = {}) {
    let buttons = _classPrivateFieldGet(this, _application)._getHeaderButtons(); // Remove close button if this.options.headerButtonNoClose is true;


    if (typeof headerButtonNoClose === 'boolean' && headerButtonNoClose) {
      buttons = buttons.filter(button => button.class !== 'close');
    } // Remove labels if this.options.headerButtonNoLabel is true;


    if (typeof headerButtonNoLabel === 'boolean' && headerButtonNoLabel) {
      for (const button of buttons) {
        button.label = void 0;
      }
    }

    _classPrivateFieldGet(this, _storeUIStateUpdate).call(this, options => {
      options.headerButtons = buttons;
      return options;
    });
  }

}

function _storesInitialize2() {
  const writableAppOptions = writable(_classPrivateFieldGet(this, _application).options); // Keep the update function locally, but make the store essentially readable.

  _classPrivateFieldSet(this, _storeAppOptionsUpdate, writableAppOptions.update);
  /**
   * Create custom store. The main subscribe method for all app options changes is provided along with derived
   * writable stores for all reactive options.
   *
   * @type {StoreAppOptions}
   */


  const storeAppOptions = {
    subscribe: writableAppOptions.subscribe,
    draggable: propertyStore(writableAppOptions, 'draggable'),
    headerButtonNoClose: propertyStore(writableAppOptions, 'headerButtonNoClose'),
    headerButtonNoLabel: propertyStore(writableAppOptions, 'headerButtonNoLabel'),
    minimizable: propertyStore(writableAppOptions, 'minimizable'),
    popOut: propertyStore(writableAppOptions, 'popOut'),
    resizable: propertyStore(writableAppOptions, 'resizable'),
    title: propertyStore(writableAppOptions, 'title')
  };
  Object.freeze(storeAppOptions);

  _classPrivateFieldSet(this, _storeAppOptions, storeAppOptions);

  _classPrivateFieldSet(this, _dataUIState, {
    dragging: false,
    headerButtons: [],
    minimized: _classPrivateFieldGet(this, _application)._minimized,
    resizing: false
  }); // Create a store for UI state data.


  const writableUIOptions = writable(_classPrivateFieldGet(this, _dataUIState)); // Keep the update function locally, but make the store essentially readable.

  _classPrivateFieldSet(this, _storeUIStateUpdate, writableUIOptions.update);
  /**
   * @type {StoreUIOptions}
   */


  const storeUIState = {
    subscribe: writableUIOptions.subscribe,
    dragging: propertyStore(writableUIOptions, 'dragging'),
    headerButtons: derived(writableUIOptions, ($options, set) => set($options.headerButtons)),
    minimized: derived(writableUIOptions, ($options, set) => set($options.minimized)),
    resizing: propertyStore(writableUIOptions, 'resizing')
  };
  Object.freeze(storeUIState); // Initialize the store with options set in the Application constructor.

  _classPrivateFieldSet(this, _storeUIState, storeUIState);
}

function _storesSubscribe2() {
  // Register local subscriptions.
  // Handles updating header buttons to add / remove the close button.
  _classPrivateFieldGet(this, _storeUnsubscribe).push(subscribeIgnoreFirst(_classPrivateFieldGet(this, _storeAppOptions).headerButtonNoClose, value => {
    this.updateHeaderButtons({
      headerButtonNoClose: value
    });
  })); // Handles updating header buttons to add / remove button labels.


  _classPrivateFieldGet(this, _storeUnsubscribe).push(subscribeIgnoreFirst(_classPrivateFieldGet(this, _storeAppOptions).headerButtonNoLabel, value => {
    this.updateHeaderButtons({
      headerButtonNoLabel: value
    });
  })); // Handles adding / removing this application from `ui.windows` when popOut changes.


  _classPrivateFieldGet(this, _storeUnsubscribe).push(subscribeIgnoreFirst(_classPrivateFieldGet(this, _storeAppOptions).popOut, value => {
    if (value && _classPrivateFieldGet(this, _application).rendered) {
      ui.windows[_classPrivateFieldGet(this, _application).appId] = _classPrivateFieldGet(this, _application);
    } else {
      delete ui.windows[_classPrivateFieldGet(this, _application).appId];
    }
  }));
}

function _storesUnsubscribe2() {
  _classPrivateFieldGet(this, _storeUnsubscribe).forEach(unsubscribe => unsubscribe());

  _classPrivateFieldSet(this, _storeUnsubscribe, []);
}

/**
 * Awaits `requestAnimationFrame` calls by the counter specified. This allows asynchronous applications for direct /
 * inline style modification amongst other direct animation techniques.
 *
 * @param {number}   [cntr=1] - A positive integer greater than 0 for amount of requestAnimationFrames to wait.
 *
 * @returns {Promise<number>} Returns current time equivalent to `performance.now()`.
 */
async function nextAnimationFrame(cntr = 1) {
  if (!Number.isInteger(cntr) || cntr < 1) {
    throw new TypeError(`nextAnimationFrame error: 'cntr' must be a positive integer greater than 0.`);
  }

  let currentTime = performance.now();

  for (; --cntr >= 0;) {
    currentTime = await new Promise(resolve => requestAnimationFrame(resolve));
  }

  return currentTime;
}

let _Symbol$iterator;

var _validatorData = /*#__PURE__*/new WeakMap();

var _mapUnsubscribe = /*#__PURE__*/new WeakMap();

_Symbol$iterator = Symbol.iterator;

/**
 * Provides the storage and sequencing of managed position validators. Each validator added may be a bespoke function or
 * a {@link ValidatorData} object containing an `id`, `validator`, and `weight` attributes; `validator` is the only
 * required attribute.
 *
 * The `id` attribute can be anything that creates a unique ID for the validator; recommended strings or numbers. This
 * allows validators to be removed by ID easily.
 *
 * The `weight` attribute is a number between 0 and 1 inclusive that allows validators to be added in a
 * predictable order which is especially handy if they are manipulated at runtime. A lower weighted validator always
 * runs before a higher weighted validator. If no weight is specified the default of '1' is assigned and it is appended
 * to the end of the validators list.
 *
 * This class forms the public API which is accessible from the `.validators` getter in the main Position instance.
 * ```
 * const position = new Position(<PositionData>);
 * position.validators.add(...);
 * position.validators.clear();
 * position.validators.length;
 * position.validators.remove(...);
 * position.validators.removeBy(...);
 * position.validators.removeById(...);
 * ```
 */
class AdapterValidators {
  /**
   * @returns {[AdapterValidators, ValidatorData[]]} Returns this and internal storage for validator adapter.
   */
  constructor() {
    _classPrivateFieldInitSpec(this, _validatorData, {
      writable: true,
      value: void 0
    });

    _classPrivateFieldInitSpec(this, _mapUnsubscribe, {
      writable: true,
      value: new Map()
    });

    _classPrivateFieldSet(this, _validatorData, []);

    Object.seal(this);
    return [this, _classPrivateFieldGet(this, _validatorData)];
  }
  /**
   * @returns {number} Returns the length of the validators array.
   */


  get length() {
    return _classPrivateFieldGet(this, _validatorData).length;
  }
  /**
   * Provides an iterator for validators.
   *
   * @returns {Generator<ValidatorData|undefined>} Generator / iterator of validators.
   * @yields {ValidatorData<T>}
   */


  *[_Symbol$iterator]() {
    if (_classPrivateFieldGet(this, _validatorData).length === 0) {
      return;
    }

    for (const entry of _classPrivateFieldGet(this, _validatorData)) {
      yield _objectSpread2({}, entry);
    }
  }
  /**
   * @param {...(ValidatorFn<T>|ValidatorData<T>)}   validators -
   */


  add(...validators) {
    var _validator$validator$;

    for (const validator of validators) {
      const validatorType = typeof validator;

      if (validatorType !== 'function' && validatorType !== 'object' || validator === null) {
        throw new TypeError(`AdapterValidator error: 'validator' is not a function or object.`);
      }

      let data = void 0;
      let subscribeFn = void 0;

      switch (validatorType) {
        case 'function':
          data = {
            id: void 0,
            validator,
            weight: 1
          };
          subscribeFn = validator.subscribe;
          break;

        case 'object':
          if (typeof validator.validator !== 'function') {
            throw new TypeError(`AdapterValidator error: 'validator' attribute is not a function.`);
          }

          if (validator.weight !== void 0 && typeof validator.weight !== 'number' || validator.weight < 0 || validator.weight > 1) {
            throw new TypeError(`AdapterValidator error: 'weight' attribute is not a number between '0 - 1' inclusive.`);
          }

          data = {
            id: validator.id !== void 0 ? validator.id : void 0,
            validator: validator.validator,
            weight: validator.weight || 1
          };
          subscribeFn = (_validator$validator$ = validator.validator.subscribe) !== null && _validator$validator$ !== void 0 ? _validator$validator$ : validator.subscribe;
          break;
      } // Find the index to insert where data.weight is less than existing values weight.


      const index = _classPrivateFieldGet(this, _validatorData).findIndex(value => {
        return data.weight < value.weight;
      }); // If an index was found insert at that location.


      if (index >= 0) {
        _classPrivateFieldGet(this, _validatorData).splice(index, 0, data);
      } else // push to end of validators.
        {
          _classPrivateFieldGet(this, _validatorData).push(data);
        }

      if (typeof subscribeFn === 'function') {
        // TODO: consider how to handle validator updates.
        const unsubscribe = subscribeFn(); // Ensure that unsubscribe is a function.

        if (typeof unsubscribe !== 'function') {
          throw new TypeError('AdapterValidator error: Filter has subscribe function, but no unsubscribe function is returned.');
        } // Ensure that the same validator is not subscribed to multiple times.


        if (_classPrivateFieldGet(this, _mapUnsubscribe).has(data.validator)) {
          throw new Error('AdapterValidator error: Filter added already has an unsubscribe function registered.');
        }

        _classPrivateFieldGet(this, _mapUnsubscribe).set(data.validator, unsubscribe);
      }
    } // Filters with subscriber functionality are assumed to immediately invoke the `subscribe` callback. If the
    // subscriber count is less than the amount of validators added then automatically trigger an index update
    // manually.
    // TODO: handle validator updates.
    // if (subscribeCount < validators.length) { this.#indexUpdate(); }

  }

  clear() {
    _classPrivateFieldGet(this, _validatorData).length = 0; // Unsubscribe from all validators with subscription support.

    for (const unsubscribe of _classPrivateFieldGet(this, _mapUnsubscribe).values()) {
      unsubscribe();
    }

    _classPrivateFieldGet(this, _mapUnsubscribe).clear(); // TODO: handle validator updates.
    // this.#indexUpdate();

  }
  /**
   * @param {...(ValidatorFn<T>|ValidatorData<T>)}   validators -
   */


  remove(...validators) {
    const length = _classPrivateFieldGet(this, _validatorData).length;

    if (length === 0) {
      return;
    }

    for (const data of validators) {
      // Handle the case that the validator may either be a function or a validator entry / object.
      const actualValidator = typeof data === 'function' ? data : data !== null && typeof data === 'object' ? data.validator : void 0;

      if (!actualValidator) {
        continue;
      }

      for (let cntr = _classPrivateFieldGet(this, _validatorData).length; --cntr >= 0;) {
        if (_classPrivateFieldGet(this, _validatorData)[cntr].validator === actualValidator) {
          _classPrivateFieldGet(this, _validatorData).splice(cntr, 1); // Invoke any unsubscribe function for given validator then remove from tracking.


          let unsubscribe = void 0;

          if (typeof (unsubscribe = _classPrivateFieldGet(this, _mapUnsubscribe).get(actualValidator)) === 'function') {
            unsubscribe();

            _classPrivateFieldGet(this, _mapUnsubscribe).delete(actualValidator);
          }
        }
      }
    } // Update the index a validator was removed.
    // TODO: handle validator updates.
    // if (length !== this.#validatorData.length) { this.#indexUpdate(); }

  }
  /**
   * Remove validators by the provided callback. The callback takes 3 parameters: `id`, `validator`, and `weight`.
   * Any truthy value returned will remove that validator.
   *
   * @param {function(*, ValidatorFn<T>, number): boolean} callback - Callback function to evaluate each validator
   *                                                                  entry.
   */


  removeBy(callback) {
    const length = _classPrivateFieldGet(this, _validatorData).length;

    if (length === 0) {
      return;
    }

    if (typeof callback !== 'function') {
      throw new TypeError(`AdapterValidator error: 'callback' is not a function.`);
    }

    _classPrivateFieldSet(this, _validatorData, _classPrivateFieldGet(this, _validatorData).filter(data => {
      const remove = callback.call(callback, _objectSpread2({}, data));

      if (remove) {
        let unsubscribe;

        if (typeof (unsubscribe = _classPrivateFieldGet(this, _mapUnsubscribe).get(data.validator)) === 'function') {
          unsubscribe();

          _classPrivateFieldGet(this, _mapUnsubscribe).delete(data.validator);
        }
      } // Reverse remove boolean to properly validator / remove this validator.


      return !remove;
    })); // TODO: handle validator updates.
    // if (length !== this.#validatorData.length) { this.#indexUpdate(); }

  }

  removeById(...ids) {
    const length = _classPrivateFieldGet(this, _validatorData).length;

    if (length === 0) {
      return;
    }

    _classPrivateFieldSet(this, _validatorData, _classPrivateFieldGet(this, _validatorData).filter(data => {
      let remove = false;

      for (const id of ids) {
        remove |= data.id === id;
      } // If not keeping invoke any unsubscribe function for given validator then remove from tracking.


      if (remove) {
        let unsubscribe;

        if (typeof (unsubscribe = _classPrivateFieldGet(this, _mapUnsubscribe).get(data.validator)) === 'function') {
          unsubscribe();

          _classPrivateFieldGet(this, _mapUnsubscribe).delete(data.validator);
        }
      }

      return !remove; // Swap here to actually remove the item via array validator method.
    })); // TODO: handle validator updates.
    // if (length !== this.#validatorData.length) { this.#indexUpdate(); }

  }

}
/**
 * @typedef {function(object, PositionData): PositionData|null} ValidatorFn - Position validator function that
 *                         takes a {@link PositionData} instance potentially modifying it or returning null if invalid.
 *
 * @property {Function} [subscribe] - Optional subscribe function following the Svelte store / subscribe pattern.
 */

/**
 * @typedef {object} ValidatorData
 *
 * @property {*}           [id=undefined] - An ID associated with this validator. Can be used to remove the validator.
 *
 * @property {ValidatorFn} validator - Position validator function that takes a {@link PositionData} instance
 *                                     potentially modifying it or returning null if invalid.
 *
 * @property {number}      [weight=1] - A number between 0 and 1 inclusive to position this validator against others.
 *
 * @property {Function}    [subscribe] - Optional subscribe function following the Svelte store / subscribe pattern.
 */

const _excluded = ["name"],
      _excluded2 = ["left", "top", "width", "height", "rotateX", "rotateY", "rotateZ", "scale", "transformOrigin", "zIndex"];
/**
 * Provides a store for position following the subscriber protocol in addition to providing individual writable derived
 * stores for each independent variable.
 */

var _subscriptions = /*#__PURE__*/new WeakMap();

var _data = /*#__PURE__*/new WeakMap();

var _dataSaved = /*#__PURE__*/new WeakMap();

var _currentAnimationKeys = /*#__PURE__*/new WeakMap();

var _defaultData = /*#__PURE__*/new WeakMap();

var _parent = /*#__PURE__*/new WeakMap();

var _elementUpdatePromises = /*#__PURE__*/new WeakMap();

var _stores$1 = /*#__PURE__*/new WeakMap();

var _transforms = /*#__PURE__*/new WeakMap();

var _transformUpdate = /*#__PURE__*/new WeakMap();

var _updateElementInvoked = /*#__PURE__*/new WeakMap();

var _validators = /*#__PURE__*/new WeakMap();

var _validatorsAdapter = /*#__PURE__*/new WeakMap();

var _updateElement = /*#__PURE__*/new WeakSet();

var _updatePosition = /*#__PURE__*/new WeakSet();

class Position {
  /**
   * @type {PositionData}
   */

  /**
   * @type {Map<string, PositionData>}
   */

  /**
   * Stores current animation keys.
   *
   * @type {Set<string>}
   */

  /**
   * @type {PositionData}
   */

  /**
   * The associated parent for positional data tracking. Used in validators.
   *
   * @type {object}
   */

  /**
   * Stores all pending set position Promise resolve functions.
   *
   * @type {Function[]}
   */

  /**
   * @type {StorePosition}
   */

  /**
   * @type {Record<string, string>}
   */

  /**
   * @type {boolean}
   */

  /**
   * @type {boolean}
   */

  /**
   * @type {AdapterValidators}
   */

  /**
   * @type {ValidatorData[]}
   */

  /**
   * @param {object}         parent - The associated parent for positional data tracking. Used in validators.
   *
   * @param {object}         options - Default values.
   */
  constructor(parent, options = {}) {
    _classPrivateMethodInitSpec(this, _updatePosition);

    _classPrivateMethodInitSpec(this, _updateElement);

    _classPrivateFieldInitSpec(this, _subscriptions, {
      writable: true,
      value: []
    });

    _classPrivateFieldInitSpec(this, _data, {
      writable: true,
      value: {
        height: null,
        left: null,
        rotateX: null,
        rotateY: null,
        rotateZ: null,
        scale: null,
        top: null,
        transformOrigin: s_TRANSFORM_ORIGIN_DEFAULT,
        width: null,
        zIndex: null
      }
    });

    _classPrivateFieldInitSpec(this, _dataSaved, {
      writable: true,
      value: new Map()
    });

    _classPrivateFieldInitSpec(this, _currentAnimationKeys, {
      writable: true,
      value: new Set()
    });

    _classPrivateFieldInitSpec(this, _defaultData, {
      writable: true,
      value: void 0
    });

    _classPrivateFieldInitSpec(this, _parent, {
      writable: true,
      value: void 0
    });

    _classPrivateFieldInitSpec(this, _elementUpdatePromises, {
      writable: true,
      value: []
    });

    _classPrivateFieldInitSpec(this, _stores$1, {
      writable: true,
      value: void 0
    });

    _classPrivateFieldInitSpec(this, _transforms, {
      writable: true,
      value: {}
    });

    _classPrivateFieldInitSpec(this, _transformUpdate, {
      writable: true,
      value: false
    });

    _classPrivateFieldInitSpec(this, _updateElementInvoked, {
      writable: true,
      value: false
    });

    _classPrivateFieldInitSpec(this, _validators, {
      writable: true,
      value: void 0
    });

    _classPrivateFieldInitSpec(this, _validatorsAdapter, {
      writable: true,
      value: void 0
    });

    _classPrivateFieldSet(this, _parent, parent);

    const _data2 = _classPrivateFieldGet(this, _data); // Set default value from options.


    if (typeof options === 'object') {
      if (Number.isFinite(options.height) || options.height === 'auto' || options.height === null) {
        _data2.height = typeof options.height === 'number' ? Math.round(options.height) : options.height;
      }

      if (Number.isFinite(options.left) || options.left === null) {
        _data2.left = typeof options.left === 'number' ? Math.round(options.left) : options.left;
      }

      if (Number.isFinite(options.rotateX) || options.rotateX === null) {
        _data2.rotateX = options.rotateX;

        if (Number.isFinite(_data2.rotateX)) {
          _classPrivateFieldGet(this, _transforms).rotateX = `rotateX(${_data2.rotateX}deg)`;
        }
      }

      if (Number.isFinite(options.rotateY) || options.rotateY === null) {
        _data2.rotateY = options.rotateY;

        if (Number.isFinite(_data2.rotateY)) {
          _classPrivateFieldGet(this, _transforms).rotateY = `rotateY(${_data2.rotateY}deg)`;
        }
      }

      if (Number.isFinite(options.rotateZ) || options.rotateZ === null) {
        _data2.rotateZ = options.rotateZ;

        if (Number.isFinite(_data2.rotateZ)) {
          _classPrivateFieldGet(this, _transforms).rotateZ = `rotateZ(${_data2.rotateZ}deg)`;
        }
      }

      if (Number.isFinite(options.scale) || options.scale === null) {
        _data2.scale = options.scale;

        if (Number.isFinite(_data2.scale)) {
          _classPrivateFieldGet(this, _transforms).scale = `scale(${_data2.scale})`;
        }
      }

      if (Number.isFinite(options.top) || options.top === null) {
        _data2.top = typeof options.top === 'number' ? Math.round(options.top) : options.top;
      }

      if (typeof options.transformOrigin === 'string' && s_TRANSFORM_ORIGINS.includes(options.transformOrigin)) {
        _data2.transformOrigin = options.transformOrigin;
      }

      if (Number.isFinite(options.width) || options.width === 'auto' || options.width === null) {
        _data2.width = typeof options.width === 'number' ? Math.round(options.width) : options.width;
      }

      if (Number.isFinite(options.zIndex) || options.zIndex === null) {
        _data2.zIndex = typeof options.zIndex === 'number' ? Math.round(options.zIndex) : options.zIndex;
      }
    }

    _classPrivateFieldSet(this, _stores$1, {
      height: propertyStore(this, 'height'),
      left: propertyStore(this, 'left'),
      rotateX: propertyStore(this, 'rotateX'),
      rotateY: propertyStore(this, 'rotateY'),
      rotateZ: propertyStore(this, 'rotateZ'),
      scale: propertyStore(this, 'scale'),
      top: propertyStore(this, 'top'),
      transformOrigin: propertyStore(this, 'transformOrigin'),
      width: propertyStore(this, 'width'),
      zIndex: propertyStore(this, 'zIndex')
    });

    _classPrivateFieldGet(this, _stores$1).transformOrigin.values = s_TRANSFORM_ORIGINS;
    Object.freeze(_classPrivateFieldGet(this, _stores$1));
    [_classPrivateFieldDestructureSet(this, _validators).value, _classPrivateFieldDestructureSet(this, _validatorsAdapter).value] = new AdapterValidators();
  }
  /**
   * Returns a promise that is resolved on the next element update with the time of the update.
   *
   * @returns {Promise<number>} Promise resolved on element update.
   */


  get elementUpdated() {
    return new Promise(resolve => _classPrivateFieldGet(this, _elementUpdatePromises).push(resolve));
  }
  /**
   * Returns the derived writable stores for individual data variables.
   *
   * @returns {StorePosition} Derived / writable stores.
   */


  get stores() {
    return _classPrivateFieldGet(this, _stores$1);
  }
  /**
   * Returns the validators.
   *
   * @returns {AdapterValidators} validators.
   */


  get validators() {
    return _classPrivateFieldGet(this, _validators);
  } // Data accessors ----------------------------------------------------------------------------------------------------

  /**
   * @returns {number|'auto'|null} height
   */


  get height() {
    return _classPrivateFieldGet(this, _data).height;
  }
  /**
   * @returns {number|null} left
   */


  get left() {
    return _classPrivateFieldGet(this, _data).left;
  }
  /**
   * @returns {number|null} rotateX
   */


  get rotateX() {
    return _classPrivateFieldGet(this, _data).rotateX;
  }
  /**
   * @returns {number|null} rotateY
   */


  get rotateY() {
    return _classPrivateFieldGet(this, _data).rotateY;
  }
  /**
   * @returns {number|null} rotateZ
   */


  get rotateZ() {
    return _classPrivateFieldGet(this, _data).rotateZ;
  }
  /**
   * @returns {number|null} scale
   */


  get scale() {
    return _classPrivateFieldGet(this, _data).scale;
  }
  /**
   * @returns {number|null} top
   */


  get top() {
    return _classPrivateFieldGet(this, _data).top;
  }
  /**
   * @returns {string} transformOrigin
   */


  get transformOrigin() {
    return _classPrivateFieldGet(this, _data).transformOrigin;
  }
  /**
   * @returns {number|'auto'|null} width
   */


  get width() {
    return _classPrivateFieldGet(this, _data).width;
  }
  /**
   * @returns {number|null} z-index
   */


  get zIndex() {
    return _classPrivateFieldGet(this, _data).zIndex;
  }
  /**
   * @param {number|'auto'|null} height -
   */


  set height(height) {
    _classPrivateFieldGet(this, _stores$1).height.set(height);
  }
  /**
   * @param {number|null} left -
   */


  set left(left) {
    _classPrivateFieldGet(this, _stores$1).left.set(left);
  }
  /**
   * @param {number|null} rotateX -
   */


  set rotateX(rotateX) {
    _classPrivateFieldGet(this, _stores$1).rotateX.set(rotateX);
  }
  /**
   * @param {number|null} rotateY -
   */


  set rotateY(rotateY) {
    _classPrivateFieldGet(this, _stores$1).rotateY.set(rotateY);
  }
  /**
   * @param {number|null} rotateZ -
   */


  set rotateZ(rotateZ) {
    _classPrivateFieldGet(this, _stores$1).rotateZ.set(rotateZ);
  }
  /**
   * @param {number|null} scale -
   */


  set scale(scale) {
    _classPrivateFieldGet(this, _stores$1).scale.set(scale);
  }
  /**
   * @param {number|null} top -
   */


  set top(top) {
    _classPrivateFieldGet(this, _stores$1).top.set(top);
  }
  /**
   * @param {string} transformOrigin -
   */


  set transformOrigin(transformOrigin) {
    if (s_TRANSFORM_ORIGINS.includes(transformOrigin)) {
      _classPrivateFieldGet(this, _stores$1).transformOrigin.set(transformOrigin);
    }
  }
  /**
   * @param {number|'auto'|null} width -
   */


  set width(width) {
    _classPrivateFieldGet(this, _stores$1).width.set(width);
  }
  /**
   * @param {number|null} zIndex -
   */


  set zIndex(zIndex) {
    _classPrivateFieldGet(this, _stores$1).zIndex.set(zIndex);
  }
  /**
   * Provides animation
   *
   * @param {PositionData}   position - The destination position.
   *
   * @param {object}         [opts] - Optional parameters.
   *
   * @param {number}         [opts.duration] - Duration in milliseconds.
   *
   * @param {Function}       [opts.easing=linear] - Easing function.
   *
   * @param {Function}       [opts.interpolate=lerp] - Interpolation function.
   *
   * @returns {Promise<void>} Animation complete.
   */


  async animateTo(position = {}, {
    duration = 1000,
    easing = identity,
    interpolate = lerp
  } = {}) {
    var _parent$options, _parent$options2;

    if (typeof position !== 'object') {
      throw new TypeError(`Position - animateTo error: 'position' is not an object.`);
    } // Early out if the application is not positionable.


    const parent = _classPrivateFieldGet(this, _parent);

    if (parent !== void 0 && typeof (parent === null || parent === void 0 ? void 0 : (_parent$options = parent.options) === null || _parent$options === void 0 ? void 0 : _parent$options.positionable) === 'boolean' && !(parent !== null && parent !== void 0 && (_parent$options2 = parent.options) !== null && _parent$options2 !== void 0 && _parent$options2.positionable)) {
      return;
    }

    if (!Number.isInteger(duration) || duration < 0) {
      throw new TypeError(`Position - animateTo error: 'duration' is not a positive integer.`);
    }

    if (typeof easing !== 'function') {
      throw new TypeError(`Position - animateTo error: 'easing' is not a function.`);
    }

    if (typeof interpolate !== 'function') {
      throw new TypeError(`Position - animateTo error: 'interpolate' is not a function.`);
    }

    const data = _classPrivateFieldGet(this, _data);

    const currentAnimationKeys = _classPrivateFieldGet(this, _currentAnimationKeys);

    const initial = {};
    const destination = {}; // Set initial data if the key / data is defined and the end position is not equal to current data.

    for (const key in position) {
      if (data[key] !== void 0 && position[key] !== data[key]) {
        destination[key] = position[key];
        initial[key] = data[key];
      }
    } // Set initial data for transform values that are often null by default.


    if (initial.rotateX === null) {
      initial.rotateX = 0;
    }

    if (initial.rotateY === null) {
      initial.rotateY = 0;
    }

    if (initial.rotateZ === null) {
      initial.rotateZ = 0;
    }

    if (initial.scale === null) {
      initial.scale = 1;
    }

    if (destination.rotateX === null) {
      destination.rotateX = 0;
    }

    if (destination.rotateY === null) {
      destination.rotateY = 0;
    }

    if (destination.rotateZ === null) {
      destination.rotateZ = 0;
    }

    if (destination.scale === null) {
      destination.scale = 1;
    } // Reject all initial data that is not a number or is current animating.
    // Add all keys that pass to `currentAnimationKeys`.


    for (const key in initial) {
      if (!Number.isFinite(initial[key]) || currentAnimationKeys.has(key)) {
        delete initial[key];
      } else {
        currentAnimationKeys.add(key);
      }
    }

    const newData = Object.assign({}, initial);
    const keys = Object.keys(newData); // Nothing to animate, so return now.

    if (keys.length === 0) {
      return;
    }

    const start = await nextAnimationFrame();
    let current = 0;

    while (current < duration) {
      const easedTime = easing(current / duration);

      for (const key of keys) {
        newData[key] = interpolate(initial[key], destination[key], easedTime);
      }

      current = (await this.set(newData).elementUpdated) - start;
    } // Prepare final update with end position data and remove keys from `currentAnimationKeys`.


    for (const key of keys) {
      newData[key] = position[key];
      currentAnimationKeys.delete(key);
    }

    this.set(newData);
  }
  /**
   * Assigns current position to object passed into method.
   *
   * @param {object|PositionData} [position] - Target to assign current position data.
   *
   * @returns {PositionData} Passed in object with current position data.
   */


  get(position = {}) {
    return Object.assign(position, _classPrivateFieldGet(this, _data));
  }
  /**
   * Returns any stored save state by name.
   *
   * @param {string}   name - Saved data set name.
   *
   * @returns {PositionData} The saved data set.
   */


  getSave({
    name
  }) {
    if (typeof name !== 'string') {
      throw new TypeError(`Position - getSave error: 'name' is not a string.`);
    }

    return _classPrivateFieldGet(this, _dataSaved).get(name);
  }
  /**
   * @returns {PositionData} Current position data.
   */


  toJSON() {
    return Object.assign({}, _classPrivateFieldGet(this, _data));
  }
  /**
   * Resets data to default values and invokes set. Check options, but by default current z-index is maintained.
   *
   * @param {object}   [opts] - Optional parameters.
   *
   * @param {boolean}  [opts.keepZIndex=false] - When true keeps current z-index.
   *
   * @param {boolean}  [opts.invokeSet=true] - When true invokes set method.
   *
   * @returns {boolean} Operation successful.
   */


  reset({
    keepZIndex = false,
    invokeSet = true
  } = {}) {
    var _classPrivateFieldGet2, _classPrivateFieldGet3;

    if (typeof _classPrivateFieldGet(this, _defaultData) !== 'object') {
      return false;
    }

    if (_classPrivateFieldGet(this, _currentAnimationKeys).size) {
      return false;
    }

    const zIndex = _classPrivateFieldGet(this, _data).zIndex;

    const data = Object.assign({}, _classPrivateFieldGet(this, _defaultData));

    if (keepZIndex) {
      data.zIndex = zIndex;
    } // Remove any keys that are currently animating.


    for (const key of _classPrivateFieldGet(this, _currentAnimationKeys)) {
      delete data[key];
    } // If current minimized invoke `maximize`.


    if ((_classPrivateFieldGet2 = _classPrivateFieldGet(this, _parent)) !== null && _classPrivateFieldGet2 !== void 0 && (_classPrivateFieldGet3 = _classPrivateFieldGet2.reactive) !== null && _classPrivateFieldGet3 !== void 0 && _classPrivateFieldGet3.minimized) {
      var _classPrivateFieldGet4, _classPrivateFieldGet5;

      (_classPrivateFieldGet4 = _classPrivateFieldGet(this, _parent)) === null || _classPrivateFieldGet4 === void 0 ? void 0 : (_classPrivateFieldGet5 = _classPrivateFieldGet4.maximize) === null || _classPrivateFieldGet5 === void 0 ? void 0 : _classPrivateFieldGet5.call(_classPrivateFieldGet4, {
        animate: false,
        duration: 0
      });
    }

    if (invokeSet) {
      this.set(data);
    }

    return true;
  }
  /**
   * Removes and returns any position state by name.
   *
   * @param {object}   options - Options.
   *
   * @param {string}   options.name - Name to remove and retrieve.
   *
   * @returns {PositionData} Saved position data.
   */


  remove({
    name
  }) {
    if (typeof name !== 'string') {
      throw new TypeError(`Position - remove: 'name' is not a string.`);
    }

    const data = _classPrivateFieldGet(this, _dataSaved).get(name);

    _classPrivateFieldGet(this, _dataSaved).delete(name);

    return data;
  }
  /**
   * Restores a saved positional state returning the data. Several optional parameters are available
   * to control whether the restore action occurs silently (no store / inline styles updates), animates
   * to the stored data, or simply sets the stored data. Restoring via {@link Position.animateTo} allows
   * specification of the duration, easing, and interpolate functions along with configuring a Promise to be
   * returned if awaiting the end of the animation.
   *
   * @param {object}            params - Parameters
   *
   * @param {string}            params.name - Saved data set name.
   *
   * @param {boolean}           [params.remove=false] - Remove data set.
   *
   * @param {Iterable<string>}  [params.properties] - Specific properties to set / animate.
   *
   * @param {boolean}           [params.silent] - Set position data directly; no store or style updates.
   *
   * @param {boolean}           [params.async=false] - If animating return a Promise that resolves with any saved data.
   *
   * @param {boolean}           [params.animateTo=false] - Animate to restore data.
   *
   * @param {number}            [params.duration=100] - Duration in milliseconds.
   *
   * @param {Function}          [params.easing=linear] - Easing function.
   *
   * @param {Function}          [params.interpolate=lerp] - Interpolation function.
   *
   * @returns {PositionData} Saved position data.
   */


  restore({
    name,
    remove = false,
    properties,
    silent = false,
    async = false,
    animateTo = false,
    duration = 100,
    easing = identity,
    interpolate = lerp
  }) {
    if (typeof name !== 'string') {
      throw new TypeError(`Position - restore error: 'name' is not a string.`);
    }

    const dataSaved = _classPrivateFieldGet(this, _dataSaved).get(name);

    if (dataSaved) {
      if (remove) {
        _classPrivateFieldGet(this, _dataSaved).delete(name);
      }

      let data = dataSaved;

      if (isIterable(properties)) {
        data = {};

        for (const property of properties) {
          data[property] = dataSaved[property];
        }
      } // Update data directly with no store or inline style updates.


      if (silent) {
        for (const property in data) {
          _classPrivateFieldGet(this, _data)[property] = data[property];
        }

        return dataSaved;
      } else if (animateTo) // Animate to saved data.
        {
          // Provide special handling to potentially change transform origin as this parameter is not animated.
          if (data.transformOrigin !== this.transformOrigin) {
            this.transformOrigin = data.transformOrigin;
          } // Return a Promise with saved data that resolves after animation ends.


          if (async) {
            return this.animateTo(data, {
              duration,
              easing,
              interpolate
            }).then(() => dataSaved);
          } else // Animate synchronously.
            {
              this.animateTo(data, {
                duration,
                easing,
                interpolate
              });
            }
        } else {
        // Default options is to set data for an immediate update.
        this.set(data);
      }
    }

    return dataSaved;
  }
  /**
   * Saves current position state with the opportunity to add extra data to the saved state.
   *
   * @param {object}   options - Options.
   *
   * @param {string}   options.name - name to index this saved data.
   *
   * @param {...*}     [options.extra] - Extra data to add to saved data.
   *
   * @returns {PositionData} Current position data
   */


  save(_ref) {
    let {
      name
    } = _ref,
        extra = _objectWithoutProperties(_ref, _excluded);

    if (typeof name !== 'string') {
      throw new TypeError(`Position - save error: 'name' is not a string.`);
    }

    const data = this.get(extra);

    _classPrivateFieldGet(this, _dataSaved).set(name, data);

    return data;
  }
  /**
   * All calculation and updates of position are implemented in {@link Position}. This allows position to be fully
   * reactive and in control of updating inline styles for the application.
   *
   * Note: the logic for updating position is improved and changes a few aspects from the default
   * {@link Application.setPosition}. The gate on `popOut` is removed, so to ensure no positional application occurs
   * popOut applications can set `this.options.positionable` to false ensuring no positional inline styles are
   * applied.
   *
   * The initial set call on an application with a target element will always set width / height as this is
   * necessary for correct calculations.
   *
   * When a target element is present updated styles are applied after validation. To modify the behavior of set
   * implement one or more validator functions and add them from the application via
   * `this.position.validators.add(<Function>)`.
   *
   * Updates to any target element are decoupled from the underlying Position data. This method returns this instance
   * that you can then await on the target element inline style update by using {@link Position.elementUpdated}.
   *
   * @param {PositionData}   [position] - Position data to set.
   *
   * @returns {Position} This Position instance.
   */


  set(position = {}) {
    var _parent$options3, _parent$options4;

    if (typeof position !== 'object') {
      throw new TypeError(`Position - set error: 'position' is not an object.`);
    }

    const parent = _classPrivateFieldGet(this, _parent); // An early out to prevent `set` from taking effect if options `positionable` is false.


    if (parent !== void 0 && typeof (parent === null || parent === void 0 ? void 0 : (_parent$options3 = parent.options) === null || _parent$options3 === void 0 ? void 0 : _parent$options3.positionable) === 'boolean' && !(parent !== null && parent !== void 0 && (_parent$options4 = parent.options) !== null && _parent$options4 !== void 0 && _parent$options4.positionable)) {
      return this;
    }

    const data = _classPrivateFieldGet(this, _data);

    const transforms = _classPrivateFieldGet(this, _transforms);

    const validators = _classPrivateFieldGet(this, _validators);

    let currentTransform = '',
        updateTransform = false;
    const el = parent === null || parent === void 0 ? void 0 : parent.elementTarget;

    if (el) {
      var _el$style$transform;

      currentTransform = (_el$style$transform = el.style.transform) !== null && _el$style$transform !== void 0 ? _el$style$transform : '';
      position = _classPrivateMethodGet(this, _updatePosition, _updatePosition2).call(this, position, el);
    } // If there are any validators allow them to potentially modify position data or reject the update.


    if (validators.length) {
      for (const validator of validators) {
        position = validator.validator(position, parent);

        if (position === null) {
          return this;
        }
      }
    }

    let modified = false;

    if (typeof position.left === 'number') {
      position.left = Math.round(position.left);

      if (data.left !== position.left) {
        data.left = position.left;
        modified = true;
      }
    }

    if (typeof position.top === 'number') {
      position.top = Math.round(position.top);

      if (data.top !== position.top) {
        data.top = position.top;
        modified = true;
      }
    }

    if (typeof position.rotateX === 'number' || position.rotateX === null) {
      if (data.rotateX !== position.rotateX) {
        data.rotateX = position.rotateX;
        updateTransform = modified = true;

        if (typeof position.rotateX === 'number') {
          transforms.rotateX = `rotateX(${position.rotateX}deg)`;
        } else {
          delete transforms.rotateX;
        }
      } else if (transforms.rotateX && !currentTransform.includes('rotateX(')) {
        updateTransform = true;
      }
    }

    if (typeof position.rotateY === 'number' || position.rotateY === null) {
      if (data.rotateY !== position.rotateY) {
        data.rotateY = position.rotateY;
        updateTransform = modified = true;

        if (typeof position.rotateY === 'number') {
          transforms.rotateY = `rotateY(${position.rotateY}deg)`;
        } else {
          delete transforms.rotateY;
        }
      } else if (transforms.rotateY && !currentTransform.includes('rotateY(')) {
        updateTransform = true;
      }
    }

    if (typeof position.rotateZ === 'number' || position.rotateZ === null) {
      if (data.rotateZ !== position.rotateZ) {
        data.rotateZ = position.rotateZ;
        updateTransform = modified = true;

        if (typeof position.rotateZ === 'number') {
          transforms.rotateZ = `rotateZ(${position.rotateZ}deg)`;
        } else {
          delete transforms.rotateZ;
        }
      } else if (transforms.rotateZ && !currentTransform.includes('rotateZ(')) {
        updateTransform = true;
      }
    }

    if (typeof position.scale === 'number' || position.scale === null) {
      position.scale = typeof position.scale === 'number' ? Math.max(0, Math.min(position.scale, 1000)) : null;

      if (data.scale !== position.scale) {
        data.scale = position.scale;
        updateTransform = modified = true;

        if (typeof position.scale === 'number') {
          transforms.scale = `scale(${position.scale})`;
        } else {
          delete transforms.scale;
        }
      } else if (transforms.scale && !currentTransform.includes('scale(')) {
        updateTransform = true;
      }
    }

    if (typeof position.transformOrigin !== void 0) {
      position.transformOrigin = s_TRANSFORM_ORIGINS.includes(position.transformOrigin) ? position.transformOrigin : s_TRANSFORM_ORIGIN_DEFAULT;

      if (data.transformOrigin !== position.transformOrigin) {
        data.transformOrigin = position.transformOrigin;
        updateTransform = modified = true;
      }
    }

    if (typeof position.zIndex === 'number') {
      position.zIndex = Math.round(position.zIndex);

      if (data.zIndex !== position.zIndex) {
        data.zIndex = position.zIndex;
        modified = true;
      }
    }

    if (typeof position.width === 'number' || position.width === 'auto' || position.width === null) {
      position.width = typeof position.width === 'number' ? Math.round(position.width) : position.width;

      if (data.width !== position.width) {
        data.width = position.width;
        modified = true;
      }
    }

    if (typeof position.height === 'number' || position.height === 'auto' || position.height === null) {
      position.height = typeof position.height === 'number' ? Math.round(position.height) : position.height;

      if (data.height !== position.height) {
        data.height = position.height;
        modified = true;
      }
    }

    if (el) {
      // Set default data after first set operation that has a target element.
      if (typeof _classPrivateFieldGet(this, _defaultData) !== 'object') {
        _classPrivateFieldSet(this, _defaultData, Object.assign({}, data));
      } // Track any transform updates that are handled in `#updateElement`.


      _classPrivateFieldSet(this, _transformUpdate, _classPrivateFieldGet(this, _transformUpdate) | updateTransform); // If there isn't already a pending update element action then initiate it.


      if (!_classPrivateFieldGet(this, _updateElementInvoked)) {
        _classPrivateMethodGet(this, _updateElement, _updateElement2).call(this);
      }
    } // Notify main store subscribers.


    if (modified) {
      // Subscriptions are stored locally as on the browser Babel is still used for private class fields / Babel
      // support until 2023. IE not doing this will require several extra method calls otherwise.
      const subscriptions = _classPrivateFieldGet(this, _subscriptions); // Early out if there are no subscribers.


      if (subscriptions.length > 0) {
        for (let cntr = 0; cntr < subscriptions.length; cntr++) {
          subscriptions[cntr](position);
        }
      }
    }

    return this;
  }
  /**
   *
   * @param {function(PositionData): void} handler - Callback function that is invoked on update / changes. Receives
   *                                                 a copy of the PositionData.
   *
   * @returns {(function(): void)} Unsubscribe function.
   */


  subscribe(handler) {
    _classPrivateFieldGet(this, _subscriptions).push(handler); // add handler to the array of subscribers


    handler(Object.assign({}, _classPrivateFieldGet(this, _data))); // call handler with current value
    // Return unsubscribe function.

    return () => {
      const index = _classPrivateFieldGet(this, _subscriptions).findIndex(sub => sub === handler);

      if (index >= 0) {
        _classPrivateFieldGet(this, _subscriptions).splice(index, 1);
      }
    };
  }
  /**
   * Decouples updates to any parent target HTMLElement inline styles. Invoke {@link Position.elementUpdated} to await
   * on the returned promise that is resolved with the current render time via `nextAnimationFrame` /
   * `requestAnimationFrame`. This allows the underlying data model to be updated immediately while updates to the
   * element are in sync with the browser and potentially in the future be further throttled.
   *
   * @returns {Promise<number>} The current time before rendering.
   */


}

async function _updateElement2() {
  var _classPrivateFieldGet6;

  _classPrivateFieldSet(this, _updateElementInvoked, true); // Await the next animation frame. In the future this can be extended to multiple frames to divide update rate.


  const currentTime = await nextAnimationFrame();

  _classPrivateFieldSet(this, _updateElementInvoked, false);

  const el = (_classPrivateFieldGet6 = _classPrivateFieldGet(this, _parent)) === null || _classPrivateFieldGet6 === void 0 ? void 0 : _classPrivateFieldGet6.elementTarget;

  if (!el) {
    // Resolve any stored Promises when multiple updates have occurred.
    if (_classPrivateFieldGet(this, _elementUpdatePromises).length) {
      for (const resolve of _classPrivateFieldGet(this, _elementUpdatePromises)) {
        resolve(currentTime);
      }

      _classPrivateFieldGet(this, _elementUpdatePromises).length = 0;
    }

    return currentTime;
  }

  const data = _classPrivateFieldGet(this, _data);

  if (typeof data.left === 'number') {
    el.style.left = `${data.left}px`;
  }

  if (typeof data.top === 'number') {
    el.style.top = `${data.top}px`;
  }

  if (typeof data.zIndex === 'number' || data.zIndex === null) {
    el.style.zIndex = typeof data.zIndex === 'number' ? `${data.zIndex}` : null;
  }

  if (typeof data.width === 'number' || data.width === 'auto' || data.width === null) {
    el.style.width = typeof data.width === 'number' ? `${data.width}px` : data.width;
  }

  if (typeof data.height === 'number' || data.height === 'auto' || data.height === null) {
    el.style.height = typeof data.height === 'number' ? `${data.height}px` : data.height;
  } // Update all transforms in order added to transforms object.


  if (_classPrivateFieldGet(this, _transformUpdate)) {
    _classPrivateFieldSet(this, _transformUpdate, false);

    let transformString = '';

    const transforms = _classPrivateFieldGet(this, _transforms);

    for (const key in transforms) {
      transformString += transforms[key];
    }

    el.style.transformOrigin = data.transformOrigin;
    el.style.transform = transformString;
  } // Resolve any stored Promises when multiple updates have occurred.


  if (_classPrivateFieldGet(this, _elementUpdatePromises).length) {
    for (const resolve of _classPrivateFieldGet(this, _elementUpdatePromises)) {
      resolve(currentTime);
    }

    _classPrivateFieldGet(this, _elementUpdatePromises).length = 0;
  }

  return currentTime;
}

function _updatePosition2(_ref2 = {}, el) {
  let {
    left,
    top,
    width,
    height,
    rotateX,
    rotateY,
    rotateZ,
    scale,
    transformOrigin,
    zIndex
  } = _ref2,
      rest = _objectWithoutProperties(_ref2, _excluded2);

  const currentPosition = this.get(rest);
  const styles = globalThis.getComputedStyle(el); // Update width if an explicit value is passed, or if no width value is set on the element.

  if (el.style.width === '' || width !== void 0) {
    if (width === 'auto' || currentPosition.width === 'auto' && width !== null) {
      currentPosition.width = 'auto';
      width = el.offsetWidth;
    } else {
      const tarW = typeof width === 'number' ? Math.round(width) : el.offsetWidth;
      const minW = styleParsePixels(styles.minWidth) || MIN_WINDOW_WIDTH;
      const maxW = styleParsePixels(styles.maxWidth) || el.style.maxWidth || globalThis.innerWidth;
      currentPosition.width = width = Math.clamped(tarW, minW, maxW);

      if (width + left > globalThis.innerWidth) {
        left = currentPosition.left;
      }
    }
  } else {
    width = el.offsetWidth;
  } // Update height if an explicit value is passed, or if no height value is set on the element.


  if (el.style.height === '' || height !== void 0) {
    if (height === 'auto' || currentPosition.height === 'auto' && height !== null) {
      currentPosition.height = 'auto';
      height = el.offsetHeight;
    } else {
      const tarH = typeof height === 'number' ? Math.round(height) : el.offsetHeight + 1;
      const minH = styleParsePixels(styles.minHeight) || MIN_WINDOW_HEIGHT;
      const maxH = styleParsePixels(styles.maxHeight) || el.style.maxHeight || globalThis.innerHeight;
      currentPosition.height = height = Math.clamped(tarH, minH, maxH);

      if (height + currentPosition.top > globalThis.innerHeight + 1) {
        top = currentPosition.top - 1;
      }
    }
  } else {
    height = el.offsetHeight;
  } // Update left


  if (el.style.left === '' || Number.isFinite(left)) {
    const tarL = Number.isFinite(left) ? left : (globalThis.innerWidth - width) / 2;
    const maxL = Math.max(globalThis.innerWidth - width, 0);
    currentPosition.left = Math.round(Math.clamped(tarL, 0, maxL));
  } // Update top


  if (el.style.top === '' || Number.isFinite(top)) {
    const tarT = Number.isFinite(top) ? top : (globalThis.innerHeight - height) / 2;
    const maxT = Math.max(globalThis.innerHeight - height, 0);
    currentPosition.top = Math.round(Math.clamped(tarT, 0, maxT));
  } // Update rotate X/Y/Z, scale, z-index


  if (typeof rotateX === 'number' || rotateX === null) {
    currentPosition.rotateX = rotateX;
  }

  if (typeof rotateY === 'number' || rotateY === null) {
    currentPosition.rotateY = rotateY;
  }

  if (typeof rotateZ === 'number' || rotateZ === null) {
    currentPosition.rotateZ = rotateZ;
  }

  if (typeof scale === 'number' || scale === null) {
    currentPosition.scale = typeof scale === 'number' ? Math.max(0, Math.min(scale, 1000)) : null;
  }

  if (typeof transformOrigin === 'string') {
    currentPosition.transformOrigin = s_TRANSFORM_ORIGINS.includes(transformOrigin) ? transformOrigin : s_TRANSFORM_ORIGIN_DEFAULT;
  }

  if (typeof zIndex === 'number' || zIndex === null) {
    currentPosition.zIndex = typeof zIndex === 'number' ? Math.round(zIndex) : zIndex;
  } // Return the updated position object.


  return currentPosition;
}

const s_TRANSFORM_ORIGIN_DEFAULT = 'top left';
/**
 * Defines the valid transform origins.
 *
 * @type {string[]}
 */

const s_TRANSFORM_ORIGINS = ['top left', 'top center', 'top right', 'center left', 'center', 'center right', 'bottom left', 'bottom center', 'bottom right'];
Object.freeze(s_TRANSFORM_ORIGINS);

/**
 * Provides a Svelte aware extension to Application to control the app lifecycle appropriately. You can declaratively
 * load one or more components from `defaultOptions`.
 */

var _applicationShellHolder = /*#__PURE__*/new WeakMap();

var _applicationState = /*#__PURE__*/new WeakMap();

var _elementTarget = /*#__PURE__*/new WeakMap();

var _elementContent = /*#__PURE__*/new WeakMap();

var _initialZIndex = /*#__PURE__*/new WeakMap();

var _onMount = /*#__PURE__*/new WeakMap();

var _position = /*#__PURE__*/new WeakMap();

var _reactive = /*#__PURE__*/new WeakMap();

var _svelteData = /*#__PURE__*/new WeakMap();

var _getSvelteData = /*#__PURE__*/new WeakMap();

var _stores = /*#__PURE__*/new WeakMap();

var _updateApplicationShell = /*#__PURE__*/new WeakSet();

class SvelteApplication extends Application {
  /**
   * Stores the first mounted component which follows the application shell contract.
   *
   * @type {MountedAppShell[]|null[]} Application shell.
   */

  /**
   * Stores and manages application state for saving / restoring / serializing.
   *
   * @type {ApplicationState}
   */

  /**
   * Stores the target element which may not necessarily be the main element.
   *
   * @type {HTMLElement}
   */

  /**
   * Stores the content element which is set for application shells.
   *
   * @type {HTMLElement}
   */

  /**
   * Stores initial z-index from `_renderOuter` to set to target element / Svelte component.
   *
   * @type {number}
   */

  /**
   * Stores on mount state which is checked in _render to trigger onSvelteMount callback.
   *
   * @type {boolean}
   */

  /**
   * The position store.
   *
   * @type {Position}
   */

  /**
   * Contains the Svelte stores and reactive accessors.
   *
   * @type {SvelteReactive}
   */

  /**
   * Stores SvelteData entries with instantiated Svelte components.
   *
   * @type {SvelteData[]}
   */

  /**
   * Provides a helper class that combines multiple methods for interacting with the mounted components tracked in
   * {@link SvelteData}.
   *
   * @type {GetSvelteData}
   */

  /**
   * Contains methods to interact with the Svelte stores.
   *
   * @type {SvelteStores}
   */

  /**
   * @inheritDoc
   */
  constructor(options = {}) {
    super(options);

    _classPrivateMethodInitSpec(this, _updateApplicationShell);

    _classPrivateFieldInitSpec(this, _applicationShellHolder, {
      writable: true,
      value: [null]
    });

    _classPrivateFieldInitSpec(this, _applicationState, {
      writable: true,
      value: void 0
    });

    _classPrivateFieldInitSpec(this, _elementTarget, {
      writable: true,
      value: null
    });

    _classPrivateFieldInitSpec(this, _elementContent, {
      writable: true,
      value: null
    });

    _classPrivateFieldInitSpec(this, _initialZIndex, {
      writable: true,
      value: 95
    });

    _classPrivateFieldInitSpec(this, _onMount, {
      writable: true,
      value: false
    });

    _classPrivateFieldInitSpec(this, _position, {
      writable: true,
      value: void 0
    });

    _classPrivateFieldInitSpec(this, _reactive, {
      writable: true,
      value: void 0
    });

    _classPrivateFieldInitSpec(this, _svelteData, {
      writable: true,
      value: []
    });

    _classPrivateFieldInitSpec(this, _getSvelteData, {
      writable: true,
      value: new GetSvelteData(_classPrivateFieldGet(this, _applicationShellHolder), _classPrivateFieldGet(this, _svelteData))
    });

    _classPrivateFieldInitSpec(this, _stores, {
      writable: true,
      value: void 0
    });

    _classPrivateFieldSet(this, _applicationState, new ApplicationState(this)); // Initialize Position with the position object set by Application.


    _classPrivateFieldSet(this, _position, new Position(this, _objectSpread2(_objectSpread2({}, this.options), this.position))); // Remove old position field.


    delete this.position;
    /**
     * Define accessors to retrieve Position by `this.position`.
     *
     * @member {PositionData} position - Adds accessors to SvelteApplication to get / set the position data.
     *
     * @memberof SvelteApplication#
     */

    Object.defineProperty(this, 'position', {
      get: () => _classPrivateFieldGet(this, _position),
      set: position => {
        if (typeof position === 'object') {
          _classPrivateFieldGet(this, _position).set(position);
        }
      }
    });

    _classPrivateFieldSet(this, _reactive, new SvelteReactive(this));

    _classPrivateFieldSet(this, _stores, _classPrivateFieldGet(this, _reactive).initialize());
  }
  /**
   * Specifies the default options that SvelteApplication supports.
   *
   * @returns {object} options - Application options.
   * @see https://foundryvtt.com/api/Application.html#options
   */


  static get defaultOptions() {
    return deepMerge(super.defaultOptions, {
      draggable: true,
      // If true then application shells are draggable.
      headerButtonNoClose: false,
      // If true then the close header button is removed.
      headerButtonNoLabel: false,
      // If true then header button labels are removed for application shells.
      defaultCloseAnimation: true,
      // If false the default slide close animation is not run.
      positionable: true,
      // If false then `position.set` does not take effect.
      rotateX: null,
      // Assigned to position.
      rotateY: null,
      // Assigned to position.
      rotateZ: null,
      // Assigned to position.
      zIndex: null // Assigned to position.

    });
  }
  /**
   * Returns the content element if an application shell is mounted.
   *
   * @returns {HTMLElement} Content element.
   */


  get elementContent() {
    return _classPrivateFieldGet(this, _elementContent);
  }
  /**
   * Returns the target element or main element if no target defined.
   *
   * @returns {HTMLElement} Target element.
   */


  get elementTarget() {
    return _classPrivateFieldGet(this, _elementTarget);
  }
  /**
   * Returns the reactive accessors & Svelte stores for SvelteApplication.
   *
   * @returns {SvelteReactive} The reactive accessors & Svelte stores.
   */


  get reactive() {
    return _classPrivateFieldGet(this, _reactive);
  }
  /**
   * Returns the application state manager.
   *
   * @returns {ApplicationState} The application state manager.
   */


  get state() {
    return _classPrivateFieldGet(this, _applicationState);
  }
  /**
   * Returns the Svelte helper class w/ various methods to access mounted Svelte components.
   *
   * @returns {GetSvelteData} GetSvelteData
   */


  get svelte() {
    return _classPrivateFieldGet(this, _getSvelteData);
  }
  /**
   * In this case of when a template is defined in app options `html` references the inner HTML / template. However,
   * to activate classic v1 tabs for a Svelte component the element target is passed as an array simulating JQuery as
   * the element is retrieved immediately and the core listeners use standard DOM queries.
   *
   * @inheritDoc
   * @protected
   * @ignore
   */


  _activateCoreListeners(html) {
    super._activateCoreListeners(typeof this.options.template === 'string' ? html : [_classPrivateFieldGet(this, _elementTarget)]);
  }
  /**
   * Provide an override to set this application as the active window regardless of z-index. Changes behaviour from
   * Foundry core. This is important / used for instance in dialog key handling for left / right button selection.
   */


  bringToTop() {
    super.bringToTop();
    ui.activeWindow = this;
  }
  /**
   * Note: This method is fully overridden and duplicated as Svelte components need to be destroyed manually and the
   * best visual result is to destroy them after the default slide up animation occurs, but before the element
   * is removed from the DOM.
   *
   * If you destroy the Svelte components before the slide up animation the Svelte elements are removed immediately
   * from the DOM. The purpose of overriding ensures the slide up animation is always completed before
   * the Svelte components are destroyed and then the element is removed from the DOM.
   *
   * Close the application and un-register references to it within UI mappings.
   * This function returns a Promise which resolves once the window closing animation concludes
   *
   * @param {object}   [options] - Optional parameters.
   *
   * @param {boolean}  [options.force] - Force close regardless of render state.
   *
   * @returns {Promise<void>}    A Promise which resolves once the application is closed.
   * @ignore
   */


  async close(options = {}) {
    const states = Application.RENDER_STATES;

    if (!options.force && ![states.RENDERED, states.ERROR].includes(this._state)) {
      return;
    } // Unsubscribe from any local stores.


    _classPrivateFieldGet(this, _stores).unsubscribe();
    /**
     * @ignore
     */


    this._state = states.CLOSING;
    /**
     * Get the element.
     *
     * @type {HTMLElement}
     */

    const el = _classPrivateFieldGet(this, _elementTarget);

    if (!el) {
      return this._state = states.CLOSED;
    } // Make any window content overflow hidden to avoid any scrollbars appearing in default or Svelte outro
    // transitions.


    const content = el.querySelector('.window-content');

    if (content) {
      content.style.overflow = 'hidden';
    } // Dispatch Hooks for closing the base and subclass applications


    for (const cls of this.constructor._getInheritanceChain()) {
      /**
       * A hook event that fires whenever this Application is closed.
       *
       * @param {Application} app                     The Application instance being closed
       *
       * @param {jQuery[]} html                       The application HTML when it is closed
       *
       * @function closeApplication
       *
       * @memberof hookEvents
       */
      Hooks.call(`close${cls.name}`, this, el);
    } // If options `defaultCloseAnimation` is false then do not execute the standard slide up animation.
    // This allows Svelte components to provide any out transition. Application shells will automatically set
    // `defaultCloseAnimation` based on any out transition set or unset.


    const animate = typeof this.options.defaultCloseAnimation === 'boolean' ? this.options.defaultCloseAnimation : true;

    if (animate) {
      // Set min height for full slide.
      el.style.minHeight = '0';
      const {
        paddingBottom,
        paddingTop
      } = globalThis.getComputedStyle(el); // Slide-up application.

      await el.animate([{
        maxHeight: `${el.clientHeight}px`,
        paddingTop,
        paddingBottom
      }, {
        maxHeight: 0,
        paddingTop: 0,
        paddingBottom: 0
      }], {
        duration: 250,
        easing: 'ease-in',
        fill: 'forwards'
      }).finished;
    } // Stores the Promises returned from running outro transitions and destroying each Svelte component.


    const svelteDestroyPromises = []; // Manually invoke the destroy callbacks for all Svelte components.

    for (const entry of _classPrivateFieldGet(this, _svelteData)) {
      // Use `outroAndDestroy` to run outro transitions before destroying.
      svelteDestroyPromises.push(outroAndDestroy(entry.component)); // If any proxy eventbus has been added then remove all event registrations from the component.

      const eventbus = entry.config.eventbus;

      if (typeof eventbus === 'object' && typeof eventbus.off === 'function') {
        eventbus.off();
        entry.config.eventbus = void 0;
      }
    } // Await all Svelte components to destroy.


    await Promise.all(svelteDestroyPromises); // Reset SvelteData like this to maintain reference to GetSvelteData / `this.svelte`.

    _classPrivateFieldGet(this, _svelteData).length = 0; // Remove element from the DOM. Most SvelteComponents have already removed it.

    el.remove(); // Silently restore any width / height state before minimized as applicable.

    this.position.restore({
      name: '#beforeMinimized',
      properties: ['width', 'height'],
      silent: true,
      remove: true
    }); // Clean up data

    _classPrivateFieldGet(this, _applicationShellHolder)[0] = null;
    /**
     * @ignore
     */

    this._element = null;

    _classPrivateFieldSet(this, _elementContent, null);

    _classPrivateFieldSet(this, _elementTarget, null);

    delete ui.windows[this.appId];
    /**
     * @ignore
     */

    this._minimized = false;
    /**
     * @ignore
     */

    this._scrollPositions = null;
    this._state = states.CLOSED;

    _classPrivateFieldSet(this, _onMount, false); // Update the minimized UI store options.


    _classPrivateFieldGet(this, _stores).uiOptionsUpdate(storeOptions => deepMerge(storeOptions, {
      minimized: this._minimized
    }));
  }
  /**
   * Inject the Svelte components defined in `this.options.svelte`. The Svelte component can attach to the existing
   * pop-out of Application or provide no template and render into a document fragment which is then attached to the
   * DOM.
   *
   * @param {JQuery} html -
   *
   * @inheritDoc
   * @ignore
   */


  _injectHTML(html) {
    if (this.popOut && html.length === 0 && Array.isArray(this.options.svelte)) {
      throw new Error('SvelteApplication - _injectHTML - A popout app with no template can only support one Svelte component.');
    } // Make sure the store is updated with the latest header buttons. Also allows filtering buttons before display.


    this.reactive.updateHeaderButtons(); // Create a function to generate a callback for Svelte components to invoke to update the tracked elements for
    // application shells in the rare cases that the main element root changes. The update is only trigged on
    // successive changes of `elementRoot`. Returns a boolean to indicate the element roots are updated.

    const elementRootUpdate = () => {
      let cntr = 0;
      return elementRoot => {
        if (elementRoot !== null && elementRoot !== void 0 && cntr++ > 0) {
          _classPrivateMethodGet(this, _updateApplicationShell, _updateApplicationShell2).call(this);

          return true;
        }

        return false;
      };
    };

    if (Array.isArray(this.options.svelte)) {
      for (const svelteConfig of this.options.svelte) {
        const svelteData = loadSvelteConfig(this, html, svelteConfig, elementRootUpdate);

        if (isApplicationShell(svelteData.component)) {
          if (this.svelte.applicationShell !== null) {
            throw new Error(`SvelteApplication - _injectHTML - An application shell is already mounted; offending config:
                    ${JSON.stringify(svelteConfig)}`);
          }

          _classPrivateFieldGet(this, _applicationShellHolder)[0] = svelteData.component;
        }

        _classPrivateFieldGet(this, _svelteData).push(svelteData);
      }
    } else if (typeof this.options.svelte === 'object') {
      const svelteData = loadSvelteConfig(this, html, this.options.svelte, elementRootUpdate);

      if (isApplicationShell(svelteData.component)) {
        // A sanity check as shouldn't hit this case as only one component is being mounted.
        if (this.svelte.applicationShell !== null) {
          throw new Error(`SvelteApplication - _injectHTML - An application shell is already mounted; offending config:
                 ${JSON.stringify(this.options.svelte)}`);
        }

        _classPrivateFieldGet(this, _applicationShellHolder)[0] = svelteData.component;
      }

      _classPrivateFieldGet(this, _svelteData).push(svelteData);
    } // Detect if this is a synthesized DocumentFragment.


    const isDocumentFragment = html.length && html[0] instanceof DocumentFragment; // If any of the Svelte components mounted directly targets an HTMLElement then do not inject HTML.

    let injectHTML = true;

    for (const svelteData of _classPrivateFieldGet(this, _svelteData)) {
      if (!svelteData.injectHTML) {
        injectHTML = false;
        break;
      }
    }

    if (injectHTML) {
      super._injectHTML(html);
    }

    if (this.svelte.applicationShell !== null) {
      this._element = $(this.svelte.applicationShell.elementRoot); // Detect if the application shell exports an `elementContent` accessor.

      _classPrivateFieldSet(this, _elementContent, hasGetter(this.svelte.applicationShell, 'elementContent') ? this.svelte.applicationShell.elementContent : null); // Detect if the application shell exports an `elementTarget` accessor.


      _classPrivateFieldSet(this, _elementTarget, hasGetter(this.svelte.applicationShell, 'elementTarget') ? this.svelte.applicationShell.elementTarget : null);
    } else if (isDocumentFragment) // Set the element of the app to the first child element in order of Svelte components mounted.
      {
        for (const svelteData of _classPrivateFieldGet(this, _svelteData)) {
          if (svelteData.element instanceof HTMLElement) {
            this._element = $(svelteData.element);
            break;
          }
        }
      } // Potentially retrieve a specific target element if `selectorTarget` is defined otherwise make the target the
    // main element.


    if (_classPrivateFieldGet(this, _elementTarget) === null) {
      const element = typeof this.options.selectorTarget === 'string' ? this._element.find(this.options.selectorTarget) : this._element;

      _classPrivateFieldSet(this, _elementTarget, element[0]);
    } // TODO VERIFY THIS CHECK ESPECIALLY `this.#elementTarget.length === 0`.


    if (_classPrivateFieldGet(this, _elementTarget) === null || _classPrivateFieldGet(this, _elementTarget) === void 0 || _classPrivateFieldGet(this, _elementTarget).length === 0) {
      throw new Error(`SvelteApplication - _injectHTML: Target element '${this.options.selectorTarget}' not found.`);
    } // The initial zIndex may be set in application options or for popOut applications is stored by `_renderOuter`
    // in `this.#initialZIndex`.


    if (typeof this.options.positionable === 'boolean' && this.options.positionable) {
      var _classPrivateFieldGet2;

      _classPrivateFieldGet(this, _elementTarget).style.zIndex = typeof this.options.zIndex === 'number' ? this.options.zIndex : (_classPrivateFieldGet2 = _classPrivateFieldGet(this, _initialZIndex)) !== null && _classPrivateFieldGet2 !== void 0 ? _classPrivateFieldGet2 : 95;
    } // Subscribe to local store handling.


    _classPrivateFieldGet(this, _stores).subscribe();
  }
  /**
   * Provides a mechanism to update the UI options store for maximized.
   *
   * Note: the sanity check is duplicated from {@link Application.maximize} the store is updated _before_
   * performing the rest of animations. This allows application shells to remove / show any resize handlers
   * correctly. Extra constraint data is stored in a saved position state in {@link SvelteApplication.minimize}
   * to animate the content area.
   *
   * @param {object} [opts] - Optional parameters.
   *
   * @param {boolean}  [opts.animate=true] - When true perform default maximizing animation.
   *
   * @param {boolean}  [opts.duration=100] - Controls content area animation duration.
   */


  async maximize({
    animate = true,
    duration = 100
  } = {}) {
    if (!this.popOut || [false, null].includes(this._minimized)) {
      return;
    }

    _classPrivateFieldGet(this, _stores).uiOptionsUpdate(options => deepMerge(options, {
      minimized: false
    }));

    this._minimized = null; // Get content

    const element = this.elementTarget;
    const header = element.querySelector('.window-header');
    const content = element.querySelector('.window-content'); // First animate / restore width / async.

    if (animate) {
      await this.position.restore({
        name: '#beforeMinimized',
        async: true,
        animateTo: true,
        properties: ['width']
      });
    } // Reset display none on all children of header.


    for (let cntr = header.children.length; --cntr >= 0;) {
      header.children[cntr].style.display = null;
    }

    content.style.display = null;
    let constraints;

    if (animate) {
      // Next animate / restore height synchronously and remove key. Retrieve constraints data for slide up animation
      // below.
      ({
        constraints
      } = this.position.restore({
        name: '#beforeMinimized',
        animateTo: true,
        properties: ['height'],
        remove: true,
        duration: 100
      }));
    } else {
      ({
        constraints
      } = this.position.remove({
        name: '#beforeMinimized'
      }));
    } // Slide down content with stored constraints.


    await content.animate([{
      maxHeight: 0,
      paddingTop: 0,
      paddingBottom: 0,
      offset: 0
    }, _objectSpread2(_objectSpread2({}, constraints), {}, {
      offset: 1
    }), {
      maxHeight: '100%',
      offset: 1
    }], {
      duration,
      fill: 'forwards'
    }).finished;
    element.classList.remove('minimized');
    this._minimized = false;
    element.style.minWidth = null;
    element.style.minHeight = null; // Using a 30ms timeout prevents any instantaneous display of scrollbars with the above maximize animation.

    setTimeout(() => content.style.overflow = null, 30);
  }
  /**
   * Provides a mechanism to update the UI options store for minimized.
   *
   * Note: the sanity check is duplicated from {@link Application.minimize} the store is updated _before_
   * performing the rest of animations. This allows application shells to remove / show any resize handlers
   * correctly. Extra constraint data is stored in a saved position state in {@link SvelteApplication.minimize}
   * to animate the content area.
   *
   * @param {object} [opts] - Optional parameters
   *
   * @param {boolean}  [opts.animate=true] - When true perform default minimizing animation.
   *
   * @param {boolean}  [opts.duration=100] - Controls content area animation duration.
   */


  async minimize({
    animate = true,
    duration = 100
  } = {}) {
    if (!this.rendered || !this.popOut || [true, null].includes(this._minimized)) {
      return;
    }

    _classPrivateFieldGet(this, _stores).uiOptionsUpdate(options => deepMerge(options, {
      minimized: true
    }));

    this._minimized = null;
    const element = this.elementTarget; // Get content

    const header = element.querySelector('.window-header');
    const content = element.querySelector('.window-content'); // Remove minimum width and height styling rules

    element.style.minWidth = '100px';
    element.style.minHeight = '30px';
    content.style.overflow = 'hidden';
    const {
      paddingBottom,
      paddingTop
    } = globalThis.getComputedStyle(content); // Extra data that is saved with the current position. Used during `maximize`.

    const constraints = {
      maxHeight: `${content.clientHeight}px`,
      paddingTop,
      paddingBottom
    }; // Slide-up content

    if (animate) {
      const animation = content.animate([constraints, {
        maxHeight: 0,
        paddingTop: 0,
        paddingBottom: 0
      }], {
        duration,
        fill: 'forwards'
      }); // Set display style to none when animation finishes.

      animation.finished.then(() => content.style.display = 'none');
    } else {
      setTimeout(() => content.style.display = 'none', duration);
    } // Save current position state and add the constraint data to use in `maximize`.


    this.position.save({
      name: '#beforeMinimized',
      constraints
    });

    if (animate) {
      // First await animation of height upward.
      await this.position.animateTo({
        height: header.offsetHeight
      }, {
        duration: 100
      });
    } // Set all header buttons besides close and the window title to display none.


    for (let cntr = header.children.length; --cntr >= 0;) {
      const className = header.children[cntr].className;

      if (className.includes('window-title') || className.includes('close')) {
        continue;
      }

      header.children[cntr].style.display = 'none';
    }

    if (animate) {
      // Await animation of width to the left / minimum width.
      await this.position.animateTo({
        width: MIN_WINDOW_WIDTH
      }, {
        duration: 100
      });
    }

    element.classList.add('minimized');
    this._minimized = true;
  }
  /**
   * Provides a callback after all Svelte components are initialized.
   *
   * @param {object}      [opts] - Optional parameters.
   *
   * @param {HTMLElement} [opts.element] - HTMLElement container for main application element.
   *
   * @param {HTMLElement} [opts.elementContent] - HTMLElement container for content area of application shells.
   *
   * @param {HTMLElement} [opts.elementTarget] - HTMLElement container for main application target element.
   */


  onSvelteMount({
    element,
    elementContent,
    elementTarget
  }) {} // eslint-disable-line no-unused-vars

  /**
   * Override replacing HTML as Svelte components control the rendering process. Only potentially change the outer
   * application frame / title for pop-out applications.
   *
   * @inheritDoc
   * @ignore
   */


  _replaceHTML(element, html) // eslint-disable-line no-unused-vars
  {
    if (!element.length) {
      return;
    }

    this.reactive.updateHeaderButtons();
  }
  /**
   * Provides an override verifying that a new Application being rendered for the first time doesn't have a
   * corresponding DOM element already loaded. This is a check that only occurs when `this._state` is
   * `Application.RENDER_STATES.NONE`. It is useful in particular when SvelteApplication has a static ID
   * explicitly set in `this.options.id` and long intro / outro transitions are assigned. If a new application
   * sharing this static ID attempts to open / render for the first time while an existing DOM element sharing
   * this static ID exists then the initial render is cancelled below rather than crashing later in the render
   * cycle {@link Position.set}.
   *
   * @inheritDoc
   * @protected
   * @ignore
   */


  async _render(force = false, options = {}) {
    if (this._state === Application.RENDER_STATES.NONE && document.querySelector(`#${this.id}`) instanceof HTMLElement) {
      console.warn(`SvelteApplication - _render: A DOM element already exists for CSS ID '${this.id}'. Cancelling initial render for new application with appId '${this.appId}'.`);
      return;
    }

    await super._render(force, options);

    if (!_classPrivateFieldGet(this, _onMount)) {
      this.onSvelteMount({
        element: this._element[0],
        elementContent: _classPrivateFieldGet(this, _elementContent),
        elementTarget: _classPrivateFieldGet(this, _elementTarget)
      });

      _classPrivateFieldSet(this, _onMount, true);
    }
  }
  /**
   * Render the inner application content. Only render a template if one is defined otherwise provide an empty
   * JQuery element per the core Foundry API.
   *
   * @param {Object} data         The data used to render the inner template
   *
   * @returns {Promise.<JQuery>}   A promise resolving to the constructed jQuery object
   *
   * @protected
   * @ignore
   */


  async _renderInner(data) {
    const html = typeof this.template === 'string' ? await renderTemplate(this.template, data) : document.createDocumentFragment();
    return $(html);
  }
  /**
   * Stores the initial z-index set in `_renderOuter` which is used in `_injectHTML` to set the target element
   * z-index after the Svelte component is mounted.
   *
   * @returns {Promise<JQuery>} Outer frame / unused.
   * @protected
   * @ignore
   */


  async _renderOuter() {
    const html = await super._renderOuter();

    _classPrivateFieldSet(this, _initialZIndex, html[0].style.zIndex);

    return html;
  }
  /**
   * All calculation and updates of position are implemented in {@link Position.set}. This allows position to be fully
   * reactive and in control of updating inline styles for the application.
   *
   * This method remains for backward compatibility with Foundry. If you have a custom override quite likely you need
   * to update to using the {@link Position.validators} functionality.
   *
   * @param {PositionData}   [position] - Position data.
   *
   * @returns {PositionData} The updated position object for the application containing the new values
   */


  setPosition(position) {
    return this.position.set(position);
  }
  /**
   * This method is only invoked by the `elementRootUpdate` callback that is added to the external context passed to
   * Svelte components. When invoked it updates the local element roots tracked by SvelteApplication.
   */


}
/**
 * @typedef {object} SvelteData
 *
 * @property {object}                           config -
 *
 * @property {import('svelte').SvelteComponent} component -
 *
 * @property {HTMLElement}                      element -
 *
 * @property {boolean}                          injectHTML -
 */

/**
 * @typedef {object} SvelteStores
 *
 * @property {import('svelte/store').Writable.update} appOptionsUpdate - Update function for app options store.
 *
 * @property {Function} subscribe - Subscribes to local stores.
 *
 * @property {import('svelte/store').Writable.update} uiOptionsUpdate - Update function for UI options store.
 *
 * @property {Function} unsubscribe - Unsubscribes from local stores.
 */

function _updateApplicationShell2() {
  const applicationShell = this.svelte.applicationShell;

  if (applicationShell !== null) {
    this._element = $(applicationShell.elementRoot); // Detect if the application shell exports an `elementContent` accessor.

    _classPrivateFieldSet(this, _elementContent, hasGetter(applicationShell, 'elementContent') ? applicationShell.elementContent : null); // Detect if the application shell exports an `elementTarget` accessor.


    _classPrivateFieldSet(this, _elementTarget, hasGetter(applicationShell, 'elementTarget') ? applicationShell.elementTarget : null);

    if (_classPrivateFieldGet(this, _elementTarget) === null) {
      const element = typeof this.options.selectorTarget === 'string' ? this._element.find(this.options.selectorTarget) : this._element;

      _classPrivateFieldSet(this, _elementTarget, element[0]);
    } // The initial zIndex may be set in application options or for popOut applications is stored by `_renderOuter`
    // in `this.#initialZIndex`.


    if (typeof this.options.positionable === 'boolean' && this.options.positionable) {
      var _classPrivateFieldGet3;

      _classPrivateFieldGet(this, _elementTarget).style.zIndex = typeof this.options.zIndex === 'number' ? this.options.zIndex : (_classPrivateFieldGet3 = _classPrivateFieldGet(this, _initialZIndex)) !== null && _classPrivateFieldGet3 !== void 0 ? _classPrivateFieldGet3 : 95;

      _get(_getPrototypeOf(SvelteApplication.prototype), "bringToTop", this).call(this); // Ensure that new root element has inline position styles set.


      this.position.set(this.position.get());
    }

    _get(_getPrototypeOf(SvelteApplication.prototype), "_activateCoreListeners", this).call(this, [_classPrivateFieldGet(this, _elementTarget)]);

    this.onSvelteMount({
      element: this._element[0],
      elementContent: _classPrivateFieldGet(this, _elementContent),
      elementTarget: _classPrivateFieldGet(this, _elementTarget)
    });
  }
}

/**
 * Defines the application shell contract. If Svelte components export getter / setters for the following properties
 * then that component is considered an application shell.
 *
 * @type {string[]}
 */


const applicationShellContract = ['elementRoot'];
Object.freeze(applicationShellContract);

/* svelte\advancement-rate\advancement-rate-shell.svelte generated by Svelte v3.46.4 */

function create_fragment(ctx) {
	let form_1;
	let section0;
	let div3;
	let label0;
	let t1;
	let div0;
	let label1;
	let t3;
	let input0;
	let t4;
	let div1;
	let label2;
	let t6;
	let input1;
	let t7;
	let div2;
	let t9;
	let div7;
	let t17;
	let section1;
	let div8;
	let label4;
	let t19;
	let input2;
	let mounted;
	let dispose;

	return {
		c() {
			form_1 = element("form");
			section0 = element("section");
			div3 = element("div");
			label0 = element("label");
			label0.textContent = "CustomValues";
			t1 = space();
			div0 = element("div");
			label1 = element("label");
			label1.textContent = "AV - Attribute Value";
			t3 = space();
			input0 = element("input");
			t4 = space();
			div1 = element("div");
			label2 = element("label");
			label2.textContent = "SV - Skill Value";
			t6 = space();
			input1 = element("input");
			t7 = space();
			div2 = element("div");
			div2.textContent = "SL - Skill level";
			t9 = space();
			div7 = element("div");

			div7.innerHTML = `<label>Non-custom Values</label> 
      <div>As - Attribute Score</div> 
      <div>SS - Skill Score</div> 
      <div>SL - Skill level</div>`;

			t17 = space();
			section1 = element("section");
			div8 = element("div");
			label4 = element("label");
			label4.textContent = "Attribute Advancement Formula";
			t19 = space();
			input2 = element("input");
			attr(div3, "class", "flexrow");
			attr(section0, "class", "grid grid-2col");
			attr(form_1, "autocomplete", "off");
		},
		m(target, anchor) {
			insert(target, form_1, anchor);
			append(form_1, section0);
			append(section0, div3);
			append(div3, label0);
			append(div3, t1);
			append(div3, div0);
			append(div0, label1);
			append(div0, t3);
			append(div0, input0);
			set_input_value(input0, /*advancementSetting*/ ctx[0].variables.attributeValue);
			append(div3, t4);
			append(div3, div1);
			append(div1, label2);
			append(div1, t6);
			append(div1, input1);
			set_input_value(input1, /*advancementSetting*/ ctx[0].variables.skillValue);
			append(div3, t7);
			append(div3, div2);
			append(section0, t9);
			append(section0, div7);
			append(form_1, t17);
			append(form_1, section1);
			append(section1, div8);
			append(div8, label4);
			append(div8, t19);
			append(div8, input2);
			set_input_value(input2, /*advancementSetting*/ ctx[0].formulas.attributes);
			/*form_1_binding*/ ctx[6](form_1);

			if (!mounted) {
				dispose = [
					listen(input0, "input", /*input0_input_handler*/ ctx[3]),
					listen(input1, "input", /*input1_input_handler*/ ctx[4]),
					listen(input2, "input", /*input2_input_handler*/ ctx[5]),
					listen(form_1, "submit", prevent_default(/*updateSettings*/ ctx[2]), { once: true })
				];

				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if (dirty & /*advancementSetting*/ 1 && input0.value !== /*advancementSetting*/ ctx[0].variables.attributeValue) {
				set_input_value(input0, /*advancementSetting*/ ctx[0].variables.attributeValue);
			}

			if (dirty & /*advancementSetting*/ 1 && input1.value !== /*advancementSetting*/ ctx[0].variables.skillValue) {
				set_input_value(input1, /*advancementSetting*/ ctx[0].variables.skillValue);
			}

			if (dirty & /*advancementSetting*/ 1 && input2.value !== /*advancementSetting*/ ctx[0].formulas.attributes) {
				set_input_value(input2, /*advancementSetting*/ ctx[0].formulas.attributes);
			}
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(form_1);
			/*form_1_binding*/ ctx[6](null);
			mounted = false;
			run_all(dispose);
		}
	};
}

function instance($$self, $$props, $$invalidate) {
	const { application } = getContext("external");
	let form;
	let { advancementSetting } = $$props;

	async function updateSettings() {
		application.update(advancementSetting);
		application.close();
	}

	console.log(advancementSetting);

	function input0_input_handler() {
		advancementSetting.variables.attributeValue = this.value;
		$$invalidate(0, advancementSetting);
	}

	function input1_input_handler() {
		advancementSetting.variables.skillValue = this.value;
		$$invalidate(0, advancementSetting);
	}

	function input2_input_handler() {
		advancementSetting.formulas.attributes = this.value;
		$$invalidate(0, advancementSetting);
	}

	function form_1_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			form = $$value;
			$$invalidate(1, form);
		});
	}

	$$self.$$set = $$props => {
		if ('advancementSetting' in $$props) $$invalidate(0, advancementSetting = $$props.advancementSetting);
	};

	return [
		advancementSetting,
		form,
		updateSettings,
		input0_input_handler,
		input1_input_handler,
		input2_input_handler,
		form_1_binding
	];
}

class Advancement_rate_shell extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance, create_fragment, safe_not_equal, { advancementSetting: 0 });
	}

	get advancementSetting() {
		return this.$$.ctx[0];
	}

	set advancementSetting(advancementSetting) {
		this.$$set({ advancementSetting });
		flush();
	}
}

class AdvRateSettingsShim extends FormApplication {
  /**
   * @inheritDoc
   */
  constructor(options = {}) {
    super({}, options);
    new AdvancementRateFormApp().render(true, {
      focus: true
    });
  }

  async _updateObject(event, formData) {}

  render() {
    this.close();
  }

}

class AdvancementRateFormApp extends SvelteApplication {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["ard20"],
      title: "Advancement Rate",
      id: "advancement-rate-setting",
      width: 600,
      height: "auto",
      submitOnChange: true,
      closeOnSubmit: false,
      svelte: {
        class: Advancement_rate_shell,
        target: document.body,
        props: {
          advancementSetting: game.settings.get("ard20", "advancement-rate")
        }
      }
    });
  }

  getData() {
    const sheetData = game.settings.get("ard20", "advancement-rate");
    return sheetData;
  }

  activateListeners(html) {
    super.activateListeners(html);
  }

  async _updateObject(event, formData) {}

}

const registerSystemSettings = function registerSystemSettings() {
  game.settings.register("ard20", "proficiencies", {
    scope: "world",
    config: false,
    default: {
      weapon: [{
        name: "Punch Dagger",
        type: "amb"
      }, {
        name: "Whip Dagger",
        type: "amb"
      }, {
        name: "Gauntlet",
        type: "amb"
      }, {
        name: "Hidden Blade",
        type: "amb"
      }, {
        name: "Knucke Axe",
        type: "amb"
      }, {
        name: "Side Baton",
        type: "amb"
      }, {
        name: "Unarmed strike",
        type: "amb"
      }, {
        name: "Battle Axe",
        type: "axe"
      }, {
        name: "Great Axe",
        type: "axe"
      }, {
        name: "Handaxe",
        type: "axe"
      }, {
        name: "Hook Sword",
        type: "axe"
      }, {
        name: "Khopesh",
        type: "axe"
      }, {
        name: "Poleaxe",
        type: "axe"
      }, {
        name: "Tomahawk",
        type: "axe"
      }, {
        name: "Great club",
        type: "blu"
      }, {
        name: "Heavy club",
        type: "blu"
      }, {
        name: "Light Club",
        type: "blu"
      }],
      armor: [],
      tools: [],
      skills: []
    },
    onChange: value => {
      console.log("Настройка изменилась ", value);
    }
  });
  game.settings.registerMenu("ard20", "gearProfManage", {
    name: "SETTINGS.ProfManage",
    label: "SETTINGS.ProfManage",
    type: ProfFormApp,
    restricted: false,
    icon: "fab fa-buffer"
  });
  game.settings.register("ard20", "feat", {
    scope: "world",
    config: false,
    default: {
      packs: [],
      folders: []
    },
    onChange: value => {
      console.log("Настройка изменилась", value);
    }
  });
  game.settings.registerMenu("ard20", "featManage", {
    name: "SETTINGS.FeatureManage",
    label: "SETTINGS.FeatureManage",
    type: FeatFormApp,
    restricted: false
  });
  game.settings.register("ard20", "advancement-rate", {
    scope: "world",
    config: false,
    default: {
      variables: {
        skillCount: 5,
        featureCount: 5,
        skillValue: 5,
        featureLevel: 5,
        attributeValue: 5
      },
      formulas: {
        skills: "",
        features: "n",
        attributes: "max(floor((AS-10)/2)+2,1)"
      }
    },
    onChange: value => {
      console.log("Настройка изменилась", value);
    }
  });
  game.settings.registerMenu("ard20", "advancementRateManage", {
    name: "SETTINGS.AdvancementRateManage",
    label: "SETTINGS.AdvancementRateManage",
    type: AdvRateSettingsShim,
    restricted: false
  });
};

class ProfFormApp extends FormApplication {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["ard20"],
      title: "Armor/Weapon Proficiencies",
      template: "systems/ard20/templates/app/prof-settings.html",
      id: "prof-settings",
      width: 600,
      height: "auto",
      submitOnChange: true,
      closeOnSubmit: false,
      tabs: [{
        navSelector: ".sheet-tabs",
        contentSelector: ".sheet-body",
        initial: "weapons"
      }]
    });
  } //@ts-expect-error


  getData() {
    const sheetData = {
      proficiencies: game.settings.get("ard20", "proficiencies"),
      config: CONFIG.ARd20
    };
    return sheetData;
  } //@ts-expect-error


  activateListeners(html) {
    super.activateListeners(html);
    html.find(".add").click(this._onAdd.bind(this));
    html.find(".minus").click(this._Delete.bind(this));
  } //@ts-expect-error


  async _onAdd(event) {
    event.preventDefault();
    const proficiencies = game.settings.get("ard20", "proficiencies");
    proficiencies.weapon.push({
      name: "name",
      type: "amb"
    });
    await game.settings.set("ard20", "proficiencies", proficiencies);
    this.render();
  } //@ts-expect-error


  async _Delete(event) {
    event.preventDefault();
    const proficiencies = game.settings.get("ard20", "proficiencies");
    proficiencies.weapon.splice(event.currentTarget.dataset.key, 1);
    await game.settings.set("ard20", "proficiencies", proficiencies);
    this.render();
  } //@ts-expect-error


  async _updateObject(event, formData) {
    const proficiencies = game.settings.get("ard20", "proficiencies");
    console.log(formData);
    let dirty = false;

    for (let [fieldName, value] of Object.entries(foundry.utils.flattenObject(formData))) {
      const [type, index, propertyName] = fieldName.split("."); //@ts-expect-error

      if (proficiencies[type][index][propertyName] !== value) {
        //log({index, propertyName, value});
        //@ts-expect-error
        proficiencies[type][index][propertyName] = value;
        dirty = dirty || true;
      }

      if (dirty) {
        await game.settings.set("ard20", "proficiencies", proficiencies);
      }
    }
  }

} //@ts-expect-error


class FeatFormApp extends FormApplication {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["ard20"],
      title: "Features Management",
      template: "systems/ard20/templates/app/feat-settings.html",
      id: "feat-settings",
      width: 600,
      height: "auto",
      submitOnChange: true,
      closeOnSubmit: false
    });
  }

  getData() {
    const sheetData = {
      feat: game.settings.get("ard20", "feat")
    };
    return sheetData;
  } //@ts-expect-error


  activateListeners(html) {
    super.activateListeners(html);
    html.find(".add").click(this._onAdd.bind(this));
    html.find(".minus").click(this._Delete.bind(this));
  } //@ts-expect-error


  async _onAdd(event) {
    event.preventDefault();
    const feat = game.settings.get("ard20", "feat");
    const button = event.currentTarget;

    switch (button.dataset.type) {
      case "pack":
        feat.packs.push("new compendium");
        await game.settings.set("ard20", "feat", feat);
        break;

      case "folder":
        feat.folders.push("new folder");
        await game.settings.set("ard20", "feat", feat);
    }

    this.render();
  } //@ts-expect-error


  async _Delete(event) {
    event.preventDefault();
    const feat = game.settings.get("ard20", "feat");
    const button = event.currentTarget;

    switch (button.dataset.type) {
      case "pack":
        feat.packs.splice(button.dataset.key, 1);
        await game.settings.set("ard20", "feat", feat);
        break;

      case "folder":
        feat.folders.splice(button.dataset.key, 1);
        await game.settings.set("ard20", "feat", feat);
        break;
    }

    this.render();
  }

  async _updateObject(event, formData) {
    const feat = game.settings.get("ard20", "feat");
    console.log(formData);
    let dirty = false; //@ts-expect-error

    for (let [fieldName, value] of Object.entries(foundry.utils.flattenObject(formData))) {
      const [type, index] = fieldName.split("."); //@ts-expect-error

      if (feat[type][index] !== value) {
        //log({index, propertyName, value});
        //@ts-expect-error
        feat[type][index] = value;
        dirty = dirty || true;
      }

      if (dirty) {
        await game.settings.set("ard20", "feat", feat);
      }
    }
  }

}

/**
 * Highlight critical success or failure on d20 rolls
 */
//@ts-expect-error
const highlightCriticalSuccessFailure = function highlightCriticalSuccessFailure(message, html, data) {
  if (!message.isRoll || !message.isContentVisible) return; // Highlight rolls where the first part is a d20 roll

  const roll = message.roll;
  if (!roll.dice.length) return;
  const d = roll.dice[0]; // Ensure it is an un-modified d20 roll

  const isD20 = d.faces === 20 && d.values.length === 1;
  if (!isD20) return;
  const isModifiedRoll = "success" in d.results[0] || d.options.marginSuccess || d.options.marginFailure;
  if (isModifiedRoll) return; // Highlight successes and failures

  const critical = d.options.critical || 20;
  const fumble = d.options.fumble || 1;
  if (d.total >= critical) html.find(".dice-total").addClass("critical");else if (d.total <= fumble) html.find(".dice-total").addClass("fumble");else if (d.options.target) {
    if (roll.total >= d.options.target) html.find(".dice-total").addClass("success");else html.find(".dice-total").addClass("failure");
  }
};
/* -------------------------------------------- */

/**
 * Optionally hide the display of chat card action buttons which cannot be performed by the user
 */
//@ts-expect-error

const displayChatActionButtons = function displayChatActionButtons(message, html, data) {
  const chatCard = html.find(".ard20.chat-card");

  if (chatCard.length > 0) {
    const flavor = html.find(".flavor-text");
    if (flavor.text() === html.find(".item-name").text()) flavor.remove(); // If the user is the message author or the actor owner, proceed

    let actor = game.actors.get(data.message.speaker.actor);
    if (actor && actor.isOwner) return;else if (game.user.isGM || data.author.id === game.user.id) return; // Otherwise conceal action buttons except for saving throw

    const buttons = chatCard.find("button[data-action]"); //@ts-expect-error

    buttons.each((i, btn) => {
      if (btn.dataset.action === "save") return;
      btn.style.display = "none";
    });
  }
};
/* -------------------------------------------- */

/**
 * This function is used to hook into the Chat Log context menu to add additional options to each message
 * These options make it easy to conveniently apply damage to controlled tokens based on the value of a Roll
 *
 * @param {HTMLElement} html    The Chat Message being rendered
 * @param {Array} options       The Array of Context Menu options
 *
 * @return {Array}              The extended options Array including new context choices
 */

const addChatMessageContextOptions = function addChatMessageContextOptions(html, options) {
  let canApply = li => {
    var _canvas$tokens;

    //@ts-expect-error
    const message = game.messages.get(li.data("messageId"));
    return (message === null || message === void 0 ? void 0 : message.isRoll) && (message === null || message === void 0 ? void 0 : message.isContentVisible) && ((_canvas$tokens = canvas.tokens) === null || _canvas$tokens === void 0 ? void 0 : _canvas$tokens.controlled.length);
  };

  options.push({
    //@ts-expect-error
    name: game.i18n.localize("ARd20.ChatContextDamage"),
    //@ts-expect-error
    icon: '<i class="fas fa-user-minus"></i>',
    //@ts-expect-error
    condition: canApply,
    //@ts-expect-error
    callback: li => applyChatCardDamage(li, 1)
  }, {
    name: game.i18n.localize("ARd20.ChatContextHealing"),
    icon: '<i class="fas fa-user-plus"></i>',
    condition: canApply,
    //@ts-expect-error
    callback: li => applyChatCardDamage(li, -1)
  }, {
    name: game.i18n.localize("ARd20.ChatContextDoubleDamage"),
    icon: '<i class="fas fa-user-injured"></i>',
    condition: canApply,
    //@ts-expect-error
    callback: li => applyChatCardDamage(li, 2)
  }, {
    name: game.i18n.localize("ARd20.ChatContextHalfDamage"),
    icon: '<i class="fas fa-user-shield"></i>',
    condition: canApply,
    //@ts-expect-error
    callback: li => applyChatCardDamage(li, 0.5)
  });
  return options;
};
/* -------------------------------------------- */

/**
 * Apply rolled dice damage to the token or tokens which are currently controlled.
 * This allows for damage to be scaled by a multiplier to account for healing, critical hits, or resistance
 *
 * @param {HTMLElement} li      The chat entry which contains the roll data
 * @param {Number} multiplier   A damage multiplier to apply to the rolled damage.
 * @return {Promise}
 */

function applyChatCardDamage(li, multiplier) {
  //@ts-expect-error
  const message = game.messages.get(li.data("messageId"));
  const roll = message.roll;
  return Promise.all(canvas.tokens.controlled.map(t => {
    const a = t.actor; //@ts-expect-error

    return a.applyDamage(roll.total, multiplier);
  }));
}
/* -------------------------------------------- */

// Import document classes.
/* -------------------------------------------- */

/*  Init Hook                                   */

/* -------------------------------------------- */

function obj_entries$1(obj) {
  return Object.entries(obj);
}
function getValues$1(SourceObject, key) {
  return SourceObject[key];
}
function obj_keys$1(obj) {
  return Object.keys(obj);
}
Hooks.once("init", async function () {
  // Add utility classes to the global game object so that they're more easily
  // accessible in global contexts.
  if (game instanceof Game) {
    game.ard20 = {
      documents: {
        ARd20Actor,
        ARd20Item
      },
      rollItemMacro: rollItemMacro$1,
      config: ARd20,
      dice: dice
    }; // Add custom constants for configuration.

    CONFIG.ARd20 = ARd20; //@ts-expect-error

    CONFIG.Dice.DamageRoll = DamageRoll; //@ts-expect-error

    CONFIG.Dice.D20Roll = D20Roll;
    CONFIG.Dice.rolls.push(D20Roll);
    CONFIG.Dice.rolls.push(DamageRoll);

    if (game.socket instanceof io.Socket) {
      game.socket.on("system.ard20", data => {
        if (data.operation === "updateActorData") ARd20SocketHandler.updateActorData(data);
      });
    }
    /**
     * Set an initiative formula for the system
     * @type {String}
     */


    CONFIG.Combat.initiative = {
      formula: "1d20 + @abilities.dex.mod",
      decimals: 2
    }; // Define custom Document classes

    CONFIG.Actor.documentClass = ARd20Actor;
    CONFIG.Item.documentClass = ARd20Item; // Register sheet application classes

    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("ard20", ARd20ActorSheet, {
      makeDefault: true
    });
    Items.unregisterSheet("core", ItemSheet); //@ts-expect-error

    Items.registerSheet("ard20", ARd20ItemSheet, {
      makeDefault: true
    });
    registerSystemSettings(); // Preload Handlebars templates.

    return preloadHandlebarsTemplates();
  } else {
    throw new Error("game not initialized yet!");
  }
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

Hooks.once("ready", async function () {
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on("hotbarDrop", (bar, data, slot) => createItemMacro$1(data, slot));
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

async function createItemMacro$1(data, slot) {
  if (game instanceof Game) {
    //@ts-expect-error
    if (data.type !== "Item") return;
    if (!("data" in data) && ui.notifications instanceof Notifications) return ui.notifications.warn("You can only create macro buttons for owned Items"); //@ts-expect-error

    const item = data.data; // Create the macro command

    const command = `game.ard20.rollItemMacro("${item.name}");`;
    let macroList = game.macros.contents.filter(m => m.name === item.name && (m === null || m === void 0 ? void 0 : m.command) === command);
    let macroCheck = macroList.length !== 0 ? macroList[0] : null;

    if (macroCheck !== null) {
      let macro = await Macro.create({
        name: item.name,
        type: "script",
        img: item.img,
        command: command,
        flags: {
          "ard20.itemMacro": true
        }
      });

      if (macro instanceof Macro) {
        var _game$user;

        (_game$user = game.user) === null || _game$user === void 0 ? void 0 : _game$user.assignHotbarMacro(macro, slot);
      }
    }

    return false;
  }
}
/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemName
 * @return {Promise}
 */


function rollItemMacro$1(itemName) {
  if (game instanceof Game) {
    const speaker = ChatMessage.getSpeaker();
    let actor;
    if (speaker.token) actor = game.actors.tokens[speaker.token];
    if (!actor && typeof speaker.actor === "string") actor = game.actors.get(speaker.actor);
    const item = actor ? actor.items.find(i => i.name === itemName) : null;
    if (!item) return ui.notifications.warn(`Your controlled Actor does not have an item named ${itemName}`); // Trigger the item roll
    //@ts-expect-error

    return item.roll();
  }
}
Hooks.on("renderChatMessage", (app, html, data) => {
  // Display action buttons
  displayChatActionButtons(app, html, data); // Highlight critical success or failure die

  highlightCriticalSuccessFailure(app, html); // Optionally collapse the content
});
Hooks.on("getChatLogEntryContext", addChatMessageContextOptions); //@ts-expect-error

Hooks.on("renderChatLog", (app, html, data) => ARd20Item.chatListeners(html)); //@ts-expect-error

Hooks.on("renderChatPopout", (app, html, data) => ARd20Item.chatListeners(html));

/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */

class ARd20Actor extends Actor {
  //@ts-check

  /** @override */
  prepareData() {
    // Prepare data for the actor. Calling the super version of this executes
    // the following, in order: data reset (to clear active effects),
    // prepareBaseData(), prepareEmbeddedDocuments() (including active effects),
    // prepareDerivedData().
    super.prepareData();
    this.items.forEach(item => item.prepareFinalAttributes());
  }
  /**
   * @override
   * Augment the basic actor data with additional dynamic data. Typically,
   * you'll want to handle most of your calculated/derived data in this step.
   * Data calculated in this step should generally not exist in template.json
   * (such as ability modifiers rather than ability scores) and should be
   * available both inside and outside of character sheets (such as if an actor
   * is queried and has a roll executed directly from it).
   */


  prepareDerivedData() {
    const actorData = this.data;
    actorData.data;
    actorData.flags.ard20 || {}; // Make separate methods for each Actor type (character, npc, etc.) to keep
    // things organized.

    this._prepareCharacterData(actorData);

    this._prepareNpcData(actorData);
  }
  /**
   * Prepare Character type specific data
   */


  _prepareCharacterData(actorData) {
    var _this$itemTypes$race$;

    if (actorData.type !== "character") return; // Make modifications to data here. For example:

    const data = actorData.data;
    const attributes = data.attributes;
    const advancement = data.advancement;
    const def_stats = data.defences.stats;
    const def_dam = data.defences.damage;
    const proficiencies = data.proficiencies;
    data.mobility.value = 0;
    this.itemTypes.armor.forEach(item => {
      if (item.data.type === "armor") {
        if (item.data.data.equipped) {
          for (let key of obj_keys$1(def_dam.phys)) {
            let ph = item.data.data.res.phys[key];
            def_dam.phys[key].bonus += ph.type !== "imm" ? ph.value : 0;
            def_dam.phys[key].type = ph.type === "imm" ? "imm" : def_dam.phys[key].type;
          }

          for (let key of obj_keys$1(def_dam.mag)) {
            let mg = item.data.data.res.mag[key];
            def_dam.mag[key].bonus += mg.type !== "imm" ? mg.value : 0;
            def_dam.mag[key].type = mg.type === "imm" ? "imm" : def_dam.mag[key].type;
          }

          data.mobility.value += item.data.data.mobility.value;
        }
      }
    });
    data.mobility.value += data.mobility.bonus; // Loop through ability scores, and add their modifiers to our sheet output.

    for (let ability of Object.values(attributes)) {
      // Calculate the modifier using d20 rules.
      ability.total = ability.value + ability.bonus;
      ability.mod = Math.floor((ability.value - 10) / 2);
    }

    let dexMod = data.mobility.value < 10 ? attributes.dex.mod : data.mobility.value < 16 ? Math.min(2, attributes.dex.mod) : Math.min(0, attributes.dex.mod); //calculate level and expierence

    const levels = CONFIG.ARd20.CHARACTER_EXP_LEVELS;

    if (advancement.xp.used) {
      var _advancement$xp$used;

      advancement.xp.used = (_advancement$xp$used = advancement.xp.used) !== null && _advancement$xp$used !== void 0 ? _advancement$xp$used : 0;
    }

    for (let i = 1; i < 21; i++) {
      if (advancement.xp.used >= levels[i - 1] && advancement.xp.used < levels[i]) {
        advancement.level = i;
        advancement.xp.level = levels[i];
        advancement.xp.level_min = levels[i - 1];
      }
    }

    advancement.xp.bar_max = advancement.xp.level - advancement.xp.level_min;
    advancement.xp.bar_min = advancement.xp.used - advancement.xp.level_min;
    def_stats.reflex.value = 10 + 4 * def_stats.reflex.level + dexMod + attributes.int.mod + def_stats.reflex.bonus;
    def_stats.reflex.label = "Reflex";
    def_stats.fortitude.value = 10 + 4 * def_stats.fortitude.level + attributes.str.mod + attributes.con.mod + def_stats.fortitude.bonus;
    def_stats.fortitude.label = "Fortitude";
    def_stats.will.value = 10 + 4 * def_stats.will.level + attributes.wis.mod + attributes.cha.mod + def_stats.will.bonus;
    def_stats.will.label = "Will";

    for (let [key, dr] of obj_entries$1(CONFIG.ARd20.DamageSubTypes)) {
      var _def_dam$mag$key, _def_dam$mag$key2, _def_dam$mag$key3, _def_dam$mag$key4, _game$i18n$localize2;

      if (!(key === "force" || key === "radiant" || key === "psychic")) {
        var _def_dam$phys$key, _def_dam$phys$key2, _def_dam$phys$key3, _def_dam$phys$key4, _game$i18n$localize;

        def_dam.phys[key].value = (_def_dam$phys$key = def_dam.phys[key]) !== null && _def_dam$phys$key !== void 0 && _def_dam$phys$key.value || ((_def_dam$phys$key2 = def_dam.phys[key]) === null || _def_dam$phys$key2 === void 0 ? void 0 : _def_dam$phys$key2.type) !== "imm" ? Math.max(isNaN((_def_dam$phys$key3 = def_dam.phys[key]) === null || _def_dam$phys$key3 === void 0 ? void 0 : _def_dam$phys$key3.value) ? 0 : def_dam.phys[key].value) + ((_def_dam$phys$key4 = def_dam.phys[key]) === null || _def_dam$phys$key4 === void 0 ? void 0 : _def_dam$phys$key4.bonus) : 0;
        def_dam.phys[key].name = (_game$i18n$localize = game.i18n.localize(CONFIG.ARd20.DamageSubTypes[key])) !== null && _game$i18n$localize !== void 0 ? _game$i18n$localize : CONFIG.ARd20.DamageSubTypes[key];
      }

      def_dam.mag[key].value = (_def_dam$mag$key = def_dam.mag[key]) !== null && _def_dam$mag$key !== void 0 && _def_dam$mag$key.value || ((_def_dam$mag$key2 = def_dam.mag[key]) === null || _def_dam$mag$key2 === void 0 ? void 0 : _def_dam$mag$key2.type) !== "imm" ? Math.max(isNaN((_def_dam$mag$key3 = def_dam.mag[key]) === null || _def_dam$mag$key3 === void 0 ? void 0 : _def_dam$mag$key3.value) ? 0 : def_dam.mag[key].value) + ((_def_dam$mag$key4 = def_dam.mag[key]) === null || _def_dam$mag$key4 === void 0 ? void 0 : _def_dam$mag$key4.bonus) : 0;
      def_dam.mag[key].name = (_game$i18n$localize2 = game.i18n.localize(CONFIG.ARd20.DamageSubTypes[key])) !== null && _game$i18n$localize2 !== void 0 ? _game$i18n$localize2 : CONFIG.ARd20.DamageSubTypes[key];
    } //calculate rolls for character's skills


    for (let [key, skill] of obj_entries$1(data.skills)) {
      var _game$i18n$localize3, _game$i18n$localize4;

      skill.level = skill.level < 4 ? skill.level : 4;
      skill.value = skill.level * 4 + skill.bonus;
      skill.name = (_game$i18n$localize3 = game.i18n.localize(CONFIG.ARd20.Skills[key])) !== null && _game$i18n$localize3 !== void 0 ? _game$i18n$localize3 : CONFIG.ARd20.Skills[key];
      skill.rankName = (_game$i18n$localize4 = game.i18n.localize(getValues$1(CONFIG.ARd20.Rank, skill.level))) !== null && _game$i18n$localize4 !== void 0 ? _game$i18n$localize4 : getValues$1(CONFIG.ARd20.Rank, skill.level);
    }

    proficiencies.weapon = game.settings.get("ard20", "proficiencies").weapon.map((setting, key) => {
      var _proficiencies$weapon, _proficiencies$weapon2;

      return _objectSpread2(_objectSpread2({}, setting), {}, {
        value: (_proficiencies$weapon = (_proficiencies$weapon2 = proficiencies.weapon[key]) === null || _proficiencies$weapon2 === void 0 ? void 0 : _proficiencies$weapon2.value) !== null && _proficiencies$weapon !== void 0 ? _proficiencies$weapon : 0
      });
    });
    data.speed.value = ((_this$itemTypes$race$ = this.itemTypes.race[0]) === null || _this$itemTypes$race$ === void 0 ? void 0 : _this$itemTypes$race$.data.type) === "race" ? this.itemTypes.race[0].data.data.speed : 0;
    data.speed.value += attributes.dex.mod + data.speed.bonus;
  }
  /**
   * Prepare NPC type specific data.
   */


  _prepareNpcData(actorData) {
    //@ts-expect-error
    if (actorData.type !== "npc") return; // Make modifications to data here. For example:

    const data = actorData.data; //@ts-expect-error

    data.xp = data.cr * data.cr * 100;
  }
  /**
   * Override getRollData() that's supplied to rolls.
   */


  getRollData() {
    const data = super.getRollData(); // Prepare character roll data.

    return data;
  }
  /**
   * Roll an Ability Test
   * Prompt the user for input regarding Advantage/Disadvantage and any Situational Bonus
   * @param {Number} attributeId    The ability ID (e.g. "str")
   * @param {Object} options      Options which configure how ability tests are rolled
   * @return {Promise<Roll>}      A Promise which resolves to the created Roll instance
   */


  rollAbilityTest(attributeId, options) {
    const label = game.i18n.localize(getValues$1(CONFIG.ARd20.Attributes, attributeId));
    const actorData = this.data.data;
    const attributes = actorData.attributes;
    const attr = getValues$1(attributes, attributeId); // Construct parts

    const parts = ["@mod"];
    const data = {
      mod: attr
    }; // Add provided extra roll parts now because they will get clobbered by mergeObject below

    if (options.parts.length > 0) {
      parts.push(...options.parts);
    } // Roll and return


    const rollData = foundry.utils.mergeObject(options, {
      parts: parts,
      data: data,
      title: game.i18n.format("ARd20.AttributePromptTitle", {
        attribute: label
      }),
      messageData: {
        speaker: options.speaker || ChatMessage.getSpeaker({
          actor: this
        }),
        "flags.ard20.roll": {
          type: "attribute",
          attributeId
        }
      }
    }); //@ts-expect-error

    return d20Roll(rollData);
  }
  /**
   * Roll a Skill Check
   * Prompt the user for input regarding Advantage/Disadvantage and any Situational Bonus
   * @param {string} skillId      The skill id (e.g. "ins")
   * @param {Object} options      Options which configure how the skill check is rolled
   * @return {Promise<Roll>}      A Promise which resolves to the created Roll instance
   */


  rollSkill(skillId, options) {
    const skl = getValues$1(this.data.data.skills, skillId); // Compose roll parts and data

    const parts = ["@proficiency", "@mod"];
    const data = {
      attributes: this.getRollData().attributes,
      proficiency: skl.value
    }; // Add provided extra roll parts now because they will get clobbered by mergeObject below

    if (options.parts.length > 0) {
      parts.push(...options.parts);
    } // Roll and return


    const rollData = foundry.utils.mergeObject(options, {
      parts: parts,
      data: data,
      title: game.i18n.format("ARd20.SkillPromptTitle", {
        skill: game.i18n.localize(getValues$1(CONFIG.ARd20.Skills, skillId))
      }),
      messageData: {
        speaker: options.speaker || ChatMessage.getSpeaker({
          actor: this
        }),
        "flags.ard20.roll": {
          type: "skill",
          skillId
        }
      },
      chooseModifier: true
    }); //@ts-expect-error

    return d20Roll(rollData);
  }

}

// Import document classes.
/* -------------------------------------------- */

/*  Init Hook                                   */

/* -------------------------------------------- */

function obj_entries(obj) {
  return Object.entries(obj);
}
function arr_entries(arr) {
  return Object.entries(arr);
}
function getValues(SourceObject, key) {
  return SourceObject[key];
}
function obj_keys(obj) {
  return Object.keys(obj);
}
function array_keys(obj) {
  return Object.keys(obj);
}
Hooks.once("init", async function () {
  // Add utility classes to the global game object so that they're more easily
  // accessible in global contexts.
  if (game instanceof Game) {
    game.ard20 = {
      documents: {
        ARd20Actor,
        ARd20Item
      },
      rollItemMacro,
      config: ARd20,
      dice: dice
    }; // Add custom constants for configuration.

    CONFIG.ARd20 = ARd20; //@ts-expect-error

    CONFIG.Dice.DamageRoll = DamageRoll; //@ts-expect-error

    CONFIG.Dice.D20Roll = D20Roll;
    CONFIG.Dice.rolls.push(D20Roll);
    CONFIG.Dice.rolls.push(DamageRoll);

    if (game.socket instanceof io.Socket) {
      game.socket.on("system.ard20", data => {
        if (data.operation === "updateActorData") ARd20SocketHandler.updateActorData(data);
      });
    }
    /**
     * Set an initiative formula for the system
     * @type {String}
     */


    CONFIG.Combat.initiative = {
      formula: "1d20 + @abilities.dex.mod",
      decimals: 2
    }; // Define custom Document classes

    CONFIG.Actor.documentClass = ARd20Actor;
    CONFIG.Item.documentClass = ARd20Item; // Register sheet application classes

    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("ard20", ARd20ActorSheet, {
      makeDefault: true
    });
    Items.unregisterSheet("core", ItemSheet); //@ts-expect-error

    Items.registerSheet("ard20", ARd20ItemSheet, {
      makeDefault: true
    });
    registerSystemSettings(); // Preload Handlebars templates.

    return preloadHandlebarsTemplates();
  } else {
    throw new Error("game not initialized yet!");
  }
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

Hooks.once("ready", async function () {
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on("hotbarDrop", (bar, data, slot) => createItemMacro(data, slot));
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

async function createItemMacro(data, slot) {
  if (game instanceof Game) {
    //@ts-expect-error
    if (data.type !== "Item") return;
    if (!("data" in data) && ui.notifications instanceof Notifications) return ui.notifications.warn("You can only create macro buttons for owned Items"); //@ts-expect-error

    const item = data.data; // Create the macro command

    const command = `game.ard20.rollItemMacro("${item.name}");`;
    let macroList = game.macros.contents.filter(m => m.name === item.name && (m === null || m === void 0 ? void 0 : m.command) === command);
    let macroCheck = macroList.length !== 0 ? macroList[0] : null;

    if (macroCheck !== null) {
      let macro = await Macro.create({
        name: item.name,
        type: "script",
        img: item.img,
        command: command,
        flags: {
          "ard20.itemMacro": true
        }
      });

      if (macro instanceof Macro) {
        var _game$user;

        (_game$user = game.user) === null || _game$user === void 0 ? void 0 : _game$user.assignHotbarMacro(macro, slot);
      }
    }

    return false;
  }
}
/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemName
 * @return {Promise}
 */


function rollItemMacro(itemName) {
  if (game instanceof Game) {
    const speaker = ChatMessage.getSpeaker();
    let actor;
    if (speaker.token) actor = game.actors.tokens[speaker.token];
    if (!actor && typeof speaker.actor === "string") actor = game.actors.get(speaker.actor);
    const item = actor ? actor.items.find(i => i.name === itemName) : null;
    if (!item) return ui.notifications.warn(`Your controlled Actor does not have an item named ${itemName}`); // Trigger the item roll
    //@ts-expect-error

    return item.roll();
  }
}
Hooks.on("renderChatMessage", (app, html, data) => {
  // Display action buttons
  displayChatActionButtons(app, html, data); // Highlight critical success or failure die

  highlightCriticalSuccessFailure(app, html); // Optionally collapse the content
});
Hooks.on("getChatLogEntryContext", addChatMessageContextOptions); //@ts-expect-error

Hooks.on("renderChatLog", (app, html, data) => ARd20Item.chatListeners(html)); //@ts-expect-error

Hooks.on("renderChatPopout", (app, html, data) => ARd20Item.chatListeners(html));

export { arr_entries, array_keys, getValues, obj_entries, obj_keys, rollItemMacro };
//# sourceMappingURL=ard20_1.js.map
