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
    /*if (!(this.terms[0] instanceof Die && this.terms[0].faces === 20)) {
            throw new Error(`Invalid D20Roll formula provided ${this._formula}`);
        }*/

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
    const d20 = this.terms[0];
    const mainDice = game.settings.get("ard20", "mainDiceType"); //@ts-expect-error

    d20.modifiers = []; // Handle Advantage or Disadvantage

    if (this.hasAdvantage) {
      //@ts-expect-error
      d20.number = mainDice[0] * 2; //@ts-expect-error

      d20.modifiers.push(`kh${d20.number / 2}`); //@ts-expect-error

      d20.options.advantage = true;
    } else if (this.hasDisadvantage) {
      //@ts-expect-error
      d20.number = mainDice[0] * 2; //@ts-expect-error

      d20.modifiers.push(`kl${d20.number / 2}`); //@ts-expect-error

      d20.options.disadvantage = true; //@ts-expect-error
    } else d20.number = mainDice[0] * 1; // Assign critical and fumble thresholds
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
    title,
    defaultRollMode,
    canMult,
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
    var _form$attribute, _form$mRoll;

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


    if ((_form$attribute = form.attribute) !== null && _form$attribute !== void 0 && _form$attribute.value) {
      //@ts-expect-error
      const abl = this.data.attributes[form.attribute.value];
      console.log(abl); //@ts-expect-error

      this.terms.findSplice(t => t.term === "@mod", new NumericTerm({
        number: abl.mod
      })); //@ts-expect-error

      this.options.flavor += ` (${game.i18n.localize(CONFIG.ARd20.Attributes[form.attribute.value])})`;
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

function simplifyRollFormula(formula, data, options = {
  constantFirst: false
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


  const parts = options.constantFirst ? [constantPart, rollableFormula] : [rollableFormula, constantPart]; // Join the parts with a + sign, pass them to `Roll` once again to clean up the formula

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
  const mainDie = new Roll(game.settings.get("ard20", "mainDiceType")).terms[0];
  fumble = mainDie.number;
  critical = mainDie.number * mainDie.faces;

  const {
    advantageMode,
    isFF
  } = _determineAdvantageMode({
    advantage,
    disadvantage,
    fastForward,
    event
  });

  const formula = [mainDie.formula].concat(parts).join(" + ");
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
    const actorData = this.system; // Make separate methods for each Actor type (character, npc, etc.) to keep
    // things organized.

    this._prepareCharacterData(actorData);

    this._prepareNpcData(actorData);
  }
  /**
   * Prepare Character type specific data
   */


  _prepareCharacterData(actorData) {
    var _this$itemTypes$race$;

    if (this.type !== "character") return;
    this.prepareAttributes(actorData);
    this.prepareSkills(actorData);
    this.prepareResources(actorData);
    /*this.prepareResistances(actorData);
    this.prepareProficiencies(actorData);*/

    const attributes = actorData.attributes;
    const advancement = actorData.advancement;
    const def_stats = actorData.defences.stats;
    const def_dam = actorData.defences.damage;
    const proficiencies = actorData.proficiencies;
    actorData.mobility.value = 0;
    this.itemTypes.armor.forEach(item => {
      if (item.type === "armor") {
        if (item.system.equipped) {
          for (let key of Object.keys(def_dam.phys)) {
            let ph = item.system.res.phys[key];
            def_dam.phys[key].bonus += !ph.immune ? parseInt(ph.value) : 0;
          }

          for (let key of Object.keys(def_dam.mag)) {
            let mg = item.system.res.mag[key];
            def_dam.mag[key].bonus += !mg.immune ? parseInt(mg.value) : 0;
          }

          actorData.mobility.value += item.system.mobility.value;
        }
      }
    });
    actorData.mobility.value += actorData.mobility.bonus; // Loop through ability scores, and add their modifiers to our sheet output.

    let dexMod = actorData.mobility.value < 10 ? attributes.dex.mod : actorData.mobility.value < 16 ? Math.min(2, attributes.dex.mod) : Math.min(0, attributes.dex.mod); //calculate level and expierence

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

    for (let [key, dr] of Object.entries(CONFIG.ARd20.DamageSubTypes)) {
      var _def_dam$mag$key, _def_dam$mag$key2, _def_dam$mag$key3, _def_dam$mag$key4, _game$i18n$localize2;

      if (!(key === "force" || key === "radiant" || key === "psychic")) {
        var _def_dam$phys$key, _def_dam$phys$key2, _def_dam$phys$key3, _def_dam$phys$key4, _game$i18n$localize;

        def_dam.phys[key].value = (_def_dam$phys$key = def_dam.phys[key]) !== null && _def_dam$phys$key !== void 0 && _def_dam$phys$key.value || !((_def_dam$phys$key2 = def_dam.phys[key]) !== null && _def_dam$phys$key2 !== void 0 && _def_dam$phys$key2.immune) ? ((_def_dam$phys$key3 = def_dam.phys[key]) === null || _def_dam$phys$key3 === void 0 ? void 0 : _def_dam$phys$key3.value) + ((_def_dam$phys$key4 = def_dam.phys[key]) === null || _def_dam$phys$key4 === void 0 ? void 0 : _def_dam$phys$key4.bonus) : 0;
        def_dam.phys[key].name = (_game$i18n$localize = game.i18n.localize(CONFIG.ARd20.DamageSubTypes[key])) !== null && _game$i18n$localize !== void 0 ? _game$i18n$localize : CONFIG.ARd20.DamageSubTypes[key];
      }

      def_dam.mag[key].value = (_def_dam$mag$key = def_dam.mag[key]) !== null && _def_dam$mag$key !== void 0 && _def_dam$mag$key.value || !((_def_dam$mag$key2 = def_dam.mag[key]) !== null && _def_dam$mag$key2 !== void 0 && _def_dam$mag$key2.immune) ? ((_def_dam$mag$key3 = def_dam.mag[key]) === null || _def_dam$mag$key3 === void 0 ? void 0 : _def_dam$mag$key3.value) + ((_def_dam$mag$key4 = def_dam.mag[key]) === null || _def_dam$mag$key4 === void 0 ? void 0 : _def_dam$mag$key4.bonus) : 0;
      def_dam.mag[key].name = (_game$i18n$localize2 = game.i18n.localize(CONFIG.ARd20.DamageSubTypes[key])) !== null && _game$i18n$localize2 !== void 0 ? _game$i18n$localize2 : CONFIG.ARd20.DamageSubTypes[key];
    }

    const profLevelSetting = game.settings.get("ard20", "profLevel");
    proficiencies.weapon = game.settings.get("ard20", "proficiencies").weapon.value.map((setting, key) => {
      var _proficiencies$weapon, _proficiencies$weapon2, _proficiencies$weapon3, _proficiencies$weapon4;

      return {
        name: setting.name,
        type: setting.type,
        value: (_proficiencies$weapon = (_proficiencies$weapon2 = proficiencies.weapon[key]) === null || _proficiencies$weapon2 === void 0 ? void 0 : _proficiencies$weapon2.value) !== null && _proficiencies$weapon !== void 0 ? _proficiencies$weapon : 0,
        rankName: profLevelSetting[(_proficiencies$weapon3 = (_proficiencies$weapon4 = proficiencies.weapon[key]) === null || _proficiencies$weapon4 === void 0 ? void 0 : _proficiencies$weapon4.value) !== null && _proficiencies$weapon3 !== void 0 ? _proficiencies$weapon3 : 0].label
      };
    });
    actorData.speed.value = ((_this$itemTypes$race$ = this.itemTypes.race[0]) === null || _this$itemTypes$race$ === void 0 ? void 0 : _this$itemTypes$race$.type) === "race" ? this.itemTypes.race[0].system.speed : 0;
    actorData.speed.value += attributes.dex.mod + actorData.speed.bonus;
  }

  prepareAttributes(actorData) {
    const attributes = actorData.attributes;

    for (let [key, attribute] of Object.entries(attributes)) {
      var _game$i18n$localize3;

      // Calculate the modifier using d20 rules.
      attribute.total = attribute.value + attribute.bonus;
      attribute.mod = attribute.value - 10;
      attribute.label = (_game$i18n$localize3 = game.i18n.localize(CONFIG.ARd20.Attributes[key])) !== null && _game$i18n$localize3 !== void 0 ? _game$i18n$localize3 : key;
    }
  }

  prepareSkills(actorData) {
    const mainDie = game.settings.get("ard20", "mainDiceType");
    const skillLevelBonus = mainDie === "2d10" ? 3 : 4;
    const profLevelSetting = game.settings.get("ard20", "profLevel");
    const maxProfLevel = profLevelSetting.length - 1;
    const skills = actorData.skills;

    for (let [key, skill] of Object.entries(skills)) {
      var _game$i18n$localize4;

      skill.level = skill.level < maxProfLevel ? skill.level : maxProfLevel;
      skill.value = skill.level * skillLevelBonus + skill.bonus;
      skill.name = (_game$i18n$localize4 = game.i18n.localize(CONFIG.ARd20.Skills[key])) !== null && _game$i18n$localize4 !== void 0 ? _game$i18n$localize4 : CONFIG.ARd20.Skills[key];
      skill.rankName = profLevelSetting[skill.level].label;
    }
  }

  prepareResources(actorData) {
    actorData.resources.stamina.max = actorData.attributes.con.total;
    actorData.resources.mana.max = 0;
  }
  /**
   * Prepare NPC type specific data.
   */


  _prepareNpcData(actorData) {
    //@ts-expect-error
    if (this.type !== "npc") return; // Make modifications to data here. For example:

    const data = actorData; //@ts-expect-error

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
   * Roll an Attribute Test
   * Prompt the user for input regarding Advantage/Disadvantage and any Situational Bonus
   * @param {Number} attributeId    The ability ID (e.g. "str")
   * @param {Object} options      Options which configure how ability tests are rolled
   * @return {Promise<Roll>}      A Promise which resolves to the created Roll instance
   */


  rollAttributeTest(attributeId, options) {
    var _options$parts;

    const label = game.i18n.localize(CONFIG.ARd20.Attributes[attributeId]);
    const actorData = this.system;
    const attributes = actorData.attributes;
    const attr = attributes[attributeId]; // Construct parts

    const parts = ["@mod"];
    const data = {
      mod: attr.mod
    }; // Add provided extra roll parts now because they will get clobbered by mergeObject below

    if ((options === null || options === void 0 ? void 0 : (_options$parts = options.parts) === null || _options$parts === void 0 ? void 0 : _options$parts.length) > 0) {
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
        }) || this.name,
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
    var _options$parts2;

    console.log("rollSkill event:", skillId, "skillID;   ", options, "options;   ");
    const skl = this.system.skills[skillId]; // Compose roll parts and data

    const parts = ["@proficiency", "@mod"];
    const data = {
      attributes: this.getRollData().attributes,
      proficiency: skl.value
    }; // Add provided extra roll parts now because they will get clobbered by mergeObject below

    if (((_options$parts2 = options.parts) === null || _options$parts2 === void 0 ? void 0 : _options$parts2.length) > 0) {
      parts.push(...options.parts);
    } // Roll and return


    const rollData = foundry.utils.mergeObject(options, {
      parts: parts,
      data: data,
      title: game.i18n.format("ARd20.SkillPromptTitle", {
        skill: game.i18n.localize(CONFIG.ARd20.Skills[skillId])
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
  _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function _getPrototypeOf(o) {
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
    _get = Reflect.get.bind();
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

function _classStaticPrivateFieldSpecGet(receiver, classConstructor, descriptor) {
  _classCheckPrivateStaticAccess(receiver, classConstructor);

  _classCheckPrivateStaticFieldDescriptor(descriptor, "get");

  return _classApplyDescriptorGet(receiver, descriptor);
}

function _classStaticPrivateMethodGet(receiver, classConstructor, method) {
  _classCheckPrivateStaticAccess(receiver, classConstructor);

  return method;
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

function _classCheckPrivateStaticAccess(receiver, classConstructor) {
  if (receiver !== classConstructor) {
    throw new TypeError("Private static access of wrong provenance");
  }
}

function _classCheckPrivateStaticFieldDescriptor(descriptor, action) {
  if (descriptor === undefined) {
    throw new TypeError("attempted to " + action + " private static field before its declaration");
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

function noop() {}

const identity = x => x;

function assign(tar, src) {
  // @ts-ignore
  for (const k in src) tar[k] = src[k];

  return tar;
}

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

let src_url_equal_anchor;

function src_url_equal(element_src, url) {
  if (!src_url_equal_anchor) {
    src_url_equal_anchor = document.createElement('a');
  }

  src_url_equal_anchor.href = url;
  return element_src === src_url_equal_anchor.href;
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

function component_subscribe(component, store, callback) {
  component.$$.on_destroy.push(subscribe(store, callback));
}

function create_slot(definition, ctx, $$scope, fn) {
  if (definition) {
    const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
    return definition[0](slot_ctx);
  }
}

function get_slot_context(definition, ctx, $$scope, fn) {
  return definition[1] && fn ? assign($$scope.ctx.slice(), definition[1](fn(ctx))) : $$scope.ctx;
}

function get_slot_changes(definition, $$scope, dirty, fn) {
  if (definition[2] && fn) {
    const lets = definition[2](fn(dirty));

    if ($$scope.dirty === undefined) {
      return lets;
    }

    if (typeof lets === 'object') {
      const merged = [];
      const len = Math.max($$scope.dirty.length, lets.length);

      for (let i = 0; i < len; i += 1) {
        merged[i] = $$scope.dirty[i] | lets[i];
      }

      return merged;
    }

    return $$scope.dirty | lets;
  }

  return $$scope.dirty;
}

function update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn) {
  if (slot_changes) {
    const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
    slot.p(slot_context, slot_changes);
  }
}

function get_all_dirty_from_scope($$scope) {
  if ($$scope.ctx.length > 32) {
    const dirty = [];
    const length = $$scope.ctx.length / 32;

    for (let i = 0; i < length; i++) {
      dirty[i] = -1;
    }

    return dirty;
  }

  return -1;
}

function null_to_empty(value) {
  return value == null ? '' : value;
}

function action_destroyer(action_result) {
  return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
}

const is_client = typeof window !== 'undefined';
let now = is_client ? () => window.performance.now() : () => Date.now();
let raf = is_client ? cb => requestAnimationFrame(cb) : noop; // used internally for testing

const tasks = new Set();

function run_tasks(now) {
  tasks.forEach(task => {
    if (!task.c(now)) {
      tasks.delete(task);
      task.f();
    }
  });
  if (tasks.size !== 0) raf(run_tasks);
}
/**
 * Creates a new task that runs on each raf frame
 * until it returns a falsy value or is aborted
 */


function loop(callback) {
  let task;
  if (tasks.size === 0) raf(run_tasks);
  return {
    promise: new Promise(fulfill => {
      tasks.add(task = {
        c: callback,
        f: fulfill
      });
    }),

    abort() {
      tasks.delete(task);
    }

  };
} // Track which nodes are claimed during hydration. Unclaimed nodes can then be removed from the DOM

function append(target, node) {
  target.appendChild(node);
}

function append_styles(target, style_sheet_id, styles) {
  const append_styles_to = get_root_for_style(target);

  if (!append_styles_to.getElementById(style_sheet_id)) {
    const style = element('style');
    style.id = style_sheet_id;
    style.textContent = styles;
    append_stylesheet(append_styles_to, style);
  }
}

function get_root_for_style(node) {
  if (!node) return document;
  const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;

  if (root && root.host) {
    return root;
  }

  return node.ownerDocument;
}

function append_empty_stylesheet(node) {
  const style_element = element('style');
  append_stylesheet(get_root_for_style(node), style_element);
  return style_element.sheet;
}

function append_stylesheet(node, style) {
  append(node.head || node, style);
}

function insert(target, node, anchor) {
  target.insertBefore(node, anchor || null);
}

function detach(node) {
  node.parentNode.removeChild(node);
}

function destroy_each(iterations, detaching) {
  for (let i = 0; i < iterations.length; i += 1) {
    if (iterations[i]) iterations[i].d(detaching);
  }
}

function element(name) {
  return document.createElement(name);
}

function svg_element(name) {
  return document.createElementNS('http://www.w3.org/2000/svg', name);
}

function text(data) {
  return document.createTextNode(data);
}

function space() {
  return text(' ');
}

function empty() {
  return text('');
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

function stop_propagation(fn) {
  return function (event) {
    event.stopPropagation(); // @ts-ignore

    return fn.call(this, event);
  };
}

function attr(node, attribute, value) {
  if (value == null) node.removeAttribute(attribute);else if (node.getAttribute(attribute) !== value) node.setAttribute(attribute, value);
}

function children(element) {
  return Array.from(element.childNodes);
}

function set_data(text, data) {
  data = '' + data;
  if (text.wholeText !== data) text.data = data;
}

function set_input_value(input, value) {
  input.value = value == null ? '' : value;
}

function set_style(node, key, value, important) {
  if (value === null) {
    node.style.removeProperty(key);
  } else {
    node.style.setProperty(key, value, important ? 'important' : '');
  }
}

function select_option(select, value) {
  for (let i = 0; i < select.options.length; i += 1) {
    const option = select.options[i];

    if (option.__value === value) {
      option.selected = true;
      return;
    }
  }

  select.selectedIndex = -1; // no option should be selected
}

function select_value(select) {
  const selected_option = select.querySelector(':checked') || select.options[0];
  return selected_option && selected_option.__value;
}
// so we cache the result instead


let crossorigin;

function is_crossorigin() {
  if (crossorigin === undefined) {
    crossorigin = false;

    try {
      if (typeof window !== 'undefined' && window.parent) {
        void window.parent.document;
      }
    } catch (error) {
      crossorigin = true;
    }
  }

  return crossorigin;
}

function add_resize_listener(node, fn) {
  const computed_style = getComputedStyle(node);

  if (computed_style.position === 'static') {
    node.style.position = 'relative';
  }

  const iframe = element('iframe');
  iframe.setAttribute('style', 'display: block; position: absolute; top: 0; left: 0; width: 100%; height: 100%; ' + 'overflow: hidden; border: 0; opacity: 0; pointer-events: none; z-index: -1;');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.tabIndex = -1;
  const crossorigin = is_crossorigin();
  let unsubscribe;

  if (crossorigin) {
    iframe.src = "data:text/html,<script>onresize=function(){parent.postMessage(0,'*')}</script>";
    unsubscribe = listen(window, 'message', event => {
      if (event.source === iframe.contentWindow) fn();
    });
  } else {
    iframe.src = 'about:blank';

    iframe.onload = () => {
      unsubscribe = listen(iframe.contentWindow, 'resize', fn);
    };
  }

  append(node, iframe);
  return () => {
    if (crossorigin) {
      unsubscribe();
    } else if (unsubscribe && iframe.contentWindow) {
      unsubscribe();
    }

    detach(iframe);
  };
}

function toggle_class(element, name, toggle) {
  element.classList[toggle ? 'add' : 'remove'](name);
}

function custom_event(type, detail, {
  bubbles = false,
  cancelable = false
} = {}) {
  const e = document.createEvent('CustomEvent');
  e.initCustomEvent(type, bubbles, cancelable, detail);
  return e;
}

class HtmlTag {
  constructor(is_svg = false) {
    this.is_svg = false;
    this.is_svg = is_svg;
    this.e = this.n = null;
  }

  c(html) {
    this.h(html);
  }

  m(html, target, anchor = null) {
    if (!this.e) {
      if (this.is_svg) this.e = svg_element(target.nodeName);else this.e = element(target.nodeName);
      this.t = target;
      this.c(html);
    }

    this.i(anchor);
  }

  h(html) {
    this.e.innerHTML = html;
    this.n = Array.from(this.e.childNodes);
  }

  i(anchor) {
    for (let i = 0; i < this.n.length; i += 1) {
      insert(this.t, this.n[i], anchor);
    }
  }

  p(html) {
    this.d();
    this.h(html);
    this.i(this.a);
  }

  d() {
    this.n.forEach(detach);
  }

}
// https://github.com/sveltejs/svelte/issues/3624


const managed_styles = new Map();
let active = 0; // https://github.com/darkskyapp/string-hash/blob/master/index.js

function hash(str) {
  let hash = 5381;
  let i = str.length;

  while (i--) hash = (hash << 5) - hash ^ str.charCodeAt(i);

  return hash >>> 0;
}

function create_style_information(doc, node) {
  const info = {
    stylesheet: append_empty_stylesheet(node),
    rules: {}
  };
  managed_styles.set(doc, info);
  return info;
}

function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
  const step = 16.666 / duration;
  let keyframes = '{\n';

  for (let p = 0; p <= 1; p += step) {
    const t = a + (b - a) * ease(p);
    keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
  }

  const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
  const name = `__svelte_${hash(rule)}_${uid}`;
  const doc = get_root_for_style(node);
  const {
    stylesheet,
    rules
  } = managed_styles.get(doc) || create_style_information(doc, node);

  if (!rules[name]) {
    rules[name] = true;
    stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
  }

  const animation = node.style.animation || '';
  node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
  active += 1;
  return name;
}

function delete_rule(node, name) {
  const previous = (node.style.animation || '').split(', ');
  const next = previous.filter(name ? anim => anim.indexOf(name) < 0 // remove specific animation
  : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
  );
  const deleted = previous.length - next.length;

  if (deleted) {
    node.style.animation = next.join(', ');
    active -= deleted;
    if (!active) clear_rules();
  }
}

function clear_rules() {
  raf(() => {
    if (active) return;
    managed_styles.forEach(info => {
      const {
        stylesheet
      } = info;
      let i = stylesheet.cssRules.length;

      while (i--) stylesheet.deleteRule(i);

      info.rules = {};
    });
    managed_styles.clear();
  });
}

let current_component;

function set_current_component(component) {
  current_component = component;
}

function get_current_component() {
  if (!current_component) throw new Error('Function called outside component initialization');
  return current_component;
}

function onMount(fn) {
  get_current_component().$$.on_mount.push(fn);
}

function setContext(key, context) {
  get_current_component().$$.context.set(key, context);
  return context;
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

function tick() {
  schedule_update();
  return resolved_promise;
}

function add_render_callback(fn) {
  render_callbacks.push(fn);
}

function add_flush_callback(fn) {
  flush_callbacks.push(fn);
} // flush() calls callbacks in this order:
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

let promise;

function wait() {
  if (!promise) {
    promise = Promise.resolve();
    promise.then(() => {
      promise = null;
    });
  }

  return promise;
}

function dispatch(node, direction, kind) {
  node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
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

const null_transition = {
  duration: 0
};

function create_in_transition(node, fn, params) {
  let config = fn(node, params);
  let running = false;
  let animation_name;
  let task;
  let uid = 0;

  function cleanup() {
    if (animation_name) delete_rule(node, animation_name);
  }

  function go() {
    const {
      delay = 0,
      duration = 300,
      easing = identity,
      tick = noop,
      css
    } = config || null_transition;
    if (css) animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
    tick(0, 1);
    const start_time = now() + delay;
    const end_time = start_time + duration;
    if (task) task.abort();
    running = true;
    add_render_callback(() => dispatch(node, true, 'start'));
    task = loop(now => {
      if (running) {
        if (now >= end_time) {
          tick(1, 0);
          dispatch(node, true, 'end');
          cleanup();
          return running = false;
        }

        if (now >= start_time) {
          const t = easing((now - start_time) / duration);
          tick(t, 1 - t);
        }
      }

      return running;
    });
  }

  let started = false;
  return {
    start() {
      if (started) return;
      started = true;
      delete_rule(node);

      if (is_function(config)) {
        config = config();
        wait().then(go);
      } else {
        go();
      }
    },

    invalidate() {
      started = false;
    },

    end() {
      if (running) {
        cleanup();
        running = false;
      }
    }

  };
}

function create_out_transition(node, fn, params) {
  let config = fn(node, params);
  let running = true;
  let animation_name;
  const group = outros;
  group.r += 1;

  function go() {
    const {
      delay = 0,
      duration = 300,
      easing = identity,
      tick = noop,
      css
    } = config || null_transition;
    if (css) animation_name = create_rule(node, 1, 0, duration, delay, easing, css);
    const start_time = now() + delay;
    const end_time = start_time + duration;
    add_render_callback(() => dispatch(node, false, 'start'));
    loop(now => {
      if (running) {
        if (now >= end_time) {
          tick(0, 1);
          dispatch(node, false, 'end');

          if (! --group.r) {
            // this will result in `end()` being called,
            // so we don't need to clean up here
            run_all(group.c);
          }

          return false;
        }

        if (now >= start_time) {
          const t = easing((now - start_time) / duration);
          tick(1 - t, t);
        }
      }

      return running;
    });
  }

  if (is_function(config)) {
    wait().then(() => {
      // @ts-ignore
      config = config();
      go();
    });
  } else {
    go();
  }

  return {
    end(reset) {
      if (reset && config.tick) {
        config.tick(1, 0);
      }

      if (running) {
        if (animation_name) delete_rule(node, animation_name);
        running = false;
      }
    }

  };
}

function destroy_block(block, lookup) {
  block.d(1);
  lookup.delete(block.key);
}

function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
  let o = old_blocks.length;
  let n = list.length;
  let i = o;
  const old_indexes = {};

  while (i--) old_indexes[old_blocks[i].key] = i;

  const new_blocks = [];
  const new_lookup = new Map();
  const deltas = new Map();
  i = n;

  while (i--) {
    const child_ctx = get_context(ctx, list, i);
    const key = get_key(child_ctx);
    let block = lookup.get(key);

    if (!block) {
      block = create_each_block(key, child_ctx);
      block.c();
    } else if (dynamic) {
      block.p(child_ctx, dirty);
    }

    new_lookup.set(key, new_blocks[i] = block);
    if (key in old_indexes) deltas.set(key, Math.abs(i - old_indexes[key]));
  }

  const will_move = new Set();
  const did_move = new Set();

  function insert(block) {
    transition_in(block, 1);
    block.m(node, next);
    lookup.set(block.key, block);
    next = block.first;
    n--;
  }

  while (o && n) {
    const new_block = new_blocks[n - 1];
    const old_block = old_blocks[o - 1];
    const new_key = new_block.key;
    const old_key = old_block.key;

    if (new_block === old_block) {
      // do nothing
      next = new_block.first;
      o--;
      n--;
    } else if (!new_lookup.has(old_key)) {
      // remove old block
      destroy(old_block, lookup);
      o--;
    } else if (!lookup.has(new_key) || will_move.has(new_key)) {
      insert(new_block);
    } else if (did_move.has(old_key)) {
      o--;
    } else if (deltas.get(new_key) > deltas.get(old_key)) {
      did_move.add(new_key);
      insert(new_block);
    } else {
      will_move.add(old_key);
      o--;
    }
  }

  while (o--) {
    const old_block = old_blocks[o];
    if (!new_lookup.has(old_block.key)) destroy(old_block, lookup);
  }

  while (n) insert(new_blocks[n - 1]);

  return new_blocks;
}

function get_spread_update(levels, updates) {
  const update = {};
  const to_null_out = {};
  const accounted_for = {
    $$scope: 1
  };
  let i = levels.length;

  while (i--) {
    const o = levels[i];
    const n = updates[i];

    if (n) {
      for (const key in o) {
        if (!(key in n)) to_null_out[key] = 1;
      }

      for (const key in n) {
        if (!accounted_for[key]) {
          update[key] = n[key];
          accounted_for[key] = 1;
        }
      }

      levels[i] = n;
    } else {
      for (const key in o) {
        accounted_for[key] = 1;
      }
    }
  }

  for (const key in to_null_out) {
    if (!(key in update)) update[key] = undefined;
  }

  return update;
}

function get_spread_object(spread_props) {
  return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
} // source: https://html.spec.whatwg.org/multipage/indices.html

function bind(component, name, callback) {
  const index = component.$$.props[name];

  if (index !== undefined) {
    component.$$.bound[index] = callback;
    callback(component.$$.ctx[index]);
  }
}

function create_component(block) {
  block && block.c();
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
 * @param {*}        object - An object.
 *
 * @param {string}   accessor - Accessor to test.
 *
 * @returns {boolean} Whether the component has the getter for accessor.
 */


function hasGetter(object, accessor) {
  if (object === null || object === void 0) {
    return false;
  } // Walk parent prototype chain. Check for descriptor at each prototype level.


  for (let o = Object.getPrototypeOf(object); o; o = Object.getPrototypeOf(o)) {
    const descriptor = Object.getOwnPropertyDescriptor(o, accessor);

    if (descriptor !== void 0 && descriptor.get !== void 0) {
      return true;
    }
  }

  return false;
}
/**
 * Generates a UUID v4 compliant ID. Please use a complete UUID generation package for guaranteed compliance.
 *
 * This code is an evolution of the following Gist.
 * https://gist.github.com/jed/982883
 *
 * There is a public domain / free copy license attached to it that is not a standard OSS license...
 * https://gist.github.com/jed/982883#file-license-txt
 *
 * @returns {string} UUIDv4
 */


function uuidv4() {
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c => (c ^ (globalThis.crypto || globalThis.msCrypto).getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
}

const s_REGEX$1 = /(\d+)\s*px/;
/**
 * Parses a pixel string / computed styles. Ex. `100px` returns `100`.
 *
 * @param {string}   value - Value to parse.
 *
 * @returns {number|undefined} The integer component of a pixel string.
 */

function styleParsePixels$1(value) {
  if (typeof value !== 'string') {
    return void 0;
  }

  const isPixels = s_REGEX$1.test(value);
  const number = parseInt(value);
  return isPixels && Number.isFinite(number) ? number : void 0;
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
 * @param {*} value - Any value.
 *
 * @returns {boolean} Whether object is iterable.
 */


function isIterable(value) {
  if (value === null || value === void 0 || typeof value !== 'object') {
    return false;
  }

  return typeof value[Symbol.iterator] === 'function';
}
/**
 * Tests for whether object is not null and a typeof object.
 *
 * @param {*} value - Any value.
 *
 * @returns {boolean} Is it an object.
 */


function isObject(value) {
  return value !== null && typeof value === 'object';
}
/**
 * Tests for whether the given value is a plain object.
 *
 * An object is plain if it is created by either: {}, new Object() or Object.create(null).
 *
 * @param {*} value - Any value
 *
 * @returns {boolean} Is it a plain object.
 */


function isPlainObject(value) {
  if (Object.prototype.toString.call(value) !== s_TAG_OBJECT) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === null || prototype === Object.prototype;
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
/**
 * Attempts to create a Foundry UUID from standard drop data. This may not work for all systems.
 *
 * @param {object}   data - Drop transfer data.
 *
 * @param {ParseDataTransferOptions}   opts - Optional parameters.
 *
 * @returns {string|undefined} Foundry UUID for drop data.
 */


function getUUIDFromDataTransfer(data, {
  actor = true,
  compendium = true,
  world = true,
  types = void 0
} = {}) {
  if (typeof data !== 'object') {
    return void 0;
  }

  if (Array.isArray(types) && !types.includes(data.type)) {
    return void 0;
  }

  let uuid = void 0; // TODO: v10 will change the `data.data._id` relationship possibly.

  if (actor && world && data.actorId && data.type) {
    uuid = `Actor.${data.actorId}.${data.type}.${data.data._id}`;
  } else if (data.id) {
    if (compendium && typeof data.pack === 'string') {
      uuid = `Compendium.${data.pack}.${data.id}`;
    } else if (world) {
      uuid = `${data.type}.${data.id}`;
    }
  }

  return uuid;
}

class Action {
  constructor(object = {}) {
    var _object$name, _object$type, _object$formula, _object$bonus, _object$dc;

    this.name = (_object$name = object.name) !== null && _object$name !== void 0 ? _object$name : "New Action";
    this.type = (_object$type = object.type) !== null && _object$type !== void 0 ? _object$type : "Attack";
    this.formula = (_object$formula = object === null || object === void 0 ? void 0 : object.formula) !== null && _object$formula !== void 0 ? _object$formula : "2d10";
    this.bonus = (_object$bonus = object === null || object === void 0 ? void 0 : object.bonus) !== null && _object$bonus !== void 0 ? _object$bonus : 0;
    this.dc = (_object$dc = object === null || object === void 0 ? void 0 : object.dc) !== null && _object$dc !== void 0 ? _object$dc : {
      type: "parameter",
      value: "reflex"
    };
    this.id = uuidv4();
    this.isRoll = true;
    this.setTargetLimit(object);
    this.range = {
      max: 5,
      min: 0
    };
    this.sheet = ActionSheet(this);
  }
  /**
   * Icon and text hint for action
   */


  setHint(object) {
    var _object$icon, _object$text;

    let icon = (_object$icon = object === null || object === void 0 ? void 0 : object.icon) !== null && _object$icon !== void 0 ? _object$icon : "";
    let text = (_object$text = object === null || object === void 0 ? void 0 : object.text) !== null && _object$text !== void 0 ? _object$text : "";
    this.hint = {
      icon,
      text
    };
  }
  /**
   * How many characters can you target with that action
   */


  setTargetLimit(target) {
    var _target$type, _target$number;

    let type = (_target$type = target.type) !== null && _target$type !== void 0 ? _target$type : "single";
    let number;

    switch (type) {
      case "single" :
        number = 1;
        break;

      case "all":
        number = Infinity;
        break;

      case "custom":
        number = (_target$number = target === null || target === void 0 ? void 0 : target.number) !== null && _target$number !== void 0 ? _target$number : 1;
        break;
    }

    this.targetLimit = {
      number,
      type
    };
  }
  /**
   * Use action
   * Workflow: TODO: maybe add way to configure steps
   * 1. Check Template - check if there is Measured Template
   * 1a. Place Template
   * 1b. If not template - check if token have targets
   * 2. Validate targets (if action has Measured Template and it affect all tokens in it - skip this step)
   * 2a. If there is no targets (and no template) - ask user to target tokens (highlight possible)
   * 2b. If user has targets before - check if you can use action on them (maybe highlight wrong or just throw an error)
   * 3.
   *
   */


  use() {
    console.log('ACTION USE', this);
    this.placeTemplate();
  }

  placeTemplate() {
    console.log('Phase: placing template');
    if (!this.template) this.validateTargets();
    /*TODO: look at 5e https://github.com/foundryvtt/dnd5e/blob/master/module/pixi/ability-template.js
    and then change handlers.mm and handlers.lc events, so it will tell you, that your template "out of the range"
    for measrement use canvas.grid.measureDistance
    */

    this.validateTargets();
  }

  validateTargets() {
    console.log('Phase: validatig targets');
  }

}

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
    const itemData = this.system;
    this.labels = {};

    this._prepareSpellData(itemData);

    this._prepareWeaponData(itemData);

    this._prepareFeatureData(itemData);

    this._prepareRaceData(itemData);

    this._prepareArmorData(itemData);

    if (itemData.hasAttack) this._prepareAttack(itemData);
    if (itemData.hasDamage) this._prepareDamage(itemData);
    if (!this.isOwned) this.prepareFinalAttributes();
  }
  /**
   *Prepare data for Spells
   */


  _prepareSpellData(itemData) {
    if (this.type !== "spell") return;
  }
  /**
   *Prepare data for weapons
   */


  _prepareWeaponData(itemData) {
    if (this.type !== "weapon") return;
    const data = itemData;
    const flags = this.flags;
    data.hasAttack = data.hasAttack || true;
    data.hasDamage = data.hasDamage || true; //TODO: this._setDeflect(data);

    this._setTypeAndSubtype(data, flags);

    for (const level of game.settings.get("ard20", "profLevel")) {
      var _data$damage$common$l;

      data.damage.common[level.key] = (_data$damage$common$l = data.damage.common[level.key]) !== null && _data$damage$common$l !== void 0 ? _data$damage$common$l : {
        formula: "",
        parts: [["", ["", ""]]]
      };
    }
    /*for (let [key, type] of Object.entries(data.damage)) {
            if (key !== "current") {
                for (let [key, prof] of Object.entries(type)) {
                    prof.formula = "";
                    prof.parts.forEach((part) => {
                        if (Array.isArray(part[1])) {
                            prof.formula += `${part[0]}`;
                            part[1].forEach((sub, ind) => {
                                if (ind === 0) {
                                    prof.formula += ` {${sub[0]} ${sub[1]}`;
                                    prof.formula += ind === part[1].length - 1 ? "}" : "";
                                }
                                else {
                                    prof.formula += ` or ${sub[0]} ${sub[1]}`;
                                    prof.formula += ind === part[1].length - 1 ? "}" : "";
                                }
                            });
                        }
                        else
                            prof.formula += `${part[0]} {${part[1]} ${part[2]}}; `;
                    });
                }
            }
        }*/

  }
  /**
   *Set deflect die equal to damage die, if not
   */

  /* TODO:
    _setDeflect(data: object & WeaponDataPropertiesData) {
      for (let [k, v] of Object.entries(CONFIG.ARd20.Rank)) {
        v = game.i18n.localize(CONFIG.ARd20.prof[k]) ?? k;
        v = v.toLowerCase();
        data.deflect[v] = data.property[v].def ? data.deflect[v] || data.damage.common[v] : 0;
      }
    }
    */
  //@ts-expect-error


  _setTypeAndSubtype(data, flags) {
    var _flags$core, _game$i18n$localize, _game$i18n$localize2;

    data.sub_type_array = game.settings.get("ard20", "proficiencies").weapon.value.filter(prof => prof.type === data.type.value);

    if ((_flags$core = flags.core) !== null && _flags$core !== void 0 && _flags$core.sourceId) {
      var _game$items;

      const id = /Item.(.+)/.exec(flags.core.sourceId)[1];
      const item = (_game$items = game.items) === null || _game$items === void 0 ? void 0 : _game$items.get(id);

      if ((item === null || item === void 0 ? void 0 : item.type) === "weapon") {
        data.sub_type = data.sub_type === undefined ? item.system.sub_type : data.sub_type;
      }
    }

    data.sub_type = data.sub_type_array.filter(prof => prof.name === data.sub_type).length === 0 ? data.sub_type_array[0].name : data.sub_type || data.sub_type_array[0].name;
    data.proficiency.name = (_game$i18n$localize = game.i18n.localize(CONFIG.ARd20.Rank[data.proficiency.level])) !== null && _game$i18n$localize !== void 0 ? _game$i18n$localize : CONFIG.ARd20.Rank[data.proficiency.level];
    data.type.name = (_game$i18n$localize2 = game.i18n.localize(CONFIG.ARd20.Rank[data.type.value])) !== null && _game$i18n$localize2 !== void 0 ? _game$i18n$localize2 : CONFIG.ARd20.Rank[data.type.value];
  }
  /**
   *Prepare data for features
   */


  _prepareFeatureData(itemData) {
    if (this.type !== "feature") return;
    const data = itemData; // Handle Source of the feature

    data.source.label = "";
    data.source.value.forEach((value, key) => {
      let label = game.i18n.localize(CONFIG.ARd20.Source[value]);
      data.source.label += key === 0 ? label : `</br>${label}`;
    });
    data.passive;
    data.active;
    data.cost = {
      resource: "stamina",
      value: 1
    }; //labels.source = game.i18n.localize(CONFIG.ARd20.source[data.source.value]);
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
          for (let [_key, v] of Object.entries(CONFIG.ARd20.Attributes)) {
            if (req.name === game.i18n.localize(CONFIG.ARd20.Attributes[_key])) req.value = _key;
          }

          break;

        case "skill":
          for (let [_key2, v] of Object.entries(CONFIG.ARd20.Skills)) {
            if (req.name === game.i18n.localize(CONFIG.ARd20.Skills[_key2])) req.value = _key2;
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
    if (this.type !== "race") return;
  }
  /**
   * Prepare data for "armor" type item
   */


  _prepareArmorData(itemData) {
    var _data$mobility$value;

    if (this.type !== "armor") return;
    const data = itemData;

    for (let [key, dr] of Object.entries(CONFIG.ARd20.DamageSubTypes)) {
      if (!(key === "force" || key === "radiant" || key === "psychic")) {
        data.res.phys[key].value = parseInt(data.res.phys[key].value) || 0;
        data.res.phys[key].value += data.res.phys[key].value !== "imm" ? data.res.phys[key].bonus : "";
      }

      data.res.mag[key].value = parseInt(data.res.mag[key].value) || 0;
      data.res.mag[key].value += data.res.mag[key].value !== "imm" ? data.res.mag[key].bonus : "";
    }

    data.mobility.value = (_data$mobility$value = data.mobility.value) !== null && _data$mobility$value !== void 0 ? _data$mobility$value : CONFIG.ARd20.HeavyPoints[data.type][data.slot];
    data.mobility.value += data.mobility.bonus;
  }
  /**
    Prepare Data that uses actor's data
    */


  prepareFinalAttributes() {
    const itemData = this.system; //@ts-expect-error

    const abil = itemData.abil = {};

    for (let [k, v] of Object.entries(CONFIG.ARd20.Attributes)) {
      abil[k] = this.isOwned ? getProperty(this.actor.system, `data.attributes.${k}.mod`) : null;
    }

    let prof_bonus = 0;

    if (itemData.type === "weapon") {
      var _this$actor;

      const data = itemData;
      data.proficiency.level = this.isOwned ? (_this$actor = this.actor) === null || _this$actor === void 0 ? void 0 : _this$actor.system.proficiencies.weapon.filter(pr => pr.name === data.sub_type)[0].value : 0;
      data.proficiency.levelName = game.settings.get("ard20", "profLevel")[data.proficiency.level].label;
      data.proficiency.key = game.settings.get("ard20", "profLevel")[data.proficiency.level].key;
      prof_bonus = data.proficiency.level * 4;
    }

    if (itemData.hasAttack) this._prepareAttack(itemData, prof_bonus, abil);
    if (itemData.hasDamage) this._prepareDamage(itemData, abil);
  }

  _prepareAttack(itemData, prof_bonus, abil) {
    const data = itemData;
    if (!data.hasAttack) return; //@ts-expect-error

    let mod = itemData.type === "weapon" && abil !== undefined ? abil.dex : data.atkMod; //@ts-expect-error

    data.attack = {
      formula: "1d20+" + prof_bonus + "+" + mod,
      parts: [mod, prof_bonus]
    };
  }

  _prepareDamage(itemData, abil) {
    const data = itemData;
    if (!data.hasDamage) return;
    itemData.type === "weapon" && abil !== undefined ? abil.str : 0;
    const prop = itemData.type === "weapon" ? `damage.common.${data.proficiency.key}.parts` : "damage.parts";
    let baseDamage = getProperty(data, prop); //@ts-expect-error

    data.damage.current = {
      formula: "",
      parts: baseDamage
    };
    baseDamage === null || baseDamage === void 0 ? void 0 : baseDamage.forEach((part, key) => {
      console.log("baseDamage for current damage", part); //@ts-expect-error

      data.damage.current.formula += part[0] + `[`;
      part[1].forEach((subPart, subKey) => {
        data.damage.current.formula += game.i18n.localize(CONFIG.ARd20.DamageTypes[subPart[0]]) + ` ${game.i18n.localize(CONFIG.ARd20.DamageSubTypes[subPart[1]])}`;
        data.damage.current.formula += subKey === part[1].length - 1 ? "]" : " or<br/>";
      });
      data.damage.current.formula += key === baseDamage.length - 1 ? "" : "<br/>+<br/>";
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
    const hasDamage = this.system.hasDamage;
    const hasAttack = this.system.hasAttack; //@ts-expect-error

    rollData.item = foundry.utils.deepClone(this.system); //@ts-expect-error

    rollData.damageDie = hasDamage ? this.system.damage.current.parts[0] : null; //@ts-expect-error

    rollData.mod = hasAttack ? //@ts-expect-error
    this.system.attack.parts[0] : hasDamage ? //@ts-expect-error
    this.system.damage.current.parts[1] : null; //@ts-expect-error

    rollData.prof = hasAttack ? this.system.attack.parts[1] : null;
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
    const iData = this.system; //Item data

    const actor = this.actor;
    actor === null || actor === void 0 ? void 0 : actor.system;
    hasDamage = iData.hasDamage || hasDamage;
    hasAttack = iData.hasAttack || hasAttack; // Initialize chat data.

    ChatMessage.getSpeaker({
      actor: actor
    });
    this.name; // Otherwise, create a roll and send a chat message from it.

    const targets = Array.from(game.user.targets); //@ts-expect-error

    const mRoll = this.system.mRoll || false; //@ts-expect-error

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
    html.trigger("click");
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
    console.log(event);
    event.stopImmediatePropagation(); // Extract card data

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

  async _applyDamage(dam, tData, tHealth, tActor, tokenId) {
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
      console.log("GM applying damage");
      console.log(tActor);
      await tActor.update(obj);
    } else {
      console.log("not GM applying damage");
      game.socket.emit("system.ard20", {
        operation: "updateActorData",
        tokenId: tokenId,
        update: obj,
        value: value
      });
    }
  }

  static async _rollDamage(event) {
    event.stopImmediatePropagation();
    const element = event.currentTarget;
    const card = element.closest(".chat-card");
    const message = game.messages.get(card.closest(".message").dataset.messageId);
    const targetUuid = element.closest("li.flexrow").dataset.targetId;
    const token = await fromUuid(targetUuid); //@ts-expect-error

    const tActor = token === null || token === void 0 ? void 0 : token.actor;
    const tData = tActor.system;
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
    await item._applyDamage(dam, tData, tHealth, tActor, targetUuid);
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
    var _this$system$attack$d, _this$system$attack;

    // Render the chat card template
    let atk = {};
    let dc = {};
    let atkHTML = {};
    let dmgHTML = {};
    let result = {};
    let hit = {};
    let dmg = {};
    let dieResultCss = {}; //@ts-expect-error

    const def = (_this$system$attack$d = (_this$system$attack = this.system.attack) === null || _this$system$attack === void 0 ? void 0 : _this$system$attack.def) !== null && _this$system$attack$d !== void 0 ? _this$system$attack$d : "reflex";
    const resource = this.system.cost.resource;
    const cost = resource ? this.system.cost.value : null;

    if (cost && resource) {
      const costUpd = this.actor.system.resources[resource].value - cost;
      const update = {};
      update[`system.resources.${resource}.value`] = costUpd;
      await this.actor.update(update);
    }

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

          dc[key] = target.actor.system.defences.stats[def].value; //@ts-expect-error

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
      actor: this.actor.system,
      tokenId: (token === null || token === void 0 ? void 0 : token.uuid) || null,
      item: this,
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
      flavor: this.system.chatFlavor || this.name,
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
    const data = foundry.utils.deepClone(this.system); // Rich text description

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
    this.system; //@ts-expect-error

    this.actor.flags.ard20 || {};
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
    const iData = this.system;
    this.actor.system; //@ts-expect-error

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
    const itemData = this.system;
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
          if ( this.system.prof?.hasProficiency ) {
            rollData.prof = this.system.prof.term;
          }
        }
        */

    /* Actor-level global bonus to attack rolls
        const actorBonus = this.actor.system.bonuses?.[itemData.actionType] || {};
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
  /**
   * Creates new Action for Item
   * @param {object} action - action data, that can be passed
   */


  addAction(object) {
    let actionList = [...this.system.actionList];
    let action = new Action();
    console.log('new Action', action);
    actionList.push(action);
    this.update({
      actionList
    });
  }

}

class RaceDataModel extends foundry.abstract.DataModel {
  static defineSchema() {
    return {
      description: new foundry.data.fields.StringField({
        nullable: false,
        required: true,
        initial: ""
      }),
      speed: new foundry.data.fields.NumberField({
        nullable: false,
        initial: 6,
        required: true,
        integer: true,
        positive: true
      }),
      health: new foundry.data.fields.NumberField({
        nullable: false,
        initial: 4,
        required: true,
        integer: true,
        positive: true
      }),
      attributes: new foundry.data.fields.ObjectField({
        nullable: false,
        required: true,
        initial: {
          strength: new foundry.data.fields.NumberField({
            nullable: false,
            initial: 0,
            required: true,
            integer: true,
            positive: false
          }).getInitialValue(),
          dexterity: new foundry.data.fields.NumberField({
            nullable: false,
            initial: 0,
            required: true,
            integer: true,
            positive: false
          }).getInitialValue(),
          constitution: new foundry.data.fields.NumberField({
            nullable: false,
            initial: 0,
            required: true,
            integer: true,
            positive: false
          }).getInitialValue(),
          intelligence: new foundry.data.fields.NumberField({
            nullable: false,
            initial: 0,
            required: true,
            integer: true,
            positive: false
          }).getInitialValue(),
          wisdom: new foundry.data.fields.NumberField({
            nullable: false,
            initial: 0,
            required: true,
            integer: true,
            positive: false
          }).getInitialValue(),
          charisma: new foundry.data.fields.NumberField({
            nullable: false,
            initial: 0,
            required: true,
            integer: true,
            positive: false
          }).getInitialValue()
        }
      })
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

/* built\helpers\Character Advancement\ChangeButton.svelte generated by Svelte v3.48.0 */

function create_if_block_1$4(ctx) {
	let i;
	let mounted;
	let dispose;

	return {
		c() {
			i = element("i");
			attr(i, "class", "change fa-light fa-square-plus svelte-87fh0g");
			toggle_class(i, "disabled", /*disabled*/ ctx[4]);
		},
		m(target, anchor) {
			insert(target, i, anchor);

			if (!mounted) {
				dispose = listen(i, "click", /*click_handler*/ ctx[12]);
				mounted = true;
			}
		},
		p(ctx, dirty) {
			if (dirty & /*disabled*/ 16) {
				toggle_class(i, "disabled", /*disabled*/ ctx[4]);
			}
		},
		d(detaching) {
			if (detaching) detach(i);
			mounted = false;
			dispose();
		}
	};
}

// (94:0) {#if min !== undefined}
function create_if_block$b(ctx) {
	let i;
	let mounted;
	let dispose;

	return {
		c() {
			i = element("i");
			attr(i, "class", "change fa-light fa-square-minus svelte-87fh0g");
			toggle_class(i, "disabled", /*disabled*/ ctx[4]);
		},
		m(target, anchor) {
			insert(target, i, anchor);

			if (!mounted) {
				dispose = listen(i, "click", /*click_handler_1*/ ctx[13]);
				mounted = true;
			}
		},
		p(ctx, dirty) {
			if (dirty & /*disabled*/ 16) {
				toggle_class(i, "disabled", /*disabled*/ ctx[4]);
			}
		},
		d(detaching) {
			if (detaching) detach(i);
			mounted = false;
			dispose();
		}
	};
}

function create_fragment$m(ctx) {
	let t;
	let if_block1_anchor;
	let if_block0 = /*max*/ ctx[0] !== undefined && create_if_block_1$4(ctx);
	let if_block1 = /*min*/ ctx[1] !== undefined && create_if_block$b(ctx);

	return {
		c() {
			if (if_block0) if_block0.c();
			t = space();
			if (if_block1) if_block1.c();
			if_block1_anchor = empty();
		},
		m(target, anchor) {
			if (if_block0) if_block0.m(target, anchor);
			insert(target, t, anchor);
			if (if_block1) if_block1.m(target, anchor);
			insert(target, if_block1_anchor, anchor);
		},
		p(ctx, [dirty]) {
			if (/*max*/ ctx[0] !== undefined) {
				if (if_block0) {
					if_block0.p(ctx, dirty);
				} else {
					if_block0 = create_if_block_1$4(ctx);
					if_block0.c();
					if_block0.m(t.parentNode, t);
				}
			} else if (if_block0) {
				if_block0.d(1);
				if_block0 = null;
			}

			if (/*min*/ ctx[1] !== undefined) {
				if (if_block1) {
					if_block1.p(ctx, dirty);
				} else {
					if_block1 = create_if_block$b(ctx);
					if_block1.c();
					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
				}
			} else if (if_block1) {
				if_block1.d(1);
				if_block1 = null;
			}
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (if_block0) if_block0.d(detaching);
			if (detaching) detach(t);
			if (if_block1) if_block1.d(detaching);
			if (detaching) detach(if_block1_anchor);
		}
	};
}

function instance$l($$self, $$props, $$invalidate) {
	let $changes;
	let $doc;
	let { max } = $$props;
	let { min } = $$props;
	let { type } = $$props;
	let { subtype } = $$props;
	let { cost } = $$props;
	const doc = getContext("chaAdvActorData");
	component_subscribe($$self, doc, value => $$invalidate(11, $doc = value));
	const changes = getContext("chaAdvXpChanges");
	component_subscribe($$self, changes, value => $$invalidate(14, $changes = value));
	let disabled;
	let { costLabel } = $$props;

	function increase(type, subtype) {
		doc.update(store => {
			switch (type) {
				case "attributes":
					store.attributes[subtype].value += 1;
					break;
				case "skills":
					store.skills[subtype].level += 1;
					break;
				case "features":
					store.features[subtype].system.level.initial += 1;
					break;
			}

			store.advancement.xp.used += cost;
			store.advancement.xp.get -= cost;
			return store;
		});

		changes.update(changeArr => {
			changeArr.push({ type, subtype, value: cost });
			return changeArr;
		});
	}

	function decrease(type, subtype) {
		doc.update(store => {
			switch (type) {
				case "attributes":
					store.attributes[subtype].value -= 1;
					break;
				case "skills":
					store.skills[subtype].level -= 1;
					break;
				case "features":
					store.features[subtype].system.level.initial -= 1;
					break;
			}

			let index = -1;

			$changes.forEach((change, key) => {
				index = change.type === type && change.subtype === subtype && key > index
				? key
				: index;
			});

			if (index >= 0) {
				store.advancement.xp.used -= $changes[index].value;
				store.advancement.xp.get += $changes[index].value;
				return store;
			}
		});

		changes.update(changeArr => {
			let index = -1;

			changeArr.forEach((change, key) => {
				index = change.type === type && change.subtype === subtype && key > index
				? key
				: index;
			});

			if (index >= 0) {
				changeArr.splice(index, 1);
				changeArr = changeArr;
			}

			return changeArr;
		});
	}

	const click_handler = () => increase(type, subtype);
	const click_handler_1 = () => decrease(type, subtype);

	$$self.$$set = $$props => {
		if ('max' in $$props) $$invalidate(0, max = $$props.max);
		if ('min' in $$props) $$invalidate(1, min = $$props.min);
		if ('type' in $$props) $$invalidate(2, type = $$props.type);
		if ('subtype' in $$props) $$invalidate(3, subtype = $$props.subtype);
		if ('cost' in $$props) $$invalidate(10, cost = $$props.cost);
		if ('costLabel' in $$props) $$invalidate(9, costLabel = $$props.costLabel);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*type, $doc, subtype, max, min, cost, disabled*/ 3103) {
			{
				switch (type) {
					case "attributes":
						$$invalidate(4, disabled = $doc[type][subtype].value === max || $doc[type][subtype].value === min || $doc.advancement.xp.get < cost);
						break;
					case "skills":
						$$invalidate(4, disabled = $doc[type][subtype].level === max || $doc[type][subtype].level === min || $doc.advancement.xp.get < cost);
						break;
					case "features":
						console.log(max, min);
						$$invalidate(4, disabled = $doc[type][subtype].system.level.initial === max || $doc[type][subtype].system.level.initial === min || $doc.advancement.xp.get < cost);
						break;
				}

				$$invalidate(9, costLabel = disabled ? "-" : cost);
			}
		}
	};

	return [
		max,
		min,
		type,
		subtype,
		disabled,
		doc,
		changes,
		increase,
		decrease,
		costLabel,
		cost,
		$doc,
		click_handler,
		click_handler_1
	];
}

class ChangeButton extends SvelteComponent {
	constructor(options) {
		super();

		init(this, options, instance$l, create_fragment$m, safe_not_equal, {
			max: 0,
			min: 1,
			type: 2,
			subtype: 3,
			cost: 10,
			costLabel: 9
		});
	}
}

/* built\helpers\Character Advancement\TDvariants.svelte generated by Svelte v3.48.0 */

function create_if_block_10(ctx) {
	let td;
	let t_value = /*val*/ ctx[2][0] + "";
	let t;
	let td_class_value;
	let mounted;
	let dispose;

	return {
		c() {
			td = element("td");
			t = text(t_value);
			attr(td, "class", td_class_value = "" + (null_to_empty(/*last*/ ctx[13]) + " svelte-uscx8i"));
		},
		m(target, anchor) {
			insert(target, td, anchor);
			append(td, t);

			if (!mounted) {
				dispose = listen(td, "mouseover", /*mouseover_handler*/ ctx[16]);
				mounted = true;
			}
		},
		p(ctx, dirty) {
			if (dirty & /*val*/ 4 && t_value !== (t_value = /*val*/ ctx[2][0] + "")) set_data(t, t_value);
		},
		d(detaching) {
			if (detaching) detach(td);
			mounted = false;
			dispose();
		}
	};
}

// (71:2) {#if thead.includes("Source")}
function create_if_block_9(ctx) {
	let td;
	let raw_value = /*val*/ ctx[2][1].system.source.label + "";
	let td_class_value;
	let mounted;
	let dispose;

	return {
		c() {
			td = element("td");
			attr(td, "class", td_class_value = "" + (null_to_empty(/*last*/ ctx[13]) + " svelte-uscx8i"));
		},
		m(target, anchor) {
			insert(target, td, anchor);
			td.innerHTML = raw_value;

			if (!mounted) {
				dispose = listen(td, "mouseover", /*mouseover_handler_1*/ ctx[17]);
				mounted = true;
			}
		},
		p(ctx, dirty) {
			if (dirty & /*val*/ 4 && raw_value !== (raw_value = /*val*/ ctx[2][1].system.source.label + "")) td.innerHTML = raw_value;		},
		d(detaching) {
			if (detaching) detach(td);
			mounted = false;
			dispose();
		}
	};
}

// (75:2) {#if thead.includes("Increase")}
function create_if_block_8(ctx) {
	let td;
	let changebutton;
	let current;
	let mounted;
	let dispose;

	changebutton = new ChangeButton({
			props: {
				type: /*typeStr*/ ctx[4],
				subtype: /*val*/ ctx[2][0],
				max: /*max*/ ctx[0],
				cost: /*cost*/ ctx[6]
			}
		});

	return {
		c() {
			td = element("td");
			create_component(changebutton.$$.fragment);
			attr(td, "class", "" + (null_to_empty(/*last*/ ctx[13]) + " svelte-uscx8i"));
		},
		m(target, anchor) {
			insert(target, td, anchor);
			mount_component(changebutton, td, null);
			current = true;

			if (!mounted) {
				dispose = listen(td, "mouseover", /*mouseover_handler_2*/ ctx[18]);
				mounted = true;
			}
		},
		p(ctx, dirty) {
			const changebutton_changes = {};
			if (dirty & /*typeStr*/ 16) changebutton_changes.type = /*typeStr*/ ctx[4];
			if (dirty & /*val*/ 4) changebutton_changes.subtype = /*val*/ ctx[2][0];
			if (dirty & /*max*/ 1) changebutton_changes.max = /*max*/ ctx[0];
			if (dirty & /*cost*/ 64) changebutton_changes.cost = /*cost*/ ctx[6];
			changebutton.$set(changebutton_changes);
		},
		i(local) {
			if (current) return;
			transition_in(changebutton.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(changebutton.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(td);
			destroy_component(changebutton);
			mounted = false;
			dispose();
		}
	};
}

// (81:2) {#if thead.includes("Level")}
function create_if_block_7(ctx) {
	let td;
	let t_value = /*val*/ ctx[2][1].system.level.initial + "";
	let t;
	let td_class_value;
	let mounted;
	let dispose;

	return {
		c() {
			td = element("td");
			t = text(t_value);
			attr(td, "class", td_class_value = "" + (null_to_empty(/*last*/ ctx[13]) + " svelte-uscx8i"));
		},
		m(target, anchor) {
			insert(target, td, anchor);
			append(td, t);

			if (!mounted) {
				dispose = listen(td, "mouseover", /*mouseover_handler_3*/ ctx[19]);
				mounted = true;
			}
		},
		p(ctx, dirty) {
			if (dirty & /*val*/ 4 && t_value !== (t_value = /*val*/ ctx[2][1].system.level.initial + "")) set_data(t, t_value);
		},
		d(detaching) {
			if (detaching) detach(td);
			mounted = false;
			dispose();
		}
	};
}

// (87:2) {#if thead.includes("Max Level")}
function create_if_block_6(ctx) {
	let td;
	let t_value = /*val*/ ctx[2][1].system.level.max + "";
	let t;
	let td_class_value;
	let mounted;
	let dispose;

	return {
		c() {
			td = element("td");
			t = text(t_value);
			attr(td, "class", td_class_value = "" + (null_to_empty(/*last*/ ctx[13]) + " svelte-uscx8i"));
		},
		m(target, anchor) {
			insert(target, td, anchor);
			append(td, t);

			if (!mounted) {
				dispose = listen(td, "mouseover", /*mouseover_handler_4*/ ctx[20]);
				mounted = true;
			}
		},
		p(ctx, dirty) {
			if (dirty & /*val*/ 4 && t_value !== (t_value = /*val*/ ctx[2][1].system.level.max + "")) set_data(t, t_value);
		},
		d(detaching) {
			if (detaching) detach(td);
			mounted = false;
			dispose();
		}
	};
}

// (91:2) {#if thead.includes("Rank")}
function create_if_block_5(ctx) {
	let td;
	let t_value = /*val*/ ctx[2][1].rankName + "";
	let t;
	let td_class_value;
	let mounted;
	let dispose;

	return {
		c() {
			td = element("td");
			t = text(t_value);
			attr(td, "class", td_class_value = "" + (null_to_empty(/*last*/ ctx[13]) + " svelte-uscx8i"));
		},
		m(target, anchor) {
			insert(target, td, anchor);
			append(td, t);

			if (!mounted) {
				dispose = listen(td, "mouseover", /*mouseover_handler_5*/ ctx[21]);
				mounted = true;
			}
		},
		p(ctx, dirty) {
			if (dirty & /*val*/ 4 && t_value !== (t_value = /*val*/ ctx[2][1].rankName + "")) set_data(t, t_value);
		},
		d(detaching) {
			if (detaching) detach(td);
			mounted = false;
			dispose();
		}
	};
}

// (95:2) {#if thead.includes("Value")}
function create_if_block_4(ctx) {
	let td;
	let t_value = /*val*/ ctx[2][1].value + "";
	let t;
	let td_class_value;
	let mounted;
	let dispose;

	return {
		c() {
			td = element("td");
			t = text(t_value);
			attr(td, "class", td_class_value = "" + (null_to_empty(/*last*/ ctx[13]) + " svelte-uscx8i"));
		},
		m(target, anchor) {
			insert(target, td, anchor);
			append(td, t);

			if (!mounted) {
				dispose = listen(td, "mouseover", /*mouseover_handler_6*/ ctx[22]);
				mounted = true;
			}
		},
		p(ctx, dirty) {
			if (dirty & /*val*/ 4 && t_value !== (t_value = /*val*/ ctx[2][1].value + "")) set_data(t, t_value);
		},
		d(detaching) {
			if (detaching) detach(td);
			mounted = false;
			dispose();
		}
	};
}

// (99:2) {#if thead.includes("Decrease")}
function create_if_block_3$1(ctx) {
	let td;
	let changebutton;
	let current;
	let mounted;
	let dispose;

	changebutton = new ChangeButton({
			props: {
				type: /*typeStr*/ ctx[4],
				subtype: /*val*/ ctx[2][0],
				min: /*min*/ ctx[7]
			}
		});

	return {
		c() {
			td = element("td");
			create_component(changebutton.$$.fragment);
			attr(td, "class", "" + (null_to_empty(/*last*/ ctx[13]) + " svelte-uscx8i"));
		},
		m(target, anchor) {
			insert(target, td, anchor);
			mount_component(changebutton, td, null);
			current = true;

			if (!mounted) {
				dispose = listen(td, "mouseover", /*mouseover_handler_7*/ ctx[23]);
				mounted = true;
			}
		},
		p(ctx, dirty) {
			const changebutton_changes = {};
			if (dirty & /*typeStr*/ 16) changebutton_changes.type = /*typeStr*/ ctx[4];
			if (dirty & /*val*/ 4) changebutton_changes.subtype = /*val*/ ctx[2][0];
			if (dirty & /*min*/ 128) changebutton_changes.min = /*min*/ ctx[7];
			changebutton.$set(changebutton_changes);
		},
		i(local) {
			if (current) return;
			transition_in(changebutton.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(changebutton.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(td);
			destroy_component(changebutton);
			mounted = false;
			dispose();
		}
	};
}

// (105:2) {#if thead.includes("Mod")}
function create_if_block_2$2(ctx) {
	let td;
	let t;
	let mounted;
	let dispose;

	return {
		c() {
			td = element("td");
			t = text(/*strMod*/ ctx[8]);
			attr(td, "class", "" + (null_to_empty(/*last*/ ctx[13]) + " svelte-uscx8i"));
		},
		m(target, anchor) {
			insert(target, td, anchor);
			append(td, t);

			if (!mounted) {
				dispose = listen(td, "mouseover", /*mouseover_handler_8*/ ctx[24]);
				mounted = true;
			}
		},
		p(ctx, dirty) {
			if (dirty & /*strMod*/ 256) set_data(t, /*strMod*/ ctx[8]);
		},
		d(detaching) {
			if (detaching) detach(td);
			mounted = false;
			dispose();
		}
	};
}

// (109:2) {#if thead.includes("Cost")}
function create_if_block_1$3(ctx) {
	let td;
	let t;
	let mounted;
	let dispose;

	return {
		c() {
			td = element("td");
			t = text(/*cost*/ ctx[6]);
			attr(td, "class", "" + (null_to_empty(/*last*/ ctx[13]) + " svelte-uscx8i"));
		},
		m(target, anchor) {
			insert(target, td, anchor);
			append(td, t);

			if (!mounted) {
				dispose = listen(td, "mouseover", /*mouseover_handler_9*/ ctx[25]);
				mounted = true;
			}
		},
		p(ctx, dirty) {
			if (dirty & /*cost*/ 64) set_data(t, /*cost*/ ctx[6]);
		},
		d(detaching) {
			if (detaching) detach(td);
			mounted = false;
			dispose();
		}
	};
}

// (113:2) {#if key === 0 && thead.includes("Description")}
function create_if_block$a(ctx) {
	let td;
	let t;
	let td_rowspan_value;

	return {
		c() {
			td = element("td");
			t = text(/*description*/ ctx[1]);
			attr(td, "class", "description svelte-uscx8i");
			attr(td, "rowspan", td_rowspan_value = /*thead*/ ctx[5].length);
		},
		m(target, anchor) {
			insert(target, td, anchor);
			append(td, t);
		},
		p(ctx, dirty) {
			if (dirty & /*description*/ 2) set_data(t, /*description*/ ctx[1]);

			if (dirty & /*thead*/ 32 && td_rowspan_value !== (td_rowspan_value = /*thead*/ ctx[5].length)) {
				attr(td, "rowspan", td_rowspan_value);
			}
		},
		d(detaching) {
			if (detaching) detach(td);
		}
	};
}

function create_fragment$l(ctx) {
	let tr;
	let show_if_10 = /*thead*/ ctx[5].includes("Name");
	let t0;
	let show_if_9 = /*thead*/ ctx[5].includes("Source");
	let t1;
	let show_if_8 = /*thead*/ ctx[5].includes("Increase");
	let t2;
	let show_if_7 = /*thead*/ ctx[5].includes("Level");
	let t3;
	let show_if_6 = /*thead*/ ctx[5].includes("Max Level");
	let t4;
	let show_if_5 = /*thead*/ ctx[5].includes("Rank");
	let t5;
	let show_if_4 = /*thead*/ ctx[5].includes("Value");
	let t6;
	let show_if_3 = /*thead*/ ctx[5].includes("Decrease");
	let t7;
	let show_if_2 = /*thead*/ ctx[5].includes("Mod");
	let t8;
	let show_if_1 = /*thead*/ ctx[5].includes("Cost");
	let t9;
	let show_if = /*key*/ ctx[3] === 0 && /*thead*/ ctx[5].includes("Description");
	let tr_resize_listener;
	let current;
	let if_block0 = show_if_10 && create_if_block_10(ctx);
	let if_block1 = show_if_9 && create_if_block_9(ctx);
	let if_block2 = show_if_8 && create_if_block_8(ctx);
	let if_block3 = show_if_7 && create_if_block_7(ctx);
	let if_block4 = show_if_6 && create_if_block_6(ctx);
	let if_block5 = show_if_5 && create_if_block_5(ctx);
	let if_block6 = show_if_4 && create_if_block_4(ctx);
	let if_block7 = show_if_3 && create_if_block_3$1(ctx);
	let if_block8 = show_if_2 && create_if_block_2$2(ctx);
	let if_block9 = show_if_1 && create_if_block_1$3(ctx);
	let if_block10 = show_if && create_if_block$a(ctx);

	return {
		c() {
			tr = element("tr");
			if (if_block0) if_block0.c();
			t0 = space();
			if (if_block1) if_block1.c();
			t1 = space();
			if (if_block2) if_block2.c();
			t2 = space();
			if (if_block3) if_block3.c();
			t3 = space();
			if (if_block4) if_block4.c();
			t4 = space();
			if (if_block5) if_block5.c();
			t5 = space();
			if (if_block6) if_block6.c();
			t6 = space();
			if (if_block7) if_block7.c();
			t7 = space();
			if (if_block8) if_block8.c();
			t8 = space();
			if (if_block9) if_block9.c();
			t9 = space();
			if (if_block10) if_block10.c();
			set_style(tr, "--cellWidth", /*widthPercent*/ ctx[11] + "%");
			attr(tr, "class", "svelte-uscx8i");
			add_render_callback(() => /*tr_elementresize_handler*/ ctx[26].call(tr));
		},
		m(target, anchor) {
			insert(target, tr, anchor);
			if (if_block0) if_block0.m(tr, null);
			append(tr, t0);
			if (if_block1) if_block1.m(tr, null);
			append(tr, t1);
			if (if_block2) if_block2.m(tr, null);
			append(tr, t2);
			if (if_block3) if_block3.m(tr, null);
			append(tr, t3);
			if (if_block4) if_block4.m(tr, null);
			append(tr, t4);
			if (if_block5) if_block5.m(tr, null);
			append(tr, t5);
			if (if_block6) if_block6.m(tr, null);
			append(tr, t6);
			if (if_block7) if_block7.m(tr, null);
			append(tr, t7);
			if (if_block8) if_block8.m(tr, null);
			append(tr, t8);
			if (if_block9) if_block9.m(tr, null);
			append(tr, t9);
			if (if_block10) if_block10.m(tr, null);
			tr_resize_listener = add_resize_listener(tr, /*tr_elementresize_handler*/ ctx[26].bind(tr));
			current = true;
		},
		p(ctx, [dirty]) {
			if (dirty & /*thead*/ 32) show_if_10 = /*thead*/ ctx[5].includes("Name");

			if (show_if_10) {
				if (if_block0) {
					if_block0.p(ctx, dirty);
				} else {
					if_block0 = create_if_block_10(ctx);
					if_block0.c();
					if_block0.m(tr, t0);
				}
			} else if (if_block0) {
				if_block0.d(1);
				if_block0 = null;
			}

			if (dirty & /*thead*/ 32) show_if_9 = /*thead*/ ctx[5].includes("Source");

			if (show_if_9) {
				if (if_block1) {
					if_block1.p(ctx, dirty);
				} else {
					if_block1 = create_if_block_9(ctx);
					if_block1.c();
					if_block1.m(tr, t1);
				}
			} else if (if_block1) {
				if_block1.d(1);
				if_block1 = null;
			}

			if (dirty & /*thead*/ 32) show_if_8 = /*thead*/ ctx[5].includes("Increase");

			if (show_if_8) {
				if (if_block2) {
					if_block2.p(ctx, dirty);

					if (dirty & /*thead*/ 32) {
						transition_in(if_block2, 1);
					}
				} else {
					if_block2 = create_if_block_8(ctx);
					if_block2.c();
					transition_in(if_block2, 1);
					if_block2.m(tr, t2);
				}
			} else if (if_block2) {
				group_outros();

				transition_out(if_block2, 1, 1, () => {
					if_block2 = null;
				});

				check_outros();
			}

			if (dirty & /*thead*/ 32) show_if_7 = /*thead*/ ctx[5].includes("Level");

			if (show_if_7) {
				if (if_block3) {
					if_block3.p(ctx, dirty);
				} else {
					if_block3 = create_if_block_7(ctx);
					if_block3.c();
					if_block3.m(tr, t3);
				}
			} else if (if_block3) {
				if_block3.d(1);
				if_block3 = null;
			}

			if (dirty & /*thead*/ 32) show_if_6 = /*thead*/ ctx[5].includes("Max Level");

			if (show_if_6) {
				if (if_block4) {
					if_block4.p(ctx, dirty);
				} else {
					if_block4 = create_if_block_6(ctx);
					if_block4.c();
					if_block4.m(tr, t4);
				}
			} else if (if_block4) {
				if_block4.d(1);
				if_block4 = null;
			}

			if (dirty & /*thead*/ 32) show_if_5 = /*thead*/ ctx[5].includes("Rank");

			if (show_if_5) {
				if (if_block5) {
					if_block5.p(ctx, dirty);
				} else {
					if_block5 = create_if_block_5(ctx);
					if_block5.c();
					if_block5.m(tr, t5);
				}
			} else if (if_block5) {
				if_block5.d(1);
				if_block5 = null;
			}

			if (dirty & /*thead*/ 32) show_if_4 = /*thead*/ ctx[5].includes("Value");

			if (show_if_4) {
				if (if_block6) {
					if_block6.p(ctx, dirty);
				} else {
					if_block6 = create_if_block_4(ctx);
					if_block6.c();
					if_block6.m(tr, t6);
				}
			} else if (if_block6) {
				if_block6.d(1);
				if_block6 = null;
			}

			if (dirty & /*thead*/ 32) show_if_3 = /*thead*/ ctx[5].includes("Decrease");

			if (show_if_3) {
				if (if_block7) {
					if_block7.p(ctx, dirty);

					if (dirty & /*thead*/ 32) {
						transition_in(if_block7, 1);
					}
				} else {
					if_block7 = create_if_block_3$1(ctx);
					if_block7.c();
					transition_in(if_block7, 1);
					if_block7.m(tr, t7);
				}
			} else if (if_block7) {
				group_outros();

				transition_out(if_block7, 1, 1, () => {
					if_block7 = null;
				});

				check_outros();
			}

			if (dirty & /*thead*/ 32) show_if_2 = /*thead*/ ctx[5].includes("Mod");

			if (show_if_2) {
				if (if_block8) {
					if_block8.p(ctx, dirty);
				} else {
					if_block8 = create_if_block_2$2(ctx);
					if_block8.c();
					if_block8.m(tr, t8);
				}
			} else if (if_block8) {
				if_block8.d(1);
				if_block8 = null;
			}

			if (dirty & /*thead*/ 32) show_if_1 = /*thead*/ ctx[5].includes("Cost");

			if (show_if_1) {
				if (if_block9) {
					if_block9.p(ctx, dirty);
				} else {
					if_block9 = create_if_block_1$3(ctx);
					if_block9.c();
					if_block9.m(tr, t9);
				}
			} else if (if_block9) {
				if_block9.d(1);
				if_block9 = null;
			}

			if (dirty & /*key, thead*/ 40) show_if = /*key*/ ctx[3] === 0 && /*thead*/ ctx[5].includes("Description");

			if (show_if) {
				if (if_block10) {
					if_block10.p(ctx, dirty);
				} else {
					if_block10 = create_if_block$a(ctx);
					if_block10.c();
					if_block10.m(tr, null);
				}
			} else if (if_block10) {
				if_block10.d(1);
				if_block10 = null;
			}
		},
		i(local) {
			if (current) return;
			transition_in(if_block2);
			transition_in(if_block7);
			current = true;
		},
		o(local) {
			transition_out(if_block2);
			transition_out(if_block7);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(tr);
			if (if_block0) if_block0.d();
			if (if_block1) if_block1.d();
			if (if_block2) if_block2.d();
			if (if_block3) if_block3.d();
			if (if_block4) if_block4.d();
			if (if_block5) if_block5.d();
			if (if_block6) if_block6.d();
			if (if_block7) if_block7.d();
			if (if_block8) if_block8.d();
			if (if_block9) if_block9.d();
			if (if_block10) if_block10.d();
			tr_resize_listener();
		}
	};
}

function instance$k($$self, $$props, $$invalidate) {
	let $element;
	let { max } = $$props;
	let { val } = $$props;
	let { key } = $$props;
	let { type } = $$props;
	let { description } = $$props;
	let { typeStr } = $$props;
	let { thead } = $$props;

	//export let cellWidth;
	const originalData = getContext("chaAdvActorOriginalData");

	const aditionalData = getContext("chaAdvAditionalData");
	const element = getContext("chaAdvElementParameters");
	component_subscribe($$self, element, value => $$invalidate(9, $element = value));
	const formulas = getContext("chaAdvXpFormulas").formulas;
	let variables = {};
	let cost;
	let min;
	let widthPercent = 100 / thead.length;

	switch (typeStr) {
		case "attributes":
			min = originalData[typeStr][val[0]].value;
			break;
		case "skills":
			min = originalData[typeStr][val[0]].level;
			break;
		case "features":
			console.log(aditionalData, val[0]);
			min = aditionalData.feats.awail[val[0]].system.level.current;
			max = aditionalData.feats.awail[val[0]].system.level.max;
			break;
	}

	function changeDesc(val) {
		if (!val[1].description) return "";
		$$invalidate(1, description = val[1].description);
	}

	let strMod;
	let last = key === Object.values(type).length - 1 ? "last" : "";
	const mouseover_handler = () => changeDesc(val);
	const mouseover_handler_1 = () => changeDesc(val);
	const mouseover_handler_2 = () => changeDesc(val);
	const mouseover_handler_3 = () => changeDesc(val);
	const mouseover_handler_4 = () => changeDesc(val);
	const mouseover_handler_5 = () => changeDesc(val);
	const mouseover_handler_6 = () => changeDesc(val);
	const mouseover_handler_7 = () => changeDesc(val);
	const mouseover_handler_8 = () => changeDesc(val);
	const mouseover_handler_9 = () => changeDesc(val);

	function tr_elementresize_handler() {
		$element.trHeight = this.offsetHeight;
		element.set($element);
		$element.trWidth = this.clientWidth;
		element.set($element);
	}

	$$self.$$set = $$props => {
		if ('max' in $$props) $$invalidate(0, max = $$props.max);
		if ('val' in $$props) $$invalidate(2, val = $$props.val);
		if ('key' in $$props) $$invalidate(3, key = $$props.key);
		if ('type' in $$props) $$invalidate(14, type = $$props.type);
		if ('description' in $$props) $$invalidate(1, description = $$props.description);
		if ('typeStr' in $$props) $$invalidate(4, typeStr = $$props.typeStr);
		if ('thead' in $$props) $$invalidate(5, thead = $$props.thead);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*typeStr, val, variables*/ 32788) {
			{
				for (let [key, variable] of Object.entries(getContext("chaAdvXpFormulas").variables)) {
					switch (key) {
						case "attributes":
							$$invalidate(15, variables[variable.shortName] = typeStr === key ? val[1].value : 0, variables);
							break;
						case "skills":
							$$invalidate(15, variables[variable.shortName] = typeStr === key ? val[1].level : 0, variables);
							break;
						case "features":
							$$invalidate(15, variables[variable.shortName] = typeStr === key ? val[1].system.level.initial : 0, variables);
							break;
						case "skillsCount":
							$$invalidate(15, variables[variable.shortName] = 1, variables);
							break;
						case "featuresCount":
							$$invalidate(15, variables[variable.shortName] = 1, variables);
					} //TODO: rewrite
					//TODO: rewrite
				}

				$$invalidate(6, cost = math.evaluate(formulas[typeStr], variables));
			}
		}

		if ($$self.$$.dirty & /*val*/ 4) {
			if (val[1].mod !== undefined) {
				$$invalidate(8, strMod = val[1].mod < 0 ? `${val[1].mod}` : `+${val[1].mod}`);
			}
		}
	};

	return [
		max,
		description,
		val,
		key,
		typeStr,
		thead,
		cost,
		min,
		strMod,
		$element,
		element,
		widthPercent,
		changeDesc,
		last,
		type,
		variables,
		mouseover_handler,
		mouseover_handler_1,
		mouseover_handler_2,
		mouseover_handler_3,
		mouseover_handler_4,
		mouseover_handler_5,
		mouseover_handler_6,
		mouseover_handler_7,
		mouseover_handler_8,
		mouseover_handler_9,
		tr_elementresize_handler
	];
}

class TDvariants extends SvelteComponent {
	constructor(options) {
		super();

		init(this, options, instance$k, create_fragment$l, safe_not_equal, {
			max: 0,
			val: 2,
			key: 3,
			type: 14,
			description: 1,
			typeStr: 4,
			thead: 5
		});
	}
}

/* built\helpers\Character Advancement\Attributes.svelte generated by Svelte v3.48.0 */

function get_each_context$c(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[14] = list[i];
	child_ctx[16] = i;
	return child_ctx;
}

function get_each_context_1$7(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[17] = list[i];
	return child_ctx;
}

// (52:8) {#each thead as th}
function create_each_block_1$7(ctx) {
	let th;
	let t0_value = /*th*/ ctx[17] + "";
	let t0;
	let t1;
	let style_width = `${/*thWidth*/ ctx[9]}%`;

	return {
		c() {
			th = element("th");
			t0 = text(t0_value);
			t1 = space();
			attr(th, "class", "last svelte-1or51gx");
			set_style(th, "width", style_width, false);
		},
		m(target, anchor) {
			insert(target, th, anchor);
			append(th, t0);
			append(th, t1);
		},
		p(ctx, dirty) {
			if (dirty & /*thead*/ 8 && t0_value !== (t0_value = /*th*/ ctx[17] + "")) set_data(t0, t0_value);
		},
		d(detaching) {
			if (detaching) detach(th);
		}
	};
}

// (58:6) {#each Object.entries($data[tabData]) as attr, key}
function create_each_block$c(ctx) {
	let tdvariants;
	let updating_description;
	let current;

	function tdvariants_description_binding(value) {
		/*tdvariants_description_binding*/ ctx[11](value);
	}

	let tdvariants_props = {
		type: /*$data*/ ctx[1][/*tabData*/ ctx[0]],
		thead: /*thead*/ ctx[3],
		typeStr: /*typeStr*/ ctx[2],
		val: /*attr*/ ctx[14],
		max: /*max*/ ctx[5],
		key: /*key*/ ctx[16]
	};

	if (/*description*/ ctx[4] !== void 0) {
		tdvariants_props.description = /*description*/ ctx[4];
	}

	tdvariants = new TDvariants({ props: tdvariants_props });
	binding_callbacks.push(() => bind(tdvariants, 'description', tdvariants_description_binding));

	return {
		c() {
			create_component(tdvariants.$$.fragment);
		},
		m(target, anchor) {
			mount_component(tdvariants, target, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const tdvariants_changes = {};
			if (dirty & /*$data, tabData*/ 3) tdvariants_changes.type = /*$data*/ ctx[1][/*tabData*/ ctx[0]];
			if (dirty & /*thead*/ 8) tdvariants_changes.thead = /*thead*/ ctx[3];
			if (dirty & /*typeStr*/ 4) tdvariants_changes.typeStr = /*typeStr*/ ctx[2];
			if (dirty & /*$data, tabData*/ 3) tdvariants_changes.val = /*attr*/ ctx[14];
			if (dirty & /*max*/ 32) tdvariants_changes.max = /*max*/ ctx[5];

			if (!updating_description && dirty & /*description*/ 16) {
				updating_description = true;
				tdvariants_changes.description = /*description*/ ctx[4];
				add_flush_callback(() => updating_description = false);
			}

			tdvariants.$set(tdvariants_changes);
		},
		i(local) {
			if (current) return;
			transition_in(tdvariants.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(tdvariants.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(tdvariants, detaching);
		}
	};
}

function create_fragment$k(ctx) {
	let div2;
	let table;
	let thead_1;
	let tr;
	let style_width = `${/*$element*/ ctx[6].trWidth}px`;
	let thead_1_resize_listener;
	let t0;
	let tbody;
	let t1;
	let div1;
	let label;
	let t3;
	let div0;
	let t4;
	let current;
	let each_value_1 = /*thead*/ ctx[3];
	let each_blocks_1 = [];

	for (let i = 0; i < each_value_1.length; i += 1) {
		each_blocks_1[i] = create_each_block_1$7(get_each_context_1$7(ctx, each_value_1, i));
	}

	let each_value = Object.entries(/*$data*/ ctx[1][/*tabData*/ ctx[0]]);
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$c(get_each_context$c(ctx, each_value, i));
	}

	const out = i => transition_out(each_blocks[i], 1, 1, () => {
		each_blocks[i] = null;
	});

	return {
		c() {
			div2 = element("div");
			table = element("table");
			thead_1 = element("thead");
			tr = element("tr");

			for (let i = 0; i < each_blocks_1.length; i += 1) {
				each_blocks_1[i].c();
			}

			t0 = space();
			tbody = element("tbody");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			t1 = space();
			div1 = element("div");
			label = element("label");
			label.textContent = "Description";
			t3 = space();
			div0 = element("div");
			t4 = text(/*description*/ ctx[4]);
			attr(tr, "class", "svelte-1or51gx");
			set_style(tr, "width", style_width, false);
			attr(thead_1, "class", "svelte-1or51gx");
			add_render_callback(() => /*thead_1_elementresize_handler*/ ctx[10].call(thead_1));
			set_style(tbody, "--tbodyHeight", 0.95 * /*$element*/ ctx[6].boxHeight - /*$element*/ ctx[6].theadHeight + "px");
			attr(tbody, "class", "svelte-1or51gx");
			attr(table, "class", "svelte-1or51gx");
			attr(label, "for", "description");
			attr(div1, "class", "description svelte-1or51gx");
			attr(div2, "class", "flex flexrow");
		},
		m(target, anchor) {
			insert(target, div2, anchor);
			append(div2, table);
			append(table, thead_1);
			append(thead_1, tr);

			for (let i = 0; i < each_blocks_1.length; i += 1) {
				each_blocks_1[i].m(tr, null);
			}

			thead_1_resize_listener = add_resize_listener(thead_1, /*thead_1_elementresize_handler*/ ctx[10].bind(thead_1));
			append(table, t0);
			append(table, tbody);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(tbody, null);
			}

			append(div2, t1);
			append(div2, div1);
			append(div1, label);
			append(div1, t3);
			append(div1, div0);
			append(div0, t4);
			current = true;
		},
		p(ctx, [dirty]) {
			if (dirty & /*thWidth, thead*/ 520) {
				each_value_1 = /*thead*/ ctx[3];
				let i;

				for (i = 0; i < each_value_1.length; i += 1) {
					const child_ctx = get_each_context_1$7(ctx, each_value_1, i);

					if (each_blocks_1[i]) {
						each_blocks_1[i].p(child_ctx, dirty);
					} else {
						each_blocks_1[i] = create_each_block_1$7(child_ctx);
						each_blocks_1[i].c();
						each_blocks_1[i].m(tr, null);
					}
				}

				for (; i < each_blocks_1.length; i += 1) {
					each_blocks_1[i].d(1);
				}

				each_blocks_1.length = each_value_1.length;
			}

			if (dirty & /*$element*/ 64 && style_width !== (style_width = `${/*$element*/ ctx[6].trWidth}px`)) {
				set_style(tr, "width", style_width, false);
			}

			if (dirty & /*$data, tabData, thead, typeStr, Object, max, description*/ 63) {
				each_value = Object.entries(/*$data*/ ctx[1][/*tabData*/ ctx[0]]);
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$c(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
						transition_in(each_blocks[i], 1);
					} else {
						each_blocks[i] = create_each_block$c(child_ctx);
						each_blocks[i].c();
						transition_in(each_blocks[i], 1);
						each_blocks[i].m(tbody, null);
					}
				}

				group_outros();

				for (i = each_value.length; i < each_blocks.length; i += 1) {
					out(i);
				}

				check_outros();
			}

			if (!current || dirty & /*$element*/ 64) {
				set_style(tbody, "--tbodyHeight", 0.95 * /*$element*/ ctx[6].boxHeight - /*$element*/ ctx[6].theadHeight + "px");
			}

			if (!current || dirty & /*description*/ 16) set_data(t4, /*description*/ ctx[4]);
		},
		i(local) {
			if (current) return;

			for (let i = 0; i < each_value.length; i += 1) {
				transition_in(each_blocks[i]);
			}

			current = true;
		},
		o(local) {
			each_blocks = each_blocks.filter(Boolean);

			for (let i = 0; i < each_blocks.length; i += 1) {
				transition_out(each_blocks[i]);
			}

			current = false;
		},
		d(detaching) {
			if (detaching) detach(div2);
			destroy_each(each_blocks_1, detaching);
			thead_1_resize_listener();
			destroy_each(each_blocks, detaching);
		}
	};
}

function instance$j($$self, $$props, $$invalidate) {
	let $data;
	let $element;
	let { tabData } = $$props;
	const element = getContext("chaAdvElementParameters");
	component_subscribe($$self, element, value => $$invalidate(6, $element = value));
	const data = getContext("chaAdvActorData");
	component_subscribe($$self, data, value => $$invalidate(1, $data = value));
	const settings = game.settings.get("ard20", "profLevel");
	let typeStr;
	let thead;
	let description;
	let max;

	//TODO: reconfigure thead for localization
	switch (tabData) {
		case "attributes":
			typeStr = "attributes";
			thead = ["Name", "Increase", "Value", "Decrease", "Mod", "Cost"];
			description = "";
			max = 30;
			break;
		case "skills":
			typeStr = "skills";
			thead = ["Name", "Increase", "Rank", "Decrease", "Cost"];
			description = "";
			max = settings.length - 1;
			break;
		case "features":
			typeStr = "features";
			thead = ["Name", "Source", "Increase", "Level", "Max Level", "Decrease", "Cost"];
			description = "";
			max = 1;
			break;
	}

	let thWidth = 100 / thead.length;

	const rankName = settings.map(setting => {
		return setting.label;
	});

	function thead_1_elementresize_handler() {
		$element.theadHeight = this.offsetHeight;
		element.set($element);
	}

	function tdvariants_description_binding(value) {
		description = value;
		$$invalidate(4, description);
	}

	$$self.$$set = $$props => {
		if ('tabData' in $$props) $$invalidate(0, tabData = $$props.tabData);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*$data*/ 2) {
			{
				for (let [key, attr] of Object.entries($data.attributes)) {
					attr.mod = attr.value - 10;
				}
			}
		}

		if ($$self.$$.dirty & /*$data*/ 2) {
			for (let [key, skill] of Object.entries($data.skills)) {
				skill.rankName = rankName[skill.level];
			}
		}
	};

	return [
		tabData,
		$data,
		typeStr,
		thead,
		description,
		max,
		$element,
		element,
		data,
		thWidth,
		thead_1_elementresize_handler,
		tdvariants_description_binding
	];
}

class Attributes extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$j, create_fragment$k, safe_not_equal, { tabData: 0 });
	}
}

/* built\helpers\Character Advancement\Tabs.svelte generated by Svelte v3.48.0 */

function get_each_context$b(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[9] = list[i];
	return child_ctx;
}

function get_each_context_1$6(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[9] = list[i];
	return child_ctx;
}

// (14:2) {#each tabs as tab}
function create_each_block_1$6(ctx) {
	let li;
	let span;
	let t0_value = /*tab*/ ctx[9].label + "";
	let t0;
	let t1;
	let li_class_value;
	let mounted;
	let dispose;

	function click_handler() {
		return /*click_handler*/ ctx[7](/*tab*/ ctx[9]);
	}

	return {
		c() {
			li = element("li");
			span = element("span");
			t0 = text(t0_value);
			t1 = space();
			attr(span, "class", "svelte-qwcpmp");

			attr(li, "class", li_class_value = "" + (null_to_empty(/*activeTab*/ ctx[0] === /*tab*/ ctx[9].id
			? "active"
			: "") + " svelte-qwcpmp"));
		},
		m(target, anchor) {
			insert(target, li, anchor);
			append(li, span);
			append(span, t0);
			append(li, t1);

			if (!mounted) {
				dispose = listen(span, "click", click_handler);
				mounted = true;
			}
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;
			if (dirty & /*tabs*/ 2 && t0_value !== (t0_value = /*tab*/ ctx[9].label + "")) set_data(t0, t0_value);

			if (dirty & /*activeTab, tabs*/ 3 && li_class_value !== (li_class_value = "" + (null_to_empty(/*activeTab*/ ctx[0] === /*tab*/ ctx[9].id
			? "active"
			: "") + " svelte-qwcpmp"))) {
				attr(li, "class", li_class_value);
			}
		},
		d(detaching) {
			if (detaching) detach(li);
			mounted = false;
			dispose();
		}
	};
}

// (28:4) {#if tab.id === activeTab}
function create_if_block$9(ctx) {
	let switch_instance;
	let switch_instance_anchor;
	let current;
	var switch_value = /*tab*/ ctx[9].component;

	function switch_props(ctx) {
		return { props: { tabData: /*tab*/ ctx[9].id } };
	}

	if (switch_value) {
		switch_instance = new switch_value(switch_props(ctx));
	}

	return {
		c() {
			if (switch_instance) create_component(switch_instance.$$.fragment);
			switch_instance_anchor = empty();
		},
		m(target, anchor) {
			if (switch_instance) {
				mount_component(switch_instance, target, anchor);
			}

			insert(target, switch_instance_anchor, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const switch_instance_changes = {};
			if (dirty & /*tabs*/ 2) switch_instance_changes.tabData = /*tab*/ ctx[9].id;

			if (switch_value !== (switch_value = /*tab*/ ctx[9].component)) {
				if (switch_instance) {
					group_outros();
					const old_component = switch_instance;

					transition_out(old_component.$$.fragment, 1, 0, () => {
						destroy_component(old_component, 1);
					});

					check_outros();
				}

				if (switch_value) {
					switch_instance = new switch_value(switch_props(ctx));
					create_component(switch_instance.$$.fragment);
					transition_in(switch_instance.$$.fragment, 1);
					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
				} else {
					switch_instance = null;
				}
			} else if (switch_value) {
				switch_instance.$set(switch_instance_changes);
			}
		},
		i(local) {
			if (current) return;
			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
			current = true;
		},
		o(local) {
			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(switch_instance_anchor);
			if (switch_instance) destroy_component(switch_instance, detaching);
		}
	};
}

// (27:2) {#each tabs as tab}
function create_each_block$b(ctx) {
	let if_block_anchor;
	let current;
	let if_block = /*tab*/ ctx[9].id === /*activeTab*/ ctx[0] && create_if_block$9(ctx);

	return {
		c() {
			if (if_block) if_block.c();
			if_block_anchor = empty();
		},
		m(target, anchor) {
			if (if_block) if_block.m(target, anchor);
			insert(target, if_block_anchor, anchor);
			current = true;
		},
		p(ctx, dirty) {
			if (/*tab*/ ctx[9].id === /*activeTab*/ ctx[0]) {
				if (if_block) {
					if_block.p(ctx, dirty);

					if (dirty & /*tabs, activeTab*/ 3) {
						transition_in(if_block, 1);
					}
				} else {
					if_block = create_if_block$9(ctx);
					if_block.c();
					transition_in(if_block, 1);
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			} else if (if_block) {
				group_outros();

				transition_out(if_block, 1, 1, () => {
					if_block = null;
				});

				check_outros();
			}
		},
		i(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},
		o(local) {
			transition_out(if_block);
			current = false;
		},
		d(detaching) {
			if (if_block) if_block.d(detaching);
			if (detaching) detach(if_block_anchor);
		}
	};
}

function create_fragment$j(ctx) {
	let ul;
	let t;
	let div;
	let div_resize_listener;
	let current;
	let each_value_1 = /*tabs*/ ctx[1];
	let each_blocks_1 = [];

	for (let i = 0; i < each_value_1.length; i += 1) {
		each_blocks_1[i] = create_each_block_1$6(get_each_context_1$6(ctx, each_value_1, i));
	}

	let each_value = /*tabs*/ ctx[1];
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$b(get_each_context$b(ctx, each_value, i));
	}

	const out = i => transition_out(each_blocks[i], 1, 1, () => {
		each_blocks[i] = null;
	});

	return {
		c() {
			ul = element("ul");

			for (let i = 0; i < each_blocks_1.length; i += 1) {
				each_blocks_1[i].c();
			}

			t = space();
			div = element("div");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			attr(ul, "class", "svelte-qwcpmp");
			attr(div, "class", "box svelte-qwcpmp");
			set_style(div, "--minBoxSize", /*minBoxSize*/ ctx[3] + "px");
			add_render_callback(() => /*div_elementresize_handler*/ ctx[8].call(div));
		},
		m(target, anchor) {
			insert(target, ul, anchor);

			for (let i = 0; i < each_blocks_1.length; i += 1) {
				each_blocks_1[i].m(ul, null);
			}

			insert(target, t, anchor);
			insert(target, div, anchor);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(div, null);
			}

			div_resize_listener = add_resize_listener(div, /*div_elementresize_handler*/ ctx[8].bind(div));
			current = true;
		},
		p(ctx, [dirty]) {
			if (dirty & /*activeTab, tabs*/ 3) {
				each_value_1 = /*tabs*/ ctx[1];
				let i;

				for (i = 0; i < each_value_1.length; i += 1) {
					const child_ctx = get_each_context_1$6(ctx, each_value_1, i);

					if (each_blocks_1[i]) {
						each_blocks_1[i].p(child_ctx, dirty);
					} else {
						each_blocks_1[i] = create_each_block_1$6(child_ctx);
						each_blocks_1[i].c();
						each_blocks_1[i].m(ul, null);
					}
				}

				for (; i < each_blocks_1.length; i += 1) {
					each_blocks_1[i].d(1);
				}

				each_blocks_1.length = each_value_1.length;
			}

			if (dirty & /*tabs, activeTab*/ 3) {
				each_value = /*tabs*/ ctx[1];
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$b(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
						transition_in(each_blocks[i], 1);
					} else {
						each_blocks[i] = create_each_block$b(child_ctx);
						each_blocks[i].c();
						transition_in(each_blocks[i], 1);
						each_blocks[i].m(div, null);
					}
				}

				group_outros();

				for (i = each_value.length; i < each_blocks.length; i += 1) {
					out(i);
				}

				check_outros();
			}

			if (!current || dirty & /*minBoxSize*/ 8) {
				set_style(div, "--minBoxSize", /*minBoxSize*/ ctx[3] + "px");
			}
		},
		i(local) {
			if (current) return;

			for (let i = 0; i < each_value.length; i += 1) {
				transition_in(each_blocks[i]);
			}

			current = true;
		},
		o(local) {
			each_blocks = each_blocks.filter(Boolean);

			for (let i = 0; i < each_blocks.length; i += 1) {
				transition_out(each_blocks[i]);
			}

			current = false;
		},
		d(detaching) {
			if (detaching) detach(ul);
			destroy_each(each_blocks_1, detaching);
			if (detaching) detach(t);
			if (detaching) detach(div);
			destroy_each(each_blocks, detaching);
			div_resize_listener();
		}
	};
}

function instance$i($$self, $$props, $$invalidate) {
	let $element;
	let $data;
	let { tabs = [] } = $$props;
	let { activeTab } = $$props;
	const data = getContext("chaAdvActorData");
	component_subscribe($$self, data, value => $$invalidate(6, $data = value));
	const element = getContext("chaAdvElementParameters");
	component_subscribe($$self, element, value => $$invalidate(2, $element = value));
	let minBoxSize;

	const click_handler = tab => {
		$$invalidate(0, activeTab = tab.id);
	};

	function div_elementresize_handler() {
		$element.boxHeight = this.clientHeight;
		element.set($element);
	}

	$$self.$$set = $$props => {
		if ('tabs' in $$props) $$invalidate(1, tabs = $$props.tabs);
		if ('activeTab' in $$props) $$invalidate(0, activeTab = $$props.activeTab);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*$data, activeTab, $element*/ 69) {
			{
				$$invalidate(3, minBoxSize = (Object.entries($data[activeTab]).length * $element.trHeight + $element.theadHeight) * 1.1);
			}
		}
	};

	return [
		activeTab,
		tabs,
		$element,
		minBoxSize,
		data,
		element,
		$data,
		click_handler,
		div_elementresize_handler
	];
}

class Tabs$1 extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$i, create_fragment$j, safe_not_equal, { tabs: 1, activeTab: 0 });
	}
}

/* built\helpers\Character Advancement\cha-adv-shell.svelte generated by Svelte v3.48.0 */

function create_fragment$i(ctx) {
	let div0;
	let t0;
	let t1_value = /*$actorData*/ ctx[0].advancement.xp.get + "";
	let t1;
	let t2;
	let div1;
	let t3;
	let t4_value = /*$actorData*/ ctx[0].advancement.xp.used + "";
	let t4;
	let t5;
	let tabs_1;
	let t6;
	let button;
	let current;
	let mounted;
	let dispose;

	tabs_1 = new Tabs$1({
			props: { tabs: /*tabs*/ ctx[3], activeTab: activeTab$1 }
		});

	return {
		c() {
			div0 = element("div");
			t0 = text("XP get: ");
			t1 = text(t1_value);
			t2 = space();
			div1 = element("div");
			t3 = text("XP used: ");
			t4 = text(t4_value);
			t5 = space();
			create_component(tabs_1.$$.fragment);
			t6 = space();
			button = element("button");
			button.textContent = "SubmitData";
		},
		m(target, anchor) {
			insert(target, div0, anchor);
			append(div0, t0);
			append(div0, t1);
			insert(target, t2, anchor);
			insert(target, div1, anchor);
			append(div1, t3);
			append(div1, t4);
			insert(target, t5, anchor);
			mount_component(tabs_1, target, anchor);
			insert(target, t6, anchor);
			insert(target, button, anchor);
			current = true;

			if (!mounted) {
				dispose = listen(button, "click", /*submitData*/ ctx[4]);
				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if ((!current || dirty & /*$actorData*/ 1) && t1_value !== (t1_value = /*$actorData*/ ctx[0].advancement.xp.get + "")) set_data(t1, t1_value);
			if ((!current || dirty & /*$actorData*/ 1) && t4_value !== (t4_value = /*$actorData*/ ctx[0].advancement.xp.used + "")) set_data(t4, t4_value);
		},
		i(local) {
			if (current) return;
			transition_in(tabs_1.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(tabs_1.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div0);
			if (detaching) detach(t2);
			if (detaching) detach(div1);
			if (detaching) detach(t5);
			destroy_component(tabs_1, detaching);
			if (detaching) detach(t6);
			if (detaching) detach(button);
			mounted = false;
			dispose();
		}
	};
}

const activeTab$1 = "attributes";

function instance$h($$self, $$props, $$invalidate) {
	let $actorData;
	let $changes;
	let { document } = $$props;

	//
	const actor = document.actor;

	const { application } = getContext("external");

	//create list of changes and context for it
	const changes = writable([]);

	component_subscribe($$self, changes, value => $$invalidate(6, $changes = value));
	setContext("chaAdvXpChanges", changes);

	//create context for formulas from setting, CONFIG data, Actor's ID
	setContext("chaAdvXpFormulas", game.settings.get("ard20", "advancement-rate"));

	setContext("chaAdvCONFIG", CONFIG);
	setContext("chaAdvActorOriginalData", actor.system);
	setContext("chaAdvAditionalData", document.aditionalData);

	//create store and context for data
	//TODO: add features and other stuff
	const actorData = writable({
		attributes: duplicate(actor.system.attributes),
		skills: duplicate(actor.system.skills),
		advancement: duplicate(actor.system.advancement),
		proficiencies: duplicate(actor.system.proficiencies),
		health: duplicate(actor.system.health),
		isReady: duplicate(actor.system.isReady),
		features: duplicate(document.aditionalData.feats.awail)
	});

	component_subscribe($$self, actorData, value => $$invalidate(0, $actorData = value));

	const elementParameters = writable({
		boxHeight: 0,
		trHeight: 0,
		trWidth: 0,
		theadHeight: 0
	});

	setContext("chaAdvElementParameters", elementParameters);
	setContext("chaAdvActorData", actorData);

	//create tabs
	//TODO: create features, races and other tabs
	const tabs = [
		{
			label: "attributes",
			id: "attributes",
			component: Attributes
		},
		{
			label: "skills",
			id: "skills",
			component: Attributes
		},
		{
			label: "Features",
			id: "features",
			component: Attributes
		}
	];

	//update actor and do other stuff when click 'submit' button
	async function submitData() {
		const updateObj = {};
		updateObj["system.attributes"] = $actorData.attributes;
		updateObj["system.skills"] = $actorData.skills;
		updateObj["system.advancement.xp"] = $actorData.advancement.xp;
		updateObj["system.isReady"] = true;
		console.log($actorData.features);
		let feats = { new: [], exist: [] };

		$actorData.features.forEach(element => {
			const initLevel = element.system.level.initial;
			const currentLevel = element.system.level.current;

			if (initLevel > currentLevel) {
				if (currentLevel > 0) {
					feats.exist = [...feats.exist, element];
				} else {
					feats.new = [...feats.new, element];
				}
			}
		});

		console.log(feats, "feats on update");
		await actor.update(updateObj);
		if (feats.exist.length !== 0) await actor.updateEmbeddedDocuments("Item", feats.exist);
		if (feats.new.length !== 0) await actor.createEmbeddedDocuments("Item", feats.new);
		application.close();
	}

	$$self.$$set = $$props => {
		if ('document' in $$props) $$invalidate(5, document = $$props.document);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*$actorData, $changes*/ 65) {
			console.log($actorData, $changes);
		}
	};

	return [$actorData, changes, actorData, tabs, submitData, document, $changes];
}

class Cha_adv_shell extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$h, create_fragment$i, safe_not_equal, { document: 5 });
	}

	get document() {
		return this.$$.ctx[5];
	}

	set document(document) {
		this.$$set({ document });
		flush();
	}
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
/**
 * Provides a wrapper implementing the Svelte store / subscriber protocol around any Document / ClientMixinDocument.
 * This makes documents reactive in a Svelte component, but otherwise provides subscriber functionality external to
 * Svelte.
 *
 * @template {foundry.abstract.Document} T
 */


var _document = /*#__PURE__*/new WeakMap();

var _uuidv = /*#__PURE__*/new WeakMap();

var _options$1 = /*#__PURE__*/new WeakMap();

var _subscriptions2 = /*#__PURE__*/new WeakMap();

var _updateOptions = /*#__PURE__*/new WeakMap();

var _deleted = /*#__PURE__*/new WeakSet();

var _notify3 = /*#__PURE__*/new WeakSet();

class TJSDocument {
  /**
   * @type {TJSDocumentOptions}
   */

  /**
   * @param {T|TJSDocumentOptions} [document] - Document to wrap or TJSDocumentOptions.
   *
   * @param {TJSDocumentOptions}   [options] - TJSDocument options.
   */
  constructor(_document2, _options2 = {}) {
    _classPrivateMethodInitSpec(this, _notify3);

    _classPrivateMethodInitSpec(this, _deleted);

    _classPrivateFieldInitSpec(this, _document, {
      writable: true,
      value: void 0
    });

    _classPrivateFieldInitSpec(this, _uuidv, {
      writable: true,
      value: void 0
    });

    _classPrivateFieldInitSpec(this, _options$1, {
      writable: true,
      value: {
        delete: void 0,
        notifyOnDelete: false
      }
    });

    _classPrivateFieldInitSpec(this, _subscriptions2, {
      writable: true,
      value: []
    });

    _classPrivateFieldInitSpec(this, _updateOptions, {
      writable: true,
      value: void 0
    });

    _classPrivateFieldSet(this, _uuidv, `tjs-document-${uuidv4()}`);

    if (isPlainObject(_document2)) // Handle case when only options are passed into ctor.
      {
        this.setOptions(_document2);
      } else {
      this.setOptions(_options2);
      this.set(_document2);
    }
  }
  /**
   * Returns the options passed on last update.
   *
   * @returns {object} Last update options.
   */


  get updateOptions() {
    var _classPrivateFieldGet3;

    return (_classPrivateFieldGet3 = _classPrivateFieldGet(this, _updateOptions)) !== null && _classPrivateFieldGet3 !== void 0 ? _classPrivateFieldGet3 : {};
  }
  /**
   * Returns the UUID assigned to this store.
   *
   * @returns {*} UUID
   */


  get uuidv4() {
    return _classPrivateFieldGet(this, _uuidv);
  }
  /**
   * Handles cleanup when the document is deleted. Invoking any optional delete function set in the constructor.
   *
   * @returns {Promise<void>}
   */

  /*async #deleted()
  {
     if (this.#document instanceof foundry.abstract.Document)
     {
        delete this.#document.apps[this.#uuidv4];
        this.#document = void 0;
     }
      this.#updateOptions = void 0;
      if (typeof this.#options.delete === 'function') { await this.#options.delete(); }
      if (this.#options.notifyOnDelete) { this.#notify(); }
  }
     /**
   * Handles cleanup when the document is deleted. Invoking any optional delete function set in the constructor.
   *
   * @returns {Promise<void>}
   */


  /**
   * @returns {T | undefined} Current document
   */
  get() {
    return _classPrivateFieldGet(this, _document);
  }
  /**
   * @param {T | undefined}  document - New document to set.
   *
   * @param {object}         [options] - New document update options to set.
   */


  set(document, options = {}) {
    if (_classPrivateFieldGet(this, _document)) {
      delete _classPrivateFieldGet(this, _document).apps[_classPrivateFieldGet(this, _uuidv)];
    }

    if (document !== void 0 && !(document instanceof foundry.abstract.Document)) {
      throw new TypeError(`TJSDocument set error: 'document' is not a valid Document or undefined.`);
    }

    if (options === null || typeof options !== 'object') {
      throw new TypeError(`TJSDocument set error: 'options' is not an object.`);
    }

    if (document instanceof foundry.abstract.Document) {
      document.apps[_classPrivateFieldGet(this, _uuidv)] = {
        close: _classPrivateMethodGet(this, _deleted, _deleted2).bind(this),
        render: _classPrivateMethodGet(this, _notify3, _notify4).bind(this)
      };
    }

    _classPrivateFieldSet(this, _document, document);

    _classPrivateFieldSet(this, _updateOptions, options);

    _classPrivateMethodGet(this, _notify3, _notify4).call(this);
  }
  /**
   * Potentially sets new document from data transfer object.
   *
   * @param {object}   data - Document transfer data.
   *
   * @param {ParseDataTransferOptions & TJSDocumentOptions}   [options] - Optional parameters.
   *
   * @returns {Promise<boolean>} Returns true if new document set from data transfer blob.
   */


  async setFromDataTransfer(data, options) {
    return this.setFromUUID(getUUIDFromDataTransfer(data, options), options);
  }
  /**
   * Sets the document by Foundry UUID performing a lookup and setting the document if found.
   *
   * @param {string}   uuid - A Foundry UUID to lookup.
   *
   * @param {TJSDocumentOptions}   [options] - New document update options to set.
   *
   * @returns {Promise<boolean>} True if successfully set document from UUID.
   */


  async setFromUUID(uuid, options = {}) {
    if (typeof uuid !== 'string' || uuid.length === 0) {
      return false;
    }

    try {
      const doc = await globalThis.fromUuid(uuid);

      if (doc) {
        this.set(doc, options);
        return true;
      }
    } catch (err) {
      /**/
    }

    return false;
  }
  /**
   * Sets options for this document wrapper / store.
   *
   * @param {TJSDocumentOptions}   options - Options for TJSDocument.
   */


  setOptions(options) {
    if (!isPlainObject(options)) {
      throw new TypeError(`TJSDocument error: 'options' is not a plain object.`);
    }

    if (options.delete !== void 0 && typeof options.delete !== 'function') {
      throw new TypeError(`TJSDocument error: 'delete' attribute in options is not a function.`);
    }

    if (options.notifyOnDelete !== void 0 && typeof options.notifyOnDelete !== 'boolean') {
      throw new TypeError(`TJSDocument error: 'notifyOnDelete' attribute in options is not a boolean.`);
    }

    if (options.delete === void 0 || typeof options.delete === 'function') {
      _classPrivateFieldGet(this, _options$1).delete = options.delete;
    }

    if (typeof options.notifyOnDelete === 'boolean') {
      _classPrivateFieldGet(this, _options$1).notifyOnDelete = options.notifyOnDelete;
    }
  }
  /**
   * @param {function(T, object): void} handler - Callback function that is invoked on update / changes.
   *
   * @returns {(function(): void)} Unsubscribe function.
   */


  subscribe(handler) {
    _classPrivateFieldGet(this, _subscriptions2).push(handler); // Add handler to the array of subscribers.


    const updateOptions = this.updateOptions;
    updateOptions.action = 'subscribe';
    handler(_classPrivateFieldGet(this, _document), updateOptions); // Call handler with current value and update options.
    // Return unsubscribe function.

    return () => {
      const index = _classPrivateFieldGet(this, _subscriptions2).findIndex(sub => sub === handler);

      if (index >= 0) {
        _classPrivateFieldGet(this, _subscriptions2).splice(index, 1);
      }
    };
  }

}
/**
 * @typedef {object} TJSDocumentOptions
 *
 * @property {Function} [delete] - Optional delete function to invoke when document is deleted.
 *
 * @property {boolean} [notifyOnDelete] - When true a subscribers are notified of the deletion of the document.
 */

/**
 * Provides a wrapper implementing the Svelte store / subscriber protocol around any DocumentCollection. This makes
 * document collections reactive in a Svelte component, but otherwise provides subscriber functionality external to
 * Svelte.
 *
 * @template {DocumentCollection} T
 */


async function _deleted2() {
  var _doc$collection;

  const doc = _classPrivateFieldGet(this, _document); // Check to see if the document is still in the associated collection to determine if actually deleted.


  if (doc instanceof foundry.abstract.Document && !(doc !== null && doc !== void 0 && (_doc$collection = doc.collection) !== null && _doc$collection !== void 0 && _doc$collection.has(doc.id))) {
    delete doc.apps[_classPrivateFieldGet(this, _uuidv)];

    _classPrivateFieldSet(this, _document, void 0);

    if (typeof _classPrivateFieldGet(this, _options$1).delete === 'function') {
      await _classPrivateFieldGet(this, _options$1).delete();
    }

    _classPrivateMethodGet(this, _notify3, _notify4).call(this, false, {
      action: 'delete',
      data: void 0
    });

    _classPrivateFieldSet(this, _updateOptions, void 0);
  }
}

function _notify4(force = false, options = {}) // eslint-disable-line no-unused-vars
{
  _classPrivateFieldSet(this, _updateOptions, options); // Subscriptions are stored locally as on the browser Babel is still used for private class fields / Babel
  // support until 2023. IE not doing this will require several extra method calls otherwise.


  const subscriptions = _classPrivateFieldGet(this, _subscriptions2);

  const document = _classPrivateFieldGet(this, _document);

  for (let cntr = 0; cntr < subscriptions.length; cntr++) {
    subscriptions[cntr](document, options);
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

function cubicOut(t) {
  const f = t - 1.0;
  return f * f * f + 1.0;
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
function lerp$5(start, end, amount) {
  return (1 - amount) * start + amount * end;
}
/**
 * Converts the given number from degrees to radians.
 *
 * @param {number}   deg - Degree number to convert
 *
 * @returns {number} Degree as radians.
 */


function degToRad(deg) {
  return deg * (Math.PI / 180.0);
}
/**
 * Common utilities
 * @module glMatrix
 */
// Configuration Constants


var EPSILON$1 = 0.000001;
var ARRAY_TYPE$1 = typeof Float32Array !== 'undefined' ? Float32Array : Array;
var RANDOM = Math.random;

if (!Math.hypot) Math.hypot = function () {
  var y = 0,
      i = arguments.length;

  while (i--) {
    y += arguments[i] * arguments[i];
  }

  return Math.sqrt(y);
};
/**
 * 3x3 Matrix
 * @module mat3
 */

/**
 * Creates a new identity mat3
 *
 * @returns {mat3} a new 3x3 matrix
 */

function create$6$1() {
  var out = new ARRAY_TYPE$1(9);

  if (ARRAY_TYPE$1 != Float32Array) {
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[5] = 0;
    out[6] = 0;
    out[7] = 0;
  }

  out[0] = 1;
  out[4] = 1;
  out[8] = 1;
  return out;
}
/**
 * 4x4 Matrix<br>Format: column-major, when typed out it looks like row-major<br>The matrices are being post multiplied.
 * @module mat4
 */

/**
 * Creates a new identity mat4
 *
 * @returns {mat4} a new 4x4 matrix
 */

function create$5() {
  var out = new ARRAY_TYPE$1(16);

  if (ARRAY_TYPE$1 != Float32Array) {
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
  }

  out[0] = 1;
  out[5] = 1;
  out[10] = 1;
  out[15] = 1;
  return out;
}
/**
 * Creates a new mat4 initialized with values from an existing matrix
 *
 * @param {ReadonlyMat4} a matrix to clone
 * @returns {mat4} a new 4x4 matrix
 */


function clone$5(a) {
  var out = new ARRAY_TYPE$1(16);
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[3];
  out[4] = a[4];
  out[5] = a[5];
  out[6] = a[6];
  out[7] = a[7];
  out[8] = a[8];
  out[9] = a[9];
  out[10] = a[10];
  out[11] = a[11];
  out[12] = a[12];
  out[13] = a[13];
  out[14] = a[14];
  out[15] = a[15];
  return out;
}
/**
 * Copy the values from one mat4 to another
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the source matrix
 * @returns {mat4} out
 */


function copy$5(out, a) {
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[3];
  out[4] = a[4];
  out[5] = a[5];
  out[6] = a[6];
  out[7] = a[7];
  out[8] = a[8];
  out[9] = a[9];
  out[10] = a[10];
  out[11] = a[11];
  out[12] = a[12];
  out[13] = a[13];
  out[14] = a[14];
  out[15] = a[15];
  return out;
}
/**
 * Create a new mat4 with the given values
 *
 * @param {Number} m00 Component in column 0, row 0 position (index 0)
 * @param {Number} m01 Component in column 0, row 1 position (index 1)
 * @param {Number} m02 Component in column 0, row 2 position (index 2)
 * @param {Number} m03 Component in column 0, row 3 position (index 3)
 * @param {Number} m10 Component in column 1, row 0 position (index 4)
 * @param {Number} m11 Component in column 1, row 1 position (index 5)
 * @param {Number} m12 Component in column 1, row 2 position (index 6)
 * @param {Number} m13 Component in column 1, row 3 position (index 7)
 * @param {Number} m20 Component in column 2, row 0 position (index 8)
 * @param {Number} m21 Component in column 2, row 1 position (index 9)
 * @param {Number} m22 Component in column 2, row 2 position (index 10)
 * @param {Number} m23 Component in column 2, row 3 position (index 11)
 * @param {Number} m30 Component in column 3, row 0 position (index 12)
 * @param {Number} m31 Component in column 3, row 1 position (index 13)
 * @param {Number} m32 Component in column 3, row 2 position (index 14)
 * @param {Number} m33 Component in column 3, row 3 position (index 15)
 * @returns {mat4} A new mat4
 */


function fromValues$5(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33) {
  var out = new ARRAY_TYPE$1(16);
  out[0] = m00;
  out[1] = m01;
  out[2] = m02;
  out[3] = m03;
  out[4] = m10;
  out[5] = m11;
  out[6] = m12;
  out[7] = m13;
  out[8] = m20;
  out[9] = m21;
  out[10] = m22;
  out[11] = m23;
  out[12] = m30;
  out[13] = m31;
  out[14] = m32;
  out[15] = m33;
  return out;
}
/**
 * Set the components of a mat4 to the given values
 *
 * @param {mat4} out the receiving matrix
 * @param {Number} m00 Component in column 0, row 0 position (index 0)
 * @param {Number} m01 Component in column 0, row 1 position (index 1)
 * @param {Number} m02 Component in column 0, row 2 position (index 2)
 * @param {Number} m03 Component in column 0, row 3 position (index 3)
 * @param {Number} m10 Component in column 1, row 0 position (index 4)
 * @param {Number} m11 Component in column 1, row 1 position (index 5)
 * @param {Number} m12 Component in column 1, row 2 position (index 6)
 * @param {Number} m13 Component in column 1, row 3 position (index 7)
 * @param {Number} m20 Component in column 2, row 0 position (index 8)
 * @param {Number} m21 Component in column 2, row 1 position (index 9)
 * @param {Number} m22 Component in column 2, row 2 position (index 10)
 * @param {Number} m23 Component in column 2, row 3 position (index 11)
 * @param {Number} m30 Component in column 3, row 0 position (index 12)
 * @param {Number} m31 Component in column 3, row 1 position (index 13)
 * @param {Number} m32 Component in column 3, row 2 position (index 14)
 * @param {Number} m33 Component in column 3, row 3 position (index 15)
 * @returns {mat4} out
 */


function set$5(out, m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33) {
  out[0] = m00;
  out[1] = m01;
  out[2] = m02;
  out[3] = m03;
  out[4] = m10;
  out[5] = m11;
  out[6] = m12;
  out[7] = m13;
  out[8] = m20;
  out[9] = m21;
  out[10] = m22;
  out[11] = m23;
  out[12] = m30;
  out[13] = m31;
  out[14] = m32;
  out[15] = m33;
  return out;
}
/**
 * Set a mat4 to the identity matrix
 *
 * @param {mat4} out the receiving matrix
 * @returns {mat4} out
 */


function identity$2(out) {
  out[0] = 1;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = 1;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = 1;
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}
/**
 * Transpose the values of a mat4
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the source matrix
 * @returns {mat4} out
 */


function transpose(out, a) {
  // If we are transposing ourselves we can skip a few steps but have to cache some values
  if (out === a) {
    var a01 = a[1],
        a02 = a[2],
        a03 = a[3];
    var a12 = a[6],
        a13 = a[7];
    var a23 = a[11];
    out[1] = a[4];
    out[2] = a[8];
    out[3] = a[12];
    out[4] = a01;
    out[6] = a[9];
    out[7] = a[13];
    out[8] = a02;
    out[9] = a12;
    out[11] = a[14];
    out[12] = a03;
    out[13] = a13;
    out[14] = a23;
  } else {
    out[0] = a[0];
    out[1] = a[4];
    out[2] = a[8];
    out[3] = a[12];
    out[4] = a[1];
    out[5] = a[5];
    out[6] = a[9];
    out[7] = a[13];
    out[8] = a[2];
    out[9] = a[6];
    out[10] = a[10];
    out[11] = a[14];
    out[12] = a[3];
    out[13] = a[7];
    out[14] = a[11];
    out[15] = a[15];
  }

  return out;
}
/**
 * Inverts a mat4
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the source matrix
 * @returns {mat4} out
 */


function invert$2(out, a) {
  var a00 = a[0],
      a01 = a[1],
      a02 = a[2],
      a03 = a[3];
  var a10 = a[4],
      a11 = a[5],
      a12 = a[6],
      a13 = a[7];
  var a20 = a[8],
      a21 = a[9],
      a22 = a[10],
      a23 = a[11];
  var a30 = a[12],
      a31 = a[13],
      a32 = a[14],
      a33 = a[15];
  var b00 = a00 * a11 - a01 * a10;
  var b01 = a00 * a12 - a02 * a10;
  var b02 = a00 * a13 - a03 * a10;
  var b03 = a01 * a12 - a02 * a11;
  var b04 = a01 * a13 - a03 * a11;
  var b05 = a02 * a13 - a03 * a12;
  var b06 = a20 * a31 - a21 * a30;
  var b07 = a20 * a32 - a22 * a30;
  var b08 = a20 * a33 - a23 * a30;
  var b09 = a21 * a32 - a22 * a31;
  var b10 = a21 * a33 - a23 * a31;
  var b11 = a22 * a33 - a23 * a32; // Calculate the determinant

  var det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

  if (!det) {
    return null;
  }

  det = 1.0 / det;
  out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
  out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
  out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
  out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
  out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
  out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
  out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
  out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
  out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
  out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
  out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
  out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
  out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
  out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
  out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
  out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
  return out;
}
/**
 * Calculates the adjugate of a mat4
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the source matrix
 * @returns {mat4} out
 */


function adjoint(out, a) {
  var a00 = a[0],
      a01 = a[1],
      a02 = a[2],
      a03 = a[3];
  var a10 = a[4],
      a11 = a[5],
      a12 = a[6],
      a13 = a[7];
  var a20 = a[8],
      a21 = a[9],
      a22 = a[10],
      a23 = a[11];
  var a30 = a[12],
      a31 = a[13],
      a32 = a[14],
      a33 = a[15];
  out[0] = a11 * (a22 * a33 - a23 * a32) - a21 * (a12 * a33 - a13 * a32) + a31 * (a12 * a23 - a13 * a22);
  out[1] = -(a01 * (a22 * a33 - a23 * a32) - a21 * (a02 * a33 - a03 * a32) + a31 * (a02 * a23 - a03 * a22));
  out[2] = a01 * (a12 * a33 - a13 * a32) - a11 * (a02 * a33 - a03 * a32) + a31 * (a02 * a13 - a03 * a12);
  out[3] = -(a01 * (a12 * a23 - a13 * a22) - a11 * (a02 * a23 - a03 * a22) + a21 * (a02 * a13 - a03 * a12));
  out[4] = -(a10 * (a22 * a33 - a23 * a32) - a20 * (a12 * a33 - a13 * a32) + a30 * (a12 * a23 - a13 * a22));
  out[5] = a00 * (a22 * a33 - a23 * a32) - a20 * (a02 * a33 - a03 * a32) + a30 * (a02 * a23 - a03 * a22);
  out[6] = -(a00 * (a12 * a33 - a13 * a32) - a10 * (a02 * a33 - a03 * a32) + a30 * (a02 * a13 - a03 * a12));
  out[7] = a00 * (a12 * a23 - a13 * a22) - a10 * (a02 * a23 - a03 * a22) + a20 * (a02 * a13 - a03 * a12);
  out[8] = a10 * (a21 * a33 - a23 * a31) - a20 * (a11 * a33 - a13 * a31) + a30 * (a11 * a23 - a13 * a21);
  out[9] = -(a00 * (a21 * a33 - a23 * a31) - a20 * (a01 * a33 - a03 * a31) + a30 * (a01 * a23 - a03 * a21));
  out[10] = a00 * (a11 * a33 - a13 * a31) - a10 * (a01 * a33 - a03 * a31) + a30 * (a01 * a13 - a03 * a11);
  out[11] = -(a00 * (a11 * a23 - a13 * a21) - a10 * (a01 * a23 - a03 * a21) + a20 * (a01 * a13 - a03 * a11));
  out[12] = -(a10 * (a21 * a32 - a22 * a31) - a20 * (a11 * a32 - a12 * a31) + a30 * (a11 * a22 - a12 * a21));
  out[13] = a00 * (a21 * a32 - a22 * a31) - a20 * (a01 * a32 - a02 * a31) + a30 * (a01 * a22 - a02 * a21);
  out[14] = -(a00 * (a11 * a32 - a12 * a31) - a10 * (a01 * a32 - a02 * a31) + a30 * (a01 * a12 - a02 * a11));
  out[15] = a00 * (a11 * a22 - a12 * a21) - a10 * (a01 * a22 - a02 * a21) + a20 * (a01 * a12 - a02 * a11);
  return out;
}
/**
 * Calculates the determinant of a mat4
 *
 * @param {ReadonlyMat4} a the source matrix
 * @returns {Number} determinant of a
 */


function determinant(a) {
  var a00 = a[0],
      a01 = a[1],
      a02 = a[2],
      a03 = a[3];
  var a10 = a[4],
      a11 = a[5],
      a12 = a[6],
      a13 = a[7];
  var a20 = a[8],
      a21 = a[9],
      a22 = a[10],
      a23 = a[11];
  var a30 = a[12],
      a31 = a[13],
      a32 = a[14],
      a33 = a[15];
  var b00 = a00 * a11 - a01 * a10;
  var b01 = a00 * a12 - a02 * a10;
  var b02 = a00 * a13 - a03 * a10;
  var b03 = a01 * a12 - a02 * a11;
  var b04 = a01 * a13 - a03 * a11;
  var b05 = a02 * a13 - a03 * a12;
  var b06 = a20 * a31 - a21 * a30;
  var b07 = a20 * a32 - a22 * a30;
  var b08 = a20 * a33 - a23 * a30;
  var b09 = a21 * a32 - a22 * a31;
  var b10 = a21 * a33 - a23 * a31;
  var b11 = a22 * a33 - a23 * a32; // Calculate the determinant

  return b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
}
/**
 * Multiplies two mat4s
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the first operand
 * @param {ReadonlyMat4} b the second operand
 * @returns {mat4} out
 */


function multiply$5(out, a, b) {
  var a00 = a[0],
      a01 = a[1],
      a02 = a[2],
      a03 = a[3];
  var a10 = a[4],
      a11 = a[5],
      a12 = a[6],
      a13 = a[7];
  var a20 = a[8],
      a21 = a[9],
      a22 = a[10],
      a23 = a[11];
  var a30 = a[12],
      a31 = a[13],
      a32 = a[14],
      a33 = a[15]; // Cache only the current line of the second matrix

  var b0 = b[0],
      b1 = b[1],
      b2 = b[2],
      b3 = b[3];
  out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
  b0 = b[4];
  b1 = b[5];
  b2 = b[6];
  b3 = b[7];
  out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
  b0 = b[8];
  b1 = b[9];
  b2 = b[10];
  b3 = b[11];
  out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
  b0 = b[12];
  b1 = b[13];
  b2 = b[14];
  b3 = b[15];
  out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
  return out;
}
/**
 * Translate a mat4 by the given vector
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the matrix to translate
 * @param {ReadonlyVec3} v vector to translate by
 * @returns {mat4} out
 */


function translate$1(out, a, v) {
  var x = v[0],
      y = v[1],
      z = v[2];
  var a00, a01, a02, a03;
  var a10, a11, a12, a13;
  var a20, a21, a22, a23;

  if (a === out) {
    out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
    out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
    out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
    out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
  } else {
    a00 = a[0];
    a01 = a[1];
    a02 = a[2];
    a03 = a[3];
    a10 = a[4];
    a11 = a[5];
    a12 = a[6];
    a13 = a[7];
    a20 = a[8];
    a21 = a[9];
    a22 = a[10];
    a23 = a[11];
    out[0] = a00;
    out[1] = a01;
    out[2] = a02;
    out[3] = a03;
    out[4] = a10;
    out[5] = a11;
    out[6] = a12;
    out[7] = a13;
    out[8] = a20;
    out[9] = a21;
    out[10] = a22;
    out[11] = a23;
    out[12] = a00 * x + a10 * y + a20 * z + a[12];
    out[13] = a01 * x + a11 * y + a21 * z + a[13];
    out[14] = a02 * x + a12 * y + a22 * z + a[14];
    out[15] = a03 * x + a13 * y + a23 * z + a[15];
  }

  return out;
}
/**
 * Scales the mat4 by the dimensions in the given vec3 not using vectorization
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the matrix to scale
 * @param {ReadonlyVec3} v the vec3 to scale the matrix by
 * @returns {mat4} out
 **/


function scale$5(out, a, v) {
  var x = v[0],
      y = v[1],
      z = v[2];
  out[0] = a[0] * x;
  out[1] = a[1] * x;
  out[2] = a[2] * x;
  out[3] = a[3] * x;
  out[4] = a[4] * y;
  out[5] = a[5] * y;
  out[6] = a[6] * y;
  out[7] = a[7] * y;
  out[8] = a[8] * z;
  out[9] = a[9] * z;
  out[10] = a[10] * z;
  out[11] = a[11] * z;
  out[12] = a[12];
  out[13] = a[13];
  out[14] = a[14];
  out[15] = a[15];
  return out;
}
/**
 * Rotates a mat4 by the given angle around the given axis
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @param {ReadonlyVec3} axis the axis to rotate around
 * @returns {mat4} out
 */


function rotate$1(out, a, rad, axis) {
  var x = axis[0],
      y = axis[1],
      z = axis[2];
  var len = Math.hypot(x, y, z);
  var s, c, t;
  var a00, a01, a02, a03;
  var a10, a11, a12, a13;
  var a20, a21, a22, a23;
  var b00, b01, b02;
  var b10, b11, b12;
  var b20, b21, b22;

  if (len < EPSILON$1) {
    return null;
  }

  len = 1 / len;
  x *= len;
  y *= len;
  z *= len;
  s = Math.sin(rad);
  c = Math.cos(rad);
  t = 1 - c;
  a00 = a[0];
  a01 = a[1];
  a02 = a[2];
  a03 = a[3];
  a10 = a[4];
  a11 = a[5];
  a12 = a[6];
  a13 = a[7];
  a20 = a[8];
  a21 = a[9];
  a22 = a[10];
  a23 = a[11]; // Construct the elements of the rotation matrix

  b00 = x * x * t + c;
  b01 = y * x * t + z * s;
  b02 = z * x * t - y * s;
  b10 = x * y * t - z * s;
  b11 = y * y * t + c;
  b12 = z * y * t + x * s;
  b20 = x * z * t + y * s;
  b21 = y * z * t - x * s;
  b22 = z * z * t + c; // Perform rotation-specific matrix multiplication

  out[0] = a00 * b00 + a10 * b01 + a20 * b02;
  out[1] = a01 * b00 + a11 * b01 + a21 * b02;
  out[2] = a02 * b00 + a12 * b01 + a22 * b02;
  out[3] = a03 * b00 + a13 * b01 + a23 * b02;
  out[4] = a00 * b10 + a10 * b11 + a20 * b12;
  out[5] = a01 * b10 + a11 * b11 + a21 * b12;
  out[6] = a02 * b10 + a12 * b11 + a22 * b12;
  out[7] = a03 * b10 + a13 * b11 + a23 * b12;
  out[8] = a00 * b20 + a10 * b21 + a20 * b22;
  out[9] = a01 * b20 + a11 * b21 + a21 * b22;
  out[10] = a02 * b20 + a12 * b21 + a22 * b22;
  out[11] = a03 * b20 + a13 * b21 + a23 * b22;

  if (a !== out) {
    // If the source and destination differ, copy the unchanged last row
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
  }

  return out;
}
/**
 * Rotates a matrix by the given angle around the X axis
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */


function rotateX$3(out, a, rad) {
  var s = Math.sin(rad);
  var c = Math.cos(rad);
  var a10 = a[4];
  var a11 = a[5];
  var a12 = a[6];
  var a13 = a[7];
  var a20 = a[8];
  var a21 = a[9];
  var a22 = a[10];
  var a23 = a[11];

  if (a !== out) {
    // If the source and destination differ, copy the unchanged rows
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
  } // Perform axis-specific matrix multiplication


  out[4] = a10 * c + a20 * s;
  out[5] = a11 * c + a21 * s;
  out[6] = a12 * c + a22 * s;
  out[7] = a13 * c + a23 * s;
  out[8] = a20 * c - a10 * s;
  out[9] = a21 * c - a11 * s;
  out[10] = a22 * c - a12 * s;
  out[11] = a23 * c - a13 * s;
  return out;
}
/**
 * Rotates a matrix by the given angle around the Y axis
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */


function rotateY$3(out, a, rad) {
  var s = Math.sin(rad);
  var c = Math.cos(rad);
  var a00 = a[0];
  var a01 = a[1];
  var a02 = a[2];
  var a03 = a[3];
  var a20 = a[8];
  var a21 = a[9];
  var a22 = a[10];
  var a23 = a[11];

  if (a !== out) {
    // If the source and destination differ, copy the unchanged rows
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
  } // Perform axis-specific matrix multiplication


  out[0] = a00 * c - a20 * s;
  out[1] = a01 * c - a21 * s;
  out[2] = a02 * c - a22 * s;
  out[3] = a03 * c - a23 * s;
  out[8] = a00 * s + a20 * c;
  out[9] = a01 * s + a21 * c;
  out[10] = a02 * s + a22 * c;
  out[11] = a03 * s + a23 * c;
  return out;
}
/**
 * Rotates a matrix by the given angle around the Z axis
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */


function rotateZ$3(out, a, rad) {
  var s = Math.sin(rad);
  var c = Math.cos(rad);
  var a00 = a[0];
  var a01 = a[1];
  var a02 = a[2];
  var a03 = a[3];
  var a10 = a[4];
  var a11 = a[5];
  var a12 = a[6];
  var a13 = a[7];

  if (a !== out) {
    // If the source and destination differ, copy the unchanged last row
    out[8] = a[8];
    out[9] = a[9];
    out[10] = a[10];
    out[11] = a[11];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
  } // Perform axis-specific matrix multiplication


  out[0] = a00 * c + a10 * s;
  out[1] = a01 * c + a11 * s;
  out[2] = a02 * c + a12 * s;
  out[3] = a03 * c + a13 * s;
  out[4] = a10 * c - a00 * s;
  out[5] = a11 * c - a01 * s;
  out[6] = a12 * c - a02 * s;
  out[7] = a13 * c - a03 * s;
  return out;
}
/**
 * Creates a matrix from a vector translation
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.translate(dest, dest, vec);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {ReadonlyVec3} v Translation vector
 * @returns {mat4} out
 */


function fromTranslation$1(out, v) {
  out[0] = 1;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = 1;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = 1;
  out[11] = 0;
  out[12] = v[0];
  out[13] = v[1];
  out[14] = v[2];
  out[15] = 1;
  return out;
}
/**
 * Creates a matrix from a vector scaling
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.scale(dest, dest, vec);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {ReadonlyVec3} v Scaling vector
 * @returns {mat4} out
 */


function fromScaling(out, v) {
  out[0] = v[0];
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = v[1];
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = v[2];
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}
/**
 * Creates a matrix from a given angle around a given axis
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.rotate(dest, dest, rad, axis);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {Number} rad the angle to rotate the matrix by
 * @param {ReadonlyVec3} axis the axis to rotate around
 * @returns {mat4} out
 */


function fromRotation$1(out, rad, axis) {
  var x = axis[0],
      y = axis[1],
      z = axis[2];
  var len = Math.hypot(x, y, z);
  var s, c, t;

  if (len < EPSILON$1) {
    return null;
  }

  len = 1 / len;
  x *= len;
  y *= len;
  z *= len;
  s = Math.sin(rad);
  c = Math.cos(rad);
  t = 1 - c; // Perform rotation-specific matrix multiplication

  out[0] = x * x * t + c;
  out[1] = y * x * t + z * s;
  out[2] = z * x * t - y * s;
  out[3] = 0;
  out[4] = x * y * t - z * s;
  out[5] = y * y * t + c;
  out[6] = z * y * t + x * s;
  out[7] = 0;
  out[8] = x * z * t + y * s;
  out[9] = y * z * t - x * s;
  out[10] = z * z * t + c;
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}
/**
 * Creates a matrix from the given angle around the X axis
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.rotateX(dest, dest, rad);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */


function fromXRotation(out, rad) {
  var s = Math.sin(rad);
  var c = Math.cos(rad); // Perform axis-specific matrix multiplication

  out[0] = 1;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = c;
  out[6] = s;
  out[7] = 0;
  out[8] = 0;
  out[9] = -s;
  out[10] = c;
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}
/**
 * Creates a matrix from the given angle around the Y axis
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.rotateY(dest, dest, rad);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */


function fromYRotation(out, rad) {
  var s = Math.sin(rad);
  var c = Math.cos(rad); // Perform axis-specific matrix multiplication

  out[0] = c;
  out[1] = 0;
  out[2] = -s;
  out[3] = 0;
  out[4] = 0;
  out[5] = 1;
  out[6] = 0;
  out[7] = 0;
  out[8] = s;
  out[9] = 0;
  out[10] = c;
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}
/**
 * Creates a matrix from the given angle around the Z axis
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.rotateZ(dest, dest, rad);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */


function fromZRotation(out, rad) {
  var s = Math.sin(rad);
  var c = Math.cos(rad); // Perform axis-specific matrix multiplication

  out[0] = c;
  out[1] = s;
  out[2] = 0;
  out[3] = 0;
  out[4] = -s;
  out[5] = c;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = 1;
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}
/**
 * Creates a matrix from a quaternion rotation and vector translation
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.translate(dest, vec);
 *     let quatMat = mat4.create();
 *     quat4.toMat4(quat, quatMat);
 *     mat4.multiply(dest, quatMat);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {quat4} q Rotation quaternion
 * @param {ReadonlyVec3} v Translation vector
 * @returns {mat4} out
 */


function fromRotationTranslation$1(out, q, v) {
  // Quaternion math
  var x = q[0],
      y = q[1],
      z = q[2],
      w = q[3];
  var x2 = x + x;
  var y2 = y + y;
  var z2 = z + z;
  var xx = x * x2;
  var xy = x * y2;
  var xz = x * z2;
  var yy = y * y2;
  var yz = y * z2;
  var zz = z * z2;
  var wx = w * x2;
  var wy = w * y2;
  var wz = w * z2;
  out[0] = 1 - (yy + zz);
  out[1] = xy + wz;
  out[2] = xz - wy;
  out[3] = 0;
  out[4] = xy - wz;
  out[5] = 1 - (xx + zz);
  out[6] = yz + wx;
  out[7] = 0;
  out[8] = xz + wy;
  out[9] = yz - wx;
  out[10] = 1 - (xx + yy);
  out[11] = 0;
  out[12] = v[0];
  out[13] = v[1];
  out[14] = v[2];
  out[15] = 1;
  return out;
}
/**
 * Creates a new mat4 from a dual quat.
 *
 * @param {mat4} out Matrix
 * @param {ReadonlyQuat2} a Dual Quaternion
 * @returns {mat4} mat4 receiving operation result
 */


function fromQuat2(out, a) {
  var translation = new ARRAY_TYPE$1(3);
  var bx = -a[0],
      by = -a[1],
      bz = -a[2],
      bw = a[3],
      ax = a[4],
      ay = a[5],
      az = a[6],
      aw = a[7];
  var magnitude = bx * bx + by * by + bz * bz + bw * bw; //Only scale if it makes sense

  if (magnitude > 0) {
    translation[0] = (ax * bw + aw * bx + ay * bz - az * by) * 2 / magnitude;
    translation[1] = (ay * bw + aw * by + az * bx - ax * bz) * 2 / magnitude;
    translation[2] = (az * bw + aw * bz + ax * by - ay * bx) * 2 / magnitude;
  } else {
    translation[0] = (ax * bw + aw * bx + ay * bz - az * by) * 2;
    translation[1] = (ay * bw + aw * by + az * bx - ax * bz) * 2;
    translation[2] = (az * bw + aw * bz + ax * by - ay * bx) * 2;
  }

  fromRotationTranslation$1(out, a, translation);
  return out;
}
/**
 * Returns the translation vector component of a transformation
 *  matrix. If a matrix is built with fromRotationTranslation,
 *  the returned vector will be the same as the translation vector
 *  originally supplied.
 * @param  {vec3} out Vector to receive translation component
 * @param  {ReadonlyMat4} mat Matrix to be decomposed (input)
 * @return {vec3} out
 */


function getTranslation$1(out, mat) {
  out[0] = mat[12];
  out[1] = mat[13];
  out[2] = mat[14];
  return out;
}
/**
 * Returns the scaling factor component of a transformation
 *  matrix. If a matrix is built with fromRotationTranslationScale
 *  with a normalized Quaternion paramter, the returned vector will be
 *  the same as the scaling vector
 *  originally supplied.
 * @param  {vec3} out Vector to receive scaling factor component
 * @param  {ReadonlyMat4} mat Matrix to be decomposed (input)
 * @return {vec3} out
 */


function getScaling(out, mat) {
  var m11 = mat[0];
  var m12 = mat[1];
  var m13 = mat[2];
  var m21 = mat[4];
  var m22 = mat[5];
  var m23 = mat[6];
  var m31 = mat[8];
  var m32 = mat[9];
  var m33 = mat[10];
  out[0] = Math.hypot(m11, m12, m13);
  out[1] = Math.hypot(m21, m22, m23);
  out[2] = Math.hypot(m31, m32, m33);
  return out;
}
/**
 * Returns a quaternion representing the rotational component
 *  of a transformation matrix. If a matrix is built with
 *  fromRotationTranslation, the returned quaternion will be the
 *  same as the quaternion originally supplied.
 * @param {quat} out Quaternion to receive the rotation component
 * @param {ReadonlyMat4} mat Matrix to be decomposed (input)
 * @return {quat} out
 */


function getRotation(out, mat) {
  var scaling = new ARRAY_TYPE$1(3);
  getScaling(scaling, mat);
  var is1 = 1 / scaling[0];
  var is2 = 1 / scaling[1];
  var is3 = 1 / scaling[2];
  var sm11 = mat[0] * is1;
  var sm12 = mat[1] * is2;
  var sm13 = mat[2] * is3;
  var sm21 = mat[4] * is1;
  var sm22 = mat[5] * is2;
  var sm23 = mat[6] * is3;
  var sm31 = mat[8] * is1;
  var sm32 = mat[9] * is2;
  var sm33 = mat[10] * is3;
  var trace = sm11 + sm22 + sm33;
  var S = 0;

  if (trace > 0) {
    S = Math.sqrt(trace + 1.0) * 2;
    out[3] = 0.25 * S;
    out[0] = (sm23 - sm32) / S;
    out[1] = (sm31 - sm13) / S;
    out[2] = (sm12 - sm21) / S;
  } else if (sm11 > sm22 && sm11 > sm33) {
    S = Math.sqrt(1.0 + sm11 - sm22 - sm33) * 2;
    out[3] = (sm23 - sm32) / S;
    out[0] = 0.25 * S;
    out[1] = (sm12 + sm21) / S;
    out[2] = (sm31 + sm13) / S;
  } else if (sm22 > sm33) {
    S = Math.sqrt(1.0 + sm22 - sm11 - sm33) * 2;
    out[3] = (sm31 - sm13) / S;
    out[0] = (sm12 + sm21) / S;
    out[1] = 0.25 * S;
    out[2] = (sm23 + sm32) / S;
  } else {
    S = Math.sqrt(1.0 + sm33 - sm11 - sm22) * 2;
    out[3] = (sm12 - sm21) / S;
    out[0] = (sm31 + sm13) / S;
    out[1] = (sm23 + sm32) / S;
    out[2] = 0.25 * S;
  }

  return out;
}
/**
 * Creates a matrix from a quaternion rotation, vector translation and vector scale
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.translate(dest, vec);
 *     let quatMat = mat4.create();
 *     quat4.toMat4(quat, quatMat);
 *     mat4.multiply(dest, quatMat);
 *     mat4.scale(dest, scale)
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {quat4} q Rotation quaternion
 * @param {ReadonlyVec3} v Translation vector
 * @param {ReadonlyVec3} s Scaling vector
 * @returns {mat4} out
 */


function fromRotationTranslationScale(out, q, v, s) {
  // Quaternion math
  var x = q[0],
      y = q[1],
      z = q[2],
      w = q[3];
  var x2 = x + x;
  var y2 = y + y;
  var z2 = z + z;
  var xx = x * x2;
  var xy = x * y2;
  var xz = x * z2;
  var yy = y * y2;
  var yz = y * z2;
  var zz = z * z2;
  var wx = w * x2;
  var wy = w * y2;
  var wz = w * z2;
  var sx = s[0];
  var sy = s[1];
  var sz = s[2];
  out[0] = (1 - (yy + zz)) * sx;
  out[1] = (xy + wz) * sx;
  out[2] = (xz - wy) * sx;
  out[3] = 0;
  out[4] = (xy - wz) * sy;
  out[5] = (1 - (xx + zz)) * sy;
  out[6] = (yz + wx) * sy;
  out[7] = 0;
  out[8] = (xz + wy) * sz;
  out[9] = (yz - wx) * sz;
  out[10] = (1 - (xx + yy)) * sz;
  out[11] = 0;
  out[12] = v[0];
  out[13] = v[1];
  out[14] = v[2];
  out[15] = 1;
  return out;
}
/**
 * Creates a matrix from a quaternion rotation, vector translation and vector scale, rotating and scaling around the given origin
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.translate(dest, vec);
 *     mat4.translate(dest, origin);
 *     let quatMat = mat4.create();
 *     quat4.toMat4(quat, quatMat);
 *     mat4.multiply(dest, quatMat);
 *     mat4.scale(dest, scale)
 *     mat4.translate(dest, negativeOrigin);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {quat4} q Rotation quaternion
 * @param {ReadonlyVec3} v Translation vector
 * @param {ReadonlyVec3} s Scaling vector
 * @param {ReadonlyVec3} o The origin vector around which to scale and rotate
 * @returns {mat4} out
 */


function fromRotationTranslationScaleOrigin(out, q, v, s, o) {
  // Quaternion math
  var x = q[0],
      y = q[1],
      z = q[2],
      w = q[3];
  var x2 = x + x;
  var y2 = y + y;
  var z2 = z + z;
  var xx = x * x2;
  var xy = x * y2;
  var xz = x * z2;
  var yy = y * y2;
  var yz = y * z2;
  var zz = z * z2;
  var wx = w * x2;
  var wy = w * y2;
  var wz = w * z2;
  var sx = s[0];
  var sy = s[1];
  var sz = s[2];
  var ox = o[0];
  var oy = o[1];
  var oz = o[2];
  var out0 = (1 - (yy + zz)) * sx;
  var out1 = (xy + wz) * sx;
  var out2 = (xz - wy) * sx;
  var out4 = (xy - wz) * sy;
  var out5 = (1 - (xx + zz)) * sy;
  var out6 = (yz + wx) * sy;
  var out8 = (xz + wy) * sz;
  var out9 = (yz - wx) * sz;
  var out10 = (1 - (xx + yy)) * sz;
  out[0] = out0;
  out[1] = out1;
  out[2] = out2;
  out[3] = 0;
  out[4] = out4;
  out[5] = out5;
  out[6] = out6;
  out[7] = 0;
  out[8] = out8;
  out[9] = out9;
  out[10] = out10;
  out[11] = 0;
  out[12] = v[0] + ox - (out0 * ox + out4 * oy + out8 * oz);
  out[13] = v[1] + oy - (out1 * ox + out5 * oy + out9 * oz);
  out[14] = v[2] + oz - (out2 * ox + out6 * oy + out10 * oz);
  out[15] = 1;
  return out;
}
/**
 * Calculates a 4x4 matrix from the given quaternion
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {ReadonlyQuat} q Quaternion to create matrix from
 *
 * @returns {mat4} out
 */


function fromQuat(out, q) {
  var x = q[0],
      y = q[1],
      z = q[2],
      w = q[3];
  var x2 = x + x;
  var y2 = y + y;
  var z2 = z + z;
  var xx = x * x2;
  var yx = y * x2;
  var yy = y * y2;
  var zx = z * x2;
  var zy = z * y2;
  var zz = z * z2;
  var wx = w * x2;
  var wy = w * y2;
  var wz = w * z2;
  out[0] = 1 - yy - zz;
  out[1] = yx + wz;
  out[2] = zx - wy;
  out[3] = 0;
  out[4] = yx - wz;
  out[5] = 1 - xx - zz;
  out[6] = zy + wx;
  out[7] = 0;
  out[8] = zx + wy;
  out[9] = zy - wx;
  out[10] = 1 - xx - yy;
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}
/**
 * Generates a frustum matrix with the given bounds
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {Number} left Left bound of the frustum
 * @param {Number} right Right bound of the frustum
 * @param {Number} bottom Bottom bound of the frustum
 * @param {Number} top Top bound of the frustum
 * @param {Number} near Near bound of the frustum
 * @param {Number} far Far bound of the frustum
 * @returns {mat4} out
 */


function frustum(out, left, right, bottom, top, near, far) {
  var rl = 1 / (right - left);
  var tb = 1 / (top - bottom);
  var nf = 1 / (near - far);
  out[0] = near * 2 * rl;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = near * 2 * tb;
  out[6] = 0;
  out[7] = 0;
  out[8] = (right + left) * rl;
  out[9] = (top + bottom) * tb;
  out[10] = (far + near) * nf;
  out[11] = -1;
  out[12] = 0;
  out[13] = 0;
  out[14] = far * near * 2 * nf;
  out[15] = 0;
  return out;
}
/**
 * Generates a perspective projection matrix with the given bounds.
 * The near/far clip planes correspond to a normalized device coordinate Z range of [-1, 1],
 * which matches WebGL/OpenGL's clip volume.
 * Passing null/undefined/no value for far will generate infinite projection matrix.
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {number} fovy Vertical field of view in radians
 * @param {number} aspect Aspect ratio. typically viewport width/height
 * @param {number} near Near bound of the frustum
 * @param {number} far Far bound of the frustum, can be null or Infinity
 * @returns {mat4} out
 */


function perspectiveNO(out, fovy, aspect, near, far) {
  var f = 1.0 / Math.tan(fovy / 2),
      nf;
  out[0] = f / aspect;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = f;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[11] = -1;
  out[12] = 0;
  out[13] = 0;
  out[15] = 0;

  if (far != null && far !== Infinity) {
    nf = 1 / (near - far);
    out[10] = (far + near) * nf;
    out[14] = 2 * far * near * nf;
  } else {
    out[10] = -1;
    out[14] = -2 * near;
  }

  return out;
}
/**
 * Alias for {@link mat4.perspectiveNO}
 * @function
 */


var perspective = perspectiveNO;
/**
 * Generates a perspective projection matrix suitable for WebGPU with the given bounds.
 * The near/far clip planes correspond to a normalized device coordinate Z range of [0, 1],
 * which matches WebGPU/Vulkan/DirectX/Metal's clip volume.
 * Passing null/undefined/no value for far will generate infinite projection matrix.
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {number} fovy Vertical field of view in radians
 * @param {number} aspect Aspect ratio. typically viewport width/height
 * @param {number} near Near bound of the frustum
 * @param {number} far Far bound of the frustum, can be null or Infinity
 * @returns {mat4} out
 */

function perspectiveZO(out, fovy, aspect, near, far) {
  var f = 1.0 / Math.tan(fovy / 2),
      nf;
  out[0] = f / aspect;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = f;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[11] = -1;
  out[12] = 0;
  out[13] = 0;
  out[15] = 0;

  if (far != null && far !== Infinity) {
    nf = 1 / (near - far);
    out[10] = far * nf;
    out[14] = far * near * nf;
  } else {
    out[10] = -1;
    out[14] = -near;
  }

  return out;
}
/**
 * Generates a perspective projection matrix with the given field of view.
 * This is primarily useful for generating projection matrices to be used
 * with the still experiemental WebVR API.
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {Object} fov Object containing the following values: upDegrees, downDegrees, leftDegrees, rightDegrees
 * @param {number} near Near bound of the frustum
 * @param {number} far Far bound of the frustum
 * @returns {mat4} out
 */


function perspectiveFromFieldOfView(out, fov, near, far) {
  var upTan = Math.tan(fov.upDegrees * Math.PI / 180.0);
  var downTan = Math.tan(fov.downDegrees * Math.PI / 180.0);
  var leftTan = Math.tan(fov.leftDegrees * Math.PI / 180.0);
  var rightTan = Math.tan(fov.rightDegrees * Math.PI / 180.0);
  var xScale = 2.0 / (leftTan + rightTan);
  var yScale = 2.0 / (upTan + downTan);
  out[0] = xScale;
  out[1] = 0.0;
  out[2] = 0.0;
  out[3] = 0.0;
  out[4] = 0.0;
  out[5] = yScale;
  out[6] = 0.0;
  out[7] = 0.0;
  out[8] = -((leftTan - rightTan) * xScale * 0.5);
  out[9] = (upTan - downTan) * yScale * 0.5;
  out[10] = far / (near - far);
  out[11] = -1.0;
  out[12] = 0.0;
  out[13] = 0.0;
  out[14] = far * near / (near - far);
  out[15] = 0.0;
  return out;
}
/**
 * Generates a orthogonal projection matrix with the given bounds.
 * The near/far clip planes correspond to a normalized device coordinate Z range of [-1, 1],
 * which matches WebGL/OpenGL's clip volume.
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {number} left Left bound of the frustum
 * @param {number} right Right bound of the frustum
 * @param {number} bottom Bottom bound of the frustum
 * @param {number} top Top bound of the frustum
 * @param {number} near Near bound of the frustum
 * @param {number} far Far bound of the frustum
 * @returns {mat4} out
 */


function orthoNO(out, left, right, bottom, top, near, far) {
  var lr = 1 / (left - right);
  var bt = 1 / (bottom - top);
  var nf = 1 / (near - far);
  out[0] = -2 * lr;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = -2 * bt;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = 2 * nf;
  out[11] = 0;
  out[12] = (left + right) * lr;
  out[13] = (top + bottom) * bt;
  out[14] = (far + near) * nf;
  out[15] = 1;
  return out;
}
/**
 * Alias for {@link mat4.orthoNO}
 * @function
 */


var ortho = orthoNO;
/**
 * Generates a orthogonal projection matrix with the given bounds.
 * The near/far clip planes correspond to a normalized device coordinate Z range of [0, 1],
 * which matches WebGPU/Vulkan/DirectX/Metal's clip volume.
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {number} left Left bound of the frustum
 * @param {number} right Right bound of the frustum
 * @param {number} bottom Bottom bound of the frustum
 * @param {number} top Top bound of the frustum
 * @param {number} near Near bound of the frustum
 * @param {number} far Far bound of the frustum
 * @returns {mat4} out
 */

function orthoZO(out, left, right, bottom, top, near, far) {
  var lr = 1 / (left - right);
  var bt = 1 / (bottom - top);
  var nf = 1 / (near - far);
  out[0] = -2 * lr;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = -2 * bt;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = nf;
  out[11] = 0;
  out[12] = (left + right) * lr;
  out[13] = (top + bottom) * bt;
  out[14] = near * nf;
  out[15] = 1;
  return out;
}
/**
 * Generates a look-at matrix with the given eye position, focal point, and up axis.
 * If you want a matrix that actually makes an object look at another object, you should use targetTo instead.
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {ReadonlyVec3} eye Position of the viewer
 * @param {ReadonlyVec3} center Point the viewer is looking at
 * @param {ReadonlyVec3} up vec3 pointing up
 * @returns {mat4} out
 */


function lookAt(out, eye, center, up) {
  var x0, x1, x2, y0, y1, y2, z0, z1, z2, len;
  var eyex = eye[0];
  var eyey = eye[1];
  var eyez = eye[2];
  var upx = up[0];
  var upy = up[1];
  var upz = up[2];
  var centerx = center[0];
  var centery = center[1];
  var centerz = center[2];

  if (Math.abs(eyex - centerx) < EPSILON$1 && Math.abs(eyey - centery) < EPSILON$1 && Math.abs(eyez - centerz) < EPSILON$1) {
    return identity$2(out);
  }

  z0 = eyex - centerx;
  z1 = eyey - centery;
  z2 = eyez - centerz;
  len = 1 / Math.hypot(z0, z1, z2);
  z0 *= len;
  z1 *= len;
  z2 *= len;
  x0 = upy * z2 - upz * z1;
  x1 = upz * z0 - upx * z2;
  x2 = upx * z1 - upy * z0;
  len = Math.hypot(x0, x1, x2);

  if (!len) {
    x0 = 0;
    x1 = 0;
    x2 = 0;
  } else {
    len = 1 / len;
    x0 *= len;
    x1 *= len;
    x2 *= len;
  }

  y0 = z1 * x2 - z2 * x1;
  y1 = z2 * x0 - z0 * x2;
  y2 = z0 * x1 - z1 * x0;
  len = Math.hypot(y0, y1, y2);

  if (!len) {
    y0 = 0;
    y1 = 0;
    y2 = 0;
  } else {
    len = 1 / len;
    y0 *= len;
    y1 *= len;
    y2 *= len;
  }

  out[0] = x0;
  out[1] = y0;
  out[2] = z0;
  out[3] = 0;
  out[4] = x1;
  out[5] = y1;
  out[6] = z1;
  out[7] = 0;
  out[8] = x2;
  out[9] = y2;
  out[10] = z2;
  out[11] = 0;
  out[12] = -(x0 * eyex + x1 * eyey + x2 * eyez);
  out[13] = -(y0 * eyex + y1 * eyey + y2 * eyez);
  out[14] = -(z0 * eyex + z1 * eyey + z2 * eyez);
  out[15] = 1;
  return out;
}
/**
 * Generates a matrix that makes something look at something else.
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {ReadonlyVec3} eye Position of the viewer
 * @param {ReadonlyVec3} center Point the viewer is looking at
 * @param {ReadonlyVec3} up vec3 pointing up
 * @returns {mat4} out
 */


function targetTo(out, eye, target, up) {
  var eyex = eye[0],
      eyey = eye[1],
      eyez = eye[2],
      upx = up[0],
      upy = up[1],
      upz = up[2];
  var z0 = eyex - target[0],
      z1 = eyey - target[1],
      z2 = eyez - target[2];
  var len = z0 * z0 + z1 * z1 + z2 * z2;

  if (len > 0) {
    len = 1 / Math.sqrt(len);
    z0 *= len;
    z1 *= len;
    z2 *= len;
  }

  var x0 = upy * z2 - upz * z1,
      x1 = upz * z0 - upx * z2,
      x2 = upx * z1 - upy * z0;
  len = x0 * x0 + x1 * x1 + x2 * x2;

  if (len > 0) {
    len = 1 / Math.sqrt(len);
    x0 *= len;
    x1 *= len;
    x2 *= len;
  }

  out[0] = x0;
  out[1] = x1;
  out[2] = x2;
  out[3] = 0;
  out[4] = z1 * x2 - z2 * x1;
  out[5] = z2 * x0 - z0 * x2;
  out[6] = z0 * x1 - z1 * x0;
  out[7] = 0;
  out[8] = z0;
  out[9] = z1;
  out[10] = z2;
  out[11] = 0;
  out[12] = eyex;
  out[13] = eyey;
  out[14] = eyez;
  out[15] = 1;
  return out;
}
/**
 * Returns a string representation of a mat4
 *
 * @param {ReadonlyMat4} a matrix to represent as a string
 * @returns {String} string representation of the matrix
 */


function str$5(a) {
  return "mat4(" + a[0] + ", " + a[1] + ", " + a[2] + ", " + a[3] + ", " + a[4] + ", " + a[5] + ", " + a[6] + ", " + a[7] + ", " + a[8] + ", " + a[9] + ", " + a[10] + ", " + a[11] + ", " + a[12] + ", " + a[13] + ", " + a[14] + ", " + a[15] + ")";
}
/**
 * Returns Frobenius norm of a mat4
 *
 * @param {ReadonlyMat4} a the matrix to calculate Frobenius norm of
 * @returns {Number} Frobenius norm
 */


function frob(a) {
  return Math.hypot(a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7], a[8], a[9], a[10], a[11], a[12], a[13], a[14], a[15]);
}
/**
 * Adds two mat4's
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the first operand
 * @param {ReadonlyMat4} b the second operand
 * @returns {mat4} out
 */


function add$5(out, a, b) {
  out[0] = a[0] + b[0];
  out[1] = a[1] + b[1];
  out[2] = a[2] + b[2];
  out[3] = a[3] + b[3];
  out[4] = a[4] + b[4];
  out[5] = a[5] + b[5];
  out[6] = a[6] + b[6];
  out[7] = a[7] + b[7];
  out[8] = a[8] + b[8];
  out[9] = a[9] + b[9];
  out[10] = a[10] + b[10];
  out[11] = a[11] + b[11];
  out[12] = a[12] + b[12];
  out[13] = a[13] + b[13];
  out[14] = a[14] + b[14];
  out[15] = a[15] + b[15];
  return out;
}
/**
 * Subtracts matrix b from matrix a
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the first operand
 * @param {ReadonlyMat4} b the second operand
 * @returns {mat4} out
 */


function subtract$3(out, a, b) {
  out[0] = a[0] - b[0];
  out[1] = a[1] - b[1];
  out[2] = a[2] - b[2];
  out[3] = a[3] - b[3];
  out[4] = a[4] - b[4];
  out[5] = a[5] - b[5];
  out[6] = a[6] - b[6];
  out[7] = a[7] - b[7];
  out[8] = a[8] - b[8];
  out[9] = a[9] - b[9];
  out[10] = a[10] - b[10];
  out[11] = a[11] - b[11];
  out[12] = a[12] - b[12];
  out[13] = a[13] - b[13];
  out[14] = a[14] - b[14];
  out[15] = a[15] - b[15];
  return out;
}
/**
 * Multiply each element of the matrix by a scalar.
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the matrix to scale
 * @param {Number} b amount to scale the matrix's elements by
 * @returns {mat4} out
 */


function multiplyScalar(out, a, b) {
  out[0] = a[0] * b;
  out[1] = a[1] * b;
  out[2] = a[2] * b;
  out[3] = a[3] * b;
  out[4] = a[4] * b;
  out[5] = a[5] * b;
  out[6] = a[6] * b;
  out[7] = a[7] * b;
  out[8] = a[8] * b;
  out[9] = a[9] * b;
  out[10] = a[10] * b;
  out[11] = a[11] * b;
  out[12] = a[12] * b;
  out[13] = a[13] * b;
  out[14] = a[14] * b;
  out[15] = a[15] * b;
  return out;
}
/**
 * Adds two mat4's after multiplying each element of the second operand by a scalar value.
 *
 * @param {mat4} out the receiving vector
 * @param {ReadonlyMat4} a the first operand
 * @param {ReadonlyMat4} b the second operand
 * @param {Number} scale the amount to scale b's elements by before adding
 * @returns {mat4} out
 */


function multiplyScalarAndAdd(out, a, b, scale) {
  out[0] = a[0] + b[0] * scale;
  out[1] = a[1] + b[1] * scale;
  out[2] = a[2] + b[2] * scale;
  out[3] = a[3] + b[3] * scale;
  out[4] = a[4] + b[4] * scale;
  out[5] = a[5] + b[5] * scale;
  out[6] = a[6] + b[6] * scale;
  out[7] = a[7] + b[7] * scale;
  out[8] = a[8] + b[8] * scale;
  out[9] = a[9] + b[9] * scale;
  out[10] = a[10] + b[10] * scale;
  out[11] = a[11] + b[11] * scale;
  out[12] = a[12] + b[12] * scale;
  out[13] = a[13] + b[13] * scale;
  out[14] = a[14] + b[14] * scale;
  out[15] = a[15] + b[15] * scale;
  return out;
}
/**
 * Returns whether or not the matrices have exactly the same elements in the same position (when compared with ===)
 *
 * @param {ReadonlyMat4} a The first matrix.
 * @param {ReadonlyMat4} b The second matrix.
 * @returns {Boolean} True if the matrices are equal, false otherwise.
 */


function exactEquals$5(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3] && a[4] === b[4] && a[5] === b[5] && a[6] === b[6] && a[7] === b[7] && a[8] === b[8] && a[9] === b[9] && a[10] === b[10] && a[11] === b[11] && a[12] === b[12] && a[13] === b[13] && a[14] === b[14] && a[15] === b[15];
}
/**
 * Returns whether or not the matrices have approximately the same elements in the same position.
 *
 * @param {ReadonlyMat4} a The first matrix.
 * @param {ReadonlyMat4} b The second matrix.
 * @returns {Boolean} True if the matrices are equal, false otherwise.
 */


function equals$5(a, b) {
  var a0 = a[0],
      a1 = a[1],
      a2 = a[2],
      a3 = a[3];
  var a4 = a[4],
      a5 = a[5],
      a6 = a[6],
      a7 = a[7];
  var a8 = a[8],
      a9 = a[9],
      a10 = a[10],
      a11 = a[11];
  var a12 = a[12],
      a13 = a[13],
      a14 = a[14],
      a15 = a[15];
  var b0 = b[0],
      b1 = b[1],
      b2 = b[2],
      b3 = b[3];
  var b4 = b[4],
      b5 = b[5],
      b6 = b[6],
      b7 = b[7];
  var b8 = b[8],
      b9 = b[9],
      b10 = b[10],
      b11 = b[11];
  var b12 = b[12],
      b13 = b[13],
      b14 = b[14],
      b15 = b[15];
  return Math.abs(a0 - b0) <= EPSILON$1 * Math.max(1.0, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= EPSILON$1 * Math.max(1.0, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= EPSILON$1 * Math.max(1.0, Math.abs(a2), Math.abs(b2)) && Math.abs(a3 - b3) <= EPSILON$1 * Math.max(1.0, Math.abs(a3), Math.abs(b3)) && Math.abs(a4 - b4) <= EPSILON$1 * Math.max(1.0, Math.abs(a4), Math.abs(b4)) && Math.abs(a5 - b5) <= EPSILON$1 * Math.max(1.0, Math.abs(a5), Math.abs(b5)) && Math.abs(a6 - b6) <= EPSILON$1 * Math.max(1.0, Math.abs(a6), Math.abs(b6)) && Math.abs(a7 - b7) <= EPSILON$1 * Math.max(1.0, Math.abs(a7), Math.abs(b7)) && Math.abs(a8 - b8) <= EPSILON$1 * Math.max(1.0, Math.abs(a8), Math.abs(b8)) && Math.abs(a9 - b9) <= EPSILON$1 * Math.max(1.0, Math.abs(a9), Math.abs(b9)) && Math.abs(a10 - b10) <= EPSILON$1 * Math.max(1.0, Math.abs(a10), Math.abs(b10)) && Math.abs(a11 - b11) <= EPSILON$1 * Math.max(1.0, Math.abs(a11), Math.abs(b11)) && Math.abs(a12 - b12) <= EPSILON$1 * Math.max(1.0, Math.abs(a12), Math.abs(b12)) && Math.abs(a13 - b13) <= EPSILON$1 * Math.max(1.0, Math.abs(a13), Math.abs(b13)) && Math.abs(a14 - b14) <= EPSILON$1 * Math.max(1.0, Math.abs(a14), Math.abs(b14)) && Math.abs(a15 - b15) <= EPSILON$1 * Math.max(1.0, Math.abs(a15), Math.abs(b15));
}
/**
 * Alias for {@link mat4.multiply}
 * @function
 */


var mul$5 = multiply$5;
/**
 * Alias for {@link mat4.subtract}
 * @function
 */

var sub$3 = subtract$3;
var mat4 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  create: create$5,
  clone: clone$5,
  copy: copy$5,
  fromValues: fromValues$5,
  set: set$5,
  identity: identity$2,
  transpose: transpose,
  invert: invert$2,
  adjoint: adjoint,
  determinant: determinant,
  multiply: multiply$5,
  translate: translate$1,
  scale: scale$5,
  rotate: rotate$1,
  rotateX: rotateX$3,
  rotateY: rotateY$3,
  rotateZ: rotateZ$3,
  fromTranslation: fromTranslation$1,
  fromScaling: fromScaling,
  fromRotation: fromRotation$1,
  fromXRotation: fromXRotation,
  fromYRotation: fromYRotation,
  fromZRotation: fromZRotation,
  fromRotationTranslation: fromRotationTranslation$1,
  fromQuat2: fromQuat2,
  getTranslation: getTranslation$1,
  getScaling: getScaling,
  getRotation: getRotation,
  fromRotationTranslationScale: fromRotationTranslationScale,
  fromRotationTranslationScaleOrigin: fromRotationTranslationScaleOrigin,
  fromQuat: fromQuat,
  frustum: frustum,
  perspectiveNO: perspectiveNO,
  perspective: perspective,
  perspectiveZO: perspectiveZO,
  perspectiveFromFieldOfView: perspectiveFromFieldOfView,
  orthoNO: orthoNO,
  ortho: ortho,
  orthoZO: orthoZO,
  lookAt: lookAt,
  targetTo: targetTo,
  str: str$5,
  frob: frob,
  add: add$5,
  subtract: subtract$3,
  multiplyScalar: multiplyScalar,
  multiplyScalarAndAdd: multiplyScalarAndAdd,
  exactEquals: exactEquals$5,
  equals: equals$5,
  mul: mul$5,
  sub: sub$3
});
/**
 * 3 Dimensional Vector
 * @module vec3
 */

/**
 * Creates a new, empty vec3
 *
 * @returns {vec3} a new 3D vector
 */

function create$4$1() {
  var out = new ARRAY_TYPE$1(3);

  if (ARRAY_TYPE$1 != Float32Array) {
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
  }

  return out;
}
/**
 * Creates a new vec3 initialized with values from an existing vector
 *
 * @param {ReadonlyVec3} a vector to clone
 * @returns {vec3} a new 3D vector
 */


function clone$4(a) {
  var out = new ARRAY_TYPE$1(3);
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  return out;
}
/**
 * Calculates the length of a vec3
 *
 * @param {ReadonlyVec3} a vector to calculate length of
 * @returns {Number} length of a
 */


function length$4$1(a) {
  var x = a[0];
  var y = a[1];
  var z = a[2];
  return Math.hypot(x, y, z);
}
/**
 * Creates a new vec3 initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @returns {vec3} a new 3D vector
 */


function fromValues$4$1(x, y, z) {
  var out = new ARRAY_TYPE$1(3);
  out[0] = x;
  out[1] = y;
  out[2] = z;
  return out;
}
/**
 * Copy the values from one vec3 to another
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the source vector
 * @returns {vec3} out
 */


function copy$4(out, a) {
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  return out;
}
/**
 * Set the components of a vec3 to the given values
 *
 * @param {vec3} out the receiving vector
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @returns {vec3} out
 */


function set$4(out, x, y, z) {
  out[0] = x;
  out[1] = y;
  out[2] = z;
  return out;
}
/**
 * Adds two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {vec3} out
 */


function add$4(out, a, b) {
  out[0] = a[0] + b[0];
  out[1] = a[1] + b[1];
  out[2] = a[2] + b[2];
  return out;
}
/**
 * Subtracts vector b from vector a
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {vec3} out
 */


function subtract$2(out, a, b) {
  out[0] = a[0] - b[0];
  out[1] = a[1] - b[1];
  out[2] = a[2] - b[2];
  return out;
}
/**
 * Multiplies two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {vec3} out
 */


function multiply$4(out, a, b) {
  out[0] = a[0] * b[0];
  out[1] = a[1] * b[1];
  out[2] = a[2] * b[2];
  return out;
}
/**
 * Divides two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {vec3} out
 */


function divide$2(out, a, b) {
  out[0] = a[0] / b[0];
  out[1] = a[1] / b[1];
  out[2] = a[2] / b[2];
  return out;
}
/**
 * Math.ceil the components of a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a vector to ceil
 * @returns {vec3} out
 */


function ceil$2(out, a) {
  out[0] = Math.ceil(a[0]);
  out[1] = Math.ceil(a[1]);
  out[2] = Math.ceil(a[2]);
  return out;
}
/**
 * Math.floor the components of a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a vector to floor
 * @returns {vec3} out
 */


function floor$2(out, a) {
  out[0] = Math.floor(a[0]);
  out[1] = Math.floor(a[1]);
  out[2] = Math.floor(a[2]);
  return out;
}
/**
 * Returns the minimum of two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {vec3} out
 */


function min$2(out, a, b) {
  out[0] = Math.min(a[0], b[0]);
  out[1] = Math.min(a[1], b[1]);
  out[2] = Math.min(a[2], b[2]);
  return out;
}
/**
 * Returns the maximum of two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {vec3} out
 */


function max$2(out, a, b) {
  out[0] = Math.max(a[0], b[0]);
  out[1] = Math.max(a[1], b[1]);
  out[2] = Math.max(a[2], b[2]);
  return out;
}
/**
 * Math.round the components of a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a vector to round
 * @returns {vec3} out
 */


function round$2(out, a) {
  out[0] = Math.round(a[0]);
  out[1] = Math.round(a[1]);
  out[2] = Math.round(a[2]);
  return out;
}
/**
 * Scales a vec3 by a scalar number
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the vector to scale
 * @param {Number} b amount to scale the vector by
 * @returns {vec3} out
 */


function scale$4(out, a, b) {
  out[0] = a[0] * b;
  out[1] = a[1] * b;
  out[2] = a[2] * b;
  return out;
}
/**
 * Adds two vec3's after scaling the second operand by a scalar value
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @param {Number} scale the amount to scale b by before adding
 * @returns {vec3} out
 */


function scaleAndAdd$2(out, a, b, scale) {
  out[0] = a[0] + b[0] * scale;
  out[1] = a[1] + b[1] * scale;
  out[2] = a[2] + b[2] * scale;
  return out;
}
/**
 * Calculates the euclidian distance between two vec3's
 *
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {Number} distance between a and b
 */


function distance$2(a, b) {
  var x = b[0] - a[0];
  var y = b[1] - a[1];
  var z = b[2] - a[2];
  return Math.hypot(x, y, z);
}
/**
 * Calculates the squared euclidian distance between two vec3's
 *
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {Number} squared distance between a and b
 */


function squaredDistance$2(a, b) {
  var x = b[0] - a[0];
  var y = b[1] - a[1];
  var z = b[2] - a[2];
  return x * x + y * y + z * z;
}
/**
 * Calculates the squared length of a vec3
 *
 * @param {ReadonlyVec3} a vector to calculate squared length of
 * @returns {Number} squared length of a
 */


function squaredLength$4(a) {
  var x = a[0];
  var y = a[1];
  var z = a[2];
  return x * x + y * y + z * z;
}
/**
 * Negates the components of a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a vector to negate
 * @returns {vec3} out
 */


function negate$2(out, a) {
  out[0] = -a[0];
  out[1] = -a[1];
  out[2] = -a[2];
  return out;
}
/**
 * Returns the inverse of the components of a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a vector to invert
 * @returns {vec3} out
 */


function inverse$2(out, a) {
  out[0] = 1.0 / a[0];
  out[1] = 1.0 / a[1];
  out[2] = 1.0 / a[2];
  return out;
}
/**
 * Normalize a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a vector to normalize
 * @returns {vec3} out
 */


function normalize$4$1(out, a) {
  var x = a[0];
  var y = a[1];
  var z = a[2];
  var len = x * x + y * y + z * z;

  if (len > 0) {
    //TODO: evaluate use of glm_invsqrt here?
    len = 1 / Math.sqrt(len);
  }

  out[0] = a[0] * len;
  out[1] = a[1] * len;
  out[2] = a[2] * len;
  return out;
}
/**
 * Calculates the dot product of two vec3's
 *
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {Number} dot product of a and b
 */


function dot$4$1(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}
/**
 * Computes the cross product of two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {vec3} out
 */


function cross$2$1(out, a, b) {
  var ax = a[0],
      ay = a[1],
      az = a[2];
  var bx = b[0],
      by = b[1],
      bz = b[2];
  out[0] = ay * bz - az * by;
  out[1] = az * bx - ax * bz;
  out[2] = ax * by - ay * bx;
  return out;
}
/**
 * Performs a linear interpolation between two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
 * @returns {vec3} out
 */


function lerp$4(out, a, b, t) {
  var ax = a[0];
  var ay = a[1];
  var az = a[2];
  out[0] = ax + t * (b[0] - ax);
  out[1] = ay + t * (b[1] - ay);
  out[2] = az + t * (b[2] - az);
  return out;
}
/**
 * Performs a hermite interpolation with two control points
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @param {ReadonlyVec3} c the third operand
 * @param {ReadonlyVec3} d the fourth operand
 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
 * @returns {vec3} out
 */


function hermite(out, a, b, c, d, t) {
  var factorTimes2 = t * t;
  var factor1 = factorTimes2 * (2 * t - 3) + 1;
  var factor2 = factorTimes2 * (t - 2) + t;
  var factor3 = factorTimes2 * (t - 1);
  var factor4 = factorTimes2 * (3 - 2 * t);
  out[0] = a[0] * factor1 + b[0] * factor2 + c[0] * factor3 + d[0] * factor4;
  out[1] = a[1] * factor1 + b[1] * factor2 + c[1] * factor3 + d[1] * factor4;
  out[2] = a[2] * factor1 + b[2] * factor2 + c[2] * factor3 + d[2] * factor4;
  return out;
}
/**
 * Performs a bezier interpolation with two control points
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @param {ReadonlyVec3} c the third operand
 * @param {ReadonlyVec3} d the fourth operand
 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
 * @returns {vec3} out
 */


function bezier(out, a, b, c, d, t) {
  var inverseFactor = 1 - t;
  var inverseFactorTimesTwo = inverseFactor * inverseFactor;
  var factorTimes2 = t * t;
  var factor1 = inverseFactorTimesTwo * inverseFactor;
  var factor2 = 3 * t * inverseFactorTimesTwo;
  var factor3 = 3 * factorTimes2 * inverseFactor;
  var factor4 = factorTimes2 * t;
  out[0] = a[0] * factor1 + b[0] * factor2 + c[0] * factor3 + d[0] * factor4;
  out[1] = a[1] * factor1 + b[1] * factor2 + c[1] * factor3 + d[1] * factor4;
  out[2] = a[2] * factor1 + b[2] * factor2 + c[2] * factor3 + d[2] * factor4;
  return out;
}
/**
 * Generates a random vector with the given scale
 *
 * @param {vec3} out the receiving vector
 * @param {Number} [scale] Length of the resulting vector. If ommitted, a unit vector will be returned
 * @returns {vec3} out
 */


function random$3(out, scale) {
  scale = scale || 1.0;
  var r = RANDOM() * 2.0 * Math.PI;
  var z = RANDOM() * 2.0 - 1.0;
  var zScale = Math.sqrt(1.0 - z * z) * scale;
  out[0] = Math.cos(r) * zScale;
  out[1] = Math.sin(r) * zScale;
  out[2] = z * scale;
  return out;
}
/**
 * Transforms the vec3 with a mat4.
 * 4th vector component is implicitly '1'
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the vector to transform
 * @param {ReadonlyMat4} m matrix to transform with
 * @returns {vec3} out
 */


function transformMat4$2(out, a, m) {
  var x = a[0],
      y = a[1],
      z = a[2];
  var w = m[3] * x + m[7] * y + m[11] * z + m[15];
  w = w || 1.0;
  out[0] = (m[0] * x + m[4] * y + m[8] * z + m[12]) / w;
  out[1] = (m[1] * x + m[5] * y + m[9] * z + m[13]) / w;
  out[2] = (m[2] * x + m[6] * y + m[10] * z + m[14]) / w;
  return out;
}
/**
 * Transforms the vec3 with a mat3.
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the vector to transform
 * @param {ReadonlyMat3} m the 3x3 matrix to transform with
 * @returns {vec3} out
 */


function transformMat3$1(out, a, m) {
  var x = a[0],
      y = a[1],
      z = a[2];
  out[0] = x * m[0] + y * m[3] + z * m[6];
  out[1] = x * m[1] + y * m[4] + z * m[7];
  out[2] = x * m[2] + y * m[5] + z * m[8];
  return out;
}
/**
 * Transforms the vec3 with a quat
 * Can also be used for dual quaternions. (Multiply it with the real part)
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the vector to transform
 * @param {ReadonlyQuat} q quaternion to transform with
 * @returns {vec3} out
 */


function transformQuat$1(out, a, q) {
  // benchmarks: https://jsperf.com/quaternion-transform-vec3-implementations-fixed
  var qx = q[0],
      qy = q[1],
      qz = q[2],
      qw = q[3];
  var x = a[0],
      y = a[1],
      z = a[2]; // var qvec = [qx, qy, qz];
  // var uv = vec3.cross([], qvec, a);

  var uvx = qy * z - qz * y,
      uvy = qz * x - qx * z,
      uvz = qx * y - qy * x; // var uuv = vec3.cross([], qvec, uv);

  var uuvx = qy * uvz - qz * uvy,
      uuvy = qz * uvx - qx * uvz,
      uuvz = qx * uvy - qy * uvx; // vec3.scale(uv, uv, 2 * w);

  var w2 = qw * 2;
  uvx *= w2;
  uvy *= w2;
  uvz *= w2; // vec3.scale(uuv, uuv, 2);

  uuvx *= 2;
  uuvy *= 2;
  uuvz *= 2; // return vec3.add(out, a, vec3.add(out, uv, uuv));

  out[0] = x + uvx + uuvx;
  out[1] = y + uvy + uuvy;
  out[2] = z + uvz + uuvz;
  return out;
}
/**
 * Rotate a 3D vector around the x-axis
 * @param {vec3} out The receiving vec3
 * @param {ReadonlyVec3} a The vec3 point to rotate
 * @param {ReadonlyVec3} b The origin of the rotation
 * @param {Number} rad The angle of rotation in radians
 * @returns {vec3} out
 */


function rotateX$2(out, a, b, rad) {
  var p = [],
      r = []; //Translate point to the origin

  p[0] = a[0] - b[0];
  p[1] = a[1] - b[1];
  p[2] = a[2] - b[2]; //perform rotation

  r[0] = p[0];
  r[1] = p[1] * Math.cos(rad) - p[2] * Math.sin(rad);
  r[2] = p[1] * Math.sin(rad) + p[2] * Math.cos(rad); //translate to correct position

  out[0] = r[0] + b[0];
  out[1] = r[1] + b[1];
  out[2] = r[2] + b[2];
  return out;
}
/**
 * Rotate a 3D vector around the y-axis
 * @param {vec3} out The receiving vec3
 * @param {ReadonlyVec3} a The vec3 point to rotate
 * @param {ReadonlyVec3} b The origin of the rotation
 * @param {Number} rad The angle of rotation in radians
 * @returns {vec3} out
 */


function rotateY$2(out, a, b, rad) {
  var p = [],
      r = []; //Translate point to the origin

  p[0] = a[0] - b[0];
  p[1] = a[1] - b[1];
  p[2] = a[2] - b[2]; //perform rotation

  r[0] = p[2] * Math.sin(rad) + p[0] * Math.cos(rad);
  r[1] = p[1];
  r[2] = p[2] * Math.cos(rad) - p[0] * Math.sin(rad); //translate to correct position

  out[0] = r[0] + b[0];
  out[1] = r[1] + b[1];
  out[2] = r[2] + b[2];
  return out;
}
/**
 * Rotate a 3D vector around the z-axis
 * @param {vec3} out The receiving vec3
 * @param {ReadonlyVec3} a The vec3 point to rotate
 * @param {ReadonlyVec3} b The origin of the rotation
 * @param {Number} rad The angle of rotation in radians
 * @returns {vec3} out
 */


function rotateZ$2(out, a, b, rad) {
  var p = [],
      r = []; //Translate point to the origin

  p[0] = a[0] - b[0];
  p[1] = a[1] - b[1];
  p[2] = a[2] - b[2]; //perform rotation

  r[0] = p[0] * Math.cos(rad) - p[1] * Math.sin(rad);
  r[1] = p[0] * Math.sin(rad) + p[1] * Math.cos(rad);
  r[2] = p[2]; //translate to correct position

  out[0] = r[0] + b[0];
  out[1] = r[1] + b[1];
  out[2] = r[2] + b[2];
  return out;
}
/**
 * Get the angle between two 3D vectors
 * @param {ReadonlyVec3} a The first operand
 * @param {ReadonlyVec3} b The second operand
 * @returns {Number} The angle in radians
 */


function angle$1(a, b) {
  var ax = a[0],
      ay = a[1],
      az = a[2],
      bx = b[0],
      by = b[1],
      bz = b[2],
      mag1 = Math.sqrt(ax * ax + ay * ay + az * az),
      mag2 = Math.sqrt(bx * bx + by * by + bz * bz),
      mag = mag1 * mag2,
      cosine = mag && dot$4$1(a, b) / mag;
  return Math.acos(Math.min(Math.max(cosine, -1), 1));
}
/**
 * Set the components of a vec3 to zero
 *
 * @param {vec3} out the receiving vector
 * @returns {vec3} out
 */


function zero$2(out) {
  out[0] = 0.0;
  out[1] = 0.0;
  out[2] = 0.0;
  return out;
}
/**
 * Returns a string representation of a vector
 *
 * @param {ReadonlyVec3} a vector to represent as a string
 * @returns {String} string representation of the vector
 */


function str$4(a) {
  return "vec3(" + a[0] + ", " + a[1] + ", " + a[2] + ")";
}
/**
 * Returns whether or not the vectors have exactly the same elements in the same position (when compared with ===)
 *
 * @param {ReadonlyVec3} a The first vector.
 * @param {ReadonlyVec3} b The second vector.
 * @returns {Boolean} True if the vectors are equal, false otherwise.
 */


function exactEquals$4(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}
/**
 * Returns whether or not the vectors have approximately the same elements in the same position.
 *
 * @param {ReadonlyVec3} a The first vector.
 * @param {ReadonlyVec3} b The second vector.
 * @returns {Boolean} True if the vectors are equal, false otherwise.
 */


function equals$4(a, b) {
  var a0 = a[0],
      a1 = a[1],
      a2 = a[2];
  var b0 = b[0],
      b1 = b[1],
      b2 = b[2];
  return Math.abs(a0 - b0) <= EPSILON$1 * Math.max(1.0, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= EPSILON$1 * Math.max(1.0, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= EPSILON$1 * Math.max(1.0, Math.abs(a2), Math.abs(b2));
}
/**
 * Alias for {@link vec3.subtract}
 * @function
 */


var sub$2 = subtract$2;
/**
 * Alias for {@link vec3.multiply}
 * @function
 */

var mul$4 = multiply$4;
/**
 * Alias for {@link vec3.divide}
 * @function
 */

var div$2 = divide$2;
/**
 * Alias for {@link vec3.distance}
 * @function
 */

var dist$2 = distance$2;
/**
 * Alias for {@link vec3.squaredDistance}
 * @function
 */

var sqrDist$2 = squaredDistance$2;
/**
 * Alias for {@link vec3.length}
 * @function
 */

var len$4$1 = length$4$1;
/**
 * Alias for {@link vec3.squaredLength}
 * @function
 */

var sqrLen$4 = squaredLength$4;
/**
 * Perform some operation over an array of vec3s.
 *
 * @param {Array} a the array of vectors to iterate over
 * @param {Number} stride Number of elements between the start of each vec3. If 0 assumes tightly packed
 * @param {Number} offset Number of elements to skip at the beginning of the array
 * @param {Number} count Number of vec3s to iterate over. If 0 iterates over entire array
 * @param {Function} fn Function to call for each vector in the array
 * @param {Object} [arg] additional argument to pass to fn
 * @returns {Array} a
 * @function
 */

var forEach$2 = function () {
  var vec = create$4$1();
  return function (a, stride, offset, count, fn, arg) {
    var i, l;

    if (!stride) {
      stride = 3;
    }

    if (!offset) {
      offset = 0;
    }

    if (count) {
      l = Math.min(count * stride + offset, a.length);
    } else {
      l = a.length;
    }

    for (i = offset; i < l; i += stride) {
      vec[0] = a[i];
      vec[1] = a[i + 1];
      vec[2] = a[i + 2];
      fn(vec, vec, arg);
      a[i] = vec[0];
      a[i + 1] = vec[1];
      a[i + 2] = vec[2];
    }

    return a;
  };
}();

var vec3 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  create: create$4$1,
  clone: clone$4,
  length: length$4$1,
  fromValues: fromValues$4$1,
  copy: copy$4,
  set: set$4,
  add: add$4,
  subtract: subtract$2,
  multiply: multiply$4,
  divide: divide$2,
  ceil: ceil$2,
  floor: floor$2,
  min: min$2,
  max: max$2,
  round: round$2,
  scale: scale$4,
  scaleAndAdd: scaleAndAdd$2,
  distance: distance$2,
  squaredDistance: squaredDistance$2,
  squaredLength: squaredLength$4,
  negate: negate$2,
  inverse: inverse$2,
  normalize: normalize$4$1,
  dot: dot$4$1,
  cross: cross$2$1,
  lerp: lerp$4,
  hermite: hermite,
  bezier: bezier,
  random: random$3,
  transformMat4: transformMat4$2,
  transformMat3: transformMat3$1,
  transformQuat: transformQuat$1,
  rotateX: rotateX$2,
  rotateY: rotateY$2,
  rotateZ: rotateZ$2,
  angle: angle$1,
  zero: zero$2,
  str: str$4,
  exactEquals: exactEquals$4,
  equals: equals$4,
  sub: sub$2,
  mul: mul$4,
  div: div$2,
  dist: dist$2,
  sqrDist: sqrDist$2,
  len: len$4$1,
  sqrLen: sqrLen$4,
  forEach: forEach$2
});
/**
 * 4 Dimensional Vector
 * @module vec4
 */

/**
 * Creates a new, empty vec4
 *
 * @returns {vec4} a new 4D vector
 */

function create$3$1() {
  var out = new ARRAY_TYPE$1(4);

  if (ARRAY_TYPE$1 != Float32Array) {
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
  }

  return out;
}
/**
 * Normalize a vec4
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a vector to normalize
 * @returns {vec4} out
 */


function normalize$3$1(out, a) {
  var x = a[0];
  var y = a[1];
  var z = a[2];
  var w = a[3];
  var len = x * x + y * y + z * z + w * w;

  if (len > 0) {
    len = 1 / Math.sqrt(len);
  }

  out[0] = x * len;
  out[1] = y * len;
  out[2] = z * len;
  out[3] = w * len;
  return out;
}
/**
 * Perform some operation over an array of vec4s.
 *
 * @param {Array} a the array of vectors to iterate over
 * @param {Number} stride Number of elements between the start of each vec4. If 0 assumes tightly packed
 * @param {Number} offset Number of elements to skip at the beginning of the array
 * @param {Number} count Number of vec4s to iterate over. If 0 iterates over entire array
 * @param {Function} fn Function to call for each vector in the array
 * @param {Object} [arg] additional argument to pass to fn
 * @returns {Array} a
 * @function
 */

(function () {
  var vec = create$3$1();
  return function (a, stride, offset, count, fn, arg) {
    var i, l;

    if (!stride) {
      stride = 4;
    }

    if (!offset) {
      offset = 0;
    }

    if (count) {
      l = Math.min(count * stride + offset, a.length);
    } else {
      l = a.length;
    }

    for (i = offset; i < l; i += stride) {
      vec[0] = a[i];
      vec[1] = a[i + 1];
      vec[2] = a[i + 2];
      vec[3] = a[i + 3];
      fn(vec, vec, arg);
      a[i] = vec[0];
      a[i + 1] = vec[1];
      a[i + 2] = vec[2];
      a[i + 3] = vec[3];
    }

    return a;
  };
})();
/**
 * Quaternion
 * @module quat
 */

/**
 * Creates a new identity quat
 *
 * @returns {quat} a new quaternion
 */

function create$2$1() {
  var out = new ARRAY_TYPE$1(4);

  if (ARRAY_TYPE$1 != Float32Array) {
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
  }

  out[3] = 1;
  return out;
}
/**
 * Sets a quat from the given angle and rotation axis,
 * then returns it.
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyVec3} axis the axis around which to rotate
 * @param {Number} rad the angle in radians
 * @returns {quat} out
 **/


function setAxisAngle$1(out, axis, rad) {
  rad = rad * 0.5;
  var s = Math.sin(rad);
  out[0] = s * axis[0];
  out[1] = s * axis[1];
  out[2] = s * axis[2];
  out[3] = Math.cos(rad);
  return out;
}
/**
 * Performs a spherical linear interpolation between two quat
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyQuat} a the first operand
 * @param {ReadonlyQuat} b the second operand
 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
 * @returns {quat} out
 */


function slerp$1(out, a, b, t) {
  // benchmarks:
  //    http://jsperf.com/quaternion-slerp-implementations
  var ax = a[0],
      ay = a[1],
      az = a[2],
      aw = a[3];
  var bx = b[0],
      by = b[1],
      bz = b[2],
      bw = b[3];
  var omega, cosom, sinom, scale0, scale1; // calc cosine

  cosom = ax * bx + ay * by + az * bz + aw * bw; // adjust signs (if necessary)

  if (cosom < 0.0) {
    cosom = -cosom;
    bx = -bx;
    by = -by;
    bz = -bz;
    bw = -bw;
  } // calculate coefficients


  if (1.0 - cosom > EPSILON$1) {
    // standard case (slerp)
    omega = Math.acos(cosom);
    sinom = Math.sin(omega);
    scale0 = Math.sin((1.0 - t) * omega) / sinom;
    scale1 = Math.sin(t * omega) / sinom;
  } else {
    // "from" and "to" quaternions are very close
    //  ... so we can do a linear interpolation
    scale0 = 1.0 - t;
    scale1 = t;
  } // calculate final values


  out[0] = scale0 * ax + scale1 * bx;
  out[1] = scale0 * ay + scale1 * by;
  out[2] = scale0 * az + scale1 * bz;
  out[3] = scale0 * aw + scale1 * bw;
  return out;
}
/**
 * Creates a quaternion from the given 3x3 rotation matrix.
 *
 * NOTE: The resultant quaternion is not normalized, so you should be sure
 * to renormalize the quaternion yourself where necessary.
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyMat3} m rotation matrix
 * @returns {quat} out
 * @function
 */


function fromMat3$1(out, m) {
  // Algorithm in Ken Shoemake's article in 1987 SIGGRAPH course notes
  // article "Quaternion Calculus and Fast Animation".
  var fTrace = m[0] + m[4] + m[8];
  var fRoot;

  if (fTrace > 0.0) {
    // |w| > 1/2, may as well choose w > 1/2
    fRoot = Math.sqrt(fTrace + 1.0); // 2w

    out[3] = 0.5 * fRoot;
    fRoot = 0.5 / fRoot; // 1/(4w)

    out[0] = (m[5] - m[7]) * fRoot;
    out[1] = (m[6] - m[2]) * fRoot;
    out[2] = (m[1] - m[3]) * fRoot;
  } else {
    // |w| <= 1/2
    var i = 0;
    if (m[4] > m[0]) i = 1;
    if (m[8] > m[i * 3 + i]) i = 2;
    var j = (i + 1) % 3;
    var k = (i + 2) % 3;
    fRoot = Math.sqrt(m[i * 3 + i] - m[j * 3 + j] - m[k * 3 + k] + 1.0);
    out[i] = 0.5 * fRoot;
    fRoot = 0.5 / fRoot;
    out[3] = (m[j * 3 + k] - m[k * 3 + j]) * fRoot;
    out[j] = (m[j * 3 + i] + m[i * 3 + j]) * fRoot;
    out[k] = (m[k * 3 + i] + m[i * 3 + k]) * fRoot;
  }

  return out;
}
/**
 * Normalize a quat
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyQuat} a quaternion to normalize
 * @returns {quat} out
 * @function
 */

var normalize$2$1 = normalize$3$1;
/**
 * Sets a quaternion to represent the shortest rotation from one
 * vector to another.
 *
 * Both vectors are assumed to be unit length.
 *
 * @param {quat} out the receiving quaternion.
 * @param {ReadonlyVec3} a the initial vector
 * @param {ReadonlyVec3} b the destination vector
 * @returns {quat} out
 */

(function () {
  var tmpvec3 = create$4$1();
  var xUnitVec3 = fromValues$4$1(1, 0, 0);
  var yUnitVec3 = fromValues$4$1(0, 1, 0);
  return function (out, a, b) {
    var dot = dot$4$1(a, b);

    if (dot < -0.999999) {
      cross$2$1(tmpvec3, xUnitVec3, a);
      if (len$4$1(tmpvec3) < 0.000001) cross$2$1(tmpvec3, yUnitVec3, a);
      normalize$4$1(tmpvec3, tmpvec3);
      setAxisAngle$1(out, tmpvec3, Math.PI);
      return out;
    } else if (dot > 0.999999) {
      out[0] = 0;
      out[1] = 0;
      out[2] = 0;
      out[3] = 1;
      return out;
    } else {
      cross$2$1(tmpvec3, a, b);
      out[0] = tmpvec3[0];
      out[1] = tmpvec3[1];
      out[2] = tmpvec3[2];
      out[3] = 1 + dot;
      return normalize$2$1(out, out);
    }
  };
})();
/**
 * Performs a spherical linear interpolation with two control points
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyQuat} a the first operand
 * @param {ReadonlyQuat} b the second operand
 * @param {ReadonlyQuat} c the third operand
 * @param {ReadonlyQuat} d the fourth operand
 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
 * @returns {quat} out
 */


(function () {
  var temp1 = create$2$1();
  var temp2 = create$2$1();
  return function (out, a, b, c, d, t) {
    slerp$1(temp1, a, d, t);
    slerp$1(temp2, b, c, t);
    slerp$1(out, temp1, temp2, 2 * t * (1 - t));
    return out;
  };
})();
/**
 * Sets the specified quaternion with values corresponding to the given
 * axes. Each axis is a vec3 and is expected to be unit length and
 * perpendicular to all other specified axes.
 *
 * @param {ReadonlyVec3} view  the vector representing the viewing direction
 * @param {ReadonlyVec3} right the vector representing the local "right" direction
 * @param {ReadonlyVec3} up    the vector representing the local "up" direction
 * @returns {quat} out
 */


(function () {
  var matr = create$6$1();
  return function (out, view, right, up) {
    matr[0] = right[0];
    matr[3] = right[1];
    matr[6] = right[2];
    matr[1] = up[0];
    matr[4] = up[1];
    matr[7] = up[2];
    matr[2] = -view[0];
    matr[5] = -view[1];
    matr[8] = -view[2];
    return normalize$2$1(out, fromMat3$1(out, matr));
  };
})();
/**
 * 2 Dimensional Vector
 * @module vec2
 */

/**
 * Creates a new, empty vec2
 *
 * @returns {vec2} a new 2D vector
 */

function create$1() {
  var out = new ARRAY_TYPE$1(2);

  if (ARRAY_TYPE$1 != Float32Array) {
    out[0] = 0;
    out[1] = 0;
  }

  return out;
}
/**
 * Perform some operation over an array of vec2s.
 *
 * @param {Array} a the array of vectors to iterate over
 * @param {Number} stride Number of elements between the start of each vec2. If 0 assumes tightly packed
 * @param {Number} offset Number of elements to skip at the beginning of the array
 * @param {Number} count Number of vec2s to iterate over. If 0 iterates over entire array
 * @param {Function} fn Function to call for each vector in the array
 * @param {Object} [arg] additional argument to pass to fn
 * @returns {Array} a
 * @function
 */

(function () {
  var vec = create$1();
  return function (a, stride, offset, count, fn, arg) {
    var i, l;

    if (!stride) {
      stride = 2;
    }

    if (!offset) {
      offset = 0;
    }

    if (count) {
      l = Math.min(count * stride + offset, a.length);
    } else {
      l = a.length;
    }

    for (i = offset; i < l; i += stride) {
      vec[0] = a[i];
      vec[1] = a[i + 1];
      fn(vec, vec, arg);
      a[i] = vec[0];
      a[i + 1] = vec[1];
    }

    return a;
  };
})();

var _animationData = /*#__PURE__*/new WeakMap();

var _finishedPromise$1 = /*#__PURE__*/new WeakMap();

var _willFinish = /*#__PURE__*/new WeakMap();

/**
 * Provides a basic {@link TJSBasicAnimation} implementation for Position animation.
 */
class AnimationControl {
  /** @type {object} */

  /** @type {Promise<void>} */

  /**
   * Defines a static empty / void animation control.
   *
   * @type {AnimationControl}
   */

  /**
   * Provides a static void / undefined AnimationControl that is automatically resolved.
   *
   * @returns {AnimationControl} Void AnimationControl
   */
  static get voidControl() {
    return _classStaticPrivateFieldSpecGet(this, AnimationControl, _voidControl$1);
  }
  /**
   * @param {object|null} [animationData] - Animation data from {@link AnimationAPI}.
   *
   * @param {boolean}     [willFinish] - Promise that tracks animation finished state.
   */


  constructor(animationData, willFinish = false) {
    _classPrivateFieldInitSpec(this, _animationData, {
      writable: true,
      value: void 0
    });

    _classPrivateFieldInitSpec(this, _finishedPromise$1, {
      writable: true,
      value: void 0
    });

    _classPrivateFieldInitSpec(this, _willFinish, {
      writable: true,
      value: void 0
    });

    _classPrivateFieldSet(this, _animationData, animationData);

    _classPrivateFieldSet(this, _willFinish, willFinish); // Set this control to animation data.


    if (animationData !== null && typeof animationData === 'object') {
      animationData.control = this;
    }
  }
  /**
   * Get a promise that resolves when animation is finished.
   *
   * @returns {Promise<void>}
   */


  get finished() {
    if (!(_classPrivateFieldGet(this, _finishedPromise$1) instanceof Promise)) {
      _classPrivateFieldSet(this, _finishedPromise$1, _classPrivateFieldGet(this, _willFinish) ? new Promise(resolve => _classPrivateFieldGet(this, _animationData).resolve = resolve) : Promise.resolve());
    }

    return _classPrivateFieldGet(this, _finishedPromise$1);
  }
  /**
   * Returns whether this animation is currently active / animating.
   *
   * Note: a delayed animation may not be started / active yet. Use {@link AnimationControl.isFinished} to determine
   * if an animation is actually finished.
   *
   * @returns {boolean} Animation active state.
   */


  get isActive() {
    return _classPrivateFieldGet(this, _animationData).active;
  }
  /**
   * Returns whether this animation is completely finished.
   *
   * @returns {boolean} Animation finished state.
   */


  get isFinished() {
    return _classPrivateFieldGet(this, _animationData).finished;
  }
  /**
   * Cancels the animation.
   */


  cancel() {
    const animationData = _classPrivateFieldGet(this, _animationData);

    if (animationData === null || animationData === void 0) {
      return;
    } // Set cancelled state to true and this animation data instance will be removed from AnimationManager on next
    // update.


    animationData.cancelled = true;
  }

}
var _voidControl$1 = {
  writable: true,
  value: new AnimationControl(null)
};

/**
 * Provides animation management and scheduling allowing all Position instances to utilize one micro-task.
 */
class AnimationManager {
  /**
   * @type {object[]}
   */

  /**
   * @type {object[]}
   */

  /**
   * @type {number}
   */

  /**
   * Add animation data.
   *
   * @param {object}   data -
   */
  static add(data) {
    const now = performance.now(); // Offset start time by delta between last rAF time. This allows continuous tween cycles to appear naturally as
    // starting from the instant they are added to the AnimationManager. This is what makes `draggable` smooth when
    // easing is enabled.

    data.start = now + (AnimationManager.current - now);
    AnimationManager.newList.push(data);
  }
  /**
   * Manage all animation
   */


  static animate() {
    const current = AnimationManager.current = performance.now(); // Early out of the rAF callback when there are no current animations.

    if (AnimationManager.activeList.length === 0 && AnimationManager.newList.length === 0) {
      globalThis.requestAnimationFrame(AnimationManager.animate);
      return;
    }

    if (AnimationManager.newList.length) {
      // Process new data
      for (let cntr = AnimationManager.newList.length; --cntr >= 0;) {
        const data = AnimationManager.newList[cntr]; // If animation instance has been cancelled before start then remove it from new list and cleanup.

        if (data.cancelled) {
          AnimationManager.newList.splice(cntr, 1);
          data.cleanup(data);
        } // If data is active then process it now. Delayed animations start with `active` false.


        if (data.active) {
          // Remove from new list and add to active list.
          AnimationManager.newList.splice(cntr, 1);
          AnimationManager.activeList.push(data);
        }
      }
    } // Process active animations.


    for (let cntr = AnimationManager.activeList.length; --cntr >= 0;) {
      const data = AnimationManager.activeList[cntr]; // Remove any animations that have been canceled.
      // Ensure that the element is still connected otherwise remove it from active list and continue.

      if (data.cancelled || data.el !== void 0 && !data.el.isConnected) {
        AnimationManager.activeList.splice(cntr, 1);
        data.cleanup(data);
        continue;
      }

      data.current = current - data.start; // Remove this animation instance if current animating time exceeds duration.

      if (data.current >= data.duration) {
        // Prepare final update with end position data.
        for (let dataCntr = data.keys.length; --dataCntr >= 0;) {
          const key = data.keys[dataCntr];
          data.newData[key] = data.destination[key];
        }

        data.position.set(data.newData);
        AnimationManager.activeList.splice(cntr, 1);
        data.cleanup(data);
        continue;
      } // Apply easing to create an eased time.


      const easedTime = data.ease(data.current / data.duration);

      for (let dataCntr = data.keys.length; --dataCntr >= 0;) {
        const key = data.keys[dataCntr];
        data.newData[key] = data.interpolate(data.initial[key], data.destination[key], easedTime);
      }

      data.position.set(data.newData);
    }

    globalThis.requestAnimationFrame(AnimationManager.animate);
  }
  /**
   * Cancels all animations for given Position instance.
   *
   * @param {Position} position - Position instance.
   */


  static cancel(position) {
    for (let cntr = AnimationManager.activeList.length; --cntr >= 0;) {
      const data = AnimationManager.activeList[cntr];

      if (data.position === position) {
        AnimationManager.activeList.splice(cntr, 1);
        data.cancelled = true;
        data.cleanup(data);
      }
    }

    for (let cntr = AnimationManager.newList.length; --cntr >= 0;) {
      const data = AnimationManager.newList[cntr];

      if (data.position === position) {
        AnimationManager.newList.splice(cntr, 1);
        data.cancelled = true;
        data.cleanup(data);
      }
    }
  }
  /**
   * Cancels all active and delayed animations.
   */


  static cancelAll() {
    for (let cntr = AnimationManager.activeList.length; --cntr >= 0;) {
      const data = AnimationManager.activeList[cntr];
      data.cancelled = true;
      data.cleanup(data);
    }

    for (let cntr = AnimationManager.newList.length; --cntr >= 0;) {
      const data = AnimationManager.newList[cntr];
      data.cancelled = true;
      data.cleanup(data);
    }

    AnimationManager.activeList.length = 0;
    AnimationManager.newList.length = 0;
  }
  /**
   * Gets all {@link AnimationControl} instances for a given Position instance.
   *
   * @param {Position} position - Position instance.
   *
   * @returns {AnimationControl[]} All scheduled AnimationControl instances for the given Position instance.
   */


  static getScheduled(position) {
    const results = [];

    for (let cntr = AnimationManager.activeList.length; --cntr >= 0;) {
      const data = AnimationManager.activeList[cntr];

      if (data.position === position) {
        results.push(data.control);
      }
    }

    for (let cntr = AnimationManager.newList.length; --cntr >= 0;) {
      const data = AnimationManager.newList[cntr];

      if (data.position === position) {
        results.push(data.control);
      }
    }

    return results;
  }

} // Start animation manager immediately. It constantly is running in background.

_defineProperty(AnimationManager, "activeList", []);

_defineProperty(AnimationManager, "newList", []);

_defineProperty(AnimationManager, "current", void 0);

AnimationManager.animate();

/**
 * Stores the PositionData properties that can be animated.
 *
 * @type {Set<string>}
 */
const animateKeys = new Set([// Main keys
'left', 'top', 'maxWidth', 'maxHeight', 'minWidth', 'minHeight', 'width', 'height', 'rotateX', 'rotateY', 'rotateZ', 'scale', 'translateX', 'translateY', 'translateZ', 'zIndex', // Aliases
'rotation']);
/**
 * Defines the keys of PositionData that are transform keys.
 *
 * @type {string[]}
 */

const transformKeys = ['rotateX', 'rotateY', 'rotateZ', 'scale', 'translateX', 'translateY', 'translateZ'];
Object.freeze(transformKeys);
/**
 * Parses a relative value string in the form of '+=', '-=', or '*=' and float / numeric value. IE '+=0.2'.
 *
 * @type {RegExp}
 */

const relativeRegex = /^([-+*])=(-?[\d]*\.?[\d]+)$/;
/**
 * Provides numeric defaults for all parameters. This is used by {@link Position.get} to optionally provide
 * numeric defaults.
 *
 * @type {{rotation: number, scale: number, minWidth: null, minHeight: null, translateZ: number, top: number, left: number, maxHeight: null, translateY: number, translateX: number, width: number, transformOrigin: null, rotateX: number, rotateY: number, height: number, maxWidth: null, zIndex: null, rotateZ: number}}
 */

const numericDefaults = {
  // Other keys
  height: 0,
  left: 0,
  maxHeight: null,
  maxWidth: null,
  minHeight: null,
  minWidth: null,
  top: 0,
  transformOrigin: null,
  width: 0,
  zIndex: null,
  rotateX: 0,
  rotateY: 0,
  rotateZ: 0,
  scale: 1,
  translateX: 0,
  translateY: 0,
  translateZ: 0,
  rotation: 0
};
Object.freeze(numericDefaults);
/**
 * Sets numeric defaults for a {@link PositionData} like object.
 *
 * @param {object}   data - A PositionData like object.
 */

function setNumericDefaults(data) {
  // Transform keys
  if (data.rotateX === null) {
    data.rotateX = 0;
  }

  if (data.rotateY === null) {
    data.rotateY = 0;
  }

  if (data.rotateZ === null) {
    data.rotateZ = 0;
  }

  if (data.translateX === null) {
    data.translateX = 0;
  }

  if (data.translateY === null) {
    data.translateY = 0;
  }

  if (data.translateZ === null) {
    data.translateZ = 0;
  }

  if (data.scale === null) {
    data.scale = 1;
  } // Aliases


  if (data.rotation === null) {
    data.rotation = 0;
  }
}
/**
 * Defines bitwise keys for transforms used in {@link Transforms.getMat4}.
 *
 * @type {object}
 */


const transformKeysBitwise = {
  rotateX: 1,
  rotateY: 2,
  rotateZ: 4,
  scale: 8,
  translateX: 16,
  translateY: 32,
  translateZ: 64
};
Object.freeze(transformKeysBitwise);
/**
 * Defines the default transform origin.
 *
 * @type {string}
 */

const transformOriginDefault = 'top left';
/**
 * Defines the valid transform origins.
 *
 * @type {string[]}
 */

const transformOrigins = ['top left', 'top center', 'top right', 'center left', 'center', 'center right', 'bottom left', 'bottom center', 'bottom right'];
Object.freeze(transformOrigins);

/**
 * Converts any relative string values for animatable keys to actual updates performed against current data.
 *
 * @param {PositionDataExtended}    positionData - position data.
 *
 * @param {Position|PositionData}   position - The source position instance.
 */

function convertRelative(positionData, position) {
  for (const key in positionData) {
    // Key is animatable / numeric.
    if (animateKeys.has(key)) {
      const value = positionData[key];

      if (typeof value !== 'string') {
        continue;
      } // Ignore 'auto' and 'inherit' string values.


      if (value === 'auto' || value === 'inherit') {
        continue;
      }

      const regexResults = relativeRegex.exec(value);

      if (!regexResults) {
        throw new Error(`convertRelative error: malformed relative key (${key}) with value (${value})`);
      }

      const current = position[key];

      switch (regexResults[1]) {
        case '-':
          positionData[key] = current - parseFloat(regexResults[2]);
          break;

        case '+':
          positionData[key] = current + parseFloat(regexResults[2]);
          break;

        case '*':
          positionData[key] = current * parseFloat(regexResults[2]);
          break;
      }
    }
  }
}

var _data$3 = /*#__PURE__*/new WeakMap();

var _position$2 = /*#__PURE__*/new WeakMap();

var _instanceCount = /*#__PURE__*/new WeakMap();

var _cleanup = /*#__PURE__*/new WeakMap();

var _addAnimation = /*#__PURE__*/new WeakSet();

var _cleanupInstance = /*#__PURE__*/new WeakSet();

class AnimationAPI {
  /** @type {PositionData} */

  /** @type {Position} */

  /**
   * Tracks the number of animation control instances that are active.
   *
   * @type {number}
   */

  /**
   * Provides a bound function to pass as data to AnimationManager to invoke
   *
   * @type {Function}
   * @see {AnimationAPI.#cleanupInstance}
   */
  constructor(position, _data2) {
    _classPrivateMethodInitSpec(this, _cleanupInstance);

    _classPrivateMethodInitSpec(this, _addAnimation);

    _classPrivateFieldInitSpec(this, _data$3, {
      writable: true,
      value: void 0
    });

    _classPrivateFieldInitSpec(this, _position$2, {
      writable: true,
      value: void 0
    });

    _classPrivateFieldInitSpec(this, _instanceCount, {
      writable: true,
      value: 0
    });

    _classPrivateFieldInitSpec(this, _cleanup, {
      writable: true,
      value: void 0
    });

    _classPrivateFieldSet(this, _position$2, position);

    _classPrivateFieldSet(this, _data$3, _data2);

    _classPrivateFieldSet(this, _cleanup, _classPrivateMethodGet(this, _cleanupInstance, _cleanupInstance2).bind(this));
  }
  /**
   * Returns whether there are scheduled animations whether active or delayed for this Position.
   *
   * @returns {boolean} Are there active animation instances.
   */


  get isScheduled() {
    return _classPrivateFieldGet(this, _instanceCount) > 0;
  }
  /**
   * Adds / schedules an animation w/ the AnimationManager. This contains the final steps common to all tweens.
   *
   * @param {object}      initial -
   *
   * @param {object}      destination -
   *
   * @param {number}      duration -
   *
   * @param {HTMLElement} el -
   *
   * @param {number}      delay -
   *
   * @param {Function}    ease -
   *
   * @param {Function}    interpolate -
   *
   * @returns {AnimationControl} The associated animation control.
   */


  /**
   * Cancels all animation instances for this Position instance.
   */
  cancel() {
    AnimationManager.cancel(_classPrivateFieldGet(this, _position$2));
  }
  /**
   * Cleans up an animation instance.
   *
   * @param {object}   data - Animation data for an animation instance.
   */


  /**
   * Returns all currently scheduled AnimationControl instances for this Position instance.
   *
   * @returns {AnimationControl[]} All currently scheduled animation controls for this Position instance.
   */
  getScheduled() {
    return AnimationManager.getScheduled(_classPrivateFieldGet(this, _position$2));
  }
  /**
   * Provides a tween from given position data to the current position.
   *
   * @param {PositionDataExtended} fromData - The starting position.
   *
   * @param {object}         [opts] - Optional parameters.
   *
   * @param {number}         [opts.delay=0] - Delay in seconds before animation starts.
   *
   * @param {number}         [opts.duration=1] - Duration in seconds.
   *
   * @param {Function}       [opts.ease=cubicOut] - Easing function.
   *
   * @param {Function}       [opts.interpolate=lerp] - Interpolation function.
   *
   * @returns {AnimationControl}  A control object that can cancel animation and provides a `finished` Promise.
   */


  from(fromData, {
    delay = 0,
    duration = 1,
    ease = cubicOut,
    interpolate = lerp$5
  } = {}) {
    var _parent$options, _parent$options2;

    if (!isObject(fromData)) {
      throw new TypeError(`AnimationAPI.from error: 'fromData' is not an object.`);
    }

    const position = _classPrivateFieldGet(this, _position$2);

    const parent = position.parent; // Early out if the application is not positionable.

    if (parent !== void 0 && typeof (parent === null || parent === void 0 ? void 0 : (_parent$options = parent.options) === null || _parent$options === void 0 ? void 0 : _parent$options.positionable) === 'boolean' && !(parent !== null && parent !== void 0 && (_parent$options2 = parent.options) !== null && _parent$options2 !== void 0 && _parent$options2.positionable)) {
      return AnimationControl.voidControl;
    } // Cache any target element allowing AnimationManager to stop animation if it becomes disconnected from DOM.


    const targetEl = parent instanceof HTMLElement ? parent : parent === null || parent === void 0 ? void 0 : parent.elementTarget;
    const el = targetEl instanceof HTMLElement && targetEl.isConnected ? targetEl : void 0;

    if (!Number.isFinite(delay) || delay < 0) {
      throw new TypeError(`AnimationAPI.from error: 'delay' is not a positive number.`);
    }

    if (!Number.isFinite(duration) || duration < 0) {
      throw new TypeError(`AnimationAPI.from error: 'duration' is not a positive number.`);
    }

    if (typeof ease !== 'function') {
      throw new TypeError(`AnimationAPI.from error: 'ease' is not a function.`);
    }

    if (typeof interpolate !== 'function') {
      throw new TypeError(`AnimationAPI.from error: 'interpolate' is not a function.`);
    }

    const initial = {};
    const destination = {};

    const data = _classPrivateFieldGet(this, _data$3); // Set initial data if the key / data is defined and the end position is not equal to current data.


    for (const key in fromData) {
      if (data[key] !== void 0 && fromData[key] !== data[key]) {
        initial[key] = fromData[key];
        destination[key] = data[key];
      }
    }

    convertRelative(initial, data);
    return _classPrivateMethodGet(this, _addAnimation, _addAnimation2).call(this, initial, destination, duration, el, delay, ease, interpolate);
  }
  /**
   * Provides a tween from given position data to the current position.
   *
   * @param {PositionDataExtended} fromData - The starting position.
   *
   * @param {PositionDataExtended} toData - The ending position.
   *
   * @param {object}         [opts] - Optional parameters.
   *
   * @param {number}         [opts.delay=0] - Delay in seconds before animation starts.
   *
   * @param {number}         [opts.duration=1] - Duration in seconds.
   *
   * @param {Function}       [opts.ease=cubicOut] - Easing function.
   *
   * @param {Function}       [opts.interpolate=lerp] - Interpolation function.
   *
   * @returns {AnimationControl}  A control object that can cancel animation and provides a `finished` Promise.
   */


  fromTo(fromData, toData, {
    delay = 0,
    duration = 1,
    ease = cubicOut,
    interpolate = lerp$5
  } = {}) {
    var _parent$options3, _parent$options4;

    if (!isObject(fromData)) {
      throw new TypeError(`AnimationAPI.fromTo error: 'fromData' is not an object.`);
    }

    if (!isObject(toData)) {
      throw new TypeError(`AnimationAPI.fromTo error: 'toData' is not an object.`);
    }

    const parent = _classPrivateFieldGet(this, _position$2).parent; // Early out if the application is not positionable.


    if (parent !== void 0 && typeof (parent === null || parent === void 0 ? void 0 : (_parent$options3 = parent.options) === null || _parent$options3 === void 0 ? void 0 : _parent$options3.positionable) === 'boolean' && !(parent !== null && parent !== void 0 && (_parent$options4 = parent.options) !== null && _parent$options4 !== void 0 && _parent$options4.positionable)) {
      return AnimationControl.voidControl;
    } // Cache any target element allowing AnimationManager to stop animation if it becomes disconnected from DOM.


    const targetEl = parent instanceof HTMLElement ? parent : parent === null || parent === void 0 ? void 0 : parent.elementTarget;
    const el = targetEl instanceof HTMLElement && targetEl.isConnected ? targetEl : void 0;

    if (!Number.isFinite(delay) || delay < 0) {
      throw new TypeError(`AnimationAPI.fromTo error: 'delay' is not a positive number.`);
    }

    if (!Number.isFinite(duration) || duration < 0) {
      throw new TypeError(`AnimationAPI.fromTo error: 'duration' is not a positive number.`);
    }

    if (typeof ease !== 'function') {
      throw new TypeError(`AnimationAPI.fromTo error: 'ease' is not a function.`);
    }

    if (typeof interpolate !== 'function') {
      throw new TypeError(`AnimationAPI.fromTo error: 'interpolate' is not a function.`);
    }

    const initial = {};
    const destination = {};

    const data = _classPrivateFieldGet(this, _data$3); // Set initial data if the key / data is defined and the end position is not equal to current data.


    for (const key in fromData) {
      if (toData[key] === void 0) {
        console.warn(`AnimationAPI.fromTo warning: key ('${key}') from 'fromData' missing in 'toData'; skipping this key.`);
        continue;
      }

      if (data[key] !== void 0) {
        initial[key] = fromData[key];
        destination[key] = toData[key];
      }
    }

    convertRelative(initial, data);
    convertRelative(destination, data);
    return _classPrivateMethodGet(this, _addAnimation, _addAnimation2).call(this, initial, destination, duration, el, delay, ease, interpolate);
  }
  /**
   * Provides a tween to given position data from the current position.
   *
   * @param {PositionDataExtended} toData - The destination position.
   *
   * @param {object}         [opts] - Optional parameters.
   *
   * @param {number}         [opts.delay=0] - Delay in seconds before animation starts.
   *
   * @param {number}         [opts.duration=1] - Duration in seconds.
   *
   * @param {Function}       [opts.ease=cubicOut] - Easing function.
   *
   * @param {Function}       [opts.interpolate=lerp] - Interpolation function.
   *
   * @returns {AnimationControl}  A control object that can cancel animation and provides a `finished` Promise.
   */


  to(toData, {
    delay = 0,
    duration = 1,
    ease = cubicOut,
    interpolate = lerp$5
  } = {}) {
    var _parent$options5, _parent$options6;

    if (!isObject(toData)) {
      throw new TypeError(`AnimationAPI.to error: 'toData' is not an object.`);
    }

    const parent = _classPrivateFieldGet(this, _position$2).parent; // Early out if the application is not positionable.


    if (parent !== void 0 && typeof (parent === null || parent === void 0 ? void 0 : (_parent$options5 = parent.options) === null || _parent$options5 === void 0 ? void 0 : _parent$options5.positionable) === 'boolean' && !(parent !== null && parent !== void 0 && (_parent$options6 = parent.options) !== null && _parent$options6 !== void 0 && _parent$options6.positionable)) {
      return AnimationControl.voidControl;
    } // Cache any target element allowing AnimationManager to stop animation if it becomes disconnected from DOM.


    const targetEl = parent instanceof HTMLElement ? parent : parent === null || parent === void 0 ? void 0 : parent.elementTarget;
    const el = targetEl instanceof HTMLElement && targetEl.isConnected ? targetEl : void 0;

    if (!Number.isFinite(delay) || delay < 0) {
      throw new TypeError(`AnimationAPI.to error: 'delay' is not a positive number.`);
    }

    if (!Number.isFinite(duration) || duration < 0) {
      throw new TypeError(`AnimationAPI.to error: 'duration' is not a positive number.`);
    }

    if (typeof ease !== 'function') {
      throw new TypeError(`AnimationAPI.to error: 'ease' is not a function.`);
    }

    if (typeof interpolate !== 'function') {
      throw new TypeError(`AnimationAPI.to error: 'interpolate' is not a function.`);
    }

    const initial = {};
    const destination = {};

    const data = _classPrivateFieldGet(this, _data$3); // Set initial data if the key / data is defined and the end position is not equal to current data.


    for (const key in toData) {
      if (data[key] !== void 0 && toData[key] !== data[key]) {
        destination[key] = toData[key];
        initial[key] = data[key];
      }
    }

    convertRelative(destination, data);
    return _classPrivateMethodGet(this, _addAnimation, _addAnimation2).call(this, initial, destination, duration, el, delay, ease, interpolate);
  }
  /**
   * Returns a function that provides an optimized way to constantly update a to-tween.
   *
   * @param {Iterable<string>}  keys - The keys for quickTo.
   *
   * @param {object}            [opts] - Optional parameters.
   *
   * @param {number}            [opts.duration=1] - Duration in seconds.
   *
   * @param {Function}          [opts.ease=cubicOut] - Easing function.
   *
   * @param {Function}          [opts.interpolate=lerp] - Interpolation function.
   *
   * @returns {quickToCallback} quick-to tween function.
   */


  quickTo(keys, {
    duration = 1,
    ease = cubicOut,
    interpolate = lerp$5
  } = {}) {
    var _parent$options7, _parent$options8;

    if (!isIterable(keys)) {
      throw new TypeError(`AnimationAPI.quickTo error: 'keys' is not an iterable list.`);
    }

    const parent = _classPrivateFieldGet(this, _position$2).parent; // Early out if the application is not positionable.


    if (parent !== void 0 && typeof (parent === null || parent === void 0 ? void 0 : (_parent$options7 = parent.options) === null || _parent$options7 === void 0 ? void 0 : _parent$options7.positionable) === 'boolean' && !(parent !== null && parent !== void 0 && (_parent$options8 = parent.options) !== null && _parent$options8 !== void 0 && _parent$options8.positionable)) {
      throw new Error(`AnimationAPI.quickTo error: 'parent' is not positionable.`);
    }

    if (!Number.isFinite(duration) || duration < 0) {
      throw new TypeError(`AnimationAPI.quickTo error: 'duration' is not a positive number.`);
    }

    if (typeof ease !== 'function') {
      throw new TypeError(`AnimationAPI.quickTo error: 'ease' is not a function.`);
    }

    if (typeof interpolate !== 'function') {
      throw new TypeError(`AnimationAPI.quickTo error: 'interpolate' is not a function.`);
    }

    const initial = {};
    const destination = {};

    const data = _classPrivateFieldGet(this, _data$3); // Set initial data if the key / data is defined and the end position is not equal to current data.


    for (const key of keys) {
      if (typeof key !== 'string') {
        throw new TypeError(`AnimationAPI.quickTo error: key is not a string.`);
      }

      if (!animateKeys.has(key)) {
        throw new Error(`AnimationAPI.quickTo error: key ('${key}') is not animatable.`);
      }

      if (data[key] !== void 0) {
        destination[key] = data[key];
        initial[key] = data[key];
      }
    }

    const keysArray = [...keys];
    Object.freeze(keysArray);
    const newData = Object.assign({
      immediateElementUpdate: true
    }, initial);
    const animationData = {
      active: true,
      cleanup: _classPrivateFieldGet(this, _cleanup),
      cancelled: false,
      control: void 0,
      current: 0,
      destination,
      duration: duration * 1000,
      // Internally the AnimationManager works in ms.
      ease,
      el: void 0,
      finished: true,
      // Note: start in finished state to add to AnimationManager on first callback.
      initial,
      interpolate,
      keys,
      newData,
      position: _classPrivateFieldGet(this, _position$2),
      resolve: void 0,
      start: void 0
    };

    const quickToCB = (...args) => {
      const argsLength = args.length;

      if (argsLength === 0) {
        return;
      }

      for (let cntr = keysArray.length; --cntr >= 0;) {
        const key = keysArray[cntr];

        if (data[key] !== void 0) {
          initial[key] = data[key];
        }
      } // Handle case where the first arg is an object. Update all quickTo keys from data contained in the object.


      if (isObject(args[0])) {
        const objData = args[0];

        for (const key in objData) {
          if (destination[key] !== void 0) {
            destination[key] = objData[key];
          }
        }
      } else // Assign each variable argument to the key specified in the initial `keys` array above.
        {
          for (let cntr = 0; cntr < argsLength && cntr < keysArray.length; cntr++) {
            const key = keysArray[cntr];

            if (destination[key] !== void 0) {
              destination[key] = args[cntr];
            }
          }
        }

      convertRelative(destination, data); // Set initial data for transform values that are often null by default.

      setNumericDefaults(initial);
      setNumericDefaults(destination); // Set target element to animation data to track if it is removed from the DOM hence ending the animation.

      const targetEl = parent instanceof HTMLElement ? parent : parent === null || parent === void 0 ? void 0 : parent.elementTarget;
      animationData.el = targetEl instanceof HTMLElement && targetEl.isConnected ? targetEl : void 0; // Reschedule the quickTo animation with AnimationManager as it is finished.

      if (animationData.finished) {
        var _this$instanceCount5;

        animationData.finished = false;
        animationData.active = true;
        animationData.current = 0;
        _classPrivateFieldSet(this, _instanceCount, (_this$instanceCount5 = _classPrivateFieldGet(this, _instanceCount), _this$instanceCount5++, _this$instanceCount5));
        AnimationManager.add(animationData);
      } else // QuickTo animation is currently scheduled w/ AnimationManager so reset start and current time.
        {
          const now = performance.now(); // Offset start time by delta between last rAF time. This allows a delayed tween to start from the
          // precise delayed time.

          animationData.start = now + (AnimationManager.current - now);
          animationData.current = 0;
        }
    };

    quickToCB.keys = keysArray;
    /**
     * Sets options of quickTo tween.
     *
     * @param {object}            [opts] - Optional parameters.
     *
     * @param {number}            [opts.duration] - Duration in seconds.
     *
     * @param {Function}          [opts.ease] - Easing function.
     *
     * @param {Function}          [opts.interpolate] - Interpolation function.
     *
     * @returns {quickToCallback} The quickTo callback.
     */

    quickToCB.options = ({
      duration,
      ease,
      interpolate
    } = {}) => // eslint-disable-line no-shadow
    {
      if (duration !== void 0 && (!Number.isFinite(duration) || duration < 0)) {
        throw new TypeError(`AnimationAPI.quickTo.options error: 'duration' is not a positive number.`);
      }

      if (ease !== void 0 && typeof ease !== 'function') {
        throw new TypeError(`AnimationAPI.quickTo.options error: 'ease' is not a function.`);
      }

      if (interpolate !== void 0 && typeof interpolate !== 'function') {
        throw new TypeError(`AnimationAPI.quickTo.options error: 'interpolate' is not a function.`);
      }

      if (duration >= 0) {
        animationData.duration = duration * 1000;
      }

      if (ease) {
        animationData.ease = ease;
      }

      if (interpolate) {
        animationData.interpolate = interpolate;
      }

      return quickToCB;
    };

    return quickToCB;
  }

}
/**
 * @callback quickToCallback
 *
 * @param {...number|object} args - Either individual numbers corresponding to the order in which keys are specified or
 *                                  a single object with keys specified and numerical values.
 *
 * @property {({duration?: number, ease?: Function, interpolate?: Function}) => quickToCallback} options - A function
 *                                  to update options for quickTo function.
 */

function _addAnimation2(initial, destination, duration, el, delay, ease, interpolate) {
  var _this$instanceCount;

  // Set initial data for transform values that are often null by default.
  setNumericDefaults(initial);
  setNumericDefaults(destination); // Reject all initial data that is not a number.

  for (const key in initial) {
    if (!Number.isFinite(initial[key])) {
      delete initial[key];
    }
  }

  const keys = Object.keys(initial);
  const newData = Object.assign({
    immediateElementUpdate: true
  }, initial); // Nothing to animate, so return now.

  if (keys.length === 0) {
    return AnimationControl.voidControl;
  }

  const animationData = {
    active: true,
    cleanup: _classPrivateFieldGet(this, _cleanup),
    cancelled: false,
    control: void 0,
    current: 0,
    destination,
    duration: duration * 1000,
    // Internally the AnimationManager works in ms.
    ease,
    el,
    finished: false,
    initial,
    interpolate,
    keys,
    newData,
    position: _classPrivateFieldGet(this, _position$2),
    resolve: void 0,
    start: void 0
  };

  if (delay > 0) {
    animationData.active = false; // Delay w/ setTimeout and schedule w/ AnimationManager if not already canceled

    setTimeout(() => {
      if (!animationData.cancelled) {
        animationData.active = true;
        const now = performance.now(); // Offset start time by delta between last rAF time. This allows a delayed tween to start from the
        // precise delayed time.

        animationData.start = now + (AnimationManager.current - now);
      }
    }, delay * 1000);
  } // Schedule immediately w/ AnimationManager


  _classPrivateFieldSet(this, _instanceCount, (_this$instanceCount = _classPrivateFieldGet(this, _instanceCount), _this$instanceCount++, _this$instanceCount));
  AnimationManager.add(animationData); // Create animation control

  return new AnimationControl(animationData, true);
}

function _cleanupInstance2(data) {
  var _this$instanceCount3;

  _classPrivateFieldSet(this, _instanceCount, (_this$instanceCount3 = _classPrivateFieldGet(this, _instanceCount), _this$instanceCount3--, _this$instanceCount3));
  data.active = false;
  data.finished = true;

  if (typeof data.resolve === 'function') {
    data.resolve(data.cancelled);
  }
}

var _animationControls = /*#__PURE__*/new WeakMap();

var _finishedPromise = /*#__PURE__*/new WeakMap();

/**
 * Provides a basic {@link TJSBasicAnimation} implementation for a Position animation for a group of Position instances.
 */
class AnimationGroupControl {
  /** @type {AnimationControl[]} */

  /** @type {Promise<Awaited<unknown>[]>} */

  /**
   * Defines a static empty / void animation control.
   *
   * @type {AnimationGroupControl}
   */

  /**
   * Provides a static void / undefined AnimationGroupControl that is automatically resolved.
   *
   * @returns {AnimationGroupControl} Void AnimationGroupControl
   */
  static get voidControl() {
    return _classStaticPrivateFieldSpecGet(this, AnimationGroupControl, _voidControl);
  }
  /**
   * @param {AnimationControl[]} animationControls - An array of AnimationControl instances.
   */


  constructor(animationControls) {
    _classPrivateFieldInitSpec(this, _animationControls, {
      writable: true,
      value: void 0
    });

    _classPrivateFieldInitSpec(this, _finishedPromise, {
      writable: true,
      value: void 0
    });

    _classPrivateFieldSet(this, _animationControls, animationControls);
  }
  /**
   * Get a promise that resolves when all animations are finished.
   *
   * @returns {Promise<Awaited<unknown>[]>|Promise<void>} Finished Promise for all animations.
   */


  get finished() {
    const animationControls = _classPrivateFieldGet(this, _animationControls);

    if (animationControls === null || animationControls === void 0) {
      return Promise.resolve();
    }

    if (!(_classPrivateFieldGet(this, _finishedPromise) instanceof Promise)) {
      const promises = [];

      for (let cntr = animationControls.length; --cntr >= 0;) {
        promises.push(animationControls[cntr].finished);
      }

      _classPrivateFieldSet(this, _finishedPromise, Promise.all(promises));
    }

    return _classPrivateFieldGet(this, _finishedPromise);
  }
  /**
   * Returns whether there are active animation instances for this group.
   *
   * Note: a delayed animation may not be started / active yet. Use {@link AnimationGroupControl.isFinished} to
   * determine if all animations in the group are finished.
   *
   * @returns {boolean} Are there active animation instances.
   */


  get isActive() {
    const animationControls = _classPrivateFieldGet(this, _animationControls);

    if (animationControls === null || animationControls === void 0) {
      return false;
    }

    for (let cntr = animationControls.length; --cntr >= 0;) {
      if (animationControls[cntr].isActive) {
        return true;
      }
    }

    return false;
  }
  /**
   * Returns whether all animations in the group are finished.
   *
   * @returns {boolean} Are all animation instances finished.
   */


  get isFinished() {
    const animationControls = _classPrivateFieldGet(this, _animationControls);

    if (animationControls === null || animationControls === void 0) {
      return true;
    }

    for (let cntr = animationControls.length; --cntr >= 0;) {
      if (!animationControls[cntr].isFinished) {
        return false;
      }
    }

    return false;
  }
  /**
   * Cancels the all animations.
   */


  cancel() {
    const animationControls = _classPrivateFieldGet(this, _animationControls);

    if (animationControls === null || animationControls === void 0) {
      return;
    }

    for (let cntr = _classPrivateFieldGet(this, _animationControls).length; --cntr >= 0;) {
      _classPrivateFieldGet(this, _animationControls)[cntr].cancel();
    }
  }

}
var _voidControl = {
  writable: true,
  value: new AnimationGroupControl(null)
};

/**
 * Provides a public API for grouping multiple {@link Position} animations together with the AnimationManager.
 *
 * Note: To remove cyclic dependencies as this class provides the Position static / group Animation API `instanceof`
 * checks are not done against Position. Instead, a check for the animate property being an instanceof
 * {@link AnimationAPI} is performed in {@link AnimationGroupAPI.#isPosition}.
 *
 * @see AnimationAPI
 */

class AnimationGroupAPI {
  /**
   * Checks of the given object is a Position instance by checking for AnimationAPI.
   *
   * @param {*}  object - Any data.
   *
   * @returns {boolean} Is Position.
   */

  /**
   * Cancels any animation for given Position data.
   *
   * @param {Position|{position: Position}|Iterable<Position>|Iterable<{position: Position}>} position -
   */
  static cancel(position) {
    if (isIterable(position)) {
      let index = -1;

      for (const entry of position) {
        index++;
        const actualPosition = _classStaticPrivateMethodGet(this, AnimationGroupAPI, _isPosition).call(this, entry) ? entry : entry.position;

        if (!_classStaticPrivateMethodGet(this, AnimationGroupAPI, _isPosition).call(this, actualPosition)) {
          console.warn(`AnimationGroupAPI.cancel warning: No Position instance found at index: ${index}.`);
          continue;
        }

        AnimationManager.cancel(actualPosition);
      }
    } else {
      const actualPosition = _classStaticPrivateMethodGet(this, AnimationGroupAPI, _isPosition).call(this, position) ? position : position.position;

      if (!_classStaticPrivateMethodGet(this, AnimationGroupAPI, _isPosition).call(this, actualPosition)) {
        console.warn(`AnimationGroupAPI.cancel warning: No Position instance found.`);
        return;
      }

      AnimationManager.cancel(actualPosition);
    }
  }
  /**
   * Cancels all Position animation.
   */


  static cancelAll() {
    AnimationManager.cancelAll();
  }
  /**
   * Gets all animation controls for the given position data.
   *
   * @param {Position|{position: Position}|Iterable<Position>|Iterable<{position: Position}>} position -
   *
   * @returns {{position: Position, data: object|void, controls: AnimationControl[]}[]} Results array.
   */


  static getScheduled(position) {
    const results = [];

    if (isIterable(position)) {
      let index = -1;

      for (const entry of position) {
        index++;

        const isPosition = _classStaticPrivateMethodGet(this, AnimationGroupAPI, _isPosition).call(this, entry);

        const actualPosition = isPosition ? entry : entry.position;

        if (!_classStaticPrivateMethodGet(this, AnimationGroupAPI, _isPosition).call(this, actualPosition)) {
          console.warn(`AnimationGroupAPI.getScheduled warning: No Position instance found at index: ${index}.`);
          continue;
        }

        const controls = AnimationManager.getScheduled(actualPosition);
        results.push({
          position: actualPosition,
          data: isPosition ? void 0 : entry,
          controls
        });
      }
    } else {
      const isPosition = _classStaticPrivateMethodGet(this, AnimationGroupAPI, _isPosition).call(this, position);

      const actualPosition = isPosition ? position : position.position;

      if (!_classStaticPrivateMethodGet(this, AnimationGroupAPI, _isPosition).call(this, actualPosition)) {
        console.warn(`AnimationGroupAPI.getScheduled warning: No Position instance found.`);
        return results;
      }

      const controls = AnimationManager.getScheduled(actualPosition);
      results.push({
        position: actualPosition,
        data: isPosition ? void 0 : position,
        controls
      });
    }

    return results;
  }
  /**
   * Provides the `from` animation tween for one or more Position instances as a group.
   *
   * @param {Position|{position: Position}|Iterable<Position>|Iterable<{position: Position}>} position -
   *
   * @param {object|Function}   fromData -
   *
   * @param {object|Function}   options -
   *
   * @returns {TJSBasicAnimation} Basic animation control.
   */


  static from(position, fromData, options) {
    if (!isObject(fromData) && typeof fromData !== 'function') {
      throw new TypeError(`AnimationGroupAPI.from error: 'fromData' is not an object or function.`);
    }

    if (options !== void 0 && !isObject(options) && typeof options !== 'function') {
      throw new TypeError(`AnimationGroupAPI.from error: 'options' is not an object or function.`);
    }
    /**
     * @type {AnimationControl[]}
     */


    const animationControls = [];
    let index = -1;
    let callbackOptions;
    const hasDataCallback = typeof fromData === 'function';
    const hasOptionCallback = typeof options === 'function';
    const hasCallback = hasDataCallback || hasOptionCallback;

    if (hasCallback) {
      callbackOptions = {
        index,
        position: void 0,
        data: void 0
      };
    }

    let actualFromData = fromData;
    let actualOptions = options;

    if (isIterable(position)) {
      for (const entry of position) {
        index++;

        const isPosition = _classStaticPrivateMethodGet(this, AnimationGroupAPI, _isPosition).call(this, entry);

        const actualPosition = isPosition ? entry : entry.position;

        if (!_classStaticPrivateMethodGet(this, AnimationGroupAPI, _isPosition).call(this, actualPosition)) {
          console.warn(`AnimationGroupAPI.from warning: No Position instance found at index: ${index}.`);
          continue;
        }

        if (hasCallback) {
          callbackOptions.index = index;
          callbackOptions.position = position;
          callbackOptions.data = isPosition ? void 0 : entry;
        }

        if (hasDataCallback) {
          actualFromData = fromData(callbackOptions); // Returned data from callback is null / undefined, so skip this position instance.

          if (actualFromData === null || actualFromData === void 0) {
            continue;
          }

          if (typeof actualFromData !== 'object') {
            throw new TypeError(`AnimationGroupAPI.from error: fromData callback function iteration(${index}) failed to return an object.`);
          }
        }

        if (hasOptionCallback) {
          actualOptions = options(callbackOptions); // Returned data from callback is null / undefined, so skip this position instance.

          if (actualOptions === null || actualOptions === void 0) {
            continue;
          }

          if (typeof actualOptions !== 'object') {
            throw new TypeError(`AnimationGroupAPI.from error: options callback function iteration(${index}) failed to return an object.`);
          }
        }

        animationControls.push(actualPosition.animate.from(actualFromData, actualOptions));
      }
    } else {
      const isPosition = _classStaticPrivateMethodGet(this, AnimationGroupAPI, _isPosition).call(this, position);

      const actualPosition = isPosition ? position : position.position;

      if (!_classStaticPrivateMethodGet(this, AnimationGroupAPI, _isPosition).call(this, actualPosition)) {
        console.warn(`AnimationGroupAPI.from warning: No Position instance found.`);
        return AnimationGroupControl.voidControl;
      }

      if (hasCallback) {
        callbackOptions.index = 0;
        callbackOptions.position = position;
        callbackOptions.data = isPosition ? void 0 : position;
      }

      if (hasDataCallback) {
        actualFromData = fromData(callbackOptions);

        if (typeof actualFromData !== 'object') {
          throw new TypeError(`AnimationGroupAPI.from error: fromData callback function failed to return an object.`);
        }
      }

      if (hasOptionCallback) {
        actualOptions = options(callbackOptions);

        if (typeof actualOptions !== 'object') {
          throw new TypeError(`AnimationGroupAPI.from error: options callback function failed to return an object.`);
        }
      }

      animationControls.push(actualPosition.animate.from(actualFromData, actualOptions));
    }

    return new AnimationGroupControl(animationControls);
  }
  /**
   * Provides the `fromTo` animation tween for one or more Position instances as a group.
   *
   * @param {Position|{position: Position}|Iterable<Position>|Iterable<{position: Position}>} position -
   *
   * @param {object|Function}   fromData -
   *
   * @param {object|Function}   toData -
   *
   * @param {object|Function}   options -
   *
   * @returns {TJSBasicAnimation} Basic animation control.
   */


  static fromTo(position, fromData, toData, options) {
    if (!isObject(fromData) && typeof fromData !== 'function') {
      throw new TypeError(`AnimationGroupAPI.fromTo error: 'fromData' is not an object or function.`);
    }

    if (!isObject(toData) && typeof toData !== 'function') {
      throw new TypeError(`AnimationGroupAPI.fromTo error: 'toData' is not an object or function.`);
    }

    if (options !== void 0 && !isObject(options) && typeof options !== 'function') {
      throw new TypeError(`AnimationGroupAPI.fromTo error: 'options' is not an object or function.`);
    }
    /**
     * @type {AnimationControl[]}
     */


    const animationControls = [];
    let index = -1;
    let callbackOptions;
    const hasFromCallback = typeof fromData === 'function';
    const hasToCallback = typeof toData === 'function';
    const hasOptionCallback = typeof options === 'function';
    const hasCallback = hasFromCallback || hasToCallback || hasOptionCallback;

    if (hasCallback) {
      callbackOptions = {
        index,
        position: void 0,
        data: void 0
      };
    }

    let actualFromData = fromData;
    let actualToData = toData;
    let actualOptions = options;

    if (isIterable(position)) {
      for (const entry of position) {
        index++;

        const isPosition = _classStaticPrivateMethodGet(this, AnimationGroupAPI, _isPosition).call(this, entry);

        const actualPosition = isPosition ? entry : entry.position;

        if (!_classStaticPrivateMethodGet(this, AnimationGroupAPI, _isPosition).call(this, actualPosition)) {
          console.warn(`AnimationGroupAPI.fromTo warning: No Position instance found at index: ${index}.`);
          continue;
        }

        if (hasCallback) {
          callbackOptions.index = index;
          callbackOptions.position = position;
          callbackOptions.data = isPosition ? void 0 : entry;
        }

        if (hasFromCallback) {
          actualFromData = fromData(callbackOptions); // Returned data from callback is null / undefined, so skip this position instance.

          if (actualFromData === null || actualFromData === void 0) {
            continue;
          }

          if (typeof actualFromData !== 'object') {
            throw new TypeError(`AnimationGroupAPI.fromTo error: fromData callback function iteration(${index}) failed to return an object.`);
          }
        }

        if (hasToCallback) {
          actualToData = toData(callbackOptions); // Returned data from callback is null / undefined, so skip this position instance.

          if (actualToData === null || actualToData === void 0) {
            continue;
          }

          if (typeof actualToData !== 'object') {
            throw new TypeError(`AnimationGroupAPI.fromTo error: toData callback function iteration(${index}) failed to return an object.`);
          }
        }

        if (hasOptionCallback) {
          actualOptions = options(callbackOptions); // Returned data from callback is null / undefined, so skip this position instance.

          if (actualOptions === null || actualOptions === void 0) {
            continue;
          }

          if (typeof actualOptions !== 'object') {
            throw new TypeError(`AnimationGroupAPI.fromTo error: options callback function iteration(${index}) failed to return an object.`);
          }
        }

        animationControls.push(actualPosition.animate.fromTo(actualFromData, actualToData, actualOptions));
      }
    } else {
      const isPosition = _classStaticPrivateMethodGet(this, AnimationGroupAPI, _isPosition).call(this, position);

      const actualPosition = isPosition ? position : position.position;

      if (!_classStaticPrivateMethodGet(this, AnimationGroupAPI, _isPosition).call(this, actualPosition)) {
        console.warn(`AnimationGroupAPI.fromTo warning: No Position instance found.`);
        return AnimationGroupControl.voidControl;
      }

      if (hasCallback) {
        callbackOptions.index = 0;
        callbackOptions.position = position;
        callbackOptions.data = isPosition ? void 0 : position;
      }

      if (hasFromCallback) {
        actualFromData = fromData(callbackOptions);

        if (typeof actualFromData !== 'object') {
          throw new TypeError(`AnimationGroupAPI.fromTo error: fromData callback function failed to return an object.`);
        }
      }

      if (hasToCallback) {
        actualToData = toData(callbackOptions);

        if (typeof actualToData !== 'object') {
          throw new TypeError(`AnimationGroupAPI.fromTo error: toData callback function failed to return an object.`);
        }
      }

      if (hasOptionCallback) {
        actualOptions = options(callbackOptions);

        if (typeof actualOptions !== 'object') {
          throw new TypeError(`AnimationGroupAPI.fromTo error: options callback function failed to return an object.`);
        }
      }

      animationControls.push(actualPosition.animate.fromTo(actualFromData, actualToData, actualOptions));
    }

    return new AnimationGroupControl(animationControls);
  }
  /**
   * Provides the `to` animation tween for one or more Position instances as a group.
   *
   * @param {Position|{position: Position}|Iterable<Position>|Iterable<{position: Position}>} position -
   *
   * @param {object|Function}   toData -
   *
   * @param {object|Function}   options -
   *
   * @returns {TJSBasicAnimation} Basic animation control.
   */


  static to(position, toData, options) {
    if (!isObject(toData) && typeof toData !== 'function') {
      throw new TypeError(`AnimationGroupAPI.to error: 'toData' is not an object or function.`);
    }

    if (options !== void 0 && !isObject(options) && typeof options !== 'function') {
      throw new TypeError(`AnimationGroupAPI.to error: 'options' is not an object or function.`);
    }
    /**
     * @type {AnimationControl[]}
     */


    const animationControls = [];
    let index = -1;
    let callbackOptions;
    const hasDataCallback = typeof toData === 'function';
    const hasOptionCallback = typeof options === 'function';
    const hasCallback = hasDataCallback || hasOptionCallback;

    if (hasCallback) {
      callbackOptions = {
        index,
        position: void 0,
        data: void 0
      };
    }

    let actualToData = toData;
    let actualOptions = options;

    if (isIterable(position)) {
      for (const entry of position) {
        index++;

        const isPosition = _classStaticPrivateMethodGet(this, AnimationGroupAPI, _isPosition).call(this, entry);

        const actualPosition = isPosition ? entry : entry.position;

        if (!_classStaticPrivateMethodGet(this, AnimationGroupAPI, _isPosition).call(this, actualPosition)) {
          console.warn(`AnimationGroupAPI.to warning: No Position instance found at index: ${index}.`);
          continue;
        }

        if (hasCallback) {
          callbackOptions.index = index;
          callbackOptions.position = position;
          callbackOptions.data = isPosition ? void 0 : entry;
        }

        if (hasDataCallback) {
          actualToData = toData(callbackOptions); // Returned data from callback is null / undefined, so skip this position instance.

          if (actualToData === null || actualToData === void 0) {
            continue;
          }

          if (typeof actualToData !== 'object') {
            throw new TypeError(`AnimationGroupAPI.to error: toData callback function iteration(${index}) failed to return an object.`);
          }
        }

        if (hasOptionCallback) {
          actualOptions = options(callbackOptions); // Returned data from callback is null / undefined, so skip this position instance.

          if (actualOptions === null || actualOptions === void 0) {
            continue;
          }

          if (typeof actualOptions !== 'object') {
            throw new TypeError(`AnimationGroupAPI.to error: options callback function iteration(${index}) failed to return an object.`);
          }
        }

        animationControls.push(actualPosition.animate.to(actualToData, actualOptions));
      }
    } else {
      const isPosition = _classStaticPrivateMethodGet(this, AnimationGroupAPI, _isPosition).call(this, position);

      const actualPosition = isPosition ? position : position.position;

      if (!_classStaticPrivateMethodGet(this, AnimationGroupAPI, _isPosition).call(this, actualPosition)) {
        console.warn(`AnimationGroupAPI.to warning: No Position instance found.`);
        return AnimationGroupControl.voidControl;
      }

      if (hasCallback) {
        callbackOptions.index = 0;
        callbackOptions.position = position;
        callbackOptions.data = isPosition ? void 0 : position;
      }

      if (hasDataCallback) {
        actualToData = toData(callbackOptions);

        if (typeof actualToData !== 'object') {
          throw new TypeError(`AnimationGroupAPI.to error: toData callback function failed to return an object.`);
        }
      }

      if (hasOptionCallback) {
        actualOptions = options(callbackOptions);

        if (typeof actualOptions !== 'object') {
          throw new TypeError(`AnimationGroupAPI.to error: options callback function failed to return an object.`);
        }
      }

      animationControls.push(actualPosition.animate.to(actualToData, actualOptions));
    }

    return new AnimationGroupControl(animationControls);
  }
  /**
   * Provides the `to` animation tween for one or more Position instances as a group.
   *
   * @param {Position|{position: Position}|Iterable<Position>|Iterable<{position: Position}>} position -
   *
   * @param {Iterable<string>}  keys -
   *
   * @param {object|Function}   options -
   *
   * @returns {quickToCallback} Basic animation control.
   */


  static quickTo(position, keys, options) {
    if (!isIterable(keys)) {
      throw new TypeError(`AnimationGroupAPI.quickTo error: 'keys' is not an iterable list.`);
    }

    if (options !== void 0 && !isObject(options) && typeof options !== 'function') {
      throw new TypeError(`AnimationGroupAPI.quickTo error: 'options' is not an object or function.`);
    }
    /**
     * @type {quickToCallback[]}
     */


    const quickToCallbacks = [];
    let index = -1;
    const hasOptionCallback = typeof options === 'function';
    const callbackOptions = {
      index,
      position: void 0,
      data: void 0
    };
    let actualOptions = options;

    if (isIterable(position)) {
      for (const entry of position) {
        index++;

        const isPosition = _classStaticPrivateMethodGet(this, AnimationGroupAPI, _isPosition).call(this, entry);

        const actualPosition = isPosition ? entry : entry.position;

        if (!_classStaticPrivateMethodGet(this, AnimationGroupAPI, _isPosition).call(this, actualPosition)) {
          console.warn(`AnimationGroupAPI.quickTo warning: No Position instance found at index: ${index}.`);
          continue;
        }

        callbackOptions.index = index;
        callbackOptions.position = position;
        callbackOptions.data = isPosition ? void 0 : entry;

        if (hasOptionCallback) {
          actualOptions = options(callbackOptions); // Returned data from callback is null / undefined, so skip this position instance.

          if (actualOptions === null || actualOptions === void 0) {
            continue;
          }

          if (typeof actualOptions !== 'object') {
            throw new TypeError(`AnimationGroupAPI.quickTo error: options callback function iteration(${index}) failed to return an object.`);
          }
        }

        quickToCallbacks.push(actualPosition.animate.quickTo(keys, actualOptions));
      }
    } else {
      const isPosition = _classStaticPrivateMethodGet(this, AnimationGroupAPI, _isPosition).call(this, position);

      const actualPosition = isPosition ? position : position.position;

      if (!_classStaticPrivateMethodGet(this, AnimationGroupAPI, _isPosition).call(this, actualPosition)) {
        console.warn(`AnimationGroupAPI.quickTo warning: No Position instance found.`);
        return () => null;
      }

      callbackOptions.index = 0;
      callbackOptions.position = position;
      callbackOptions.data = isPosition ? void 0 : position;

      if (hasOptionCallback) {
        actualOptions = options(callbackOptions);

        if (typeof actualOptions !== 'object') {
          throw new TypeError(`AnimationGroupAPI.quickTo error: options callback function failed to return an object.`);
        }
      }

      quickToCallbacks.push(actualPosition.animate.quickTo(keys, actualOptions));
    }

    const keysArray = [...keys];
    Object.freeze(keysArray);

    const quickToCB = (...args) => {
      const argsLength = args.length;

      if (argsLength === 0) {
        return;
      }

      if (typeof args[0] === 'function') {
        const dataCallback = args[0];
        index = -1;
        let cntr = 0;

        if (isIterable(position)) {
          for (const entry of position) {
            index++;

            const isPosition = _classStaticPrivateMethodGet(this, AnimationGroupAPI, _isPosition).call(this, entry);

            const actualPosition = isPosition ? entry : entry.position;

            if (!_classStaticPrivateMethodGet(this, AnimationGroupAPI, _isPosition).call(this, actualPosition)) {
              continue;
            }

            callbackOptions.index = index;
            callbackOptions.position = position;
            callbackOptions.data = isPosition ? void 0 : entry;
            const toData = dataCallback(callbackOptions); // Returned data from callback is null / undefined, so skip this position instance.

            if (toData === null || toData === void 0) {
              continue;
            }
            /**
             * @type {boolean}
             */


            const toDataIterable = isIterable(toData);

            if (!Number.isFinite(toData) && !toDataIterable && typeof toData !== 'object') {
              throw new TypeError(`AnimationGroupAPI.quickTo error: toData callback function iteration(${index}) failed to return a finite number, iterable list, or object.`);
            }

            if (toDataIterable) {
              quickToCallbacks[cntr++](...toData);
            } else {
              quickToCallbacks[cntr++](toData);
            }
          }
        } else {
          const isPosition = _classStaticPrivateMethodGet(this, AnimationGroupAPI, _isPosition).call(this, position);

          const actualPosition = isPosition ? position : position.position;

          if (!_classStaticPrivateMethodGet(this, AnimationGroupAPI, _isPosition).call(this, actualPosition)) {
            return;
          }

          callbackOptions.index = 0;
          callbackOptions.position = position;
          callbackOptions.data = isPosition ? void 0 : position;
          const toData = dataCallback(callbackOptions); // Returned data from callback is null / undefined, so skip this position instance.

          if (toData === null || toData === void 0) {
            return;
          }

          const toDataIterable = isIterable(toData);

          if (!Number.isFinite(toData) && !toDataIterable && typeof toData !== 'object') {
            throw new TypeError(`AnimationGroupAPI.quickTo error: toData callback function iteration(${index}) failed to return a finite number, iterable list, or object.`);
          }

          if (toDataIterable) {
            quickToCallbacks[cntr++](...toData);
          } else {
            quickToCallbacks[cntr++](toData);
          }
        }
      } else {
        for (let cntr = quickToCallbacks.length; --cntr >= 0;) {
          quickToCallbacks[cntr](...args);
        }
      }
    };

    quickToCB.keys = keysArray;
    /**
     * Sets options of quickTo tween.
     *
     * @param {object|Function}   [options] - Optional parameters.
     *
     * @param {number}            [options.duration] - Duration in seconds.
     *
     * @param {Function}          [options.ease] - Easing function.
     *
     * @param {Function}          [options.interpolate] - Interpolation function.
     *
     * @returns {quickToCallback} The quickTo callback.
     */

    quickToCB.options = options => // eslint-disable-line no-shadow
    {
      if (options !== void 0 && !isObject(options) && typeof options !== 'function') {
        throw new TypeError(`AnimationGroupAPI.quickTo error: 'options' is not an object or function.`);
      } // Set options object for each quickTo callback.


      if (isObject(options)) {
        for (let cntr = quickToCallbacks.length; --cntr >= 0;) {
          quickToCallbacks[cntr].options(options);
        }
      } else if (typeof options === 'function') {
        if (isIterable(position)) {
          index = -1;
          let cntr = 0;

          for (const entry of position) {
            index++;

            const isPosition = _classStaticPrivateMethodGet(this, AnimationGroupAPI, _isPosition).call(this, entry);

            const actualPosition = isPosition ? entry : entry.position;

            if (!_classStaticPrivateMethodGet(this, AnimationGroupAPI, _isPosition).call(this, actualPosition)) {
              console.warn(`AnimationGroupAPI.quickTo.options warning: No Position instance found at index: ${index}.`);
              continue;
            }

            callbackOptions.index = index;
            callbackOptions.position = position;
            callbackOptions.data = isPosition ? void 0 : entry;
            actualOptions = options(callbackOptions); // Returned data from callback is null / undefined, so skip this position instance.

            if (actualOptions === null || actualOptions === void 0) {
              continue;
            }

            if (typeof actualOptions !== 'object') {
              throw new TypeError(`AnimationGroupAPI.quickTo.options error: options callback function iteration(${index}) failed to return an object.`);
            }

            quickToCallbacks[cntr++].options(actualOptions);
          }
        } else {
          const isPosition = _classStaticPrivateMethodGet(this, AnimationGroupAPI, _isPosition).call(this, position);

          const actualPosition = isPosition ? position : position.position;

          if (!_classStaticPrivateMethodGet(this, AnimationGroupAPI, _isPosition).call(this, actualPosition)) {
            console.warn(`AnimationGroupAPI.quickTo.options warning: No Position instance found.`);
            return quickToCB;
          }

          callbackOptions.index = 0;
          callbackOptions.position = position;
          callbackOptions.data = isPosition ? void 0 : position;
          actualOptions = options(callbackOptions);

          if (typeof actualOptions !== 'object') {
            throw new TypeError(`AnimationGroupAPI.quickTo error: options callback function failed to return an object.`);
          }

          quickToCallbacks[0].options(actualOptions);
        }
      }

      return quickToCB;
    };

    return quickToCB;
  }

}

function _isPosition(object) {
  return object !== null && typeof object === 'object' && object.animate instanceof AnimationAPI;
}

var _element$2 = /*#__PURE__*/new WeakMap();

var _height$2 = /*#__PURE__*/new WeakMap();

var _lock$2 = /*#__PURE__*/new WeakMap();

var _width$2 = /*#__PURE__*/new WeakMap();

class Centered {
  /**
   * @type {HTMLElement}
   */

  /**
   * Provides a manual setting of the element height. As things go `offsetHeight` causes a browser layout and is not
   * performance oriented. If manually set this height is used instead of `offsetHeight`.
   *
   * @type {number}
   */

  /**
   * Set from an optional value in the constructor to lock accessors preventing modification.
   */

  /**
   * Provides a manual setting of the element width. As things go `offsetWidth` causes a browser layout and is not
   * performance oriented. If manually set this width is used instead of `offsetWidth`.
   *
   * @type {number}
   */
  constructor({
    element,
    lock = false,
    width,
    height
  } = {}) {
    _classPrivateFieldInitSpec(this, _element$2, {
      writable: true,
      value: void 0
    });

    _classPrivateFieldInitSpec(this, _height$2, {
      writable: true,
      value: void 0
    });

    _classPrivateFieldInitSpec(this, _lock$2, {
      writable: true,
      value: void 0
    });

    _classPrivateFieldInitSpec(this, _width$2, {
      writable: true,
      value: void 0
    });

    this.element = element;
    this.width = width;
    this.height = height;

    _classPrivateFieldSet(this, _lock$2, typeof lock === 'boolean' ? lock : false);
  }

  get element() {
    return _classPrivateFieldGet(this, _element$2);
  }

  get height() {
    return _classPrivateFieldGet(this, _height$2);
  }

  get width() {
    return _classPrivateFieldGet(this, _width$2);
  }

  set element(element) {
    if (_classPrivateFieldGet(this, _lock$2)) {
      return;
    }

    if (element === void 0 || element === null || element instanceof HTMLElement) {
      _classPrivateFieldSet(this, _element$2, element);
    } else {
      throw new TypeError(`'element' is not a HTMLElement, undefined, or null.`);
    }
  }

  set height(height) {
    if (_classPrivateFieldGet(this, _lock$2)) {
      return;
    }

    if (height === void 0 || Number.isFinite(height)) {
      _classPrivateFieldSet(this, _height$2, height);
    } else {
      throw new TypeError(`'height' is not a finite number or undefined.`);
    }
  }

  set width(width) {
    if (_classPrivateFieldGet(this, _lock$2)) {
      return;
    }

    if (width === void 0 || Number.isFinite(width)) {
      _classPrivateFieldSet(this, _width$2, width);
    } else {
      throw new TypeError(`'width' is not a finite number or undefined.`);
    }
  }

  setDimension(width, height) {
    if (_classPrivateFieldGet(this, _lock$2)) {
      return;
    }

    if (width === void 0 || Number.isFinite(width)) {
      _classPrivateFieldSet(this, _width$2, width);
    } else {
      throw new TypeError(`'width' is not a finite number or undefined.`);
    }

    if (height === void 0 || Number.isFinite(height)) {
      _classPrivateFieldSet(this, _height$2, height);
    } else {
      throw new TypeError(`'height' is not a finite number or undefined.`);
    }
  }

  getLeft(width) {
    var _ref, _classPrivateFieldGet2, _classPrivateFieldGet3;

    // Determine containing bounds from manual values; or any element; lastly the browser width / height.
    const boundsWidth = (_ref = (_classPrivateFieldGet2 = _classPrivateFieldGet(this, _width$2)) !== null && _classPrivateFieldGet2 !== void 0 ? _classPrivateFieldGet2 : (_classPrivateFieldGet3 = _classPrivateFieldGet(this, _element$2)) === null || _classPrivateFieldGet3 === void 0 ? void 0 : _classPrivateFieldGet3.offsetWidth) !== null && _ref !== void 0 ? _ref : globalThis.innerWidth;
    return (boundsWidth - width) / 2;
  }

  getTop(height) {
    var _ref2, _classPrivateFieldGet4, _classPrivateFieldGet5;

    const boundsHeight = (_ref2 = (_classPrivateFieldGet4 = _classPrivateFieldGet(this, _height$2)) !== null && _classPrivateFieldGet4 !== void 0 ? _classPrivateFieldGet4 : (_classPrivateFieldGet5 = _classPrivateFieldGet(this, _element$2)) === null || _classPrivateFieldGet5 === void 0 ? void 0 : _classPrivateFieldGet5.offsetHeight) !== null && _ref2 !== void 0 ? _ref2 : globalThis.innerHeight;
    return (boundsHeight - height) / 2;
  }

}

const browserCentered = new Centered();

var positionInitial = /*#__PURE__*/Object.freeze({
  __proto__: null,
  browserCentered: browserCentered,
  Centered: Centered
});

class PositionChangeSet {
  constructor() {
    this.left = false;
    this.top = false;
    this.width = false;
    this.height = false;
    this.maxHeight = false;
    this.maxWidth = false;
    this.minHeight = false;
    this.minWidth = false;
    this.zIndex = false;
    this.transform = false;
    this.transformOrigin = false;
  }

  hasChange() {
    return this.left || this.top || this.width || this.height || this.maxHeight || this.maxWidth || this.minHeight || this.minWidth || this.zIndex || this.transform || this.transformOrigin;
  }

  set(value) {
    this.left = value;
    this.top = value;
    this.width = value;
    this.height = value;
    this.maxHeight = value;
    this.maxWidth = value;
    this.minHeight = value;
    this.minWidth = value;
    this.zIndex = value;
    this.transform = value;
    this.transformOrigin = value;
  }

}

/**
 * Defines stored positional data.
 */
class PositionData {
  constructor({
    height = null,
    left = null,
    maxHeight = null,
    maxWidth = null,
    minHeight = null,
    minWidth = null,
    rotateX = null,
    rotateY = null,
    rotateZ = null,
    scale = null,
    translateX = null,
    translateY = null,
    translateZ = null,
    top = null,
    transformOrigin = null,
    width = null,
    zIndex = null
  } = {}) {
    /**
     * @type {number|'auto'|'inherit'|null}
     */
    this.height = height;
    /**
     * @type {number|null}
     */

    this.left = left;
    /**
     * @type {number|null}
     */

    this.maxHeight = maxHeight;
    /**
     * @type {number|null}
     */

    this.maxWidth = maxWidth;
    /**
     * @type {number|null}
     */

    this.minHeight = minHeight;
    /**
     * @type {number|null}
     */

    this.minWidth = minWidth;
    /**
     * @type {number|null}
     */

    this.rotateX = rotateX;
    /**
     * @type {number|null}
     */

    this.rotateY = rotateY;
    /**
     * @type {number|null}
     */

    this.rotateZ = rotateZ;
    /**
     * @type {number|null}
     */

    this.scale = scale;
    /**
     * @type {number|null}
     */

    this.top = top;
    /**
     * @type {string|null}
     */

    this.transformOrigin = transformOrigin;
    /**
     * @type {number|null}
     */

    this.translateX = translateX;
    /**
     * @type {number|null}
     */

    this.translateY = translateY;
    /**
     * @type {number|null}
     */

    this.translateZ = translateZ;
    /**
     * @type {number|'auto'|'inherit'|null}
     */

    this.width = width;
    /**
     * @type {number|null}
     */

    this.zIndex = zIndex;
    Object.seal(this);
  }
  /**
   * Copies given data to this instance.
   *
   * @param {PositionData}   data - Copy from this instance.
   *
   * @returns {PositionData} This instance.
   */


  copy(data) {
    this.height = data.height;
    this.left = data.left;
    this.maxHeight = data.maxHeight;
    this.maxWidth = data.maxWidth;
    this.minHeight = data.minHeight;
    this.minWidth = data.minWidth;
    this.rotateX = data.rotateX;
    this.rotateY = data.rotateY;
    this.rotateZ = data.rotateZ;
    this.scale = data.scale;
    this.top = data.top;
    this.transformOrigin = data.transformOrigin;
    this.translateX = data.translateX;
    this.translateY = data.translateY;
    this.translateZ = data.translateZ;
    this.width = data.width;
    this.zIndex = data.zIndex;
    return this;
  }

}

const _excluded$2 = ["name"],
      _excluded2 = ["name"];

var _data$2 = /*#__PURE__*/new WeakMap();

var _dataSaved$1 = /*#__PURE__*/new WeakMap();

var _position$1 = /*#__PURE__*/new WeakMap();

var _transforms$1 = /*#__PURE__*/new WeakMap();

class PositionStateAPI {
  /** @type {PositionData} */

  /**
   * @type {Map<string, PositionDataExtended>}
   */

  /** @type {Position} */

  /** @type {Transforms} */
  constructor(position, data, transforms) {
    _classPrivateFieldInitSpec(this, _data$2, {
      writable: true,
      value: void 0
    });

    _classPrivateFieldInitSpec(this, _dataSaved$1, {
      writable: true,
      value: new Map()
    });

    _classPrivateFieldInitSpec(this, _position$1, {
      writable: true,
      value: void 0
    });

    _classPrivateFieldInitSpec(this, _transforms$1, {
      writable: true,
      value: void 0
    });

    _classPrivateFieldSet(this, _position$1, position);

    _classPrivateFieldSet(this, _data$2, data);

    _classPrivateFieldSet(this, _transforms$1, transforms);
  }
  /**
   * Returns any stored save state by name.
   *
   * @param {string}   name - Saved data set name.
   *
   * @returns {PositionDataExtended} The saved data set.
   */


  get({
    name
  }) {
    if (typeof name !== 'string') {
      throw new TypeError(`Position - getSave error: 'name' is not a string.`);
    }

    return _classPrivateFieldGet(this, _dataSaved$1).get(name);
  }
  /**
   * Returns any associated default data.
   *
   * @returns {PositionDataExtended} Associated default data.
   */


  getDefault() {
    return _classPrivateFieldGet(this, _dataSaved$1).get('#defaultData');
  }
  /**
   * Removes and returns any position state by name.
   *
   * @param {object}   options - Options.
   *
   * @param {string}   options.name - Name to remove and retrieve.
   *
   * @returns {PositionDataExtended} Saved position data.
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
   * Resets data to default values and invokes set.
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

    const defaultData = _classPrivateFieldGet(this, _dataSaved$1).get('#defaultData'); // Quit early if there is no saved default data.


    if (typeof defaultData !== 'object') {
      return false;
    } // Cancel all animations for Position if there are currently any scheduled.


    if (_classPrivateFieldGet(this, _position$1).animate.isScheduled) {
      _classPrivateFieldGet(this, _position$1).animate.cancel();
    }

    const zIndex = _classPrivateFieldGet(this, _position$1).zIndex;

    const data = Object.assign({}, defaultData);

    if (keepZIndex) {
      data.zIndex = zIndex;
    } // Reset the transform data.


    _classPrivateFieldGet(this, _transforms$1).reset(data); // If current minimized invoke `maximize`.


    if ((_classPrivateFieldGet2 = _classPrivateFieldGet(this, _position$1).parent) !== null && _classPrivateFieldGet2 !== void 0 && (_classPrivateFieldGet3 = _classPrivateFieldGet2.reactive) !== null && _classPrivateFieldGet3 !== void 0 && _classPrivateFieldGet3.minimized) {
      var _classPrivateFieldGet4, _classPrivateFieldGet5;

      (_classPrivateFieldGet4 = _classPrivateFieldGet(this, _position$1).parent) === null || _classPrivateFieldGet4 === void 0 ? void 0 : (_classPrivateFieldGet5 = _classPrivateFieldGet4.maximize) === null || _classPrivateFieldGet5 === void 0 ? void 0 : _classPrivateFieldGet5.call(_classPrivateFieldGet4, {
        animate: false,
        duration: 0
      });
    } // Note next clock tick scheduling.


    if (invokeSet) {
      setTimeout(() => _classPrivateFieldGet(this, _position$1).set(data), 0);
    }

    return true;
  }
  /**
   * Restores a saved positional state returning the data. Several optional parameters are available
   * to control whether the restore action occurs silently (no store / inline styles updates), animates
   * to the stored data, or simply sets the stored data. Restoring via {@link AnimationAPI.to} allows
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
   * @param {number}            [params.duration=0.1] - Duration in seconds.
   *
   * @param {Function}          [params.ease=linear] - Easing function.
   *
   * @param {Function}          [params.interpolate=lerp] - Interpolation function.
   *
   * @returns {PositionDataExtended|Promise<PositionDataExtended>} Saved position data.
   */


  restore({
    name,
    remove = false,
    properties,
    silent = false,
    async = false,
    animateTo = false,
    duration = 0.1,
    ease = identity,
    interpolate = lerp$5
  }) {
    if (typeof name !== 'string') {
      throw new TypeError(`Position - restore error: 'name' is not a string.`);
    }

    const dataSaved = _classPrivateFieldGet(this, _dataSaved$1).get(name);

    if (dataSaved) {
      if (remove) {
        _classPrivateFieldGet(this, _dataSaved$1).delete(name);
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
          _classPrivateFieldGet(this, _data$2)[property] = data[property];
        }

        return dataSaved;
      } else if (animateTo) // Animate to saved data.
        {
          // Provide special handling to potentially change transform origin as this parameter is not animated.
          if (data.transformOrigin !== _classPrivateFieldGet(this, _position$1).transformOrigin) {
            _classPrivateFieldGet(this, _position$1).transformOrigin = data.transformOrigin;
          } // Return a Promise with saved data that resolves after animation ends.


          if (async) {
            return _classPrivateFieldGet(this, _position$1).animate.to(data, {
              duration,
              ease,
              interpolate
            }).finished.then(() => dataSaved);
          } else // Animate synchronously.
            {
              _classPrivateFieldGet(this, _position$1).animate.to(data, {
                duration,
                ease,
                interpolate
              });
            }
        } else {
        // Default options is to set data for an immediate update.
        _classPrivateFieldGet(this, _position$1).set(data);
      }
    }

    return dataSaved;
  }
  /**
   * Saves current position state with the opportunity to add extra data to the saved state.
   *
   * @param {object}   opts - Options.
   *
   * @param {string}   opts.name - name to index this saved data.
   *
   * @param {...*}     [opts.extra] - Extra data to add to saved data.
   *
   * @returns {PositionData} Current position data
   */


  save(_ref) {
    let {
      name
    } = _ref,
        extra = _objectWithoutProperties(_ref, _excluded$2);

    if (typeof name !== 'string') {
      throw new TypeError(`Position - save error: 'name' is not a string.`);
    }

    const data = _classPrivateFieldGet(this, _position$1).get(extra);

    _classPrivateFieldGet(this, _dataSaved$1).set(name, data);

    return data;
  }
  /**
   * Directly sets a position state.
   *
   * @param {object}   opts - Options.
   *
   * @param {string}   opts.name - name to index this saved data.
   *
   * @param {...*}     [opts.data] - Position data to set.
   */


  set(_ref2) {
    let {
      name
    } = _ref2,
        data = _objectWithoutProperties(_ref2, _excluded2);

    if (typeof name !== 'string') {
      throw new TypeError(`Position - set error: 'name' is not a string.`);
    }

    _classPrivateFieldGet(this, _dataSaved$1).set(name, data);
  }

}

class StyleCache {
  constructor() {
    /** @type {HTMLElement|undefined} */
    this.el = void 0;
    /** @type {CSSStyleDeclaration} */

    this.computed = void 0;
    /** @type {number|undefined} */

    this.marginLeft = void 0;
    /** @type {number|undefined} */

    this.marginTop = void 0;
    /** @type {number|undefined} */

    this.maxHeight = void 0;
    /** @type {number|undefined} */

    this.maxWidth = void 0;
    /** @type {number|undefined} */

    this.minHeight = void 0;
    /** @type {number|undefined} */

    this.minWidth = void 0;
    /** @type {boolean} */

    this.hasWillChange = false;
    /**
     * @type {ResizeObserverData}
     */

    this.resizeObserved = {
      contentHeight: void 0,
      contentWidth: void 0,
      offsetHeight: void 0,
      offsetWidth: void 0
    };
    /**
     * Provides a writable store to track offset & content width / height from an associated `resizeObserver` action.
     *
     * @type {Writable<ResizeObserverData>}
     */

    const storeResizeObserved = writable(this.resizeObserved);
    this.stores = {
      element: writable(this.el),
      resizeContentHeight: propertyStore(storeResizeObserved, 'contentHeight'),
      resizeContentWidth: propertyStore(storeResizeObserved, 'contentWidth'),
      resizeObserved: storeResizeObserved,
      resizeOffsetHeight: propertyStore(storeResizeObserved, 'offsetHeight'),
      resizeOffsetWidth: propertyStore(storeResizeObserved, 'offsetWidth')
    };
  }
  /**
   * Returns the cached offsetHeight from any attached `resizeObserver` action otherwise gets the offsetHeight from
   * the element directly. The more optimized path is using `resizeObserver` as getting it from the element
   * directly is more expensive and alters the execution order of an animation frame.
   *
   * @returns {number} The element offsetHeight.
   */


  get offsetHeight() {
    if (this.el instanceof HTMLElement) {
      return this.resizeObserved.offsetHeight !== void 0 ? this.resizeObserved.offsetHeight : this.el.offsetHeight;
    }

    throw new Error(`StyleCache - get offsetHeight error: no element assigned.`);
  }
  /**
   * Returns the cached offsetWidth from any attached `resizeObserver` action otherwise gets the offsetWidth from
   * the element directly. The more optimized path is using `resizeObserver` as getting it from the element
   * directly is more expensive and alters the execution order of an animation frame.
   *
   * @returns {number} The element offsetHeight.
   */


  get offsetWidth() {
    if (this.el instanceof HTMLElement) {
      return this.resizeObserved.offsetWidth !== void 0 ? this.resizeObserved.offsetWidth : this.el.offsetWidth;
    }

    throw new Error(`StyleCache - get offsetWidth error: no element assigned.`);
  }
  /**
   * @param {HTMLElement} el -
   *
   * @returns {boolean} Does element match cached element.
   */


  hasData(el) {
    return this.el === el;
  }
  /**
   * Resets the style cache.
   */


  reset() {
    // Remove will-change inline style from previous element if it is still connected.
    if (this.el instanceof HTMLElement && this.el.isConnected && !this.hasWillChange) {
      this.el.style.willChange = null;
    }

    this.el = void 0;
    this.computed = void 0;
    this.marginLeft = void 0;
    this.marginTop = void 0;
    this.maxHeight = void 0;
    this.maxWidth = void 0;
    this.minHeight = void 0;
    this.minWidth = void 0;
    this.hasWillChange = false; // Silently reset `resizedObserved`; With proper usage the `resizeObserver` action issues an update on removal.

    this.resizeObserved.contentHeight = void 0;
    this.resizeObserved.contentWidth = void 0;
    this.resizeObserved.offsetHeight = void 0;
    this.resizeObserved.offsetWidth = void 0; // Reset the tracked element this Position instance is modifying.

    this.stores.element.set(void 0);
  }
  /**
   * Updates the style cache with new data from the given element.
   *
   * @param {HTMLElement} el - An HTML element.
   */


  update(el) {
    var _styleParsePixels, _styleParsePixels2, _styleParsePixels3, _styleParsePixels4, _styleParsePixels5, _styleParsePixels6, _;

    this.el = el;
    this.computed = globalThis.getComputedStyle(el);
    this.marginLeft = (_styleParsePixels = styleParsePixels$1(el.style.marginLeft)) !== null && _styleParsePixels !== void 0 ? _styleParsePixels : styleParsePixels$1(this.computed.marginLeft);
    this.marginTop = (_styleParsePixels2 = styleParsePixels$1(el.style.marginTop)) !== null && _styleParsePixels2 !== void 0 ? _styleParsePixels2 : styleParsePixels$1(this.computed.marginTop);
    this.maxHeight = (_styleParsePixels3 = styleParsePixels$1(el.style.maxHeight)) !== null && _styleParsePixels3 !== void 0 ? _styleParsePixels3 : styleParsePixels$1(this.computed.maxHeight);
    this.maxWidth = (_styleParsePixels4 = styleParsePixels$1(el.style.maxWidth)) !== null && _styleParsePixels4 !== void 0 ? _styleParsePixels4 : styleParsePixels$1(this.computed.maxWidth); // Note that the computed styles for below will always be 0px / 0 when no style is active.

    this.minHeight = (_styleParsePixels5 = styleParsePixels$1(el.style.minHeight)) !== null && _styleParsePixels5 !== void 0 ? _styleParsePixels5 : styleParsePixels$1(this.computed.minHeight);
    this.minWidth = (_styleParsePixels6 = styleParsePixels$1(el.style.minWidth)) !== null && _styleParsePixels6 !== void 0 ? _styleParsePixels6 : styleParsePixels$1(this.computed.minWidth); // Tracks if there already is a will-change property on the inline or computed styles.

    const willChange = el.style.willChange !== '' ? el.style.willChange : (_ = void 0) !== null && _ !== void 0 ? _ : this.computed.willChange;
    this.hasWillChange = willChange !== '' && willChange !== 'auto'; // Update the tracked element this Position instance is modifying.

    this.stores.element.set(el);
  }

}

/**
 * Provides the output data for {@link Transforms.getData}.
 */

var _boundingRect = /*#__PURE__*/new WeakMap();

var _corners = /*#__PURE__*/new WeakMap();

var _mat = /*#__PURE__*/new WeakMap();

var _originTranslations = /*#__PURE__*/new WeakMap();

class TransformData {
  constructor() {
    _classPrivateFieldInitSpec(this, _boundingRect, {
      writable: true,
      value: new DOMRect()
    });

    _classPrivateFieldInitSpec(this, _corners, {
      writable: true,
      value: [vec3.create(), vec3.create(), vec3.create(), vec3.create()]
    });

    _classPrivateFieldInitSpec(this, _mat, {
      writable: true,
      value: mat4.create()
    });

    _classPrivateFieldInitSpec(this, _originTranslations, {
      writable: true,
      value: [mat4.create(), mat4.create()]
    });

    Object.seal(this);
  }
  /**
   * Stores the calculated bounding rectangle.
   *
   * @type {DOMRect}
   */


  /**
   * @returns {DOMRect} The bounding rectangle.
   */
  get boundingRect() {
    return _classPrivateFieldGet(this, _boundingRect);
  }
  /**
   * @returns {Vector3[]} The transformed corner points as vec3 in screen space.
   */


  get corners() {
    return _classPrivateFieldGet(this, _corners);
  }
  /**
   * @returns {string} Returns the CSS style string for the transform matrix.
   */


  get css() {
    return `matrix3d(${this.mat4.join(',')})`;
  }
  /**
   * @returns {Matrix4} The transform matrix.
   */


  get mat4() {
    return _classPrivateFieldGet(this, _mat);
  }
  /**
   * @returns {Matrix4[]} The pre / post translation matrices for origin translation.
   */


  get originTranslations() {
    return _classPrivateFieldGet(this, _originTranslations);
  }

}
/**
 * @typedef {Float32Array} Vector3 - 3 Dimensional Vector.
 *
 * @see https://glmatrix.net/docs/module-vec3.html
 */

/**
 * @typedef {Float32Array} Matrix4 - 4x4 Matrix; Format: column-major, when typed out it looks like row-major.
 *
 * @see https://glmatrix.net/docs/module-mat4.html
 */

let _Symbol$iterator;

var _validatorData$1 = /*#__PURE__*/new WeakMap();

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
   * @type {ValidatorData[]}
   */

  /**
   * @returns {[AdapterValidators, ValidatorData[]]} Returns this and internal storage for validator adapter.
   */
  constructor() {
    _classPrivateFieldInitSpec(this, _validatorData$1, {
      writable: true,
      value: void 0
    });

    _classPrivateFieldInitSpec(this, _mapUnsubscribe, {
      writable: true,
      value: new Map()
    });

    _classPrivateFieldSet(this, _validatorData$1, []);

    Object.seal(this);
    return [this, _classPrivateFieldGet(this, _validatorData$1)];
  }
  /**
   * @returns {number} Returns the length of the validators array.
   */


  get length() {
    return _classPrivateFieldGet(this, _validatorData$1).length;
  }
  /**
   * Provides an iterator for validators.
   *
   * @returns {Generator<ValidatorData|undefined>} Generator / iterator of validators.
   * @yields {ValidatorData<T>}
   */


  *[_Symbol$iterator]() {
    if (_classPrivateFieldGet(this, _validatorData$1).length === 0) {
      return;
    }

    for (const entry of _classPrivateFieldGet(this, _validatorData$1)) {
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
            validator: validator.validator.bind(validator),
            weight: validator.weight || 1,
            instance: validator
          };
          subscribeFn = (_validator$validator$ = validator.validator.subscribe) !== null && _validator$validator$ !== void 0 ? _validator$validator$ : validator.subscribe;
          break;
      } // Find the index to insert where data.weight is less than existing values weight.


      const index = _classPrivateFieldGet(this, _validatorData$1).findIndex(value => {
        return data.weight < value.weight;
      }); // If an index was found insert at that location.


      if (index >= 0) {
        _classPrivateFieldGet(this, _validatorData$1).splice(index, 0, data);
      } else // push to end of validators.
        {
          _classPrivateFieldGet(this, _validatorData$1).push(data);
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
    _classPrivateFieldGet(this, _validatorData$1).length = 0; // Unsubscribe from all validators with subscription support.

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
    const length = _classPrivateFieldGet(this, _validatorData$1).length;

    if (length === 0) {
      return;
    }

    for (const data of validators) {
      // Handle the case that the validator may either be a function or a validator entry / object.
      const actualValidator = typeof data === 'function' ? data : data !== null && typeof data === 'object' ? data.validator : void 0;

      if (!actualValidator) {
        continue;
      }

      for (let cntr = _classPrivateFieldGet(this, _validatorData$1).length; --cntr >= 0;) {
        if (_classPrivateFieldGet(this, _validatorData$1)[cntr].validator === actualValidator) {
          _classPrivateFieldGet(this, _validatorData$1).splice(cntr, 1); // Invoke any unsubscribe function for given validator then remove from tracking.


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
    const length = _classPrivateFieldGet(this, _validatorData$1).length;

    if (length === 0) {
      return;
    }

    if (typeof callback !== 'function') {
      throw new TypeError(`AdapterValidator error: 'callback' is not a function.`);
    }

    _classPrivateFieldSet(this, _validatorData$1, _classPrivateFieldGet(this, _validatorData$1).filter(data => {
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
    const length = _classPrivateFieldGet(this, _validatorData$1).length;

    if (length === 0) {
      return;
    }

    _classPrivateFieldSet(this, _validatorData$1, _classPrivateFieldGet(this, _validatorData$1).filter(data => {
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
 * @callback ValidatorFn - Position validator function that takes a {@link PositionData} instance potentially
 *                             modifying it or returning null if invalid.
 *
 * @param {ValidationData} valData - Validation data.
 *
 * @returns {PositionData|null} The validated position data or null to cancel position update.
 *
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

var _constrain$1 = /*#__PURE__*/new WeakMap();

var _element$1 = /*#__PURE__*/new WeakMap();

var _enabled$1 = /*#__PURE__*/new WeakMap();

var _height$1 = /*#__PURE__*/new WeakMap();

var _lock$1 = /*#__PURE__*/new WeakMap();

var _width$1 = /*#__PURE__*/new WeakMap();

class BasicBounds {
  /**
   * When true constrains the min / max width or height to element.
   *
   * @type {boolean}
   */

  /**
   * @type {HTMLElement}
   */

  /**
   * When true the validator is active.
   *
   * @type {boolean}
   */

  /**
   * Provides a manual setting of the element height. As things go `offsetHeight` causes a browser layout and is not
   * performance oriented. If manually set this height is used instead of `offsetHeight`.
   *
   * @type {number}
   */

  /**
   * Set from an optional value in the constructor to lock accessors preventing modification.
   */

  /**
   * Provides a manual setting of the element width. As things go `offsetWidth` causes a browser layout and is not
   * performance oriented. If manually set this width is used instead of `offsetWidth`.
   *
   * @type {number}
   */
  constructor({
    constrain = true,
    element,
    enabled = true,
    lock = false,
    width,
    height
  } = {}) {
    _classPrivateFieldInitSpec(this, _constrain$1, {
      writable: true,
      value: void 0
    });

    _classPrivateFieldInitSpec(this, _element$1, {
      writable: true,
      value: void 0
    });

    _classPrivateFieldInitSpec(this, _enabled$1, {
      writable: true,
      value: void 0
    });

    _classPrivateFieldInitSpec(this, _height$1, {
      writable: true,
      value: void 0
    });

    _classPrivateFieldInitSpec(this, _lock$1, {
      writable: true,
      value: void 0
    });

    _classPrivateFieldInitSpec(this, _width$1, {
      writable: true,
      value: void 0
    });

    this.element = element;
    this.constrain = constrain;
    this.enabled = enabled;
    this.width = width;
    this.height = height;

    _classPrivateFieldSet(this, _lock$1, typeof lock === 'boolean' ? lock : false);
  }

  get constrain() {
    return _classPrivateFieldGet(this, _constrain$1);
  }

  get element() {
    return _classPrivateFieldGet(this, _element$1);
  }

  get enabled() {
    return _classPrivateFieldGet(this, _enabled$1);
  }

  get height() {
    return _classPrivateFieldGet(this, _height$1);
  }

  get width() {
    return _classPrivateFieldGet(this, _width$1);
  }

  set constrain(constrain) {
    if (_classPrivateFieldGet(this, _lock$1)) {
      return;
    }

    if (typeof constrain !== 'boolean') {
      throw new TypeError(`'constrain' is not a boolean.`);
    }

    _classPrivateFieldSet(this, _constrain$1, constrain);
  }

  set element(element) {
    if (_classPrivateFieldGet(this, _lock$1)) {
      return;
    }

    if (element === void 0 || element === null || element instanceof HTMLElement) {
      _classPrivateFieldSet(this, _element$1, element);
    } else {
      throw new TypeError(`'element' is not a HTMLElement, undefined, or null.`);
    }
  }

  set enabled(enabled) {
    if (_classPrivateFieldGet(this, _lock$1)) {
      return;
    }

    if (typeof enabled !== 'boolean') {
      throw new TypeError(`'enabled' is not a boolean.`);
    }

    _classPrivateFieldSet(this, _enabled$1, enabled);
  }

  set height(height) {
    if (_classPrivateFieldGet(this, _lock$1)) {
      return;
    }

    if (height === void 0 || Number.isFinite(height)) {
      _classPrivateFieldSet(this, _height$1, height);
    } else {
      throw new TypeError(`'height' is not a finite number or undefined.`);
    }
  }

  set width(width) {
    if (_classPrivateFieldGet(this, _lock$1)) {
      return;
    }

    if (width === void 0 || Number.isFinite(width)) {
      _classPrivateFieldSet(this, _width$1, width);
    } else {
      throw new TypeError(`'width' is not a finite number or undefined.`);
    }
  }

  setDimension(width, height) {
    if (_classPrivateFieldGet(this, _lock$1)) {
      return;
    }

    if (width === void 0 || Number.isFinite(width)) {
      _classPrivateFieldSet(this, _width$1, width);
    } else {
      throw new TypeError(`'width' is not a finite number or undefined.`);
    }

    if (height === void 0 || Number.isFinite(height)) {
      _classPrivateFieldSet(this, _height$1, height);
    } else {
      throw new TypeError(`'height' is not a finite number or undefined.`);
    }
  }
  /**
   * Provides a validator that respects transforms in positional data constraining the position to within the target
   * elements bounds.
   *
   * @param {ValidationData}   valData - The associated validation data for position updates.
   *
   * @returns {PositionData} Potentially adjusted position data.
   */


  validator(valData) {
    var _ref, _classPrivateFieldGet2, _classPrivateFieldGet3, _ref2, _classPrivateFieldGet4, _classPrivateFieldGet5;

    // Early out if element is undefined or local enabled state is false.
    if (!_classPrivateFieldGet(this, _enabled$1)) {
      return valData.position;
    } // Determine containing bounds from manual values; or any element; lastly the browser width / height.


    const boundsWidth = (_ref = (_classPrivateFieldGet2 = _classPrivateFieldGet(this, _width$1)) !== null && _classPrivateFieldGet2 !== void 0 ? _classPrivateFieldGet2 : (_classPrivateFieldGet3 = _classPrivateFieldGet(this, _element$1)) === null || _classPrivateFieldGet3 === void 0 ? void 0 : _classPrivateFieldGet3.offsetWidth) !== null && _ref !== void 0 ? _ref : globalThis.innerWidth;
    const boundsHeight = (_ref2 = (_classPrivateFieldGet4 = _classPrivateFieldGet(this, _height$1)) !== null && _classPrivateFieldGet4 !== void 0 ? _classPrivateFieldGet4 : (_classPrivateFieldGet5 = _classPrivateFieldGet(this, _element$1)) === null || _classPrivateFieldGet5 === void 0 ? void 0 : _classPrivateFieldGet5.offsetHeight) !== null && _ref2 !== void 0 ? _ref2 : globalThis.innerHeight;

    if (typeof valData.position.width === 'number') {
      var _valData$maxWidth;

      const maxW = (_valData$maxWidth = valData.maxWidth) !== null && _valData$maxWidth !== void 0 ? _valData$maxWidth : _classPrivateFieldGet(this, _constrain$1) ? boundsWidth : Number.MAX_SAFE_INTEGER;
      valData.position.width = valData.width = Math.clamped(valData.position.width, valData.minWidth, maxW);

      if (valData.width + valData.position.left + valData.marginLeft > boundsWidth) {
        valData.position.left = boundsWidth - valData.width - valData.marginLeft;
      }
    }

    if (typeof valData.position.height === 'number') {
      var _valData$maxHeight;

      const maxH = (_valData$maxHeight = valData.maxHeight) !== null && _valData$maxHeight !== void 0 ? _valData$maxHeight : _classPrivateFieldGet(this, _constrain$1) ? boundsHeight : Number.MAX_SAFE_INTEGER;
      valData.position.height = valData.height = Math.clamped(valData.position.height, valData.minHeight, maxH);

      if (valData.height + valData.position.top + valData.marginTop > boundsHeight) {
        valData.position.top = boundsHeight - valData.height - valData.marginTop;
      }
    }

    const maxL = Math.max(boundsWidth - valData.width - valData.marginLeft, 0);
    valData.position.left = Math.round(Math.clamped(valData.position.left, 0, maxL));
    const maxT = Math.max(boundsHeight - valData.height - valData.marginTop, 0);
    valData.position.top = Math.round(Math.clamped(valData.position.top, 0, maxT));
    return valData.position;
  }

}

const s_TRANSFORM_DATA = new TransformData();

var _constrain = /*#__PURE__*/new WeakMap();

var _element = /*#__PURE__*/new WeakMap();

var _enabled = /*#__PURE__*/new WeakMap();

var _height = /*#__PURE__*/new WeakMap();

var _lock = /*#__PURE__*/new WeakMap();

var _width = /*#__PURE__*/new WeakMap();

class TransformBounds {
  /**
   * When true constrains the min / max width or height to element.
   *
   * @type {boolean}
   */

  /**
   * @type {HTMLElement}
   */

  /**
   * When true the validator is active.
   *
   * @type {boolean}
   */

  /**
   * Provides a manual setting of the element height. As things go `offsetHeight` causes a browser layout and is not
   * performance oriented. If manually set this height is used instead of `offsetHeight`.
   *
   * @type {number}
   */

  /**
   * Set from an optional value in the constructor to lock accessors preventing modification.
   */

  /**
   * Provides a manual setting of the element width. As things go `offsetWidth` causes a browser layout and is not
   * performance oriented. If manually set this width is used instead of `offsetWidth`.
   *
   * @type {number}
   */
  constructor({
    constrain = true,
    element,
    enabled = true,
    lock = false,
    width,
    height
  } = {}) {
    _classPrivateFieldInitSpec(this, _constrain, {
      writable: true,
      value: void 0
    });

    _classPrivateFieldInitSpec(this, _element, {
      writable: true,
      value: void 0
    });

    _classPrivateFieldInitSpec(this, _enabled, {
      writable: true,
      value: void 0
    });

    _classPrivateFieldInitSpec(this, _height, {
      writable: true,
      value: void 0
    });

    _classPrivateFieldInitSpec(this, _lock, {
      writable: true,
      value: void 0
    });

    _classPrivateFieldInitSpec(this, _width, {
      writable: true,
      value: void 0
    });

    this.element = element;
    this.constrain = constrain;
    this.enabled = enabled;
    this.width = width;
    this.height = height;

    _classPrivateFieldSet(this, _lock, typeof lock === 'boolean' ? lock : false);
  }

  get constrain() {
    return _classPrivateFieldGet(this, _constrain);
  }

  get element() {
    return _classPrivateFieldGet(this, _element);
  }

  get enabled() {
    return _classPrivateFieldGet(this, _enabled);
  }

  get height() {
    return _classPrivateFieldGet(this, _height);
  }

  get width() {
    return _classPrivateFieldGet(this, _width);
  }

  set constrain(constrain) {
    if (_classPrivateFieldGet(this, _lock)) {
      return;
    }

    if (typeof constrain !== 'boolean') {
      throw new TypeError(`'constrain' is not a boolean.`);
    }

    _classPrivateFieldSet(this, _constrain, constrain);
  }

  set element(element) {
    if (_classPrivateFieldGet(this, _lock)) {
      return;
    }

    if (element === void 0 || element === null || element instanceof HTMLElement) {
      _classPrivateFieldSet(this, _element, element);
    } else {
      throw new TypeError(`'element' is not a HTMLElement, undefined, or null.`);
    }
  }

  set enabled(enabled) {
    if (_classPrivateFieldGet(this, _lock)) {
      return;
    }

    if (typeof enabled !== 'boolean') {
      throw new TypeError(`'enabled' is not a boolean.`);
    }

    _classPrivateFieldSet(this, _enabled, enabled);
  }

  set height(height) {
    if (_classPrivateFieldGet(this, _lock)) {
      return;
    }

    if (height === void 0 || Number.isFinite(height)) {
      _classPrivateFieldSet(this, _height, height);
    } else {
      throw new TypeError(`'height' is not a finite number or undefined.`);
    }
  }

  set width(width) {
    if (_classPrivateFieldGet(this, _lock)) {
      return;
    }

    if (width === void 0 || Number.isFinite(width)) {
      _classPrivateFieldSet(this, _width, width);
    } else {
      throw new TypeError(`'width' is not a finite number or undefined.`);
    }
  }

  setDimension(width, height) {
    if (_classPrivateFieldGet(this, _lock)) {
      return;
    }

    if (width === void 0 || Number.isFinite(width)) {
      _classPrivateFieldSet(this, _width, width);
    } else {
      throw new TypeError(`'width' is not a finite number or undefined.`);
    }

    if (height === void 0 || Number.isFinite(height)) {
      _classPrivateFieldSet(this, _height, height);
    } else {
      throw new TypeError(`'height' is not a finite number or undefined.`);
    }
  }
  /**
   * Provides a validator that respects transforms in positional data constraining the position to within the target
   * elements bounds.
   *
   * @param {ValidationData}   valData - The associated validation data for position updates.
   *
   * @returns {PositionData} Potentially adjusted position data.
   */


  validator(valData) {
    var _ref, _classPrivateFieldGet2, _classPrivateFieldGet3, _ref2, _classPrivateFieldGet4, _classPrivateFieldGet5;

    // Early out if element is undefined or local enabled state is false.
    if (!_classPrivateFieldGet(this, _enabled)) {
      return valData.position;
    } // Determine containing bounds from manual values; or any element; lastly the browser width / height.


    const boundsWidth = (_ref = (_classPrivateFieldGet2 = _classPrivateFieldGet(this, _width)) !== null && _classPrivateFieldGet2 !== void 0 ? _classPrivateFieldGet2 : (_classPrivateFieldGet3 = _classPrivateFieldGet(this, _element)) === null || _classPrivateFieldGet3 === void 0 ? void 0 : _classPrivateFieldGet3.offsetWidth) !== null && _ref !== void 0 ? _ref : globalThis.innerWidth;
    const boundsHeight = (_ref2 = (_classPrivateFieldGet4 = _classPrivateFieldGet(this, _height)) !== null && _classPrivateFieldGet4 !== void 0 ? _classPrivateFieldGet4 : (_classPrivateFieldGet5 = _classPrivateFieldGet(this, _element)) === null || _classPrivateFieldGet5 === void 0 ? void 0 : _classPrivateFieldGet5.offsetHeight) !== null && _ref2 !== void 0 ? _ref2 : globalThis.innerHeight; // Ensure min / max width constraints when position width is a number; not 'auto' or 'inherit'. If constrain is
    // true cap width bounds.

    if (typeof valData.position.width === 'number') {
      var _valData$maxWidth;

      const maxW = (_valData$maxWidth = valData.maxWidth) !== null && _valData$maxWidth !== void 0 ? _valData$maxWidth : _classPrivateFieldGet(this, _constrain) ? boundsWidth : Number.MAX_SAFE_INTEGER;
      valData.position.width = Math.clamped(valData.width, valData.minWidth, maxW);
    } // Ensure min / max height constraints when position height is a number; not 'auto' or 'inherit'. If constrain
    // is true cap height bounds.


    if (typeof valData.position.height === 'number') {
      var _valData$maxHeight;

      const maxH = (_valData$maxHeight = valData.maxHeight) !== null && _valData$maxHeight !== void 0 ? _valData$maxHeight : _classPrivateFieldGet(this, _constrain) ? boundsHeight : Number.MAX_SAFE_INTEGER;
      valData.position.height = Math.clamped(valData.height, valData.minHeight, maxH);
    } // Get transform data. First set constraints including any margin top / left as offsets and width / height. Used
    // when position width / height is 'auto'.


    const data = valData.transforms.getData(valData.position, s_TRANSFORM_DATA, valData); // Check the bounding rectangle against browser height / width. Adjust position based on how far the overlap of
    // the bounding rect is outside the bounds height / width. The order below matters as the constraints are top /
    // left oriented, so perform those checks last.

    const initialX = data.boundingRect.x;
    const initialY = data.boundingRect.y;

    if (data.boundingRect.bottom + valData.marginTop > boundsHeight) {
      data.boundingRect.y += boundsHeight - data.boundingRect.bottom - valData.marginTop;
    }

    if (data.boundingRect.right + valData.marginLeft > boundsWidth) {
      data.boundingRect.x += boundsWidth - data.boundingRect.right - valData.marginLeft;
    }

    if (data.boundingRect.top - valData.marginTop < 0) {
      data.boundingRect.y += Math.abs(data.boundingRect.top - valData.marginTop);
    }

    if (data.boundingRect.left - valData.marginLeft < 0) {
      data.boundingRect.x += Math.abs(data.boundingRect.left - valData.marginLeft);
    }

    valData.position.left -= initialX - data.boundingRect.x;
    valData.position.top -= initialY - data.boundingRect.y;
    return valData.position;
  }

}

const basicWindow = new BasicBounds({
  lock: true
});
const transformWindow = new TransformBounds({
  lock: true
});

var positionValidators = /*#__PURE__*/Object.freeze({
  __proto__: null,
  basicWindow: basicWindow,
  BasicBounds: BasicBounds,
  transformWindow: transformWindow,
  TransformBounds: TransformBounds
});

/** @type {number[]} */

const s_SCALE_VECTOR = [1, 1, 1];
/** @type {number[]} */

const s_TRANSLATE_VECTOR = [0, 0, 0];
/** @type {Matrix4} */

const s_MAT4_RESULT = mat4.create();
/** @type {Matrix4} */

const s_MAT4_TEMP = mat4.create();
/** @type {Vector3} */

const s_VEC3_TEMP = vec3.create();

var _orderList = /*#__PURE__*/new WeakMap();

class Transforms {
  /**
   * Stores the transform keys in the order added.
   *
   * @type {string[]}
   */
  constructor() {
    _classPrivateFieldInitSpec(this, _orderList, {
      writable: true,
      value: []
    });

    this._data = {};
  }
  /**
   * @returns {boolean} Whether there are active transforms in local data.
   */


  get isActive() {
    return _classPrivateFieldGet(this, _orderList).length > 0;
  }
  /**
   * @returns {number|undefined} Any local rotateX data.
   */


  get rotateX() {
    return this._data.rotateX;
  }
  /**
   * @returns {number|undefined} Any local rotateY data.
   */


  get rotateY() {
    return this._data.rotateY;
  }
  /**
   * @returns {number|undefined} Any local rotateZ data.
   */


  get rotateZ() {
    return this._data.rotateZ;
  }
  /**
   * @returns {number|undefined} Any local rotateZ scale.
   */


  get scale() {
    return this._data.scale;
  }
  /**
   * @returns {number|undefined} Any local translateZ data.
   */


  get translateX() {
    return this._data.translateX;
  }
  /**
   * @returns {number|undefined} Any local translateZ data.
   */


  get translateY() {
    return this._data.translateY;
  }
  /**
   * @returns {number|undefined} Any local translateZ data.
   */


  get translateZ() {
    return this._data.translateZ;
  }
  /**
   * Sets the local rotateX data if the value is a finite number otherwise removes the local data.
   *
   * @param {number|null|undefined}   value - A value to set.
   */


  set rotateX(value) {
    if (Number.isFinite(value)) {
      if (this._data.rotateX === void 0) {
        _classPrivateFieldGet(this, _orderList).push('rotateX');
      }

      this._data.rotateX = value;
    } else {
      if (this._data.rotateX !== void 0) {
        const index = _classPrivateFieldGet(this, _orderList).findIndex(entry => entry === 'rotateX');

        if (index >= 0) {
          _classPrivateFieldGet(this, _orderList).splice(index, 1);
        }
      }

      delete this._data.rotateX;
    }
  }
  /**
   * Sets the local rotateY data if the value is a finite number otherwise removes the local data.
   *
   * @param {number|null|undefined}   value - A value to set.
   */


  set rotateY(value) {
    if (Number.isFinite(value)) {
      if (this._data.rotateY === void 0) {
        _classPrivateFieldGet(this, _orderList).push('rotateY');
      }

      this._data.rotateY = value;
    } else {
      if (this._data.rotateY !== void 0) {
        const index = _classPrivateFieldGet(this, _orderList).findIndex(entry => entry === 'rotateY');

        if (index >= 0) {
          _classPrivateFieldGet(this, _orderList).splice(index, 1);
        }
      }

      delete this._data.rotateY;
    }
  }
  /**
   * Sets the local rotateZ data if the value is a finite number otherwise removes the local data.
   *
   * @param {number|null|undefined}   value - A value to set.
   */


  set rotateZ(value) {
    if (Number.isFinite(value)) {
      if (this._data.rotateZ === void 0) {
        _classPrivateFieldGet(this, _orderList).push('rotateZ');
      }

      this._data.rotateZ = value;
    } else {
      if (this._data.rotateZ !== void 0) {
        const index = _classPrivateFieldGet(this, _orderList).findIndex(entry => entry === 'rotateZ');

        if (index >= 0) {
          _classPrivateFieldGet(this, _orderList).splice(index, 1);
        }
      }

      delete this._data.rotateZ;
    }
  }
  /**
   * Sets the local scale data if the value is a finite number otherwise removes the local data.
   *
   * @param {number|null|undefined}   value - A value to set.
   */


  set scale(value) {
    if (Number.isFinite(value)) {
      if (this._data.scale === void 0) {
        _classPrivateFieldGet(this, _orderList).push('scale');
      }

      this._data.scale = value;
    } else {
      if (this._data.scale !== void 0) {
        const index = _classPrivateFieldGet(this, _orderList).findIndex(entry => entry === 'scale');

        if (index >= 0) {
          _classPrivateFieldGet(this, _orderList).splice(index, 1);
        }
      }

      delete this._data.scale;
    }
  }
  /**
   * Sets the local translateX data if the value is a finite number otherwise removes the local data.
   *
   * @param {number|null|undefined}   value - A value to set.
   */


  set translateX(value) {
    if (Number.isFinite(value)) {
      if (this._data.translateX === void 0) {
        _classPrivateFieldGet(this, _orderList).push('translateX');
      }

      this._data.translateX = value;
    } else {
      if (this._data.translateX !== void 0) {
        const index = _classPrivateFieldGet(this, _orderList).findIndex(entry => entry === 'translateX');

        if (index >= 0) {
          _classPrivateFieldGet(this, _orderList).splice(index, 1);
        }
      }

      delete this._data.translateX;
    }
  }
  /**
   * Sets the local translateY data if the value is a finite number otherwise removes the local data.
   *
   * @param {number|null|undefined}   value - A value to set.
   */


  set translateY(value) {
    if (Number.isFinite(value)) {
      if (this._data.translateY === void 0) {
        _classPrivateFieldGet(this, _orderList).push('translateY');
      }

      this._data.translateY = value;
    } else {
      if (this._data.translateY !== void 0) {
        const index = _classPrivateFieldGet(this, _orderList).findIndex(entry => entry === 'translateY');

        if (index >= 0) {
          _classPrivateFieldGet(this, _orderList).splice(index, 1);
        }
      }

      delete this._data.translateY;
    }
  }
  /**
   * Sets the local translateZ data if the value is a finite number otherwise removes the local data.
   *
   * @param {number|null|undefined}   value - A value to set.
   */


  set translateZ(value) {
    if (Number.isFinite(value)) {
      if (this._data.translateZ === void 0) {
        _classPrivateFieldGet(this, _orderList).push('translateZ');
      }

      this._data.translateZ = value;
    } else {
      if (this._data.translateZ !== void 0) {
        const index = _classPrivateFieldGet(this, _orderList).findIndex(entry => entry === 'translateZ');

        if (index >= 0) {
          _classPrivateFieldGet(this, _orderList).splice(index, 1);
        }
      }

      delete this._data.translateZ;
    }
  }
  /**
   * Returns the matrix3d CSS transform for the given position / transform data.
   *
   * @param {object} [data] - Optional position data otherwise use local stored transform data.
   *
   * @returns {string} The CSS matrix3d string.
   */


  getCSS(data = this._data) {
    return `matrix3d(${this.getMat4(data, s_MAT4_RESULT).join(',')})`;
  }
  /**
   * Returns the matrix3d CSS transform for the given position / transform data.
   *
   * @param {object} [data] - Optional position data otherwise use local stored transform data.
   *
   * @returns {string} The CSS matrix3d string.
   */


  getCSSOrtho(data = this._data) {
    return `matrix3d(${this.getMat4Ortho(data, s_MAT4_RESULT).join(',')})`;
  }
  /**
   * Collects all data including a bounding rect, transform matrix, and points array of the given {@link PositionData}
   * instance with the applied local transform data.
   *
   * @param {PositionData} position - The position data to process.
   *
   * @param {TransformData} [output] - Optional TransformData output instance.
   *
   * @param {object} [validationData] - Optional validation data for adjustment parameters.
   *
   * @returns {TransformData} The output TransformData instance.
   */


  getData(position, output = new TransformData(), validationData = {}) {
    var _validationData$width, _validationData$heigh, _ref, _validationData$offse, _ref2, _validationData$offse2;

    const valWidth = (_validationData$width = validationData.width) !== null && _validationData$width !== void 0 ? _validationData$width : 0;
    const valHeight = (_validationData$heigh = validationData.height) !== null && _validationData$heigh !== void 0 ? _validationData$heigh : 0;
    const valOffsetTop = (_ref = (_validationData$offse = validationData.offsetTop) !== null && _validationData$offse !== void 0 ? _validationData$offse : validationData.marginTop) !== null && _ref !== void 0 ? _ref : 0;
    const valOffsetLeft = (_ref2 = (_validationData$offse2 = validationData.offsetLeft) !== null && _validationData$offse2 !== void 0 ? _validationData$offse2 : validationData.offsetLeft) !== null && _ref2 !== void 0 ? _ref2 : 0;
    position.top += valOffsetTop;
    position.left += valOffsetLeft;
    const width = Number.isFinite(position.width) ? position.width : valWidth;
    const height = Number.isFinite(position.height) ? position.height : valHeight;
    const rect = output.corners;

    if (this.hasTransform(position)) {
      rect[0][0] = rect[0][1] = rect[0][2] = 0;
      rect[1][0] = width;
      rect[1][1] = rect[1][2] = 0;
      rect[2][0] = width;
      rect[2][1] = height;
      rect[2][2] = 0;
      rect[3][0] = 0;
      rect[3][1] = height;
      rect[3][2] = 0;
      const matrix = this.getMat4(position, output.mat4);
      const translate = s_GET_ORIGIN_TRANSLATION(position.transformOrigin, width, height, output.originTranslations);

      if (transformOriginDefault === position.transformOrigin) {
        vec3.transformMat4(rect[0], rect[0], matrix);
        vec3.transformMat4(rect[1], rect[1], matrix);
        vec3.transformMat4(rect[2], rect[2], matrix);
        vec3.transformMat4(rect[3], rect[3], matrix);
      } else {
        vec3.transformMat4(rect[0], rect[0], translate[0]);
        vec3.transformMat4(rect[0], rect[0], matrix);
        vec3.transformMat4(rect[0], rect[0], translate[1]);
        vec3.transformMat4(rect[1], rect[1], translate[0]);
        vec3.transformMat4(rect[1], rect[1], matrix);
        vec3.transformMat4(rect[1], rect[1], translate[1]);
        vec3.transformMat4(rect[2], rect[2], translate[0]);
        vec3.transformMat4(rect[2], rect[2], matrix);
        vec3.transformMat4(rect[2], rect[2], translate[1]);
        vec3.transformMat4(rect[3], rect[3], translate[0]);
        vec3.transformMat4(rect[3], rect[3], matrix);
        vec3.transformMat4(rect[3], rect[3], translate[1]);
      }

      rect[0][0] = position.left + rect[0][0];
      rect[0][1] = position.top + rect[0][1];
      rect[1][0] = position.left + rect[1][0];
      rect[1][1] = position.top + rect[1][1];
      rect[2][0] = position.left + rect[2][0];
      rect[2][1] = position.top + rect[2][1];
      rect[3][0] = position.left + rect[3][0];
      rect[3][1] = position.top + rect[3][1];
    } else {
      rect[0][0] = position.left;
      rect[0][1] = position.top;
      rect[1][0] = position.left + width;
      rect[1][1] = position.top;
      rect[2][0] = position.left + width;
      rect[2][1] = position.top + height;
      rect[3][0] = position.left;
      rect[3][1] = position.top + height;
      mat4.identity(output.mat4);
    }

    let maxX = Number.MIN_SAFE_INTEGER;
    let maxY = Number.MIN_SAFE_INTEGER;
    let minX = Number.MAX_SAFE_INTEGER;
    let minY = Number.MAX_SAFE_INTEGER;

    for (let cntr = 4; --cntr >= 0;) {
      if (rect[cntr][0] > maxX) {
        maxX = rect[cntr][0];
      }

      if (rect[cntr][0] < minX) {
        minX = rect[cntr][0];
      }

      if (rect[cntr][1] > maxY) {
        maxY = rect[cntr][1];
      }

      if (rect[cntr][1] < minY) {
        minY = rect[cntr][1];
      }
    }

    const boundingRect = output.boundingRect;
    boundingRect.x = minX;
    boundingRect.y = minY;
    boundingRect.width = maxX - minX;
    boundingRect.height = maxY - minY;
    position.top -= valOffsetTop;
    position.left -= valOffsetLeft;
    return output;
  }
  /**
   * Creates a transform matrix based on local data applied in order it was added.
   *
   * If no data object is provided then the source is the local transform data. If another data object is supplied
   * then the stored local transform order is applied then all remaining transform keys are applied. This allows the
   * construction of a transform matrix in advance of setting local data and is useful in collision detection.
   *
   * @param {object}   [data] - PositionData instance or local transform data.
   *
   * @param {Matrix4}  [output] - The output mat4 instance.
   *
   * @returns {Matrix4} Transform matrix.
   */


  getMat4(data = this._data, output = mat4.create()) {
    const matrix = mat4.identity(output); // Bitwise tracks applied transform keys from local transform data.

    let seenKeys = 0;

    const orderList = _classPrivateFieldGet(this, _orderList); // First apply ordered transforms from local transform data.


    for (let cntr = 0; cntr < orderList.length; cntr++) {
      const key = orderList[cntr];

      switch (key) {
        case 'rotateX':
          seenKeys |= transformKeysBitwise.rotateX;
          mat4.multiply(matrix, matrix, mat4.fromXRotation(s_MAT4_TEMP, degToRad(data[key])));
          break;

        case 'rotateY':
          seenKeys |= transformKeysBitwise.rotateY;
          mat4.multiply(matrix, matrix, mat4.fromYRotation(s_MAT4_TEMP, degToRad(data[key])));
          break;

        case 'rotateZ':
          seenKeys |= transformKeysBitwise.rotateZ;
          mat4.multiply(matrix, matrix, mat4.fromZRotation(s_MAT4_TEMP, degToRad(data[key])));
          break;

        case 'scale':
          seenKeys |= transformKeysBitwise.scale;
          s_SCALE_VECTOR[0] = s_SCALE_VECTOR[1] = data[key];
          mat4.multiply(matrix, matrix, mat4.fromScaling(s_MAT4_TEMP, s_SCALE_VECTOR));
          break;

        case 'translateX':
          seenKeys |= transformKeysBitwise.translateX;
          s_TRANSLATE_VECTOR[0] = data.translateX;
          s_TRANSLATE_VECTOR[1] = 0;
          s_TRANSLATE_VECTOR[2] = 0;
          mat4.multiply(matrix, matrix, mat4.fromTranslation(s_MAT4_TEMP, s_TRANSLATE_VECTOR));
          break;

        case 'translateY':
          seenKeys |= transformKeysBitwise.translateY;
          s_TRANSLATE_VECTOR[0] = 0;
          s_TRANSLATE_VECTOR[1] = data.translateY;
          s_TRANSLATE_VECTOR[2] = 0;
          mat4.multiply(matrix, matrix, mat4.fromTranslation(s_MAT4_TEMP, s_TRANSLATE_VECTOR));
          break;

        case 'translateZ':
          seenKeys |= transformKeysBitwise.translateZ;
          s_TRANSLATE_VECTOR[0] = 0;
          s_TRANSLATE_VECTOR[1] = 0;
          s_TRANSLATE_VECTOR[2] = data.translateZ;
          mat4.multiply(matrix, matrix, mat4.fromTranslation(s_MAT4_TEMP, s_TRANSLATE_VECTOR));
          break;
      }
    } // Now apply any new keys not set in local transform data that have not been applied yet.


    if (data !== this._data) {
      for (let cntr = 0; cntr < transformKeys.length; cntr++) {
        const key = transformKeys[cntr]; // Reject bad / no data or if the key has already been applied.

        if (data[key] === null || (seenKeys & transformKeysBitwise[key]) > 0) {
          continue;
        }

        switch (key) {
          case 'rotateX':
            mat4.multiply(matrix, matrix, mat4.fromXRotation(s_MAT4_TEMP, degToRad(data[key])));
            break;

          case 'rotateY':
            mat4.multiply(matrix, matrix, mat4.fromYRotation(s_MAT4_TEMP, degToRad(data[key])));
            break;

          case 'rotateZ':
            mat4.multiply(matrix, matrix, mat4.fromZRotation(s_MAT4_TEMP, degToRad(data[key])));
            break;

          case 'scale':
            s_SCALE_VECTOR[0] = s_SCALE_VECTOR[1] = data[key];
            mat4.multiply(matrix, matrix, mat4.fromScaling(s_MAT4_TEMP, s_SCALE_VECTOR));
            break;

          case 'translateX':
            s_TRANSLATE_VECTOR[0] = data[key];
            s_TRANSLATE_VECTOR[1] = 0;
            s_TRANSLATE_VECTOR[2] = 0;
            mat4.multiply(matrix, matrix, mat4.fromTranslation(s_MAT4_TEMP, s_TRANSLATE_VECTOR));
            break;

          case 'translateY':
            s_TRANSLATE_VECTOR[0] = 0;
            s_TRANSLATE_VECTOR[1] = data[key];
            s_TRANSLATE_VECTOR[2] = 0;
            mat4.multiply(matrix, matrix, mat4.fromTranslation(s_MAT4_TEMP, s_TRANSLATE_VECTOR));
            break;

          case 'translateZ':
            s_TRANSLATE_VECTOR[0] = 0;
            s_TRANSLATE_VECTOR[1] = 0;
            s_TRANSLATE_VECTOR[2] = data[key];
            mat4.multiply(matrix, matrix, mat4.fromTranslation(s_MAT4_TEMP, s_TRANSLATE_VECTOR));
            break;
        }
      }
    }

    return matrix;
  }
  /**
   * Provides an orthographic enhancement to convert left / top positional data to a translate operation.
   *
   * This transform matrix takes into account that the remaining operations are , but adds any left / top attributes from passed in data to
   * translate X / Y.
   *
   * If no data object is provided then the source is the local transform data. If another data object is supplied
   * then the stored local transform order is applied then all remaining transform keys are applied. This allows the
   * construction of a transform matrix in advance of setting local data and is useful in collision detection.
   *
   * @param {object}   [data] - PositionData instance or local transform data.
   *
   * @param {Matrix4}  [output] - The output mat4 instance.
   *
   * @returns {Matrix4} Transform matrix.
   */


  getMat4Ortho(data = this._data, output = mat4.create()) {
    var _data$left, _data$translateX, _data$top, _data$translateY, _data$translateZ;

    const matrix = mat4.identity(output); // Attempt to retrieve values from passed in data otherwise default to 0.
    // Always perform the translation last regardless of order added to local transform data.
    // Add data.left to translateX and data.top to translateY.

    s_TRANSLATE_VECTOR[0] = ((_data$left = data.left) !== null && _data$left !== void 0 ? _data$left : 0) + ((_data$translateX = data.translateX) !== null && _data$translateX !== void 0 ? _data$translateX : 0);
    s_TRANSLATE_VECTOR[1] = ((_data$top = data.top) !== null && _data$top !== void 0 ? _data$top : 0) + ((_data$translateY = data.translateY) !== null && _data$translateY !== void 0 ? _data$translateY : 0);
    s_TRANSLATE_VECTOR[2] = (_data$translateZ = data.translateZ) !== null && _data$translateZ !== void 0 ? _data$translateZ : 0;
    mat4.multiply(matrix, matrix, mat4.fromTranslation(s_MAT4_TEMP, s_TRANSLATE_VECTOR)); // Scale can also be applied out of order.

    if (data.scale !== null) {
      s_SCALE_VECTOR[0] = s_SCALE_VECTOR[1] = data.scale;
      mat4.multiply(matrix, matrix, mat4.fromScaling(s_MAT4_TEMP, s_SCALE_VECTOR));
    } // Early out if there is not rotation data.


    if (data.rotateX === null && data.rotateY === null && data.rotateZ === null) {
      return matrix;
    } // Rotation transforms must be applied in the order they are added.
    // Bitwise tracks applied transform keys from local transform data.


    let seenKeys = 0;

    const orderList = _classPrivateFieldGet(this, _orderList); // First apply ordered transforms from local transform data.


    for (let cntr = 0; cntr < orderList.length; cntr++) {
      const key = orderList[cntr];

      switch (key) {
        case 'rotateX':
          seenKeys |= transformKeysBitwise.rotateX;
          mat4.multiply(matrix, matrix, mat4.fromXRotation(s_MAT4_TEMP, degToRad(data[key])));
          break;

        case 'rotateY':
          seenKeys |= transformKeysBitwise.rotateY;
          mat4.multiply(matrix, matrix, mat4.fromYRotation(s_MAT4_TEMP, degToRad(data[key])));
          break;

        case 'rotateZ':
          seenKeys |= transformKeysBitwise.rotateZ;
          mat4.multiply(matrix, matrix, mat4.fromZRotation(s_MAT4_TEMP, degToRad(data[key])));
          break;
      }
    } // Now apply any new keys not set in local transform data that have not been applied yet.


    if (data !== this._data) {
      for (let cntr = 0; cntr < transformKeys.length; cntr++) {
        const key = transformKeys[cntr]; // Reject bad / no data or if the key has already been applied.

        if (data[key] === null || (seenKeys & transformKeysBitwise[key]) > 0) {
          continue;
        }

        switch (key) {
          case 'rotateX':
            mat4.multiply(matrix, matrix, mat4.fromXRotation(s_MAT4_TEMP, degToRad(data[key])));
            break;

          case 'rotateY':
            mat4.multiply(matrix, matrix, mat4.fromYRotation(s_MAT4_TEMP, degToRad(data[key])));
            break;

          case 'rotateZ':
            mat4.multiply(matrix, matrix, mat4.fromZRotation(s_MAT4_TEMP, degToRad(data[key])));
            break;
        }
      }
    }

    return matrix;
  }
  /**
   * Tests an object if it contains transform keys and the values are finite numbers.
   *
   * @param {object} data - An object to test for transform data.
   *
   * @returns {boolean} Whether the given PositionData has transforms.
   */


  hasTransform(data) {
    for (const key of transformKeys) {
      if (Number.isFinite(data[key])) {
        return true;
      }
    }

    return false;
  }
  /**
   * Resets internal data from the given object containing valid transform keys.
   *
   * @param {object}   data - An object with transform data.
   */


  reset(data) {
    for (const key in data) {
      if (transformKeys.includes(key)) {
        if (Number.isFinite(data[key])) {
          this._data[key] = data[key];
        } else {
          const index = _classPrivateFieldGet(this, _orderList).findIndex(entry => entry === key);

          if (index >= 0) {
            _classPrivateFieldGet(this, _orderList).splice(index, 1);
          }

          delete this._data[key];
        }
      }
    }
  }

}
/**
 * Returns the translations necessary to translate a matrix operation based on the `transformOrigin` parameter of the
 * given position instance. The first entry / index 0 is the pre-translation and last entry / index 1 is the post-
 * translation.
 *
 * This method is used internally, but may be useful if you need the origin translation matrices to transform
 * bespoke points based on any `transformOrigin` set in {@link PositionData}.
 *
 * @param {string}   transformOrigin - The transform origin attribute from PositionData.
 *
 * @param {number}   width - The PositionData width or validation data width when 'auto'.
 *
 * @param {number}   height - The PositionData height or validation data height when 'auto'.
 *
 * @param {Matrix4[]}   output - Output Mat4 array.
 *
 * @returns {Matrix4[]} Output Mat4 array.
 */

function s_GET_ORIGIN_TRANSLATION(transformOrigin, width, height, output) {
  const vector = s_VEC3_TEMP;

  switch (transformOrigin) {
    case 'top left':
      vector[0] = vector[1] = 0;
      mat4.fromTranslation(output[0], vector);
      mat4.fromTranslation(output[1], vector);
      break;

    case 'top center':
      vector[0] = -width * 0.5;
      vector[1] = 0;
      mat4.fromTranslation(output[0], vector);
      vector[0] = width * 0.5;
      mat4.fromTranslation(output[1], vector);
      break;

    case 'top right':
      vector[0] = -width;
      vector[1] = 0;
      mat4.fromTranslation(output[0], vector);
      vector[0] = width;
      mat4.fromTranslation(output[1], vector);
      break;

    case 'center left':
      vector[0] = 0;
      vector[1] = -height * 0.5;
      mat4.fromTranslation(output[0], vector);
      vector[1] = height * 0.5;
      mat4.fromTranslation(output[1], vector);
      break;

    case null: // By default null / no transform is center.

    case 'center':
      vector[0] = -width * 0.5;
      vector[1] = -height * 0.5;
      mat4.fromTranslation(output[0], vector);
      vector[0] = width * 0.5;
      vector[1] = height * 0.5;
      mat4.fromTranslation(output[1], vector);
      break;

    case 'center right':
      vector[0] = -width;
      vector[1] = -height * 0.5;
      mat4.fromTranslation(output[0], vector);
      vector[0] = width;
      vector[1] = height * 0.5;
      mat4.fromTranslation(output[1], vector);
      break;

    case 'bottom left':
      vector[0] = 0;
      vector[1] = -height;
      mat4.fromTranslation(output[0], vector);
      vector[1] = height;
      mat4.fromTranslation(output[1], vector);
      break;

    case 'bottom center':
      vector[0] = -width * 0.5;
      vector[1] = -height;
      mat4.fromTranslation(output[0], vector);
      vector[0] = width * 0.5;
      vector[1] = height;
      mat4.fromTranslation(output[1], vector);
      break;

    case 'bottom right':
      vector[0] = -width;
      vector[1] = -height;
      mat4.fromTranslation(output[0], vector);
      vector[0] = width;
      vector[1] = height;
      mat4.fromTranslation(output[1], vector);
      break;
    // No valid transform origin parameter; set identity.

    default:
      mat4.identity(output[0]);
      mat4.identity(output[1]);
      break;
  }

  return output;
}

class UpdateElementData {
  constructor() {
    /**
     * Stores the private data from Position.
     *
     * @type {PositionData}
     */
    this.data = void 0;
    /**
     * Provides a copy of local data sent to subscribers.
     *
     * @type {PositionData}
     */

    this.dataSubscribers = new PositionData();
    /**
     * Stores the current dimension data used for the readable `dimension` store.
     *
     * @type {{width: number | 'auto', height: number | 'auto'}}
     */

    this.dimensionData = {
      width: 0,
      height: 0
    };
    /**
     * @type {PositionChangeSet}
     */

    this.changeSet = void 0;
    /**
     * @type {PositionOptions}
     */

    this.options = void 0;
    /**
     * Stores if this Position / update data is queued for update.
     *
     * @type {boolean}
     */

    this.queued = false;
    /**
     * @type {StyleCache}
     */

    this.styleCache = void 0;
    /**
     * @type {Transforms}
     */

    this.transforms = void 0;
    /**
     * Stores the current transform data used for the readable `transform` store. It is only active when there are
     * subscribers to the store or calculateTransform options is true.
     *
     * @type {TransformData}
     */

    this.transformData = new TransformData();
    /**
     * @type {(function(PositionData): void)[]}
     */

    this.subscriptions = void 0;
    /**
     * @type {Writable<{width: (number|"auto"), height: (number|"auto")}>}
     */

    this.storeDimension = writable(this.dimensionData); // When there are subscribers set option to calculate transform updates; set to false when no subscribers.

    /**
     * @type {Writable<TransformData>}
     */

    this.storeTransform = writable(this.transformData, () => {
      this.options.transformSubscribed = true;
      return () => this.options.transformSubscribed = false;
    });
    /**
     * Stores the queued state for update element processing.
     *
     * @type {boolean}
     */

    this.queued = false; // Seal data backing readable stores.

    Object.seal(this.dimensionData);
  }

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

/**
 * Decouples updates to any parent target HTMLElement inline styles. Invoke {@link Position.elementUpdated} to await
 * on the returned promise that is resolved with the current render time via `nextAnimationFrame` /
 * `requestAnimationFrame`. This allows the underlying data model to be updated immediately while updates to the
 * element are in sync with the browser and potentially in the future be further throttled.
 *
 * @param {HTMLElement} el - The target HTMLElement.
 */

class UpdateElementManager {
  static get promise() {
    return this.updatePromise;
  }
  /**
   * Potentially adds the given element and internal updateData instance to the list.
   *
   * @param {HTMLElement}       el - An HTMLElement instance.
   *
   * @param {UpdateElementData} updateData - An UpdateElementData instance.
   *
   * @returns {Promise<number>} The unified next frame update promise. Returns `currentTime`.
   */


  static add(el, updateData) {
    if (this.listCntr < this.list.length) {
      const entry = this.list[this.listCntr];
      entry[0] = el;
      entry[1] = updateData;
    } else {
      this.list.push([el, updateData]);
    }

    this.listCntr++;
    updateData.queued = true;

    if (!this.updatePromise) {
      this.updatePromise = this.wait();
    }

    return this.updatePromise;
  }
  /**
   * Await on `nextAnimationFrame` and iterate over list map invoking callback functions.
   *
   * @returns {Promise<number>} The next frame Promise / currentTime from nextAnimationFrame.
   */


  static async wait() {
    // Await the next animation frame. In the future this can be extended to multiple frames to divide update rate.
    const currentTime = await nextAnimationFrame();
    this.updatePromise = void 0;

    for (let cntr = this.listCntr; --cntr >= 0;) {
      // Obtain data for entry.
      const entry = this.list[cntr];
      const el = entry[0];
      const updateData = entry[1]; // Clear entry data.

      entry[0] = void 0;
      entry[1] = void 0; // Reset queued state.

      updateData.queued = false; // Early out if the element is no longer connected to the DOM / shadow root.
      // if (!el.isConnected || !updateData.changeSet.hasChange()) { continue; }

      if (!el.isConnected) {
        continue;
      }

      if (updateData.options.ortho) {
        s_UPDATE_ELEMENT_ORTHO(el, updateData);
      } else {
        s_UPDATE_ELEMENT(el, updateData);
      } // If calculate transform options is enabled then update the transform data and set the readable store.


      if (updateData.options.calculateTransform || updateData.options.transformSubscribed) {
        s_UPDATE_TRANSFORM(el, updateData);
      } // Update all subscribers with changed data.


      this.updateSubscribers(updateData);
    }

    this.listCntr = 0;
    return currentTime;
  }
  /**
   * Potentially immediately updates the given element.
   *
   * @param {HTMLElement}       el - An HTMLElement instance.
   *
   * @param {UpdateElementData} updateData - An UpdateElementData instance.
   */


  static immediate(el, updateData) {
    // Early out if the element is no longer connected to the DOM / shadow root.
    // if (!el.isConnected || !updateData.changeSet.hasChange()) { continue; }
    if (!el.isConnected) {
      return;
    }

    if (updateData.options.ortho) {
      s_UPDATE_ELEMENT_ORTHO(el, updateData);
    } else {
      s_UPDATE_ELEMENT(el, updateData);
    } // If calculate transform options is enabled then update the transform data and set the readable store.


    if (updateData.options.calculateTransform || updateData.options.transformSubscribed) {
      s_UPDATE_TRANSFORM(el, updateData);
    } // Update all subscribers with changed data.


    this.updateSubscribers(updateData);
  }
  /**
   * @param {UpdateElementData} updateData - Data change set.
   */


  static updateSubscribers(updateData) {
    const data = updateData.data;
    const changeSet = updateData.changeSet;

    if (!changeSet.hasChange()) {
      return;
    } // Make a copy of the data.


    const output = updateData.dataSubscribers.copy(data);
    const subscriptions = updateData.subscriptions; // Early out if there are no subscribers.

    if (subscriptions.length > 0) {
      for (let cntr = 0; cntr < subscriptions.length; cntr++) {
        subscriptions[cntr](output);
      }
    } // Update dimension data if width / height has changed.


    if (changeSet.width || changeSet.height) {
      updateData.dimensionData.width = data.width;
      updateData.dimensionData.height = data.height;
      updateData.storeDimension.set(updateData.dimensionData);
    }

    changeSet.set(false);
  }

}
/**
 * Decouples updates to any parent target HTMLElement inline styles. Invoke {@link Position.elementUpdated} to await
 * on the returned promise that is resolved with the current render time via `nextAnimationFrame` /
 * `requestAnimationFrame`. This allows the underlying data model to be updated immediately while updates to the
 * element are in sync with the browser and potentially in the future be further throttled.
 *
 * @param {HTMLElement} el - The target HTMLElement.
 *
 * @param {UpdateElementData} updateData - Update data.
 */

_defineProperty(UpdateElementManager, "list", []);

_defineProperty(UpdateElementManager, "listCntr", 0);

_defineProperty(UpdateElementManager, "updatePromise", void 0);

function s_UPDATE_ELEMENT(el, updateData) {
  const changeSet = updateData.changeSet;
  const data = updateData.data;

  if (changeSet.left) {
    el.style.left = `${data.left}px`;
  }

  if (changeSet.top) {
    el.style.top = `${data.top}px`;
  }

  if (changeSet.zIndex) {
    el.style.zIndex = typeof data.zIndex === 'number' ? `${data.zIndex}` : null;
  }

  if (changeSet.width) {
    el.style.width = typeof data.width === 'number' ? `${data.width}px` : data.width;
  }

  if (changeSet.height) {
    el.style.height = typeof data.height === 'number' ? `${data.height}px` : data.height;
  }

  if (changeSet.transformOrigin) {
    // When set to 'center' we can simply set the transform to null which is center by default.
    el.style.transformOrigin = data.transformOrigin === 'center' ? null : data.transformOrigin;
  } // Update all transforms in order added to transforms object.


  if (changeSet.transform) {
    el.style.transform = updateData.transforms.isActive ? updateData.transforms.getCSS() : null;
  }
}
/**
 * Decouples updates to any parent target HTMLElement inline styles. Invoke {@link Position.elementUpdated} to await
 * on the returned promise that is resolved with the current render time via `nextAnimationFrame` /
 * `requestAnimationFrame`. This allows the underlying data model to be updated immediately while updates to the
 * element are in sync with the browser and potentially in the future be further throttled.
 *
 * @param {HTMLElement} el - The target HTMLElement.
 *
 * @param {UpdateElementData} updateData - Update data.
 */


function s_UPDATE_ELEMENT_ORTHO(el, updateData) {
  const changeSet = updateData.changeSet;
  const data = updateData.data;

  if (changeSet.zIndex) {
    el.style.zIndex = typeof data.zIndex === 'number' ? `${data.zIndex}` : null;
  }

  if (changeSet.width) {
    el.style.width = typeof data.width === 'number' ? `${data.width}px` : data.width;
  }

  if (changeSet.height) {
    el.style.height = typeof data.height === 'number' ? `${data.height}px` : data.height;
  }

  if (changeSet.transformOrigin) {
    // When set to 'center' we can simply set the transform to null which is center by default.
    el.style.transformOrigin = data.transformOrigin === 'center' ? null : data.transformOrigin;
  } // Update all transforms in order added to transforms object.


  if (changeSet.left || changeSet.top || changeSet.transform) {
    el.style.transform = updateData.transforms.getCSSOrtho(data);
  }
}
/**
 * Updates the applied transform data and sets the readble `transform` store.
 *
 * @param {HTMLElement} el - The target HTMLElement.
 *
 * @param {UpdateElementData} updateData - Update element data.
 */


function s_UPDATE_TRANSFORM(el, updateData) {
  s_VALIDATION_DATA$1.height = updateData.data.height !== 'auto' ? updateData.data.height : updateData.styleCache.offsetHeight;
  s_VALIDATION_DATA$1.width = updateData.data.width !== 'auto' ? updateData.data.width : updateData.styleCache.offsetWidth;
  s_VALIDATION_DATA$1.marginLeft = updateData.styleCache.marginLeft;
  s_VALIDATION_DATA$1.marginTop = updateData.styleCache.marginTop; // Get transform data. First set constraints including any margin top / left as offsets and width / height. Used
  // when position width / height is 'auto'.

  updateData.transforms.getData(updateData.data, updateData.transformData, s_VALIDATION_DATA$1);
  updateData.storeTransform.set(updateData.transformData);
}

const s_VALIDATION_DATA$1 = {
  height: void 0,
  width: void 0,
  marginLeft: void 0,
  marginTop: void 0
};

const _excluded$1 = ["left", "top", "maxWidth", "maxHeight", "minWidth", "minHeight", "width", "height", "rotateX", "rotateY", "rotateZ", "scale", "transformOrigin", "translateX", "translateY", "translateZ", "zIndex", "rotation"];
/**
 * Provides a store for position following the subscriber protocol in addition to providing individual writable derived
 * stores for each independent variable.
 */

var _data$1 = /*#__PURE__*/new WeakMap();

var _animate = /*#__PURE__*/new WeakMap();

var _positionChangeSet = /*#__PURE__*/new WeakMap();

var _options = /*#__PURE__*/new WeakMap();

var _parent = /*#__PURE__*/new WeakMap();

var _stores$1 = /*#__PURE__*/new WeakMap();

var _styleCache = /*#__PURE__*/new WeakMap();

var _subscriptions$1 = /*#__PURE__*/new WeakMap();

var _transforms = /*#__PURE__*/new WeakMap();

var _updateElementData = /*#__PURE__*/new WeakMap();

var _updateElementPromise = /*#__PURE__*/new WeakMap();

var _validators = /*#__PURE__*/new WeakMap();

var _validatorData = /*#__PURE__*/new WeakMap();

var _state = /*#__PURE__*/new WeakMap();

var _updatePosition = /*#__PURE__*/new WeakSet();

class Position {
  /**
   * @type {PositionData}
   */

  /**
   * Provides the animation API.
   *
   * @type {AnimationAPI}
   */

  /**
   * Stores the style attributes that changed on update.
   *
   * @type {PositionChangeSet}
   */

  /**
   * Stores ongoing options that are set in the constructor or by transform store subscription.
   *
   * @type {PositionOptions}
   */

  /**
   * The associated parent for positional data tracking. Used in validators.
   *
   * @type {PositionParent}
   */

  /**
   * @type {StorePosition}
   */

  /**
   * Stores an instance of the computer styles for the target element.
   *
   * @type {StyleCache}
   */

  /**
   * Stores the subscribers.
   *
   * @type {(function(PositionData): void)[]}
   */

  /**
   * @type {Transforms}
   */

  /**
   * @type {UpdateElementData}
   */

  /**
   * Stores the UpdateElementManager wait promise.
   *
   * @type {Promise}
   */

  /**
   * @type {AdapterValidators}
   */

  /**
   * @type {ValidatorData[]}
   */

  /**
   * @type {PositionStateAPI}
   */

  /**
   * @returns {AnimationGroupAPI} Public Animation API.
   */
  static get Animate() {
    return AnimationGroupAPI;
  }
  /**
   * @returns {{browserCentered?: Centered, Centered?: *}} Initial position helpers.
   */


  static get Initial() {
    return positionInitial;
  }
  /**
   * Returns TransformData class / constructor.
   *
   * @returns {TransformData} TransformData class / constructor.
   */


  static get TransformData() {
    return TransformData;
  }
  /**
   * Returns default validators.
   *
   * Note: `basicWindow` and `BasicBounds` will eventually be removed.
   *
   * @returns {{basicWindow?: BasicBounds, transformWindow?: TransformBounds, TransformBounds?: *, BasicBounds?: *}}
   *  Available validators.
   */


  static get Validators() {
    return positionValidators;
  }
  /**
   * Returns a duplicate of a given position instance copying any options and validators.
   *
   * // TODO: Consider more safety over options processing.
   *
   * @param {Position}          position - A position instance.
   *
   * @param {PositionOptions}   options - Position options.
   *
   * @returns {Position} A duplicate position instance.
   */


  static duplicate(position, options) {
    if (!(position instanceof Position)) {
      throw new TypeError(`'position' is not an instance of Position.`);
    }

    const newPosition = new Position(options);

    _classPrivateFieldSet(newPosition, _options, Object.assign({}, _classPrivateFieldGet(position, _options), options));

    _classPrivateFieldGet(newPosition, _validators).add(..._classPrivateFieldGet(position, _validators));

    newPosition.set(_classPrivateFieldGet(position, _data$1));
    return newPosition;
  }
  /**
   * @param {PositionParent|PositionOptionsAll}   [parent] - A potential parent element or object w/ `elementTarget`
   *                                                      getter. May also be the PositionOptions object w/ 1 argument.
   *
   * @param {PositionOptionsAll}   [options] - Default values.
   */


  constructor(_parent2, options) {
    var _options2, _options3, _options4;

    _classPrivateMethodInitSpec(this, _updatePosition);

    _classPrivateFieldInitSpec(this, _data$1, {
      writable: true,
      value: new PositionData()
    });

    _classPrivateFieldInitSpec(this, _animate, {
      writable: true,
      value: new AnimationAPI(this, _classPrivateFieldGet(this, _data$1))
    });

    _classPrivateFieldInitSpec(this, _positionChangeSet, {
      writable: true,
      value: new PositionChangeSet()
    });

    _classPrivateFieldInitSpec(this, _options, {
      writable: true,
      value: {
        calculateTransform: false,
        initialHelper: void 0,
        ortho: true,
        transformSubscribed: false
      }
    });

    _classPrivateFieldInitSpec(this, _parent, {
      writable: true,
      value: void 0
    });

    _classPrivateFieldInitSpec(this, _stores$1, {
      writable: true,
      value: void 0
    });

    _classPrivateFieldInitSpec(this, _styleCache, {
      writable: true,
      value: void 0
    });

    _classPrivateFieldInitSpec(this, _subscriptions$1, {
      writable: true,
      value: []
    });

    _classPrivateFieldInitSpec(this, _transforms, {
      writable: true,
      value: new Transforms()
    });

    _classPrivateFieldInitSpec(this, _updateElementData, {
      writable: true,
      value: void 0
    });

    _classPrivateFieldInitSpec(this, _updateElementPromise, {
      writable: true,
      value: void 0
    });

    _classPrivateFieldInitSpec(this, _validators, {
      writable: true,
      value: void 0
    });

    _classPrivateFieldInitSpec(this, _validatorData, {
      writable: true,
      value: void 0
    });

    _classPrivateFieldInitSpec(this, _state, {
      writable: true,
      value: new PositionStateAPI(this, _classPrivateFieldGet(this, _data$1), _classPrivateFieldGet(this, _transforms))
    });

    // Test if `parent` is a plain object; if so treat as options object.
    if (isPlainObject(_parent2)) {
      options = _parent2;
    } else {
      _classPrivateFieldSet(this, _parent, _parent2);
    }

    const data = _classPrivateFieldGet(this, _data$1);

    const transforms = _classPrivateFieldGet(this, _transforms);

    _classPrivateFieldSet(this, _styleCache, new StyleCache());

    const updateData = new UpdateElementData();
    updateData.changeSet = _classPrivateFieldGet(this, _positionChangeSet);
    updateData.data = _classPrivateFieldGet(this, _data$1);
    updateData.options = _classPrivateFieldGet(this, _options);
    updateData.styleCache = _classPrivateFieldGet(this, _styleCache);
    updateData.subscriptions = _classPrivateFieldGet(this, _subscriptions$1);
    updateData.transforms = _classPrivateFieldGet(this, _transforms);

    _classPrivateFieldSet(this, _updateElementData, updateData);

    if (typeof options === 'object') {
      // Set Position options
      if (typeof options.calculateTransform === 'boolean') {
        _classPrivateFieldGet(this, _options).calculateTransform = options.calculateTransform;
      }

      if (typeof options.ortho === 'boolean') {
        _classPrivateFieldGet(this, _options).ortho = options.ortho;
      } // Set default values from options.


      if (Number.isFinite(options.height) || options.height === 'auto' || options.height === 'inherit' || options.height === null) {
        data.height = updateData.dimensionData.height = typeof options.height === 'number' ? Math.round(options.height) : options.height;
      }

      if (Number.isFinite(options.left) || options.left === null) {
        data.left = typeof options.left === 'number' ? Math.round(options.left) : options.left;
      }

      if (Number.isFinite(options.maxHeight) || options.maxHeight === null) {
        data.maxHeight = typeof options.maxHeight === 'number' ? Math.round(options.maxHeight) : options.maxHeight;
      }

      if (Number.isFinite(options.maxWidth) || options.maxWidth === null) {
        data.maxWidth = typeof options.maxWidth === 'number' ? Math.round(options.maxWidth) : options.maxWidth;
      }

      if (Number.isFinite(options.minHeight) || options.minHeight === null) {
        data.minHeight = typeof options.minHeight === 'number' ? Math.round(options.minHeight) : options.minHeight;
      }

      if (Number.isFinite(options.minWidth) || options.minWidth === null) {
        data.minWidth = typeof options.minWidth === 'number' ? Math.round(options.minWidth) : options.minWidth;
      }

      if (Number.isFinite(options.rotateX) || options.rotateX === null) {
        transforms.rotateX = data.rotateX = options.rotateX;
      }

      if (Number.isFinite(options.rotateY) || options.rotateY === null) {
        transforms.rotateY = data.rotateY = options.rotateY;
      }

      if (Number.isFinite(options.rotateZ) || options.rotateZ === null) {
        transforms.rotateZ = data.rotateZ = options.rotateZ;
      }

      if (Number.isFinite(options.scale) || options.scale === null) {
        transforms.scale = data.scale = options.scale;
      }

      if (Number.isFinite(options.top) || options.top === null) {
        data.top = typeof options.top === 'number' ? Math.round(options.top) : options.top;
      }

      if (typeof options.transformOrigin === 'string' || options.transformOrigin === null) {
        data.transformOrigin = transformOrigins.includes(options.transformOrigin) ? options.transformOrigin : null;
      }

      if (Number.isFinite(options.translateX) || options.translateX === null) {
        transforms.translateX = data.translateX = options.translateX;
      }

      if (Number.isFinite(options.translateY) || options.translateY === null) {
        transforms.translateY = data.translateY = options.translateY;
      }

      if (Number.isFinite(options.translateZ) || options.translateZ === null) {
        transforms.translateZ = data.translateZ = options.translateZ;
      }

      if (Number.isFinite(options.width) || options.width === 'auto' || options.width === 'inherit' || options.width === null) {
        data.width = updateData.dimensionData.width = typeof options.width === 'number' ? Math.round(options.width) : options.width;
      }

      if (Number.isFinite(options.zIndex) || options.zIndex === null) {
        data.zIndex = typeof options.zIndex === 'number' ? Math.round(options.zIndex) : options.zIndex;
      }
    }

    _classPrivateFieldSet(this, _stores$1, {
      // The main properties for manipulating Position.
      height: propertyStore(this, 'height'),
      left: propertyStore(this, 'left'),
      rotateX: propertyStore(this, 'rotateX'),
      rotateY: propertyStore(this, 'rotateY'),
      rotateZ: propertyStore(this, 'rotateZ'),
      scale: propertyStore(this, 'scale'),
      top: propertyStore(this, 'top'),
      transformOrigin: propertyStore(this, 'transformOrigin'),
      translateX: propertyStore(this, 'translateX'),
      translateY: propertyStore(this, 'translateY'),
      translateZ: propertyStore(this, 'translateZ'),
      width: propertyStore(this, 'width'),
      zIndex: propertyStore(this, 'zIndex'),
      // Stores that control validation when width / height is not `auto`.
      maxHeight: propertyStore(this, 'maxHeight'),
      maxWidth: propertyStore(this, 'maxWidth'),
      minHeight: propertyStore(this, 'minHeight'),
      minWidth: propertyStore(this, 'minWidth'),
      // Readable stores based on updates or from resize observer changes.
      dimension: {
        subscribe: updateData.storeDimension.subscribe
      },
      element: {
        subscribe: _classPrivateFieldGet(this, _styleCache).stores.element.subscribe
      },
      resizeContentHeight: {
        subscribe: _classPrivateFieldGet(this, _styleCache).stores.resizeContentHeight.subscribe
      },
      resizeContentWidth: {
        subscribe: _classPrivateFieldGet(this, _styleCache).stores.resizeContentWidth.subscribe
      },
      resizeOffsetHeight: {
        subscribe: _classPrivateFieldGet(this, _styleCache).stores.resizeOffsetHeight.subscribe
      },
      resizeOffsetWidth: {
        subscribe: _classPrivateFieldGet(this, _styleCache).stores.resizeOffsetWidth.subscribe
      },
      transform: {
        subscribe: updateData.storeTransform.subscribe
      },
      // Protected store that should only be set by resizeObserver action.
      resizeObserved: _classPrivateFieldGet(this, _styleCache).stores.resizeObserved
    }); // When resize change from any applied resizeObserver action automatically set data for new validation run.
    // A resizeObserver prop should be set to true for ApplicationShell components or usage of resizeObserver action
    // to monitor for changes. This should only be used on elements that have 'auto' for width or height.


    subscribeIgnoreFirst(_classPrivateFieldGet(this, _stores$1).resizeObserved, resizeData => {
      const parent = _classPrivateFieldGet(this, _parent);

      const el = parent instanceof HTMLElement ? parent : parent === null || parent === void 0 ? void 0 : parent.elementTarget; // Only invoke set if there is a target element and the resize data has a valid offset width & height.

      if (el instanceof HTMLElement && Number.isFinite(resizeData === null || resizeData === void 0 ? void 0 : resizeData.offsetWidth) && Number.isFinite(resizeData === null || resizeData === void 0 ? void 0 : resizeData.offsetHeight)) {
        this.set(data);
      }
    });
    _classPrivateFieldGet(this, _stores$1).transformOrigin.values = transformOrigins;
    [_classPrivateFieldDestructureSet(this, _validators).value, _classPrivateFieldDestructureSet(this, _validatorData).value] = new AdapterValidators();

    if ((_options2 = options) !== null && _options2 !== void 0 && _options2.initial || (_options3 = options) !== null && _options3 !== void 0 && _options3.positionInitial) {
      var _options$initial;

      const initialHelper = (_options$initial = options.initial) !== null && _options$initial !== void 0 ? _options$initial : options.positionInitial;

      if (typeof (initialHelper === null || initialHelper === void 0 ? void 0 : initialHelper.getLeft) !== 'function' || typeof (initialHelper === null || initialHelper === void 0 ? void 0 : initialHelper.getTop) !== 'function') {
        throw new Error(`'options.initial' position helper does not contain 'getLeft' and / or 'getTop' functions.`);
      }

      _classPrivateFieldGet(this, _options).initialHelper = options.initial;
    }

    if ((_options4 = options) !== null && _options4 !== void 0 && _options4.validator) {
      var _options5;

      if (isIterable((_options5 = options) === null || _options5 === void 0 ? void 0 : _options5.validator)) {
        this.validators.add(...options.validator);
      } else {
        this.validators.add(options.validator);
      }
    }
  }
  /**
   * Returns the animation API.
   *
   * @returns {AnimationAPI} Animation API.
   */


  get animate() {
    return _classPrivateFieldGet(this, _animate);
  }
  /**
   * Returns the dimension data for the readable store.
   *
   * @returns {{width: number | 'auto', height: number | 'auto'}} Dimension data.
   */


  get dimension() {
    return _classPrivateFieldGet(this, _updateElementData).dimensionData;
  }
  /**
   * Returns the current HTMLElement being positioned.
   *
   * @returns {HTMLElement|undefined} Current HTMLElement being positioned.
   */


  get element() {
    return _classPrivateFieldGet(this, _styleCache).el;
  }
  /**
   * Returns a promise that is resolved on the next element update with the time of the update.
   *
   * @returns {Promise<number>} Promise resolved on element update.
   */


  get elementUpdated() {
    return _classPrivateFieldGet(this, _updateElementPromise);
  }
  /**
   * Returns the associated {@link PositionParent} instance.
   *
   * @returns {PositionParent} The PositionParent instance.
   */


  get parent() {
    return _classPrivateFieldGet(this, _parent);
  }
  /**
   * Returns the state API.
   *
   * @returns {PositionStateAPI} Position state API.
   */


  get state() {
    return _classPrivateFieldGet(this, _state);
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
   * Returns the transform data for the readable store.
   *
   * @returns {TransformData} Transform Data.
   */


  get transform() {
    return _classPrivateFieldGet(this, _updateElementData).transformData;
  }
  /**
   * Returns the validators.
   *
   * @returns {AdapterValidators} validators.
   */


  get validators() {
    return _classPrivateFieldGet(this, _validators);
  }
  /**
   * Sets the associated {@link PositionParent} instance. Resets the style cache and default data.
   *
   * @param {PositionParent|void} parent - A PositionParent instance.
   */


  set parent(parent) {
    if (parent !== void 0 && !(parent instanceof HTMLElement) && !isObject(parent)) {
      throw new TypeError(`'parent' is not an HTMLElement, object, or undefined.`);
    }

    _classPrivateFieldSet(this, _parent, parent); // Reset any stored default data & the style cache.


    _classPrivateFieldGet(this, _state).remove({
      name: '#defaultData'
    });

    _classPrivateFieldGet(this, _styleCache).reset(); // If a parent is defined then invoke set to update any parent element.


    if (parent) {
      this.set(_classPrivateFieldGet(this, _data$1));
    }
  } // Data accessors ----------------------------------------------------------------------------------------------------

  /**
   * @returns {number|'auto'|'inherit'|null} height
   */


  get height() {
    return _classPrivateFieldGet(this, _data$1).height;
  }
  /**
   * @returns {number|null} left
   */


  get left() {
    return _classPrivateFieldGet(this, _data$1).left;
  }
  /**
   * @returns {number|null} maxHeight
   */


  get maxHeight() {
    return _classPrivateFieldGet(this, _data$1).maxHeight;
  }
  /**
   * @returns {number|null} maxWidth
   */


  get maxWidth() {
    return _classPrivateFieldGet(this, _data$1).maxWidth;
  }
  /**
   * @returns {number|null} minHeight
   */


  get minHeight() {
    return _classPrivateFieldGet(this, _data$1).minHeight;
  }
  /**
   * @returns {number|null} minWidth
   */


  get minWidth() {
    return _classPrivateFieldGet(this, _data$1).minWidth;
  }
  /**
   * @returns {number|null} rotateX
   */


  get rotateX() {
    return _classPrivateFieldGet(this, _data$1).rotateX;
  }
  /**
   * @returns {number|null} rotateY
   */


  get rotateY() {
    return _classPrivateFieldGet(this, _data$1).rotateY;
  }
  /**
   * @returns {number|null} rotateZ
   */


  get rotateZ() {
    return _classPrivateFieldGet(this, _data$1).rotateZ;
  }
  /**
   * @returns {number|null} alias for rotateZ
   */


  get rotation() {
    return _classPrivateFieldGet(this, _data$1).rotateZ;
  }
  /**
   * @returns {number|null} scale
   */


  get scale() {
    return _classPrivateFieldGet(this, _data$1).scale;
  }
  /**
   * @returns {number|null} top
   */


  get top() {
    return _classPrivateFieldGet(this, _data$1).top;
  }
  /**
   * @returns {string} transformOrigin
   */


  get transformOrigin() {
    return _classPrivateFieldGet(this, _data$1).transformOrigin;
  }
  /**
   * @returns {number|null} translateX
   */


  get translateX() {
    return _classPrivateFieldGet(this, _data$1).translateX;
  }
  /**
   * @returns {number|null} translateY
   */


  get translateY() {
    return _classPrivateFieldGet(this, _data$1).translateY;
  }
  /**
   * @returns {number|null} translateZ
   */


  get translateZ() {
    return _classPrivateFieldGet(this, _data$1).translateZ;
  }
  /**
   * @returns {number|'auto'|'inherit'|null} width
   */


  get width() {
    return _classPrivateFieldGet(this, _data$1).width;
  }
  /**
   * @returns {number|null} z-index
   */


  get zIndex() {
    return _classPrivateFieldGet(this, _data$1).zIndex;
  }
  /**
   * @param {number|string|null} height -
   */


  set height(height) {
    _classPrivateFieldGet(this, _stores$1).height.set(height);
  }
  /**
   * @param {number|string|null} left -
   */


  set left(left) {
    _classPrivateFieldGet(this, _stores$1).left.set(left);
  }
  /**
   * @param {number|string|null} maxHeight -
   */


  set maxHeight(maxHeight) {
    _classPrivateFieldGet(this, _stores$1).maxHeight.set(maxHeight);
  }
  /**
   * @param {number|string|null} maxWidth -
   */


  set maxWidth(maxWidth) {
    _classPrivateFieldGet(this, _stores$1).maxWidth.set(maxWidth);
  }
  /**
   * @param {number|string|null} minHeight -
   */


  set minHeight(minHeight) {
    _classPrivateFieldGet(this, _stores$1).minHeight.set(minHeight);
  }
  /**
   * @param {number|string|null} minWidth -
   */


  set minWidth(minWidth) {
    _classPrivateFieldGet(this, _stores$1).minWidth.set(minWidth);
  }
  /**
   * @param {number|string|null} rotateX -
   */


  set rotateX(rotateX) {
    _classPrivateFieldGet(this, _stores$1).rotateX.set(rotateX);
  }
  /**
   * @param {number|string|null} rotateY -
   */


  set rotateY(rotateY) {
    _classPrivateFieldGet(this, _stores$1).rotateY.set(rotateY);
  }
  /**
   * @param {number|string|null} rotateZ -
   */


  set rotateZ(rotateZ) {
    _classPrivateFieldGet(this, _stores$1).rotateZ.set(rotateZ);
  }
  /**
   * @param {number|string|null} rotateZ - alias for rotateZ
   */


  set rotation(rotateZ) {
    _classPrivateFieldGet(this, _stores$1).rotateZ.set(rotateZ);
  }
  /**
   * @param {number|string|null} scale -
   */


  set scale(scale) {
    _classPrivateFieldGet(this, _stores$1).scale.set(scale);
  }
  /**
   * @param {number|string|null} top -
   */


  set top(top) {
    _classPrivateFieldGet(this, _stores$1).top.set(top);
  }
  /**
   * @param {string} transformOrigin -
   */


  set transformOrigin(transformOrigin) {
    if (transformOrigins.includes(transformOrigin)) {
      _classPrivateFieldGet(this, _stores$1).transformOrigin.set(transformOrigin);
    }
  }
  /**
   * @param {number|string|null} translateX -
   */


  set translateX(translateX) {
    _classPrivateFieldGet(this, _stores$1).translateX.set(translateX);
  }
  /**
   * @param {number|string|null} translateY -
   */


  set translateY(translateY) {
    _classPrivateFieldGet(this, _stores$1).translateY.set(translateY);
  }
  /**
   * @param {number|string|null} translateZ -
   */


  set translateZ(translateZ) {
    _classPrivateFieldGet(this, _stores$1).translateZ.set(translateZ);
  }
  /**
   * @param {number|string|null} width -
   */


  set width(width) {
    _classPrivateFieldGet(this, _stores$1).width.set(width);
  }
  /**
   * @param {number|string|null} zIndex -
   */


  set zIndex(zIndex) {
    _classPrivateFieldGet(this, _stores$1).zIndex.set(zIndex);
  }
  /**
   * Assigns current position to object passed into method.
   *
   * @param {object|PositionData}  [position] - Target to assign current position data.
   *
   * @param {PositionGetOptions}   [options] - Defines options for specific keys and substituting null for numeric
   *                                           default values.
   *
   * @returns {PositionData} Passed in object with current position data.
   */


  get(position = {}, options) {
    const keys = options === null || options === void 0 ? void 0 : options.keys;

    if (isIterable(options === null || options === void 0 ? void 0 : options.keys)) {
      // Replace any null values potentially with numeric default values.
      if (options !== null && options !== void 0 && options.numeric) {
        for (const key of keys) {
          var _this$key;

          position[key] = (_this$key = this[key]) !== null && _this$key !== void 0 ? _this$key : numericDefaults[key];
        }
      } else // Accept current values.
        {
          for (const key of keys) {
            position[key] = this[key];
          }
        }

      return position;
    } else {
      return Object.assign(position, _classPrivateFieldGet(this, _data$1));
    }
  }
  /**
   * @returns {PositionData} Current position data.
   */


  toJSON() {
    return Object.assign({}, _classPrivateFieldGet(this, _data$1));
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
   * @param {PositionDataExtended} [position] - Position data to set.
   *
   * @returns {Position} This Position instance.
   */


  set(position = {}) {
    var _parent$options, _parent$options2;

    if (typeof position !== 'object') {
      throw new TypeError(`Position - set error: 'position' is not an object.`);
    }

    const parent = _classPrivateFieldGet(this, _parent); // An early out to prevent `set` from taking effect if options `positionable` is false.


    if (parent !== void 0 && typeof (parent === null || parent === void 0 ? void 0 : (_parent$options = parent.options) === null || _parent$options === void 0 ? void 0 : _parent$options.positionable) === 'boolean' && !(parent !== null && parent !== void 0 && (_parent$options2 = parent.options) !== null && _parent$options2 !== void 0 && _parent$options2.positionable)) {
      return this;
    } // Callers can specify to immediately update an associated element. This is useful if set is called from
    // requestAnimationFrame / rAF. Library integrations like GSAP invoke set from rAF.


    const immediateElementUpdate = position.immediateElementUpdate === true;

    const data = _classPrivateFieldGet(this, _data$1);

    const transforms = _classPrivateFieldGet(this, _transforms); // Find the target HTML element and verify that it is connected storing it in `el`.


    const targetEl = parent instanceof HTMLElement ? parent : parent === null || parent === void 0 ? void 0 : parent.elementTarget;
    const el = targetEl instanceof HTMLElement && targetEl.isConnected ? targetEl : void 0;

    const changeSet = _classPrivateFieldGet(this, _positionChangeSet);

    const styleCache = _classPrivateFieldGet(this, _styleCache);

    if (el) {
      // Cache the computed styles of the element.
      if (!styleCache.hasData(el)) {
        styleCache.update(el); // Add will-change property if not already set in inline or computed styles.

        if (!styleCache.hasWillChange) {
          el.style.willChange = _classPrivateFieldGet(this, _options).ortho ? 'transform' : 'top, left, transform';
        } // Update all properties / clear queued state.


        changeSet.set(true);
        _classPrivateFieldGet(this, _updateElementData).queued = false;
      } // Converts any relative string position data to numeric inputs.


      convertRelative(position, this);
      position = _classPrivateMethodGet(this, _updatePosition, _updatePosition2).call(this, position, parent, el, styleCache); // Check if a validator cancelled the update.

      if (position === null) {
        return this;
      }
    }

    if (Number.isFinite(position.left)) {
      position.left = Math.round(position.left);

      if (data.left !== position.left) {
        data.left = position.left;
        changeSet.left = true;
      }
    }

    if (Number.isFinite(position.top)) {
      position.top = Math.round(position.top);

      if (data.top !== position.top) {
        data.top = position.top;
        changeSet.top = true;
      }
    }

    if (Number.isFinite(position.maxHeight) || position.maxHeight === null) {
      position.maxHeight = typeof position.maxHeight === 'number' ? Math.round(position.maxHeight) : null;

      if (data.maxHeight !== position.maxHeight) {
        data.maxHeight = position.maxHeight;
        changeSet.maxHeight = true;
      }
    }

    if (Number.isFinite(position.maxWidth) || position.maxWidth === null) {
      position.maxWidth = typeof position.maxWidth === 'number' ? Math.round(position.maxWidth) : null;

      if (data.maxWidth !== position.maxWidth) {
        data.maxWidth = position.maxWidth;
        changeSet.maxWidth = true;
      }
    }

    if (Number.isFinite(position.minHeight) || position.minHeight === null) {
      position.minHeight = typeof position.minHeight === 'number' ? Math.round(position.minHeight) : null;

      if (data.minHeight !== position.minHeight) {
        data.minHeight = position.minHeight;
        changeSet.minHeight = true;
      }
    }

    if (Number.isFinite(position.minWidth) || position.minWidth === null) {
      position.minWidth = typeof position.minWidth === 'number' ? Math.round(position.minWidth) : null;

      if (data.minWidth !== position.minWidth) {
        data.minWidth = position.minWidth;
        changeSet.minWidth = true;
      }
    }

    if (Number.isFinite(position.rotateX) || position.rotateX === null) {
      if (data.rotateX !== position.rotateX) {
        data.rotateX = transforms.rotateX = position.rotateX;
        changeSet.transform = true;
      }
    }

    if (Number.isFinite(position.rotateY) || position.rotateY === null) {
      if (data.rotateY !== position.rotateY) {
        data.rotateY = transforms.rotateY = position.rotateY;
        changeSet.transform = true;
      }
    }

    if (Number.isFinite(position.rotateZ) || position.rotateZ === null) {
      if (data.rotateZ !== position.rotateZ) {
        data.rotateZ = transforms.rotateZ = position.rotateZ;
        changeSet.transform = true;
      }
    }

    if (Number.isFinite(position.scale) || position.scale === null) {
      position.scale = typeof position.scale === 'number' ? Math.max(0, Math.min(position.scale, 1000)) : null;

      if (data.scale !== position.scale) {
        data.scale = transforms.scale = position.scale;
        changeSet.transform = true;
      }
    }

    if (typeof position.transformOrigin === 'string' && transformOrigins.includes(position.transformOrigin) || position.transformOrigin === null) {
      if (data.transformOrigin !== position.transformOrigin) {
        data.transformOrigin = position.transformOrigin;
        changeSet.transformOrigin = true;
      }
    }

    if (Number.isFinite(position.translateX) || position.translateX === null) {
      if (data.translateX !== position.translateX) {
        data.translateX = transforms.translateX = position.translateX;
        changeSet.transform = true;
      }
    }

    if (Number.isFinite(position.translateY) || position.translateY === null) {
      if (data.translateY !== position.translateY) {
        data.translateY = transforms.translateY = position.translateY;
        changeSet.transform = true;
      }
    }

    if (Number.isFinite(position.translateZ) || position.translateZ === null) {
      if (data.translateZ !== position.translateZ) {
        data.translateZ = transforms.translateZ = position.translateZ;
        changeSet.transform = true;
      }
    }

    if (Number.isFinite(position.zIndex)) {
      position.zIndex = Math.round(position.zIndex);

      if (data.zIndex !== position.zIndex) {
        data.zIndex = position.zIndex;
        changeSet.zIndex = true;
      }
    }

    if (Number.isFinite(position.width) || position.width === 'auto' || position.width === 'inherit' || position.width === null) {
      position.width = typeof position.width === 'number' ? Math.round(position.width) : position.width;

      if (data.width !== position.width) {
        data.width = position.width;
        changeSet.width = true;
      }
    }

    if (Number.isFinite(position.height) || position.height === 'auto' || position.height === 'inherit' || position.height === null) {
      position.height = typeof position.height === 'number' ? Math.round(position.height) : position.height;

      if (data.height !== position.height) {
        data.height = position.height;
        changeSet.height = true;
      }
    }

    if (el) {
      const defaultData = _classPrivateFieldGet(this, _state).getDefault(); // Set default data after first set operation that has a target element.


      if (typeof defaultData !== 'object') {
        _classPrivateFieldGet(this, _state).save(_objectSpread2({
          name: '#defaultData'
        }, Object.assign({}, data)));
      } // If `immediateElementUpdate` is true in position data passed to `set` then update the element immediately.
      // This is for rAF based library integrations like GSAP.


      if (immediateElementUpdate) {
        UpdateElementManager.immediate(el, _classPrivateFieldGet(this, _updateElementData));

        _classPrivateFieldSet(this, _updateElementPromise, Promise.resolve(performance.now()));
      } // Else if not queued then queue an update for the next rAF callback.
      else if (!_classPrivateFieldGet(this, _updateElementData).queued) {
        _classPrivateFieldSet(this, _updateElementPromise, UpdateElementManager.add(el, _classPrivateFieldGet(this, _updateElementData)));
      }
    } else {
      // Notify main store subscribers.
      UpdateElementManager.updateSubscribers(_classPrivateFieldGet(this, _updateElementData));
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
    _classPrivateFieldGet(this, _subscriptions$1).push(handler); // add handler to the array of subscribers


    handler(Object.assign({}, _classPrivateFieldGet(this, _data$1))); // call handler with current value
    // Return unsubscribe function.

    return () => {
      const index = _classPrivateFieldGet(this, _subscriptions$1).findIndex(sub => sub === handler);

      if (index >= 0) {
        _classPrivateFieldGet(this, _subscriptions$1).splice(index, 1);
      }
    };
  }
  /**
   * @param {PositionDataExtended} opts -
   *
   * @param {number|null} opts.left -
   *
   * @param {number|null} opts.top -
   *
   * @param {number|null} opts.maxHeight -
   *
   * @param {number|null} opts.maxWidth -
   *
   * @param {number|null} opts.minHeight -
   *
   * @param {number|null} opts.minWidth -
   *
   * @param {number|'auto'|null} opts.width -
   *
   * @param {number|'auto'|null} opts.height -
   *
   * @param {number|null} opts.rotateX -
   *
   * @param {number|null} opts.rotateY -
   *
   * @param {number|null} opts.rotateZ -
   *
   * @param {number|null} opts.scale -
   *
   * @param {string} opts.transformOrigin -
   *
   * @param {number|null} opts.translateX -
   *
   * @param {number|null} opts.translateY -
   *
   * @param {number|null} opts.translateZ -
   *
   * @param {number|null} opts.zIndex -
   *
   * @param {number|null} opts.rotation - alias for rotateZ
   *
   * @param {*} opts.rest -
   *
   * @param {object} parent -
   *
   * @param {HTMLElement} el -
   *
   * @param {StyleCache} styleCache -
   *
   * @returns {null|PositionData} Updated position data or null if validation fails.
   */


}

function _updatePosition2(_ref = {}, parent, el, styleCache) {
  let {
    // Directly supported parameters
    left,
    top,
    maxWidth,
    maxHeight,
    minWidth,
    minHeight,
    width,
    height,
    rotateX,
    rotateY,
    rotateZ,
    scale,
    transformOrigin,
    translateX,
    translateY,
    translateZ,
    zIndex,
    // Aliased parameters
    rotation
  } = _ref,
      rest = _objectWithoutProperties(_ref, _excluded$1);

  let currentPosition = s_DATA_UPDATE.copy(_classPrivateFieldGet(this, _data$1)); // Update width if an explicit value is passed, or if no width value is set on the element.

  if (el.style.width === '' || width !== void 0) {
    if (width === 'auto' || currentPosition.width === 'auto' && width !== null) {
      currentPosition.width = 'auto';
      width = styleCache.offsetWidth;
    } else if (width === 'inherit' || currentPosition.width === 'inherit' && width !== null) {
      currentPosition.width = 'inherit';
      width = styleCache.offsetWidth;
    } else {
      const newWidth = Number.isFinite(width) ? width : currentPosition.width;
      currentPosition.width = width = Number.isFinite(newWidth) ? Math.round(newWidth) : styleCache.offsetWidth;
    }
  } else {
    width = Number.isFinite(currentPosition.width) ? currentPosition.width : styleCache.offsetWidth;
  } // Update height if an explicit value is passed, or if no height value is set on the element.


  if (el.style.height === '' || height !== void 0) {
    if (height === 'auto' || currentPosition.height === 'auto' && height !== null) {
      currentPosition.height = 'auto';
      height = styleCache.offsetHeight;
    } else if (height === 'inherit' || currentPosition.height === 'inherit' && height !== null) {
      currentPosition.height = 'inherit';
      height = styleCache.offsetHeight;
    } else {
      const newHeight = Number.isFinite(height) ? height : currentPosition.height;
      currentPosition.height = height = Number.isFinite(newHeight) ? Math.round(newHeight) : styleCache.offsetHeight;
    }
  } else {
    height = Number.isFinite(currentPosition.height) ? currentPosition.height : styleCache.offsetHeight;
  } // Update left


  if (Number.isFinite(left)) {
    currentPosition.left = left;
  } else if (!Number.isFinite(currentPosition.left)) {
    var _classPrivateFieldGet2;

    // Potentially use any initial position helper if available or set to 0.
    currentPosition.left = typeof ((_classPrivateFieldGet2 = _classPrivateFieldGet(this, _options).initialHelper) === null || _classPrivateFieldGet2 === void 0 ? void 0 : _classPrivateFieldGet2.getLeft) === 'function' ? _classPrivateFieldGet(this, _options).initialHelper.getLeft(width) : 0;
  } // Update top


  if (Number.isFinite(top)) {
    currentPosition.top = top;
  } else if (!Number.isFinite(currentPosition.top)) {
    var _classPrivateFieldGet3;

    // Potentially use any initial position helper if available or set to 0.
    currentPosition.top = typeof ((_classPrivateFieldGet3 = _classPrivateFieldGet(this, _options).initialHelper) === null || _classPrivateFieldGet3 === void 0 ? void 0 : _classPrivateFieldGet3.getTop) === 'function' ? _classPrivateFieldGet(this, _options).initialHelper.getTop(height) : 0;
  }

  if (Number.isFinite(maxHeight) || maxHeight === null) {
    currentPosition.maxHeight = Number.isFinite(maxHeight) ? Math.round(maxHeight) : null;
  }

  if (Number.isFinite(maxWidth) || maxWidth === null) {
    currentPosition.maxWidth = Number.isFinite(maxWidth) ? Math.round(maxWidth) : null;
  }

  if (Number.isFinite(minHeight) || minHeight === null) {
    currentPosition.minHeight = Number.isFinite(minHeight) ? Math.round(minHeight) : null;
  }

  if (Number.isFinite(minWidth) || minWidth === null) {
    currentPosition.minWidth = Number.isFinite(minWidth) ? Math.round(minWidth) : null;
  } // Update rotate X/Y/Z, scale, z-index


  if (Number.isFinite(rotateX) || rotateX === null) {
    currentPosition.rotateX = rotateX;
  }

  if (Number.isFinite(rotateY) || rotateY === null) {
    currentPosition.rotateY = rotateY;
  } // Handle alias for rotateZ. First check if `rotateZ` is valid and different from the current value. Next check if
  // `rotation` is valid and use it for `rotateZ`.


  if (rotateZ !== currentPosition.rotateZ && (Number.isFinite(rotateZ) || rotateZ === null)) {
    currentPosition.rotateZ = rotateZ;
  } else if (rotation !== currentPosition.rotateZ && (Number.isFinite(rotation) || rotation === null)) {
    currentPosition.rotateZ = rotation;
  }

  if (Number.isFinite(translateX) || translateX === null) {
    currentPosition.translateX = translateX;
  }

  if (Number.isFinite(translateY) || translateY === null) {
    currentPosition.translateY = translateY;
  }

  if (Number.isFinite(translateZ) || translateZ === null) {
    currentPosition.translateZ = translateZ;
  }

  if (Number.isFinite(scale) || scale === null) {
    currentPosition.scale = typeof scale === 'number' ? Math.max(0, Math.min(scale, 1000)) : null;
  }

  if (typeof transformOrigin === 'string' || transformOrigin === null) {
    currentPosition.transformOrigin = transformOrigins.includes(transformOrigin) ? transformOrigin : null;
  }

  if (Number.isFinite(zIndex) || zIndex === null) {
    currentPosition.zIndex = typeof zIndex === 'number' ? Math.round(zIndex) : zIndex;
  }

  const validatorData = _classPrivateFieldGet(this, _validatorData); // If there are any validators allow them to potentially modify position data or reject the update.


  if (validatorData.length) {
    var _styleCache$maxHeight, _styleCache$maxWidth, _parent$reactive$mini, _parent$reactive, _currentPosition$minH, _currentPosition$minH2, _currentPosition$minW, _currentPosition$minW2;

    s_VALIDATION_DATA.parent = parent;
    s_VALIDATION_DATA.el = el;
    s_VALIDATION_DATA.computed = styleCache.computed;
    s_VALIDATION_DATA.transforms = _classPrivateFieldGet(this, _transforms);
    s_VALIDATION_DATA.height = height;
    s_VALIDATION_DATA.width = width;
    s_VALIDATION_DATA.marginLeft = styleCache.marginLeft;
    s_VALIDATION_DATA.marginTop = styleCache.marginTop;
    s_VALIDATION_DATA.maxHeight = (_styleCache$maxHeight = styleCache.maxHeight) !== null && _styleCache$maxHeight !== void 0 ? _styleCache$maxHeight : currentPosition.maxHeight;
    s_VALIDATION_DATA.maxWidth = (_styleCache$maxWidth = styleCache.maxWidth) !== null && _styleCache$maxWidth !== void 0 ? _styleCache$maxWidth : currentPosition.maxWidth; // Given a parent w/ reactive state and is minimized ignore styleCache min-width/height.

    const isMinimized = (_parent$reactive$mini = parent === null || parent === void 0 ? void 0 : (_parent$reactive = parent.reactive) === null || _parent$reactive === void 0 ? void 0 : _parent$reactive.minimized) !== null && _parent$reactive$mini !== void 0 ? _parent$reactive$mini : false; // Note the use of || for accessing the style cache as the left hand is ignored w/ falsy values such as '0'.

    s_VALIDATION_DATA.minHeight = isMinimized ? (_currentPosition$minH = currentPosition.minHeight) !== null && _currentPosition$minH !== void 0 ? _currentPosition$minH : 0 : styleCache.minHeight || ((_currentPosition$minH2 = currentPosition.minHeight) !== null && _currentPosition$minH2 !== void 0 ? _currentPosition$minH2 : 0);
    s_VALIDATION_DATA.minWidth = isMinimized ? (_currentPosition$minW = currentPosition.minWidth) !== null && _currentPosition$minW !== void 0 ? _currentPosition$minW : 0 : styleCache.minWidth || ((_currentPosition$minW2 = currentPosition.minWidth) !== null && _currentPosition$minW2 !== void 0 ? _currentPosition$minW2 : 0);

    for (let cntr = 0; cntr < validatorData.length; cntr++) {
      s_VALIDATION_DATA.position = currentPosition;
      s_VALIDATION_DATA.rest = rest;
      currentPosition = validatorData[cntr].validator(s_VALIDATION_DATA);

      if (currentPosition === null) {
        return null;
      }
    }
  } // Return the updated position object.


  return currentPosition;
}

const s_DATA_UPDATE = new PositionData();
/**
 * @type {ValidationData}
 */

const s_VALIDATION_DATA = {
  position: void 0,
  parent: void 0,
  el: void 0,
  computed: void 0,
  transforms: void 0,
  height: void 0,
  width: void 0,
  marginLeft: void 0,
  marginTop: void 0,
  maxHeight: void 0,
  maxWidth: void 0,
  minHeight: void 0,
  minWidth: void 0,
  rest: void 0
};
Object.seal(s_VALIDATION_DATA);
/**
 * @typedef {object} InitialHelper
 *
 * @property {Function} getLeft - A function that takes the width parameter and returns the left position.
 *
 * @property {Function} getTop - A function that takes the height parameter and returns the top position.
 */

/**
 * @typedef {object} PositionDataExtended
 *
 * @property {number|string|null} [height] -
 *
 * @property {number|string|null} [left] -
 *
 * @property {number|string|null} [maxHeight] -
 *
 * @property {number|string|null} [maxWidth] -
 *
 * @property {number|string|null} [minHeight] -
 *
 * @property {number|string|null} [minWidth] -
 *
 * @property {number|string|null} [rotateX] -
 *
 * @property {number|string|null} [rotateY] -
 *
 * @property {number|string|null} [rotateZ] -
 *
 * @property {number|string|null} [scale] -
 *
 * @property {number|string|null} [top] -
 *
 * @property {string|null} [transformOrigin] -
 *
 * @property {number|string|null} [translateX] -
 *
 * @property {number|string|null} [translateY] -
 *
 * @property {number|string|null} [translateZ] -
 *
 * @property {number|string|null} [width] -
 *
 * @property {number|string|null} [zIndex] -
 *
 * Extended properties -----------------------------------------------------------------------------------------------
 *
 * @property {boolean} [immediateElementUpdate] - When true any associated element is updated immediately.
 *
 * @property {number|null} [rotation] - Alias for `rotateZ`.
 */

/**
 * @typedef {object} PositionGetOptions
 *
 * @property {Iterable<string>} keys - When provided only these keys are copied.
 *
 * @property {boolean} numeric - When true any `null` values are converted into defaults.
 */

/**
 * @typedef {object} PositionOptions - Options set in constructor.
 *
 * @property {boolean} calculateTransform - When true always calculate transform data.
 *
 * @property {InitialHelper} initialHelper - Provides a helper for setting initial position data.
 *
 * @property {boolean} ortho - Sets Position to orthographic mode using just transform / matrix3d for positioning.
 *
 * @property {boolean} transformSubscribed - Set to true when there are subscribers to the readable transform store.
 */

/**
 * @typedef {PositionOptions & PositionData} PositionOptionsAll
 */

/**
 * @typedef {HTMLElement | object} PositionParent
 *
 * @property {Function} [elementTarget] - Potentially returns any parent object.
 */

/**
 * @typedef {object} ResizeObserverData
 *
 * @property {number|undefined} contentHeight -
 *
 * @property {number|undefined} contentWidth -
 *
 * @property {number|undefined} offsetHeight -
 *
 * @property {number|undefined} offsetWidth -
 */

/**
 * @typedef {object} StorePosition - Provides individual writable stores for {@link Position}.
 *
 * @property {import('svelte/store').Readable<{width: number, height: number}>} dimension - Readable store for dimension
 *                                                                                          data.
 *
 * @property {import('svelte/store').Readable<HTMLElement>} element - Readable store for current element.
 *
 * @property {import('svelte/store').Writable<number|null>} left - Derived store for `left` updates.
 *
 * @property {import('svelte/store').Writable<number|null>} top - Derived store for `top` updates.
 *
 * @property {import('svelte/store').Writable<number|'auto'|null>} width - Derived store for `width` updates.
 *
 * @property {import('svelte/store').Writable<number|'auto'|null>} height - Derived store for `height` updates.
 *
 * @property {import('svelte/store').Writable<number|null>} maxHeight - Derived store for `maxHeight` updates.
 *
 * @property {import('svelte/store').Writable<number|null>} maxWidth - Derived store for `maxWidth` updates.
 *
 * @property {import('svelte/store').Writable<number|null>} minHeight - Derived store for `minHeight` updates.
 *
 * @property {import('svelte/store').Writable<number|null>} minWidth - Derived store for `minWidth` updates.
 *
 * @property {import('svelte/store').Readable<number|undefined>} resizeContentHeight - Readable store for `contentHeight`.
 *
 * @property {import('svelte/store').Readable<number|undefined>} resizeContentWidth - Readable store for `contentWidth`.
 *
 * @property {import('svelte/store').Writable<ResizeObserverData>} resizeObserved - Protected store for resize observer updates.
 *
 * @property {import('svelte/store').Readable<number|undefined>} resizeOffsetHeight - Readable store for `offsetHeight`.
 *
 * @property {import('svelte/store').Readable<number|undefined>} resizeOffsetWidth - Readable store for `offsetWidth`.
 *
 * @property {import('svelte/store').Writable<number|null>} rotate - Derived store for `rotate` updates.
 *
 * @property {import('svelte/store').Writable<number|null>} rotateX - Derived store for `rotateX` updates.
 *
 * @property {import('svelte/store').Writable<number|null>} rotateY - Derived store for `rotateY` updates.
 *
 * @property {import('svelte/store').Writable<number|null>} rotateZ - Derived store for `rotateZ` updates.
 *
 * @property {import('svelte/store').Writable<number|null>} scale - Derived store for `scale` updates.
 *
 * @property {import('svelte/store').Readable<TransformData>} transform - Readable store for transform data.
 *
 * @property {import('svelte/store').Writable<string>} transformOrigin - Derived store for `transformOrigin`.
 *
 * @property {import('svelte/store').Writable<number|null>} translateX - Derived store for `translateX` updates.
 *
 * @property {import('svelte/store').Writable<number|null>} translateY - Derived store for `translateY` updates.
 *
 * @property {import('svelte/store').Writable<number|null>} translateZ - Derived store for `translateZ` updates.
 *
 * @property {import('svelte/store').Writable<number|null>} zIndex - Derived store for `zIndex` updates.
 */

/**
 * @typedef {object} ValidationData
 *
 * @property {PositionData} position -
 *
 * @property {PositionParent} parent -
 *
 * @property {HTMLElement} el -
 *
 * @property {CSSStyleDeclaration} computed -
 *
 * @property {Transforms} transforms -
 *
 * @property {number} height -
 *
 * @property {number} width -
 *
 * @property {number|undefined} marginLeft -
 *
 * @property {number|undefined} marginTop -
 *
 * @property {number|undefined} maxHeight -
 *
 * @property {number|undefined} maxWidth -
 *
 * @property {number|undefined} minHeight -
 *
 * @property {number|undefined} minWidth -
 *
 * @property {object} rest - The rest of any data submitted to {@link Position.set}
 */

const _excluded = ["name"];

var _application$2 = /*#__PURE__*/new WeakMap();

var _dataSaved = /*#__PURE__*/new WeakMap();

class ApplicationState {
  /** @type {ApplicationShellExt} */

  /** @type {Map<string, ApplicationData>} */

  /**
   * @param {ApplicationShellExt}   application - The application.
   */
  constructor(application) {
    _classPrivateFieldInitSpec(this, _application$2, {
      writable: true,
      value: void 0
    });

    _classPrivateFieldInitSpec(this, _dataSaved, {
      writable: true,
      value: new Map()
    });

    _classPrivateFieldSet(this, _application$2, application);
  }
  /**
   * Returns current application state along with any extra data passed into method.
   *
   * @param {object} [extra] - Extra data to add to application state.
   *
   * @returns {ApplicationData} Passed in object with current application state.
   */


  get(extra = {}) {
    var _classPrivateFieldGet2, _classPrivateFieldGet3, _classPrivateFieldGet4, _classPrivateFieldGet5, _classPrivateFieldGet6, _classPrivateFieldGet7, _classPrivateFieldGet8;

    return Object.assign(extra, {
      position: (_classPrivateFieldGet2 = _classPrivateFieldGet(this, _application$2)) === null || _classPrivateFieldGet2 === void 0 ? void 0 : (_classPrivateFieldGet3 = _classPrivateFieldGet2.position) === null || _classPrivateFieldGet3 === void 0 ? void 0 : _classPrivateFieldGet3.get(),
      beforeMinimized: (_classPrivateFieldGet4 = _classPrivateFieldGet(this, _application$2)) === null || _classPrivateFieldGet4 === void 0 ? void 0 : (_classPrivateFieldGet5 = _classPrivateFieldGet4.position) === null || _classPrivateFieldGet5 === void 0 ? void 0 : _classPrivateFieldGet5.state.get({
        name: '#beforeMinimized'
      }),
      options: Object.assign({}, (_classPrivateFieldGet6 = _classPrivateFieldGet(this, _application$2)) === null || _classPrivateFieldGet6 === void 0 ? void 0 : _classPrivateFieldGet6.options),
      ui: {
        minimized: (_classPrivateFieldGet7 = _classPrivateFieldGet(this, _application$2)) === null || _classPrivateFieldGet7 === void 0 ? void 0 : (_classPrivateFieldGet8 = _classPrivateFieldGet7.reactive) === null || _classPrivateFieldGet8 === void 0 ? void 0 : _classPrivateFieldGet8.minimized
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

    return _classPrivateFieldGet(this, _dataSaved).get(name);
  }
  /**
   * Removes and returns any application state by name.
   *
   * @param {object}   options - Options.
   *
   * @param {string}   options.name - Name to remove and retrieve.
   *
   * @returns {ApplicationData} Saved application data.
   */


  remove({
    name
  }) {
    if (typeof name !== 'string') {
      throw new TypeError(`ApplicationState - remove: 'name' is not a string.`);
    }

    const data = _classPrivateFieldGet(this, _dataSaved).get(name);

    _classPrivateFieldGet(this, _dataSaved).delete(name);

    return data;
  }
  /**
   * Restores a saved application state returning the data. Several optional parameters are available
   * to control whether the restore action occurs silently (no store / inline styles updates), animates
   * to the stored data, or simply sets the stored data. Restoring via {@link AnimationAPI.to} allows
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
   * @param {number}            [params.duration=0.1] - Duration in seconds.
   *
   * @param {Function}          [params.ease=linear] - Easing function.
   *
   * @param {Function}          [params.interpolate=lerp] - Interpolation function.
   *
   * @returns {ApplicationData|Promise<ApplicationData>} Saved application data.
   */


  restore({
    name,
    remove = false,
    async = false,
    animateTo = false,
    duration = 0.1,
    ease = identity,
    interpolate = lerp$5
  }) {
    if (typeof name !== 'string') {
      throw new TypeError(`ApplicationState - restore error: 'name' is not a string.`);
    }

    const dataSaved = _classPrivateFieldGet(this, _dataSaved).get(name);

    if (dataSaved) {
      if (remove) {
        _classPrivateFieldGet(this, _dataSaved).delete(name);
      }

      if (async) {
        return this.set(dataSaved, {
          async,
          animateTo,
          duration,
          ease,
          interpolate
        }).then(() => dataSaved);
      } else {
        this.set(dataSaved, {
          async,
          animateTo,
          duration,
          ease,
          interpolate
        });
      }
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
   * @returns {ApplicationData} Current application data
   */


  save(_ref) {
    let {
      name
    } = _ref,
        extra = _objectWithoutProperties(_ref, _excluded);

    if (typeof name !== 'string') {
      throw new TypeError(`ApplicationState - save error: 'name' is not a string.`);
    }

    const data = this.get(extra);

    _classPrivateFieldGet(this, _dataSaved).set(name, data);

    return data;
  }
  /**
   * Restores a saved application state returning the data. Several optional parameters are available
   * to control whether the restore action occurs silently (no store / inline styles updates), animates
   * to the stored data, or simply sets the stored data. Restoring via {@link AnimationAPI.to} allows
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
   * @param {number}            [opts.duration=0.1] - Duration in seconds.
   *
   * @param {Function}          [opts.ease=linear] - Easing function.
   *
   * @param {Function}          [opts.interpolate=lerp] - Interpolation function.
   *
   * @returns {ApplicationShellExt|Promise<ApplicationShellExt>} When synchronous the application or Promise when
   *                                                             animating resolving with application.
   */


  set(data, {
    async = false,
    animateTo = false,
    duration = 0.1,
    ease = identity,
    interpolate = lerp$5
  }) {
    if (typeof data !== 'object') {
      throw new TypeError(`ApplicationState - restore error: 'data' is not an object.`);
    }

    const application = _classPrivateFieldGet(this, _application$2);

    if (data) {
      if (typeof (data === null || data === void 0 ? void 0 : data.position) === 'object') {
        // Update data directly with no store or inline style updates.
        if (animateTo) // Animate to saved data.
          {
            // Provide special handling to potentially change transform origin as this parameter is not animated.
            if (data.position.transformOrigin !== application.position.transformOrigin) {
              application.position.transformOrigin = data.position.transformOrigin;
            }

            if (typeof (data === null || data === void 0 ? void 0 : data.ui) === 'object') {
              var _data$ui, _application$reactive;

              const minimized = typeof ((_data$ui = data.ui) === null || _data$ui === void 0 ? void 0 : _data$ui.minimized) === 'boolean' ? data.ui.minimized : false;

              if (application !== null && application !== void 0 && (_application$reactive = application.reactive) !== null && _application$reactive !== void 0 && _application$reactive.minimized && !minimized) {
                application.maximize({
                  animate: false,
                  duration: 0
                });
              }
            }

            const promise = application.position.animate.to(data.position, {
              duration,
              ease,
              interpolate
            }).finished.then(cancelled => {
              // Merge in saved options to application.
              if (!cancelled && typeof (data === null || data === void 0 ? void 0 : data.options) === 'object') {
                application === null || application === void 0 ? void 0 : application.reactive.mergeOptions(data.options);
              }

              if (!cancelled && typeof (data === null || data === void 0 ? void 0 : data.ui) === 'object') {
                var _data$ui2, _application$reactive2;

                const minimized = typeof ((_data$ui2 = data.ui) === null || _data$ui2 === void 0 ? void 0 : _data$ui2.minimized) === 'boolean' ? data.ui.minimized : false; // Application is currently minimized and stored state is not, so reset minimized state without
                // animation.

                if (!(application !== null && application !== void 0 && (_application$reactive2 = application.reactive) !== null && _application$reactive2 !== void 0 && _application$reactive2.minimized) && minimized) {
                  application.minimize({
                    animate: false,
                    duration: 0
                  });
                }
              }

              if (!cancelled && typeof (data === null || data === void 0 ? void 0 : data.beforeMinimized) === 'object') {
                application.position.state.set(_objectSpread2({
                  name: '#beforeMinimized'
                }, data.beforeMinimized));
              }

              return application;
            }); // Return a Promise with the application that resolves after animation ends.

            if (async) {
              return promise;
            }
          } else {
          // Merge in saved options to application.
          if (typeof (data === null || data === void 0 ? void 0 : data.options) === 'object') {
            application === null || application === void 0 ? void 0 : application.reactive.mergeOptions(data.options);
          }

          if (typeof (data === null || data === void 0 ? void 0 : data.ui) === 'object') {
            var _data$ui3, _application$reactive3, _application$reactive4;

            const minimized = typeof ((_data$ui3 = data.ui) === null || _data$ui3 === void 0 ? void 0 : _data$ui3.minimized) === 'boolean' ? data.ui.minimized : false; // Application is currently minimized and stored state is not, so reset minimized state without
            // animation.

            if (application !== null && application !== void 0 && (_application$reactive3 = application.reactive) !== null && _application$reactive3 !== void 0 && _application$reactive3.minimized && !minimized) {
              application.maximize({
                animate: false,
                duration: 0
              });
            } else if (!(application !== null && application !== void 0 && (_application$reactive4 = application.reactive) !== null && _application$reactive4 !== void 0 && _application$reactive4.minimized) && minimized) {
              application.minimize({
                animate: false,
                duration
              });
            }
          }

          if (typeof (data === null || data === void 0 ? void 0 : data.beforeMinimized) === 'object') {
            application.position.state.set(_objectSpread2({
              name: '#beforeMinimized'
            }, data.beforeMinimized));
          } // Default options is to set data for an immediate update.


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
 * @property {PositionDataExtended}   position - Application position.
 *
 * @property {object}         beforeMinimized - Any application saved position state for #beforeMinimized
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
 * @param {object}            opts - Optional parameters.
 *
 * @param {object}            opts.app - The target application
 *
 * @param {HTMLElement}       opts.template - Any HTML template.
 *
 * @param {object}            opts.config - Svelte component options
 *
 * @param {Function}          opts.elementRootUpdate - A callback to assign to the external context.
 *
 * @returns {SvelteData} The config + instantiated Svelte component.
 */

function loadSvelteConfig({
  app,
  template,
  config,
  elementRootUpdate
} = {}) {
  const svelteOptions = typeof config.options === 'object' ? config.options : {};
  let target; // A specific HTMLElement to append Svelte component.

  if (config.target instanceof HTMLElement) {
    target = config.target;
  } // A string target defines a selector to find in existing HTML.
  else if (template instanceof HTMLElement && typeof config.target === 'string') {
    target = template.querySelector(config.target);
  } else // No target defined, create a document fragment.
    {
      target = document.createDocumentFragment();
    }

  if (target === void 0) {
    console.log(`%c[TRL] loadSvelteConfig error - could not find target selector, '${config.target}', for config:\n`, 'background: rgb(57,34,34)', config);
    throw new Error();
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
  } // Detect if target is a synthesized DocumentFragment with a child element. Child elements will be present
  // if the Svelte component mounts and renders initial content into the document fragment.


  if (target instanceof DocumentFragment && target.firstElementChild) {
    if (element === void 0) {
      element = target.firstElementChild;
    }

    template.append(target);
  } else if (config.target instanceof HTMLElement && element === void 0) {
    if (config.target instanceof HTMLElement && typeof svelteOptions.selectorElement !== 'string') {
      console.log(`%c[TRL] loadSvelteConfig error - HTMLElement target with no 'selectorElement' defined.\n` + `\nNote: If configuring an application shell and directly targeting a HTMLElement did you bind an` + `'elementRoot' and include '<svelte:options accessors={true}/>'?\n` + `\nOffending config:\n`, 'background: rgb(57,34,34)', config);
      throw new Error();
    } // The target is an HTMLElement so find the Application element from `selectorElement` option.


    element = target.querySelector(svelteOptions.selectorElement);

    if (element === null || element === void 0) {
      console.log(`%c[TRL] loadSvelteConfig error - HTMLElement target with 'selectorElement', '${svelteOptions.selectorElement}', not found for config:\n`, 'background: rgb(57,34,34)', config);
      throw new Error();
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

/**
 * Contains the reactive functionality / Svelte stores associated with SvelteApplication.
 */

var _application$1 = /*#__PURE__*/new WeakMap();

var _initialized = /*#__PURE__*/new WeakMap();

var _storeAppOptions = /*#__PURE__*/new WeakMap();

var _storeAppOptionsUpdate = /*#__PURE__*/new WeakMap();

var _dataUIState = /*#__PURE__*/new WeakMap();

var _storeUIState = /*#__PURE__*/new WeakMap();

var _storeUIStateUpdate = /*#__PURE__*/new WeakMap();

var _storeUnsubscribe$1 = /*#__PURE__*/new WeakMap();

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

    _classPrivateFieldInitSpec(this, _application$1, {
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

    _classPrivateFieldInitSpec(this, _storeUnsubscribe$1, {
      writable: true,
      value: []
    });

    _classPrivateFieldSet(this, _application$1, application);
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

    return (_classPrivateFieldGet2 = _classPrivateFieldGet(this, _application$1)) === null || _classPrivateFieldGet2 === void 0 ? void 0 : (_classPrivateFieldGet3 = _classPrivateFieldGet2.options) === null || _classPrivateFieldGet3 === void 0 ? void 0 : _classPrivateFieldGet3.draggable;
  }
  /**
   * Returns the headerButtonNoClose app option.
   *
   * @returns {boolean} Remove the close the button in header app option.
   */


  get headerButtonNoClose() {
    var _classPrivateFieldGet4, _classPrivateFieldGet5;

    return (_classPrivateFieldGet4 = _classPrivateFieldGet(this, _application$1)) === null || _classPrivateFieldGet4 === void 0 ? void 0 : (_classPrivateFieldGet5 = _classPrivateFieldGet4.options) === null || _classPrivateFieldGet5 === void 0 ? void 0 : _classPrivateFieldGet5.headerButtonNoClose;
  }
  /**
   * Returns the headerButtonNoLabel app option.
   *
   * @returns {boolean} Remove the labels from buttons in header app option.
   */


  get headerButtonNoLabel() {
    var _classPrivateFieldGet6, _classPrivateFieldGet7;

    return (_classPrivateFieldGet6 = _classPrivateFieldGet(this, _application$1)) === null || _classPrivateFieldGet6 === void 0 ? void 0 : (_classPrivateFieldGet7 = _classPrivateFieldGet6.options) === null || _classPrivateFieldGet7 === void 0 ? void 0 : _classPrivateFieldGet7.headerButtonNoLabel;
  }
  /**
   * Returns the headerNoTitleMinimized app option.
   *
   * @returns {boolean} When true removes the header title when minimized.
   */


  get headerNoTitleMinimized() {
    var _classPrivateFieldGet8, _classPrivateFieldGet9;

    return (_classPrivateFieldGet8 = _classPrivateFieldGet(this, _application$1)) === null || _classPrivateFieldGet8 === void 0 ? void 0 : (_classPrivateFieldGet9 = _classPrivateFieldGet8.options) === null || _classPrivateFieldGet9 === void 0 ? void 0 : _classPrivateFieldGet9.headerNoTitleMinimized;
  }
  /**
   * Returns the minimizable app option.
   *
   * @returns {boolean} Minimizable app option.
   */


  get minimizable() {
    var _classPrivateFieldGet10, _classPrivateFieldGet11;

    return (_classPrivateFieldGet10 = _classPrivateFieldGet(this, _application$1)) === null || _classPrivateFieldGet10 === void 0 ? void 0 : (_classPrivateFieldGet11 = _classPrivateFieldGet10.options) === null || _classPrivateFieldGet11 === void 0 ? void 0 : _classPrivateFieldGet11.minimizable;
  }
  /**
   * @inheritDoc
   */


  get popOut() {
    return _classPrivateFieldGet(this, _application$1).popOut;
  }
  /**
   * Returns the resizable option.
   *
   * @returns {boolean} Resizable app option.
   */


  get resizable() {
    var _classPrivateFieldGet12, _classPrivateFieldGet13;

    return (_classPrivateFieldGet12 = _classPrivateFieldGet(this, _application$1)) === null || _classPrivateFieldGet12 === void 0 ? void 0 : (_classPrivateFieldGet13 = _classPrivateFieldGet12.options) === null || _classPrivateFieldGet13 === void 0 ? void 0 : _classPrivateFieldGet13.resizable;
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
    return _classPrivateFieldGet(this, _application$1).title;
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
   * Sets `this.options.headerNoTitleMinimized` which is reactive for application shells.
   *
   * @param {boolean}  headerNoTitleMinimized - Sets the headerNoTitleMinimized option.
   */


  set headerNoTitleMinimized(headerNoTitleMinimized) {
    if (typeof headerNoTitleMinimized === 'boolean') {
      this.setOptions('headerNoTitleMinimized', headerNoTitleMinimized);
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
   * Note: Will set empty string if title is undefined or null.
   *
   * @param {string|undefined|null}   title - Application title; will be localized, so a translation key is fine.
   */


  set title(title) {
    if (typeof title === 'string') {
      this.setOptions('title', title);
    } else if (title === void 0 || title === null) {
      this.setOptions('title', '');
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
    return safeAccess(_classPrivateFieldGet(this, _application$1).options, accessor, defaultValue);
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
    const success = safeSet(_classPrivateFieldGet(this, _application$1).options, accessor, value); // If `this.options` modified then update the app options store.

    if (success) {
      _classPrivateFieldGet(this, _storeAppOptionsUpdate).call(this, () => _classPrivateFieldGet(this, _application$1).options);
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
    headerButtonNoClose = _classPrivateFieldGet(this, _application$1).options.headerButtonNoClose,
    headerButtonNoLabel = _classPrivateFieldGet(this, _application$1).options.headerButtonNoLabel
  } = {}) {
    let buttons = _classPrivateFieldGet(this, _application$1)._getHeaderButtons(); // Remove close button if this.options.headerButtonNoClose is true;


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
  const writableAppOptions = writable(_classPrivateFieldGet(this, _application$1).options); // Keep the update function locally, but make the store essentially readable.

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
    headerNoTitleMinimized: propertyStore(writableAppOptions, 'headerNoTitleMinimized'),
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
    minimized: _classPrivateFieldGet(this, _application$1)._minimized,
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
  _classPrivateFieldGet(this, _storeUnsubscribe$1).push(subscribeIgnoreFirst(_classPrivateFieldGet(this, _storeAppOptions).headerButtonNoClose, value => {
    this.updateHeaderButtons({
      headerButtonNoClose: value
    });
  })); // Handles updating header buttons to add / remove button labels.


  _classPrivateFieldGet(this, _storeUnsubscribe$1).push(subscribeIgnoreFirst(_classPrivateFieldGet(this, _storeAppOptions).headerButtonNoLabel, value => {
    this.updateHeaderButtons({
      headerButtonNoLabel: value
    });
  })); // Handles adding / removing this application from `ui.windows` when popOut changes.


  _classPrivateFieldGet(this, _storeUnsubscribe$1).push(subscribeIgnoreFirst(_classPrivateFieldGet(this, _storeAppOptions).popOut, value => {
    if (value && _classPrivateFieldGet(this, _application$1).rendered) {
      ui.windows[_classPrivateFieldGet(this, _application$1).appId] = _classPrivateFieldGet(this, _application$1);
    } else {
      delete ui.windows[_classPrivateFieldGet(this, _application$1).appId];
    }
  }));
}

function _storesUnsubscribe2() {
  _classPrivateFieldGet(this, _storeUnsubscribe$1).forEach(unsubscribe => unsubscribe());

  _classPrivateFieldSet(this, _storeUnsubscribe$1, []);
}

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


    _classPrivateFieldSet(this, _position, new Position(this, _objectSpread2(_objectSpread2(_objectSpread2({}, this.position), this.options), {}, {
      initial: this.options.positionInitial,
      ortho: this.options.positionOrtho,
      validator: this.options.positionValidator
    }))); // Remove old position field.


    delete this.position;
    /**
     * Define accessors to retrieve Position by `this.position`.
     *
     * @member {Position} position - Adds accessors to SvelteApplication to get / set the position data.
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
      defaultCloseAnimation: true,
      // If false the default slide close animation is not run.
      draggable: true,
      // If true then application shells are draggable.
      headerButtonNoClose: false,
      // If true then the close header button is removed.
      headerButtonNoLabel: false,
      // If true then header button labels are removed for application shells.
      headerNoTitleMinimized: false,
      // If true then header title is hidden when application is minimized.
      minHeight: MIN_WINDOW_HEIGHT,
      // Assigned to position. Number specifying minimum window height.
      minWidth: MIN_WINDOW_WIDTH,
      // Assigned to position. Number specifying minimum window width.
      positionable: true,
      // If false then `position.set` does not take effect.
      positionInitial: Position.Initial.browserCentered,
      // A helper for initial position placement.
      positionOrtho: true,
      // When true Position is optimized for orthographic use.
      positionValidator: Position.Validators.transformWindow,
      // A function providing the default validator.
      transformOrigin: 'top left' // By default, 'top / left' respects rotation when minimizing.

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
   *
   * @param {object} [opts] - Optional parameters.
   *
   * @param {boolean} [opts.force=false] - Force bring to top; will increment z-index by popOut order.
   *
   */


  bringToTop({
    force = false
  } = {}) {
    if (force || this.popOut) {
      super.bringToTop();
    } // If the activeElement is not `document.body` then blur the current active element and make `document.body`
    // focused. This allows <esc> key to close all open apps / windows.


    if (document.activeElement !== document.body) {
      // Blur current active element.
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      } // Make document body focused.


      document.body.focus();
    }

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

    this.position.state.restore({
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
        const svelteData = loadSvelteConfig({
          app: this,
          template: html[0],
          config: svelteConfig,
          elementRootUpdate
        });

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
      const svelteData = loadSvelteConfig({
        app: this,
        template: html[0],
        config: this.options.svelte,
        elementRootUpdate
      });

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
   * @param {object}   [opts] - Optional parameters.
   *
   * @param {boolean}  [opts.animate=true] - When true perform default maximizing animation.
   *
   * @param {number}   [opts.duration=0.1] - Controls content area animation duration in seconds.
   */


  async maximize({
    animate = true,
    duration = 0.1
  } = {}) {
    var _this$options$minHeig, _this$options;

    if (!this.popOut || [false, null].includes(this._minimized)) {
      return;
    }

    this._minimized = null;
    const durationMS = duration * 1000; // For WAAPI.
    // Get content

    const element = this.elementTarget;
    const header = element.querySelector('.window-header');
    const content = element.querySelector('.window-content'); // First animate / restore width / async.

    if (animate) {
      await this.position.state.restore({
        name: '#beforeMinimized',
        async: true,
        animateTo: true,
        properties: ['width'],
        duration: 0.1
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
      } = this.position.state.restore({
        name: '#beforeMinimized',
        animateTo: true,
        properties: ['height'],
        remove: true,
        duration
      }));
    } else {
      ({
        constraints
      } = this.position.state.remove({
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
      duration: durationMS,
      fill: 'forwards'
    }).finished; // WAAPI in ms.
    // minHeight needs to be adjusted to options or Foundry default window height.

    this.position.minHeight = (_this$options$minHeig = (_this$options = this.options) === null || _this$options === void 0 ? void 0 : _this$options.minHeight) !== null && _this$options$minHeig !== void 0 ? _this$options$minHeig : MIN_WINDOW_HEIGHT;
    element.classList.remove('minimized');
    this._minimized = false;
    element.style.minWidth = null;
    element.style.minHeight = null; // Using a 50ms timeout prevents any instantaneous display of scrollbars with the above maximize animation.

    setTimeout(() => content.style.overflow = null, 50);

    _classPrivateFieldGet(this, _stores).uiOptionsUpdate(options => deepMerge(options, {
      minimized: false
    }));
  }
  /**
   * Provides a mechanism to update the UI options store for minimized.
   *
   * Note: the sanity check is duplicated from {@link Application.minimize} the store is updated _before_
   * performing the rest of animations. This allows application shells to remove / show any resize handlers
   * correctly. Extra constraint data is stored in a saved position state in {@link SvelteApplication.minimize}
   * to animate the content area.
   *
   * @param {object}   [opts] - Optional parameters
   *
   * @param {boolean}  [opts.animate=true] - When true perform default minimizing animation.
   *
   * @param {number}   [opts.duration=0.1] - Controls content area animation duration in seconds.
   */


  async minimize({
    animate = true,
    duration = 0.1
  } = {}) {
    if (!this.rendered || !this.popOut || [true, null].includes(this._minimized)) {
      return;
    }

    _classPrivateFieldGet(this, _stores).uiOptionsUpdate(options => deepMerge(options, {
      minimized: true
    }));

    this._minimized = null;
    const durationMS = duration * 1000; // For WAAPI.

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
        duration: durationMS,
        fill: 'forwards'
      }); // WAAPI in ms.
      // Set display style to none when animation finishes.

      animation.finished.then(() => content.style.display = 'none');
    } else {
      setTimeout(() => content.style.display = 'none', durationMS);
    } // Save current position state and add the constraint data to use in `maximize`.


    this.position.state.save({
      name: '#beforeMinimized',
      constraints
    });
    const headerOffsetHeight = header.offsetHeight; // minHeight needs to be adjusted to header height.

    this.position.minHeight = headerOffsetHeight;

    if (animate) {
      // First await animation of height upward.
      await this.position.animate.to({
        height: headerOffsetHeight
      }, {
        duration
      }).finished;
    } // Set all header buttons besides close and the window title to display none.


    for (let cntr = header.children.length; --cntr >= 0;) {
      const className = header.children[cntr].className;

      if (className.includes('window-title') || className.includes('close') || className.includes('keep-minimized')) {
        continue;
      }

      header.children[cntr].style.display = 'none';
    }

    if (animate) {
      // Await animation of width to the left / minimum width.
      await this.position.animate.to({
        width: MIN_WINDOW_WIDTH
      }, {
        duration: 0.1
      }).finished;
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
  } = {}) {} // eslint-disable-line no-unused-vars

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
   * @param {PositionDataExtended}   [position] - Position data.
   *
   * @returns {Position} The updated position object for the application containing the new values
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

function fade(node, {
  delay = 0,
  duration = 400,
  easing = identity
} = {}) {
  const o = +getComputedStyle(node).opacity;
  return {
    delay,
    duration,
    easing,
    css: t => `opacity: ${t * o}`
  };
}

/**
 * Common utilities
 * @module glMatrix
 */
// Configuration Constants


var EPSILON = 0.000001;
var ARRAY_TYPE = typeof Float32Array !== 'undefined' ? Float32Array : Array;
if (!Math.hypot) Math.hypot = function () {
  var y = 0,
      i = arguments.length;

  while (i--) {
    y += arguments[i] * arguments[i];
  }

  return Math.sqrt(y);
};
/**
 * 3x3 Matrix
 * @module mat3
 */

/**
 * Creates a new identity mat3
 *
 * @returns {mat3} a new 3x3 matrix
 */

function create$6() {
  var out = new ARRAY_TYPE(9);

  if (ARRAY_TYPE != Float32Array) {
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[5] = 0;
    out[6] = 0;
    out[7] = 0;
  }

  out[0] = 1;
  out[4] = 1;
  out[8] = 1;
  return out;
}
/**
 * 3 Dimensional Vector
 * @module vec3
 */

/**
 * Creates a new, empty vec3
 *
 * @returns {vec3} a new 3D vector
 */


function create$4() {
  var out = new ARRAY_TYPE(3);

  if (ARRAY_TYPE != Float32Array) {
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
  }

  return out;
}
/**
 * Calculates the length of a vec3
 *
 * @param {ReadonlyVec3} a vector to calculate length of
 * @returns {Number} length of a
 */


function length$4(a) {
  var x = a[0];
  var y = a[1];
  var z = a[2];
  return Math.hypot(x, y, z);
}
/**
 * Creates a new vec3 initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @returns {vec3} a new 3D vector
 */


function fromValues$4(x, y, z) {
  var out = new ARRAY_TYPE(3);
  out[0] = x;
  out[1] = y;
  out[2] = z;
  return out;
}
/**
 * Normalize a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a vector to normalize
 * @returns {vec3} out
 */


function normalize$4(out, a) {
  var x = a[0];
  var y = a[1];
  var z = a[2];
  var len = x * x + y * y + z * z;

  if (len > 0) {
    //TODO: evaluate use of glm_invsqrt here?
    len = 1 / Math.sqrt(len);
  }

  out[0] = a[0] * len;
  out[1] = a[1] * len;
  out[2] = a[2] * len;
  return out;
}
/**
 * Calculates the dot product of two vec3's
 *
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {Number} dot product of a and b
 */


function dot$4(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}
/**
 * Computes the cross product of two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {vec3} out
 */


function cross$2(out, a, b) {
  var ax = a[0],
      ay = a[1],
      az = a[2];
  var bx = b[0],
      by = b[1],
      bz = b[2];
  out[0] = ay * bz - az * by;
  out[1] = az * bx - ax * bz;
  out[2] = ax * by - ay * bx;
  return out;
}
/**
 * Alias for {@link vec3.length}
 * @function
 */


var len$4 = length$4;
/**
 * Perform some operation over an array of vec3s.
 *
 * @param {Array} a the array of vectors to iterate over
 * @param {Number} stride Number of elements between the start of each vec3. If 0 assumes tightly packed
 * @param {Number} offset Number of elements to skip at the beginning of the array
 * @param {Number} count Number of vec3s to iterate over. If 0 iterates over entire array
 * @param {Function} fn Function to call for each vector in the array
 * @param {Object} [arg] additional argument to pass to fn
 * @returns {Array} a
 * @function
 */

(function () {
  var vec = create$4();
  return function (a, stride, offset, count, fn, arg) {
    var i, l;

    if (!stride) {
      stride = 3;
    }

    if (!offset) {
      offset = 0;
    }

    if (count) {
      l = Math.min(count * stride + offset, a.length);
    } else {
      l = a.length;
    }

    for (i = offset; i < l; i += stride) {
      vec[0] = a[i];
      vec[1] = a[i + 1];
      vec[2] = a[i + 2];
      fn(vec, vec, arg);
      a[i] = vec[0];
      a[i + 1] = vec[1];
      a[i + 2] = vec[2];
    }

    return a;
  };
})();
/**
 * 4 Dimensional Vector
 * @module vec4
 */

/**
 * Creates a new, empty vec4
 *
 * @returns {vec4} a new 4D vector
 */


function create$3() {
  var out = new ARRAY_TYPE(4);

  if (ARRAY_TYPE != Float32Array) {
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
  }

  return out;
}
/**
 * Normalize a vec4
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a vector to normalize
 * @returns {vec4} out
 */


function normalize$3(out, a) {
  var x = a[0];
  var y = a[1];
  var z = a[2];
  var w = a[3];
  var len = x * x + y * y + z * z + w * w;

  if (len > 0) {
    len = 1 / Math.sqrt(len);
  }

  out[0] = x * len;
  out[1] = y * len;
  out[2] = z * len;
  out[3] = w * len;
  return out;
}
/**
 * Perform some operation over an array of vec4s.
 *
 * @param {Array} a the array of vectors to iterate over
 * @param {Number} stride Number of elements between the start of each vec4. If 0 assumes tightly packed
 * @param {Number} offset Number of elements to skip at the beginning of the array
 * @param {Number} count Number of vec4s to iterate over. If 0 iterates over entire array
 * @param {Function} fn Function to call for each vector in the array
 * @param {Object} [arg] additional argument to pass to fn
 * @returns {Array} a
 * @function
 */


(function () {
  var vec = create$3();
  return function (a, stride, offset, count, fn, arg) {
    var i, l;

    if (!stride) {
      stride = 4;
    }

    if (!offset) {
      offset = 0;
    }

    if (count) {
      l = Math.min(count * stride + offset, a.length);
    } else {
      l = a.length;
    }

    for (i = offset; i < l; i += stride) {
      vec[0] = a[i];
      vec[1] = a[i + 1];
      vec[2] = a[i + 2];
      vec[3] = a[i + 3];
      fn(vec, vec, arg);
      a[i] = vec[0];
      a[i + 1] = vec[1];
      a[i + 2] = vec[2];
      a[i + 3] = vec[3];
    }

    return a;
  };
})();
/**
 * Quaternion
 * @module quat
 */

/**
 * Creates a new identity quat
 *
 * @returns {quat} a new quaternion
 */


function create$2() {
  var out = new ARRAY_TYPE(4);

  if (ARRAY_TYPE != Float32Array) {
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
  }

  out[3] = 1;
  return out;
}
/**
 * Sets a quat from the given angle and rotation axis,
 * then returns it.
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyVec3} axis the axis around which to rotate
 * @param {Number} rad the angle in radians
 * @returns {quat} out
 **/


function setAxisAngle(out, axis, rad) {
  rad = rad * 0.5;
  var s = Math.sin(rad);
  out[0] = s * axis[0];
  out[1] = s * axis[1];
  out[2] = s * axis[2];
  out[3] = Math.cos(rad);
  return out;
}
/**
 * Performs a spherical linear interpolation between two quat
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyQuat} a the first operand
 * @param {ReadonlyQuat} b the second operand
 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
 * @returns {quat} out
 */


function slerp(out, a, b, t) {
  // benchmarks:
  //    http://jsperf.com/quaternion-slerp-implementations
  var ax = a[0],
      ay = a[1],
      az = a[2],
      aw = a[3];
  var bx = b[0],
      by = b[1],
      bz = b[2],
      bw = b[3];
  var omega, cosom, sinom, scale0, scale1; // calc cosine

  cosom = ax * bx + ay * by + az * bz + aw * bw; // adjust signs (if necessary)

  if (cosom < 0.0) {
    cosom = -cosom;
    bx = -bx;
    by = -by;
    bz = -bz;
    bw = -bw;
  } // calculate coefficients


  if (1.0 - cosom > EPSILON) {
    // standard case (slerp)
    omega = Math.acos(cosom);
    sinom = Math.sin(omega);
    scale0 = Math.sin((1.0 - t) * omega) / sinom;
    scale1 = Math.sin(t * omega) / sinom;
  } else {
    // "from" and "to" quaternions are very close
    //  ... so we can do a linear interpolation
    scale0 = 1.0 - t;
    scale1 = t;
  } // calculate final values


  out[0] = scale0 * ax + scale1 * bx;
  out[1] = scale0 * ay + scale1 * by;
  out[2] = scale0 * az + scale1 * bz;
  out[3] = scale0 * aw + scale1 * bw;
  return out;
}
/**
 * Creates a quaternion from the given 3x3 rotation matrix.
 *
 * NOTE: The resultant quaternion is not normalized, so you should be sure
 * to renormalize the quaternion yourself where necessary.
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyMat3} m rotation matrix
 * @returns {quat} out
 * @function
 */


function fromMat3(out, m) {
  // Algorithm in Ken Shoemake's article in 1987 SIGGRAPH course notes
  // article "Quaternion Calculus and Fast Animation".
  var fTrace = m[0] + m[4] + m[8];
  var fRoot;

  if (fTrace > 0.0) {
    // |w| > 1/2, may as well choose w > 1/2
    fRoot = Math.sqrt(fTrace + 1.0); // 2w

    out[3] = 0.5 * fRoot;
    fRoot = 0.5 / fRoot; // 1/(4w)

    out[0] = (m[5] - m[7]) * fRoot;
    out[1] = (m[6] - m[2]) * fRoot;
    out[2] = (m[1] - m[3]) * fRoot;
  } else {
    // |w| <= 1/2
    var i = 0;
    if (m[4] > m[0]) i = 1;
    if (m[8] > m[i * 3 + i]) i = 2;
    var j = (i + 1) % 3;
    var k = (i + 2) % 3;
    fRoot = Math.sqrt(m[i * 3 + i] - m[j * 3 + j] - m[k * 3 + k] + 1.0);
    out[i] = 0.5 * fRoot;
    fRoot = 0.5 / fRoot;
    out[3] = (m[j * 3 + k] - m[k * 3 + j]) * fRoot;
    out[j] = (m[j * 3 + i] + m[i * 3 + j]) * fRoot;
    out[k] = (m[k * 3 + i] + m[i * 3 + k]) * fRoot;
  }

  return out;
}
/**
 * Normalize a quat
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyQuat} a quaternion to normalize
 * @returns {quat} out
 * @function
 */


var normalize$2 = normalize$3;
/**
 * Sets a quaternion to represent the shortest rotation from one
 * vector to another.
 *
 * Both vectors are assumed to be unit length.
 *
 * @param {quat} out the receiving quaternion.
 * @param {ReadonlyVec3} a the initial vector
 * @param {ReadonlyVec3} b the destination vector
 * @returns {quat} out
 */

(function () {
  var tmpvec3 = create$4();
  var xUnitVec3 = fromValues$4(1, 0, 0);
  var yUnitVec3 = fromValues$4(0, 1, 0);
  return function (out, a, b) {
    var dot = dot$4(a, b);

    if (dot < -0.999999) {
      cross$2(tmpvec3, xUnitVec3, a);
      if (len$4(tmpvec3) < 0.000001) cross$2(tmpvec3, yUnitVec3, a);
      normalize$4(tmpvec3, tmpvec3);
      setAxisAngle(out, tmpvec3, Math.PI);
      return out;
    } else if (dot > 0.999999) {
      out[0] = 0;
      out[1] = 0;
      out[2] = 0;
      out[3] = 1;
      return out;
    } else {
      cross$2(tmpvec3, a, b);
      out[0] = tmpvec3[0];
      out[1] = tmpvec3[1];
      out[2] = tmpvec3[2];
      out[3] = 1 + dot;
      return normalize$2(out, out);
    }
  };
})();
/**
 * Performs a spherical linear interpolation with two control points
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyQuat} a the first operand
 * @param {ReadonlyQuat} b the second operand
 * @param {ReadonlyQuat} c the third operand
 * @param {ReadonlyQuat} d the fourth operand
 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
 * @returns {quat} out
 */


(function () {
  var temp1 = create$2();
  var temp2 = create$2();
  return function (out, a, b, c, d, t) {
    slerp(temp1, a, d, t);
    slerp(temp2, b, c, t);
    slerp(out, temp1, temp2, 2 * t * (1 - t));
    return out;
  };
})();
/**
 * Sets the specified quaternion with values corresponding to the given
 * axes. Each axis is a vec3 and is expected to be unit length and
 * perpendicular to all other specified axes.
 *
 * @param {ReadonlyVec3} view  the vector representing the viewing direction
 * @param {ReadonlyVec3} right the vector representing the local "right" direction
 * @param {ReadonlyVec3} up    the vector representing the local "up" direction
 * @returns {quat} out
 */


(function () {
  var matr = create$6();
  return function (out, view, right, up) {
    matr[0] = right[0];
    matr[3] = right[1];
    matr[6] = right[2];
    matr[1] = up[0];
    matr[4] = up[1];
    matr[7] = up[2];
    matr[2] = -view[0];
    matr[5] = -view[1];
    matr[8] = -view[2];
    return normalize$2(out, fromMat3(out, matr));
  };
})();
/**
 * 2 Dimensional Vector
 * @module vec2
 */

/**
 * Creates a new, empty vec2
 *
 * @returns {vec2} a new 2D vector
 */


function create() {
  var out = new ARRAY_TYPE(2);

  if (ARRAY_TYPE != Float32Array) {
    out[0] = 0;
    out[1] = 0;
  }

  return out;
}
/**
 * Perform some operation over an array of vec2s.
 *
 * @param {Array} a the array of vectors to iterate over
 * @param {Number} stride Number of elements between the start of each vec2. If 0 assumes tightly packed
 * @param {Number} offset Number of elements to skip at the beginning of the array
 * @param {Number} count Number of vec2s to iterate over. If 0 iterates over entire array
 * @param {Function} fn Function to call for each vector in the array
 * @param {Object} [arg] additional argument to pass to fn
 * @returns {Array} a
 * @function
 */


(function () {
  var vec = create();
  return function (a, stride, offset, count, fn, arg) {
    var i, l;

    if (!stride) {
      stride = 2;
    }

    if (!offset) {
      offset = 0;
    }

    if (count) {
      l = Math.min(count * stride + offset, a.length);
    } else {
      l = a.length;
    }

    for (i = offset; i < l; i += stride) {
      vec[0] = a[i];
      vec[1] = a[i + 1];
      fn(vec, vec, arg);
      a[i] = vec[0];
      a[i + 1] = vec[1];
    }

    return a;
  };
})();

const s_DEFAULT_TRANSITION = () => void 0;

const s_DEFAULT_TRANSITION_OPTIONS = {};

/**
 * Provides a basic test for a given variable to test if it has the shape of a writable store by having a `subscribe`
 * function and an `update` function.
 *
 * Note: functions are also objects, so test that the variable might be a function w/ a `subscribe` function.
 *
 * @param {*}  store - variable to test that might be a store.
 *
 * @returns {boolean} Whether the variable tested has the shape of a store.
 */

function isUpdatableStore(store) {
  if (store === null || store === void 0) {
    return false;
  }

  switch (typeof store) {
    case 'function':
    case 'object':
      return typeof store.subscribe === 'function' && typeof store.update === 'function';
  }

  return false;
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
/**
 * Defines the application shell contract. If Svelte components export getter / setters for the following properties
 * then that component is considered an application shell.
 *
 * @type {string[]}
 */


const applicationShellContract = ['elementRoot'];
Object.freeze(applicationShellContract);
/**
 * Provides an action to apply style properties provided as an object.
 *
 * @param {HTMLElement} node - Target element
 *
 * @param {object}      properties - Key / value object of properties to set.
 *
 * @returns {Function} Update function.
 */


function applyStyles(node, properties) {
  /** Sets properties on node. */
  function setProperties() {
    if (typeof properties !== 'object') {
      return;
    }

    for (const prop of Object.keys(properties)) {
      node.style.setProperty(`${prop}`, properties[prop]);
    }
  }

  setProperties();
  return {
    update(newProperties) {
      properties = newProperties;
      setProperties();
    }

  };
}
/**
 * Provides an action to monitor the given HTMLElement node with `ResizeObserver` posting width / height changes
 * to the target in various ways depending on the shape of the target. The target can be one of the following and the
 * precedence order is listed from top to bottom:
 *
 * - has a `resizeObserved` function as attribute; offset then content width / height are passed as parameters.
 * - has a `setContentBounds` function as attribute; content width / height are passed as parameters.
 * - has a `setDimension` function as attribute; offset width / height are passed as parameters.
 * - target is an object; offset and content width / height attributes are directly set on target.
 * - target is a function; the function is invoked with offset then content width / height parameters.
 * - has a writable store `resizeObserved` as an attribute; updated with offset & content width / height.
 * - has an object 'stores' that has a writable store `resizeObserved` as an attribute; updated with offset &
 *   content width / height.
 *
 * Note: Svelte currently uses an archaic IFrame based workaround to monitor offset / client width & height changes.
 * A more up to date way to do this is with ResizeObserver. To track when Svelte receives ResizeObserver support
 * monitor this issue: {@link https://github.com/sveltejs/svelte/issues/4233}
 *
 * Can-I-Use: {@link https://caniuse.com/resizeobserver}
 *
 * @param {HTMLElement}          node - The node associated with the action.
 *
 * @param {ResizeObserverTarget} target - An object or function to update with observed width & height changes.
 *
 * @returns {{update: Function, destroy: Function}} The action lifecycle methods.
 * @see {@link https://github.com/sveltejs/svelte/issues/4233}
 */


function resizeObserver(node, target) {
  ResizeObserverManager.add(node, target);
  return {
    update: newTarget => {
      ResizeObserverManager.remove(node, target);
      target = newTarget;
      ResizeObserverManager.add(node, target);
    },
    destroy: () => {
      ResizeObserverManager.remove(node, target);
    }
  };
}
/**
 * Provides a function that when invoked with an element updates the cached styles for each subscriber of the element.
 *
 * The style attributes cached to calculate offset height / width include border & padding dimensions. You only need
 * to update the cache if you change border or padding attributes of the element.
 *
 * @param {HTMLElement} el - An HTML element.
 */


resizeObserver.updateCache = function (el) {
  if (!(el instanceof HTMLElement)) {
    throw new TypeError(`resizeObserverUpdate error: 'el' is not an HTMLElement.`);
  }

  const subscribers = s_MAP.get(el);

  if (Array.isArray(subscribers)) {
    var _ref, _styleParsePixels, _ref2, _styleParsePixels2, _ref3, _styleParsePixels3, _ref4, _styleParsePixels4, _ref5, _styleParsePixels5, _ref6, _styleParsePixels6, _ref7, _styleParsePixels7, _ref8, _styleParsePixels8;

    const computed = globalThis.getComputedStyle(el); // Cache styles first from any inline styles then computed styles defaulting to 0 otherwise.
    // Used to create the offset width & height values from the context box ResizeObserver provides.

    const borderBottom = (_ref = (_styleParsePixels = styleParsePixels(el.style.borderBottom)) !== null && _styleParsePixels !== void 0 ? _styleParsePixels : styleParsePixels(computed.borderBottom)) !== null && _ref !== void 0 ? _ref : 0;
    const borderLeft = (_ref2 = (_styleParsePixels2 = styleParsePixels(el.style.borderLeft)) !== null && _styleParsePixels2 !== void 0 ? _styleParsePixels2 : styleParsePixels(computed.borderLeft)) !== null && _ref2 !== void 0 ? _ref2 : 0;
    const borderRight = (_ref3 = (_styleParsePixels3 = styleParsePixels(el.style.borderRight)) !== null && _styleParsePixels3 !== void 0 ? _styleParsePixels3 : styleParsePixels(computed.borderRight)) !== null && _ref3 !== void 0 ? _ref3 : 0;
    const borderTop = (_ref4 = (_styleParsePixels4 = styleParsePixels(el.style.borderTop)) !== null && _styleParsePixels4 !== void 0 ? _styleParsePixels4 : styleParsePixels(computed.borderTop)) !== null && _ref4 !== void 0 ? _ref4 : 0;
    const paddingBottom = (_ref5 = (_styleParsePixels5 = styleParsePixels(el.style.paddingBottom)) !== null && _styleParsePixels5 !== void 0 ? _styleParsePixels5 : styleParsePixels(computed.paddingBottom)) !== null && _ref5 !== void 0 ? _ref5 : 0;
    const paddingLeft = (_ref6 = (_styleParsePixels6 = styleParsePixels(el.style.paddingLeft)) !== null && _styleParsePixels6 !== void 0 ? _styleParsePixels6 : styleParsePixels(computed.paddingLeft)) !== null && _ref6 !== void 0 ? _ref6 : 0;
    const paddingRight = (_ref7 = (_styleParsePixels7 = styleParsePixels(el.style.paddingRight)) !== null && _styleParsePixels7 !== void 0 ? _styleParsePixels7 : styleParsePixels(computed.paddingRight)) !== null && _ref7 !== void 0 ? _ref7 : 0;
    const paddingTop = (_ref8 = (_styleParsePixels8 = styleParsePixels(el.style.paddingTop)) !== null && _styleParsePixels8 !== void 0 ? _styleParsePixels8 : styleParsePixels(computed.paddingTop)) !== null && _ref8 !== void 0 ? _ref8 : 0;
    const additionalWidth = borderLeft + borderRight + paddingLeft + paddingRight;
    const additionalHeight = borderTop + borderBottom + paddingTop + paddingBottom;

    for (const subscriber of subscribers) {
      subscriber.styles.additionalWidth = additionalWidth;
      subscriber.styles.additionalHeight = additionalHeight;
      s_UPDATE_SUBSCRIBER(subscriber, subscriber.contentWidth, subscriber.contentHeight);
    }
  }
}; // Below is the static ResizeObserverManager ------------------------------------------------------------------------


const s_MAP = new Map();
/**
 * Provides a static / single instance of ResizeObserver that can notify listeners in different ways.
 *
 * The action, {@link resizeObserver}, utilizes ResizeObserverManager for automatic registration and removal
 * via Svelte.
 */

class ResizeObserverManager {
  /**
   * Add an HTMLElement and ResizeObserverTarget instance for monitoring. Create cached style attributes for the
   * given element include border & padding dimensions for offset width / height calculations.
   *
   * @param {HTMLElement}    el - The element to observe.
   *
   * @param {ResizeObserverTarget} target - A target that contains one of several mechanisms for updating resize data.
   */
  static add(el, target) {
    var _ref9, _styleParsePixels9, _ref10, _styleParsePixels10, _ref11, _styleParsePixels11, _ref12, _styleParsePixels12, _ref13, _styleParsePixels13, _ref14, _styleParsePixels14, _ref15, _styleParsePixels15, _ref16, _styleParsePixels16;

    const updateType = s_GET_UPDATE_TYPE(target);

    if (updateType === 0) {
      throw new Error(`'target' does not match supported ResizeObserverManager update mechanisms.`);
    }

    const computed = globalThis.getComputedStyle(el); // Cache styles first from any inline styles then computed styles defaulting to 0 otherwise.
    // Used to create the offset width & height values from the context box ResizeObserver provides.

    const borderBottom = (_ref9 = (_styleParsePixels9 = styleParsePixels(el.style.borderBottom)) !== null && _styleParsePixels9 !== void 0 ? _styleParsePixels9 : styleParsePixels(computed.borderBottom)) !== null && _ref9 !== void 0 ? _ref9 : 0;
    const borderLeft = (_ref10 = (_styleParsePixels10 = styleParsePixels(el.style.borderLeft)) !== null && _styleParsePixels10 !== void 0 ? _styleParsePixels10 : styleParsePixels(computed.borderLeft)) !== null && _ref10 !== void 0 ? _ref10 : 0;
    const borderRight = (_ref11 = (_styleParsePixels11 = styleParsePixels(el.style.borderRight)) !== null && _styleParsePixels11 !== void 0 ? _styleParsePixels11 : styleParsePixels(computed.borderRight)) !== null && _ref11 !== void 0 ? _ref11 : 0;
    const borderTop = (_ref12 = (_styleParsePixels12 = styleParsePixels(el.style.borderTop)) !== null && _styleParsePixels12 !== void 0 ? _styleParsePixels12 : styleParsePixels(computed.borderTop)) !== null && _ref12 !== void 0 ? _ref12 : 0;
    const paddingBottom = (_ref13 = (_styleParsePixels13 = styleParsePixels(el.style.paddingBottom)) !== null && _styleParsePixels13 !== void 0 ? _styleParsePixels13 : styleParsePixels(computed.paddingBottom)) !== null && _ref13 !== void 0 ? _ref13 : 0;
    const paddingLeft = (_ref14 = (_styleParsePixels14 = styleParsePixels(el.style.paddingLeft)) !== null && _styleParsePixels14 !== void 0 ? _styleParsePixels14 : styleParsePixels(computed.paddingLeft)) !== null && _ref14 !== void 0 ? _ref14 : 0;
    const paddingRight = (_ref15 = (_styleParsePixels15 = styleParsePixels(el.style.paddingRight)) !== null && _styleParsePixels15 !== void 0 ? _styleParsePixels15 : styleParsePixels(computed.paddingRight)) !== null && _ref15 !== void 0 ? _ref15 : 0;
    const paddingTop = (_ref16 = (_styleParsePixels16 = styleParsePixels(el.style.paddingTop)) !== null && _styleParsePixels16 !== void 0 ? _styleParsePixels16 : styleParsePixels(computed.paddingTop)) !== null && _ref16 !== void 0 ? _ref16 : 0;
    const data = {
      updateType,
      target,
      // Stores most recent contentRect.width and contentRect.height values from ResizeObserver.
      contentWidth: 0,
      contentHeight: 0,
      // Convenience data for total border & padding for offset width & height calculations.
      styles: {
        additionalWidth: borderLeft + borderRight + paddingLeft + paddingRight,
        additionalHeight: borderTop + borderBottom + paddingTop + paddingBottom
      }
    };

    if (s_MAP.has(el)) {
      const subscribers = s_MAP.get(el);
      subscribers.push(data);
    } else {
      s_MAP.set(el, [data]);
    }

    s_RESIZE_OBSERVER.observe(el);
  }
  /**
   * Removes all targets from monitoring when just an element is provided otherwise removes a specific target
   * from the monitoring map. If no more targets remain then the element is removed from monitoring.
   *
   * @param {HTMLElement}          el - Element to remove from monitoring.
   *
   * @param {ResizeObserverTarget} [target] - A specific target to remove from monitoring.
   */


  static remove(el, target = void 0) {
    const subscribers = s_MAP.get(el);

    if (Array.isArray(subscribers)) {
      const index = subscribers.findIndex(entry => entry.target === target);

      if (index >= 0) {
        // Update target subscriber with undefined values.
        s_UPDATE_SUBSCRIBER(subscribers[index], void 0, void 0);
        subscribers.splice(index, 1);
      } // Remove element monitoring if last target removed.


      if (subscribers.length === 0) {
        s_MAP.delete(el);
        s_RESIZE_OBSERVER.unobserve(el);
      }
    }
  }

}
/**
 * Defines the various shape / update type of the given target.
 *
 * @type {Record<string, number>}
 */


const s_UPDATE_TYPES = {
  none: 0,
  attribute: 1,
  function: 2,
  resizeObserved: 3,
  setContentBounds: 4,
  setDimension: 5,
  storeObject: 6,
  storesObject: 7
};
const s_RESIZE_OBSERVER = new ResizeObserver(entries => {
  for (const entry of entries) {
    const subscribers = s_MAP.get(entry === null || entry === void 0 ? void 0 : entry.target);

    if (Array.isArray(subscribers)) {
      const contentWidth = entry.contentRect.width;
      const contentHeight = entry.contentRect.height;

      for (const subscriber of subscribers) {
        s_UPDATE_SUBSCRIBER(subscriber, contentWidth, contentHeight);
      }
    }
  }
});
/**
 * Determines the shape of the target instance regarding valid update mechanisms to set width & height changes.
 *
 * @param {*}  target - The target instance.
 *
 * @returns {number} Update type value.
 */

function s_GET_UPDATE_TYPE(target) {
  if ((target === null || target === void 0 ? void 0 : target.resizeObserved) instanceof Function) {
    return s_UPDATE_TYPES.resizeObserved;
  }

  if ((target === null || target === void 0 ? void 0 : target.setDimension) instanceof Function) {
    return s_UPDATE_TYPES.setDimension;
  }

  if ((target === null || target === void 0 ? void 0 : target.setContentBounds) instanceof Function) {
    return s_UPDATE_TYPES.setContentBounds;
  }

  const targetType = typeof target; // Does the target have resizeObserved writable store?

  if (targetType === 'object' || targetType === 'function') {
    if (isUpdatableStore(target.resizeObserved)) {
      return s_UPDATE_TYPES.storeObject;
    } // Now check for a child stores object which is a common TRL pattern for exposing stores.


    const stores = target === null || target === void 0 ? void 0 : target.stores;

    if (typeof stores === 'object' || typeof stores === 'function') {
      if (isUpdatableStore(stores.resizeObserved)) {
        return s_UPDATE_TYPES.storesObject;
      }
    }
  }

  if (targetType === 'object') {
    return s_UPDATE_TYPES.attribute;
  }

  if (targetType === 'function') {
    return s_UPDATE_TYPES.function;
  }

  return s_UPDATE_TYPES.none;
}
/**
 * Updates a subscriber target with given content width & height values. Offset width & height is calculated from
 * the content values + cached styles.
 *
 * @param {object}            subscriber - Internal data about subscriber.
 *
 * @param {number|undefined}  contentWidth - ResizeObserver contentRect.width value or undefined.
 *
 * @param {number|undefined}  contentHeight - ResizeObserver contentRect.height value or undefined.
 */


function s_UPDATE_SUBSCRIBER(subscriber, contentWidth, contentHeight) {
  var _target$resizeObserve, _target$setContentBou, _target$setDimension;

  const styles = subscriber.styles;
  subscriber.contentWidth = contentWidth;
  subscriber.contentHeight = contentHeight;
  const offsetWidth = Number.isFinite(contentWidth) ? contentWidth + styles.additionalWidth : void 0;
  const offsetHeight = Number.isFinite(contentHeight) ? contentHeight + styles.additionalHeight : void 0;
  const target = subscriber.target;

  switch (subscriber.updateType) {
    case s_UPDATE_TYPES.attribute:
      target.contentWidth = contentWidth;
      target.contentHeight = contentHeight;
      target.offsetWidth = offsetWidth;
      target.offsetHeight = offsetHeight;
      break;

    case s_UPDATE_TYPES.function:
      target === null || target === void 0 ? void 0 : target(offsetWidth, offsetHeight, contentWidth, contentHeight);
      break;

    case s_UPDATE_TYPES.resizeObserved:
      (_target$resizeObserve = target.resizeObserved) === null || _target$resizeObserve === void 0 ? void 0 : _target$resizeObserve.call(target, offsetWidth, offsetHeight, contentWidth, contentHeight);
      break;

    case s_UPDATE_TYPES.setContentBounds:
      (_target$setContentBou = target.setContentBounds) === null || _target$setContentBou === void 0 ? void 0 : _target$setContentBou.call(target, contentWidth, contentHeight);
      break;

    case s_UPDATE_TYPES.setDimension:
      (_target$setDimension = target.setDimension) === null || _target$setDimension === void 0 ? void 0 : _target$setDimension.call(target, offsetWidth, offsetHeight);
      break;

    case s_UPDATE_TYPES.storeObject:
      target.resizeObserved.update(object => {
        object.contentHeight = contentHeight;
        object.contentWidth = contentWidth;
        object.offsetHeight = offsetHeight;
        object.offsetWidth = offsetWidth;
        return object;
      });
      break;

    case s_UPDATE_TYPES.storesObject:
      target.stores.resizeObserved.update(object => {
        object.contentHeight = contentHeight;
        object.contentWidth = contentWidth;
        object.offsetHeight = offsetHeight;
        object.offsetWidth = offsetWidth;
        return object;
      });
      break;
  }
}
/**
 * Provides an action to enable pointer dragging of an HTMLElement and invoke `position.set` on a given {@link Position}
 * instance provided. When the attached boolean store state changes the draggable action is enabled or disabled.
 *
 * @param {HTMLElement}       node - The node associated with the action.
 *
 * @param {object}            params - Required parameters.
 *
 * @param {Position}          params.position - A position instance.
 *
 * @param {boolean}           [params.active=true] - A boolean value; attached to a readable store.
 *
 * @param {number}            [params.button=0] - MouseEvent button; {@link https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button}.
 *
 * @param {Writable<boolean>} [params.storeDragging] - A writable store that tracks "dragging" state.
 *
 * @param {boolean}           [params.ease=true] - When true easing is enabled.
 *
 * @param {object}            [params.easeOptions] - Gsap `to / `quickTo` vars object.
 *
 * @returns {{update: Function, destroy: Function}} The action lifecycle methods.
 */


function draggable(node, {
  position,
  active = true,
  button = 0,
  storeDragging = void 0,
  ease = false,
  easeOptions = {
    duration: 0.1,
    ease: cubicOut
  }
}) {
  /**
   * Duplicate the app / Positionable starting position to track differences.
   *
   * @type {object}
   */
  let initialPosition = null;
  /**
   * Stores the initial X / Y on drag down.
   *
   * @type {object}
   */

  let initialDragPoint = {};
  /**
   * Stores the current dragging state and gates the move pointer as the dragging store is not
   * set until the first pointer move.
   *
   * @type {boolean}
   */

  let dragging = false;
  /**
   * Stores the quickTo callback to use for optimized tweening when easing is enabled.
   *
   * @type {quickToCallback}
   */

  let quickTo = position.animate.quickTo(['top', 'left'], easeOptions);
  /**
   * Remember event handlers associated with this action so they may be later unregistered.
   *
   * @type {object}
   */

  const handlers = {
    dragDown: ['pointerdown', e => onDragPointerDown(e), false],
    dragMove: ['pointermove', e => onDragPointerChange(e), false],
    dragUp: ['pointerup', e => onDragPointerUp(e), false]
  };
  /**
   * Activates listeners.
   */

  function activateListeners() {
    // Drag handlers
    node.addEventListener(...handlers.dragDown);
    node.classList.add('draggable');
  }
  /**
   * Removes listeners.
   */


  function removeListeners() {
    if (typeof (storeDragging === null || storeDragging === void 0 ? void 0 : storeDragging.set) === 'function') {
      storeDragging.set(false);
    } // Drag handlers


    node.removeEventListener(...handlers.dragDown);
    node.removeEventListener(...handlers.dragMove);
    node.removeEventListener(...handlers.dragUp);
    node.classList.remove('draggable');
  }

  if (active) {
    activateListeners();
  }
  /**
   * Handle the initial pointer down that activates dragging behavior for the positionable.
   *
   * @param {PointerEvent} event - The pointer down event.
   */


  function onDragPointerDown(event) {
    if (event.button !== button || !event.isPrimary) {
      return;
    }

    event.preventDefault();
    dragging = false; // Record initial position.

    initialPosition = position.get();
    initialDragPoint = {
      x: event.clientX,
      y: event.clientY
    }; // Add move and pointer up handlers.

    node.addEventListener(...handlers.dragMove);
    node.addEventListener(...handlers.dragUp);
    node.setPointerCapture(event.pointerId);
  }
  /**
   * Move the positionable.
   *
   * @param {PointerEvent} event - The pointer move event.
   */


  function onDragPointerChange(event) {
    // See chorded button presses for pointer events:
    // https://www.w3.org/TR/pointerevents3/#chorded-button-interactions
    // TODO: Support different button configurations for PointerEvents.
    if ((event.buttons & 1) === 0) {
      onDragPointerUp(event);
      return;
    }

    if (event.button !== -1 || !event.isPrimary) {
      return;
    }

    event.preventDefault(); // Only set store dragging on first move event.

    if (!dragging && typeof (storeDragging === null || storeDragging === void 0 ? void 0 : storeDragging.set) === 'function') {
      dragging = true;
      storeDragging.set(true);
    }
    /** @type {number} */


    const newLeft = initialPosition.left + (event.clientX - initialDragPoint.x);
    /** @type {number} */

    const newTop = initialPosition.top + (event.clientY - initialDragPoint.y);

    if (ease) {
      quickTo(newTop, newLeft);
    } else {
      s_POSITION_DATA.left = newLeft;
      s_POSITION_DATA.top = newTop;
      position.set(s_POSITION_DATA);
    }
  }
  /**
   * Finish dragging and set the final position and removing listeners.
   *
   * @param {PointerEvent} event - The pointer up event.
   */


  function onDragPointerUp(event) {
    event.preventDefault();
    dragging = false;

    if (typeof (storeDragging === null || storeDragging === void 0 ? void 0 : storeDragging.set) === 'function') {
      storeDragging.set(false);
    }

    node.removeEventListener(...handlers.dragMove);
    node.removeEventListener(...handlers.dragUp);
  }

  return {
    // The default of active being true won't automatically add listeners twice.
    update: options => {
      if (typeof options.active === 'boolean') {
        active = options.active;

        if (active) {
          activateListeners();
        } else {
          removeListeners();
        }
      }

      if (typeof options.button === 'number') {
        button = options.button;
      }

      if (options.position !== void 0 && options.position !== position) {
        position = options.position;
        quickTo = position.animate.quickTo(['top', 'left'], easeOptions);
      }

      if (typeof options.ease === 'boolean') {
        ease = options.ease;
      }

      if (typeof options.easeOptions === 'object') {
        easeOptions = options.easeOptions;
        quickTo.options(easeOptions);
      }
    },
    destroy: () => removeListeners()
  };
}

var _ease = /*#__PURE__*/new WeakMap();

var _easeOptions = /*#__PURE__*/new WeakMap();

var _subscriptions = /*#__PURE__*/new WeakMap();

var _updateSubscribers = /*#__PURE__*/new WeakSet();

class DraggableOptions {
  /**
   * Stores the subscribers.
   *
   * @type {(function(DraggableOptions): void)[]}
   */
  constructor({
    ease,
    easeOptions
  } = {}) {
    _classPrivateMethodInitSpec(this, _updateSubscribers);

    _classPrivateFieldInitSpec(this, _ease, {
      writable: true,
      value: false
    });

    _classPrivateFieldInitSpec(this, _easeOptions, {
      writable: true,
      value: {
        duration: 0.1,
        ease: cubicOut
      }
    });

    _classPrivateFieldInitSpec(this, _subscriptions, {
      writable: true,
      value: []
    });

    // Define the following getters directly on this instance and make them enumerable. This allows them to be
    // picked up w/ `Object.assign`.
    Object.defineProperty(this, 'ease', {
      get: () => {
        return _classPrivateFieldGet(this, _ease);
      },
      set: newEase => {
        if (typeof newEase !== 'boolean') {
          throw new TypeError(`'ease' is not a boolean.`);
        }

        _classPrivateFieldSet(this, _ease, newEase);

        _classPrivateMethodGet(this, _updateSubscribers, _updateSubscribers2).call(this);
      },
      enumerable: true
    });
    Object.defineProperty(this, 'easeOptions', {
      get: () => {
        return _classPrivateFieldGet(this, _easeOptions);
      },
      set: newEaseOptions => {
        if (newEaseOptions === null || typeof newEaseOptions !== 'object') {
          throw new TypeError(`'easeOptions' is not an object.`);
        }

        if (newEaseOptions.duration !== void 0) {
          if (!Number.isFinite(newEaseOptions.duration)) {
            throw new TypeError(`'easeOptions.duration' is not a finite number.`);
          }

          if (newEaseOptions.duration < 0) {
            throw new Error(`'easeOptions.duration' is less than 0.`);
          }

          _classPrivateFieldGet(this, _easeOptions).duration = newEaseOptions.duration;
        }

        if (newEaseOptions.ease !== void 0) {
          if (typeof newEaseOptions.ease !== 'function' && typeof newEaseOptions.ease !== 'string') {
            throw new TypeError(`'easeOptions.ease' is not a function or string.`);
          }

          _classPrivateFieldGet(this, _easeOptions).ease = newEaseOptions.ease;
        }

        _classPrivateMethodGet(this, _updateSubscribers, _updateSubscribers2).call(this);
      },
      enumerable: true
    }); // Set default options.

    if (ease !== void 0) {
      this.ease = ease;
    }

    if (easeOptions !== void 0) {
      this.easeOptions = easeOptions;
    }
  }
  /**
   * @returns {number} Get ease duration
   */


  get easeDuration() {
    return _classPrivateFieldGet(this, _easeOptions).duration;
  }
  /**
   * @returns {string|Function} Get easing function value.
   */


  get easeValue() {
    return _classPrivateFieldGet(this, _easeOptions).ease;
  }
  /**
   * @param {number}   duration - Set ease duration.
   */


  set easeDuration(duration) {
    if (!Number.isFinite(duration)) {
      throw new TypeError(`'duration' is not a finite number.`);
    }

    if (duration < 0) {
      throw new Error(`'duration' is less than 0.`);
    }

    _classPrivateFieldGet(this, _easeOptions).duration = duration;

    _classPrivateMethodGet(this, _updateSubscribers, _updateSubscribers2).call(this);
  }
  /**
   * @param {string|Function} value - Get easing function value.
   */


  set easeValue(value) {
    if (typeof value !== 'function' && typeof value !== 'string') {
      throw new TypeError(`'value' is not a function or string.`);
    }

    _classPrivateFieldGet(this, _easeOptions).ease = value;

    _classPrivateMethodGet(this, _updateSubscribers, _updateSubscribers2).call(this);
  }
  /**
   * Resets all options data to default values.
   */


  reset() {
    _classPrivateFieldSet(this, _ease, false);

    _classPrivateFieldSet(this, _easeOptions, {
      duration: 0.1,
      ease: cubicOut
    });

    _classPrivateMethodGet(this, _updateSubscribers, _updateSubscribers2).call(this);
  }
  /**
   * Resets easing options to default values.
   */


  resetEase() {
    _classPrivateFieldSet(this, _easeOptions, {
      duration: 0.1,
      ease: cubicOut
    });

    _classPrivateMethodGet(this, _updateSubscribers, _updateSubscribers2).call(this);
  }
  /**
   *
   * @param {function(DraggableOptions): void} handler - Callback function that is invoked on update / changes.
   *                                                 Receives the DraggableOptions object / instance.
   *
   * @returns {(function(): void)} Unsubscribe function.
   */


  subscribe(handler) {
    _classPrivateFieldGet(this, _subscriptions).push(handler); // add handler to the array of subscribers


    handler(this); // call handler with current value
    // Return unsubscribe function.

    return () => {
      const index = _classPrivateFieldGet(this, _subscriptions).findIndex(sub => sub === handler);

      if (index >= 0) {
        _classPrivateFieldGet(this, _subscriptions).splice(index, 1);
      }
    };
  }

}
/**
 * Define a function to get a DraggableOptions instance.
 *
 * @returns {DraggableOptions} A new options instance.
 */


function _updateSubscribers2() {
  const subscriptions = _classPrivateFieldGet(this, _subscriptions); // Early out if there are no subscribers.


  if (subscriptions.length > 0) {
    for (let cntr = 0; cntr < subscriptions.length; cntr++) {
      subscriptions[cntr](this);
    }
  }
}

draggable.options = options => new DraggableOptions(options);
/**
 * Used for direct call to `position.set`.
 *
 * @type {{top: number, left: number}}
 */


const s_POSITION_DATA = {
  left: 0,
  top: 0
};

/**
 * A helper to create a set of radio checkbox input elements in a named set.
 * The provided keys are the possible radio values while the provided values are human readable labels.
 *
 * @param {string} name         The radio checkbox field name
 *
 * @param {object} choices      A mapping of radio checkbox values to human readable labels
 *
 * @param {object} options      Options which customize the radio boxes creation
 *
 * @param {string} options.checked    Which key is currently checked?
 *
 * @param {boolean} options.localize  Pass each label through string localization?
 *
 * @returns {string} HTML for radio boxes.
 *
 * @example <caption>The provided input data</caption>
 * let groupName = "importantChoice";
 * let choices = {a: "Choice A", b: "Choice B"};
 * let chosen = "a";
 *
 * @example <caption>The template HTML structure</caption>
 * <div class="form-group">
 *   <label>Radio Group Label</label>
 *   <div class="form-fields">
 *     {@html radioBoxes(groupName, choices, { checked: chosen, localize: true})}
 *   </div>
 * </div>
 */
/**
 * Localize a string including variable formatting for input arguments. Provide a string ID which defines the localized
 * template. Variables can be included in the template enclosed in braces and will be substituted using those named
 * keys.
 *
 * @param {string}   stringId - The string ID to translate.
 *
 * @param {object}   [data] - Provided input data.
 *
 * @returns {string} The translated and formatted string
 */


function localize(stringId, data) {
  const result = typeof data !== 'object' ? game.i18n.localize(stringId) : game.i18n.format(stringId, data);
  return result !== void 0 ? result : '';
}

/* src\component\core\TJSContainer.svelte generated by Svelte v3.48.0 */

function add_css$5(target) {
  append_styles(target, "svelte-1s361pr", "p.svelte-1s361pr{color:red;font-size:18px}");
}

function get_each_context$2$1(ctx, list, i) {
  const child_ctx = ctx.slice();
  child_ctx[2] = list[i];
  return child_ctx;
} // (12:15) 


function create_if_block_1$1(ctx) {
  let p;
  return {
    c() {
      p = element("p");
      p.textContent = "Container warning: No children.";
      attr(p, "class", "svelte-1s361pr");
    },

    m(target, anchor) {
      insert(target, p, anchor);
    },

    p: noop,
    i: noop,
    o: noop,

    d(detaching) {
      if (detaching) detach(p);
    }

  };
} // (8:0) {#if Array.isArray(children)}


function create_if_block$5$1(ctx) {
  let each_1_anchor;
  let current;
  let each_value =
  /*children*/
  ctx[1];
  let each_blocks = [];

  for (let i = 0; i < each_value.length; i += 1) {
    each_blocks[i] = create_each_block$2$1(get_each_context$2$1(ctx, each_value, i));
  }

  const out = i => transition_out(each_blocks[i], 1, 1, () => {
    each_blocks[i] = null;
  });

  return {
    c() {
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].c();
      }

      each_1_anchor = empty();
    },

    m(target, anchor) {
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].m(target, anchor);
      }

      insert(target, each_1_anchor, anchor);
      current = true;
    },

    p(ctx, dirty) {
      if (dirty &
      /*children*/
      2) {
        each_value =
        /*children*/
        ctx[1];
        let i;

        for (i = 0; i < each_value.length; i += 1) {
          const child_ctx = get_each_context$2$1(ctx, each_value, i);

          if (each_blocks[i]) {
            each_blocks[i].p(child_ctx, dirty);
            transition_in(each_blocks[i], 1);
          } else {
            each_blocks[i] = create_each_block$2$1(child_ctx);
            each_blocks[i].c();
            transition_in(each_blocks[i], 1);
            each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
          }
        }

        group_outros();

        for (i = each_value.length; i < each_blocks.length; i += 1) {
          out(i);
        }

        check_outros();
      }
    },

    i(local) {
      if (current) return;

      for (let i = 0; i < each_value.length; i += 1) {
        transition_in(each_blocks[i]);
      }

      current = true;
    },

    o(local) {
      each_blocks = each_blocks.filter(Boolean);

      for (let i = 0; i < each_blocks.length; i += 1) {
        transition_out(each_blocks[i]);
      }

      current = false;
    },

    d(detaching) {
      destroy_each(each_blocks, detaching);
      if (detaching) detach(each_1_anchor);
    }

  };
} // (9:4) {#each children as child}


function create_each_block$2$1(ctx) {
  let switch_instance;
  let switch_instance_anchor;
  let current;
  const switch_instance_spread_levels = [
  /*child*/
  ctx[2].props];
  var switch_value =
  /*child*/
  ctx[2].class;

  function switch_props(ctx) {
    let switch_instance_props = {};

    for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
      switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    }

    return {
      props: switch_instance_props
    };
  }

  if (switch_value) {
    switch_instance = new switch_value(switch_props());
  }

  return {
    c() {
      if (switch_instance) create_component(switch_instance.$$.fragment);
      switch_instance_anchor = empty();
    },

    m(target, anchor) {
      if (switch_instance) {
        mount_component(switch_instance, target, anchor);
      }

      insert(target, switch_instance_anchor, anchor);
      current = true;
    },

    p(ctx, dirty) {
      const switch_instance_changes = dirty &
      /*children*/
      2 ? get_spread_update(switch_instance_spread_levels, [get_spread_object(
      /*child*/
      ctx[2].props)]) : {};

      if (switch_value !== (switch_value =
      /*child*/
      ctx[2].class)) {
        if (switch_instance) {
          group_outros();
          const old_component = switch_instance;
          transition_out(old_component.$$.fragment, 1, 0, () => {
            destroy_component(old_component, 1);
          });
          check_outros();
        }

        if (switch_value) {
          switch_instance = new switch_value(switch_props());
          create_component(switch_instance.$$.fragment);
          transition_in(switch_instance.$$.fragment, 1);
          mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
        } else {
          switch_instance = null;
        }
      } else if (switch_value) {
        switch_instance.$set(switch_instance_changes);
      }
    },

    i(local) {
      if (current) return;
      if (switch_instance) transition_in(switch_instance.$$.fragment, local);
      current = true;
    },

    o(local) {
      if (switch_instance) transition_out(switch_instance.$$.fragment, local);
      current = false;
    },

    d(detaching) {
      if (detaching) detach(switch_instance_anchor);
      if (switch_instance) destroy_component(switch_instance, detaching);
    }

  };
}

function create_fragment$a$1(ctx) {
  let show_if;
  let current_block_type_index;
  let if_block;
  let if_block_anchor;
  let current;
  const if_block_creators = [create_if_block$5$1, create_if_block_1$1];
  const if_blocks = [];

  function select_block_type(ctx, dirty) {
    if (dirty &
    /*children*/
    2) show_if = null;
    if (show_if == null) show_if = !!Array.isArray(
    /*children*/
    ctx[1]);
    if (show_if) return 0;
    if (
    /*warn*/
    ctx[0]) return 1;
    return -1;
  }

  if (~(current_block_type_index = select_block_type(ctx, -1))) {
    if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
  }

  return {
    c() {
      if (if_block) if_block.c();
      if_block_anchor = empty();
    },

    m(target, anchor) {
      if (~current_block_type_index) {
        if_blocks[current_block_type_index].m(target, anchor);
      }

      insert(target, if_block_anchor, anchor);
      current = true;
    },

    p(ctx, [dirty]) {
      let previous_block_index = current_block_type_index;
      current_block_type_index = select_block_type(ctx, dirty);

      if (current_block_type_index === previous_block_index) {
        if (~current_block_type_index) {
          if_blocks[current_block_type_index].p(ctx, dirty);
        }
      } else {
        if (if_block) {
          group_outros();
          transition_out(if_blocks[previous_block_index], 1, 1, () => {
            if_blocks[previous_block_index] = null;
          });
          check_outros();
        }

        if (~current_block_type_index) {
          if_block = if_blocks[current_block_type_index];

          if (!if_block) {
            if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
            if_block.c();
          } else {
            if_block.p(ctx, dirty);
          }

          transition_in(if_block, 1);
          if_block.m(if_block_anchor.parentNode, if_block_anchor);
        } else {
          if_block = null;
        }
      }
    },

    i(local) {
      if (current) return;
      transition_in(if_block);
      current = true;
    },

    o(local) {
      transition_out(if_block);
      current = false;
    },

    d(detaching) {
      if (~current_block_type_index) {
        if_blocks[current_block_type_index].d(detaching);
      }

      if (detaching) detach(if_block_anchor);
    }

  };
}

function instance$a$1($$self, $$props, $$invalidate) {
  let {
    warn = false
  } = $$props;
  let {
    children = void 0
  } = $$props;

  $$self.$$set = $$props => {
    if ('warn' in $$props) $$invalidate(0, warn = $$props.warn);
    if ('children' in $$props) $$invalidate(1, children = $$props.children);
  };

  return [warn, children];
}

class TJSContainer extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$a$1, create_fragment$a$1, safe_not_equal, {
      warn: 0,
      children: 1
    }, add_css$5);
  }

  get warn() {
    return this.$$.ctx[0];
  }

  set warn(warn) {
    this.$$set({
      warn
    });
    flush();
  }

  get children() {
    return this.$$.ctx[1];
  }

  set children(children) {
    this.$$set({
      children
    });
    flush();
  }

}
/* src\component\core\TJSGlassPane.svelte generated by Svelte v3.48.0 */


function add_css$4(target) {
  append_styles(target, "svelte-71db55", ".tjs-glass-pane.svelte-71db55{position:absolute;overflow:inherit}");
}

function create_fragment$8$1(ctx) {
  let div;
  let div_intro;
  let div_outro;
  let current;
  let mounted;
  let dispose;
  const default_slot_template =
  /*#slots*/
  ctx[17].default;
  const default_slot = create_slot(default_slot_template, ctx,
  /*$$scope*/
  ctx[16], null);
  return {
    c() {
      div = element("div");
      if (default_slot) default_slot.c();
      attr(div, "id",
      /*id*/
      ctx[4]);
      attr(div, "tabindex", "0");
      attr(div, "class", "tjs-glass-pane svelte-71db55");
    },

    m(target, anchor) {
      insert(target, div, anchor);

      if (default_slot) {
        default_slot.m(div, null);
      }
      /*div_binding*/


      ctx[18](div);
      current = true;

      if (!mounted) {
        dispose = listen(div, "keydown",
        /*swallow*/
        ctx[6]);
        mounted = true;
      }
    },

    p(new_ctx, [dirty]) {
      ctx = new_ctx;

      if (default_slot) {
        if (default_slot.p && (!current || dirty &
        /*$$scope*/
        65536)) {
          update_slot_base(default_slot, default_slot_template, ctx,
          /*$$scope*/
          ctx[16], !current ? get_all_dirty_from_scope(
          /*$$scope*/
          ctx[16]) : get_slot_changes(default_slot_template,
          /*$$scope*/
          ctx[16], dirty, null), null);
        }
      }

      if (!current || dirty &
      /*id*/
      16) {
        attr(div, "id",
        /*id*/
        ctx[4]);
      }
    },

    i(local) {
      if (current) return;
      transition_in(default_slot, local);
      add_render_callback(() => {
        if (div_outro) div_outro.end(1);
        div_intro = create_in_transition(div,
        /*inTransition*/
        ctx[0],
        /*inTransitionOptions*/
        ctx[2]);
        div_intro.start();
      });
      current = true;
    },

    o(local) {
      transition_out(default_slot, local);
      if (div_intro) div_intro.invalidate();
      div_outro = create_out_transition(div,
      /*outTransition*/
      ctx[1],
      /*outTransitionOptions*/
      ctx[3]);
      current = false;
    },

    d(detaching) {
      if (detaching) detach(div);
      if (default_slot) default_slot.d(detaching);
      /*div_binding*/

      ctx[18](null);
      if (detaching && div_outro) div_outro.end();
      mounted = false;
      dispose();
    }

  };
}

function instance$8$1($$self, $$props, $$invalidate) {
  let {
    $$slots: slots = {},
    $$scope
  } = $$props;
  let {
    id = void 0
  } = $$props;
  let {
    zIndex = Number.MAX_SAFE_INTEGER
  } = $$props;
  let {
    background = '#50505080'
  } = $$props;
  let {
    captureInput = true
  } = $$props;
  let {
    preventDefault = true
  } = $$props;
  let {
    stopPropagation = true
  } = $$props;
  let glassPane;
  let {
    transition = void 0
  } = $$props;
  let {
    inTransition = s_DEFAULT_TRANSITION
  } = $$props;
  let {
    outTransition = s_DEFAULT_TRANSITION
  } = $$props;
  let {
    transitionOptions = void 0
  } = $$props;
  let {
    inTransitionOptions = s_DEFAULT_TRANSITION_OPTIONS
  } = $$props;
  let {
    outTransitionOptions = s_DEFAULT_TRANSITION_OPTIONS
  } = $$props; // Tracks last transition state.

  let oldTransition = void 0;
  let oldTransitionOptions = void 0; // ---------------------------------------------------------------------------------------------------------------

  function swallow(event) {
    if (captureInput) {
      if (preventDefault) {
        event.preventDefault();
      }

      if (stopPropagation) {
        event.stopPropagation();
      }
    }
  }

  function div_binding($$value) {
    binding_callbacks[$$value ? 'unshift' : 'push'](() => {
      glassPane = $$value;
      (($$invalidate(5, glassPane), $$invalidate(9, captureInput)), $$invalidate(8, background)), $$invalidate(7, zIndex);
    });
  }

  $$self.$$set = $$props => {
    if ('id' in $$props) $$invalidate(4, id = $$props.id);
    if ('zIndex' in $$props) $$invalidate(7, zIndex = $$props.zIndex);
    if ('background' in $$props) $$invalidate(8, background = $$props.background);
    if ('captureInput' in $$props) $$invalidate(9, captureInput = $$props.captureInput);
    if ('preventDefault' in $$props) $$invalidate(10, preventDefault = $$props.preventDefault);
    if ('stopPropagation' in $$props) $$invalidate(11, stopPropagation = $$props.stopPropagation);
    if ('transition' in $$props) $$invalidate(12, transition = $$props.transition);
    if ('inTransition' in $$props) $$invalidate(0, inTransition = $$props.inTransition);
    if ('outTransition' in $$props) $$invalidate(1, outTransition = $$props.outTransition);
    if ('transitionOptions' in $$props) $$invalidate(13, transitionOptions = $$props.transitionOptions);
    if ('inTransitionOptions' in $$props) $$invalidate(2, inTransitionOptions = $$props.inTransitionOptions);
    if ('outTransitionOptions' in $$props) $$invalidate(3, outTransitionOptions = $$props.outTransitionOptions);
    if ('$$scope' in $$props) $$invalidate(16, $$scope = $$props.$$scope);
  };

  $$self.$$.update = () => {
    if ($$self.$$.dirty &
    /*glassPane*/
    32) {
      if (glassPane) {
        $$invalidate(5, glassPane.style.maxWidth = '100%', glassPane);
        $$invalidate(5, glassPane.style.maxHeight = '100%', glassPane);
        $$invalidate(5, glassPane.style.width = '100%', glassPane);
        $$invalidate(5, glassPane.style.height = '100%', glassPane);
      }
    }

    if ($$self.$$.dirty &
    /*glassPane, captureInput*/
    544) {
      if (glassPane) {
        if (captureInput) {
          glassPane.focus();
        }

        $$invalidate(5, glassPane.style.pointerEvents = captureInput ? 'auto' : 'none', glassPane);
      }
    }

    if ($$self.$$.dirty &
    /*glassPane, background*/
    288) {
      if (glassPane) {
        $$invalidate(5, glassPane.style.background = background, glassPane);
      }
    }

    if ($$self.$$.dirty &
    /*glassPane, zIndex*/
    160) {
      if (glassPane) {
        $$invalidate(5, glassPane.style.zIndex = zIndex, glassPane);
      }
    }

    if ($$self.$$.dirty &
    /*oldTransition, transition*/
    20480) {
      // Run this reactive block when the last transition state is not equal to the current state.
      if (oldTransition !== transition) {
        // If transition is defined and not the default transition then set it to both in and out transition otherwise
        // set the default transition to both in & out transitions.
        const newTransition = s_DEFAULT_TRANSITION !== transition && typeof transition === 'function' ? transition : s_DEFAULT_TRANSITION;
        $$invalidate(0, inTransition = newTransition);
        $$invalidate(1, outTransition = newTransition);
        $$invalidate(14, oldTransition = newTransition);
      }
    }

    if ($$self.$$.dirty &
    /*oldTransitionOptions, transitionOptions*/
    40960) {
      // Run this reactive block when the last transition options state is not equal to the current options state.
      if (oldTransitionOptions !== transitionOptions) {
        const newOptions = transitionOptions !== s_DEFAULT_TRANSITION_OPTIONS && typeof transitionOptions === 'object' ? transitionOptions : s_DEFAULT_TRANSITION_OPTIONS;
        $$invalidate(2, inTransitionOptions = newOptions);
        $$invalidate(3, outTransitionOptions = newOptions);
        $$invalidate(15, oldTransitionOptions = newOptions);
      }
    }

    if ($$self.$$.dirty &
    /*inTransition*/
    1) {
      // Handle cases if inTransition is unset; assign noop default transition function.
      if (typeof inTransition !== 'function') {
        $$invalidate(0, inTransition = s_DEFAULT_TRANSITION);
      }
    }

    if ($$self.$$.dirty &
    /*outTransition*/
    2) {
      // Handle cases if outTransition is unset; assign noop default transition function.
      if (typeof outTransition !== 'function') {
        $$invalidate(1, outTransition = s_DEFAULT_TRANSITION);
      }
    }

    if ($$self.$$.dirty &
    /*inTransitionOptions*/
    4) {
      // Handle cases if inTransitionOptions is unset; assign empty default transition options.
      if (typeof inTransitionOptions !== 'object') {
        $$invalidate(2, inTransitionOptions = s_DEFAULT_TRANSITION_OPTIONS);
      }
    }

    if ($$self.$$.dirty &
    /*outTransitionOptions*/
    8) {
      // Handle cases if outTransitionOptions is unset; assign empty default transition options.
      if (typeof outTransitionOptions !== 'object') {
        $$invalidate(3, outTransitionOptions = s_DEFAULT_TRANSITION_OPTIONS);
      }
    }
  };

  return [inTransition, outTransition, inTransitionOptions, outTransitionOptions, id, glassPane, swallow, zIndex, background, captureInput, preventDefault, stopPropagation, transition, transitionOptions, oldTransition, oldTransitionOptions, $$scope, slots, div_binding];
}

class TJSGlassPane extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$8$1, create_fragment$8$1, safe_not_equal, {
      id: 4,
      zIndex: 7,
      background: 8,
      captureInput: 9,
      preventDefault: 10,
      stopPropagation: 11,
      transition: 12,
      inTransition: 0,
      outTransition: 1,
      transitionOptions: 13,
      inTransitionOptions: 2,
      outTransitionOptions: 3
    }, add_css$4);
  }

  get id() {
    return this.$$.ctx[4];
  }

  set id(id) {
    this.$$set({
      id
    });
    flush();
  }

  get zIndex() {
    return this.$$.ctx[7];
  }

  set zIndex(zIndex) {
    this.$$set({
      zIndex
    });
    flush();
  }

  get background() {
    return this.$$.ctx[8];
  }

  set background(background) {
    this.$$set({
      background
    });
    flush();
  }

  get captureInput() {
    return this.$$.ctx[9];
  }

  set captureInput(captureInput) {
    this.$$set({
      captureInput
    });
    flush();
  }

  get preventDefault() {
    return this.$$.ctx[10];
  }

  set preventDefault(preventDefault) {
    this.$$set({
      preventDefault
    });
    flush();
  }

  get stopPropagation() {
    return this.$$.ctx[11];
  }

  set stopPropagation(stopPropagation) {
    this.$$set({
      stopPropagation
    });
    flush();
  }

  get transition() {
    return this.$$.ctx[12];
  }

  set transition(transition) {
    this.$$set({
      transition
    });
    flush();
  }

  get inTransition() {
    return this.$$.ctx[0];
  }

  set inTransition(inTransition) {
    this.$$set({
      inTransition
    });
    flush();
  }

  get outTransition() {
    return this.$$.ctx[1];
  }

  set outTransition(outTransition) {
    this.$$set({
      outTransition
    });
    flush();
  }

  get transitionOptions() {
    return this.$$.ctx[13];
  }

  set transitionOptions(transitionOptions) {
    this.$$set({
      transitionOptions
    });
    flush();
  }

  get inTransitionOptions() {
    return this.$$.ctx[2];
  }

  set inTransitionOptions(inTransitionOptions) {
    this.$$set({
      inTransitionOptions
    });
    flush();
  }

  get outTransitionOptions() {
    return this.$$.ctx[3];
  }

  set outTransitionOptions(outTransitionOptions) {
    this.$$set({
      outTransitionOptions
    });
    flush();
  }

}
/* src\component\core\application\TJSHeaderButton.svelte generated by Svelte v3.48.0 */


function create_fragment$7$1(ctx) {
  let a;
  let html_tag;
  let t;
  let a_class_value;
  let applyStyles_action;
  let mounted;
  let dispose;
  return {
    c() {
      a = element("a");
      html_tag = new HtmlTag(false);
      t = text(
      /*label*/
      ctx[2]);
      html_tag.a = t;
      attr(a, "class", a_class_value = "header-button " +
      /*button*/
      ctx[0].class);
    },

    m(target, anchor) {
      insert(target, a, anchor);
      html_tag.m(
      /*icon*/
      ctx[1], a);
      append(a, t);

      if (!mounted) {
        dispose = [listen(a, "click", stop_propagation(prevent_default(
        /*onClick*/
        ctx[4])), true), listen(a, "pointerdown", stop_propagation(prevent_default(pointerdown_handler)), true), listen(a, "mousedown", stop_propagation(prevent_default(mousedown_handler)), true), listen(a, "dblclick", stop_propagation(prevent_default(dblclick_handler$1)), true), action_destroyer(applyStyles_action = applyStyles.call(null, a,
        /*styles*/
        ctx[3]))];
        mounted = true;
      }
    },

    p(ctx, [dirty]) {
      if (dirty &
      /*icon*/
      2) html_tag.p(
      /*icon*/
      ctx[1]);
      if (dirty &
      /*label*/
      4) set_data(t,
      /*label*/
      ctx[2]);

      if (dirty &
      /*button*/
      1 && a_class_value !== (a_class_value = "header-button " +
      /*button*/
      ctx[0].class)) {
        attr(a, "class", a_class_value);
      }

      if (applyStyles_action && is_function(applyStyles_action.update) && dirty &
      /*styles*/
      8) applyStyles_action.update.call(null,
      /*styles*/
      ctx[3]);
    },

    i: noop,
    o: noop,

    d(detaching) {
      if (detaching) detach(a);
      mounted = false;
      run_all(dispose);
    }

  };
}

const s_REGEX_HTML$1 = /^\s*<.*>$/;

const pointerdown_handler = () => null;

const mousedown_handler = () => null;

const dblclick_handler$1 = () => null;

function instance$7$1($$self, $$props, $$invalidate) {
  let {
    button
  } = $$props;
  let icon, label, title, styles;

  function onClick(event) {
    var _button$callback;

    // Accept either callback or onclick as the function / data to invoke.
    const invoke = (_button$callback = button.callback) !== null && _button$callback !== void 0 ? _button$callback : button.onclick;

    if (typeof invoke === 'function') {
      invoke.call(button, event);
      $$invalidate(0, button); // This provides a reactive update if button data changes.
    }
  }

  $$self.$$set = $$props => {
    if ('button' in $$props) $$invalidate(0, button = $$props.button);
  };

  $$self.$$.update = () => {
    if ($$self.$$.dirty &
    /*button, title*/
    33) {
      if (button) {
        $$invalidate(5, title = typeof button.title === 'string' ? localize(button.title) : ''); // Handle icon and treat bare strings as the icon class; otherwise assume the icon is fully formed HTML.

        $$invalidate(1, icon = typeof button.icon !== 'string' ? void 0 : s_REGEX_HTML$1.test(button.icon) ? button.icon : `<i class="${button.icon}" title="${title}"></i>`);
        $$invalidate(2, label = typeof button.label === 'string' ? localize(button.label) : '');
        $$invalidate(3, styles = typeof button.styles === 'object' ? button.styles : void 0);
      }
    }
  };

  return [button, icon, label, styles, onClick, title];
}

class TJSHeaderButton extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$7$1, create_fragment$7$1, safe_not_equal, {
      button: 0
    });
  }

  get button() {
    return this.$$.ctx[0];
  }

  set button(button) {
    this.$$set({
      button
    });
    flush();
  }

}
/* src\component\core\application\TJSApplicationHeader.svelte generated by Svelte v3.48.0 */


function add_css$3(target) {
  append_styles(target, "svelte-3umz0z", ".window-title.svelte-3umz0z{text-overflow:ellipsis;overflow:hidden;white-space:nowrap}");
}

function get_each_context$1$1(ctx, list, i) {
  const child_ctx = ctx.slice();
  child_ctx[20] = list[i];
  return child_ctx;
} // (86:6) {#each buttons as button}


function create_each_block$1$1(ctx) {
  let switch_instance;
  let switch_instance_anchor;
  let current;
  const switch_instance_spread_levels = [
  /*button*/
  ctx[20].props];
  var switch_value =
  /*button*/
  ctx[20].class;

  function switch_props(ctx) {
    let switch_instance_props = {};

    for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
      switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    }

    return {
      props: switch_instance_props
    };
  }

  if (switch_value) {
    switch_instance = new switch_value(switch_props());
  }

  return {
    c() {
      if (switch_instance) create_component(switch_instance.$$.fragment);
      switch_instance_anchor = empty();
    },

    m(target, anchor) {
      if (switch_instance) {
        mount_component(switch_instance, target, anchor);
      }

      insert(target, switch_instance_anchor, anchor);
      current = true;
    },

    p(ctx, dirty) {
      const switch_instance_changes = dirty &
      /*buttons*/
      8 ? get_spread_update(switch_instance_spread_levels, [get_spread_object(
      /*button*/
      ctx[20].props)]) : {};

      if (switch_value !== (switch_value =
      /*button*/
      ctx[20].class)) {
        if (switch_instance) {
          group_outros();
          const old_component = switch_instance;
          transition_out(old_component.$$.fragment, 1, 0, () => {
            destroy_component(old_component, 1);
          });
          check_outros();
        }

        if (switch_value) {
          switch_instance = new switch_value(switch_props());
          create_component(switch_instance.$$.fragment);
          transition_in(switch_instance.$$.fragment, 1);
          mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
        } else {
          switch_instance = null;
        }
      } else if (switch_value) {
        switch_instance.$set(switch_instance_changes);
      }
    },

    i(local) {
      if (current) return;
      if (switch_instance) transition_in(switch_instance.$$.fragment, local);
      current = true;
    },

    o(local) {
      if (switch_instance) transition_out(switch_instance.$$.fragment, local);
      current = false;
    },

    d(detaching) {
      if (detaching) detach(switch_instance_anchor);
      if (switch_instance) destroy_component(switch_instance, detaching);
    }

  };
} // (81:0) {#key draggable}


function create_key_block(ctx) {
  let header;
  let h4;
  let t0_value = localize(
  /*$storeTitle*/
  ctx[5]) + "";
  let t0;
  let t1;
  let draggable_action;
  let minimizable_action;
  let current;
  let mounted;
  let dispose;
  let each_value =
  /*buttons*/
  ctx[3];
  let each_blocks = [];

  for (let i = 0; i < each_value.length; i += 1) {
    each_blocks[i] = create_each_block$1$1(get_each_context$1$1(ctx, each_value, i));
  }

  const out = i => transition_out(each_blocks[i], 1, 1, () => {
    each_blocks[i] = null;
  });

  return {
    c() {
      header = element("header");
      h4 = element("h4");
      t0 = text(t0_value);
      t1 = space();

      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].c();
      }

      attr(h4, "class", "window-title svelte-3umz0z");
      set_style(h4, "display",
      /*displayHeaderTitle*/
      ctx[2], false);
      attr(header, "class", "window-header flexrow");
    },

    m(target, anchor) {
      insert(target, header, anchor);
      append(header, h4);
      append(h4, t0);
      append(header, t1);

      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].m(header, null);
      }

      current = true;

      if (!mounted) {
        dispose = [action_destroyer(draggable_action =
        /*draggable*/
        ctx[0].call(null, header,
        /*dragOptions*/
        ctx[1])), action_destroyer(minimizable_action =
        /*minimizable*/
        ctx[12].call(null, header,
        /*$storeMinimizable*/
        ctx[4]))];
        mounted = true;
      }
    },

    p(ctx, dirty) {
      if ((!current || dirty &
      /*$storeTitle*/
      32) && t0_value !== (t0_value = localize(
      /*$storeTitle*/
      ctx[5]) + "")) set_data(t0, t0_value);

      if (dirty &
      /*displayHeaderTitle*/
      4) {
        set_style(h4, "display",
        /*displayHeaderTitle*/
        ctx[2], false);
      }

      if (dirty &
      /*buttons*/
      8) {
        each_value =
        /*buttons*/
        ctx[3];
        let i;

        for (i = 0; i < each_value.length; i += 1) {
          const child_ctx = get_each_context$1$1(ctx, each_value, i);

          if (each_blocks[i]) {
            each_blocks[i].p(child_ctx, dirty);
            transition_in(each_blocks[i], 1);
          } else {
            each_blocks[i] = create_each_block$1$1(child_ctx);
            each_blocks[i].c();
            transition_in(each_blocks[i], 1);
            each_blocks[i].m(header, null);
          }
        }

        group_outros();

        for (i = each_value.length; i < each_blocks.length; i += 1) {
          out(i);
        }

        check_outros();
      }

      if (draggable_action && is_function(draggable_action.update) && dirty &
      /*dragOptions*/
      2) draggable_action.update.call(null,
      /*dragOptions*/
      ctx[1]);
      if (minimizable_action && is_function(minimizable_action.update) && dirty &
      /*$storeMinimizable*/
      16) minimizable_action.update.call(null,
      /*$storeMinimizable*/
      ctx[4]);
    },

    i(local) {
      if (current) return;

      for (let i = 0; i < each_value.length; i += 1) {
        transition_in(each_blocks[i]);
      }

      current = true;
    },

    o(local) {
      each_blocks = each_blocks.filter(Boolean);

      for (let i = 0; i < each_blocks.length; i += 1) {
        transition_out(each_blocks[i]);
      }

      current = false;
    },

    d(detaching) {
      if (detaching) detach(header);
      destroy_each(each_blocks, detaching);
      mounted = false;
      run_all(dispose);
    }

  };
}

function create_fragment$6$1(ctx) {
  let previous_key =
  /*draggable*/
  ctx[0];
  let key_block_anchor;
  let current;
  let key_block = create_key_block(ctx);
  return {
    c() {
      key_block.c();
      key_block_anchor = empty();
    },

    m(target, anchor) {
      key_block.m(target, anchor);
      insert(target, key_block_anchor, anchor);
      current = true;
    },

    p(ctx, [dirty]) {
      if (dirty &
      /*draggable*/
      1 && safe_not_equal(previous_key, previous_key =
      /*draggable*/
      ctx[0])) {
        group_outros();
        transition_out(key_block, 1, 1, noop);
        check_outros();
        key_block = create_key_block(ctx);
        key_block.c();
        transition_in(key_block, 1);
        key_block.m(key_block_anchor.parentNode, key_block_anchor);
      } else {
        key_block.p(ctx, dirty);
      }
    },

    i(local) {
      if (current) return;
      transition_in(key_block);
      current = true;
    },

    o(local) {
      transition_out(key_block);
      current = false;
    },

    d(detaching) {
      if (detaching) detach(key_block_anchor);
      key_block.d(detaching);
    }

  };
}

function instance$6$1($$self, $$props, $$invalidate) {
  let $storeHeaderButtons;
  let $storeMinimized;
  let $storeHeaderNoTitleMinimized;
  let $storeDraggable;
  let $storeMinimizable;
  let $storeTitle;
  let {
    draggable: draggable$1
  } = $$props;
  let {
    draggableOptions
  } = $$props;
  const application = getContext('external').application;
  const storeTitle = application.reactive.storeAppOptions.title;
  component_subscribe($$self, storeTitle, value => $$invalidate(5, $storeTitle = value));
  const storeDraggable = application.reactive.storeAppOptions.draggable;
  component_subscribe($$self, storeDraggable, value => $$invalidate(17, $storeDraggable = value));
  const storeDragging = application.reactive.storeUIState.dragging;
  const storeHeaderButtons = application.reactive.storeUIState.headerButtons;
  component_subscribe($$self, storeHeaderButtons, value => $$invalidate(14, $storeHeaderButtons = value));
  const storeHeaderNoTitleMinimized = application.reactive.storeAppOptions.headerNoTitleMinimized;
  component_subscribe($$self, storeHeaderNoTitleMinimized, value => $$invalidate(16, $storeHeaderNoTitleMinimized = value));
  const storeMinimizable = application.reactive.storeAppOptions.minimizable;
  component_subscribe($$self, storeMinimizable, value => $$invalidate(4, $storeMinimizable = value));
  const storeMinimized = application.reactive.storeUIState.minimized;
  component_subscribe($$self, storeMinimized, value => $$invalidate(15, $storeMinimized = value));
  let dragOptions;
  let displayHeaderTitle;
  let buttons;

  function minimizable(node, booleanStore) {
    const callback = application._onToggleMinimize.bind(application);

    function activateListeners() {
      node.addEventListener('dblclick', callback);
    }

    function removeListeners() {
      node.removeEventListener('dblclick', callback);
    }

    if (booleanStore) {
      activateListeners();
    }

    return {
      update: booleanStore => // eslint-disable-line no-shadow
      {
        if (booleanStore) {
          activateListeners();
        } else {
          removeListeners();
        }
      },
      destroy: () => removeListeners()
    };
  }

  $$self.$$set = $$props => {
    if ('draggable' in $$props) $$invalidate(0, draggable$1 = $$props.draggable);
    if ('draggableOptions' in $$props) $$invalidate(13, draggableOptions = $$props.draggableOptions);
  };

  $$self.$$.update = () => {
    if ($$self.$$.dirty &
    /*draggable*/
    1) {
      $$invalidate(0, draggable$1 = typeof draggable$1 === 'function' ? draggable$1 : draggable);
    }

    if ($$self.$$.dirty &
    /*draggableOptions, $storeDraggable*/
    139264) {
      // Combines external options with defaults for TJSApplicationHeader.
      // $: dragOptions = Object.assign({}, typeof draggableOptions === 'object' ? draggableOptions : {},
      //  { position: application.position, active: $storeDraggable, storeDragging });
      // Combines external options with defaults for TJSApplicationHeader. By default, easing is turned on w/ duration of
      // 0.1 and cubicOut, but can be overridden by any provided `draggableOptions`. `position`, `active`, and
      // `storeDragging` are always overridden by application position / stores.
      $$invalidate(1, dragOptions = Object.assign({}, {
        ease: true,
        easeOptions: {
          duration: 0.1,
          ease: cubicOut
        }
      }, typeof draggableOptions === 'object' ? draggableOptions : {}, {
        position: application.position,
        active: $storeDraggable,
        storeDragging
      }));
    }

    if ($$self.$$.dirty &
    /*$storeHeaderNoTitleMinimized, $storeMinimized*/
    98304) {
      $$invalidate(2, displayHeaderTitle = $storeHeaderNoTitleMinimized && $storeMinimized ? 'none' : null);
    }

    if ($$self.$$.dirty &
    /*$storeHeaderButtons*/
    16384) {
      {
        $$invalidate(3, buttons = $storeHeaderButtons.reduce((array, button) => {
          // If the button is a SvelteComponent set it as the class otherwise use `TJSHeaderButton` w/ button as props.
          array.push(isSvelteComponent(button) ? {
            class: button,
            props: {}
          } : {
            class: TJSHeaderButton,
            props: {
              button
            }
          });
          return array;
        }, []));
      }
    }
  };

  return [draggable$1, dragOptions, displayHeaderTitle, buttons, $storeMinimizable, $storeTitle, storeTitle, storeDraggable, storeHeaderButtons, storeHeaderNoTitleMinimized, storeMinimizable, storeMinimized, minimizable, draggableOptions, $storeHeaderButtons, $storeMinimized, $storeHeaderNoTitleMinimized, $storeDraggable];
}

class TJSApplicationHeader extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$6$1, create_fragment$6$1, safe_not_equal, {
      draggable: 0,
      draggableOptions: 13
    }, add_css$3);
  }

}
/* src\component\core\application\ResizableHandle.svelte generated by Svelte v3.48.0 */


function create_fragment$5$1(ctx) {
  let div;
  let resizable_action;
  let mounted;
  let dispose;
  return {
    c() {
      div = element("div");
      div.innerHTML = `<i class="fas fa-arrows-alt-h"></i>`;
      attr(div, "class", "window-resizable-handle");
    },

    m(target, anchor) {
      insert(target, div, anchor);
      /*div_binding*/

      ctx[10](div);

      if (!mounted) {
        dispose = action_destroyer(resizable_action =
        /*resizable*/
        ctx[6].call(null, div, {
          active:
          /*$storeResizable*/
          ctx[1],
          storeResizing:
          /*storeResizing*/
          ctx[5]
        }));
        mounted = true;
      }
    },

    p(ctx, [dirty]) {
      if (resizable_action && is_function(resizable_action.update) && dirty &
      /*$storeResizable*/
      2) resizable_action.update.call(null, {
        active:
        /*$storeResizable*/
        ctx[1],
        storeResizing:
        /*storeResizing*/
        ctx[5]
      });
    },

    i: noop,
    o: noop,

    d(detaching) {
      if (detaching) detach(div);
      /*div_binding*/

      ctx[10](null);
      mounted = false;
      dispose();
    }

  };
}

function instance$5$1($$self, $$props, $$invalidate) {
  let $storeElementRoot;
  let $storeMinimized;
  let $storeResizable;
  let {
    isResizable = false
  } = $$props;
  const application = getContext('external').application; // Allows retrieval of the element root at runtime.

  const storeElementRoot = getContext('storeElementRoot');
  component_subscribe($$self, storeElementRoot, value => $$invalidate(8, $storeElementRoot = value));
  const storeResizable = application.reactive.storeAppOptions.resizable;
  component_subscribe($$self, storeResizable, value => $$invalidate(1, $storeResizable = value));
  const storeMinimized = application.reactive.storeUIState.minimized;
  component_subscribe($$self, storeMinimized, value => $$invalidate(9, $storeMinimized = value));
  const storeResizing = application.reactive.storeUIState.resizing;
  let elementResize;
  /**
  * Provides an action to handle resizing the application shell based on the resizable app option.
  *
  * @param {HTMLElement}       node - The node associated with the action.
  *
  * @param {object}            [opts] - Optional parameters.
  *
  * @param {boolean}           [opts.active=true] - A boolean value; attached to a readable store.
  *
  * @param {Writable<boolean>} [opts.storeResizing] - A writable store that tracks "resizing" state.
  *
  * @returns {{update: Function, destroy: Function}} The action lifecycle methods.
  */

  function resizable(node, {
    active = true,
    storeResizing = void 0
  } = {}) {
    /**
    * Duplicate the app / Positionable starting position to track differences.
    *
    * @type {object}
    */
    let position = null;
    /**
    * Stores the initial X / Y on drag down.
    *
    * @type {object}
    */

    let initialPosition = {};
    /**
    * Stores the current resizing state and gates the move pointer as the resizing store is not
    * set until the first pointer move.
    *
    * @type {boolean}
    */

    let resizing = false;
    /**
    * Remember event handlers associated with this action so they may be later unregistered.
    *
    * @type {Object}
    */

    const handlers = {
      resizeDown: ['pointerdown', e => onResizePointerDown(e), false],
      resizeMove: ['pointermove', e => onResizePointerMove(e), false],
      resizeUp: ['pointerup', e => onResizePointerUp(e), false]
    };
    /**
    * Activates listeners.
    */

    function activateListeners() {
      // Resize handlers
      node.addEventListener(...handlers.resizeDown);
      $$invalidate(7, isResizable = true);
      node.style.display = 'block';
    }
    /**
    * Removes listeners.
    */


    function removeListeners() {
      if (typeof (storeResizing === null || storeResizing === void 0 ? void 0 : storeResizing.set) === 'function') {
        storeResizing.set(false);
      } // Resize handlers


      node.removeEventListener(...handlers.resizeDown);
      node.removeEventListener(...handlers.resizeMove);
      node.removeEventListener(...handlers.resizeUp);
      node.style.display = 'none';
      $$invalidate(7, isResizable = false);
    } // On mount if resizable is true then activate listeners otherwise set element display to `none`.


    if (active) {
      activateListeners();
    } else {
      node.style.display = 'none';
    }
    /**
    * Handle the initial pointer down that activates resizing capture.
    */


    function onResizePointerDown(event) {
      event.preventDefault();
      resizing = false; // Record initial position

      position = application.position.get();

      if (position.height === 'auto') {
        position.height = $storeElementRoot.clientHeight;
      }

      if (position.width === 'auto') {
        position.width = $storeElementRoot.clientWidth;
      }

      initialPosition = {
        x: event.clientX,
        y: event.clientY
      }; // Add temporary handlers

      node.addEventListener(...handlers.resizeMove);
      node.addEventListener(...handlers.resizeUp);
      node.setPointerCapture(event.pointerId);
    }
    /**
    * Sets the width / height of the positionable application.
    */


    function onResizePointerMove(event) {
      event.preventDefault();

      if (!resizing && typeof (storeResizing === null || storeResizing === void 0 ? void 0 : storeResizing.set) === 'function') {
        resizing = true;
        storeResizing.set(true);
      }

      application.position.set({
        width: position.width + (event.clientX - initialPosition.x),
        height: position.height + (event.clientY - initialPosition.y)
      });
    }
    /**
    * Conclude the dragging behavior when the pointer is released setting the final position and
    * removing listeners.
    */


    function onResizePointerUp(event) {
      resizing = false;

      if (typeof (storeResizing === null || storeResizing === void 0 ? void 0 : storeResizing.set) === 'function') {
        storeResizing.set(false);
      }

      event.preventDefault();
      node.removeEventListener(...handlers.resizeMove);
      node.removeEventListener(...handlers.resizeUp);

      application._onResize(event);
    }

    return {
      update: ({
        active
      }) => // eslint-disable-line no-shadow
      {
        if (active) {
          activateListeners();
        } else {
          removeListeners();
        }
      },
      destroy: () => removeListeners()
    };
  }

  function div_binding($$value) {
    binding_callbacks[$$value ? 'unshift' : 'push'](() => {
      elementResize = $$value;
      (($$invalidate(0, elementResize), $$invalidate(7, isResizable)), $$invalidate(9, $storeMinimized)), $$invalidate(8, $storeElementRoot);
    });
  }

  $$self.$$set = $$props => {
    if ('isResizable' in $$props) $$invalidate(7, isResizable = $$props.isResizable);
  };

  $$self.$$.update = () => {
    if ($$self.$$.dirty &
    /*elementResize, isResizable, $storeMinimized, $storeElementRoot*/
    897) {
      if (elementResize) {
        // Instead of creating a derived store it is easier to use isResizable and the minimized store below.
        $$invalidate(0, elementResize.style.display = isResizable && !$storeMinimized ? 'block' : 'none', elementResize); // Add / remove `resizable` class from element root.

        const elementRoot = $storeElementRoot;

        if (elementRoot) {
          elementRoot.classList[isResizable ? 'add' : 'remove']('resizable');
        }
      }
    }
  };

  return [elementResize, $storeResizable, storeElementRoot, storeResizable, storeMinimized, storeResizing, resizable, isResizable, $storeElementRoot, $storeMinimized, div_binding];
}

class ResizableHandle extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$5$1, create_fragment$5$1, safe_not_equal, {
      isResizable: 7
    });
  }

}
/* src\component\core\application\ApplicationShell.svelte generated by Svelte v3.48.0 */


function add_css$2(target) {
  append_styles(target, "svelte-are4no", ".window-app.svelte-are4no.svelte-are4no.svelte-are4no{overflow:inherit}.window-app.svelte-are4no .window-content.svelte-are4no>.svelte-are4no{flex:none}");
} // (225:6) {:else}


function create_else_block$3(ctx) {
  let current;
  const default_slot_template =
  /*#slots*/
  ctx[27].default;
  const default_slot = create_slot(default_slot_template, ctx,
  /*$$scope*/
  ctx[26], null);
  return {
    c() {
      if (default_slot) default_slot.c();
    },

    m(target, anchor) {
      if (default_slot) {
        default_slot.m(target, anchor);
      }

      current = true;
    },

    p(ctx, dirty) {
      if (default_slot) {
        if (default_slot.p && (!current || dirty &
        /*$$scope*/
        67108864)) {
          update_slot_base(default_slot, default_slot_template, ctx,
          /*$$scope*/
          ctx[26], !current ? get_all_dirty_from_scope(
          /*$$scope*/
          ctx[26]) : get_slot_changes(default_slot_template,
          /*$$scope*/
          ctx[26], dirty, null), null);
        }
      }
    },

    i(local) {
      if (current) return;
      transition_in(default_slot, local);
      current = true;
    },

    o(local) {
      transition_out(default_slot, local);
      current = false;
    },

    d(detaching) {
      if (default_slot) default_slot.d(detaching);
    }

  };
} // (223:6) {#if Array.isArray(allChildren)}


function create_if_block$4$1(ctx) {
  let tjscontainer;
  let current;
  tjscontainer = new TJSContainer({
    props: {
      children:
      /*allChildren*/
      ctx[14]
    }
  });
  return {
    c() {
      create_component(tjscontainer.$$.fragment);
    },

    m(target, anchor) {
      mount_component(tjscontainer, target, anchor);
      current = true;
    },

    p: noop,

    i(local) {
      if (current) return;
      transition_in(tjscontainer.$$.fragment, local);
      current = true;
    },

    o(local) {
      transition_out(tjscontainer.$$.fragment, local);
      current = false;
    },

    d(detaching) {
      destroy_component(tjscontainer, detaching);
    }

  };
}

function create_fragment$4$1(ctx) {
  let div;
  let tjsapplicationheader;
  let t0;
  let section;
  let current_block_type_index;
  let if_block;
  let applyStyles_action;
  let t1;
  let resizablehandle;
  let div_id_value;
  let div_class_value;
  let div_data_appid_value;
  let applyStyles_action_1;
  let div_intro;
  let div_outro;
  let current;
  let mounted;
  let dispose;
  tjsapplicationheader = new TJSApplicationHeader({
    props: {
      draggable:
      /*draggable*/
      ctx[6],
      draggableOptions:
      /*draggableOptions*/
      ctx[7]
    }
  });
  const if_block_creators = [create_if_block$4$1, create_else_block$3];
  const if_blocks = [];

  function select_block_type(ctx, dirty) {
    if (Array.isArray(
    /*allChildren*/
    ctx[14])) return 0;
    return 1;
  }

  current_block_type_index = select_block_type(ctx);
  if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
  resizablehandle = new ResizableHandle({});
  return {
    c() {
      div = element("div");
      create_component(tjsapplicationheader.$$.fragment);
      t0 = space();
      section = element("section");
      if_block.c();
      t1 = space();
      create_component(resizablehandle.$$.fragment);
      attr(section, "class", "window-content svelte-are4no");
      attr(div, "id", div_id_value =
      /*application*/
      ctx[10].id);
      attr(div, "class", div_class_value = "app window-app " +
      /*application*/
      ctx[10].options.classes.join(' ') + " svelte-are4no");
      attr(div, "data-appid", div_data_appid_value =
      /*application*/
      ctx[10].appId);
    },

    m(target, anchor) {
      insert(target, div, anchor);
      mount_component(tjsapplicationheader, div, null);
      append(div, t0);
      append(div, section);
      if_blocks[current_block_type_index].m(section, null);
      /*section_binding*/

      ctx[28](section);
      append(div, t1);
      mount_component(resizablehandle, div, null);
      /*div_binding*/

      ctx[29](div);
      current = true;

      if (!mounted) {
        dispose = [action_destroyer(applyStyles_action = applyStyles.call(null, section,
        /*stylesContent*/
        ctx[9])), action_destroyer(
        /*contentResizeObserver*/
        ctx[12].call(null, section,
        /*resizeObservedContent*/
        ctx[15])), listen(div, "pointerdown",
        /*bringToTop*/
        ctx[13], true), action_destroyer(applyStyles_action_1 = applyStyles.call(null, div,
        /*stylesApp*/
        ctx[8])), action_destroyer(
        /*appResizeObserver*/
        ctx[11].call(null, div,
        /*resizeObservedApp*/
        ctx[16]))];
        mounted = true;
      }
    },

    p(new_ctx, [dirty]) {
      ctx = new_ctx;
      const tjsapplicationheader_changes = {};
      if (dirty &
      /*draggable*/
      64) tjsapplicationheader_changes.draggable =
      /*draggable*/
      ctx[6];
      if (dirty &
      /*draggableOptions*/
      128) tjsapplicationheader_changes.draggableOptions =
      /*draggableOptions*/
      ctx[7];
      tjsapplicationheader.$set(tjsapplicationheader_changes);
      if_block.p(ctx, dirty);
      if (applyStyles_action && is_function(applyStyles_action.update) && dirty &
      /*stylesContent*/
      512) applyStyles_action.update.call(null,
      /*stylesContent*/
      ctx[9]);

      if (!current || dirty &
      /*application*/
      1024 && div_id_value !== (div_id_value =
      /*application*/
      ctx[10].id)) {
        attr(div, "id", div_id_value);
      }

      if (!current || dirty &
      /*application*/
      1024 && div_class_value !== (div_class_value = "app window-app " +
      /*application*/
      ctx[10].options.classes.join(' ') + " svelte-are4no")) {
        attr(div, "class", div_class_value);
      }

      if (!current || dirty &
      /*application*/
      1024 && div_data_appid_value !== (div_data_appid_value =
      /*application*/
      ctx[10].appId)) {
        attr(div, "data-appid", div_data_appid_value);
      }

      if (applyStyles_action_1 && is_function(applyStyles_action_1.update) && dirty &
      /*stylesApp*/
      256) applyStyles_action_1.update.call(null,
      /*stylesApp*/
      ctx[8]);
    },

    i(local) {
      if (current) return;
      transition_in(tjsapplicationheader.$$.fragment, local);
      transition_in(if_block);
      transition_in(resizablehandle.$$.fragment, local);
      add_render_callback(() => {
        if (div_outro) div_outro.end(1);
        div_intro = create_in_transition(div,
        /*inTransition*/
        ctx[2],
        /*inTransitionOptions*/
        ctx[4]);
        div_intro.start();
      });
      current = true;
    },

    o(local) {
      transition_out(tjsapplicationheader.$$.fragment, local);
      transition_out(if_block);
      transition_out(resizablehandle.$$.fragment, local);
      if (div_intro) div_intro.invalidate();
      div_outro = create_out_transition(div,
      /*outTransition*/
      ctx[3],
      /*outTransitionOptions*/
      ctx[5]);
      current = false;
    },

    d(detaching) {
      if (detaching) detach(div);
      destroy_component(tjsapplicationheader);
      if_blocks[current_block_type_index].d();
      /*section_binding*/

      ctx[28](null);
      destroy_component(resizablehandle);
      /*div_binding*/

      ctx[29](null);
      if (detaching && div_outro) div_outro.end();
      mounted = false;
      run_all(dispose);
    }

  };
}

function instance$4$1($$self, $$props, $$invalidate) {
  let {
    $$slots: slots = {},
    $$scope
  } = $$props;
  let {
    elementContent
  } = $$props;
  let {
    elementRoot
  } = $$props;
  let {
    draggable
  } = $$props;
  let {
    draggableOptions
  } = $$props;
  let {
    children = void 0
  } = $$props;
  let {
    stylesApp
  } = $$props;
  let {
    stylesContent
  } = $$props;
  let {
    appOffsetHeight = false
  } = $$props;
  let {
    appOffsetWidth = false
  } = $$props; // Set to `resizeObserver` if either of the above props are truthy otherwise a null operation.

  const appResizeObserver = !!appOffsetHeight || !!appOffsetWidth ? resizeObserver : () => null;
  let {
    contentOffsetHeight = false
  } = $$props;
  let {
    contentOffsetWidth = false
  } = $$props; // Set to `resizeObserver` if either of the above props are truthy otherwise a null operation.

  const contentResizeObserver = !!contentOffsetHeight || !!contentOffsetWidth ? resizeObserver : () => null; // If the application is a popOut application then when clicked bring to top. Bound to on pointerdown.

  const bringToTop = () => {
    if (typeof application.options.popOut === 'boolean' && application.options.popOut) {
      var _ui;

      if (application !== ((_ui = ui) === null || _ui === void 0 ? void 0 : _ui.activeWindow)) {
        application.bringToTop.call(application);
      } // If the activeElement is not `document.body` then blur the current active element and make `document.body`
      // focused. This allows <esc> key to close all open apps / windows.


      if (document.activeElement !== document.body) {
        // Blur current active element.
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        } // Make document body focused.


        document.body.focus();
      }
    }
  }; // Use a writable store to make `elementContent` and `elementRoot` accessible. A store is used in the case when
  // One root component with an `elementRoot` is replaced with another. Due to timing issues and the onDestroy / outro
  // transitions either of these may be set to null. I will investigate more and file a bug against Svelte.


  if (!getContext('storeElementContent')) {
    setContext('storeElementContent', writable(elementContent));
  }

  if (!getContext('storeElementRoot')) {
    setContext('storeElementRoot', writable(elementRoot));
  }

  const context = getContext('external'); // Store Foundry Application reference.

  const application = context.application; // This component can host multiple children defined via props or in the TyphonJS SvelteData configuration object
  // that are potentially mounted in the content area. If no children defined then this component mounts any slotted
  // child.

  const allChildren = Array.isArray(children) ? children : typeof context === 'object' ? context.children : void 0;
  let {
    transition = void 0
  } = $$props;
  let {
    inTransition = s_DEFAULT_TRANSITION
  } = $$props;
  let {
    outTransition = s_DEFAULT_TRANSITION
  } = $$props;
  let {
    transitionOptions = void 0
  } = $$props;
  let {
    inTransitionOptions = s_DEFAULT_TRANSITION_OPTIONS
  } = $$props;
  let {
    outTransitionOptions = s_DEFAULT_TRANSITION_OPTIONS
  } = $$props; // Tracks last transition state.

  let oldTransition = void 0;
  let oldTransitionOptions = void 0; // ---------------------------------------------------------------------------------------------------------------

  /**
  * Callback for content resizeObserver action. This is enabled when contentOffsetHeight or contentOffsetWidth is
  * bound.
  *
  * @param {number}   offsetWidth - Observed offsetWidth.
  *
  * @param {number}   offsetHeight - Observed offsetHeight
  */

  function resizeObservedContent(offsetWidth, offsetHeight) {
    $$invalidate(20, contentOffsetWidth = offsetWidth);
    $$invalidate(19, contentOffsetHeight = offsetHeight);
  }
  /**
  * Callback for app resizeObserver action. This is enabled when appOffsetHeight or appOffsetWidth is
  * bound. Additionally, the Application position resizeObserved store is updated.
  *
  * @param {number}   contentWidth - Observed contentWidth.
  * @param {number}   contentHeight - Observed contentHeight
  * @param {number}   offsetWidth - Observed offsetWidth.
  * @param {number}   offsetHeight - Observed offsetHeight
  */


  function resizeObservedApp(offsetWidth, offsetHeight, contentWidth, contentHeight) {
    application.position.stores.resizeObserved.update(object => {
      object.contentWidth = contentWidth;
      object.contentHeight = contentHeight;
      object.offsetWidth = offsetWidth;
      object.offsetHeight = offsetHeight;
      return object;
    });
    $$invalidate(17, appOffsetHeight = offsetHeight);
    $$invalidate(18, appOffsetWidth = offsetWidth);
  }

  function section_binding($$value) {
    binding_callbacks[$$value ? 'unshift' : 'push'](() => {
      elementContent = $$value;
      $$invalidate(0, elementContent);
    });
  }

  function div_binding($$value) {
    binding_callbacks[$$value ? 'unshift' : 'push'](() => {
      elementRoot = $$value;
      $$invalidate(1, elementRoot);
    });
  }

  $$self.$$set = $$props => {
    if ('elementContent' in $$props) $$invalidate(0, elementContent = $$props.elementContent);
    if ('elementRoot' in $$props) $$invalidate(1, elementRoot = $$props.elementRoot);
    if ('draggable' in $$props) $$invalidate(6, draggable = $$props.draggable);
    if ('draggableOptions' in $$props) $$invalidate(7, draggableOptions = $$props.draggableOptions);
    if ('children' in $$props) $$invalidate(21, children = $$props.children);
    if ('stylesApp' in $$props) $$invalidate(8, stylesApp = $$props.stylesApp);
    if ('stylesContent' in $$props) $$invalidate(9, stylesContent = $$props.stylesContent);
    if ('appOffsetHeight' in $$props) $$invalidate(17, appOffsetHeight = $$props.appOffsetHeight);
    if ('appOffsetWidth' in $$props) $$invalidate(18, appOffsetWidth = $$props.appOffsetWidth);
    if ('contentOffsetHeight' in $$props) $$invalidate(19, contentOffsetHeight = $$props.contentOffsetHeight);
    if ('contentOffsetWidth' in $$props) $$invalidate(20, contentOffsetWidth = $$props.contentOffsetWidth);
    if ('transition' in $$props) $$invalidate(22, transition = $$props.transition);
    if ('inTransition' in $$props) $$invalidate(2, inTransition = $$props.inTransition);
    if ('outTransition' in $$props) $$invalidate(3, outTransition = $$props.outTransition);
    if ('transitionOptions' in $$props) $$invalidate(23, transitionOptions = $$props.transitionOptions);
    if ('inTransitionOptions' in $$props) $$invalidate(4, inTransitionOptions = $$props.inTransitionOptions);
    if ('outTransitionOptions' in $$props) $$invalidate(5, outTransitionOptions = $$props.outTransitionOptions);
    if ('$$scope' in $$props) $$invalidate(26, $$scope = $$props.$$scope);
  };

  $$self.$$.update = () => {
    if ($$self.$$.dirty &
    /*elementContent*/
    1) {
      // Only update the `elementContent` store if the new `elementContent` is not null or undefined.
      if (elementContent !== void 0 && elementContent !== null) {
        getContext('storeElementContent').set(elementContent);
      }
    }

    if ($$self.$$.dirty &
    /*elementRoot*/
    2) {
      // Only update the `elementRoot` store if the new `elementRoot` is not null or undefined.
      if (elementRoot !== void 0 && elementRoot !== null) {
        getContext('storeElementRoot').set(elementRoot);
      }
    }

    if ($$self.$$.dirty &
    /*oldTransition, transition*/
    20971520) {
      // Run this reactive block when the last transition state is not equal to the current state.
      if (oldTransition !== transition) {
        // If transition is defined and not the default transition then set it to both in and out transition otherwise
        // set the default transition to both in & out transitions.
        const newTransition = s_DEFAULT_TRANSITION !== transition && typeof transition === 'function' ? transition : s_DEFAULT_TRANSITION;
        $$invalidate(2, inTransition = newTransition);
        $$invalidate(3, outTransition = newTransition);
        $$invalidate(24, oldTransition = newTransition);
      }
    }

    if ($$self.$$.dirty &
    /*oldTransitionOptions, transitionOptions*/
    41943040) {
      // Run this reactive block when the last transition options state is not equal to the current options state.
      if (oldTransitionOptions !== transitionOptions) {
        const newOptions = transitionOptions !== s_DEFAULT_TRANSITION_OPTIONS && typeof transitionOptions === 'object' ? transitionOptions : s_DEFAULT_TRANSITION_OPTIONS;
        $$invalidate(4, inTransitionOptions = newOptions);
        $$invalidate(5, outTransitionOptions = newOptions);
        $$invalidate(25, oldTransitionOptions = newOptions);
      }
    }

    if ($$self.$$.dirty &
    /*inTransition*/
    4) {
      // Handle cases if inTransition is unset; assign noop default transition function.
      if (typeof inTransition !== 'function') {
        $$invalidate(2, inTransition = s_DEFAULT_TRANSITION);
      }
    }

    if ($$self.$$.dirty &
    /*outTransition, application*/
    1032) {
      {
        var _application$options;

        // Handle cases if outTransition is unset; assign noop default transition function.
        if (typeof outTransition !== 'function') {
          $$invalidate(3, outTransition = s_DEFAULT_TRANSITION);
        } // Set jquery close animation to either run or not when an out transition is changed.


        if (application && typeof (application === null || application === void 0 ? void 0 : (_application$options = application.options) === null || _application$options === void 0 ? void 0 : _application$options.defaultCloseAnimation) === 'boolean') {
          $$invalidate(10, application.options.defaultCloseAnimation = outTransition === s_DEFAULT_TRANSITION, application);
        }
      }
    }

    if ($$self.$$.dirty &
    /*inTransitionOptions*/
    16) {
      // Handle cases if inTransitionOptions is unset; assign empty default transition options.
      if (typeof inTransitionOptions !== 'object') {
        $$invalidate(4, inTransitionOptions = s_DEFAULT_TRANSITION_OPTIONS);
      }
    }

    if ($$self.$$.dirty &
    /*outTransitionOptions*/
    32) {
      // Handle cases if outTransitionOptions is unset; assign empty default transition options.
      if (typeof outTransitionOptions !== 'object') {
        $$invalidate(5, outTransitionOptions = s_DEFAULT_TRANSITION_OPTIONS);
      }
    }
  };

  return [elementContent, elementRoot, inTransition, outTransition, inTransitionOptions, outTransitionOptions, draggable, draggableOptions, stylesApp, stylesContent, application, appResizeObserver, contentResizeObserver, bringToTop, allChildren, resizeObservedContent, resizeObservedApp, appOffsetHeight, appOffsetWidth, contentOffsetHeight, contentOffsetWidth, children, transition, transitionOptions, oldTransition, oldTransitionOptions, $$scope, slots, section_binding, div_binding];
}

class ApplicationShell extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$4$1, create_fragment$4$1, safe_not_equal, {
      elementContent: 0,
      elementRoot: 1,
      draggable: 6,
      draggableOptions: 7,
      children: 21,
      stylesApp: 8,
      stylesContent: 9,
      appOffsetHeight: 17,
      appOffsetWidth: 18,
      contentOffsetHeight: 19,
      contentOffsetWidth: 20,
      transition: 22,
      inTransition: 2,
      outTransition: 3,
      transitionOptions: 23,
      inTransitionOptions: 4,
      outTransitionOptions: 5
    }, add_css$2);
  }

  get elementContent() {
    return this.$$.ctx[0];
  }

  set elementContent(elementContent) {
    this.$$set({
      elementContent
    });
    flush();
  }

  get elementRoot() {
    return this.$$.ctx[1];
  }

  set elementRoot(elementRoot) {
    this.$$set({
      elementRoot
    });
    flush();
  }

  get draggable() {
    return this.$$.ctx[6];
  }

  set draggable(draggable) {
    this.$$set({
      draggable
    });
    flush();
  }

  get draggableOptions() {
    return this.$$.ctx[7];
  }

  set draggableOptions(draggableOptions) {
    this.$$set({
      draggableOptions
    });
    flush();
  }

  get children() {
    return this.$$.ctx[21];
  }

  set children(children) {
    this.$$set({
      children
    });
    flush();
  }

  get stylesApp() {
    return this.$$.ctx[8];
  }

  set stylesApp(stylesApp) {
    this.$$set({
      stylesApp
    });
    flush();
  }

  get stylesContent() {
    return this.$$.ctx[9];
  }

  set stylesContent(stylesContent) {
    this.$$set({
      stylesContent
    });
    flush();
  }

  get appOffsetHeight() {
    return this.$$.ctx[17];
  }

  set appOffsetHeight(appOffsetHeight) {
    this.$$set({
      appOffsetHeight
    });
    flush();
  }

  get appOffsetWidth() {
    return this.$$.ctx[18];
  }

  set appOffsetWidth(appOffsetWidth) {
    this.$$set({
      appOffsetWidth
    });
    flush();
  }

  get contentOffsetHeight() {
    return this.$$.ctx[19];
  }

  set contentOffsetHeight(contentOffsetHeight) {
    this.$$set({
      contentOffsetHeight
    });
    flush();
  }

  get contentOffsetWidth() {
    return this.$$.ctx[20];
  }

  set contentOffsetWidth(contentOffsetWidth) {
    this.$$set({
      contentOffsetWidth
    });
    flush();
  }

  get transition() {
    return this.$$.ctx[22];
  }

  set transition(transition) {
    this.$$set({
      transition
    });
    flush();
  }

  get inTransition() {
    return this.$$.ctx[2];
  }

  set inTransition(inTransition) {
    this.$$set({
      inTransition
    });
    flush();
  }

  get outTransition() {
    return this.$$.ctx[3];
  }

  set outTransition(outTransition) {
    this.$$set({
      outTransition
    });
    flush();
  }

  get transitionOptions() {
    return this.$$.ctx[23];
  }

  set transitionOptions(transitionOptions) {
    this.$$set({
      transitionOptions
    });
    flush();
  }

  get inTransitionOptions() {
    return this.$$.ctx[4];
  }

  set inTransitionOptions(inTransitionOptions) {
    this.$$set({
      inTransitionOptions
    });
    flush();
  }

  get outTransitionOptions() {
    return this.$$.ctx[5];
  }

  set outTransitionOptions(outTransitionOptions) {
    this.$$set({
      outTransitionOptions
    });
    flush();
  }

}
/* src\component\core\dialog\DialogContent.svelte generated by Svelte v3.48.0 */


function add_css(target) {
  append_styles(target, "svelte-14xg9ru", "div.dialog-buttons.svelte-14xg9ru{padding-top:8px}");
}

function get_each_context$a(ctx, list, i) {
  const child_ctx = ctx.slice();
  child_ctx[15] = list[i];
  return child_ctx;
} // (202:29) 


function create_if_block_3(ctx) {
  let switch_instance;
  let switch_instance_anchor;
  let current;
  const switch_instance_spread_levels = [
  /*dialogProps*/
  ctx[5]];
  var switch_value =
  /*dialogComponent*/
  ctx[4];

  function switch_props(ctx) {
    let switch_instance_props = {};

    for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
      switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    }

    return {
      props: switch_instance_props
    };
  }

  if (switch_value) {
    switch_instance = new switch_value(switch_props());
    /*switch_instance_binding*/

    ctx[12](switch_instance);
  }

  return {
    c() {
      if (switch_instance) create_component(switch_instance.$$.fragment);
      switch_instance_anchor = empty();
    },

    m(target, anchor) {
      if (switch_instance) {
        mount_component(switch_instance, target, anchor);
      }

      insert(target, switch_instance_anchor, anchor);
      current = true;
    },

    p(ctx, dirty) {
      const switch_instance_changes = dirty &
      /*dialogProps*/
      32 ? get_spread_update(switch_instance_spread_levels, [get_spread_object(
      /*dialogProps*/
      ctx[5])]) : {};

      if (switch_value !== (switch_value =
      /*dialogComponent*/
      ctx[4])) {
        if (switch_instance) {
          group_outros();
          const old_component = switch_instance;
          transition_out(old_component.$$.fragment, 1, 0, () => {
            destroy_component(old_component, 1);
          });
          check_outros();
        }

        if (switch_value) {
          switch_instance = new switch_value(switch_props());
          /*switch_instance_binding*/

          ctx[12](switch_instance);
          create_component(switch_instance.$$.fragment);
          transition_in(switch_instance.$$.fragment, 1);
          mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
        } else {
          switch_instance = null;
        }
      } else if (switch_value) {
        switch_instance.$set(switch_instance_changes);
      }
    },

    i(local) {
      if (current) return;
      if (switch_instance) transition_in(switch_instance.$$.fragment, local);
      current = true;
    },

    o(local) {
      if (switch_instance) transition_out(switch_instance.$$.fragment, local);
      current = false;
    },

    d(detaching) {
      /*switch_instance_binding*/
      ctx[12](null);
      if (detaching) detach(switch_instance_anchor);
      if (switch_instance) destroy_component(switch_instance, detaching);
    }

  };
} // (200:3) {#if typeof content === 'string'}


function create_if_block_2$1(ctx) {
  let html_tag;
  let html_anchor;
  return {
    c() {
      html_tag = new HtmlTag(false);
      html_anchor = empty();
      html_tag.a = html_anchor;
    },

    m(target, anchor) {
      html_tag.m(
      /*content*/
      ctx[2], target, anchor);
      insert(target, html_anchor, anchor);
    },

    p(ctx, dirty) {
      if (dirty &
      /*content*/
      4) html_tag.p(
      /*content*/
      ctx[2]);
    },

    i: noop,
    o: noop,

    d(detaching) {
      if (detaching) detach(html_anchor);
      if (detaching) html_tag.d();
    }

  };
} // (207:0) {#if buttons.length}


function create_if_block$1$1(ctx) {
  let div;
  let each_blocks = [];
  let each_1_lookup = new Map();
  let each_value =
  /*buttons*/
  ctx[1];

  const get_key = ctx =>
  /*button*/
  ctx[15].id;

  for (let i = 0; i < each_value.length; i += 1) {
    let child_ctx = get_each_context$a(ctx, each_value, i);
    let key = get_key(child_ctx);
    each_1_lookup.set(key, each_blocks[i] = create_each_block$a(key, child_ctx));
  }

  return {
    c() {
      div = element("div");

      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].c();
      }

      attr(div, "class", "dialog-buttons svelte-14xg9ru");
    },

    m(target, anchor) {
      insert(target, div, anchor);

      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].m(div, null);
      }
    },

    p(ctx, dirty) {
      if (dirty &
      /*buttons, currentButtonId, onClick*/
      74) {
        each_value =
        /*buttons*/
        ctx[1];
        each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div, destroy_block, create_each_block$a, null, get_each_context$a);
      }
    },

    d(detaching) {
      if (detaching) detach(div);

      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].d();
      }
    }

  };
} // (214:33) {#if button.icon}


function create_if_block_1$2(ctx) {
  let html_tag;
  let raw_value =
  /*button*/
  ctx[15].icon + "";
  let html_anchor;
  return {
    c() {
      html_tag = new HtmlTag(false);
      html_anchor = empty();
      html_tag.a = html_anchor;
    },

    m(target, anchor) {
      html_tag.m(raw_value, target, anchor);
      insert(target, html_anchor, anchor);
    },

    p(ctx, dirty) {
      if (dirty &
      /*buttons*/
      2 && raw_value !== (raw_value =
      /*button*/
      ctx[15].icon + "")) html_tag.p(raw_value);
    },

    d(detaching) {
      if (detaching) detach(html_anchor);
      if (detaching) html_tag.d();
    }

  };
} // (209:3) {#each buttons as button (button.id)}


function create_each_block$a(key_1, ctx) {
  let button;
  let span;
  let t0_value =
  /*button*/
  ctx[15].label + "";
  let t0;
  let span_title_value;
  let t1;
  let button_class_value;
  let applyStyles_action;
  let mounted;
  let dispose;
  let if_block =
  /*button*/
  ctx[15].icon && create_if_block_1$2(ctx);

  function click_handler() {
    return (
      /*click_handler*/
      ctx[13](
      /*button*/
      ctx[15])
    );
  }

  return {
    key: key_1,
    first: null,

    c() {
      button = element("button");
      span = element("span");
      if (if_block) if_block.c();
      t0 = text(t0_value);
      t1 = space();
      attr(span, "title", span_title_value =
      /*button*/
      ctx[15].title);
      attr(button, "class", button_class_value = "dialog-button " +
      /*button*/
      ctx[15].id);
      toggle_class(button, "default",
      /*button*/
      ctx[15].id ===
      /*currentButtonId*/
      ctx[3]);
      this.first = button;
    },

    m(target, anchor) {
      insert(target, button, anchor);
      append(button, span);
      if (if_block) if_block.m(span, null);
      append(span, t0);
      append(button, t1);

      if (!mounted) {
        dispose = [listen(button, "click", click_handler), action_destroyer(applyStyles_action = applyStyles.call(null, button,
        /*button*/
        ctx[15].styles))];
        mounted = true;
      }
    },

    p(new_ctx, dirty) {
      ctx = new_ctx;

      if (
      /*button*/
      ctx[15].icon) {
        if (if_block) {
          if_block.p(ctx, dirty);
        } else {
          if_block = create_if_block_1$2(ctx);
          if_block.c();
          if_block.m(span, t0);
        }
      } else if (if_block) {
        if_block.d(1);
        if_block = null;
      }

      if (dirty &
      /*buttons*/
      2 && t0_value !== (t0_value =
      /*button*/
      ctx[15].label + "")) set_data(t0, t0_value);

      if (dirty &
      /*buttons*/
      2 && span_title_value !== (span_title_value =
      /*button*/
      ctx[15].title)) {
        attr(span, "title", span_title_value);
      }

      if (dirty &
      /*buttons*/
      2 && button_class_value !== (button_class_value = "dialog-button " +
      /*button*/
      ctx[15].id)) {
        attr(button, "class", button_class_value);
      }

      if (applyStyles_action && is_function(applyStyles_action.update) && dirty &
      /*buttons*/
      2) applyStyles_action.update.call(null,
      /*button*/
      ctx[15].styles);

      if (dirty &
      /*buttons, buttons, currentButtonId*/
      10) {
        toggle_class(button, "default",
        /*button*/
        ctx[15].id ===
        /*currentButtonId*/
        ctx[3]);
      }
    },

    d(detaching) {
      if (detaching) detach(button);
      if (if_block) if_block.d();
      mounted = false;
      run_all(dispose);
    }

  };
}

function create_fragment$1$1(ctx) {
  let t0;
  let div;
  let current_block_type_index;
  let if_block0;
  let t1;
  let if_block1_anchor;
  let current;
  let mounted;
  let dispose;
  const if_block_creators = [create_if_block_2$1, create_if_block_3];
  const if_blocks = [];

  function select_block_type(ctx, dirty) {
    if (typeof
    /*content*/
    ctx[2] === 'string') return 0;
    if (
    /*dialogComponent*/
    ctx[4]) return 1;
    return -1;
  }

  if (~(current_block_type_index = select_block_type(ctx))) {
    if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
  }

  let if_block1 =
  /*buttons*/
  ctx[1].length && create_if_block$1$1(ctx);
  return {
    c() {
      t0 = space();
      div = element("div");
      if (if_block0) if_block0.c();
      t1 = space();
      if (if_block1) if_block1.c();
      if_block1_anchor = empty();
      attr(div, "class", "dialog-content");
    },

    m(target, anchor) {
      insert(target, t0, anchor);
      insert(target, div, anchor);

      if (~current_block_type_index) {
        if_blocks[current_block_type_index].m(div, null);
      }

      insert(target, t1, anchor);
      if (if_block1) if_block1.m(target, anchor);
      insert(target, if_block1_anchor, anchor);
      current = true;

      if (!mounted) {
        dispose = listen(document.body, "keydown",
        /*onKeydown*/
        ctx[7]);
        mounted = true;
      }
    },

    p(ctx, [dirty]) {
      let previous_block_index = current_block_type_index;
      current_block_type_index = select_block_type(ctx);

      if (current_block_type_index === previous_block_index) {
        if (~current_block_type_index) {
          if_blocks[current_block_type_index].p(ctx, dirty);
        }
      } else {
        if (if_block0) {
          group_outros();
          transition_out(if_blocks[previous_block_index], 1, 1, () => {
            if_blocks[previous_block_index] = null;
          });
          check_outros();
        }

        if (~current_block_type_index) {
          if_block0 = if_blocks[current_block_type_index];

          if (!if_block0) {
            if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
            if_block0.c();
          } else {
            if_block0.p(ctx, dirty);
          }

          transition_in(if_block0, 1);
          if_block0.m(div, null);
        } else {
          if_block0 = null;
        }
      }

      if (
      /*buttons*/
      ctx[1].length) {
        if (if_block1) {
          if_block1.p(ctx, dirty);
        } else {
          if_block1 = create_if_block$1$1(ctx);
          if_block1.c();
          if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
        }
      } else if (if_block1) {
        if_block1.d(1);
        if_block1 = null;
      }
    },

    i(local) {
      if (current) return;
      transition_in(if_block0);
      current = true;
    },

    o(local) {
      transition_out(if_block0);
      current = false;
    },

    d(detaching) {
      if (detaching) detach(t0);
      if (detaching) detach(div);

      if (~current_block_type_index) {
        if_blocks[current_block_type_index].d();
      }

      if (detaching) detach(t1);
      if (if_block1) if_block1.d(detaching);
      if (detaching) detach(if_block1_anchor);
      mounted = false;
      dispose();
    }

  };
}

const s_REGEX_HTML = /^\s*<.*>$/;

function instance$1$1($$self, $$props, $$invalidate) {
  let {
    data = {}
  } = $$props;
  let {
    autoClose = true
  } = $$props;
  let {
    preventDefault = false
  } = $$props;
  let {
    stopPropagation = false
  } = $$props;
  let {
    dialogInstance = void 0
  } = $$props;
  let buttons;
  let content = void 0;
  let dialogComponent;
  let dialogProps = {};
  let application = getContext('external').application;
  let currentButtonId = data.default;

  async function onClick(button) {
    try {
      var _button$callback2;

      let result = null; // Accept either callback or onclick as the function / data to invoke.

      const invoke = (_button$callback2 = button.callback) !== null && _button$callback2 !== void 0 ? _button$callback2 : button.onclick;

      switch (typeof invoke) {
        case 'function':
          // Passing back the HTML element is to keep with the existing Foundry API, however second parameter is
          // the Svelte component instance.
          result = await invoke(application.options.jQuery ? application.element : application.element[0], dialogInstance);
          break;

        case 'string':
          // Attempt lookup by function name in dialog instance component.
          if (dialogInstance !== void 0 && typeof dialogInstance[invoke] === 'function') {
            result = await dialogInstance[invoke](application.options.jQuery ? application.element : application.element[0], dialogInstance);
          }

          break;
      } // Delay closing to next clock tick to be able to return result.


      if (autoClose) {
        setTimeout(() => application.close(), 0);
      }

      return result;
    } catch (err) {
      ui.notifications.error(err);
      throw new Error(err);
    }
  }

  function onKeydown(event) {
    /**
    * If this dialog is not the activeWindow then return immediately. See {@link SvelteApplication.bringToTop} as
    * SvelteApplication overrides core Foundry and always sets the activeWindow when `bringToTop` is invoked.
    */
    if (event.key !== 'Escape' && ui.activeWindow !== application) {
      return;
    }

    switch (event.key) {
      case 'ArrowLeft':
        {
          event.preventDefault();
          event.stopPropagation();
          const currentIndex = buttons.findIndex(button => button.id === currentButtonId);

          if (buttons.length && currentIndex > 0) {
            $$invalidate(3, currentButtonId = buttons[currentIndex - 1].id);
          }

          break;
        }

      case 'ArrowRight':
        {
          event.preventDefault();
          event.stopPropagation();
          const currentIndex = buttons.findIndex(button => button.id === currentButtonId);

          if (buttons.length && currentIndex < buttons.length - 1) {
            $$invalidate(3, currentButtonId = buttons[currentIndex + 1].id);
          }

          break;
        }

      case 'Escape':
        event.preventDefault();
        event.stopPropagation();
        return application.close();

      case 'Enter':
        event.preventDefault();
        event.stopPropagation();

        if (currentButtonId && isObject(data.buttons) && currentButtonId in data.buttons) {
          onClick(data.buttons[currentButtonId]);
        }

        break;

      default:
        if (preventDefault) {
          event.preventDefault();
        }

        if (stopPropagation) {
          event.stopPropagation();
        }

        break;
    }
  }

  function switch_instance_binding($$value) {
    binding_callbacks[$$value ? 'unshift' : 'push'](() => {
      dialogInstance = $$value;
      $$invalidate(0, dialogInstance);
    });
  }

  const click_handler = button => onClick(button);

  $$self.$$set = $$props => {
    if ('data' in $$props) $$invalidate(8, data = $$props.data);
    if ('autoClose' in $$props) $$invalidate(9, autoClose = $$props.autoClose);
    if ('preventDefault' in $$props) $$invalidate(10, preventDefault = $$props.preventDefault);
    if ('stopPropagation' in $$props) $$invalidate(11, stopPropagation = $$props.stopPropagation);
    if ('dialogInstance' in $$props) $$invalidate(0, dialogInstance = $$props.dialogInstance);
  };

  $$self.$$.update = () => {
    if ($$self.$$.dirty &
    /*data*/
    256) {
      // If `data.buttons` is not an object then set an empty array otherwise reduce the button data.
      {
        $$invalidate(1, buttons = !isObject(data.buttons) ? [] : Object.keys(data.buttons).reduce((array, key) => {
          var _b$condition;

          const b = data.buttons[key]; // Handle icon and treat bare strings as the icon class; otherwise assume the icon is fully formed HTML.

          const icon = typeof b.icon !== 'string' ? void 0 : s_REGEX_HTML.test(b.icon) ? b.icon : `<i class="${b.icon}"></i>`;
          const label = typeof b.label === 'string' ? `${icon !== void 0 ? ' ' : ''}${localize(b.label)}` : '';
          const title = typeof b.title === 'string' ? localize(b.title) : void 0; // Test any condition supplied otherwise default to true.

          const condition = typeof b.condition === 'function' ? b.condition.call(b) : (_b$condition = b.condition) !== null && _b$condition !== void 0 ? _b$condition : true;

          if (condition) {
            array.push(_objectSpread2(_objectSpread2({}, b), {}, {
              id: key,
              icon,
              label,
              title
            }));
          }

          return array;
        }, []));
      }
    }

    if ($$self.$$.dirty &
    /*buttons, currentButtonId*/
    10) {
      /**
      * This reactivity block will trigger on arrow left / right key presses _and_ when buttons change. It is OK for it to
      * trigger on both.
      */
      if (!buttons.find(button => button.id === currentButtonId)) {
        $$invalidate(3, currentButtonId = void 0);
      }
    }

    if ($$self.$$.dirty &
    /*content, data*/
    260) {
      if (content !== data.content) {
        $$invalidate(2, content = data.content); // Only update the content if it has changed.

        try {
          if (isSvelteComponent(content)) {
            $$invalidate(4, dialogComponent = content);
            $$invalidate(5, dialogProps = {});
          } else if (typeof content === 'object') {
            var _svelteConfig$props, _svelteConfig$context, _svelteConfig$context2;

            const svelteConfig = parseSvelteConfig(content, application);
            $$invalidate(4, dialogComponent = svelteConfig.class);
            $$invalidate(5, dialogProps = (_svelteConfig$props = svelteConfig.props) !== null && _svelteConfig$props !== void 0 ? _svelteConfig$props : {}); // Check for any children parsed and added to the external context.

            const children = svelteConfig === null || svelteConfig === void 0 ? void 0 : (_svelteConfig$context = svelteConfig.context) === null || _svelteConfig$context === void 0 ? void 0 : (_svelteConfig$context2 = _svelteConfig$context.get('external')) === null || _svelteConfig$context2 === void 0 ? void 0 : _svelteConfig$context2.children; // If so add to dialogProps.

            if (Array.isArray(children)) {
              $$invalidate(5, dialogProps.children = children, dialogProps);
            }
          } else {
            $$invalidate(4, dialogComponent = void 0);
            $$invalidate(5, dialogProps = {});
          }
        } catch (err) {
          $$invalidate(4, dialogComponent = void 0);
          $$invalidate(5, dialogProps = {});
          $$invalidate(2, content = err.message);
          console.error(err);
        }
      }
    }
  };

  return [dialogInstance, buttons, content, currentButtonId, dialogComponent, dialogProps, onClick, onKeydown, data, autoClose, preventDefault, stopPropagation, switch_instance_binding, click_handler];
}

class DialogContent extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$1$1, create_fragment$1$1, safe_not_equal, {
      data: 8,
      autoClose: 9,
      preventDefault: 10,
      stopPropagation: 11,
      dialogInstance: 0
    }, add_css);
  }

}
/* src\component\core\dialog\DialogShell.svelte generated by Svelte v3.48.0 */


function create_else_block(ctx) {
  let applicationshell;
  let updating_elementRoot;
  let updating_elementContent;
  let current;
  const applicationshell_spread_levels = [
  /*appProps*/
  ctx[6], {
    appOffsetHeight: true
  }];

  function applicationshell_elementRoot_binding_1(value) {
    /*applicationshell_elementRoot_binding_1*/
    ctx[16](value);
  }

  function applicationshell_elementContent_binding_1(value) {
    /*applicationshell_elementContent_binding_1*/
    ctx[17](value);
  }

  let applicationshell_props = {
    $$slots: {
      default: [create_default_slot_2]
    },
    $$scope: {
      ctx
    }
  };

  for (let i = 0; i < applicationshell_spread_levels.length; i += 1) {
    applicationshell_props = assign(applicationshell_props, applicationshell_spread_levels[i]);
  }

  if (
  /*elementRoot*/
  ctx[1] !== void 0) {
    applicationshell_props.elementRoot =
    /*elementRoot*/
    ctx[1];
  }

  if (
  /*elementContent*/
  ctx[0] !== void 0) {
    applicationshell_props.elementContent =
    /*elementContent*/
    ctx[0];
  }

  applicationshell = new ApplicationShell({
    props: applicationshell_props
  });
  binding_callbacks.push(() => bind(applicationshell, 'elementRoot', applicationshell_elementRoot_binding_1));
  binding_callbacks.push(() => bind(applicationshell, 'elementContent', applicationshell_elementContent_binding_1));
  return {
    c() {
      create_component(applicationshell.$$.fragment);
    },

    m(target, anchor) {
      mount_component(applicationshell, target, anchor);
      current = true;
    },

    p(ctx, dirty) {
      const applicationshell_changes = dirty &
      /*appProps*/
      64 ? get_spread_update(applicationshell_spread_levels, [get_spread_object(
      /*appProps*/
      ctx[6]), applicationshell_spread_levels[1]]) : {};

      if (dirty &
      /*$$scope, data, autoClose, dialogComponent*/
      1049100) {
        applicationshell_changes.$$scope = {
          dirty,
          ctx
        };
      }

      if (!updating_elementRoot && dirty &
      /*elementRoot*/
      2) {
        updating_elementRoot = true;
        applicationshell_changes.elementRoot =
        /*elementRoot*/
        ctx[1];
        add_flush_callback(() => updating_elementRoot = false);
      }

      if (!updating_elementContent && dirty &
      /*elementContent*/
      1) {
        updating_elementContent = true;
        applicationshell_changes.elementContent =
        /*elementContent*/
        ctx[0];
        add_flush_callback(() => updating_elementContent = false);
      }

      applicationshell.$set(applicationshell_changes);
    },

    i(local) {
      if (current) return;
      transition_in(applicationshell.$$.fragment, local);
      current = true;
    },

    o(local) {
      transition_out(applicationshell.$$.fragment, local);
      current = false;
    },

    d(detaching) {
      destroy_component(applicationshell, detaching);
    }

  };
} // (180:0) {#if modal}


function create_if_block$8(ctx) {
  let tjsglasspane;
  let current;
  const tjsglasspane_spread_levels = [{
    id: `${
    /*application*/
    ctx[4].id}-glasspane`
  }, {
    preventDefault: false
  }, {
    stopPropagation: false
  },
  /*modalProps*/
  ctx[7], {
    zIndex:
    /*zIndex*/
    ctx[8]
  }];
  let tjsglasspane_props = {
    $$slots: {
      default: [create_default_slot$5]
    },
    $$scope: {
      ctx
    }
  };

  for (let i = 0; i < tjsglasspane_spread_levels.length; i += 1) {
    tjsglasspane_props = assign(tjsglasspane_props, tjsglasspane_spread_levels[i]);
  }

  tjsglasspane = new TJSGlassPane({
    props: tjsglasspane_props
  });
  return {
    c() {
      create_component(tjsglasspane.$$.fragment);
    },

    m(target, anchor) {
      mount_component(tjsglasspane, target, anchor);
      current = true;
    },

    p(ctx, dirty) {
      const tjsglasspane_changes = dirty &
      /*application, modalProps, zIndex*/
      400 ? get_spread_update(tjsglasspane_spread_levels, [dirty &
      /*application*/
      16 && {
        id: `${
        /*application*/
        ctx[4].id}-glasspane`
      }, tjsglasspane_spread_levels[1], tjsglasspane_spread_levels[2], dirty &
      /*modalProps*/
      128 && get_spread_object(
      /*modalProps*/
      ctx[7]), dirty &
      /*zIndex*/
      256 && {
        zIndex:
        /*zIndex*/
        ctx[8]
      }]) : {};

      if (dirty &
      /*$$scope, appProps, elementRoot, elementContent, data, autoClose, dialogComponent*/
      1049167) {
        tjsglasspane_changes.$$scope = {
          dirty,
          ctx
        };
      }

      tjsglasspane.$set(tjsglasspane_changes);
    },

    i(local) {
      if (current) return;
      transition_in(tjsglasspane.$$.fragment, local);
      current = true;
    },

    o(local) {
      transition_out(tjsglasspane.$$.fragment, local);
      current = false;
    },

    d(detaching) {
      destroy_component(tjsglasspane, detaching);
    }

  };
} // (187:3) <ApplicationShell bind:elementRoot bind:elementContent {...appProps} appOffsetHeight={true}>


function create_default_slot_2(ctx) {
  let dialogcontent;
  let updating_autoClose;
  let updating_dialogInstance;
  let current;

  function dialogcontent_autoClose_binding_1(value) {
    /*dialogcontent_autoClose_binding_1*/
    ctx[14](value);
  }

  function dialogcontent_dialogInstance_binding_1(value) {
    /*dialogcontent_dialogInstance_binding_1*/
    ctx[15](value);
  }

  let dialogcontent_props = {
    data:
    /*data*/
    ctx[3]
  };

  if (
  /*autoClose*/
  ctx[9] !== void 0) {
    dialogcontent_props.autoClose =
    /*autoClose*/
    ctx[9];
  }

  if (
  /*dialogComponent*/
  ctx[2] !== void 0) {
    dialogcontent_props.dialogInstance =
    /*dialogComponent*/
    ctx[2];
  }

  dialogcontent = new DialogContent({
    props: dialogcontent_props
  });
  binding_callbacks.push(() => bind(dialogcontent, 'autoClose', dialogcontent_autoClose_binding_1));
  binding_callbacks.push(() => bind(dialogcontent, 'dialogInstance', dialogcontent_dialogInstance_binding_1));
  return {
    c() {
      create_component(dialogcontent.$$.fragment);
    },

    m(target, anchor) {
      mount_component(dialogcontent, target, anchor);
      current = true;
    },

    p(ctx, dirty) {
      const dialogcontent_changes = {};
      if (dirty &
      /*data*/
      8) dialogcontent_changes.data =
      /*data*/
      ctx[3];

      if (!updating_autoClose && dirty &
      /*autoClose*/
      512) {
        updating_autoClose = true;
        dialogcontent_changes.autoClose =
        /*autoClose*/
        ctx[9];
        add_flush_callback(() => updating_autoClose = false);
      }

      if (!updating_dialogInstance && dirty &
      /*dialogComponent*/
      4) {
        updating_dialogInstance = true;
        dialogcontent_changes.dialogInstance =
        /*dialogComponent*/
        ctx[2];
        add_flush_callback(() => updating_dialogInstance = false);
      }

      dialogcontent.$set(dialogcontent_changes);
    },

    i(local) {
      if (current) return;
      transition_in(dialogcontent.$$.fragment, local);
      current = true;
    },

    o(local) {
      transition_out(dialogcontent.$$.fragment, local);
      current = false;
    },

    d(detaching) {
      destroy_component(dialogcontent, detaching);
    }

  };
} // (182:6) <ApplicationShell bind:elementRoot bind:elementContent {...appProps} appOffsetHeight={true}>


function create_default_slot_1(ctx) {
  let dialogcontent;
  let updating_autoClose;
  let updating_dialogInstance;
  let current;

  function dialogcontent_autoClose_binding(value) {
    /*dialogcontent_autoClose_binding*/
    ctx[10](value);
  }

  function dialogcontent_dialogInstance_binding(value) {
    /*dialogcontent_dialogInstance_binding*/
    ctx[11](value);
  }

  let dialogcontent_props = {
    stopPropagation: true,
    data:
    /*data*/
    ctx[3]
  };

  if (
  /*autoClose*/
  ctx[9] !== void 0) {
    dialogcontent_props.autoClose =
    /*autoClose*/
    ctx[9];
  }

  if (
  /*dialogComponent*/
  ctx[2] !== void 0) {
    dialogcontent_props.dialogInstance =
    /*dialogComponent*/
    ctx[2];
  }

  dialogcontent = new DialogContent({
    props: dialogcontent_props
  });
  binding_callbacks.push(() => bind(dialogcontent, 'autoClose', dialogcontent_autoClose_binding));
  binding_callbacks.push(() => bind(dialogcontent, 'dialogInstance', dialogcontent_dialogInstance_binding));
  return {
    c() {
      create_component(dialogcontent.$$.fragment);
    },

    m(target, anchor) {
      mount_component(dialogcontent, target, anchor);
      current = true;
    },

    p(ctx, dirty) {
      const dialogcontent_changes = {};
      if (dirty &
      /*data*/
      8) dialogcontent_changes.data =
      /*data*/
      ctx[3];

      if (!updating_autoClose && dirty &
      /*autoClose*/
      512) {
        updating_autoClose = true;
        dialogcontent_changes.autoClose =
        /*autoClose*/
        ctx[9];
        add_flush_callback(() => updating_autoClose = false);
      }

      if (!updating_dialogInstance && dirty &
      /*dialogComponent*/
      4) {
        updating_dialogInstance = true;
        dialogcontent_changes.dialogInstance =
        /*dialogComponent*/
        ctx[2];
        add_flush_callback(() => updating_dialogInstance = false);
      }

      dialogcontent.$set(dialogcontent_changes);
    },

    i(local) {
      if (current) return;
      transition_in(dialogcontent.$$.fragment, local);
      current = true;
    },

    o(local) {
      transition_out(dialogcontent.$$.fragment, local);
      current = false;
    },

    d(detaching) {
      destroy_component(dialogcontent, detaching);
    }

  };
} // (181:3) <TJSGlassPane id={`${application.id}-glasspane`} preventDefault={false} stopPropagation={false} {...modalProps} {zIndex}>


function create_default_slot$5(ctx) {
  let applicationshell;
  let updating_elementRoot;
  let updating_elementContent;
  let current;
  const applicationshell_spread_levels = [
  /*appProps*/
  ctx[6], {
    appOffsetHeight: true
  }];

  function applicationshell_elementRoot_binding(value) {
    /*applicationshell_elementRoot_binding*/
    ctx[12](value);
  }

  function applicationshell_elementContent_binding(value) {
    /*applicationshell_elementContent_binding*/
    ctx[13](value);
  }

  let applicationshell_props = {
    $$slots: {
      default: [create_default_slot_1]
    },
    $$scope: {
      ctx
    }
  };

  for (let i = 0; i < applicationshell_spread_levels.length; i += 1) {
    applicationshell_props = assign(applicationshell_props, applicationshell_spread_levels[i]);
  }

  if (
  /*elementRoot*/
  ctx[1] !== void 0) {
    applicationshell_props.elementRoot =
    /*elementRoot*/
    ctx[1];
  }

  if (
  /*elementContent*/
  ctx[0] !== void 0) {
    applicationshell_props.elementContent =
    /*elementContent*/
    ctx[0];
  }

  applicationshell = new ApplicationShell({
    props: applicationshell_props
  });
  binding_callbacks.push(() => bind(applicationshell, 'elementRoot', applicationshell_elementRoot_binding));
  binding_callbacks.push(() => bind(applicationshell, 'elementContent', applicationshell_elementContent_binding));
  return {
    c() {
      create_component(applicationshell.$$.fragment);
    },

    m(target, anchor) {
      mount_component(applicationshell, target, anchor);
      current = true;
    },

    p(ctx, dirty) {
      const applicationshell_changes = dirty &
      /*appProps*/
      64 ? get_spread_update(applicationshell_spread_levels, [get_spread_object(
      /*appProps*/
      ctx[6]), applicationshell_spread_levels[1]]) : {};

      if (dirty &
      /*$$scope, data, autoClose, dialogComponent*/
      1049100) {
        applicationshell_changes.$$scope = {
          dirty,
          ctx
        };
      }

      if (!updating_elementRoot && dirty &
      /*elementRoot*/
      2) {
        updating_elementRoot = true;
        applicationshell_changes.elementRoot =
        /*elementRoot*/
        ctx[1];
        add_flush_callback(() => updating_elementRoot = false);
      }

      if (!updating_elementContent && dirty &
      /*elementContent*/
      1) {
        updating_elementContent = true;
        applicationshell_changes.elementContent =
        /*elementContent*/
        ctx[0];
        add_flush_callback(() => updating_elementContent = false);
      }

      applicationshell.$set(applicationshell_changes);
    },

    i(local) {
      if (current) return;
      transition_in(applicationshell.$$.fragment, local);
      current = true;
    },

    o(local) {
      transition_out(applicationshell.$$.fragment, local);
      current = false;
    },

    d(detaching) {
      destroy_component(applicationshell, detaching);
    }

  };
}

function create_fragment$h(ctx) {
  let current_block_type_index;
  let if_block;
  let if_block_anchor;
  let current;
  const if_block_creators = [create_if_block$8, create_else_block];
  const if_blocks = [];

  function select_block_type(ctx, dirty) {
    if (
    /*modal*/
    ctx[5]) return 0;
    return 1;
  }

  current_block_type_index = select_block_type(ctx);
  if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
  return {
    c() {
      if_block.c();
      if_block_anchor = empty();
    },

    m(target, anchor) {
      if_blocks[current_block_type_index].m(target, anchor);
      insert(target, if_block_anchor, anchor);
      current = true;
    },

    p(ctx, [dirty]) {
      let previous_block_index = current_block_type_index;
      current_block_type_index = select_block_type(ctx);

      if (current_block_type_index === previous_block_index) {
        if_blocks[current_block_type_index].p(ctx, dirty);
      } else {
        group_outros();
        transition_out(if_blocks[previous_block_index], 1, 1, () => {
          if_blocks[previous_block_index] = null;
        });
        check_outros();
        if_block = if_blocks[current_block_type_index];

        if (!if_block) {
          if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
          if_block.c();
        } else {
          if_block.p(ctx, dirty);
        }

        transition_in(if_block, 1);
        if_block.m(if_block_anchor.parentNode, if_block_anchor);
      }
    },

    i(local) {
      if (current) return;
      transition_in(if_block);
      current = true;
    },

    o(local) {
      transition_out(if_block);
      current = false;
    },

    d(detaching) {
      if_blocks[current_block_type_index].d(detaching);
      if (detaching) detach(if_block_anchor);
    }

  };
}

const s_MODAL_BACKGROUND = '#50505080';

function instance$g($$self, $$props, $$invalidate) {
  let {
    elementContent
  } = $$props;
  let {
    elementRoot
  } = $$props;
  let {
    data = {}
  } = $$props;
  let {
    dialogComponent = void 0
  } = $$props;
  const application = getContext('external').application;
  const s_MODAL_TRANSITION = fade;
  const s_MODAL_TRANSITION_OPTIONS = {
    duration: 200
  };
  let modal = void 0; // Stores props for the ApplicationShell.

  const appProps = {
    // Stores any transition functions.
    transition: void 0,
    inTransition: void 0,
    outTransition: void 0,
    // Stores properties to set for options for any transitions.
    transitionOptions: void 0,
    inTransitionOptions: void 0,
    outTransitionOptions: void 0,
    // Stores any style overrides for application shell.
    stylesApp: void 0,
    stylesContent: void 0
  };
  const modalProps = {
    // Background CSS style string.
    background: void 0,
    // Stores any transition functions.
    transition: void 0,
    inTransition: void 0,
    outTransition: void 0,
    // Stores properties to set for options for any transitions.
    transitionOptions: void 0,
    inTransitionOptions: void 0,
    outTransitionOptions: void 0
  };
  let zIndex = void 0; // Automatically close the dialog on button click handler completion.

  let autoClose = true; // Only set modal once on mount. You can't change between a modal an non-modal dialog during runtime.

  if (modal === void 0) {
    var _data;

    modal = typeof ((_data = data) === null || _data === void 0 ? void 0 : _data.modal) === 'boolean' ? data.modal : false;
  }

  function dialogcontent_autoClose_binding(value) {
    autoClose = value;
    ((($$invalidate(9, autoClose), $$invalidate(3, data)), $$invalidate(5, modal)), $$invalidate(8, zIndex)), $$invalidate(4, application);
  }

  function dialogcontent_dialogInstance_binding(value) {
    dialogComponent = value;
    $$invalidate(2, dialogComponent);
  }

  function applicationshell_elementRoot_binding(value) {
    elementRoot = value;
    $$invalidate(1, elementRoot);
  }

  function applicationshell_elementContent_binding(value) {
    elementContent = value;
    $$invalidate(0, elementContent);
  }

  function dialogcontent_autoClose_binding_1(value) {
    autoClose = value;
    ((($$invalidate(9, autoClose), $$invalidate(3, data)), $$invalidate(5, modal)), $$invalidate(8, zIndex)), $$invalidate(4, application);
  }

  function dialogcontent_dialogInstance_binding_1(value) {
    dialogComponent = value;
    $$invalidate(2, dialogComponent);
  }

  function applicationshell_elementRoot_binding_1(value) {
    elementRoot = value;
    $$invalidate(1, elementRoot);
  }

  function applicationshell_elementContent_binding_1(value) {
    elementContent = value;
    $$invalidate(0, elementContent);
  }

  $$self.$$set = $$props => {
    if ('elementContent' in $$props) $$invalidate(0, elementContent = $$props.elementContent);
    if ('elementRoot' in $$props) $$invalidate(1, elementRoot = $$props.elementRoot);
    if ('data' in $$props) $$invalidate(3, data = $$props.data);
    if ('dialogComponent' in $$props) $$invalidate(2, dialogComponent = $$props.dialogComponent);
  };

  $$self.$$.update = () => {
    if ($$self.$$.dirty &
    /*data, modal, zIndex, application*/
    312) {
      // Retrieve values from the DialogData object and also potentially set any SvelteApplication accessors.
      // Explicit checks are performed against existing local variables as the only externally reactive variable is `data`.
      // All of the checks below trigger when there are any external changes to the `data` prop.
      // Prevent any unnecessary changing of local & `application` variables unless actual changes occur.
      // Foundry App options --------------------------------------------------------------------------------------------
      if (typeof data === 'object') {
        var _data$draggable, _data$popOut, _data$resizable, _data$title, _application$options4;

        $$invalidate(9, autoClose = typeof data.autoClose === 'boolean' ? data.autoClose : true);
        const newZIndex = Number.isInteger(data.zIndex) || data.zIndex === null ? data.zIndex : modal ? Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER - 1;

        if (zIndex !== newZIndex) {
          $$invalidate(8, zIndex = newZIndex);
        } // Update the main foundry options when data changes. Perform explicit checks against existing data in `application`.


        const newDraggable = (_data$draggable = data.draggable) !== null && _data$draggable !== void 0 ? _data$draggable : true;

        if (application.reactive.draggable !== newDraggable) {
          $$invalidate(4, application.reactive.draggable = newDraggable, application);
        }

        const newPopOut = (_data$popOut = data.popOut) !== null && _data$popOut !== void 0 ? _data$popOut : true;

        if (application.reactive.popOut !== newPopOut) {
          $$invalidate(4, application.reactive.popOut = newPopOut, application);
        }

        const newResizable = (_data$resizable = data.resizable) !== null && _data$resizable !== void 0 ? _data$resizable : false;

        if (application.reactive.resizable !== newResizable) {
          $$invalidate(4, application.reactive.resizable = newResizable, application);
        } // Note application.title from Application localizes `options.title`, so compare with `application.options.title`.


        const newTitle = (_data$title = data.title) !== null && _data$title !== void 0 ? _data$title : 'Dialog';

        if (newTitle !== (application === null || application === void 0 ? void 0 : (_application$options4 = application.options) === null || _application$options4 === void 0 ? void 0 : _application$options4.title)) {
          $$invalidate(4, application.reactive.title = newTitle, application);
        }

        if (application.position.zIndex !== zIndex) {
          $$invalidate(4, application.position.zIndex = zIndex, application);
        }
      }
    }

    if ($$self.$$.dirty &
    /*data, appProps*/
    72) {
      var _data2;

      // ApplicationShell transition options ----------------------------------------------------------------------------
      if (typeof ((_data2 = data) === null || _data2 === void 0 ? void 0 : _data2.transition) === 'object') {
        // Store data.transitions to shorten statements below.
        const d = data.transition;

        if ((d === null || d === void 0 ? void 0 : d.transition) !== appProps.transition) {
          $$invalidate(6, appProps.transition = d.transition, appProps);
        }

        if ((d === null || d === void 0 ? void 0 : d.inTransition) !== appProps.inTransition) {
          $$invalidate(6, appProps.inTransition = d.inTransition, appProps);
        }

        if ((d === null || d === void 0 ? void 0 : d.outTransition) !== appProps.outTransition) {
          $$invalidate(6, appProps.outTransition = d.outTransition, appProps);
        }

        if ((d === null || d === void 0 ? void 0 : d.transitionOptions) !== appProps.transitionOptions) {
          $$invalidate(6, appProps.transitionOptions = d.transitionOptions, appProps);
        }

        if ((d === null || d === void 0 ? void 0 : d.inTransitionOptions) !== appProps.inTransitionOptions) {
          $$invalidate(6, appProps.inTransitionOptions = d.inTransitionOptions, appProps);
        }

        if ((d === null || d === void 0 ? void 0 : d.outTransitionOptions) !== appProps.outTransitionOptions) {
          $$invalidate(6, appProps.outTransitionOptions = d.outTransitionOptions, appProps);
        }
      }
    }

    if ($$self.$$.dirty &
    /*data, modalProps*/
    136) {
      // Modal options --------------------------------------------------------------------------------------------------
      {
        var _data3, _data3$modalOptions;

        const newModalBackground = typeof ((_data3 = data) === null || _data3 === void 0 ? void 0 : (_data3$modalOptions = _data3.modalOptions) === null || _data3$modalOptions === void 0 ? void 0 : _data3$modalOptions.background) === 'string' ? data.modalOptions.background : s_MODAL_BACKGROUND;

        if (newModalBackground !== modalProps.background) {
          $$invalidate(7, modalProps.background = newModalBackground, modalProps);
        }
      }
    }

    if ($$self.$$.dirty &
    /*data, modalProps*/
    136) {
      var _data4, _data4$modalOptions;

      if (typeof ((_data4 = data) === null || _data4 === void 0 ? void 0 : (_data4$modalOptions = _data4.modalOptions) === null || _data4$modalOptions === void 0 ? void 0 : _data4$modalOptions.transition) === 'object') {
        // Store data.transitions to shorten statements below.
        const d = data.modalOptions.transition;

        if ((d === null || d === void 0 ? void 0 : d.transition) !== modalProps.transition) {
          $$invalidate(7, modalProps.transition = typeof (d === null || d === void 0 ? void 0 : d.transition) === 'function' ? d.transition : s_MODAL_TRANSITION, modalProps);
        }

        if ((d === null || d === void 0 ? void 0 : d.inTransition) !== modalProps.inTransition) {
          $$invalidate(7, modalProps.inTransition = d.inTransition, modalProps);
        }

        if ((d === null || d === void 0 ? void 0 : d.outTransition) !== modalProps.outTransition) {
          $$invalidate(7, modalProps.outTransition = d.outTransition, modalProps);
        } // Provide default transition options if not defined.


        if ((d === null || d === void 0 ? void 0 : d.transitionOptions) !== modalProps.transitionOptions) {
          $$invalidate(7, modalProps.transitionOptions = typeof (d === null || d === void 0 ? void 0 : d.transitionOptions) === 'object' ? d.transitionOptions : s_MODAL_TRANSITION_OPTIONS, modalProps);
        }

        if ((d === null || d === void 0 ? void 0 : d.inTransitionOptions) !== modalProps.inTransitionOptions) {
          $$invalidate(7, modalProps.inTransitionOptions = d.inTransitionOptions, modalProps);
        }

        if ((d === null || d === void 0 ? void 0 : d.outTransitionOptions) !== modalProps.outTransitionOptions) {
          $$invalidate(7, modalProps.outTransitionOptions = d.outTransitionOptions, modalProps);
        }
      } else // Provide a fallback / default glass pane transition when `data.modalOptions.transition` is not defined.
        {
          var _data5, _data5$modalOptions, _data5$modalOptions$t, _data6, _data6$modalOptions;

          const newModalTransition = typeof ((_data5 = data) === null || _data5 === void 0 ? void 0 : (_data5$modalOptions = _data5.modalOptions) === null || _data5$modalOptions === void 0 ? void 0 : (_data5$modalOptions$t = _data5$modalOptions.transition) === null || _data5$modalOptions$t === void 0 ? void 0 : _data5$modalOptions$t.transition) === 'function' ? data.modalOptions.transition.transition : s_MODAL_TRANSITION;

          if (newModalTransition !== modalProps.transition) {
            $$invalidate(7, modalProps.transition = newModalTransition, modalProps);
          }

          const newModalTransitionOptions = typeof ((_data6 = data) === null || _data6 === void 0 ? void 0 : (_data6$modalOptions = _data6.modalOptions) === null || _data6$modalOptions === void 0 ? void 0 : _data6$modalOptions.transitionOptions) === 'object' ? data.modalOptions.transitionOptions : s_MODAL_TRANSITION_OPTIONS;

          if (newModalTransitionOptions !== modalProps.transitionOptions) {
            $$invalidate(7, modalProps.transitionOptions = newModalTransitionOptions, modalProps);
          }
        }
    }
  };

  return [elementContent, elementRoot, dialogComponent, data, application, modal, appProps, modalProps, zIndex, autoClose, dialogcontent_autoClose_binding, dialogcontent_dialogInstance_binding, applicationshell_elementRoot_binding, applicationshell_elementContent_binding, dialogcontent_autoClose_binding_1, dialogcontent_dialogInstance_binding_1, applicationshell_elementRoot_binding_1, applicationshell_elementContent_binding_1];
}

class DialogShell extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$g, create_fragment$h, safe_not_equal, {
      elementContent: 0,
      elementRoot: 1,
      data: 3,
      dialogComponent: 2
    });
  }

  get elementContent() {
    return this.$$.ctx[0];
  }

  set elementContent(elementContent) {
    this.$$set({
      elementContent
    });
    flush();
  }

  get elementRoot() {
    return this.$$.ctx[1];
  }

  set elementRoot(elementRoot) {
    this.$$set({
      elementRoot
    });
    flush();
  }

  get data() {
    return this.$$.ctx[3];
  }

  set data(data) {
    this.$$set({
      data
    });
    flush();
  }

  get dialogComponent() {
    return this.$$.ctx[2];
  }

  set dialogComponent(dialogComponent) {
    this.$$set({
      dialogComponent
    });
    flush();
  }

}

var _application = /*#__PURE__*/new WeakMap();

class DialogData {
  /**
   * @type {SvelteApplication}
   */

  /**
   * @param {SvelteApplication} application - The host Foundry application.
   */
  constructor(application) {
    _classPrivateFieldInitSpec(this, _application, {
      writable: true,
      value: void 0
    });

    _classPrivateFieldSet(this, _application, application);
  }
  /**
   * Provides a way to safely get this dialogs data given an accessor string which describes the
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


  get(accessor, defaultValue) {
    return safeAccess(this, accessor, defaultValue);
  }
  /**
   * @param {object} data - Merge provided data object into Dialog data.
   */


  merge(data) {
    deepMerge(this, data);

    const component = _classPrivateFieldGet(this, _application).svelte.component(0);

    if (component !== null && component !== void 0 && component.data) {
      component.data = this;
    }
  }
  /**
   * Provides a way to safely set this dialogs data given an accessor string which describes the
   * entries to walk. To access deeper entries into the object format the accessor string with `.` between entries
   * to walk.
   *
   * Automatically the dialog data will be updated in the associated DialogShell Svelte component.
   *
   * // TODO DOCUMENT the accessor in more detail.
   *
   * @param {string}   accessor - The path / key to set. You can set multiple levels.
   *
   * @param {*}        value - Value to set.
   *
   * @returns {boolean} True if successful.
   */


  set(accessor, value) {
    const success = safeSet(this, accessor, value); // If `this.options` modified then update the app options store.

    if (success) {
      const component = _classPrivateFieldGet(this, _application).svelte.component(0);

      if (component !== null && component !== void 0 && component.data) {
        component.data = this;
      }
    }

    return success;
  }

}

/**
 * Provides a Foundry API compatible dialog alternative implemented w/ Svelte. There are several features including
 * a glasspane / modal option with various styling and transition capabilities.
 *
 * TODO: document all dialog data parameters; keep track of newly added like button -> styles, title; modal,
 * draggable, transition options, modal transitions
 */

var _data = /*#__PURE__*/new WeakMap();

class TJSDialog extends SvelteApplication {
  /**
   * @type {DialogData}
   */

  /**
   * @param {object}   data - Dialog data.
   *
   * @param {object}   [options] - SvelteApplication options.
   */
  constructor(data, options = {}) {
    super(options);

    _classPrivateFieldInitSpec(this, _data, {
      writable: true,
      value: void 0
    });

    _classPrivateFieldSet(this, _data, new DialogData(this));

    this.data = data;
    /**
     * @member {object} dialogComponent - A getter to SvelteData to retrieve any mounted Svelte component as the
     *                                    dialog content.
     *
     * @memberof GetSvelteData#
     * @readonly
     */

    Object.defineProperty(this.svelte, 'dialogComponent', {
      get: () => {
        var _this$svelte, _this$svelte$applicat;

        return (_this$svelte = this.svelte) === null || _this$svelte === void 0 ? void 0 : (_this$svelte$applicat = _this$svelte.applicationShell) === null || _this$svelte$applicat === void 0 ? void 0 : _this$svelte$applicat.dialogComponent;
      }
    });
  }
  /**
   * Default options
   *
   * @returns {object} Default options
   */


  static get defaultOptions() {
    return deepMerge(super.defaultOptions, {
      classes: ['dialog'],
      width: 400,
      height: 'auto',
      jQuery: true,
      svelte: {
        class: DialogShell,
        intro: true,
        target: document.body,
        props: function () {
          return {
            data: _classPrivateFieldGet(this, _data)
          };
        } // this context is the SvelteApplication when invoked.

      }
    });
  }
  /**
   * Returns the dialog data.
   *
   * @returns {DialogData} Dialog data.
   */


  get data() {
    return _classPrivateFieldGet(this, _data);
  }
  /**
   * Sets the dialog data; this is reactive.
   *
   * @param {object}   data - Dialog data.
   */


  set data(data) {
    const descriptors = Object.getOwnPropertyDescriptors(_classPrivateFieldGet(this, _data)); // Remove old data for all configurable descriptors.

    for (const descriptor in descriptors) {
      if (descriptors[descriptor].configurable) {
        delete _classPrivateFieldGet(this, _data)[descriptor];
      }
    } // Merge new data and perform a reactive update.


    _classPrivateFieldGet(this, _data).merge(data);
  }
  /**
   * Implemented only for backwards compatibility w/ default Foundry {@link Dialog} API.
   *
   * @param {JQuery}   html - JQuery element for content area.
   */


  activateListeners(html) {
    super.activateListeners(html);

    if (this.data.render instanceof Function) {
      const actualHTML = typeof this.options.template === 'string' ? html : this.options.jQuery ? $(this.elementContent) : this.elementContent;
      this.data.render(this.options.jQuery ? actualHTML : actualHTML[0]);
    }
  }
  /**
   * Close the dialog and un-register references to it within UI mappings.
   * This function returns a Promise which resolves once the window closing animation concludes.
   *
   * @param {object}   [options] - Optional parameters.
   *
   * @param {boolean}  [options.force] - Force close regardless of render state.
   *
   * @returns {Promise<void>} A Promise which resolves once the application is closed.
   */


  async close(options) {
    /**
     * Implemented only for backwards compatibility w/ default Foundry {@link Dialog} API.
     */
    if (this.data.close instanceof Function) {
      this.data.close(this.options.jQuery ? this.element : this.element[0]);
    }

    return super.close(options);
  } // ---------------------------------------------------------------------------------------------------------------

  /**
   * A helper factory method to create simple confirmation dialog windows which consist of simple yes/no prompts.
   * If you require more flexibility, a custom Dialog instance is preferred.
   *
   * @param {TJSConfirmConfig} config - Confirm dialog options.
   *
   * @returns {Promise<*>} A promise which resolves once the user makes a choice or closes the window.
   *
   * @example
   * let d = TJSDialog.confirm({
   *  title: "A Yes or No Question",
   *  content: "<p>Choose wisely.</p>",
   *  yes: () => console.log("You chose ... wisely"),
   *  no: () => console.log("You chose ... poorly"),
   *  defaultYes: false
   * });
   */


  static async confirm({
    title,
    content,
    yes,
    no,
    render,
    defaultYes = true,
    rejectClose = false,
    options = {},
    buttons = {},
    draggable = true,
    modal = false,
    modalOptions = {},
    popOut = true,
    resizable = false,
    transition = {},
    zIndex
  } = {}) {
    // Allow overwriting of default icon and labels.
    const mergedButtons = deepMerge({
      yes: {
        icon: '<i class="fas fa-check"></i>',
        label: game.i18n.localize('Yes')
      },
      no: {
        icon: '<i class="fas fa-times"></i>',
        label: game.i18n.localize('No')
      }
    }, buttons);
    return new Promise((resolve, reject) => {
      const dialog = new this({
        title,
        content,
        render,
        draggable,
        modal,
        modalOptions,
        popOut,
        resizable,
        transition,
        zIndex,
        buttons: deepMerge(mergedButtons, {
          yes: {
            callback: html => {
              const result = yes ? yes(html) : true;
              resolve(result);
            }
          },
          no: {
            callback: html => {
              const result = no ? no(html) : false;
              resolve(result);
            }
          }
        }),
        default: defaultYes ? "yes" : "no",
        close: () => {
          if (rejectClose) {
            reject('The confirmation Dialog was closed without a choice being made.');
          } else {
            resolve(null);
          }
        }
      }, options);
      dialog.render(true);
    });
  }
  /**
   * A helper factory method to display a basic "prompt" style Dialog with a single button
   *
   * @param {TJSPromptConfig} config - Prompt dialog options.
   *
   * @returns {Promise<*>} The returned value from the provided callback function, if any
   */


  static async prompt({
    title,
    content,
    label,
    callback,
    render,
    rejectClose = false,
    options = {},
    draggable = true,
    icon = '<i class="fas fa-check"></i>',
    modal = false,
    modalOptions = {},
    popOut = true,
    resizable = false,
    transition = {},
    zIndex
  } = {}) {
    return new Promise((resolve, reject) => {
      const dialog = new this({
        title,
        content,
        render,
        draggable,
        modal,
        modalOptions,
        popOut,
        resizable,
        transition,
        zIndex,
        buttons: {
          ok: {
            icon,
            label,
            callback: html => {
              const result = callback ? callback(html) : null;
              resolve(result);
            }
          }
        },
        default: 'ok',
        close: () => {
          if (rejectClose) {
            reject(new Error('The Dialog prompt was closed without being accepted.'));
          } else {
            resolve(null);
          }
        }
      }, options);
      dialog.render(true);
    });
  }

}
/**
 * @typedef TJSConfirmConfig - Configuration options for the confirm dialog.
 *
 * @property {string}   title - The confirmation window title
 *
 * @property {string}   content - The confirmation message
 *
 * @property {Function} [yes] - Callback function upon yes
 *
 * @property {Function} [no] - Callback function upon no
 *
 * @property {Function} [render] - A function to call when the dialog is rendered
 *
 * @property {boolean}  [defaultYes=true] - Make "yes" the default choice?
 *
 * @property {boolean}  [rejectClose=false] - Reject the Promise if the Dialog is closed without making a choice.
 *
 * @property {object}   [options={}] - Additional rendering options passed to the Dialog
 *
 * @property {object}   [buttons={}] - Provides a button override that is merged with default buttons.
 *
 * @property {boolean}  [draggable=true] - The dialog is draggable when true.
 *
 * @property {boolean}  [modal=false] - When true a modal dialog is displayed.
 *
 * @property {object}   [modalOptions] - Additional options for modal dialog display.
 *
 * @property {boolean}  [popOut=true] - When true the dialog is a pop out Application.
 *
 * @property {boolean}  [resizable=false] - When true the dialog is resizable.
 *
 * @property {object}   [transition] - Transition options for the dialog.
 *
 * @property {number|null} [zIndex] - A specific z-index for the dialog.
 */

/**
 * @typedef TJSPromptConfig - Configuration options for the confirm dialog.
 *
 * @property {string}   title - The confirmation window title
 *
 * @property {string}   content - The confirmation message
 *
 * @property {string}   [label] - The confirmation button text.
 *
 * @property {Function} [callback] - A callback function to fire when the button is clicked.
 *
 * @property {Function} [render] - A function to call when the dialog is rendered.
 *
 * @property {boolean}  [rejectClose=false] - Reject the Promise if the Dialog is closed without making a choice.
 *
 * @property {object}   [options={}] - Additional application options passed to the TJSDialog.
 *
 * @property {boolean}  [draggable=true] - The dialog is draggable when true.
 *
 * @property {string}   [icon="<i class="fas fa-check"></i>"] - Set another icon besides `fa-check` for button.
 *
 * @property {boolean}  [modal=false] - When true a modal dialog is displayed.
 *
 * @property {object}   [modalOptions] - Additional options for modal dialog display.
 *
 * @property {boolean}  [popOut=true] - When true the dialog is a pop out Application.
 *
 * @property {boolean}  [resizable=false] - When true the dialog is resizable.
 *
 * @property {object}   [transition] - Transition options for the dialog.
 *
 * @property {number|null} [zIndex] - A specific z-index for the dialog.
 */

class CharacterAdvancement extends TJSDialog {
  constructor(document) {
    super({
      title: "Character advancement",
      id: "cha-adv",
      modal: true,
      draggable: false,
      content: {
        class: Cha_adv_shell,
        props: {
          document
        }
      }
    }, {
      width: 800,
      height: 600
    });
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

    const actorData = this.actor; // Add the actor's data to context.data for easier access, as well as flags.
    //@ts-expect-error

    context.data = actorData.system; //@ts-expect-error

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
    // Handle attribute scores.
    for (let [k, v] of Object.entries(context.data.attributes)) {
      var _game$i18n$localize;

      //@ts-expect-error
      v.label = (_game$i18n$localize = game.i18n.localize(CONFIG.ARd20.Attributes[k])) !== null && _game$i18n$localize !== void 0 ? _game$i18n$localize : k;
    }
    /*for (let [k, v] of Object.entries(context.data.skills)) {
      //@ts-expect-error
      v.name = game.i18n.localize(CONFIG.ARd20.Skills, k)) ?? k;
      v.rank_name = game.i18n.localize(CONFIG.ARd20.Rank, v.rank)) ?? v.rank;
    }*/

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

    html.find(".attribute-name").click(this._onRollAttributeTest.bind(this));
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


  async _OnAdvanceMenu(event) {
    var _button$dataset, _app;

    event.preventDefault();
    const button = event.currentTarget;
    let app;
    console.log(this.object);
    const actor = this.object; //@ts-ignore

    switch ((_button$dataset = button.dataset) === null || _button$dataset === void 0 ? void 0 : _button$dataset.action) {
      case "adv":
        async function createAditionalData() {
          //functions to get lists of available features and lists
          async function getPacks() {
            let pack_list = []; // array of feats from Compendium

            let pack_name = [];

            for (const val of game.settings.get("ard20", "feat").packs) {
              if (game.packs.filter(pack => pack.metadata.label === val.name).length !== 0) {
                let feat_list = [];
                feat_list.push(Array.from(game.packs.filter(pack => pack.metadata.label === val.name && pack.documentName === "Item")[0].index));
                feat_list = feat_list.flat();

                for (const feat of feat_list) {
                  const new_key = game.packs.filter(pack => pack.metadata.label === val.name)[0].metadata.package + "." + val.name;
                  const doc = await game.packs.get(new_key).getDocument(feat.id);
                  const item = doc.toObject();
                  item.data = foundry.utils.deepClone(doc.system);
                  pack_list.push(item);
                  pack_name.push(item.name);
                }

                pack_list = pack_list.flat();
              }
            }

            return {
              pack_list,
              pack_name
            };
          }

          function getFolders() {
            let folder_list = []; // array of feats from game folders

            let folder_name = [];

            for (let val of game.settings.get("ard20", "feat").folders) {
              if (game.folders.filter(folder => folder.data.name === val.name).length !== 0) {
                let feat_list = [];
                feat_list.push(game.folders.filter(folder => folder.data.name === val.name && folder.data.type === "Item")[0].contents);
                feat_list = feat_list.flat();

                for (let feat of feat_list) {
                  console.log("item added from folder ", feat);
                  const item = feat.toObject();
                  item.data = foundry.utils.deepClone(feat.system);
                  folder_list.push(item);
                  folder_name.push(item.name);
                }

                folder_list = folder_list.flat();
              }
            }

            return {
              folder_list,
              folder_name
            };
          }

          let raceList = await getRacesList();
          let featList = await getFeaturesList();
          let name_array = [];

          async function getRacesList() {
            const pack = await getPacks();
            const folder = getFolders();
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

          async function getFeaturesList() {
            const pack = await getPacks();
            const pack_list = pack.pack_list;
            const pack_name = pack.pack_name;
            const folder = getFolders();
            const folder_list = folder.folder_list;
            let feat_pack_list = [];
            pack_list.forEach(item => {
              if (item.type === "feature") {
                let FeatureItem = _objectSpread2({}, item);

                feat_pack_list.push(FeatureItem);
              }
            });
            let feat_folder_list = [];
            folder_list.forEach(item => {
              if (item.type === "feature") {
                let FeatureItem = _objectSpread2({}, item);

                feat_folder_list.push(FeatureItem);
              }
            });
            let temp_feat_list = feat_pack_list.concat(feat_folder_list.filter(item => !pack_name.includes(item.name)));
            let learnedFeatures = [];
            actor.itemTypes.feature.forEach(item => {
              if (item.data.type === "feature") {
                let FeatureItem = _objectSpread2({}, item.data);

                learnedFeatures.push(FeatureItem);
              }
            });
            return {
              temp_feat_list,
              learnedFeatures
            };
          }

          for (let i of featList.learnedFeatures) {
            name_array.push(i.name);
          }

          console.log(featList.temp_feat_list, "featList.temp_feat_list");
          featList.temp_feat_list.forEach((v, k) => {
            console.log(k, v);

            if (name_array.includes(v.name)) {
              console.log("this item is already learned", featList.temp_feat_list[k]);
              featList.temp_feat_list[k] = foundry.utils.deepClone(featList.learnedFeatures.filter(item => item.name === v.name)[0]);
            }
          });
          featList.temp_feat_list = featList.temp_feat_list.filter(item => {
            if (item.type === "feature") return !name_array.includes(item.name) || item.data.level.current !== item.data.level.max;
          });
          const obj = {
            races: {
              list: raceList,
              chosen: ""
            },
            count: {
              //TODO: rework this for future where you can have more/less ranks
              skills: {
                0: 0,
                1: 0,
                2: 0,
                3: 0,
                4: 0
              },
              feats: {
                mar: 0,
                mag: 0,
                div: 0,
                pri: 0,
                psy: 0
              }
            },
            feats: {
              learned: featList.learnedFeatures,
              awail: featList.temp_feat_list
            },
            allow: {
              attribute: duplicate(actor.system.isReady),
              race: duplicate(actor.system.isReady),
              final: duplicate(actor.system.isReady)
            }
          };
          return obj;
        }

        const document = {
          actor: this.actor,
          aditionalData: await createAditionalData()
        };
        app = new CharacterAdvancement(document);
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

  _onRollAttributeTest(event) {
    event.preventDefault(); //@ts-ignore

    let attribute = event.currentTarget.parentElement.dataset.attribute;
    return this.actor.rollAttributeTest(attribute, {
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
    const hasAttack = item.system.hasAttack;
    const hasDamage = item.system.hasDamage; //@ts-expect-error

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
        name: (_game$i18n$localize = game.i18n.localize(CONFIG.ARd20.Attributes[k])) !== null && _game$i18n$localize !== void 0 ? _game$i18n$localize : k,
        value: k,
        type: "attribute"
      });
    }

    for (let [k, v] of Object.entries(CONFIG.ARd20.Skills)) {
      var _game$i18n$localize2;

      data.push({
        name: (_game$i18n$localize2 = game.i18n.localize(CONFIG.ARd20.Skills[k])) !== null && _game$i18n$localize2 !== void 0 ? _game$i18n$localize2 : k,
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
    templateData.formApp;
    templateData.req;
    templateData.type_list;
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

    for (let [k, i] of Object.entries(CONFIG.ARd20.Attributes)) {
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

    const itemData = context.item; //@ts-expect-error

    context.config = CONFIG.ARd20; // Retrieve the roll data for TinyMCE editors.
    //@ts-expect-error

    context.rollData = {};
    let actor = (_this$object$parent = (_this$object = this.object) === null || _this$object === void 0 ? void 0 : _this$object.parent) !== null && _this$object$parent !== void 0 ? _this$object$parent : null;

    if (actor) {
      //@ts-expect-error
      context.rollData = actor.getRollData();
    } // Add the actor's data to context.data for easier access, as well as flags.
    //@ts-expect-error


    context.data = itemData.system; //@ts-expect-error

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
        for (let [key, type] of Object.entries(damage)) {
          for (let [k, prof] of Object.entries(type)) {
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
      let path = a.dataset.type ? "system.damage" + a.dataset.type : "system.damage";
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
      let path = a.dataset.type ? "system.damage" + a.dataset.type : "system.damage";
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

/* built\sheets\svelte\EmptySheet.svelte generated by Svelte v3.48.0 */

function create_fragment$g(ctx) {
	let t;

	return {
		c() {
			t = text("Something goes wrong and you get empty sheet. Sorry for that.");
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		p: noop,
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

class EmptySheet extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, null, create_fragment$g, safe_not_equal, {});
	}
}

/* built\sheets\svelte\general components\InputForDocumentSheet.svelte generated by Svelte v3.48.0 */

function create_if_block$7(ctx) {
	let span;
	let t;

	return {
		c() {
			span = element("span");
			t = text(/*label*/ ctx[1]);
			attr(span, "class", "svelte-jvtels");
		},
		m(target, anchor) {
			insert(target, span, anchor);
			append(span, t);
			/*span_binding*/ ctx[10](span);
		},
		p(ctx, dirty) {
			if (dirty & /*label*/ 2) set_data(t, /*label*/ ctx[1]);
		},
		d(detaching) {
			if (detaching) detach(span);
			/*span_binding*/ ctx[10](null);
		}
	};
}

function create_fragment$f(ctx) {
	let t0;
	let input_1;
	let t1;
	let i;
	let mounted;
	let dispose;
	let if_block = /*label*/ ctx[1] && create_if_block$7(ctx);

	return {
		c() {
			if (if_block) if_block.c();
			t0 = space();
			input_1 = element("input");
			t1 = space();
			i = element("i");
			attr(input_1, "class", "svelte-jvtels");
			attr(i, "class", "fa-solid fa-feather-pointed");
		},
		m(target, anchor) {
			if (if_block) if_block.m(target, anchor);
			insert(target, t0, anchor);
			insert(target, input_1, anchor);
			/*input_1_binding*/ ctx[11](input_1);
			set_input_value(input_1, /*value*/ ctx[0]);
			insert(target, t1, anchor);
			insert(target, i, anchor);
			/*i_binding*/ ctx[15](i);

			if (!mounted) {
				dispose = [
					listen(input_1, "input", /*input_1_input_handler*/ ctx[12]),
					listen(input_1, "keypress", /*keypress_handler*/ ctx[13]),
					listen(input_1, "change", /*change_handler*/ ctx[14])
				];

				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if (/*label*/ ctx[1]) {
				if (if_block) {
					if_block.p(ctx, dirty);
				} else {
					if_block = create_if_block$7(ctx);
					if_block.c();
					if_block.m(t0.parentNode, t0);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}

			if (dirty & /*value*/ 1 && input_1.value !== /*value*/ ctx[0]) {
				set_input_value(input_1, /*value*/ ctx[0]);
			}
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (if_block) if_block.d(detaching);
			if (detaching) detach(t0);
			if (detaching) detach(input_1);
			/*input_1_binding*/ ctx[11](null);
			if (detaching) detach(t1);
			if (detaching) detach(i);
			/*i_binding*/ ctx[15](null);
			mounted = false;
			run_all(dispose);
		}
	};
}

function instance$f($$self, $$props, $$invalidate) {
	let $document;
	let { value } = $$props;
	let { type = "text" } = $$props;
	let { label } = $$props;
	const document = getContext("DocumentSheetObject");
	component_subscribe($$self, document, value => $$invalidate(5, $document = value));
	let data;
	let labelElem;
	let input;
	let feather;
	console.log(input);

	/**
 * Forbid to type anything but digits
 * @param e - input event
 */
	function checkInput(e) {
		console.log(type);
		if (type !== "number" && type !== "integer") return;
		const input = e.target.value;
		if (!(/[0-9\.,-]/).test(e.key)) e.preventDefault(); else if (e.key === "-" && input.length > 0) e.preventDefault(); else if ((/[\.,]/).test(e.key) && (type === "integer" || input.includes(",") || input.includes("."))) e.preventDefault();
	}

	function span_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			labelElem = $$value;
			$$invalidate(2, labelElem);
		});
	}

	function input_1_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			input = $$value;
			((($$invalidate(3, input), $$invalidate(1, label)), $$invalidate(4, feather)), $$invalidate(2, labelElem));
		});
	}

	function input_1_input_handler() {
		value = this.value;
		($$invalidate(0, value), $$invalidate(9, type));
	}

	const keypress_handler = e => checkInput(e);

	const change_handler = () => {
		$document.update(data);
	};

	function i_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			feather = $$value;
			$$invalidate(4, feather);
		});
	}

	$$self.$$set = $$props => {
		if ('value' in $$props) $$invalidate(0, value = $$props.value);
		if ('type' in $$props) $$invalidate(9, type = $$props.type);
		if ('label' in $$props) $$invalidate(1, label = $$props.label);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*label, input, feather, labelElem*/ 30) {
			if (label && input && feather) $$invalidate(3, input.style.width = `calc(100% - ${Math.ceil(labelElem.offsetWidth * 1.5)}px - ${Math.ceil(feather.offsetWidth * 1.5)}px)`, input);
		}

		if ($$self.$$.dirty & /*$document*/ 32) {
			{
				$$invalidate(6, data = {
					img: $document.img,
					system: $document.system,
					flags: $document.flags,
					name: $document.name
				});
			}
		}

		if ($$self.$$.dirty & /*type, value*/ 513) {
			if (type !== "text" && value) $$invalidate(0, value = type === "integer" ? parseInt(value) : parseFloat(value));
		}
	};

	return [
		value,
		label,
		labelElem,
		input,
		feather,
		$document,
		data,
		document,
		checkInput,
		type,
		span_binding,
		input_1_binding,
		input_1_input_handler,
		keypress_handler,
		change_handler,
		i_binding
	];
}

class InputForDocumentSheet extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$f, create_fragment$f, safe_not_equal, { value: 0, type: 9, label: 1 });
	}

	get value() {
		return this.$$.ctx[0];
	}

	set value(value) {
		this.$$set({ value });
		flush();
	}

	get type() {
		return this.$$.ctx[9];
	}

	set type(type) {
		this.$$set({ type });
		flush();
	}

	get label() {
		return this.$$.ctx[1];
	}

	set label(label) {
		this.$$set({ label });
		flush();
	}
}

/* built\sheets\svelte\item\ItemItemSheet.svelte generated by Svelte v3.48.0 */

function create_fragment$e(ctx) {
	let t;
	let inputfordocumentsheet;
	let updating_value;
	let current;

	function inputfordocumentsheet_value_binding(value) {
		/*inputfordocumentsheet_value_binding*/ ctx[1](value);
	}

	let inputfordocumentsheet_props = {};

	if (/*doc*/ ctx[0].name !== void 0) {
		inputfordocumentsheet_props.value = /*doc*/ ctx[0].name;
	}

	inputfordocumentsheet = new InputForDocumentSheet({ props: inputfordocumentsheet_props });
	binding_callbacks.push(() => bind(inputfordocumentsheet, 'value', inputfordocumentsheet_value_binding));

	return {
		c() {
			t = text("Name: ");
			create_component(inputfordocumentsheet.$$.fragment);
		},
		m(target, anchor) {
			insert(target, t, anchor);
			mount_component(inputfordocumentsheet, target, anchor);
			current = true;
		},
		p(ctx, [dirty]) {
			const inputfordocumentsheet_changes = {};

			if (!updating_value && dirty & /*doc*/ 1) {
				updating_value = true;
				inputfordocumentsheet_changes.value = /*doc*/ ctx[0].name;
				add_flush_callback(() => updating_value = false);
			}

			inputfordocumentsheet.$set(inputfordocumentsheet_changes);
		},
		i(local) {
			if (current) return;
			transition_in(inputfordocumentsheet.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(inputfordocumentsheet.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(t);
			destroy_component(inputfordocumentsheet, detaching);
		}
	};
}

function instance$e($$self, $$props, $$invalidate) {
	let { doc } = $$props;

	function inputfordocumentsheet_value_binding(value) {
		if ($$self.$$.not_equal(doc.name, value)) {
			doc.name = value;
			$$invalidate(0, doc);
		}
	}

	$$self.$$set = $$props => {
		if ('doc' in $$props) $$invalidate(0, doc = $$props.doc);
	};

	return [doc, inputfordocumentsheet_value_binding];
}

class ItemItemSheet extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$e, create_fragment$e, safe_not_equal, { doc: 0 });
	}

	get doc() {
		return this.$$.ctx[0];
	}

	set doc(doc) {
		this.$$set({ doc });
		flush();
	}
}

/* built\sheets\svelte\general components\ImageWithFilePicker.svelte generated by Svelte v3.48.0 */

function create_fragment$d(ctx) {
	let img_1;
	let img_1_src_value;
	let mounted;
	let dispose;

	return {
		c() {
			img_1 = element("img");
			attr(img_1, "alt", /*alt*/ ctx[0]);
			if (!src_url_equal(img_1.src, img_1_src_value = /*src*/ ctx[2])) attr(img_1, "src", img_1_src_value);
		},
		m(target, anchor) {
			insert(target, img_1, anchor);
			/*img_1_binding*/ ctx[6](img_1);

			if (!mounted) {
				dispose = listen(img_1, "click", /*click_handler*/ ctx[7]);
				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if (dirty & /*alt*/ 1) {
				attr(img_1, "alt", /*alt*/ ctx[0]);
			}

			if (dirty & /*src*/ 4 && !src_url_equal(img_1.src, img_1_src_value = /*src*/ ctx[2])) {
				attr(img_1, "src", img_1_src_value);
			}
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(img_1);
			/*img_1_binding*/ ctx[6](null);
			mounted = false;
			dispose();
		}
	};
}

function instance$d($$self, $$props, $$invalidate) {
	let $document;
	let { path } = $$props;
	let { alt } = $$props;
	let img;
	const { application } = getContext("external"); //get sheet document
	const document = getContext("DocumentSheetObject");
	component_subscribe($$self, document, value => $$invalidate(8, $document = value));
	let src = getProperty($document, path);

	function onEditImage(event) {
		const current = src;

		const fp = new FilePicker({
				type: "image",
				current,
				callback: async newVal => {
					$$invalidate(2, src = newVal);
					let updateData = {};
					updateData[path] = src;
					await $document.update(updateData);
				},
				top: application.position.top + 40,
				left: application.position.left + 10
			});

		return fp.browse();
	}

	function img_1_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			img = $$value;
			$$invalidate(1, img);
		});
	}

	const click_handler = event => onEditImage();

	$$self.$$set = $$props => {
		if ('path' in $$props) $$invalidate(5, path = $$props.path);
		if ('alt' in $$props) $$invalidate(0, alt = $$props.alt);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*img*/ 2) {
			if (img) $$invalidate(1, img.style.width = img.parentElement.clientHeight - parseFloat(getComputedStyle(img.parentElement).padding) * 2, img);
		}
	};

	return [alt, img, src, document, onEditImage, path, img_1_binding, click_handler];
}

class ImageWithFilePicker extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$d, create_fragment$d, safe_not_equal, { path: 5, alt: 0 });
	}

	get path() {
		return this.$$.ctx[5];
	}

	set path(path) {
		this.$$set({ path });
		flush();
	}

	get alt() {
		return this.$$.ctx[0];
	}

	set alt(alt) {
		this.$$set({ alt });
		flush();
	}
}

/* built\sheets\svelte\general components\Tabs.svelte generated by Svelte v3.48.0 */

function get_each_context$9(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[3] = list[i];
	return child_ctx;
}

function get_each_context_1$5(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[3] = list[i];
	return child_ctx;
}

// (7:4) {#each tabs as tab}
function create_each_block_1$5(ctx) {
	let li;
	let span;
	let t0_value = /*tab*/ ctx[3].label + "";
	let t0;
	let t1;
	let li_class_value;
	let mounted;
	let dispose;

	function click_handler() {
		return /*click_handler*/ ctx[2](/*tab*/ ctx[3]);
	}

	return {
		c() {
			li = element("li");
			span = element("span");
			t0 = text(t0_value);
			t1 = space();
			attr(span, "class", "svelte-1exjsfe");

			attr(li, "class", li_class_value = "" + (null_to_empty(/*activeTab*/ ctx[0] === /*tab*/ ctx[3].id
			? "active"
			: "") + " svelte-1exjsfe"));
		},
		m(target, anchor) {
			insert(target, li, anchor);
			append(li, span);
			append(span, t0);
			append(li, t1);

			if (!mounted) {
				dispose = listen(span, "click", click_handler);
				mounted = true;
			}
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;
			if (dirty & /*tabs*/ 2 && t0_value !== (t0_value = /*tab*/ ctx[3].label + "")) set_data(t0, t0_value);

			if (dirty & /*activeTab, tabs*/ 3 && li_class_value !== (li_class_value = "" + (null_to_empty(/*activeTab*/ ctx[0] === /*tab*/ ctx[3].id
			? "active"
			: "") + " svelte-1exjsfe"))) {
				attr(li, "class", li_class_value);
			}
		},
		d(detaching) {
			if (detaching) detach(li);
			mounted = false;
			dispose();
		}
	};
}

// (21:6) {#if tab.id === activeTab}
function create_if_block$6(ctx) {
	let switch_instance;
	let switch_instance_anchor;
	let current;
	var switch_value = /*tab*/ ctx[3].component;

	function switch_props(ctx) {
		return {};
	}

	if (switch_value) {
		switch_instance = new switch_value(switch_props());
	}

	return {
		c() {
			if (switch_instance) create_component(switch_instance.$$.fragment);
			switch_instance_anchor = empty();
		},
		m(target, anchor) {
			if (switch_instance) {
				mount_component(switch_instance, target, anchor);
			}

			insert(target, switch_instance_anchor, anchor);
			current = true;
		},
		p(ctx, dirty) {
			if (switch_value !== (switch_value = /*tab*/ ctx[3].component)) {
				if (switch_instance) {
					group_outros();
					const old_component = switch_instance;

					transition_out(old_component.$$.fragment, 1, 0, () => {
						destroy_component(old_component, 1);
					});

					check_outros();
				}

				if (switch_value) {
					switch_instance = new switch_value(switch_props());
					create_component(switch_instance.$$.fragment);
					transition_in(switch_instance.$$.fragment, 1);
					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
				} else {
					switch_instance = null;
				}
			}
		},
		i(local) {
			if (current) return;
			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
			current = true;
		},
		o(local) {
			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(switch_instance_anchor);
			if (switch_instance) destroy_component(switch_instance, detaching);
		}
	};
}

// (20:4) {#each tabs as tab}
function create_each_block$9(ctx) {
	let if_block_anchor;
	let current;
	let if_block = /*tab*/ ctx[3].id === /*activeTab*/ ctx[0] && create_if_block$6(ctx);

	return {
		c() {
			if (if_block) if_block.c();
			if_block_anchor = empty();
		},
		m(target, anchor) {
			if (if_block) if_block.m(target, anchor);
			insert(target, if_block_anchor, anchor);
			current = true;
		},
		p(ctx, dirty) {
			if (/*tab*/ ctx[3].id === /*activeTab*/ ctx[0]) {
				if (if_block) {
					if_block.p(ctx, dirty);

					if (dirty & /*tabs, activeTab*/ 3) {
						transition_in(if_block, 1);
					}
				} else {
					if_block = create_if_block$6(ctx);
					if_block.c();
					transition_in(if_block, 1);
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			} else if (if_block) {
				group_outros();

				transition_out(if_block, 1, 1, () => {
					if_block = null;
				});

				check_outros();
			}
		},
		i(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},
		o(local) {
			transition_out(if_block);
			current = false;
		},
		d(detaching) {
			if (if_block) if_block.d(detaching);
			if (detaching) detach(if_block_anchor);
		}
	};
}

function create_fragment$c(ctx) {
	let ul;
	let t;
	let div;
	let current;
	let each_value_1 = /*tabs*/ ctx[1];
	let each_blocks_1 = [];

	for (let i = 0; i < each_value_1.length; i += 1) {
		each_blocks_1[i] = create_each_block_1$5(get_each_context_1$5(ctx, each_value_1, i));
	}

	let each_value = /*tabs*/ ctx[1];
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$9(get_each_context$9(ctx, each_value, i));
	}

	const out = i => transition_out(each_blocks[i], 1, 1, () => {
		each_blocks[i] = null;
	});

	return {
		c() {
			ul = element("ul");

			for (let i = 0; i < each_blocks_1.length; i += 1) {
				each_blocks_1[i].c();
			}

			t = space();
			div = element("div");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			attr(ul, "class", "svelte-1exjsfe");
			attr(div, "class", "box svelte-1exjsfe");
		},
		m(target, anchor) {
			insert(target, ul, anchor);

			for (let i = 0; i < each_blocks_1.length; i += 1) {
				each_blocks_1[i].m(ul, null);
			}

			insert(target, t, anchor);
			insert(target, div, anchor);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(div, null);
			}

			current = true;
		},
		p(ctx, [dirty]) {
			if (dirty & /*activeTab, tabs*/ 3) {
				each_value_1 = /*tabs*/ ctx[1];
				let i;

				for (i = 0; i < each_value_1.length; i += 1) {
					const child_ctx = get_each_context_1$5(ctx, each_value_1, i);

					if (each_blocks_1[i]) {
						each_blocks_1[i].p(child_ctx, dirty);
					} else {
						each_blocks_1[i] = create_each_block_1$5(child_ctx);
						each_blocks_1[i].c();
						each_blocks_1[i].m(ul, null);
					}
				}

				for (; i < each_blocks_1.length; i += 1) {
					each_blocks_1[i].d(1);
				}

				each_blocks_1.length = each_value_1.length;
			}

			if (dirty & /*tabs, activeTab*/ 3) {
				each_value = /*tabs*/ ctx[1];
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$9(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
						transition_in(each_blocks[i], 1);
					} else {
						each_blocks[i] = create_each_block$9(child_ctx);
						each_blocks[i].c();
						transition_in(each_blocks[i], 1);
						each_blocks[i].m(div, null);
					}
				}

				group_outros();

				for (i = each_value.length; i < each_blocks.length; i += 1) {
					out(i);
				}

				check_outros();
			}
		},
		i(local) {
			if (current) return;

			for (let i = 0; i < each_value.length; i += 1) {
				transition_in(each_blocks[i]);
			}

			current = true;
		},
		o(local) {
			each_blocks = each_blocks.filter(Boolean);

			for (let i = 0; i < each_blocks.length; i += 1) {
				transition_out(each_blocks[i]);
			}

			current = false;
		},
		d(detaching) {
			if (detaching) detach(ul);
			destroy_each(each_blocks_1, detaching);
			if (detaching) detach(t);
			if (detaching) detach(div);
			destroy_each(each_blocks, detaching);
		}
	};
}

function instance$c($$self, $$props, $$invalidate) {
	let { tabs = [] } = $$props;
	let { activeTab } = $$props;

	const click_handler = tab => {
		$$invalidate(0, activeTab = tab.id);
	};

	$$self.$$set = $$props => {
		if ('tabs' in $$props) $$invalidate(1, tabs = $$props.tabs);
		if ('activeTab' in $$props) $$invalidate(0, activeTab = $$props.activeTab);
	};

	return [activeTab, tabs, click_handler];
}

class Tabs extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$c, create_fragment$c, safe_not_equal, { tabs: 1, activeTab: 0 });
	}
}

/* built\sheets\svelte\actor\AttributeTab.svelte generated by Svelte v3.48.0 */

function get_each_context$8(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[3] = list[i];
	return child_ctx;
}

// (27:15) {#if skill[1].value > 0}
function create_if_block$5(ctx) {
	let t;

	return {
		c() {
			t = text("+");
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

// (12:2) {#each Object.entries($doc.system.skills) as skill}
function create_each_block$8(ctx) {
	let div;
	let span0;
	let t0_value = /*skill*/ ctx[3][1].rankName + "";
	let t0;
	let t1;
	let span1;
	let t2_value = /*skill*/ ctx[3][1].name + "";
	let t2;
	let t3;
	let span2;
	let t4;
	let t5;
	let t6_value = /*skill*/ ctx[3][1].value + "";
	let t6;
	let t7;
	let mounted;
	let dispose;
	let if_block = /*skill*/ ctx[3][1].value > 0 && create_if_block$5();

	function click_handler(...args) {
		return /*click_handler*/ ctx[2](/*skill*/ ctx[3], ...args);
	}

	return {
		c() {
			div = element("div");
			span0 = element("span");
			t0 = text(t0_value);
			t1 = space();
			span1 = element("span");
			t2 = text(t2_value);
			t3 = space();
			span2 = element("span");
			t4 = text("Bonus: ");
			if (if_block) if_block.c();
			t5 = space();
			t6 = text(t6_value);
			t7 = space();
			attr(div, "class", "skill svelte-1rodq98");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			append(div, span0);
			append(span0, t0);
			append(div, t1);
			append(div, span1);
			append(span1, t2);
			append(div, t3);
			append(div, span2);
			append(span2, t4);
			if (if_block) if_block.m(span2, null);
			append(span2, t5);
			append(span2, t6);
			append(div, t7);

			if (!mounted) {
				dispose = listen(div, "click", click_handler);
				mounted = true;
			}
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;
			if (dirty & /*$doc*/ 1 && t0_value !== (t0_value = /*skill*/ ctx[3][1].rankName + "")) set_data(t0, t0_value);
			if (dirty & /*$doc*/ 1 && t2_value !== (t2_value = /*skill*/ ctx[3][1].name + "")) set_data(t2, t2_value);

			if (/*skill*/ ctx[3][1].value > 0) {
				if (if_block) ; else {
					if_block = create_if_block$5();
					if_block.c();
					if_block.m(span2, t5);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}

			if (dirty & /*$doc*/ 1 && t6_value !== (t6_value = /*skill*/ ctx[3][1].value + "")) set_data(t6, t6_value);
		},
		d(detaching) {
			if (detaching) detach(div);
			if (if_block) if_block.d();
			mounted = false;
			dispose();
		}
	};
}

function create_fragment$b(ctx) {
	let label;
	let t1;
	let div;
	let each_value = Object.entries(/*$doc*/ ctx[0].system.skills);
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$8(get_each_context$8(ctx, each_value, i));
	}

	return {
		c() {
			label = element("label");
			label.textContent = "Skills";
			t1 = space();
			div = element("div");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			attr(label, "for", "skills");
			attr(label, "class", "svelte-1rodq98");
			attr(div, "class", "skills svelte-1rodq98");
		},
		m(target, anchor) {
			insert(target, label, anchor);
			insert(target, t1, anchor);
			insert(target, div, anchor);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(div, null);
			}
		},
		p(ctx, [dirty]) {
			if (dirty & /*$doc, Object*/ 1) {
				each_value = Object.entries(/*$doc*/ ctx[0].system.skills);
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$8(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block$8(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(div, null);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}

				each_blocks.length = each_value.length;
			}
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(label);
			if (detaching) detach(t1);
			if (detaching) detach(div);
			destroy_each(each_blocks, detaching);
		}
	};
}

function instance$b($$self, $$props, $$invalidate) {
	let $doc;
	const doc = getContext("DocumentSheetObject");
	component_subscribe($$self, doc, value => $$invalidate(0, $doc = value));

	const click_handler = (skill, event) => {
		event.preventDefault();
		return $doc.rollSkill(skill[0], { event });
	};

	return [$doc, doc, click_handler];
}

class AttributeTab extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$b, create_fragment$b, safe_not_equal, {});
	}
}

/* built\sheets\svelte\actor\InventoryTab.svelte generated by Svelte v3.48.0 */

class InventoryTab extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, null, null, safe_not_equal, {});
	}
}

/* built\sheets\svelte\general components\ConfigureItemButton.svelte generated by Svelte v3.48.0 */

function create_if_block_2(ctx) {
	let i;
	let mounted;
	let dispose;

	return {
		c() {
			i = element("i");
			attr(i, "class", "fa-solid fa-pen-to-square svelte-1xsdke5");
			attr(i, "data-tooltip", "edit");
		},
		m(target, anchor) {
			insert(target, i, anchor);

			if (!mounted) {
				dispose = listen(i, "click", /*click_handler*/ ctx[7]);
				mounted = true;
			}
		},
		p: noop,
		d(detaching) {
			if (detaching) detach(i);
			mounted = false;
			dispose();
		}
	};
}

// (25:0) {#if action === "delete"}
function create_if_block_1(ctx) {
	let i;
	let mounted;
	let dispose;

	return {
		c() {
			i = element("i");
			attr(i, "class", "fa-solid fa-trash-can svelte-1xsdke5");
			attr(i, "data-tooltip", "delete");
		},
		m(target, anchor) {
			insert(target, i, anchor);

			if (!mounted) {
				dispose = listen(i, "click", /*click_handler_1*/ ctx[8]);
				mounted = true;
			}
		},
		p: noop,
		d(detaching) {
			if (detaching) detach(i);
			mounted = false;
			dispose();
		}
	};
}

// (28:0) {#if action === "create"}
function create_if_block$4(ctx) {
	let i;
	let i_data_tooltip_value;
	let mounted;
	let dispose;

	return {
		c() {
			i = element("i");
			attr(i, "class", "fa-solid fa-file-plus svelte-1xsdke5");
			attr(i, "data-tooltip", i_data_tooltip_value = "create new " + /*type*/ ctx[1]);
		},
		m(target, anchor) {
			insert(target, i, anchor);

			if (!mounted) {
				dispose = listen(i, "click", /*click_handler_2*/ ctx[9]);
				mounted = true;
			}
		},
		p(ctx, dirty) {
			if (dirty & /*type*/ 2 && i_data_tooltip_value !== (i_data_tooltip_value = "create new " + /*type*/ ctx[1])) {
				attr(i, "data-tooltip", i_data_tooltip_value);
			}
		},
		d(detaching) {
			if (detaching) detach(i);
			mounted = false;
			dispose();
		}
	};
}

function create_fragment$a(ctx) {
	let t0;
	let t1;
	let if_block2_anchor;
	let if_block0 = /*action*/ ctx[0] === "edit" && create_if_block_2(ctx);
	let if_block1 = /*action*/ ctx[0] === "delete" && create_if_block_1(ctx);
	let if_block2 = /*action*/ ctx[0] === "create" && create_if_block$4(ctx);

	return {
		c() {
			if (if_block0) if_block0.c();
			t0 = space();
			if (if_block1) if_block1.c();
			t1 = space();
			if (if_block2) if_block2.c();
			if_block2_anchor = empty();
		},
		m(target, anchor) {
			if (if_block0) if_block0.m(target, anchor);
			insert(target, t0, anchor);
			if (if_block1) if_block1.m(target, anchor);
			insert(target, t1, anchor);
			if (if_block2) if_block2.m(target, anchor);
			insert(target, if_block2_anchor, anchor);
		},
		p(ctx, [dirty]) {
			if (/*action*/ ctx[0] === "edit") {
				if (if_block0) {
					if_block0.p(ctx, dirty);
				} else {
					if_block0 = create_if_block_2(ctx);
					if_block0.c();
					if_block0.m(t0.parentNode, t0);
				}
			} else if (if_block0) {
				if_block0.d(1);
				if_block0 = null;
			}

			if (/*action*/ ctx[0] === "delete") {
				if (if_block1) {
					if_block1.p(ctx, dirty);
				} else {
					if_block1 = create_if_block_1(ctx);
					if_block1.c();
					if_block1.m(t1.parentNode, t1);
				}
			} else if (if_block1) {
				if_block1.d(1);
				if_block1 = null;
			}

			if (/*action*/ ctx[0] === "create") {
				if (if_block2) {
					if_block2.p(ctx, dirty);
				} else {
					if_block2 = create_if_block$4(ctx);
					if_block2.c();
					if_block2.m(if_block2_anchor.parentNode, if_block2_anchor);
				}
			} else if (if_block2) {
				if_block2.d(1);
				if_block2 = null;
			}
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (if_block0) if_block0.d(detaching);
			if (detaching) detach(t0);
			if (if_block1) if_block1.d(detaching);
			if (detaching) detach(t1);
			if (if_block2) if_block2.d(detaching);
			if (detaching) detach(if_block2_anchor);
		}
	};
}

function instance$a($$self, $$props, $$invalidate) {
	let { item = null } = $$props;
	let { action } = $$props;
	let { doc = null } = $$props;
	let { type = null } = $$props;

	function OpenItem() {
		item.sheet.render(true);
	}

	function DeleteItem() {
		item.delete();
	}

	async function CreateItem() {
		if (!doc) return;

		let itemNumber = doc.itemTypes[type].filter(item => {
			return item.name.slice(0, type.length + 6) === `New ${type} #`;
		}).length;

		await Item.create(
			[
				{
					name: `New ${type} #${itemNumber + 1}`,
					type
				}
			],
			{ parent: doc }
		);
	}

	const click_handler = () => OpenItem();
	const click_handler_1 = () => DeleteItem();
	const click_handler_2 = () => CreateItem();

	$$self.$$set = $$props => {
		if ('item' in $$props) $$invalidate(5, item = $$props.item);
		if ('action' in $$props) $$invalidate(0, action = $$props.action);
		if ('doc' in $$props) $$invalidate(6, doc = $$props.doc);
		if ('type' in $$props) $$invalidate(1, type = $$props.type);
	};

	return [
		action,
		type,
		OpenItem,
		DeleteItem,
		CreateItem,
		item,
		doc,
		click_handler,
		click_handler_1,
		click_handler_2
	];
}

class ConfigureItemButton extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$a, create_fragment$a, safe_not_equal, { item: 5, action: 0, doc: 6, type: 1 });
	}

	get item() {
		return this.$$.ctx[5];
	}

	set item(item) {
		this.$$set({ item });
		flush();
	}

	get action() {
		return this.$$.ctx[0];
	}

	set action(action) {
		this.$$set({ action });
		flush();
	}

	get doc() {
		return this.$$.ctx[6];
	}

	set doc(doc) {
		this.$$set({ doc });
		flush();
	}

	get type() {
		return this.$$.ctx[1];
	}

	set type(type) {
		this.$$set({ type });
		flush();
	}
}

/* built\sheets\svelte\actor\FeaturesTab.svelte generated by Svelte v3.48.0 */

function get_each_context$7(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[4] = list[i];
	return child_ctx;
}

function get_each_context_1$4(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[7] = list[i];
	return child_ctx;
}

// (45:10) {#if item.system.hasAttack || item.system.hasDamage}
function create_if_block$3(ctx) {
	let i;
	let mounted;
	let dispose;

	function click_handler_1() {
		return /*click_handler_1*/ ctx[3](/*item*/ ctx[4]);
	}

	return {
		c() {
			i = element("i");
			attr(i, "class", "fa-light fa-dice-d20 svelte-1213ocr");
			attr(i, "data-tooltip", "roll");
		},
		m(target, anchor) {
			insert(target, i, anchor);

			if (!mounted) {
				dispose = listen(i, "click", click_handler_1);
				mounted = true;
			}
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;
		},
		d(detaching) {
			if (detaching) detach(i);
			mounted = false;
			dispose();
		}
	};
}

// (56:10) {#each item.system.actionList as action }
function create_each_block_1$4(ctx) {
	let span;
	let t0_value = /*action*/ ctx[7].name + "";
	let t0;
	let t1;

	return {
		c() {
			span = element("span");
			t0 = text(t0_value);
			t1 = space();
		},
		m(target, anchor) {
			insert(target, span, anchor);
			append(span, t0);
			append(span, t1);
		},
		p(ctx, dirty) {
			if (dirty & /*$doc*/ 1 && t0_value !== (t0_value = /*action*/ ctx[7].name + "")) set_data(t0, t0_value);
		},
		d(detaching) {
			if (detaching) detach(span);
		}
	};
}

// (39:4) {#each $doc.itemTypes.feature as item}
function create_each_block$7(ctx) {
	let tr;
	let td0;
	let span;
	let t0_value = /*item*/ ctx[4].name + "";
	let t0;
	let t1;
	let t2;
	let td1;
	let t3;
	let td2;
	let t4_value = /*item*/ ctx[4].system.level.current + "";
	let t4;
	let t5;
	let td3;
	let configureitembutton0;
	let t6;
	let td4;
	let t7;
	let td5;
	let configureitembutton1;
	let t8;
	let div;
	let raw_value = /*item*/ ctx[4].system.description + "";
	let t9;
	let current;
	let mounted;
	let dispose;
	let if_block = (/*item*/ ctx[4].system.hasAttack || /*item*/ ctx[4].system.hasDamage) && create_if_block$3(ctx);
	let each_value_1 = /*item*/ ctx[4].system.actionList;
	let each_blocks = [];

	for (let i = 0; i < each_value_1.length; i += 1) {
		each_blocks[i] = create_each_block_1$4(get_each_context_1$4(ctx, each_value_1, i));
	}

	configureitembutton0 = new ConfigureItemButton({
			props: { item: /*item*/ ctx[4], action: "edit" }
		});

	configureitembutton1 = new ConfigureItemButton({
			props: { item: /*item*/ ctx[4], action: "delete" }
		});

	return {
		c() {
			tr = element("tr");
			td0 = element("td");
			span = element("span");
			t0 = text(t0_value);
			t1 = space();
			if (if_block) if_block.c();
			t2 = space();
			td1 = element("td");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			t3 = space();
			td2 = element("td");
			t4 = text(t4_value);
			t5 = space();
			td3 = element("td");
			create_component(configureitembutton0.$$.fragment);
			t6 = space();
			td4 = element("td");
			td4.innerHTML = `<i class="fa-solid fa-stars svelte-1213ocr"></i>`;
			t7 = space();
			td5 = element("td");
			create_component(configureitembutton1.$$.fragment);
			t8 = space();
			div = element("div");
			t9 = space();
			attr(td0, "class", "svelte-1213ocr");
			attr(td1, "class", "actions svelte-1213ocr");
			attr(td2, "class", "svelte-1213ocr");
			attr(td3, "class", "config svelte-1213ocr");
			attr(td4, "class", "config svelte-1213ocr");
			attr(td5, "class", "config svelte-1213ocr");
			attr(div, "class", "description svelte-1213ocr");
			attr(tr, "class", "svelte-1213ocr");
		},
		m(target, anchor) {
			insert(target, tr, anchor);
			append(tr, td0);
			append(td0, span);
			append(span, t0);
			append(td0, t1);
			if (if_block) if_block.m(td0, null);
			append(tr, t2);
			append(tr, td1);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(td1, null);
			}

			append(tr, t3);
			append(tr, td2);
			append(td2, t4);
			append(tr, t5);
			append(tr, td3);
			mount_component(configureitembutton0, td3, null);
			append(tr, t6);
			append(tr, td4);
			append(tr, t7);
			append(tr, td5);
			mount_component(configureitembutton1, td5, null);
			append(tr, t8);
			append(tr, div);
			div.innerHTML = raw_value;
			append(tr, t9);
			current = true;

			if (!mounted) {
				dispose = listen(span, "click", /*click_handler*/ ctx[2]);
				mounted = true;
			}
		},
		p(ctx, dirty) {
			if ((!current || dirty & /*$doc*/ 1) && t0_value !== (t0_value = /*item*/ ctx[4].name + "")) set_data(t0, t0_value);

			if (/*item*/ ctx[4].system.hasAttack || /*item*/ ctx[4].system.hasDamage) {
				if (if_block) {
					if_block.p(ctx, dirty);
				} else {
					if_block = create_if_block$3(ctx);
					if_block.c();
					if_block.m(td0, null);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}

			if (dirty & /*$doc*/ 1) {
				each_value_1 = /*item*/ ctx[4].system.actionList;
				let i;

				for (i = 0; i < each_value_1.length; i += 1) {
					const child_ctx = get_each_context_1$4(ctx, each_value_1, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block_1$4(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(td1, null);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}

				each_blocks.length = each_value_1.length;
			}

			if ((!current || dirty & /*$doc*/ 1) && t4_value !== (t4_value = /*item*/ ctx[4].system.level.current + "")) set_data(t4, t4_value);
			const configureitembutton0_changes = {};
			if (dirty & /*$doc*/ 1) configureitembutton0_changes.item = /*item*/ ctx[4];
			configureitembutton0.$set(configureitembutton0_changes);
			const configureitembutton1_changes = {};
			if (dirty & /*$doc*/ 1) configureitembutton1_changes.item = /*item*/ ctx[4];
			configureitembutton1.$set(configureitembutton1_changes);
			if ((!current || dirty & /*$doc*/ 1) && raw_value !== (raw_value = /*item*/ ctx[4].system.description + "")) div.innerHTML = raw_value;		},
		i(local) {
			if (current) return;
			transition_in(configureitembutton0.$$.fragment, local);
			transition_in(configureitembutton1.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(configureitembutton0.$$.fragment, local);
			transition_out(configureitembutton1.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(tr);
			if (if_block) if_block.d();
			destroy_each(each_blocks, detaching);
			destroy_component(configureitembutton0);
			destroy_component(configureitembutton1);
			mounted = false;
			dispose();
		}
	};
}

function create_fragment$9(ctx) {
	let table;
	let thead;
	let th0;
	let t1;
	let th1;
	let t3;
	let th2;
	let t5;
	let th3;
	let t6;
	let configureitembutton;
	let t7;
	let tbody;
	let current;

	configureitembutton = new ConfigureItemButton({
			props: {
				doc: /*$doc*/ ctx[0],
				type: "feature",
				action: "create"
			}
		});

	let each_value = /*$doc*/ ctx[0].itemTypes.feature;
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$7(get_each_context$7(ctx, each_value, i));
	}

	const out = i => transition_out(each_blocks[i], 1, 1, () => {
		each_blocks[i] = null;
	});

	return {
		c() {
			table = element("table");
			thead = element("thead");
			th0 = element("th");
			th0.textContent = "Name";
			t1 = space();
			th1 = element("th");
			th1.textContent = "Level";
			t3 = space();
			th2 = element("th");
			th2.textContent = "Actions";
			t5 = space();
			th3 = element("th");
			t6 = text("Config ");
			create_component(configureitembutton.$$.fragment);
			t7 = space();
			tbody = element("tbody");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			attr(th3, "colspan", "3");
		},
		m(target, anchor) {
			insert(target, table, anchor);
			append(table, thead);
			append(thead, th0);
			append(thead, t1);
			append(thead, th1);
			append(thead, t3);
			append(thead, th2);
			append(thead, t5);
			append(thead, th3);
			append(th3, t6);
			mount_component(configureitembutton, th3, null);
			append(table, t7);
			append(table, tbody);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(tbody, null);
			}

			current = true;
		},
		p(ctx, [dirty]) {
			const configureitembutton_changes = {};
			if (dirty & /*$doc*/ 1) configureitembutton_changes.doc = /*$doc*/ ctx[0];
			configureitembutton.$set(configureitembutton_changes);

			if (dirty & /*$doc, itemRoll, ShowDescription*/ 1) {
				each_value = /*$doc*/ ctx[0].itemTypes.feature;
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$7(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
						transition_in(each_blocks[i], 1);
					} else {
						each_blocks[i] = create_each_block$7(child_ctx);
						each_blocks[i].c();
						transition_in(each_blocks[i], 1);
						each_blocks[i].m(tbody, null);
					}
				}

				group_outros();

				for (i = each_value.length; i < each_blocks.length; i += 1) {
					out(i);
				}

				check_outros();
			}
		},
		i(local) {
			if (current) return;
			transition_in(configureitembutton.$$.fragment, local);

			for (let i = 0; i < each_value.length; i += 1) {
				transition_in(each_blocks[i]);
			}

			current = true;
		},
		o(local) {
			transition_out(configureitembutton.$$.fragment, local);
			each_blocks = each_blocks.filter(Boolean);

			for (let i = 0; i < each_blocks.length; i += 1) {
				transition_out(each_blocks[i]);
			}

			current = false;
		},
		d(detaching) {
			if (detaching) detach(table);
			destroy_component(configureitembutton);
			destroy_each(each_blocks, detaching);
		}
	};
}

function ShowDescription(event) {
	const parent = event.target.parentNode.parentNode;
	const div = parent.getElementsByClassName("description")[0];
	const isHidden = getComputedStyle(div).opacity == 0;
	div.style.webkitTransition = isHidden ? "opacity 0.75s" : "opacity 0.25s, width 1.1s"; //width transition little bit longer so you can't see that
	let divHeight;
	let parentHeight;
	div.style.width = isHidden ? "100%" : div.style.width; //if div was hidden, change width
	divHeight = div.offsetHeight;
	parentHeight = parent.offsetHeight;
	parent.style.height = parentHeight + "px";
	div.style.opacity = isHidden ? 1 : 0;

	parent.style.height = isHidden
	? parentHeight + divHeight + "px"
	: parentHeight - divHeight + "px";

	div.style.top = isHidden ? parentHeight + "px" : div.style.top;
	div.style.width = isHidden ? "100%" : "0%"; //if div was visible, change width
}

function itemRoll(item) {
	const hasAttack = item.system.hasAttack;
	const hasDamage = item.system.hasDamage;
	return item.roll({ hasAttack, hasDamage });
}

function instance$9($$self, $$props, $$invalidate) {
	let $doc;
	const doc = getContext("DocumentSheetObject");
	component_subscribe($$self, doc, value => $$invalidate(0, $doc = value));
	const click_handler = event => ShowDescription(event);

	const click_handler_1 = item => {
		itemRoll(item);
	};

	return [$doc, doc, click_handler, click_handler_1];
}

class FeaturesTab extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});
	}
}

/* built\sheets\svelte\actor\SpellsTab.svelte generated by Svelte v3.48.0 */

class SpellsTab extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, null, null, safe_not_equal, {});
	}
}

/* built\sheets\svelte\actor\EffectsTab.svelte generated by Svelte v3.48.0 */

class EffectsTab extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, null, null, safe_not_equal, {});
	}
}

/* built\sheets\svelte\actor\BiographyTab.svelte generated by Svelte v3.48.0 */

class BiographyTab extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, null, null, safe_not_equal, {});
	}
}

/* built\sheets\svelte\actor\ActorSheet.svelte generated by Svelte v3.48.0 */

function get_each_context$6(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[7] = list[i];
	return child_ctx;
}

function get_each_context_1$3(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[10] = list[i];
	return child_ctx;
}

// (55:6) {#each Object.entries($doc.system.attributes) as attribute}
function create_each_block_1$3(ctx) {
	let div;
	let span0;
	let t0_value = /*attribute*/ ctx[10][1].label + "";
	let t0;
	let t1;
	let span1;
	let t2;
	let t3_value = /*attribute*/ ctx[10][1].value + "";
	let t3;
	let t4;
	let span2;
	let t5;
	let t6_value = /*attribute*/ ctx[10][1].mod + "";
	let t6;
	let t7;
	let div_data_tooltip_value;
	let mounted;
	let dispose;

	function click_handler(...args) {
		return /*click_handler*/ ctx[6](/*attribute*/ ctx[10], ...args);
	}

	return {
		c() {
			div = element("div");
			span0 = element("span");
			t0 = text(t0_value);
			t1 = space();
			span1 = element("span");
			t2 = text("Value: ");
			t3 = text(t3_value);
			t4 = space();
			span2 = element("span");
			t5 = text("Mod: ");
			t6 = text(t6_value);
			t7 = space();
			attr(div, "data-tooltip", div_data_tooltip_value = "click to roll " + /*attribute*/ ctx[10][1].label);
			attr(div, "data-tooltip-direction", "DOWN");
			attr(div, "class", "svelte-rm2f2e");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			append(div, span0);
			append(span0, t0);
			append(div, t1);
			append(div, span1);
			append(span1, t2);
			append(span1, t3);
			append(div, t4);
			append(div, span2);
			append(span2, t5);
			append(span2, t6);
			append(div, t7);

			if (!mounted) {
				dispose = listen(div, "click", click_handler);
				mounted = true;
			}
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;
			if (dirty & /*$doc*/ 1 && t0_value !== (t0_value = /*attribute*/ ctx[10][1].label + "")) set_data(t0, t0_value);
			if (dirty & /*$doc*/ 1 && t3_value !== (t3_value = /*attribute*/ ctx[10][1].value + "")) set_data(t3, t3_value);
			if (dirty & /*$doc*/ 1 && t6_value !== (t6_value = /*attribute*/ ctx[10][1].mod + "")) set_data(t6, t6_value);

			if (dirty & /*$doc*/ 1 && div_data_tooltip_value !== (div_data_tooltip_value = "click to roll " + /*attribute*/ ctx[10][1].label)) {
				attr(div, "data-tooltip", div_data_tooltip_value);
			}
		},
		d(detaching) {
			if (detaching) detach(div);
			mounted = false;
			dispose();
		}
	};
}

// (71:6) {#each Object.entries($doc.system.resources) as resource}
function create_each_block$6(ctx) {
	let span0;
	let t0_value = /*resource*/ ctx[7][0] + "";
	let t0;
	let t1;
	let span1;
	let t2_value = /*resource*/ ctx[7][1].value + "";
	let t2;
	let t3;
	let t4_value = /*resource*/ ctx[7][1].max + "";
	let t4;

	return {
		c() {
			span0 = element("span");
			t0 = text(t0_value);
			t1 = text(": ");
			span1 = element("span");
			t2 = text(t2_value);
			t3 = text(" / ");
			t4 = text(t4_value);
		},
		m(target, anchor) {
			insert(target, span0, anchor);
			append(span0, t0);
			insert(target, t1, anchor);
			insert(target, span1, anchor);
			append(span1, t2);
			append(span1, t3);
			append(span1, t4);
		},
		p(ctx, dirty) {
			if (dirty & /*$doc*/ 1 && t0_value !== (t0_value = /*resource*/ ctx[7][0] + "")) set_data(t0, t0_value);
			if (dirty & /*$doc*/ 1 && t2_value !== (t2_value = /*resource*/ ctx[7][1].value + "")) set_data(t2, t2_value);
			if (dirty & /*$doc*/ 1 && t4_value !== (t4_value = /*resource*/ ctx[7][1].max + "")) set_data(t4, t4_value);
		},
		d(detaching) {
			if (detaching) detach(span0);
			if (detaching) detach(t1);
			if (detaching) detach(span1);
		}
	};
}

function create_fragment$8(ctx) {
	let header;
	let div0;
	let imagewithfilepicker;
	let t0;
	let div11;
	let div8;
	let div3;
	let div1;
	let inputfordocumentsheet0;
	let updating_value;
	let t1;
	let div2;
	let t2;
	let t3_value = (/*$doc*/ ctx[0].itemTypes.race[0]?.name || "none") + "";
	let t3;
	let t4;
	let div4;
	let inputfordocumentsheet1;
	let updating_value_1;
	let t5;
	let span;
	let t6_value = /*$doc*/ ctx[0].system.health.max + "";
	let t6;
	let t7;
	let div7;
	let div5;
	let inputfordocumentsheet2;
	let updating_value_2;
	let t8;
	let div6;
	let t9;
	let t10_value = /*$doc*/ ctx[0].system.advancement.xp.used + "";
	let t10;
	let t11;
	let div9;
	let t12;
	let div10;
	let t13;
	let div12;
	let tabs_1;
	let current;

	imagewithfilepicker = new ImageWithFilePicker({
			props: { path: "img", alt: "character portrait" }
		});

	function inputfordocumentsheet0_value_binding(value) {
		/*inputfordocumentsheet0_value_binding*/ ctx[3](value);
	}

	let inputfordocumentsheet0_props = { label: "name" };

	if (/*$doc*/ ctx[0].name !== void 0) {
		inputfordocumentsheet0_props.value = /*$doc*/ ctx[0].name;
	}

	inputfordocumentsheet0 = new InputForDocumentSheet({ props: inputfordocumentsheet0_props });
	binding_callbacks.push(() => bind(inputfordocumentsheet0, 'value', inputfordocumentsheet0_value_binding));

	function inputfordocumentsheet1_value_binding(value) {
		/*inputfordocumentsheet1_value_binding*/ ctx[4](value);
	}

	let inputfordocumentsheet1_props = { label: "health", type: "integer" };

	if (/*$doc*/ ctx[0].system.health.value !== void 0) {
		inputfordocumentsheet1_props.value = /*$doc*/ ctx[0].system.health.value;
	}

	inputfordocumentsheet1 = new InputForDocumentSheet({ props: inputfordocumentsheet1_props });
	binding_callbacks.push(() => bind(inputfordocumentsheet1, 'value', inputfordocumentsheet1_value_binding));

	function inputfordocumentsheet2_value_binding(value) {
		/*inputfordocumentsheet2_value_binding*/ ctx[5](value);
	}

	let inputfordocumentsheet2_props = { type: "number", label: "XP earned" };

	if (/*$doc*/ ctx[0].system.advancement.xp.get !== void 0) {
		inputfordocumentsheet2_props.value = /*$doc*/ ctx[0].system.advancement.xp.get;
	}

	inputfordocumentsheet2 = new InputForDocumentSheet({ props: inputfordocumentsheet2_props });
	binding_callbacks.push(() => bind(inputfordocumentsheet2, 'value', inputfordocumentsheet2_value_binding));
	let each_value_1 = Object.entries(/*$doc*/ ctx[0].system.attributes);
	let each_blocks_1 = [];

	for (let i = 0; i < each_value_1.length; i += 1) {
		each_blocks_1[i] = create_each_block_1$3(get_each_context_1$3(ctx, each_value_1, i));
	}

	let each_value = Object.entries(/*$doc*/ ctx[0].system.resources);
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$6(get_each_context$6(ctx, each_value, i));
	}

	tabs_1 = new Tabs({
			props: { tabs: /*tabs*/ ctx[2], activeTab }
		});

	return {
		c() {
			header = element("header");
			div0 = element("div");
			create_component(imagewithfilepicker.$$.fragment);
			t0 = space();
			div11 = element("div");
			div8 = element("div");
			div3 = element("div");
			div1 = element("div");
			create_component(inputfordocumentsheet0.$$.fragment);
			t1 = space();
			div2 = element("div");
			t2 = text("Race: ");
			t3 = text(t3_value);
			t4 = space();
			div4 = element("div");
			create_component(inputfordocumentsheet1.$$.fragment);
			t5 = space();
			span = element("span");
			t6 = text(t6_value);
			t7 = space();
			div7 = element("div");
			div5 = element("div");
			create_component(inputfordocumentsheet2.$$.fragment);
			t8 = space();
			div6 = element("div");
			t9 = text("XP used: ");
			t10 = text(t10_value);
			t11 = space();
			div9 = element("div");

			for (let i = 0; i < each_blocks_1.length; i += 1) {
				each_blocks_1[i].c();
			}

			t12 = space();
			div10 = element("div");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			t13 = space();
			div12 = element("div");
			create_component(tabs_1.$$.fragment);
			attr(div0, "class", "cha-img svelte-rm2f2e");
			attr(div1, "class", "name");
			attr(div2, "class", "race");
			attr(div3, "class", "nameAndRace");
			attr(div4, "class", "health");
			attr(div7, "class", "level");
			attr(div8, "class", "svelte-rm2f2e");
			attr(div9, "class", "attributes svelte-rm2f2e");
			attr(div10, "class", "resources svelte-rm2f2e");
			attr(div11, "class", "main-info svelte-rm2f2e");
			attr(header, "class", "svelte-rm2f2e");
			attr(div12, "class", "content");
		},
		m(target, anchor) {
			insert(target, header, anchor);
			append(header, div0);
			mount_component(imagewithfilepicker, div0, null);
			append(header, t0);
			append(header, div11);
			append(div11, div8);
			append(div8, div3);
			append(div3, div1);
			mount_component(inputfordocumentsheet0, div1, null);
			append(div3, t1);
			append(div3, div2);
			append(div2, t2);
			append(div2, t3);
			append(div8, t4);
			append(div8, div4);
			mount_component(inputfordocumentsheet1, div4, null);
			append(div4, t5);
			append(div4, span);
			append(span, t6);
			append(div8, t7);
			append(div8, div7);
			append(div7, div5);
			mount_component(inputfordocumentsheet2, div5, null);
			append(div7, t8);
			append(div7, div6);
			append(div6, t9);
			append(div6, t10);
			append(div11, t11);
			append(div11, div9);

			for (let i = 0; i < each_blocks_1.length; i += 1) {
				each_blocks_1[i].m(div9, null);
			}

			append(div11, t12);
			append(div11, div10);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(div10, null);
			}

			insert(target, t13, anchor);
			insert(target, div12, anchor);
			mount_component(tabs_1, div12, null);
			current = true;
		},
		p(ctx, [dirty]) {
			const inputfordocumentsheet0_changes = {};

			if (!updating_value && dirty & /*$doc*/ 1) {
				updating_value = true;
				inputfordocumentsheet0_changes.value = /*$doc*/ ctx[0].name;
				add_flush_callback(() => updating_value = false);
			}

			inputfordocumentsheet0.$set(inputfordocumentsheet0_changes);
			if ((!current || dirty & /*$doc*/ 1) && t3_value !== (t3_value = (/*$doc*/ ctx[0].itemTypes.race[0]?.name || "none") + "")) set_data(t3, t3_value);
			const inputfordocumentsheet1_changes = {};

			if (!updating_value_1 && dirty & /*$doc*/ 1) {
				updating_value_1 = true;
				inputfordocumentsheet1_changes.value = /*$doc*/ ctx[0].system.health.value;
				add_flush_callback(() => updating_value_1 = false);
			}

			inputfordocumentsheet1.$set(inputfordocumentsheet1_changes);
			if ((!current || dirty & /*$doc*/ 1) && t6_value !== (t6_value = /*$doc*/ ctx[0].system.health.max + "")) set_data(t6, t6_value);
			const inputfordocumentsheet2_changes = {};

			if (!updating_value_2 && dirty & /*$doc*/ 1) {
				updating_value_2 = true;
				inputfordocumentsheet2_changes.value = /*$doc*/ ctx[0].system.advancement.xp.get;
				add_flush_callback(() => updating_value_2 = false);
			}

			inputfordocumentsheet2.$set(inputfordocumentsheet2_changes);
			if ((!current || dirty & /*$doc*/ 1) && t10_value !== (t10_value = /*$doc*/ ctx[0].system.advancement.xp.used + "")) set_data(t10, t10_value);

			if (dirty & /*Object, $doc*/ 1) {
				each_value_1 = Object.entries(/*$doc*/ ctx[0].system.attributes);
				let i;

				for (i = 0; i < each_value_1.length; i += 1) {
					const child_ctx = get_each_context_1$3(ctx, each_value_1, i);

					if (each_blocks_1[i]) {
						each_blocks_1[i].p(child_ctx, dirty);
					} else {
						each_blocks_1[i] = create_each_block_1$3(child_ctx);
						each_blocks_1[i].c();
						each_blocks_1[i].m(div9, null);
					}
				}

				for (; i < each_blocks_1.length; i += 1) {
					each_blocks_1[i].d(1);
				}

				each_blocks_1.length = each_value_1.length;
			}

			if (dirty & /*Object, $doc*/ 1) {
				each_value = Object.entries(/*$doc*/ ctx[0].system.resources);
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$6(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block$6(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(div10, null);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}

				each_blocks.length = each_value.length;
			}
		},
		i(local) {
			if (current) return;
			transition_in(imagewithfilepicker.$$.fragment, local);
			transition_in(inputfordocumentsheet0.$$.fragment, local);
			transition_in(inputfordocumentsheet1.$$.fragment, local);
			transition_in(inputfordocumentsheet2.$$.fragment, local);
			transition_in(tabs_1.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(imagewithfilepicker.$$.fragment, local);
			transition_out(inputfordocumentsheet0.$$.fragment, local);
			transition_out(inputfordocumentsheet1.$$.fragment, local);
			transition_out(inputfordocumentsheet2.$$.fragment, local);
			transition_out(tabs_1.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(header);
			destroy_component(imagewithfilepicker);
			destroy_component(inputfordocumentsheet0);
			destroy_component(inputfordocumentsheet1);
			destroy_component(inputfordocumentsheet2);
			destroy_each(each_blocks_1, detaching);
			destroy_each(each_blocks, detaching);
			if (detaching) detach(t13);
			if (detaching) detach(div12);
			destroy_component(tabs_1);
		}
	};
}

let activeTab = "attributes";

function instance$8($$self, $$props, $$invalidate) {
	let $doc;
	const doc = getContext("DocumentSheetObject");
	component_subscribe($$self, doc, value => $$invalidate(0, $doc = value));

	let tabs = [
		{
			label: "Attributes",
			id: "attributes",
			component: AttributeTab
		},
		{
			label: "Inventory",
			id: "inventory",
			component: InventoryTab
		},
		{
			label: "Features",
			id: "features",
			component: FeaturesTab
		},
		{
			label: "Spells",
			id: "spells",
			component: SpellsTab
		},
		{
			label: "Effects",
			id: "effects",
			component: EffectsTab
		},
		{
			label: "Biography",
			id: "biography",
			component: BiographyTab
		}
	];

	function inputfordocumentsheet0_value_binding(value) {
		if ($$self.$$.not_equal($doc.name, value)) {
			$doc.name = value;
			doc.set($doc);
		}
	}

	function inputfordocumentsheet1_value_binding(value) {
		if ($$self.$$.not_equal($doc.system.health.value, value)) {
			$doc.system.health.value = value;
			doc.set($doc);
		}
	}

	function inputfordocumentsheet2_value_binding(value) {
		if ($$self.$$.not_equal($doc.system.advancement.xp.get, value)) {
			$doc.system.advancement.xp.get = value;
			doc.set($doc);
		}
	}

	const click_handler = (attribute, event) => {
		event.preventDefault;
		return $doc.rollAttributeTest(attribute[0], { event });
	};

	return [
		$doc,
		doc,
		tabs,
		inputfordocumentsheet0_value_binding,
		inputfordocumentsheet1_value_binding,
		inputfordocumentsheet2_value_binding,
		click_handler
	];
}

class ActorSheet$1 extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});
	}
}

/* built\sheets\svelte\item\RaceSheet.svelte generated by Svelte v3.48.0 */

function get_each_context$5(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[6] = list[i];
	child_ctx[7] = list;
	child_ctx[8] = i;
	return child_ctx;
}

// (25:4) {#each Object.entries($doc.system.attributes) as attribute}
function create_each_block$5(ctx) {
	let div;
	let inputfordocumentsheet;
	let updating_value;
	let t;
	let current;

	function inputfordocumentsheet_value_binding(value) {
		/*inputfordocumentsheet_value_binding*/ ctx[5](value, /*attribute*/ ctx[6]);
	}

	let inputfordocumentsheet_props = {
		label: /*attribute*/ ctx[6][0],
		type: "integer"
	};

	if (/*$doc*/ ctx[0].system.attributes[/*attribute*/ ctx[6][0]] !== void 0) {
		inputfordocumentsheet_props.value = /*$doc*/ ctx[0].system.attributes[/*attribute*/ ctx[6][0]];
	}

	inputfordocumentsheet = new InputForDocumentSheet({ props: inputfordocumentsheet_props });
	binding_callbacks.push(() => bind(inputfordocumentsheet, 'value', inputfordocumentsheet_value_binding));

	return {
		c() {
			div = element("div");
			create_component(inputfordocumentsheet.$$.fragment);
			t = space();
		},
		m(target, anchor) {
			insert(target, div, anchor);
			mount_component(inputfordocumentsheet, div, null);
			append(div, t);
			current = true;
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;
			const inputfordocumentsheet_changes = {};
			if (dirty & /*$doc*/ 1) inputfordocumentsheet_changes.label = /*attribute*/ ctx[6][0];

			if (!updating_value && dirty & /*$doc, Object*/ 1) {
				updating_value = true;
				inputfordocumentsheet_changes.value = /*$doc*/ ctx[0].system.attributes[/*attribute*/ ctx[6][0]];
				add_flush_callback(() => updating_value = false);
			}

			inputfordocumentsheet.$set(inputfordocumentsheet_changes);
		},
		i(local) {
			if (current) return;
			transition_in(inputfordocumentsheet.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(inputfordocumentsheet.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div);
			destroy_component(inputfordocumentsheet);
		}
	};
}

function create_fragment$7(ctx) {
	let header;
	let imagewithfilepicker;
	let t0;
	let h1;
	let inputfordocumentsheet0;
	let updating_value;
	let t1;
	let div4;
	let div0;
	let inputfordocumentsheet1;
	let updating_value_1;
	let t2;
	let div1;
	let inputfordocumentsheet2;
	let updating_value_2;
	let t3;
	let br0;
	let t4;
	let div2;
	let t5;
	let br1;
	let t6;
	let div3;
	let current;

	imagewithfilepicker = new ImageWithFilePicker({
			props: { path: "img", alt: "item portrait" }
		});

	function inputfordocumentsheet0_value_binding(value) {
		/*inputfordocumentsheet0_value_binding*/ ctx[2](value);
	}

	let inputfordocumentsheet0_props = { label: "name" };

	if (/*$doc*/ ctx[0].name !== void 0) {
		inputfordocumentsheet0_props.value = /*$doc*/ ctx[0].name;
	}

	inputfordocumentsheet0 = new InputForDocumentSheet({ props: inputfordocumentsheet0_props });
	binding_callbacks.push(() => bind(inputfordocumentsheet0, 'value', inputfordocumentsheet0_value_binding));

	function inputfordocumentsheet1_value_binding(value) {
		/*inputfordocumentsheet1_value_binding*/ ctx[3](value);
	}

	let inputfordocumentsheet1_props = { label: "speed", type: "integer" };

	if (/*$doc*/ ctx[0].system.speed !== void 0) {
		inputfordocumentsheet1_props.value = /*$doc*/ ctx[0].system.speed;
	}

	inputfordocumentsheet1 = new InputForDocumentSheet({ props: inputfordocumentsheet1_props });
	binding_callbacks.push(() => bind(inputfordocumentsheet1, 'value', inputfordocumentsheet1_value_binding));

	function inputfordocumentsheet2_value_binding(value) {
		/*inputfordocumentsheet2_value_binding*/ ctx[4](value);
	}

	let inputfordocumentsheet2_props = { label: "health", type: "integer" };

	if (/*$doc*/ ctx[0].system.health !== void 0) {
		inputfordocumentsheet2_props.value = /*$doc*/ ctx[0].system.health;
	}

	inputfordocumentsheet2 = new InputForDocumentSheet({ props: inputfordocumentsheet2_props });
	binding_callbacks.push(() => bind(inputfordocumentsheet2, 'value', inputfordocumentsheet2_value_binding));
	let each_value = Object.entries(/*$doc*/ ctx[0].system.attributes);
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$5(get_each_context$5(ctx, each_value, i));
	}

	const out = i => transition_out(each_blocks[i], 1, 1, () => {
		each_blocks[i] = null;
	});

	return {
		c() {
			header = element("header");
			create_component(imagewithfilepicker.$$.fragment);
			t0 = space();
			h1 = element("h1");
			create_component(inputfordocumentsheet0.$$.fragment);
			t1 = space();
			div4 = element("div");
			div0 = element("div");
			create_component(inputfordocumentsheet1.$$.fragment);
			t2 = space();
			div1 = element("div");
			create_component(inputfordocumentsheet2.$$.fragment);
			t3 = space();
			br0 = element("br");
			t4 = space();
			div2 = element("div");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			t5 = space();
			br1 = element("br");
			t6 = space();
			div3 = element("div");
			attr(header, "class", "svelte-1izel0t");
			attr(div0, "class", "speed svelte-1izel0t");
			attr(div1, "class", "health svelte-1izel0t");
			attr(div2, "class", "attributes svelte-1izel0t");
			attr(div3, "class", "skills svelte-1izel0t");
			attr(div4, "class", "main svelte-1izel0t");
		},
		m(target, anchor) {
			insert(target, header, anchor);
			mount_component(imagewithfilepicker, header, null);
			append(header, t0);
			append(header, h1);
			mount_component(inputfordocumentsheet0, h1, null);
			insert(target, t1, anchor);
			insert(target, div4, anchor);
			append(div4, div0);
			mount_component(inputfordocumentsheet1, div0, null);
			append(div4, t2);
			append(div4, div1);
			mount_component(inputfordocumentsheet2, div1, null);
			append(div4, t3);
			append(div4, br0);
			append(div4, t4);
			append(div4, div2);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(div2, null);
			}

			append(div4, t5);
			append(div4, br1);
			append(div4, t6);
			append(div4, div3);
			current = true;
		},
		p(ctx, [dirty]) {
			const inputfordocumentsheet0_changes = {};

			if (!updating_value && dirty & /*$doc*/ 1) {
				updating_value = true;
				inputfordocumentsheet0_changes.value = /*$doc*/ ctx[0].name;
				add_flush_callback(() => updating_value = false);
			}

			inputfordocumentsheet0.$set(inputfordocumentsheet0_changes);
			const inputfordocumentsheet1_changes = {};

			if (!updating_value_1 && dirty & /*$doc*/ 1) {
				updating_value_1 = true;
				inputfordocumentsheet1_changes.value = /*$doc*/ ctx[0].system.speed;
				add_flush_callback(() => updating_value_1 = false);
			}

			inputfordocumentsheet1.$set(inputfordocumentsheet1_changes);
			const inputfordocumentsheet2_changes = {};

			if (!updating_value_2 && dirty & /*$doc*/ 1) {
				updating_value_2 = true;
				inputfordocumentsheet2_changes.value = /*$doc*/ ctx[0].system.health;
				add_flush_callback(() => updating_value_2 = false);
			}

			inputfordocumentsheet2.$set(inputfordocumentsheet2_changes);

			if (dirty & /*Object, $doc*/ 1) {
				each_value = Object.entries(/*$doc*/ ctx[0].system.attributes);
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$5(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
						transition_in(each_blocks[i], 1);
					} else {
						each_blocks[i] = create_each_block$5(child_ctx);
						each_blocks[i].c();
						transition_in(each_blocks[i], 1);
						each_blocks[i].m(div2, null);
					}
				}

				group_outros();

				for (i = each_value.length; i < each_blocks.length; i += 1) {
					out(i);
				}

				check_outros();
			}
		},
		i(local) {
			if (current) return;
			transition_in(imagewithfilepicker.$$.fragment, local);
			transition_in(inputfordocumentsheet0.$$.fragment, local);
			transition_in(inputfordocumentsheet1.$$.fragment, local);
			transition_in(inputfordocumentsheet2.$$.fragment, local);

			for (let i = 0; i < each_value.length; i += 1) {
				transition_in(each_blocks[i]);
			}

			current = true;
		},
		o(local) {
			transition_out(imagewithfilepicker.$$.fragment, local);
			transition_out(inputfordocumentsheet0.$$.fragment, local);
			transition_out(inputfordocumentsheet1.$$.fragment, local);
			transition_out(inputfordocumentsheet2.$$.fragment, local);
			each_blocks = each_blocks.filter(Boolean);

			for (let i = 0; i < each_blocks.length; i += 1) {
				transition_out(each_blocks[i]);
			}

			current = false;
		},
		d(detaching) {
			if (detaching) detach(header);
			destroy_component(imagewithfilepicker);
			destroy_component(inputfordocumentsheet0);
			if (detaching) detach(t1);
			if (detaching) detach(div4);
			destroy_component(inputfordocumentsheet1);
			destroy_component(inputfordocumentsheet2);
			destroy_each(each_blocks, detaching);
		}
	};
}

function instance$7($$self, $$props, $$invalidate) {
	let $doc;
	const doc = getContext("DocumentSheetObject");
	component_subscribe($$self, doc, value => $$invalidate(0, $doc = value));

	function inputfordocumentsheet0_value_binding(value) {
		if ($$self.$$.not_equal($doc.name, value)) {
			$doc.name = value;
			doc.set($doc);
		}
	}

	function inputfordocumentsheet1_value_binding(value) {
		if ($$self.$$.not_equal($doc.system.speed, value)) {
			$doc.system.speed = value;
			doc.set($doc);
		}
	}

	function inputfordocumentsheet2_value_binding(value) {
		if ($$self.$$.not_equal($doc.system.health, value)) {
			$doc.system.health = value;
			doc.set($doc);
		}
	}

	function inputfordocumentsheet_value_binding(value, attribute) {
		if ($$self.$$.not_equal($doc.system.attributes[attribute[0]], value)) {
			$doc.system.attributes[attribute[0]] = value;
			doc.set($doc);
		}
	}

	return [
		$doc,
		doc,
		inputfordocumentsheet0_value_binding,
		inputfordocumentsheet1_value_binding,
		inputfordocumentsheet2_value_binding,
		inputfordocumentsheet_value_binding
	];
}

class RaceSheet extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});
	}
}

/* built\sheets\svelte\item\FeatureSheet.svelte generated by Svelte v3.48.0 */

function get_each_context$4(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[8] = list[i];
	return child_ctx;
}

// (26:4) {#if $doc.system.level.has}
function create_if_block$2(ctx) {
	let inputfordocumentsheet0;
	let updating_value;
	let t;
	let inputfordocumentsheet1;
	let updating_value_1;
	let current;

	function inputfordocumentsheet0_value_binding(value) {
		/*inputfordocumentsheet0_value_binding*/ ctx[5](value);
	}

	let inputfordocumentsheet0_props = { type: "integer" };

	if (/*$doc*/ ctx[0].system.level.current !== void 0) {
		inputfordocumentsheet0_props.value = /*$doc*/ ctx[0].system.level.current;
	}

	inputfordocumentsheet0 = new InputForDocumentSheet({ props: inputfordocumentsheet0_props });
	binding_callbacks.push(() => bind(inputfordocumentsheet0, 'value', inputfordocumentsheet0_value_binding));

	function inputfordocumentsheet1_value_binding(value) {
		/*inputfordocumentsheet1_value_binding*/ ctx[6](value);
	}

	let inputfordocumentsheet1_props = { type: "integer" };

	if (/*$doc*/ ctx[0].system.level.max !== void 0) {
		inputfordocumentsheet1_props.value = /*$doc*/ ctx[0].system.level.max;
	}

	inputfordocumentsheet1 = new InputForDocumentSheet({ props: inputfordocumentsheet1_props });
	binding_callbacks.push(() => bind(inputfordocumentsheet1, 'value', inputfordocumentsheet1_value_binding));

	return {
		c() {
			create_component(inputfordocumentsheet0.$$.fragment);
			t = text("\r\n      /\r\n      ");
			create_component(inputfordocumentsheet1.$$.fragment);
		},
		m(target, anchor) {
			mount_component(inputfordocumentsheet0, target, anchor);
			insert(target, t, anchor);
			mount_component(inputfordocumentsheet1, target, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const inputfordocumentsheet0_changes = {};

			if (!updating_value && dirty & /*$doc*/ 1) {
				updating_value = true;
				inputfordocumentsheet0_changes.value = /*$doc*/ ctx[0].system.level.current;
				add_flush_callback(() => updating_value = false);
			}

			inputfordocumentsheet0.$set(inputfordocumentsheet0_changes);
			const inputfordocumentsheet1_changes = {};

			if (!updating_value_1 && dirty & /*$doc*/ 1) {
				updating_value_1 = true;
				inputfordocumentsheet1_changes.value = /*$doc*/ ctx[0].system.level.max;
				add_flush_callback(() => updating_value_1 = false);
			}

			inputfordocumentsheet1.$set(inputfordocumentsheet1_changes);
		},
		i(local) {
			if (current) return;
			transition_in(inputfordocumentsheet0.$$.fragment, local);
			transition_in(inputfordocumentsheet1.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(inputfordocumentsheet0.$$.fragment, local);
			transition_out(inputfordocumentsheet1.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(inputfordocumentsheet0, detaching);
			if (detaching) detach(t);
			destroy_component(inputfordocumentsheet1, detaching);
		}
	};
}

// (41:4) {#each $doc.system.actionList as action}
function create_each_block$4(ctx) {
	let div2;
	let div0;
	let t0_value = /*action*/ ctx[8].name + "";
	let t0;
	let t1;
	let div1;
	let t2;

	return {
		c() {
			div2 = element("div");
			div0 = element("div");
			t0 = text(t0_value);
			t1 = space();
			div1 = element("div");
			t2 = space();
			attr(div0, "class", "name");
			attr(div1, "class", "control");
			attr(div2, "class", "action");
		},
		m(target, anchor) {
			insert(target, div2, anchor);
			append(div2, div0);
			append(div0, t0);
			append(div2, t1);
			append(div2, div1);
			append(div2, t2);
		},
		p(ctx, dirty) {
			if (dirty & /*$doc*/ 1 && t0_value !== (t0_value = /*action*/ ctx[8].name + "")) set_data(t0, t0_value);
		},
		d(detaching) {
			if (detaching) detach(div2);
		}
	};
}

function create_fragment$6(ctx) {
	let header;
	let imagewithfilepicker;
	let t0;
	let h1;
	let inputfordocumentsheet;
	let updating_value;
	let t1;
	let main;
	let fieldset0;
	let legend0;
	let t3;
	let input;
	let t4;
	let t5;
	let fieldset1;
	let legend1;
	let t6;
	let i;
	let t7;
	let current;
	let mounted;
	let dispose;

	imagewithfilepicker = new ImageWithFilePicker({
			props: { path: "img", alt: "item portrait" }
		});

	function inputfordocumentsheet_value_binding(value) {
		/*inputfordocumentsheet_value_binding*/ ctx[2](value);
	}

	let inputfordocumentsheet_props = { label: "name" };

	if (/*$doc*/ ctx[0].name !== void 0) {
		inputfordocumentsheet_props.value = /*$doc*/ ctx[0].name;
	}

	inputfordocumentsheet = new InputForDocumentSheet({ props: inputfordocumentsheet_props });
	binding_callbacks.push(() => bind(inputfordocumentsheet, 'value', inputfordocumentsheet_value_binding));
	let if_block = /*$doc*/ ctx[0].system.level.has && create_if_block$2(ctx);
	let each_value = /*$doc*/ ctx[0].system.actionList;
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$4(get_each_context$4(ctx, each_value, i));
	}

	return {
		c() {
			header = element("header");
			create_component(imagewithfilepicker.$$.fragment);
			t0 = space();
			h1 = element("h1");
			create_component(inputfordocumentsheet.$$.fragment);
			t1 = space();
			main = element("main");
			fieldset0 = element("fieldset");
			legend0 = element("legend");
			legend0.textContent = "Level";
			t3 = space();
			input = element("input");
			t4 = space();
			if (if_block) if_block.c();
			t5 = space();
			fieldset1 = element("fieldset");
			legend1 = element("legend");
			t6 = text("Actions ");
			i = element("i");
			t7 = space();

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			attr(header, "class", "svelte-zqww4b");
			attr(input, "type", "checkbox");
			attr(i, "class", "fa-solid fa-file-plus");
		},
		m(target, anchor) {
			insert(target, header, anchor);
			mount_component(imagewithfilepicker, header, null);
			append(header, t0);
			append(header, h1);
			mount_component(inputfordocumentsheet, h1, null);
			insert(target, t1, anchor);
			insert(target, main, anchor);
			append(main, fieldset0);
			append(fieldset0, legend0);
			append(fieldset0, t3);
			append(fieldset0, input);
			input.checked = /*$doc*/ ctx[0].system.level.has;
			append(fieldset0, t4);
			if (if_block) if_block.m(fieldset0, null);
			append(main, t5);
			append(main, fieldset1);
			append(fieldset1, legend1);
			append(legend1, t6);
			append(legend1, i);
			append(fieldset1, t7);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(fieldset1, null);
			}

			current = true;

			if (!mounted) {
				dispose = [
					listen(input, "change", /*input_change_handler*/ ctx[3]),
					listen(input, "change", /*change_handler*/ ctx[4]),
					listen(i, "click", /*click_handler*/ ctx[7])
				];

				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			const inputfordocumentsheet_changes = {};

			if (!updating_value && dirty & /*$doc*/ 1) {
				updating_value = true;
				inputfordocumentsheet_changes.value = /*$doc*/ ctx[0].name;
				add_flush_callback(() => updating_value = false);
			}

			inputfordocumentsheet.$set(inputfordocumentsheet_changes);

			if (dirty & /*$doc*/ 1) {
				input.checked = /*$doc*/ ctx[0].system.level.has;
			}

			if (/*$doc*/ ctx[0].system.level.has) {
				if (if_block) {
					if_block.p(ctx, dirty);

					if (dirty & /*$doc*/ 1) {
						transition_in(if_block, 1);
					}
				} else {
					if_block = create_if_block$2(ctx);
					if_block.c();
					transition_in(if_block, 1);
					if_block.m(fieldset0, null);
				}
			} else if (if_block) {
				group_outros();

				transition_out(if_block, 1, 1, () => {
					if_block = null;
				});

				check_outros();
			}

			if (dirty & /*$doc*/ 1) {
				each_value = /*$doc*/ ctx[0].system.actionList;
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$4(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block$4(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(fieldset1, null);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}

				each_blocks.length = each_value.length;
			}
		},
		i(local) {
			if (current) return;
			transition_in(imagewithfilepicker.$$.fragment, local);
			transition_in(inputfordocumentsheet.$$.fragment, local);
			transition_in(if_block);
			current = true;
		},
		o(local) {
			transition_out(imagewithfilepicker.$$.fragment, local);
			transition_out(inputfordocumentsheet.$$.fragment, local);
			transition_out(if_block);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(header);
			destroy_component(imagewithfilepicker);
			destroy_component(inputfordocumentsheet);
			if (detaching) detach(t1);
			if (detaching) detach(main);
			if (if_block) if_block.d();
			destroy_each(each_blocks, detaching);
			mounted = false;
			run_all(dispose);
		}
	};
}

function instance$6($$self, $$props, $$invalidate) {
	let $doc;
	const doc = getContext("DocumentSheetObject");
	component_subscribe($$self, doc, value => $$invalidate(0, $doc = value));

	function inputfordocumentsheet_value_binding(value) {
		if ($$self.$$.not_equal($doc.name, value)) {
			$doc.name = value;
			doc.set($doc);
		}
	}

	function input_change_handler() {
		$doc.system.level.has = this.checked;
		doc.set($doc);
	}

	const change_handler = () => {
		$doc.update({ system: $doc.system });
	};

	function inputfordocumentsheet0_value_binding(value) {
		if ($$self.$$.not_equal($doc.system.level.current, value)) {
			$doc.system.level.current = value;
			doc.set($doc);
		}
	}

	function inputfordocumentsheet1_value_binding(value) {
		if ($$self.$$.not_equal($doc.system.level.max, value)) {
			$doc.system.level.max = value;
			doc.set($doc);
		}
	}

	const click_handler = () => {
		$doc.addAction();
	};

	return [
		$doc,
		doc,
		inputfordocumentsheet_value_binding,
		input_change_handler,
		change_handler,
		inputfordocumentsheet0_value_binding,
		inputfordocumentsheet1_value_binding,
		click_handler
	];
}

class FeatureSheet extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});
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
/**
 * Class for defining and extracting svelte templates for actor/item types
 */

class DocTemplate {
  static delete(type) {
    return _classStaticPrivateFieldSpecGet(this, DocTemplate, _map).delete(type);
  }

  static get(doc) {
    const component = _classStaticPrivateFieldSpecGet(this, DocTemplate, _map).get(doc === null || doc === void 0 ? void 0 : doc.type);

    return component ? component : EmptySheet;
  }

  static getByType(type) {
    const component = _classStaticPrivateFieldSpecGet(this, DocTemplate, _map).get(type);

    console.log(type);
    return component ? component : EmptySheet;
  }

  static set(type, component) {
    _classStaticPrivateFieldSpecGet(this, DocTemplate, _map).set(type, component);
  }

} //set your components

var _map = {
  writable: true,
  value: new Map()
};
const setSvelteComponents = () => {
  DocTemplate.set("item", ItemItemSheet);
  DocTemplate.set("character", ActorSheet$1);
  DocTemplate.set("race", RaceSheet);
  DocTemplate.set("feature", FeatureSheet);
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
    console.log('socket data', data);
    console.log('Socket Called, its GM:', game.user.isGM, ' and its active: ', game.user.active);
    if (!game.user.isGM) return; // if the logged in user is the active GM with the lowest user id

    const isResponsibleGM = game.users.filter(user => user.isGM && user.active).some(other => other.data._id <= game.user.data._id);
    if (!isResponsibleGM) return;
    console.log('HERE GM ON SOCKET CALLING');
    const token = await fromUuid(data.tokenId);
    const actor = token === null || token === void 0 ? void 0 : token.actor; //@ts-expect-error

    if (actor) await actor.update(data.update);
  }

}

/* built\general svelte components\SettingsSubmitButton.svelte generated by Svelte v3.48.0 */

function create_fragment$5(ctx) {
	let button;
	let mounted;
	let dispose;

	return {
		c() {
			button = element("button");
			button.textContent = "Submit";
			attr(button, "class", "submit svelte-1tfoq8h");
		},
		m(target, anchor) {
			insert(target, button, anchor);

			if (!mounted) {
				dispose = listen(button, "click", /*click_handler*/ ctx[2]);
				mounted = true;
			}
		},
		p: noop,
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(button);
			mounted = false;
			dispose();
		}
	};
}

function SubmitSetting(setting, data) {
	game.settings.set("ard20", setting, data);
}

function instance$5($$self, $$props, $$invalidate) {
	let { setting } = $$props;
	let { data } = $$props;
	const click_handler = () => SubmitSetting(setting, data);

	$$self.$$set = $$props => {
		if ('setting' in $$props) $$invalidate(0, setting = $$props.setting);
		if ('data' in $$props) $$invalidate(1, data = $$props.data);
	};

	return [setting, data, click_handler];
}

class SettingsSubmitButton extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$5, create_fragment$5, safe_not_equal, { setting: 0, data: 1 });
	}
}

/* built\settings\advancement-rate\advancement-rate-shell.svelte generated by Svelte v3.48.0 */

function get_each_context$3(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[17] = list[i];
	child_ctx[18] = list;
	child_ctx[19] = i;
	return child_ctx;
}

function get_each_context_1$2(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[20] = list[i];
	child_ctx[21] = list;
	child_ctx[22] = i;
	return child_ctx;
}

// (117:8) {#each Object.values(data.variables) as variable}
function create_each_block_1$2(ctx) {
	let label;
	let t0_value = /*variable*/ ctx[20].longName + "";
	let t0;
	let label_for_value;
	let t1;
	let input;
	let mounted;
	let dispose;

	function input_input_handler() {
		/*input_input_handler*/ ctx[8].call(input, /*each_value_1*/ ctx[21], /*variable_index*/ ctx[22]);
	}

	return {
		c() {
			label = element("label");
			t0 = text(t0_value);
			t1 = space();
			input = element("input");
			attr(label, "for", label_for_value = /*variable*/ ctx[20].longName);
			attr(input, "placeholder", "shortName");
		},
		m(target, anchor) {
			insert(target, label, anchor);
			append(label, t0);
			insert(target, t1, anchor);
			insert(target, input, anchor);
			set_input_value(input, /*variable*/ ctx[20].shortName);

			if (!mounted) {
				dispose = listen(input, "input", input_input_handler);
				mounted = true;
			}
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;
			if (dirty & /*Object, data*/ 2 && t0_value !== (t0_value = /*variable*/ ctx[20].longName + "")) set_data(t0, t0_value);

			if (dirty & /*Object, data*/ 2 && label_for_value !== (label_for_value = /*variable*/ ctx[20].longName)) {
				attr(label, "for", label_for_value);
			}

			if (dirty & /*Object, data*/ 2 && input.value !== /*variable*/ ctx[20].shortName) {
				set_input_value(input, /*variable*/ ctx[20].shortName);
			}
		},
		d(detaching) {
			if (detaching) detach(label);
			if (detaching) detach(t1);
			if (detaching) detach(input);
			mounted = false;
			dispose();
		}
	};
}

// (149:10) {#if formulaSet[param].check}
function create_if_block$1(ctx) {
	let div;
	let t0;
	let t1_value = [.../*formulaSet*/ ctx[2][/*param*/ ctx[17]].set].join(", ") + "";
	let t1;

	return {
		c() {
			div = element("div");
			t0 = text("there is no such variable as ");
			t1 = text(t1_value);
			set_style(div, "color", "red");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			append(div, t0);
			append(div, t1);
		},
		p(ctx, dirty) {
			if (dirty & /*formulaSet*/ 4 && t1_value !== (t1_value = [.../*formulaSet*/ ctx[2][/*param*/ ctx[17]].set].join(", ") + "")) set_data(t1, t1_value);
		},
		d(detaching) {
			if (detaching) detach(div);
		}
	};
}

// (124:6) {#each paramArr as param}
function create_each_block$3(ctx) {
	let div1;
	let label;
	let t1;
	let input;
	let param = /*param*/ ctx[17];
	let t2;
	let div0;
	let raw_value = /*formulaSpan*/ ctx[5][/*param*/ ctx[17]] + "";
	let t3;
	let t4;
	let br;
	let mounted;
	let dispose;

	function input_handler() {
		return /*input_handler*/ ctx[9](/*param*/ ctx[17]);
	}

	const assign_input = () => /*input_binding*/ ctx[10](input, param);
	const unassign_input = () => /*input_binding*/ ctx[10](null, param);

	function input_input_handler_1() {
		/*input_input_handler_1*/ ctx[11].call(input, /*param*/ ctx[17]);
	}

	const assign_div0 = () => /*div0_binding*/ ctx[12](div0, param);
	const unassign_div0 = () => /*div0_binding*/ ctx[12](null, param);
	let if_block = /*formulaSet*/ ctx[2][/*param*/ ctx[17]].check && create_if_block$1(ctx);

	return {
		c() {
			div1 = element("div");
			label = element("label");
			label.textContent = "Attribute Advancement Formula";
			t1 = space();
			input = element("input");
			t2 = space();
			div0 = element("div");
			t3 = space();
			if (if_block) if_block.c();
			t4 = space();
			br = element("br");
			attr(label, "for", "Attribute Formula");
			attr(input, "class", "transparent svelte-1bqd4zz");
			attr(input, "type", "text");
			attr(div0, "class", "span svelte-1bqd4zz");
		},
		m(target, anchor) {
			insert(target, div1, anchor);
			append(div1, label);
			append(div1, t1);
			append(div1, input);
			assign_input();
			set_input_value(input, /*data*/ ctx[1].formulas[/*param*/ ctx[17]]);
			append(div1, t2);
			append(div1, div0);
			div0.innerHTML = raw_value;
			assign_div0();
			append(div1, t3);
			if (if_block) if_block.m(div1, null);
			insert(target, t4, anchor);
			insert(target, br, anchor);

			if (!mounted) {
				dispose = [
					listen(input, "input", input_handler),
					listen(input, "input", input_input_handler_1),
					listen(div0, "click", click_handler),
					listen(div0, "dblclick", dblclick_handler)
				];

				mounted = true;
			}
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;

			if (param !== /*param*/ ctx[17]) {
				unassign_input();
				param = /*param*/ ctx[17];
				assign_input();
			}

			if (dirty & /*data, paramArr*/ 66 && input.value !== /*data*/ ctx[1].formulas[/*param*/ ctx[17]]) {
				set_input_value(input, /*data*/ ctx[1].formulas[/*param*/ ctx[17]]);
			}

			if (dirty & /*formulaSpan*/ 32 && raw_value !== (raw_value = /*formulaSpan*/ ctx[5][/*param*/ ctx[17]] + "")) div0.innerHTML = raw_value;
			if (param !== /*param*/ ctx[17]) {
				unassign_div0();
				param = /*param*/ ctx[17];
				assign_div0();
			}

			if (/*formulaSet*/ ctx[2][/*param*/ ctx[17]].check) {
				if (if_block) {
					if_block.p(ctx, dirty);
				} else {
					if_block = create_if_block$1(ctx);
					if_block.c();
					if_block.m(div1, null);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}
		},
		d(detaching) {
			if (detaching) detach(div1);
			unassign_input();
			unassign_div0();
			if (if_block) if_block.d();
			if (detaching) detach(t4);
			if (detaching) detach(br);
			mounted = false;
			run_all(dispose);
		}
	};
}

// (112:0) <ApplicationShell bind:elementRoot>
function create_default_slot$4(ctx) {
	let div3;
	let div1;
	let label;
	let t1;
	let div0;
	let t2;
	let div2;
	let t3;
	let settingssubmitbutton;
	let current;
	let each_value_1 = Object.values(/*data*/ ctx[1].variables);
	let each_blocks_1 = [];

	for (let i = 0; i < each_value_1.length; i += 1) {
		each_blocks_1[i] = create_each_block_1$2(get_each_context_1$2(ctx, each_value_1, i));
	}

	let each_value = /*paramArr*/ ctx[6];
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
	}

	settingssubmitbutton = new SettingsSubmitButton({
			props: { setting: setting$3, data: /*data*/ ctx[1] }
		});

	return {
		c() {
			div3 = element("div");
			div1 = element("div");
			label = element("label");
			label.textContent = "CustomValues";
			t1 = space();
			div0 = element("div");

			for (let i = 0; i < each_blocks_1.length; i += 1) {
				each_blocks_1[i].c();
			}

			t2 = space();
			div2 = element("div");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			t3 = space();
			create_component(settingssubmitbutton.$$.fragment);
			attr(label, "for", "Custom Values");
			attr(div0, "class", "grid grid-2col");
			attr(div2, "class", "formula");
		},
		m(target, anchor) {
			insert(target, div3, anchor);
			append(div3, div1);
			append(div1, label);
			append(div1, t1);
			append(div1, div0);

			for (let i = 0; i < each_blocks_1.length; i += 1) {
				each_blocks_1[i].m(div0, null);
			}

			append(div3, t2);
			append(div3, div2);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(div2, null);
			}

			append(div3, t3);
			mount_component(settingssubmitbutton, div3, null);
			current = true;
		},
		p(ctx, dirty) {
			if (dirty & /*Object, data*/ 2) {
				each_value_1 = Object.values(/*data*/ ctx[1].variables);
				let i;

				for (i = 0; i < each_value_1.length; i += 1) {
					const child_ctx = get_each_context_1$2(ctx, each_value_1, i);

					if (each_blocks_1[i]) {
						each_blocks_1[i].p(child_ctx, dirty);
					} else {
						each_blocks_1[i] = create_each_block_1$2(child_ctx);
						each_blocks_1[i].c();
						each_blocks_1[i].m(div0, null);
					}
				}

				for (; i < each_blocks_1.length; i += 1) {
					each_blocks_1[i].d(1);
				}

				each_blocks_1.length = each_value_1.length;
			}

			if (dirty & /*formulaSet, paramArr, spanDiv, formulaSpan, formulaInput, data, validateInput*/ 254) {
				each_value = /*paramArr*/ ctx[6];
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$3(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block$3(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(div2, null);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}

				each_blocks.length = each_value.length;
			}

			const settingssubmitbutton_changes = {};
			if (dirty & /*data*/ 2) settingssubmitbutton_changes.data = /*data*/ ctx[1];
			settingssubmitbutton.$set(settingssubmitbutton_changes);
		},
		i(local) {
			if (current) return;
			transition_in(settingssubmitbutton.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(settingssubmitbutton.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div3);
			destroy_each(each_blocks_1, detaching);
			destroy_each(each_blocks, detaching);
			destroy_component(settingssubmitbutton);
		}
	};
}

function create_fragment$4(ctx) {
	let applicationshell;
	let updating_elementRoot;
	let current;

	function applicationshell_elementRoot_binding(value) {
		/*applicationshell_elementRoot_binding*/ ctx[13](value);
	}

	let applicationshell_props = {
		$$slots: { default: [create_default_slot$4] },
		$$scope: { ctx }
	};

	if (/*elementRoot*/ ctx[0] !== void 0) {
		applicationshell_props.elementRoot = /*elementRoot*/ ctx[0];
	}

	applicationshell = new ApplicationShell({ props: applicationshell_props });
	binding_callbacks.push(() => bind(applicationshell, 'elementRoot', applicationshell_elementRoot_binding));

	return {
		c() {
			create_component(applicationshell.$$.fragment);
		},
		m(target, anchor) {
			mount_component(applicationshell, target, anchor);
			current = true;
		},
		p(ctx, [dirty]) {
			const applicationshell_changes = {};

			if (dirty & /*$$scope, data, formulaSet, spanDiv, formulaSpan, formulaInput, Object*/ 8388670) {
				applicationshell_changes.$$scope = { dirty, ctx };
			}

			if (!updating_elementRoot && dirty & /*elementRoot*/ 1) {
				updating_elementRoot = true;
				applicationshell_changes.elementRoot = /*elementRoot*/ ctx[0];
				add_flush_callback(() => updating_elementRoot = false);
			}

			applicationshell.$set(applicationshell_changes);
		},
		i(local) {
			if (current) return;
			transition_in(applicationshell.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(applicationshell.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(applicationshell, detaching);
		}
	};
}

const setting$3 = "advancement-rate"; //name of setting

/**
 * Replace part of string at given index
 * @param {string} str - String
 * @param {number} index  - chosen start index
 * @param {string} replacement - string which replaces old one
 * @param {number} endLength - chosen end index
 */
function replaceStrAt(str, index, replacement, endLength) {
	if (index >= str.length) {
		return str.valueOf();
	}

	return str.substring(0, index) + replacement + str.substring(index + endLength);
}

const click_handler = e => {
	e.target.previousElementSibling.focus();
};

const dblclick_handler = e => {
	e.target.previousElementSibling.focus();
	e.target.previousElementSibling.select();
};

function instance$4($$self, $$props, $$invalidate) {
	let { elementRoot } = $$props;
	let data = game.settings.get("ard20", setting$3); //get setting
	let funcList = Object.getOwnPropertyNames(math); //get all possible functions from math.js library

	//create several Sets where we will store wrong variables
	let formulaSet = {};

	let spanDiv = {};
	let formulaInput = {};
	let formulaSpan = {};

	//creaet list of parameters
	let paramArr = ["attributes", "skills", "features"];

	for (let item of paramArr) {
		spanDiv[item] = "";
		formulaSet[item] = { set: new Set(), check: false };
		formulaInput[item] = "";
		formulaSpan[item] = data.formulas[item];
	}

	//set position for divs with span
	onMount(async () => {
		for (let param of paramArr) {
			console.log(data.formulas[param], param);
			await validateInput(data.formulas[param], param);
		}
	});

	/**
 * Check string for wrong things
 * @param {string} val - original input
 * @param {string} type - can be "attributes", "skills" or "features"
 */
	async function validateInput(val, type) {
		console.log(val, type, "ValidateInput function");
		$$invalidate(5, formulaSpan[type] = val, formulaSpan);
		let ind = 0; //starting index

		//create an array of variables/functions in formula field and their indexes
		let checkArr = val.split(/[-./+\*,^\s\(\)]+/).map(item => {
			return { name: item, index: 0 };
		});

		for (let item of checkArr) {
			item.index = val.indexOf(item.name, ind);
			ind = item.index + 1;
		}

		formulaSet[type].set.clear();

		for (let item of checkArr) {
			if (item.name !== "" && isNaN(item.name)) {
				let check = !funcList.includes(item.name);

				if (check) {
					formulaSet[type].set.add(item.name);

					//get last index of changed word
					let lastSpan = formulaSpan[type].lastIndexOf("</span>") > 0
					? formulaSpan[type].lastIndexOf("</span>") + 8
					: -1;

					//get new index of word
					let wordLastIndex = item.index + formulaSpan[type].length - val.length;

					$$invalidate(5, formulaSpan[type] = replaceStrAt(formulaSpan[type], Math.max(lastSpan, wordLastIndex), `<span style="color:red">${item.name}</span>`, item.name.length), formulaSpan);
				}
			}
		}

		$$invalidate(2, formulaSet[type].check = formulaSet[type].set.size > 0, formulaSet);
		await tick();
		changeDivPosition();
	}

	function changeDivPosition() {
		for (let elem of elementRoot.querySelectorAll("input.transparent")) {
			let div = elem.nextElementSibling.style;
			div.margin = getComputedStyle(elem).margin;
			div.padding = getComputedStyle(elem).padding;
			div.left = Math.ceil(elem.offsetLeft * 1.01) + "px";
			div.top = Math.ceil(elem.offsetTop * 1.01) + "px";
			div.border = getComputedStyle(elem).border;
			div["border-color"] = "transparent";
			console.log(div.top, div.left);
		}
	}

	function input_input_handler(each_value_1, variable_index) {
		each_value_1[variable_index].shortName = this.value;
		$$invalidate(1, data);
	}

	const input_handler = param => {
		validateInput(formulaInput[param].value, param);
	};

	function input_binding($$value, param) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			formulaInput[param] = $$value;
			$$invalidate(4, formulaInput);
		});
	}

	function input_input_handler_1(param) {
		data.formulas[param] = this.value;
		$$invalidate(1, data);
	}

	function div0_binding($$value, param) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			spanDiv[param] = $$value;
			$$invalidate(3, spanDiv);
		});
	}

	function applicationshell_elementRoot_binding(value) {
		elementRoot = value;
		$$invalidate(0, elementRoot);
	}

	$$self.$$set = $$props => {
		if ('elementRoot' in $$props) $$invalidate(0, elementRoot = $$props.elementRoot);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*Object, data*/ 2) {
			//add to funcList variables
			{
				for (let item of Object.values(data.variables)) {
					funcList.push(item.shortName);
				}
			}
		}
	};

	return [
		elementRoot,
		data,
		formulaSet,
		spanDiv,
		formulaInput,
		formulaSpan,
		paramArr,
		validateInput,
		input_input_handler,
		input_handler,
		input_binding,
		input_input_handler_1,
		div0_binding,
		applicationshell_elementRoot_binding
	];
}

class Advancement_rate_shell extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$4, create_fragment$4, safe_not_equal, { elementRoot: 0 });
	}

	get elementRoot() {
		return this.$$.ctx[0];
	}

	set elementRoot(elementRoot) {
		this.$$set({ elementRoot });
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
      minimizable: true,
      resizable: true,
      width: 600,
      height: 600,
      svelte: {
        class: Advancement_rate_shell,
        target: document.body
      }
    });
  }

}

/* built\settings\FeatSetting\featSetting-shell.svelte generated by Svelte v3.48.0 */

function get_each_context$2(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[12] = list[i];
	child_ctx[13] = list;
	child_ctx[14] = i;
	return child_ctx;
}

function get_each_context_1$1(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[15] = list[i];
	child_ctx[16] = list;
	child_ctx[17] = i;
	return child_ctx;
}

// (38:6) {#each data.packs as pack (pack.id)}
function create_each_block_1$1(key_1, ctx) {
	let div;
	let input;
	let t;
	let button;
	let mounted;
	let dispose;

	function input_input_handler() {
		/*input_input_handler*/ ctx[4].call(input, /*each_value_1*/ ctx[16], /*pack_index*/ ctx[17]);
	}

	function click_handler() {
		return /*click_handler*/ ctx[5](/*pack*/ ctx[15]);
	}

	return {
		key: key_1,
		first: null,
		c() {
			div = element("div");
			input = element("input");
			t = space();
			button = element("button");
			attr(input, "type", "text");
			attr(button, "class", "minus far fa-minus-square");
			attr(div, "class", "grid grid-2col");
			this.first = div;
		},
		m(target, anchor) {
			insert(target, div, anchor);
			append(div, input);
			set_input_value(input, /*pack*/ ctx[15].name);
			append(div, t);
			append(div, button);

			if (!mounted) {
				dispose = [
					listen(input, "input", input_input_handler),
					listen(button, "click", click_handler)
				];

				mounted = true;
			}
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;

			if (dirty & /*data*/ 2 && input.value !== /*pack*/ ctx[15].name) {
				set_input_value(input, /*pack*/ ctx[15].name);
			}
		},
		d(detaching) {
			if (detaching) detach(div);
			mounted = false;
			run_all(dispose);
		}
	};
}

// (47:6) {#each data.folders as folder (folder.id)}
function create_each_block$2(key_1, ctx) {
	let div;
	let input;
	let t;
	let button;
	let mounted;
	let dispose;

	function input_input_handler_1() {
		/*input_input_handler_1*/ ctx[7].call(input, /*each_value*/ ctx[13], /*folder_index*/ ctx[14]);
	}

	function click_handler_2() {
		return /*click_handler_2*/ ctx[8](/*folder*/ ctx[12]);
	}

	return {
		key: key_1,
		first: null,
		c() {
			div = element("div");
			input = element("input");
			t = space();
			button = element("button");
			attr(input, "type", "text");
			attr(button, "class", "minus far fa-minus-square");
			attr(div, "class", "grid grid-2col");
			this.first = div;
		},
		m(target, anchor) {
			insert(target, div, anchor);
			append(div, input);
			set_input_value(input, /*folder*/ ctx[12].name);
			append(div, t);
			append(div, button);

			if (!mounted) {
				dispose = [
					listen(input, "input", input_input_handler_1),
					listen(button, "click", click_handler_2)
				];

				mounted = true;
			}
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;

			if (dirty & /*data*/ 2 && input.value !== /*folder*/ ctx[12].name) {
				set_input_value(input, /*folder*/ ctx[12].name);
			}
		},
		d(detaching) {
			if (detaching) detach(div);
			mounted = false;
			run_all(dispose);
		}
	};
}

// (34:0) <ApplicationShell bind:elementRoot>
function create_default_slot$3(ctx) {
	let section;
	let div;
	let t0;
	let each_blocks_1 = [];
	let each0_lookup = new Map();
	let t1;
	let button0;
	let t2;
	let hr;
	let t3;
	let each_blocks = [];
	let each1_lookup = new Map();
	let t4;
	let button1;
	let t5;
	let settingssubmitbutton;
	let current;
	let mounted;
	let dispose;
	let each_value_1 = /*data*/ ctx[1].packs;
	const get_key = ctx => /*pack*/ ctx[15].id;

	for (let i = 0; i < each_value_1.length; i += 1) {
		let child_ctx = get_each_context_1$1(ctx, each_value_1, i);
		let key = get_key(child_ctx);
		each0_lookup.set(key, each_blocks_1[i] = create_each_block_1$1(key, child_ctx));
	}

	let each_value = /*data*/ ctx[1].folders;
	const get_key_1 = ctx => /*folder*/ ctx[12].id;

	for (let i = 0; i < each_value.length; i += 1) {
		let child_ctx = get_each_context$2(ctx, each_value, i);
		let key = get_key_1(child_ctx);
		each1_lookup.set(key, each_blocks[i] = create_each_block$2(key, child_ctx));
	}

	settingssubmitbutton = new SettingsSubmitButton({
			props: { setting: setting$2, data: /*data*/ ctx[1] }
		});

	return {
		c() {
			section = element("section");
			div = element("div");
			t0 = text("packs\r\n      ");

			for (let i = 0; i < each_blocks_1.length; i += 1) {
				each_blocks_1[i].c();
			}

			t1 = space();
			button0 = element("button");
			t2 = space();
			hr = element("hr");
			t3 = text("\r\n      folders\r\n      ");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			t4 = space();
			button1 = element("button");
			t5 = space();
			create_component(settingssubmitbutton.$$.fragment);
			attr(button0, "class", "add far fa-plus-square");
			attr(button1, "class", "add far fa-plus-square");
			attr(div, "class", "flexcol");
			attr(section, "class", "sheet-body");
		},
		m(target, anchor) {
			insert(target, section, anchor);
			append(section, div);
			append(div, t0);

			for (let i = 0; i < each_blocks_1.length; i += 1) {
				each_blocks_1[i].m(div, null);
			}

			append(div, t1);
			append(div, button0);
			append(div, t2);
			append(div, hr);
			append(div, t3);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(div, null);
			}

			append(div, t4);
			append(div, button1);
			insert(target, t5, anchor);
			mount_component(settingssubmitbutton, target, anchor);
			current = true;

			if (!mounted) {
				dispose = [
					listen(button0, "click", /*click_handler_1*/ ctx[6]),
					listen(button1, "click", /*click_handler_3*/ ctx[9])
				];

				mounted = true;
			}
		},
		p(ctx, dirty) {
			if (dirty & /*deleteEntry, data*/ 10) {
				each_value_1 = /*data*/ ctx[1].packs;
				each_blocks_1 = update_keyed_each(each_blocks_1, dirty, get_key, 1, ctx, each_value_1, each0_lookup, div, destroy_block, create_each_block_1$1, t1, get_each_context_1$1);
			}

			if (dirty & /*deleteEntry, data*/ 10) {
				each_value = /*data*/ ctx[1].folders;
				each_blocks = update_keyed_each(each_blocks, dirty, get_key_1, 1, ctx, each_value, each1_lookup, div, destroy_block, create_each_block$2, t4, get_each_context$2);
			}

			const settingssubmitbutton_changes = {};
			if (dirty & /*data*/ 2) settingssubmitbutton_changes.data = /*data*/ ctx[1];
			settingssubmitbutton.$set(settingssubmitbutton_changes);
		},
		i(local) {
			if (current) return;
			transition_in(settingssubmitbutton.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(settingssubmitbutton.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(section);

			for (let i = 0; i < each_blocks_1.length; i += 1) {
				each_blocks_1[i].d();
			}

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].d();
			}

			if (detaching) detach(t5);
			destroy_component(settingssubmitbutton, detaching);
			mounted = false;
			run_all(dispose);
		}
	};
}

function create_fragment$3(ctx) {
	let applicationshell;
	let updating_elementRoot;
	let current;

	function applicationshell_elementRoot_binding(value) {
		/*applicationshell_elementRoot_binding*/ ctx[10](value);
	}

	let applicationshell_props = {
		$$slots: { default: [create_default_slot$3] },
		$$scope: { ctx }
	};

	if (/*elementRoot*/ ctx[0] !== void 0) {
		applicationshell_props.elementRoot = /*elementRoot*/ ctx[0];
	}

	applicationshell = new ApplicationShell({ props: applicationshell_props });
	binding_callbacks.push(() => bind(applicationshell, 'elementRoot', applicationshell_elementRoot_binding));

	return {
		c() {
			create_component(applicationshell.$$.fragment);
		},
		m(target, anchor) {
			mount_component(applicationshell, target, anchor);
			current = true;
		},
		p(ctx, [dirty]) {
			const applicationshell_changes = {};

			if (dirty & /*$$scope, data*/ 262146) {
				applicationshell_changes.$$scope = { dirty, ctx };
			}

			if (!updating_elementRoot && dirty & /*elementRoot*/ 1) {
				updating_elementRoot = true;
				applicationshell_changes.elementRoot = /*elementRoot*/ ctx[0];
				add_flush_callback(() => updating_elementRoot = false);
			}

			applicationshell.$set(applicationshell_changes);
		},
		i(local) {
			if (current) return;
			transition_in(applicationshell.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(applicationshell.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(applicationshell, detaching);
		}
	};
}

const setting$2 = "feat";

function instance$3($$self, $$props, $$invalidate) {
	let { elementRoot } = $$props;
	let { data = game.settings.get("ard20", "feat") } = $$props;
	console.log(data);

	function addEntry(type) {
		const name = `New ${type}`.slice(0, -1);
		const id = uuidv4();
		$$invalidate(1, data[type] = [...data[type], { name, id }], data);
		console.log(data);
		$$invalidate(1, data);
	}

	function deleteEntry(type, id) {
		console.log(type);
		const index = data[type].findIndex(entry => entry.id === id);

		if (index >= 0) {
			console.log(data[type]);
			data[type].splice(index, 1);
			$$invalidate(1, data);
		}
	}

	function input_input_handler(each_value_1, pack_index) {
		each_value_1[pack_index].name = this.value;
		$$invalidate(1, data);
	}

	const click_handler = pack => deleteEntry("packs", pack.id);
	const click_handler_1 = () => addEntry("packs");

	function input_input_handler_1(each_value, folder_index) {
		each_value[folder_index].name = this.value;
		$$invalidate(1, data);
	}

	const click_handler_2 = folder => deleteEntry("folders", folder.id);
	const click_handler_3 = () => addEntry("folders");

	function applicationshell_elementRoot_binding(value) {
		elementRoot = value;
		$$invalidate(0, elementRoot);
	}

	$$self.$$set = $$props => {
		if ('elementRoot' in $$props) $$invalidate(0, elementRoot = $$props.elementRoot);
		if ('data' in $$props) $$invalidate(1, data = $$props.data);
	};

	return [
		elementRoot,
		data,
		addEntry,
		deleteEntry,
		input_input_handler,
		click_handler,
		click_handler_1,
		input_input_handler_1,
		click_handler_2,
		click_handler_3,
		applicationshell_elementRoot_binding
	];
}

class FeatSetting_shell extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$3, create_fragment$3, safe_not_equal, { elementRoot: 0, data: 1 });
	}

	get elementRoot() {
		return this.$$.ctx[0];
	}

	set elementRoot(elementRoot) {
		this.$$set({ elementRoot });
		flush();
	}

	get data() {
		return this.$$.ctx[1];
	}

	set data(data) {
		this.$$set({ data });
		flush();
	}
}

class FeatSettingsShim extends FormApplication {
  /**
   * @inheritDoc
   */
  constructor(options = {}) {
    super({}, options);
    new FeatSetting().render(true, {
      focus: true
    });
  }

  async _updateObject(event, formData) {}

  render() {
    this.close();
  }

}

class FeatSetting extends SvelteApplication {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["ard20"],
      title: "Folders and Packs with Features",
      minimizable: true,
      resizable: true,
      width: 400,
      height: 600,
      svelte: {
        class: FeatSetting_shell,
        target: document.body
      }
    });
  }

}

/* built\settings\ProfSetting\profSetting-shell.svelte generated by Svelte v3.48.0 */

function get_each_context$1(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[21] = list[i];
	return child_ctx;
}

function get_each_context_1(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[24] = list[i];
	child_ctx[25] = list;
	child_ctx[26] = i;
	return child_ctx;
}

function get_each_context_2(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[27] = list[i];
	return child_ctx;
}

function get_each_context_3(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[21] = list[i];
	return child_ctx;
}

// (67:4) {#each Object.values(data) as item}
function create_each_block_3(ctx) {
	let li;
	let span;
	let t0_value = /*item*/ ctx[21].label + "";
	let t0;
	let t1;
	let li_class_value;
	let mounted;
	let dispose;

	return {
		c() {
			li = element("li");
			span = element("span");
			t0 = text(t0_value);
			t1 = space();
			attr(span, "class", "svelte-11ce50k");

			attr(li, "class", li_class_value = "" + (null_to_empty(/*activeTabValue*/ ctx[2] === /*item*/ ctx[21].id
			? "active"
			: "") + " svelte-11ce50k"));
		},
		m(target, anchor) {
			insert(target, li, anchor);
			append(li, span);
			append(span, t0);
			append(li, t1);

			if (!mounted) {
				dispose = listen(span, "click", function () {
					if (is_function(/*handleClick*/ ctx[9](/*item*/ ctx[21].id))) /*handleClick*/ ctx[9](/*item*/ ctx[21].id).apply(this, arguments);
				});

				mounted = true;
			}
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;
			if (dirty[0] & /*data*/ 2 && t0_value !== (t0_value = /*item*/ ctx[21].label + "")) set_data(t0, t0_value);

			if (dirty[0] & /*activeTabValue, data, selectArr*/ 1030 && li_class_value !== (li_class_value = "" + (null_to_empty(/*activeTabValue*/ ctx[2] === /*item*/ ctx[21].id
			? "active"
			: "") + " svelte-11ce50k"))) {
				attr(li, "class", li_class_value);
			}
		},
		d(detaching) {
			if (detaching) detach(li);
			mounted = false;
			dispose();
		}
	};
}

// (76:6) {#if activeTabValue === item.id}
function create_if_block(ctx) {
	let div0;
	let button0;
	let t0;
	let t1_value = /*item*/ ctx[21].label + "";
	let t1;
	let t2;
	let button1;
	let t4;
	let button2;
	let t5;
	let t6_value = /*item*/ ctx[21].label + "";
	let t6;
	let t7;
	let hr;
	let t8;
	let div1;
	let each_blocks = [];
	let each_1_lookup = new Map();
	let t9;
	let mounted;
	let dispose;

	function click_handler_2() {
		return /*click_handler_2*/ ctx[13](/*item*/ ctx[21]);
	}

	function click_handler_3() {
		return /*click_handler_3*/ ctx[14](/*item*/ ctx[21]);
	}

	function click_handler_4() {
		return /*click_handler_4*/ ctx[15](/*item*/ ctx[21]);
	}

	let each_value_1 = /*item*/ ctx[21].value;
	const get_key = ctx => /*entry*/ ctx[24].id;

	for (let i = 0; i < each_value_1.length; i += 1) {
		let child_ctx = get_each_context_1(ctx, each_value_1, i);
		let key = get_key(child_ctx);
		each_1_lookup.set(key, each_blocks[i] = create_each_block_1(key, child_ctx));
	}

	return {
		c() {
			div0 = element("div");
			button0 = element("button");
			t0 = text("Add ");
			t1 = text(t1_value);
			t2 = space();
			button1 = element("button");
			button1.textContent = "Reset to default";
			t4 = space();
			button2 = element("button");
			t5 = text("Remove All ");
			t6 = text(t6_value);
			t7 = space();
			hr = element("hr");
			t8 = space();
			div1 = element("div");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			t9 = space();
			attr(button0, "class", "svelte-11ce50k");
			attr(button1, "class", "svelte-11ce50k");
			attr(button2, "class", "svelte-11ce50k");
			attr(div0, "class", "flexrow");
		},
		m(target, anchor) {
			insert(target, div0, anchor);
			append(div0, button0);
			append(button0, t0);
			append(button0, t1);
			append(div0, t2);
			append(div0, button1);
			append(div0, t4);
			append(div0, button2);
			append(button2, t5);
			append(button2, t6);
			insert(target, t7, anchor);
			insert(target, hr, anchor);
			insert(target, t8, anchor);
			insert(target, div1, anchor);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(div1, null);
			}

			append(div1, t9);

			if (!mounted) {
				dispose = [
					listen(button0, "click", click_handler_2),
					listen(button1, "click", click_handler_3),
					listen(button2, "click", click_handler_4)
				];

				mounted = true;
			}
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;
			if (dirty[0] & /*data*/ 2 && t1_value !== (t1_value = /*item*/ ctx[21].label + "")) set_data(t1, t1_value);
			if (dirty[0] & /*data*/ 2 && t6_value !== (t6_value = /*item*/ ctx[21].label + "")) set_data(t6, t6_value);

			if (dirty[0] & /*remove, data, selectArr*/ 1282) {
				each_value_1 = /*item*/ ctx[21].value;
				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_1, each_1_lookup, div1, destroy_block, create_each_block_1, t9, get_each_context_1);
			}
		},
		d(detaching) {
			if (detaching) detach(div0);
			if (detaching) detach(t7);
			if (detaching) detach(hr);
			if (detaching) detach(t8);
			if (detaching) detach(div1);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].d();
			}

			mounted = false;
			run_all(dispose);
		}
	};
}

// (88:16) {#each Object.entries(selectArr[item.id]) as opt}
function create_each_block_2(ctx) {
	let option;
	let t_value = localize(/*opt*/ ctx[27][1]) + "";
	let t;
	let option_value_value;

	return {
		c() {
			option = element("option");
			t = text(t_value);
			option.__value = option_value_value = /*opt*/ ctx[27][0];
			option.value = option.__value;
		},
		m(target, anchor) {
			insert(target, option, anchor);
			append(option, t);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*data*/ 2 && t_value !== (t_value = localize(/*opt*/ ctx[27][1]) + "")) set_data(t, t_value);

			if (dirty[0] & /*data, selectArr*/ 1026 && option_value_value !== (option_value_value = /*opt*/ ctx[27][0])) {
				option.__value = option_value_value;
				option.value = option.__value;
			}
		},
		d(detaching) {
			if (detaching) detach(option);
		}
	};
}

// (84:10) {#each item.value as entry (entry.id)}
function create_each_block_1(key_1, ctx) {
	let div;
	let input;
	let t0;
	let select;
	let t1;
	let button;
	let mounted;
	let dispose;

	function input_input_handler() {
		/*input_input_handler*/ ctx[16].call(input, /*each_value_1*/ ctx[25], /*entry_index*/ ctx[26]);
	}

	let each_value_2 = Object.entries(/*selectArr*/ ctx[10][/*item*/ ctx[21].id]);
	let each_blocks = [];

	for (let i = 0; i < each_value_2.length; i += 1) {
		each_blocks[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
	}

	function select_change_handler() {
		/*select_change_handler*/ ctx[17].call(select, /*each_value_1*/ ctx[25], /*entry_index*/ ctx[26]);
	}

	function click_handler_5() {
		return /*click_handler_5*/ ctx[18](/*entry*/ ctx[24], /*item*/ ctx[21]);
	}

	return {
		key: key_1,
		first: null,
		c() {
			div = element("div");
			input = element("input");
			t0 = space();
			select = element("select");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			t1 = space();
			button = element("button");
			if (/*entry*/ ctx[24].type === void 0) add_render_callback(select_change_handler);
			attr(button, "class", "minus far fa-minus-square svelte-11ce50k");
			attr(div, "class", "flexrow");
			this.first = div;
		},
		m(target, anchor) {
			insert(target, div, anchor);
			append(div, input);
			set_input_value(input, /*entry*/ ctx[24].name);
			append(div, t0);
			append(div, select);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(select, null);
			}

			select_option(select, /*entry*/ ctx[24].type);
			append(div, t1);
			append(div, button);

			if (!mounted) {
				dispose = [
					listen(input, "input", input_input_handler),
					listen(select, "change", select_change_handler),
					listen(button, "click", click_handler_5)
				];

				mounted = true;
			}
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;

			if (dirty[0] & /*data, selectArr*/ 1026 && input.value !== /*entry*/ ctx[24].name) {
				set_input_value(input, /*entry*/ ctx[24].name);
			}

			if (dirty[0] & /*selectArr, data*/ 1026) {
				each_value_2 = Object.entries(/*selectArr*/ ctx[10][/*item*/ ctx[21].id]);
				let i;

				for (i = 0; i < each_value_2.length; i += 1) {
					const child_ctx = get_each_context_2(ctx, each_value_2, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block_2(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(select, null);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}

				each_blocks.length = each_value_2.length;
			}

			if (dirty[0] & /*data, selectArr*/ 1026) {
				select_option(select, /*entry*/ ctx[24].type);
			}
		},
		d(detaching) {
			if (detaching) detach(div);
			destroy_each(each_blocks, detaching);
			mounted = false;
			run_all(dispose);
		}
	};
}

// (75:4) {#each Object.values(data) as item (item)}
function create_each_block$1(key_1, ctx) {
	let first;
	let if_block_anchor;
	let if_block = /*activeTabValue*/ ctx[2] === /*item*/ ctx[21].id && create_if_block(ctx);

	return {
		key: key_1,
		first: null,
		c() {
			first = empty();
			if (if_block) if_block.c();
			if_block_anchor = empty();
			this.first = first;
		},
		m(target, anchor) {
			insert(target, first, anchor);
			if (if_block) if_block.m(target, anchor);
			insert(target, if_block_anchor, anchor);
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;

			if (/*activeTabValue*/ ctx[2] === /*item*/ ctx[21].id) {
				if (if_block) {
					if_block.p(ctx, dirty);
				} else {
					if_block = create_if_block(ctx);
					if_block.c();
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}
		},
		d(detaching) {
			if (detaching) detach(first);
			if (if_block) if_block.d(detaching);
			if (detaching) detach(if_block_anchor);
		}
	};
}

// (61:0) <ApplicationShell bind:elementRoot>
function create_default_slot$2(ctx) {
	let div0;
	let button0;
	let t1;
	let button1;
	let t3;
	let ul;
	let t4;
	let div1;
	let each_blocks = [];
	let each1_lookup = new Map();
	let t5;
	let settingssubmitbutton;
	let current;
	let mounted;
	let dispose;
	let each_value_3 = Object.values(/*data*/ ctx[1]);
	let each_blocks_1 = [];

	for (let i = 0; i < each_value_3.length; i += 1) {
		each_blocks_1[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
	}

	let each_value = Object.values(/*data*/ ctx[1]);
	const get_key = ctx => /*item*/ ctx[21];

	for (let i = 0; i < each_value.length; i += 1) {
		let child_ctx = get_each_context$1(ctx, each_value, i);
		let key = get_key(child_ctx);
		each1_lookup.set(key, each_blocks[i] = create_each_block$1(key, child_ctx));
	}

	settingssubmitbutton = new SettingsSubmitButton({
			props: { setting: setting$1, data: /*data*/ ctx[1] }
		});

	return {
		c() {
			div0 = element("div");
			button0 = element("button");
			button0.textContent = "Remove All";
			t1 = space();
			button1 = element("button");
			button1.textContent = "Reset All";
			t3 = space();
			ul = element("ul");

			for (let i = 0; i < each_blocks_1.length; i += 1) {
				each_blocks_1[i].c();
			}

			t4 = space();
			div1 = element("div");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			t5 = space();
			create_component(settingssubmitbutton.$$.fragment);
			attr(button0, "class", "svelte-11ce50k");
			attr(button1, "class", "svelte-11ce50k");
			attr(div0, "class", "flexrow");
			attr(ul, "class", "svelte-11ce50k");
			attr(div1, "class", "box svelte-11ce50k");
		},
		m(target, anchor) {
			insert(target, div0, anchor);
			append(div0, button0);
			append(div0, t1);
			append(div0, button1);
			insert(target, t3, anchor);
			insert(target, ul, anchor);

			for (let i = 0; i < each_blocks_1.length; i += 1) {
				each_blocks_1[i].m(ul, null);
			}

			insert(target, t4, anchor);
			insert(target, div1, anchor);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(div1, null);
			}

			insert(target, t5, anchor);
			mount_component(settingssubmitbutton, target, anchor);
			current = true;

			if (!mounted) {
				dispose = [
					listen(button0, "click", /*click_handler*/ ctx[11]),
					listen(button1, "click", /*click_handler_1*/ ctx[12])
				];

				mounted = true;
			}
		},
		p(ctx, dirty) {
			if (dirty[0] & /*activeTabValue, data, handleClick*/ 518) {
				each_value_3 = Object.values(/*data*/ ctx[1]);
				let i;

				for (i = 0; i < each_value_3.length; i += 1) {
					const child_ctx = get_each_context_3(ctx, each_value_3, i);

					if (each_blocks_1[i]) {
						each_blocks_1[i].p(child_ctx, dirty);
					} else {
						each_blocks_1[i] = create_each_block_3(child_ctx);
						each_blocks_1[i].c();
						each_blocks_1[i].m(ul, null);
					}
				}

				for (; i < each_blocks_1.length; i += 1) {
					each_blocks_1[i].d(1);
				}

				each_blocks_1.length = each_value_3.length;
			}

			if (dirty[0] & /*data, remove, selectArr, removeAll, setDefaultGroup, add, activeTabValue*/ 1398) {
				each_value = Object.values(/*data*/ ctx[1]);
				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each1_lookup, div1, destroy_block, create_each_block$1, null, get_each_context$1);
			}

			const settingssubmitbutton_changes = {};
			if (dirty[0] & /*data*/ 2) settingssubmitbutton_changes.data = /*data*/ ctx[1];
			settingssubmitbutton.$set(settingssubmitbutton_changes);
		},
		i(local) {
			if (current) return;
			transition_in(settingssubmitbutton.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(settingssubmitbutton.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div0);
			if (detaching) detach(t3);
			if (detaching) detach(ul);
			destroy_each(each_blocks_1, detaching);
			if (detaching) detach(t4);
			if (detaching) detach(div1);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].d();
			}

			if (detaching) detach(t5);
			destroy_component(settingssubmitbutton, detaching);
			mounted = false;
			run_all(dispose);
		}
	};
}

function create_fragment$2(ctx) {
	let applicationshell;
	let updating_elementRoot;
	let current;

	function applicationshell_elementRoot_binding(value) {
		/*applicationshell_elementRoot_binding*/ ctx[19](value);
	}

	let applicationshell_props = {
		$$slots: { default: [create_default_slot$2] },
		$$scope: { ctx }
	};

	if (/*elementRoot*/ ctx[0] !== void 0) {
		applicationshell_props.elementRoot = /*elementRoot*/ ctx[0];
	}

	applicationshell = new ApplicationShell({ props: applicationshell_props });
	binding_callbacks.push(() => bind(applicationshell, 'elementRoot', applicationshell_elementRoot_binding));

	return {
		c() {
			create_component(applicationshell.$$.fragment);
		},
		m(target, anchor) {
			mount_component(applicationshell, target, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const applicationshell_changes = {};

			if (dirty[0] & /*data, activeTabValue*/ 6 | dirty[1] & /*$$scope*/ 2) {
				applicationshell_changes.$$scope = { dirty, ctx };
			}

			if (!updating_elementRoot && dirty[0] & /*elementRoot*/ 1) {
				updating_elementRoot = true;
				applicationshell_changes.elementRoot = /*elementRoot*/ ctx[0];
				add_flush_callback(() => updating_elementRoot = false);
			}

			applicationshell.$set(applicationshell_changes);
		},
		i(local) {
			if (current) return;
			transition_in(applicationshell.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(applicationshell.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(applicationshell, detaching);
		}
	};
}

const setting$1 = "proficiencies";

function instance$2($$self, $$props, $$invalidate) {
	let data = game.settings.get("ard20", "proficiencies");
	console.log(data);

	function removeAllAll() {
		for (const item of Object.values(data)) {
			item.value = [];
		}

		console.log(data);
		$$invalidate(1, data);
	}

	function removeAll(type) {
		$$invalidate(1, data[type].value = [], data);
		$$invalidate(1, data);
	}

	function add(type) {
		$$invalidate(
			1,
			data[type].value = [
				...data[type].value,
				{
					id: uuidv4(),
					name: `New ${type}`,
					type: Object.keys(selectArr[type])[0]
				}
			],
			data
		);

		$$invalidate(1, data);
	}

	function setDefaultGroup(type) {
		console.log([...game.settings.settings].filter(set => set[0] === "ard20.proficiencies")[0][1].default);

		$$invalidate(
			1,
			data[type].value = [
				...[...game.settings.settings].filter(set => set[0] === "ard20.proficiencies")[0][1].default[type].value
			],
			data
		);

		$$invalidate(1, data);
	}

	function setDefaultAll() {
		console.log([...game.settings.settings].filter(set => set[0] === "ard20.proficiencies")[0][1].default);
		$$invalidate(1, data = duplicate([...game.settings.settings].filter(set => set[0] === "ard20.proficiencies")[0][1].default));
	}

	function remove(key, type) {
		const index = data[type].value.findIndex(entry => entry.id === key);

		if (index >= 0) {
			data[type].value.splice(index, 1);
			$$invalidate(1, data);
		}
	}

	let { elementRoot } = $$props;
	let activeTabValue = "weapon";
	const handleClick = tabValue => () => $$invalidate(2, activeTabValue = tabValue);

	let selectArr = {
		weapon: ARd20.WeaponType,
		armor: {
			light: "light",
			medium: "medium",
			heavy: "heavy"
		},
		tool: {}
	};

	const click_handler = () => removeAllAll();
	const click_handler_1 = () => setDefaultAll();
	const click_handler_2 = item => add(item.id);
	const click_handler_3 = item => setDefaultGroup(item.id);
	const click_handler_4 = item => removeAll(item.id);

	function input_input_handler(each_value_1, entry_index) {
		each_value_1[entry_index].name = this.value;
		$$invalidate(1, data);
		$$invalidate(10, selectArr);
	}

	function select_change_handler(each_value_1, entry_index) {
		each_value_1[entry_index].type = select_value(this);
		$$invalidate(1, data);
		$$invalidate(10, selectArr);
	}

	const click_handler_5 = (entry, item) => remove(entry.id, item.id);

	function applicationshell_elementRoot_binding(value) {
		elementRoot = value;
		$$invalidate(0, elementRoot);
	}

	$$self.$$set = $$props => {
		if ('elementRoot' in $$props) $$invalidate(0, elementRoot = $$props.elementRoot);
	};

	return [
		elementRoot,
		data,
		activeTabValue,
		removeAllAll,
		removeAll,
		add,
		setDefaultGroup,
		setDefaultAll,
		remove,
		handleClick,
		selectArr,
		click_handler,
		click_handler_1,
		click_handler_2,
		click_handler_3,
		click_handler_4,
		input_input_handler,
		select_change_handler,
		click_handler_5,
		applicationshell_elementRoot_binding
	];
}

class ProfSetting_shell extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$2, create_fragment$2, safe_not_equal, { elementRoot: 0 }, null, [-1, -1]);
	}

	get elementRoot() {
		return this.$$.ctx[0];
	}

	set elementRoot(elementRoot) {
		this.$$set({ elementRoot });
		flush();
	}
}

class ProfSettingsShim extends FormApplication {
  /**
   * @inheritDoc
   */
  constructor(options = {}) {
    super({}, options);
    new ProfSetting().render(true, {
      focus: true
    });
  }

  async _updateObject(event, formData) {}

  render() {
    this.close();
  }

}

class ProfSetting extends SvelteApplication {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["ard20"],
      title: "Sub-types for Proficiencies",
      minimizable: true,
      resizable: true,
      width: 600,
      height: 800,
      svelte: {
        class: ProfSetting_shell,
        target: document.body
      }
    });
  }

}

/* built\settings\ProfLevelsSetting\profLevelSetting-shell.svelte generated by Svelte v3.48.0 */

function get_each_context(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[9] = list[i];
	child_ctx[10] = list;
	child_ctx[11] = i;
	return child_ctx;
}

// (36:2) {#each data as setting}
function create_each_block(ctx) {
	let div;
	let label0;
	let t1;
	let input0;
	let t2;
	let label1;
	let t4;
	let input1;
	let t5;
	let button;
	let mounted;
	let dispose;

	function input0_input_handler() {
		/*input0_input_handler*/ ctx[4].call(input0, /*each_value*/ ctx[10], /*setting_index*/ ctx[11]);
	}

	function input1_input_handler() {
		/*input1_input_handler*/ ctx[5].call(input1, /*each_value*/ ctx[10], /*setting_index*/ ctx[11]);
	}

	function click_handler() {
		return /*click_handler*/ ctx[6](/*setting*/ ctx[9]);
	}

	return {
		c() {
			div = element("div");
			label0 = element("label");
			label0.textContent = "Key:";
			t1 = space();
			input0 = element("input");
			t2 = space();
			label1 = element("label");
			label1.textContent = "Name";
			t4 = space();
			input1 = element("input");
			t5 = space();
			button = element("button");
			attr(label0, "for", "setting.key");
			attr(input0, "type", "text");
			attr(label1, "for", "setting.label");
			attr(input1, "type", "text");
			attr(button, "class", "minus far fa-minus-square");
			attr(div, "class", "grid grid-5col");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			append(div, label0);
			append(div, t1);
			append(div, input0);
			set_input_value(input0, /*setting*/ ctx[9].key);
			append(div, t2);
			append(div, label1);
			append(div, t4);
			append(div, input1);
			set_input_value(input1, /*setting*/ ctx[9].label);
			append(div, t5);
			append(div, button);

			if (!mounted) {
				dispose = [
					listen(input0, "input", input0_input_handler),
					listen(input1, "input", input1_input_handler),
					listen(button, "click", click_handler)
				];

				mounted = true;
			}
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;

			if (dirty & /*data*/ 2 && input0.value !== /*setting*/ ctx[9].key) {
				set_input_value(input0, /*setting*/ ctx[9].key);
			}

			if (dirty & /*data*/ 2 && input1.value !== /*setting*/ ctx[9].label) {
				set_input_value(input1, /*setting*/ ctx[9].label);
			}
		},
		d(detaching) {
			if (detaching) detach(div);
			mounted = false;
			run_all(dispose);
		}
	};
}

// (34:0) <ApplicationShell bind:elementRoot>
function create_default_slot$1(ctx) {
	let button;
	let t1;
	let t2;
	let settingssubmitbutton;
	let current;
	let mounted;
	let dispose;
	let each_value = /*data*/ ctx[1];
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
	}

	settingssubmitbutton = new SettingsSubmitButton({
			props: { setting, data: /*data*/ ctx[1] }
		});

	return {
		c() {
			button = element("button");
			button.textContent = "Add level";
			t1 = space();

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			t2 = space();
			create_component(settingssubmitbutton.$$.fragment);
		},
		m(target, anchor) {
			insert(target, button, anchor);
			insert(target, t1, anchor);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(target, anchor);
			}

			insert(target, t2, anchor);
			mount_component(settingssubmitbutton, target, anchor);
			current = true;

			if (!mounted) {
				dispose = listen(button, "click", /*addEntry*/ ctx[2]);
				mounted = true;
			}
		},
		p(ctx, dirty) {
			if (dirty & /*deleteEntry, data*/ 10) {
				each_value = /*data*/ ctx[1];
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(t2.parentNode, t2);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}

				each_blocks.length = each_value.length;
			}

			const settingssubmitbutton_changes = {};
			if (dirty & /*data*/ 2) settingssubmitbutton_changes.data = /*data*/ ctx[1];
			settingssubmitbutton.$set(settingssubmitbutton_changes);
		},
		i(local) {
			if (current) return;
			transition_in(settingssubmitbutton.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(settingssubmitbutton.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(button);
			if (detaching) detach(t1);
			destroy_each(each_blocks, detaching);
			if (detaching) detach(t2);
			destroy_component(settingssubmitbutton, detaching);
			mounted = false;
			dispose();
		}
	};
}

function create_fragment$1(ctx) {
	let applicationshell;
	let updating_elementRoot;
	let current;

	function applicationshell_elementRoot_binding(value) {
		/*applicationshell_elementRoot_binding*/ ctx[7](value);
	}

	let applicationshell_props = {
		$$slots: { default: [create_default_slot$1] },
		$$scope: { ctx }
	};

	if (/*elementRoot*/ ctx[0] !== void 0) {
		applicationshell_props.elementRoot = /*elementRoot*/ ctx[0];
	}

	applicationshell = new ApplicationShell({ props: applicationshell_props });
	binding_callbacks.push(() => bind(applicationshell, 'elementRoot', applicationshell_elementRoot_binding));

	return {
		c() {
			create_component(applicationshell.$$.fragment);
		},
		m(target, anchor) {
			mount_component(applicationshell, target, anchor);
			current = true;
		},
		p(ctx, [dirty]) {
			const applicationshell_changes = {};

			if (dirty & /*$$scope, data*/ 4098) {
				applicationshell_changes.$$scope = { dirty, ctx };
			}

			if (!updating_elementRoot && dirty & /*elementRoot*/ 1) {
				updating_elementRoot = true;
				applicationshell_changes.elementRoot = /*elementRoot*/ ctx[0];
				add_flush_callback(() => updating_elementRoot = false);
			}

			applicationshell.$set(applicationshell_changes);
		},
		i(local) {
			if (current) return;
			transition_in(applicationshell.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(applicationshell.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(applicationshell, detaching);
		}
	};
}

const setting = "profLevel";

function instance$1($$self, $$props, $$invalidate) {
	let { elementRoot } = $$props;
	let data = game.settings.get("ard20", "profLevel");

	function addEntry() {
		const key = "newKey";
		const label = `New level`;
		const id = uuidv4();
		$$invalidate(1, data = [...data, { key, label, id }]);
		console.log(data);
		$$invalidate(1, data);
	}

	function deleteEntry(id) {
		const index = data.findIndex(entry => entry.id === id);

		if (index >= 0) {
			data.splice(index, 1);
			$$invalidate(1, data);
		}
	}

	function input0_input_handler(each_value, setting_index) {
		each_value[setting_index].key = this.value;
		$$invalidate(1, data);
	}

	function input1_input_handler(each_value, setting_index) {
		each_value[setting_index].label = this.value;
		$$invalidate(1, data);
	}

	const click_handler = setting => {
		deleteEntry(setting.id);
	};

	function applicationshell_elementRoot_binding(value) {
		elementRoot = value;
		$$invalidate(0, elementRoot);
	}

	$$self.$$set = $$props => {
		if ('elementRoot' in $$props) $$invalidate(0, elementRoot = $$props.elementRoot);
	};

	return [
		elementRoot,
		data,
		addEntry,
		deleteEntry,
		input0_input_handler,
		input1_input_handler,
		click_handler,
		applicationshell_elementRoot_binding
	];
}

class ProfLevelSetting_shell extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$1, create_fragment$1, safe_not_equal, { elementRoot: 0 });
	}

	get elementRoot() {
		return this.$$.ctx[0];
	}

	set elementRoot(elementRoot) {
		this.$$set({ elementRoot });
		flush();
	}
}

class ProfLevelSettingShim extends FormApplication {
  /**
   * @inheritDoc
   */
  constructor(options = {}) {
    super({}, options);
    new ProfLevelSetting().render(true, {
      focus: true
    });
  }

  async _updateObject(event, formData) {}

  render() {
    this.close();
  }

}

class ProfLevelSetting extends SvelteApplication {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["ard20"],
      title: "Levels of proficiencies",
      minimizable: true,
      resizable: true,
      width: 400,
      height: 600,
      svelte: {
        class: ProfLevelSetting_shell,
        target: document.body
      }
    });
  }

}

const registerSystemSettings = function registerSystemSettings() {
  game.settings.register("ard20", "proficiencies", {
    scope: "world",
    config: false,
    default: {
      weapon: {
        label: "weapon",
        id: "weapon",
        value: [{
          name: "Punch Dagger",
          type: "amb",
          id: "Punch Dagger"
        }, {
          name: "Whip Dagger",
          type: "amb",
          id: "Whip Dagger"
        }, {
          name: "Gauntlet",
          type: "amb",
          id: "Gauntlet"
        }, {
          name: "Hidden Blade",
          type: "amb",
          id: "Hidden Blade"
        }, {
          name: "Knucke Axe",
          type: "amb",
          id: "Knucke Axe"
        }, {
          name: "Side Baton",
          type: "amb",
          id: "Side Baton"
        }, {
          name: "Unarmed strike",
          type: "amb",
          id: "Unarmed strike"
        }, {
          name: "Battle Axe",
          type: "axe",
          id: "Battle Axe"
        }, {
          name: "Great Axe",
          type: "axe",
          id: "Great Axe"
        }, {
          name: "Handaxe",
          type: "axe",
          id: "Handaxe"
        }, {
          name: "Hook Sword",
          type: "axe",
          id: "Hook Sword"
        }, {
          name: "Khopesh",
          type: "axe",
          id: "Khopesh"
        }, {
          name: "Poleaxe",
          type: "axe",
          id: "Poleaxe"
        }, {
          name: "Tomahawk",
          type: "axe",
          id: "Tomahawk"
        }, {
          name: "Great club",
          type: "blu",
          id: "Great club"
        }, {
          name: "Heavy club",
          type: "blu",
          id: "Heavy club"
        }, {
          name: "Light Club",
          type: "blu",
          id: "Light Club"
        }]
      },
      armor: {
        label: "armor",
        id: "armor",
        value: []
      },
      tool: {
        label: "tool",
        id: "tool",
        value: []
      }
    },
    onChange: value => {
      console.log("Настройка изменилась ", value);
    }
  });
  game.settings.registerMenu("ard20", "gearProfManage", {
    name: "SETTINGS.ProfManage",
    label: "SETTINGS.ProfManage",
    type: ProfSettingsShim,
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
    type: FeatSettingsShim,
    restricted: false
  });
  game.settings.register("ard20", "advancement-rate", {
    scope: "world",
    config: false,
    default: {
      variables: {
        skillsCount: {
          shortName: "SC",
          longName: "Skill Count"
        },
        featuresCount: {
          shortName: "FC",
          longName: "feature Count"
        },
        skills: {
          shortName: "SV",
          longName: "skill Value"
        },
        features: {
          shortName: "FL",
          longName: "Feature Level"
        },
        attributes: {
          shortName: "AV",
          longName: "Attribute Value"
        }
      },
      formulas: {
        skills: "SV",
        features: "FL",
        attributes: "max(floor((AV-10)/2)+2,1)"
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
  game.settings.register("ard20", "profLevel", {
    scope: "world",
    config: false,
    default: [{
      key: "untrained",
      label: "Untrained",
      id: "untrained"
    }, {
      key: "trained",
      label: "Trained",
      id: "trained"
    }, {
      key: "expert",
      label: "Expert",
      id: "expert"
    }, {
      key: "master",
      label: "Master",
      id: "master"
    }, {
      key: "legend",
      label: "Legend",
      id: "legend"
    }]
  });
  game.settings.registerMenu("ard20", "profLevelMenu", {
    name: "SETTINGS.profLevel",
    label: "SETTINGS.profLevel",
    type: ProfLevelSettingShim,
    restricted: false
  });
  game.settings.register("ard20", "mainDiceType", {
    scope: "world",
    choices: {
      '1d20': '1d20',
      '2d10': '2d10',
      '3d6': '3d6'
    },
    config: true,
    default: "1d20",
    type: String,
    name: "Main dice-roll type",
    hint: "chose main dice mechanic between 1d20, 2d10 and 3d6"
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

}

/**
 * Highlight critical success or failure on d20 rolls
 */
//@ts-expect-error
const highlightCriticalSuccessFailure = function highlightCriticalSuccessFailure(message, html, data) {
  if (!message.isRoll || !message.isContentVisible) return; // Highlight rolls where the first part is a d20 roll

  const roll = message.rolls;
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

/* built\sheets\svelte\DocumentShell.svelte generated by Svelte v3.48.0 */

function create_default_slot(ctx) {
	let switch_instance;
	let switch_instance_anchor;
	let current;
	var switch_value = DocTemplate.get(/*$storeDoc*/ ctx[2]);

	function switch_props(ctx) {
		return {};
	}

	if (switch_value) {
		switch_instance = new switch_value(switch_props());
	}

	return {
		c() {
			if (switch_instance) create_component(switch_instance.$$.fragment);
			switch_instance_anchor = empty();
		},
		m(target, anchor) {
			if (switch_instance) {
				mount_component(switch_instance, target, anchor);
			}

			insert(target, switch_instance_anchor, anchor);
			current = true;
		},
		p(ctx, dirty) {
			if (switch_value !== (switch_value = DocTemplate.get(/*$storeDoc*/ ctx[2]))) {
				if (switch_instance) {
					group_outros();
					const old_component = switch_instance;

					transition_out(old_component.$$.fragment, 1, 0, () => {
						destroy_component(old_component, 1);
					});

					check_outros();
				}

				if (switch_value) {
					switch_instance = new switch_value(switch_props());
					create_component(switch_instance.$$.fragment);
					transition_in(switch_instance.$$.fragment, 1);
					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
				} else {
					switch_instance = null;
				}
			}
		},
		i(local) {
			if (current) return;
			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
			current = true;
		},
		o(local) {
			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(switch_instance_anchor);
			if (switch_instance) destroy_component(switch_instance, detaching);
		}
	};
}

function create_fragment(ctx) {
	let applicationshell;
	let updating_elementRoot;
	let current;

	function applicationshell_elementRoot_binding(value) {
		/*applicationshell_elementRoot_binding*/ ctx[3](value);
	}

	let applicationshell_props = {
		$$slots: { default: [create_default_slot] },
		$$scope: { ctx }
	};

	if (/*elementRoot*/ ctx[0] !== void 0) {
		applicationshell_props.elementRoot = /*elementRoot*/ ctx[0];
	}

	applicationshell = new ApplicationShell({ props: applicationshell_props });
	binding_callbacks.push(() => bind(applicationshell, 'elementRoot', applicationshell_elementRoot_binding));

	return {
		c() {
			create_component(applicationshell.$$.fragment);
		},
		m(target, anchor) {
			mount_component(applicationshell, target, anchor);
			current = true;
		},
		p(ctx, [dirty]) {
			const applicationshell_changes = {};

			if (dirty & /*$$scope, $storeDoc*/ 20) {
				applicationshell_changes.$$scope = { dirty, ctx };
			}

			if (!updating_elementRoot && dirty & /*elementRoot*/ 1) {
				updating_elementRoot = true;
				applicationshell_changes.elementRoot = /*elementRoot*/ ctx[0];
				add_flush_callback(() => updating_elementRoot = false);
			}

			applicationshell.$set(applicationshell_changes);
		},
		i(local) {
			if (current) return;
			transition_in(applicationshell.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(applicationshell.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(applicationshell, detaching);
		}
	};
}

function instance($$self, $$props, $$invalidate) {
	let $storeDoc,
		$$unsubscribe_storeDoc = noop,
		$$subscribe_storeDoc = () => ($$unsubscribe_storeDoc(), $$unsubscribe_storeDoc = subscribe(storeDoc, $$value => $$invalidate(2, $storeDoc = $$value)), storeDoc);

	$$self.$$.on_destroy.push(() => $$unsubscribe_storeDoc());
	let { elementRoot } = $$props;
	let { storeDoc } = $$props;
	$$subscribe_storeDoc();
	setContext("DocumentSheetObject", storeDoc);

	function applicationshell_elementRoot_binding(value) {
		elementRoot = value;
		$$invalidate(0, elementRoot);
	}

	$$self.$$set = $$props => {
		if ('elementRoot' in $$props) $$invalidate(0, elementRoot = $$props.elementRoot);
		if ('storeDoc' in $$props) $$subscribe_storeDoc($$invalidate(1, storeDoc = $$props.storeDoc));
	};

	return [elementRoot, storeDoc, $storeDoc, applicationshell_elementRoot_binding];
}

class DocumentShell extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance, create_fragment, safe_not_equal, { elementRoot: 0, storeDoc: 1 });
	}

	get elementRoot() {
		return this.$$.ctx[0];
	}

	set elementRoot(elementRoot) {
		this.$$set({ elementRoot });
		flush();
	}

	get storeDoc() {
		return this.$$.ctx[1];
	}

	set storeDoc(storeDoc) {
		this.$$set({ storeDoc });
		flush();
	}
}

var _storeDoc = /*#__PURE__*/new WeakMap();

var _storeUnsubscribe = /*#__PURE__*/new WeakMap();

var _handleDocUpdate = /*#__PURE__*/new WeakSet();

class SvelteDocumentSheet extends SvelteApplication {
  /**
   * Document store that monitors updates to any assigned document.
   *
   * @type {TJSDocument<foundry.abstract.Document>}
   */

  /**
   * Holds the document unsubscription function.
   *
   * @type {Function}
   */
  constructor(object) {
    super(object);
    /**
     * @member {object} document - Adds accessors to SvelteReactive to get / set the document associated with
     *                             Document.
     *
     * @memberof SvelteReactive#
     */

    _classPrivateMethodInitSpec(this, _handleDocUpdate);

    _classPrivateFieldInitSpec(this, _storeDoc, {
      writable: true,
      value: new TJSDocument(void 0, {
        delete: this.close.bind(this)
      })
    });

    _classPrivateFieldInitSpec(this, _storeUnsubscribe, {
      writable: true,
      value: void 0
    });

    Object.defineProperty(this.reactive, "document", {
      get: () => _classPrivateFieldGet(this, _storeDoc).get(),
      set: document => {
        _classPrivateFieldGet(this, _storeDoc).set(document);
      }
    });
    this.reactive.document = object;
  }
  /**
   * Default Application options
   *
   * @returns {object} options - Application options.
   * @see https://foundryvtt.com/api/Application.html#options
   */


  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      title: "No Document Assigned",
      width: 800,
      height: 600,
      resizable: true,
      minimizable: true,
      dragDrop: [{
        dragSelector: ".directory-list .item",
        dropSelector: null
      }],
      svelte: {
        class: DocumentShell,
        target: document.body,
        // You can assign a function that is invoked with MyItemApp instance as `this`.
        props: function () {
          return {
            storeDoc: _classPrivateFieldGet(this, _storeDoc)
          };
        }
      }
    });
  }

  _getHeaderButtons() {
    var _this = this;

    const buttons = super._getHeaderButtons();

    buttons.unshift({
      class: "configure-sheet",
      icon: "fas fa-cog",
      title: "open sheet configurator",
      onclick: ev => this._onCofigureSheet(ev)
    });
    const canConfigure = game.user.isGM || this.reactive.document.isOwner && game.user.can("TOKEN_CONFIGURE");

    if (this.reactive.document.documentName === "Actor") {
      if (canConfigure) {
        buttons.splice(1, 0, {
          label: this.token ? "Token" : "TOKEN.TitlePrototype",
          class: "configure-token",
          icon: "fas fa-user-circle",
          onclick: ev => this._onConfigureToken(ev)
        });
      }

      buttons.unshift({
        class: "character-progress",
        title: "Character Advancement",
        label: "Character Advancement",
        icon: "fa-solid fa-book-sparkles",
        onclick: async function (ev) {
          return await _this._onCharacterAdvancement(ev);
        }
      });
    }

    return buttons;
  }
  /**
   * Drag&Drop handling
   *
   *
   */


  _canDragStart(selector) {
    return true;
  }

  _canDragDrop(selector) {
    return this.reactive.document.isOwner || game.user.isGM;
  }

  _onDragOver(event) {}

  _onDragStart(event) {
    {
      const li = event.currentTarget;
      if (event.target.classList.contains("content-link")) return; // Create drag data

      let dragData; // Owned Items

      if (li.dataset.itemId) {
        const item = this.actor.items.get(li.dataset.itemId);
        dragData = item.toDragData();
      } // Active Effect


      if (li.dataset.effectId) {
        const effect = this.actor.effects.get(li.dataset.effectId);
        dragData = effect.toDragData();
      }

      if (!dragData) return; // Set data transfer

      event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
    }
  }

  async _onDrop(event) {
    console.log("on drop event");
    if (this.reactive.document.documentName !== "Actor") return;
    const data = TextEditor.getDragEventData(event);
    const actor = this.reactive.document;
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
        return this._onDropActiveEffect(event, data, actor);

      case "Actor":
        return this._onDropActor(event, data, actor);

      case "Item":
        return this._onDropItem(event, data, actor);

      case "Folder":
        return this._onDropFolder(event, data, actor);
    }
  }

  async _onDropActiveEffect(event, data, actor) {
    const effect = await ActiveEffect.implementation.fromDropData(data);
    if (!actor.isOwner || !effect) return false;
    if (actor.uuid === effect.parent.uuid) return false;
    return ActiveEffect.create(effect.toObject(), {
      parent: actor
    });
  }

  async _onDropActor(event, data, actor) {
    if (!actor.isOwner) return false;
  }

  async _onDropItem(event, data, actor) {
    var _item$parent;

    if (!actor.isOwner) return false;
    const item = await Item.implementation.fromDropData(data);
    const itemData = item.toObject(); // Handle item sorting within the same Actor

    if (actor.uuid === ((_item$parent = item.parent) === null || _item$parent === void 0 ? void 0 : _item$parent.uuid)) return this._onSortItem(event, itemData, actor); // Create the owned item

    return this._onDropItemCreate(itemData, actor);
  }

  async _onDropFolder(event, data, actor) {
    if (!actor.isOwner) return [];
    if (data.documentName !== "Item") return [];
    const folder = await Folder.implementation.fromDropData(data);
    if (!folder) return [];
    return this._onDropItemCreate(folder.contents.map(item => {
      return game.items.fromCompendium(item);
    }));
  }

  async _onDropItemCreate(itemData, actor) {
    itemData = itemData instanceof Array ? itemData : [itemData];
    return actor.createEmbeddedDocuments("Item", itemData);
  }

  _onSortItem(event, itemData, actor) {
    // Get the drag source and drop target
    const items = actor.items;
    const source = items.get(itemData._id);
    const dropTarget = event.target.closest("[data-item-id]");
    const target = items.get(dropTarget.dataset.itemId); // Don't sort on yourself

    if (source.id === target.id) return; // Identify sibling items based on adjacent HTML elements

    const siblings = [];

    for (let el of dropTarget.parentElement.children) {
      const siblingId = el.dataset.itemId;
      if (siblingId && siblingId !== source.id) siblings.push(items.get(el.dataset.itemId));
    } // Perform the sort


    const sortUpdates = SortingHelpers.performIntegerSort(source, {
      target,
      siblings
    });
    const updateData = sortUpdates.map(u => {
      const update = u.update;
      update._id = u.target.data._id;
      return update;
    }); // Perform the update

    return actor.updateEmbeddedDocuments("Item", updateData);
  }
  /**
   *
   *
   *
   */


  _onCofigureSheet(event) {
    if (event) event.preventDefault();
    new DocumentSheetConfig(this.reactive.document, {
      top: this.position.top + 40,
      left: this.position.left + (this.position.width - SvelteDocumentSheet.defaultOptions.width) / 2
    }).render(true);
  }

  _onConfigureToken(event) {
    if (event) event.preventDefault();
    const actor = this.reactive.document;
    const token = actor.isToken ? actor.token : actor.prototypeToken;
    new CONFIG.Token.prototypeSheetClass(token, {
      left: Math.max(this.position.left - 560 - 10, 10),
      top: this.position.top
    }).render(true);
  }

  async _onCharacterAdvancement(event) {
    if (event) event.preventDefault();
    const actor = this.reactive.document;

    async function createAditionalData() {
      //functions to get lists of available features and lists
      async function getPacks() {
        let pack_list = []; // array of feats from Compendium

        let pack_name = [];

        for (const val of game.settings.get("ard20", "feat").packs) {
          if (game.packs.filter(pack => pack.metadata.label === val.name).length !== 0) {
            let feat_list = [];
            feat_list.push(Array.from(game.packs.filter(pack => pack.metadata.label === val.name && pack.documentName === "Item")[0].index));
            feat_list = feat_list.flat();

            for (const feat of feat_list) {
              const new_key = game.packs.filter(pack => pack.metadata.label === val.name)[0].metadata.package + "." + val.name;
              const doc = await game.packs.get(new_key).getDocument(feat.id);
              const item = doc.toObject();
              item.system = foundry.utils.deepClone(doc.system);
              pack_list.push(item);
              pack_name.push(item.name);
            }

            pack_list = pack_list.flat();
          }
        }

        return {
          pack_list,
          pack_name
        };
      }

      function getFolders() {
        let folder_list = []; // array of feats from game folders

        let folder_name = [];

        for (let val of game.settings.get("ard20", "feat").folders) {
          if (game.folders.filter(folder => folder.data.name === val.name).length !== 0) {
            let feat_list = [];
            feat_list.push(game.folders.filter(folder => folder.data.name === val.name && folder.data.type === "Item")[0].contents);
            feat_list = feat_list.flat();

            for (let feat of feat_list) {
              console.log("item added from folder ", feat);
              const item = feat.toObject();
              item.system = foundry.utils.deepClone(feat.system);
              folder_list.push(item);
              folder_name.push(item.name);
            }

            folder_list = folder_list.flat();
          }
        }

        return {
          folder_list,
          folder_name
        };
      }

      let raceList = await getRacesList();
      let featList = await getFeaturesList();
      let name_array = [];

      async function getRacesList() {
        const pack = await getPacks();
        const folder = getFolders();
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

      async function getFeaturesList() {
        const pack = await getPacks();
        const pack_list = pack.pack_list;
        const pack_name = pack.pack_name;
        const folder = getFolders();
        const folder_list = folder.folder_list;
        let feat_pack_list = [];
        pack_list.forEach(item => {
          if (item.type === "feature") {
            let FeatureItem = _objectSpread2({}, item);

            feat_pack_list.push(FeatureItem);
          }
        });
        let feat_folder_list = [];
        folder_list.forEach(item => {
          if (item.type === "feature") {
            let FeatureItem = _objectSpread2({}, item);

            feat_folder_list.push(FeatureItem);
          }
        });
        let temp_feat_list = feat_pack_list.concat(feat_folder_list.filter(item => !pack_name.includes(item.name)));
        let learnedFeatures = [];
        actor.itemTypes.feature.forEach(item => {
          if (item.data.type === "feature") {
            let FeatureItem = _objectSpread2({}, item.data);

            learnedFeatures.push(FeatureItem);
          }
        });
        return {
          temp_feat_list,
          learnedFeatures
        };
      }

      for (let i of featList.learnedFeatures) {
        name_array.push(i.name);
      }

      console.log(featList.temp_feat_list, "featList.temp_feat_list");
      featList.temp_feat_list.forEach((v, k) => {
        console.log(k, v);

        if (name_array.includes(v.name)) {
          console.log("this item is already learned", featList.temp_feat_list[k]);
          featList.temp_feat_list[k] = foundry.utils.deepClone(featList.learnedFeatures.filter(item => item.name === v.name)[0]);
        }
      });
      featList.temp_feat_list = featList.temp_feat_list.filter(item => {
        if (item.type === "feature") return !name_array.includes(item.name) || item.data.level.current !== item.data.level.max;
      });
      const obj = {
        races: {
          list: raceList,
          chosen: ""
        },
        count: {
          //TODO: rework this for future where you can have more/less ranks
          skills: {
            0: 0,
            1: 0,
            2: 0,
            3: 0,
            4: 0
          },
          feats: {
            mar: 0,
            mag: 0,
            div: 0,
            pri: 0,
            psy: 0
          }
        },
        feats: {
          learned: featList.learnedFeatures,
          awail: featList.temp_feat_list
        },
        allow: {
          attribute: duplicate(actor.system.isReady),
          race: duplicate(actor.system.isReady),
          final: duplicate(actor.system.isReady)
        }
      };
      return obj;
    }

    const document = {
      actor: actor,
      aditionalData: await createAditionalData()
    };
    new CharacterAdvancement(document).render(true, {
      focus: true
    });
  }

  async close(options = {}) {
    await super.close(options);

    if (_classPrivateFieldGet(this, _storeUnsubscribe)) {
      _classPrivateFieldGet(this, _storeUnsubscribe).call(this);

      _classPrivateFieldSet(this, _storeUnsubscribe, void 0);
    }
  }
  /**
   * Handles any changes to document.
   *
   * @param {foundry.abstract.Document}  doc -
   *
   * @param {object}                     options -
   */


  render(force = false, options = {}) {
    if (!_classPrivateFieldGet(this, _storeUnsubscribe)) {
      _classPrivateFieldSet(this, _storeUnsubscribe, _classPrivateFieldGet(this, _storeDoc).subscribe(_classPrivateMethodGet(this, _handleDocUpdate, _handleDocUpdate2).bind(this)));
    }

    super.render(force, options);
    return this;
  }

}

async function _handleDocUpdate2(doc, options) {
  const {
    action,
    data,
    documentType
  } = options;
  console.log(structuredClone(doc));
  console.log(action); // I need to add a 'subscribe' action to TJSDocument so must check void.

  if ((action === void 0 || action === "update" || action === "subscribe") && doc) {
    var _doc$name;

    console.log("doc name: ", doc === null || doc === void 0 ? void 0 : doc.name);
    this.reactive.title = doc !== null && doc !== void 0 && doc.isToken ? `[Token] ${doc === null || doc === void 0 ? void 0 : doc.name}` : (_doc$name = doc === null || doc === void 0 ? void 0 : doc.name) !== null && _doc$name !== void 0 ? _doc$name : "No Document Assigned";
  }
}

// Import document classes.
/* -------------------------------------------- */

/*  Init Hook                                   */

/* -------------------------------------------- */

Hooks.once("init", function () {
  console.log("init hoook"); // Add utility classes to the global game object so that they're more easily
  // accessible in global contexts.

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
  game.socket.on("system.ard20", data => {
    if (data.operation === "updateActorData") ARd20SocketHandler.updateActorData(data);
  });
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

  console.log("register sheets");
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("ard20", ARd20ActorSheet, {
    makeDefault: false
  });
  Actors.registerSheet("ard20", SvelteDocumentSheet, {
    makeDefault: true
  });
  Items.unregisterSheet("core", ItemSheet); //@ts-expect-error

  Items.registerSheet("ard20", ARd20ItemSheet, {
    makeDefault: false
  });
  Items.registerSheet("ard20", SvelteDocumentSheet, {
    makeDefault: true
  });
  CONFIG.Item.systemDataModels["race"] = RaceDataModel; //register settings

  registerSystemSettings(); //register Svelte components for Actor/Item types

  setSvelteComponents(); // Preload Handlebars templates.

  preloadHandlebarsTemplates();
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
  //check if typhonjs module is installed and activated

  /*if (!game.modules.get("typhonjs")) {
    ui.notifications.error("typhonjs module is not install, please install it!");
  } else if (!game.modules.get("typhonjs").active) {
    ui.notifications.error("typhonjs module is not active!");
    const moduleSettings = game.settings.get("core", "moduleConfiguration");
    moduleSettings["typhonjs"] = true;
    await game.settings.set("core", "moduleConfiguration", moduleSettings);
  }*/
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

export { rollItemMacro };
//# sourceMappingURL=ard20_1.js.map
