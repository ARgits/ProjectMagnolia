import { TJSDialog, SvelteApplication } from '/modules/typhonjs/svelte/application.js';
import { SvelteComponent, init, safe_not_equal, element, text, attr, insert, append, listen, detach, space, empty, noop, component_subscribe, null_to_empty, set_data, create_component, mount_component, transition_in, transition_out, destroy_component, set_style, add_render_callback, add_resize_listener, group_outros, check_outros, add_flush_callback, destroy_each, binding_callbacks, bind, flush, set_input_value, run_all, update_keyed_each, destroy_block, select_value, is_function, select_option } from '/modules/typhonjs/svelte/internal.js';
import { getContext, setContext } from '/modules/typhonjs/svelte/index.js';
import { writable } from '/modules/typhonjs/svelte/store.js';
import { ApplicationShell } from '/modules/typhonjs/svelte/component/core.js';
import { uuidv4 } from '/modules/typhonjs/svelte/util.js';
import { localize } from '/modules/typhonjs/svelte/helper.js';

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
    this.labels = {};

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

    for (const level of game.settings.get("ard20", "profLevel")) {
      var _data$damage$common$l;

      data.damage.common[level.key] = (_data$damage$common$l = data.damage.common[level.key]) !== null && _data$damage$common$l !== void 0 ? _data$damage$common$l : {
        formula: "",
        parts: [["", ["", ""]]]
      };
    }
    /*for (let [key, type] of obj_entries(data.damage)) {
            if (key !== "current") {
                for (let [key, prof] of obj_entries(type)) {
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

    data.sub_type_array = game.settings.get("ard20", "proficiencies").weapon.value.filter(prof => prof.type === data.type.value);

    if ((_flags$core = flags.core) !== null && _flags$core !== void 0 && _flags$core.sourceId) {
      var _game$items;

      const id = /Item.(.+)/.exec(flags.core.sourceId)[1];
      const item = (_game$items = game.items) === null || _game$items === void 0 ? void 0 : _game$items.get(id);

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
      data.source.label += key === 0 ? label : `</br>${label}`;
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
          for (let [_key, v] of obj_entries$1(CONFIG.ARd20.Attributes)) {
            if (req.name === game.i18n.localize(CONFIG.ARd20.Attributes[_key])) req.value = _key;
          }

          break;

        case "skill":
          for (let [_key2, v] of obj_entries$1(CONFIG.ARd20.Skills)) {
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
      var _parseInt2;

      if (!(key === "force" || key === "radiant" || key === "psychic")) {
        var _parseInt;

        data.res.phys[key].value = (_parseInt = parseInt(data.res.phys[key].value)) !== null && _parseInt !== void 0 ? _parseInt : 0;
        data.res.phys[key].value += data.res.phys[key].value !== "imm" ? data.res.phys[key].bonus : "";
      }

      data.res.mag[key].value = (_parseInt2 = parseInt(data.res.mag[key].value)) !== null && _parseInt2 !== void 0 ? _parseInt2 : 0;
      data.res.mag[key].value += data.res.mag[key].value !== "imm" ? data.res.mag[key].bonus : "";
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
      var _this$actor;

      const data = itemData.data;
      data.proficiency.level = this.isOwned ? (_this$actor = this.actor) === null || _this$actor === void 0 ? void 0 : _this$actor.data.data.proficiencies.weapon.filter(pr => pr.name === data.sub_type)[0].value : 0;
      data.proficiency.levelName = game.settings.get("ard20", "profLevel")[data.proficiency.level].label;
      data.proficiency.key = game.settings.get("ard20", "profLevel")[data.proficiency.level].key;
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

/* built\helpers\Character Advancement\ChangeButton.svelte generated by Svelte v3.46.4 */

function create_if_block_1$1(ctx) {
	let button;
	let t;
	let mounted;
	let dispose;

	return {
		c() {
			button = element("button");
			t = text("+");
			attr(button, "class", "change svelte-k3tpp9");
			button.disabled = /*disabled*/ ctx[4];
		},
		m(target, anchor) {
			insert(target, button, anchor);
			append(button, t);

			if (!mounted) {
				dispose = listen(button, "click", /*click_handler*/ ctx[12]);
				mounted = true;
			}
		},
		p(ctx, dirty) {
			if (dirty & /*disabled*/ 16) {
				button.disabled = /*disabled*/ ctx[4];
			}
		},
		d(detaching) {
			if (detaching) detach(button);
			mounted = false;
			dispose();
		}
	};
}

// (94:0) {#if min !== undefined}
function create_if_block$3(ctx) {
	let button;
	let t;
	let mounted;
	let dispose;

	return {
		c() {
			button = element("button");
			t = text("-");
			attr(button, "class", "change svelte-k3tpp9");
			button.disabled = /*disabled*/ ctx[4];
		},
		m(target, anchor) {
			insert(target, button, anchor);
			append(button, t);

			if (!mounted) {
				dispose = listen(button, "click", /*click_handler_1*/ ctx[13]);
				mounted = true;
			}
		},
		p(ctx, dirty) {
			if (dirty & /*disabled*/ 16) {
				button.disabled = /*disabled*/ ctx[4];
			}
		},
		d(detaching) {
			if (detaching) detach(button);
			mounted = false;
			dispose();
		}
	};
}

function create_fragment$9(ctx) {
	let t;
	let if_block1_anchor;
	let if_block0 = /*max*/ ctx[0] !== undefined && create_if_block_1$1(ctx);
	let if_block1 = /*min*/ ctx[1] !== undefined && create_if_block$3(ctx);

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
					if_block0 = create_if_block_1$1(ctx);
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
					if_block1 = create_if_block$3(ctx);
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

function instance$9($$self, $$props, $$invalidate) {
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
					store.features[subtype].data.level.initial += 1;
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
					store.features[subtype].data.level.initial -= 1;
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
						$$invalidate(4, disabled = $doc[type][subtype].data.level.initial === max || $doc[type][subtype].data.level.initial === min || $doc.advancement.xp.get < cost);
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

		init(this, options, instance$9, create_fragment$9, safe_not_equal, {
			max: 0,
			min: 1,
			type: 2,
			subtype: 3,
			cost: 10,
			costLabel: 9
		});
	}
}

/* built\helpers\Character Advancement\TDvariants.svelte generated by Svelte v3.46.4 */

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
	let raw_value = /*val*/ ctx[2][1].data.source.label + "";
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
			if (dirty & /*val*/ 4 && raw_value !== (raw_value = /*val*/ ctx[2][1].data.source.label + "")) td.innerHTML = raw_value;		},
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
	let t_value = /*val*/ ctx[2][1].data.level.initial + "";
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
			if (dirty & /*val*/ 4 && t_value !== (t_value = /*val*/ ctx[2][1].data.level.initial + "")) set_data(t, t_value);
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
	let t_value = /*val*/ ctx[2][1].data.level.max + "";
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
			if (dirty & /*val*/ 4 && t_value !== (t_value = /*val*/ ctx[2][1].data.level.max + "")) set_data(t, t_value);
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
function create_if_block_3(ctx) {
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
function create_if_block_2(ctx) {
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
function create_if_block_1(ctx) {
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
function create_if_block$2(ctx) {
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

function create_fragment$8(ctx) {
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
	let if_block7 = show_if_3 && create_if_block_3(ctx);
	let if_block8 = show_if_2 && create_if_block_2(ctx);
	let if_block9 = show_if_1 && create_if_block_1(ctx);
	let if_block10 = show_if && create_if_block$2(ctx);

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
					if_block7 = create_if_block_3(ctx);
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
					if_block8 = create_if_block_2(ctx);
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
					if_block9 = create_if_block_1(ctx);
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
					if_block10 = create_if_block$2(ctx);
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

function instance$8($$self, $$props, $$invalidate) {
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
			min = aditionalData.feats.awail[val[0]].data.level.current;
			max = aditionalData.feats.awail[val[0]].data.level.max;
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
							$$invalidate(15, variables[variable.shortName] = typeStr === key ? val[1].data.level.initial : 0, variables);
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

		init(this, options, instance$8, create_fragment$8, safe_not_equal, {
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

/* built\helpers\Character Advancement\Attributes.svelte generated by Svelte v3.46.4 */

function get_each_context$5(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[14] = list[i];
	child_ctx[16] = i;
	return child_ctx;
}

function get_each_context_1$3(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[17] = list[i];
	return child_ctx;
}

// (52:8) {#each thead as th}
function create_each_block_1$3(ctx) {
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
			attr(th, "class", "last svelte-d0s3st");
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
function create_each_block$5(ctx) {
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

function create_fragment$7(ctx) {
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
		each_blocks_1[i] = create_each_block_1$3(get_each_context_1$3(ctx, each_value_1, i));
	}

	let each_value = Object.entries(/*$data*/ ctx[1][/*tabData*/ ctx[0]]);
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$5(get_each_context$5(ctx, each_value, i));
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
			attr(tr, "class", "svelte-d0s3st");
			set_style(tr, "width", style_width, false);
			attr(thead_1, "class", "svelte-d0s3st");
			add_render_callback(() => /*thead_1_elementresize_handler*/ ctx[10].call(thead_1));
			set_style(tbody, "--tbodyHeight", 0.95 * /*$element*/ ctx[6].boxHeight - /*$element*/ ctx[6].theadHeight + "px");
			attr(tbody, "class", "svelte-d0s3st");
			attr(table, "class", "svelte-d0s3st");
			attr(label, "for", "description");
			attr(div1, "class", "description svelte-d0s3st");
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
					const child_ctx = get_each_context_1$3(ctx, each_value_1, i);

					if (each_blocks_1[i]) {
						each_blocks_1[i].p(child_ctx, dirty);
					} else {
						each_blocks_1[i] = create_each_block_1$3(child_ctx);
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
					const child_ctx = get_each_context$5(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
						transition_in(each_blocks[i], 1);
					} else {
						each_blocks[i] = create_each_block$5(child_ctx);
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

function instance$7($$self, $$props, $$invalidate) {
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
					attr.mod = Math.floor((attr.value - 10) / 2);
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
		init(this, options, instance$7, create_fragment$7, safe_not_equal, { tabData: 0 });
	}
}

/* built\helpers\Character Advancement\Tabs.svelte generated by Svelte v3.46.4 */

function get_each_context$4(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[9] = list[i];
	return child_ctx;
}

function get_each_context_1$2(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[9] = list[i];
	return child_ctx;
}

// (14:2) {#each tabs as tab}
function create_each_block_1$2(ctx) {
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
function create_if_block$1(ctx) {
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
function create_each_block$4(ctx) {
	let if_block_anchor;
	let current;
	let if_block = /*tab*/ ctx[9].id === /*activeTab*/ ctx[0] && create_if_block$1(ctx);

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
					if_block = create_if_block$1(ctx);
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

function create_fragment$6(ctx) {
	let ul;
	let t;
	let div;
	let div_resize_listener;
	let current;
	let each_value_1 = /*tabs*/ ctx[1];
	let each_blocks_1 = [];

	for (let i = 0; i < each_value_1.length; i += 1) {
		each_blocks_1[i] = create_each_block_1$2(get_each_context_1$2(ctx, each_value_1, i));
	}

	let each_value = /*tabs*/ ctx[1];
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$4(get_each_context$4(ctx, each_value, i));
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
					const child_ctx = get_each_context_1$2(ctx, each_value_1, i);

					if (each_blocks_1[i]) {
						each_blocks_1[i].p(child_ctx, dirty);
					} else {
						each_blocks_1[i] = create_each_block_1$2(child_ctx);
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
					const child_ctx = get_each_context$4(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
						transition_in(each_blocks[i], 1);
					} else {
						each_blocks[i] = create_each_block$4(child_ctx);
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

function instance$6($$self, $$props, $$invalidate) {
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

class Tabs extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$6, create_fragment$6, safe_not_equal, { tabs: 1, activeTab: 0 });
	}
}

/* built\helpers\Character Advancement\cha-adv-shell.svelte generated by Svelte v3.46.4 */

function create_fragment$5(ctx) {
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

	tabs_1 = new Tabs({
			props: { tabs: /*tabs*/ ctx[3], activeTab }
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

const activeTab = "attributes";

function instance$5($$self, $$props, $$invalidate) {
	let $actorData;
	let $changes;
	let { document } = $$props;

	//
	const actor = game.actors.get(document.id);

	const { application } = getContext("external");

	//create list of changes and context for it
	const changes = writable([]);

	component_subscribe($$self, changes, value => $$invalidate(6, $changes = value));
	setContext("chaAdvXpChanges", changes);

	//create context for formulas from setting, CONFIG data, Actor's ID
	setContext("chaAdvXpFormulas", game.settings.get("ard20", "advancement-rate"));

	setContext("chaAdvCONFIG", CONFIG);
	setContext("chaAdvActorOriginalData", actor.data.data);
	setContext("chaAdvActorID", document.id);
	setContext("chaAdvAditionalData", document.aditionalData);

	//create store and context for data
	//TODO: add features and other stuff
	const actorData = writable({
		attributes: duplicate(actor.data.data.attributes),
		skills: duplicate(actor.data.data.skills),
		advancement: duplicate(actor.data.data.advancement),
		proficiencies: duplicate(actor.data.data.proficiencies),
		health: duplicate(actor.data.data.health),
		isReady: duplicate(actor.data.data.isReady),
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

	getContext("chaAdvActorID");
	getContext("chaAdvAditionalData");

	//update actor and do other stuff when click 'submit' button
	async function submitData() {
		const updateObj = {};
		updateObj["data.attributes"] = $actorData.attributes;
		updateObj["data.skills"] = $actorData.skills;
		updateObj["data.advancement.xp"] = $actorData.advancement.xp;
		updateObj["data.isReady"] = true;
		console.log($actorData.features);
		let feats = { new: [], exist: [] };

		$actorData.features.forEach(element => {
			const initLevel = element.data.level.initial;
			const currentLevel = element.data.level.current;

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
		init(this, options, instance$5, create_fragment$5, safe_not_equal, { document: 5 });
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
    // Handle attribute scores.
    for (let [k, v] of obj_entries$1(context.data.attributes)) {
      var _game$i18n$localize;

      //@ts-expect-error
      v.label = (_game$i18n$localize = game.i18n.localize(getValues$1(CONFIG.ARd20.Attributes, k))) !== null && _game$i18n$localize !== void 0 ? _game$i18n$localize : k;
    }
    /*for (let [k, v] of obj_entries(context.data.skills)) {
      //@ts-expect-error
      v.name = game.i18n.localize(getValues(CONFIG.ARd20.Skills, k)) ?? k;
      v.rank_name = game.i18n.localize(getValues(CONFIG.ARd20.Rank, v.rank)) ?? v.rank;
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
                  item.data = foundry.utils.deepClone(doc.data.data);
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
                  item.data = foundry.utils.deepClone(feat.data.data);
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
              attribute: duplicate(actor.data.data.isReady),
              race: duplicate(actor.data.data.isReady),
              final: duplicate(actor.data.data.isReady)
            }
          };
          return obj;
        }

        const document = {
          id: actor.id,
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

/* built\general svelte components\SettingsSubmitButton.svelte generated by Svelte v3.46.4 */

function create_fragment$4(ctx) {
	let button;
	let mounted;
	let dispose;

	return {
		c() {
			button = element("button");
			button.textContent = "Submit";
			attr(button, "class", "submit svelte-19kds2w");
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

function instance$4($$self, $$props, $$invalidate) {
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
		init(this, options, instance$4, create_fragment$4, safe_not_equal, { setting: 0, data: 1 });
	}
}

/* built\settings\advancement-rate\advancement-rate-shell.svelte generated by Svelte v3.46.4 */

function get_each_context$3(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[18] = list[i];
	child_ctx[19] = list;
	child_ctx[20] = i;
	return child_ctx;
}

// (52:8) {#each Object.values(data.variables) as variable}
function create_each_block$3(ctx) {
	let label;
	let t0_value = /*variable*/ ctx[18].longName + "";
	let t0;
	let label_for_value;
	let t1;
	let input;
	let mounted;
	let dispose;

	function input_input_handler() {
		/*input_input_handler*/ ctx[5].call(input, /*each_value*/ ctx[19], /*variable_index*/ ctx[20]);
	}

	return {
		c() {
			label = element("label");
			t0 = text(t0_value);
			t1 = space();
			input = element("input");
			attr(label, "for", label_for_value = /*variable*/ ctx[18].longName);
			attr(input, "placeholder", "shortName");
		},
		m(target, anchor) {
			insert(target, label, anchor);
			append(label, t0);
			insert(target, t1, anchor);
			insert(target, input, anchor);
			set_input_value(input, /*variable*/ ctx[18].shortName);

			if (!mounted) {
				dispose = listen(input, "input", input_input_handler);
				mounted = true;
			}
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;
			if (dirty & /*Object, data*/ 2 && t0_value !== (t0_value = /*variable*/ ctx[18].longName + "")) set_data(t0, t0_value);

			if (dirty & /*Object, data*/ 2 && label_for_value !== (label_for_value = /*variable*/ ctx[18].longName)) {
				attr(label, "for", label_for_value);
			}

			if (dirty & /*Object, data*/ 2 && input.value !== /*variable*/ ctx[18].shortName) {
				set_input_value(input, /*variable*/ ctx[18].shortName);
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

// (47:0) <ApplicationShell bind:elementRoot>
function create_default_slot$3(ctx) {
	let div8;
	let div1;
	let label0;
	let t1;
	let div0;
	let t2;
	let div3;
	let label1;
	let t4;
	let div2;
	let raw0_value = /*formulaSpan*/ ctx[3].attribute + "";
	let t5;
	let input0;
	let t6;
	let br0;
	let t7;
	let div5;
	let div4;
	let raw1_value = /*formulaSpan*/ ctx[3].skill + "";
	let t8;
	let label2;
	let t10;
	let input1;
	let t11;
	let br1;
	let t12;
	let div7;
	let div6;
	let raw2_value = /*formulaSpan*/ ctx[3].feature + "";
	let t13;
	let label3;
	let t15;
	let input2;
	let t16;
	let settingssubmitbutton;
	let current;
	let mounted;
	let dispose;
	let each_value = Object.values(/*data*/ ctx[1].variables);
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
	}

	settingssubmitbutton = new SettingsSubmitButton({
			props: { setting: setting$3, data: /*data*/ ctx[1] }
		});

	return {
		c() {
			div8 = element("div");
			div1 = element("div");
			label0 = element("label");
			label0.textContent = "CustomValues";
			t1 = space();
			div0 = element("div");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			t2 = space();
			div3 = element("div");
			label1 = element("label");
			label1.textContent = "Attribute Advancement Formula";
			t4 = space();
			div2 = element("div");
			t5 = space();
			input0 = element("input");
			t6 = space();
			br0 = element("br");
			t7 = space();
			div5 = element("div");
			div4 = element("div");
			t8 = space();
			label2 = element("label");
			label2.textContent = "Skill Advancement Formula";
			t10 = space();
			input1 = element("input");
			t11 = space();
			br1 = element("br");
			t12 = space();
			div7 = element("div");
			div6 = element("div");
			t13 = space();
			label3 = element("label");
			label3.textContent = "Feature Advancement Formula";
			t15 = space();
			input2 = element("input");
			t16 = space();
			create_component(settingssubmitbutton.$$.fragment);
			attr(label0, "for", "Custom Values");
			attr(div0, "class", "grid grid-2col");
			attr(label1, "for", "Attribute Formula");
			attr(div2, "class", "span");
			attr(input0, "type", "text");
			attr(div4, "class", "span");
			attr(label2, "for", "Skill Formula");
			attr(input1, "type", "text");
			attr(div6, "class", "span");
			attr(label3, "for", "Feature Formula");
			attr(input2, "type", "text");
			attr(div8, "class", "");
		},
		m(target, anchor) {
			insert(target, div8, anchor);
			append(div8, div1);
			append(div1, label0);
			append(div1, t1);
			append(div1, div0);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(div0, null);
			}

			append(div8, t2);
			append(div8, div3);
			append(div3, label1);
			append(div3, t4);
			append(div3, div2);
			div2.innerHTML = raw0_value;
			append(div3, t5);
			append(div3, input0);
			/*input0_binding*/ ctx[7](input0);
			set_input_value(input0, /*data*/ ctx[1].formulas.attributes);
			append(div8, t6);
			append(div8, br0);
			append(div8, t7);
			append(div8, div5);
			append(div5, div4);
			div4.innerHTML = raw1_value;
			append(div5, t8);
			append(div5, label2);
			append(div5, t10);
			append(div5, input1);
			/*input1_binding*/ ctx[10](input1);
			set_input_value(input1, /*data*/ ctx[1].formulas.skills);
			append(div8, t11);
			append(div8, br1);
			append(div8, t12);
			append(div8, div7);
			append(div7, div6);
			div6.innerHTML = raw2_value;
			append(div7, t13);
			append(div7, label3);
			append(div7, t15);
			append(div7, input2);
			/*input2_binding*/ ctx[13](input2);
			set_input_value(input2, /*data*/ ctx[1].formulas.features);
			append(div8, t16);
			mount_component(settingssubmitbutton, div8, null);
			current = true;

			if (!mounted) {
				dispose = [
					listen(input0, "input", /*input_handler*/ ctx[6]),
					listen(input0, "input", /*input0_input_handler*/ ctx[8]),
					listen(input1, "input", /*input_handler_1*/ ctx[9]),
					listen(input1, "input", /*input1_input_handler*/ ctx[11]),
					listen(input2, "input", /*input_handler_2*/ ctx[12]),
					listen(input2, "input", /*input2_input_handler*/ ctx[14])
				];

				mounted = true;
			}
		},
		p(ctx, dirty) {
			if (dirty & /*Object, data*/ 2) {
				each_value = Object.values(/*data*/ ctx[1].variables);
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$3(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block$3(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(div0, null);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}

				each_blocks.length = each_value.length;
			}

			if ((!current || dirty & /*formulaSpan*/ 8) && raw0_value !== (raw0_value = /*formulaSpan*/ ctx[3].attribute + "")) div2.innerHTML = raw0_value;
			if (dirty & /*data*/ 2 && input0.value !== /*data*/ ctx[1].formulas.attributes) {
				set_input_value(input0, /*data*/ ctx[1].formulas.attributes);
			}

			if ((!current || dirty & /*formulaSpan*/ 8) && raw1_value !== (raw1_value = /*formulaSpan*/ ctx[3].skill + "")) div4.innerHTML = raw1_value;
			if (dirty & /*data*/ 2 && input1.value !== /*data*/ ctx[1].formulas.skills) {
				set_input_value(input1, /*data*/ ctx[1].formulas.skills);
			}

			if ((!current || dirty & /*formulaSpan*/ 8) && raw2_value !== (raw2_value = /*formulaSpan*/ ctx[3].feature + "")) div6.innerHTML = raw2_value;
			if (dirty & /*data*/ 2 && input2.value !== /*data*/ ctx[1].formulas.features) {
				set_input_value(input2, /*data*/ ctx[1].formulas.features);
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
			if (detaching) detach(div8);
			destroy_each(each_blocks, detaching);
			/*input0_binding*/ ctx[7](null);
			/*input1_binding*/ ctx[10](null);
			/*input2_binding*/ ctx[13](null);
			destroy_component(settingssubmitbutton);
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
		/*applicationshell_elementRoot_binding*/ ctx[15](value);
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

			if (dirty & /*$$scope, data, formulaInput, formulaSpan, Object*/ 2097166) {
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

const setting$3 = "advancement-rate";

function instance$3($$self, $$props, $$invalidate) {
	let data = game.settings.get("ard20", setting$3);
	let funcList = Object.getOwnPropertyNames(math);
	let { elementRoot } = $$props;
	let formulaInput = { attribute: '', skill: '', feature: '' };

	let formulaSpan = {
		attribute: formulaInput.attribute,
		skill: formulaInput.skill,
		feature: formulaInput.feature
	};

	function validateInput(val, type) {
		$$invalidate(3, formulaSpan[type] = val, formulaSpan);
		let checkArr = val.split(/[./+\*,^\s]+/);

		for (let item of checkArr) {
			if (item !== "" && isNaN(item)) {
				let check = !funcList.includes(item);

				if (check) {
					let regexp = new RegExp(`(?<!>|<)${item}\\b(?!\w|>)`, "");
					$$invalidate(3, formulaSpan[type] = formulaSpan[type].replace(regexp, `<span style="color:red">${item}</span>`), formulaSpan);
				}
			}
		}
	}

	function input_input_handler(each_value, variable_index) {
		each_value[variable_index].shortName = this.value;
		$$invalidate(1, data);
	}

	const input_handler = () => {
		validateInput(formulaInput.attribute.value, 'attribute');
	};

	function input0_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			formulaInput.attribute = $$value;
			$$invalidate(2, formulaInput);
		});
	}

	function input0_input_handler() {
		data.formulas.attributes = this.value;
		$$invalidate(1, data);
	}

	const input_handler_1 = () => {
		validateInput(formulaInput.skill.value, 'skill');
	};

	function input1_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			formulaInput.skill = $$value;
			$$invalidate(2, formulaInput);
		});
	}

	function input1_input_handler() {
		data.formulas.skills = this.value;
		$$invalidate(1, data);
	}

	const input_handler_2 = () => {
		validateInput(formulaInput.feature.value, 'feature');
	};

	function input2_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			formulaInput.feature = $$value;
			$$invalidate(2, formulaInput);
		});
	}

	function input2_input_handler() {
		data.formulas.features = this.value;
		$$invalidate(1, data);
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
			{
				for (let item of Object.values(data.variables)) {
					console.log(item);
					funcList.push(item);
				}
				console.log(funcList);
			}
		}
	};

	return [
		elementRoot,
		data,
		formulaInput,
		formulaSpan,
		validateInput,
		input_input_handler,
		input_handler,
		input0_binding,
		input0_input_handler,
		input_handler_1,
		input1_binding,
		input1_input_handler,
		input_handler_2,
		input2_binding,
		input2_input_handler,
		applicationshell_elementRoot_binding
	];
}

class Advancement_rate_shell extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$3, create_fragment$3, safe_not_equal, { elementRoot: 0 });
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

/* built\settings\FeatSetting\featSetting-shell.svelte generated by Svelte v3.46.4 */

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
function create_default_slot$2(ctx) {
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

function create_fragment$2(ctx) {
	let applicationshell;
	let updating_elementRoot;
	let current;

	function applicationshell_elementRoot_binding(value) {
		/*applicationshell_elementRoot_binding*/ ctx[10](value);
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

function instance$2($$self, $$props, $$invalidate) {
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
		init(this, options, instance$2, create_fragment$2, safe_not_equal, { elementRoot: 0, data: 1 });
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

/* built\settings\ProfSetting\profSetting-shell.svelte generated by Svelte v3.46.4 */

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
			attr(span, "class", "svelte-1v3311j");

			attr(li, "class", li_class_value = "" + (null_to_empty(/*activeTabValue*/ ctx[2] === /*item*/ ctx[21].id
			? "active"
			: "") + " svelte-1v3311j"));
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
			: "") + " svelte-1v3311j"))) {
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
			attr(button0, "class", "svelte-1v3311j");
			attr(button1, "class", "svelte-1v3311j");
			attr(button2, "class", "svelte-1v3311j");
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
			attr(button, "class", "minus far fa-minus-square svelte-1v3311j");
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
function create_default_slot$1(ctx) {
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
			attr(button0, "class", "svelte-1v3311j");
			attr(button1, "class", "svelte-1v3311j");
			attr(div0, "class", "flexrow");
			attr(ul, "class", "svelte-1v3311j");
			attr(div1, "class", "box svelte-1v3311j");
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

function create_fragment$1(ctx) {
	let applicationshell;
	let updating_elementRoot;
	let current;

	function applicationshell_elementRoot_binding(value) {
		/*applicationshell_elementRoot_binding*/ ctx[19](value);
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

function instance$1($$self, $$props, $$invalidate) {
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
		init(this, options, instance$1, create_fragment$1, safe_not_equal, { elementRoot: 0 }, null, [-1, -1]);
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

/* built\settings\ProfLevelsSetting\profLevelSetting-shell.svelte generated by Svelte v3.46.4 */

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
function create_default_slot(ctx) {
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

function create_fragment(ctx) {
	let applicationshell;
	let updating_elementRoot;
	let current;

	function applicationshell_elementRoot_binding(value) {
		/*applicationshell_elementRoot_binding*/ ctx[7](value);
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

function instance($$self, $$props, $$invalidate) {
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
		init(this, options, instance, create_fragment, safe_not_equal, { elementRoot: 0 });
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
  //check if typhonjs module is installed and activated
  if (!game.modules.get("typhonjs")) {
    ui.notifications.error("typhonjs module is not install, please install it!");
  } else if (!game.modules.get("typhonjs").active) {
    ui.notifications.error("typhonjs module is not active!");
    const moduleSettings = game.settings.get('core', 'moduleConfiguration');
    moduleSettings["typhonjs"] = true;
    await game.settings.set('core', 'moduleConfiguration', moduleSettings);
  } // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to


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
    const actorData = this.data; // Make separate methods for each Actor type (character, npc, etc.) to keep
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
            def_dam.phys[key].bonus += ph.type !== "imm" ? parseInt(ph.value) : 0;
            def_dam.phys[key].type = ph.type === "imm" ? "imm" : def_dam.phys[key].type;
          }

          for (let key of obj_keys$1(def_dam.mag)) {
            let mg = item.data.data.res.mag[key];
            def_dam.mag[key].bonus += mg.type !== "imm" ? parseInt(mg.value) : 0;
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
    }

    const profLevelSetting = game.settings.get("ard20", "profLevel");
    const maxProfLevel = profLevelSetting.length - 1; //calculate rolls for character's skills

    for (let [key, skill] of obj_entries$1(data.skills)) {
      var _game$i18n$localize3;

      skill.level = skill.level < maxProfLevel ? skill.level : maxProfLevel;
      skill.value = skill.level * 4 + skill.bonus;
      skill.name = (_game$i18n$localize3 = game.i18n.localize(CONFIG.ARd20.Skills[key])) !== null && _game$i18n$localize3 !== void 0 ? _game$i18n$localize3 : CONFIG.ARd20.Skills[key];
      skill.rankName = profLevelSetting[skill.level].label;
    }

    proficiencies.weapon = game.settings.get("ard20", "proficiencies").weapon.value.map((setting, key) => {
      var _proficiencies$weapon, _proficiencies$weapon2, _proficiencies$weapon3, _proficiencies$weapon4;

      return {
        name: setting.name,
        type: setting.type,
        value: (_proficiencies$weapon = (_proficiencies$weapon2 = proficiencies.weapon[key]) === null || _proficiencies$weapon2 === void 0 ? void 0 : _proficiencies$weapon2.value) !== null && _proficiencies$weapon !== void 0 ? _proficiencies$weapon : 0,
        rankName: profLevelSetting[(_proficiencies$weapon3 = (_proficiencies$weapon4 = proficiencies.weapon[key]) === null || _proficiencies$weapon4 === void 0 ? void 0 : _proficiencies$weapon4.value) !== null && _proficiencies$weapon3 !== void 0 ? _proficiencies$weapon3 : 0].label
      };
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
   * Roll an Attribute Test
   * Prompt the user for input regarding Advantage/Disadvantage and any Situational Bonus
   * @param {Number} attributeId    The ability ID (e.g. "str")
   * @param {Object} options      Options which configure how ability tests are rolled
   * @return {Promise<Roll>}      A Promise which resolves to the created Roll instance
   */


  rollAttributeTest(attributeId, options) {
    var _options$parts;

    const label = game.i18n.localize(getValues$1(CONFIG.ARd20.Attributes, attributeId));
    const actorData = this.data.data;
    const attributes = actorData.attributes;
    const attr = getValues$1(attributes, attributeId); // Construct parts

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
    var _options$parts2;

    console.log("rollSkill event:", skillId, "skillID;   ", options, "options;   ");
    const skl = getValues$1(this.data.data.skills, skillId); // Compose roll parts and data

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
