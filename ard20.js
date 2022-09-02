var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
class D20Roll extends Roll {
    constructor(formula, data, options = {}) {
        super(formula, data, options);
        this.configureModifiers();
    }

    get hasAdvantage() {
        return this.options.advantageMode === D20Roll.ADV_MODE.ADVANTAGE;
    }

    get hasDisadvantage() {
        return this.options.advantageMode === D20Roll.ADV_MODE.DISADVANTAGE;
    }

    configureModifiers() {
        const d20 = this.terms[0];
        const mainDice = game.settings.get("ard20", "mainDiceType");
        d20.modifiers = [];
        if (this.hasAdvantage) {
            d20.number = mainDice[0] * 2;
            d20.modifiers.push(`kh${d20.number / 2}`);
            d20.options.advantage = true;
        }
        else if (this.hasDisadvantage) {
            d20.number = mainDice[0] * 2;
            d20.modifiers.push(`kl${d20.number / 2}`);
            d20.options.disadvantage = true;
        }
        else
            d20.number = mainDice[0] * 1;
        if (this.options.critical)
            d20.options.critical = this.options.critical;
        if (this.options.fumble)
            d20.options.fumble = this.options.fumble;
        if (this.options.targetValue)
            d20.options.target = this.options.targetValue;
        this._formula = this.constructor.getFormula(this.terms);
    }

    async toMessage(messageData = {}, options = {}) {
        if (!this._evaluated)
            await this.evaluate({ async: true });
        messageData.flavor = messageData.flavor || this.options.flavor;
        if (this.hasAdvantage)
            messageData.flavor += ` (${game.i18n.localize("ARd20.Advantage")})`;
        else if (this.hasDisadvantage)
            messageData.flavor += ` (${game.i18n.localize("ARd20.Disadvantage")})`;
        options.rollMode = options.rollMode ?? this.options.rollMode;
        return super.toMessage(messageData, options);
    }

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
        const content = await renderTemplate(template ?? this.constructor.EVALUATION_TEMPLATE, {
      formula: `${this.formula} + @bonus`,
      defaultRollMode,
      rollModes: CONFIG.Dice.rollModes,
      chooseModifier,
      defaultAttribute,
      attributes: CONFIG.ARd20.Attributes,
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
    }
    return new Promise((resolve) => {
      new Dialog(
        {
          title,
          content,
          buttons: {
            advantage: {
              label: game.i18n.localize("ARd20.Advantage"),
              callback: (html) => resolve(this._onDialogSubmit(html, D20Roll.ADV_MODE.ADVANTAGE))
            },
            normal: {
              label: game.i18n.localize("ARd20.Normal"),
              callback: (html) => resolve(this._onDialogSubmit(html, D20Roll.ADV_MODE.NORMAL))
            },
            disadvantage: {
              label: game.i18n.localize("ARd20.Disadvantage"),
              callback: (html) => resolve(this._onDialogSubmit(html, D20Roll.ADV_MODE.DISADVANTAGE))
            }
          },
          default: defaultButton,
          close: () => resolve(null)
        },
        options
      ).render(true);
    });
  }
  _onDialogSubmit(html, advantageMode) {
    const form = html[0].querySelector("form");
    console.log(this);
    console.log(form, "\u0424\u041E\u0420\u041C\u0410");
    if (form.bonus.value) {
      const bonus = new Roll(form.bonus.value, this.data);
      if (!(bonus.terms[0] instanceof OperatorTerm))
        this.terms.push(new OperatorTerm({ operator: "+" }));
      this.terms = this.terms.concat(bonus.terms);
    }
    if (form.attribute?.value) {
      const abl = this.data.attributes[form.attribute.value];
      console.log(abl);
      this.terms.findSplice((t) => t.term === "@mod", new NumericTerm({ number: abl.mod }));
      this.options.flavor += ` (${game.i18n.localize(CONFIG.ARd20.Attributes[form.attribute.value])})`;
    }
    this.options.advantageMode = advantageMode;
    this.options.rollMode = form.rollMode.value;
    this.options.mRoll = form.mRoll?.checked;
    this.configureModifiers();
    return this;
  }
}
__name(D20Roll, "D20Roll");
D20Roll.ADV_MODE = {
  NORMAL: 0,
  ADVANTAGE: 1,
  DISADVANTAGE: -1
};
D20Roll.EVALUATION_TEMPLATE = "systems/ard20/templates/chat/roll-dialog.html";

class DamageRoll extends Roll {
    constructor(formula, data, options) {
        super(formula, data, options);
        if (this.options.critical !== void 0)
            this.configureDamage();
    }

    get isCritical() {
        return this.options.critical;
    }

    configureDamage() {
        let critBonus = 0;
        for (let [i, term] of this.terms.entries()) {
            if (!(term instanceof OperatorTerm)) {
                term.options.damageType = i !== 0 && this.terms[i - 1] instanceof OperatorTerm ? this.options.damageType[i - 1] : this.options.damageType[i];
            }
            if (term instanceof DiceTerm) {
                term.options.baseNumber = term.options.baseNumber ?? term.number;
                term.number = term.options.baseNumber;
                if (this.isCritical) {
                    critBonus += term.number * term.faces;
                    let [oper, num] = [new OperatorTerm({ operator: "+" }), new NumericTerm({
                        number: critBonus,
                        options: { flavor: "Crit" }
                    })];
                    this.terms.splice(1, 0, oper);
                    this.terms.splice(2, 0, num);
                    let cb = this.options.criticalBonusDice && i === 0 ? this.options.criticalBonusDice : 0;
                    term.alter(1, cb);
                    term.options.critical = true;
                }
            }
            else if (this.options.multiplyNumeric && term instanceof NumericTerm) {
                term.options.baseNumber = term.options.baseNumber ?? term.number;
                term.number = term.options.baseNumber;
                if (this.isCritical) {
                    term.number *= this.options.criticalMultiplier ?? 2;
                    term.options.critical = true;
                }
            }
        }
        this._formula = this.constructor.getFormula(this.terms);
    }

    toMessage(messageData = {}, options = {}) {
        messageData.flavor = messageData.flavor || this.options.flavor;
        if (this.isCritical) {
            const label = game.i18n.localize("ARd20.CriticalHit");
            messageData.flavor = messageData.flavor ? `${messageData.flavor} (${label})` : label;
        }
        options.rollMode = options.rollMode ?? this.options.rollMode;
        return super.toMessage(messageData, options);
    }

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
        const content = await renderTemplate(template ?? this.constructor.EVALUATION_TEMPLATE, {
            formula: `${this.formula} + @bonus`,
            defaultRollMode,
            rollModes: CONFIG.Dice.rollModes,
            canMult,
      damType,
      mRoll
    });
    return new Promise((resolve) => {
      new Dialog({
        title,
        content,
        buttons: {
          critical: {
            condition: allowCritical,
            label: game.i18n.localize("ARd20.CriticalHit"),
            callback: (html) => resolve(this._onDialogSubmit(html, true))
          },
          normal: {
            label: game.i18n.localize(allowCritical ? "ARd20.Normal" : "ARd20.Roll"),
            callback: (html) => resolve(this._onDialogSubmit(html, false))
          }
        },
        default: defaultCritical ? "critical" : "normal",
        close: () => resolve(null)
      }, options).render(true);
    });
  }
  _onDialogSubmit(html, isCritical) {
    const form = html[0].querySelector("form");
    if (form.bonus.value) {
      const bonus = new Roll(form.bonus.value, this.data);
      if (!(bonus.terms[0] instanceof OperatorTerm))
        this.terms.push(new OperatorTerm({ operator: "+" }));
      this.terms = this.terms.concat(bonus.terms);
    }
    this.options.critical = isCritical;
    this.options.rollMode = form.rollMode.value;
    this.options.damageType.forEach((part, ind) => this.options.damageType[ind] = form[`damageType.${ind}`] ? part[form[`damageType.${ind}`].value] : part[0]);
    this.options.mRoll = form.mRoll?.checked;
    this.configureDamage();
    return this;
  }
  static fromData(data) {
    const roll = super.fromData(data);
    roll._formula = this.getFormula(roll.terms);
    return roll;
  }
}
__name(DamageRoll, "DamageRoll");
DamageRoll.EVALUATION_TEMPLATE = "systems/ard20/templates/chat/roll-dialog.html";
function simplifyRollFormula(formula, data, options = { constantFirst: false }) {
    const roll = new Roll(formula, data);
    const terms = roll.terms;
    if (terms.some(_isUnsupportedTerm))
        return roll.formula;
    const rollableTerms = [];
    const constantTerms = [];
    let operators = [];
    for (let term of terms) {
        if (term instanceof OperatorTerm)
            operators.push(term);
        else {
            if (term instanceof DiceTerm) {
                rollableTerms.push(...operators);
                rollableTerms.push(term);
            }
            else {
                constantTerms.push(...operators);
                constantTerms.push(term);
            }
            operators = [];
        }
    }
    const constantFormula = Roll.getFormula(constantTerms);
    const rollableFormula = Roll.getFormula(rollableTerms);
    let constantPart = void 0;
    if (constantFormula) {
        try {
            constantPart = Roll.safeEval(constantFormula);
        } catch (err) {
            console.warn(`Unable to evaluate constant term ${constantFormula} in simplifyRollFormula`);
        }
    }
    const parts = options.constantFirst ? [constantPart, rollableFormula] : [rollableFormula, constantPart];
    return new Roll(parts.filterJoin(" + ")).formula;
}
__name(simplifyRollFormula, "simplifyRollFormula");
function _isUnsupportedTerm(term) {
  const diceTerm = term instanceof DiceTerm;
  const operator = term instanceof OperatorTerm && ["+", "-"].includes(term.operator);
  const number = term instanceof NumericTerm;
  return !(diceTerm || operator || number);
}
__name(_isUnsupportedTerm, "_isUnsupportedTerm");
async function d20Roll({
  parts = [],
  data = {},
  advantage,
  disadvantage,
  fumble = 1,
  critical = 20,
  targetValue,
  chooseModifier = false,
  fastForward = false,
  event,
  template,
  title,
  dialogOptions,
  chatMessage = true,
  messageData = {},
  rollMode,
  speaker,
  options,
  flavor,
  canMult,
  mRoll
} = {}) {
    const mainDie = new Roll(game.settings.get("ard20", "mainDiceType")).terms[0];
    fumble = mainDie.number;
    critical = mainDie.number * mainDie.faces;
    const { advantageMode, isFF } = _determineAdvantageMode({ advantage, disadvantage, fastForward, event });
    const formula = [mainDie.formula].concat(parts).join(" + ");
    const defaultRollMode = rollMode || game.settings.get("core", "rollMode");
    if (chooseModifier && !isFF) {
        data["mod"] = "@mod";
    }
    const roll = new CONFIG.Dice.D20Roll(formula, data, {
        flavor: flavor || title,
        advantageMode,
        defaultRollMode,
        critical,
        fumble,
        targetValue,
        mRoll
    });
    if (!isFF) {
        const configured = await roll.configureDialog(
            {
                title,
                chooseModifier,
                defaultRollMode,
                defaultAction: advantageMode,
                defaultAbility: data?.item?.ability,
                template,
                canMult,
                mRoll
            },
            dialogOptions
        );
        if (configured === null)
            return null;
    }
    await roll.evaluate({ async: true });
    if (speaker) {
        console.warn(
            `You are passing the speaker argument to the d20Roll function directly which should instead be passed as an internal key of messageData`
        );
        messageData.speaker = speaker;
    }
    if (roll && chatMessage)
        await roll.toMessage(messageData, options);
    return roll;
}
__name(d20Roll, "d20Roll");
function _determineAdvantageMode({ event, advantage = false, disadvantage = false, fastForward = false } = {}) {
  const isFF = fastForward || event && (event.shiftKey || event.altKey || event.ctrlKey || event.metaKey);
  let advantageMode = CONFIG.Dice.D20Roll.ADV_MODE.NORMAL;
  if (advantage || event?.altKey)
    advantageMode = CONFIG.Dice.D20Roll.ADV_MODE.ADVANTAGE;
  else if (disadvantage || event?.ctrlKey || event?.metaKey)
    advantageMode = CONFIG.Dice.D20Roll.ADV_MODE.DISADVANTAGE;
  return { isFF, advantageMode };
}
__name(_determineAdvantageMode, "_determineAdvantageMode");
async function damageRoll({
  parts = [],
  data,
  critical = false,
  damType,
  damageType,
  criticalBonusDice,
  criticalMultiplier,
  multiplyNumeric,
  fastForward = false,
  event,
  allowCritical = true,
  template,
  title,
  dialogOptions,
  chatMessage = false,
  messageData = {},
  rollMode,
  speaker,
  canMult,
  flavor,
  mRoll
} = {}) {
    console.log(canMult);
    const defaultRollMode = rollMode || game.settings.get("core", "rollMode");
    const formula = parts.join(" + ");
    const { isCritical, isFF } = _determineCriticalMode({ critical, fastForward, event });
    const roll = new CONFIG.Dice.DamageRoll(formula, data, {
        flavor: flavor || title,
        critical: isCritical,
        criticalBonusDice,
        criticalMultiplier,
        multiplyNumeric,
        damType,
        mRoll,
        damageType
    });
    if (!isFF) {
        const configured = await roll.configureDialog(
            {
                title,
                defaultRollMode,
                defaultCritical: isCritical,
                template,
                allowCritical,
                mRoll,
                canMult,
                damType
            },
            dialogOptions
        );
        if (configured === null)
            return null;
    }
    await roll.evaluate({ async: true });
    if (speaker) {
        console.warn(
            `You are passing the speaker argument to the damageRoll function directly which should instead be passed as an internal key of messageData`
        );
        messageData.speaker = speaker;
    }
    if (roll && chatMessage)
        await roll.toMessage(messageData);
    return roll;
}
__name(damageRoll, "damageRoll");
function _determineCriticalMode({ event, critical = false, fastForward = false } = {}) {
  const isFF = fastForward || event && (event.shiftKey || event.altKey || event.ctrlKey || event.metaKey);
  if (event?.altKey)
    critical = true;
  return { isFF, isCritical: critical };
}
__name(_determineCriticalMode, "_determineCriticalMode");
const dice = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  simplifyRollFormula,
  d20Roll,
  damageRoll,
  D20Roll,
  DamageRoll
}, Symbol.toStringTag, { value: "Module" }));

class ARd20Actor extends Actor {
    prepareData() {
        super.prepareData();
        this.items.forEach((item) => item.prepareFinalAttributes());
    }

    prepareBaseData() {
        super.prepareBaseData();
        if (this.type !== "character") {
            return;
        }
        for (let resist of Object.values(this.system.defences.damage.phys)) {
            resist = 0;
        }
        for (let resist of Object.values(this.system.defences.damage.mag)) {
            resist = 0;
        }
        this.itemTypes.armor.forEach((item) => {
            for (const [key, resist] of Object.entries(item.system.res.phys)) {
                this.system.defences.damage.phys[key].value += parseInt(resist.value);
            }
            for (const [key, resist] of Object.entries(item.system.res.mag)) {
                this.system.defences.damage.mag[key].value += parseInt(resist.value);
            }
        });
    }

    prepareDerivedData() {
        const actorData = this.system;
        this._prepareCharacterData(actorData);
        this._prepareNpcData(actorData);
    }

    _prepareCharacterData(actorData) {
        if (this.type !== "character") {
            return;
        }
        this.prepareAttributes(actorData);
        this.prepareSkills(actorData);
        this.prepareResources(actorData);
        const attributes = actorData.attributes;
        const advancement = actorData.advancement;
        const def_stats = actorData.defences.stats;
        const def_dam = actorData.defences.damage;
        const proficiencies = actorData.proficiencies;
        actorData.mobility.value = 0;
        this.itemTypes.armor.forEach((item) => {
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
        actorData.mobility.value += actorData.mobility.bonus;
        let dexMod = actorData.mobility.value < 10 ? attributes.dex.mod : actorData.mobility.value < 16 ? Math.min(2, attributes.dex.mod) : Math.min(0, attributes.dex.mod);
        const levels = CONFIG.ARd20.CHARACTER_EXP_LEVELS;
        if (advancement.xp.used) {
            advancement.xp.used = advancement.xp.used ?? 0;
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
        const profLevelSetting = game.settings.get("ard20", "profLevel");
        proficiencies.weapon = game.settings.get("ard20", "proficiencies").weapon.value.map((setting2, key) => {
            return {
                name: setting2.name,
                type: setting2.type,
                value: proficiencies.weapon[key]?.value ?? 0,
                rankName: profLevelSetting[proficiencies.weapon[key]?.value ?? 0].label
            };
        });
        actorData.speed.value = this.itemTypes.race[0]?.type === "race" ? this.itemTypes.race[0].system.speed : 0;
        actorData.speed.value += attributes.dex.mod + actorData.speed.bonus;
    }

    prepareAttributes(actorData) {
        const attributes = actorData.attributes;
        for (let [key, attribute] of Object.entries(attributes)) {
            attribute.total = attribute.value + attribute.bonus;
            attribute.mod = attribute.value - 10;
            attribute.label = game.i18n.localize(CONFIG.ARd20.Attributes[key]) ?? key;
        }
    }

    prepareSkills(actorData) {
        const mainDie = game.settings.get("ard20", "mainDiceType");
        const skillLevelBonus = mainDie === "2d10" ? 3 : 4;
        const profLevelSetting = game.settings.get("ard20", "profLevel");
        const maxProfLevel = profLevelSetting.length - 1;
        const skills = actorData.skills;
        for (let [key, skill] of Object.entries(skills)) {
            skill.level = skill.level < maxProfLevel ? skill.level : maxProfLevel;
            skill.value = skill.level * skillLevelBonus + skill.bonus;
            skill.name = game.i18n.localize(CONFIG.ARd20.Skills[key]) ?? CONFIG.ARd20.Skills[key];
            skill.rankName = profLevelSetting[skill.level].label;
        }
    }

    prepareResources(actorData) {
        actorData.resources.stamina.max = actorData.attributes.con.total;
        actorData.resources.mana.max = 0;
    }

    _prepareNpcData(actorData) {
        if (this.type !== "npc") {
            return;
        }
        const data = actorData;
        data.xp = data.cr * data.cr * 100;
    }

    getRollData() {
        const data = super.getRollData();
        return data;
    }

    rollAttributeTest(attributeId, options) {
        const label = game.i18n.localize(CONFIG.ARd20.Attributes[attributeId]);
        const actorData = this.system;
        const attributes = actorData.attributes;
        const attr2 = attributes[attributeId];
        const parts = ["@mod"];
        const data = { mod: attr2.mod };
        if (options?.parts?.length > 0) {
            parts.push(...options.parts);
        }
        const rollData = foundry.utils.mergeObject(options, {
            parts,
            data,
            title: game.i18n.format("ARd20.AttributePromptTitle", { attribute: label }),
            messageData: {
                speaker: options.speaker || ChatMessage.getSpeaker({ actor: this }) || this.name,
                "flags.ard20.roll": { type: "attribute", attributeId }
            }
    });
    return d20Roll(rollData);
  }
  rollSkill(skillId, options) {
    console.log("rollSkill event:", skillId, "skillID;   ", options, "options;   ");
    const skl = this.system.skills[skillId];
    const parts = ["@proficiency", "@mod"];
    const data = { attributes: this.getRollData().attributes, proficiency: skl.value };
    if (options.parts?.length > 0) {
      parts.push(...options.parts);
    }
    const rollData = foundry.utils.mergeObject(options, {
      parts,
      data,
      title: game.i18n.format("ARd20.SkillPromptTitle", {
        skill: game.i18n.localize(CONFIG.ARd20.Skills[skillId])
      }),
      messageData: {
        speaker: options.speaker || ChatMessage.getSpeaker({ actor: this }),
        "flags.ard20.roll": { type: "skill", skillId }
      },
      chooseModifier: true
    });
    return d20Roll(rollData);
  }
}
__name(ARd20Actor, "ARd20Actor");

function noop() {
}

__name(noop, "noop");
const identity = /* @__PURE__ */ __name((x) => x, "identity");

function assign(tar, src) {
    for (const k in src)
        tar[k] = src[k];
    return tar;
}

__name(assign, "assign");

function is_promise(value) {
    return value && typeof value === "object" && typeof value.then === "function";
}

__name(is_promise, "is_promise");

function run(fn) {
    return fn();
}

__name(run, "run");

function blank_object() {
    return /* @__PURE__ */ Object.create(null);
}

__name(blank_object, "blank_object");

function run_all(fns) {
    fns.forEach(run);
}
__name(run_all, "run_all");
function is_function(thing) {
  return typeof thing === "function";
}
__name(is_function, "is_function");
function safe_not_equal(a, b) {
  return a != a ? b == b : a !== b || (a && typeof a === "object" || typeof a === "function");
}
__name(safe_not_equal, "safe_not_equal");
let src_url_equal_anchor;
function src_url_equal(element_src, url) {
  if (!src_url_equal_anchor) {
    src_url_equal_anchor = document.createElement("a");
  }
  src_url_equal_anchor.href = url;
  return element_src === src_url_equal_anchor.href;
}
__name(src_url_equal, "src_url_equal");
function is_empty(obj) {
  return Object.keys(obj).length === 0;
}
__name(is_empty, "is_empty");
function subscribe(store, ...callbacks) {
  if (store == null) {
    return noop;
  }
  const unsub = store.subscribe(...callbacks);
  return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
}
__name(subscribe, "subscribe");
function get_store_value(store) {
    let value;
    subscribe(store, (_) => value = _)();
    return value;
}
__name(get_store_value, "get_store_value");
function component_subscribe(component, store, callback) {
  component.$$.on_destroy.push(subscribe(store, callback));
}
__name(component_subscribe, "component_subscribe");
function create_slot(definition, ctx, $$scope, fn) {
  if (definition) {
    const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
    return definition[0](slot_ctx);
  }
}
__name(create_slot, "create_slot");
function get_slot_context(definition, ctx, $$scope, fn) {
  return definition[1] && fn ? assign($$scope.ctx.slice(), definition[1](fn(ctx))) : $$scope.ctx;
}
__name(get_slot_context, "get_slot_context");
function get_slot_changes(definition, $$scope, dirty, fn) {
  if (definition[2] && fn) {
    const lets = definition[2](fn(dirty));
    if ($$scope.dirty === void 0) {
      return lets;
    }
    if (typeof lets === "object") {
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
__name(get_slot_changes, "get_slot_changes");
function update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn) {
  if (slot_changes) {
    const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
    slot.p(slot_context, slot_changes);
  }
}
__name(update_slot_base, "update_slot_base");
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
__name(get_all_dirty_from_scope, "get_all_dirty_from_scope");
function exclude_internal_props(props) {
    const result = {};
    for (const k in props)
        if (k[0] !== "$")
            result[k] = props[k];
    return result;
}
__name(exclude_internal_props, "exclude_internal_props");
function null_to_empty(value) {
    return value == null ? "" : value;
}
__name(null_to_empty, "null_to_empty");
function set_store_value(store, ret, value) {
    store.set(value);
    return ret;
}
__name(set_store_value, "set_store_value");
function action_destroyer(action_result) {
    return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
}
__name(action_destroyer, "action_destroyer");
const is_client = typeof window !== "undefined";
let now = is_client ? () => window.performance.now() : () => Date.now();
let raf = is_client ? (cb) => requestAnimationFrame(cb) : noop;
const tasks = /* @__PURE__ */ new Set();
function run_tasks(now2) {
    tasks.forEach((task) => {
        if (!task.c(now2)) {
            tasks.delete(task);
            task.f();
        }
    });
    if (tasks.size !== 0)
        raf(run_tasks);
}
__name(run_tasks, "run_tasks");
function loop(callback) {
  let task;
  if (tasks.size === 0)
    raf(run_tasks);
  return {
    promise: new Promise((fulfill) => {
      tasks.add(task = { c: callback, f: fulfill });
    }),
    abort() {
      tasks.delete(task);
    }
  };
}
__name(loop, "loop");
function append(target, node) {
  target.appendChild(node);
}
__name(append, "append");
function get_root_for_style(node) {
  if (!node)
    return document;
  const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
  if (root && root.host) {
    return root;
  }
  return node.ownerDocument;
}
__name(get_root_for_style, "get_root_for_style");
function append_empty_stylesheet(node) {
  const style_element = element("style");
  append_stylesheet(get_root_for_style(node), style_element);
  return style_element.sheet;
}
__name(append_empty_stylesheet, "append_empty_stylesheet");
function append_stylesheet(node, style) {
  append(node.head || node, style);
}
__name(append_stylesheet, "append_stylesheet");
function insert(target, node, anchor) {
  target.insertBefore(node, anchor || null);
}
__name(insert, "insert");
function detach(node) {
  node.parentNode.removeChild(node);
}
__name(detach, "detach");
function destroy_each(iterations, detaching) {
  for (let i = 0; i < iterations.length; i += 1) {
    if (iterations[i])
      iterations[i].d(detaching);
  }
}
__name(destroy_each, "destroy_each");
function element(name) {
  return document.createElement(name);
}
__name(element, "element");
function svg_element(name) {
  return document.createElementNS("http://www.w3.org/2000/svg", name);
}
__name(svg_element, "svg_element");
function text(data) {
  return document.createTextNode(data);
}
__name(text, "text");
function space() {
  return text(" ");
}
__name(space, "space");
function empty() {
  return text("");
}
__name(empty, "empty");
function listen(node, event, handler, options) {
  node.addEventListener(event, handler, options);
  return () => node.removeEventListener(event, handler, options);
}
__name(listen, "listen");
function prevent_default(fn) {
  return function(event) {
    event.preventDefault();
    return fn.call(this, event);
  };
}
__name(prevent_default, "prevent_default");
function stop_propagation(fn) {
    return function (event) {
        event.stopPropagation();
        return fn.call(this, event);
    };
}
__name(stop_propagation, "stop_propagation");
function self(fn) {
    return function (event) {
        if (event.target === this)
            fn.call(this, event);
    };
}
__name(self, "self");
function attr(node, attribute, value) {
    if (value == null)
        node.removeAttribute(attribute);
    else if (node.getAttribute(attribute) !== value)
        node.setAttribute(attribute, value);
}
__name(attr, "attr");
function set_svg_attributes(node, attributes) {
    for (const key in attributes) {
        attr(node, key, attributes[key]);
    }
}
__name(set_svg_attributes, "set_svg_attributes");
function children(element2) {
    return Array.from(element2.childNodes);
}
__name(children, "children");
function set_data(text2, data) {
    data = "" + data;
    if (text2.wholeText !== data)
        text2.data = data;
}
__name(set_data, "set_data");
function set_input_value(input, value) {
    input.value = value == null ? "" : value;
}
__name(set_input_value, "set_input_value");
function set_style(node, key, value, important) {
    if (value === null) {
        node.style.removeProperty(key);
    }
    else {
        node.style.setProperty(key, value, important ? "important" : "");
    }
}
__name(set_style, "set_style");
function select_option(select, value) {
    for (let i = 0; i < select.options.length; i += 1) {
        const option = select.options[i];
        if (option.__value === value) {
            option.selected = true;
            return;
        }
    }
    select.selectedIndex = -1;
}
__name(select_option, "select_option");
function select_value(select) {
  const selected_option = select.querySelector(":checked") || select.options[0];
  return selected_option && selected_option.__value;
}
__name(select_value, "select_value");
let crossorigin;
function is_crossorigin() {
  if (crossorigin === void 0) {
    crossorigin = false;
    try {
      if (typeof window !== "undefined" && window.parent) {
        void window.parent.document;
      }
    } catch (error) {
      crossorigin = true;
    }
  }
  return crossorigin;
}
__name(is_crossorigin, "is_crossorigin");
function add_resize_listener(node, fn) {
  const computed_style = getComputedStyle(node);
  if (computed_style.position === "static") {
    node.style.position = "relative";
  }
  const iframe = element("iframe");
  iframe.setAttribute("style", "display: block; position: absolute; top: 0; left: 0; width: 100%; height: 100%; overflow: hidden; border: 0; opacity: 0; pointer-events: none; z-index: -1;");
  iframe.setAttribute("aria-hidden", "true");
  iframe.tabIndex = -1;
  const crossorigin2 = is_crossorigin();
  let unsubscribe;
  if (crossorigin2) {
    iframe.src = "data:text/html,<script>onresize=function(){parent.postMessage(0,'*')}<\/script>";
    unsubscribe = listen(window, "message", (event) => {
      if (event.source === iframe.contentWindow)
        fn();
    });
  } else {
    iframe.src = "about:blank";
    iframe.onload = () => {
      unsubscribe = listen(iframe.contentWindow, "resize", fn);
    };
  }
  append(node, iframe);
  return () => {
    if (crossorigin2) {
      unsubscribe();
    } else if (unsubscribe && iframe.contentWindow) {
      unsubscribe();
    }
    detach(iframe);
  };
}
__name(add_resize_listener, "add_resize_listener");
function toggle_class(element2, name, toggle) {
  element2.classList[toggle ? "add" : "remove"](name);
}
__name(toggle_class, "toggle_class");
function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
  const e = document.createEvent("CustomEvent");
  e.initCustomEvent(type, bubbles, cancelable, detail);
  return e;
}
__name(custom_event, "custom_event");
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
      if (this.is_svg)
        this.e = svg_element(target.nodeName);
      else
        this.e = element(target.nodeName);
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
__name(HtmlTag, "HtmlTag");
const managed_styles = /* @__PURE__ */ new Map();
let active = 0;
function hash(str) {
  let hash2 = 5381;
  let i = str.length;
  while (i--)
    hash2 = (hash2 << 5) - hash2 ^ str.charCodeAt(i);
  return hash2 >>> 0;
}
__name(hash, "hash");
function create_style_information(doc, node) {
  const info = { stylesheet: append_empty_stylesheet(node), rules: {} };
  managed_styles.set(doc, info);
  return info;
}
__name(create_style_information, "create_style_information");
function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
  const step = 16.666 / duration;
  let keyframes = "{\n";
  for (let p = 0; p <= 1; p += step) {
    const t = a + (b - a) * ease(p);
    keyframes += p * 100 + `%{${fn(t, 1 - t)}}
`;
  }
  const rule = keyframes + `100% {${fn(b, 1 - b)}}
}`;
  const name = `__svelte_${hash(rule)}_${uid}`;
  const doc = get_root_for_style(node);
  const { stylesheet, rules } = managed_styles.get(doc) || create_style_information(doc, node);
  if (!rules[name]) {
    rules[name] = true;
    stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
  }
  const animation = node.style.animation || "";
  node.style.animation = `${animation ? `${animation}, ` : ""}${name} ${duration}ms linear ${delay}ms 1 both`;
  active += 1;
  return name;
}
__name(create_rule, "create_rule");
function delete_rule(node, name) {
  const previous = (node.style.animation || "").split(", ");
  const next = previous.filter(
    name ? (anim) => anim.indexOf(name) < 0 : (anim) => anim.indexOf("__svelte") === -1
  );
  const deleted = previous.length - next.length;
  if (deleted) {
    node.style.animation = next.join(", ");
    active -= deleted;
    if (!active)
      clear_rules();
  }
}
__name(delete_rule, "delete_rule");
function clear_rules() {
  raf(() => {
    if (active)
      return;
    managed_styles.forEach((info) => {
      const { stylesheet } = info;
      let i = stylesheet.cssRules.length;
      while (i--)
        stylesheet.deleteRule(i);
      info.rules = {};
    });
    managed_styles.clear();
  });
}
__name(clear_rules, "clear_rules");
let current_component;
function set_current_component(component) {
  current_component = component;
}
__name(set_current_component, "set_current_component");
function get_current_component() {
    if (!current_component)
        throw new Error("Function called outside component initialization");
    return current_component;
}
__name(get_current_component, "get_current_component");
function onMount(fn) {
    get_current_component().$$.on_mount.push(fn);
}
__name(onMount, "onMount");
function createEventDispatcher() {
    const component = get_current_component();
    return (type, detail, { cancelable = false } = {}) => {
        const callbacks = component.$$.callbacks[type];
        if (callbacks) {
            const event = custom_event(type, detail, { cancelable });
            callbacks.slice().forEach((fn) => {
                fn.call(component, event);
            });
            return !event.defaultPrevented;
        }
        return true;
    };
}
__name(createEventDispatcher, "createEventDispatcher");
function setContext(key, context) {
    get_current_component().$$.context.set(key, context);
    return context;
}
__name(setContext, "setContext");
function getContext(key) {
    return get_current_component().$$.context.get(key);
}
__name(getContext, "getContext");
function bubble(component, event) {
    const callbacks = component.$$.callbacks[event.type];
    if (callbacks) {
        callbacks.slice().forEach((fn) => fn.call(this, event));
    }
}
__name(bubble, "bubble");
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
__name(schedule_update, "schedule_update");
function tick() {
  schedule_update();
  return resolved_promise;
}
__name(tick, "tick");
function add_render_callback(fn) {
  render_callbacks.push(fn);
}
__name(add_render_callback, "add_render_callback");
function add_flush_callback(fn) {
  flush_callbacks.push(fn);
}
__name(add_flush_callback, "add_flush_callback");
const seen_callbacks = /* @__PURE__ */ new Set();
let flushidx = 0;
function flush() {
  const saved_component = current_component;
  do {
    while (flushidx < dirty_components.length) {
      const component = dirty_components[flushidx];
      flushidx++;
      set_current_component(component);
      update(component.$$);
    }
    set_current_component(null);
    dirty_components.length = 0;
    flushidx = 0;
    while (binding_callbacks.length)
      binding_callbacks.pop()();
    for (let i = 0; i < render_callbacks.length; i += 1) {
      const callback = render_callbacks[i];
      if (!seen_callbacks.has(callback)) {
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
__name(flush, "flush");
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
__name(update, "update");
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
__name(wait, "wait");
function dispatch(node, direction, kind) {
  node.dispatchEvent(custom_event(`${direction ? "intro" : "outro"}${kind}`));
}
__name(dispatch, "dispatch");
const outroing = /* @__PURE__ */ new Set();
let outros;
function group_outros() {
  outros = {
    r: 0,
    c: [],
    p: outros
  };
}
__name(group_outros, "group_outros");
function check_outros() {
  if (!outros.r) {
    run_all(outros.c);
  }
  outros = outros.p;
}
__name(check_outros, "check_outros");
function transition_in(block, local) {
  if (block && block.i) {
    outroing.delete(block);
    block.i(local);
  }
}
__name(transition_in, "transition_in");
function transition_out(block, local, detach2, callback) {
  if (block && block.o) {
    if (outroing.has(block))
      return;
    outroing.add(block);
    outros.c.push(() => {
      outroing.delete(block);
      if (callback) {
        if (detach2)
          block.d(1);
        callback();
      }
    });
    block.o(local);
  } else if (callback) {
    callback();
  }
}
__name(transition_out, "transition_out");
const null_transition = { duration: 0 };
function create_in_transition(node, fn, params) {
  let config = fn(node, params);
  let running = false;
  let animation_name;
  let task;
  let uid = 0;
  function cleanup() {
    if (animation_name)
      delete_rule(node, animation_name);
  }
  __name(cleanup, "cleanup");
  function go() {
    const { delay = 0, duration = 300, easing = identity, tick: tick2 = noop, css } = config || null_transition;
    if (css)
      animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
    tick2(0, 1);
    const start_time = now() + delay;
    const end_time = start_time + duration;
    if (task)
      task.abort();
    running = true;
    add_render_callback(() => dispatch(node, true, "start"));
    task = loop((now2) => {
      if (running) {
        if (now2 >= end_time) {
          tick2(1, 0);
          dispatch(node, true, "end");
          cleanup();
          return running = false;
        }
        if (now2 >= start_time) {
          const t = easing((now2 - start_time) / duration);
          tick2(t, 1 - t);
        }
      }
      return running;
    });
  }
  __name(go, "go");
  let started = false;
  return {
    start() {
      if (started)
        return;
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
__name(create_in_transition, "create_in_transition");
function create_out_transition(node, fn, params) {
  let config = fn(node, params);
  let running = true;
  let animation_name;
  const group = outros;
  group.r += 1;
  function go() {
    const { delay = 0, duration = 300, easing = identity, tick: tick2 = noop, css } = config || null_transition;
    if (css)
      animation_name = create_rule(node, 1, 0, duration, delay, easing, css);
    const start_time = now() + delay;
    const end_time = start_time + duration;
    add_render_callback(() => dispatch(node, false, "start"));
    loop((now2) => {
      if (running) {
        if (now2 >= end_time) {
          tick2(0, 1);
          dispatch(node, false, "end");
          if (!--group.r) {
            run_all(group.c);
          }
          return false;
        }
        if (now2 >= start_time) {
          const t = easing((now2 - start_time) / duration);
          tick2(1 - t, t);
        }
      }
      return running;
    });
  }
  __name(go, "go");
  if (is_function(config)) {
    wait().then(() => {
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
            if (animation_name)
                delete_rule(node, animation_name);
            running = false;
        }
    }
  };
}
__name(create_out_transition, "create_out_transition");
function create_bidirectional_transition(node, fn, params, intro) {
    let config = fn(node, params);
    let t = intro ? 0 : 1;
    let running_program = null;
    let pending_program = null;
    let animation_name = null;

    function clear_animation() {
        if (animation_name)
            delete_rule(node, animation_name);
    }

    __name(clear_animation, "clear_animation");

    function init2(program, duration) {
        const d = program.b - t;
        duration *= Math.abs(d);
        return {
            a: t,
            b: program.b,
            d,
            duration,
            start: program.start,
            end: program.start + duration,
            group: program.group
        };
    }

    __name(init2, "init");

    function go(b) {
        const { delay = 0, duration = 300, easing = identity, tick: tick2 = noop, css } = config || null_transition;
        const program = {
            start: now() + delay,
            b
        };
        if (!b) {
            program.group = outros;
            outros.r += 1;
        }
        if (running_program || pending_program) {
            pending_program = program;
        }
        else {
            if (css) {
                clear_animation();
                animation_name = create_rule(node, t, b, duration, delay, easing, css);
            }
            if (b)
                tick2(0, 1);
            running_program = init2(program, duration);
            add_render_callback(() => dispatch(node, b, "start"));
            loop((now2) => {
                if (pending_program && now2 > pending_program.start) {
                    running_program = init2(pending_program, duration);
                    pending_program = null;
                    dispatch(node, running_program.b, "start");
                    if (css) {
                        clear_animation();
                        animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                    }
                }
                if (running_program) {
                    if (now2 >= running_program.end) {
                        tick2(t = running_program.b, 1 - t);
                        dispatch(node, running_program.b, "end");
                        if (!pending_program) {
                            if (running_program.b) {
                                clear_animation();
                            }
                            else {
                                if (!--running_program.group.r)
                                    run_all(running_program.group.c);
                            }
                        }
                        running_program = null;
                    }
                    else if (now2 >= running_program.start) {
                        const p = now2 - running_program.start;
                        t = running_program.a + running_program.d * easing(p / running_program.duration);
                        tick2(t, 1 - t);
                    }
                }
                return !!(running_program || pending_program);
            });
        }
    }

    __name(go, "go");
    return {
        run(b) {
            if (is_function(config)) {
                wait().then(() => {
                    config = config();
                    go(b);
                });
            }
            else {
                go(b);
            }
        },
        end() {
            clear_animation();
            running_program = pending_program = null;
        }
    };
}

__name(create_bidirectional_transition, "create_bidirectional_transition");

function handle_promise(promise2, info) {
    const token = info.token = {};

    function update2(type, index, key, value) {
        if (info.token !== token)
            return;
        info.resolved = value;
        let child_ctx = info.ctx;
        if (key !== void 0) {
            child_ctx = child_ctx.slice();
            child_ctx[key] = value;
        }
        const block = type && (info.current = type)(child_ctx);
        let needs_flush = false;
        if (info.block) {
            if (info.blocks) {
                info.blocks.forEach((block2, i) => {
                    if (i !== index && block2) {
                        group_outros();
                        transition_out(block2, 1, 1, () => {
                            if (info.blocks[i] === block2) {
                                info.blocks[i] = null;
                            }
                        });
                        check_outros();
                    }
                });
            }
            else {
                info.block.d(1);
            }
            block.c();
            transition_in(block, 1);
            block.m(info.mount(), info.anchor);
            needs_flush = true;
        }
        info.block = block;
        if (info.blocks)
            info.blocks[index] = block;
        if (needs_flush) {
            flush();
        }
    }

    __name(update2, "update");
    if (is_promise(promise2)) {
        const current_component2 = get_current_component();
        promise2.then((value) => {
            set_current_component(current_component2);
            update2(info.then, 1, info.value, value);
            set_current_component(null);
        }, (error) => {
            set_current_component(current_component2);
            update2(info.catch, 2, info.error, error);
            set_current_component(null);
            if (!info.hasCatch) {
                throw error;
            }
        });
        if (info.current !== info.pending) {
            update2(info.pending, 0);
            return true;
        }
    }
    else {
        if (info.current !== info.then) {
            update2(info.then, 1, info.value, promise2);
            return true;
        }
        info.resolved = promise2;
    }
}

__name(handle_promise, "handle_promise");

function update_await_block_branch(info, ctx, dirty) {
    const child_ctx = ctx.slice();
    const { resolved } = info;
    if (info.current === info.then) {
        child_ctx[info.value] = resolved;
    }
    if (info.current === info.catch) {
        child_ctx[info.error] = resolved;
    }
    info.block.p(child_ctx, dirty);
}

__name(update_await_block_branch, "update_await_block_branch");

function destroy_block(block, lookup) {
    block.d(1);
    lookup.delete(block.key);
}

__name(destroy_block, "destroy_block");

function outro_and_destroy_block(block, lookup) {
    transition_out(block, 1, 1, () => {
        lookup.delete(block.key);
    });
}
__name(outro_and_destroy_block, "outro_and_destroy_block");
function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block2, next, get_context) {
    let o = old_blocks.length;
    let n = list.length;
    let i = o;
    const old_indexes = {};
    while (i--)
        old_indexes[old_blocks[i].key] = i;
    const new_blocks = [];
    const new_lookup = /* @__PURE__ */ new Map();
    const deltas = /* @__PURE__ */ new Map();
    i = n;
    while (i--) {
        const child_ctx = get_context(ctx, list, i);
        const key = get_key(child_ctx);
        let block = lookup.get(key);
        if (!block) {
            block = create_each_block2(key, child_ctx);
            block.c();
        }
        else if (dynamic) {
            block.p(child_ctx, dirty);
        }
        new_lookup.set(key, new_blocks[i] = block);
        if (key in old_indexes)
            deltas.set(key, Math.abs(i - old_indexes[key]));
    }
    const will_move = /* @__PURE__ */ new Set();
    const did_move = /* @__PURE__ */ new Set();

    function insert2(block) {
        transition_in(block, 1);
        block.m(node, next);
        lookup.set(block.key, block);
        next = block.first;
        n--;
    }

    __name(insert2, "insert");
    while (o && n) {
        const new_block = new_blocks[n - 1];
        const old_block = old_blocks[o - 1];
        const new_key = new_block.key;
        const old_key = old_block.key;
        if (new_block === old_block) {
            next = new_block.first;
            o--;
            n--;
        }
        else if (!new_lookup.has(old_key)) {
            destroy(old_block, lookup);
            o--;
        }
        else if (!lookup.has(new_key) || will_move.has(new_key)) {
            insert2(new_block);
        }
        else if (did_move.has(old_key)) {
            o--;
        }
        else if (deltas.get(new_key) > deltas.get(old_key)) {
            did_move.add(new_key);
            insert2(new_block);
        }
        else {
            will_move.add(old_key);
            o--;
        }
    }
    while (o--) {
        const old_block = old_blocks[o];
        if (!new_lookup.has(old_block.key))
            destroy(old_block, lookup);
    }
    while (n)
        insert2(new_blocks[n - 1]);
    return new_blocks;
}
__name(update_keyed_each, "update_keyed_each");
function get_spread_update(levels, updates) {
  const update2 = {};
  const to_null_out = {};
  const accounted_for = { $$scope: 1 };
  let i = levels.length;
  while (i--) {
    const o = levels[i];
    const n = updates[i];
    if (n) {
      for (const key in o) {
        if (!(key in n))
          to_null_out[key] = 1;
      }
      for (const key in n) {
        if (!accounted_for[key]) {
          update2[key] = n[key];
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
    if (!(key in update2))
      update2[key] = void 0;
  }
  return update2;
}
__name(get_spread_update, "get_spread_update");
function get_spread_object(spread_props) {
  return typeof spread_props === "object" && spread_props !== null ? spread_props : {};
}
__name(get_spread_object, "get_spread_object");
function bind(component, name, callback) {
  const index = component.$$.props[name];
  if (index !== void 0) {
    component.$$.bound[index] = callback;
    callback(component.$$.ctx[index]);
  }
}
__name(bind, "bind");
function create_component(block) {
  block && block.c();
}
__name(create_component, "create_component");
function mount_component(component, target, anchor, customElement) {
  const { fragment, on_mount, on_destroy, after_update } = component.$$;
  fragment && fragment.m(target, anchor);
  if (!customElement) {
    add_render_callback(() => {
      const new_on_destroy = on_mount.map(run).filter(is_function);
      if (on_destroy) {
        on_destroy.push(...new_on_destroy);
      } else {
        run_all(new_on_destroy);
      }
      component.$$.on_mount = [];
    });
  }
  after_update.forEach(add_render_callback);
}
__name(mount_component, "mount_component");
function destroy_component(component, detaching) {
  const $$ = component.$$;
  if ($$.fragment !== null) {
    run_all($$.on_destroy);
    $$.fragment && $$.fragment.d(detaching);
    $$.on_destroy = $$.fragment = null;
    $$.ctx = [];
  }
}
__name(destroy_component, "destroy_component");
function make_dirty(component, i) {
  if (component.$$.dirty[0] === -1) {
    dirty_components.push(component);
    schedule_update();
    component.$$.dirty.fill(0);
  }
  component.$$.dirty[i / 31 | 0] |= 1 << i % 31;
}
__name(make_dirty, "make_dirty");
function init(component, options, instance2, create_fragment2, not_equal, props, append_styles, dirty = [-1]) {
  const parent_component = current_component;
  set_current_component(component);
  const $$ = component.$$ = {
    fragment: null,
    ctx: null,
    props,
    update: noop,
    not_equal,
    bound: blank_object(),
    on_mount: [],
    on_destroy: [],
    on_disconnect: [],
    before_update: [],
    after_update: [],
    context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
    callbacks: blank_object(),
    dirty,
    skip_bound: false,
    root: options.target || parent_component.$$.root
  };
  append_styles && append_styles($$.root);
  let ready = false;
  $$.ctx = instance2 ? instance2(component, options.props || {}, (i, ret, ...rest) => {
      const value = rest.length ? rest[0] : ret;
      if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
          if (!$$.skip_bound && $$.bound[i])
              $$.bound[i](value);
          if (ready)
              make_dirty(component, i);
      }
      return ret;
  }) : [];
  $$.update();
  ready = true;
  run_all($$.before_update);
  $$.fragment = create_fragment2 ? create_fragment2($$.ctx) : false;
  if (options.target) {
    if (options.hydrate) {
      const nodes = children(options.target);
      $$.fragment && $$.fragment.l(nodes);
      nodes.forEach(detach);
    } else {
      $$.fragment && $$.fragment.c();
    }
    if (options.intro)
      transition_in(component.$$.fragment);
    mount_component(component, options.target, options.anchor, options.customElement);
    flush();
  }
  set_current_component(parent_component);
}
__name(init, "init");
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
      if (index !== -1)
        callbacks.splice(index, 1);
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
__name(SvelteComponent, "SvelteComponent");
const s_UUIDV4_REGEX = /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i;
function uuidv4() {
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) => (c ^ (globalThis.crypto || globalThis.msCrypto).getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
}
__name(uuidv4, "uuidv4");
uuidv4.isValid = (uuid) => s_UUIDV4_REGEX.test(uuid);
const s_REGEX = /(\d+)\s*px/;
function styleParsePixels(value) {
    if (typeof value !== "string") {
        return void 0;
    }
    const isPixels = s_REGEX.test(value);
    const number = parseInt(value);
    return isPixels && Number.isFinite(number) ? number : void 0;
}
__name(styleParsePixels, "styleParsePixels");
const applicationShellContract = ["elementRoot"];
Object.freeze(applicationShellContract);
function isApplicationShell(component) {
  if (component === null || component === void 0) {
    return false;
  }
  let compHasContract = true;
  let protoHasContract = true;
  for (const accessor of applicationShellContract) {
    const descriptor = Object.getOwnPropertyDescriptor(component, accessor);
    if (descriptor === void 0 || descriptor.get === void 0 || descriptor.set === void 0) {
      compHasContract = false;
    }
  }
  const prototype = Object.getPrototypeOf(component);
  for (const accessor of applicationShellContract) {
    const descriptor = Object.getOwnPropertyDescriptor(prototype, accessor);
    if (descriptor === void 0 || descriptor.get === void 0 || descriptor.set === void 0) {
      protoHasContract = false;
    }
  }
  return compHasContract || protoHasContract;
}
__name(isApplicationShell, "isApplicationShell");
function isHMRProxy(comp) {
  const instanceName = comp?.constructor?.name;
  if (typeof instanceName === "string" && (instanceName.startsWith("Proxy<") || instanceName === "ProxyComponent")) {
    return true;
  }
  const prototypeName = comp?.prototype?.constructor?.name;
  return typeof prototypeName === "string" && (prototypeName.startsWith("Proxy<") || prototypeName === "ProxyComponent");
}
__name(isHMRProxy, "isHMRProxy");
function isSvelteComponent(comp) {
  if (comp === null || comp === void 0 || typeof comp !== "function") {
    return false;
  }
  const prototypeName = comp?.prototype?.constructor?.name;
  if (typeof prototypeName === "string" && (prototypeName.startsWith("Proxy<") || prototypeName === "ProxyComponent")) {
    return true;
  }
  return typeof window !== void 0 ? typeof comp.prototype.$destroy === "function" && typeof comp.prototype.$on === "function" : typeof comp.render === "function";
}
__name(isSvelteComponent, "isSvelteComponent");
async function outroAndDestroy(instance2) {
  return new Promise((resolve) => {
    if (instance2.$$.fragment && instance2.$$.fragment.o) {
      group_outros();
      transition_out(instance2.$$.fragment, 0, 0, () => {
        instance2.$destroy();
        resolve();
      });
      check_outros();
    } else {
      instance2.$destroy();
      resolve();
    }
  });
}
__name(outroAndDestroy, "outroAndDestroy");
function parseSvelteConfig(config, thisArg = void 0) {
  if (typeof config !== "object") {
    throw new TypeError(`parseSvelteConfig - 'config' is not an object:
${JSON.stringify(config)}.`);
  }
  if (!isSvelteComponent(config.class)) {
    throw new TypeError(
      `parseSvelteConfig - 'class' is not a Svelte component constructor for config:
${JSON.stringify(config)}.`
    );
  }
  if (config.hydrate !== void 0 && typeof config.hydrate !== "boolean") {
    throw new TypeError(
      `parseSvelteConfig - 'hydrate' is not a boolean for config:
${JSON.stringify(config)}.`
    );
  }
  if (config.intro !== void 0 && typeof config.intro !== "boolean") {
    throw new TypeError(
      `parseSvelteConfig - 'intro' is not a boolean for config:
${JSON.stringify(config)}.`
    );
  }
  if (config.target !== void 0 && typeof config.target !== "string" && !(config.target instanceof HTMLElement) && !(config.target instanceof ShadowRoot) && !(config.target instanceof DocumentFragment)) {
    throw new TypeError(
      `parseSvelteConfig - 'target' is not a string, HTMLElement, ShadowRoot, or DocumentFragment for config:
${JSON.stringify(config)}.`
    );
  }
  if (config.anchor !== void 0 && typeof config.anchor !== "string" && !(config.anchor instanceof HTMLElement) && !(config.anchor instanceof ShadowRoot) && !(config.anchor instanceof DocumentFragment)) {
    throw new TypeError(
      `parseSvelteConfig - 'anchor' is not a string, HTMLElement, ShadowRoot, or DocumentFragment for config:
${JSON.stringify(config)}.`
    );
  }
  if (config.context !== void 0 && typeof config.context !== "function" && !(config.context instanceof Map) && typeof config.context !== "object") {
    throw new TypeError(
      `parseSvelteConfig - 'context' is not a Map, function or object for config:
${JSON.stringify(config)}.`
    );
  }
  if (config.selectorTarget !== void 0 && typeof config.selectorTarget !== "string") {
    throw new TypeError(
      `parseSvelteConfig - 'selectorTarget' is not a string for config:
${JSON.stringify(config)}.`
    );
  }
  if (config.options !== void 0 && typeof config.options !== "object") {
    throw new TypeError(
      `parseSvelteConfig - 'options' is not an object for config:
${JSON.stringify(config)}.`
    );
  }
  if (config.options !== void 0) {
    if (config.options.injectApp !== void 0 && typeof config.options.injectApp !== "boolean") {
      throw new TypeError(
        `parseSvelteConfig - 'options.injectApp' is not a boolean for config:
${JSON.stringify(config)}.`
      );
    }
    if (config.options.injectEventbus !== void 0 && typeof config.options.injectEventbus !== "boolean") {
      throw new TypeError(
        `parseSvelteConfig - 'options.injectEventbus' is not a boolean for config:
${JSON.stringify(config)}.`
      );
    }
    if (config.options.selectorElement !== void 0 && typeof config.options.selectorElement !== "string") {
      throw new TypeError(
        `parseSvelteConfig - 'selectorElement' is not a string for config:
${JSON.stringify(config)}.`
      );
    }
  }
  const svelteConfig = { ...config };
  delete svelteConfig.options;
  let externalContext = {};
  if (typeof svelteConfig.context === "function") {
    const contextFunc = svelteConfig.context;
    delete svelteConfig.context;
    const result = contextFunc.call(thisArg);
    if (typeof result === "object") {
      externalContext = { ...result };
    } else {
      throw new Error(`parseSvelteConfig - 'context' is a function that did not return an object for config:
${JSON.stringify(config)}`);
    }
  } else if (svelteConfig.context instanceof Map) {
    externalContext = Object.fromEntries(svelteConfig.context);
    delete svelteConfig.context;
  } else if (typeof svelteConfig.context === "object") {
    externalContext = svelteConfig.context;
    delete svelteConfig.context;
  }
  svelteConfig.props = s_PROCESS_PROPS(svelteConfig.props, thisArg, config);
  if (Array.isArray(svelteConfig.children)) {
    const children2 = [];
    for (let cntr = 0; cntr < svelteConfig.children.length; cntr++) {
      const child = svelteConfig.children[cntr];
      if (!isSvelteComponent(child.class)) {
        throw new Error(`parseSvelteConfig - 'class' is not a Svelte component for child[${cntr}] for config:
${JSON.stringify(config)}`);
      }
      child.props = s_PROCESS_PROPS(child.props, thisArg, config);
      children2.push(child);
    }
    if (children2.length > 0) {
      externalContext.children = children2;
    }
    delete svelteConfig.children;
  } else if (typeof svelteConfig.children === "object") {
    if (!isSvelteComponent(svelteConfig.children.class)) {
      throw new Error(`parseSvelteConfig - 'class' is not a Svelte component for children object for config:
${JSON.stringify(config)}`);
    }
    svelteConfig.children.props = s_PROCESS_PROPS(svelteConfig.children.props, thisArg, config);
    externalContext.children = [svelteConfig.children];
    delete svelteConfig.children;
  }
  if (!(svelteConfig.context instanceof Map)) {
    svelteConfig.context = /* @__PURE__ */ new Map();
  }
  svelteConfig.context.set("external", externalContext);
  return svelteConfig;
}
__name(parseSvelteConfig, "parseSvelteConfig");
function s_PROCESS_PROPS(props, thisArg, config) {
  if (typeof props === "function") {
    const result = props.call(thisArg);
    if (typeof result === "object") {
      return result;
    } else {
      throw new Error(`parseSvelteConfig - 'props' is a function that did not return an object for config:
${JSON.stringify(config)}`);
    }
  } else if (typeof props === "object") {
    return props;
  } else if (props !== void 0) {
    throw new Error(
      `parseSvelteConfig - 'props' is not a function or an object for config:
${JSON.stringify(config)}`
    );
  }
  return {};
}
__name(s_PROCESS_PROPS, "s_PROCESS_PROPS");
function hasGetter(object, accessor) {
    if (object === null || object === void 0) {
        return false;
    }
    const iDescriptor = Object.getOwnPropertyDescriptor(object, accessor);
    if (iDescriptor !== void 0 && iDescriptor.get !== void 0) {
        return true;
    }
    for (let o = Object.getPrototypeOf(object); o; o = Object.getPrototypeOf(o)) {
        const descriptor = Object.getOwnPropertyDescriptor(o, accessor);
        if (descriptor !== void 0 && descriptor.get !== void 0) {
            return true;
        }
    }
    return false;
}
__name(hasGetter, "hasGetter");
function hasPrototype(target, Prototype) {
    if (typeof target !== "function") {
        return false;
    }
    if (target === Prototype) {
        return true;
    }
    for (let proto = Object.getPrototypeOf(target); proto; proto = Object.getPrototypeOf(proto)) {
        if (proto === Prototype) {
            return true;
        }
    }
    return false;
}
__name(hasPrototype, "hasPrototype");
const s_TAG_OBJECT = "[object Object]";
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
__name(deepMerge, "deepMerge");
function isIterable(value) {
    if (value === null || value === void 0 || typeof value !== "object") {
        return false;
    }
    return typeof value[Symbol.iterator] === "function";
}
__name(isIterable, "isIterable");
function isObject(value) {
    return value !== null && typeof value === "object";
}
__name(isObject, "isObject");
function isPlainObject(value) {
    if (Object.prototype.toString.call(value) !== s_TAG_OBJECT) {
        return false;
    }
    const prototype = Object.getPrototypeOf(value);
    return prototype === null || prototype === Object.prototype;
}
__name(isPlainObject, "isPlainObject");
function safeAccess(data, accessor, defaultValue = void 0) {
  if (typeof data !== "object") {
    return defaultValue;
  }
  if (typeof accessor !== "string") {
    return defaultValue;
  }
  const access = accessor.split(".");
  for (let cntr = 0; cntr < access.length; cntr++) {
    if (typeof data[access[cntr]] === "undefined" || data[access[cntr]] === null) {
      return defaultValue;
    }
    data = data[access[cntr]];
  }
  return data;
}
__name(safeAccess, "safeAccess");
function safeSet(data, accessor, value, operation = "set", createMissing = true) {
    if (typeof data !== "object") {
        throw new TypeError(`safeSet Error: 'data' is not an 'object'.`);
    }
    if (typeof accessor !== "string") {
        throw new TypeError(`safeSet Error: 'accessor' is not a 'string'.`);
    }
    const access = accessor.split(".");
    for (let cntr = 0; cntr < access.length; cntr++) {
        if (Array.isArray(data)) {
            const number = +access[cntr];
            if (!Number.isInteger(number) || number < 0) {
                return false;
            }
        }
        if (cntr === access.length - 1) {
            switch (operation) {
                case "add":
                    data[access[cntr]] += value;
                    break;
                case "div":
                    data[access[cntr]] /= value;
                    break;
                case "mult":
                    data[access[cntr]] *= value;
                    break;
                case "set":
                    data[access[cntr]] = value;
                    break;
                case "set-undefined":
                    if (typeof data[access[cntr]] === "undefined") {
                        data[access[cntr]] = value;
                    }
                    break;
                case "sub":
                    data[access[cntr]] -= value;
                    break;
            }
        }
        else {
            if (createMissing && typeof data[access[cntr]] === "undefined") {
                data[access[cntr]] = {};
            }
            if (data[access[cntr]] === null || typeof data[access[cntr]] !== "object") {
                return false;
            }
            data = data[access[cntr]];
        }
    }
    return true;
}
__name(safeSet, "safeSet");
function _deepMerge(target = {}, ...sourceObj) {
  for (let cntr = 0; cntr < sourceObj.length; cntr++) {
    const obj = sourceObj[cntr];
    for (const prop in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, prop)) {
        if (prop.startsWith("-=")) {
          delete target[prop.slice(2)];
          continue;
        }
        target[prop] = Object.prototype.hasOwnProperty.call(target, prop) && target[prop]?.constructor === Object && obj[prop]?.constructor === Object ? _deepMerge({}, target[prop], obj[prop]) : obj[prop];
      }
    }
  }
  return target;
}
__name(_deepMerge, "_deepMerge");
function getUUIDFromDataTransfer(data, { actor = true, compendium = true, world = true, types = void 0 } = {}) {
    if (typeof data !== "object") {
        return void 0;
    }
    if (Array.isArray(types) && !types.includes(data.type)) {
        return void 0;
    }
    let uuid = void 0;
    if (typeof data.uuid === "string") {
        const isCompendium = data.uuid.startsWith("Compendium");
        if (isCompendium && compendium) {
            uuid = data.uuid;
        }
        else if (world) {
            uuid = data.uuid;
        }
    }
    else {
        if (actor && world && data.actorId && data.type) {
            uuid = `Actor.${data.actorId}.${data.type}.${data.data._id}`;
        }
        else if (typeof data.id === "string") {
            if (compendium && typeof data.pack === "string") {
                uuid = `Compendium.${data.pack}.${data.id}`;
            }
            else if (world) {
                uuid = `${data.type}.${data.id}`;
            }
        }
    }
    return uuid;
}
__name(getUUIDFromDataTransfer, "getUUIDFromDataTransfer");
const subscriber_queue = [];
function readable(value, start) {
    return {
        subscribe: writable(value, start).subscribe
    };
}
__name(readable, "readable");
function writable(value, start = noop) {
    let stop;
    const subscribers = /* @__PURE__ */ new Set();

    function set(new_value) {
        if (safe_not_equal(value, new_value)) {
            value = new_value;
            if (stop) {
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

    __name(set, "set");

    function update2(fn) {
        set(fn(value));
    }

    __name(update2, "update");

    function subscribe2(run2, invalidate = noop) {
        const subscriber = [run2, invalidate];
        subscribers.add(subscriber);
        if (subscribers.size === 1) {
            stop = start(set) || noop;
        }
        run2(value);
        return () => {
            subscribers.delete(subscriber);
            if (subscribers.size === 0) {
                stop();
                stop = null;
            }
        };
    }

    __name(subscribe2, "subscribe");
    return { set, update: update2, subscribe: subscribe2 };
}
__name(writable, "writable");
function derived(stores, fn, initial_value) {
  const single = !Array.isArray(stores);
  const stores_array = single ? [stores] : stores;
  const auto = fn.length < 2;
  return readable(initial_value, (set) => {
    let inited = false;
    const values = [];
    let pending = 0;
    let cleanup = noop;
    const sync = /* @__PURE__ */ __name(() => {
        if (pending) {
            return;
        }
        cleanup();
        const result = fn(single ? values[0] : values, set);
        if (auto) {
            set(result);
        }
        else {
            cleanup = is_function(result) ? result : noop;
        }
    }, "sync");
      const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
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
      return /* @__PURE__ */ __name(function stop() {
          run_all(unsubscribers);
          cleanup();
      }, "stop");
  });
}
__name(derived, "derived");

class DynReducerUtils {
    static arrayEquals(a, b) {
        if (a === b) {
            return true;
        }
        if (a === null || b === null) {
            return false;
        }
        if (a.length !== b.length) {
            return false;
        }
        for (let cntr = a.length; --cntr >= 0;) {
            if (a[cntr] !== b[cntr]) {
                return false;
            }
        }
        return true;
    }

    static hashString(str, seed = 0) {
        let h1 = 3735928559 ^ seed, h2 = 1103547991 ^ seed;
        for (let ch, i = 0; i < str.length; i++) {
            ch = str.charCodeAt(i);
            h1 = Math.imul(h1 ^ ch, 2654435761);
            h2 = Math.imul(h2 ^ ch, 1597334677);
        }
        h1 = Math.imul(h1 ^ h1 >>> 16, 2246822507) ^ Math.imul(h2 ^ h2 >>> 13, 3266489909);
        h2 = Math.imul(h2 ^ h2 >>> 16, 2246822507) ^ Math.imul(h1 ^ h1 >>> 13, 3266489909);
        return 4294967296 * (2097151 & h2) + (h1 >>> 0);
    }

    static hashUnknown(value) {
        if (value === null || value === void 0) {
            return 0;
        }
        let result = 0;
        switch (typeof value) {
            case "boolean":
                result = value ? 1 : 0;
                break;
            case "bigint":
                result = Number(BigInt.asIntN(64, value));
                break;
            case "function":
                result = this.hashString(value.name);
                break;
            case "number":
                result = Number.isFinite(value) ? value : 0;
                break;
            case "object":
                break;
            case "string":
                result = this.hashString(value);
                break;
            case "symbol":
                result = this.hashString(Symbol.keyFor(value));
                break;
        }
        return result;
    }

    static hasPrototype(target, Prototype) {
        if (typeof target !== "function") {
            return false;
        }
        if (target === Prototype) {
            return true;
        }
        for (let proto = Object.getPrototypeOf(target); proto; proto = Object.getPrototypeOf(proto)) {
            if (proto === Prototype) {
                return true;
            }
        }
        return false;
    }

    static isIterable(data) {
        return data !== null && data !== void 0 && typeof data === "object" && typeof data[Symbol.iterator] === "function";
    }
}
__name(DynReducerUtils, "DynReducerUtils");

class AdapterDerived {
    #hostData;
    #DerivedReducerCtor;
    #parentIndex;
    #derived = /* @__PURE__ */ new Map();
    #destroyed = false;

    constructor(hostData, parentIndex, DerivedReducerCtor) {
        this.#hostData = hostData;
        this.#parentIndex = parentIndex;
        this.#DerivedReducerCtor = DerivedReducerCtor;
        Object.freeze(this);
    }

    create(options) {
        if (this.#destroyed) {
            throw Error(`AdapterDerived.create error: this instance has been destroyed.`);
        }
        let name;
        let rest = {};
        let ctor;
        const DerivedReducerCtor = this.#DerivedReducerCtor;
        if (typeof options === "string") {
            name = options;
            ctor = DerivedReducerCtor;
        }
        else if (typeof options === "function" && DynReducerUtils.hasPrototype(options, DerivedReducerCtor)) {
            ctor = options;
        }
        else if (typeof options === "object" && options !== null) {
            ({ name, ctor = DerivedReducerCtor, ...rest } = options);
        }
        else {
            throw new TypeError(`AdapterDerived.create error: 'options' does not conform to allowed parameters.`);
        }
        if (!DynReducerUtils.hasPrototype(ctor, DerivedReducerCtor)) {
            throw new TypeError(`AdapterDerived.create error: 'ctor' is not a '${DerivedReducerCtor?.name}'.`);
        }
        name = name ?? ctor?.name;
        if (typeof name !== "string") {
            throw new TypeError(`AdapterDerived.create error: 'name' is not a string.`);
        }
        const derivedReducer = new ctor(this.#hostData, this.#parentIndex, rest);
        this.#derived.set(name, derivedReducer);
        return derivedReducer;
    }

    clear() {
        if (this.#destroyed) {
            return;
        }
        for (const reducer of this.#derived.values()) {
            reducer.destroy();
        }
        this.#derived.clear();
    }

    delete(name) {
        if (this.#destroyed) {
            throw Error(`AdapterDerived.delete error: this instance has been destroyed.`);
        }
        const reducer = this.#derived.get(name);
        if (reducer) {
            reducer.destroy();
        }
        return this.#derived.delete(name);
    }

    destroy() {
        if (this.#destroyed) {
            return;
        }
        this.clear();
        this.#hostData = [null];
        this.#parentIndex = null;
        this.#destroyed = true;
    }

    get(name) {
        if (this.#destroyed) {
            throw Error(`AdapterDerived.get error: this instance has been destroyed.`);
        }
        return this.#derived.get(name);
    }

    update(force = false) {
        if (this.#destroyed) {
            return;
        }
        for (const reducer of this.#derived.values()) {
            reducer.index.update(force);
        }
    }
}
__name(AdapterDerived, "AdapterDerived");

class AdapterFilters {
    #filtersData;
    #indexUpdate;
    #mapUnsubscribe = /* @__PURE__ */ new Map();

    constructor(indexUpdate, filtersAdapter) {
        this.#indexUpdate = indexUpdate;
        this.#filtersData = filtersAdapter;
        Object.freeze(this);
    }

    get length() {
        return this.#filtersData.filters.length;
    }

    * [Symbol.iterator]() {
        if (this.#filtersData.filters.length === 0) {
            return;
        }
        for (const entry of this.#filtersData.filters) {
            yield { ...entry };
        }
    }

    add(...filters) {
        let subscribeCount = 0;
        for (const filter of filters) {
            const filterType = typeof filter;
            if (filterType !== "function" && (filterType !== "object" || filter === null)) {
                throw new TypeError(`AdapterFilters error: 'filter' is not a function or object.`);
            }
            let data = void 0;
            let subscribeFn = void 0;
            if (filterType === "function") {
                data = {
                    id: void 0,
                    filter,
                    weight: 1
                };
                subscribeFn = filter.subscribe;
            }
            else if (filterType === "object") {
                if ("filter" in filter) {
                    if (typeof filter.filter !== "function") {
                        throw new TypeError(`AdapterFilters error: 'filter' attribute is not a function.`);
                    }
                    if (filter.weight !== void 0 && typeof filter.weight !== "number" || (filter.weight < 0 || filter.weight > 1)) {
                        throw new TypeError(`AdapterFilters error: 'weight' attribute is not a number between '0 - 1' inclusive.`);
                    }
                    data = {
                        id: filter.id !== void 0 ? filter.id : void 0,
                        filter: filter.filter,
                        weight: filter.weight || 1
                    };
                    subscribeFn = filter.filter.subscribe ?? filter.subscribe;
                }
                else {
                    throw new TypeError(`AdapterFilters error: 'filter' attribute is not a function.`);
                }
            }
            const index = this.#filtersData.filters.findIndex((value) => {
                return data.weight < value.weight;
            });
            if (index >= 0) {
                this.#filtersData.filters.splice(index, 0, data);
            }
            else {
                this.#filtersData.filters.push(data);
            }
            if (typeof subscribeFn === "function") {
                const unsubscribe = subscribeFn(this.#indexUpdate);
                if (typeof unsubscribe !== "function") {
                    throw new TypeError("AdapterFilters error: Filter has subscribe function, but no unsubscribe function is returned.");
                }
                if (this.#mapUnsubscribe.has(data.filter)) {
                    throw new Error("AdapterFilters error: Filter added already has an unsubscribe function registered.");
                }
                this.#mapUnsubscribe.set(data.filter, unsubscribe);
                subscribeCount++;
            }
        }
        if (subscribeCount < filters.length) {
            this.#indexUpdate();
        }
    }

    clear() {
        this.#filtersData.filters.length = 0;
        for (const unsubscribe of this.#mapUnsubscribe.values()) {
            unsubscribe();
        }
        this.#mapUnsubscribe.clear();
        this.#indexUpdate();
    }

    remove(...filters) {
        const length = this.#filtersData.filters.length;
        if (length === 0) {
            return;
        }
        for (const data of filters) {
            const actualFilter = typeof data === "function" ? data : data !== null && typeof data === "object" ? data.filter : void 0;
            if (!actualFilter) {
                continue;
            }
            for (let cntr = this.#filtersData.filters.length; --cntr >= 0;) {
                if (this.#filtersData.filters[cntr].filter === actualFilter) {
                    this.#filtersData.filters.splice(cntr, 1);
                    let unsubscribe = void 0;
                    if (typeof (unsubscribe = this.#mapUnsubscribe.get(actualFilter)) === "function") {
                        unsubscribe();
                        this.#mapUnsubscribe.delete(actualFilter);
                    }
                }
            }
        }
        if (length !== this.#filtersData.filters.length) {
            this.#indexUpdate();
        }
    }

    removeBy(callback) {
        const length = this.#filtersData.filters.length;
        if (length === 0) {
            return;
        }
        if (typeof callback !== "function") {
            throw new TypeError(`AdapterFilters error: 'callback' is not a function.`);
        }
        this.#filtersData.filters = this.#filtersData.filters.filter((data) => {
            const remove = callback.call(callback, { ...data });
            if (remove) {
                let unsubscribe;
                if (typeof (unsubscribe = this.#mapUnsubscribe.get(data.filter)) === "function") {
                    unsubscribe();
                    this.#mapUnsubscribe.delete(data.filter);
                }
            }
            return !remove;
        });
        if (length !== this.#filtersData.filters.length) {
            this.#indexUpdate();
        }
    }

    removeById(...ids) {
        const length = this.#filtersData.filters.length;
        if (length === 0) {
            return;
        }
        this.#filtersData.filters = this.#filtersData.filters.filter((data) => {
            let remove = 0;
            for (const id of ids) {
                remove |= data.id === id ? 1 : 0;
            }
            if (!!remove) {
                let unsubscribe;
                if (typeof (unsubscribe = this.#mapUnsubscribe.get(data.filter)) === "function") {
                    unsubscribe();
                    this.#mapUnsubscribe.delete(data.filter);
                }
            }
            return !remove;
        });
        if (length !== this.#filtersData.filters.length) {
            this.#indexUpdate();
        }
    }
}
__name(AdapterFilters, "AdapterFilters");

class AdapterIndexer {
    derivedAdapter;
    filtersData;
    hostData;
    hostUpdate;
    indexData;
    sortData;
    sortFn;
    destroyed = false;

    constructor(hostData, hostUpdate, parentIndexer) {
        this.hostData = hostData;
        this.hostUpdate = hostUpdate;
        this.indexData = { index: null, hash: null, reversed: false, parent: parentIndexer };
    }

    get active() {
        return this.filtersData.filters.length > 0 || this.sortData.compareFn !== null || this.indexData.parent?.active === true;
    }

    get length() {
        return this.indexData.index ? this.indexData.index.length : 0;
    }

    get reversed() {
        return this.indexData.reversed;
    }

    set reversed(reversed) {
        this.indexData.reversed = reversed;
    }

    calcHashUpdate(oldIndex, oldHash, force = false) {
        const actualForce = typeof force === "boolean" ? force : false;
        let newHash = null;
        const newIndex = this.indexData.index;
        if (newIndex) {
            for (let cntr = newIndex.length; --cntr >= 0;) {
                newHash ^= DynReducerUtils.hashUnknown(newIndex[cntr]) + 2654435769 + (newHash << 6) + (newHash >> 2);
            }
        }
        this.indexData.hash = newHash;
        if (actualForce || (oldHash === newHash ? !DynReducerUtils.arrayEquals(oldIndex, newIndex) : true)) {
            this.hostUpdate();
        }
    }

    destroy() {
        if (this.destroyed) {
            return;
        }
        this.indexData.index = null;
        this.indexData.hash = null;
        this.indexData.reversed = null;
        this.indexData.parent = null;
        this.destroyed = true;
    }

    initAdapters(filtersData, sortData, derivedAdapter) {
        this.filtersData = filtersData;
        this.sortData = sortData;
        this.derivedAdapter = derivedAdapter;
        this.sortFn = this.createSortFn();
    }
}
__name(AdapterIndexer, "AdapterIndexer");

class AdapterSort {
    #sortData;
    #indexUpdate;
    #unsubscribe;

    constructor(indexUpdate, sortData) {
        this.#indexUpdate = indexUpdate;
        this.#sortData = sortData;
        Object.freeze(this);
    }

    clear() {
        const oldCompareFn = this.#sortData.compareFn;
        this.#sortData.compareFn = null;
        if (typeof this.#unsubscribe === "function") {
            this.#unsubscribe();
            this.#unsubscribe = void 0;
        }
        if (typeof oldCompareFn === "function") {
            this.#indexUpdate();
        }
    }

    set(data) {
        if (typeof this.#unsubscribe === "function") {
            this.#unsubscribe();
            this.#unsubscribe = void 0;
        }
        let compareFn = void 0;
        let subscribeFn = void 0;
        switch (typeof data) {
            case "function":
                compareFn = data;
                subscribeFn = data.subscribe;
                break;
            case "object":
                if (data === null) {
                    break;
                }
                if (typeof data.compare !== "function") {
                    throw new TypeError(`AdapterSort error: 'compare' attribute is not a function.`);
                }
                compareFn = data.compare;
                subscribeFn = data.compare.subscribe ?? data.subscribe;
                break;
        }
        if (typeof compareFn === "function") {
            this.#sortData.compareFn = compareFn;
        }
        else {
            const oldCompareFn = this.#sortData.compareFn;
            this.#sortData.compareFn = null;
            if (typeof oldCompareFn === "function") {
                this.#indexUpdate();
            }
            return;
        }
        if (typeof subscribeFn === "function") {
            this.#unsubscribe = subscribeFn(this.#indexUpdate);
            if (typeof this.#unsubscribe !== "function") {
                throw new Error(`AdapterSort error: sort has 'subscribe' function, but no 'unsubscribe' function is returned.`);
            }
        }
        else {
            this.#indexUpdate();
        }
    }
}
__name(AdapterSort, "AdapterSort");

class IndexerAPI {
    #indexData;
    active;
    length;
    update;

    constructor(adapterIndexer) {
        this.#indexData = adapterIndexer.indexData;
        this.update = adapterIndexer.update.bind(adapterIndexer);
        Object.defineProperties(this, {
            active: { get: () => adapterIndexer.active },
            length: { get: () => adapterIndexer.length }
        });
        Object.freeze(this);
    }

    get hash() {
        return this.#indexData.hash;
    }

    * [Symbol.iterator]() {
        const indexData = this.#indexData;
        if (!indexData.index) {
            return;
        }
        const reversed = indexData.reversed;
        const length = indexData.index.length;
        if (reversed) {
            for (let cntr = length; --cntr >= 0;) {
                yield indexData.index[cntr];
            }
        }
        else {
            for (let cntr = 0; cntr < length; cntr++) {
                yield indexData.index[cntr];
            }
        }
    }
}
__name(IndexerAPI, "IndexerAPI");

class DerivedAPI {
    clear;
    create;
    delete;
    destroy;
    get;

    constructor(adapterDerived) {
        this.clear = adapterDerived.clear.bind(adapterDerived);
        this.create = adapterDerived.create.bind(adapterDerived);
        this.delete = adapterDerived.delete.bind(adapterDerived);
        this.destroy = adapterDerived.destroy.bind(adapterDerived);
        this.get = adapterDerived.get.bind(adapterDerived);
        Object.freeze(this);
    }
}
__name(DerivedAPI, "DerivedAPI");

class Indexer extends AdapterIndexer {
    createSortFn() {
        return (a, b) => this.sortData.compareFn(this.hostData[0].get(a), this.hostData[0].get(b));
    }

    reduceImpl() {
        const data = [];
        const map = this.hostData[0];
        if (!map) {
            return data;
        }
        const filters = this.filtersData.filters;
        let include = true;
        const parentIndex = this.indexData.parent;
        if (DynReducerUtils.isIterable(parentIndex) && parentIndex.active) {
            for (const key of parentIndex) {
                const value = map.get(key);
                include = true;
                for (let filCntr = 0, filLength = filters.length; filCntr < filLength; filCntr++) {
                    if (!filters[filCntr].filter(value)) {
                        include = false;
                        break;
                    }
                }
                if (include) {
                    data.push(key);
                }
            }
        }
        else {
            for (const key of map.keys()) {
                include = true;
                const value = map.get(key);
                for (let filCntr = 0, filLength = filters.length; filCntr < filLength; filCntr++) {
                    if (!filters[filCntr].filter(value)) {
                        include = false;
                        break;
                    }
                }
                if (include) {
                    data.push(key);
                }
            }
        }
        return data;
    }

    update(force = false) {
        if (this.destroyed) {
            return;
        }
        const oldIndex = this.indexData.index;
        const oldHash = this.indexData.hash;
        const map = this.hostData[0];
        const parentIndex = this.indexData.parent;
        if (this.filtersData.filters.length === 0 && !this.sortData.compareFn || this.indexData.index && map?.size !== this.indexData.index.length) {
            this.indexData.index = null;
        }
        if (this.filtersData.filters.length > 0) {
            this.indexData.index = this.reduceImpl();
        }
        if (!this.indexData.index && parentIndex?.active) {
            this.indexData.index = [...parentIndex];
        }
        if (this.sortData.compareFn && map instanceof Map) {
            if (!this.indexData.index) {
                this.indexData.index = this.indexData.index = [...map.keys()];
            }
            this.indexData.index.sort(this.sortFn);
        }
        this.calcHashUpdate(oldIndex, oldHash, force);
        this.derivedAdapter?.update(force);
    }
}
__name(Indexer, "Indexer");

class DerivedMapReducer {
    #map;
    #derived;
    #derivedPublicAPI;
    #filters;
    #filtersData = { filters: [] };
    #index;
    #indexPublicAPI;
    #reversed = false;
    #sort;
    #sortData = { compareFn: null };
    #subscriptions = [];
    #destroyed = false;

    constructor(map, parentIndex, options) {
        this.#map = map;
        this.#index = new Indexer(this.#map, this.#updateSubscribers.bind(this), parentIndex);
        this.#indexPublicAPI = new IndexerAPI(this.#index);
        this.#filters = new AdapterFilters(this.#indexPublicAPI.update, this.#filtersData);
        this.#sort = new AdapterSort(this.#indexPublicAPI.update, this.#sortData);
        this.#derived = new AdapterDerived(this.#map, this.#indexPublicAPI, DerivedMapReducer);
        this.#derivedPublicAPI = new DerivedAPI(this.#derived);
        this.#index.initAdapters(this.#filtersData, this.#sortData, this.#derived);
        let filters = void 0;
        let sort = void 0;
        if (options !== void 0 && ("filters" in options || "sort" in options)) {
            if (options.filters !== void 0) {
                if (DynReducerUtils.isIterable(options.filters)) {
                    filters = options.filters;
                }
                else {
                    throw new TypeError(`DerivedMapReducer error (DataDerivedOptions): 'filters' attribute is not iterable.`);
                }
            }
            if (options.sort !== void 0) {
                if (typeof options.sort === "function") {
                    sort = options.sort;
                }
                else if (typeof options.sort === "object" && options.sort !== null) {
                    sort = options.sort;
                }
                else {
                    throw new TypeError(`DerivedMapReducer error (DataDerivedOptions): 'sort' attribute is not a function or object.`);
                }
            }
        }
        if (filters) {
            this.filters.add(...filters);
        }
        if (sort) {
            this.sort.set(sort);
        }
        this.initialize();
    }

    get data() {
        return this.#map[0];
    }

    get derived() {
        return this.#derivedPublicAPI;
    }

    get filters() {
        return this.#filters;
    }

    get index() {
        return this.#indexPublicAPI;
    }

    get destroyed() {
        return this.#destroyed;
    }

    get length() {
        const map = this.#map[0];
        return this.#index.active ? this.index.length : map ? map.size : 0;
    }

    get reversed() {
        return this.#reversed;
    }

    get sort() {
        return this.#sort;
    }

    set reversed(reversed) {
        if (typeof reversed !== "boolean") {
            throw new TypeError(`DerivedMapReducer.reversed error: 'reversed' is not a boolean.`);
        }
        this.#reversed = reversed;
        this.#index.reversed = reversed;
        this.index.update(true);
    }

    destroy() {
        this.#destroyed = true;
        this.#map = [null];
        this.#index.update(true);
        this.#subscriptions.length = 0;
        this.#derived.destroy();
        this.#index.destroy();
        this.#filters.clear();
        this.#sort.clear();
    }

    initialize() {
    }

    * [Symbol.iterator]() {
        const map = this.#map[0];
        if (this.#destroyed || map === null || map?.size === 0) {
            return;
        }
        if (this.#index.active) {
            for (const key of this.index) {
                yield map.get(key);
            }
        }
        else {
            if (this.reversed) {
                const values = [...map.values()];
                for (let cntr = values.length; --cntr >= 0;) {
                    yield values[cntr];
                }
            }
            else {
                for (const value of map.values()) {
                    yield value;
                }
            }
        }
    }

    subscribe(handler) {
        this.#subscriptions.push(handler);
        handler(this);
        return () => {
            const index = this.#subscriptions.findIndex((sub) => sub === handler);
            if (index >= 0) {
                this.#subscriptions.splice(index, 1);
            }
        };
    }

    #updateSubscribers() {
        for (let cntr = 0; cntr < this.#subscriptions.length; cntr++) {
            this.#subscriptions[cntr](this);
        }
    }
}
__name(DerivedMapReducer, "DerivedMapReducer");

class DynMapReducer {
    #map = [null];
    #derived;
    #derivedPublicAPI;
    #filters;
    #filtersData = { filters: [] };
    #index;
    #indexPublicAPI;
    #reversed = false;
    #sort;
    #sortData = { compareFn: null };
    #subscriptions = [];
    #destroyed = false;

    constructor(data) {
        let dataMap = void 0;
        let filters = void 0;
        let sort = void 0;
        if (data === null) {
            throw new TypeError(`DynMapReducer error: 'data' is not an object or Map.`);
        }
        if (data !== void 0 && typeof data !== "object" && !(data instanceof Map)) {
            throw new TypeError(`DynMapReducer error: 'data' is not an object or Map.`);
        }
        if (data !== void 0 && data instanceof Map) {
            dataMap = data;
        }
        else if (data !== void 0 && ("data" in data || "filters" in data || "sort" in data)) {
            if (data.data !== void 0 && !(data.data instanceof Map)) {
                throw new TypeError(`DynMapReducer error (DataDynMap): 'data' attribute is not a Map.`);
            }
            dataMap = data.data;
            if (data.filters !== void 0) {
                if (DynReducerUtils.isIterable(data.filters)) {
                    filters = data.filters;
                }
                else {
                    throw new TypeError(`DynMapReducer error (DataDynMap): 'filters' attribute is not iterable.`);
                }
            }
            if (data.sort !== void 0) {
                if (typeof data.sort === "function") {
                    sort = data.sort;
                }
                else if (typeof data.sort === "object" && data.sort !== null) {
                    sort = data.sort;
                }
                else {
                    throw new TypeError(`DynMapReducer error (DataDynMap): 'sort' attribute is not a function or object.`);
                }
            }
        }
        if (dataMap) {
            this.#map[0] = dataMap;
        }
        this.#index = new Indexer(this.#map, this.#updateSubscribers.bind(this));
        this.#indexPublicAPI = new IndexerAPI(this.#index);
        this.#filters = new AdapterFilters(this.#indexPublicAPI.update, this.#filtersData);
        this.#sort = new AdapterSort(this.#indexPublicAPI.update, this.#sortData);
        this.#derived = new AdapterDerived(this.#map, this.#indexPublicAPI, DerivedMapReducer);
        this.#derivedPublicAPI = new DerivedAPI(this.#derived);
        this.#index.initAdapters(this.#filtersData, this.#sortData, this.#derived);
        if (filters) {
            this.filters.add(...filters);
        }
        if (sort) {
            this.sort.set(sort);
        }
        this.initialize();
    }

    get data() {
        return this.#map[0];
    }

    get derived() {
        return this.#derivedPublicAPI;
    }

    get filters() {
        return this.#filters;
    }

    get index() {
        return this.#indexPublicAPI;
    }

    get destroyed() {
        return this.#destroyed;
    }

    get length() {
        const map = this.#map[0];
        return this.#index.active ? this.#indexPublicAPI.length : map ? map.size : 0;
    }

    get reversed() {
        return this.#reversed;
    }

    get sort() {
        return this.#sort;
    }

    set reversed(reversed) {
        if (typeof reversed !== "boolean") {
            throw new TypeError(`DynMapReducer.reversed error: 'reversed' is not a boolean.`);
        }
        this.#reversed = reversed;
        this.#index.reversed = reversed;
        this.index.update(true);
    }

    destroy() {
        if (this.#destroyed) {
            return;
        }
        this.#destroyed = true;
        this.#derived.destroy();
        this.#map = [null];
        this.index.update(true);
        this.#subscriptions.length = 0;
        this.#index.destroy();
        this.#filters.clear();
        this.#sort.clear();
    }

    initialize() {
    }

    setData(data, replace = false) {
        if (data !== null && !(data instanceof Map)) {
            throw new TypeError(`DynMapReducer.setData error: 'data' is not iterable.`);
        }
        if (typeof replace !== "boolean") {
            throw new TypeError(`DynMapReducer.setData error: 'replace' is not a boolean.`);
        }
        const map = this.#map[0];
        if (!(map instanceof Map) || replace) {
            this.#map[0] = data instanceof Map ? data : null;
        }
        else if (data instanceof Map && map instanceof Map) {
            const removeKeySet = new Set(map.keys());
            for (const key of data.keys()) {
                map.set(key, data.get(key));
                if (removeKeySet.has(key)) {
                    removeKeySet.delete(key);
                }
            }
            for (const key of removeKeySet) {
                map.delete(key);
            }
        }
        else if (data === null) {
            this.#map[0] = null;
        }
        this.index.update(true);
    }

    subscribe(handler) {
        this.#subscriptions.push(handler);
        handler(this);
        return () => {
            const index = this.#subscriptions.findIndex((sub) => sub === handler);
            if (index >= 0) {
                this.#subscriptions.splice(index, 1);
            }
        };
    }

    #updateSubscribers() {
        for (let cntr = 0; cntr < this.#subscriptions.length; cntr++) {
            this.#subscriptions[cntr](this);
        }
    }

    * [Symbol.iterator]() {
        const map = this.#map[0];
        if (this.#destroyed || map === null || map?.size === 0) {
            return;
        }
        if (this.#index.active) {
            for (const key of this.index) {
                yield map.get(key);
            }
        }
        else {
            if (this.reversed) {
                const values = [...map.values()];
                for (let cntr = values.length; --cntr >= 0;) {
                    yield values[cntr];
                }
            }
            else {
                for (const value of map.values()) {
                    yield value;
                }
            }
        }
    }
}
__name(DynMapReducer, "DynMapReducer");
function isUpdatableStore(store) {
    if (store === null || store === void 0) {
        return false;
    }
    switch (typeof store) {
        case "function":
        case "object":
            return typeof store.subscribe === "function" && typeof store.update === "function";
    }
    return false;
}
__name(isUpdatableStore, "isUpdatableStore");
function subscribeIgnoreFirst(store, update2) {
    let firedFirst = false;
    return store.subscribe((value) => {
        if (!firedFirst) {
            firedFirst = true;
        }
        else {
            update2(value);
        }
    });
}
__name(subscribeIgnoreFirst, "subscribeIgnoreFirst");
function writableDerived(origins, derive, reflect, initial) {
  var childDerivedSetter, originValues, blockNextDerive = false;
  var reflectOldValues = "withOld" in reflect;
  var wrappedDerive = /* @__PURE__ */ __name((got, set) => {
    childDerivedSetter = set;
    if (reflectOldValues) {
      originValues = got;
    }
    if (!blockNextDerive) {
      let returned = derive(got, set);
      if (derive.length < 2) {
        set(returned);
      } else {
        return returned;
      }
    }
    blockNextDerive = false;
  }, "wrappedDerive");
  var childDerived = derived(origins, wrappedDerive, initial);
  var singleOrigin = !Array.isArray(origins);
  var sendUpstream = /* @__PURE__ */ __name((setWith) => {
    if (singleOrigin) {
      blockNextDerive = true;
      origins.set(setWith);
    } else {
        setWith.forEach((value, i) => {
            blockNextDerive = true;
            origins[i].set(value);
        });
    }
    blockNextDerive = false;
  }, "sendUpstream");
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
  __name(doReflect, "doReflect");
  var tryingSet = false;
  function update2(fn) {
      var isUpdated, mutatedBySubscriptions, oldValue, newValue;
      if (tryingSet) {
          newValue = fn(get_store_value(childDerived));
          childDerivedSetter(newValue);
          return;
      }
      var unsubscribe = childDerived.subscribe((value) => {
          if (!tryingSet) {
              oldValue = value;
          }
          else if (!isUpdated) {
              isUpdated = true;
          }
          else {
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
  __name(update2, "update");
  return {
      subscribe: childDerived.subscribe,
      set(value) {
          update2(() => value);
      },
      update: update2
  };
}
__name(writableDerived, "writableDerived");
function propertyStore(origin, propName) {
  if (!Array.isArray(propName)) {
    return writableDerived(
      origin,
      (object) => object[propName],
      { withOld(reflecting, object) {
        object[propName] = reflecting;
        return object;
      } }
    );
  } else {
    let props = propName.concat();
    return writableDerived(
        origin,
        (value) => {
            for (let i = 0; i < props.length; ++i) {
                value = value[props[i]];
            }
            return value;
        },
        {
            withOld(reflecting, object) {
                let target = object;
                for (let i = 0; i < props.length - 1; ++i) {
                    target = target[props[i]];
                }
                target[props[props.length - 1]] = reflecting;
                return object;
            }
        }
    );
  }
}
__name(propertyStore, "propertyStore");

class EmbeddedStoreManager {
    static #renderContextRegex = /(create|delete|update)(\w+)/;
    #name = /* @__PURE__ */ new Map();
    #document;
    #embeddedNames = /* @__PURE__ */ new Set();

    constructor(document2) {
        this.#document = document2;
        this.handleDocChange();
    }

    create(embeddedName, options) {
        const doc = this.#document[0];
        let collection = null;
        if (doc) {
            try {
                collection = doc.getEmbeddedCollection(embeddedName);
            } catch (err) {
                console.warn(`EmbeddedStoreManager.create error: No valid embedded collection for: ${embeddedName}`);
            }
        }
        let embeddedData;
        if (!this.#name.has(embeddedName)) {
            embeddedData = {
                collection,
                stores: /* @__PURE__ */ new Map()
            };
            this.#name.set(embeddedName, embeddedData);
        }
        else {
            embeddedData = this.#name.get(embeddedName);
        }
        let name;
        let rest = {};
        let ctor;
        if (typeof options === "string") {
            name = options;
            ctor = DynMapReducer;
        }
        else if (typeof options === "function" && hasPrototype(options, DynMapReducer)) {
            ctor = options;
        }
        else if (typeof options === "object" && options !== null) {
            ({ name, ctor = DynMapReducer, ...rest } = options);
        }
        else {
            throw new TypeError(`EmbeddedStoreManager.create error: 'options' does not conform to allowed parameters.`);
        }
        if (!hasPrototype(ctor, DynMapReducer)) {
            throw new TypeError(`EmbeddedStoreManager.create error: 'ctor' is not a 'DynMapReducer'.`);
        }
        name = name ?? ctor?.name;
        if (typeof name !== "string") {
            throw new TypeError(`EmbeddedStoreManager.create error: 'name' is not a string.`);
        }
        if (embeddedData.stores.has(name)) {
            return embeddedData.stores.get(name);
        }
        else {
            const storeOptions = collection ? { data: collection, ...rest } : { ...rest };
            const store = new ctor(storeOptions);
            embeddedData.stores.set(name, store);
            return store;
        }
    }

    destroy(embeddedName, storeName) {
        let count = 0;
        if (embeddedName === void 0) {
            for (const embeddedData of this.#name.values()) {
                embeddedData.collection = null;
                for (const store of embeddedData.stores.values()) {
                    store.destroy();
                    count++;
                }
            }
            this.#name.clear();
        }
        else if (typeof embeddedName === "string" && storeName === void 0) {
            const embeddedData = this.#name.get(embeddedName);
            if (embeddedData) {
                embeddedData.collection = null;
                for (const store of embeddedData.stores.values()) {
                    store.destroy();
                    count++;
                }
            }
            this.#name.delete(embeddedName);
        }
        else if (typeof embeddedName === "string" && storeName === "string") {
            const embeddedData = this.#name.get(embeddedName);
            if (embeddedData) {
                const store = embeddedData.stores.get(storeName);
                if (store) {
                    store.destroy();
                    count++;
                }
            }
        }
        return count > 0;
    }

    get(embeddedName, storeName) {
        if (!this.#name.has(embeddedName)) {
            return void 0;
        }
        return this.#name.get(embeddedName).stores.get(storeName);
    }

    handleDocChange() {
        const doc = this.#document[0];
        if (doc instanceof foundry.abstract.Document) {
            const existingEmbeddedNames = new Set(this.#name.keys());
            const embeddedNames = Object.keys(doc.constructor?.metadata?.embedded ?? []);
            this.#embeddedNames.clear();
            for (const embeddedName of embeddedNames) {
                existingEmbeddedNames.delete(embeddedName);
                this.#embeddedNames.add(`create${embeddedName}`);
                this.#embeddedNames.add(`delete${embeddedName}`);
                this.#embeddedNames.add(`update${embeddedName}`);
                let collection = null;
                try {
                    collection = doc.getEmbeddedCollection(embeddedName);
                } catch (err) {
                    console.warn(`EmbeddedStoreManager.handleDocUpdate error: No valid embedded collection for: ${embeddedName}`);
                }
                const embeddedData = this.#name.get(embeddedName);
                if (embeddedData) {
                    embeddedData.collection = collection;
                    for (const store of embeddedData.stores.values()) {
                        store.setData(collection, true);
                    }
                }
            }
            for (const embeddedName of existingEmbeddedNames) {
                const embeddedData = this.#name.get(embeddedName);
                if (embeddedData) {
                    embeddedData.collection = null;
                    for (const store of embeddedData.stores.values()) {
                        store.setData(null, true);
                    }
                }
            }
        }
        else {
            this.#embeddedNames.clear();
            for (const embeddedData of this.#name.values()) {
                embeddedData.collection = null;
                for (const store of embeddedData.stores.values()) {
                    store.setData(null, true);
                }
            }
        }
    }

    handleUpdate(renderContext) {
        if (!this.#embeddedNames.has(renderContext)) {
            return;
        }
        const match = EmbeddedStoreManager.#renderContextRegex.exec(renderContext);
        if (match) {
            const embeddedName = match[2];
            if (!this.#name.has(embeddedName)) {
                return;
            }
            for (const store of this.#name.get(embeddedName).stores.values()) {
                store.index.update(true);
            }
        }
    }
}
__name(EmbeddedStoreManager, "EmbeddedStoreManager");

class TJSDocument {
    #document = [void 0];
    #embeddedStoreManager;
    #embeddedAPI;
    #uuidv4;
    #options = { delete: void 0 };
    #subscriptions = [];
    #updateOptions;

    constructor(document2, options = {}) {
        this.#uuidv4 = `tjs-document-${uuidv4()}`;
        if (isPlainObject(document2)) {
            this.setOptions(document2);
        }
        else {
            this.setOptions(options);
            this.set(document2);
        }
    }

    get embedded() {
        if (!this.#embeddedAPI) {
            this.#embeddedStoreManager = new EmbeddedStoreManager(this.#document);
            this.#embeddedAPI = {
                create: (embeddedName, options) => this.#embeddedStoreManager.create(embeddedName, options),
                destroy: (embeddedName, storeName) => this.#embeddedStoreManager.destroy(embeddedName, storeName),
                get: (embeddedName, storeName) => this.#embeddedStoreManager.get(embeddedName, storeName)
            };
        }
        return this.#embeddedAPI;
    }

    get updateOptions() {
        return this.#updateOptions ?? {};
    }

    get uuidv4() {
        return this.#uuidv4;
    }

    async #deleted() {
        const doc = this.#document[0];
        if (doc instanceof foundry.abstract.Document && !doc?.collection?.has(doc.id)) {
            delete doc?.apps[this.#uuidv4];
            this.#setDocument(void 0);
            this.#updateSubscribers(false, { action: "delete", data: void 0 });
            if (typeof this.#options.delete === "function") {
                await this.#options.delete();
            }
            this.#updateOptions = void 0;
        }
    }

    destroy() {
        const doc = this.#document[0];
        if (this.#embeddedStoreManager) {
            this.#embeddedStoreManager.destroy();
            this.#embeddedStoreManager = void 0;
            this.#embeddedAPI = void 0;
        }
        if (doc instanceof foundry.abstract.Document) {
            delete doc?.apps[this.#uuidv4];
            this.#setDocument(void 0);
        }
        this.#options.delete = void 0;
        this.#subscriptions.length = 0;
    }

    #updateSubscribers(force = false, options = {}) {
        this.#updateOptions = options;
        const doc = this.#document[0];
        for (let cntr = 0; cntr < this.#subscriptions.length; cntr++) {
            this.#subscriptions[cntr](doc, options);
        }
        if (this.#embeddedStoreManager) {
            this.#embeddedStoreManager.handleUpdate(options.renderContext);
        }
    }

    get() {
        return this.#document[0];
    }

    set(document2, options = {}) {
        if (this.#document[0]) {
            delete this.#document[0].apps[this.#uuidv4];
        }
        if (document2 !== void 0 && !(document2 instanceof foundry.abstract.Document)) {
            throw new TypeError(`TJSDocument set error: 'document' is not a valid Document or undefined.`);
        }
        if (options === null || typeof options !== "object") {
            throw new TypeError(`TJSDocument set error: 'options' is not an object.`);
        }
        if (document2 instanceof foundry.abstract.Document) {
            document2.apps[this.#uuidv4] = {
                close: this.#deleted.bind(this),
                render: this.#updateSubscribers.bind(this)
            };
        }
        this.#setDocument(document2);
        this.#updateOptions = options;
        this.#updateSubscribers();
    }

    #setDocument(doc) {
        this.#document[0] = doc;
        if (this.#embeddedStoreManager) {
            this.#embeddedStoreManager.handleDocChange();
        }
    }

    async setFromDataTransfer(data, options) {
        return this.setFromUUID(getUUIDFromDataTransfer(data, options), options);
    }

    async setFromUUID(uuid, options = {}) {
        if (typeof uuid !== "string" || uuid.length === 0) {
            return false;
        }
        try {
            const doc = await globalThis.fromUuid(uuid);
            if (doc) {
                this.set(doc, options);
                return true;
            }
        } catch (err) {
        }
        return false;
    }

    setOptions(options) {
        if (!isObject(options)) {
            throw new TypeError(`TJSDocument error: 'options' is not a plain object.`);
        }
        if (options.delete !== void 0 && typeof options.delete !== "function") {
            throw new TypeError(`TJSDocument error: 'delete' attribute in options is not a function.`);
        }
        if (options.delete === void 0 || typeof options.delete === "function") {
            this.#options.delete = options.delete;
        }
    }

    subscribe(handler) {
        this.#subscriptions.push(handler);
        const updateOptions = { action: "subscribe", data: void 0 };
        handler(this.#document[0], updateOptions);
        return () => {
            const index = this.#subscriptions.findIndex((sub) => sub === handler);
            if (index >= 0) {
                this.#subscriptions.splice(index, 1);
            }
        };
    }
}
__name(TJSDocument, "TJSDocument");
const storeState = writable(void 0);
const gameState = {
  subscribe: storeState.subscribe,
  get: () => game
};
Object.freeze(gameState);
Hooks.once("ready", () => storeState.set(game));
function cubicOut(t) {
  const f = t - 1;
  return f * f * f + 1;
}
__name(cubicOut, "cubicOut");
function lerp$5(start, end, amount) {
  return (1 - amount) * start + amount * end;
}
__name(lerp$5, "lerp$5");
function degToRad(deg) {
  return deg * (Math.PI / 180);
}
__name(degToRad, "degToRad");
var EPSILON = 1e-6;
var ARRAY_TYPE = typeof Float32Array !== "undefined" ? Float32Array : Array;
var RANDOM = Math.random;
if (!Math.hypot)
  Math.hypot = function() {
    var y = 0, i = arguments.length;
    while (i--) {
      y += arguments[i] * arguments[i];
    }
    return Math.sqrt(y);
  };
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
__name(create$6, "create$6");
function create$5() {
  var out = new ARRAY_TYPE(16);
  if (ARRAY_TYPE != Float32Array) {
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
__name(create$5, "create$5");
function clone$5(a) {
  var out = new ARRAY_TYPE(16);
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
__name(clone$5, "clone$5");
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
__name(copy$5, "copy$5");
function fromValues$5(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33) {
  var out = new ARRAY_TYPE(16);
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
__name(fromValues$5, "fromValues$5");
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
__name(set$5, "set$5");
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
__name(identity$2, "identity$2");
function transpose(out, a) {
  if (out === a) {
    var a01 = a[1], a02 = a[2], a03 = a[3];
    var a12 = a[6], a13 = a[7];
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
__name(transpose, "transpose");
function invert$2(out, a) {
  var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
  var a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
  var a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
  var a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
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
  var b11 = a22 * a33 - a23 * a32;
  var det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
  if (!det) {
    return null;
  }
  det = 1 / det;
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
__name(invert$2, "invert$2");
function adjoint(out, a) {
  var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
  var a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
  var a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
  var a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
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
__name(adjoint, "adjoint");
function determinant(a) {
  var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
  var a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
  var a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
  var a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
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
  var b11 = a22 * a33 - a23 * a32;
  return b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
}
__name(determinant, "determinant");
function multiply$5(out, a, b) {
  var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
  var a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
  var a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
  var a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
  var b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
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
__name(multiply$5, "multiply$5");
function translate$1(out, a, v) {
  var x = v[0], y = v[1], z = v[2];
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
__name(translate$1, "translate$1");
function scale$5(out, a, v) {
  var x = v[0], y = v[1], z = v[2];
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
__name(scale$5, "scale$5");
function rotate$1(out, a, rad, axis) {
  var x = axis[0], y = axis[1], z = axis[2];
  var len = Math.hypot(x, y, z);
  var s, c, t;
  var a00, a01, a02, a03;
  var a10, a11, a12, a13;
  var a20, a21, a22, a23;
  var b00, b01, b02;
  var b10, b11, b12;
  var b20, b21, b22;
  if (len < EPSILON) {
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
  a23 = a[11];
  b00 = x * x * t + c;
  b01 = y * x * t + z * s;
  b02 = z * x * t - y * s;
  b10 = x * y * t - z * s;
  b11 = y * y * t + c;
  b12 = z * y * t + x * s;
  b20 = x * z * t + y * s;
  b21 = y * z * t - x * s;
  b22 = z * z * t + c;
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
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
  }
  return out;
}
__name(rotate$1, "rotate$1");
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
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
  }
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
__name(rotateX$3, "rotateX$3");
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
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
  }
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
__name(rotateY$3, "rotateY$3");
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
    out[8] = a[8];
    out[9] = a[9];
    out[10] = a[10];
    out[11] = a[11];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
  }
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
__name(rotateZ$3, "rotateZ$3");
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
__name(fromTranslation$1, "fromTranslation$1");
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
__name(fromScaling, "fromScaling");
function fromRotation$1(out, rad, axis) {
  var x = axis[0], y = axis[1], z = axis[2];
  var len = Math.hypot(x, y, z);
  var s, c, t;
  if (len < EPSILON) {
    return null;
  }
  len = 1 / len;
  x *= len;
  y *= len;
  z *= len;
  s = Math.sin(rad);
  c = Math.cos(rad);
  t = 1 - c;
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
__name(fromRotation$1, "fromRotation$1");
function fromXRotation(out, rad) {
  var s = Math.sin(rad);
  var c = Math.cos(rad);
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
__name(fromXRotation, "fromXRotation");
function fromYRotation(out, rad) {
  var s = Math.sin(rad);
  var c = Math.cos(rad);
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
__name(fromYRotation, "fromYRotation");
function fromZRotation(out, rad) {
  var s = Math.sin(rad);
  var c = Math.cos(rad);
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
__name(fromZRotation, "fromZRotation");
function fromRotationTranslation$1(out, q, v) {
  var x = q[0], y = q[1], z = q[2], w = q[3];
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
__name(fromRotationTranslation$1, "fromRotationTranslation$1");
function fromQuat2(out, a) {
  var translation = new ARRAY_TYPE(3);
  var bx = -a[0], by = -a[1], bz = -a[2], bw = a[3], ax = a[4], ay = a[5], az = a[6], aw = a[7];
  var magnitude = bx * bx + by * by + bz * bz + bw * bw;
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
__name(fromQuat2, "fromQuat2");
function getTranslation$1(out, mat) {
  out[0] = mat[12];
  out[1] = mat[13];
  out[2] = mat[14];
  return out;
}
__name(getTranslation$1, "getTranslation$1");
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
__name(getScaling, "getScaling");
function getRotation(out, mat) {
  var scaling = new ARRAY_TYPE(3);
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
    S = Math.sqrt(trace + 1) * 2;
    out[3] = 0.25 * S;
    out[0] = (sm23 - sm32) / S;
    out[1] = (sm31 - sm13) / S;
    out[2] = (sm12 - sm21) / S;
  } else if (sm11 > sm22 && sm11 > sm33) {
    S = Math.sqrt(1 + sm11 - sm22 - sm33) * 2;
    out[3] = (sm23 - sm32) / S;
    out[0] = 0.25 * S;
    out[1] = (sm12 + sm21) / S;
    out[2] = (sm31 + sm13) / S;
  } else if (sm22 > sm33) {
    S = Math.sqrt(1 + sm22 - sm11 - sm33) * 2;
    out[3] = (sm31 - sm13) / S;
    out[0] = (sm12 + sm21) / S;
    out[1] = 0.25 * S;
    out[2] = (sm23 + sm32) / S;
  } else {
    S = Math.sqrt(1 + sm33 - sm11 - sm22) * 2;
    out[3] = (sm12 - sm21) / S;
    out[0] = (sm31 + sm13) / S;
    out[1] = (sm23 + sm32) / S;
    out[2] = 0.25 * S;
  }
  return out;
}
__name(getRotation, "getRotation");
function fromRotationTranslationScale(out, q, v, s) {
  var x = q[0], y = q[1], z = q[2], w = q[3];
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
__name(fromRotationTranslationScale, "fromRotationTranslationScale");
function fromRotationTranslationScaleOrigin(out, q, v, s, o) {
  var x = q[0], y = q[1], z = q[2], w = q[3];
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
__name(fromRotationTranslationScaleOrigin, "fromRotationTranslationScaleOrigin");
function fromQuat(out, q) {
  var x = q[0], y = q[1], z = q[2], w = q[3];
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
__name(fromQuat, "fromQuat");
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
__name(frustum, "frustum");
function perspectiveNO(out, fovy, aspect, near, far) {
  var f = 1 / Math.tan(fovy / 2), nf;
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
__name(perspectiveNO, "perspectiveNO");
var perspective = perspectiveNO;
function perspectiveZO(out, fovy, aspect, near, far) {
  var f = 1 / Math.tan(fovy / 2), nf;
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
__name(perspectiveZO, "perspectiveZO");
function perspectiveFromFieldOfView(out, fov, near, far) {
  var upTan = Math.tan(fov.upDegrees * Math.PI / 180);
  var downTan = Math.tan(fov.downDegrees * Math.PI / 180);
  var leftTan = Math.tan(fov.leftDegrees * Math.PI / 180);
  var rightTan = Math.tan(fov.rightDegrees * Math.PI / 180);
  var xScale = 2 / (leftTan + rightTan);
  var yScale = 2 / (upTan + downTan);
  out[0] = xScale;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = yScale;
  out[6] = 0;
  out[7] = 0;
  out[8] = -((leftTan - rightTan) * xScale * 0.5);
  out[9] = (upTan - downTan) * yScale * 0.5;
  out[10] = far / (near - far);
  out[11] = -1;
  out[12] = 0;
  out[13] = 0;
  out[14] = far * near / (near - far);
  out[15] = 0;
  return out;
}
__name(perspectiveFromFieldOfView, "perspectiveFromFieldOfView");
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
__name(orthoNO, "orthoNO");
var ortho = orthoNO;
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
__name(orthoZO, "orthoZO");
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
  if (Math.abs(eyex - centerx) < EPSILON && Math.abs(eyey - centery) < EPSILON && Math.abs(eyez - centerz) < EPSILON) {
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
__name(lookAt, "lookAt");
function targetTo(out, eye, target, up) {
  var eyex = eye[0], eyey = eye[1], eyez = eye[2], upx = up[0], upy = up[1], upz = up[2];
  var z0 = eyex - target[0], z1 = eyey - target[1], z2 = eyez - target[2];
  var len = z0 * z0 + z1 * z1 + z2 * z2;
  if (len > 0) {
    len = 1 / Math.sqrt(len);
    z0 *= len;
    z1 *= len;
    z2 *= len;
  }
  var x0 = upy * z2 - upz * z1, x1 = upz * z0 - upx * z2, x2 = upx * z1 - upy * z0;
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
__name(targetTo, "targetTo");
function str$5(a) {
  return "mat4(" + a[0] + ", " + a[1] + ", " + a[2] + ", " + a[3] + ", " + a[4] + ", " + a[5] + ", " + a[6] + ", " + a[7] + ", " + a[8] + ", " + a[9] + ", " + a[10] + ", " + a[11] + ", " + a[12] + ", " + a[13] + ", " + a[14] + ", " + a[15] + ")";
}
__name(str$5, "str$5");
function frob(a) {
  return Math.hypot(a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7], a[8], a[9], a[10], a[11], a[12], a[13], a[14], a[15]);
}
__name(frob, "frob");
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
__name(add$5, "add$5");
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
__name(subtract$3, "subtract$3");
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
__name(multiplyScalar, "multiplyScalar");
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
__name(multiplyScalarAndAdd, "multiplyScalarAndAdd");
function exactEquals$5(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3] && a[4] === b[4] && a[5] === b[5] && a[6] === b[6] && a[7] === b[7] && a[8] === b[8] && a[9] === b[9] && a[10] === b[10] && a[11] === b[11] && a[12] === b[12] && a[13] === b[13] && a[14] === b[14] && a[15] === b[15];
}
__name(exactEquals$5, "exactEquals$5");
function equals$5(a, b) {
  var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3];
  var a4 = a[4], a5 = a[5], a6 = a[6], a7 = a[7];
  var a8 = a[8], a9 = a[9], a10 = a[10], a11 = a[11];
  var a12 = a[12], a13 = a[13], a14 = a[14], a15 = a[15];
  var b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
  var b4 = b[4], b5 = b[5], b6 = b[6], b7 = b[7];
  var b8 = b[8], b9 = b[9], b10 = b[10], b11 = b[11];
  var b12 = b[12], b13 = b[13], b14 = b[14], b15 = b[15];
  return Math.abs(a0 - b0) <= EPSILON * Math.max(1, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= EPSILON * Math.max(1, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= EPSILON * Math.max(1, Math.abs(a2), Math.abs(b2)) && Math.abs(a3 - b3) <= EPSILON * Math.max(1, Math.abs(a3), Math.abs(b3)) && Math.abs(a4 - b4) <= EPSILON * Math.max(1, Math.abs(a4), Math.abs(b4)) && Math.abs(a5 - b5) <= EPSILON * Math.max(1, Math.abs(a5), Math.abs(b5)) && Math.abs(a6 - b6) <= EPSILON * Math.max(1, Math.abs(a6), Math.abs(b6)) && Math.abs(a7 - b7) <= EPSILON * Math.max(1, Math.abs(a7), Math.abs(b7)) && Math.abs(a8 - b8) <= EPSILON * Math.max(1, Math.abs(a8), Math.abs(b8)) && Math.abs(a9 - b9) <= EPSILON * Math.max(1, Math.abs(a9), Math.abs(b9)) && Math.abs(a10 - b10) <= EPSILON * Math.max(1, Math.abs(a10), Math.abs(b10)) && Math.abs(a11 - b11) <= EPSILON * Math.max(1, Math.abs(a11), Math.abs(b11)) && Math.abs(a12 - b12) <= EPSILON * Math.max(1, Math.abs(a12), Math.abs(b12)) && Math.abs(a13 - b13) <= EPSILON * Math.max(1, Math.abs(a13), Math.abs(b13)) && Math.abs(a14 - b14) <= EPSILON * Math.max(1, Math.abs(a14), Math.abs(b14)) && Math.abs(a15 - b15) <= EPSILON * Math.max(1, Math.abs(a15), Math.abs(b15));
}
__name(equals$5, "equals$5");
var mul$5 = multiply$5;
var sub$3 = subtract$3;
var mat4 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  create: create$5,
  clone: clone$5,
  copy: copy$5,
  fromValues: fromValues$5,
  set: set$5,
  identity: identity$2,
  transpose,
  invert: invert$2,
  adjoint,
  determinant,
  multiply: multiply$5,
  translate: translate$1,
  scale: scale$5,
  rotate: rotate$1,
  rotateX: rotateX$3,
  rotateY: rotateY$3,
  rotateZ: rotateZ$3,
  fromTranslation: fromTranslation$1,
  fromScaling,
  fromRotation: fromRotation$1,
  fromXRotation,
  fromYRotation,
  fromZRotation,
  fromRotationTranslation: fromRotationTranslation$1,
  fromQuat2,
  getTranslation: getTranslation$1,
  getScaling,
  getRotation,
  fromRotationTranslationScale,
  fromRotationTranslationScaleOrigin,
  fromQuat,
  frustum,
  perspectiveNO,
  perspective,
  perspectiveZO,
  perspectiveFromFieldOfView,
  orthoNO,
  ortho,
  orthoZO,
  lookAt,
  targetTo,
  str: str$5,
  frob,
  add: add$5,
  subtract: subtract$3,
  multiplyScalar,
  multiplyScalarAndAdd,
  exactEquals: exactEquals$5,
  equals: equals$5,
  mul: mul$5,
  sub: sub$3
});
function create$4() {
  var out = new ARRAY_TYPE(3);
  if (ARRAY_TYPE != Float32Array) {
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
  }
  return out;
}
__name(create$4, "create$4");
function clone$4(a) {
  var out = new ARRAY_TYPE(3);
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  return out;
}
__name(clone$4, "clone$4");
function length$4(a) {
  var x = a[0];
  var y = a[1];
  var z = a[2];
  return Math.hypot(x, y, z);
}
__name(length$4, "length$4");
function fromValues$4(x, y, z) {
  var out = new ARRAY_TYPE(3);
  out[0] = x;
  out[1] = y;
  out[2] = z;
  return out;
}
__name(fromValues$4, "fromValues$4");
function copy$4(out, a) {
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  return out;
}
__name(copy$4, "copy$4");
function set$4(out, x, y, z) {
  out[0] = x;
  out[1] = y;
  out[2] = z;
  return out;
}
__name(set$4, "set$4");
function add$4(out, a, b) {
  out[0] = a[0] + b[0];
  out[1] = a[1] + b[1];
  out[2] = a[2] + b[2];
  return out;
}
__name(add$4, "add$4");
function subtract$2(out, a, b) {
  out[0] = a[0] - b[0];
  out[1] = a[1] - b[1];
  out[2] = a[2] - b[2];
  return out;
}
__name(subtract$2, "subtract$2");
function multiply$4(out, a, b) {
  out[0] = a[0] * b[0];
  out[1] = a[1] * b[1];
  out[2] = a[2] * b[2];
  return out;
}
__name(multiply$4, "multiply$4");
function divide$2(out, a, b) {
  out[0] = a[0] / b[0];
  out[1] = a[1] / b[1];
  out[2] = a[2] / b[2];
  return out;
}
__name(divide$2, "divide$2");
function ceil$2(out, a) {
  out[0] = Math.ceil(a[0]);
  out[1] = Math.ceil(a[1]);
  out[2] = Math.ceil(a[2]);
  return out;
}
__name(ceil$2, "ceil$2");
function floor$2(out, a) {
  out[0] = Math.floor(a[0]);
  out[1] = Math.floor(a[1]);
  out[2] = Math.floor(a[2]);
  return out;
}
__name(floor$2, "floor$2");
function min$2(out, a, b) {
  out[0] = Math.min(a[0], b[0]);
  out[1] = Math.min(a[1], b[1]);
  out[2] = Math.min(a[2], b[2]);
  return out;
}
__name(min$2, "min$2");
function max$2(out, a, b) {
  out[0] = Math.max(a[0], b[0]);
  out[1] = Math.max(a[1], b[1]);
  out[2] = Math.max(a[2], b[2]);
  return out;
}
__name(max$2, "max$2");
function round$2(out, a) {
  out[0] = Math.round(a[0]);
  out[1] = Math.round(a[1]);
  out[2] = Math.round(a[2]);
  return out;
}
__name(round$2, "round$2");
function scale$4(out, a, b) {
  out[0] = a[0] * b;
  out[1] = a[1] * b;
  out[2] = a[2] * b;
  return out;
}
__name(scale$4, "scale$4");
function scaleAndAdd$2(out, a, b, scale) {
  out[0] = a[0] + b[0] * scale;
  out[1] = a[1] + b[1] * scale;
  out[2] = a[2] + b[2] * scale;
  return out;
}
__name(scaleAndAdd$2, "scaleAndAdd$2");
function distance$2(a, b) {
  var x = b[0] - a[0];
  var y = b[1] - a[1];
  var z = b[2] - a[2];
  return Math.hypot(x, y, z);
}
__name(distance$2, "distance$2");
function squaredDistance$2(a, b) {
  var x = b[0] - a[0];
  var y = b[1] - a[1];
  var z = b[2] - a[2];
  return x * x + y * y + z * z;
}
__name(squaredDistance$2, "squaredDistance$2");
function squaredLength$4(a) {
  var x = a[0];
  var y = a[1];
  var z = a[2];
  return x * x + y * y + z * z;
}
__name(squaredLength$4, "squaredLength$4");
function negate$2(out, a) {
  out[0] = -a[0];
  out[1] = -a[1];
  out[2] = -a[2];
  return out;
}
__name(negate$2, "negate$2");
function inverse$2(out, a) {
  out[0] = 1 / a[0];
  out[1] = 1 / a[1];
  out[2] = 1 / a[2];
  return out;
}
__name(inverse$2, "inverse$2");
function normalize$4(out, a) {
  var x = a[0];
  var y = a[1];
  var z = a[2];
  var len = x * x + y * y + z * z;
  if (len > 0) {
    len = 1 / Math.sqrt(len);
  }
  out[0] = a[0] * len;
  out[1] = a[1] * len;
  out[2] = a[2] * len;
  return out;
}
__name(normalize$4, "normalize$4");
function dot$4(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}
__name(dot$4, "dot$4");
function cross$2(out, a, b) {
  var ax = a[0], ay = a[1], az = a[2];
  var bx = b[0], by = b[1], bz = b[2];
  out[0] = ay * bz - az * by;
  out[1] = az * bx - ax * bz;
  out[2] = ax * by - ay * bx;
  return out;
}
__name(cross$2, "cross$2");
function lerp$4(out, a, b, t) {
  var ax = a[0];
  var ay = a[1];
  var az = a[2];
  out[0] = ax + t * (b[0] - ax);
  out[1] = ay + t * (b[1] - ay);
  out[2] = az + t * (b[2] - az);
  return out;
}
__name(lerp$4, "lerp$4");
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
__name(hermite, "hermite");
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
__name(bezier, "bezier");
function random$3(out, scale) {
  scale = scale || 1;
  var r = RANDOM() * 2 * Math.PI;
  var z = RANDOM() * 2 - 1;
  var zScale = Math.sqrt(1 - z * z) * scale;
  out[0] = Math.cos(r) * zScale;
  out[1] = Math.sin(r) * zScale;
  out[2] = z * scale;
  return out;
}
__name(random$3, "random$3");
function transformMat4$2(out, a, m) {
  var x = a[0], y = a[1], z = a[2];
  var w = m[3] * x + m[7] * y + m[11] * z + m[15];
  w = w || 1;
  out[0] = (m[0] * x + m[4] * y + m[8] * z + m[12]) / w;
  out[1] = (m[1] * x + m[5] * y + m[9] * z + m[13]) / w;
  out[2] = (m[2] * x + m[6] * y + m[10] * z + m[14]) / w;
  return out;
}
__name(transformMat4$2, "transformMat4$2");
function transformMat3$1(out, a, m) {
  var x = a[0], y = a[1], z = a[2];
  out[0] = x * m[0] + y * m[3] + z * m[6];
  out[1] = x * m[1] + y * m[4] + z * m[7];
  out[2] = x * m[2] + y * m[5] + z * m[8];
  return out;
}
__name(transformMat3$1, "transformMat3$1");
function transformQuat$1(out, a, q) {
  var qx = q[0], qy = q[1], qz = q[2], qw = q[3];
  var x = a[0], y = a[1], z = a[2];
  var uvx = qy * z - qz * y, uvy = qz * x - qx * z, uvz = qx * y - qy * x;
  var uuvx = qy * uvz - qz * uvy, uuvy = qz * uvx - qx * uvz, uuvz = qx * uvy - qy * uvx;
  var w2 = qw * 2;
  uvx *= w2;
  uvy *= w2;
  uvz *= w2;
  uuvx *= 2;
  uuvy *= 2;
  uuvz *= 2;
  out[0] = x + uvx + uuvx;
  out[1] = y + uvy + uuvy;
  out[2] = z + uvz + uuvz;
  return out;
}
__name(transformQuat$1, "transformQuat$1");
function rotateX$2(out, a, b, rad) {
  var p = [], r = [];
  p[0] = a[0] - b[0];
  p[1] = a[1] - b[1];
  p[2] = a[2] - b[2];
  r[0] = p[0];
  r[1] = p[1] * Math.cos(rad) - p[2] * Math.sin(rad);
  r[2] = p[1] * Math.sin(rad) + p[2] * Math.cos(rad);
  out[0] = r[0] + b[0];
  out[1] = r[1] + b[1];
  out[2] = r[2] + b[2];
  return out;
}
__name(rotateX$2, "rotateX$2");
function rotateY$2(out, a, b, rad) {
  var p = [], r = [];
  p[0] = a[0] - b[0];
  p[1] = a[1] - b[1];
  p[2] = a[2] - b[2];
  r[0] = p[2] * Math.sin(rad) + p[0] * Math.cos(rad);
  r[1] = p[1];
  r[2] = p[2] * Math.cos(rad) - p[0] * Math.sin(rad);
  out[0] = r[0] + b[0];
  out[1] = r[1] + b[1];
  out[2] = r[2] + b[2];
  return out;
}
__name(rotateY$2, "rotateY$2");
function rotateZ$2(out, a, b, rad) {
  var p = [], r = [];
  p[0] = a[0] - b[0];
  p[1] = a[1] - b[1];
  p[2] = a[2] - b[2];
  r[0] = p[0] * Math.cos(rad) - p[1] * Math.sin(rad);
  r[1] = p[0] * Math.sin(rad) + p[1] * Math.cos(rad);
  r[2] = p[2];
  out[0] = r[0] + b[0];
  out[1] = r[1] + b[1];
  out[2] = r[2] + b[2];
  return out;
}
__name(rotateZ$2, "rotateZ$2");
function angle$1(a, b) {
  var ax = a[0], ay = a[1], az = a[2], bx = b[0], by = b[1], bz = b[2], mag1 = Math.sqrt(ax * ax + ay * ay + az * az), mag2 = Math.sqrt(bx * bx + by * by + bz * bz), mag = mag1 * mag2, cosine = mag && dot$4(a, b) / mag;
  return Math.acos(Math.min(Math.max(cosine, -1), 1));
}
__name(angle$1, "angle$1");
function zero$2(out) {
  out[0] = 0;
  out[1] = 0;
  out[2] = 0;
  return out;
}
__name(zero$2, "zero$2");
function str$4(a) {
  return "vec3(" + a[0] + ", " + a[1] + ", " + a[2] + ")";
}
__name(str$4, "str$4");
function exactEquals$4(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}
__name(exactEquals$4, "exactEquals$4");
function equals$4(a, b) {
  var a0 = a[0], a1 = a[1], a2 = a[2];
  var b0 = b[0], b1 = b[1], b2 = b[2];
  return Math.abs(a0 - b0) <= EPSILON * Math.max(1, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= EPSILON * Math.max(1, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= EPSILON * Math.max(1, Math.abs(a2), Math.abs(b2));
}
__name(equals$4, "equals$4");
var sub$2 = subtract$2;
var mul$4 = multiply$4;
var div$2 = divide$2;
var dist$2 = distance$2;
var sqrDist$2 = squaredDistance$2;
var len$4 = length$4;
var sqrLen$4 = squaredLength$4;
var forEach$2 = function() {
  var vec = create$4();
  return function(a, stride, offset, count, fn, arg) {
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
var vec3 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  create: create$4,
  clone: clone$4,
  length: length$4,
  fromValues: fromValues$4,
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
  normalize: normalize$4,
  dot: dot$4,
  cross: cross$2,
  lerp: lerp$4,
  hermite,
  bezier,
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
  len: len$4,
  sqrLen: sqrLen$4,
  forEach: forEach$2
});
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
__name(create$3, "create$3");
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
__name(normalize$3, "normalize$3");
(function() {
  var vec = create$3();
  return function(a, stride, offset, count, fn, arg) {
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
__name(create$2, "create$2");
function setAxisAngle(out, axis, rad) {
  rad = rad * 0.5;
  var s = Math.sin(rad);
  out[0] = s * axis[0];
  out[1] = s * axis[1];
  out[2] = s * axis[2];
  out[3] = Math.cos(rad);
  return out;
}
__name(setAxisAngle, "setAxisAngle");
function slerp(out, a, b, t) {
  var ax = a[0], ay = a[1], az = a[2], aw = a[3];
  var bx = b[0], by = b[1], bz = b[2], bw = b[3];
  var omega, cosom, sinom, scale0, scale1;
  cosom = ax * bx + ay * by + az * bz + aw * bw;
  if (cosom < 0) {
    cosom = -cosom;
    bx = -bx;
    by = -by;
    bz = -bz;
    bw = -bw;
  }
  if (1 - cosom > EPSILON) {
    omega = Math.acos(cosom);
    sinom = Math.sin(omega);
    scale0 = Math.sin((1 - t) * omega) / sinom;
    scale1 = Math.sin(t * omega) / sinom;
  } else {
    scale0 = 1 - t;
    scale1 = t;
  }
  out[0] = scale0 * ax + scale1 * bx;
  out[1] = scale0 * ay + scale1 * by;
  out[2] = scale0 * az + scale1 * bz;
  out[3] = scale0 * aw + scale1 * bw;
  return out;
}
__name(slerp, "slerp");
function fromMat3(out, m) {
  var fTrace = m[0] + m[4] + m[8];
  var fRoot;
  if (fTrace > 0) {
    fRoot = Math.sqrt(fTrace + 1);
    out[3] = 0.5 * fRoot;
    fRoot = 0.5 / fRoot;
    out[0] = (m[5] - m[7]) * fRoot;
    out[1] = (m[6] - m[2]) * fRoot;
    out[2] = (m[1] - m[3]) * fRoot;
  } else {
    var i = 0;
    if (m[4] > m[0])
      i = 1;
    if (m[8] > m[i * 3 + i])
      i = 2;
    var j = (i + 1) % 3;
    var k = (i + 2) % 3;
    fRoot = Math.sqrt(m[i * 3 + i] - m[j * 3 + j] - m[k * 3 + k] + 1);
    out[i] = 0.5 * fRoot;
    fRoot = 0.5 / fRoot;
    out[3] = (m[j * 3 + k] - m[k * 3 + j]) * fRoot;
    out[j] = (m[j * 3 + i] + m[i * 3 + j]) * fRoot;
    out[k] = (m[k * 3 + i] + m[i * 3 + k]) * fRoot;
  }
  return out;
}
__name(fromMat3, "fromMat3");
var normalize$2 = normalize$3;
(function() {
  var tmpvec3 = create$4();
  var xUnitVec3 = fromValues$4(1, 0, 0);
  var yUnitVec3 = fromValues$4(0, 1, 0);
  return function(out, a, b) {
    var dot = dot$4(a, b);
    if (dot < -0.999999) {
      cross$2(tmpvec3, xUnitVec3, a);
      if (len$4(tmpvec3) < 1e-6)
        cross$2(tmpvec3, yUnitVec3, a);
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
(function() {
  var temp1 = create$2();
  var temp2 = create$2();
  return function(out, a, b, c, d, t) {
    slerp(temp1, a, d, t);
    slerp(temp2, b, c, t);
    slerp(out, temp1, temp2, 2 * t * (1 - t));
    return out;
  };
})();
(function() {
  var matr = create$6();
  return function(out, view, right, up) {
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
function create() {
  var out = new ARRAY_TYPE(2);
  if (ARRAY_TYPE != Float32Array) {
    out[0] = 0;
    out[1] = 0;
  }
  return out;
}
__name(create, "create");
(function() {
  var vec = create();
  return function(a, stride, offset, count, fn, arg) {
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
class AnimationControl {
  #animationData;
  #finishedPromise;
  #willFinish;
  static #voidControl = new AnimationControl(null);
  static get voidControl() {
    return this.#voidControl;
  }
  constructor(animationData, willFinish = false) {
    this.#animationData = animationData;
    this.#willFinish = willFinish;
    if (animationData !== null && typeof animationData === "object") {
      animationData.control = this;
    }
  }
  get finished() {
    if (!(this.#finishedPromise instanceof Promise)) {
      this.#finishedPromise = this.#willFinish ? new Promise((resolve) => this.#animationData.resolve = resolve) : Promise.resolve();
    }
    return this.#finishedPromise;
  }
  get isActive() {
    return this.#animationData.active;
  }
  get isFinished() {
    return this.#animationData.finished;
  }
  cancel() {
    const animationData = this.#animationData;
    if (animationData === null || animationData === void 0) {
      return;
    }
    animationData.cancelled = true;
  }
}
__name(AnimationControl, "AnimationControl");
class AnimationManager {
  static activeList = [];
  static newList = [];
  static current;
  static add(data) {
    const now2 = performance.now();
    data.start = now2 + (AnimationManager.current - now2);
    AnimationManager.newList.push(data);
  }
  static animate() {
    const current = AnimationManager.current = performance.now();
    if (AnimationManager.activeList.length === 0 && AnimationManager.newList.length === 0) {
      globalThis.requestAnimationFrame(AnimationManager.animate);
      return;
    }
    if (AnimationManager.newList.length) {
      for (let cntr = AnimationManager.newList.length; --cntr >= 0; ) {
        const data = AnimationManager.newList[cntr];
        if (data.cancelled) {
          AnimationManager.newList.splice(cntr, 1);
          data.cleanup(data);
        }
        if (data.active) {
          AnimationManager.newList.splice(cntr, 1);
          AnimationManager.activeList.push(data);
        }
      }
    }
    for (let cntr = AnimationManager.activeList.length; --cntr >= 0; ) {
      const data = AnimationManager.activeList[cntr];
      if (data.cancelled || data.el !== void 0 && !data.el.isConnected) {
        AnimationManager.activeList.splice(cntr, 1);
        data.cleanup(data);
        continue;
      }
      data.current = current - data.start;
      if (data.current >= data.duration) {
        for (let dataCntr = data.keys.length; --dataCntr >= 0; ) {
          const key = data.keys[dataCntr];
          data.newData[key] = data.destination[key];
        }
        data.position.set(data.newData);
        AnimationManager.activeList.splice(cntr, 1);
        data.cleanup(data);
        continue;
      }
      const easedTime = data.ease(data.current / data.duration);
      for (let dataCntr = data.keys.length; --dataCntr >= 0; ) {
        const key = data.keys[dataCntr];
        data.newData[key] = data.interpolate(data.initial[key], data.destination[key], easedTime);
      }
      data.position.set(data.newData);
    }
    globalThis.requestAnimationFrame(AnimationManager.animate);
  }
  static cancel(position) {
    for (let cntr = AnimationManager.activeList.length; --cntr >= 0; ) {
      const data = AnimationManager.activeList[cntr];
      if (data.position === position) {
        AnimationManager.activeList.splice(cntr, 1);
        data.cancelled = true;
        data.cleanup(data);
      }
    }
    for (let cntr = AnimationManager.newList.length; --cntr >= 0; ) {
      const data = AnimationManager.newList[cntr];
      if (data.position === position) {
        AnimationManager.newList.splice(cntr, 1);
        data.cancelled = true;
        data.cleanup(data);
      }
    }
  }
  static cancelAll() {
    for (let cntr = AnimationManager.activeList.length; --cntr >= 0; ) {
      const data = AnimationManager.activeList[cntr];
      data.cancelled = true;
      data.cleanup(data);
    }
    for (let cntr = AnimationManager.newList.length; --cntr >= 0; ) {
      const data = AnimationManager.newList[cntr];
      data.cancelled = true;
      data.cleanup(data);
    }
    AnimationManager.activeList.length = 0;
    AnimationManager.newList.length = 0;
  }
  static getScheduled(position) {
    const results = [];
    for (let cntr = AnimationManager.activeList.length; --cntr >= 0; ) {
      const data = AnimationManager.activeList[cntr];
      if (data.position === position) {
        results.push(data.control);
      }
    }
    for (let cntr = AnimationManager.newList.length; --cntr >= 0; ) {
      const data = AnimationManager.newList[cntr];
      if (data.position === position) {
        results.push(data.control);
      }
    }
    return results;
  }
}
__name(AnimationManager, "AnimationManager");
AnimationManager.animate();
const animateKeys = /* @__PURE__ */ new Set([
  "left",
  "top",
  "maxWidth",
  "maxHeight",
  "minWidth",
  "minHeight",
  "width",
  "height",
  "rotateX",
  "rotateY",
  "rotateZ",
  "scale",
  "translateX",
  "translateY",
  "translateZ",
  "zIndex",
  "rotation"
]);
const transformKeys = ["rotateX", "rotateY", "rotateZ", "scale", "translateX", "translateY", "translateZ"];
Object.freeze(transformKeys);
const relativeRegex = /^([-+*])=(-?[\d]*\.?[\d]+)$/;
const numericDefaults = {
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
function setNumericDefaults(data) {
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
  }
  if (data.rotation === null) {
    data.rotation = 0;
  }
}
__name(setNumericDefaults, "setNumericDefaults");
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
const transformOriginDefault = "top left";
const transformOrigins = [
  "top left",
  "top center",
  "top right",
  "center left",
  "center",
  "center right",
  "bottom left",
  "bottom center",
  "bottom right"
];
Object.freeze(transformOrigins);
function convertRelative(positionData, position) {
  for (const key in positionData) {
    if (animateKeys.has(key)) {
        const value = positionData[key];
        if (typeof value !== "string") {
            continue;
        }
        if (value === "auto" || value === "inherit") {
            continue;
        }
        const regexResults = relativeRegex.exec(value);
        if (!regexResults) {
            throw new Error(
                `convertRelative error: malformed relative key (${key}) with value (${value})`
            );
        }
        const current = position[key];
        switch (regexResults[1]) {
            case "-":
                positionData[key] = current - parseFloat(regexResults[2]);
                break;
            case "+":
                positionData[key] = current + parseFloat(regexResults[2]);
                break;
            case "*":
                positionData[key] = current * parseFloat(regexResults[2]);
                break;
        }
    }
  }
}
__name(convertRelative, "convertRelative");
class AnimationAPI {
  #data;
  #position;
  #instanceCount = 0;
  #cleanup;
  constructor(position, data) {
    this.#position = position;
    this.#data = data;
    this.#cleanup = this.#cleanupInstance.bind(this);
  }
  get isScheduled() {
    return this.#instanceCount > 0;
  }
  #addAnimation(initial, destination, duration, el, delay, ease, interpolate) {
    setNumericDefaults(initial);
    setNumericDefaults(destination);
    for (const key in initial) {
      if (!Number.isFinite(initial[key])) {
        delete initial[key];
      }
    }
    const keys = Object.keys(initial);
    const newData = Object.assign({ immediateElementUpdate: true }, initial);
    if (keys.length === 0) {
      return AnimationControl.voidControl;
    }
    const animationData = {
      active: true,
      cleanup: this.#cleanup,
      cancelled: false,
      control: void 0,
      current: 0,
      destination,
      duration: duration * 1e3,
      ease,
      el,
      finished: false,
      initial,
      interpolate,
      keys,
      newData,
      position: this.#position,
      resolve: void 0,
      start: void 0
    };
    if (delay > 0) {
      animationData.active = false;
      setTimeout(() => {
        if (!animationData.cancelled) {
          animationData.active = true;
          const now2 = performance.now();
          animationData.start = now2 + (AnimationManager.current - now2);
        }
      }, delay * 1e3);
    }
    this.#instanceCount++;
    AnimationManager.add(animationData);
    return new AnimationControl(animationData, true);
  }
  cancel() {
    AnimationManager.cancel(this.#position);
  }
  #cleanupInstance(data) {
    this.#instanceCount--;
    data.active = false;
    data.finished = true;
    if (typeof data.resolve === "function") {
      data.resolve(data.cancelled);
    }
  }
  getScheduled() {
    return AnimationManager.getScheduled(this.#position);
  }
  from(fromData, { delay = 0, duration = 1, ease = cubicOut, interpolate = lerp$5 } = {}) {
    if (!isObject(fromData)) {
      throw new TypeError(`AnimationAPI.from error: 'fromData' is not an object.`);
    }
    const position = this.#position;
    const parent = position.parent;
    if (parent !== void 0 && typeof parent?.options?.positionable === "boolean" && !parent?.options?.positionable) {
      return AnimationControl.voidControl;
    }
    const targetEl = parent instanceof HTMLElement ? parent : parent?.elementTarget;
    const el = targetEl instanceof HTMLElement && targetEl.isConnected ? targetEl : void 0;
    if (!Number.isFinite(delay) || delay < 0) {
      throw new TypeError(`AnimationAPI.from error: 'delay' is not a positive number.`);
    }
    if (!Number.isFinite(duration) || duration < 0) {
      throw new TypeError(`AnimationAPI.from error: 'duration' is not a positive number.`);
    }
    if (typeof ease !== "function") {
      throw new TypeError(`AnimationAPI.from error: 'ease' is not a function.`);
    }
    if (typeof interpolate !== "function") {
      throw new TypeError(`AnimationAPI.from error: 'interpolate' is not a function.`);
    }
    const initial = {};
    const destination = {};
    const data = this.#data;
    for (const key in fromData) {
      if (data[key] !== void 0 && fromData[key] !== data[key]) {
        initial[key] = fromData[key];
        destination[key] = data[key];
      }
    }
    convertRelative(initial, data);
    return this.#addAnimation(initial, destination, duration, el, delay, ease, interpolate);
  }
  fromTo(fromData, toData, { delay = 0, duration = 1, ease = cubicOut, interpolate = lerp$5 } = {}) {
    if (!isObject(fromData)) {
      throw new TypeError(`AnimationAPI.fromTo error: 'fromData' is not an object.`);
    }
    if (!isObject(toData)) {
      throw new TypeError(`AnimationAPI.fromTo error: 'toData' is not an object.`);
    }
    const parent = this.#position.parent;
    if (parent !== void 0 && typeof parent?.options?.positionable === "boolean" && !parent?.options?.positionable) {
      return AnimationControl.voidControl;
    }
    const targetEl = parent instanceof HTMLElement ? parent : parent?.elementTarget;
    const el = targetEl instanceof HTMLElement && targetEl.isConnected ? targetEl : void 0;
    if (!Number.isFinite(delay) || delay < 0) {
      throw new TypeError(`AnimationAPI.fromTo error: 'delay' is not a positive number.`);
    }
    if (!Number.isFinite(duration) || duration < 0) {
      throw new TypeError(`AnimationAPI.fromTo error: 'duration' is not a positive number.`);
    }
    if (typeof ease !== "function") {
      throw new TypeError(`AnimationAPI.fromTo error: 'ease' is not a function.`);
    }
    if (typeof interpolate !== "function") {
      throw new TypeError(`AnimationAPI.fromTo error: 'interpolate' is not a function.`);
    }
    const initial = {};
    const destination = {};
    const data = this.#data;
    for (const key in fromData) {
      if (toData[key] === void 0) {
        console.warn(
          `AnimationAPI.fromTo warning: key ('${key}') from 'fromData' missing in 'toData'; skipping this key.`
        );
        continue;
      }
      if (data[key] !== void 0) {
        initial[key] = fromData[key];
        destination[key] = toData[key];
      }
    }
    convertRelative(initial, data);
    convertRelative(destination, data);
    return this.#addAnimation(initial, destination, duration, el, delay, ease, interpolate);
  }
  to(toData, { delay = 0, duration = 1, ease = cubicOut, interpolate = lerp$5 } = {}) {
    if (!isObject(toData)) {
      throw new TypeError(`AnimationAPI.to error: 'toData' is not an object.`);
    }
    const parent = this.#position.parent;
    if (parent !== void 0 && typeof parent?.options?.positionable === "boolean" && !parent?.options?.positionable) {
      return AnimationControl.voidControl;
    }
    const targetEl = parent instanceof HTMLElement ? parent : parent?.elementTarget;
    const el = targetEl instanceof HTMLElement && targetEl.isConnected ? targetEl : void 0;
    if (!Number.isFinite(delay) || delay < 0) {
      throw new TypeError(`AnimationAPI.to error: 'delay' is not a positive number.`);
    }
    if (!Number.isFinite(duration) || duration < 0) {
      throw new TypeError(`AnimationAPI.to error: 'duration' is not a positive number.`);
    }
    if (typeof ease !== "function") {
      throw new TypeError(`AnimationAPI.to error: 'ease' is not a function.`);
    }
    if (typeof interpolate !== "function") {
      throw new TypeError(`AnimationAPI.to error: 'interpolate' is not a function.`);
    }
    const initial = {};
    const destination = {};
    const data = this.#data;
    for (const key in toData) {
      if (data[key] !== void 0 && toData[key] !== data[key]) {
        destination[key] = toData[key];
        initial[key] = data[key];
      }
    }
    convertRelative(destination, data);
    return this.#addAnimation(initial, destination, duration, el, delay, ease, interpolate);
  }
  quickTo(keys, { duration = 1, ease = cubicOut, interpolate = lerp$5 } = {}) {
    if (!isIterable(keys)) {
      throw new TypeError(`AnimationAPI.quickTo error: 'keys' is not an iterable list.`);
    }
    const parent = this.#position.parent;
    if (parent !== void 0 && typeof parent?.options?.positionable === "boolean" && !parent?.options?.positionable) {
      throw new Error(`AnimationAPI.quickTo error: 'parent' is not positionable.`);
    }
    if (!Number.isFinite(duration) || duration < 0) {
      throw new TypeError(`AnimationAPI.quickTo error: 'duration' is not a positive number.`);
    }
    if (typeof ease !== "function") {
      throw new TypeError(`AnimationAPI.quickTo error: 'ease' is not a function.`);
    }
    if (typeof interpolate !== "function") {
      throw new TypeError(`AnimationAPI.quickTo error: 'interpolate' is not a function.`);
    }
    const initial = {};
    const destination = {};
    const data = this.#data;
    for (const key of keys) {
      if (typeof key !== "string") {
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
    const newData = Object.assign({ immediateElementUpdate: true }, initial);
    const animationData = {
      active: true,
      cleanup: this.#cleanup,
      cancelled: false,
      control: void 0,
      current: 0,
      destination,
      duration: duration * 1e3,
      ease,
      el: void 0,
      finished: true,
      initial,
      interpolate,
      keys,
      newData,
      position: this.#position,
      resolve: void 0,
      start: void 0
    };
    const quickToCB = /* @__PURE__ */ __name((...args) => {
      const argsLength = args.length;
      if (argsLength === 0) {
        return;
      }
      for (let cntr = keysArray.length; --cntr >= 0; ) {
        const key = keysArray[cntr];
        if (data[key] !== void 0) {
          initial[key] = data[key];
        }
      }
      if (isObject(args[0])) {
        const objData = args[0];
        for (const key in objData) {
          if (destination[key] !== void 0) {
            destination[key] = objData[key];
          }
        }
      } else {
        for (let cntr = 0; cntr < argsLength && cntr < keysArray.length; cntr++) {
          const key = keysArray[cntr];
          if (destination[key] !== void 0) {
            destination[key] = args[cntr];
          }
        }
      }
      convertRelative(destination, data);
      setNumericDefaults(initial);
      setNumericDefaults(destination);
      const targetEl = parent instanceof HTMLElement ? parent : parent?.elementTarget;
      animationData.el = targetEl instanceof HTMLElement && targetEl.isConnected ? targetEl : void 0;
      if (animationData.finished) {
        animationData.finished = false;
        animationData.active = true;
        animationData.current = 0;
        this.#instanceCount++;
        AnimationManager.add(animationData);
      } else {
        const now2 = performance.now();
        animationData.start = now2 + (AnimationManager.current - now2);
        animationData.current = 0;
      }
    }, "quickToCB");
    quickToCB.keys = keysArray;
    quickToCB.options = ({ duration: duration2, ease: ease2, interpolate: interpolate2 } = {}) => {
      if (duration2 !== void 0 && (!Number.isFinite(duration2) || duration2 < 0)) {
        throw new TypeError(`AnimationAPI.quickTo.options error: 'duration' is not a positive number.`);
      }
      if (ease2 !== void 0 && typeof ease2 !== "function") {
        throw new TypeError(`AnimationAPI.quickTo.options error: 'ease' is not a function.`);
      }
      if (interpolate2 !== void 0 && typeof interpolate2 !== "function") {
        throw new TypeError(`AnimationAPI.quickTo.options error: 'interpolate' is not a function.`);
      }
      if (duration2 >= 0) {
        animationData.duration = duration2 * 1e3;
      }
      if (ease2) {
        animationData.ease = ease2;
      }
      if (interpolate2) {
        animationData.interpolate = interpolate2;
      }
      return quickToCB;
    };
    return quickToCB;
  }
}
__name(AnimationAPI, "AnimationAPI");
class AnimationGroupControl {
  #animationControls;
  #finishedPromise;
  static #voidControl = new AnimationGroupControl(null);
  static get voidControl() {
    return this.#voidControl;
  }
  constructor(animationControls) {
    this.#animationControls = animationControls;
  }
  get finished() {
    const animationControls = this.#animationControls;
    if (animationControls === null || animationControls === void 0) {
      return Promise.resolve();
    }
    if (!(this.#finishedPromise instanceof Promise)) {
      const promises = [];
      for (let cntr = animationControls.length; --cntr >= 0; ) {
        promises.push(animationControls[cntr].finished);
      }
      this.#finishedPromise = Promise.all(promises);
    }
    return this.#finishedPromise;
  }
  get isActive() {
    const animationControls = this.#animationControls;
    if (animationControls === null || animationControls === void 0) {
      return false;
    }
    for (let cntr = animationControls.length; --cntr >= 0; ) {
      if (animationControls[cntr].isActive) {
        return true;
      }
    }
    return false;
  }
  get isFinished() {
    const animationControls = this.#animationControls;
    if (animationControls === null || animationControls === void 0) {
      return true;
    }
    for (let cntr = animationControls.length; --cntr >= 0; ) {
      if (!animationControls[cntr].isFinished) {
        return false;
      }
    }
    return false;
  }
  cancel() {
    const animationControls = this.#animationControls;
    if (animationControls === null || animationControls === void 0) {
      return;
    }
    for (let cntr = this.#animationControls.length; --cntr >= 0; ) {
      this.#animationControls[cntr].cancel();
    }
  }
}
__name(AnimationGroupControl, "AnimationGroupControl");
class AnimationGroupAPI {
  static #isPosition(object) {
    return object !== null && typeof object === "object" && object.animate instanceof AnimationAPI;
  }
  static cancel(position) {
    if (isIterable(position)) {
      let index = -1;
      for (const entry of position) {
        index++;
        const actualPosition = this.#isPosition(entry) ? entry : entry.position;
        if (!this.#isPosition(actualPosition)) {
          console.warn(`AnimationGroupAPI.cancel warning: No Position instance found at index: ${index}.`);
          continue;
        }
        AnimationManager.cancel(actualPosition);
      }
    } else {
      const actualPosition = this.#isPosition(position) ? position : position.position;
      if (!this.#isPosition(actualPosition)) {
        console.warn(`AnimationGroupAPI.cancel warning: No Position instance found.`);
        return;
      }
      AnimationManager.cancel(actualPosition);
    }
  }
  static cancelAll() {
    AnimationManager.cancelAll();
  }
  static getScheduled(position) {
    const results = [];
    if (isIterable(position)) {
      let index = -1;
      for (const entry of position) {
        index++;
        const isPosition = this.#isPosition(entry);
        const actualPosition = isPosition ? entry : entry.position;
        if (!this.#isPosition(actualPosition)) {
          console.warn(`AnimationGroupAPI.getScheduled warning: No Position instance found at index: ${index}.`);
          continue;
        }
        const controls = AnimationManager.getScheduled(actualPosition);
        results.push({ position: actualPosition, data: isPosition ? void 0 : entry, controls });
      }
    } else {
      const isPosition = this.#isPosition(position);
      const actualPosition = isPosition ? position : position.position;
      if (!this.#isPosition(actualPosition)) {
        console.warn(`AnimationGroupAPI.getScheduled warning: No Position instance found.`);
        return results;
      }
      const controls = AnimationManager.getScheduled(actualPosition);
      results.push({ position: actualPosition, data: isPosition ? void 0 : position, controls });
    }
    return results;
  }
  static from(position, fromData, options) {
    if (!isObject(fromData) && typeof fromData !== "function") {
      throw new TypeError(`AnimationGroupAPI.from error: 'fromData' is not an object or function.`);
    }
    if (options !== void 0 && !isObject(options) && typeof options !== "function") {
      throw new TypeError(`AnimationGroupAPI.from error: 'options' is not an object or function.`);
    }
    const animationControls = [];
    let index = -1;
    let callbackOptions;
    const hasDataCallback = typeof fromData === "function";
    const hasOptionCallback = typeof options === "function";
    const hasCallback = hasDataCallback || hasOptionCallback;
    if (hasCallback) {
      callbackOptions = { index, position: void 0, data: void 0 };
    }
    let actualFromData = fromData;
    let actualOptions = options;
    if (isIterable(position)) {
      for (const entry of position) {
        index++;
        const isPosition = this.#isPosition(entry);
        const actualPosition = isPosition ? entry : entry.position;
        if (!this.#isPosition(actualPosition)) {
          console.warn(`AnimationGroupAPI.from warning: No Position instance found at index: ${index}.`);
          continue;
        }
        if (hasCallback) {
          callbackOptions.index = index;
          callbackOptions.position = position;
          callbackOptions.data = isPosition ? void 0 : entry;
        }
        if (hasDataCallback) {
          actualFromData = fromData(callbackOptions);
          if (actualFromData === null || actualFromData === void 0) {
            continue;
          }
          if (typeof actualFromData !== "object") {
            throw new TypeError(`AnimationGroupAPI.from error: fromData callback function iteration(${index}) failed to return an object.`);
          }
        }
        if (hasOptionCallback) {
          actualOptions = options(callbackOptions);
          if (actualOptions === null || actualOptions === void 0) {
            continue;
          }
          if (typeof actualOptions !== "object") {
            throw new TypeError(`AnimationGroupAPI.from error: options callback function iteration(${index}) failed to return an object.`);
          }
        }
        animationControls.push(actualPosition.animate.from(actualFromData, actualOptions));
      }
    } else {
      const isPosition = this.#isPosition(position);
      const actualPosition = isPosition ? position : position.position;
      if (!this.#isPosition(actualPosition)) {
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
        if (typeof actualFromData !== "object") {
          throw new TypeError(
            `AnimationGroupAPI.from error: fromData callback function failed to return an object.`
          );
        }
      }
      if (hasOptionCallback) {
        actualOptions = options(callbackOptions);
        if (typeof actualOptions !== "object") {
          throw new TypeError(
            `AnimationGroupAPI.from error: options callback function failed to return an object.`
          );
        }
      }
      animationControls.push(actualPosition.animate.from(actualFromData, actualOptions));
    }
    return new AnimationGroupControl(animationControls);
  }
  static fromTo(position, fromData, toData, options) {
    if (!isObject(fromData) && typeof fromData !== "function") {
      throw new TypeError(`AnimationGroupAPI.fromTo error: 'fromData' is not an object or function.`);
    }
    if (!isObject(toData) && typeof toData !== "function") {
      throw new TypeError(`AnimationGroupAPI.fromTo error: 'toData' is not an object or function.`);
    }
    if (options !== void 0 && !isObject(options) && typeof options !== "function") {
      throw new TypeError(`AnimationGroupAPI.fromTo error: 'options' is not an object or function.`);
    }
    const animationControls = [];
    let index = -1;
    let callbackOptions;
    const hasFromCallback = typeof fromData === "function";
    const hasToCallback = typeof toData === "function";
    const hasOptionCallback = typeof options === "function";
    const hasCallback = hasFromCallback || hasToCallback || hasOptionCallback;
    if (hasCallback) {
      callbackOptions = { index, position: void 0, data: void 0 };
    }
    let actualFromData = fromData;
    let actualToData = toData;
    let actualOptions = options;
    if (isIterable(position)) {
      for (const entry of position) {
        index++;
        const isPosition = this.#isPosition(entry);
        const actualPosition = isPosition ? entry : entry.position;
        if (!this.#isPosition(actualPosition)) {
          console.warn(`AnimationGroupAPI.fromTo warning: No Position instance found at index: ${index}.`);
          continue;
        }
        if (hasCallback) {
          callbackOptions.index = index;
          callbackOptions.position = position;
          callbackOptions.data = isPosition ? void 0 : entry;
        }
        if (hasFromCallback) {
          actualFromData = fromData(callbackOptions);
          if (actualFromData === null || actualFromData === void 0) {
            continue;
          }
          if (typeof actualFromData !== "object") {
            throw new TypeError(`AnimationGroupAPI.fromTo error: fromData callback function iteration(${index}) failed to return an object.`);
          }
        }
        if (hasToCallback) {
          actualToData = toData(callbackOptions);
          if (actualToData === null || actualToData === void 0) {
            continue;
          }
          if (typeof actualToData !== "object") {
            throw new TypeError(`AnimationGroupAPI.fromTo error: toData callback function iteration(${index}) failed to return an object.`);
          }
        }
        if (hasOptionCallback) {
          actualOptions = options(callbackOptions);
          if (actualOptions === null || actualOptions === void 0) {
            continue;
          }
          if (typeof actualOptions !== "object") {
            throw new TypeError(`AnimationGroupAPI.fromTo error: options callback function iteration(${index}) failed to return an object.`);
          }
        }
        animationControls.push(actualPosition.animate.fromTo(actualFromData, actualToData, actualOptions));
      }
    } else {
      const isPosition = this.#isPosition(position);
      const actualPosition = isPosition ? position : position.position;
      if (!this.#isPosition(actualPosition)) {
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
        if (typeof actualFromData !== "object") {
          throw new TypeError(
            `AnimationGroupAPI.fromTo error: fromData callback function failed to return an object.`
          );
        }
      }
      if (hasToCallback) {
        actualToData = toData(callbackOptions);
        if (typeof actualToData !== "object") {
          throw new TypeError(
            `AnimationGroupAPI.fromTo error: toData callback function failed to return an object.`
          );
        }
      }
      if (hasOptionCallback) {
        actualOptions = options(callbackOptions);
        if (typeof actualOptions !== "object") {
          throw new TypeError(
            `AnimationGroupAPI.fromTo error: options callback function failed to return an object.`
          );
        }
      }
      animationControls.push(actualPosition.animate.fromTo(actualFromData, actualToData, actualOptions));
    }
    return new AnimationGroupControl(animationControls);
  }
  static to(position, toData, options) {
    if (!isObject(toData) && typeof toData !== "function") {
      throw new TypeError(`AnimationGroupAPI.to error: 'toData' is not an object or function.`);
    }
    if (options !== void 0 && !isObject(options) && typeof options !== "function") {
      throw new TypeError(`AnimationGroupAPI.to error: 'options' is not an object or function.`);
    }
    const animationControls = [];
    let index = -1;
    let callbackOptions;
    const hasDataCallback = typeof toData === "function";
    const hasOptionCallback = typeof options === "function";
    const hasCallback = hasDataCallback || hasOptionCallback;
    if (hasCallback) {
      callbackOptions = { index, position: void 0, data: void 0 };
    }
    let actualToData = toData;
    let actualOptions = options;
    if (isIterable(position)) {
      for (const entry of position) {
        index++;
        const isPosition = this.#isPosition(entry);
        const actualPosition = isPosition ? entry : entry.position;
        if (!this.#isPosition(actualPosition)) {
          console.warn(`AnimationGroupAPI.to warning: No Position instance found at index: ${index}.`);
          continue;
        }
        if (hasCallback) {
          callbackOptions.index = index;
          callbackOptions.position = position;
          callbackOptions.data = isPosition ? void 0 : entry;
        }
        if (hasDataCallback) {
          actualToData = toData(callbackOptions);
          if (actualToData === null || actualToData === void 0) {
            continue;
          }
          if (typeof actualToData !== "object") {
            throw new TypeError(`AnimationGroupAPI.to error: toData callback function iteration(${index}) failed to return an object.`);
          }
        }
        if (hasOptionCallback) {
          actualOptions = options(callbackOptions);
          if (actualOptions === null || actualOptions === void 0) {
            continue;
          }
          if (typeof actualOptions !== "object") {
            throw new TypeError(`AnimationGroupAPI.to error: options callback function iteration(${index}) failed to return an object.`);
          }
        }
        animationControls.push(actualPosition.animate.to(actualToData, actualOptions));
      }
    } else {
      const isPosition = this.#isPosition(position);
      const actualPosition = isPosition ? position : position.position;
      if (!this.#isPosition(actualPosition)) {
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
        if (typeof actualToData !== "object") {
          throw new TypeError(
            `AnimationGroupAPI.to error: toData callback function failed to return an object.`
          );
        }
      }
      if (hasOptionCallback) {
        actualOptions = options(callbackOptions);
        if (typeof actualOptions !== "object") {
          throw new TypeError(
            `AnimationGroupAPI.to error: options callback function failed to return an object.`
          );
        }
      }
      animationControls.push(actualPosition.animate.to(actualToData, actualOptions));
    }
    return new AnimationGroupControl(animationControls);
  }
  static quickTo(position, keys, options) {
    if (!isIterable(keys)) {
      throw new TypeError(`AnimationGroupAPI.quickTo error: 'keys' is not an iterable list.`);
    }
    if (options !== void 0 && !isObject(options) && typeof options !== "function") {
      throw new TypeError(`AnimationGroupAPI.quickTo error: 'options' is not an object or function.`);
    }
    const quickToCallbacks = [];
    let index = -1;
    const hasOptionCallback = typeof options === "function";
    const callbackOptions = { index, position: void 0, data: void 0 };
    let actualOptions = options;
    if (isIterable(position)) {
      for (const entry of position) {
        index++;
        const isPosition = this.#isPosition(entry);
        const actualPosition = isPosition ? entry : entry.position;
        if (!this.#isPosition(actualPosition)) {
          console.warn(`AnimationGroupAPI.quickTo warning: No Position instance found at index: ${index}.`);
          continue;
        }
        callbackOptions.index = index;
        callbackOptions.position = position;
        callbackOptions.data = isPosition ? void 0 : entry;
        if (hasOptionCallback) {
          actualOptions = options(callbackOptions);
          if (actualOptions === null || actualOptions === void 0) {
            continue;
          }
          if (typeof actualOptions !== "object") {
            throw new TypeError(`AnimationGroupAPI.quickTo error: options callback function iteration(${index}) failed to return an object.`);
          }
        }
        quickToCallbacks.push(actualPosition.animate.quickTo(keys, actualOptions));
      }
    } else {
      const isPosition = this.#isPosition(position);
      const actualPosition = isPosition ? position : position.position;
      if (!this.#isPosition(actualPosition)) {
        console.warn(`AnimationGroupAPI.quickTo warning: No Position instance found.`);
        return () => null;
      }
      callbackOptions.index = 0;
      callbackOptions.position = position;
      callbackOptions.data = isPosition ? void 0 : position;
      if (hasOptionCallback) {
        actualOptions = options(callbackOptions);
        if (typeof actualOptions !== "object") {
          throw new TypeError(
            `AnimationGroupAPI.quickTo error: options callback function failed to return an object.`
          );
        }
      }
      quickToCallbacks.push(actualPosition.animate.quickTo(keys, actualOptions));
    }
    const keysArray = [...keys];
    Object.freeze(keysArray);
    const quickToCB = /* @__PURE__ */ __name((...args) => {
      const argsLength = args.length;
      if (argsLength === 0) {
        return;
      }
      if (typeof args[0] === "function") {
        const dataCallback = args[0];
        index = -1;
        let cntr = 0;
        if (isIterable(position)) {
          for (const entry of position) {
            index++;
            const isPosition = this.#isPosition(entry);
            const actualPosition = isPosition ? entry : entry.position;
            if (!this.#isPosition(actualPosition)) {
              continue;
            }
            callbackOptions.index = index;
            callbackOptions.position = position;
            callbackOptions.data = isPosition ? void 0 : entry;
            const toData = dataCallback(callbackOptions);
            if (toData === null || toData === void 0) {
              continue;
            }
            const toDataIterable = isIterable(toData);
            if (!Number.isFinite(toData) && !toDataIterable && typeof toData !== "object") {
              throw new TypeError(`AnimationGroupAPI.quickTo error: toData callback function iteration(${index}) failed to return a finite number, iterable list, or object.`);
            }
            if (toDataIterable) {
              quickToCallbacks[cntr++](...toData);
            } else {
              quickToCallbacks[cntr++](toData);
            }
          }
        } else {
          const isPosition = this.#isPosition(position);
          const actualPosition = isPosition ? position : position.position;
          if (!this.#isPosition(actualPosition)) {
            return;
          }
          callbackOptions.index = 0;
          callbackOptions.position = position;
          callbackOptions.data = isPosition ? void 0 : position;
          const toData = dataCallback(callbackOptions);
          if (toData === null || toData === void 0) {
            return;
          }
          const toDataIterable = isIterable(toData);
          if (!Number.isFinite(toData) && !toDataIterable && typeof toData !== "object") {
            throw new TypeError(`AnimationGroupAPI.quickTo error: toData callback function iteration(${index}) failed to return a finite number, iterable list, or object.`);
          }
          if (toDataIterable) {
            quickToCallbacks[cntr++](...toData);
          } else {
            quickToCallbacks[cntr++](toData);
          }
        }
      } else {
        for (let cntr = quickToCallbacks.length; --cntr >= 0; ) {
          quickToCallbacks[cntr](...args);
        }
      }
    }, "quickToCB");
    quickToCB.keys = keysArray;
    quickToCB.options = (options2) => {
      if (options2 !== void 0 && !isObject(options2) && typeof options2 !== "function") {
        throw new TypeError(`AnimationGroupAPI.quickTo error: 'options' is not an object or function.`);
      }
      if (isObject(options2)) {
        for (let cntr = quickToCallbacks.length; --cntr >= 0; ) {
          quickToCallbacks[cntr].options(options2);
        }
      } else if (typeof options2 === "function") {
        if (isIterable(position)) {
          index = -1;
          let cntr = 0;
          for (const entry of position) {
            index++;
            const isPosition = this.#isPosition(entry);
            const actualPosition = isPosition ? entry : entry.position;
            if (!this.#isPosition(actualPosition)) {
              console.warn(
                `AnimationGroupAPI.quickTo.options warning: No Position instance found at index: ${index}.`
              );
              continue;
            }
            callbackOptions.index = index;
            callbackOptions.position = position;
            callbackOptions.data = isPosition ? void 0 : entry;
            actualOptions = options2(callbackOptions);
            if (actualOptions === null || actualOptions === void 0) {
              continue;
            }
            if (typeof actualOptions !== "object") {
              throw new TypeError(
                `AnimationGroupAPI.quickTo.options error: options callback function iteration(${index}) failed to return an object.`
              );
            }
            quickToCallbacks[cntr++].options(actualOptions);
          }
        } else {
          const isPosition = this.#isPosition(position);
          const actualPosition = isPosition ? position : position.position;
          if (!this.#isPosition(actualPosition)) {
            console.warn(`AnimationGroupAPI.quickTo.options warning: No Position instance found.`);
            return quickToCB;
          }
          callbackOptions.index = 0;
          callbackOptions.position = position;
          callbackOptions.data = isPosition ? void 0 : position;
          actualOptions = options2(callbackOptions);
          if (typeof actualOptions !== "object") {
            throw new TypeError(
              `AnimationGroupAPI.quickTo error: options callback function failed to return an object.`
            );
          }
          quickToCallbacks[0].options(actualOptions);
        }
      }
      return quickToCB;
    };
    return quickToCB;
  }
}
__name(AnimationGroupAPI, "AnimationGroupAPI");
class Centered {
  #element;
  #height;
  #lock;
  #width;
  constructor({ element: element2, lock = false, width, height } = {}) {
    this.element = element2;
    this.width = width;
    this.height = height;
    this.#lock = typeof lock === "boolean" ? lock : false;
  }
  get element() {
    return this.#element;
  }
  get height() {
    return this.#height;
  }
  get width() {
    return this.#width;
  }
  set element(element2) {
    if (this.#lock) {
      return;
    }
    if (element2 === void 0 || element2 === null || element2 instanceof HTMLElement) {
      this.#element = element2;
    } else {
      throw new TypeError(`'element' is not a HTMLElement, undefined, or null.`);
    }
  }
  set height(height) {
    if (this.#lock) {
      return;
    }
    if (height === void 0 || Number.isFinite(height)) {
      this.#height = height;
    } else {
      throw new TypeError(`'height' is not a finite number or undefined.`);
    }
  }
  set width(width) {
    if (this.#lock) {
      return;
    }
    if (width === void 0 || Number.isFinite(width)) {
      this.#width = width;
    } else {
      throw new TypeError(`'width' is not a finite number or undefined.`);
    }
  }
  setDimension(width, height) {
    if (this.#lock) {
      return;
    }
    if (width === void 0 || Number.isFinite(width)) {
      this.#width = width;
    } else {
      throw new TypeError(`'width' is not a finite number or undefined.`);
    }
    if (height === void 0 || Number.isFinite(height)) {
      this.#height = height;
    } else {
      throw new TypeError(`'height' is not a finite number or undefined.`);
    }
  }
  getLeft(width) {
    const boundsWidth = this.#width ?? this.#element?.offsetWidth ?? globalThis.innerWidth;
    return (boundsWidth - width) / 2;
  }
  getTop(height) {
    const boundsHeight = this.#height ?? this.#element?.offsetHeight ?? globalThis.innerHeight;
    return (boundsHeight - height) / 2;
  }
}
__name(Centered, "Centered");
const browserCentered = new Centered();
const positionInitial = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  browserCentered,
  Centered
}, Symbol.toStringTag, { value: "Module" }));
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
__name(PositionChangeSet, "PositionChangeSet");
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
    this.height = height;
    this.left = left;
    this.maxHeight = maxHeight;
    this.maxWidth = maxWidth;
    this.minHeight = minHeight;
    this.minWidth = minWidth;
    this.rotateX = rotateX;
    this.rotateY = rotateY;
    this.rotateZ = rotateZ;
    this.scale = scale;
    this.top = top;
    this.transformOrigin = transformOrigin;
    this.translateX = translateX;
    this.translateY = translateY;
    this.translateZ = translateZ;
    this.width = width;
    this.zIndex = zIndex;
    Object.seal(this);
  }
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
__name(PositionData, "PositionData");
class PositionStateAPI {
  #data;
  #dataSaved = /* @__PURE__ */ new Map();
  #position;
  #transforms;
  constructor(position, data, transforms) {
    this.#position = position;
    this.#data = data;
    this.#transforms = transforms;
  }
  get({ name }) {
    if (typeof name !== "string") {
      throw new TypeError(`Position - getSave error: 'name' is not a string.`);
    }
    return this.#dataSaved.get(name);
  }
  getDefault() {
    return this.#dataSaved.get("#defaultData");
  }
  remove({ name }) {
    if (typeof name !== "string") {
      throw new TypeError(`Position - remove: 'name' is not a string.`);
    }
    const data = this.#dataSaved.get(name);
    this.#dataSaved.delete(name);
    return data;
  }
  reset({ keepZIndex = false, invokeSet = true } = {}) {
    const defaultData = this.#dataSaved.get("#defaultData");
    if (typeof defaultData !== "object") {
      return false;
    }
    if (this.#position.animate.isScheduled) {
      this.#position.animate.cancel();
    }
    const zIndex = this.#position.zIndex;
    const data = Object.assign({}, defaultData);
    if (keepZIndex) {
      data.zIndex = zIndex;
    }
    this.#transforms.reset(data);
    if (this.#position.parent?.reactive?.minimized) {
      this.#position.parent?.maximize?.({ animate: false, duration: 0 });
    }
    if (invokeSet) {
      setTimeout(() => this.#position.set(data), 0);
    }
    return true;
  }
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
    if (typeof name !== "string") {
      throw new TypeError(`Position - restore error: 'name' is not a string.`);
    }
    const dataSaved = this.#dataSaved.get(name);
    if (dataSaved) {
      if (remove) {
        this.#dataSaved.delete(name);
      }
      let data = dataSaved;
      if (isIterable(properties)) {
        data = {};
        for (const property of properties) {
          data[property] = dataSaved[property];
        }
      }
      if (silent) {
        for (const property in data) {
          this.#data[property] = data[property];
        }
        return dataSaved;
      } else if (animateTo) {
        if (data.transformOrigin !== this.#position.transformOrigin) {
          this.#position.transformOrigin = data.transformOrigin;
        }
        if (async) {
          return this.#position.animate.to(data, { duration, ease, interpolate }).finished.then(() => dataSaved);
        } else {
          this.#position.animate.to(data, { duration, ease, interpolate });
        }
      } else {
        this.#position.set(data);
      }
    }
    return dataSaved;
  }
  save({ name, ...extra }) {
    if (typeof name !== "string") {
      throw new TypeError(`Position - save error: 'name' is not a string.`);
    }
    const data = this.#position.get(extra);
    this.#dataSaved.set(name, data);
    return data;
  }
  set({ name, ...data }) {
    if (typeof name !== "string") {
      throw new TypeError(`Position - set error: 'name' is not a string.`);
    }
    this.#dataSaved.set(name, data);
  }
}
__name(PositionStateAPI, "PositionStateAPI");
class StyleCache {
  constructor() {
    this.el = void 0;
    this.computed = void 0;
    this.marginLeft = void 0;
    this.marginTop = void 0;
    this.maxHeight = void 0;
    this.maxWidth = void 0;
    this.minHeight = void 0;
    this.minWidth = void 0;
    this.hasWillChange = false;
    this.resizeObserved = {
      contentHeight: void 0,
      contentWidth: void 0,
      offsetHeight: void 0,
      offsetWidth: void 0
    };
    const storeResizeObserved = writable(this.resizeObserved);
    this.stores = {
      element: writable(this.el),
      resizeContentHeight: propertyStore(storeResizeObserved, "contentHeight"),
      resizeContentWidth: propertyStore(storeResizeObserved, "contentWidth"),
      resizeObserved: storeResizeObserved,
      resizeOffsetHeight: propertyStore(storeResizeObserved, "offsetHeight"),
      resizeOffsetWidth: propertyStore(storeResizeObserved, "offsetWidth")
    };
  }
  get offsetHeight() {
    if (this.el instanceof HTMLElement) {
      return this.resizeObserved.offsetHeight !== void 0 ? this.resizeObserved.offsetHeight : this.el.offsetHeight;
    }
    throw new Error(`StyleCache - get offsetHeight error: no element assigned.`);
  }
  get offsetWidth() {
    if (this.el instanceof HTMLElement) {
      return this.resizeObserved.offsetWidth !== void 0 ? this.resizeObserved.offsetWidth : this.el.offsetWidth;
    }
    throw new Error(`StyleCache - get offsetWidth error: no element assigned.`);
  }
  hasData(el) {
    return this.el === el;
  }
  reset() {
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
    this.hasWillChange = false;
    this.resizeObserved.contentHeight = void 0;
    this.resizeObserved.contentWidth = void 0;
    this.resizeObserved.offsetHeight = void 0;
    this.resizeObserved.offsetWidth = void 0;
    this.stores.element.set(void 0);
  }
  update(el) {
    this.el = el;
    this.computed = globalThis.getComputedStyle(el);
    this.marginLeft = styleParsePixels(el.style.marginLeft) ?? styleParsePixels(this.computed.marginLeft);
    this.marginTop = styleParsePixels(el.style.marginTop) ?? styleParsePixels(this.computed.marginTop);
    this.maxHeight = styleParsePixels(el.style.maxHeight) ?? styleParsePixels(this.computed.maxHeight);
    this.maxWidth = styleParsePixels(el.style.maxWidth) ?? styleParsePixels(this.computed.maxWidth);
    this.minHeight = styleParsePixels(el.style.minHeight) ?? styleParsePixels(this.computed.minHeight);
    this.minWidth = styleParsePixels(el.style.minWidth) ?? styleParsePixels(this.computed.minWidth);
    const willChange = el.style.willChange !== "" ? el.style.willChange : this.computed.willChange;
    this.hasWillChange = willChange !== "" && willChange !== "auto";
    this.stores.element.set(el);
  }
}
__name(StyleCache, "StyleCache");
class TransformData {
  constructor() {
    Object.seal(this);
  }
  #boundingRect = new DOMRect();
  #corners = [vec3.create(), vec3.create(), vec3.create(), vec3.create()];
  #mat4 = mat4.create();
  #originTranslations = [mat4.create(), mat4.create()];
  get boundingRect() {
    return this.#boundingRect;
  }
  get corners() {
    return this.#corners;
  }
  get css() {
    return `matrix3d(${this.mat4.join(",")})`;
  }
  get mat4() {
    return this.#mat4;
  }
  get originTranslations() {
    return this.#originTranslations;
  }
}
__name(TransformData, "TransformData");
class AdapterValidators {
  #validatorData;
  #mapUnsubscribe = /* @__PURE__ */ new Map();
  constructor() {
    this.#validatorData = [];
    Object.seal(this);
    return [this, this.#validatorData];
  }
  get length() {
    return this.#validatorData.length;
  }
  *[Symbol.iterator]() {
    if (this.#validatorData.length === 0) {
      return;
    }
    for (const entry of this.#validatorData) {
      yield { ...entry };
    }
  }
  add(...validators) {
    for (const validator of validators) {
        const validatorType = typeof validator;
        if (validatorType !== "function" && validatorType !== "object" || validator === null) {
            throw new TypeError(`AdapterValidator error: 'validator' is not a function or object.`);
        }
        let data = void 0;
        let subscribeFn = void 0;
        switch (validatorType) {
            case "function":
                data = {
                    id: void 0,
                    validator,
                    weight: 1
                };
                subscribeFn = validator.subscribe;
                break;
            case "object":
                if (typeof validator.validator !== "function") {
                    throw new TypeError(`AdapterValidator error: 'validator' attribute is not a function.`);
                }
                if (validator.weight !== void 0 && typeof validator.weight !== "number" || (validator.weight < 0 || validator.weight > 1)) {
                    throw new TypeError(
                        `AdapterValidator error: 'weight' attribute is not a number between '0 - 1' inclusive.`
                    );
                }
                data = {
                    id: validator.id !== void 0 ? validator.id : void 0,
                    validator: validator.validator.bind(validator),
                    weight: validator.weight || 1,
                    instance: validator
                };
                subscribeFn = validator.validator.subscribe ?? validator.subscribe;
                break;
        }
        const index = this.#validatorData.findIndex((value) => {
            return data.weight < value.weight;
        });
        if (index >= 0) {
            this.#validatorData.splice(index, 0, data);
        }
        else {
            this.#validatorData.push(data);
        }
        if (typeof subscribeFn === "function") {
            const unsubscribe = subscribeFn();
            if (typeof unsubscribe !== "function") {
                throw new TypeError(
                    "AdapterValidator error: Filter has subscribe function, but no unsubscribe function is returned."
                );
            }
            if (this.#mapUnsubscribe.has(data.validator)) {
                throw new Error(
                    "AdapterValidator error: Filter added already has an unsubscribe function registered."
                );
            }
            this.#mapUnsubscribe.set(data.validator, unsubscribe);
        }
    }
  }
  clear() {
    this.#validatorData.length = 0;
    for (const unsubscribe of this.#mapUnsubscribe.values()) {
      unsubscribe();
    }
    this.#mapUnsubscribe.clear();
  }
  remove(...validators) {
    const length = this.#validatorData.length;
    if (length === 0) {
      return;
    }
    for (const data of validators) {
      const actualValidator = typeof data === "function" ? data : data !== null && typeof data === "object" ? data.validator : void 0;
      if (!actualValidator) {
        continue;
      }
      for (let cntr = this.#validatorData.length; --cntr >= 0; ) {
        if (this.#validatorData[cntr].validator === actualValidator) {
          this.#validatorData.splice(cntr, 1);
          let unsubscribe = void 0;
          if (typeof (unsubscribe = this.#mapUnsubscribe.get(actualValidator)) === "function") {
            unsubscribe();
            this.#mapUnsubscribe.delete(actualValidator);
          }
        }
      }
    }
  }
  removeBy(callback) {
    const length = this.#validatorData.length;
    if (length === 0) {
      return;
    }
    if (typeof callback !== "function") {
      throw new TypeError(`AdapterValidator error: 'callback' is not a function.`);
    }
    this.#validatorData = this.#validatorData.filter((data) => {
      const remove = callback.call(callback, { ...data });
      if (remove) {
        let unsubscribe;
        if (typeof (unsubscribe = this.#mapUnsubscribe.get(data.validator)) === "function") {
          unsubscribe();
          this.#mapUnsubscribe.delete(data.validator);
        }
      }
      return !remove;
    });
  }
  removeById(...ids) {
    const length = this.#validatorData.length;
    if (length === 0) {
      return;
    }
    this.#validatorData = this.#validatorData.filter((data) => {
      let remove = false;
      for (const id of ids) {
        remove |= data.id === id;
      }
      if (remove) {
        let unsubscribe;
        if (typeof (unsubscribe = this.#mapUnsubscribe.get(data.validator)) === "function") {
          unsubscribe();
          this.#mapUnsubscribe.delete(data.validator);
        }
      }
      return !remove;
    });
  }
}
__name(AdapterValidators, "AdapterValidators");
class BasicBounds {
  #constrain;
  #element;
  #enabled;
  #height;
  #lock;
  #width;
  constructor({ constrain = true, element: element2, enabled = true, lock = false, width, height } = {}) {
    this.element = element2;
    this.constrain = constrain;
    this.enabled = enabled;
    this.width = width;
    this.height = height;
    this.#lock = typeof lock === "boolean" ? lock : false;
  }
  get constrain() {
    return this.#constrain;
  }
  get element() {
    return this.#element;
  }
  get enabled() {
    return this.#enabled;
  }
  get height() {
    return this.#height;
  }
  get width() {
    return this.#width;
  }
  set constrain(constrain) {
    if (this.#lock) {
      return;
    }
    if (typeof constrain !== "boolean") {
      throw new TypeError(`'constrain' is not a boolean.`);
    }
    this.#constrain = constrain;
  }
  set element(element2) {
    if (this.#lock) {
      return;
    }
    if (element2 === void 0 || element2 === null || element2 instanceof HTMLElement) {
      this.#element = element2;
    } else {
      throw new TypeError(`'element' is not a HTMLElement, undefined, or null.`);
    }
  }
  set enabled(enabled) {
    if (this.#lock) {
      return;
    }
    if (typeof enabled !== "boolean") {
      throw new TypeError(`'enabled' is not a boolean.`);
    }
    this.#enabled = enabled;
  }
  set height(height) {
    if (this.#lock) {
      return;
    }
    if (height === void 0 || Number.isFinite(height)) {
      this.#height = height;
    } else {
      throw new TypeError(`'height' is not a finite number or undefined.`);
    }
  }
  set width(width) {
    if (this.#lock) {
      return;
    }
    if (width === void 0 || Number.isFinite(width)) {
      this.#width = width;
    } else {
      throw new TypeError(`'width' is not a finite number or undefined.`);
    }
  }
  setDimension(width, height) {
    if (this.#lock) {
      return;
    }
    if (width === void 0 || Number.isFinite(width)) {
      this.#width = width;
    } else {
      throw new TypeError(`'width' is not a finite number or undefined.`);
    }
    if (height === void 0 || Number.isFinite(height)) {
      this.#height = height;
    } else {
      throw new TypeError(`'height' is not a finite number or undefined.`);
    }
  }
  validator(valData) {
    if (!this.#enabled) {
      return valData.position;
    }
    const boundsWidth = this.#width ?? this.#element?.offsetWidth ?? globalThis.innerWidth;
    const boundsHeight = this.#height ?? this.#element?.offsetHeight ?? globalThis.innerHeight;
    if (typeof valData.position.width === "number") {
      const maxW = valData.maxWidth ?? (this.#constrain ? boundsWidth : Number.MAX_SAFE_INTEGER);
      valData.position.width = valData.width = Math.clamped(valData.position.width, valData.minWidth, maxW);
      if (valData.width + valData.position.left + valData.marginLeft > boundsWidth) {
        valData.position.left = boundsWidth - valData.width - valData.marginLeft;
      }
    }
    if (typeof valData.position.height === "number") {
      const maxH = valData.maxHeight ?? (this.#constrain ? boundsHeight : Number.MAX_SAFE_INTEGER);
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
__name(BasicBounds, "BasicBounds");
const s_TRANSFORM_DATA = new TransformData();
class TransformBounds {
  #constrain;
  #element;
  #enabled;
  #height;
  #lock;
  #width;
  constructor({ constrain = true, element: element2, enabled = true, lock = false, width, height } = {}) {
    this.element = element2;
    this.constrain = constrain;
    this.enabled = enabled;
    this.width = width;
    this.height = height;
    this.#lock = typeof lock === "boolean" ? lock : false;
  }
  get constrain() {
    return this.#constrain;
  }
  get element() {
    return this.#element;
  }
  get enabled() {
    return this.#enabled;
  }
  get height() {
    return this.#height;
  }
  get width() {
    return this.#width;
  }
  set constrain(constrain) {
    if (this.#lock) {
      return;
    }
    if (typeof constrain !== "boolean") {
      throw new TypeError(`'constrain' is not a boolean.`);
    }
    this.#constrain = constrain;
  }
  set element(element2) {
    if (this.#lock) {
      return;
    }
    if (element2 === void 0 || element2 === null || element2 instanceof HTMLElement) {
      this.#element = element2;
    } else {
      throw new TypeError(`'element' is not a HTMLElement, undefined, or null.`);
    }
  }
  set enabled(enabled) {
    if (this.#lock) {
      return;
    }
    if (typeof enabled !== "boolean") {
      throw new TypeError(`'enabled' is not a boolean.`);
    }
    this.#enabled = enabled;
  }
  set height(height) {
    if (this.#lock) {
      return;
    }
    if (height === void 0 || Number.isFinite(height)) {
      this.#height = height;
    } else {
      throw new TypeError(`'height' is not a finite number or undefined.`);
    }
  }
  set width(width) {
    if (this.#lock) {
      return;
    }
    if (width === void 0 || Number.isFinite(width)) {
      this.#width = width;
    } else {
      throw new TypeError(`'width' is not a finite number or undefined.`);
    }
  }
  setDimension(width, height) {
    if (this.#lock) {
      return;
    }
    if (width === void 0 || Number.isFinite(width)) {
      this.#width = width;
    } else {
      throw new TypeError(`'width' is not a finite number or undefined.`);
    }
    if (height === void 0 || Number.isFinite(height)) {
      this.#height = height;
    } else {
      throw new TypeError(`'height' is not a finite number or undefined.`);
    }
  }
  validator(valData) {
    if (!this.#enabled) {
      return valData.position;
    }
    const boundsWidth = this.#width ?? this.#element?.offsetWidth ?? globalThis.innerWidth;
    const boundsHeight = this.#height ?? this.#element?.offsetHeight ?? globalThis.innerHeight;
    if (typeof valData.position.width === "number") {
      const maxW = valData.maxWidth ?? (this.#constrain ? boundsWidth : Number.MAX_SAFE_INTEGER);
      valData.position.width = Math.clamped(valData.width, valData.minWidth, maxW);
    }
    if (typeof valData.position.height === "number") {
      const maxH = valData.maxHeight ?? (this.#constrain ? boundsHeight : Number.MAX_SAFE_INTEGER);
      valData.position.height = Math.clamped(valData.height, valData.minHeight, maxH);
    }
    const data = valData.transforms.getData(valData.position, s_TRANSFORM_DATA, valData);
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
__name(TransformBounds, "TransformBounds");
const basicWindow = new BasicBounds({ lock: true });
const transformWindow = new TransformBounds({ lock: true });
const positionValidators = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  basicWindow,
  BasicBounds,
  transformWindow,
  TransformBounds
}, Symbol.toStringTag, { value: "Module" }));
const s_SCALE_VECTOR = [1, 1, 1];
const s_TRANSLATE_VECTOR = [0, 0, 0];
const s_MAT4_RESULT = mat4.create();
const s_MAT4_TEMP = mat4.create();
const s_VEC3_TEMP = vec3.create();

class Transforms {
    #orderList = [];

    constructor() {
        this._data = {};
    }

    get isActive() {
        return this.#orderList.length > 0;
    }

    get rotateX() {
        return this._data.rotateX;
    }

    get rotateY() {
        return this._data.rotateY;
    }

    get rotateZ() {
        return this._data.rotateZ;
    }

    get scale() {
        return this._data.scale;
    }

    get translateX() {
        return this._data.translateX;
    }

    get translateY() {
        return this._data.translateY;
    }

    get translateZ() {
        return this._data.translateZ;
    }

    set rotateX(value) {
        if (Number.isFinite(value)) {
            if (this._data.rotateX === void 0) {
                this.#orderList.push("rotateX");
            }
            this._data.rotateX = value;
        }
        else {
            if (this._data.rotateX !== void 0) {
                const index = this.#orderList.findIndex((entry) => entry === "rotateX");
                if (index >= 0) {
                    this.#orderList.splice(index, 1);
                }
            }
            delete this._data.rotateX;
        }
    }

    set rotateY(value) {
        if (Number.isFinite(value)) {
            if (this._data.rotateY === void 0) {
                this.#orderList.push("rotateY");
            }
            this._data.rotateY = value;
        }
        else {
            if (this._data.rotateY !== void 0) {
                const index = this.#orderList.findIndex((entry) => entry === "rotateY");
                if (index >= 0) {
                    this.#orderList.splice(index, 1);
                }
            }
            delete this._data.rotateY;
        }
    }

    set rotateZ(value) {
        if (Number.isFinite(value)) {
            if (this._data.rotateZ === void 0) {
                this.#orderList.push("rotateZ");
            }
            this._data.rotateZ = value;
        }
        else {
            if (this._data.rotateZ !== void 0) {
                const index = this.#orderList.findIndex((entry) => entry === "rotateZ");
                if (index >= 0) {
                    this.#orderList.splice(index, 1);
                }
            }
            delete this._data.rotateZ;
        }
    }

    set scale(value) {
        if (Number.isFinite(value)) {
            if (this._data.scale === void 0) {
                this.#orderList.push("scale");
            }
            this._data.scale = value;
        }
        else {
            if (this._data.scale !== void 0) {
                const index = this.#orderList.findIndex((entry) => entry === "scale");
                if (index >= 0) {
                    this.#orderList.splice(index, 1);
                }
            }
            delete this._data.scale;
        }
    }

    set translateX(value) {
        if (Number.isFinite(value)) {
            if (this._data.translateX === void 0) {
                this.#orderList.push("translateX");
            }
            this._data.translateX = value;
        }
        else {
            if (this._data.translateX !== void 0) {
                const index = this.#orderList.findIndex((entry) => entry === "translateX");
                if (index >= 0) {
                    this.#orderList.splice(index, 1);
                }
            }
            delete this._data.translateX;
        }
    }

    set translateY(value) {
        if (Number.isFinite(value)) {
            if (this._data.translateY === void 0) {
                this.#orderList.push("translateY");
            }
            this._data.translateY = value;
        }
        else {
            if (this._data.translateY !== void 0) {
                const index = this.#orderList.findIndex((entry) => entry === "translateY");
                if (index >= 0) {
                    this.#orderList.splice(index, 1);
                }
            }
            delete this._data.translateY;
        }
    }

    set translateZ(value) {
        if (Number.isFinite(value)) {
            if (this._data.translateZ === void 0) {
                this.#orderList.push("translateZ");
            }
            this._data.translateZ = value;
        }
        else {
            if (this._data.translateZ !== void 0) {
                const index = this.#orderList.findIndex((entry) => entry === "translateZ");
                if (index >= 0) {
                    this.#orderList.splice(index, 1);
                }
            }
            delete this._data.translateZ;
        }
    }

    getCSS(data = this._data) {
        return `matrix3d(${this.getMat4(data, s_MAT4_RESULT).join(",")})`;
    }

    getCSSOrtho(data = this._data) {
        return `matrix3d(${this.getMat4Ortho(data, s_MAT4_RESULT).join(",")})`;
    }

    getData(position, output = new TransformData(), validationData = {}) {
        const valWidth = validationData.width ?? 0;
        const valHeight = validationData.height ?? 0;
        const valOffsetTop = validationData.offsetTop ?? validationData.marginTop ?? 0;
        const valOffsetLeft = validationData.offsetLeft ?? validationData.offsetLeft ?? 0;
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
            }
            else {
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
    for (let cntr = 4; --cntr >= 0; ) {
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
  getMat4(data = this._data, output = mat4.create()) {
    const matrix = mat4.identity(output);
    let seenKeys = 0;
    const orderList = this.#orderList;
    for (let cntr = 0; cntr < orderList.length; cntr++) {
      const key = orderList[cntr];
      switch (key) {
        case "rotateX":
          seenKeys |= transformKeysBitwise.rotateX;
          mat4.multiply(matrix, matrix, mat4.fromXRotation(s_MAT4_TEMP, degToRad(data[key])));
          break;
        case "rotateY":
          seenKeys |= transformKeysBitwise.rotateY;
          mat4.multiply(matrix, matrix, mat4.fromYRotation(s_MAT4_TEMP, degToRad(data[key])));
          break;
        case "rotateZ":
          seenKeys |= transformKeysBitwise.rotateZ;
          mat4.multiply(matrix, matrix, mat4.fromZRotation(s_MAT4_TEMP, degToRad(data[key])));
          break;
        case "scale":
          seenKeys |= transformKeysBitwise.scale;
          s_SCALE_VECTOR[0] = s_SCALE_VECTOR[1] = data[key];
          mat4.multiply(matrix, matrix, mat4.fromScaling(s_MAT4_TEMP, s_SCALE_VECTOR));
          break;
        case "translateX":
          seenKeys |= transformKeysBitwise.translateX;
          s_TRANSLATE_VECTOR[0] = data.translateX;
          s_TRANSLATE_VECTOR[1] = 0;
          s_TRANSLATE_VECTOR[2] = 0;
          mat4.multiply(matrix, matrix, mat4.fromTranslation(s_MAT4_TEMP, s_TRANSLATE_VECTOR));
          break;
        case "translateY":
          seenKeys |= transformKeysBitwise.translateY;
          s_TRANSLATE_VECTOR[0] = 0;
          s_TRANSLATE_VECTOR[1] = data.translateY;
          s_TRANSLATE_VECTOR[2] = 0;
          mat4.multiply(matrix, matrix, mat4.fromTranslation(s_MAT4_TEMP, s_TRANSLATE_VECTOR));
          break;
        case "translateZ":
          seenKeys |= transformKeysBitwise.translateZ;
          s_TRANSLATE_VECTOR[0] = 0;
          s_TRANSLATE_VECTOR[1] = 0;
          s_TRANSLATE_VECTOR[2] = data.translateZ;
          mat4.multiply(matrix, matrix, mat4.fromTranslation(s_MAT4_TEMP, s_TRANSLATE_VECTOR));
          break;
      }
    }
    if (data !== this._data) {
      for (let cntr = 0; cntr < transformKeys.length; cntr++) {
        const key = transformKeys[cntr];
        if (data[key] === null || (seenKeys & transformKeysBitwise[key]) > 0) {
          continue;
        }
        switch (key) {
          case "rotateX":
            mat4.multiply(matrix, matrix, mat4.fromXRotation(s_MAT4_TEMP, degToRad(data[key])));
            break;
          case "rotateY":
            mat4.multiply(matrix, matrix, mat4.fromYRotation(s_MAT4_TEMP, degToRad(data[key])));
            break;
          case "rotateZ":
            mat4.multiply(matrix, matrix, mat4.fromZRotation(s_MAT4_TEMP, degToRad(data[key])));
            break;
          case "scale":
            s_SCALE_VECTOR[0] = s_SCALE_VECTOR[1] = data[key];
            mat4.multiply(matrix, matrix, mat4.fromScaling(s_MAT4_TEMP, s_SCALE_VECTOR));
            break;
          case "translateX":
            s_TRANSLATE_VECTOR[0] = data[key];
            s_TRANSLATE_VECTOR[1] = 0;
            s_TRANSLATE_VECTOR[2] = 0;
            mat4.multiply(matrix, matrix, mat4.fromTranslation(s_MAT4_TEMP, s_TRANSLATE_VECTOR));
            break;
          case "translateY":
            s_TRANSLATE_VECTOR[0] = 0;
            s_TRANSLATE_VECTOR[1] = data[key];
            s_TRANSLATE_VECTOR[2] = 0;
            mat4.multiply(matrix, matrix, mat4.fromTranslation(s_MAT4_TEMP, s_TRANSLATE_VECTOR));
            break;
          case "translateZ":
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
  getMat4Ortho(data = this._data, output = mat4.create()) {
    const matrix = mat4.identity(output);
    s_TRANSLATE_VECTOR[0] = (data.left ?? 0) + (data.translateX ?? 0);
    s_TRANSLATE_VECTOR[1] = (data.top ?? 0) + (data.translateY ?? 0);
    s_TRANSLATE_VECTOR[2] = data.translateZ ?? 0;
    mat4.multiply(matrix, matrix, mat4.fromTranslation(s_MAT4_TEMP, s_TRANSLATE_VECTOR));
    if (data.scale !== null) {
      s_SCALE_VECTOR[0] = s_SCALE_VECTOR[1] = data.scale;
      mat4.multiply(matrix, matrix, mat4.fromScaling(s_MAT4_TEMP, s_SCALE_VECTOR));
    }
    if (data.rotateX === null && data.rotateY === null && data.rotateZ === null) {
      return matrix;
    }
    let seenKeys = 0;
    const orderList = this.#orderList;
    for (let cntr = 0; cntr < orderList.length; cntr++) {
      const key = orderList[cntr];
      switch (key) {
        case "rotateX":
          seenKeys |= transformKeysBitwise.rotateX;
          mat4.multiply(matrix, matrix, mat4.fromXRotation(s_MAT4_TEMP, degToRad(data[key])));
          break;
        case "rotateY":
          seenKeys |= transformKeysBitwise.rotateY;
          mat4.multiply(matrix, matrix, mat4.fromYRotation(s_MAT4_TEMP, degToRad(data[key])));
          break;
        case "rotateZ":
          seenKeys |= transformKeysBitwise.rotateZ;
          mat4.multiply(matrix, matrix, mat4.fromZRotation(s_MAT4_TEMP, degToRad(data[key])));
          break;
      }
    }
    if (data !== this._data) {
      for (let cntr = 0; cntr < transformKeys.length; cntr++) {
        const key = transformKeys[cntr];
        if (data[key] === null || (seenKeys & transformKeysBitwise[key]) > 0) {
          continue;
        }
        switch (key) {
          case "rotateX":
            mat4.multiply(matrix, matrix, mat4.fromXRotation(s_MAT4_TEMP, degToRad(data[key])));
            break;
          case "rotateY":
            mat4.multiply(matrix, matrix, mat4.fromYRotation(s_MAT4_TEMP, degToRad(data[key])));
            break;
          case "rotateZ":
            mat4.multiply(matrix, matrix, mat4.fromZRotation(s_MAT4_TEMP, degToRad(data[key])));
            break;
        }
      }
    }
    return matrix;
  }
  hasTransform(data) {
    for (const key of transformKeys) {
      if (Number.isFinite(data[key])) {
        return true;
      }
    }
    return false;
  }
  reset(data) {
    for (const key in data) {
      if (transformKeys.includes(key)) {
        if (Number.isFinite(data[key])) {
          this._data[key] = data[key];
        } else {
          const index = this.#orderList.findIndex((entry) => entry === key);
          if (index >= 0) {
            this.#orderList.splice(index, 1);
          }
          delete this._data[key];
        }
      }
    }
  }
}
__name(Transforms, "Transforms");
function s_GET_ORIGIN_TRANSLATION(transformOrigin, width, height, output) {
  const vector = s_VEC3_TEMP;
  switch (transformOrigin) {
    case "top left":
      vector[0] = vector[1] = 0;
      mat4.fromTranslation(output[0], vector);
      mat4.fromTranslation(output[1], vector);
      break;
    case "top center":
      vector[0] = -width * 0.5;
      vector[1] = 0;
      mat4.fromTranslation(output[0], vector);
      vector[0] = width * 0.5;
      mat4.fromTranslation(output[1], vector);
      break;
    case "top right":
      vector[0] = -width;
      vector[1] = 0;
      mat4.fromTranslation(output[0], vector);
      vector[0] = width;
      mat4.fromTranslation(output[1], vector);
      break;
    case "center left":
      vector[0] = 0;
      vector[1] = -height * 0.5;
      mat4.fromTranslation(output[0], vector);
      vector[1] = height * 0.5;
      mat4.fromTranslation(output[1], vector);
      break;
    case null:
    case "center":
      vector[0] = -width * 0.5;
      vector[1] = -height * 0.5;
      mat4.fromTranslation(output[0], vector);
      vector[0] = width * 0.5;
      vector[1] = height * 0.5;
      mat4.fromTranslation(output[1], vector);
      break;
    case "center right":
      vector[0] = -width;
      vector[1] = -height * 0.5;
      mat4.fromTranslation(output[0], vector);
      vector[0] = width;
      vector[1] = height * 0.5;
      mat4.fromTranslation(output[1], vector);
      break;
    case "bottom left":
      vector[0] = 0;
      vector[1] = -height;
      mat4.fromTranslation(output[0], vector);
      vector[1] = height;
      mat4.fromTranslation(output[1], vector);
      break;
    case "bottom center":
      vector[0] = -width * 0.5;
      vector[1] = -height;
      mat4.fromTranslation(output[0], vector);
      vector[0] = width * 0.5;
      vector[1] = height;
      mat4.fromTranslation(output[1], vector);
      break;
    case "bottom right":
      vector[0] = -width;
      vector[1] = -height;
      mat4.fromTranslation(output[0], vector);
      vector[0] = width;
      vector[1] = height;
      mat4.fromTranslation(output[1], vector);
      break;
    default:
      mat4.identity(output[0]);
      mat4.identity(output[1]);
      break;
  }
  return output;
}
__name(s_GET_ORIGIN_TRANSLATION, "s_GET_ORIGIN_TRANSLATION");
class UpdateElementData {
  constructor() {
    this.data = void 0;
    this.dataSubscribers = new PositionData();
    this.dimensionData = { width: 0, height: 0 };
    this.changeSet = void 0;
    this.options = void 0;
    this.queued = false;
    this.styleCache = void 0;
    this.transforms = void 0;
    this.transformData = new TransformData();
    this.subscriptions = void 0;
    this.storeDimension = writable(this.dimensionData);
    this.storeTransform = writable(this.transformData, () => {
      this.options.transformSubscribed = true;
      return () => this.options.transformSubscribed = false;
    });
    this.queued = false;
    Object.seal(this.dimensionData);
  }
}
__name(UpdateElementData, "UpdateElementData");
async function nextAnimationFrame(cntr = 1) {
  if (!Number.isInteger(cntr) || cntr < 1) {
    throw new TypeError(`nextAnimationFrame error: 'cntr' must be a positive integer greater than 0.`);
  }
  let currentTime = performance.now();
  for (; --cntr >= 0; ) {
    currentTime = await new Promise((resolve) => requestAnimationFrame(resolve));
  }
  return currentTime;
}
__name(nextAnimationFrame, "nextAnimationFrame");
class UpdateElementManager {
  static list = [];
  static listCntr = 0;
  static updatePromise;
  static get promise() {
    return this.updatePromise;
  }
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
  static async wait() {
    const currentTime = await nextAnimationFrame();
    this.updatePromise = void 0;
    for (let cntr = this.listCntr; --cntr >= 0; ) {
      const entry = this.list[cntr];
      const el = entry[0];
      const updateData = entry[1];
      entry[0] = void 0;
      entry[1] = void 0;
      updateData.queued = false;
      if (!el.isConnected) {
        continue;
      }
      if (updateData.options.ortho) {
        s_UPDATE_ELEMENT_ORTHO(el, updateData);
      } else {
        s_UPDATE_ELEMENT(el, updateData);
      }
      if (updateData.options.calculateTransform || updateData.options.transformSubscribed) {
        s_UPDATE_TRANSFORM(el, updateData);
      }
      this.updateSubscribers(updateData);
    }
    this.listCntr = 0;
    return currentTime;
  }
  static immediate(el, updateData) {
    if (!el.isConnected) {
      return;
    }
    if (updateData.options.ortho) {
      s_UPDATE_ELEMENT_ORTHO(el, updateData);
    } else {
      s_UPDATE_ELEMENT(el, updateData);
    }
    if (updateData.options.calculateTransform || updateData.options.transformSubscribed) {
      s_UPDATE_TRANSFORM(el, updateData);
    }
    this.updateSubscribers(updateData);
  }
  static updateSubscribers(updateData) {
    const data = updateData.data;
    const changeSet = updateData.changeSet;
    if (!changeSet.hasChange()) {
      return;
    }
    const output = updateData.dataSubscribers.copy(data);
    const subscriptions = updateData.subscriptions;
    if (subscriptions.length > 0) {
      for (let cntr = 0; cntr < subscriptions.length; cntr++) {
        subscriptions[cntr](output);
      }
    }
    if (changeSet.width || changeSet.height) {
      updateData.dimensionData.width = data.width;
      updateData.dimensionData.height = data.height;
      updateData.storeDimension.set(updateData.dimensionData);
    }
    changeSet.set(false);
  }
}
__name(UpdateElementManager, "UpdateElementManager");
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
    el.style.zIndex = typeof data.zIndex === "number" ? `${data.zIndex}` : null;
  }
  if (changeSet.width) {
    el.style.width = typeof data.width === "number" ? `${data.width}px` : data.width;
  }
  if (changeSet.height) {
    el.style.height = typeof data.height === "number" ? `${data.height}px` : data.height;
  }
  if (changeSet.transformOrigin) {
    el.style.transformOrigin = data.transformOrigin === "center" ? null : data.transformOrigin;
  }
  if (changeSet.transform) {
    el.style.transform = updateData.transforms.isActive ? updateData.transforms.getCSS() : null;
  }
}
__name(s_UPDATE_ELEMENT, "s_UPDATE_ELEMENT");
function s_UPDATE_ELEMENT_ORTHO(el, updateData) {
  const changeSet = updateData.changeSet;
  const data = updateData.data;
  if (changeSet.zIndex) {
    el.style.zIndex = typeof data.zIndex === "number" ? `${data.zIndex}` : null;
  }
  if (changeSet.width) {
    el.style.width = typeof data.width === "number" ? `${data.width}px` : data.width;
  }
  if (changeSet.height) {
    el.style.height = typeof data.height === "number" ? `${data.height}px` : data.height;
  }
  if (changeSet.transformOrigin) {
    el.style.transformOrigin = data.transformOrigin === "center" ? null : data.transformOrigin;
  }
  if (changeSet.left || changeSet.top || changeSet.transform) {
    el.style.transform = updateData.transforms.getCSSOrtho(data);
  }
}
__name(s_UPDATE_ELEMENT_ORTHO, "s_UPDATE_ELEMENT_ORTHO");
function s_UPDATE_TRANSFORM(el, updateData) {
  s_VALIDATION_DATA$1.height = updateData.data.height !== "auto" ? updateData.data.height : updateData.styleCache.offsetHeight;
  s_VALIDATION_DATA$1.width = updateData.data.width !== "auto" ? updateData.data.width : updateData.styleCache.offsetWidth;
  s_VALIDATION_DATA$1.marginLeft = updateData.styleCache.marginLeft;
  s_VALIDATION_DATA$1.marginTop = updateData.styleCache.marginTop;
  updateData.transforms.getData(updateData.data, updateData.transformData, s_VALIDATION_DATA$1);
  updateData.storeTransform.set(updateData.transformData);
}
__name(s_UPDATE_TRANSFORM, "s_UPDATE_TRANSFORM");
const s_VALIDATION_DATA$1 = {
  height: void 0,
  width: void 0,
  marginLeft: void 0,
  marginTop: void 0
};
class Position {
  #data = new PositionData();
  #animate = new AnimationAPI(this, this.#data);
  #positionChangeSet = new PositionChangeSet();
  #options = {
    calculateTransform: false,
    initialHelper: void 0,
    ortho: true,
    transformSubscribed: false
  };
  #parent;
  #stores;
  #styleCache;
  #subscriptions = [];
  #transforms = new Transforms();
  #updateElementData;
  #updateElementPromise;
  #validators;
  #validatorData;
  #state = new PositionStateAPI(this, this.#data, this.#transforms);
  static get Animate() {
    return AnimationGroupAPI;
  }
  static get Initial() {
    return positionInitial;
  }
  static get TransformData() {
    return TransformData;
  }
  static get Validators() {
    return positionValidators;
  }
  static duplicate(position, options) {
    if (!(position instanceof Position)) {
      throw new TypeError(`'position' is not an instance of Position.`);
    }
    const newPosition = new Position(options);
    newPosition.#options = Object.assign({}, position.#options, options);
    newPosition.#validators.add(...position.#validators);
    newPosition.set(position.#data);
    return newPosition;
  }
  constructor(parent, options) {
    if (isPlainObject(parent)) {
      options = parent;
    } else {
      this.#parent = parent;
    }
    const data = this.#data;
    const transforms = this.#transforms;
    this.#styleCache = new StyleCache();
    const updateData = new UpdateElementData();
    updateData.changeSet = this.#positionChangeSet;
    updateData.data = this.#data;
    updateData.options = this.#options;
    updateData.styleCache = this.#styleCache;
    updateData.subscriptions = this.#subscriptions;
    updateData.transforms = this.#transforms;
    this.#updateElementData = updateData;
    if (typeof options === "object") {
      if (typeof options.calculateTransform === "boolean") {
        this.#options.calculateTransform = options.calculateTransform;
      }
      if (typeof options.ortho === "boolean") {
        this.#options.ortho = options.ortho;
      }
      if (Number.isFinite(options.height) || options.height === "auto" || options.height === "inherit" || options.height === null) {
        data.height = updateData.dimensionData.height = typeof options.height === "number" ? Math.round(options.height) : options.height;
      }
      if (Number.isFinite(options.left) || options.left === null) {
        data.left = typeof options.left === "number" ? Math.round(options.left) : options.left;
      }
      if (Number.isFinite(options.maxHeight) || options.maxHeight === null) {
        data.maxHeight = typeof options.maxHeight === "number" ? Math.round(options.maxHeight) : options.maxHeight;
      }
      if (Number.isFinite(options.maxWidth) || options.maxWidth === null) {
        data.maxWidth = typeof options.maxWidth === "number" ? Math.round(options.maxWidth) : options.maxWidth;
      }
      if (Number.isFinite(options.minHeight) || options.minHeight === null) {
        data.minHeight = typeof options.minHeight === "number" ? Math.round(options.minHeight) : options.minHeight;
      }
      if (Number.isFinite(options.minWidth) || options.minWidth === null) {
        data.minWidth = typeof options.minWidth === "number" ? Math.round(options.minWidth) : options.minWidth;
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
        data.top = typeof options.top === "number" ? Math.round(options.top) : options.top;
      }
      if (typeof options.transformOrigin === "string" || options.transformOrigin === null) {
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
      if (Number.isFinite(options.width) || options.width === "auto" || options.width === "inherit" || options.width === null) {
        data.width = updateData.dimensionData.width = typeof options.width === "number" ? Math.round(options.width) : options.width;
      }
      if (Number.isFinite(options.zIndex) || options.zIndex === null) {
        data.zIndex = typeof options.zIndex === "number" ? Math.round(options.zIndex) : options.zIndex;
      }
    }
    this.#stores = {
      height: propertyStore(this, "height"),
      left: propertyStore(this, "left"),
      rotateX: propertyStore(this, "rotateX"),
      rotateY: propertyStore(this, "rotateY"),
      rotateZ: propertyStore(this, "rotateZ"),
      scale: propertyStore(this, "scale"),
      top: propertyStore(this, "top"),
      transformOrigin: propertyStore(this, "transformOrigin"),
      translateX: propertyStore(this, "translateX"),
      translateY: propertyStore(this, "translateY"),
      translateZ: propertyStore(this, "translateZ"),
      width: propertyStore(this, "width"),
      zIndex: propertyStore(this, "zIndex"),
      maxHeight: propertyStore(this, "maxHeight"),
      maxWidth: propertyStore(this, "maxWidth"),
      minHeight: propertyStore(this, "minHeight"),
      minWidth: propertyStore(this, "minWidth"),
      dimension: { subscribe: updateData.storeDimension.subscribe },
      element: { subscribe: this.#styleCache.stores.element.subscribe },
      resizeContentHeight: { subscribe: this.#styleCache.stores.resizeContentHeight.subscribe },
      resizeContentWidth: { subscribe: this.#styleCache.stores.resizeContentWidth.subscribe },
      resizeOffsetHeight: { subscribe: this.#styleCache.stores.resizeOffsetHeight.subscribe },
      resizeOffsetWidth: { subscribe: this.#styleCache.stores.resizeOffsetWidth.subscribe },
      transform: { subscribe: updateData.storeTransform.subscribe },
      resizeObserved: this.#styleCache.stores.resizeObserved
    };
    subscribeIgnoreFirst(this.#stores.resizeObserved, (resizeData) => {
      const parent2 = this.#parent;
      const el = parent2 instanceof HTMLElement ? parent2 : parent2?.elementTarget;
      if (el instanceof HTMLElement && Number.isFinite(resizeData?.offsetWidth) && Number.isFinite(resizeData?.offsetHeight)) {
        this.set(data);
      }
    });
    this.#stores.transformOrigin.values = transformOrigins;
    [this.#validators, this.#validatorData] = new AdapterValidators();
    if (options?.initial || options?.positionInitial) {
      const initialHelper = options.initial ?? options.positionInitial;
      if (typeof initialHelper?.getLeft !== "function" || typeof initialHelper?.getTop !== "function") {
        throw new Error(
          `'options.initial' position helper does not contain 'getLeft' and / or 'getTop' functions.`
        );
      }
      this.#options.initialHelper = options.initial;
    }
    if (options?.validator) {
      if (isIterable(options?.validator)) {
        this.validators.add(...options.validator);
      } else {
        this.validators.add(options.validator);
      }
    }
  }
  get animate() {
    return this.#animate;
  }
  get dimension() {
    return this.#updateElementData.dimensionData;
  }
  get element() {
    return this.#styleCache.el;
  }
  get elementUpdated() {
    return this.#updateElementPromise;
  }
  get parent() {
    return this.#parent;
  }
  get state() {
    return this.#state;
  }
  get stores() {
    return this.#stores;
  }
  get transform() {
    return this.#updateElementData.transformData;
  }
  get validators() {
    return this.#validators;
  }
  set parent(parent) {
    if (parent !== void 0 && !(parent instanceof HTMLElement) && !isObject(parent)) {
      throw new TypeError(`'parent' is not an HTMLElement, object, or undefined.`);
    }
    this.#parent = parent;
    this.#state.remove({ name: "#defaultData" });
    this.#styleCache.reset();
    if (parent) {
      this.set(this.#data);
    }
  }
  get height() {
    return this.#data.height;
  }
  get left() {
    return this.#data.left;
  }
  get maxHeight() {
    return this.#data.maxHeight;
  }
  get maxWidth() {
    return this.#data.maxWidth;
  }
  get minHeight() {
    return this.#data.minHeight;
  }
  get minWidth() {
    return this.#data.minWidth;
  }
  get rotateX() {
    return this.#data.rotateX;
  }
  get rotateY() {
    return this.#data.rotateY;
  }
  get rotateZ() {
    return this.#data.rotateZ;
  }
  get rotation() {
    return this.#data.rotateZ;
  }
  get scale() {
    return this.#data.scale;
  }
  get top() {
    return this.#data.top;
  }
  get transformOrigin() {
    return this.#data.transformOrigin;
  }
  get translateX() {
    return this.#data.translateX;
  }
  get translateY() {
    return this.#data.translateY;
  }
  get translateZ() {
    return this.#data.translateZ;
  }
  get width() {
    return this.#data.width;
  }
  get zIndex() {
    return this.#data.zIndex;
  }
  set height(height) {
    this.#stores.height.set(height);
  }
  set left(left) {
    this.#stores.left.set(left);
  }
  set maxHeight(maxHeight) {
    this.#stores.maxHeight.set(maxHeight);
  }
  set maxWidth(maxWidth) {
    this.#stores.maxWidth.set(maxWidth);
  }
  set minHeight(minHeight) {
    this.#stores.minHeight.set(minHeight);
  }
  set minWidth(minWidth) {
    this.#stores.minWidth.set(minWidth);
  }
  set rotateX(rotateX) {
    this.#stores.rotateX.set(rotateX);
  }
  set rotateY(rotateY) {
    this.#stores.rotateY.set(rotateY);
  }
  set rotateZ(rotateZ) {
    this.#stores.rotateZ.set(rotateZ);
  }
  set rotation(rotateZ) {
    this.#stores.rotateZ.set(rotateZ);
  }
  set scale(scale) {
    this.#stores.scale.set(scale);
  }
  set top(top) {
    this.#stores.top.set(top);
  }
  set transformOrigin(transformOrigin) {
    if (transformOrigins.includes(transformOrigin)) {
      this.#stores.transformOrigin.set(transformOrigin);
    }
  }
  set translateX(translateX) {
    this.#stores.translateX.set(translateX);
  }
  set translateY(translateY) {
    this.#stores.translateY.set(translateY);
  }
  set translateZ(translateZ) {
    this.#stores.translateZ.set(translateZ);
  }
  set width(width) {
    this.#stores.width.set(width);
  }
  set zIndex(zIndex) {
    this.#stores.zIndex.set(zIndex);
  }
  get(position = {}, options) {
    const keys = options?.keys;
    const excludeKeys = options?.exclude;
    const numeric = options?.numeric ?? false;
    if (isIterable(keys)) {
      if (numeric) {
        for (const key of keys) {
          position[key] = this[key] ?? numericDefaults[key];
        }
      } else {
        for (const key of keys) {
          position[key] = this[key];
        }
      }
      if (isIterable(excludeKeys)) {
        for (const key of excludeKeys) {
          delete position[key];
        }
      }
      return position;
    } else {
      const data = Object.assign(position, this.#data);
      if (isIterable(excludeKeys)) {
        for (const key of excludeKeys) {
          delete data[key];
        }
      }
      if (numeric) {
        setNumericDefaults(data);
      }
      return data;
    }
  }
  toJSON() {
    return Object.assign({}, this.#data);
  }
  set(position = {}) {
    if (typeof position !== "object") {
      throw new TypeError(`Position - set error: 'position' is not an object.`);
    }
    const parent = this.#parent;
    if (parent !== void 0 && typeof parent?.options?.positionable === "boolean" && !parent?.options?.positionable) {
      return this;
    }
    const immediateElementUpdate = position.immediateElementUpdate === true;
    const data = this.#data;
    const transforms = this.#transforms;
    const targetEl = parent instanceof HTMLElement ? parent : parent?.elementTarget;
    const el = targetEl instanceof HTMLElement && targetEl.isConnected ? targetEl : void 0;
    const changeSet = this.#positionChangeSet;
    const styleCache = this.#styleCache;
    if (el) {
      if (!styleCache.hasData(el)) {
        styleCache.update(el);
        if (!styleCache.hasWillChange) {
          el.style.willChange = this.#options.ortho ? "transform" : "top, left, transform";
        }
        changeSet.set(true);
        this.#updateElementData.queued = false;
      }
      convertRelative(position, this);
      position = this.#updatePosition(position, parent, el, styleCache);
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
      position.maxHeight = typeof position.maxHeight === "number" ? Math.round(position.maxHeight) : null;
      if (data.maxHeight !== position.maxHeight) {
        data.maxHeight = position.maxHeight;
        changeSet.maxHeight = true;
      }
    }
    if (Number.isFinite(position.maxWidth) || position.maxWidth === null) {
      position.maxWidth = typeof position.maxWidth === "number" ? Math.round(position.maxWidth) : null;
      if (data.maxWidth !== position.maxWidth) {
        data.maxWidth = position.maxWidth;
        changeSet.maxWidth = true;
      }
    }
    if (Number.isFinite(position.minHeight) || position.minHeight === null) {
      position.minHeight = typeof position.minHeight === "number" ? Math.round(position.minHeight) : null;
      if (data.minHeight !== position.minHeight) {
        data.minHeight = position.minHeight;
        changeSet.minHeight = true;
      }
    }
    if (Number.isFinite(position.minWidth) || position.minWidth === null) {
      position.minWidth = typeof position.minWidth === "number" ? Math.round(position.minWidth) : null;
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
      position.scale = typeof position.scale === "number" ? Math.max(0, Math.min(position.scale, 1e3)) : null;
      if (data.scale !== position.scale) {
        data.scale = transforms.scale = position.scale;
        changeSet.transform = true;
      }
    }
    if (typeof position.transformOrigin === "string" && transformOrigins.includes(
      position.transformOrigin
    ) || position.transformOrigin === null) {
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
    if (Number.isFinite(position.width) || position.width === "auto" || position.width === "inherit" || position.width === null) {
      position.width = typeof position.width === "number" ? Math.round(position.width) : position.width;
      if (data.width !== position.width) {
        data.width = position.width;
        changeSet.width = true;
      }
    }
    if (Number.isFinite(position.height) || position.height === "auto" || position.height === "inherit" || position.height === null) {
      position.height = typeof position.height === "number" ? Math.round(position.height) : position.height;
      if (data.height !== position.height) {
        data.height = position.height;
        changeSet.height = true;
      }
    }
    if (el) {
      const defaultData = this.#state.getDefault();
      if (typeof defaultData !== "object") {
        this.#state.save({ name: "#defaultData", ...Object.assign({}, data) });
      }
      if (immediateElementUpdate) {
        UpdateElementManager.immediate(el, this.#updateElementData);
        this.#updateElementPromise = Promise.resolve(performance.now());
      } else if (!this.#updateElementData.queued) {
        this.#updateElementPromise = UpdateElementManager.add(el, this.#updateElementData);
      }
    } else {
      UpdateElementManager.updateSubscribers(this.#updateElementData);
    }
    return this;
  }
  subscribe(handler) {
    this.#subscriptions.push(handler);
    handler(Object.assign({}, this.#data));
    return () => {
      const index = this.#subscriptions.findIndex((sub) => sub === handler);
      if (index >= 0) {
        this.#subscriptions.splice(index, 1);
      }
    };
  }
  #updatePosition({
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
    rotation,
    ...rest
  } = {}, parent, el, styleCache) {
    let currentPosition = s_DATA_UPDATE.copy(this.#data);
    if (el.style.width === "" || width !== void 0) {
      if (width === "auto" || currentPosition.width === "auto" && width !== null) {
        currentPosition.width = "auto";
        width = styleCache.offsetWidth;
      } else if (width === "inherit" || currentPosition.width === "inherit" && width !== null) {
        currentPosition.width = "inherit";
        width = styleCache.offsetWidth;
      } else {
        const newWidth = Number.isFinite(width) ? width : currentPosition.width;
        currentPosition.width = width = Number.isFinite(newWidth) ? Math.round(newWidth) : styleCache.offsetWidth;
      }
    } else {
      width = Number.isFinite(currentPosition.width) ? currentPosition.width : styleCache.offsetWidth;
    }
    if (el.style.height === "" || height !== void 0) {
      if (height === "auto" || currentPosition.height === "auto" && height !== null) {
        currentPosition.height = "auto";
        height = styleCache.offsetHeight;
      } else if (height === "inherit" || currentPosition.height === "inherit" && height !== null) {
        currentPosition.height = "inherit";
        height = styleCache.offsetHeight;
      } else {
        const newHeight = Number.isFinite(height) ? height : currentPosition.height;
        currentPosition.height = height = Number.isFinite(newHeight) ? Math.round(newHeight) : styleCache.offsetHeight;
      }
    } else {
      height = Number.isFinite(currentPosition.height) ? currentPosition.height : styleCache.offsetHeight;
    }
    if (Number.isFinite(left)) {
      currentPosition.left = left;
    } else if (!Number.isFinite(currentPosition.left)) {
      currentPosition.left = typeof this.#options.initialHelper?.getLeft === "function" ? this.#options.initialHelper.getLeft(width) : 0;
    }
    if (Number.isFinite(top)) {
      currentPosition.top = top;
    } else if (!Number.isFinite(currentPosition.top)) {
      currentPosition.top = typeof this.#options.initialHelper?.getTop === "function" ? this.#options.initialHelper.getTop(height) : 0;
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
    }
    if (Number.isFinite(rotateX) || rotateX === null) {
      currentPosition.rotateX = rotateX;
    }
    if (Number.isFinite(rotateY) || rotateY === null) {
      currentPosition.rotateY = rotateY;
    }
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
      currentPosition.scale = typeof scale === "number" ? Math.max(0, Math.min(scale, 1e3)) : null;
    }
    if (typeof transformOrigin === "string" || transformOrigin === null) {
      currentPosition.transformOrigin = transformOrigins.includes(transformOrigin) ? transformOrigin : null;
    }
    if (Number.isFinite(zIndex) || zIndex === null) {
      currentPosition.zIndex = typeof zIndex === "number" ? Math.round(zIndex) : zIndex;
    }
    const validatorData = this.#validatorData;
    if (validatorData.length) {
      s_VALIDATION_DATA.parent = parent;
      s_VALIDATION_DATA.el = el;
      s_VALIDATION_DATA.computed = styleCache.computed;
      s_VALIDATION_DATA.transforms = this.#transforms;
      s_VALIDATION_DATA.height = height;
      s_VALIDATION_DATA.width = width;
      s_VALIDATION_DATA.marginLeft = styleCache.marginLeft;
      s_VALIDATION_DATA.marginTop = styleCache.marginTop;
      s_VALIDATION_DATA.maxHeight = styleCache.maxHeight ?? currentPosition.maxHeight;
      s_VALIDATION_DATA.maxWidth = styleCache.maxWidth ?? currentPosition.maxWidth;
      const isMinimized = parent?.reactive?.minimized ?? false;
      s_VALIDATION_DATA.minHeight = isMinimized ? currentPosition.minHeight ?? 0 : styleCache.minHeight || (currentPosition.minHeight ?? 0);
      s_VALIDATION_DATA.minWidth = isMinimized ? currentPosition.minWidth ?? 0 : styleCache.minWidth || (currentPosition.minWidth ?? 0);
      for (let cntr = 0; cntr < validatorData.length; cntr++) {
        s_VALIDATION_DATA.position = currentPosition;
        s_VALIDATION_DATA.rest = rest;
        currentPosition = validatorData[cntr].validator(s_VALIDATION_DATA);
        if (currentPosition === null) {
          return null;
        }
      }
    }
    return currentPosition;
  }
}
__name(Position, "Position");
const s_DATA_UPDATE = new PositionData();
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
class ApplicationState {
  #application;
  #dataSaved = /* @__PURE__ */ new Map();
  constructor(application) {
    this.#application = application;
  }
  get(extra = {}) {
    return Object.assign(extra, {
      position: this.#application?.position?.get(),
      beforeMinimized: this.#application?.position?.state.get({ name: "#beforeMinimized" }),
      options: Object.assign({}, this.#application?.options),
      ui: { minimized: this.#application?.reactive?.minimized }
    });
  }
  getSave({ name }) {
    if (typeof name !== "string") {
      throw new TypeError(`ApplicationState - getSave error: 'name' is not a string.`);
    }
    return this.#dataSaved.get(name);
  }
  remove({ name }) {
    if (typeof name !== "string") {
      throw new TypeError(`ApplicationState - remove: 'name' is not a string.`);
    }
    const data = this.#dataSaved.get(name);
    this.#dataSaved.delete(name);
    return data;
  }
  restore({
    name,
    remove = false,
    async = false,
    animateTo = false,
    duration = 0.1,
    ease = identity,
    interpolate = lerp$5
  }) {
    if (typeof name !== "string") {
      throw new TypeError(`ApplicationState - restore error: 'name' is not a string.`);
    }
    const dataSaved = this.#dataSaved.get(name);
    if (dataSaved) {
      if (remove) {
        this.#dataSaved.delete(name);
      }
      if (async) {
        return this.set(dataSaved, { async, animateTo, duration, ease, interpolate }).then(() => dataSaved);
      } else {
        this.set(dataSaved, { async, animateTo, duration, ease, interpolate });
      }
    }
    return dataSaved;
  }
  save({ name, ...extra }) {
    if (typeof name !== "string") {
      throw new TypeError(`ApplicationState - save error: 'name' is not a string.`);
    }
    const data = this.get(extra);
    this.#dataSaved.set(name, data);
    return data;
  }
  set(data, { async = false, animateTo = false, duration = 0.1, ease = identity, interpolate = lerp$5 } = {}) {
    if (!isObject(data)) {
      throw new TypeError(`ApplicationState - restore error: 'data' is not an object.`);
    }
    const application = this.#application;
    if (!isObject(data?.position)) {
      console.warn(`ApplicationState.set warning: 'data.position' is not an object.`);
      return application;
    }
    const rendered = application.rendered;
    if (animateTo && !rendered) {
      console.warn(`ApplicationState.set warning: Application is not rendered and 'animateTo' is true.`);
      return application;
    }
    if (animateTo) {
      if (data.position.transformOrigin !== application.position.transformOrigin) {
        application.position.transformOrigin = data.position.transformOrigin;
      }
      if (isObject(data?.ui)) {
        const minimized = typeof data.ui?.minimized === "boolean" ? data.ui.minimized : false;
        if (application?.reactive?.minimized && !minimized) {
          application.maximize({ animate: false, duration: 0 });
        }
      }
      const promise2 = application.position.animate.to(
        data.position,
        { duration, ease, interpolate }
      ).finished.then((cancelled) => {
        if (cancelled) {
          return application;
        }
        if (isObject(data?.options)) {
          application?.reactive.mergeOptions(data.options);
        }
        if (isObject(data?.ui)) {
          const minimized = typeof data.ui?.minimized === "boolean" ? data.ui.minimized : false;
          if (!application?.reactive?.minimized && minimized) {
            application.minimize({ animate: false, duration: 0 });
          }
        }
        if (isObject(data?.beforeMinimized)) {
          application.position.state.set({ name: "#beforeMinimized", ...data.beforeMinimized });
        }
        return application;
      });
      if (async) {
        return promise2;
      }
    } else {
      if (rendered) {
        if (isObject(data?.options)) {
          application?.reactive.mergeOptions(data.options);
        }
        if (isObject(data?.ui)) {
          const minimized = typeof data.ui?.minimized === "boolean" ? data.ui.minimized : false;
          if (application?.reactive?.minimized && !minimized) {
            application.maximize({ animate: false, duration: 0 });
          } else if (!application?.reactive?.minimized && minimized) {
            application.minimize({ animate: false, duration });
          }
        }
        if (isObject(data?.beforeMinimized)) {
          application.position.state.set({ name: "#beforeMinimized", ...data.beforeMinimized });
        }
        application.position.set(data.position);
      } else {
        let positionData = data.position;
        if (isObject(data.beforeMinimized)) {
          positionData = data.beforeMinimized;
          positionData.left = data.position.left;
          positionData.top = data.position.top;
        }
        application.position.set(positionData);
      }
    }
    return application;
  }
}
__name(ApplicationState, "ApplicationState");
class GetSvelteData {
  #applicationShellHolder;
  #svelteData;
  constructor(applicationShellHolder, svelteData) {
    this.#applicationShellHolder = applicationShellHolder;
    this.#svelteData = svelteData;
  }
  get applicationShell() {
    return this.#applicationShellHolder[0];
  }
  component(index) {
    const data = this.#svelteData[index];
    return typeof data === "object" ? data?.component : void 0;
  }
  *componentEntries() {
    for (let cntr = 0; cntr < this.#svelteData.length; cntr++) {
      yield [cntr, this.#svelteData[cntr].component];
    }
  }
  *componentValues() {
    for (let cntr = 0; cntr < this.#svelteData.length; cntr++) {
      yield this.#svelteData[cntr].component;
    }
  }
  data(index) {
    return this.#svelteData[index];
  }
  dataByComponent(component) {
    for (const data of this.#svelteData) {
      if (data.component === component) {
        return data;
      }
    }
    return void 0;
  }
  dataEntries() {
    return this.#svelteData.entries();
  }
  dataValues() {
    return this.#svelteData.values();
  }
  get length() {
    return this.#svelteData.length;
  }
}
__name(GetSvelteData, "GetSvelteData");
function loadSvelteConfig({ app, template, config, elementRootUpdate } = {}) {
  const svelteOptions = typeof config.options === "object" ? config.options : {};
  let target;
  if (config.target instanceof HTMLElement) {
    target = config.target;
  } else if (template instanceof HTMLElement && typeof config.target === "string") {
    target = template.querySelector(config.target);
  } else {
    target = document.createDocumentFragment();
  }
  if (target === void 0) {
    console.log(
      `%c[TRL] loadSvelteConfig error - could not find target selector, '${config.target}', for config:
`,
      "background: rgb(57,34,34)",
      config
    );
    throw new Error();
  }
  const NewSvelteComponent = config.class;
  const svelteConfig = parseSvelteConfig({ ...config, target }, app);
  const externalContext = svelteConfig.context.get("external");
  externalContext.application = app;
  externalContext.elementRootUpdate = elementRootUpdate;
  let eventbus;
  if (typeof app._eventbus === "object" && typeof app._eventbus.createProxy === "function") {
    eventbus = app._eventbus.createProxy();
    externalContext.eventbus = eventbus;
  }
  const component = new NewSvelteComponent(svelteConfig);
  svelteConfig.eventbus = eventbus;
  let element2;
  if (isApplicationShell(component)) {
    element2 = component.elementRoot;
  }
  if (target instanceof DocumentFragment && target.firstElementChild) {
    if (element2 === void 0) {
      element2 = target.firstElementChild;
    }
    template.append(target);
  } else if (config.target instanceof HTMLElement && element2 === void 0) {
    if (config.target instanceof HTMLElement && typeof svelteOptions.selectorElement !== "string") {
      console.log(
        `%c[TRL] loadSvelteConfig error - HTMLElement target with no 'selectorElement' defined.

Note: If configuring an application shell and directly targeting a HTMLElement did you bind an'elementRoot' and include '<svelte:options accessors={true}/>'?

Offending config:
`,
        "background: rgb(57,34,34)",
        config
      );
      throw new Error();
    }
    element2 = target.querySelector(svelteOptions.selectorElement);
    if (element2 === null || element2 === void 0) {
      console.log(
        `%c[TRL] loadSvelteConfig error - HTMLElement target with 'selectorElement', '${svelteOptions.selectorElement}', not found for config:
`,
        "background: rgb(57,34,34)",
        config
      );
      throw new Error();
    }
  }
  const injectHTML = !(config.target instanceof HTMLElement);
  return { config: svelteConfig, component, element: element2, injectHTML };
}
__name(loadSvelteConfig, "loadSvelteConfig");
class SvelteReactive {
  #application;
  #initialized = false;
  #storeAppOptions;
  #storeAppOptionsUpdate;
  #dataUIState;
  #storeUIState;
  #storeUIStateUpdate;
  #storeUnsubscribe = [];
  constructor(application) {
    this.#application = application;
  }
  initialize() {
    if (this.#initialized) {
      return;
    }
    this.#initialized = true;
    this.#storesInitialize();
    return {
      appOptionsUpdate: this.#storeAppOptionsUpdate,
      uiOptionsUpdate: this.#storeUIStateUpdate,
      subscribe: this.#storesSubscribe.bind(this),
      unsubscribe: this.#storesUnsubscribe.bind(this)
    };
  }
  get dragging() {
    return this.#dataUIState.dragging;
  }
  get minimized() {
    return this.#dataUIState.minimized;
  }
  get resizing() {
    return this.#dataUIState.resizing;
  }
  get draggable() {
    return this.#application?.options?.draggable;
  }
  get headerButtonNoClose() {
    return this.#application?.options?.headerButtonNoClose;
  }
  get headerButtonNoLabel() {
    return this.#application?.options?.headerButtonNoLabel;
  }
  get headerNoTitleMinimized() {
    return this.#application?.options?.headerNoTitleMinimized;
  }
  get minimizable() {
    return this.#application?.options?.minimizable;
  }
  get popOut() {
    return this.#application.popOut;
  }
  get resizable() {
    return this.#application?.options?.resizable;
  }
  get storeAppOptions() {
    return this.#storeAppOptions;
  }
  get storeUIState() {
    return this.#storeUIState;
  }
  get title() {
    return this.#application.title;
  }
  set draggable(draggable2) {
    if (typeof draggable2 === "boolean") {
      this.setOptions("draggable", draggable2);
    }
  }

    set headerButtonNoClose(headerButtonNoClose) {
        if (typeof headerButtonNoClose === "boolean") {
            this.setOptions("headerButtonNoClose", headerButtonNoClose);
        }
    }

    set headerButtonNoLabel(headerButtonNoLabel) {
        if (typeof headerButtonNoLabel === "boolean") {
            this.setOptions("headerButtonNoLabel", headerButtonNoLabel);
        }
    }

    set headerNoTitleMinimized(headerNoTitleMinimized) {
        if (typeof headerNoTitleMinimized === "boolean") {
            this.setOptions("headerNoTitleMinimized", headerNoTitleMinimized);
        }
    }

    set minimizable(minimizable) {
        if (typeof minimizable === "boolean") {
            this.setOptions("minimizable", minimizable);
        }
    }

    set popOut(popOut) {
        if (typeof popOut === "boolean") {
            this.setOptions("popOut", popOut);
        }
    }

    set resizable(resizable) {
        if (typeof resizable === "boolean") {
            this.setOptions("resizable", resizable);
        }
    }

    set title(title) {
        if (typeof title === "string") {
            this.setOptions("title", title);
        }
        else if (title === void 0 || title === null) {
            this.setOptions("title", "");
        }
    }

    getOptions(accessor, defaultValue) {
        return safeAccess(this.#application.options, accessor, defaultValue);
    }

    mergeOptions(options) {
        this.#storeAppOptionsUpdate((instanceOptions) => deepMerge(instanceOptions, options));
    }

    setOptions(accessor, value) {
        const success = safeSet(this.#application.options, accessor, value);
        if (success) {
            this.#storeAppOptionsUpdate(() => this.#application.options);
        }
    }

    #storesInitialize() {
        const writableAppOptions = writable(this.#application.options);
        this.#storeAppOptionsUpdate = writableAppOptions.update;
        const storeAppOptions = {
            subscribe: writableAppOptions.subscribe,
            draggable: propertyStore(writableAppOptions, "draggable"),
            headerButtonNoClose: propertyStore(writableAppOptions, "headerButtonNoClose"),
            headerButtonNoLabel: propertyStore(writableAppOptions, "headerButtonNoLabel"),
            headerNoTitleMinimized: propertyStore(writableAppOptions, "headerNoTitleMinimized"),
            minimizable: propertyStore(writableAppOptions, "minimizable"),
            popOut: propertyStore(writableAppOptions, "popOut"),
            resizable: propertyStore(writableAppOptions, "resizable"),
            title: propertyStore(writableAppOptions, "title")
        };
        Object.freeze(storeAppOptions);
        this.#storeAppOptions = storeAppOptions;
        this.#dataUIState = {
            dragging: false,
            headerButtons: [],
            minimized: this.#application._minimized,
            resizing: false
        };
        const writableUIOptions = writable(this.#dataUIState);
        this.#storeUIStateUpdate = writableUIOptions.update;
        const storeUIState = {
            subscribe: writableUIOptions.subscribe,
            dragging: propertyStore(writableUIOptions, "dragging"),
            headerButtons: derived(writableUIOptions, ($options, set) => set($options.headerButtons)),
            minimized: derived(writableUIOptions, ($options, set) => set($options.minimized)),
            resizing: propertyStore(writableUIOptions, "resizing")
        };
        Object.freeze(storeUIState);
        this.#storeUIState = storeUIState;
    }

    #storesSubscribe() {
        this.#storeUnsubscribe.push(subscribeIgnoreFirst(this.#storeAppOptions.headerButtonNoClose, (value) => {
            this.updateHeaderButtons({ headerButtonNoClose: value });
        }));
        this.#storeUnsubscribe.push(subscribeIgnoreFirst(this.#storeAppOptions.headerButtonNoLabel, (value) => {
            this.updateHeaderButtons({ headerButtonNoLabel: value });
        }));
        this.#storeUnsubscribe.push(subscribeIgnoreFirst(this.#storeAppOptions.popOut, (value) => {
            if (value && this.#application.rendered) {
                ui.windows[this.#application.appId] = this.#application;
            }
            else {
                delete ui.windows[this.#application.appId];
            }
        }));
    }

    #storesUnsubscribe() {
        this.#storeUnsubscribe.forEach((unsubscribe) => unsubscribe());
        this.#storeUnsubscribe = [];
    }

    updateHeaderButtons({
                            headerButtonNoClose = this.#application.options.headerButtonNoClose,
                            headerButtonNoLabel = this.#application.options.headerButtonNoLabel
                        } = {}) {
        let buttons = this.#application._getHeaderButtons();
        if (typeof headerButtonNoClose === "boolean" && headerButtonNoClose) {
      buttons = buttons.filter((button) => button.class !== "close");
    }
    if (typeof headerButtonNoLabel === "boolean" && headerButtonNoLabel) {
      for (const button of buttons) {
        button.label = void 0;
      }
    }
    this.#storeUIStateUpdate((options) => {
      options.headerButtons = buttons;
      return options;
    });
  }
}
__name(SvelteReactive, "SvelteReactive");
class SvelteApplication extends Application {
  #applicationShellHolder = [null];
  #applicationState;
  #elementTarget = null;
  #elementContent = null;
  #initialZIndex = 95;
  #onMount = false;
  #position;
  #reactive;
  #svelteData = [];
  #getSvelteData = new GetSvelteData(this.#applicationShellHolder, this.#svelteData);
  #stores;
  constructor(options = {}) {
    super(options);
    this.#applicationState = new ApplicationState(this);
    this.#position = new Position(this, {
      ...this.position,
      ...this.options,
      initial: this.options.positionInitial,
      ortho: this.options.positionOrtho,
      validator: this.options.positionValidator
    });
    delete this.position;
    Object.defineProperty(this, "position", {
      get: () => this.#position,
      set: (position) => {
        if (typeof position === "object") {
          this.#position.set(position);
        }
      }
    });
    this.#reactive = new SvelteReactive(this);
    this.#stores = this.#reactive.initialize();
  }
  static get defaultOptions() {
    return deepMerge(super.defaultOptions, {
      defaultCloseAnimation: true,
      draggable: true,
      headerButtonNoClose: false,
      headerButtonNoLabel: false,
      headerNoTitleMinimized: false,
      minHeight: MIN_WINDOW_HEIGHT,
      minWidth: MIN_WINDOW_WIDTH,
      positionable: true,
      positionInitial: Position.Initial.browserCentered,
      positionOrtho: true,
      positionValidator: Position.Validators.transformWindow,
      transformOrigin: "top left"
    });
  }
  get elementContent() {
    return this.#elementContent;
  }
  get elementTarget() {
    return this.#elementTarget;
  }
  get reactive() {
    return this.#reactive;
  }
  get state() {
    return this.#applicationState;
  }
  get svelte() {
    return this.#getSvelteData;
  }
  _activateCoreListeners(html) {
    super._activateCoreListeners(typeof this.options.template === "string" ? html : [this.#elementTarget]);
  }
  bringToTop({ force = false } = {}) {
    if (force || this.popOut) {
      super.bringToTop();
    }
    if (document.activeElement !== document.body && !this.elementTarget.contains(document.activeElement)) {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      document.body.focus();
    }
    ui.activeWindow = this;
  }
  async close(options = {}) {
    const states = Application.RENDER_STATES;
    if (!options.force && ![states.RENDERED, states.ERROR].includes(this._state)) {
      return;
    }
    this.#stores.unsubscribe();
    this._state = states.CLOSING;
    const el = this.#elementTarget;
    if (!el) {
      return this._state = states.CLOSED;
    }
    const content = el.querySelector(".window-content");
    if (content) {
      content.style.overflow = "hidden";
      for (let cntr = content.children.length; --cntr >= 0; ) {
        content.children[cntr].style.overflow = "hidden";
      }
    }
    for (const cls of this.constructor._getInheritanceChain()) {
      Hooks.call(`close${cls.name}`, this, el);
    }
    const animate = typeof this.options.defaultCloseAnimation === "boolean" ? this.options.defaultCloseAnimation : true;
    if (animate) {
      el.style.minHeight = "0";
      const { paddingBottom, paddingTop } = globalThis.getComputedStyle(el);
      await el.animate([
        { maxHeight: `${el.clientHeight}px`, paddingTop, paddingBottom },
        { maxHeight: 0, paddingTop: 0, paddingBottom: 0 }
      ], { duration: 250, easing: "ease-in", fill: "forwards" }).finished;
    }
    const svelteDestroyPromises = [];
    for (const entry of this.#svelteData) {
      svelteDestroyPromises.push(outroAndDestroy(entry.component));
      const eventbus = entry.config.eventbus;
      if (typeof eventbus === "object" && typeof eventbus.off === "function") {
        eventbus.off();
        entry.config.eventbus = void 0;
      }
    }
    await Promise.all(svelteDestroyPromises);
    this.#svelteData.length = 0;
    el.remove();
    this.position.state.restore({
      name: "#beforeMinimized",
      properties: ["width", "height"],
      silent: true,
      remove: true
    });
    this.#applicationShellHolder[0] = null;
    this._element = null;
    this.#elementContent = null;
    this.#elementTarget = null;
    delete ui.windows[this.appId];
    this._minimized = false;
    this._scrollPositions = null;
    this._state = states.CLOSED;
    this.#onMount = false;
    this.#stores.uiOptionsUpdate((storeOptions) => deepMerge(storeOptions, { minimized: this._minimized }));
  }
  _injectHTML(html) {
    if (this.popOut && html.length === 0 && Array.isArray(this.options.svelte)) {
      throw new Error(
        "SvelteApplication - _injectHTML - A popout app with no template can only support one Svelte component."
      );
    }
    this.reactive.updateHeaderButtons();
    const elementRootUpdate = /* @__PURE__ */ __name(() => {
      let cntr = 0;
      return (elementRoot) => {
        if (elementRoot !== null && elementRoot !== void 0 && cntr++ > 0) {
          this.#updateApplicationShell();
          return true;
        }
        return false;
      };
    }, "elementRootUpdate");
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
            throw new Error(
              `SvelteApplication - _injectHTML - An application shell is already mounted; offending config:
                    ${JSON.stringify(svelteConfig)}`
            );
          }
          this.#applicationShellHolder[0] = svelteData.component;
          if (isHMRProxy(svelteData.component) && Array.isArray(svelteData.component?.$$?.on_hmr)) {
            svelteData.component.$$.on_hmr.push(() => () => this.#updateApplicationShell());
          }
        }
        this.#svelteData.push(svelteData);
      }
    } else if (typeof this.options.svelte === "object") {
      const svelteData = loadSvelteConfig({
        app: this,
        template: html[0],
        config: this.options.svelte,
        elementRootUpdate
      });
      if (isApplicationShell(svelteData.component)) {
        if (this.svelte.applicationShell !== null) {
          throw new Error(
            `SvelteApplication - _injectHTML - An application shell is already mounted; offending config:
                 ${JSON.stringify(this.options.svelte)}`
          );
        }
        this.#applicationShellHolder[0] = svelteData.component;
        if (isHMRProxy(svelteData.component) && Array.isArray(svelteData.component?.$$?.on_hmr)) {
          svelteData.component.$$.on_hmr.push(() => () => this.#updateApplicationShell());
        }
      }
      this.#svelteData.push(svelteData);
    }
    const isDocumentFragment = html.length && html[0] instanceof DocumentFragment;
    let injectHTML = true;
    for (const svelteData of this.#svelteData) {
      if (!svelteData.injectHTML) {
        injectHTML = false;
        break;
      }
    }
    if (injectHTML) {
      super._injectHTML(html);
    }
    if (this.svelte.applicationShell !== null) {
      this._element = $(this.svelte.applicationShell.elementRoot);
      this.#elementContent = hasGetter(this.svelte.applicationShell, "elementContent") ? this.svelte.applicationShell.elementContent : null;
      this.#elementTarget = hasGetter(this.svelte.applicationShell, "elementTarget") ? this.svelte.applicationShell.elementTarget : null;
    } else if (isDocumentFragment) {
      for (const svelteData of this.#svelteData) {
        if (svelteData.element instanceof HTMLElement) {
          this._element = $(svelteData.element);
          break;
        }
      }
    }
    if (this.#elementTarget === null) {
      const element2 = typeof this.options.selectorTarget === "string" ? this._element.find(this.options.selectorTarget) : this._element;
      this.#elementTarget = element2[0];
    }
    if (this.#elementTarget === null || this.#elementTarget === void 0 || this.#elementTarget.length === 0) {
      throw new Error(`SvelteApplication - _injectHTML: Target element '${this.options.selectorTarget}' not found.`);
    }
    if (typeof this.options.positionable === "boolean" && this.options.positionable) {
      this.#elementTarget.style.zIndex = typeof this.options.zIndex === "number" ? this.options.zIndex : this.#initialZIndex ?? 95;
    }
    this.#stores.subscribe();
  }
  async maximize({ animate = true, duration = 0.1 } = {}) {
    if (!this.popOut || [false, null].includes(this._minimized)) {
      return;
    }
    this._minimized = null;
    const durationMS = duration * 1e3;
    const element2 = this.elementTarget;
    const header = element2.querySelector(".window-header");
    const content = element2.querySelector(".window-content");
    const positionBefore = this.position.state.get({ name: "#beforeMinimized" });
    if (animate) {
      await this.position.state.restore({
        name: "#beforeMinimized",
        async: true,
        animateTo: true,
        properties: ["width"],
        duration: 0.1
      });
    }
    for (let cntr = header.children.length; --cntr >= 0; ) {
      header.children[cntr].style.display = null;
    }
    content.style.display = null;
    let constraints;
    if (animate) {
      ({ constraints } = this.position.state.restore({
        name: "#beforeMinimized",
        animateTo: true,
        properties: ["height"],
        remove: true,
        duration
      }));
    } else {
      ({ constraints } = this.position.state.remove({ name: "#beforeMinimized" }));
    }
    await content.animate([
      { maxHeight: 0, paddingTop: 0, paddingBottom: 0, offset: 0 },
      { ...constraints, offset: 1 },
      { maxHeight: "100%", offset: 1 }
    ], { duration: durationMS, fill: "forwards" }).finished;
    this.position.set({
      minHeight: positionBefore.minHeight ?? this.options?.minHeight ?? MIN_WINDOW_HEIGHT,
      minWidth: positionBefore.minWidth ?? this.options?.minWidth ?? MIN_WINDOW_WIDTH
    });
    element2.style.minWidth = null;
    element2.style.minHeight = null;
    element2.classList.remove("minimized");
    this._minimized = false;
    setTimeout(() => {
      content.style.overflow = null;
      for (let cntr = content.children.length; --cntr >= 0; ) {
        content.children[cntr].style.overflow = null;
      }
    }, 50);
    this.#stores.uiOptionsUpdate((options) => deepMerge(options, { minimized: false }));
  }
  async minimize({ animate = true, duration = 0.1 } = {}) {
    if (!this.rendered || !this.popOut || [true, null].includes(this._minimized)) {
      return;
    }
    this.#stores.uiOptionsUpdate((options) => deepMerge(options, { minimized: true }));
    this._minimized = null;
    const durationMS = duration * 1e3;
    const element2 = this.elementTarget;
    const header = element2.querySelector(".window-header");
    const content = element2.querySelector(".window-content");
    const beforeMinWidth = this.position.minWidth;
    const beforeMinHeight = this.position.minHeight;
    this.position.set({ minWidth: 100, minHeight: 30 });
    element2.style.minWidth = "100px";
    element2.style.minHeight = "30px";
    if (content) {
      content.style.overflow = "hidden";
      for (let cntr = content.children.length; --cntr >= 0; ) {
        content.children[cntr].style.overflow = "hidden";
      }
    }
    const { paddingBottom, paddingTop } = globalThis.getComputedStyle(content);
    const constraints = {
      maxHeight: `${content.clientHeight}px`,
      paddingTop,
      paddingBottom
    };
    if (animate) {
      const animation = content.animate([
        constraints,
        { maxHeight: 0, paddingTop: 0, paddingBottom: 0 }
      ], { duration: durationMS, fill: "forwards" });
      animation.finished.then(() => content.style.display = "none");
    } else {
      setTimeout(() => content.style.display = "none", durationMS);
    }
    const saved = this.position.state.save({ name: "#beforeMinimized", constraints });
    saved.minWidth = beforeMinWidth;
    saved.minHeight = beforeMinHeight;
    const headerOffsetHeight = header.offsetHeight;
    this.position.minHeight = headerOffsetHeight;
    if (animate) {
      await this.position.animate.to({ height: headerOffsetHeight }, { duration }).finished;
    }
    for (let cntr = header.children.length; --cntr >= 0; ) {
        const className = header.children[cntr].className;
        if (className.includes("window-title") || className.includes("close")) {
            continue;
        }
        if (className.includes("keep-minimized")) {
            header.children[cntr].style.display = "block";
            continue;
        }
        header.children[cntr].style.display = "none";
    }
    if (animate) {
      await this.position.animate.to({ width: MIN_WINDOW_WIDTH }, { duration: 0.1 }).finished;
    }
    element2.classList.add("minimized");
    this._minimized = true;
  }
  onSvelteMount({ element: element2, elementContent, elementTarget } = {}) {
  }
  onSvelteRemount({ element: element2, elementContent, elementTarget } = {}) {
  }
  _replaceHTML(element2, html) {
    if (!element2.length) {
      return;
    }
    this.reactive.updateHeaderButtons();
  }
  async _render(force = false, options = {}) {
    if (this._state === Application.RENDER_STATES.NONE && document.querySelector(`#${this.id}`) instanceof HTMLElement) {
      console.warn(`SvelteApplication - _render: A DOM element already exists for CSS ID '${this.id}'. Cancelling initial render for new application with appId '${this.appId}'.`);
      return;
    }
    await super._render(force, options);
    if (!this.#onMount) {
      this.onSvelteMount({ element: this._element[0], elementContent: this.#elementContent, elementTarget: this.#elementTarget });
      this.#onMount = true;
    }
  }
  async _renderInner(data) {
    const html = typeof this.template === "string" ? await renderTemplate(this.template, data) : document.createDocumentFragment();
    return $(html);
  }
  async _renderOuter() {
    const html = await super._renderOuter();
    this.#initialZIndex = html[0].style.zIndex;
    return html;
  }
  setPosition(position) {
    return this.position.set(position);
  }
  #updateApplicationShell() {
    const applicationShell = this.svelte.applicationShell;
    if (applicationShell !== null) {
      this._element = $(applicationShell.elementRoot);
      this.#elementContent = hasGetter(applicationShell, "elementContent") ? applicationShell.elementContent : null;
      this.#elementTarget = hasGetter(applicationShell, "elementTarget") ? applicationShell.elementTarget : null;
      if (this.#elementTarget === null) {
        const element2 = typeof this.options.selectorTarget === "string" ? this._element.find(this.options.selectorTarget) : this._element;
        this.#elementTarget = element2[0];
      }
      if (typeof this.options.positionable === "boolean" && this.options.positionable) {
        this.#elementTarget.style.zIndex = typeof this.options.zIndex === "number" ? this.options.zIndex : this.#initialZIndex ?? 95;
        super.bringToTop();
        this.position.set(this.position.get());
      }
      super._activateCoreListeners([this.#elementTarget]);
      this.onSvelteRemount({ element: this._element[0], elementContent: this.#elementContent, elementTarget: this.#elementTarget });
    }
  }
}

__name(SvelteApplication, "SvelteApplication");
const TJSContainer_svelte_svelte_type_style_lang = "";

function get_each_context$m(ctx, list, i) {
    const child_ctx = ctx.slice();
    child_ctx[2] = list[i];
    return child_ctx;
}

__name(get_each_context$m, "get_each_context$m");

function create_if_block_1$7(ctx) {
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
            if (detaching) {
                detach(p);
            }
        }
    };
}

__name(create_if_block_1$7, "create_if_block_1$7");

function create_if_block$i(ctx) {
    let each_1_anchor;
    let current;
    let each_value = ctx[1];
    let each_blocks = [];
    for (let i = 0; i < each_value.length; i += 1) {
        each_blocks[i] = create_each_block$m(get_each_context$m(ctx, each_value, i));
    }
    const out = /* @__PURE__ */ __name((i) => transition_out(each_blocks[i], 1, 1, () => {
        each_blocks[i] = null;
    }), "out");
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
        p(ctx2, dirty) {
            if (dirty & 2) {
                each_value = ctx2[1];
                let i;
                for (i = 0; i < each_value.length; i += 1) {
                    const child_ctx = get_each_context$m(ctx2, each_value, i);
                    if (each_blocks[i]) {
                        each_blocks[i].p(child_ctx, dirty);
                        transition_in(each_blocks[i], 1);
                    }
                    else {
                        each_blocks[i] = create_each_block$m(child_ctx);
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
            if (current) {
                return;
            }
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
            if (detaching) {
                detach(each_1_anchor);
            }
        }
    };
}

__name(create_if_block$i, "create_if_block$i");

function create_each_block$m(ctx) {
    let switch_instance;
    let switch_instance_anchor;
    let current;
    const switch_instance_spread_levels = [ctx[2].props];
    var switch_value = ctx[2].class;

    function switch_props(ctx2) {
        let switch_instance_props = {};
        for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
            switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
        }
        return { props: switch_instance_props };
    }

    __name(switch_props, "switch_props");
    if (switch_value) {
        switch_instance = new switch_value(switch_props());
    }
    return {
        c() {
            if (switch_instance) {
                create_component(switch_instance.$$.fragment);
            }
            switch_instance_anchor = empty();
        },
        m(target, anchor) {
            if (switch_instance) {
                mount_component(switch_instance, target, anchor);
            }
            insert(target, switch_instance_anchor, anchor);
            current = true;
        },
        p(ctx2, dirty) {
            const switch_instance_changes = dirty & 2 ? get_spread_update(switch_instance_spread_levels, [get_spread_object(ctx2[2].props)]) : {};
            if (switch_value !== (switch_value = ctx2[2].class)) {
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
                }
                else {
                    switch_instance = null;
                }
            }
            else if (switch_value) {
                switch_instance.$set(switch_instance_changes);
            }
        },
        i(local) {
            if (current) {
                return;
            }
            if (switch_instance) {
                transition_in(switch_instance.$$.fragment, local);
            }
            current = true;
        },
        o(local) {
            if (switch_instance) {
                transition_out(switch_instance.$$.fragment, local);
            }
            current = false;
        },
        d(detaching) {
            if (detaching) {
                detach(switch_instance_anchor);
            }
            if (switch_instance) {
                destroy_component(switch_instance, detaching);
            }
        }
    };
}

__name(create_each_block$m, "create_each_block$m");

function create_fragment$I(ctx) {
    let show_if;
    let current_block_type_index;
    let if_block;
    let if_block_anchor;
    let current;
    const if_block_creators = [create_if_block$i, create_if_block_1$7];
    const if_blocks = [];

    function select_block_type(ctx2, dirty) {
        if (dirty & 2) {
            show_if = null;
        }
        if (show_if == null) {
            show_if = !!Array.isArray(ctx2[1]);
        }
        if (show_if) {
            return 0;
        }
        if (ctx2[0]) {
            return 1;
        }
        return -1;
    }

    __name(select_block_type, "select_block_type");
    if (~(current_block_type_index = select_block_type(ctx, -1))) {
        if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    }
    return {
        c() {
            if (if_block) {
                if_block.c();
            }
            if_block_anchor = empty();
        },
        m(target, anchor) {
            if (~current_block_type_index) {
                if_blocks[current_block_type_index].m(target, anchor);
            }
            insert(target, if_block_anchor, anchor);
            current = true;
        },
        p(ctx2, [dirty]) {
            let previous_block_index = current_block_type_index;
            current_block_type_index = select_block_type(ctx2, dirty);
            if (current_block_type_index === previous_block_index) {
                if (~current_block_type_index) {
                    if_blocks[current_block_type_index].p(ctx2, dirty);
                }
            }
            else {
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
                        if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx2);
                        if_block.c();
                    }
                    else {
                        if_block.p(ctx2, dirty);
                    }
                    transition_in(if_block, 1);
                    if_block.m(if_block_anchor.parentNode, if_block_anchor);
                }
                else {
                    if_block = null;
                }
            }
        },
        i(local) {
            if (current) {
                return;
            }
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
            if (detaching) {
                detach(if_block_anchor);
            }
        }
    };
}

__name(create_fragment$I, "create_fragment$I");

function instance$H($$self, $$props, $$invalidate) {
    let { warn = false } = $$props;
    let { children: children2 = void 0 } = $$props;
    $$self.$$set = ($$props2) => {
        if ("warn" in $$props2) {
            $$invalidate(0, warn = $$props2.warn);
        }
        if ("children" in $$props2) {
            $$invalidate(1, children2 = $$props2.children);
        }
    };
    return [warn, children2];
}

__name(instance$H, "instance$H");

class TJSContainer extends SvelteComponent {
    constructor(options) {
        super();
        init(this, options, instance$H, create_fragment$I, safe_not_equal, { warn: 0, children: 1 });
    }

    get warn() {
        return this.$$.ctx[0];
    }

    set warn(warn) {
        this.$$set({ warn });
        flush();
    }

    get children() {
        return this.$$.ctx[1];
    }

    set children(children2) {
        this.$$set({ children: children2 });
        flush();
    }
}

__name(TJSContainer, "TJSContainer");
function fade(node, { delay = 0, duration = 400, easing = identity } = {}) {
    const o = +getComputedStyle(node).opacity;
    return {
        delay,
        duration,
        easing,
        css: (t) => `opacity: ${t * o}`
    };
}
__name(fade, "fade");
function slide(node, { delay = 0, duration = 400, easing = cubicOut } = {}) {
    const style = getComputedStyle(node);
    const opacity = +style.opacity;
    const height = parseFloat(style.height);
    const padding_top = parseFloat(style.paddingTop);
    const padding_bottom = parseFloat(style.paddingBottom);
    const margin_top = parseFloat(style.marginTop);
    const margin_bottom = parseFloat(style.marginBottom);
    const border_top_width = parseFloat(style.borderTopWidth);
    const border_bottom_width = parseFloat(style.borderBottomWidth);
    return {
        delay,
        duration,
        easing,
        css: (t) => `overflow: hidden;opacity: ${Math.min(t * 20, 1) * opacity};height: ${t * height}px;padding-top: ${t * padding_top}px;padding-bottom: ${t * padding_bottom}px;margin-top: ${t * margin_top}px;margin-bottom: ${t * margin_bottom}px;border-top-width: ${t * border_top_width}px;border-bottom-width: ${t * border_bottom_width}px;`
    };
}
__name(slide, "slide");
const s_DEFAULT_TRANSITION = /* @__PURE__ */ __name(() => void 0, "s_DEFAULT_TRANSITION");
const s_DEFAULT_TRANSITION_OPTIONS = {};
const TJSGlassPane_svelte_svelte_type_style_lang = "";

function create_fragment$H(ctx) {
    let div;
    let div_intro;
    let div_outro;
    let current;
    let mounted;
    let dispose;
    const default_slot_template = ctx[17].default;
    const default_slot = create_slot(default_slot_template, ctx, ctx[16], null);
    return {
        c() {
            div = element("div");
            if (default_slot)
                default_slot.c();
            attr(div, "id", ctx[4]);
            attr(div, "tabindex", "0");
            attr(div, "class", "tjs-glass-pane svelte-71db55");
        },
        m(target, anchor) {
            insert(target, div, anchor);
            if (default_slot) {
                default_slot.m(div, null);
            }
            ctx[18](div);
            current = true;
            if (!mounted) {
                dispose = listen(div, "keydown", ctx[6]);
                mounted = true;
            }
        },
        p(new_ctx, [dirty]) {
            ctx = new_ctx;
            if (default_slot) {
                if (default_slot.p && (!current || dirty & 65536)) {
                    update_slot_base(
                        default_slot,
                        default_slot_template,
                        ctx,
                        ctx[16],
                        !current ? get_all_dirty_from_scope(ctx[16]) : get_slot_changes(default_slot_template, ctx[16], dirty, null),
                        null
                    );
                }
            }
            if (!current || dirty & 16) {
                attr(div, "id", ctx[4]);
            }
        },
        i(local) {
            if (current)
                return;
            transition_in(default_slot, local);
            add_render_callback(() => {
                if (div_outro)
                    div_outro.end(1);
                div_intro = create_in_transition(div, ctx[0], ctx[2]);
                div_intro.start();
            });
            current = true;
        },
        o(local) {
            transition_out(default_slot, local);
            if (div_intro)
                div_intro.invalidate();
            div_outro = create_out_transition(div, ctx[1], ctx[3]);
            current = false;
        },
        d(detaching) {
            if (detaching)
                detach(div);
            if (default_slot)
                default_slot.d(detaching);
            ctx[18](null);
            if (detaching && div_outro)
                div_outro.end();
            mounted = false;
            dispose();
        }
    };
}

__name(create_fragment$H, "create_fragment$H");

function instance$G($$self, $$props, $$invalidate) {
    let { $$slots: slots = {}, $$scope } = $$props;
    let { id = void 0 } = $$props;
    let { zIndex = Number.MAX_SAFE_INTEGER } = $$props;
    let { background = "#50505080" } = $$props;
    let { captureInput = true } = $$props;
    let { preventDefault = true } = $$props;
    let { stopPropagation = true } = $$props;
    let glassPane;
    let { transition = void 0 } = $$props;
    let { inTransition = s_DEFAULT_TRANSITION } = $$props;
    let { outTransition = s_DEFAULT_TRANSITION } = $$props;
    let { transitionOptions = void 0 } = $$props;
    let { inTransitionOptions = s_DEFAULT_TRANSITION_OPTIONS } = $$props;
    let { outTransitionOptions = s_DEFAULT_TRANSITION_OPTIONS } = $$props;
    let oldTransition = void 0;
    let oldTransitionOptions = void 0;

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

    __name(swallow, "swallow");

    function div_binding($$value) {
        binding_callbacks[$$value ? "unshift" : "push"](() => {
            glassPane = $$value;
            $$invalidate(5, glassPane), $$invalidate(9, captureInput), $$invalidate(8, background), $$invalidate(7, zIndex);
        });
    }

    __name(div_binding, "div_binding");
    $$self.$$set = ($$props2) => {
        if ("id" in $$props2)
            $$invalidate(4, id = $$props2.id);
        if ("zIndex" in $$props2)
            $$invalidate(7, zIndex = $$props2.zIndex);
        if ("background" in $$props2)
            $$invalidate(8, background = $$props2.background);
        if ("captureInput" in $$props2)
            $$invalidate(9, captureInput = $$props2.captureInput);
        if ("preventDefault" in $$props2)
            $$invalidate(10, preventDefault = $$props2.preventDefault);
        if ("stopPropagation" in $$props2)
            $$invalidate(11, stopPropagation = $$props2.stopPropagation);
        if ("transition" in $$props2)
            $$invalidate(12, transition = $$props2.transition);
        if ("inTransition" in $$props2)
            $$invalidate(0, inTransition = $$props2.inTransition);
        if ("outTransition" in $$props2)
            $$invalidate(1, outTransition = $$props2.outTransition);
        if ("transitionOptions" in $$props2)
            $$invalidate(13, transitionOptions = $$props2.transitionOptions);
        if ("inTransitionOptions" in $$props2)
            $$invalidate(2, inTransitionOptions = $$props2.inTransitionOptions);
        if ("outTransitionOptions" in $$props2)
            $$invalidate(3, outTransitionOptions = $$props2.outTransitionOptions);
        if ("$$scope" in $$props2)
            $$invalidate(16, $$scope = $$props2.$$scope);
    };
    $$self.$$.update = () => {
        if ($$self.$$.dirty & 32) {
            if (glassPane) {
                $$invalidate(5, glassPane.style.maxWidth = "100%", glassPane);
                $$invalidate(5, glassPane.style.maxHeight = "100%", glassPane);
                $$invalidate(5, glassPane.style.width = "100%", glassPane);
                $$invalidate(5, glassPane.style.height = "100%", glassPane);
            }
        }
        if ($$self.$$.dirty & 544) {
            if (glassPane) {
                if (captureInput) {
                    glassPane.focus();
                }
                $$invalidate(5, glassPane.style.pointerEvents = captureInput ? "auto" : "none", glassPane);
            }
        }
        if ($$self.$$.dirty & 288) {
            if (glassPane) {
                $$invalidate(5, glassPane.style.background = background, glassPane);
            }
        }
        if ($$self.$$.dirty & 160) {
            if (glassPane) {
                $$invalidate(5, glassPane.style.zIndex = zIndex, glassPane);
            }
        }
        if ($$self.$$.dirty & 20480) {
            if (oldTransition !== transition) {
                const newTransition = s_DEFAULT_TRANSITION !== transition && typeof transition === "function" ? transition : s_DEFAULT_TRANSITION;
                $$invalidate(0, inTransition = newTransition);
                $$invalidate(1, outTransition = newTransition);
                $$invalidate(14, oldTransition = newTransition);
            }
        }
        if ($$self.$$.dirty & 40960) {
            if (oldTransitionOptions !== transitionOptions) {
                const newOptions = transitionOptions !== s_DEFAULT_TRANSITION_OPTIONS && typeof transitionOptions === "object" ? transitionOptions : s_DEFAULT_TRANSITION_OPTIONS;
                $$invalidate(2, inTransitionOptions = newOptions);
                $$invalidate(3, outTransitionOptions = newOptions);
                $$invalidate(15, oldTransitionOptions = newOptions);
            }
        }
        if ($$self.$$.dirty & 1) {
            if (typeof inTransition !== "function") {
                $$invalidate(0, inTransition = s_DEFAULT_TRANSITION);
            }
        }
        if ($$self.$$.dirty & 2) {
            if (typeof outTransition !== "function") {
                $$invalidate(1, outTransition = s_DEFAULT_TRANSITION);
            }
        }
        if ($$self.$$.dirty & 4) {
            if (typeof inTransitionOptions !== "object") {
                $$invalidate(2, inTransitionOptions = s_DEFAULT_TRANSITION_OPTIONS);
            }
        }
        if ($$self.$$.dirty & 8) {
            if (typeof outTransitionOptions !== "object") {
                $$invalidate(3, outTransitionOptions = s_DEFAULT_TRANSITION_OPTIONS);
            }
        }
    };
    return [
        inTransition,
        outTransition,
        inTransitionOptions,
    outTransitionOptions,
    id,
    glassPane,
    swallow,
    zIndex,
    background,
    captureInput,
    preventDefault,
    stopPropagation,
    transition,
    transitionOptions,
    oldTransition,
    oldTransitionOptions,
    $$scope,
    slots,
    div_binding
  ];
}

__name(instance$G, "instance$G");
class TJSGlassPane extends SvelteComponent {
  constructor(options) {
      super();
      init(this, options, instance$G, create_fragment$H, safe_not_equal, {
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
      });
  }
  get id() {
    return this.$$.ctx[4];
  }
  set id(id) {
    this.$$set({ id });
    flush();
  }
  get zIndex() {
    return this.$$.ctx[7];
  }
  set zIndex(zIndex) {
    this.$$set({ zIndex });
    flush();
  }
  get background() {
    return this.$$.ctx[8];
  }
  set background(background) {
    this.$$set({ background });
    flush();
  }
  get captureInput() {
    return this.$$.ctx[9];
  }
  set captureInput(captureInput) {
    this.$$set({ captureInput });
    flush();
  }
  get preventDefault() {
    return this.$$.ctx[10];
  }
  set preventDefault(preventDefault) {
    this.$$set({ preventDefault });
    flush();
  }
  get stopPropagation() {
    return this.$$.ctx[11];
  }
  set stopPropagation(stopPropagation) {
    this.$$set({ stopPropagation });
    flush();
  }
  get transition() {
    return this.$$.ctx[12];
  }
  set transition(transition) {
    this.$$set({ transition });
    flush();
  }
  get inTransition() {
    return this.$$.ctx[0];
  }
  set inTransition(inTransition) {
    this.$$set({ inTransition });
    flush();
  }
  get outTransition() {
    return this.$$.ctx[1];
  }
  set outTransition(outTransition) {
    this.$$set({ outTransition });
    flush();
  }
  get transitionOptions() {
    return this.$$.ctx[13];
  }
  set transitionOptions(transitionOptions) {
    this.$$set({ transitionOptions });
    flush();
  }
  get inTransitionOptions() {
    return this.$$.ctx[2];
  }
  set inTransitionOptions(inTransitionOptions) {
    this.$$set({ inTransitionOptions });
    flush();
  }
  get outTransitionOptions() {
    return this.$$.ctx[3];
  }
  set outTransitionOptions(outTransitionOptions) {
    this.$$set({ outTransitionOptions });
    flush();
  }
}
__name(TJSGlassPane, "TJSGlassPane");
function resizeObserver(node, target) {
  ResizeObserverManager.add(node, target);
  return {
    update: (newTarget) => {
      ResizeObserverManager.remove(node, target);
      target = newTarget;
      ResizeObserverManager.add(node, target);
    },
    destroy: () => {
      ResizeObserverManager.remove(node, target);
    }
  };
}
__name(resizeObserver, "resizeObserver");
resizeObserver.updateCache = function(el) {
  if (!(el instanceof HTMLElement)) {
    throw new TypeError(`resizeObserverUpdate error: 'el' is not an HTMLElement.`);
  }
  const subscribers = s_MAP.get(el);
  if (Array.isArray(subscribers)) {
    const computed = globalThis.getComputedStyle(el);
    const borderBottom = styleParsePixels(el.style.borderBottom) ?? styleParsePixels(computed.borderBottom) ?? 0;
    const borderLeft = styleParsePixels(el.style.borderLeft) ?? styleParsePixels(computed.borderLeft) ?? 0;
    const borderRight = styleParsePixels(el.style.borderRight) ?? styleParsePixels(computed.borderRight) ?? 0;
    const borderTop = styleParsePixels(el.style.borderTop) ?? styleParsePixels(computed.borderTop) ?? 0;
    const paddingBottom = styleParsePixels(el.style.paddingBottom) ?? styleParsePixels(computed.paddingBottom) ?? 0;
    const paddingLeft = styleParsePixels(el.style.paddingLeft) ?? styleParsePixels(computed.paddingLeft) ?? 0;
    const paddingRight = styleParsePixels(el.style.paddingRight) ?? styleParsePixels(computed.paddingRight) ?? 0;
    const paddingTop = styleParsePixels(el.style.paddingTop) ?? styleParsePixels(computed.paddingTop) ?? 0;
    const additionalWidth = borderLeft + borderRight + paddingLeft + paddingRight;
    const additionalHeight = borderTop + borderBottom + paddingTop + paddingBottom;
    for (const subscriber of subscribers) {
      subscriber.styles.additionalWidth = additionalWidth;
      subscriber.styles.additionalHeight = additionalHeight;
      s_UPDATE_SUBSCRIBER(subscriber, subscriber.contentWidth, subscriber.contentHeight);
    }
  }
};
const s_MAP = /* @__PURE__ */ new Map();
class ResizeObserverManager {
  static add(el, target) {
    const updateType = s_GET_UPDATE_TYPE(target);
    if (updateType === 0) {
      throw new Error(`'target' does not match supported ResizeObserverManager update mechanisms.`);
    }
    const computed = globalThis.getComputedStyle(el);
    const borderBottom = styleParsePixels(el.style.borderBottom) ?? styleParsePixels(computed.borderBottom) ?? 0;
    const borderLeft = styleParsePixels(el.style.borderLeft) ?? styleParsePixels(computed.borderLeft) ?? 0;
    const borderRight = styleParsePixels(el.style.borderRight) ?? styleParsePixels(computed.borderRight) ?? 0;
    const borderTop = styleParsePixels(el.style.borderTop) ?? styleParsePixels(computed.borderTop) ?? 0;
    const paddingBottom = styleParsePixels(el.style.paddingBottom) ?? styleParsePixels(computed.paddingBottom) ?? 0;
    const paddingLeft = styleParsePixels(el.style.paddingLeft) ?? styleParsePixels(computed.paddingLeft) ?? 0;
    const paddingRight = styleParsePixels(el.style.paddingRight) ?? styleParsePixels(computed.paddingRight) ?? 0;
    const paddingTop = styleParsePixels(el.style.paddingTop) ?? styleParsePixels(computed.paddingTop) ?? 0;
    const data = {
      updateType,
      target,
      contentWidth: 0,
      contentHeight: 0,
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
  static remove(el, target = void 0) {
    const subscribers = s_MAP.get(el);
    if (Array.isArray(subscribers)) {
      const index = subscribers.findIndex((entry) => entry.target === target);
      if (index >= 0) {
        s_UPDATE_SUBSCRIBER(subscribers[index], void 0, void 0);
        subscribers.splice(index, 1);
      }
      if (subscribers.length === 0) {
        s_MAP.delete(el);
        s_RESIZE_OBSERVER.unobserve(el);
      }
    }
  }
}
__name(ResizeObserverManager, "ResizeObserverManager");
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
const s_RESIZE_OBSERVER = new ResizeObserver((entries) => {
  for (const entry of entries) {
    const subscribers = s_MAP.get(entry?.target);
    if (Array.isArray(subscribers)) {
      const contentWidth = entry.contentRect.width;
      const contentHeight = entry.contentRect.height;
      for (const subscriber of subscribers) {
        s_UPDATE_SUBSCRIBER(subscriber, contentWidth, contentHeight);
      }
    }
  }
});
function s_GET_UPDATE_TYPE(target) {
  if (target?.resizeObserved instanceof Function) {
    return s_UPDATE_TYPES.resizeObserved;
  }
  if (target?.setDimension instanceof Function) {
    return s_UPDATE_TYPES.setDimension;
  }
  if (target?.setContentBounds instanceof Function) {
    return s_UPDATE_TYPES.setContentBounds;
  }
  const targetType = typeof target;
  if (targetType === "object" || targetType === "function") {
    if (isUpdatableStore(target.resizeObserved)) {
      return s_UPDATE_TYPES.storeObject;
    }
    const stores = target?.stores;
    if (typeof stores === "object" || typeof stores === "function") {
      if (isUpdatableStore(stores.resizeObserved)) {
        return s_UPDATE_TYPES.storesObject;
      }
    }
  }
  if (targetType === "object") {
    return s_UPDATE_TYPES.attribute;
  }
  if (targetType === "function") {
    return s_UPDATE_TYPES.function;
  }
  return s_UPDATE_TYPES.none;
}
__name(s_GET_UPDATE_TYPE, "s_GET_UPDATE_TYPE");
function s_UPDATE_SUBSCRIBER(subscriber, contentWidth, contentHeight) {
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
      target?.(offsetWidth, offsetHeight, contentWidth, contentHeight);
      break;
    case s_UPDATE_TYPES.resizeObserved:
      target.resizeObserved?.(offsetWidth, offsetHeight, contentWidth, contentHeight);
      break;
    case s_UPDATE_TYPES.setContentBounds:
      target.setContentBounds?.(contentWidth, contentHeight);
      break;
    case s_UPDATE_TYPES.setDimension:
      target.setDimension?.(offsetWidth, offsetHeight);
      break;
    case s_UPDATE_TYPES.storeObject:
      target.resizeObserved.update((object) => {
        object.contentHeight = contentHeight;
        object.contentWidth = contentWidth;
        object.offsetHeight = offsetHeight;
        object.offsetWidth = offsetWidth;
        return object;
      });
      break;
    case s_UPDATE_TYPES.storesObject:
      target.stores.resizeObserved.update((object) => {
        object.contentHeight = contentHeight;
        object.contentWidth = contentWidth;
        object.offsetHeight = offsetHeight;
        object.offsetWidth = offsetWidth;
        return object;
      });
      break;
  }
}
__name(s_UPDATE_SUBSCRIBER, "s_UPDATE_SUBSCRIBER");
function applyStyles(node, properties) {
  function setProperties() {
    if (typeof properties !== "object") {
      return;
    }
    for (const prop of Object.keys(properties)) {
      node.style.setProperty(`${prop}`, properties[prop]);
    }
  }
  __name(setProperties, "setProperties");
  setProperties();
  return {
    update(newProperties) {
      properties = newProperties;
      setProperties();
    }
  };
}
__name(applyStyles, "applyStyles");
function draggable(node, {
  position,
  active: active2 = true,
  button = 0,
  storeDragging = void 0,
  ease = false,
  easeOptions = { duration: 0.1, ease: cubicOut }
}) {
  let initialPosition = null;
  let initialDragPoint = {};
  let dragging = false;
  let quickTo = position.animate.quickTo(["top", "left"], easeOptions);
  const handlers = {
    dragDown: ["pointerdown", (e) => onDragPointerDown(e), false],
    dragMove: ["pointermove", (e) => onDragPointerChange(e), false],
    dragUp: ["pointerup", (e) => onDragPointerUp(e), false]
  };
  function activateListeners() {
    node.addEventListener(...handlers.dragDown);
    node.classList.add("draggable");
  }
  __name(activateListeners, "activateListeners");
  function removeListeners() {
    if (typeof storeDragging?.set === "function") {
      storeDragging.set(false);
    }
    node.removeEventListener(...handlers.dragDown);
    node.removeEventListener(...handlers.dragMove);
    node.removeEventListener(...handlers.dragUp);
    node.classList.remove("draggable");
  }
  __name(removeListeners, "removeListeners");
  if (active2) {
    activateListeners();
  }
  function onDragPointerDown(event) {
    if (event.button !== button || !event.isPrimary) {
      return;
    }
    event.preventDefault();
    dragging = false;
    initialPosition = position.get();
    initialDragPoint = { x: event.clientX, y: event.clientY };
    node.addEventListener(...handlers.dragMove);
    node.addEventListener(...handlers.dragUp);
    node.setPointerCapture(event.pointerId);
  }
  __name(onDragPointerDown, "onDragPointerDown");
  function onDragPointerChange(event) {
    if ((event.buttons & 1) === 0) {
      onDragPointerUp(event);
      return;
    }
    if (event.button !== -1 || !event.isPrimary) {
      return;
    }
    event.preventDefault();
    if (!dragging && typeof storeDragging?.set === "function") {
      dragging = true;
      storeDragging.set(true);
    }
    const newLeft = initialPosition.left + (event.clientX - initialDragPoint.x);
    const newTop = initialPosition.top + (event.clientY - initialDragPoint.y);
    if (ease) {
      quickTo(newTop, newLeft);
    } else {
      s_POSITION_DATA.left = newLeft;
      s_POSITION_DATA.top = newTop;
      position.set(s_POSITION_DATA);
    }
  }
  __name(onDragPointerChange, "onDragPointerChange");
  function onDragPointerUp(event) {
    event.preventDefault();
    dragging = false;
    if (typeof storeDragging?.set === "function") {
      storeDragging.set(false);
    }
    node.removeEventListener(...handlers.dragMove);
    node.removeEventListener(...handlers.dragUp);
  }
  __name(onDragPointerUp, "onDragPointerUp");
  return {
    update: (options) => {
      if (typeof options.active === "boolean") {
        active2 = options.active;
        if (active2) {
          activateListeners();
        } else {
          removeListeners();
        }
      }
      if (typeof options.button === "number") {
        button = options.button;
      }
      if (options.position !== void 0 && options.position !== position) {
        position = options.position;
        quickTo = position.animate.quickTo(["top", "left"], easeOptions);
      }
      if (typeof options.ease === "boolean") {
        ease = options.ease;
      }
      if (typeof options.easeOptions === "object") {
        easeOptions = options.easeOptions;
        quickTo.options(easeOptions);
      }
    },
    destroy: () => removeListeners()
  };
}
__name(draggable, "draggable");
class DraggableOptions {
  #ease = false;
  #easeOptions = { duration: 0.1, ease: cubicOut };
  #subscriptions = [];
  constructor({ ease, easeOptions } = {}) {
    Object.defineProperty(this, "ease", {
      get: () => {
        return this.#ease;
      },
      set: (newEase) => {
        if (typeof newEase !== "boolean") {
          throw new TypeError(`'ease' is not a boolean.`);
        }
        this.#ease = newEase;
        this.#updateSubscribers();
      },
      enumerable: true
    });
    Object.defineProperty(this, "easeOptions", {
      get: () => {
        return this.#easeOptions;
      },
      set: (newEaseOptions) => {
        if (newEaseOptions === null || typeof newEaseOptions !== "object") {
          throw new TypeError(`'easeOptions' is not an object.`);
        }
          if (newEaseOptions.duration !== void 0) {
              if (!Number.isFinite(newEaseOptions.duration)) {
                  throw new TypeError(`'easeOptions.duration' is not a finite number.`);
              }
              if (newEaseOptions.duration < 0) {
                  throw new Error(`'easeOptions.duration' is less than 0.`);
              }
              this.#easeOptions.duration = newEaseOptions.duration;
          }
          if (newEaseOptions.ease !== void 0) {
              if (typeof newEaseOptions.ease !== "function" && typeof newEaseOptions.ease !== "string") {
                  throw new TypeError(`'easeOptions.ease' is not a function or string.`);
              }
              this.#easeOptions.ease = newEaseOptions.ease;
          }
          this.#updateSubscribers();
      },
        enumerable: true
    });
      if (ease !== void 0) {
          this.ease = ease;
      }
      if (easeOptions !== void 0) {
          this.easeOptions = easeOptions;
      }
  }

    get easeDuration() {
        return this.#easeOptions.duration;
    }

    get easeValue() {
        return this.#easeOptions.ease;
    }

    set easeDuration(duration) {
        if (!Number.isFinite(duration)) {
            throw new TypeError(`'duration' is not a finite number.`);
        }
        if (duration < 0) {
            throw new Error(`'duration' is less than 0.`);
        }
        this.#easeOptions.duration = duration;
        this.#updateSubscribers();
    }

    set easeValue(value) {
        if (typeof value !== "function" && typeof value !== "string") {
            throw new TypeError(`'value' is not a function or string.`);
        }
        this.#easeOptions.ease = value;
        this.#updateSubscribers();
    }

    reset() {
        this.#ease = false;
        this.#easeOptions = { duration: 0.1, ease: cubicOut };
        this.#updateSubscribers();
    }

    resetEase() {
        this.#easeOptions = { duration: 0.1, ease: cubicOut };
        this.#updateSubscribers();
    }

    subscribe(handler) {
        this.#subscriptions.push(handler);
        handler(this);
        return () => {
            const index = this.#subscriptions.findIndex((sub) => sub === handler);
            if (index >= 0) {
                this.#subscriptions.splice(index, 1);
            }
        };
    }

    #updateSubscribers() {
        const subscriptions = this.#subscriptions;
        if (subscriptions.length > 0) {
            for (let cntr = 0; cntr < subscriptions.length; cntr++) {
                subscriptions[cntr](this);
            }
        }
    }
}
__name(DraggableOptions, "DraggableOptions");
draggable.options = (options) => new DraggableOptions(options);
const s_POSITION_DATA = { left: 0, top: 0 };
function localize(stringId, data) {
  const result = typeof data !== "object" ? game.i18n.localize(stringId) : game.i18n.format(stringId, data);
  return result !== void 0 ? result : "";
}
__name(localize, "localize");

function create_fragment$G(ctx) {
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
            t = text(ctx[2]);
            html_tag.a = t;
            attr(a, "class", a_class_value = "header-button " + ctx[0].class);
        },
        m(target, anchor) {
            insert(target, a, anchor);
            html_tag.m(ctx[1], a);
            append(a, t);
            if (!mounted) {
                dispose = [
                    listen(a, "click", stop_propagation(prevent_default(ctx[4])), true),
                    listen(a, "pointerdown", stop_propagation(prevent_default(pointerdown_handler)), true),
                    listen(a, "mousedown", stop_propagation(prevent_default(mousedown_handler)), true),
                    listen(a, "dblclick", stop_propagation(prevent_default(dblclick_handler$1)), true),
                    action_destroyer(applyStyles_action = applyStyles.call(null, a, ctx[3]))
                ];
                mounted = true;
            }
        },
        p(ctx2, [dirty]) {
            if (dirty & 2)
                html_tag.p(ctx2[1]);
            if (dirty & 4)
                set_data(t, ctx2[2]);
            if (dirty & 1 && a_class_value !== (a_class_value = "header-button " + ctx2[0].class)) {
                attr(a, "class", a_class_value);
            }
            if (applyStyles_action && is_function(applyStyles_action.update) && dirty & 8)
                applyStyles_action.update.call(null, ctx2[3]);
        },
        i: noop,
        o: noop,
        d(detaching) {
            if (detaching)
                detach(a);
            mounted = false;
            run_all(dispose);
        }
    };
}

__name(create_fragment$G, "create_fragment$G");
const s_REGEX_HTML$1 = /^\s*<.*>$/;
const pointerdown_handler = /* @__PURE__ */ __name(() => null, "pointerdown_handler");
const mousedown_handler = /* @__PURE__ */ __name(() => null, "mousedown_handler");
const dblclick_handler$1 = /* @__PURE__ */ __name(() => null, "dblclick_handler$1");

function instance$F($$self, $$props, $$invalidate) {
    let { button = void 0 } = $$props;
    let icon, label, title, styles;

    function onClick(event) {
        const invoke = button.callback ?? button.onclick;
        if (typeof invoke === "function") {
            invoke.call(button, event);
            $$invalidate(0, button);
        }
    }

    __name(onClick, "onClick");
    $$self.$$set = ($$props2) => {
        if ("button" in $$props2)
            $$invalidate(0, button = $$props2.button);
    };
    $$self.$$.update = () => {
        if ($$self.$$.dirty & 33) {
            if (button) {
                $$invalidate(5, title = typeof button.title === "string" ? localize(button.title) : "");
                $$invalidate(1, icon = typeof button.icon !== "string" ? void 0 : s_REGEX_HTML$1.test(button.icon) ? button.icon : `<i class="${button.icon}" title="${title}"></i>`);
                $$invalidate(2, label = typeof button.label === "string" ? localize(button.label) : "");
                $$invalidate(3, styles = typeof button.styles === "object" ? button.styles : void 0);
            }
        }
    };
    return [button, icon, label, styles, onClick, title];
}

__name(instance$F, "instance$F");
class TJSHeaderButton extends SvelteComponent {
  constructor(options) {
      super();
      init(this, options, instance$F, create_fragment$G, safe_not_equal, { button: 0 });
  }
  get button() {
    return this.$$.ctx[0];
  }
  set button(button) {
      this.$$set({ button });
      flush();
  }
}

__name(TJSHeaderButton, "TJSHeaderButton");
const TJSApplicationHeader_svelte_svelte_type_style_lang = "";

function get_each_context$l(ctx, list, i) {
    const child_ctx = ctx.slice();
    child_ctx[20] = list[i];
    return child_ctx;
}

__name(get_each_context$l, "get_each_context$l");

function create_each_block$l(ctx) {
    let switch_instance;
    let switch_instance_anchor;
    let current;
    const switch_instance_spread_levels = [ctx[20].props];
    var switch_value = ctx[20].class;

    function switch_props(ctx2) {
        let switch_instance_props = {};
        for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
            switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
        }
        return { props: switch_instance_props };
    }

    __name(switch_props, "switch_props");
    if (switch_value) {
        switch_instance = new switch_value(switch_props());
    }
    return {
        c() {
            if (switch_instance)
                create_component(switch_instance.$$.fragment);
            switch_instance_anchor = empty();
        },
        m(target, anchor) {
            if (switch_instance) {
                mount_component(switch_instance, target, anchor);
            }
            insert(target, switch_instance_anchor, anchor);
            current = true;
        },
        p(ctx2, dirty) {
            const switch_instance_changes = dirty & 8 ? get_spread_update(switch_instance_spread_levels, [get_spread_object(ctx2[20].props)]) : {};
            if (switch_value !== (switch_value = ctx2[20].class)) {
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
                }
                else {
                    switch_instance = null;
                }
            }
            else if (switch_value) {
                switch_instance.$set(switch_instance_changes);
            }
        },
        i(local) {
            if (current)
                return;
            if (switch_instance)
                transition_in(switch_instance.$$.fragment, local);
            current = true;
        },
        o(local) {
            if (switch_instance)
                transition_out(switch_instance.$$.fragment, local);
            current = false;
        },
        d(detaching) {
            if (detaching)
                detach(switch_instance_anchor);
            if (switch_instance)
                destroy_component(switch_instance, detaching);
        }
    };
}

__name(create_each_block$l, "create_each_block$l");

function create_key_block(ctx) {
    let header;
    let h4;
    let t0_value = localize(ctx[5]) + "";
    let t0;
    let t1;
    let draggable_action;
    let minimizable_action;
    let current;
    let mounted;
    let dispose;
    let each_value = ctx[3];
    let each_blocks = [];
    for (let i = 0; i < each_value.length; i += 1) {
        each_blocks[i] = create_each_block$l(get_each_context$l(ctx, each_value, i));
    }
    const out = /* @__PURE__ */ __name((i) => transition_out(each_blocks[i], 1, 1, () => {
        each_blocks[i] = null;
  }), "out");
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
      set_style(h4, "display", ctx[2], false);
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
        dispose = [
          action_destroyer(draggable_action = ctx[0].call(null, header, ctx[1])),
          action_destroyer(minimizable_action = ctx[12].call(null, header, ctx[4]))
        ];
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if ((!current || dirty & 32) && t0_value !== (t0_value = localize(ctx2[5]) + ""))
        set_data(t0, t0_value);
      if (dirty & 4) {
        set_style(h4, "display", ctx2[2], false);
      }
      if (dirty & 8) {
        each_value = ctx2[3];
        let i;
        for (i = 0; i < each_value.length; i += 1) {
            const child_ctx = get_each_context$l(ctx2, each_value, i);
          if (each_blocks[i]) {
            each_blocks[i].p(child_ctx, dirty);
            transition_in(each_blocks[i], 1);
          } else {
              each_blocks[i] = create_each_block$l(child_ctx);
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
      if (draggable_action && is_function(draggable_action.update) && dirty & 2)
        draggable_action.update.call(null, ctx2[1]);
      if (minimizable_action && is_function(minimizable_action.update) && dirty & 16)
        minimizable_action.update.call(null, ctx2[4]);
    },
    i(local) {
      if (current)
        return;
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
      if (detaching)
        detach(header);
      destroy_each(each_blocks, detaching);
      mounted = false;
      run_all(dispose);
    }
  };
}
__name(create_key_block, "create_key_block");

function create_fragment$F(ctx) {
    let previous_key = ctx[0];
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
        p(ctx2, [dirty]) {
            if (dirty & 1 && safe_not_equal(previous_key, previous_key = ctx2[0])) {
                group_outros();
                transition_out(key_block, 1, 1, noop);
                check_outros();
                key_block = create_key_block(ctx2);
                key_block.c();
                transition_in(key_block, 1);
                key_block.m(key_block_anchor.parentNode, key_block_anchor);
            }
            else {
                key_block.p(ctx2, dirty);
            }
        },
        i(local) {
            if (current)
                return;
            transition_in(key_block);
            current = true;
        },
        o(local) {
            transition_out(key_block);
            current = false;
        },
        d(detaching) {
            if (detaching)
                detach(key_block_anchor);
            key_block.d(detaching);
        }
    };
}

__name(create_fragment$F, "create_fragment$F");

function instance$E($$self, $$props, $$invalidate) {
    let $storeHeaderButtons;
    let $storeMinimized;
    let $storeHeaderNoTitleMinimized;
    let $storeDraggable;
    let $storeMinimizable;
    let $storeTitle;
    let { draggable: draggable$1 = void 0 } = $$props;
    let { draggableOptions = void 0 } = $$props;
    const application = getContext("external").application;
    const storeTitle = application.reactive.storeAppOptions.title;
    component_subscribe($$self, storeTitle, (value) => $$invalidate(5, $storeTitle = value));
    const storeDraggable = application.reactive.storeAppOptions.draggable;
    component_subscribe($$self, storeDraggable, (value) => $$invalidate(17, $storeDraggable = value));
    const storeDragging = application.reactive.storeUIState.dragging;
    const storeHeaderButtons = application.reactive.storeUIState.headerButtons;
    component_subscribe($$self, storeHeaderButtons, (value) => $$invalidate(14, $storeHeaderButtons = value));
    const storeHeaderNoTitleMinimized = application.reactive.storeAppOptions.headerNoTitleMinimized;
    component_subscribe($$self, storeHeaderNoTitleMinimized, (value) => $$invalidate(16, $storeHeaderNoTitleMinimized = value));
    const storeMinimizable = application.reactive.storeAppOptions.minimizable;
    component_subscribe($$self, storeMinimizable, (value) => $$invalidate(4, $storeMinimizable = value));
    const storeMinimized = application.reactive.storeUIState.minimized;
    component_subscribe($$self, storeMinimized, (value) => $$invalidate(15, $storeMinimized = value));
    let dragOptions;
    let displayHeaderTitle;
    let buttons;

    function minimizable(node, booleanStore) {
        const callback = application._onToggleMinimize.bind(application);

        function activateListeners() {
            node.addEventListener("dblclick", callback);
        }

        __name(activateListeners, "activateListeners");

        function removeListeners() {
            node.removeEventListener("dblclick", callback);
        }

        __name(removeListeners, "removeListeners");
        if (booleanStore) {
            activateListeners();
        }
        return {
            update: (booleanStore2) => {
                if (booleanStore2) {
                    activateListeners();
                }
                else {
                    removeListeners();
                }
            },
            destroy: () => removeListeners()
        };
    }

    __name(minimizable, "minimizable");
    $$self.$$set = ($$props2) => {
        if ("draggable" in $$props2)
            $$invalidate(0, draggable$1 = $$props2.draggable);
        if ("draggableOptions" in $$props2)
            $$invalidate(13, draggableOptions = $$props2.draggableOptions);
    };
    $$self.$$.update = () => {
        if ($$self.$$.dirty & 1) {
            $$invalidate(0, draggable$1 = typeof draggable$1 === "function" ? draggable$1 : draggable);
        }
        if ($$self.$$.dirty & 139264) {
            $$invalidate(1, dragOptions = Object.assign(
                {},
                {
                    ease: true,
                    easeOptions: { duration: 0.1, ease: cubicOut }
                },
                typeof draggableOptions === "object" ? draggableOptions : {},
                {
                    position: application.position,
                    active: $storeDraggable,
                    storeDragging
                }
            ));
        }
        if ($$self.$$.dirty & 98304) {
            $$invalidate(2, displayHeaderTitle = $storeHeaderNoTitleMinimized && $storeMinimized ? "none" : null);
        }
        if ($$self.$$.dirty & 16384) {
            {
                $$invalidate(3, buttons = $storeHeaderButtons.reduce(
                    (array, button) => {
                        array.push(isSvelteComponent(button) ? { class: button, props: {} } : {
                            class: TJSHeaderButton,
                            props: { button }
                        });
                        return array;
                    },
                    []
                ));
            }
        }
    };
    return [
        draggable$1,
        dragOptions,
        displayHeaderTitle,
        buttons,
        $storeMinimizable,
        $storeTitle,
        storeTitle,
        storeDraggable,
        storeHeaderButtons,
        storeHeaderNoTitleMinimized,
        storeMinimizable,
        storeMinimized,
        minimizable,
        draggableOptions,
        $storeHeaderButtons,
        $storeMinimized,
        $storeHeaderNoTitleMinimized,
        $storeDraggable
    ];
}

__name(instance$E, "instance$E");

class TJSApplicationHeader extends SvelteComponent {
    constructor(options) {
        super();
        init(this, options, instance$E, create_fragment$F, safe_not_equal, { draggable: 0, draggableOptions: 13 });
    }
}

__name(TJSApplicationHeader, "TJSApplicationHeader");

function create_fragment$E(ctx) {
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
            ctx[10](div);
            if (!mounted) {
                dispose = action_destroyer(resizable_action = ctx[6].call(null, div, {
                    active: ctx[1],
                    storeResizing: ctx[5]
                }));
                mounted = true;
            }
        },
        p(ctx2, [dirty]) {
            if (resizable_action && is_function(resizable_action.update) && dirty & 2)
                resizable_action.update.call(null, {
                    active: ctx2[1],
                    storeResizing: ctx2[5]
                });
        },
        i: noop,
        o: noop,
        d(detaching) {
            if (detaching)
                detach(div);
            ctx[10](null);
            mounted = false;
            dispose();
        }
    };
}

__name(create_fragment$E, "create_fragment$E");

function instance$D($$self, $$props, $$invalidate) {
    let $storeElementRoot;
    let $storeMinimized;
    let $storeResizable;
    let { isResizable = false } = $$props;
    const application = getContext("external").application;
    const storeElementRoot = getContext("storeElementRoot");
    component_subscribe($$self, storeElementRoot, (value) => $$invalidate(8, $storeElementRoot = value));
    const storeResizable = application.reactive.storeAppOptions.resizable;
    component_subscribe($$self, storeResizable, (value) => $$invalidate(1, $storeResizable = value));
    const storeMinimized = application.reactive.storeUIState.minimized;
    component_subscribe($$self, storeMinimized, (value) => $$invalidate(9, $storeMinimized = value));
    const storeResizing = application.reactive.storeUIState.resizing;
    let elementResize;

    function resizable(node, { active: active2 = true, storeResizing: storeResizing2 = void 0 } = {}) {
        let position = null;
        let initialPosition = {};
        let resizing = false;
        const handlers = {
            resizeDown: ["pointerdown", (e) => onResizePointerDown(e), false],
            resizeMove: ["pointermove", (e) => onResizePointerMove(e), false],
            resizeUp: ["pointerup", (e) => onResizePointerUp(e), false]
        };

        function activateListeners() {
            node.addEventListener(...handlers.resizeDown);
            $$invalidate(7, isResizable = true);
            node.style.display = "block";
        }

        __name(activateListeners, "activateListeners");

        function removeListeners() {
            if (typeof storeResizing2?.set === "function") {
                storeResizing2.set(false);
            }
            node.removeEventListener(...handlers.resizeDown);
            node.removeEventListener(...handlers.resizeMove);
            node.removeEventListener(...handlers.resizeUp);
            node.style.display = "none";
            $$invalidate(7, isResizable = false);
        }

        __name(removeListeners, "removeListeners");
        if (active2) {
            activateListeners();
        }
        else {
            node.style.display = "none";
        }

        function onResizePointerDown(event) {
            event.preventDefault();
            resizing = false;
            position = application.position.get();
            if (position.height === "auto") {
                position.height = $storeElementRoot.clientHeight;
            }
            if (position.width === "auto") {
                position.width = $storeElementRoot.clientWidth;
            }
            initialPosition = { x: event.clientX, y: event.clientY };
            node.addEventListener(...handlers.resizeMove);
            node.addEventListener(...handlers.resizeUp);
            node.setPointerCapture(event.pointerId);
        }

        __name(onResizePointerDown, "onResizePointerDown");

        function onResizePointerMove(event) {
            event.preventDefault();
            if (!resizing && typeof storeResizing2?.set === "function") {
                resizing = true;
                storeResizing2.set(true);
            }
            application.position.set({
                width: position.width + (event.clientX - initialPosition.x),
                height: position.height + (event.clientY - initialPosition.y)
            });
        }

        __name(onResizePointerMove, "onResizePointerMove");

        function onResizePointerUp(event) {
            resizing = false;
            if (typeof storeResizing2?.set === "function") {
                storeResizing2.set(false);
            }
            event.preventDefault();
            node.removeEventListener(...handlers.resizeMove);
            node.removeEventListener(...handlers.resizeUp);
            application._onResize(event);
        }

        __name(onResizePointerUp, "onResizePointerUp");
        return {
            update: ({ active: active3 }) => {
                if (active3) {
                    activateListeners();
                }
                else {
                    removeListeners();
                }
            },
            destroy: () => removeListeners()
        };
    }

    __name(resizable, "resizable");

    function div_binding($$value) {
        binding_callbacks[$$value ? "unshift" : "push"](() => {
            elementResize = $$value;
            $$invalidate(0, elementResize), $$invalidate(7, isResizable), $$invalidate(9, $storeMinimized), $$invalidate(8, $storeElementRoot);
        });
    }

    __name(div_binding, "div_binding");
    $$self.$$set = ($$props2) => {
        if ("isResizable" in $$props2)
            $$invalidate(7, isResizable = $$props2.isResizable);
    };
    $$self.$$.update = () => {
        if ($$self.$$.dirty & 897) {
            if (elementResize) {
                $$invalidate(0, elementResize.style.display = isResizable && !$storeMinimized ? "block" : "none", elementResize);
                const elementRoot = $storeElementRoot;
                if (elementRoot) {
                    elementRoot.classList[isResizable ? "add" : "remove"]("resizable");
                }
            }
        }
    };
    return [
        elementResize,
        $storeResizable,
        storeElementRoot,
        storeResizable,
        storeMinimized,
        storeResizing,
        resizable,
        isResizable,
        $storeElementRoot,
        $storeMinimized,
        div_binding
    ];
}

__name(instance$D, "instance$D");
class ResizableHandle extends SvelteComponent {
  constructor(options) {
      super();
      init(this, options, instance$D, create_fragment$E, safe_not_equal, { isResizable: 7 });
  }
}
__name(ResizableHandle, "ResizableHandle");
const ApplicationShell_svelte_svelte_type_style_lang = "";

function create_else_block$4(ctx) {
    let current;
    const default_slot_template = ctx[27].default;
    const default_slot = create_slot(default_slot_template, ctx, ctx[26], null);
    return {
        c() {
            if (default_slot)
                default_slot.c();
        },
        m(target, anchor) {
            if (default_slot) {
                default_slot.m(target, anchor);
            }
            current = true;
        },
        p(ctx2, dirty) {
            if (default_slot) {
                if (default_slot.p && (!current || dirty & 67108864)) {
                    update_slot_base(
                        default_slot,
                        default_slot_template,
                        ctx2,
                        ctx2[26],
                        !current ? get_all_dirty_from_scope(ctx2[26]) : get_slot_changes(default_slot_template, ctx2[26], dirty, null),
                        null
                    );
                }
            }
        },
        i(local) {
            if (current)
                return;
            transition_in(default_slot, local);
            current = true;
        },
        o(local) {
            transition_out(default_slot, local);
            current = false;
        },
        d(detaching) {
            if (default_slot)
                default_slot.d(detaching);
        }
    };
}

__name(create_else_block$4, "create_else_block$4");

function create_if_block$h(ctx) {
    let tjscontainer;
    let current;
    tjscontainer = new TJSContainer({
        props: { children: ctx[14] }
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
            if (current)
                return;
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

__name(create_if_block$h, "create_if_block$h");

function create_fragment$D(ctx) {
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
            draggable: ctx[6],
            draggableOptions: ctx[7]
        }
    });
    const if_block_creators = [create_if_block$h, create_else_block$4];
    const if_blocks = [];

    function select_block_type(ctx2, dirty) {
        if (Array.isArray(ctx2[14]))
            return 0;
        return 1;
    }

    __name(select_block_type, "select_block_type");
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
            attr(div, "id", div_id_value = ctx[10].id);
            attr(div, "class", div_class_value = "app window-app " + ctx[10].options.classes.join(" ") + " svelte-are4no");
            attr(div, "data-appid", div_data_appid_value = ctx[10].appId);
        },
        m(target, anchor) {
            insert(target, div, anchor);
            mount_component(tjsapplicationheader, div, null);
            append(div, t0);
            append(div, section);
            if_blocks[current_block_type_index].m(section, null);
            ctx[28](section);
            append(div, t1);
            mount_component(resizablehandle, div, null);
            ctx[29](div);
            current = true;
            if (!mounted) {
                dispose = [
                    action_destroyer(applyStyles_action = applyStyles.call(null, section, ctx[9])),
                    action_destroyer(ctx[12].call(null, section, ctx[15])),
                    listen(div, "pointerdown", ctx[13], true),
                    action_destroyer(applyStyles_action_1 = applyStyles.call(null, div, ctx[8])),
                    action_destroyer(ctx[11].call(null, div, ctx[16]))
                ];
                mounted = true;
            }
        },
        p(new_ctx, [dirty]) {
            ctx = new_ctx;
            const tjsapplicationheader_changes = {};
            if (dirty & 64)
                tjsapplicationheader_changes.draggable = ctx[6];
            if (dirty & 128)
                tjsapplicationheader_changes.draggableOptions = ctx[7];
            tjsapplicationheader.$set(tjsapplicationheader_changes);
            if_block.p(ctx, dirty);
            if (applyStyles_action && is_function(applyStyles_action.update) && dirty & 512)
                applyStyles_action.update.call(null, ctx[9]);
            if (!current || dirty & 1024 && div_id_value !== (div_id_value = ctx[10].id)) {
                attr(div, "id", div_id_value);
            }
            if (!current || dirty & 1024 && div_class_value !== (div_class_value = "app window-app " + ctx[10].options.classes.join(" ") + " svelte-are4no")) {
                attr(div, "class", div_class_value);
            }
            if (!current || dirty & 1024 && div_data_appid_value !== (div_data_appid_value = ctx[10].appId)) {
                attr(div, "data-appid", div_data_appid_value);
            }
            if (applyStyles_action_1 && is_function(applyStyles_action_1.update) && dirty & 256)
                applyStyles_action_1.update.call(null, ctx[8]);
        },
        i(local) {
            if (current)
                return;
            transition_in(tjsapplicationheader.$$.fragment, local);
            transition_in(if_block);
            transition_in(resizablehandle.$$.fragment, local);
            add_render_callback(() => {
                if (div_outro)
                    div_outro.end(1);
                div_intro = create_in_transition(div, ctx[2], ctx[4]);
                div_intro.start();
            });
            current = true;
        },
        o(local) {
            transition_out(tjsapplicationheader.$$.fragment, local);
            transition_out(if_block);
            transition_out(resizablehandle.$$.fragment, local);
            if (div_intro)
                div_intro.invalidate();
            div_outro = create_out_transition(div, ctx[3], ctx[5]);
            current = false;
        },
        d(detaching) {
            if (detaching)
                detach(div);
            destroy_component(tjsapplicationheader);
            if_blocks[current_block_type_index].d();
            ctx[28](null);
            destroy_component(resizablehandle);
            ctx[29](null);
            if (detaching && div_outro)
                div_outro.end();
            mounted = false;
            run_all(dispose);
        }
    };
}

__name(create_fragment$D, "create_fragment$D");

function instance$C($$self, $$props, $$invalidate) {
    let { $$slots: slots = {}, $$scope } = $$props;
    let { elementContent = void 0 } = $$props;
    let { elementRoot = void 0 } = $$props;
    let { draggable: draggable2 = void 0 } = $$props;
    let { draggableOptions = void 0 } = $$props;
    let { children: children2 = void 0 } = $$props;
    let { stylesApp = void 0 } = $$props;
    let { stylesContent = void 0 } = $$props;
    let { appOffsetHeight = false } = $$props;
    let { appOffsetWidth = false } = $$props;
    const appResizeObserver = !!appOffsetHeight || !!appOffsetWidth ? resizeObserver : () => null;
    let { contentOffsetHeight = false } = $$props;
    let { contentOffsetWidth = false } = $$props;
    const contentResizeObserver = !!contentOffsetHeight || !!contentOffsetWidth ? resizeObserver : () => null;
    const bringToTop = /* @__PURE__ */ __name((event) => {
        if (typeof application.options.popOut === "boolean" && application.options.popOut) {
            if (application !== ui?.activeWindow) {
                application.bringToTop.call(application);
            }
            if (document.activeElement !== document.body && event.target !== document.activeElement) {
                if (document.activeElement instanceof HTMLElement) {
                    document.activeElement.blur();
                }
                document.body.focus();
            }
        }
    }, "bringToTop");
    if (!getContext("storeElementContent")) {
        setContext("storeElementContent", writable(elementContent));
    }
    if (!getContext("storeElementRoot")) {
        setContext("storeElementRoot", writable(elementRoot));
    }
    const context = getContext("external");
    const application = context.application;
    const allChildren = Array.isArray(children2) ? children2 : typeof context === "object" ? context.children : void 0;
    let { transition = void 0 } = $$props;
    let { inTransition = s_DEFAULT_TRANSITION } = $$props;
    let { outTransition = s_DEFAULT_TRANSITION } = $$props;
    let { transitionOptions = void 0 } = $$props;
    let { inTransitionOptions = s_DEFAULT_TRANSITION_OPTIONS } = $$props;
    let { outTransitionOptions = s_DEFAULT_TRANSITION_OPTIONS } = $$props;
    let oldTransition = void 0;
    let oldTransitionOptions = void 0;

    function resizeObservedContent(offsetWidth, offsetHeight) {
        $$invalidate(20, contentOffsetWidth = offsetWidth);
        $$invalidate(19, contentOffsetHeight = offsetHeight);
    }

    __name(resizeObservedContent, "resizeObservedContent");

    function resizeObservedApp(offsetWidth, offsetHeight, contentWidth, contentHeight) {
        application.position.stores.resizeObserved.update((object) => {
            object.contentWidth = contentWidth;
            object.contentHeight = contentHeight;
            object.offsetWidth = offsetWidth;
            object.offsetHeight = offsetHeight;
            return object;
        });
        $$invalidate(17, appOffsetHeight = offsetHeight);
        $$invalidate(18, appOffsetWidth = offsetWidth);
    }

    __name(resizeObservedApp, "resizeObservedApp");

    function section_binding($$value) {
        binding_callbacks[$$value ? "unshift" : "push"](() => {
            elementContent = $$value;
            $$invalidate(0, elementContent);
        });
    }

    __name(section_binding, "section_binding");

    function div_binding($$value) {
        binding_callbacks[$$value ? "unshift" : "push"](() => {
            elementRoot = $$value;
            $$invalidate(1, elementRoot);
        });
    }

    __name(div_binding, "div_binding");
    $$self.$$set = ($$props2) => {
        if ("elementContent" in $$props2)
            $$invalidate(0, elementContent = $$props2.elementContent);
        if ("elementRoot" in $$props2)
            $$invalidate(1, elementRoot = $$props2.elementRoot);
        if ("draggable" in $$props2)
            $$invalidate(6, draggable2 = $$props2.draggable);
        if ("draggableOptions" in $$props2)
            $$invalidate(7, draggableOptions = $$props2.draggableOptions);
        if ("children" in $$props2)
            $$invalidate(21, children2 = $$props2.children);
        if ("stylesApp" in $$props2)
            $$invalidate(8, stylesApp = $$props2.stylesApp);
        if ("stylesContent" in $$props2)
            $$invalidate(9, stylesContent = $$props2.stylesContent);
        if ("appOffsetHeight" in $$props2)
            $$invalidate(17, appOffsetHeight = $$props2.appOffsetHeight);
        if ("appOffsetWidth" in $$props2)
            $$invalidate(18, appOffsetWidth = $$props2.appOffsetWidth);
        if ("contentOffsetHeight" in $$props2)
            $$invalidate(19, contentOffsetHeight = $$props2.contentOffsetHeight);
        if ("contentOffsetWidth" in $$props2)
            $$invalidate(20, contentOffsetWidth = $$props2.contentOffsetWidth);
        if ("transition" in $$props2)
            $$invalidate(22, transition = $$props2.transition);
        if ("inTransition" in $$props2)
            $$invalidate(2, inTransition = $$props2.inTransition);
        if ("outTransition" in $$props2)
            $$invalidate(3, outTransition = $$props2.outTransition);
        if ("transitionOptions" in $$props2)
            $$invalidate(23, transitionOptions = $$props2.transitionOptions);
        if ("inTransitionOptions" in $$props2)
            $$invalidate(4, inTransitionOptions = $$props2.inTransitionOptions);
        if ("outTransitionOptions" in $$props2)
            $$invalidate(5, outTransitionOptions = $$props2.outTransitionOptions);
        if ("$$scope" in $$props2)
            $$invalidate(26, $$scope = $$props2.$$scope);
    };
    $$self.$$.update = () => {
        if ($$self.$$.dirty & 1) {
            if (elementContent !== void 0 && elementContent !== null) {
                getContext("storeElementContent").set(elementContent);
            }
        }
        if ($$self.$$.dirty & 2) {
            if (elementRoot !== void 0 && elementRoot !== null) {
                getContext("storeElementRoot").set(elementRoot);
            }
        }
        if ($$self.$$.dirty & 20971520) {
            if (oldTransition !== transition) {
                const newTransition = s_DEFAULT_TRANSITION !== transition && typeof transition === "function" ? transition : s_DEFAULT_TRANSITION;
                $$invalidate(2, inTransition = newTransition);
                $$invalidate(3, outTransition = newTransition);
                $$invalidate(24, oldTransition = newTransition);
      }
    }
    if ($$self.$$.dirty & 41943040) {
      if (oldTransitionOptions !== transitionOptions) {
        const newOptions = transitionOptions !== s_DEFAULT_TRANSITION_OPTIONS && typeof transitionOptions === "object" ? transitionOptions : s_DEFAULT_TRANSITION_OPTIONS;
        $$invalidate(4, inTransitionOptions = newOptions);
        $$invalidate(5, outTransitionOptions = newOptions);
        $$invalidate(25, oldTransitionOptions = newOptions);
      }
    }
    if ($$self.$$.dirty & 4) {
      if (typeof inTransition !== "function") {
        $$invalidate(2, inTransition = s_DEFAULT_TRANSITION);
      }
    }
    if ($$self.$$.dirty & 1032) {
      {
        if (typeof outTransition !== "function") {
          $$invalidate(3, outTransition = s_DEFAULT_TRANSITION);
        }
        if (application && typeof application?.options?.defaultCloseAnimation === "boolean") {
          $$invalidate(10, application.options.defaultCloseAnimation = outTransition === s_DEFAULT_TRANSITION, application);
        }
      }
    }
    if ($$self.$$.dirty & 16) {
      if (typeof inTransitionOptions !== "object") {
        $$invalidate(4, inTransitionOptions = s_DEFAULT_TRANSITION_OPTIONS);
      }
    }
    if ($$self.$$.dirty & 32) {
      if (typeof outTransitionOptions !== "object") {
        $$invalidate(5, outTransitionOptions = s_DEFAULT_TRANSITION_OPTIONS);
      }
    }
  };
  return [
    elementContent,
    elementRoot,
    inTransition,
    outTransition,
    inTransitionOptions,
    outTransitionOptions,
    draggable2,
    draggableOptions,
    stylesApp,
    stylesContent,
    application,
    appResizeObserver,
    contentResizeObserver,
    bringToTop,
    allChildren,
    resizeObservedContent,
    resizeObservedApp,
    appOffsetHeight,
    appOffsetWidth,
    contentOffsetHeight,
    contentOffsetWidth,
    children2,
    transition,
    transitionOptions,
    oldTransition,
    oldTransitionOptions,
    $$scope,
    slots,
    section_binding,
    div_binding
  ];
}

__name(instance$C, "instance$C");
class ApplicationShell extends SvelteComponent {
  constructor(options) {
      super();
      init(this, options, instance$C, create_fragment$D, safe_not_equal, {
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
      });
  }
  get elementContent() {
    return this.$$.ctx[0];
  }
  set elementContent(elementContent) {
    this.$$set({ elementContent });
    flush();
  }
  get elementRoot() {
    return this.$$.ctx[1];
  }
  set elementRoot(elementRoot) {
    this.$$set({ elementRoot });
    flush();
  }
  get draggable() {
    return this.$$.ctx[6];
  }
  set draggable(draggable2) {
    this.$$set({ draggable: draggable2 });
    flush();
  }
  get draggableOptions() {
    return this.$$.ctx[7];
  }
  set draggableOptions(draggableOptions) {
    this.$$set({ draggableOptions });
    flush();
  }
  get children() {
    return this.$$.ctx[21];
  }
  set children(children2) {
    this.$$set({ children: children2 });
    flush();
  }
  get stylesApp() {
    return this.$$.ctx[8];
  }
  set stylesApp(stylesApp) {
    this.$$set({ stylesApp });
    flush();
  }
  get stylesContent() {
    return this.$$.ctx[9];
  }
  set stylesContent(stylesContent) {
    this.$$set({ stylesContent });
    flush();
  }
  get appOffsetHeight() {
    return this.$$.ctx[17];
  }
  set appOffsetHeight(appOffsetHeight) {
    this.$$set({ appOffsetHeight });
    flush();
  }
  get appOffsetWidth() {
    return this.$$.ctx[18];
  }
  set appOffsetWidth(appOffsetWidth) {
    this.$$set({ appOffsetWidth });
    flush();
  }
  get contentOffsetHeight() {
    return this.$$.ctx[19];
  }
  set contentOffsetHeight(contentOffsetHeight) {
    this.$$set({ contentOffsetHeight });
    flush();
  }
  get contentOffsetWidth() {
    return this.$$.ctx[20];
  }
  set contentOffsetWidth(contentOffsetWidth) {
    this.$$set({ contentOffsetWidth });
    flush();
  }
  get transition() {
    return this.$$.ctx[22];
  }
  set transition(transition) {
    this.$$set({ transition });
    flush();
  }
  get inTransition() {
    return this.$$.ctx[2];
  }
  set inTransition(inTransition) {
    this.$$set({ inTransition });
    flush();
  }
  get outTransition() {
    return this.$$.ctx[3];
  }
  set outTransition(outTransition) {
    this.$$set({ outTransition });
    flush();
  }
  get transitionOptions() {
    return this.$$.ctx[23];
  }
  set transitionOptions(transitionOptions) {
    this.$$set({ transitionOptions });
    flush();
  }
  get inTransitionOptions() {
    return this.$$.ctx[4];
  }
  set inTransitionOptions(inTransitionOptions) {
    this.$$set({ inTransitionOptions });
    flush();
  }
  get outTransitionOptions() {
    return this.$$.ctx[5];
  }
  set outTransitionOptions(outTransitionOptions) {
    this.$$set({ outTransitionOptions });
    flush();
  }
}
__name(ApplicationShell, "ApplicationShell");
const TJSApplicationShell_svelte_svelte_type_style_lang = "";
const DialogContent_svelte_svelte_type_style_lang = "";

function get_each_context$k(ctx, list, i) {
    const child_ctx = ctx.slice();
    child_ctx[15] = list[i];
    return child_ctx;
}

__name(get_each_context$k, "get_each_context$k");
function create_if_block_3$3(ctx) {
    let switch_instance;
    let switch_instance_anchor;
    let current;
    const switch_instance_spread_levels = [ctx[5]];
    var switch_value = ctx[4];

    function switch_props(ctx2) {
        let switch_instance_props = {};
        for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
            switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
        }
        return { props: switch_instance_props };
    }

    __name(switch_props, "switch_props");
    if (switch_value) {
        switch_instance = new switch_value(switch_props());
        ctx[12](switch_instance);
    }
    return {
        c() {
            if (switch_instance)
                create_component(switch_instance.$$.fragment);
            switch_instance_anchor = empty();
        },
        m(target, anchor) {
            if (switch_instance) {
                mount_component(switch_instance, target, anchor);
            }
            insert(target, switch_instance_anchor, anchor);
            current = true;
        },
        p(ctx2, dirty) {
            const switch_instance_changes = dirty & 32 ? get_spread_update(switch_instance_spread_levels, [get_spread_object(ctx2[5])]) : {};
            if (switch_value !== (switch_value = ctx2[4])) {
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
                    ctx2[12](switch_instance);
                    create_component(switch_instance.$$.fragment);
                    transition_in(switch_instance.$$.fragment, 1);
                    mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
                }
                else {
                    switch_instance = null;
                }
            }
            else if (switch_value) {
                switch_instance.$set(switch_instance_changes);
            }
        },
        i(local) {
            if (current)
                return;
            if (switch_instance)
                transition_in(switch_instance.$$.fragment, local);
            current = true;
        },
        o(local) {
            if (switch_instance)
                transition_out(switch_instance.$$.fragment, local);
            current = false;
        },
        d(detaching) {
            ctx[12](null);
            if (detaching)
                detach(switch_instance_anchor);
            if (switch_instance)
                destroy_component(switch_instance, detaching);
        }
    };
}
__name(create_if_block_3$3, "create_if_block_3$3");
function create_if_block_2$3(ctx) {
    let html_tag;
    let html_anchor;
    return {
        c() {
            html_tag = new HtmlTag(false);
            html_anchor = empty();
            html_tag.a = html_anchor;
        },
        m(target, anchor) {
            html_tag.m(ctx[2], target, anchor);
            insert(target, html_anchor, anchor);
        },
        p(ctx2, dirty) {
            if (dirty & 4)
                html_tag.p(ctx2[2]);
        },
        i: noop,
        o: noop,
        d(detaching) {
            if (detaching)
                detach(html_anchor);
            if (detaching)
                html_tag.d();
        }
    };
}
__name(create_if_block_2$3, "create_if_block_2$3");

function create_if_block$g(ctx) {
    let div;
    let each_blocks = [];
    let each_1_lookup = /* @__PURE__ */ new Map();
    let each_value = ctx[1];
    const get_key = /* @__PURE__ */ __name((ctx2) => ctx2[15].id, "get_key");
    for (let i = 0; i < each_value.length; i += 1) {
        let child_ctx = get_each_context$k(ctx, each_value, i);
        let key = get_key(child_ctx);
        each_1_lookup.set(key, each_blocks[i] = create_each_block$k(key, child_ctx));
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
        p(ctx2, dirty) {
            if (dirty & 74) {
                each_value = ctx2[1];
                each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx2, each_value, each_1_lookup, div, destroy_block, create_each_block$k, null, get_each_context$k);
            }
        },
        d(detaching) {
            if (detaching)
                detach(div);
            for (let i = 0; i < each_blocks.length; i += 1) {
                each_blocks[i].d();
            }
        }
    };
}

__name(create_if_block$g, "create_if_block$g");

function create_if_block_1$6(ctx) {
    let html_tag;
    let raw_value = ctx[15].icon + "";
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
        p(ctx2, dirty) {
            if (dirty & 2 && raw_value !== (raw_value = ctx2[15].icon + ""))
                html_tag.p(raw_value);
        },
        d(detaching) {
            if (detaching)
                detach(html_anchor);
            if (detaching)
                html_tag.d();
        }
    };
}

__name(create_if_block_1$6, "create_if_block_1$6");

function create_each_block$k(key_1, ctx) {
    let button;
    let span;
    let t0_value = ctx[15].label + "";
    let t0;
    let span_title_value;
    let t1;
    let button_class_value;
    let applyStyles_action;
    let mounted;
    let dispose;
    let if_block = ctx[15].icon && create_if_block_1$6(ctx);

    function click_handler2() {
        return ctx[13](ctx[15]);
    }

    __name(click_handler2, "click_handler");
    return {
        key: key_1,
        first: null,
        c() {
            button = element("button");
            span = element("span");
            if (if_block)
                if_block.c();
            t0 = text(t0_value);
            t1 = space();
            attr(span, "title", span_title_value = ctx[15].title);
            attr(button, "class", button_class_value = "dialog-button " + ctx[15].id);
            toggle_class(button, "default", ctx[15].id === ctx[3]);
            this.first = button;
        },
        m(target, anchor) {
            insert(target, button, anchor);
            append(button, span);
            if (if_block)
                if_block.m(span, null);
            append(span, t0);
            append(button, t1);
            if (!mounted) {
                dispose = [
                    listen(button, "click", click_handler2),
                    action_destroyer(applyStyles_action = applyStyles.call(null, button, ctx[15].styles))
                ];
                mounted = true;
            }
        },
        p(new_ctx, dirty) {
            ctx = new_ctx;
            if (ctx[15].icon) {
                if (if_block) {
                    if_block.p(ctx, dirty);
                }
                else {
                    if_block = create_if_block_1$6(ctx);
                    if_block.c();
                    if_block.m(span, t0);
                }
            }
            else if (if_block) {
                if_block.d(1);
                if_block = null;
            }
            if (dirty & 2 && t0_value !== (t0_value = ctx[15].label + ""))
                set_data(t0, t0_value);
            if (dirty & 2 && span_title_value !== (span_title_value = ctx[15].title)) {
                attr(span, "title", span_title_value);
            }
            if (dirty & 2 && button_class_value !== (button_class_value = "dialog-button " + ctx[15].id)) {
                attr(button, "class", button_class_value);
            }
            if (applyStyles_action && is_function(applyStyles_action.update) && dirty & 2)
                applyStyles_action.update.call(null, ctx[15].styles);
            if (dirty & 10) {
                toggle_class(button, "default", ctx[15].id === ctx[3]);
            }
        },
        d(detaching) {
            if (detaching)
                detach(button);
            if (if_block)
                if_block.d();
            mounted = false;
            run_all(dispose);
        }
    };
}

__name(create_each_block$k, "create_each_block$k");

function create_fragment$C(ctx) {
    let t0;
    let div;
    let current_block_type_index;
    let if_block0;
    let t1;
    let if_block1_anchor;
    let current;
    let mounted;
    let dispose;
    const if_block_creators = [create_if_block_2$3, create_if_block_3$3];
    const if_blocks = [];

    function select_block_type(ctx2, dirty) {
        if (typeof ctx2[2] === "string")
            return 0;
        if (ctx2[4])
            return 1;
        return -1;
    }

    __name(select_block_type, "select_block_type");
    if (~(current_block_type_index = select_block_type(ctx))) {
        if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    }
    let if_block1 = ctx[1].length && create_if_block$g(ctx);
    return {
        c() {
            t0 = space();
            div = element("div");
            if (if_block0)
                if_block0.c();
            t1 = space();
            if (if_block1)
                if_block1.c();
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
            if (if_block1)
                if_block1.m(target, anchor);
            insert(target, if_block1_anchor, anchor);
            current = true;
            if (!mounted) {
                dispose = listen(document.body, "keydown", ctx[7]);
                mounted = true;
            }
        },
        p(ctx2, [dirty]) {
            let previous_block_index = current_block_type_index;
            current_block_type_index = select_block_type(ctx2);
            if (current_block_type_index === previous_block_index) {
                if (~current_block_type_index) {
                    if_blocks[current_block_type_index].p(ctx2, dirty);
                }
            }
            else {
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
                        if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx2);
                        if_block0.c();
                    }
                    else {
                        if_block0.p(ctx2, dirty);
                    }
                    transition_in(if_block0, 1);
                    if_block0.m(div, null);
                }
                else {
                    if_block0 = null;
                }
            }
            if (ctx2[1].length) {
                if (if_block1) {
                    if_block1.p(ctx2, dirty);
                }
                else {
                    if_block1 = create_if_block$g(ctx2);
                    if_block1.c();
                    if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
                }
            }
            else if (if_block1) {
                if_block1.d(1);
                if_block1 = null;
            }
        },
        i(local) {
            if (current)
                return;
            transition_in(if_block0);
            current = true;
        },
        o(local) {
            transition_out(if_block0);
            current = false;
        },
        d(detaching) {
            if (detaching)
                detach(t0);
            if (detaching)
                detach(div);
            if (~current_block_type_index) {
                if_blocks[current_block_type_index].d();
            }
            if (detaching)
                detach(t1);
            if (if_block1)
                if_block1.d(detaching);
            if (detaching)
                detach(if_block1_anchor);
            mounted = false;
            dispose();
        }
    };
}

__name(create_fragment$C, "create_fragment$C");
const s_REGEX_HTML = /^\s*<.*>$/;

function instance$B($$self, $$props, $$invalidate) {
    let { data = {} } = $$props;
    let { autoClose = true } = $$props;
    let { preventDefault = false } = $$props;
    let { stopPropagation = false } = $$props;
    let { dialogInstance = void 0 } = $$props;
    let buttons;
    let content = void 0;
    let dialogComponent;
    let dialogProps = {};
    let application = getContext("external").application;
    let currentButtonId = data.default;

    async function onClick(button) {
        try {
            let result = null;
            const invoke = button.callback ?? button.onclick;
            switch (typeof invoke) {
                case "function":
                    result = await invoke(
                        application.options.jQuery ? application.element : application.element[0],
                        dialogInstance
                    );
                    break;
                case "string":
                    if (dialogInstance !== void 0 && typeof dialogInstance[invoke] === "function") {
                        result = await dialogInstance[invoke](
                            application.options.jQuery ? application.element : application.element[0],
                            dialogInstance
                        );
                    }
                    break;
            }
            if (autoClose) {
                setTimeout(() => application.close(), 0);
            }
            return result;
        } catch (err) {
            ui.notifications.error(err);
            throw new Error(err);
        }
    }

    __name(onClick, "onClick");

    function onKeydown(event) {
        if (event.key !== "Escape" && ui.activeWindow !== application) {
            return;
        }
        switch (event.key) {
            case "ArrowLeft": {
                event.preventDefault();
                event.stopPropagation();
                const currentIndex = buttons.findIndex((button) => button.id === currentButtonId);
                if (buttons.length && currentIndex > 0) {
                    $$invalidate(3, currentButtonId = buttons[currentIndex - 1].id);
                }
                break;
            }
            case "ArrowRight": {
                event.preventDefault();
                event.stopPropagation();
                const currentIndex = buttons.findIndex((button) => button.id === currentButtonId);
                if (buttons.length && currentIndex < buttons.length - 1) {
                    $$invalidate(3, currentButtonId = buttons[currentIndex + 1].id);
                }
                break;
            }
            case "Escape":
                event.preventDefault();
                event.stopPropagation();
                return application.close();
            case "Enter":
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

    __name(onKeydown, "onKeydown");

    function switch_instance_binding($$value) {
        binding_callbacks[$$value ? "unshift" : "push"](() => {
            dialogInstance = $$value;
            $$invalidate(0, dialogInstance);
        });
    }

    __name(switch_instance_binding, "switch_instance_binding");
    const click_handler2 = /* @__PURE__ */ __name((button) => onClick(button), "click_handler");
    $$self.$$set = ($$props2) => {
        if ("data" in $$props2)
            $$invalidate(8, data = $$props2.data);
        if ("autoClose" in $$props2)
            $$invalidate(9, autoClose = $$props2.autoClose);
        if ("preventDefault" in $$props2)
            $$invalidate(10, preventDefault = $$props2.preventDefault);
        if ("stopPropagation" in $$props2)
            $$invalidate(11, stopPropagation = $$props2.stopPropagation);
        if ("dialogInstance" in $$props2)
            $$invalidate(0, dialogInstance = $$props2.dialogInstance);
    };
    $$self.$$.update = () => {
        if ($$self.$$.dirty & 256) {
            {
                $$invalidate(1, buttons = !isObject(data.buttons) ? [] : Object.keys(data.buttons).reduce(
                    (array, key) => {
                        const b = data.buttons[key];
                        const icon = typeof b.icon !== "string" ? void 0 : s_REGEX_HTML.test(b.icon) ? b.icon : `<i class="${b.icon}"></i>`;
                        const label = typeof b.label === "string" ? `${icon !== void 0 ? " " : ""}${localize(b.label)}` : "";
                        const title = typeof b.title === "string" ? localize(b.title) : void 0;
                        const condition = typeof b.condition === "function" ? b.condition.call(b) : b.condition ?? true;
                        if (condition) {
                            array.push({ ...b, id: key, icon, label, title });
                        }
                        return array;
                    },
                    []
                ));
            }
        }
        if ($$self.$$.dirty & 10) {
            if (!buttons.find((button) => button.id === currentButtonId)) {
                $$invalidate(3, currentButtonId = void 0);
            }
        }
    if ($$self.$$.dirty & 260) {
      if (content !== data.content) {
        $$invalidate(2, content = data.content);
        try {
          if (isSvelteComponent(content)) {
            $$invalidate(4, dialogComponent = content);
            $$invalidate(5, dialogProps = {});
          } else if (typeof content === "object") {
            const svelteConfig = parseSvelteConfig(content, application);
            $$invalidate(4, dialogComponent = svelteConfig.class);
            $$invalidate(5, dialogProps = svelteConfig.props ?? {});
            const children2 = svelteConfig?.context?.get("external")?.children;
            if (Array.isArray(children2)) {
              $$invalidate(5, dialogProps.children = children2, dialogProps);
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
  return [
    dialogInstance,
    buttons,
    content,
    currentButtonId,
    dialogComponent,
    dialogProps,
    onClick,
    onKeydown,
    data,
    autoClose,
    preventDefault,
    stopPropagation,
    switch_instance_binding,
    click_handler2
  ];
}

__name(instance$B, "instance$B");
class DialogContent extends SvelteComponent {
  constructor(options) {
      super();
      init(this, options, instance$B, create_fragment$C, safe_not_equal, {
          data: 8,
          autoClose: 9,
          preventDefault: 10,
          stopPropagation: 11,
          dialogInstance: 0
      });
  }
}
__name(DialogContent, "DialogContent");

function create_else_block$3(ctx) {
    let applicationshell;
    let updating_elementRoot;
    let updating_elementContent;
    let current;
    const applicationshell_spread_levels = [ctx[6], { appOffsetHeight: true }];

    function applicationshell_elementRoot_binding_1(value) {
        ctx[16](value);
    }

    __name(applicationshell_elementRoot_binding_1, "applicationshell_elementRoot_binding_1");

    function applicationshell_elementContent_binding_1(value) {
        ctx[17](value);
    }

    __name(applicationshell_elementContent_binding_1, "applicationshell_elementContent_binding_1");
    let applicationshell_props = {
        $$slots: { default: [create_default_slot_2] },
        $$scope: { ctx }
    };
    for (let i = 0; i < applicationshell_spread_levels.length; i += 1) {
        applicationshell_props = assign(applicationshell_props, applicationshell_spread_levels[i]);
    }
    if (ctx[1] !== void 0) {
        applicationshell_props.elementRoot = ctx[1];
    }
    if (ctx[0] !== void 0) {
        applicationshell_props.elementContent = ctx[0];
    }
    applicationshell = new ApplicationShell({ props: applicationshell_props });
    binding_callbacks.push(() => bind(applicationshell, "elementRoot", applicationshell_elementRoot_binding_1));
    binding_callbacks.push(() => bind(applicationshell, "elementContent", applicationshell_elementContent_binding_1));
    return {
        c() {
            create_component(applicationshell.$$.fragment);
        },
        m(target, anchor) {
            mount_component(applicationshell, target, anchor);
            current = true;
        },
        p(ctx2, dirty) {
            const applicationshell_changes = dirty & 64 ? get_spread_update(applicationshell_spread_levels, [
                get_spread_object(ctx2[6]),
                applicationshell_spread_levels[1]
            ]) : {};
            if (dirty & 1049100) {
                applicationshell_changes.$$scope = { dirty, ctx: ctx2 };
            }
            if (!updating_elementRoot && dirty & 2) {
                updating_elementRoot = true;
                applicationshell_changes.elementRoot = ctx2[1];
                add_flush_callback(() => updating_elementRoot = false);
            }
            if (!updating_elementContent && dirty & 1) {
                updating_elementContent = true;
                applicationshell_changes.elementContent = ctx2[0];
                add_flush_callback(() => updating_elementContent = false);
            }
            applicationshell.$set(applicationshell_changes);
        },
        i(local) {
            if (current) {
                return;
            }
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

__name(create_else_block$3, "create_else_block$3");

function create_if_block$f(ctx) {
    let tjsglasspane;
    let current;
    const tjsglasspane_spread_levels = [
        {
            id: `${ctx[4].id}-glasspane`
        },
        { preventDefault: false },
        { stopPropagation: false },
        ctx[7],
        { zIndex: ctx[8] }
    ];
    let tjsglasspane_props = {
        $$slots: { default: [create_default_slot$8] },
        $$scope: { ctx }
    };
    for (let i = 0; i < tjsglasspane_spread_levels.length; i += 1) {
        tjsglasspane_props = assign(tjsglasspane_props, tjsglasspane_spread_levels[i]);
    }
    tjsglasspane = new TJSGlassPane({ props: tjsglasspane_props });
    return {
        c() {
            create_component(tjsglasspane.$$.fragment);
        },
        m(target, anchor) {
            mount_component(tjsglasspane, target, anchor);
            current = true;
        },
        p(ctx2, dirty) {
            const tjsglasspane_changes = dirty & 400 ? get_spread_update(tjsglasspane_spread_levels, [
                dirty & 16 && {
                    id: `${ctx2[4].id}-glasspane`
                },
                tjsglasspane_spread_levels[1],
                tjsglasspane_spread_levels[2],
                dirty & 128 && get_spread_object(ctx2[7]),
                dirty & 256 && { zIndex: ctx2[8] }
            ]) : {};
            if (dirty & 1049167) {
                tjsglasspane_changes.$$scope = { dirty, ctx: ctx2 };
            }
            tjsglasspane.$set(tjsglasspane_changes);
        },
        i(local) {
            if (current) {
                return;
            }
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
}

__name(create_if_block$f, "create_if_block$f");

function create_default_slot_2(ctx) {
    let dialogcontent;
    let updating_autoClose;
    let updating_dialogInstance;
    let current;

    function dialogcontent_autoClose_binding_1(value) {
        ctx[14](value);
    }

    __name(dialogcontent_autoClose_binding_1, "dialogcontent_autoClose_binding_1");

    function dialogcontent_dialogInstance_binding_1(value) {
        ctx[15](value);
    }

    __name(dialogcontent_dialogInstance_binding_1, "dialogcontent_dialogInstance_binding_1");
    let dialogcontent_props = { data: ctx[3] };
    if (ctx[9] !== void 0) {
        dialogcontent_props.autoClose = ctx[9];
    }
    if (ctx[2] !== void 0) {
        dialogcontent_props.dialogInstance = ctx[2];
    }
    dialogcontent = new DialogContent({ props: dialogcontent_props });
    binding_callbacks.push(() => bind(dialogcontent, "autoClose", dialogcontent_autoClose_binding_1));
    binding_callbacks.push(() => bind(dialogcontent, "dialogInstance", dialogcontent_dialogInstance_binding_1));
    return {
        c() {
            create_component(dialogcontent.$$.fragment);
        },
        m(target, anchor) {
            mount_component(dialogcontent, target, anchor);
            current = true;
        },
        p(ctx2, dirty) {
            const dialogcontent_changes = {};
            if (dirty & 8) {
                dialogcontent_changes.data = ctx2[3];
            }
            if (!updating_autoClose && dirty & 512) {
                updating_autoClose = true;
                dialogcontent_changes.autoClose = ctx2[9];
                add_flush_callback(() => updating_autoClose = false);
            }
            if (!updating_dialogInstance && dirty & 4) {
                updating_dialogInstance = true;
                dialogcontent_changes.dialogInstance = ctx2[2];
                add_flush_callback(() => updating_dialogInstance = false);
            }
            dialogcontent.$set(dialogcontent_changes);
        },
        i(local) {
            if (current) {
                return;
            }
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
}

__name(create_default_slot_2, "create_default_slot_2");
function create_default_slot_1(ctx) {
    let dialogcontent;
    let updating_autoClose;
    let updating_dialogInstance;
    let current;

    function dialogcontent_autoClose_binding(value) {
        ctx[10](value);
    }

    __name(dialogcontent_autoClose_binding, "dialogcontent_autoClose_binding");

    function dialogcontent_dialogInstance_binding(value) {
        ctx[11](value);
    }

    __name(dialogcontent_dialogInstance_binding, "dialogcontent_dialogInstance_binding");
    let dialogcontent_props = {
        stopPropagation: true,
        data: ctx[3]
    };
    if (ctx[9] !== void 0) {
        dialogcontent_props.autoClose = ctx[9];
    }
    if (ctx[2] !== void 0) {
        dialogcontent_props.dialogInstance = ctx[2];
    }
    dialogcontent = new DialogContent({ props: dialogcontent_props });
    binding_callbacks.push(() => bind(dialogcontent, "autoClose", dialogcontent_autoClose_binding));
    binding_callbacks.push(() => bind(dialogcontent, "dialogInstance", dialogcontent_dialogInstance_binding));
    return {
        c() {
            create_component(dialogcontent.$$.fragment);
        },
        m(target, anchor) {
            mount_component(dialogcontent, target, anchor);
            current = true;
        },
        p(ctx2, dirty) {
            const dialogcontent_changes = {};
            if (dirty & 8)
                dialogcontent_changes.data = ctx2[3];
            if (!updating_autoClose && dirty & 512) {
                updating_autoClose = true;
                dialogcontent_changes.autoClose = ctx2[9];
                add_flush_callback(() => updating_autoClose = false);
            }
            if (!updating_dialogInstance && dirty & 4) {
                updating_dialogInstance = true;
                dialogcontent_changes.dialogInstance = ctx2[2];
                add_flush_callback(() => updating_dialogInstance = false);
            }
            dialogcontent.$set(dialogcontent_changes);
        },
        i(local) {
            if (current)
                return;
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
}
__name(create_default_slot_1, "create_default_slot_1");
function create_default_slot$8(ctx) {
    let applicationshell;
    let updating_elementRoot;
    let updating_elementContent;
    let current;
    const applicationshell_spread_levels = [ctx[6], { appOffsetHeight: true }];

    function applicationshell_elementRoot_binding(value) {
        ctx[12](value);
    }

    __name(applicationshell_elementRoot_binding, "applicationshell_elementRoot_binding");

    function applicationshell_elementContent_binding(value) {
        ctx[13](value);
    }

    __name(applicationshell_elementContent_binding, "applicationshell_elementContent_binding");
    let applicationshell_props = {
        $$slots: { default: [create_default_slot_1] },
        $$scope: { ctx }
    };
    for (let i = 0; i < applicationshell_spread_levels.length; i += 1) {
        applicationshell_props = assign(applicationshell_props, applicationshell_spread_levels[i]);
    }
    if (ctx[1] !== void 0) {
        applicationshell_props.elementRoot = ctx[1];
    }
    if (ctx[0] !== void 0) {
        applicationshell_props.elementContent = ctx[0];
    }
    applicationshell = new ApplicationShell({ props: applicationshell_props });
    binding_callbacks.push(() => bind(applicationshell, "elementRoot", applicationshell_elementRoot_binding));
    binding_callbacks.push(() => bind(applicationshell, "elementContent", applicationshell_elementContent_binding));
    return {
        c() {
            create_component(applicationshell.$$.fragment);
        },
        m(target, anchor) {
            mount_component(applicationshell, target, anchor);
            current = true;
        },
        p(ctx2, dirty) {
            const applicationshell_changes = dirty & 64 ? get_spread_update(applicationshell_spread_levels, [
                get_spread_object(ctx2[6]),
                applicationshell_spread_levels[1]
            ]) : {};
            if (dirty & 1049100) {
                applicationshell_changes.$$scope = { dirty, ctx: ctx2 };
            }
            if (!updating_elementRoot && dirty & 2) {
                updating_elementRoot = true;
                applicationshell_changes.elementRoot = ctx2[1];
                add_flush_callback(() => updating_elementRoot = false);
            }
            if (!updating_elementContent && dirty & 1) {
                updating_elementContent = true;
                applicationshell_changes.elementContent = ctx2[0];
                add_flush_callback(() => updating_elementContent = false);
            }
            applicationshell.$set(applicationshell_changes);
        },
        i(local) {
            if (current)
                return;
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
__name(create_default_slot$8, "create_default_slot$8");

function create_fragment$B(ctx) {
    let current_block_type_index;
    let if_block;
    let if_block_anchor;
    let current;
    const if_block_creators = [create_if_block$f, create_else_block$3];
    const if_blocks = [];

    function select_block_type(ctx2, dirty) {
        if (ctx2[5])
            return 0;
        return 1;
    }

    __name(select_block_type, "select_block_type");
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
        p(ctx2, [dirty]) {
            let previous_block_index = current_block_type_index;
            current_block_type_index = select_block_type(ctx2);
            if (current_block_type_index === previous_block_index) {
                if_blocks[current_block_type_index].p(ctx2, dirty);
            }
            else {
                group_outros();
                transition_out(if_blocks[previous_block_index], 1, 1, () => {
                    if_blocks[previous_block_index] = null;
                });
                check_outros();
                if_block = if_blocks[current_block_type_index];
                if (!if_block) {
                    if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx2);
                    if_block.c();
                }
                else {
                    if_block.p(ctx2, dirty);
                }
                transition_in(if_block, 1);
                if_block.m(if_block_anchor.parentNode, if_block_anchor);
            }
        },
        i(local) {
            if (current)
                return;
            transition_in(if_block);
            current = true;
        },
        o(local) {
            transition_out(if_block);
            current = false;
        },
        d(detaching) {
            if_blocks[current_block_type_index].d(detaching);
            if (detaching)
                detach(if_block_anchor);
        }
    };
}

__name(create_fragment$B, "create_fragment$B");
const s_MODAL_BACKGROUND = "#50505080";

function instance$A($$self, $$props, $$invalidate) {
    let { elementContent = void 0 } = $$props;
    let { elementRoot = void 0 } = $$props;
    let { data = {} } = $$props;
    let { dialogComponent = void 0 } = $$props;
    const application = getContext("external").application;
    const s_MODAL_TRANSITION = fade;
    const s_MODAL_TRANSITION_OPTIONS = { duration: 200 };
    let modal = void 0;
    const appProps = {
        transition: void 0,
        inTransition: void 0,
        outTransition: void 0,
        transitionOptions: void 0,
        inTransitionOptions: void 0,
        outTransitionOptions: void 0,
        stylesApp: void 0,
        stylesContent: void 0
    };
    const modalProps = {
        background: void 0,
        transition: void 0,
        inTransition: void 0,
        outTransition: void 0,
        transitionOptions: void 0,
        inTransitionOptions: void 0,
        outTransitionOptions: void 0
    };
    let zIndex = void 0;
    let autoClose = true;
    if (modal === void 0) {
        modal = typeof data?.modal === "boolean" ? data.modal : false;
    }

    function dialogcontent_autoClose_binding(value) {
        autoClose = value;
        $$invalidate(9, autoClose), $$invalidate(3, data), $$invalidate(5, modal), $$invalidate(8, zIndex), $$invalidate(4, application);
    }

    __name(dialogcontent_autoClose_binding, "dialogcontent_autoClose_binding");

    function dialogcontent_dialogInstance_binding(value) {
        dialogComponent = value;
        $$invalidate(2, dialogComponent);
    }

    __name(dialogcontent_dialogInstance_binding, "dialogcontent_dialogInstance_binding");

    function applicationshell_elementRoot_binding(value) {
        elementRoot = value;
        $$invalidate(1, elementRoot);
    }

    __name(applicationshell_elementRoot_binding, "applicationshell_elementRoot_binding");

    function applicationshell_elementContent_binding(value) {
        elementContent = value;
        $$invalidate(0, elementContent);
    }

    __name(applicationshell_elementContent_binding, "applicationshell_elementContent_binding");

    function dialogcontent_autoClose_binding_1(value) {
        autoClose = value;
        $$invalidate(9, autoClose), $$invalidate(3, data), $$invalidate(5, modal), $$invalidate(8, zIndex), $$invalidate(4, application);
    }

    __name(dialogcontent_autoClose_binding_1, "dialogcontent_autoClose_binding_1");

    function dialogcontent_dialogInstance_binding_1(value) {
        dialogComponent = value;
        $$invalidate(2, dialogComponent);
    }

    __name(dialogcontent_dialogInstance_binding_1, "dialogcontent_dialogInstance_binding_1");

    function applicationshell_elementRoot_binding_1(value) {
        elementRoot = value;
        $$invalidate(1, elementRoot);
    }

    __name(applicationshell_elementRoot_binding_1, "applicationshell_elementRoot_binding_1");

    function applicationshell_elementContent_binding_1(value) {
        elementContent = value;
        $$invalidate(0, elementContent);
    }

    __name(applicationshell_elementContent_binding_1, "applicationshell_elementContent_binding_1");
    $$self.$$set = ($$props2) => {
        if ("elementContent" in $$props2)
            $$invalidate(0, elementContent = $$props2.elementContent);
        if ("elementRoot" in $$props2)
            $$invalidate(1, elementRoot = $$props2.elementRoot);
        if ("data" in $$props2)
            $$invalidate(3, data = $$props2.data);
        if ("dialogComponent" in $$props2)
            $$invalidate(2, dialogComponent = $$props2.dialogComponent);
    };
    $$self.$$.update = () => {
        if ($$self.$$.dirty & 312) {
            if (typeof data === "object") {
                $$invalidate(9, autoClose = typeof data.autoClose === "boolean" ? data.autoClose : true);
                const newZIndex = Number.isInteger(data.zIndex) || data.zIndex === null ? data.zIndex : modal ? Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER - 1;
                if (zIndex !== newZIndex) {
                    $$invalidate(8, zIndex = newZIndex);
                }
                const newDraggable = data.draggable ?? true;
                if (application.reactive.draggable !== newDraggable) {
                    $$invalidate(4, application.reactive.draggable = newDraggable, application);
                }
                const newPopOut = data.popOut ?? true;
                if (application.reactive.popOut !== newPopOut) {
                    $$invalidate(4, application.reactive.popOut = newPopOut, application);
                }
                const newResizable = data.resizable ?? false;
                if (application.reactive.resizable !== newResizable) {
                    $$invalidate(4, application.reactive.resizable = newResizable, application);
                }
                const newTitle = data.title ?? "Dialog";
                if (newTitle !== application?.options?.title) {
                    $$invalidate(4, application.reactive.title = newTitle, application);
                }
                if (application.position.zIndex !== zIndex) {
                    $$invalidate(4, application.position.zIndex = zIndex, application);
                }
            }
        }
        if ($$self.$$.dirty & 72) {
            if (typeof data?.transition === "object") {
                const d = data.transition;
                if (d?.transition !== appProps.transition) {
                    $$invalidate(6, appProps.transition = d.transition, appProps);
                }
                if (d?.inTransition !== appProps.inTransition) {
                    $$invalidate(6, appProps.inTransition = d.inTransition, appProps);
                }
                if (d?.outTransition !== appProps.outTransition) {
                    $$invalidate(6, appProps.outTransition = d.outTransition, appProps);
                }
                if (d?.transitionOptions !== appProps.transitionOptions) {
                    $$invalidate(6, appProps.transitionOptions = d.transitionOptions, appProps);
                }
                if (d?.inTransitionOptions !== appProps.inTransitionOptions) {
                    $$invalidate(6, appProps.inTransitionOptions = d.inTransitionOptions, appProps);
                }
                if (d?.outTransitionOptions !== appProps.outTransitionOptions) {
          $$invalidate(6, appProps.outTransitionOptions = d.outTransitionOptions, appProps);
        }
      }
    }
    if ($$self.$$.dirty & 136) {
      {
        const newModalBackground = typeof data?.modalOptions?.background === "string" ? data.modalOptions.background : s_MODAL_BACKGROUND;
        if (newModalBackground !== modalProps.background) {
          $$invalidate(7, modalProps.background = newModalBackground, modalProps);
        }
      }
    }
    if ($$self.$$.dirty & 136) {
      if (typeof data?.modalOptions?.transition === "object") {
        const d = data.modalOptions.transition;
        if (d?.transition !== modalProps.transition) {
          $$invalidate(
            7,
            modalProps.transition = typeof d?.transition === "function" ? d.transition : s_MODAL_TRANSITION,
            modalProps
          );
        }
        if (d?.inTransition !== modalProps.inTransition) {
          $$invalidate(7, modalProps.inTransition = d.inTransition, modalProps);
        }
        if (d?.outTransition !== modalProps.outTransition) {
          $$invalidate(7, modalProps.outTransition = d.outTransition, modalProps);
        }
        if (d?.transitionOptions !== modalProps.transitionOptions) {
          $$invalidate(
            7,
            modalProps.transitionOptions = typeof d?.transitionOptions === "object" ? d.transitionOptions : s_MODAL_TRANSITION_OPTIONS,
            modalProps
          );
        }
        if (d?.inTransitionOptions !== modalProps.inTransitionOptions) {
          $$invalidate(7, modalProps.inTransitionOptions = d.inTransitionOptions, modalProps);
        }
        if (d?.outTransitionOptions !== modalProps.outTransitionOptions) {
          $$invalidate(7, modalProps.outTransitionOptions = d.outTransitionOptions, modalProps);
        }
      } else {
        const newModalTransition = typeof data?.modalOptions?.transition?.transition === "function" ? data.modalOptions.transition.transition : s_MODAL_TRANSITION;
        if (newModalTransition !== modalProps.transition) {
          $$invalidate(7, modalProps.transition = newModalTransition, modalProps);
        }
        const newModalTransitionOptions = typeof data?.modalOptions?.transitionOptions === "object" ? data.modalOptions.transitionOptions : s_MODAL_TRANSITION_OPTIONS;
        if (newModalTransitionOptions !== modalProps.transitionOptions) {
          $$invalidate(7, modalProps.transitionOptions = newModalTransitionOptions, modalProps);
        }
      }
    }
  };
  return [
    elementContent,
    elementRoot,
    dialogComponent,
    data,
    application,
    modal,
    appProps,
    modalProps,
    zIndex,
    autoClose,
    dialogcontent_autoClose_binding,
    dialogcontent_dialogInstance_binding,
    applicationshell_elementRoot_binding,
    applicationshell_elementContent_binding,
    dialogcontent_autoClose_binding_1,
    dialogcontent_dialogInstance_binding_1,
    applicationshell_elementRoot_binding_1,
    applicationshell_elementContent_binding_1
  ];
}

__name(instance$A, "instance$A");
class DialogShell extends SvelteComponent {
  constructor(options) {
      super();
      init(this, options, instance$A, create_fragment$B, safe_not_equal, {
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
    this.$$set({ elementContent });
    flush();
  }
  get elementRoot() {
    return this.$$.ctx[1];
  }
  set elementRoot(elementRoot) {
    this.$$set({ elementRoot });
    flush();
  }
  get data() {
    return this.$$.ctx[3];
  }
  set data(data) {
    this.$$set({ data });
    flush();
  }
  get dialogComponent() {
    return this.$$.ctx[2];
  }
  set dialogComponent(dialogComponent) {
    this.$$set({ dialogComponent });
    flush();
  }
}
__name(DialogShell, "DialogShell");

class DialogData {
    #application;

    constructor(application) {
        this.#application = application;
    }

    get(accessor, defaultValue) {
        return safeAccess(this, accessor, defaultValue);
    }

    merge(data) {
        deepMerge(this, data);
        const component = this.#application.svelte.component(0);
        if (component?.data) {
            component.data = this;
        }
    }

    set(accessor, value) {
        const success = safeSet(this, accessor, value);
        if (success) {
            const component = this.#application.svelte.component(0);
            if (component?.data) {
                component.data = this;
            }
        }
        return success;
    }
}
__name(DialogData, "DialogData");
class TJSDialog extends SvelteApplication {
  #data;
  constructor(data, options = {}) {
    super(options);
    this.#data = new DialogData(this);
    this.data = data;
    Object.defineProperty(this.svelte, "dialogComponent", {
      get: () => this.svelte?.applicationShell?.dialogComponent
    });
  }
  static get defaultOptions() {
    return deepMerge(super.defaultOptions, {
      classes: ["dialog"],
      width: 400,
      height: "auto",
      jQuery: true,
      svelte: {
        class: DialogShell,
        intro: true,
        target: document.body,
        props: function() {
          return { data: this.#data };
        }
      }
    });
  }
  get data() {
    return this.#data;
  }
  set data(data) {
    const descriptors = Object.getOwnPropertyDescriptors(this.#data);
    for (const descriptor in descriptors) {
      if (descriptors[descriptor].configurable) {
        delete this.#data[descriptor];
      }
    }
    this.#data.merge(data);
  }
  activateListeners(html) {
    super.activateListeners(html);
    if (this.data.render instanceof Function) {
      const actualHTML = typeof this.options.template === "string" ? html : this.options.jQuery ? $(this.elementContent) : this.elementContent;
      this.data.render(this.options.jQuery ? actualHTML : actualHTML[0]);
    }
  }
  async close(options) {
    if (this.data.close instanceof Function) {
      this.data.close(this.options.jQuery ? this.element : this.element[0]);
    }
    return super.close(options);
  }
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
    draggable: draggable2 = true,
    modal = false,
    modalOptions = {},
    popOut = true,
    resizable = false,
    transition = {},
    zIndex
  } = {}) {
    const mergedButtons = deepMerge({
      yes: {
        icon: '<i class="fas fa-check"></i>',
        label: game.i18n.localize("Yes")
      },
      no: {
        icon: '<i class="fas fa-times"></i>',
        label: game.i18n.localize("No")
      }
    }, buttons);
    return new Promise((resolve, reject) => {
      const dialog = new this({
        title,
        content,
        render,
        draggable: draggable2,
        modal,
        modalOptions,
        popOut,
        resizable,
        transition,
        zIndex,
        buttons: deepMerge(mergedButtons, {
          yes: {
            callback: (html) => {
              const result = yes ? yes(html) : true;
              resolve(result);
            }
          },
          no: {
            callback: (html) => {
              const result = no ? no(html) : false;
              resolve(result);
            }
          }
        }),
        default: defaultYes ? "yes" : "no",
        close: () => {
          if (rejectClose) {
            reject("The confirmation Dialog was closed without a choice being made.");
          } else {
            resolve(null);
          }
        }
      }, options);
      dialog.render(true);
    });
  }
  static async prompt({
    title,
    content,
    label,
    callback,
    render,
    rejectClose = false,
    options = {},
    draggable: draggable2 = true,
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
        draggable: draggable2,
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
            callback: (html) => {
              const result = callback ? callback(html) : null;
              resolve(result);
            }
          }
        },
        default: "ok",
        close: () => {
            if (rejectClose) {
                reject(new Error("The Dialog prompt was closed without being accepted."));
            }
            else {
                resolve(null);
            }
        }
      }, options);
        dialog.render(true);
    });
  }
}
__name(TJSDialog, "TJSDialog");
const get_label = /* @__PURE__ */ __name((op) => op instanceof Object ? op.label : op, "get_label");
const get_value = /* @__PURE__ */ __name((op) => op instanceof Object ? op.value ?? op.label : op, "get_value");
if (typeof Element !== `undefined` && !Element.prototype?.scrollIntoViewIfNeeded) {
    Element.prototype.scrollIntoViewIfNeeded = function (centerIfNeeded = true) {
        const el = this;
        new IntersectionObserver(function ([entry]) {
            const ratio = entry.intersectionRatio;
            if (ratio < 1) {
                const place = ratio <= 0 && centerIfNeeded ? `center` : `nearest`;
                el.scrollIntoView({
                    block: place,
                    inline: place
                });
            }
            this.disconnect();
        }).observe(this);
    };
}
const CircleSpinner_svelte_svelte_type_style_lang = "";

function create_fragment$A(ctx) {
    let div;
    let style_border_color = `${ctx[0]} transparent ${ctx[0]}
  ${ctx[0]}`;
    return {
        c() {
            div = element("div");
            set_style(div, "--duration", ctx[1]);
            attr(div, "class", "svelte-66wdl1");
            set_style(div, "border-color", style_border_color, false);
            set_style(div, "width", ctx[2], false);
            set_style(div, "height", ctx[2], false);
        },
        m(target, anchor) {
            insert(target, div, anchor);
        },
        p(ctx2, [dirty]) {
            if (dirty & 2) {
                set_style(div, "--duration", ctx2[1]);
            }
            if (dirty & 1 && style_border_color !== (style_border_color = `${ctx2[0]} transparent ${ctx2[0]}
  ${ctx2[0]}`)) {
                set_style(div, "border-color", style_border_color, false);
            }
            if (dirty & 4) {
                set_style(div, "width", ctx2[2], false);
            }
            if (dirty & 4) {
                set_style(div, "height", ctx2[2], false);
            }
        },
        i: noop,
        o: noop,
        d(detaching) {
            if (detaching)
                detach(div);
        }
    };
}

__name(create_fragment$A, "create_fragment$A");

function instance$z($$self, $$props, $$invalidate) {
    let { color = `cornflowerblue` } = $$props;
    let { duration = `1.5s` } = $$props;
    let { size = `1em` } = $$props;
    $$self.$$set = ($$props2) => {
        if ("color" in $$props2)
            $$invalidate(0, color = $$props2.color);
        if ("duration" in $$props2)
            $$invalidate(1, duration = $$props2.duration);
        if ("size" in $$props2)
            $$invalidate(2, size = $$props2.size);
    };
    return [color, duration, size];
}

__name(instance$z, "instance$z");

class CircleSpinner extends SvelteComponent {
    constructor(options) {
        super();
        init(this, options, instance$z, create_fragment$A, safe_not_equal, { color: 0, duration: 1, size: 2 });
    }
}

__name(CircleSpinner, "CircleSpinner");

function create_fragment$z(ctx) {
    let svg;
    let path;
    let svg_levels = [ctx[0], { fill: "currentColor" }, { viewBox: "0 0 16 16" }];
    let svg_data = {};
    for (let i = 0; i < svg_levels.length; i += 1) {
        svg_data = assign(svg_data, svg_levels[i]);
    }
    return {
        c() {
            svg = svg_element("svg");
            path = svg_element("path");
            attr(path, "d", "M3.646 9.146a.5.5 0 0 1 .708 0L8 12.793l3.646-3.647a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 0-.708zm0-2.292a.5.5 0 0 0 .708 0L8 3.207l3.646 3.647a.5.5 0 0 0 .708-.708l-4-4a.5.5 0 0 0-.708 0l-4 4a.5.5 0 0 0 0 .708z");
            set_svg_attributes(svg, svg_data);
        },
        m(target, anchor) {
            insert(target, svg, anchor);
            append(svg, path);
        },
        p(ctx2, [dirty]) {
            set_svg_attributes(svg, svg_data = get_spread_update(svg_levels, [
                dirty & 1 && ctx2[0],
                { fill: "currentColor" },
                { viewBox: "0 0 16 16" }
            ]));
        },
        i: noop,
        o: noop,
        d(detaching) {
            if (detaching)
                detach(svg);
        }
    };
}

__name(create_fragment$z, "create_fragment$z");

function instance$y($$self, $$props, $$invalidate) {
    $$self.$$set = ($$new_props) => {
        $$invalidate(0, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    };
    $$props = exclude_internal_props($$props);
    return [$$props];
}

__name(instance$y, "instance$y");

class ChevronExpand extends SvelteComponent {
    constructor(options) {
        super();
        init(this, options, instance$y, create_fragment$z, safe_not_equal, {});
    }
}

__name(ChevronExpand, "ChevronExpand");

function create_fragment$y(ctx) {
    let svg;
    let path;
    let svg_levels = [ctx[0], { viewBox: "0 0 20 20" }, { fill: "currentColor" }];
    let svg_data = {};
    for (let i = 0; i < svg_levels.length; i += 1) {
        svg_data = assign(svg_data, svg_levels[i]);
    }
    return {
        c() {
            svg = svg_element("svg");
            path = svg_element("path");
            attr(path, "d", "M10 1.6a8.4 8.4 0 100 16.8 8.4 8.4 0 000-16.8zm4.789 11.461L13.06 14.79 10 11.729l-3.061 3.06L5.21 13.06 8.272 10 5.211 6.939 6.94 5.211 10 8.271l3.061-3.061 1.729 1.729L11.728 10l3.061 3.061z");
            set_svg_attributes(svg, svg_data);
        },
        m(target, anchor) {
            insert(target, svg, anchor);
            append(svg, path);
        },
        p(ctx2, [dirty]) {
            set_svg_attributes(svg, svg_data = get_spread_update(svg_levels, [
                dirty & 1 && ctx2[0],
                { viewBox: "0 0 20 20" },
                { fill: "currentColor" }
            ]));
        },
        i: noop,
        o: noop,
        d(detaching) {
            if (detaching)
                detach(svg);
        }
    };
}

__name(create_fragment$y, "create_fragment$y");

function instance$x($$self, $$props, $$invalidate) {
    $$self.$$set = ($$new_props) => {
        $$invalidate(0, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    };
    $$props = exclude_internal_props($$props);
    return [$$props];
}

__name(instance$x, "instance$x");

class Cross extends SvelteComponent {
    constructor(options) {
        super();
        init(this, options, instance$x, create_fragment$y, safe_not_equal, {});
    }
}

__name(Cross, "Cross");

function create_fragment$x(ctx) {
    let svg;
    let path0;
    let path1;
    let svg_levels = [ctx[0], { viewBox: "0 0 24 24" }, { fill: "currentColor" }];
    let svg_data = {};
    for (let i = 0; i < svg_levels.length; i += 1) {
        svg_data = assign(svg_data, svg_levels[i]);
    }
    return {
        c() {
            svg = svg_element("svg");
            path0 = svg_element("path");
            path1 = svg_element("path");
            attr(path0, "fill", "none");
            attr(path0, "d", "M0 0h24v24H0V0z");
            attr(path1, "d", "M14.48 11.95c.17.02.34.05.52.05 2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4c0 .18.03.35.05.52l3.43 3.43zm2.21 2.21L22.53 20H23v-2c0-2.14-3.56-3.5-6.31-3.84zM0 3.12l4 4V10H1v2h3v3h2v-3h2.88l2.51 2.51C9.19 15.11 7 16.3 7 18v2h9.88l4 4 1.41-1.41L1.41 1.71 0 3.12zM6.88 10H6v-.88l.88.88z");
            set_svg_attributes(svg, svg_data);
        },
        m(target, anchor) {
            insert(target, svg, anchor);
            append(svg, path0);
            append(svg, path1);
        },
        p(ctx2, [dirty]) {
            set_svg_attributes(svg, svg_data = get_spread_update(svg_levels, [
                dirty & 1 && ctx2[0],
                { viewBox: "0 0 24 24" },
                { fill: "currentColor" }
            ]));
        },
        i: noop,
        o: noop,
        d(detaching) {
            if (detaching)
                detach(svg);
        }
    };
}

__name(create_fragment$x, "create_fragment$x");

function instance$w($$self, $$props, $$invalidate) {
    $$self.$$set = ($$new_props) => {
        $$invalidate(0, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    };
    $$props = exclude_internal_props($$props);
    return [$$props];
}

__name(instance$w, "instance$w");

class Disabled extends SvelteComponent {
    constructor(options) {
        super();
        init(this, options, instance$w, create_fragment$x, safe_not_equal, {});
    }
}

__name(Disabled, "Disabled");

function is_date(obj) {
    return Object.prototype.toString.call(obj) === "[object Date]";
}
__name(is_date, "is_date");
function tick_spring(ctx, last_value, current_value, target_value) {
    if (typeof current_value === "number" || is_date(current_value)) {
        const delta = target_value - current_value;
        const velocity = (current_value - last_value) / (ctx.dt || 1 / 60);
        const spring2 = ctx.opts.stiffness * delta;
        const damper = ctx.opts.damping * velocity;
        const acceleration = (spring2 - damper) * ctx.inv_mass;
        const d = (velocity + acceleration) * ctx.dt;
        if (Math.abs(d) < ctx.opts.precision && Math.abs(delta) < ctx.opts.precision) {
            return target_value;
        }
        else {
            ctx.settled = false;
            return is_date(current_value) ? new Date(current_value.getTime() + d) : current_value + d;
        }
    }
    else if (Array.isArray(current_value)) {
        return current_value.map((_, i) => tick_spring(ctx, last_value[i], current_value[i], target_value[i]));
    }
    else if (typeof current_value === "object") {
        const next_value = {};
        for (const k in current_value) {
            next_value[k] = tick_spring(ctx, last_value[k], current_value[k], target_value[k]);
        }
        return next_value;
    }
    else {
        throw new Error(`Cannot spring ${typeof current_value} values`);
    }
}
__name(tick_spring, "tick_spring");
function spring(value, opts = {}) {
    const store = writable(value);
    const { stiffness = 0.15, damping = 0.8, precision = 0.01 } = opts;
    let last_time;
    let task;
    let current_token;
    let last_value = value;
    let target_value = value;
    let inv_mass = 1;
    let inv_mass_recovery_rate = 0;
    let cancel_task = false;

    function set(new_value, opts2 = {}) {
        target_value = new_value;
        const token = current_token = {};
        if (value == null || opts2.hard || spring2.stiffness >= 1 && spring2.damping >= 1) {
            cancel_task = true;
            last_time = now();
            last_value = new_value;
            store.set(value = target_value);
            return Promise.resolve();
        }
        else if (opts2.soft) {
            const rate = opts2.soft === true ? 0.5 : +opts2.soft;
            inv_mass_recovery_rate = 1 / (rate * 60);
            inv_mass = 0;
        }
        if (!task) {
            last_time = now();
            cancel_task = false;
            task = loop((now2) => {
                if (cancel_task) {
                    cancel_task = false;
                    task = null;
                    return false;
                }
                inv_mass = Math.min(inv_mass + inv_mass_recovery_rate, 1);
                const ctx = {
                    inv_mass,
                    opts: spring2,
                    settled: true,
                    dt: (now2 - last_time) * 60 / 1e3
                };
                const next_value = tick_spring(ctx, last_value, value, target_value);
                last_time = now2;
                last_value = value;
                store.set(value = next_value);
                if (ctx.settled) {
                    task = null;
                }
                return !ctx.settled;
            });
        }
        return new Promise((fulfil) => {
            task.promise.then(() => {
                if (token === current_token)
                    fulfil();
            });
        });
    }

    __name(set, "set");
    const spring2 = {
        set,
        update: (fn, opts2) => set(fn(target_value, value), opts2),
        subscribe: store.subscribe,
        stiffness,
        damping,
        precision
    };
    return spring2;
}
__name(spring, "spring");

function create_fragment$w(ctx) {
    let span;
    let style_transform = `rotate(${ctx[0].angle}deg) scale(${ctx[0].scale}) translate(${ctx[0].dx}px,
  ${ctx[0].dy}px)`;
    let current;
    const default_slot_template = ctx[11].default;
    const default_slot = create_slot(default_slot_template, ctx, ctx[10], null);
    return {
        c() {
            span = element("span");
            if (default_slot) {
                default_slot.c();
            }
            set_style(span, "transform", style_transform, false);
        },
        m(target, anchor) {
            insert(target, span, anchor);
            if (default_slot) {
                default_slot.m(span, null);
            }
            current = true;
        },
        p(ctx2, [dirty]) {
            if (default_slot) {
                if (default_slot.p && (!current || dirty & 1024)) {
                    update_slot_base(
                        default_slot,
                        default_slot_template,
                        ctx2,
                        ctx2[10],
                        !current ? get_all_dirty_from_scope(ctx2[10]) : get_slot_changes(default_slot_template, ctx2[10], dirty, null),
                        null
                    );
                }
            }
            if (dirty & 1 && style_transform !== (style_transform = `rotate(${ctx2[0].angle}deg) scale(${ctx2[0].scale}) translate(${ctx2[0].dx}px,
  ${ctx2[0].dy}px)`)) {
                set_style(span, "transform", style_transform, false);
            }
        },
        i(local) {
            if (current) {
                return;
            }
            transition_in(default_slot, local);
            current = true;
        },
        o(local) {
            transition_out(default_slot, local);
            current = false;
        },
        d(detaching) {
            if (detaching) {
                detach(span);
            }
            if (default_slot) {
                default_slot.d(detaching);
            }
        }
    };
}

__name(create_fragment$w, "create_fragment$w");

function instance$v($$self, $$props, $$invalidate) {
    let $store;
    let { $$slots: slots = {}, $$scope } = $$props;
    let { wiggle = false } = $$props;
    let { angle = 0 } = $$props;
    let { scale = 1 } = $$props;
    let { dx = 0 } = $$props;
    let { dy = 0 } = $$props;
    let { duration = 200 } = $$props;
    let { stiffness = 0.05 } = $$props;
    let { damping = 0.1 } = $$props;
    let restState = { angle: 0, scale: 1, dx: 0, dy: 0 };
    let store = spring(restState, { stiffness, damping });
    component_subscribe($$self, store, (value) => $$invalidate(0, $store = value));
    $$self.$$set = ($$props2) => {
        if ("wiggle" in $$props2) {
            $$invalidate(2, wiggle = $$props2.wiggle);
        }
        if ("angle" in $$props2) {
            $$invalidate(3, angle = $$props2.angle);
        }
        if ("scale" in $$props2) {
            $$invalidate(4, scale = $$props2.scale);
        }
        if ("dx" in $$props2) {
            $$invalidate(5, dx = $$props2.dx);
        }
        if ("dy" in $$props2) {
            $$invalidate(6, dy = $$props2.dy);
        }
        if ("duration" in $$props2) {
            $$invalidate(7, duration = $$props2.duration);
        }
        if ("stiffness" in $$props2) {
            $$invalidate(8, stiffness = $$props2.stiffness);
        }
        if ("damping" in $$props2) {
            $$invalidate(9, damping = $$props2.damping);
        }
        if ("$$scope" in $$props2) {
            $$invalidate(10, $$scope = $$props2.$$scope);
        }
    };
    $$self.$$.update = () => {
        if ($$self.$$.dirty & 132) {
            if (wiggle) {
                setTimeout(() => $$invalidate(2, wiggle = false), duration);
            }
        }
        if ($$self.$$.dirty & 124) {
            store.set(wiggle ? { scale, angle, dx, dy } : restState);
        }
    };
    return [
        $store,
        store,
        wiggle,
        angle,
        scale,
        dx,
        dy,
        duration,
        stiffness,
        damping,
        $$scope,
        slots
    ];
}

__name(instance$v, "instance$v");

class Wiggle extends SvelteComponent {
    constructor(options) {
        super();
        init(this, options, instance$v, create_fragment$w, safe_not_equal, {
            wiggle: 2,
            angle: 3,
            scale: 4,
            dx: 5,
            dy: 6,
            duration: 7,
            stiffness: 8,
            damping: 9
        });
    }
}

__name(Wiggle, "Wiggle");
const MultiSelect_svelte_svelte_type_style_lang = "";

function get_each_context$j(ctx, list, i) {
    const child_ctx = ctx.slice();
    child_ctx[75] = list[i];
    child_ctx[81] = i;
    const constants_0 = child_ctx[75] instanceof Object ? child_ctx[75] : { label: child_ctx[75] };
    child_ctx[76] = constants_0.label;
    child_ctx[32] = constants_0.disabled !== void 0 ? constants_0.disabled : null;
    child_ctx[77] = constants_0.title !== void 0 ? constants_0.title : null;
    child_ctx[78] = constants_0.selectedTitle !== void 0 ? constants_0.selectedTitle : null;
    child_ctx[33] = constants_0.disabledTitle !== void 0 ? constants_0.disabledTitle : child_ctx[25];
    const constants_1 = child_ctx[5] && get_label(child_ctx[5]) === child_ctx[76];
    child_ctx[79] = constants_1;
    return child_ctx;
}

__name(get_each_context$j, "get_each_context$j");
const get_option_slot_changes = /* @__PURE__ */ __name((dirty) => ({ option: dirty[0] & 4 }), "get_option_slot_changes");
const get_option_slot_context = /* @__PURE__ */ __name((ctx) => ({
    option: ctx[75],
    idx: ctx[81]
}), "get_option_slot_context");
const get_remove_icon_slot_changes_1 = /* @__PURE__ */ __name((dirty) => ({}), "get_remove_icon_slot_changes_1");
const get_remove_icon_slot_context_1 = /* @__PURE__ */ __name((ctx) => ({}), "get_remove_icon_slot_context_1");
const get_disabled_icon_slot_changes = /* @__PURE__ */ __name((dirty) => ({}), "get_disabled_icon_slot_changes");
const get_disabled_icon_slot_context = /* @__PURE__ */ __name((ctx) => ({}), "get_disabled_icon_slot_context");
const get_spinner_slot_changes = /* @__PURE__ */ __name((dirty) => ({}), "get_spinner_slot_changes");
const get_spinner_slot_context = /* @__PURE__ */ __name((ctx) => ({}), "get_spinner_slot_context");
function get_each_context_1$9(ctx, list, i) {
    const child_ctx = ctx.slice();
    child_ctx[75] = list[i];
    child_ctx[81] = i;
    return child_ctx;
}
__name(get_each_context_1$9, "get_each_context_1$9");
const get_remove_icon_slot_changes = /* @__PURE__ */ __name((dirty) => ({}), "get_remove_icon_slot_changes");
const get_remove_icon_slot_context = /* @__PURE__ */ __name((ctx) => ({}), "get_remove_icon_slot_context");
const get_selected_slot_changes = /* @__PURE__ */ __name((dirty) => ({ option: dirty[0] & 8 }), "get_selected_slot_changes");
const get_selected_slot_context = /* @__PURE__ */ __name((ctx) => ({
    option: ctx[75],
    idx: ctx[81]
}), "get_selected_slot_context");
function create_else_block_3(ctx) {
    let t_value = get_label(ctx[75]) + "";
    let t;
    return {
        c() {
            t = text(t_value);
        },
        m(target, anchor) {
            insert(target, t, anchor);
        },
        p(ctx2, dirty) {
            if (dirty[0] & 8 && t_value !== (t_value = get_label(ctx2[75]) + ""))
                set_data(t, t_value);
        },
        d(detaching) {
            if (detaching)
                detach(t);
        }
    };
}
__name(create_else_block_3, "create_else_block_3");
function create_if_block_9$1(ctx) {
    let html_tag;
    let raw_value = get_label(ctx[75]) + "";
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
        p(ctx2, dirty) {
            if (dirty[0] & 8 && raw_value !== (raw_value = get_label(ctx2[75]) + ""))
                html_tag.p(raw_value);
        },
        d(detaching) {
            if (detaching)
                detach(html_anchor);
            if (detaching)
                html_tag.d();
        }
    };
}
__name(create_if_block_9$1, "create_if_block_9$1");
function fallback_block_5(ctx) {
    let if_block_anchor;

    function select_block_type(ctx2, dirty) {
        if (ctx2[27])
            return create_if_block_9$1;
        return create_else_block_3;
    }

    __name(select_block_type, "select_block_type");
    let current_block_type = select_block_type(ctx);
    let if_block = current_block_type(ctx);
    return {
        c() {
            if_block.c();
            if_block_anchor = empty();
        },
        m(target, anchor) {
            if_block.m(target, anchor);
            insert(target, if_block_anchor, anchor);
        },
        p(ctx2, dirty) {
            if (current_block_type === (current_block_type = select_block_type(ctx2)) && if_block) {
                if_block.p(ctx2, dirty);
            }
            else {
                if_block.d(1);
                if_block = current_block_type(ctx2);
                if (if_block) {
                    if_block.c();
                    if_block.m(if_block_anchor.parentNode, if_block_anchor);
                }
            }
        },
        d(detaching) {
            if_block.d(detaching);
            if (detaching)
                detach(if_block_anchor);
        }
    };
}
__name(fallback_block_5, "fallback_block_5");
function create_if_block_8$1(ctx) {
    let button;
    let button_title_value;
    let current;
    let mounted;
    let dispose;
    const remove_icon_slot_template = ctx[48]["remove-icon"];
    const remove_icon_slot = create_slot(remove_icon_slot_template, ctx, ctx[73], get_remove_icon_slot_context);
    const remove_icon_slot_or_fallback = remove_icon_slot || fallback_block_4();

    function mouseup_handler() {
        return ctx[54](ctx[75]);
    }

    __name(mouseup_handler, "mouseup_handler");

    function keydown_handler() {
        return ctx[55](ctx[75]);
    }

    __name(keydown_handler, "keydown_handler");
    return {
        c() {
            button = element("button");
            if (remove_icon_slot_or_fallback)
                remove_icon_slot_or_fallback.c();
            attr(button, "type", "button");
            attr(button, "title", button_title_value = ctx[23] + " " + get_label(ctx[75]));
            attr(button, "class", "svelte-1w91bdr");
        },
        m(target, anchor) {
            insert(target, button, anchor);
            if (remove_icon_slot_or_fallback) {
                remove_icon_slot_or_fallback.m(button, null);
            }
            current = true;
            if (!mounted) {
                dispose = [
                    listen(button, "mouseup", stop_propagation(mouseup_handler)),
                    listen(button, "keydown", function () {
                        if (is_function(ctx[43](keydown_handler)))
                            ctx[43](keydown_handler).apply(this, arguments);
                    })
                ];
                mounted = true;
            }
        },
        p(new_ctx, dirty) {
            ctx = new_ctx;
            if (remove_icon_slot) {
                if (remove_icon_slot.p && (!current || dirty[2] & 2048)) {
                    update_slot_base(
                        remove_icon_slot,
                        remove_icon_slot_template,
                        ctx,
                        ctx[73],
                        !current ? get_all_dirty_from_scope(ctx[73]) : get_slot_changes(remove_icon_slot_template, ctx[73], dirty, get_remove_icon_slot_changes),
                        get_remove_icon_slot_context
                    );
                }
            }
            if (!current || dirty[0] & 8388616 && button_title_value !== (button_title_value = ctx[23] + " " + get_label(ctx[75]))) {
                attr(button, "title", button_title_value);
            }
        },
        i(local) {
            if (current)
                return;
            transition_in(remove_icon_slot_or_fallback, local);
            current = true;
        },
        o(local) {
            transition_out(remove_icon_slot_or_fallback, local);
            current = false;
        },
        d(detaching) {
            if (detaching)
                detach(button);
            if (remove_icon_slot_or_fallback)
                remove_icon_slot_or_fallback.d(detaching);
            mounted = false;
            run_all(dispose);
        }
    };
}
__name(create_if_block_8$1, "create_if_block_8$1");
function fallback_block_4(ctx) {
    let crossicon;
    let current;
    crossicon = new Cross({ props: { width: "15px" } });
    return {
        c() {
            create_component(crossicon.$$.fragment);
        },
        m(target, anchor) {
            mount_component(crossicon, target, anchor);
            current = true;
        },
        p: noop,
        i(local) {
            if (current)
                return;
            transition_in(crossicon.$$.fragment, local);
            current = true;
        },
        o(local) {
            transition_out(crossicon.$$.fragment, local);
            current = false;
        },
        d(detaching) {
            destroy_component(crossicon, detaching);
        }
    };
}
__name(fallback_block_4, "fallback_block_4");
function create_each_block_1$9(ctx) {
    let li;
    let t;
    let li_class_value;
    let current;
    const selected_slot_template = ctx[48].selected;
    const selected_slot = create_slot(selected_slot_template, ctx, ctx[73], get_selected_slot_context);
    const selected_slot_or_fallback = selected_slot || fallback_block_5(ctx);
    let if_block = !ctx[32] && create_if_block_8$1(ctx);
    return {
        c() {
            li = element("li");
            if (selected_slot_or_fallback)
                selected_slot_or_fallback.c();
            t = space();
            if (if_block)
                if_block.c();
            attr(li, "class", li_class_value = null_to_empty(ctx[18]) + " svelte-1w91bdr");
            attr(li, "aria-selected", "true");
        },
        m(target, anchor) {
            insert(target, li, anchor);
            if (selected_slot_or_fallback) {
                selected_slot_or_fallback.m(li, null);
            }
            append(li, t);
            if (if_block)
                if_block.m(li, null);
            current = true;
        },
        p(ctx2, dirty) {
            if (selected_slot) {
                if (selected_slot.p && (!current || dirty[0] & 8 | dirty[2] & 2048)) {
                    update_slot_base(
                        selected_slot,
                        selected_slot_template,
                        ctx2,
                        ctx2[73],
                        !current ? get_all_dirty_from_scope(ctx2[73]) : get_slot_changes(selected_slot_template, ctx2[73], dirty, get_selected_slot_changes),
                        get_selected_slot_context
                    );
                }
            }
            else {
                if (selected_slot_or_fallback && selected_slot_or_fallback.p && (!current || dirty[0] & 134217736)) {
                    selected_slot_or_fallback.p(ctx2, !current ? [-1, -1, -1] : dirty);
                }
            }
            if (!ctx2[32]) {
                if (if_block) {
                    if_block.p(ctx2, dirty);
                    if (dirty[1] & 2) {
                        transition_in(if_block, 1);
                    }
                }
                else {
                    if_block = create_if_block_8$1(ctx2);
                    if_block.c();
                    transition_in(if_block, 1);
                    if_block.m(li, null);
                }
            }
            else if (if_block) {
                group_outros();
                transition_out(if_block, 1, 1, () => {
                    if_block = null;
                });
                check_outros();
            }
            if (!current || dirty[0] & 262144 && li_class_value !== (li_class_value = null_to_empty(ctx2[18]) + " svelte-1w91bdr")) {
                attr(li, "class", li_class_value);
            }
        },
        i(local) {
            if (current)
                return;
            transition_in(selected_slot_or_fallback, local);
            transition_in(if_block);
            current = true;
        },
        o(local) {
            transition_out(selected_slot_or_fallback, local);
            transition_out(if_block);
            current = false;
        },
        d(detaching) {
            if (detaching)
                detach(li);
            if (selected_slot_or_fallback)
                selected_slot_or_fallback.d(detaching);
            if (if_block)
                if_block.d();
        }
    };
}
__name(create_each_block_1$9, "create_each_block_1$9");
function create_if_block_7$1(ctx) {
    let current;
    const spinner_slot_template = ctx[48].spinner;
    const spinner_slot = create_slot(spinner_slot_template, ctx, ctx[73], get_spinner_slot_context);
    const spinner_slot_or_fallback = spinner_slot || fallback_block_3();
    return {
        c() {
            if (spinner_slot_or_fallback)
                spinner_slot_or_fallback.c();
        },
        m(target, anchor) {
            if (spinner_slot_or_fallback) {
                spinner_slot_or_fallback.m(target, anchor);
            }
            current = true;
        },
        p(ctx2, dirty) {
            if (spinner_slot) {
                if (spinner_slot.p && (!current || dirty[2] & 2048)) {
                    update_slot_base(
                        spinner_slot,
                        spinner_slot_template,
                        ctx2,
                        ctx2[73],
                        !current ? get_all_dirty_from_scope(ctx2[73]) : get_slot_changes(spinner_slot_template, ctx2[73], dirty, get_spinner_slot_changes),
                        get_spinner_slot_context
                    );
                }
            }
        },
        i(local) {
            if (current)
                return;
            transition_in(spinner_slot_or_fallback, local);
            current = true;
        },
        o(local) {
            transition_out(spinner_slot_or_fallback, local);
            current = false;
        },
        d(detaching) {
            if (spinner_slot_or_fallback)
                spinner_slot_or_fallback.d(detaching);
        }
    };
}
__name(create_if_block_7$1, "create_if_block_7$1");
function fallback_block_3(ctx) {
    let circlespinner;
    let current;
    circlespinner = new CircleSpinner({});
    return {
        c() {
            create_component(circlespinner.$$.fragment);
        },
        m(target, anchor) {
            mount_component(circlespinner, target, anchor);
            current = true;
        },
        i(local) {
            if (current)
                return;
            transition_in(circlespinner.$$.fragment, local);
            current = true;
        },
        o(local) {
            transition_out(circlespinner.$$.fragment, local);
            current = false;
        },
        d(detaching) {
            destroy_component(circlespinner, detaching);
        }
    };
}
__name(fallback_block_3, "fallback_block_3");
function create_if_block_4$2(ctx) {
    let t;
    let if_block1_anchor;
    let current;
    let if_block0 = ctx[10] && (ctx[10] > 1 || ctx[11]) && create_if_block_6$1(ctx);
    let if_block1 = ctx[10] !== 1 && ctx[3].length > 1 && create_if_block_5$1(ctx);
    return {
        c() {
            if (if_block0)
                if_block0.c();
            t = space();
            if (if_block1)
                if_block1.c();
            if_block1_anchor = empty();
        },
        m(target, anchor) {
            if (if_block0)
                if_block0.m(target, anchor);
            insert(target, t, anchor);
            if (if_block1)
                if_block1.m(target, anchor);
            insert(target, if_block1_anchor, anchor);
            current = true;
        },
        p(ctx2, dirty) {
            if (ctx2[10] && (ctx2[10] > 1 || ctx2[11])) {
                if (if_block0) {
                    if_block0.p(ctx2, dirty);
                    if (dirty[0] & 3072) {
                        transition_in(if_block0, 1);
                    }
                }
                else {
                    if_block0 = create_if_block_6$1(ctx2);
                    if_block0.c();
                    transition_in(if_block0, 1);
                    if_block0.m(t.parentNode, t);
                }
            }
            else if (if_block0) {
                group_outros();
                transition_out(if_block0, 1, 1, () => {
                    if_block0 = null;
                });
                check_outros();
            }
            if (ctx2[10] !== 1 && ctx2[3].length > 1) {
                if (if_block1) {
                    if_block1.p(ctx2, dirty);
                    if (dirty[0] & 1032) {
                        transition_in(if_block1, 1);
                    }
                }
                else {
                    if_block1 = create_if_block_5$1(ctx2);
                    if_block1.c();
                    transition_in(if_block1, 1);
                    if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
                }
            }
            else if (if_block1) {
                group_outros();
                transition_out(if_block1, 1, 1, () => {
                    if_block1 = null;
                });
                check_outros();
            }
        },
        i(local) {
            if (current)
                return;
            transition_in(if_block0);
            transition_in(if_block1);
            current = true;
        },
        o(local) {
            transition_out(if_block0);
            transition_out(if_block1);
            current = false;
        },
        d(detaching) {
            if (if_block0)
                if_block0.d(detaching);
            if (detaching)
                detach(t);
            if (if_block1)
                if_block1.d(detaching);
            if (detaching)
                detach(if_block1_anchor);
        }
    };
}
__name(create_if_block_4$2, "create_if_block_4$2");
function create_if_block_3$2(ctx) {
    let current;
    const disabled_icon_slot_template = ctx[48]["disabled-icon"];
    const disabled_icon_slot = create_slot(disabled_icon_slot_template, ctx, ctx[73], get_disabled_icon_slot_context);
    const disabled_icon_slot_or_fallback = disabled_icon_slot || fallback_block_1();
    return {
        c() {
            if (disabled_icon_slot_or_fallback)
                disabled_icon_slot_or_fallback.c();
        },
        m(target, anchor) {
            if (disabled_icon_slot_or_fallback) {
                disabled_icon_slot_or_fallback.m(target, anchor);
            }
            current = true;
        },
        p(ctx2, dirty) {
            if (disabled_icon_slot) {
                if (disabled_icon_slot.p && (!current || dirty[2] & 2048)) {
                    update_slot_base(
                        disabled_icon_slot,
                        disabled_icon_slot_template,
                        ctx2,
                        ctx2[73],
                        !current ? get_all_dirty_from_scope(ctx2[73]) : get_slot_changes(disabled_icon_slot_template, ctx2[73], dirty, get_disabled_icon_slot_changes),
                        get_disabled_icon_slot_context
                    );
                }
            }
        },
        i(local) {
            if (current)
                return;
            transition_in(disabled_icon_slot_or_fallback, local);
            current = true;
        },
        o(local) {
            transition_out(disabled_icon_slot_or_fallback, local);
            current = false;
        },
        d(detaching) {
            if (disabled_icon_slot_or_fallback)
                disabled_icon_slot_or_fallback.d(detaching);
        }
    };
}
__name(create_if_block_3$2, "create_if_block_3$2");
function create_if_block_6$1(ctx) {
    let wiggle_1;
    let updating_wiggle;
    let current;

    function wiggle_1_wiggle_binding(value) {
        ctx[60](value);
    }

    __name(wiggle_1_wiggle_binding, "wiggle_1_wiggle_binding");
    let wiggle_1_props = {
        angle: 20,
        $$slots: { default: [create_default_slot$7] },
        $$scope: { ctx }
    };
    if (ctx[36] !== void 0) {
        wiggle_1_props.wiggle = ctx[36];
    }
    wiggle_1 = new Wiggle({ props: wiggle_1_props });
    binding_callbacks.push(() => bind(wiggle_1, "wiggle", wiggle_1_wiggle_binding));
    return {
        c() {
            create_component(wiggle_1.$$.fragment);
        },
        m(target, anchor) {
            mount_component(wiggle_1, target, anchor);
            current = true;
        },
        p(ctx2, dirty) {
            const wiggle_1_changes = {};
            if (dirty[0] & 3080 | dirty[2] & 2048) {
                wiggle_1_changes.$$scope = { dirty, ctx: ctx2 };
            }
            if (!updating_wiggle && dirty[1] & 32) {
                updating_wiggle = true;
                wiggle_1_changes.wiggle = ctx2[36];
                add_flush_callback(() => updating_wiggle = false);
            }
            wiggle_1.$set(wiggle_1_changes);
        },
        i(local) {
            if (current)
                return;
            transition_in(wiggle_1.$$.fragment, local);
            current = true;
        },
        o(local) {
            transition_out(wiggle_1.$$.fragment, local);
            current = false;
        },
        d(detaching) {
            destroy_component(wiggle_1, detaching);
        }
    };
}
__name(create_if_block_6$1, "create_if_block_6$1");
function create_default_slot$7(ctx) {
    let span;
    let t_value = (ctx[11]?.(ctx[3].length, ctx[10]) ?? (ctx[10] > 1 ? `${ctx[3].length}/${ctx[10]}` : ``)) + "";
    let t;
    return {
        c() {
            span = element("span");
            t = text(t_value);
            set_style(span, "padding", "0 3pt");
            attr(span, "class", "svelte-1w91bdr");
        },
        m(target, anchor) {
            insert(target, span, anchor);
            append(span, t);
        },
        p(ctx2, dirty) {
            if (dirty[0] & 3080 && t_value !== (t_value = (ctx2[11]?.(ctx2[3].length, ctx2[10]) ?? (ctx2[10] > 1 ? `${ctx2[3].length}/${ctx2[10]}` : ``)) + ""))
                set_data(t, t_value);
        },
        d(detaching) {
            if (detaching)
                detach(span);
        }
    };
}
__name(create_default_slot$7, "create_default_slot$7");
function create_if_block_5$1(ctx) {
    let button;
    let current;
    let mounted;
    let dispose;
    const remove_icon_slot_template = ctx[48]["remove-icon"];
    const remove_icon_slot = create_slot(remove_icon_slot_template, ctx, ctx[73], get_remove_icon_slot_context_1);
    const remove_icon_slot_or_fallback = remove_icon_slot || fallback_block_2();
    return {
        c() {
            button = element("button");
            if (remove_icon_slot_or_fallback)
                remove_icon_slot_or_fallback.c();
            attr(button, "type", "button");
            attr(button, "class", "remove-all svelte-1w91bdr");
            attr(button, "title", ctx[24]);
        },
        m(target, anchor) {
            insert(target, button, anchor);
            if (remove_icon_slot_or_fallback) {
                remove_icon_slot_or_fallback.m(button, null);
            }
            current = true;
            if (!mounted) {
                dispose = [
                    listen(button, "mouseup", stop_propagation(ctx[42])),
                    listen(button, "keydown", ctx[43](ctx[42]))
                ];
                mounted = true;
            }
        },
        p(ctx2, dirty) {
            if (remove_icon_slot) {
                if (remove_icon_slot.p && (!current || dirty[2] & 2048)) {
                    update_slot_base(
                        remove_icon_slot,
                        remove_icon_slot_template,
                        ctx2,
                        ctx2[73],
                        !current ? get_all_dirty_from_scope(ctx2[73]) : get_slot_changes(remove_icon_slot_template, ctx2[73], dirty, get_remove_icon_slot_changes_1),
                        get_remove_icon_slot_context_1
                    );
                }
            }
            if (!current || dirty[0] & 16777216) {
                attr(button, "title", ctx2[24]);
            }
        },
        i(local) {
            if (current)
                return;
            transition_in(remove_icon_slot_or_fallback, local);
            current = true;
        },
        o(local) {
            transition_out(remove_icon_slot_or_fallback, local);
            current = false;
        },
        d(detaching) {
            if (detaching)
                detach(button);
            if (remove_icon_slot_or_fallback)
                remove_icon_slot_or_fallback.d(detaching);
            mounted = false;
            run_all(dispose);
        }
    };
}
__name(create_if_block_5$1, "create_if_block_5$1");
function fallback_block_2(ctx) {
    let crossicon;
    let current;
    crossicon = new Cross({ props: { width: "15px" } });
    return {
        c() {
            create_component(crossicon.$$.fragment);
        },
        m(target, anchor) {
            mount_component(crossicon, target, anchor);
            current = true;
        },
        p: noop,
        i(local) {
            if (current)
                return;
            transition_in(crossicon.$$.fragment, local);
            current = true;
        },
        o(local) {
            transition_out(crossicon.$$.fragment, local);
            current = false;
        },
        d(detaching) {
            destroy_component(crossicon, detaching);
        }
    };
}
__name(fallback_block_2, "fallback_block_2");
function fallback_block_1(ctx) {
    let disabledicon;
    let current;
    disabledicon = new Disabled({ props: { width: "15px" } });
    return {
        c() {
            create_component(disabledicon.$$.fragment);
        },
        m(target, anchor) {
            mount_component(disabledicon, target, anchor);
            current = true;
        },
        p: noop,
        i(local) {
            if (current)
                return;
            transition_in(disabledicon.$$.fragment, local);
            current = true;
        },
        o(local) {
            transition_out(disabledicon.$$.fragment, local);
            current = false;
        },
        d(detaching) {
            destroy_component(disabledicon, detaching);
        }
    };
}
__name(fallback_block_1, "fallback_block_1");

function create_if_block$e(ctx) {
    let ul;
    let ul_class_value;
    let current;
    let each_value = ctx[2];
    let each_blocks = [];
    for (let i = 0; i < each_value.length; i += 1) {
        each_blocks[i] = create_each_block$j(get_each_context$j(ctx, each_value, i));
    }
    const out = /* @__PURE__ */ __name((i) => transition_out(each_blocks[i], 1, 1, () => {
        each_blocks[i] = null;
    }), "out");
    let each_1_else = null;
    if (!each_value.length) {
        each_1_else = create_else_block_1(ctx);
    }
    return {
        c() {
            ul = element("ul");
            for (let i = 0; i < each_blocks.length; i += 1) {
                each_blocks[i].c();
            }
            if (each_1_else) {
                each_1_else.c();
            }
            attr(ul, "class", ul_class_value = "options " + ctx[19] + " svelte-1w91bdr");
            toggle_class(ul, "hidden", !ctx[6]);
        },
        m(target, anchor) {
            insert(target, ul, anchor);
            for (let i = 0; i < each_blocks.length; i += 1) {
                each_blocks[i].m(ul, null);
            }
            if (each_1_else) {
                each_1_else.m(ul, null);
            }
            current = true;
        },
        p(ctx2, dirty) {
            if (dirty[0] & 472940581 | dirty[1] & 464 | dirty[2] & 2048) {
                each_value = ctx2[2];
                let i;
                for (i = 0; i < each_value.length; i += 1) {
                    const child_ctx = get_each_context$j(ctx2, each_value, i);
                    if (each_blocks[i]) {
                        each_blocks[i].p(child_ctx, dirty);
                        transition_in(each_blocks[i], 1);
                    }
                    else {
                        each_blocks[i] = create_each_block$j(child_ctx);
                        each_blocks[i].c();
                        transition_in(each_blocks[i], 1);
                        each_blocks[i].m(ul, null);
                    }
                }
                group_outros();
                for (i = each_value.length; i < each_blocks.length; i += 1) {
                    out(i);
                }
                check_outros();
                if (!each_value.length && each_1_else) {
                    each_1_else.p(ctx2, dirty);
                }
                else if (!each_value.length) {
                    each_1_else = create_else_block_1(ctx2);
                    each_1_else.c();
                    each_1_else.m(ul, null);
                }
                else if (each_1_else) {
                    each_1_else.d(1);
                    each_1_else = null;
                }
            }
            if (!current || dirty[0] & 524288 && ul_class_value !== (ul_class_value = "options " + ctx2[19] + " svelte-1w91bdr")) {
                attr(ul, "class", ul_class_value);
            }
            if (dirty[0] & 524352) {
                toggle_class(ul, "hidden", !ctx2[6]);
            }
        },
        i(local) {
            if (current)
                return;
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
            if (detaching)
                detach(ul);
            destroy_each(each_blocks, detaching);
            if (each_1_else)
                each_1_else.d();
        }
    };
}

__name(create_if_block$e, "create_if_block$e");
function create_else_block_1(ctx) {
    let if_block_anchor;

    function select_block_type_3(ctx2, dirty) {
        if (ctx2[26] && ctx2[0])
            return create_if_block_2$2;
        return create_else_block_2;
    }

    __name(select_block_type_3, "select_block_type_3");
    let current_block_type = select_block_type_3(ctx);
    let if_block = current_block_type(ctx);
    return {
        c() {
            if_block.c();
            if_block_anchor = empty();
        },
        m(target, anchor) {
            if_block.m(target, anchor);
            insert(target, if_block_anchor, anchor);
        },
        p(ctx2, dirty) {
            if (current_block_type === (current_block_type = select_block_type_3(ctx2)) && if_block) {
                if_block.p(ctx2, dirty);
            }
            else {
                if_block.d(1);
                if_block = current_block_type(ctx2);
                if (if_block) {
                    if_block.c();
                    if_block.m(if_block_anchor.parentNode, if_block_anchor);
                }
            }
        },
        d(detaching) {
            if_block.d(detaching);
            if (detaching)
                detach(if_block_anchor);
        }
    };
}
__name(create_else_block_1, "create_else_block_1");
function create_else_block_2(ctx) {
    let span;
    let t;
    return {
        c() {
            span = element("span");
            t = text(ctx[15]);
            attr(span, "class", "svelte-1w91bdr");
        },
        m(target, anchor) {
            insert(target, span, anchor);
            append(span, t);
        },
        p(ctx2, dirty) {
            if (dirty[0] & 32768)
                set_data(t, ctx2[15]);
        },
        d(detaching) {
            if (detaching)
                detach(span);
        }
    };
}
__name(create_else_block_2, "create_else_block_2");
function create_if_block_2$2(ctx) {
    let li;
    let t0;
    let t1;
    let mounted;
    let dispose;
    return {
        c() {
            li = element("li");
            t0 = text(ctx[28]);
            t1 = space();
            attr(li, "title", ctx[28]);
            attr(li, "aria-selected", "false");
            attr(li, "class", "svelte-1w91bdr");
            toggle_class(li, "active", ctx[35]);
        },
        m(target, anchor) {
            insert(target, li, anchor);
            append(li, t0);
            append(li, t1);
            if (!mounted) {
                dispose = [
                    listen(li, "mousedown", stop_propagation(ctx[50])),
                    listen(li, "mouseup", stop_propagation(ctx[66])),
                    listen(li, "mouseover", ctx[67]),
                    listen(li, "focus", ctx[68]),
                    listen(li, "mouseout", ctx[69]),
                    listen(li, "blur", ctx[70])
                ];
                mounted = true;
            }
        },
        p(ctx2, dirty) {
            if (dirty[0] & 268435456)
                set_data(t0, ctx2[28]);
            if (dirty[0] & 268435456) {
                attr(li, "title", ctx2[28]);
            }
            if (dirty[1] & 16) {
                toggle_class(li, "active", ctx2[35]);
            }
        },
        d(detaching) {
            if (detaching)
                detach(li);
            mounted = false;
            run_all(dispose);
        }
    };
}
__name(create_if_block_2$2, "create_if_block_2$2");

function create_else_block$2(ctx) {
    let t_value = get_label(ctx[75]) + "";
    let t;
    return {
        c() {
            t = text(t_value);
        },
        m(target, anchor) {
            insert(target, t, anchor);
        },
        p(ctx2, dirty) {
            if (dirty[0] & 4 && t_value !== (t_value = get_label(ctx2[75]) + "")) {
                set_data(t, t_value);
            }
        },
        d(detaching) {
            if (detaching) {
                detach(t);
            }
        }
    };
}

__name(create_else_block$2, "create_else_block$2");

function create_if_block_1$5(ctx) {
    let html_tag;
    let raw_value = get_label(ctx[75]) + "";
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
        p(ctx2, dirty) {
            if (dirty[0] & 4 && raw_value !== (raw_value = get_label(ctx2[75]) + "")) {
                html_tag.p(raw_value);
            }
        },
        d(detaching) {
            if (detaching) {
                detach(html_anchor);
            }
            if (detaching) {
                html_tag.d();
            }
        }
    };
}

__name(create_if_block_1$5, "create_if_block_1$5");

function fallback_block(ctx) {
    let if_block_anchor;

    function select_block_type_2(ctx2, dirty) {
        if (ctx2[27]) {
            return create_if_block_1$5;
        }
        return create_else_block$2;
    }

    __name(select_block_type_2, "select_block_type_2");
    let current_block_type = select_block_type_2(ctx);
    let if_block = current_block_type(ctx);
    return {
        c() {
            if_block.c();
            if_block_anchor = empty();
        },
        m(target, anchor) {
            if_block.m(target, anchor);
            insert(target, if_block_anchor, anchor);
        },
        p(ctx2, dirty) {
            if (current_block_type === (current_block_type = select_block_type_2(ctx2)) && if_block) {
                if_block.p(ctx2, dirty);
            }
            else {
                if_block.d(1);
                if_block = current_block_type(ctx2);
                if (if_block) {
                    if_block.c();
                    if_block.m(if_block_anchor.parentNode, if_block_anchor);
                }
            }
        },
        d(detaching) {
            if_block.d(detaching);
            if (detaching) {
                detach(if_block_anchor);
            }
        }
    };
}

__name(fallback_block, "fallback_block");

function create_each_block$j(ctx) {
    let li;
    let t;
    let li_title_value;
    let li_class_value;
    let current;
    let mounted;
    let dispose;
    const option_slot_template = ctx[48].option;
    const option_slot = create_slot(option_slot_template, ctx, ctx[73], get_option_slot_context);
    const option_slot_or_fallback = option_slot || fallback_block(ctx);

    function mouseup_handler_2() {
        return ctx[61](ctx[32], ctx[76]);
    }

    __name(mouseup_handler_2, "mouseup_handler_2");

    function mouseover_handler() {
        return ctx[62](ctx[32], ctx[75]);
    }

    __name(mouseover_handler, "mouseover_handler");

    function focus_handler_1() {
        return ctx[63](ctx[32], ctx[75]);
    }

    __name(focus_handler_1, "focus_handler_1");
    return {
        c() {
            li = element("li");
            if (option_slot_or_fallback) {
                option_slot_or_fallback.c();
            }
            t = space();
            attr(li, "title", li_title_value = ctx[32] ? ctx[33] : ctx[37](ctx[76]) && ctx[78] || ctx[77]);
            attr(li, "class", li_class_value = ctx[20] + " " + (ctx[79] ? ctx[21] : ``) + " svelte-1w91bdr");
            attr(li, "aria-selected", "false");
            toggle_class(li, "selected", ctx[37](ctx[76]));
            toggle_class(li, "active", ctx[79]);
            toggle_class(li, "disabled", ctx[32]);
        },
        m(target, anchor) {
            insert(target, li, anchor);
            if (option_slot_or_fallback) {
                option_slot_or_fallback.m(li, null);
            }
            append(li, t);
            current = true;
            if (!mounted) {
                dispose = [
                    listen(li, "mousedown", stop_propagation(ctx[49])),
                    listen(li, "mouseup", stop_propagation(mouseup_handler_2)),
                    listen(li, "mouseover", mouseover_handler),
                    listen(li, "focus", focus_handler_1),
                    listen(li, "mouseout", ctx[64]),
                    listen(li, "blur", ctx[65])
                ];
                mounted = true;
            }
        },
        p(new_ctx, dirty) {
            ctx = new_ctx;
            if (option_slot) {
                if (option_slot.p && (!current || dirty[0] & 4 | dirty[2] & 2048)) {
                    update_slot_base(
                        option_slot,
                        option_slot_template,
                        ctx,
                        ctx[73],
                        !current ? get_all_dirty_from_scope(ctx[73]) : get_slot_changes(option_slot_template, ctx[73], dirty, get_option_slot_changes),
                        get_option_slot_context
                    );
                }
            }
            else {
                if (option_slot_or_fallback && option_slot_or_fallback.p && (!current || dirty[0] & 134217732)) {
                    option_slot_or_fallback.p(ctx, !current ? [-1, -1, -1] : dirty);
                }
            }
            if (!current || dirty[0] & 4 | dirty[1] & 64 && li_title_value !== (li_title_value = ctx[32] ? ctx[33] : ctx[37](ctx[76]) && ctx[78] || ctx[77])) {
                attr(li, "title", li_title_value);
            }
            if (!current || dirty[0] & 3145764 && li_class_value !== (li_class_value = ctx[20] + " " + (ctx[79] ? ctx[21] : ``) + " svelte-1w91bdr")) {
                attr(li, "class", li_class_value);
            }
            if (dirty[0] & 3145764 | dirty[1] & 64) {
                toggle_class(li, "selected", ctx[37](ctx[76]));
            }
            if (dirty[0] & 3145764) {
                toggle_class(li, "active", ctx[79]);
            }
            if (dirty[0] & 3145764) {
                toggle_class(li, "disabled", ctx[32]);
            }
        },
        i(local) {
            if (current) {
                return;
            }
            transition_in(option_slot_or_fallback, local);
            current = true;
        },
        o(local) {
            transition_out(option_slot_or_fallback, local);
            current = false;
        },
        d(detaching) {
            if (detaching) {
                detach(li);
            }
            if (option_slot_or_fallback) {
                option_slot_or_fallback.d(detaching);
            }
            mounted = false;
            run_all(dispose);
        }
    };
}

__name(create_each_block$j, "create_each_block$j");

function create_fragment$v(ctx) {
    let div;
    let input0;
    let t0;
    let expandicon;
    let t1;
    let ul;
    let t2;
    let li;
    let input1;
    let input1_class_value;
    let input1_placeholder_value;
    let input1_aria_invalid_value;
    let ul_class_value;
    let t3;
    let t4;
    let current_block_type_index;
    let if_block1;
    let t5;
    let div_aria_multiselectable_value;
    let div_class_value;
    let div_title_value;
    let div_aria_disabled_value;
    let current;
    let mounted;
    let dispose;
    expandicon = new ChevronExpand({
        props: {
            width: "15px",
            style: "min-width: 1em; padding: 0 1pt;"
        }
    });
    let each_value_1 = ctx[3];
    let each_blocks = [];
    for (let i = 0; i < each_value_1.length; i += 1) {
        each_blocks[i] = create_each_block_1$9(get_each_context_1$9(ctx, each_value_1, i));
    }
    const out = /* @__PURE__ */ __name((i) => transition_out(each_blocks[i], 1, 1, () => {
        each_blocks[i] = null;
    }), "out");
    let if_block0 = ctx[29] && create_if_block_7$1(ctx);
    const if_block_creators = [create_if_block_3$2, create_if_block_4$2];
    const if_blocks = [];

    function select_block_type_1(ctx2, dirty) {
        if (ctx2[32]) {
            return 0;
        }
        if (ctx2[3].length > 0) {
            return 1;
        }
        return -1;
    }

    __name(select_block_type_1, "select_block_type_1");
    if (~(current_block_type_index = select_block_type_1(ctx))) {
        if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    }
    let if_block2 = (ctx[0] || ctx[1]?.length > 0) && create_if_block$e(ctx);
    return {
        c() {
            div = element("div");
            input0 = element("input");
            t0 = space();
            create_component(expandicon.$$.fragment);
            t1 = space();
            ul = element("ul");
            for (let i = 0; i < each_blocks.length; i += 1) {
                each_blocks[i].c();
            }
            t2 = space();
            li = element("li");
            input1 = element("input");
            t3 = space();
            if (if_block0) {
                if_block0.c();
            }
            t4 = space();
            if (if_block1) {
                if_block1.c();
            }
            t5 = space();
            if (if_block2) {
                if_block2.c();
            }
            input0.required = ctx[30];
            attr(input0, "tabindex", "-1");
            attr(input0, "aria-hidden", "true");
            attr(input0, "aria-label", "ignore this, used only to prevent form submission if select is required but empty");
            attr(input0, "class", "form-control svelte-1w91bdr");
            attr(input1, "class", input1_class_value = null_to_empty(ctx[22]) + " svelte-1w91bdr");
            attr(input1, "autocomplete", ctx[31]);
            attr(input1, "id", ctx[13]);
            attr(input1, "name", ctx[14]);
            input1.disabled = ctx[32];
            attr(input1, "placeholder", input1_placeholder_value = ctx[4].length ? `` : ctx[12]);
            attr(input1, "aria-invalid", input1_aria_invalid_value = ctx[9] ? `true` : null);
            set_style(li, "display", "contents");
            attr(li, "class", "svelte-1w91bdr");
            attr(ul, "class", ul_class_value = "selected " + ctx[17] + " svelte-1w91bdr");
            attr(div, "aria-expanded", ctx[6]);
            attr(div, "aria-multiselectable", div_aria_multiselectable_value = ctx[10] === null || ctx[10] > 1);
            attr(div, "class", div_class_value = "multiselect " + ctx[16] + " svelte-1w91bdr");
            attr(div, "title", div_title_value = ctx[32] ? ctx[33] : null);
            attr(div, "aria-disabled", div_aria_disabled_value = ctx[32] ? `true` : null);
            toggle_class(div, "disabled", ctx[32]);
            toggle_class(div, "single", ctx[10] === 1);
            toggle_class(div, "open", ctx[6]);
            toggle_class(div, "invalid", ctx[9]);
        },
        m(target, anchor) {
            insert(target, div, anchor);
            append(div, input0);
            set_input_value(input0, ctx[34]);
            append(div, t0);
            mount_component(expandicon, div, null);
            append(div, t1);
            append(div, ul);
            for (let i = 0; i < each_blocks.length; i += 1) {
                each_blocks[i].m(ul, null);
            }
            append(ul, t2);
            append(ul, li);
            append(li, input1);
            ctx[56](input1);
            set_input_value(input1, ctx[0]);
            append(div, t3);
            if (if_block0) {
                if_block0.m(div, null);
            }
            append(div, t4);
            if (~current_block_type_index) {
                if_blocks[current_block_type_index].m(div, null);
            }
            append(div, t5);
            if (if_block2) {
                if_block2.m(div, null);
            }
            ctx[71](div);
            current = true;
            if (!mounted) {
                dispose = [
                    listen(window, "click", ctx[51]),
                    listen(input0, "input", ctx[52]),
                    listen(input0, "invalid", ctx[53]),
                    listen(input1, "input", ctx[57]),
                    listen(input1, "mouseup", self(stop_propagation(ctx[58]))),
                    listen(input1, "keydown", ctx[41]),
                    listen(input1, "focus", ctx[59]),
                    listen(div, "mouseup", stop_propagation(ctx[72]))
                ];
                mounted = true;
            }
        },
        p(ctx2, dirty) {
            if (!current || dirty[0] & 1073741824) {
                input0.required = ctx2[30];
            }
            if (dirty[1] & 8 && input0.value !== ctx2[34]) {
                set_input_value(input0, ctx2[34]);
            }
            if (dirty[0] & 142868488 | dirty[1] & 4354 | dirty[2] & 2048) {
                each_value_1 = ctx2[3];
                let i;
                for (i = 0; i < each_value_1.length; i += 1) {
                    const child_ctx = get_each_context_1$9(ctx2, each_value_1, i);
                    if (each_blocks[i]) {
                        each_blocks[i].p(child_ctx, dirty);
                        transition_in(each_blocks[i], 1);
                    }
                    else {
                        each_blocks[i] = create_each_block_1$9(child_ctx);
                        each_blocks[i].c();
                        transition_in(each_blocks[i], 1);
                        each_blocks[i].m(ul, t2);
                    }
                }
                group_outros();
                for (i = each_value_1.length; i < each_blocks.length; i += 1) {
                    out(i);
                }
                check_outros();
            }
            if (!current || dirty[0] & 4194304 && input1_class_value !== (input1_class_value = null_to_empty(ctx2[22]) + " svelte-1w91bdr")) {
                attr(input1, "class", input1_class_value);
            }
            if (!current || dirty[1] & 1) {
                attr(input1, "autocomplete", ctx2[31]);
            }
            if (!current || dirty[0] & 8192) {
                attr(input1, "id", ctx2[13]);
            }
            if (!current || dirty[0] & 16384) {
                attr(input1, "name", ctx2[14]);
            }
            if (!current || dirty[1] & 2) {
                input1.disabled = ctx2[32];
            }
            if (!current || dirty[0] & 4112 && input1_placeholder_value !== (input1_placeholder_value = ctx2[4].length ? `` : ctx2[12])) {
                attr(input1, "placeholder", input1_placeholder_value);
            }
            if (!current || dirty[0] & 512 && input1_aria_invalid_value !== (input1_aria_invalid_value = ctx2[9] ? `true` : null)) {
                attr(input1, "aria-invalid", input1_aria_invalid_value);
            }
            if (dirty[0] & 1 && input1.value !== ctx2[0]) {
                set_input_value(input1, ctx2[0]);
            }
            if (!current || dirty[0] & 131072 && ul_class_value !== (ul_class_value = "selected " + ctx2[17] + " svelte-1w91bdr")) {
                attr(ul, "class", ul_class_value);
            }
            if (ctx2[29]) {
                if (if_block0) {
                    if_block0.p(ctx2, dirty);
                    if (dirty[0] & 536870912) {
                        transition_in(if_block0, 1);
                    }
                }
                else {
                    if_block0 = create_if_block_7$1(ctx2);
                    if_block0.c();
                    transition_in(if_block0, 1);
                    if_block0.m(div, t4);
                }
            }
            else if (if_block0) {
                group_outros();
                transition_out(if_block0, 1, 1, () => {
                    if_block0 = null;
                });
                check_outros();
            }
            let previous_block_index = current_block_type_index;
            current_block_type_index = select_block_type_1(ctx2);
            if (current_block_type_index === previous_block_index) {
                if (~current_block_type_index) {
                    if_blocks[current_block_type_index].p(ctx2, dirty);
                }
            }
            else {
                if (if_block1) {
                    group_outros();
                    transition_out(if_blocks[previous_block_index], 1, 1, () => {
                        if_blocks[previous_block_index] = null;
                    });
                    check_outros();
                }
                if (~current_block_type_index) {
                    if_block1 = if_blocks[current_block_type_index];
                    if (!if_block1) {
                        if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx2);
                        if_block1.c();
                    }
                    else {
                        if_block1.p(ctx2, dirty);
                    }
                    transition_in(if_block1, 1);
                    if_block1.m(div, t5);
                }
                else {
                    if_block1 = null;
                }
            }
            if (ctx2[0] || ctx2[1]?.length > 0) {
                if (if_block2) {
                    if_block2.p(ctx2, dirty);
                    if (dirty[0] & 3) {
                        transition_in(if_block2, 1);
                    }
                }
                else {
                    if_block2 = create_if_block$e(ctx2);
                    if_block2.c();
                    transition_in(if_block2, 1);
                    if_block2.m(div, null);
                }
            }
            else if (if_block2) {
                group_outros();
                transition_out(if_block2, 1, 1, () => {
                    if_block2 = null;
                });
                check_outros();
            }
            if (!current || dirty[0] & 64) {
                attr(div, "aria-expanded", ctx2[6]);
            }
            if (!current || dirty[0] & 1024 && div_aria_multiselectable_value !== (div_aria_multiselectable_value = ctx2[10] === null || ctx2[10] > 1)) {
                attr(div, "aria-multiselectable", div_aria_multiselectable_value);
            }
            if (!current || dirty[0] & 65536 && div_class_value !== (div_class_value = "multiselect " + ctx2[16] + " svelte-1w91bdr")) {
                attr(div, "class", div_class_value);
            }
            if (!current || dirty[1] & 6 && div_title_value !== (div_title_value = ctx2[32] ? ctx2[33] : null)) {
                attr(div, "title", div_title_value);
            }
            if (!current || dirty[1] & 2 && div_aria_disabled_value !== (div_aria_disabled_value = ctx2[32] ? `true` : null)) {
                attr(div, "aria-disabled", div_aria_disabled_value);
            }
            if (dirty[0] & 65536 | dirty[1] & 2) {
                toggle_class(div, "disabled", ctx2[32]);
            }
            if (dirty[0] & 66560) {
                toggle_class(div, "single", ctx2[10] === 1);
            }
            if (dirty[0] & 65600) {
                toggle_class(div, "open", ctx2[6]);
            }
            if (dirty[0] & 66048) {
                toggle_class(div, "invalid", ctx2[9]);
            }
        },
        i(local) {
            if (current) {
                return;
            }
            transition_in(expandicon.$$.fragment, local);
            for (let i = 0; i < each_value_1.length; i += 1) {
                transition_in(each_blocks[i]);
            }
            transition_in(if_block0);
            transition_in(if_block1);
            transition_in(if_block2);
            current = true;
        },
        o(local) {
            transition_out(expandicon.$$.fragment, local);
            each_blocks = each_blocks.filter(Boolean);
            for (let i = 0; i < each_blocks.length; i += 1) {
                transition_out(each_blocks[i]);
            }
            transition_out(if_block0);
            transition_out(if_block1);
            transition_out(if_block2);
            current = false;
        },
        d(detaching) {
            if (detaching) {
                detach(div);
            }
            destroy_component(expandicon);
            destroy_each(each_blocks, detaching);
            ctx[56](null);
            if (if_block0) {
                if_block0.d();
            }
            if (~current_block_type_index) {
                if_blocks[current_block_type_index].d();
            }
            if (if_block2) {
                if_block2.d();
            }
            ctx[71](null);
            mounted = false;
            run_all(dispose);
        }
    };
}

__name(create_fragment$v, "create_fragment$v");

function instance$u($$self, $$props, $$invalidate) {
    let formValue;
    let is_selected;
    let { $$slots: slots = {}, $$scope } = $$props;
    let { searchText = `` } = $$props;
    let { showOptions = false } = $$props;
    let { maxSelect = null } = $$props;
    let { maxSelectMsg = null } = $$props;
    let { disabled = false } = $$props;
    let { disabledTitle = `This field is disabled` } = $$props;
    let { options } = $$props;
    let { matchingOptions = [] } = $$props;
    let { selected = [] } = $$props;
    let { selectedLabels = [] } = $$props;
    let { selectedValues = [] } = $$props;
    let { input = null } = $$props;
    let { outerDiv = null } = $$props;
    let { placeholder = void 0 } = $$props;
    let { id = void 0 } = $$props;
    let { name = id } = $$props;
    let { noOptionsMsg = `No matching options` } = $$props;
    let { activeOption = null } = $$props;
    let {
        filterFunc = /* @__PURE__ */ __name((op, searchText2) => {
            if (!searchText2) {
                return true;
            }
            return `${get_label(op)}`.toLowerCase().includes(searchText2.toLowerCase());
        }, "filterFunc")
    } = $$props;
    let { outerDivClass = `` } = $$props;
    let { ulSelectedClass = `` } = $$props;
    let { liSelectedClass = `` } = $$props;
    let { ulOptionsClass = `` } = $$props;
    let { liOptionClass = `` } = $$props;
    let { liActiveOptionClass = `` } = $$props;
    let { inputClass = `` } = $$props;
    let { removeBtnTitle = `Remove` } = $$props;
    let { removeAllTitle = `Remove all` } = $$props;
    let { defaultDisabledTitle = `This option is disabled` } = $$props;
    let { allowUserOptions = false } = $$props;
    let { parseLabelsAsHtml = false } = $$props;
    let { addOptionMsg = `Create this option...` } = $$props;
    let { autoScroll = true } = $$props;
    let { loading = false } = $$props;
    let { required = false } = $$props;
    let { autocomplete = `off` } = $$props;
    let { invalid = false } = $$props;
    let { sortSelected = false } = $$props;
    if (!(options?.length > 0)) {
        if (allowUserOptions) {
            options = [];
        }
        else {
            console.error(`MultiSelect received no options`);
        }
    }
    if (parseLabelsAsHtml && allowUserOptions) {
        console.warn(`Don't combine parseLabelsAsHtml and allowUserOptions. It's susceptible to XSS attacks!`);
    }
    if (maxSelect !== null && maxSelect < 1) {
        console.error(`maxSelect must be null or positive integer, got ${maxSelect}`);
    }
    if (!Array.isArray(selected)) {
        console.error(`selected prop must be an array, got ${selected}`);
    }
    const dispatch2 = createEventDispatcher();
    let activeMsg = false;
    let wiggle = false;

    function add(label) {
        if (maxSelect && maxSelect > 1 && selected.length >= maxSelect) {
            $$invalidate(36, wiggle = true);
        }
        if (maxSelect === null || maxSelect === 1 || selected.length < maxSelect) {
            let option = options.find((op) => get_label(op) === label);
            if (!option && [true, `append`].includes(allowUserOptions) && searchText.length > 0) {
                if (typeof options[0] === `object`) {
                    option = { label: searchText, value: searchText };
                }
                else {
                    if ([`number`, `undefined`].includes(typeof options[0]) && !isNaN(Number(searchText))) {
                        option = Number(searchText);
                    }
                    else {
                        option = searchText;
                    }
                }
                if (allowUserOptions === `append`) {
                    $$invalidate(1, options = [...options, option]);
                }
            }
            $$invalidate(0, searchText = ``);
            if (!option) {
                console.error(`MultiSelect: option with label ${label} not found`);
                return;
            }
            if (maxSelect === 1) {
                $$invalidate(3, selected = [option]);
            }
            else {
                $$invalidate(3, selected = [...selected, option]);
                if (sortSelected === true) {
                    $$invalidate(3, selected = selected.sort((op1, op2) => {
                        const [label1, label2] = [get_label(op1), get_label(op2)];
                        return `${label1}`.localeCompare(`${label2}`);
                    }));
                }
                else if (typeof sortSelected === `function`) {
                    $$invalidate(3, selected = selected.sort(sortSelected));
                }
            }
            if (selected.length === maxSelect) {
                setOptionsVisible(false);
            }
            else {
                input?.focus();
            }
            dispatch2(`add`, { option });
            dispatch2(`change`, { option, type: `add` });
        }
    }

    __name(add, "add");

    function remove(label) {
        if (selected.length === 0) {
            return;
        }
        selected.splice(selectedLabels.lastIndexOf(label), 1);
        $$invalidate(3, selected);
        const option = options.find((option2) => get_label(option2) === label) ?? (allowUserOptions && {
            label,
            value: label
        });
        if (!option) {
            return console.error(`MultiSelect: option with label ${label} not found`);
        }
        dispatch2(`remove`, { option });
        dispatch2(`change`, { option, type: `remove` });
    }

    __name(remove, "remove");

    function setOptionsVisible(show) {
        if (disabled) {
            return;
        }
        $$invalidate(6, showOptions = show);
        if (show) {
            input?.focus();
            dispatch2(`focus`);
        }
        else {
            input?.blur();
            $$invalidate(5, activeOption = null);
            dispatch2(`blur`);
        }
    }

    __name(setOptionsVisible, "setOptionsVisible");

    async function handleKeydown(event) {
        if (event.key === `Escape` || event.key === `Tab`) {
            setOptionsVisible(false);
            $$invalidate(0, searchText = ``);
        }
        else if (event.key === `Enter`) {
            event.preventDefault();
            if (activeOption) {
                const label = get_label(activeOption);
                selectedLabels.includes(label) ? remove(label) : add(label);
                $$invalidate(0, searchText = ``);
            }
            else if (allowUserOptions && searchText.length > 0) {
                add(searchText);
            }
            else {
                setOptionsVisible(true);
            }
        }
        else if ([`ArrowDown`, `ArrowUp`].includes(event.key)) {
            if (activeOption === null && matchingOptions.length > 0) {
                $$invalidate(5, activeOption = matchingOptions[0]);
                return;
            }
            else if (allowUserOptions && searchText.length > 0) {
                $$invalidate(35, activeMsg = !activeMsg);
                return;
            }
            else if (activeOption === null) {
                return;
            }
            const increment = event.key === `ArrowUp` ? -1 : 1;
            const newActiveIdx = matchingOptions.indexOf(activeOption) + increment;
            if (newActiveIdx < 0) {
                $$invalidate(5, activeOption = matchingOptions[matchingOptions.length - 1]);
            }
            else if (newActiveIdx === matchingOptions.length) {
                $$invalidate(5, activeOption = matchingOptions[0]);
            }
            else {
                $$invalidate(5, activeOption = matchingOptions[newActiveIdx]);
            }
            if (autoScroll) {
                setTimeout(
                    () => {
                        const li = document.querySelector(`ul.options > li.active`);
                        if (li) {
                            li.parentNode?.scrollIntoView({ block: `center` });
                            li.scrollIntoViewIfNeeded();
                        }
                    },
                    10
                );
            }
        }
        else if (event.key === `Backspace` && selectedLabels.length > 0 && !searchText) {
            remove(selectedLabels.at(-1));
        }
    }

    __name(handleKeydown, "handleKeydown");

    function remove_all() {
        dispatch2(`removeAll`, { options: selected });
        dispatch2(`change`, { options: selected, type: `removeAll` });
        $$invalidate(3, selected = []);
        $$invalidate(0, searchText = ``);
    }

    __name(remove_all, "remove_all");
    const if_enter_or_space = /* @__PURE__ */ __name((handler) => (event) => {
        if ([`Enter`, `Space`].includes(event.code)) {
            event.preventDefault();
            handler();
        }
    }, "if_enter_or_space");

    function mousedown_handler2(event) {
        bubble.call(this, $$self, event);
    }

    __name(mousedown_handler2, "mousedown_handler");

    function mousedown_handler_1(event) {
        bubble.call(this, $$self, event);
    }

    __name(mousedown_handler_1, "mousedown_handler_1");
    const click_handler2 = /* @__PURE__ */ __name((event) => {
        if (outerDiv && !outerDiv.contains(event.target)) {
            setOptionsVisible(false);
        }
    }, "click_handler");

    function input0_input_handler() {
        formValue = this.value;
        $$invalidate(34, formValue), $$invalidate(44, selectedValues), $$invalidate(3, selected);
    }

    __name(input0_input_handler, "input0_input_handler");
    const invalid_handler = /* @__PURE__ */ __name(() => $$invalidate(9, invalid = true), "invalid_handler");
    const mouseup_handler = /* @__PURE__ */ __name((option) => remove(get_label(option)), "mouseup_handler");
    const keydown_handler = /* @__PURE__ */ __name((option) => remove(get_label(option)), "keydown_handler");

    function input1_binding($$value) {
        binding_callbacks[$$value ? "unshift" : "push"](() => {
            input = $$value;
            $$invalidate(7, input);
        });
    }

    __name(input1_binding, "input1_binding");

    function input1_input_handler() {
        searchText = this.value;
        $$invalidate(0, searchText);
    }

    __name(input1_input_handler, "input1_input_handler");
    const mouseup_handler_1 = /* @__PURE__ */ __name(() => setOptionsVisible(true), "mouseup_handler_1");
    const focus_handler = /* @__PURE__ */ __name(() => setOptionsVisible(true), "focus_handler");

    function wiggle_1_wiggle_binding(value) {
        wiggle = value;
        $$invalidate(36, wiggle);
    }

    __name(wiggle_1_wiggle_binding, "wiggle_1_wiggle_binding");
    const mouseup_handler_2 = /* @__PURE__ */ __name((disabled2, label) => {
        if (!disabled2) {
            is_selected(label) ? remove(label) : add(label);
        }
    }, "mouseup_handler_2");
    const mouseover_handler = /* @__PURE__ */ __name((disabled2, option) => {
        if (!disabled2) {
            $$invalidate(5, activeOption = option);
        }
    }, "mouseover_handler");
    const focus_handler_1 = /* @__PURE__ */ __name((disabled2, option) => {
        if (!disabled2) {
            $$invalidate(5, activeOption = option);
        }
    }, "focus_handler_1");
    const mouseout_handler = /* @__PURE__ */ __name(() => $$invalidate(5, activeOption = null), "mouseout_handler");
    const blur_handler = /* @__PURE__ */ __name(() => $$invalidate(5, activeOption = null), "blur_handler");
    const mouseup_handler_3 = /* @__PURE__ */ __name(() => add(searchText), "mouseup_handler_3");
    const mouseover_handler_1 = /* @__PURE__ */ __name(() => $$invalidate(35, activeMsg = true), "mouseover_handler_1");
    const focus_handler_2 = /* @__PURE__ */ __name(() => $$invalidate(35, activeMsg = true), "focus_handler_2");
    const mouseout_handler_1 = /* @__PURE__ */ __name(() => $$invalidate(35, activeMsg = false), "mouseout_handler_1");
    const blur_handler_1 = /* @__PURE__ */ __name(() => $$invalidate(35, activeMsg = false), "blur_handler_1");

    function div_binding($$value) {
        binding_callbacks[$$value ? "unshift" : "push"](() => {
            outerDiv = $$value;
            $$invalidate(8, outerDiv);
        });
    }

    __name(div_binding, "div_binding");
    const mouseup_handler_4 = /* @__PURE__ */ __name(() => setOptionsVisible(true), "mouseup_handler_4");
    $$self.$$set = ($$props2) => {
        if ("searchText" in $$props2) {
            $$invalidate(0, searchText = $$props2.searchText);
        }
        if ("showOptions" in $$props2) {
            $$invalidate(6, showOptions = $$props2.showOptions);
        }
        if ("maxSelect" in $$props2) {
            $$invalidate(10, maxSelect = $$props2.maxSelect);
        }
        if ("maxSelectMsg" in $$props2) {
            $$invalidate(11, maxSelectMsg = $$props2.maxSelectMsg);
        }
        if ("disabled" in $$props2) {
            $$invalidate(32, disabled = $$props2.disabled);
        }
        if ("disabledTitle" in $$props2) {
            $$invalidate(33, disabledTitle = $$props2.disabledTitle);
        }
        if ("options" in $$props2) {
            $$invalidate(1, options = $$props2.options);
        }
        if ("matchingOptions" in $$props2) {
            $$invalidate(2, matchingOptions = $$props2.matchingOptions);
        }
        if ("selected" in $$props2) {
            $$invalidate(3, selected = $$props2.selected);
        }
        if ("selectedLabels" in $$props2) {
            $$invalidate(4, selectedLabels = $$props2.selectedLabels);
        }
        if ("selectedValues" in $$props2) {
            $$invalidate(44, selectedValues = $$props2.selectedValues);
        }
        if ("input" in $$props2) {
            $$invalidate(7, input = $$props2.input);
        }
        if ("outerDiv" in $$props2) {
            $$invalidate(8, outerDiv = $$props2.outerDiv);
        }
        if ("placeholder" in $$props2) {
            $$invalidate(12, placeholder = $$props2.placeholder);
        }
        if ("id" in $$props2) {
            $$invalidate(13, id = $$props2.id);
        }
        if ("name" in $$props2) {
            $$invalidate(14, name = $$props2.name);
        }
        if ("noOptionsMsg" in $$props2) {
            $$invalidate(15, noOptionsMsg = $$props2.noOptionsMsg);
        }
        if ("activeOption" in $$props2) {
            $$invalidate(5, activeOption = $$props2.activeOption);
        }
        if ("filterFunc" in $$props2) {
            $$invalidate(45, filterFunc = $$props2.filterFunc);
        }
        if ("outerDivClass" in $$props2) {
            $$invalidate(16, outerDivClass = $$props2.outerDivClass);
        }
        if ("ulSelectedClass" in $$props2) {
            $$invalidate(17, ulSelectedClass = $$props2.ulSelectedClass);
        }
        if ("liSelectedClass" in $$props2) {
            $$invalidate(18, liSelectedClass = $$props2.liSelectedClass);
        }
        if ("ulOptionsClass" in $$props2) {
            $$invalidate(19, ulOptionsClass = $$props2.ulOptionsClass);
        }
        if ("liOptionClass" in $$props2) {
            $$invalidate(20, liOptionClass = $$props2.liOptionClass);
        }
        if ("liActiveOptionClass" in $$props2) {
            $$invalidate(21, liActiveOptionClass = $$props2.liActiveOptionClass);
        }
        if ("inputClass" in $$props2) {
            $$invalidate(22, inputClass = $$props2.inputClass);
        }
        if ("removeBtnTitle" in $$props2) {
            $$invalidate(23, removeBtnTitle = $$props2.removeBtnTitle);
        }
        if ("removeAllTitle" in $$props2) {
            $$invalidate(24, removeAllTitle = $$props2.removeAllTitle);
        }
        if ("defaultDisabledTitle" in $$props2) {
            $$invalidate(25, defaultDisabledTitle = $$props2.defaultDisabledTitle);
        }
        if ("allowUserOptions" in $$props2) {
            $$invalidate(26, allowUserOptions = $$props2.allowUserOptions);
        }
        if ("parseLabelsAsHtml" in $$props2) {
            $$invalidate(27, parseLabelsAsHtml = $$props2.parseLabelsAsHtml);
        }
        if ("addOptionMsg" in $$props2) {
            $$invalidate(28, addOptionMsg = $$props2.addOptionMsg);
        }
        if ("autoScroll" in $$props2) {
            $$invalidate(46, autoScroll = $$props2.autoScroll);
        }
        if ("loading" in $$props2) {
            $$invalidate(29, loading = $$props2.loading);
        }
        if ("required" in $$props2) {
            $$invalidate(30, required = $$props2.required);
        }
        if ("autocomplete" in $$props2) {
            $$invalidate(31, autocomplete = $$props2.autocomplete);
        }
        if ("invalid" in $$props2) {
            $$invalidate(9, invalid = $$props2.invalid);
        }
        if ("sortSelected" in $$props2) {
            $$invalidate(47, sortSelected = $$props2.sortSelected);
        }
        if ("$$scope" in $$props2) {
            $$invalidate(73, $$scope = $$props2.$$scope);
        }
    };
    $$self.$$.update = () => {
        if ($$self.$$.dirty[0] & 8) {
            $$invalidate(4, selectedLabels = selected.map(get_label));
        }
        if ($$self.$$.dirty[0] & 8) {
            $$invalidate(44, selectedValues = selected.map(get_value));
        }
        if ($$self.$$.dirty[1] & 8192) {
            $$invalidate(34, formValue = selectedValues.join(`,`));
        }
        if ($$self.$$.dirty[1] & 8) {
            if (formValue) {
                $$invalidate(9, invalid = false);
            }
        }
        if ($$self.$$.dirty[0] & 19 | $$self.$$.dirty[1] & 16384) {
            $$invalidate(2, matchingOptions = options.filter((op) => filterFunc(op, searchText) && !(op instanceof Object && op.disabled) && !selectedLabels.includes(get_label(op))));
        }
        if ($$self.$$.dirty[0] & 36) {
            if (activeOption && !matchingOptions.includes(activeOption)) {
                $$invalidate(5, activeOption = null);
            }
        }
        if ($$self.$$.dirty[0] & 16) {
            $$invalidate(37, is_selected = /* @__PURE__ */ __name((label) => selectedLabels.includes(label), "is_selected"));
        }
    };
    return [
        searchText,
        options,
        matchingOptions,
        selected,
        selectedLabels,
        activeOption,
        showOptions,
        input,
        outerDiv,
        invalid,
        maxSelect,
        maxSelectMsg,
        placeholder,
        id,
        name,
        noOptionsMsg,
        outerDivClass,
        ulSelectedClass,
        liSelectedClass,
        ulOptionsClass,
        liOptionClass,
        liActiveOptionClass,
        inputClass,
        removeBtnTitle,
        removeAllTitle,
        defaultDisabledTitle,
        allowUserOptions,
        parseLabelsAsHtml,
        addOptionMsg,
        loading,
        required,
        autocomplete,
        disabled,
        disabledTitle,
        formValue,
        activeMsg,
        wiggle,
        is_selected,
        add,
        remove,
        setOptionsVisible,
        handleKeydown,
        remove_all,
        if_enter_or_space,
        selectedValues,
        filterFunc,
        autoScroll,
        sortSelected,
        slots,
        mousedown_handler2,
        mousedown_handler_1,
        click_handler2,
        input0_input_handler,
        invalid_handler,
        mouseup_handler,
        keydown_handler,
        input1_binding,
        input1_input_handler,
        mouseup_handler_1,
        focus_handler,
        wiggle_1_wiggle_binding,
        mouseup_handler_2,
        mouseover_handler,
        focus_handler_1,
        mouseout_handler,
        blur_handler,
        mouseup_handler_3,
        mouseover_handler_1,
        focus_handler_2,
        mouseout_handler_1,
        blur_handler_1,
        div_binding,
        mouseup_handler_4,
        $$scope
    ];
}

__name(instance$u, "instance$u");

class MultiSelect extends SvelteComponent {
    constructor(options) {
        super();
        init(
            this,
            options,
            instance$u,
            create_fragment$v,
            safe_not_equal,
            {
                searchText: 0,
                showOptions: 6,
                maxSelect: 10,
                maxSelectMsg: 11,
                disabled: 32,
                disabledTitle: 33,
                options: 1,
                matchingOptions: 2,
                selected: 3,
                selectedLabels: 4,
                selectedValues: 44,
                input: 7,
                outerDiv: 8,
                placeholder: 12,
                id: 13,
                name: 14,
                noOptionsMsg: 15,
                activeOption: 5,
                filterFunc: 45,
                outerDivClass: 16,
                ulSelectedClass: 17,
                liSelectedClass: 18,
                ulOptionsClass: 19,
                liOptionClass: 20,
                liActiveOptionClass: 21,
                inputClass: 22,
                removeBtnTitle: 23,
                removeAllTitle: 24,
                defaultDisabledTitle: 25,
                allowUserOptions: 26,
                parseLabelsAsHtml: 27,
                addOptionMsg: 28,
                autoScroll: 46,
                loading: 29,
                required: 30,
                autocomplete: 31,
                invalid: 9,
                sortSelected: 47
            },
            null,
            [-1, -1, -1]
        );
    }
}

__name(MultiSelect, "MultiSelect");
const ActionDamageComponent_svelte_svelte_type_style_lang = "";

function get_each_context$i(ctx, list, i) {
    const child_ctx = ctx.slice();
    child_ctx[14] = list[i];
    child_ctx[15] = list;
    child_ctx[16] = i;
    return child_ctx;
}

__name(get_each_context$i, "get_each_context$i");
function create_remove_icon_slot_1(ctx) {
    let i;
    return {
        c() {
            i = element("i");
            attr(i, "slot", "remove-icon");
            attr(i, "class", "fa-solid fa-xmark");
        },
        m(target, anchor) {
            insert(target, i, anchor);
        },
        p: noop,
        d(detaching) {
            if (detaching)
                detach(i);
        }
    };
}
__name(create_remove_icon_slot_1, "create_remove_icon_slot_1");
function create_remove_icon_slot(ctx) {
    let i;
    return {
        c() {
            i = element("i");
            attr(i, "slot", "remove-icon");
            attr(i, "class", "fa-solid fa-xmark");
        },
        m(target, anchor) {
            insert(target, i, anchor);
        },
        p: noop,
        d(detaching) {
            if (detaching)
                detach(i);
        }
    };
}
__name(create_remove_icon_slot, "create_remove_icon_slot");

function create_each_block$i(key_1, ctx) {
    let div1;
    let div0;
    let input0;
    let t0;
    let multiselect0;
    let updating_selected;
    let t1;
    let input1;
    let t2;
    let multiselect1;
    let updating_selected_1;
    let t3;
    let label;
    let input2;
    let t4;
    let t5;
    let i;
    let current;
    let mounted;
    let dispose;

    function input0_input_handler() {
        ctx[6].call(input0, ctx[15], ctx[16]);
    }

    __name(input0_input_handler, "input0_input_handler");

    function multiselect0_selected_binding(value) {
        ctx[7](value, ctx[14]);
    }

    __name(multiselect0_selected_binding, "multiselect0_selected_binding");
    let multiselect0_props = {
        options: ctx[1],
        $$slots: {
            "remove-icon": [create_remove_icon_slot_1]
        },
        $$scope: { ctx }
    };
    if (ctx[14].normal[1] !== void 0) {
        multiselect0_props.selected = ctx[14].normal[1];
    }
    multiselect0 = new MultiSelect({ props: multiselect0_props });
    binding_callbacks.push(() => bind(multiselect0, "selected", multiselect0_selected_binding));
    multiselect0.$on("change", ctx[3]);

    function input1_input_handler() {
        ctx[8].call(input1, ctx[15], ctx[16]);
    }

    __name(input1_input_handler, "input1_input_handler");

    function multiselect1_selected_binding(value) {
        ctx[9](value, ctx[14]);
    }

    __name(multiselect1_selected_binding, "multiselect1_selected_binding");
    let multiselect1_props = {
        options: ctx[1],
        $$slots: { "remove-icon": [create_remove_icon_slot] },
        $$scope: { ctx }
    };
    if (ctx[14].fail[1] !== void 0) {
        multiselect1_props.selected = ctx[14].fail[1];
    }
    multiselect1 = new MultiSelect({ props: multiselect1_props });
    binding_callbacks.push(() => bind(multiselect1, "selected", multiselect1_selected_binding));
    multiselect1.$on("change", ctx[3]);

    function input2_change_handler() {
        ctx[10].call(input2, ctx[15], ctx[16]);
    }

    __name(input2_change_handler, "input2_change_handler");

    function click_handler2() {
        return ctx[11](ctx[16]);
    }

    __name(click_handler2, "click_handler");
    return {
        key: key_1,
        first: null,
        c() {
            div1 = element("div");
            div0 = element("div");
            input0 = element("input");
            t0 = space();
            create_component(multiselect0.$$.fragment);
            t1 = space();
            input1 = element("input");
            t2 = space();
            create_component(multiselect1.$$.fragment);
            t3 = space();
            label = element("label");
            input2 = element("input");
            t4 = text("\r\n            same on fail");
            t5 = space();
            i = element("i");
            attr(input0, "class", "input normal svelte-1rgo2i6");
            attr(input1, "class", "input fail svelte-1rgo2i6");
            toggle_class(input1, "hidden", ctx[14].sameOnFail || !ctx[2].useOnFail || !ctx[2].isSubAction);
            attr(div0, "class", "dam svelte-1rgo2i6");
            attr(input2, "type", "checkbox");
            attr(label, "class", "svelte-1rgo2i6");
            toggle_class(label, "hidden", !ctx[2].useOnFail);
            attr(i, "class", "fa-solid fa-minus svelte-1rgo2i6");
            attr(div1, "class", "damage svelte-1rgo2i6");
            this.first = div1;
        },
        m(target, anchor) {
            insert(target, div1, anchor);
            append(div1, div0);
            append(div0, input0);
            set_input_value(input0, ctx[14].normal[0]);
            append(div0, t0);
            mount_component(multiselect0, div0, null);
            append(div0, t1);
            append(div0, input1);
            set_input_value(input1, ctx[14].fail[0]);
            append(div0, t2);
            mount_component(multiselect1, div0, null);
            append(div1, t3);
            append(div1, label);
            append(label, input2);
            input2.checked = ctx[14].sameOnFail;
            append(label, t4);
            append(div1, t5);
            append(div1, i);
            current = true;
            if (!mounted) {
                dispose = [
                    listen(input0, "change", ctx[3]),
                    listen(input0, "input", input0_input_handler),
                    listen(input1, "change", ctx[3]),
                    listen(input1, "input", input1_input_handler),
                    listen(input2, "change", ctx[3]),
                    listen(input2, "change", input2_change_handler),
                    listen(i, "click", click_handler2)
                ];
                mounted = true;
            }
        },
        p(new_ctx, dirty) {
            ctx = new_ctx;
            if (dirty & 4 && input0.value !== ctx[14].normal[0]) {
                set_input_value(input0, ctx[14].normal[0]);
            }
            const multiselect0_changes = {};
            if (dirty & 2) {
                multiselect0_changes.options = ctx[1];
            }
            if (dirty & 131072) {
                multiselect0_changes.$$scope = { dirty, ctx };
            }
            if (!updating_selected && dirty & 4) {
                updating_selected = true;
                multiselect0_changes.selected = ctx[14].normal[1];
                add_flush_callback(() => updating_selected = false);
            }
            multiselect0.$set(multiselect0_changes);
            if (dirty & 4 && input1.value !== ctx[14].fail[0]) {
                set_input_value(input1, ctx[14].fail[0]);
            }
            if (dirty & 4) {
                toggle_class(input1, "hidden", ctx[14].sameOnFail || !ctx[2].useOnFail || !ctx[2].isSubAction);
            }
            const multiselect1_changes = {};
            if (dirty & 2) {
                multiselect1_changes.options = ctx[1];
            }
            if (dirty & 131072) {
                multiselect1_changes.$$scope = { dirty, ctx };
            }
            if (!updating_selected_1 && dirty & 4) {
                updating_selected_1 = true;
                multiselect1_changes.selected = ctx[14].fail[1];
                add_flush_callback(() => updating_selected_1 = false);
            }
            multiselect1.$set(multiselect1_changes);
            if (dirty & 4) {
                input2.checked = ctx[14].sameOnFail;
            }
            if (dirty & 4) {
                toggle_class(label, "hidden", !ctx[2].useOnFail);
            }
        },
        i(local) {
            if (current) {
                return;
            }
            transition_in(multiselect0.$$.fragment, local);
            transition_in(multiselect1.$$.fragment, local);
            current = true;
        },
        o(local) {
            transition_out(multiselect0.$$.fragment, local);
            transition_out(multiselect1.$$.fragment, local);
            current = false;
        },
        d(detaching) {
            if (detaching) {
                detach(div1);
            }
            destroy_component(multiselect0);
            destroy_component(multiselect1);
            mounted = false;
            run_all(dispose);
        }
    };
}

__name(create_each_block$i, "create_each_block$i");

function create_fragment$u(ctx) {
    let each_blocks = [];
    let each_1_lookup = /* @__PURE__ */ new Map();
    let t;
    let i;
    let current;
    let mounted;
    let dispose;
    let each_value = ctx[2].damage;
    const get_key = /* @__PURE__ */ __name((ctx2) => ctx2[16], "get_key");
    for (let i2 = 0; i2 < each_value.length; i2 += 1) {
        let child_ctx = get_each_context$i(ctx, each_value, i2);
        let key = get_key(child_ctx);
        each_1_lookup.set(key, each_blocks[i2] = create_each_block$i(key, child_ctx));
    }
    return {
        c() {
            for (let i2 = 0; i2 < each_blocks.length; i2 += 1) {
                each_blocks[i2].c();
            }
            t = space();
            i = element("i");
            attr(i, "class", "fa-solid fa-plus");
        },
        m(target, anchor) {
            for (let i2 = 0; i2 < each_blocks.length; i2 += 1) {
                each_blocks[i2].m(target, anchor);
            }
            insert(target, t, anchor);
            insert(target, i, anchor);
            current = true;
            if (!mounted) {
                dispose = listen(i, "click", ctx[5]);
                mounted = true;
            }
        },
        p(ctx2, [dirty]) {
            if (dirty & 30) {
                each_value = ctx2[2].damage;
                group_outros();
                each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx2, each_value, each_1_lookup, t.parentNode, outro_and_destroy_block, create_each_block$i, t, get_each_context$i);
                check_outros();
            }
        },
        i(local) {
            if (current) {
                return;
            }
            for (let i2 = 0; i2 < each_value.length; i2 += 1) {
                transition_in(each_blocks[i2]);
            }
            current = true;
        },
        o(local) {
            for (let i2 = 0; i2 < each_blocks.length; i2 += 1) {
                transition_out(each_blocks[i2]);
            }
            current = false;
        },
        d(detaching) {
            for (let i2 = 0; i2 < each_blocks.length; i2 += 1) {
                each_blocks[i2].d(detaching);
            }
            if (detaching) {
                detach(t);
            }
            if (detaching) {
                detach(i);
            }
            mounted = false;
            dispose();
        }
    };
}

__name(create_fragment$u, "create_fragment$u");

function instance$t($$self, $$props, $$invalidate) {
    let $actionStore, $$unsubscribe_actionStore = noop,
        $$subscribe_actionStore = /* @__PURE__ */ __name(() => ($$unsubscribe_actionStore(), $$unsubscribe_actionStore = subscribe(actionStore, ($$value) => $$invalidate(2, $actionStore = $$value)), actionStore), "$$subscribe_actionStore");
    $$self.$$.on_destroy.push(() => $$unsubscribe_actionStore());
    let { actionStore } = $$props;
    $$subscribe_actionStore();
    const { application } = getContext("external");
    let damageTypeOptions = [];
    for (const [key1, label1] of Object.entries(CONFIG.ARd20.DamageTypes)) {
        for (const [key2, label2] of Object.entries(CONFIG.ARd20.DamageSubTypes)) {
            damageTypeOptions = [
                ...damageTypeOptions,
                {
                    label: `${localize(label1)} ${localize(label2)}`,
                    value: [key1, key2]
                }
            ];
        }
    }

    async function submit() {
        await application.submit();
    }

    __name(submit, "submit");

    async function deleteDamage(index) {
        $actionStore.damage.splice(index, 1);
        await application.submit();
        set_store_value(actionStore, $actionStore.damage = [...$actionStore.damage], $actionStore);
    }

    __name(deleteDamage, "deleteDamage");

    async function addDamage() {
        let newDamage = {
            normal: ["", []],
            fail: ["", []],
            sameOnFail: true
        };
        set_store_value(actionStore, $actionStore.damage = [...$actionStore.damage, newDamage], $actionStore);
        await application.submit();
    }

    __name(addDamage, "addDamage");

    function input0_input_handler(each_value, index) {
        each_value[index].normal[0] = this.value;
        actionStore.set($actionStore);
    }

    __name(input0_input_handler, "input0_input_handler");

    function multiselect0_selected_binding(value, dam) {
        if ($$self.$$.not_equal(dam.normal[1], value)) {
            dam.normal[1] = value;
            actionStore.set($actionStore);
        }
    }

    __name(multiselect0_selected_binding, "multiselect0_selected_binding");

    function input1_input_handler(each_value, index) {
        each_value[index].fail[0] = this.value;
        actionStore.set($actionStore);
    }

    __name(input1_input_handler, "input1_input_handler");

    function multiselect1_selected_binding(value, dam) {
        if ($$self.$$.not_equal(dam.fail[1], value)) {
            dam.fail[1] = value;
            actionStore.set($actionStore);
        }
    }

    __name(multiselect1_selected_binding, "multiselect1_selected_binding");

    function input2_change_handler(each_value, index) {
        each_value[index].sameOnFail = this.checked;
        actionStore.set($actionStore);
    }

    __name(input2_change_handler, "input2_change_handler");
    const click_handler2 = /* @__PURE__ */ __name((index) => {
        deleteDamage(index);
    }, "click_handler");
    $$self.$$set = ($$props2) => {
        if ("actionStore" in $$props2) {
            $$subscribe_actionStore($$invalidate(0, actionStore = $$props2.actionStore));
        }
    };
    return [
        actionStore,
        damageTypeOptions,
        $actionStore,
        submit,
        deleteDamage,
        addDamage,
        input0_input_handler,
        multiselect0_selected_binding,
        input1_input_handler,
        multiselect1_selected_binding,
        input2_change_handler,
        click_handler2
    ];
}

__name(instance$t, "instance$t");

class ActionDamageComponent extends SvelteComponent {
    constructor(options) {
        super();
        init(this, options, instance$t, create_fragment$u, safe_not_equal, { actionStore: 0 });
    }

    get actionStore() {
        return this.$$.ctx[0];
    }

    set actionStore(actionStore) {
        this.$$set({ actionStore });
        flush();
    }
}

__name(ActionDamageComponent, "ActionDamageComponent");

function get_each_context$h(ctx, list, i) {
    const child_ctx = ctx.slice();
    child_ctx[31] = list[i];
    return child_ctx;
}

__name(get_each_context$h, "get_each_context$h");
function get_each_context_1$8(ctx, list, i) {
    const child_ctx = ctx.slice();
    child_ctx[34] = list[i];
    return child_ctx;
}
__name(get_each_context_1$8, "get_each_context_1$8");
function get_each_context_2$1(ctx, list, i) {
    const child_ctx = ctx.slice();
    child_ctx[37] = list[i];
    return child_ctx;
}
__name(get_each_context_2$1, "get_each_context_2$1");
const get_removeIcon_slot_changes = /* @__PURE__ */ __name((dirty) => ({}), "get_removeIcon_slot_changes");
const get_removeIcon_slot_context = /* @__PURE__ */ __name((ctx) => ({}), "get_removeIcon_slot_context");

function create_if_block$d(ctx) {
    let div2;
    let div0;
    let t0;
    let input;
    let t1;
    let div1;
    let select;
    let t2;
    let t3;
    let fieldset0;
    let switch_instance;
    let t4;
    let t5;
    let t6;
    let fieldset1;
    let legend;
    let t7;
    let i;
    let t8;
    let each_blocks = [];
    let each1_lookup = /* @__PURE__ */ new Map();
    let div2_transition;
    let current;
    let mounted;
    let dispose;
    let each_value_2 = ctx[5];
    let each_blocks_1 = [];
    for (let i2 = 0; i2 < each_value_2.length; i2 += 1) {
        each_blocks_1[i2] = create_each_block_2$1(get_each_context_2$1(ctx, each_value_2, i2));
    }
    let if_block0 = ctx[1].isSubAction && create_if_block_4$1(ctx);
    var switch_value = ctx[6][ctx[1].type.toLowerCase()];

    function switch_props(ctx2) {
        return {
            props: { actionStore: ctx2[3] }
        };
    }

    __name(switch_props, "switch_props");
    if (switch_value) {
        switch_instance = new switch_value(switch_props(ctx));
    }
    let if_block1 = !ctx[1].isSubAction && create_if_block_3$1(ctx);
    let if_block2 = !ctx[1].isSubAction && create_if_block_1$4(ctx);
    let each_value = ctx[1].subActions;
    const get_key = /* @__PURE__ */ __name((ctx2) => ctx2[31].id, "get_key");
    for (let i2 = 0; i2 < each_value.length; i2 += 1) {
        let child_ctx = get_each_context$h(ctx, each_value, i2);
        let key = get_key(child_ctx);
        each1_lookup.set(key, each_blocks[i2] = create_each_block$h(key, child_ctx));
    }
    return {
        c() {
            div2 = element("div");
            div0 = element("div");
            t0 = text("Name: ");
            input = element("input");
            t1 = space();
            div1 = element("div");
            select = element("select");
            for (let i2 = 0; i2 < each_blocks_1.length; i2 += 1) {
                each_blocks_1[i2].c();
            }
            t2 = space();
            if (if_block0)
                if_block0.c();
            t3 = space();
            fieldset0 = element("fieldset");
            if (switch_instance)
                create_component(switch_instance.$$.fragment);
            t4 = space();
            if (if_block1)
                if_block1.c();
            t5 = space();
            if (if_block2)
                if_block2.c();
            t6 = space();
            fieldset1 = element("fieldset");
            legend = element("legend");
            t7 = text("Add actions ");
            i = element("i");
            t8 = space();
            for (let i2 = 0; i2 < each_blocks.length; i2 += 1) {
                each_blocks[i2].c();
            }
            attr(div0, "class", "name");
            if (ctx[1].type === void 0)
                add_render_callback(() => ctx[15].call(select));
            attr(div1, "class", "type");
            attr(fieldset0, "class", "formula");
            attr(i, "class", "fa-solid fa-file-plus");
            attr(fieldset1, "class", "actions");
        },
        m(target, anchor) {
            insert(target, div2, anchor);
            append(div2, div0);
            append(div0, t0);
            append(div0, input);
            set_input_value(input, ctx[1].name);
            append(div2, t1);
            append(div2, div1);
            append(div1, select);
            for (let i2 = 0; i2 < each_blocks_1.length; i2 += 1) {
                each_blocks_1[i2].m(select, null);
            }
            select_option(select, ctx[1].type);
            append(div2, t2);
            if (if_block0)
                if_block0.m(div2, null);
            append(div2, t3);
            append(div2, fieldset0);
            if (switch_instance) {
                mount_component(switch_instance, fieldset0, null);
            }
            append(div2, t4);
            if (if_block1)
                if_block1.m(div2, null);
            append(div2, t5);
            if (if_block2)
                if_block2.m(div2, null);
            append(div2, t6);
            append(div2, fieldset1);
            append(fieldset1, legend);
            append(legend, t7);
            append(legend, i);
            append(fieldset1, t8);
            for (let i2 = 0; i2 < each_blocks.length; i2 += 1) {
                each_blocks[i2].m(fieldset1, null);
            }
            current = true;
            if (!mounted) {
                dispose = [
                    listen(input, "change", ctx[7]),
                    listen(input, "input", ctx[14]),
                    listen(select, "blur", ctx[7]),
                    listen(select, "change", ctx[15]),
                    listen(i, "click", ctx[11])
                ];
                mounted = true;
            }
        },
        p(ctx2, dirty) {
            if (dirty[0] & 34 && input.value !== ctx2[1].name) {
                set_input_value(input, ctx2[1].name);
            }
            if (dirty[0] & 32) {
                each_value_2 = ctx2[5];
                let i2;
                for (i2 = 0; i2 < each_value_2.length; i2 += 1) {
                    const child_ctx = get_each_context_2$1(ctx2, each_value_2, i2);
                    if (each_blocks_1[i2]) {
                        each_blocks_1[i2].p(child_ctx, dirty);
                    }
                    else {
                        each_blocks_1[i2] = create_each_block_2$1(child_ctx);
                        each_blocks_1[i2].c();
                        each_blocks_1[i2].m(select, null);
                    }
                }
                for (; i2 < each_blocks_1.length; i2 += 1) {
                    each_blocks_1[i2].d(1);
                }
                each_blocks_1.length = each_value_2.length;
            }
            if (dirty[0] & 34) {
                select_option(select, ctx2[1].type);
            }
            if (ctx2[1].isSubAction) {
                if (if_block0) {
                    if_block0.p(ctx2, dirty);
                }
                else {
                    if_block0 = create_if_block_4$1(ctx2);
                    if_block0.c();
                    if_block0.m(div2, t3);
                }
            }
            else if (if_block0) {
                if_block0.d(1);
                if_block0 = null;
            }
            if (switch_value !== (switch_value = ctx2[6][ctx2[1].type.toLowerCase()])) {
                if (switch_instance) {
                    group_outros();
                    const old_component = switch_instance;
                    transition_out(old_component.$$.fragment, 1, 0, () => {
                        destroy_component(old_component, 1);
                    });
                    check_outros();
                }
                if (switch_value) {
                    switch_instance = new switch_value(switch_props(ctx2));
                    create_component(switch_instance.$$.fragment);
                    transition_in(switch_instance.$$.fragment, 1);
                    mount_component(switch_instance, fieldset0, null);
                }
                else {
                    switch_instance = null;
                }
            }
            if (!ctx2[1].isSubAction) {
                if (if_block1) {
                    if_block1.p(ctx2, dirty);
                }
                else {
                    if_block1 = create_if_block_3$1(ctx2);
                    if_block1.c();
                    if_block1.m(div2, t5);
                }
            }
            else if (if_block1) {
                if_block1.d(1);
                if_block1 = null;
            }
            if (!ctx2[1].isSubAction) {
                if (if_block2) {
                    if_block2.p(ctx2, dirty);
                }
                else {
                    if_block2 = create_if_block_1$4(ctx2);
                    if_block2.c();
                    if_block2.m(div2, t6);
                }
            }
            else if (if_block2) {
                if_block2.d(1);
                if_block2 = null;
            }
            if (dirty[0] & 1026) {
                each_value = ctx2[1].subActions;
                group_outros();
                each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx2, each_value, each1_lookup, fieldset1, outro_and_destroy_block, create_each_block$h, null, get_each_context$h);
                check_outros();
            }
        },
        i(local) {
            if (current)
                return;
            if (switch_instance)
                transition_in(switch_instance.$$.fragment, local);
            for (let i2 = 0; i2 < each_value.length; i2 += 1) {
                transition_in(each_blocks[i2]);
            }
            add_render_callback(() => {
                if (!div2_transition)
                    div2_transition = create_bidirectional_transition(div2, slide, { duration: 300 }, true);
                div2_transition.run(1);
            });
            current = true;
        },
        o(local) {
            if (switch_instance)
                transition_out(switch_instance.$$.fragment, local);
            for (let i2 = 0; i2 < each_blocks.length; i2 += 1) {
                transition_out(each_blocks[i2]);
            }
            if (!div2_transition)
                div2_transition = create_bidirectional_transition(div2, slide, { duration: 300 }, false);
            div2_transition.run(0);
            current = false;
        },
        d(detaching) {
            if (detaching)
                detach(div2);
            destroy_each(each_blocks_1, detaching);
            if (if_block0)
                if_block0.d();
            if (switch_instance)
                destroy_component(switch_instance);
            if (if_block1)
                if_block1.d();
            if (if_block2)
                if_block2.d();
            for (let i2 = 0; i2 < each_blocks.length; i2 += 1) {
                each_blocks[i2].d();
            }
            if (detaching && div2_transition)
                div2_transition.end();
            mounted = false;
            run_all(dispose);
        }
    };
}

__name(create_if_block$d, "create_if_block$d");
function create_each_block_2$1(ctx) {
    let option;
    let t_value = ctx[37].value + "";
    let t;
    return {
        c() {
            option = element("option");
            t = text(t_value);
            option.disabled = ctx[37].disabled;
            option.__value = ctx[37].value;
            option.value = option.__value;
        },
        m(target, anchor) {
            insert(target, option, anchor);
            append(option, t);
        },
        p: noop,
        d(detaching) {
            if (detaching)
                detach(option);
        }
    };
}
__name(create_each_block_2$1, "create_each_block_2$1");
function create_if_block_4$1(ctx) {
    let div;
    let t;
    let input;
    let mounted;
    let dispose;
    return {
        c() {
            div = element("div");
            t = text("Use on Fail? ");
            input = element("input");
            attr(input, "type", "checkbox");
        },
        m(target, anchor) {
            insert(target, div, anchor);
            append(div, t);
            append(div, input);
            input.checked = ctx[1].useOnFail;
            if (!mounted) {
                dispose = [
                    listen(input, "change", ctx[7]),
                    listen(input, "change", ctx[16])
                ];
                mounted = true;
            }
        },
        p(ctx2, dirty) {
            if (dirty[0] & 34) {
                input.checked = ctx2[1].useOnFail;
            }
        },
        d(detaching) {
            if (detaching)
                detach(div);
            mounted = false;
            run_all(dispose);
        }
    };
}
__name(create_if_block_4$1, "create_if_block_4$1");
function create_if_block_3$1(ctx) {
    let fieldset;
    let legend;
    let t1;
    let div0;
    let t2;
    let input0;
    let t3;
    let div1;
    let t4;
    let input1;
    let mounted;
    let dispose;
    return {
        c() {
            fieldset = element("fieldset");
            legend = element("legend");
            legend.textContent = "Range";
            t1 = space();
            div0 = element("div");
            t2 = text("Minimum: ");
            input0 = element("input");
            t3 = space();
            div1 = element("div");
            t4 = text("Maximum: ");
            input1 = element("input");
            attr(fieldset, "class", "range");
        },
        m(target, anchor) {
            insert(target, fieldset, anchor);
            append(fieldset, legend);
            append(fieldset, t1);
            append(fieldset, div0);
            append(div0, t2);
            append(div0, input0);
            set_input_value(input0, ctx[1].range.min);
            append(fieldset, t3);
            append(fieldset, div1);
            append(div1, t4);
            append(div1, input1);
            set_input_value(input1, ctx[1].range.max);
            if (!mounted) {
                dispose = [
                    listen(input0, "change", ctx[17]),
                    listen(input0, "input", ctx[18]),
                    listen(input1, "change", ctx[19]),
                    listen(input1, "input", ctx[20])
                ];
                mounted = true;
            }
        },
        p(ctx2, dirty) {
            if (dirty[0] & 34 && input0.value !== ctx2[1].range.min) {
                set_input_value(input0, ctx2[1].range.min);
            }
            if (dirty[0] & 34 && input1.value !== ctx2[1].range.max) {
                set_input_value(input1, ctx2[1].range.max);
            }
        },
        d(detaching) {
            if (detaching)
                detach(fieldset);
            mounted = false;
            run_all(dispose);
        }
    };
}
__name(create_if_block_3$1, "create_if_block_3$1");

function create_if_block_1$4(ctx) {
    let fieldset;
    let legend;
    let t1;
    let select;
    let each_blocks = [];
    let each_1_lookup = /* @__PURE__ */ new Map();
    let t2;
    let mounted;
    let dispose;
    let each_value_1 = ctx[4];
    const get_key = /* @__PURE__ */ __name((ctx2) => ctx2[34].id, "get_key");
    for (let i = 0; i < each_value_1.length; i += 1) {
        let child_ctx = get_each_context_1$8(ctx, each_value_1, i);
        let key = get_key(child_ctx);
        each_1_lookup.set(key, each_blocks[i] = create_each_block_1$8(key, child_ctx));
    }
    let if_block = ctx[1].target.type === "custom" && create_if_block_2$1(ctx);
    return {
        c() {
            fieldset = element("fieldset");
            legend = element("legend");
            legend.textContent = "Target";
            t1 = space();
            select = element("select");
            for (let i = 0; i < each_blocks.length; i += 1) {
                each_blocks[i].c();
            }
            t2 = space();
            if (if_block)
                if_block.c();
            if (ctx[1].target.type === void 0)
                add_render_callback(() => ctx[21].call(select));
            attr(fieldset, "class", "target");
        },
        m(target, anchor) {
            insert(target, fieldset, anchor);
            append(fieldset, legend);
            append(fieldset, t1);
            append(fieldset, select);
            for (let i = 0; i < each_blocks.length; i += 1) {
                each_blocks[i].m(select, null);
            }
            select_option(select, ctx[1].target.type);
            append(fieldset, t2);
            if (if_block)
                if_block.m(fieldset, null);
            if (!mounted) {
                dispose = [
                    listen(select, "blur", ctx[7]),
                    listen(select, "change", ctx[21])
                ];
                mounted = true;
            }
        },
        p(ctx2, dirty) {
            if (dirty[0] & 16) {
                each_value_1 = ctx2[4];
                each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx2, each_value_1, each_1_lookup, select, destroy_block, create_each_block_1$8, null, get_each_context_1$8);
            }
            if (dirty[0] & 34) {
                select_option(select, ctx2[1].target.type);
            }
            if (ctx2[1].target.type === "custom") {
                if (if_block) {
                    if_block.p(ctx2, dirty);
                }
                else {
                    if_block = create_if_block_2$1(ctx2);
                    if_block.c();
                    if_block.m(fieldset, null);
                }
            }
            else if (if_block) {
                if_block.d(1);
                if_block = null;
            }
        },
        d(detaching) {
            if (detaching)
                detach(fieldset);
            for (let i = 0; i < each_blocks.length; i += 1) {
                each_blocks[i].d();
            }
            if (if_block)
                if_block.d();
            mounted = false;
            run_all(dispose);
        }
    };
}

__name(create_if_block_1$4, "create_if_block_1$4");
function create_each_block_1$8(key_1, ctx) {
    let option;
    let t0_value = ctx[34].value + "";
    let t0;
    let t1;
    return {
        key: key_1,
        first: null,
        c() {
            option = element("option");
            t0 = text(t0_value);
            t1 = space();
            option.__value = ctx[34].value;
            option.value = option.__value;
            this.first = option;
        },
        m(target, anchor) {
            insert(target, option, anchor);
            append(option, t0);
            append(option, t1);
        },
        p(new_ctx, dirty) {
            ctx = new_ctx;
        },
        d(detaching) {
            if (detaching)
                detach(option);
        }
    };
}
__name(create_each_block_1$8, "create_each_block_1$8");
function create_if_block_2$1(ctx) {
    let div;
    let input0;
    let t0;
    let span;
    let t2;
    let input1;
    let mounted;
    let dispose;
    return {
        c() {
            div = element("div");
            input0 = element("input");
            t0 = space();
            span = element("span");
            span.textContent = "/";
            t2 = space();
            input1 = element("input");
        },
        m(target, anchor) {
            insert(target, div, anchor);
            append(div, input0);
            set_input_value(input0, ctx[1].target.min);
            append(div, t0);
            append(div, span);
            append(div, t2);
            append(div, input1);
            set_input_value(input1, ctx[1].target.max);
            if (!mounted) {
                dispose = [
                    listen(input0, "input", ctx[22]),
                    listen(input0, "change", ctx[23]),
                    listen(input1, "input", ctx[24]),
                    listen(input1, "change", ctx[25])
                ];
                mounted = true;
            }
        },
        p(ctx2, dirty) {
            if (dirty[0] & 34 && input0.value !== ctx2[1].target.min) {
                set_input_value(input0, ctx2[1].target.min);
            }
            if (dirty[0] & 34 && input1.value !== ctx2[1].target.max) {
                set_input_value(input1, ctx2[1].target.max);
            }
        },
        d(detaching) {
            if (detaching)
                detach(div);
            mounted = false;
            run_all(dispose);
        }
    };
}
__name(create_if_block_2$1, "create_if_block_2$1");
function create_removeIcon_slot(ctx) {
    let i;
    let mounted;
    let dispose;

    function click_handler2() {
        return ctx[26](ctx[31]);
    }

    __name(click_handler2, "click_handler");
    return {
        c() {
            i = element("i");
            attr(i, "slot", "removeIcon");
            attr(i, "class", "fa-solid fa-trash-can");
        },
        m(target, anchor) {
            insert(target, i, anchor);
            if (!mounted) {
                dispose = listen(i, "click", click_handler2);
                mounted = true;
            }
        },
        p(new_ctx, dirty) {
            ctx = new_ctx;
        },
        d(detaching) {
            if (detaching)
                detach(i);
            mounted = false;
            dispose();
        }
    };
}
__name(create_removeIcon_slot, "create_removeIcon_slot");

function create_each_block$h(key_1, ctx) {
    let first;
    let action_1;
    let current;
    action_1 = new Action({
        props: {
            uuid: ctx[31].uuid,
            $$slots: { removeIcon: [create_removeIcon_slot] },
            $$scope: { ctx }
        }
    });
    return {
        key: key_1,
        first: null,
        c() {
            first = empty();
            create_component(action_1.$$.fragment);
            this.first = first;
        },
        m(target, anchor) {
            insert(target, first, anchor);
            mount_component(action_1, target, anchor);
            current = true;
        },
        p(new_ctx, dirty) {
            ctx = new_ctx;
            const action_1_changes = {};
            if (dirty[0] & 2) {
                action_1_changes.uuid = ctx[31].uuid;
            }
            if (dirty[0] & 134217730) {
                action_1_changes.$$scope = { dirty, ctx };
            }
            action_1.$set(action_1_changes);
        },
        i(local) {
            if (current) {
                return;
            }
            transition_in(action_1.$$.fragment, local);
            current = true;
        },
        o(local) {
            transition_out(action_1.$$.fragment, local);
            current = false;
        },
        d(detaching) {
            if (detaching) {
                detach(first);
            }
            destroy_component(action_1, detaching);
        }
    };
}

__name(create_each_block$h, "create_each_block$h");

function create_fragment$t(ctx) {
    let div;
    let h3;
    let span;
    let t0_value = ctx[1].name + "";
    let t0;
    let t1;
    let t2;
    let current;
    let mounted;
    let dispose;
    const removeIcon_slot_template = ctx[13].removeIcon;
    const removeIcon_slot = create_slot(removeIcon_slot_template, ctx, ctx[27], get_removeIcon_slot_context);
    let if_block = ctx[0] && create_if_block$d(ctx);
    return {
        c() {
            div = element("div");
            h3 = element("h3");
            span = element("span");
            t0 = text(t0_value);
            t1 = space();
            if (removeIcon_slot) {
                removeIcon_slot.c();
            }
            t2 = space();
            if (if_block) {
                if_block.c();
            }
            attr(div, "class", "main");
            toggle_class(div, "expanded", ctx[0]);
            toggle_class(div, "isSubAction", ctx[1].isSubAction);
        },
        m(target, anchor) {
            insert(target, div, anchor);
            append(div, h3);
            append(h3, span);
            append(span, t0);
            append(h3, t1);
            if (removeIcon_slot) {
                removeIcon_slot.m(h3, null);
            }
            append(div, t2);
            if (if_block) {
                if_block.m(div, null);
            }
            current = true;
            if (!mounted) {
                dispose = listen(span, "click", ctx[9]);
                mounted = true;
            }
        },
        p(ctx2, dirty) {
            if ((!current || dirty[0] & 2) && t0_value !== (t0_value = ctx2[1].name + "")) {
                set_data(t0, t0_value);
            }
            if (removeIcon_slot) {
                if (removeIcon_slot.p && (!current || dirty[0] & 134217728)) {
                    update_slot_base(
                        removeIcon_slot,
                        removeIcon_slot_template,
                        ctx2,
                        ctx2[27],
                        !current ? get_all_dirty_from_scope(ctx2[27]) : get_slot_changes(removeIcon_slot_template, ctx2[27], dirty, get_removeIcon_slot_changes),
                        get_removeIcon_slot_context
                    );
                }
            }
            if (ctx2[0]) {
                if (if_block) {
                    if_block.p(ctx2, dirty);
                    if (dirty[0] & 1) {
                        transition_in(if_block, 1);
                    }
                }
                else {
                    if_block = create_if_block$d(ctx2);
                    if_block.c();
                    transition_in(if_block, 1);
                    if_block.m(div, null);
                }
            }
            else if (if_block) {
                group_outros();
                transition_out(if_block, 1, 1, () => {
                    if_block = null;
                });
                check_outros();
            }
            if (dirty[0] & 1) {
                toggle_class(div, "expanded", ctx2[0]);
            }
            if (dirty[0] & 2) {
                toggle_class(div, "isSubAction", ctx2[1].isSubAction);
            }
        },
        i(local) {
            if (current) {
                return;
            }
            transition_in(removeIcon_slot, local);
            transition_in(if_block);
            current = true;
        },
        o(local) {
            transition_out(removeIcon_slot, local);
            transition_out(if_block);
            current = false;
        },
        d(detaching) {
            if (detaching) {
                detach(div);
            }
            if (removeIcon_slot) {
                removeIcon_slot.d(detaching);
            }
            if (if_block) {
                if_block.d();
            }
            mounted = false;
            dispose();
        }
    };
}

__name(create_fragment$t, "create_fragment$t");

function instance$s($$self, $$props, $$invalidate) {
    let $action;
    let $rootAction;
    let { $$slots: slots = {}, $$scope } = $$props;
    let { uuid } = $$props;
    const { application } = getContext("external");
    const rootAction = getContext("TopActionData");
    component_subscribe($$self, rootAction, (value) => $$invalidate(29, $rootAction = value));
    const action = uuid === application.reactive.action.uuid ? rootAction : writable($rootAction._getSubAction(uuid, false));
    component_subscribe($$self, action, (value) => $$invalidate(1, $action = value));
    const targetType = [
        { id: 1, value: "single" },
        { id: 2, value: "self" },
        { id: 3, value: "all" },
        { id: 4, value: "custom" }
    ];
    const actionType = [
        { id: 1, value: "Attack", disabled: true },
        { id: 2, value: "Common", disabled: true },
        { id: 3, value: "Heal", disabled: true },
        { id: 4, value: "Damage", disabled: false }
    ];
    const components = { damage: ActionDamageComponent };

    async function submit() {
        await application.submit();
    }

    __name(submit, "submit");

    async function checkRange(type, val) {
        set_store_value(action, $action[type][val] = Math[val]($action[type].min, $action[type].max), $action);
        await application.submit();
    }

    __name(checkRange, "checkRange");
    let expanded = !$action?.parent.action;

    function toggle() {
        if ($action.parent.action) {
            $$invalidate(0, expanded = !expanded);
        }
    }

    __name(toggle, "toggle");

    async function remove(id) {
        let subActArr = [...$action.subActions];
        const index = subActArr.findIndex((act) => act.id === id);
        if (index !== -1) {
            subActArr.splice(index, 1);
            await application.submit();
            set_store_value(action, $action.subActions = [...subActArr], $action);
        }
    }

    __name(remove, "remove");

    async function addSubAction() {
        const newSubActArr = await $action.addSubAction();
        await application.submit();
        set_store_value(action, $action.subActions = newSubActArr, $action);
    }

    __name(addSubAction, "addSubAction");
    let damageTypeOptions = [];
    for (const [key1, label1] of Object.entries(CONFIG.ARd20.DamageTypes)) {
        for (const [key2, label2] of Object.entries(CONFIG.ARd20.DamageSubTypes)) {
            damageTypeOptions = [
                ...damageTypeOptions,
                {
                    label: `${localize(label1)} ${localize(label2)}`,
                    value: [key1, key2]
                }
            ];
        }
    }

    function input_input_handler() {
        $action.name = this.value;
        action.set($action);
        $$invalidate(5, actionType);
    }

    __name(input_input_handler, "input_input_handler");

    function select_change_handler() {
        $action.type = select_value(this);
        action.set($action);
        $$invalidate(5, actionType);
    }

    __name(select_change_handler, "select_change_handler");

    function input_change_handler() {
        $action.useOnFail = this.checked;
        action.set($action);
        $$invalidate(5, actionType);
    }

    __name(input_change_handler, "input_change_handler");
    const change_handler = /* @__PURE__ */ __name(() => checkRange("range", "min"), "change_handler");

    function input0_input_handler() {
        $action.range.min = this.value;
        action.set($action);
        $$invalidate(5, actionType);
    }

    __name(input0_input_handler, "input0_input_handler");
    const change_handler_1 = /* @__PURE__ */ __name(() => checkRange("range", "max"), "change_handler_1");

    function input1_input_handler() {
        $action.range.max = this.value;
        action.set($action);
        $$invalidate(5, actionType);
    }

    __name(input1_input_handler, "input1_input_handler");

    function select_change_handler_1() {
        $action.target.type = select_value(this);
        action.set($action);
        $$invalidate(5, actionType);
    }

    __name(select_change_handler_1, "select_change_handler_1");

    function input0_input_handler_1() {
        $action.target.min = this.value;
        action.set($action);
        $$invalidate(5, actionType);
    }

    __name(input0_input_handler_1, "input0_input_handler_1");
    const change_handler_2 = /* @__PURE__ */ __name(() => checkRange("target", "min"), "change_handler_2");

    function input1_input_handler_1() {
        $action.target.max = this.value;
        action.set($action);
        $$invalidate(5, actionType);
    }

    __name(input1_input_handler_1, "input1_input_handler_1");
    const change_handler_3 = /* @__PURE__ */ __name(() => checkRange("target", "max"), "change_handler_3");
    const click_handler2 = /* @__PURE__ */ __name((subAct) => {
        remove(subAct.id);
    }, "click_handler");
    $$self.$$set = ($$props2) => {
        if ("uuid" in $$props2) {
            $$invalidate(12, uuid = $$props2.uuid);
        }
        if ("$$scope" in $$props2) {
            $$invalidate(27, $$scope = $$props2.$$scope);
        }
    };
    return [
        expanded,
        $action,
        rootAction,
        action,
        targetType,
        actionType,
        components,
        submit,
        checkRange,
        toggle,
        remove,
        addSubAction,
        uuid,
        slots,
        input_input_handler,
        select_change_handler,
        input_change_handler,
        change_handler,
        input0_input_handler,
        change_handler_1,
        input1_input_handler,
        select_change_handler_1,
        input0_input_handler_1,
        change_handler_2,
        input1_input_handler_1,
        change_handler_3,
        click_handler2,
        $$scope
    ];
}

__name(instance$s, "instance$s");

class Action extends SvelteComponent {
    constructor(options) {
        super();
        init(this, options, instance$s, create_fragment$t, safe_not_equal, { uuid: 12 }, null, [-1, -1]);
    }

    get uuid() {
        return this.$$.ctx[12];
    }

    set uuid(uuid) {
        this.$$set({ uuid });
        flush();
    }
}

__name(Action, "Action");
function create_default_slot$6(ctx) {
    let action_1;
    let current;
    action_1 = new Action({ props: { uuid: ctx[2] } });
    return {
        c() {
            create_component(action_1.$$.fragment);
        },
        m(target, anchor) {
            mount_component(action_1, target, anchor);
            current = true;
        },
        p: noop,
        i(local) {
            if (current)
                return;
            transition_in(action_1.$$.fragment, local);
            current = true;
        },
        o(local) {
            transition_out(action_1.$$.fragment, local);
            current = false;
        },
        d(detaching) {
            destroy_component(action_1, detaching);
        }
    };
}
__name(create_default_slot$6, "create_default_slot$6");

function create_fragment$s(ctx) {
    let applicationshell;
    let updating_elementRoot;
    let current;

    function applicationshell_elementRoot_binding(value) {
        ctx[3](value);
    }

    __name(applicationshell_elementRoot_binding, "applicationshell_elementRoot_binding");
    let applicationshell_props = {
        $$slots: { default: [create_default_slot$6] },
        $$scope: { ctx }
    };
    if (ctx[0] !== void 0) {
        applicationshell_props.elementRoot = ctx[0];
    }
    applicationshell = new ApplicationShell({ props: applicationshell_props });
    binding_callbacks.push(() => bind(applicationshell, "elementRoot", applicationshell_elementRoot_binding));
    return {
        c() {
            create_component(applicationshell.$$.fragment);
        },
        m(target, anchor) {
            mount_component(applicationshell, target, anchor);
            current = true;
        },
        p(ctx2, [dirty]) {
            const applicationshell_changes = {};
            if (dirty & 32) {
                applicationshell_changes.$$scope = { dirty, ctx: ctx2 };
            }
            if (!updating_elementRoot && dirty & 1) {
                updating_elementRoot = true;
                applicationshell_changes.elementRoot = ctx2[0];
                add_flush_callback(() => updating_elementRoot = false);
            }
            applicationshell.$set(applicationshell_changes);
        },
        i(local) {
            if (current) {
                return;
            }
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

__name(create_fragment$s, "create_fragment$s");

function instance$r($$self, $$props, $$invalidate) {
    let $action, $$unsubscribe_action = noop,
        $$subscribe_action = /* @__PURE__ */ __name(() => ($$unsubscribe_action(), $$unsubscribe_action = subscribe(action, ($$value) => $$invalidate(4, $action = $$value)), action), "$$subscribe_action");
    $$self.$$.on_destroy.push(() => $$unsubscribe_action());
    let { elementRoot } = $$props;
    let { action } = $$props;
    $$subscribe_action();
    setContext(`TopActionData`, action);
    const uuid = $action.uuid;

    function applicationshell_elementRoot_binding(value) {
        elementRoot = value;
        $$invalidate(0, elementRoot);
    }

    __name(applicationshell_elementRoot_binding, "applicationshell_elementRoot_binding");
    $$self.$$set = ($$props2) => {
        if ("elementRoot" in $$props2) {
            $$invalidate(0, elementRoot = $$props2.elementRoot);
        }
        if ("action" in $$props2) {
            $$subscribe_action($$invalidate(1, action = $$props2.action));
        }
    };
    return [elementRoot, action, uuid, applicationshell_elementRoot_binding];
}

__name(instance$r, "instance$r");

class ActionShell extends SvelteComponent {
    constructor(options) {
        super();
        init(this, options, instance$r, create_fragment$s, safe_not_equal, { elementRoot: 0, action: 1 });
    }

    get elementRoot() {
        return this.$$.ctx[0];
    }

    set elementRoot(elementRoot) {
        this.$$set({ elementRoot });
        flush();
    }

    get action() {
        return this.$$.ctx[1];
    }

    set action(action) {
        this.$$set({ action });
        flush();
    }
}

__name(ActionShell, "ActionShell");

class ActionSheet extends SvelteApplication {
    #action = writable(null);
    #storeUnsubscribe;

    constructor(object) {
        super(object);
        Object.defineProperty(this.reactive, "action", {
            get: () => get_store_value(this.#action),
            set: (document2) => {
                this.#action.set(document2);
            }
        });
        this.reactive.action = object;
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            title: "Action Config",
            minimizable: true,
            resizable: true,
            width: 400,
            height: 600,
            svelte: {
                class: ActionShell,
                target: document.body,
                props: function () {
                    return { action: this.#action };
                }
            }
        });
    }

    async submit() {
        let item;
        const action = this.reactive.action;
        const actorId = action.parent.actor;
        const itemId = action.parent.item;
        if (actorId || itemId) {
            const uuid = itemId || actorId;
            item = await fromUuid(uuid);
        }
        else {
            return;
        }
        let actionList = [...item.system.actionList];
        const index = [...item.system.actionList].findIndex((a) => a.id === action.id);
        if (index !== -1) {
            actionList.splice(index, 1);
            actionList = [...actionList, action];
            await item.update({ "system.actionList": actionList });
        }
    }

    render(force = false, options = {}) {
        if (!this.#storeUnsubscribe) {
            this.#storeUnsubscribe = this.#action.subscribe(this.#handleDocUpdate.bind(this));
        }
        super.render(force, options);
        return this;
    }

    async #handleDocUpdate(doc, options) {
        console.log(doc, options);
    }
}

__name(ActionSheet, "ActionSheet");
const DamageTypeShell_svelte_svelte_type_style_lang = "";

function get_each_context$g(ctx, list, i) {
    const child_ctx = ctx.slice();
    child_ctx[11] = list[i];
    return child_ctx;
}

__name(get_each_context$g, "get_each_context$g");

function create_each_block$g(key_1, ctx) {
    let option;
    let t_value = ctx[11].label + "";
    let t;
    return {
        key: key_1,
        first: null,
        c() {
            option = element("option");
            t = text(t_value);
            option.__value = ctx[11].value;
            option.value = option.__value;
            this.first = option;
        },
        m(target, anchor) {
            insert(target, option, anchor);
            append(option, t);
        },
        p(new_ctx, dirty) {
            ctx = new_ctx;
        },
        d(detaching) {
            if (detaching)
                detach(option);
        }
    };
}

__name(create_each_block$g, "create_each_block$g");

function create_fragment$r(ctx) {
    let div;
    let t0;
    let span0;
    let t2;
    let span1;
    let t4;
    let label;
    let t5;
    let select;
    let each_blocks = [];
    let each_1_lookup = /* @__PURE__ */ new Map();
    let t6;
    let button;
    let mounted;
    let dispose;
    let each_value = ctx[3];
    const get_key = /* @__PURE__ */ __name((ctx2) => ctx2[11].label, "get_key");
    for (let i = 0; i < each_value.length; i += 1) {
        let child_ctx = get_each_context$g(ctx, each_value, i);
        let key = get_key(child_ctx);
        each_1_lookup.set(key, each_blocks[i] = create_each_block$g(key, child_ctx));
    }
    return {
        c() {
            div = element("div");
            t0 = text("You're attacking ");
            span0 = element("span");
            span0.textContent = `${ctx[1].actor.name}`;
            t2 = text(" with ");
            span1 = element("span");
            span1.textContent = `${ctx[2]}`;
            t4 = space();
            label = element("label");
            t5 = text("Choose damage type:\r\n    ");
            select = element("select");
            for (let i = 0; i < each_blocks.length; i += 1) {
                each_blocks[i].c();
            }
            t6 = space();
            button = element("button");
            button.textContent = `${ctx[4].label}`;
            attr(span0, "class", "svelte-zssy9o");
            attr(span1, "class", "formula svelte-zssy9o");
            if (ctx[0] === void 0)
                add_render_callback(() => ctx[9].call(select));
        },
        m(target, anchor) {
            insert(target, div, anchor);
            append(div, t0);
            append(div, span0);
            append(div, t2);
            append(div, span1);
            insert(target, t4, anchor);
            insert(target, label, anchor);
            append(label, t5);
            append(label, select);
            for (let i = 0; i < each_blocks.length; i += 1) {
                each_blocks[i].m(select, null);
            }
            select_option(select, ctx[0]);
            insert(target, t6, anchor);
            insert(target, button, anchor);
            if (!mounted) {
                dispose = [
                    listen(span0, "mouseenter", ctx[7]),
                    listen(span0, "mouseleave", ctx[8]),
                    listen(select, "change", ctx[9]),
                    listen(button, "click", ctx[5])
                ];
                mounted = true;
            }
        },
        p(ctx2, [dirty]) {
            if (dirty & 8) {
                each_value = ctx2[3];
                each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx2, each_value, each_1_lookup, select, destroy_block, create_each_block$g, null, get_each_context$g);
            }
            if (dirty & 9) {
                select_option(select, ctx2[0]);
            }
        },
        i: noop,
        o: noop,
        d(detaching) {
            if (detaching)
                detach(div);
            if (detaching)
                detach(t4);
            if (detaching)
                detach(label);
            for (let i = 0; i < each_blocks.length; i += 1) {
                each_blocks[i].d();
            }
            if (detaching)
                detach(t6);
            if (detaching)
                detach(button);
            mounted = false;
            run_all(dispose);
        }
    };
}

__name(create_fragment$r, "create_fragment$r");

function onHoverToken$1(token, hover) {
    token.hover = hover;
    token.refresh();
}

__name(onHoverToken$1, "onHoverToken$1");

function instance$q($$self, $$props, $$invalidate) {
    let { data } = $$props;
    const { application } = getContext("external");
    const { target, formula, damageTypeData, submit } = data;
    let dType = damageTypeData[0].value;

    function close() {
        submit.callback(dType);
        application.close();
    }

    __name(close, "close");
    const mouseenter_handler = /* @__PURE__ */ __name(() => onHoverToken$1(target.target, true), "mouseenter_handler");
    const mouseleave_handler = /* @__PURE__ */ __name(() => onHoverToken$1(target.target, false), "mouseleave_handler");

    function select_change_handler() {
        dType = select_value(this);
        $$invalidate(0, dType);
        $$invalidate(3, damageTypeData);
    }

    __name(select_change_handler, "select_change_handler");
    $$self.$$set = ($$props2) => {
        if ("data" in $$props2)
            $$invalidate(6, data = $$props2.data);
    };
    return [
        dType,
        target,
        formula,
        damageTypeData,
        submit,
        close,
        data,
        mouseenter_handler,
        mouseleave_handler,
        select_change_handler
    ];
}

__name(instance$q, "instance$q");

class DamageTypeShell extends SvelteComponent {
    constructor(options) {
        super();
        init(this, options, instance$q, create_fragment$r, safe_not_equal, { data: 6 });
    }

    get data() {
        return this.$$.ctx[6];
    }

    set data(data) {
        this.$$set({ data });
        flush();
    }
}
__name(DamageTypeShell, "DamageTypeShell");

class DamageTypeDialog extends TJSDialog {
    constructor(data) {
        super(
            {
                title: "Damage Type",
                modal: true,
                draggable: true,
                content: {
                    class: DamageTypeShell,
                    props: {
                        data
                    }
                }
            },
            {
                width: 400,
                height: 200
            }
        );
    }
}
__name(DamageTypeDialog, "DamageTypeDialog");

class ARd20Token extends Token {
    #highlight;

    get isHighlighted() {
        return this.#highlight.visible;
    }

    async _draw() {
        await super._draw();
        this.#highlight = this.addChild(new PIXI.Graphics());
        this.#highlight.visible = false;
    }

    _refresh() {
        super._refresh();
        this.#highlight.clear();
        const t = CONFIG.Canvas.objectBorderThickness;
        const h = Math.round(t / 2);
        const o = Math.round(h / 2);
        this.#highlight.lineStyle(t, 0, 0.8).drawEllipse(-o + this.w / 2, -o + this.h / 2, (this.w + 20 * h) / 2, (this.h + 20 * h) / 2);
        this.#highlight.lineStyle(h, 65280, 1).drawEllipse(-o + this.w / 2, -o + this.h / 2, (this.w + 20 * h) / 2, (this.h + 20 * h) / 2);
    }

    _onClickLeft(event) {
        if (game.settings.get("ard20", "actionMouseRewrite")) {
            return this.setTarget(!this.isTargeted && this.isHighlighted, { releaseOthers: false });
        }
        super._onClickLeft(event);
    }

    setTarget(targeted = true, { user = null, releaseOthers = true, groupSelection = false } = {}) {
        console.log(targeted, this.name);
        if (game.settings.get("ard20", "actionMouseRewrite")) {
            if (!this.isHighlighted) {
                ui.notifications.warn(`you can't target that token "${this.name}", it's not Highlighted`);
                return;
            }
            if (targeted) {
                const max = game.user.getFlag("ard20", "targetNumber");
                const targetNumber = game.user.targets.size;
                if (targetNumber >= max && max !== null) {
                    console.log(targetNumber, " more than ", max);
                    ui.notifications.warn(`You can target only ${max} number of tokens`);
                    return;
                }
            }
        }
        super.setTarget(targeted, { user, releaseOthers, groupSelection });
    }

    _onClickRight(event) {
        if (game.settings.get("ard20", "actionMouseRewrite")) {
            return;
        }
        super._onClickRight(event);
    }

    _onClickLeft2(event) {
        if (game.settings.get("ard20", "actionMouseRewrite")) {
            return;
        }
        super._onClickLeft2(event);
    }

    _onClickRight2(event) {
        if (game.settings.get("ard20", "actionMouseRewrite")) {
            return;
        }
        super._onClickRight2(event);
    }

    showHighlight(visible) {
        this.#highlight.visible = visible;
    }

    _onWheel;
}
__name(ARd20Token, "ARd20Token");

class ARd20Action {
    constructor(object = {}, options = {}) {
        this.name = object?.name ?? "New Action";
        this.type = object?.type ?? "Attack";
        this.formula = object?.formula ?? "2d10";
        this.bonus = object?.bonus ?? 0;
        this.dc = object?.dc ?? { type: "parameter", value: "reflex" };
        this._id = options?.keepId ? object?._id ?? uuidv4() : uuidv4();
        this.isRoll = object?.isRoll ?? true;
        this.setTargetLimit(object?.target);
        this.range = object?.range ?? { max: 5, min: 0 };
        this.setParent(options?.parent);
        this.template = object?.template ?? null;
        this.useOnFail = this.parent.action ? object?.useOnFail ?? false : false;
        this.failFormula = this.useOnFail ? object?.failFormula ?? this.formula : this.formula;
        this.subActions = this.getSubActions(object);
        this.damage = object?.damage ?? [];
        this.resource = this.setResource(object);
    }

    get documentName() {
        return "Action";
    }

    get id() {
        return this._id;
    }

    get sheet() {
        return new ActionSheet(this);
    }

    get isSubAction() {
        return this.parent.action !== null;
    }

    get uuid() {
        let uuid = "";
        if (this.parent.action) {
            uuid += this.parent.action + ".";
        }
        else if (this.parent.item) {
            uuid += this.parent.item + ".";
        }
        else if (this.parent.actor) {
            uuid += this.parent.actor + ".";
        }
        uuid += `Action.${this.id}`;
        return uuid;
    }

    setResource(object = {}) {
        return {
            type: object?.resource?.type ?? "none",
            value: object?.resource?.value ?? null
        };
    }

    async removeSubAction() {
        const uuidIndex = this.uuid.split(".").findIndex((part) => part === "Action");
        const parts = this.uuid.split(".").slice(uuidIndex);
        const doc = await this.getItem() ?? await this.getActor();
        const action = doc.system.actionList.filter((act) => act.id === parts[1])[0];
        parts.splice(0, 2);
        return action._getSubAction(parts, true);
    }

    _getSubAction(parts, remove) {
        if (typeof parts === "string") {
            const uuidIndex = parts.split(".").findIndex((part) => part === "Action");
            parts = parts.split(".").slice(uuidIndex);
            if (parts[1] === this.id) {
                parts.splice(0, 2);
            }
        }
        console.log(parts);
        if (parts.length > 2) {
            const action = this.subActions.filter((act) => act.id === parts[1])[0];
            parts.splice(0, 2);
            return action._getSubAction(parts, remove);
        }
        else if (remove) {
            const index = this.subActions.findIndex((act) => act.id === parts[1]);
            this.subActions.splice(index, 1);
            console.log(this.subActions);
            return this.subActions;
        }
        else {
            console.log(this.subActions.filter((act) => act.id === parts[1])[0]);
            return this.subActions.filter((act) => act.id === parts[1])[0];
        }
    }

    setHint(object) {
        let icon = object?.icon ?? "";
        let text2 = object?.text ?? "";
        this.hint = { icon, text: text2 };
    }

    setTargetLimit(target = {}) {
        const { type, max, min } = target;
        this.target = {
            type: type ?? "single",
            max: type === "custom" ? Math.max(max, min) : null,
            min: type === "custom" ? Math.min(max, min) : null
        };
    }

    setParent(object = {}) {
        const { actor, item, action } = object;
        this.parent = {
            actor: actor ?? null,
            item: item ?? null,
            action: action ?? null
        };
    }

    async getActor() {
        if (!this.parent.actor) {
            return null;
        }
        return await fromUuid(this.parent.actor);
    }

    async getItem() {
        if (!this.parent.item) {
            return;
        }
        return await fromUuid(this.parent.item);
    }

    async addSubAction(object = {}, options = {}) {
        const actionList = this.subActions;
        const numberOfNewActions = actionList.filter((action) => {
            console.log(action.name.substring(0, 14) === "New sub-Action");
            return action.name.substring(0, 14) === "New sub-Action";
        }).length + 1;
        object.name = numberOfNewActions - 1 ? "New sub-Action#" + numberOfNewActions : "New sub-Action";
        object.id = uuidv4();
        options = {
            parent: { actor: this.parent.actor, item: this.parent.item, action: this.uuid }
        };
        return [...actionList, new ARd20Action(object, options)];
    }

    getSubActions(object) {
        const options = {
            parent: { actor: this.parent.actor, item: this.parent.item, action: this.uuid },
            keepId: true
        };
        return object?.subActions?.map((act) => new ARd20Action(act, options)) ?? [];
    }

    async use() {
        console.log("ACTION USE", this);
        const doc = await this.getActor();
        const actor = doc.documentName === "Actor" ? doc : doc.actor;
        console.log(actor);
        await actor._sheet.minimize();
        return this.placeTemplate();
    }

    placeTemplate() {
        console.log("Phase: placing template");
        if (!this.template) {
            return this.validateTargets();
        }
    }

    async validateTargets() {
        const actorUuid = this.parent.actor;
        const user = game.user;
        const tokenNumber = this.target.type === "custom" ? this.target.max : this.target.type === "single" ? 1 : Infinity;
        await user.setFlag("ard20", "targetNumber", tokenNumber);
        const activeToken = canvas.scene.tokens.filter((token) => {
            return token._object.controlled && token.actor.uuid === actorUuid;
        })[0];
        console.log("Phase: validating targets");
        if (!activeToken) {
            return;
        }
        this.checkTokens(activeToken, this);
        if (!canvas.tokens.active) {
            canvas.tokens.activate();
        }
        await game.settings.set("ard20", "actionMouseRewrite", true);
        const releaseSetting = game.settings.get("core", "leftClickRelease");
        if (releaseSetting) {
            await game.settings.set("core", "leftClickRelease", false);
        }
        ui.notifications.info("Left Click - target Token, Right Click - submit selection or cancel Action", { permanent: true });
        const handlers = {};
        handlers.leftClick = (event) => {
            event.stopPropagation();
            if (event.target instanceof ARd20Token) {
                event.target._onClickLeft(event);
            }
        };
        handlers.rightClick = async () => {
            console.log("right click");
            canvas.stage.off("mousedown", handlers.leftClick);
            canvas.app.view.oncontextmenu = null;
            canvas.app.view.onwheel = null;
            await game.settings.set("core", "leftClickRelease", releaseSetting);
            await game.settings.set("ard20", "actionMouseRewrite", false);
            ui.notifications.active.filter((elem) => elem[0].classList.contains("permanent")).forEach((e) => e.remove());
            for (const token of canvas.scene.tokens) {
                if (!token.object.isTargeted) {
                    token.object.showHighlight(false);
                }
            }
            const targets = new Map([...user.targets].map((t) => [
                t.id,
                {
                    target: t,
                    actor: t.actor,
                    stats: /* @__PURE__ */ new Map()
                }
            ]));
            await this.roll(user, targets);
        };
        handlers.scrollWheel = (event) => {
            if (event.ctrlKey || event.shiftKey) {
                const check = this.checkTokens;
                const action = Object.assign({}, this);
                setTimeout(check, 100, activeToken, action);
            }
        };
        canvas.stage.on("mousedown", handlers.leftClick);
        canvas.app.view.oncontextmenu = handlers.rightClick;
        canvas.app.view.onwheel = handlers.scrollWheel;
    }

    async roll(user, targets) {
        console.log("Phase: rolling ", "action: ", this.name, targets);
        const parentID = this.parent.action?.split(".").slice(-1)[0] ?? null;
        let level = !this.isSubAction ? 0 : [...targets].filter((t) => t[1].stats.has(parentID))?.[0][1].stats.get(parentID).level + 1;
        if (!this.isRoll) {
            return;
        }
        await this.commonRoll(targets, level);
        await this.attackRoll(targets, level);
        await this.damageRoll(targets, level);
    }

    async commonRoll(targets, level) {
        if (this.type !== "Common") {
            return;
        }
        this.bonus;
        let formula = this.formula;
        let roll = new Roll(formula);
        const actor = await this.getActor();
        const item = await this.getItem();
        for (const target of targets) {
            let tokenRoll;
            if (roll._evaluated) {
                tokenRoll = await roll.reroll();
            }
            else {
                tokenRoll = await roll.evaluate();
            }
            console.log(tokenRoll);
            console.log(`\u0421\u043E\u0432\u0435\u0440\u0448\u0430\u0435\u0442\u0441\u044F \u0431\u0440\u043E\u0441\u043E\u043A \u0434\u043B\u044F \u0446\u0435\u043B\u0438 "${target.name}"`);
            await tokenRoll.toMessage({ speaker: { alias: `${actor.name}: ${item.name} (${this.name}) vs ${target.name}` } });
        }
    }

    async attackRoll(targets, level) {
        if (this.type !== "Attack") {
            return;
        }
        const roll = new Roll(this.formula);
        let hit = null;
        const parentID = this.parent.action?.split(".").slice(-1)[0] ?? null;
        const currentTargets = parentID && !this.useOnFail ? [...targets].filter((t) => t[1].stats.get(parentID)?.hit) : targets;
        for (const [key, t] of currentTargets) {
            if (t.stats.has(parentID)) {
                hit = t.stats.get(parentID)?.hit ?? null;
            }
            if (!this.isSubAction || this.useOnFail || hit) {
                const actor = t.target.actor;
                const defence = actor.system.defences.stats.reflex.value;
                let tokenRoll;
                if (roll._evaluated) {
                    tokenRoll = await roll.reroll();
                }
                else {
                    tokenRoll = await roll.roll();
                }
                const stat = {
                    hit: tokenRoll.total >= defence,
                    defence,
                    result: tokenRoll.total,
                    actionName: this.name,
                    id: this.id,
                    rollData: roll,
                    parentID,
                    level
                };
                t.stats.set(this.id, stat);
                targets.set(key, t);
            }
        }
        return await this.useSubActions(targets);
    }

    async damageRoll(targets, level) {
        if (this.type !== "Damage") {
            return;
        }
        let hit = null;
        const parentID = this.parent.action?.split(".").slice(-1)[0] ?? null;
        const currentTargets = parentID && !this.useOnFail ? [...targets].filter((t) => t[1].stats.get(parentID)?.hit) : targets;
        for (const [key, t] of currentTargets) {
            if (t.stats.has(parentID)) {
                hit = t.stats.get(parentID)?.hit ?? null;
            }
            const damage = this.damage.map((dam) => {
                if (hit || !this.isSubAction) {
                    return dam.normal;
                }
                else {
                    return dam.fail;
                }
            });
            const rollResult = await this.applyDamage(t, damage);
            const stat = {
                hit: rollResult.totalValue > 0,
                result: rollResult.totalValue,
                actionName: this.name,
                id: this.id,
                rollData: rollResult.rollData,
                level,
                parentID
            };
            t.stats.set(this.id, stat);
            targets.set(key, t);
        }
        return await this.useSubActions(targets);
    }

    async useSubActions(targets) {
        const hit = [...targets].filter((t) => t[1].stats.get(this.id)?.hit).length > 0;
        const subActions = hit ? this.subActions : this.subActions.filter((sub) => sub.useOnFail);
        console.log(hit, subActions);
        for (const action of subActions) {
            await action.roll(null, targets);
        }
        if (!this.parent.action) {
            console.log("finish");
            await this.finishAction(targets);
        }
    }

    async finishAction(targets) {
        console.log(targets);
        const results = [...targets].map((t) => {
            return {
                actor: t[1].target.actor,
                stats: [...t[1].stats].map((st) => st[1]),
                token: t[1].target.document.uuid,
                targetName: t[1].target.name,
                targetIcon: t[1].target.document.texture.src
            };
        });
        game.user.updateTokenTargets([]);
        await game.user.unsetFlag("ard20", "targetNumber");
        canvas.scene.tokens.forEach((t) => t.object.showHighlight(false));
        if (results.length > 0) {
            console.log(results, "making message");
            ChatMessage.create({ user: game.user.id, flags: { world: { svelte: { results } } } });
        }
    }

    checkTokens(activeToken, action) {
        const tokenUuid = activeToken.uuid;
        const activeTokenObj = activeToken.object;
        const bounds = activeTokenObj.bounds;
        const points = {
            TL: { x: bounds.left, y: bounds.top },
            TR: { x: bounds.right, y: bounds.top },
            BL: { x: bounds.left, y: bounds.bottom },
            BR: { x: bounds.right, y: bounds.bottom }
        };
        for (const token of canvas.scene.tokens) {
            if (token.uuid === tokenUuid || !token.object.isVisible) {
                continue;
            }
            const target = token.object;
            let pointName = "";
            const targetPoints = {
                TL: { x: target.bounds.left, y: target.bounds.top },
                TR: { x: target.bounds.right, y: target.bounds.top },
                BL: { x: target.bounds.left, y: target.bounds.bottom },
                BR: { x: target.bounds.right, y: target.bounds.bottom }
            };
            pointName += activeToken.y - target.y >= 0 ? "T" : "B";
            pointName += activeToken.x - target.x >= 0 ? "R" : "L";
            const range = Object.entries(targetPoints).reduce((previousValue, currentValue) => {
                const currentRange = canvas.grid.measureDistance(currentValue[1], points[pointName]);
                if (currentRange < previousValue) {
                    return currentRange;
                }
                else {
                    return previousValue;
                }
            }, canvas.grid.measureDistance(targetPoints[pointName], points[pointName]));
            const inRange = range <= action.range.max && range >= action.range.min;
            console.log(target.isTargeted, target.name);
            target.setTarget(target.isVisible && target.isTargeted, { releaseOthers: false });
            target.showHighlight(target.isVisible && inRange);
        }
    }

    async applyDamage(target, damage) {
        const actor = target.actor;
        const actorData = actor.system;
        const roll = prepareAndRollDamage(damage);
        console.log(roll);
        const rollResult = await roll.roll();
        const formula = rollResult.formula;
        let value = rollResult.total;
        console.log("\u0443\u0440\u043E\u043D \u0434\u043E \u0440\u0435\u0437\u0438\u0441\u0442\u043E\u0432: ", value);
        const terms = roll.terms.filter((t) => !(t instanceof OperatorTerm));
        for (const term of terms) {
            const damageTypeData = term.options.damageType;
            let damageType;
            if (damageTypeData.length > 1) {
                damageType = await this.configureDialog({ target, formula, damageTypeData });
            }
            else {
                damageType = damageTypeData[0].value;
            }
            const res = actorData.defences.damage[damageType[0]][damageType[1]];
            value -= res.value;
        }
        console.log("\u0443\u0440\u043E\u043D \u043F\u043E\u0441\u043B\u0435 \u0440\u0435\u0437\u0438\u0441\u0442\u043E\u0432", value);
        let obj = {};
        obj["system.health.value"] = actor.system.health.value - value;
        if (game.user.isGM) {
            console.log("GM applying damage");
            console.log(actor);
            await actor.update(obj);
        }
        else {
            console.log("not GM applying damage");
            game.socket.emit("system.ard20", {
                operation: "updateActorData",
                tokenId: target.target.document.uuid,
                update: obj,
                value
            });
        }
        return { totalValue: value, rollData: rollResult };
    }

    async configureDialog({ target, formula, damageTypeData }) {
        return new Promise((resolve) => {
            new DamageTypeDialog({
                target,
                formula,
                damageTypeData,
                submit: {
                    label: "submit",
                    callback: (value) => {
                        resolve(value);
                    }
                }
            }).render(true);
        });
    }
}
__name(ARd20Action, "ARd20Action");
class ARd20Item extends Item {
  prepareData() {
    super.prepareData();
  }
  prepareBaseData() {
      const options = { parent: { actor: this.actor?.uuid, item: this.uuid }, keepId: true };
      this.system.actionList = this.system.actionList.map((action) => {
          return new ARd20Action(action, options);
      });
      super.prepareBaseData();
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
      if (itemData.hasAttack) {
          this._prepareAttack(itemData);
      }
      if (itemData.hasDamage) {
          this._prepareDamage(itemData);
      }
      if (!this.isOwned) {
          this.prepareFinalAttributes();
      }
  }
  _prepareSpellData(itemData) {
      if (this.type !== "spell") {
          return;
      }
  }
  _prepareWeaponData(itemData) {
      if (this.type !== "weapon") {
          return;
      }
      const data = itemData;
      const flags = this.flags;
      data.hasAttack = data.hasAttack || true;
      data.hasDamage = data.hasDamage || true;
      this._setTypeAndSubtype(data, flags);
      for (const level of game.settings.get("ard20", "profLevel")) {
          data.damage.common[level.key] = data.damage.common[level.key] ?? {
              formula: "",
              parts: [["", ["", ""]]]
          };
      }
  }
  _setTypeAndSubtype(data, flags) {
    data.sub_type_array = game.settings.get("ard20", "proficiencies").weapon.value.filter((prof) => prof.type === data.type.value);
    if (flags.core?.sourceId) {
      const id = /Item.(.+)/.exec(flags.core.sourceId)[1];
      const item = game.items?.get(id);
      if (item?.type === "weapon") {
        data.sub_type = data.sub_type === void 0 ? item.system.sub_type : data.sub_type;
      }
    }
    data.sub_type = data.sub_type_array.filter((prof) => prof.name === data.sub_type).length === 0 ? data.sub_type_array[0].name : data.sub_type || data.sub_type_array[0].name;
    data.proficiency.name = game.i18n.localize(CONFIG.ARd20.Rank[data.proficiency.level]) ?? CONFIG.ARd20.Rank[data.proficiency.level];
    data.type.name = game.i18n.localize(CONFIG.ARd20.Rank[data.type.value]) ?? CONFIG.ARd20.Rank[data.type.value];
  }
  _prepareFeatureData(itemData) {
      if (this.type !== "feature") {
          return;
      }
      const data = itemData;
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
      };
      data.level.has = data.level.has !== void 0 ? data.level.has : false;
      data.level.max = data.level.has ? data.level.max || 4 : 1;
      data.level.initial = Math.min(data.level.max, data.level.initial);
      data.level.current = this.isOwned ? Math.max(data.level.initial, 1) : 0;
      if (data.level.max > 1) {
          let n = (10 - data.level.max) / data.level.max;
          let k = 1.7 + Math.round(Number((Math.abs(n) * 100).toPrecision(15))) / 100 * Math.sign(n);
          if (data.xp.basicCost.length < data.level.max) {
              for (let i = 1; i < data.level.max; i++) {
                  data.xp.basicCost.push(Math.round(data.xp.basicCost[i - 1] * k / 5) * 5);
                  data.xp.AdvancedCost.push(data.xp.basicCost[i]);
              }
          }
          else {
              for (let i = 1; i < data.level.max; i++) {
                  data.xp.basicCost[i] = Math.round(data.xp.basicCost[i - 1] * k / 5) * 5;
                  data.xp.AdvancedCost[i] = data.xp.AdvancedCost[i] ?? data.xp.basicCost[i];
              }
          }
      }
      for (let [key, req] of Object.entries(data.req.values)) {
          req.pass = Array.from({ length: data.level.max }, (i) => false);
          switch (req.type) {
              case "ability":
                  for (let [key2, v] of Object.entries(CONFIG.ARd20.Attributes)) {
                      if (req.name === game.i18n.localize(CONFIG.ARd20.Attributes[key2])) {
                          req.value = key2;
                      }
                  }
                  break;
              case "skill":
                  for (let [key2, v] of Object.entries(CONFIG.ARd20.Skills)) {
                      if (req.name === game.i18n.localize(CONFIG.ARd20.Skills[key2])) {
                          req.value = key2;
                      }
                  }
                  break;
          }
      }
      for (let i = data.req.logic.length; data.level.max > data.req.logic.length; i++) {
          if (i === 0) {
              data.req.logic.push("1");
          }
          else {
              data.req.logic.push(data.req.logic[i - 1]);
          }
      }
      for (let i = data.req.logic.length; data.level.max < data.req.logic.length; i--) {
          data.req.logic.splice(data.req.logic.length - 1, 1);
      }
  }
  _prepareRaceData(itemData) {
      if (this.type !== "race") {
          return;
      }
  }
  _prepareArmorData(itemData) {
      if (this.type !== "armor") {
          return;
      }
      const data = itemData;
      data.mobility.value = data.mobility.value ?? CONFIG.ARd20.HeavyPoints[data.type][data.slot];
      data.mobility.value += data.mobility.bonus;
  }
  prepareFinalAttributes() {
      const itemData = this.system;
      const abil = itemData.abil = {};
      for (let [k, v] of Object.entries(CONFIG.ARd20.Attributes)) {
          abil[k] = this.isOwned ? getProperty(this.actor.system, `attributes.${k}.mod`) : null;
      }
      let prof_bonus = 0;
      if (itemData.type === "weapon") {
          const data = itemData;
          data.proficiency.level = this.isOwned ? this.actor?.system.proficiencies.weapon.filter((pr) => pr.name === data.sub_type)[0].value : 0;
          data.proficiency.levelName = game.settings.get("ard20", "profLevel")[data.proficiency.level].label;
          data.proficiency.key = game.settings.get("ard20", "profLevel")[data.proficiency.level].key;
          prof_bonus = data.proficiency.level * 4;
      }
      if (itemData.hasAttack) {
          this._prepareAttack(itemData, prof_bonus, abil);
      }
      if (itemData.hasDamage) {
          this._prepareDamage(itemData, abil);
      }
  }
  _prepareAttack(itemData, prof_bonus, abil) {
      const data = itemData;
      if (!data.hasAttack) {
          return;
      }
      let mod = itemData.type === "weapon" && abil !== void 0 ? abil.dex : data.atkMod;
      data.attack = {
          formula: "1d20+" + prof_bonus + "+" + mod,
          parts: [mod, prof_bonus]
      };
  }
  _prepareDamage(itemData, abil) {
      const data = itemData;
      if (!data.hasDamage) {
          return;
      }
      itemData.type === "weapon" && abil !== void 0 ? abil.str : 0;
      const prop = itemData.type === "weapon" ? `damage.common.${data.proficiency.key}.parts` : "damage.parts";
      let baseDamage = getProperty(data, prop);
      data.damage.current = {
          formula: "",
          parts: baseDamage
      };
      baseDamage?.forEach((part, key) => {
          console.log("baseDamage for current damage", part);
          data.damage.current.formula += part[0] + `[`;
          part[1].forEach((subPart, subKey) => {
              data.damage.current.formula += game.i18n.localize(CONFIG.ARd20.DamageTypes[subPart[0]]) + ` ${game.i18n.localize(CONFIG.ARd20.DamageSubTypes[subPart[1]])}`;
              data.damage.current.formula += subKey === part[1].length - 1 ? "]" : " or<br/>";
          });
          data.damage.current.formula += key === baseDamage.length - 1 ? "" : "<br/>+<br/>";
      });
  }
  getRollData() {
      if (!this.actor) {
          return null;
      }
      const rollData = this.actor.getRollData();
      const hasDamage = this.system.hasDamage;
      const hasAttack = this.system.hasAttack;
      rollData.item = foundry.utils.deepClone(this.system);
      rollData.damageDie = hasDamage ? this.system.damage.current.parts[0] : null;
      rollData.mod = hasAttack ? this.system.attack.parts[0] : hasDamage ? this.system.damage.current.parts[1] : null;
      rollData.prof = hasAttack ? this.system.attack.parts[1] : null;
      return rollData;
  }
  async roll({ configureDialog = true, rollMode, hasDamage = false, hasAttack = false, createMessage = true }) {
    let item = this;
    item.id;
    const iData = this.system;
    const actor = this.actor;
    actor?.system;
    hasDamage = iData.hasDamage || hasDamage;
    hasAttack = iData.hasAttack || hasAttack;
    ChatMessage.getSpeaker({ actor });
    this.name;
    const targets = Array.from(game.user.targets);
    const mRoll = this.system.mRoll || false;
    return item.displayCard({ rollMode, createMessage, hasAttack, hasDamage, targets, mRoll });
  }
  static chatListeners(html) {
    html.on("click", ".card-buttons button", this._onChatCardAction.bind(this));
    html.on("click", ".item-name", this._onChatCardToggleContent.bind(this));
    html.on("click", ".attack-roll .roll-controls .accept", this._rollDamage.bind(this));
    html.trigger("click");
    html.on("hover", ".attack-roll .flexrow .value", function(event) {
      event.preventDefault();
      const element2 = this.closest("li.flexrow");
      element2.querySelector(".attack-roll .hover-roll")?.classList.toggle("shown", event.type == "mouseenter");
    });
  }
  static async _onChatCardAction(event) {
      console.log(event);
      event.stopImmediatePropagation();
      const button = event.currentTarget;
      const card = button.closest(".chat-card");
      const messageId = card.closest(".message").dataset.messageId;
      const message = game.messages.get(messageId);
      const action = button.dataset.action;
      const targetUuid = button.closest(".flexrow").dataset.targetId;
      const isTargetted = action === "save";
      if (!(isTargetted || game.user.isGM || message.isAuthor)) {
          return;
      }
      const actor = await this._getChatCardActor(card);
      if (!actor) {
          return;
      }
      const storedData = message.getFlag("ard20", "itemData");
      const item = storedData ? new this(storedData, { parent: actor }) : actor.items.get(card.dataset.itemId);
      if (!item) {
          return ui.notifications.error(game.i18n.format("ARd20.ActionWarningNoItem", {
              item: card.dataset.itemId,
              name: actor.name
          }));
      }
      const spellLevel = parseInt(card.dataset.spellLevel) || null;
      switch (action) {
          case "damage":
          case "versatile":
              let dam = await item.rollDamage({
                  critical: event.altKey,
                  event,
                  spellLevel,
                  versatile: action === "versatile"
              });
              const html = $(message.data.content);
              dam = await dam.render();
              if (targetUuid) {
                  html.find(`[data-targetId="${targetUuid}"]`).find("button").replaceWith(dam);
              }
              else {
                  html.find(".damage-roll").find("button").replaceWith(dam);
              }
              await message.update({ content: html[0].outerHTML });
              break;
          case "formula":
              await item.rollFormula({ event, spellLevel });
              break;
          case "save":
              const targets = this._getChatCardTargets(card);
              for (let token of targets) {
                  const speaker = ChatMessage.getSpeaker({ scene: canvas.scene, token });
                  await token.actor.rollAbilitySave(button.dataset.ability, { event, speaker });
              }
              break;
          case "toolCheck":
              await item.rollToolCheck({ event });
              break;
          case "placeTemplate":
              const template = game.ard20.canvas.AbilityTemplate.fromItem(item);
              if (template) {
                  template.drawPreview();
              }
              break;
      }
      button.disabled = false;
  }
  static _onChatCardToggleContent(event) {
    event.preventDefault();
    const header = event.currentTarget;
    const card = header.closest(".chat-card");
    const content = card.querySelector(".card-content");
    content.style.display = content.style.display === "none" ? "block" : "none";
  }
  async _applyDamage(dam, tData, tHealth, tActor, tokenId) {
      let value = dam.total;
      console.log("\u0443\u0440\u043E\u043D \u0434\u043E \u0440\u0435\u0437\u0438\u0441\u0442\u043E\u0432: ", value);
      dam.terms.forEach((term) => {
          if (!(term instanceof OperatorTerm)) {
              let damageType = term.options.damageType;
              let res = tData.defences.damage[damageType[0]][damageType[1]];
              if (res.type === "imm") {
                  console.log("\u0418\u043C\u043C\u0443\u043D\u0438\u0442\u0435\u0442");
              }
              console.log("\u0443\u0440\u043E\u043D \u0443\u043C\u0435\u043D\u044C\u0448\u0438\u043B\u0441\u044F \u0441 ", value);
              value -= res.type === "imm" ? term.total : Math.min(res.value, term.total);
              console.log("\u0434\u043E", value);
          }
      });
      console.log(value, "\u0438\u0442\u043E\u0433\u043E\u0432\u044B\u0439 \u0443\u0440\u043E\u043D");
      tHealth -= value;
      console.log("\u0445\u043F \u0441\u0442\u0430\u043B\u043E", tHealth);
      let obj = {};
      obj["data.health.value"] = tHealth;
      if (game.user.isGM) {
          console.log("GM applying damage");
          console.log(tActor);
          await tActor.update(obj);
      }
      else {
          console.log("not GM applying damage");
          game.socket.emit("system.ard20", {
              operation: "updateActorData",
              tokenId,
              update: obj,
              value
          });
      }
  }
  static async _rollDamage(event) {
      event.stopImmediatePropagation();
      const element2 = event.currentTarget;
      const card = element2.closest(".chat-card");
      const message = game.messages.get(card.closest(".message").dataset.messageId);
      const targetUuid = element2.closest("li.flexrow").dataset.targetId;
      const token = await fromUuid(targetUuid);
      const tActor = token?.actor;
      const tData = tActor.system;
      let tHealth = tData.health.value;
      console.log(tHealth, "\u0437\u0434\u043E\u0440\u043E\u0432\u044C\u0435 \u0446\u0435\u043B\u0438");
      const actor = await this._getChatCardActor(card);
      if (!actor) {
          return;
      }
      const storedData = message.getFlag("ard20", "itemData");
      const item = storedData ? new this(storedData, { parent: actor }) : actor.items.get(card.dataset.itemId);
      if (!item) {
          return ui.notifications.error(game.i18n.format("ARd20.ActionWarningNoItem", {
              item: card.dataset.itemId,
              name: actor.name
          }));
      }
      const dam = await item.rollDamage({
          event,
          canMult: false
      });
      const html = $(message.data.content);
      let damHTML = await dam.render();
      console.log(html.find(`[data-target-id="${targetUuid}"]`).find(".damage-roll")[0]);
      html.find(`[data-target-id="${targetUuid}"]`).find(".damage-roll").append(damHTML);
      html.find(`[data-target-id="${targetUuid}"]`).find(".accept").remove();
      console.log(html[0]);
      await message.update({ content: html[0].outerHTML });
      await item._applyDamage(dam, tData, tHealth, tActor, targetUuid);
  }
  static async _getChatCardActor(card) {
    if (card.dataset.tokenId) {
        const token = await fromUuid(card.dataset.tokenId);
        if (!token) {
            return null;
        }
        return token.actor;
    }
    const actorId = card.dataset.actorId;
    return game.actors.get(actorId) || null;
  }
  static _getChatCardTargets(card) {
      let targets = canvas.tokens.controlled.filter((t) => !!t.actor);
      if (!targets.length && game.user.character) {
          targets = targets.concat(game.user.character.getActiveTokens());
      }
      if (!targets.length) {
          ui.notifications.warn(game.i18n.localize("ARd20.ActionWarningNoToken"));
      }
      return targets;
  }
  async displayCard({
    rollMode,
    createMessage = true,
    hasAttack = Boolean(),
    hasDamage = Boolean(),
    targets = [],
    mRoll = Boolean()
  } = {}) {
    let atk = {};
    let dc = {};
    let atkHTML = {};
    let dmgHTML = {};
    let result = {};
    let hit = {};
    let dmg = {};
    let dieResultCss = {};
    const def = this.system.attack?.def ?? "reflex";
    const resource = this.system.cost.resource;
    const cost = resource ? this.system.cost.value : null;
    if (cost && resource) {
      const costUpd = this.actor.system.resources[resource].value - cost;
      const update2 = {};
      update2[`system.resources.${resource}.value`] = costUpd;
      await this.actor.update(update2);
    }
    const token = this.actor.token;
    if (targets.length !== 0) {
      let atkRoll = hasAttack ? await this.rollAttack(mRoll, { canMult: true }) : null;
      let dmgRoll = hasDamage && !hasAttack ? await this.rollDamage({ canMult: true }) : null;
      for (let [key, target] of Object.entries(targets)) {
        if (atkRoll) {
          mRoll = atkRoll.options.mRoll;
          dc[key] = target.actor.system.defences.stats[def].value;
          atk[key] = hasAttack ? Object.keys(atk).length === 0 || !mRoll ? atkRoll : await atkRoll.reroll() : null;
          console.log(atk[key]);
          atkHTML[key] = hasAttack ? await atk[key].render() : null;
          let d20 = atk[key] ? atk[key].terms[0] : null;
          atk[key] = atk[key].total;
          dieResultCss[key] = d20.total >= d20.options.critical ? "d20crit" : d20.total <= d20.options.fumble ? "d20fumble" : "d20normal";
          result[key] = atk[key] > dc[key] ? "hit" : "miss";
          hit[key] = result[key] === "hit" ? true : false;
        } else {
          mRoll = dmgRoll.options.mRoll;
          dmg[key] = hasDamage ? Object.keys(dmg).length === 0 || !mRoll ? dmgRoll : await dmgRoll.reroll() : null;
          dmgHTML[key] = hasDamage ? await dmg[key].render() : null;
        }
      }
    } else {
      atk[0] = hasAttack ? await this.rollAttack(mRoll) : null;
      mRoll = atk[0] ? atk[0].options.mRoll : false;
      atkHTML[0] = hasAttack ? await atk[0].render() : null;
    }
    targets.size !== 0 ? mRoll ? "multiAttack" : "oneAttack" : "noTarget";
    const templateData = {
      actor: this.actor.system,
      tokenId: token?.uuid || null,
      item: this,
      data: this.getChatData(),
      labels: this.labels,
      hasAttack,
      hasDamage,
      atk,
      atkHTML,
      targets,
      owner: this.actor.isOwner || game.user.isGM,
      dc,
      result,
      hit,
      dmgHTML,
      dieResultCss
    };
    const html = await renderTemplate(`systems/ard20/templates/chat/item-card-multiAttack.html`, templateData);
    const chatData = {
      user: game.user.data._id,
      type: CONST.CHAT_MESSAGE_TYPES.OTHER,
      content: html,
      flavor: this.system.chatFlavor || this.name,
      speaker: ChatMessage.getSpeaker({ actor: this.actor, token }),
      flags: { "core.canPopout": true }
    };
    ChatMessage.applyRollMode(chatData, rollMode || game.settings.get("core", "rollMode"));
    return createMessage ? ChatMessage.create(chatData) : chatData;
  }
  getChatData(htmlOptions = {}) {
    const data = foundry.utils.deepClone(this.system);
    return data;
  }
  async rollAttack(mRoll = Boolean(), canMult = Boolean(), options = {}) {
    console.log(canMult);
    this.system;
    this.actor.flags.ard20 || {};
    let title = `${this.name} - ${game.i18n.localize("ARd20.AttackRoll")}`;
    const { parts, rollData } = this.getAttackToHit();
    const targets = game.user.targets;
    if (options.parts?.length > 0) {
      parts.push(...options.parts);
    }
    let rollConfig = {
        parts,
        actor: this.actor,
        data: rollData,
        title,
        flavor: title,
        dialogOptions: {
            width: 400
        },
        chatMessage: true,
        options: {
            create: false
        },
        targetValue: targets,
        canMult,
        mRoll
    };
      rollConfig = mergeObject(rollConfig, options);
      const roll = await d20Roll(rollConfig);
      if (roll === false) {
          return null;
      }
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
        console.log(canMult);
        const iData = this.system;
        this.actor.system;
        const parts = iData.damage.current.parts.map((d) => d[0]);
        const damType = iData.damage.current.parts.map(
            (d) => d[1].map((c, ind) => {
                let a = game.i18n.localize(CONFIG.ARd20.DamageTypes[c[0]]);
                let b = game.i18n.localize(CONFIG.ARd20.DamageSubTypes[c[1]]);
                let obj = { key: ind, label: `${a} ${b}` };
                return obj;
            })
        );
        options.damageType = iData.damage.current.parts.map((d) => d[1]);
        const hasAttack = false;
        const hasDamage = true;
        const rollData = this.getRollData(hasAttack, hasDamage);
        const rollConfig = {
            actor: this.actor,
            critical: critical ?? event?.altkey ?? false,
            data: rollData,
            event,
            parts,
            canMult,
            damType,
            mRoll
        };
        return damageRoll(mergeObject(rollConfig, options));
    }

    getAttackToHit() {
        const itemData = this.system;
        const hasAttack = true;
        const hasDamage = false;
        const rollData = this.getRollData(hasAttack, hasDamage);
        console.log("ROLL DATA", rollData);
        const parts = [];
        if (itemData.attackBonus) {
            parts.push(itemData.attackBonus);
            this.labels.toHit = itemData.attackBonus;
        }
        if (!this.isOwned) {
            return { rollData, parts };
        }
        parts.push("@prof", "@mod");
        const roll = new Roll(parts.join("+"), rollData);
        const formula = simplifyRollFormula(roll.formula);
        this.labels.toHit = !/^[+-]/.test(formula) ? `+ ${formula}` : formula;
        return { rollData, parts };
    }

    async addAction(object = {}, options = {}) {
        const actionList = this.system.actionList;
        console.log(this.system.actionList);
        const numberOfNewActions = this.system.actionList.filter((action) => {
            console.log(action.name.substring(0, 10) === "New Action");
            return action.name.substring(0, 10) === "New Action";
        }).length + 1;
        object.name = numberOfNewActions - 1 ? "New Action#" + numberOfNewActions : "New Action";
        object.id = uuidv4();
        actionList.push(object);
        await this.update({ "system.actionList": actionList });
    }

    async removeAction(id) {
        const actionList = this.system.actionList;
        const actionIndex = actionList.findIndex((action) => {
            return action.id === id;
        });
        if (actionIndex > -1) {
            actionList.splice(actionIndex, 1);
        }
        await this.update({ "system.actionList": actionList });
    }
}
__name(ARd20Item, "ARd20Item");
class RaceDataModel extends foundry.abstract.DataModel {
  static defineSchema() {
    return {
      description: new foundry.data.fields.StringField({ nullable: false, required: true, initial: "" }),
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
__name(RaceDataModel, "RaceDataModel");
function onManageActiveEffect(event, owner) {
  event.preventDefault();
  const a = event.currentTarget;
  const li = a.closest("li");
  const effect = li.dataset.effectId ? owner.effects.get(li.dataset.effectId) : null;
  switch (a.dataset.action) {
    case "create":
      return owner.createEmbeddedDocuments("ActiveEffect", [{
        label: "New Effect",
        icon: "icons/svg/aura.svg",
        origin: owner.uuid,
        "duration.rounds": li.dataset.effectType === "temporary" ? 1 : void 0,
        disabled: li.dataset.effectType === "inactive"
      }]);
    case "edit":
      return effect.sheet.render(true);
    case "delete":
      return effect.delete();
    case "toggle":
      return effect.update({ disabled: !effect.data.disabled });
  }
}
__name(onManageActiveEffect, "onManageActiveEffect");
function prepareActiveEffectCategories(effects) {
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
  };
  for (let e of effects) {
    e._getSourceName();
    if (e.data.disabled)
      categories.inactive.effects.push(e);
    else if (e.isTemporary)
      categories.temporary.effects.push(e);
    else
      categories.passive.effects.push(e);
  }
  return categories;
}
__name(prepareActiveEffectCategories, "prepareActiveEffectCategories");
const ChangeButton_svelte_svelte_type_style_lang = "";

function create_if_block_1$3(ctx) {
    let i;
    let mounted;
    let dispose;
    return {
        c() {
            i = element("i");
            attr(i, "class", "change fa-light fa-square-plus svelte-87fh0g");
            toggle_class(i, "disabled", ctx[4]);
        },
        m(target, anchor) {
            insert(target, i, anchor);
            if (!mounted) {
                dispose = listen(i, "click", ctx[12]);
                mounted = true;
            }
        },
        p(ctx2, dirty) {
            if (dirty & 16) {
                toggle_class(i, "disabled", ctx2[4]);
            }
        },
        d(detaching) {
            if (detaching) {
                detach(i);
            }
            mounted = false;
            dispose();
        }
    };
}

__name(create_if_block_1$3, "create_if_block_1$3");

function create_if_block$c(ctx) {
    let i;
    let mounted;
    let dispose;
    return {
        c() {
            i = element("i");
            attr(i, "class", "change fa-light fa-square-minus svelte-87fh0g");
            toggle_class(i, "disabled", ctx[4]);
        },
        m(target, anchor) {
            insert(target, i, anchor);
            if (!mounted) {
                dispose = listen(i, "click", ctx[13]);
                mounted = true;
            }
        },
        p(ctx2, dirty) {
            if (dirty & 16) {
                toggle_class(i, "disabled", ctx2[4]);
            }
        },
        d(detaching) {
            if (detaching) {
                detach(i);
            }
            mounted = false;
            dispose();
        }
    };
}

__name(create_if_block$c, "create_if_block$c");

function create_fragment$q(ctx) {
    let t;
    let if_block1_anchor;
    let if_block0 = ctx[0] !== void 0 && create_if_block_1$3(ctx);
    let if_block1 = ctx[1] !== void 0 && create_if_block$c(ctx);
    return {
        c() {
            if (if_block0) {
                if_block0.c();
            }
            t = space();
            if (if_block1) {
                if_block1.c();
            }
            if_block1_anchor = empty();
        },
        m(target, anchor) {
            if (if_block0) {
                if_block0.m(target, anchor);
            }
            insert(target, t, anchor);
            if (if_block1) {
                if_block1.m(target, anchor);
            }
            insert(target, if_block1_anchor, anchor);
        },
        p(ctx2, [dirty]) {
            if (ctx2[0] !== void 0) {
                if (if_block0) {
                    if_block0.p(ctx2, dirty);
                }
                else {
                    if_block0 = create_if_block_1$3(ctx2);
                    if_block0.c();
                    if_block0.m(t.parentNode, t);
                }
            }
            else if (if_block0) {
                if_block0.d(1);
                if_block0 = null;
            }
            if (ctx2[1] !== void 0) {
                if (if_block1) {
                    if_block1.p(ctx2, dirty);
                }
                else {
                    if_block1 = create_if_block$c(ctx2);
                    if_block1.c();
                    if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
                }
            }
            else if (if_block1) {
                if_block1.d(1);
                if_block1 = null;
            }
        },
        i: noop,
        o: noop,
        d(detaching) {
            if (if_block0) {
                if_block0.d(detaching);
            }
            if (detaching) {
                detach(t);
            }
            if (if_block1) {
                if_block1.d(detaching);
            }
            if (detaching) {
                detach(if_block1_anchor);
            }
        }
    };
}

__name(create_fragment$q, "create_fragment$q");

function instance$p($$self, $$props, $$invalidate) {
    let $changes;
    let $doc;
    let { max } = $$props;
    let { min } = $$props;
    let { type } = $$props;
    let { subtype } = $$props;
    let { cost } = $$props;
    const doc = getContext("chaAdvActorData");
    component_subscribe($$self, doc, (value) => $$invalidate(11, $doc = value));
    const changes = getContext("chaAdvXpChanges");
    component_subscribe($$self, changes, (value) => $$invalidate(14, $changes = value));
    let disabled;
    let { costLabel } = $$props;

    function increase(type2, subtype2) {
        doc.update((store) => {
            switch (type2) {
                case "attributes":
                    store.attributes[subtype2].value += 1;
                    break;
                case "skills":
                    store.skills[subtype2].level += 1;
                    break;
                case "features":
                    store.features[subtype2].system.level.initial += 1;
                    break;
            }
            store.advancement.xp.used += cost;
            store.advancement.xp.get -= cost;
            return store;
        });
        changes.update((changeArr) => {
            changeArr.push({ type: type2, subtype: subtype2, value: cost });
            return changeArr;
        });
    }

    __name(increase, "increase");

    function decrease(type2, subtype2) {
        doc.update((store) => {
            switch (type2) {
                case "attributes":
                    store.attributes[subtype2].value -= 1;
                    break;
                case "skills":
                    store.skills[subtype2].level -= 1;
                    break;
                case "features":
                    store.features[subtype2].system.level.initial -= 1;
                    break;
            }
            let index = -1;
            $changes.forEach((change, key) => {
                index = change.type === type2 && change.subtype === subtype2 && key > index ? key : index;
            });
            if (index >= 0) {
                store.advancement.xp.used -= $changes[index].value;
                store.advancement.xp.get += $changes[index].value;
                return store;
            }
        });
        changes.update((changeArr) => {
            let index = -1;
            changeArr.forEach((change, key) => {
                index = change.type === type2 && change.subtype === subtype2 && key > index ? key : index;
            });
            if (index >= 0) {
                changeArr.splice(index, 1);
                changeArr = changeArr;
            }
            return changeArr;
        });
    }

    __name(decrease, "decrease");
    const click_handler2 = /* @__PURE__ */ __name(() => increase(type, subtype), "click_handler");
    const click_handler_1 = /* @__PURE__ */ __name(() => decrease(type, subtype), "click_handler_1");
    $$self.$$set = ($$props2) => {
        if ("max" in $$props2) {
            $$invalidate(0, max = $$props2.max);
        }
        if ("min" in $$props2) {
            $$invalidate(1, min = $$props2.min);
        }
        if ("type" in $$props2) {
            $$invalidate(2, type = $$props2.type);
        }
        if ("subtype" in $$props2) {
            $$invalidate(3, subtype = $$props2.subtype);
        }
        if ("cost" in $$props2) {
            $$invalidate(10, cost = $$props2.cost);
        }
        if ("costLabel" in $$props2) {
            $$invalidate(9, costLabel = $$props2.costLabel);
        }
    };
    $$self.$$.update = () => {
        if ($$self.$$.dirty & 3103) {
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
        click_handler2,
        click_handler_1
    ];
}

__name(instance$p, "instance$p");

class ChangeButton extends SvelteComponent {
    constructor(options) {
        super();
        init(this, options, instance$p, create_fragment$q, safe_not_equal, {
            max: 0,
            min: 1,
            type: 2,
            subtype: 3,
            cost: 10,
            costLabel: 9
        });
    }
}
__name(ChangeButton, "ChangeButton");
const TDvariants_svelte_svelte_type_style_lang = "";
function create_if_block_10(ctx) {
  let td;
  let t_value = ctx[2][0] + "";
  let t;
  let mounted;
  let dispose;
  return {
    c() {
      td = element("td");
      t = text(t_value);
      attr(td, "class", null_to_empty(ctx[13]) + " svelte-uscx8i");
    },
    m(target, anchor) {
      insert(target, td, anchor);
      append(td, t);
      if (!mounted) {
        dispose = listen(td, "mouseover", ctx[16]);
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (dirty & 4 && t_value !== (t_value = ctx2[2][0] + ""))
        set_data(t, t_value);
    },
    d(detaching) {
      if (detaching)
        detach(td);
      mounted = false;
      dispose();
    }
  };
}
__name(create_if_block_10, "create_if_block_10");
function create_if_block_9(ctx) {
  let td;
  let raw_value = ctx[2][1].system.source.label + "";
  let mounted;
  let dispose;
  return {
    c() {
      td = element("td");
      attr(td, "class", null_to_empty(ctx[13]) + " svelte-uscx8i");
    },
    m(target, anchor) {
      insert(target, td, anchor);
      td.innerHTML = raw_value;
      if (!mounted) {
        dispose = listen(td, "mouseover", ctx[17]);
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (dirty & 4 && raw_value !== (raw_value = ctx2[2][1].system.source.label + ""))
        td.innerHTML = raw_value;
    },
    d(detaching) {
      if (detaching)
        detach(td);
      mounted = false;
      dispose();
    }
  };
}
__name(create_if_block_9, "create_if_block_9");
function create_if_block_8(ctx) {
  let td;
  let changebutton;
  let current;
  let mounted;
  let dispose;
  changebutton = new ChangeButton({
    props: {
      type: ctx[4],
      subtype: ctx[2][0],
      max: ctx[0],
      cost: ctx[6]
    }
  });
  return {
    c() {
      td = element("td");
      create_component(changebutton.$$.fragment);
      attr(td, "class", null_to_empty(ctx[13]) + " svelte-uscx8i");
    },
    m(target, anchor) {
      insert(target, td, anchor);
      mount_component(changebutton, td, null);
      current = true;
      if (!mounted) {
        dispose = listen(td, "mouseover", ctx[18]);
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      const changebutton_changes = {};
      if (dirty & 16)
        changebutton_changes.type = ctx2[4];
      if (dirty & 4)
        changebutton_changes.subtype = ctx2[2][0];
      if (dirty & 1)
        changebutton_changes.max = ctx2[0];
      if (dirty & 64)
        changebutton_changes.cost = ctx2[6];
      changebutton.$set(changebutton_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(changebutton.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(changebutton.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching)
        detach(td);
      destroy_component(changebutton);
      mounted = false;
      dispose();
    }
  };
}
__name(create_if_block_8, "create_if_block_8");
function create_if_block_7(ctx) {
  let td;
  let t_value = ctx[2][1].system.level.initial + "";
  let t;
  let mounted;
  let dispose;
  return {
    c() {
      td = element("td");
      t = text(t_value);
      attr(td, "class", null_to_empty(ctx[13]) + " svelte-uscx8i");
    },
    m(target, anchor) {
      insert(target, td, anchor);
      append(td, t);
      if (!mounted) {
        dispose = listen(td, "mouseover", ctx[19]);
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (dirty & 4 && t_value !== (t_value = ctx2[2][1].system.level.initial + ""))
        set_data(t, t_value);
    },
    d(detaching) {
      if (detaching)
        detach(td);
      mounted = false;
      dispose();
    }
  };
}
__name(create_if_block_7, "create_if_block_7");
function create_if_block_6(ctx) {
  let td;
  let t_value = ctx[2][1].system.level.max + "";
  let t;
  let mounted;
  let dispose;
  return {
    c() {
      td = element("td");
      t = text(t_value);
      attr(td, "class", null_to_empty(ctx[13]) + " svelte-uscx8i");
    },
    m(target, anchor) {
      insert(target, td, anchor);
      append(td, t);
      if (!mounted) {
        dispose = listen(td, "mouseover", ctx[20]);
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (dirty & 4 && t_value !== (t_value = ctx2[2][1].system.level.max + ""))
        set_data(t, t_value);
    },
    d(detaching) {
      if (detaching)
        detach(td);
      mounted = false;
      dispose();
    }
  };
}
__name(create_if_block_6, "create_if_block_6");
function create_if_block_5(ctx) {
  let td;
  let t_value = ctx[2][1].rankName + "";
  let t;
  let mounted;
  let dispose;
  return {
    c() {
      td = element("td");
      t = text(t_value);
      attr(td, "class", null_to_empty(ctx[13]) + " svelte-uscx8i");
    },
    m(target, anchor) {
      insert(target, td, anchor);
      append(td, t);
      if (!mounted) {
        dispose = listen(td, "mouseover", ctx[21]);
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (dirty & 4 && t_value !== (t_value = ctx2[2][1].rankName + ""))
        set_data(t, t_value);
    },
    d(detaching) {
      if (detaching)
        detach(td);
      mounted = false;
      dispose();
    }
  };
}
__name(create_if_block_5, "create_if_block_5");
function create_if_block_4(ctx) {
  let td;
  let t_value = ctx[2][1].value + "";
  let t;
  let mounted;
  let dispose;
  return {
    c() {
      td = element("td");
      t = text(t_value);
      attr(td, "class", null_to_empty(ctx[13]) + " svelte-uscx8i");
    },
    m(target, anchor) {
      insert(target, td, anchor);
      append(td, t);
      if (!mounted) {
        dispose = listen(td, "mouseover", ctx[22]);
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (dirty & 4 && t_value !== (t_value = ctx2[2][1].value + ""))
        set_data(t, t_value);
    },
    d(detaching) {
      if (detaching)
        detach(td);
      mounted = false;
      dispose();
    }
  };
}
__name(create_if_block_4, "create_if_block_4");
function create_if_block_3(ctx) {
  let td;
  let changebutton;
  let current;
  let mounted;
  let dispose;
  changebutton = new ChangeButton({
    props: {
      type: ctx[4],
      subtype: ctx[2][0],
      min: ctx[7]
    }
  });
  return {
    c() {
      td = element("td");
      create_component(changebutton.$$.fragment);
      attr(td, "class", null_to_empty(ctx[13]) + " svelte-uscx8i");
    },
    m(target, anchor) {
      insert(target, td, anchor);
      mount_component(changebutton, td, null);
      current = true;
      if (!mounted) {
        dispose = listen(td, "mouseover", ctx[23]);
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      const changebutton_changes = {};
      if (dirty & 16)
        changebutton_changes.type = ctx2[4];
      if (dirty & 4)
        changebutton_changes.subtype = ctx2[2][0];
      if (dirty & 128)
        changebutton_changes.min = ctx2[7];
      changebutton.$set(changebutton_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(changebutton.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(changebutton.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching)
        detach(td);
      destroy_component(changebutton);
      mounted = false;
      dispose();
    }
  };
}
__name(create_if_block_3, "create_if_block_3");
function create_if_block_2(ctx) {
  let td;
  let t;
  let mounted;
  let dispose;
  return {
    c() {
      td = element("td");
      t = text(ctx[8]);
      attr(td, "class", null_to_empty(ctx[13]) + " svelte-uscx8i");
    },
    m(target, anchor) {
      insert(target, td, anchor);
      append(td, t);
      if (!mounted) {
        dispose = listen(td, "mouseover", ctx[24]);
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (dirty & 256)
        set_data(t, ctx2[8]);
    },
    d(detaching) {
      if (detaching)
        detach(td);
      mounted = false;
      dispose();
    }
  };
}
__name(create_if_block_2, "create_if_block_2");

function create_if_block_1$2(ctx) {
    let td;
    let t;
    let mounted;
    let dispose;
    return {
        c() {
            td = element("td");
            t = text(ctx[6]);
            attr(td, "class", null_to_empty(ctx[13]) + " svelte-uscx8i");
        },
        m(target, anchor) {
            insert(target, td, anchor);
            append(td, t);
            if (!mounted) {
                dispose = listen(td, "mouseover", ctx[25]);
                mounted = true;
            }
        },
        p(ctx2, dirty) {
            if (dirty & 64)
                set_data(t, ctx2[6]);
        },
        d(detaching) {
            if (detaching)
                detach(td);
            mounted = false;
            dispose();
        }
    };
}

__name(create_if_block_1$2, "create_if_block_1$2");

function create_if_block$b(ctx) {
    let td;
    let t;
    let td_rowspan_value;
    return {
        c() {
            td = element("td");
            t = text(ctx[1]);
            attr(td, "class", "description svelte-uscx8i");
            attr(td, "rowspan", td_rowspan_value = ctx[5].length);
        },
        m(target, anchor) {
            insert(target, td, anchor);
            append(td, t);
        },
        p(ctx2, dirty) {
            if (dirty & 2)
                set_data(t, ctx2[1]);
            if (dirty & 32 && td_rowspan_value !== (td_rowspan_value = ctx2[5].length)) {
                attr(td, "rowspan", td_rowspan_value);
            }
        },
        d(detaching) {
            if (detaching)
                detach(td);
        }
    };
}

__name(create_if_block$b, "create_if_block$b");

function create_fragment$p(ctx) {
    let tr;
    let show_if_10 = ctx[5].includes("Name");
    let t0;
    let show_if_9 = ctx[5].includes("Source");
    let t1;
    let show_if_8 = ctx[5].includes("Increase");
    let t2;
    let show_if_7 = ctx[5].includes("Level");
    let t3;
    let show_if_6 = ctx[5].includes("Max Level");
    let t4;
    let show_if_5 = ctx[5].includes("Rank");
    let t5;
    let show_if_4 = ctx[5].includes("Value");
    let t6;
    let show_if_3 = ctx[5].includes("Decrease");
    let t7;
    let show_if_2 = ctx[5].includes("Mod");
    let t8;
    let show_if_1 = ctx[5].includes("Cost");
    let t9;
    let show_if = ctx[3] === 0 && ctx[5].includes("Description");
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
    let if_block9 = show_if_1 && create_if_block_1$2(ctx);
    let if_block10 = show_if && create_if_block$b(ctx);
    return {
        c() {
            tr = element("tr");
            if (if_block0)
                if_block0.c();
            t0 = space();
            if (if_block1)
                if_block1.c();
            t1 = space();
            if (if_block2)
                if_block2.c();
            t2 = space();
            if (if_block3)
                if_block3.c();
            t3 = space();
            if (if_block4)
                if_block4.c();
            t4 = space();
            if (if_block5)
                if_block5.c();
            t5 = space();
            if (if_block6)
                if_block6.c();
            t6 = space();
            if (if_block7)
                if_block7.c();
            t7 = space();
            if (if_block8)
                if_block8.c();
            t8 = space();
            if (if_block9)
                if_block9.c();
            t9 = space();
            if (if_block10)
                if_block10.c();
            set_style(tr, "--cellWidth", ctx[11] + "%");
            attr(tr, "class", "svelte-uscx8i");
            add_render_callback(() => ctx[26].call(tr));
        },
        m(target, anchor) {
            insert(target, tr, anchor);
            if (if_block0)
                if_block0.m(tr, null);
            append(tr, t0);
            if (if_block1)
                if_block1.m(tr, null);
            append(tr, t1);
            if (if_block2)
                if_block2.m(tr, null);
            append(tr, t2);
            if (if_block3)
                if_block3.m(tr, null);
            append(tr, t3);
            if (if_block4)
                if_block4.m(tr, null);
            append(tr, t4);
            if (if_block5)
                if_block5.m(tr, null);
            append(tr, t5);
            if (if_block6)
                if_block6.m(tr, null);
            append(tr, t6);
            if (if_block7)
                if_block7.m(tr, null);
            append(tr, t7);
            if (if_block8)
                if_block8.m(tr, null);
            append(tr, t8);
            if (if_block9)
                if_block9.m(tr, null);
            append(tr, t9);
            if (if_block10)
                if_block10.m(tr, null);
            tr_resize_listener = add_resize_listener(tr, ctx[26].bind(tr));
            current = true;
        },
        p(ctx2, [dirty]) {
            if (dirty & 32)
                show_if_10 = ctx2[5].includes("Name");
            if (show_if_10) {
                if (if_block0) {
                    if_block0.p(ctx2, dirty);
                }
                else {
                    if_block0 = create_if_block_10(ctx2);
                    if_block0.c();
                    if_block0.m(tr, t0);
                }
            }
            else if (if_block0) {
                if_block0.d(1);
                if_block0 = null;
            }
            if (dirty & 32)
                show_if_9 = ctx2[5].includes("Source");
            if (show_if_9) {
                if (if_block1) {
                    if_block1.p(ctx2, dirty);
                }
                else {
                    if_block1 = create_if_block_9(ctx2);
                    if_block1.c();
                    if_block1.m(tr, t1);
                }
            }
            else if (if_block1) {
                if_block1.d(1);
                if_block1 = null;
            }
            if (dirty & 32)
                show_if_8 = ctx2[5].includes("Increase");
            if (show_if_8) {
                if (if_block2) {
                    if_block2.p(ctx2, dirty);
                    if (dirty & 32) {
                        transition_in(if_block2, 1);
                    }
                }
                else {
                    if_block2 = create_if_block_8(ctx2);
                    if_block2.c();
                    transition_in(if_block2, 1);
                    if_block2.m(tr, t2);
                }
            }
            else if (if_block2) {
        group_outros();
        transition_out(if_block2, 1, 1, () => {
          if_block2 = null;
        });
        check_outros();
      }
      if (dirty & 32)
        show_if_7 = ctx2[5].includes("Level");
      if (show_if_7) {
        if (if_block3) {
          if_block3.p(ctx2, dirty);
        } else {
          if_block3 = create_if_block_7(ctx2);
          if_block3.c();
          if_block3.m(tr, t3);
        }
      } else if (if_block3) {
        if_block3.d(1);
        if_block3 = null;
      }
      if (dirty & 32)
        show_if_6 = ctx2[5].includes("Max Level");
      if (show_if_6) {
        if (if_block4) {
          if_block4.p(ctx2, dirty);
        } else {
          if_block4 = create_if_block_6(ctx2);
          if_block4.c();
          if_block4.m(tr, t4);
        }
      } else if (if_block4) {
        if_block4.d(1);
        if_block4 = null;
      }
      if (dirty & 32)
        show_if_5 = ctx2[5].includes("Rank");
      if (show_if_5) {
        if (if_block5) {
          if_block5.p(ctx2, dirty);
        } else {
          if_block5 = create_if_block_5(ctx2);
          if_block5.c();
          if_block5.m(tr, t5);
        }
      } else if (if_block5) {
        if_block5.d(1);
        if_block5 = null;
      }
      if (dirty & 32)
        show_if_4 = ctx2[5].includes("Value");
      if (show_if_4) {
        if (if_block6) {
          if_block6.p(ctx2, dirty);
        } else {
          if_block6 = create_if_block_4(ctx2);
          if_block6.c();
          if_block6.m(tr, t6);
        }
      } else if (if_block6) {
        if_block6.d(1);
        if_block6 = null;
      }
      if (dirty & 32)
        show_if_3 = ctx2[5].includes("Decrease");
      if (show_if_3) {
        if (if_block7) {
          if_block7.p(ctx2, dirty);
          if (dirty & 32) {
            transition_in(if_block7, 1);
          }
        } else {
          if_block7 = create_if_block_3(ctx2);
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
      if (dirty & 32)
        show_if_2 = ctx2[5].includes("Mod");
      if (show_if_2) {
        if (if_block8) {
          if_block8.p(ctx2, dirty);
        } else {
          if_block8 = create_if_block_2(ctx2);
          if_block8.c();
          if_block8.m(tr, t8);
        }
      } else if (if_block8) {
        if_block8.d(1);
        if_block8 = null;
      }
      if (dirty & 32)
        show_if_1 = ctx2[5].includes("Cost");
      if (show_if_1) {
        if (if_block9) {
          if_block9.p(ctx2, dirty);
        } else {
            if_block9 = create_if_block_1$2(ctx2);
            if_block9.c();
            if_block9.m(tr, t9);
        }
      } else if (if_block9) {
        if_block9.d(1);
        if_block9 = null;
      }
      if (dirty & 40)
        show_if = ctx2[3] === 0 && ctx2[5].includes("Description");
      if (show_if) {
        if (if_block10) {
          if_block10.p(ctx2, dirty);
        } else {
            if_block10 = create_if_block$b(ctx2);
            if_block10.c();
            if_block10.m(tr, null);
        }
      } else if (if_block10) {
        if_block10.d(1);
        if_block10 = null;
      }
    },
    i(local) {
      if (current)
        return;
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
        if (detaching)
            detach(tr);
        if (if_block0)
            if_block0.d();
        if (if_block1)
            if_block1.d();
        if (if_block2)
            if_block2.d();
        if (if_block3)
            if_block3.d();
        if (if_block4)
            if_block4.d();
        if (if_block5)
            if_block5.d();
        if (if_block6)
            if_block6.d();
        if (if_block7)
            if_block7.d();
        if (if_block8)
            if_block8.d();
        if (if_block9)
            if_block9.d();
        if (if_block10)
            if_block10.d();
        tr_resize_listener();
    }
    };
}

__name(create_fragment$p, "create_fragment$p");

function instance$o($$self, $$props, $$invalidate) {
    let $element;
    let { max } = $$props;
    let { val } = $$props;
    let { key } = $$props;
    let { type } = $$props;
    let { description } = $$props;
    let { typeStr } = $$props;
    let { thead } = $$props;
    const originalData = getContext("chaAdvActorOriginalData");
    const aditionalData = getContext("chaAdvAditionalData");
    const element2 = getContext("chaAdvElementParameters");
    component_subscribe($$self, element2, (value) => $$invalidate(9, $element = value));
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

    function changeDesc(val2) {
        if (!val2[1].description)
            return "";
        $$invalidate(1, description = val2[1].description);
    }

    __name(changeDesc, "changeDesc");
    let strMod;
    let last = key === Object.values(type).length - 1 ? "last" : "";
    const mouseover_handler = /* @__PURE__ */ __name(() => changeDesc(val), "mouseover_handler");
    const mouseover_handler_1 = /* @__PURE__ */ __name(() => changeDesc(val), "mouseover_handler_1");
    const mouseover_handler_2 = /* @__PURE__ */ __name(() => changeDesc(val), "mouseover_handler_2");
    const mouseover_handler_3 = /* @__PURE__ */ __name(() => changeDesc(val), "mouseover_handler_3");
    const mouseover_handler_4 = /* @__PURE__ */ __name(() => changeDesc(val), "mouseover_handler_4");
    const mouseover_handler_5 = /* @__PURE__ */ __name(() => changeDesc(val), "mouseover_handler_5");
    const mouseover_handler_6 = /* @__PURE__ */ __name(() => changeDesc(val), "mouseover_handler_6");
    const mouseover_handler_7 = /* @__PURE__ */ __name(() => changeDesc(val), "mouseover_handler_7");
    const mouseover_handler_8 = /* @__PURE__ */ __name(() => changeDesc(val), "mouseover_handler_8");
    const mouseover_handler_9 = /* @__PURE__ */ __name(() => changeDesc(val), "mouseover_handler_9");

    function tr_elementresize_handler() {
        $element.trHeight = this.offsetHeight;
        element2.set($element);
        $element.trWidth = this.clientWidth;
        element2.set($element);
    }

    __name(tr_elementresize_handler, "tr_elementresize_handler");
    $$self.$$set = ($$props2) => {
        if ("max" in $$props2)
            $$invalidate(0, max = $$props2.max);
        if ("val" in $$props2)
            $$invalidate(2, val = $$props2.val);
        if ("key" in $$props2)
            $$invalidate(3, key = $$props2.key);
        if ("type" in $$props2)
            $$invalidate(14, type = $$props2.type);
        if ("description" in $$props2)
            $$invalidate(1, description = $$props2.description);
        if ("typeStr" in $$props2)
            $$invalidate(4, typeStr = $$props2.typeStr);
        if ("thead" in $$props2)
            $$invalidate(5, thead = $$props2.thead);
    };
    $$self.$$.update = () => {
        if ($$self.$$.dirty & 32788) {
            {
                for (let [key2, variable] of Object.entries(getContext("chaAdvXpFormulas").variables)) {
                    switch (key2) {
                        case "attributes":
                            $$invalidate(15, variables[variable.shortName] = typeStr === key2 ? val[1].value : 0, variables);
                            break;
                        case "skills":
                            $$invalidate(15, variables[variable.shortName] = typeStr === key2 ? val[1].level : 0, variables);
                            break;
                        case "features":
                            $$invalidate(15, variables[variable.shortName] = typeStr === key2 ? val[1].system.level.initial : 0, variables);
                            break;
                        case "skillsCount":
                            $$invalidate(15, variables[variable.shortName] = 1, variables);
                            break;
                        case "featuresCount":
                            $$invalidate(15, variables[variable.shortName] = 1, variables);
                    }
                }
                $$invalidate(6, cost = math.evaluate(formulas[typeStr], variables));
            }
        }
        if ($$self.$$.dirty & 4) {
            if (val[1].mod !== void 0) {
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
        element2,
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

__name(instance$o, "instance$o");
class TDvariants extends SvelteComponent {
  constructor(options) {
      super();
      init(this, options, instance$o, create_fragment$p, safe_not_equal, {
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
__name(TDvariants, "TDvariants");
const Attributes_svelte_svelte_type_style_lang = "";

function get_each_context$f(ctx, list, i) {
    const child_ctx = ctx.slice();
    child_ctx[14] = list[i];
    child_ctx[16] = i;
    return child_ctx;
}

__name(get_each_context$f, "get_each_context$f");
function get_each_context_1$7(ctx, list, i) {
    const child_ctx = ctx.slice();
    child_ctx[17] = list[i];
    return child_ctx;
}
__name(get_each_context_1$7, "get_each_context_1$7");
function create_each_block_1$7(ctx) {
    let th;
    let t0_value = ctx[17] + "";
    let t0;
    let t1;
    let style_width = `${ctx[9]}%`;
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
        p(ctx2, dirty) {
            if (dirty & 8 && t0_value !== (t0_value = ctx2[17] + ""))
                set_data(t0, t0_value);
        },
        d(detaching) {
            if (detaching)
                detach(th);
        }
    };
}
__name(create_each_block_1$7, "create_each_block_1$7");

function create_each_block$f(ctx) {
    let tdvariants;
    let updating_description;
    let current;

    function tdvariants_description_binding(value) {
        ctx[11](value);
    }

    __name(tdvariants_description_binding, "tdvariants_description_binding");
    let tdvariants_props = {
        type: ctx[1][ctx[0]],
        thead: ctx[3],
        typeStr: ctx[2],
        val: ctx[14],
        max: ctx[5],
        key: ctx[16]
    };
    if (ctx[4] !== void 0) {
        tdvariants_props.description = ctx[4];
    }
    tdvariants = new TDvariants({ props: tdvariants_props });
    binding_callbacks.push(() => bind(tdvariants, "description", tdvariants_description_binding));
    return {
        c() {
            create_component(tdvariants.$$.fragment);
        },
        m(target, anchor) {
            mount_component(tdvariants, target, anchor);
            current = true;
        },
        p(ctx2, dirty) {
            const tdvariants_changes = {};
            if (dirty & 3)
                tdvariants_changes.type = ctx2[1][ctx2[0]];
            if (dirty & 8)
                tdvariants_changes.thead = ctx2[3];
            if (dirty & 4)
                tdvariants_changes.typeStr = ctx2[2];
            if (dirty & 3)
                tdvariants_changes.val = ctx2[14];
            if (dirty & 32)
                tdvariants_changes.max = ctx2[5];
            if (!updating_description && dirty & 16) {
                updating_description = true;
                tdvariants_changes.description = ctx2[4];
                add_flush_callback(() => updating_description = false);
            }
            tdvariants.$set(tdvariants_changes);
        },
        i(local) {
            if (current)
                return;
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

__name(create_each_block$f, "create_each_block$f");

function create_fragment$o(ctx) {
    let div2;
    let table;
    let thead_1;
    let tr;
    let style_width = `${ctx[6].trWidth}px`;
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
    let each_value_1 = ctx[3];
    let each_blocks_1 = [];
    for (let i = 0; i < each_value_1.length; i += 1) {
        each_blocks_1[i] = create_each_block_1$7(get_each_context_1$7(ctx, each_value_1, i));
    }
    let each_value = Object.entries(ctx[1][ctx[0]]);
    let each_blocks = [];
    for (let i = 0; i < each_value.length; i += 1) {
        each_blocks[i] = create_each_block$f(get_each_context$f(ctx, each_value, i));
    }
    const out = /* @__PURE__ */ __name((i) => transition_out(each_blocks[i], 1, 1, () => {
        each_blocks[i] = null;
    }), "out");
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
            t4 = text(ctx[4]);
            attr(tr, "class", "svelte-1or51gx");
            set_style(tr, "width", style_width, false);
            attr(thead_1, "class", "svelte-1or51gx");
            add_render_callback(() => ctx[10].call(thead_1));
            set_style(tbody, "--tbodyHeight", 0.95 * ctx[6].boxHeight - ctx[6].theadHeight + "px");
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
            thead_1_resize_listener = add_resize_listener(thead_1, ctx[10].bind(thead_1));
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
        p(ctx2, [dirty]) {
            if (dirty & 520) {
                each_value_1 = ctx2[3];
                let i;
                for (i = 0; i < each_value_1.length; i += 1) {
                    const child_ctx = get_each_context_1$7(ctx2, each_value_1, i);
                    if (each_blocks_1[i]) {
                        each_blocks_1[i].p(child_ctx, dirty);
                    }
                    else {
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
            if (dirty & 64 && style_width !== (style_width = `${ctx2[6].trWidth}px`)) {
                set_style(tr, "width", style_width, false);
            }
            if (dirty & 63) {
                each_value = Object.entries(ctx2[1][ctx2[0]]);
                let i;
                for (i = 0; i < each_value.length; i += 1) {
                    const child_ctx = get_each_context$f(ctx2, each_value, i);
                    if (each_blocks[i]) {
                        each_blocks[i].p(child_ctx, dirty);
                        transition_in(each_blocks[i], 1);
                    }
                    else {
                        each_blocks[i] = create_each_block$f(child_ctx);
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
            if (!current || dirty & 64) {
                set_style(tbody, "--tbodyHeight", 0.95 * ctx2[6].boxHeight - ctx2[6].theadHeight + "px");
            }
            if (!current || dirty & 16)
                set_data(t4, ctx2[4]);
        },
        i(local) {
            if (current)
                return;
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
            if (detaching)
                detach(div2);
            destroy_each(each_blocks_1, detaching);
            thead_1_resize_listener();
            destroy_each(each_blocks, detaching);
        }
    };
}

__name(create_fragment$o, "create_fragment$o");

function instance$n($$self, $$props, $$invalidate) {
    let $data;
    let $element;
    let { tabData } = $$props;
    const element2 = getContext("chaAdvElementParameters");
    component_subscribe($$self, element2, (value) => $$invalidate(6, $element = value));
    const data = getContext("chaAdvActorData");
    component_subscribe($$self, data, (value) => $$invalidate(1, $data = value));
    const settings = game.settings.get("ard20", "profLevel");
    let typeStr;
    let thead;
    let description;
    let max;
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
    const rankName = settings.map((setting2) => {
        return setting2.label;
    });

    function thead_1_elementresize_handler() {
        $element.theadHeight = this.offsetHeight;
        element2.set($element);
    }

    __name(thead_1_elementresize_handler, "thead_1_elementresize_handler");

    function tdvariants_description_binding(value) {
        description = value;
        $$invalidate(4, description);
    }

    __name(tdvariants_description_binding, "tdvariants_description_binding");
    $$self.$$set = ($$props2) => {
        if ("tabData" in $$props2)
            $$invalidate(0, tabData = $$props2.tabData);
    };
    $$self.$$.update = () => {
        if ($$self.$$.dirty & 2) {
            {
                for (let [key, attr2] of Object.entries($data.attributes)) {
                    attr2.mod = attr2.value - 10;
                }
            }
        }
        if ($$self.$$.dirty & 2) {
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
        element2,
        data,
        thWidth,
        thead_1_elementresize_handler,
        tdvariants_description_binding
    ];
}

__name(instance$n, "instance$n");

class Attributes extends SvelteComponent {
    constructor(options) {
        super();
        init(this, options, instance$n, create_fragment$o, safe_not_equal, { tabData: 0 });
    }
}

__name(Attributes, "Attributes");
const Tabs_svelte_svelte_type_style_lang$1 = "";

function get_each_context$e(ctx, list, i) {
    const child_ctx = ctx.slice();
    child_ctx[9] = list[i];
    return child_ctx;
}

__name(get_each_context$e, "get_each_context$e");
function get_each_context_1$6(ctx, list, i) {
    const child_ctx = ctx.slice();
    child_ctx[9] = list[i];
    return child_ctx;
}
__name(get_each_context_1$6, "get_each_context_1$6");
function create_each_block_1$6(ctx) {
    let li;
    let span;
    let t0_value = ctx[9].label + "";
    let t0;
    let t1;
    let li_class_value;
    let mounted;
    let dispose;

    function click_handler2() {
        return ctx[7](ctx[9]);
    }

    __name(click_handler2, "click_handler");
    return {
        c() {
            li = element("li");
            span = element("span");
            t0 = text(t0_value);
            t1 = space();
            attr(span, "class", "svelte-qwcpmp");
            attr(li, "class", li_class_value = null_to_empty(ctx[0] === ctx[9].id ? "active" : "") + " svelte-qwcpmp");
        },
        m(target, anchor) {
            insert(target, li, anchor);
            append(li, span);
            append(span, t0);
            append(li, t1);
            if (!mounted) {
                dispose = listen(span, "click", click_handler2);
                mounted = true;
            }
        },
        p(new_ctx, dirty) {
            ctx = new_ctx;
            if (dirty & 2 && t0_value !== (t0_value = ctx[9].label + ""))
                set_data(t0, t0_value);
            if (dirty & 3 && li_class_value !== (li_class_value = null_to_empty(ctx[0] === ctx[9].id ? "active" : "") + " svelte-qwcpmp")) {
                attr(li, "class", li_class_value);
            }
        },
        d(detaching) {
            if (detaching)
                detach(li);
            mounted = false;
            dispose();
        }
    };
}
__name(create_each_block_1$6, "create_each_block_1$6");

function create_if_block$a(ctx) {
    let switch_instance;
    let switch_instance_anchor;
    let current;
    var switch_value = ctx[9].component;

    function switch_props(ctx2) {
        return { props: { tabData: ctx2[9].id } };
    }

    __name(switch_props, "switch_props");
    if (switch_value) {
        switch_instance = new switch_value(switch_props(ctx));
    }
    return {
        c() {
            if (switch_instance)
                create_component(switch_instance.$$.fragment);
            switch_instance_anchor = empty();
        },
        m(target, anchor) {
            if (switch_instance) {
                mount_component(switch_instance, target, anchor);
            }
            insert(target, switch_instance_anchor, anchor);
            current = true;
        },
        p(ctx2, dirty) {
            const switch_instance_changes = {};
            if (dirty & 2)
                switch_instance_changes.tabData = ctx2[9].id;
            if (switch_value !== (switch_value = ctx2[9].component)) {
                if (switch_instance) {
                    group_outros();
                    const old_component = switch_instance;
                    transition_out(old_component.$$.fragment, 1, 0, () => {
                        destroy_component(old_component, 1);
                    });
                    check_outros();
                }
                if (switch_value) {
                    switch_instance = new switch_value(switch_props(ctx2));
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
      if (current)
          return;
        if (switch_instance)
            transition_in(switch_instance.$$.fragment, local);
        current = true;
    },
        o(local) {
            if (switch_instance)
                transition_out(switch_instance.$$.fragment, local);
            current = false;
        },
        d(detaching) {
            if (detaching)
                detach(switch_instance_anchor);
            if (switch_instance)
                destroy_component(switch_instance, detaching);
        }
    };
}

__name(create_if_block$a, "create_if_block$a");

function create_each_block$e(ctx) {
    let if_block_anchor;
    let current;
    let if_block = ctx[9].id === ctx[0] && create_if_block$a(ctx);
    return {
        c() {
            if (if_block)
                if_block.c();
            if_block_anchor = empty();
        },
        m(target, anchor) {
            if (if_block)
                if_block.m(target, anchor);
            insert(target, if_block_anchor, anchor);
            current = true;
        },
        p(ctx2, dirty) {
            if (ctx2[9].id === ctx2[0]) {
                if (if_block) {
                    if_block.p(ctx2, dirty);
                    if (dirty & 3) {
                        transition_in(if_block, 1);
                    }
                }
                else {
                    if_block = create_if_block$a(ctx2);
                    if_block.c();
                    transition_in(if_block, 1);
                    if_block.m(if_block_anchor.parentNode, if_block_anchor);
                }
            }
            else if (if_block) {
                group_outros();
                transition_out(if_block, 1, 1, () => {
                    if_block = null;
                });
                check_outros();
            }
        },
        i(local) {
            if (current)
                return;
            transition_in(if_block);
            current = true;
        },
        o(local) {
            transition_out(if_block);
            current = false;
        },
        d(detaching) {
            if (if_block)
                if_block.d(detaching);
            if (detaching)
                detach(if_block_anchor);
        }
    };
}

__name(create_each_block$e, "create_each_block$e");

function create_fragment$n(ctx) {
    let ul;
    let t;
    let div;
    let div_resize_listener;
    let current;
    let each_value_1 = ctx[1];
    let each_blocks_1 = [];
    for (let i = 0; i < each_value_1.length; i += 1) {
        each_blocks_1[i] = create_each_block_1$6(get_each_context_1$6(ctx, each_value_1, i));
    }
    let each_value = ctx[1];
    let each_blocks = [];
    for (let i = 0; i < each_value.length; i += 1) {
        each_blocks[i] = create_each_block$e(get_each_context$e(ctx, each_value, i));
    }
    const out = /* @__PURE__ */ __name((i) => transition_out(each_blocks[i], 1, 1, () => {
        each_blocks[i] = null;
    }), "out");
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
            set_style(div, "--minBoxSize", ctx[3] + "px");
            add_render_callback(() => ctx[8].call(div));
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
            div_resize_listener = add_resize_listener(div, ctx[8].bind(div));
            current = true;
        },
        p(ctx2, [dirty]) {
            if (dirty & 3) {
                each_value_1 = ctx2[1];
                let i;
                for (i = 0; i < each_value_1.length; i += 1) {
                    const child_ctx = get_each_context_1$6(ctx2, each_value_1, i);
                    if (each_blocks_1[i]) {
                        each_blocks_1[i].p(child_ctx, dirty);
                    }
                    else {
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
            if (dirty & 3) {
                each_value = ctx2[1];
                let i;
                for (i = 0; i < each_value.length; i += 1) {
                    const child_ctx = get_each_context$e(ctx2, each_value, i);
                    if (each_blocks[i]) {
                        each_blocks[i].p(child_ctx, dirty);
                        transition_in(each_blocks[i], 1);
                    }
                    else {
                        each_blocks[i] = create_each_block$e(child_ctx);
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
            if (!current || dirty & 8) {
                set_style(div, "--minBoxSize", ctx2[3] + "px");
            }
        },
        i(local) {
            if (current)
                return;
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
            if (detaching)
                detach(ul);
            destroy_each(each_blocks_1, detaching);
            if (detaching)
                detach(t);
            if (detaching)
                detach(div);
            destroy_each(each_blocks, detaching);
            div_resize_listener();
        }
    };
}

__name(create_fragment$n, "create_fragment$n");

function instance$m($$self, $$props, $$invalidate) {
    let $element;
    let $data;
    let { tabs = [] } = $$props;
    let { activeTab: activeTab2 } = $$props;
    const data = getContext("chaAdvActorData");
    component_subscribe($$self, data, (value) => $$invalidate(6, $data = value));
    const element2 = getContext("chaAdvElementParameters");
    component_subscribe($$self, element2, (value) => $$invalidate(2, $element = value));
    let minBoxSize;
    const click_handler2 = /* @__PURE__ */ __name((tab) => {
        $$invalidate(0, activeTab2 = tab.id);
    }, "click_handler");

    function div_elementresize_handler() {
        $element.boxHeight = this.clientHeight;
        element2.set($element);
    }

    __name(div_elementresize_handler, "div_elementresize_handler");
    $$self.$$set = ($$props2) => {
        if ("tabs" in $$props2)
            $$invalidate(1, tabs = $$props2.tabs);
        if ("activeTab" in $$props2)
            $$invalidate(0, activeTab2 = $$props2.activeTab);
    };
    $$self.$$.update = () => {
        if ($$self.$$.dirty & 69) {
            {
                $$invalidate(3, minBoxSize = (Object.entries($data[activeTab2]).length * $element.trHeight + $element.theadHeight) * 1.1);
            }
        }
    };
    return [
        activeTab2,
        tabs,
        $element,
        minBoxSize,
        data,
        element2,
        $data,
        click_handler2,
        div_elementresize_handler
    ];
}

__name(instance$m, "instance$m");

class Tabs$1 extends SvelteComponent {
    constructor(options) {
        super();
        init(this, options, instance$m, create_fragment$n, safe_not_equal, { tabs: 1, activeTab: 0 });
    }
}

__name(Tabs$1, "Tabs$1");

function create_fragment$m(ctx) {
    let div0;
    let t0;
    let t1_value = ctx[0].advancement.xp.get + "";
    let t1;
    let t2;
    let div1;
    let t3;
    let t4_value = ctx[0].advancement.xp.used + "";
    let t4;
    let t5;
    let tabs_1;
    let t6;
    let button;
    let current;
    let mounted;
    let dispose;
    tabs_1 = new Tabs$1({
        props: { tabs: ctx[3], activeTab: activeTab$1 }
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
                dispose = listen(button, "click", ctx[4]);
                mounted = true;
            }
        },
        p(ctx2, [dirty]) {
            if ((!current || dirty & 1) && t1_value !== (t1_value = ctx2[0].advancement.xp.get + ""))
                set_data(t1, t1_value);
            if ((!current || dirty & 1) && t4_value !== (t4_value = ctx2[0].advancement.xp.used + ""))
                set_data(t4, t4_value);
        },
        i(local) {
            if (current)
                return;
            transition_in(tabs_1.$$.fragment, local);
            current = true;
        },
        o(local) {
            transition_out(tabs_1.$$.fragment, local);
            current = false;
        },
        d(detaching) {
            if (detaching)
                detach(div0);
            if (detaching)
                detach(t2);
            if (detaching)
                detach(div1);
            if (detaching)
                detach(t5);
            destroy_component(tabs_1, detaching);
            if (detaching)
                detach(t6);
            if (detaching)
                detach(button);
            mounted = false;
            dispose();
        }
    };
}

__name(create_fragment$m, "create_fragment$m");
const activeTab$1 = "attributes";

function instance$l($$self, $$props, $$invalidate) {
    let $actorData;
    let $changes;
    let { document: document2 } = $$props;
    const actor = document2.actor;
    const { application } = getContext("external");
    const changes = writable([]);
    component_subscribe($$self, changes, (value) => $$invalidate(6, $changes = value));
    setContext("chaAdvXpChanges", changes);
    setContext("chaAdvXpFormulas", game.settings.get("ard20", "advancement-rate"));
    setContext("chaAdvCONFIG", CONFIG);
    setContext("chaAdvActorOriginalData", actor.system);
    setContext("chaAdvAditionalData", document2.aditionalData);
    const actorData = writable({
        attributes: duplicate(actor.system.attributes),
        skills: duplicate(actor.system.skills),
        advancement: duplicate(actor.system.advancement),
        proficiencies: duplicate(actor.system.proficiencies),
        health: duplicate(actor.system.health),
        isReady: duplicate(actor.system.isReady),
        features: duplicate(document2.aditionalData.feats.awail)
    });
    component_subscribe($$self, actorData, (value) => $$invalidate(0, $actorData = value));
    const elementParameters = writable({
        boxHeight: 0,
        trHeight: 0,
        trWidth: 0,
        theadHeight: 0
    });
    setContext("chaAdvElementParameters", elementParameters);
    setContext("chaAdvActorData", actorData);
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

    async function submitData() {
        const updateObj = {};
        updateObj["system.attributes"] = $actorData.attributes;
        updateObj["system.skills"] = $actorData.skills;
        updateObj["system.advancement.xp"] = $actorData.advancement.xp;
        updateObj["system.isReady"] = true;
        console.log($actorData.features);
        let feats = { new: [], exist: [] };
        $actorData.features.forEach((element2) => {
            const initLevel = element2.system.level.initial;
            const currentLevel = element2.system.level.current;
            if (initLevel > currentLevel) {
                if (currentLevel > 0) {
                    feats.exist = [...feats.exist, element2];
                }
                else {
                    feats.new = [...feats.new, element2];
                }
            }
        });
        console.log(feats, "feats on update");
        await actor.update(updateObj);
        if (feats.exist.length !== 0)
            await actor.updateEmbeddedDocuments("Item", feats.exist);
        if (feats.new.length !== 0)
            await actor.createEmbeddedDocuments("Item", feats.new);
        application.close();
    }

    __name(submitData, "submitData");
    $$self.$$set = ($$props2) => {
        if ("document" in $$props2)
            $$invalidate(5, document2 = $$props2.document);
    };
    $$self.$$.update = () => {
        if ($$self.$$.dirty & 65) {
            console.log($actorData, $changes);
        }
    };
    return [$actorData, changes, actorData, tabs, submitData, document2, $changes];
}

__name(instance$l, "instance$l");
class Cha_adv_shell extends SvelteComponent {
  constructor(options) {
      super();
      init(this, options, instance$l, create_fragment$m, safe_not_equal, { document: 5 });
  }
  get document() {
    return this.$$.ctx[5];
  }
  set document(document2) {
    this.$$set({ document: document2 });
    flush();
  }
}
__name(Cha_adv_shell, "Cha_adv_shell");
class CharacterAdvancement extends TJSDialog {
  constructor(document2) {
    super(
      {
        title: "Character advancement",
        id: "cha-adv",
        modal: true,
        draggable: false,
        content: {
          class: Cha_adv_shell,
          props: {
            document: document2
          }
        }
      },
      {
        width: 800,
        height: 600
      }
    );
  }
}
__name(CharacterAdvancement, "CharacterAdvancement");
class ARd20ActorSheet extends ActorSheet {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["ard20", "sheet", "actor"],
      template: "systems/ard20/templates/actor/actor-sheet.html",
      width: 600,
      height: 600,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "main" }]
    });
  }
  get template() {
    return `systems/ard20/templates/actor/actor-${this.actor.data.type}-sheet.html`;
  }
  getData() {
    const context = super.getData();
    const actorData = this.actor;
    context.data = actorData.system;
    context.flags = actorData.flags;
    context.config = CONFIG.ARd20;
    context.isGM = game.user.isGM;
    if (actorData.type === "character") {
      this._prepareItems(context);
      this._prepareCharacterData(context);
    }
    if (actorData.type === "npc") {
      this._prepareItems(context);
    }
    context.rollData = context.actor.getRollData();
    context.effects = prepareActiveEffectCategories(this.actor.effects);
    return context;
  }
  _prepareCharacterData(context) {
    for (let [k, v] of Object.entries(context.data.attributes)) {
      v.label = game.i18n.localize(CONFIG.ARd20.Attributes[k]) ?? k;
    }
  }
  _prepareItems(context) {
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
    };
    for (let i of context.items) {
      i.img = i.img || DEFAULT_TOKEN;
      if (i.type === "item") {
        gear.push(i);
      } else if (i.type === "feature") {
        features.push(i);
      } else if (i.type === "spell") {
        if (i.data.spellLevel != void 0) {
          spells[i.data.spellLevel].push(i);
        }
      } else if (i.type === "armor" || i.type === "weapon") {
        const isActive = getProperty(i.data, "equipped");
        i.toggleClass = isActive ? "active" : "";
        i.toggleTitle = game.i18n.localize(isActive ? "ARd20.Equipped" : "ARd20.Unequipped");
        i.data.equipped = !isActive;
        if (i.type === "armor") {
          armor.push(i);
        } else {
          weapons.push(i);
        }
      }
    }
    context.gear = gear;
    context.features = features;
    context.spells = spells;
    context.weapons = weapons;
    context.armor = armor;
  }
  render(force = false, options = {}) {
    console.log(this._element);
    return super.render(force, options);
  }
  activateListeners(html) {
    super.activateListeners(html);
    $(".select2", html).select2();
    html.find(".item-toggle").click(this._onToggleItem.bind(this));
    html.find(".item-edit").click((ev) => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.sheet.render(true);
    });
    if (!this.isEditable) {
      return;
    }
    html.find(".item-create").click(this._onItemCreate.bind(this));
    html.find(".item-delete").click((ev) => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.delete();
      li.slideUp(200, () => this.render(false));
    });
    html.find(".effect-control").click((ev) => onManageActiveEffect(ev, this.actor));
    html.find(".attribute-name").click(this._onRollAttributeTest.bind(this));
    html.find(".skill-name").click(this._onRollSkillCheck.bind(this));
    html.find(".config-button").click(this._OnAdvanceMenu.bind(this));
    html.find(".item-roll").click(this._onItemRoll.bind(this));
    if (this.actor.isOwner) {
      let handler = /* @__PURE__ */ __name((ev) => this._onDragStart(ev), "handler");
      html.find("li.item").each((i, li) => {
        if (li.classList.contains("inventory-header")) {
          return;
        }
        li.setAttribute("draggable", "true");
        li.addEventListener("dragstart", handler, false);
      });
    }
  }
  async _OnAdvanceMenu(event) {
    event.preventDefault();
    const button = event.currentTarget;
    let app;
    console.log(this.object);
    const actor = this.object;
    switch (button.dataset?.action) {
      case "adv":
        async function createAditionalData() {
          async function getPacks() {
            let pack_list = [];
            let pack_name = [];
            for (const val of game.settings.get("ard20", "feat").packs) {
              if (game.packs.filter((pack) => pack.metadata.label === val.name).length !== 0) {
                let feat_list = [];
                feat_list.push(
                  Array.from(
                    game.packs.filter((pack) => pack.metadata.label === val.name && pack.documentName === "Item")[0].index
                  )
                );
                feat_list = feat_list.flat();
                for (const feat of feat_list) {
                  const new_key = game.packs.filter((pack) => pack.metadata.label === val.name)[0].metadata.package + "." + val.name;
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
          __name(getPacks, "getPacks");
          function getFolders() {
            let folder_list = [];
            let folder_name = [];
            for (let val of game.settings.get("ard20", "feat").folders) {
              if (game.folders.filter((folder) => folder.data.name === val.name).length !== 0) {
                let feat_list = [];
                feat_list.push(
                  game.folders.filter((folder) => folder.data.name === val.name && folder.data.type === "Item")[0].contents
                );
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
          __name(getFolders, "getFolders");
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
            pack_list.forEach((item) => {
              if (item.type === "race") {
                let raceItem = { ...item, chosen: false };
                race_pack_list.push(raceItem);
              }
            });
            folder_list.forEach((item) => {
              if (item.type === "race") {
                let raceItem = { ...item, chosen: false };
                race_folder_list.push(raceItem);
              }
            });
            return race_pack_list.concat(race_folder_list.filter((item) => !pack_name.includes(item.name)));
          }
          __name(getRacesList, "getRacesList");
          async function getFeaturesList() {
            const pack = await getPacks();
            const pack_list = pack.pack_list;
            const pack_name = pack.pack_name;
            const folder = getFolders();
            const folder_list = folder.folder_list;
            let feat_pack_list = [];
            pack_list.forEach((item) => {
              if (item.type === "feature") {
                let FeatureItem = { ...item };
                feat_pack_list.push(FeatureItem);
              }
            });
            let feat_folder_list = [];
            folder_list.forEach((item) => {
              if (item.type === "feature") {
                let FeatureItem = { ...item };
                feat_folder_list.push(FeatureItem);
              }
            });
            let temp_feat_list = feat_pack_list.concat(
              feat_folder_list.filter((item) => !pack_name.includes(item.name))
            );
            let learnedFeatures = [];
            actor.itemTypes.feature.forEach((item) => {
              if (item.data.type === "feature") {
                let FeatureItem = { ...item.data };
                learnedFeatures.push(FeatureItem);
              }
            });
            return { temp_feat_list, learnedFeatures };
          }
          __name(getFeaturesList, "getFeaturesList");
          for (let i of featList.learnedFeatures) {
            name_array.push(i.name);
          }
          console.log(featList.temp_feat_list, "featList.temp_feat_list");
          featList.temp_feat_list.forEach((v, k) => {
            console.log(k, v);
            if (name_array.includes(v.name)) {
              console.log("this item is already learned", featList.temp_feat_list[k]);
              featList.temp_feat_list[k] = foundry.utils.deepClone(
                featList.learnedFeatures.filter((item) => item.name === v.name)[0]
              );
            }
          });
          featList.temp_feat_list = featList.temp_feat_list.filter((item) => {
            if (item.type === "feature") {
              return !name_array.includes(item.name) || item.data.level.current !== item.data.level.max;
            }
          });
          const obj = {
            races: { list: raceList, chosen: "" },
            count: {
              skills: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 },
              feats: { mar: 0, mag: 0, div: 0, pri: 0, psy: 0 }
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
        __name(createAditionalData, "createAditionalData");
        const document2 = {
          actor: this.actor,
          aditionalData: await createAditionalData()
        };
        app = new CharacterAdvancement(document2);
        break;
    }
    app?.render(true);
  }
  _onToggleItem(event) {
    event.preventDefault();
    const itemid = event.currentTarget.closest(".item").dataset.itemId;
    const item = this.actor.items.get(itemid);
    const attr2 = "data.equipped";
    return item.update({ [attr2]: !getProperty(item.data, attr2) });
  }
  _onRollAttributeTest(event) {
    event.preventDefault();
    let attribute = event.currentTarget.parentElement.dataset.attribute;
    return this.actor.rollAttributeTest(attribute, { event });
  }
  _onRollSkillCheck(event) {
    event.preventDefault();
    let skill = event.currentTarget.parentElement.dataset.skill;
    return this.actor.rollSkill(skill, { event });
  }
  _onItemRoll(event) {
    event.preventDefault();
    console.log("\u0411\u0420\u041E\u0421\u041E\u041A");
    const id = event.currentTarget.closest(".item").dataset.itemId;
    const item = this.actor.items.get(id);
    const hasAttack = item.system.hasAttack;
    const hasDamage = item.system.hasDamage;
    if (item) {
      return item.roll({ hasAttack, hasDamage });
    }
  }
  async _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    const type = header.dataset.type;
    const data = duplicate(header.dataset);
    const name = `New ${type.capitalize()}`;
    const itemData = {
      name,
      type,
      data
    };
    delete itemData.data["type"];
    return await Item.create(itemData, { parent: this.actor });
  }
  _onRoll(event) {
    event.preventDefault();
    const element2 = event.currentTarget;
    const dataset = element2.dataset;
    if (dataset.rollType) {
      if (dataset.rollType == "item") {
        const itemid = element2.closest(".item").dataset.itemId;
        const item = this.actor.items.get(itemid);
        if (item) {
          return item.roll();
        }
      }
    }
  }
  async _onDrop(event) {
    if (!game.user.isGM) {
      ui.notifications.error("you don't have permissions to add documents to this actor manually");
      return;
    }
    let data;
    try {
      data = JSON.parse(event.dataTransfer.getData("text/plain"));
    } catch (err) {
      return false;
    }
    const actor = this.actor;
    const allowed = Hooks.call("dropActorSheetData", actor, this, data);
    if (allowed === false) {
      return;
    }
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
__name(ARd20ActorSheet, "ARd20ActorSheet");
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
      this.options.data = !this.form ? await this.InitializeData() : this.options.data;
      const templateData = this.options.data;
      const req = templateData.req;
      const reqValues = req.values;
      const reqLogic = req.logic;
      const data = templateData.data;
      let formApp = templateData.formApp;
      console.log("data created");
      let name_array = [];
      for (let i of data) {
          name_array.push(i.name);
      }
      reqValues.forEach((value, index) => {
          reqValues[index].type = formApp?.values?.[index]?.type ?? (reqValues[index].type || "attribute");
          let subtype_list = data.filter((item) => item.type === reqValues[index].type);
          reqValues[index].name = subtype_list.filter((item) => {
              item.name === formApp.values?.[index]?.name;
          }).length > 0 ? formApp.values?.[index].name || reqValues[index].name : reqValues[index].name || subtype_list[0].name;
          reqValues[index].subtype_list = subtype_list.map((item) => item.name);
          reqValues[index].input = formApp.values[index]?.input ?? (reqValues[index].input || []);
          reqValues[index].value = data.filter((item) => item.name === reqValues[index].name)[0].value;
          for (let i = 0; i < this.object.data.data.level.max; i++) {
              let inputElement = reqValues[index].input[i];
              let previousElement = reqValues[index].input[i - 1] ?? 0;
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
          reqLogic[index] = formApp.logic?.[index] ?? reqLogic[index];
      });
      templateData.formApp = req;
      console.log(templateData);
      return templateData;
  }
  async InitializeData() {
      if (this.form)
          return;
      console.log("First launch");
      const featList = await this.getFeats();
      const pack_list = featList.pack_list;
      const folder_list = featList.folder_list;
      featList.folder_name;
      const data = [];
      for (let [k, v] of Object.entries(CONFIG.ARd20.Attributes)) {
          data.push({
              name: game.i18n.localize(CONFIG.ARd20.Attributes[k]) ?? k,
              value: k,
              type: "attribute"
          });
      }
      for (let [k, v] of Object.entries(CONFIG.ARd20.Skills)) {
          data.push({
              name: game.i18n.localize(CONFIG.ARd20.Skills[k]) ?? k,
              value: k,
              type: "skill"
          });
      }
      const arr = Object.values(CONFIG.ARd20.Rank).filter((value, index) => {
          if (index !== 0)
              return CONFIG.ARd20.Rank[index];
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
              awail: pack_list.concat(folder_list.filter((item) => pack_list.indexOf(item) < 0)),
              current: this.object.data.data.req.values.filter((item) => item.type === "feature")
          },
          data,
          rank
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
          }
          else if (name_array.includes(item.name)) {
              console.log(item.name, "this feat is already included", index);
              item.input = featCurrent[featCurrent.indexOf(featCurrent.filter((feat) => feat.name === item.name)[0])].input;
              featAwail.splice(index, 1);
          }
          if (featAwail.filter((feat) => feat.name === item.name).length !== 0) {
              data.push({ name: item.name, type: "feature", value: item.value });
          }
      });
      return templateData;
  }
  async getFeats() {
    let pack_list = [];
    let folder_list = [];
    let folder_name = [];
    const packs = game.settings.get("ard20", "feat").packs;
    const folders = game.settings.get("ard20", "feat").folders;
    for (let key of packs) {
      if (game.packs.filter((pack) => pack.metadata.label === key).length !== 0) {
        let feat_list = [];
        feat_list.push(Array.from(game.packs.filter((pack) => pack.metadata.label === key && pack.metadata.entity === "Item")[0].index));
        feat_list = feat_list.flat();
        for (let feat of feat_list) {
          if (feat instanceof ARd20Item) {
            const new_key = game.packs.filter((pack) => pack.metadata.label === key)[0].metadata.package + "." + key;
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
      if (game.folders.filter((folder) => folder.data.name === key).length !== 0) {
        let feat_list = [];
        feat_list.push(game.folders.filter((folder) => folder.data.name === key && folder.data.type === "Item")[0].contents);
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
    return { pack_list, folder_list, folder_name };
  }
  activateListeners(html) {
    super.activateListeners(html);
    html.find(".item-create").on("click", this._onAdd.bind(this));
    html.find(".item-delete").on("click", this._Delete.bind(this));
  }
  async _onAdd(event) {
    event.preventDefault();
    const req = this.options.data.req;
    let sub_list = [];
    for (let [k, i] of Object.entries(CONFIG.ARd20.Attributes)) {
      sub_list.push(k);
    }
    const maxLevel = this.object.data.data.level.max;
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
  async _Delete(event) {
    event.preventDefault();
    const req = this.options.data.req;
    req.values.splice(event.currentTarget.dataset.key, 1);
    this.render();
  }
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
__name(FeatRequirements, "FeatRequirements");
class ARd20ItemSheet extends ItemSheet {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["ard20", "sheet", "item"],
      width: 520,
      height: 480,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }]
    });
  }
  get template() {
    const path = "systems/ard20/templates/item";
    return `${path}/item-${this.item.data.type}-sheet.html`;
  }
  getData() {
    const context = super.getData();
    const itemData = context.item;
    context.config = CONFIG.ARd20;
    context.rollData = {};
    let actor = this.object?.parent ?? null;
    if (actor) {
      context.rollData = actor.getRollData();
    }
    context.data = itemData.system;
    context.flags = itemData.flags;
    context.isGM = game.user.isGM;
    context.type = context.item.type;
    context.effects = prepareActiveEffectCategories(this.item.effects);
    return context;
  }
  _getSubmitData(updateData = {}) {
    if (this.form === null)
      return;
    const fd = new FormDataExtended(this.form, { editors: this.editors });
    let data = fd.toObject();
    if (updateData)
      data = mergeObject(data, updateData);
    else
      data = expandObject(data);
    const damage = data.data?.damage;
    if (damage) {
      if (damage.parts) {
        damage.damType = Object.values(damage?.damType || {});
        damage.parts = Object.values(damage?.parts || {}).map(function(d, ind) {
          let a = [];
          if (damage.damType[ind].length !== 0) {
            damage.damType[ind].forEach((sub, i) => a.push(JSON.parse(damage.damType[ind][i])));
          }
          return [d[0] || "", a];
        });
      } else {
        for (let [key, type] of Object.entries(damage)) {
          for (let [k, prof] of Object.entries(type)) {
            prof.damType = Object.values(prof?.damType || {});
            prof.parts = Object.values(prof?.parts || {}).map(function(d, ind) {
              let a = [];
              if (prof.damType[ind].length !== 0 && prof.damType[ind][0] !== "") {
                prof.damType[ind].forEach((sub, i) => a.push(JSON.parse(prof.damType[ind][i])));
              }
              return [d[0] || "", a];
            });
          }
        }
      }
    }
    return flattenObject(data);
  }
  activateListeners(html) {
      super.activateListeners(html);
      const edit = !this.isEditable;
      const context = this.getData();

      function formatSelection(state) {
          const parent = $(state.element).parent().prop("tagName");
          if (!state.id || parent !== "OPTGROUP")
              return state.text;
          const optgroup = $(state.element).parent().attr("label");
          const subtype = state.element.value.match(/(\w+)/g)[1];
          const url = `systems/ard20/css/${subtype}.svg`;
          return `<div><img style="width:15px; background-color:black; margin-left:2px" src=${url} />${optgroup} ${state.text}</div>`;
      }

      __name(formatSelection, "formatSelection");

      function formatResult(state) {
          const parent = $(state.element).parent().prop("tagName");
          if (!state.id || parent !== "OPTGROUP")
              return state.text;
          const subtype = state.element.value.match(/(\w+)/g)[1];
          const url = `systems/ard20/css/${subtype}.svg`;
          return `<div><img style="width:15px; background-color:black; margin-left:2px" src=${url} /> ${state.text}</div>`;
      }

      __name(formatResult, "formatResult");
      $(`select.select2`, html).select2({
          width: "auto",
          dropdownAutoWidth: true,
          disabled: edit,
          templateSelection: formatSelection,
          templateResult: formatResult,
          escapeMarkup: function (m) {
              return m;
          }
      }).val(function (index, value) {
          const name = $("select.select2", html)[index].name;
          const val = getProperty(context, name);
          return val;
      }).trigger("change");
      $("select").on("select2:unselect", function (evt) {
          if (!evt.params.originalEvent) {
              return;
          }
          evt.params.originalEvent.stopPropagation();
      });
      if (!this.isEditable)
          return;
      html.find(".effect-control").click((ev) => onManageActiveEffect(ev, this.item));
      html.find(".config-button").click(this._FeatReq.bind(this));
      html.find(".damage-control").click(this._onDamageControl.bind(this));
  }
  _FeatReq(event) {
    event.preventDefault();
    const button = event.currentTarget;
    let app;
    switch (button.dataset.action) {
      case "feat-req":
        app = new FeatRequirements(this.object);
        break;
    }
    app?.render(true);
  }
  async _onDamageControl(event) {
    event.preventDefault();
    const a = event.currentTarget;
    if (a.classList.contains("add-damage")) {
      let path = a.dataset.type ? "system.damage" + a.dataset.type : "system.damage";
      const damage = getProperty(this.item.data, path);
      damage.damType = damage.damType || [];
      const partsPath = path + ".parts";
      const damTypePath = path + ".damType";
      const update2 = {};
      update2[partsPath] = damage.parts.concat([["", ["", ""]]]);
      update2[damTypePath] = damage.damType?.concat([[""]]);
      await this.item.update(update2);
    }
    if (a.classList.contains("delete-damage")) {
      const li = a.closest(".damage-part");
      let path = a.dataset.type ? "system.damage" + a.dataset.type : "system.damage";
      const damage = getProperty(this.item.data, path);
      console.log(damage);
      damage.parts.splice(Number(li.dataset.damagePart), 1);
      damage.damType.splice(Number(li.dataset.damagePart), 1);
      const partsPath = path + ".parts";
      const damTypePath = path + ".damType";
      const update2 = {};
      update2[partsPath] = damage.parts;
      update2[damTypePath] = damage.damType;
      await this.item.update(update2);
    }
  }
  async _onSubmit(...args) {
    if (this._tabs[0].active === "data")
      this.position.height = "auto";
    await super._onSubmit(...args);
  }
}
__name(ARd20ItemSheet, "ARd20ItemSheet");

function create_fragment$l(ctx) {
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
            if (detaching)
                detach(t);
        }
    };
}

__name(create_fragment$l, "create_fragment$l");
class EmptySheet extends SvelteComponent {
  constructor(options) {
      super();
      init(this, options, null, create_fragment$l, safe_not_equal, {});
  }
}
__name(EmptySheet, "EmptySheet");
const InputForDocumentSheet_svelte_svelte_type_style_lang = "";

function create_else_block$1(ctx) {
    let input;
    let mounted;
    let dispose;
    return {
        c() {
            input = element("input");
            attr(input, "class", "svelte-jvtels");
        },
        m(target, anchor) {
            insert(target, input, anchor);
            set_input_value(input, ctx[1]);
            if (!mounted) {
                dispose = [
                    listen(input, "input", ctx[7]),
                    listen(input, "change", ctx[3])
                ];
                mounted = true;
            }
        },
        p(ctx2, dirty) {
            if (dirty & 2 && input.value !== ctx2[1]) {
                set_input_value(input, ctx2[1]);
            }
        },
        d(detaching) {
            if (detaching) {
                detach(input);
            }
            mounted = false;
            run_all(dispose);
        }
    };
}

__name(create_else_block$1, "create_else_block$1");

function create_if_block$9(ctx) {
    let label_1;
    let t0;
    let t1;
    let input;
    let mounted;
    let dispose;
    return {
        c() {
            label_1 = element("label");
            t0 = text(ctx[0]);
            t1 = space();
            input = element("input");
            attr(input, "class", "svelte-jvtels");
        },
        m(target, anchor) {
            insert(target, label_1, anchor);
            append(label_1, t0);
            append(label_1, t1);
            append(label_1, input);
            set_input_value(input, ctx[1]);
            if (!mounted) {
                dispose = [
                    listen(input, "input", ctx[6]),
                    listen(input, "change", ctx[3])
                ];
                mounted = true;
            }
        },
        p(ctx2, dirty) {
            if (dirty & 1) {
                set_data(t0, ctx2[0]);
            }
            if (dirty & 2 && input.value !== ctx2[1]) {
                set_input_value(input, ctx2[1]);
            }
        },
        d(detaching) {
            if (detaching) {
                detach(label_1);
            }
            mounted = false;
            run_all(dispose);
        }
    };
}

__name(create_if_block$9, "create_if_block$9");

function create_fragment$k(ctx) {
    let if_block_anchor;

    function select_block_type(ctx2, dirty) {
        if (ctx2[0]) {
            return create_if_block$9;
        }
        return create_else_block$1;
    }

    __name(select_block_type, "select_block_type");
    let current_block_type = select_block_type(ctx);
    let if_block = current_block_type(ctx);
    return {
        c() {
            if_block.c();
            if_block_anchor = empty();
        },
        m(target, anchor) {
            if_block.m(target, anchor);
            insert(target, if_block_anchor, anchor);
        },
        p(ctx2, [dirty]) {
            if (current_block_type === (current_block_type = select_block_type(ctx2)) && if_block) {
                if_block.p(ctx2, dirty);
            }
            else {
                if_block.d(1);
                if_block = current_block_type(ctx2);
                if (if_block) {
                    if_block.c();
                    if_block.m(if_block_anchor.parentNode, if_block_anchor);
                }
            }
        },
        i: noop,
        o: noop,
        d(detaching) {
            if_block.d(detaching);
            if (detaching) {
                detach(if_block_anchor);
            }
        }
    };
}

__name(create_fragment$k, "create_fragment$k");

function instance$k($$self, $$props, $$invalidate) {
    let $value;
    let { valuePath } = $$props;
    let { type = "text" } = $$props;
    let { label } = $$props;
    const document2 = getContext("DocumentSheetObject");
    const { application } = getContext("external");
    let value = derived(document2, ($document) => getProperty($document, valuePath));
    component_subscribe($$self, value, (value2) => $$invalidate(1, $value = value2));

    function update2() {
        application.updateDocument(valuePath, $value);
    }

    __name(update2, "update");

    function input_input_handler() {
        $value = this.value;
        value.set($value);
    }

    __name(input_input_handler, "input_input_handler");

    function input_input_handler_1() {
        $value = this.value;
        value.set($value);
    }

    __name(input_input_handler_1, "input_input_handler_1");
    $$self.$$set = ($$props2) => {
        if ("valuePath" in $$props2) {
            $$invalidate(4, valuePath = $$props2.valuePath);
        }
        if ("type" in $$props2) {
            $$invalidate(5, type = $$props2.type);
        }
        if ("label" in $$props2) {
            $$invalidate(0, label = $$props2.label);
        }
    };
    return [
        label,
        $value,
        value,
        update2,
        valuePath,
        type,
        input_input_handler,
        input_input_handler_1
    ];
}

__name(instance$k, "instance$k");

class InputForDocumentSheet extends SvelteComponent {
    constructor(options) {
        super();
        init(this, options, instance$k, create_fragment$k, safe_not_equal, { valuePath: 4, type: 5, label: 0 });
    }

    get valuePath() {
        return this.$$.ctx[4];
    }

    set valuePath(valuePath) {
        this.$$set({ valuePath });
        flush();
    }

    get type() {
        return this.$$.ctx[5];
    }

    set type(type) {
        this.$$set({ type });
        flush();
    }

    get label() {
        return this.$$.ctx[0];
    }

    set label(label) {
        this.$$set({ label });
        flush();
    }
}

__name(InputForDocumentSheet, "InputForDocumentSheet");

function create_fragment$j(ctx) {
    let t;
    let inputfordocumentsheet;
    let current;
    inputfordocumentsheet = new InputForDocumentSheet({
        props: { valuePath: "name", type: "text" }
    });
    return {
        c() {
            t = text("Name:\r\n");
            create_component(inputfordocumentsheet.$$.fragment);
        },
        m(target, anchor) {
            insert(target, t, anchor);
            mount_component(inputfordocumentsheet, target, anchor);
            current = true;
        },
        p: noop,
        i(local) {
            if (current) {
                return;
            }
            transition_in(inputfordocumentsheet.$$.fragment, local);
            current = true;
        },
        o(local) {
            transition_out(inputfordocumentsheet.$$.fragment, local);
            current = false;
        },
        d(detaching) {
            if (detaching) {
                detach(t);
            }
            destroy_component(inputfordocumentsheet, detaching);
        }
    };
}

__name(create_fragment$j, "create_fragment$j");

function instance$j($$self) {
    getContext("DocumentSheetObject");
    return [];
}

__name(instance$j, "instance$j");

class ItemItemSheet extends SvelteComponent {
    constructor(options) {
        super();
        init(this, options, instance$j, create_fragment$j, safe_not_equal, {});
    }
}

__name(ItemItemSheet, "ItemItemSheet");

function create_fragment$i(ctx) {
    let img_1;
    let img_1_src_value;
    let mounted;
    let dispose;
    return {
        c() {
            img_1 = element("img");
            attr(img_1, "alt", ctx[0]);
            if (!src_url_equal(img_1.src, img_1_src_value = ctx[2])) {
                attr(img_1, "src", img_1_src_value);
            }
        },
        m(target, anchor) {
            insert(target, img_1, anchor);
            ctx[6](img_1);
            if (!mounted) {
                dispose = listen(img_1, "click", ctx[7]);
                mounted = true;
            }
        },
        p(ctx2, [dirty]) {
            if (dirty & 1) {
                attr(img_1, "alt", ctx2[0]);
            }
            if (dirty & 4 && !src_url_equal(img_1.src, img_1_src_value = ctx2[2])) {
                attr(img_1, "src", img_1_src_value);
            }
        },
        i: noop,
        o: noop,
        d(detaching) {
            if (detaching) {
                detach(img_1);
            }
            ctx[6](null);
            mounted = false;
            dispose();
        }
    };
}

__name(create_fragment$i, "create_fragment$i");

function instance$i($$self, $$props, $$invalidate) {
    let $document;
    let { path } = $$props;
    let { alt } = $$props;
    let img;
    const { application } = getContext("external");
    const document2 = getContext("DocumentSheetObject");
    component_subscribe($$self, document2, (value) => $$invalidate(8, $document = value));
    let src = getProperty($document, path);

    function onEditImage(event) {
        const current = src;
        const fp = new FilePicker({
            type: "image",
            current,
            callback: async (newVal) => {
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

    __name(onEditImage, "onEditImage");

    function img_1_binding($$value) {
        binding_callbacks[$$value ? "unshift" : "push"](() => {
            img = $$value;
            $$invalidate(1, img);
        });
    }

    __name(img_1_binding, "img_1_binding");
    const click_handler2 = /* @__PURE__ */ __name((event) => onEditImage(), "click_handler");
    $$self.$$set = ($$props2) => {
        if ("path" in $$props2) {
            $$invalidate(5, path = $$props2.path);
        }
        if ("alt" in $$props2) {
            $$invalidate(0, alt = $$props2.alt);
        }
    };
    $$self.$$.update = () => {
        if ($$self.$$.dirty & 2) {
            if (img) {
                $$invalidate(1, img.style.width = img.parentElement.clientHeight - parseFloat(getComputedStyle(img.parentElement).padding) * 2, img);
            }
        }
    };
    return [alt, img, src, document2, onEditImage, path, img_1_binding, click_handler2];
}

__name(instance$i, "instance$i");

class ImageWithFilePicker extends SvelteComponent {
    constructor(options) {
        super();
        init(this, options, instance$i, create_fragment$i, safe_not_equal, { path: 5, alt: 0 });
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

__name(ImageWithFilePicker, "ImageWithFilePicker");
const ProgressBar_svelte_svelte_type_style_lang = "";
const Tabs_svelte_svelte_type_style_lang = "";

function get_each_context$d(ctx, list, i) {
    const child_ctx = ctx.slice();
    child_ctx[3] = list[i];
    return child_ctx;
}

__name(get_each_context$d, "get_each_context$d");
function get_each_context_1$5(ctx, list, i) {
    const child_ctx = ctx.slice();
    child_ctx[3] = list[i];
    return child_ctx;
}
__name(get_each_context_1$5, "get_each_context_1$5");
function create_each_block_1$5(ctx) {
    let li;
    let span;
    let t0_value = ctx[3].label + "";
    let t0;
    let t1;
    let li_class_value;
    let mounted;
    let dispose;

    function click_handler2() {
        return ctx[2](ctx[3]);
    }

    __name(click_handler2, "click_handler");
    return {
        c() {
            li = element("li");
            span = element("span");
            t0 = text(t0_value);
            t1 = space();
            attr(span, "class", "svelte-1exjsfe");
            attr(li, "class", li_class_value = null_to_empty(ctx[0] === ctx[3].id ? "active" : "") + " svelte-1exjsfe");
        },
        m(target, anchor) {
            insert(target, li, anchor);
            append(li, span);
            append(span, t0);
            append(li, t1);
            if (!mounted) {
                dispose = listen(span, "click", click_handler2);
                mounted = true;
            }
        },
        p(new_ctx, dirty) {
            ctx = new_ctx;
            if (dirty & 2 && t0_value !== (t0_value = ctx[3].label + ""))
                set_data(t0, t0_value);
            if (dirty & 3 && li_class_value !== (li_class_value = null_to_empty(ctx[0] === ctx[3].id ? "active" : "") + " svelte-1exjsfe")) {
                attr(li, "class", li_class_value);
            }
        },
        d(detaching) {
            if (detaching)
                detach(li);
            mounted = false;
            dispose();
        }
    };
}
__name(create_each_block_1$5, "create_each_block_1$5");

function create_if_block$8(ctx) {
    let switch_instance;
    let switch_instance_anchor;
    let current;
    var switch_value = ctx[3].component;

    function switch_props(ctx2) {
        return {};
    }

    __name(switch_props, "switch_props");
    if (switch_value) {
        switch_instance = new switch_value(switch_props());
    }
    return {
        c() {
            if (switch_instance)
                create_component(switch_instance.$$.fragment);
            switch_instance_anchor = empty();
        },
        m(target, anchor) {
            if (switch_instance) {
                mount_component(switch_instance, target, anchor);
            }
            insert(target, switch_instance_anchor, anchor);
            current = true;
        },
        p(ctx2, dirty) {
            if (switch_value !== (switch_value = ctx2[3].component)) {
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
                }
                else {
          switch_instance = null;
        }
      }
    },
    i(local) {
      if (current)
          return;
        if (switch_instance)
            transition_in(switch_instance.$$.fragment, local);
        current = true;
    },
        o(local) {
            if (switch_instance)
                transition_out(switch_instance.$$.fragment, local);
            current = false;
        },
        d(detaching) {
            if (detaching)
                detach(switch_instance_anchor);
            if (switch_instance)
                destroy_component(switch_instance, detaching);
        }
    };
}

__name(create_if_block$8, "create_if_block$8");

function create_each_block$d(ctx) {
    let if_block_anchor;
    let current;
    let if_block = ctx[3].id === ctx[0] && create_if_block$8(ctx);
    return {
        c() {
            if (if_block)
                if_block.c();
            if_block_anchor = empty();
        },
        m(target, anchor) {
            if (if_block)
                if_block.m(target, anchor);
            insert(target, if_block_anchor, anchor);
            current = true;
        },
        p(ctx2, dirty) {
            if (ctx2[3].id === ctx2[0]) {
                if (if_block) {
                    if_block.p(ctx2, dirty);
                    if (dirty & 3) {
                        transition_in(if_block, 1);
                    }
                }
                else {
                    if_block = create_if_block$8(ctx2);
                    if_block.c();
                    transition_in(if_block, 1);
                    if_block.m(if_block_anchor.parentNode, if_block_anchor);
                }
            }
            else if (if_block) {
                group_outros();
                transition_out(if_block, 1, 1, () => {
                    if_block = null;
                });
                check_outros();
            }
        },
        i(local) {
            if (current)
                return;
            transition_in(if_block);
            current = true;
        },
        o(local) {
            transition_out(if_block);
            current = false;
        },
        d(detaching) {
            if (if_block)
                if_block.d(detaching);
            if (detaching)
                detach(if_block_anchor);
        }
    };
}

__name(create_each_block$d, "create_each_block$d");

function create_fragment$h(ctx) {
    let ul;
    let t;
    let div;
    let current;
    let each_value_1 = ctx[1];
    let each_blocks_1 = [];
    for (let i = 0; i < each_value_1.length; i += 1) {
        each_blocks_1[i] = create_each_block_1$5(get_each_context_1$5(ctx, each_value_1, i));
    }
    let each_value = ctx[1];
    let each_blocks = [];
    for (let i = 0; i < each_value.length; i += 1) {
        each_blocks[i] = create_each_block$d(get_each_context$d(ctx, each_value, i));
    }
    const out = /* @__PURE__ */ __name((i) => transition_out(each_blocks[i], 1, 1, () => {
        each_blocks[i] = null;
    }), "out");
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
        p(ctx2, [dirty]) {
            if (dirty & 3) {
                each_value_1 = ctx2[1];
                let i;
                for (i = 0; i < each_value_1.length; i += 1) {
                    const child_ctx = get_each_context_1$5(ctx2, each_value_1, i);
                    if (each_blocks_1[i]) {
                        each_blocks_1[i].p(child_ctx, dirty);
                    }
                    else {
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
            if (dirty & 3) {
                each_value = ctx2[1];
                let i;
                for (i = 0; i < each_value.length; i += 1) {
                    const child_ctx = get_each_context$d(ctx2, each_value, i);
                    if (each_blocks[i]) {
                        each_blocks[i].p(child_ctx, dirty);
                        transition_in(each_blocks[i], 1);
                    }
                    else {
                        each_blocks[i] = create_each_block$d(child_ctx);
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
            if (current)
                return;
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
            if (detaching)
                detach(ul);
            destroy_each(each_blocks_1, detaching);
            if (detaching)
                detach(t);
            if (detaching)
                detach(div);
            destroy_each(each_blocks, detaching);
        }
    };
}

__name(create_fragment$h, "create_fragment$h");

function instance$h($$self, $$props, $$invalidate) {
    let { tabs = [] } = $$props;
    let { activeTab: activeTab2 } = $$props;
    const click_handler2 = /* @__PURE__ */ __name((tab) => {
        $$invalidate(0, activeTab2 = tab.id);
    }, "click_handler");
    $$self.$$set = ($$props2) => {
        if ("tabs" in $$props2)
            $$invalidate(1, tabs = $$props2.tabs);
        if ("activeTab" in $$props2)
            $$invalidate(0, activeTab2 = $$props2.activeTab);
    };
    return [activeTab2, tabs, click_handler2];
}

__name(instance$h, "instance$h");

class Tabs extends SvelteComponent {
    constructor(options) {
        super();
        init(this, options, instance$h, create_fragment$h, safe_not_equal, { tabs: 1, activeTab: 0 });
    }
}

__name(Tabs, "Tabs");
const AttributeTab_svelte_svelte_type_style_lang = "";

function get_each_context$c(ctx, list, i) {
    const child_ctx = ctx.slice();
    child_ctx[3] = list[i];
    return child_ctx;
}

__name(get_each_context$c, "get_each_context$c");

function create_if_block$7(ctx) {
    let t;
    return {
        c() {
            t = text("+");
        },
        m(target, anchor) {
            insert(target, t, anchor);
        },
        d(detaching) {
            if (detaching)
                detach(t);
        }
    };
}

__name(create_if_block$7, "create_if_block$7");

function create_each_block$c(ctx) {
    let div;
    let span0;
    let t0_value = ctx[3][1].rankName + "";
    let t0;
    let t1;
    let span1;
    let t2_value = ctx[3][1].name + "";
    let t2;
    let t3;
    let span2;
    let t4;
    let t5;
    let t6_value = ctx[3][1].value + "";
    let t6;
    let t7;
    let mounted;
    let dispose;
    let if_block = ctx[3][1].value > 0 && create_if_block$7();

    function click_handler2(...args) {
        return ctx[2](ctx[3], ...args);
    }

    __name(click_handler2, "click_handler");
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
            if (if_block)
                if_block.c();
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
            if (if_block)
                if_block.m(span2, null);
            append(span2, t5);
            append(span2, t6);
            append(div, t7);
            if (!mounted) {
                dispose = listen(div, "click", click_handler2);
                mounted = true;
            }
        },
        p(new_ctx, dirty) {
            ctx = new_ctx;
            if (dirty & 1 && t0_value !== (t0_value = ctx[3][1].rankName + ""))
                set_data(t0, t0_value);
            if (dirty & 1 && t2_value !== (t2_value = ctx[3][1].name + ""))
                set_data(t2, t2_value);
            if (ctx[3][1].value > 0) {
                if (if_block)
                    ;
                else {
                    if_block = create_if_block$7();
                    if_block.c();
                    if_block.m(span2, t5);
                }
            }
            else if (if_block) {
                if_block.d(1);
                if_block = null;
            }
            if (dirty & 1 && t6_value !== (t6_value = ctx[3][1].value + ""))
                set_data(t6, t6_value);
        },
        d(detaching) {
            if (detaching)
                detach(div);
            if (if_block)
                if_block.d();
            mounted = false;
            dispose();
        }
    };
}

__name(create_each_block$c, "create_each_block$c");

function create_fragment$g(ctx) {
    let label;
    let t1;
    let div;
    let each_value = Object.entries(ctx[0].system.skills);
    let each_blocks = [];
    for (let i = 0; i < each_value.length; i += 1) {
        each_blocks[i] = create_each_block$c(get_each_context$c(ctx, each_value, i));
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
        p(ctx2, [dirty]) {
            if (dirty & 1) {
                each_value = Object.entries(ctx2[0].system.skills);
                let i;
                for (i = 0; i < each_value.length; i += 1) {
                    const child_ctx = get_each_context$c(ctx2, each_value, i);
                    if (each_blocks[i]) {
                        each_blocks[i].p(child_ctx, dirty);
                    }
                    else {
                        each_blocks[i] = create_each_block$c(child_ctx);
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
            if (detaching)
                detach(label);
            if (detaching)
                detach(t1);
            if (detaching)
                detach(div);
            destroy_each(each_blocks, detaching);
        }
    };
}

__name(create_fragment$g, "create_fragment$g");

function instance$g($$self, $$props, $$invalidate) {
    let $doc;
    const doc = getContext("DocumentSheetObject");
    component_subscribe($$self, doc, (value) => $$invalidate(0, $doc = value));
    const click_handler2 = /* @__PURE__ */ __name((skill, event) => {
        event.preventDefault();
        return $doc.rollSkill(skill[0], { event });
    }, "click_handler");
    return [$doc, doc, click_handler2];
}

__name(instance$g, "instance$g");

class AttributeTab extends SvelteComponent {
    constructor(options) {
        super();
        init(this, options, instance$g, create_fragment$g, safe_not_equal, {});
    }
}

__name(AttributeTab, "AttributeTab");

class InventoryTab extends SvelteComponent {
    constructor(options) {
        super();
        init(this, options, null, null, safe_not_equal, {});
    }
}
__name(InventoryTab, "InventoryTab");
const ConfigureItemButton_svelte_svelte_type_style_lang = "";

function create_fragment$f(ctx) {
    let i;
    let mounted;
    let dispose;
    return {
        c() {
            i = element("i");
            attr(i, "class", null_to_empty(ctx[2]) + " svelte-1mjd618");
            attr(i, "data-tooltip", ctx[3]);
        },
        m(target, anchor) {
            insert(target, i, anchor);
            if (!mounted) {
                dispose = listen(i, "click", ctx[5]);
                mounted = true;
            }
        },
        p: noop,
        i: noop,
        o: noop,
        d(detaching) {
            if (detaching) {
                detach(i);
            }
            mounted = false;
            dispose();
        }
    };
}

__name(create_fragment$f, "create_fragment$f");

function instance$f($$self, $$props, $$invalidate) {
    let { item = null } = $$props;
    let { action } = $$props;
    const buttons = getContext("ConfigButtons");
    const func2 = buttons[action].function;
    const className = buttons[action].class;
    const tooltip = action === "create" && item ? buttons[action].tooltip(item) : buttons[action].tooltip;
    const click_handler2 = /* @__PURE__ */ __name(() => {
        func2(item);
    }, "click_handler");
    $$self.$$set = ($$props2) => {
        if ("item" in $$props2) {
            $$invalidate(0, item = $$props2.item);
        }
        if ("action" in $$props2) {
            $$invalidate(4, action = $$props2.action);
        }
    };
    return [item, func2, className, tooltip, action, click_handler2];
}

__name(instance$f, "instance$f");

class ConfigureItemButton extends SvelteComponent {
    constructor(options) {
        super();
        init(this, options, instance$f, create_fragment$f, safe_not_equal, { item: 0, action: 4 });
    }

    get item() {
        return this.$$.ctx[0];
    }

    set item(item) {
        this.$$set({ item });
        flush();
    }

    get action() {
        return this.$$.ctx[4];
    }

    set action(action) {
        this.$$set({ action });
        flush();
    }
}

__name(ConfigureItemButton, "ConfigureItemButton");
const FeaturesTab_svelte_svelte_type_style_lang = "";

function get_each_context$b(ctx, list, i) {
    const child_ctx = ctx.slice();
    child_ctx[7] = list[i];
    return child_ctx;
}

__name(get_each_context$b, "get_each_context$b");
function get_each_context_1$4(ctx, list, i) {
    const child_ctx = ctx.slice();
    child_ctx[10] = list[i];
    return child_ctx;
}
__name(get_each_context_1$4, "get_each_context_1$4");

function create_if_block_1$1(ctx) {
    let i;
    let mounted;
    let dispose;

    function click_handler_1() {
        return ctx[4](ctx[7]);
    }

    __name(click_handler_1, "click_handler_1");
    return {
        c() {
            i = element("i");
            attr(i, "class", "fa-light fa-dice-d20 svelte-1ug8i0n");
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
            if (detaching) {
                detach(i);
            }
            mounted = false;
            dispose();
        }
    };
}

__name(create_if_block_1$1, "create_if_block_1$1");

function create_if_block$6(ctx) {
    let i;
    let mounted;
    let dispose;

    function click_handler_3() {
        return ctx[6](ctx[10]);
    }

    __name(click_handler_3, "click_handler_3");
    return {
        c() {
            i = element("i");
            attr(i, "class", "fa-solid fa-pen-to-square svelte-1ug8i0n");
            attr(i, "data-tooltip", "edit");
        },
        m(target, anchor) {
            insert(target, i, anchor);
            if (!mounted) {
                dispose = listen(i, "click", click_handler_3);
                mounted = true;
            }
        },
        p(new_ctx, dirty) {
            ctx = new_ctx;
        },
        d(detaching) {
            if (detaching) {
                detach(i);
            }
            mounted = false;
            dispose();
        }
    };
}

__name(create_if_block$6, "create_if_block$6");

function create_each_block_1$4(ctx) {
    let div;
    let span;
    let t0_value = ctx[10].name + "";
    let t0;
    let t1;
    let t2;
    let mounted;
    let dispose;

    function click_handler_2() {
        return ctx[5](ctx[10]);
    }

    __name(click_handler_2, "click_handler_2");
    let if_block = ctx[0] && create_if_block$6(ctx);
    return {
        c() {
            div = element("div");
            span = element("span");
            t0 = text(t0_value);
            t1 = space();
            if (if_block) {
                if_block.c();
            }
            t2 = space();
            attr(span, "class", "svelte-1ug8i0n");
            attr(div, "class", "action svelte-1ug8i0n");
        },
        m(target, anchor) {
            insert(target, div, anchor);
            append(div, span);
            append(span, t0);
            append(div, t1);
            if (if_block) {
                if_block.m(div, null);
            }
            append(div, t2);
            if (!mounted) {
                dispose = listen(span, "click", click_handler_2);
                mounted = true;
            }
        },
        p(new_ctx, dirty) {
            ctx = new_ctx;
            if (dirty & 2 && t0_value !== (t0_value = ctx[10].name + "")) {
                set_data(t0, t0_value);
            }
            if (ctx[0]) {
                if (if_block) {
                    if_block.p(ctx, dirty);
                }
                else {
                    if_block = create_if_block$6(ctx);
                    if_block.c();
                    if_block.m(div, t2);
                }
            }
            else if (if_block) {
                if_block.d(1);
                if_block = null;
            }
        },
        d(detaching) {
            if (detaching) {
                detach(div);
            }
            if (if_block) {
                if_block.d();
            }
            mounted = false;
            dispose();
        }
    };
}

__name(create_each_block_1$4, "create_each_block_1$4");

function create_each_block$b(ctx) {
    let tr;
    let td0;
    let span;
    let t0_value = ctx[7].name + "";
    let t0;
    let t1;
    let t2;
    let td1;
    let div0;
    let t3;
    let td2;
    let t4_value = ctx[7].system.level.current + "";
    let t4;
    let t5;
    let td3;
    let configureitembutton0;
    let t6;
    let td4;
    let configureitembutton1;
    let t7;
    let td5;
    let configureitembutton2;
    let t8;
    let div1;
    let raw_value = ctx[7].system.description + "";
    let t9;
    let current;
    let mounted;
    let dispose;
    let if_block = (ctx[7].system.hasAttack || ctx[7].system.hasDamage) && create_if_block_1$1(ctx);
    let each_value_1 = ctx[7].system.actionList;
    let each_blocks = [];
    for (let i = 0; i < each_value_1.length; i += 1) {
        each_blocks[i] = create_each_block_1$4(get_each_context_1$4(ctx, each_value_1, i));
    }
    configureitembutton0 = new ConfigureItemButton({
        props: { item: ctx[7], action: "edit" }
    });
    configureitembutton1 = new ConfigureItemButton({
        props: {
            item: ctx[7],
            action: "favorite"
        }
    });
    configureitembutton2 = new ConfigureItemButton({
        props: { item: ctx[7], action: "delete" }
    });
    return {
        c() {
            tr = element("tr");
            td0 = element("td");
            span = element("span");
            t0 = text(t0_value);
            t1 = space();
            if (if_block) {
                if_block.c();
            }
            t2 = space();
            td1 = element("td");
            div0 = element("div");
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
            create_component(configureitembutton1.$$.fragment);
            t7 = space();
            td5 = element("td");
            create_component(configureitembutton2.$$.fragment);
            t8 = space();
            div1 = element("div");
            t9 = space();
            attr(td0, "class", "name svelte-1ug8i0n");
            attr(div0, "class", "actions svelte-1ug8i0n");
            attr(td1, "class", "actions svelte-1ug8i0n");
            attr(td2, "class", "svelte-1ug8i0n");
            attr(td3, "class", "config svelte-1ug8i0n");
            attr(td4, "class", "config svelte-1ug8i0n");
            attr(td5, "class", "config svelte-1ug8i0n");
            attr(div1, "class", "description svelte-1ug8i0n");
            attr(tr, "class", "svelte-1ug8i0n");
        },
        m(target, anchor) {
            insert(target, tr, anchor);
            append(tr, td0);
            append(td0, span);
            append(span, t0);
            append(td0, t1);
            if (if_block) {
                if_block.m(td0, null);
            }
            append(tr, t2);
            append(tr, td1);
            append(td1, div0);
            for (let i = 0; i < each_blocks.length; i += 1) {
                each_blocks[i].m(div0, null);
            }
            append(tr, t3);
            append(tr, td2);
            append(td2, t4);
            append(tr, t5);
            append(tr, td3);
            mount_component(configureitembutton0, td3, null);
            append(tr, t6);
            append(tr, td4);
            mount_component(configureitembutton1, td4, null);
            append(tr, t7);
            append(tr, td5);
            mount_component(configureitembutton2, td5, null);
            append(tr, t8);
            append(tr, div1);
            div1.innerHTML = raw_value;
            append(tr, t9);
            current = true;
            if (!mounted) {
                dispose = listen(span, "click", ctx[3]);
                mounted = true;
            }
        },
        p(ctx2, dirty) {
            if ((!current || dirty & 2) && t0_value !== (t0_value = ctx2[7].name + "")) {
                set_data(t0, t0_value);
            }
            if (ctx2[7].system.hasAttack || ctx2[7].system.hasDamage) {
                if (if_block) {
                    if_block.p(ctx2, dirty);
                }
                else {
                    if_block = create_if_block_1$1(ctx2);
                    if_block.c();
                    if_block.m(td0, null);
                }
            }
            else if (if_block) {
                if_block.d(1);
                if_block = null;
            }
            if (dirty & 3) {
                each_value_1 = ctx2[7].system.actionList;
                let i;
                for (i = 0; i < each_value_1.length; i += 1) {
                    const child_ctx = get_each_context_1$4(ctx2, each_value_1, i);
                    if (each_blocks[i]) {
                        each_blocks[i].p(child_ctx, dirty);
                    }
                    else {
                        each_blocks[i] = create_each_block_1$4(child_ctx);
                        each_blocks[i].c();
                        each_blocks[i].m(div0, null);
                    }
                }
                for (; i < each_blocks.length; i += 1) {
                    each_blocks[i].d(1);
                }
                each_blocks.length = each_value_1.length;
            }
            if ((!current || dirty & 2) && t4_value !== (t4_value = ctx2[7].system.level.current + "")) {
                set_data(t4, t4_value);
            }
            const configureitembutton0_changes = {};
            if (dirty & 2) {
                configureitembutton0_changes.item = ctx2[7];
            }
            configureitembutton0.$set(configureitembutton0_changes);
            const configureitembutton1_changes = {};
            if (dirty & 2) {
                configureitembutton1_changes.item = ctx2[7];
            }
            configureitembutton1.$set(configureitembutton1_changes);
            const configureitembutton2_changes = {};
            if (dirty & 2) {
                configureitembutton2_changes.item = ctx2[7];
            }
            configureitembutton2.$set(configureitembutton2_changes);
            if ((!current || dirty & 2) && raw_value !== (raw_value = ctx2[7].system.description + "")) {
                div1.innerHTML = raw_value;
            }
        },
        i(local) {
            if (current) {
                return;
            }
            transition_in(configureitembutton0.$$.fragment, local);
            transition_in(configureitembutton1.$$.fragment, local);
            transition_in(configureitembutton2.$$.fragment, local);
            current = true;
        },
        o(local) {
            transition_out(configureitembutton0.$$.fragment, local);
            transition_out(configureitembutton1.$$.fragment, local);
            transition_out(configureitembutton2.$$.fragment, local);
            current = false;
        },
        d(detaching) {
            if (detaching) {
                detach(tr);
            }
            if (if_block) {
                if_block.d();
            }
            destroy_each(each_blocks, detaching);
            destroy_component(configureitembutton0);
            destroy_component(configureitembutton1);
            destroy_component(configureitembutton2);
            mounted = false;
            dispose();
        }
    };
}

__name(create_each_block$b, "create_each_block$b");

function create_fragment$e(ctx) {
    let table;
    let thead;
    let tr;
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
        props: { item: "feature", action: "create" }
    });
    let each_value = ctx[1].itemTypes.feature;
    let each_blocks = [];
    for (let i = 0; i < each_value.length; i += 1) {
        each_blocks[i] = create_each_block$b(get_each_context$b(ctx, each_value, i));
    }
    const out = /* @__PURE__ */ __name((i) => transition_out(each_blocks[i], 1, 1, () => {
        each_blocks[i] = null;
    }), "out");
    return {
        c() {
            table = element("table");
            thead = element("thead");
            tr = element("tr");
            th0 = element("th");
            th0.textContent = "Name";
            t1 = space();
            th1 = element("th");
            th1.textContent = "Actions";
            t3 = space();
            th2 = element("th");
            th2.textContent = "Level";
            t5 = space();
            th3 = element("th");
            t6 = text("Config\r\n            ");
            create_component(configureitembutton.$$.fragment);
            t7 = space();
            tbody = element("tbody");
            for (let i = 0; i < each_blocks.length; i += 1) {
                each_blocks[i].c();
            }
            attr(th0, "class", "name");
            attr(th3, "colspan", "3");
            attr(tr, "class", "svelte-1ug8i0n");
        },
        m(target, anchor) {
            insert(target, table, anchor);
            append(table, thead);
            append(thead, tr);
            append(tr, th0);
            append(tr, t1);
            append(tr, th1);
            append(tr, t3);
            append(tr, th2);
            append(tr, t5);
            append(tr, th3);
            append(th3, t6);
            mount_component(configureitembutton, th3, null);
            append(table, t7);
            append(table, tbody);
            for (let i = 0; i < each_blocks.length; i += 1) {
                each_blocks[i].m(tbody, null);
            }
            current = true;
        },
        p(ctx2, [dirty]) {
            if (dirty & 3) {
                each_value = ctx2[1].itemTypes.feature;
                let i;
                for (i = 0; i < each_value.length; i += 1) {
                    const child_ctx = get_each_context$b(ctx2, each_value, i);
                    if (each_blocks[i]) {
                        each_blocks[i].p(child_ctx, dirty);
                        transition_in(each_blocks[i], 1);
                    }
                    else {
                        each_blocks[i] = create_each_block$b(child_ctx);
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
            if (current) {
                return;
            }
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
            if (detaching) {
                detach(table);
            }
            destroy_component(configureitembutton);
            destroy_each(each_blocks, detaching);
        }
    };
}

__name(create_fragment$e, "create_fragment$e");

function ShowDescription(event) {
    const parent = event.target.parentNode.parentNode;
    const div = parent.getElementsByClassName("description")[0];
    const isHidden = getComputedStyle(div).opacity == 0;
    div.style.webkitTransition = isHidden ? "opacity 0.75s" : "opacity 0.25s, width 1.1s";
    let divHeight;
    let parentHeight;
    div.style.width = isHidden ? "100%" : div.style.width;
    divHeight = div.offsetHeight;
    parentHeight = parent.offsetHeight;
    parent.style.height = parentHeight + "px";
    div.style.opacity = isHidden ? 1 : 0;
    parent.style.height = isHidden ? parentHeight + divHeight + "px" : parentHeight - divHeight + "px";
    div.style.top = isHidden ? parentHeight + "px" : div.style.top;
    div.style.width = isHidden ? "100%" : "0%";
}

__name(ShowDescription, "ShowDescription");
function itemRoll(item) {
  const hasAttack = item.system.hasAttack;
  const hasDamage = item.system.hasDamage;
  return item.roll({ hasAttack, hasDamage });
}
__name(itemRoll, "itemRoll");

function instance$e($$self, $$props, $$invalidate) {
    let $doc;
    let { canConfig } = $$props;
    const doc = getContext("DocumentSheetObject");
    component_subscribe($$self, doc, (value) => $$invalidate(1, $doc = value));
    const click_handler2 = /* @__PURE__ */ __name((event) => ShowDescription(event), "click_handler");
    const click_handler_1 = /* @__PURE__ */ __name((item) => {
        itemRoll(item);
    }, "click_handler_1");
    const click_handler_2 = /* @__PURE__ */ __name((action) => {
        action.use();
    }, "click_handler_2");
    const click_handler_3 = /* @__PURE__ */ __name((action) => action.sheet.render(true, { focus: true }), "click_handler_3");
    $$self.$$set = ($$props2) => {
        if ("canConfig" in $$props2)
            $$invalidate(0, canConfig = $$props2.canConfig);
    };
    return [
        canConfig,
        $doc,
        doc,
        click_handler2,
        click_handler_1,
        click_handler_2,
        click_handler_3
    ];
}

__name(instance$e, "instance$e");

class FeaturesTab extends SvelteComponent {
    constructor(options) {
        super();
        init(this, options, instance$e, create_fragment$e, safe_not_equal, { canConfig: 0 });
    }

    get canConfig() {
        return this.$$.ctx[0];
    }

    set canConfig(canConfig) {
        this.$$set({ canConfig });
        flush();
    }
}
__name(FeaturesTab, "FeaturesTab");
class SpellsTab extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, null, null, safe_not_equal, {});
  }
}
__name(SpellsTab, "SpellsTab");
class EffectsTab extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, null, null, safe_not_equal, {});
  }
}
__name(EffectsTab, "EffectsTab");
class BiographyTab extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, null, null, safe_not_equal, {});
  }
}
__name(BiographyTab, "BiographyTab");
const ActorSheet_svelte_svelte_type_style_lang = "";

function get_each_context$a(ctx, list, i) {
    const child_ctx = ctx.slice();
    child_ctx[5] = list[i];
    return child_ctx;
}

__name(get_each_context$a, "get_each_context$a");
function get_each_context_1$3(ctx, list, i) {
    const child_ctx = ctx.slice();
    child_ctx[8] = list[i];
    return child_ctx;
}
__name(get_each_context_1$3, "get_each_context_1$3");
function create_each_block_1$3(ctx) {
    let div;
    let span0;
    let t0_value = ctx[8][1].label + "";
    let t0;
    let t1;
    let span1;
    let t2;
    let t3_value = ctx[8][1].total + "";
    let t3;
    let t4;
    let span2;
    let t5;
    let t6_value = ctx[8][1].mod + "";
    let t6;
    let t7;
    let div_data_tooltip_value;
    let mounted;
    let dispose;

    function click_handler2(...args) {
        return ctx[3](ctx[8], ...args);
    }

    __name(click_handler2, "click_handler");
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
            attr(div, "data-tooltip", div_data_tooltip_value = "click to roll " + ctx[8][1].label);
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
        dispose = listen(div, "click", click_handler2);
        mounted = true;
      }
    },
    p(new_ctx, dirty) {
        ctx = new_ctx;
        if (dirty & 1 && t0_value !== (t0_value = ctx[8][1].label + ""))
            set_data(t0, t0_value);
        if (dirty & 1 && t3_value !== (t3_value = ctx[8][1].total + ""))
            set_data(t3, t3_value);
        if (dirty & 1 && t6_value !== (t6_value = ctx[8][1].mod + ""))
            set_data(t6, t6_value);
        if (dirty & 1 && div_data_tooltip_value !== (div_data_tooltip_value = "click to roll " + ctx[8][1].label)) {
            attr(div, "data-tooltip", div_data_tooltip_value);
        }
    },
    d(detaching) {
      if (detaching)
        detach(div);
      mounted = false;
      dispose();
    }
  };
}
__name(create_each_block_1$3, "create_each_block_1$3");

function create_each_block$a(ctx) {
    let span0;
    let t0_value = ctx[5][0] + "";
    let t0;
    let t1;
    let span1;
    let t2_value = ctx[5][1].value + "";
    let t2;
    let t3;
    let t4_value = ctx[5][1].max + "";
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
        p(ctx2, dirty) {
            if (dirty & 1 && t0_value !== (t0_value = ctx2[5][0] + ""))
                set_data(t0, t0_value);
            if (dirty & 1 && t2_value !== (t2_value = ctx2[5][1].value + ""))
                set_data(t2, t2_value);
            if (dirty & 1 && t4_value !== (t4_value = ctx2[5][1].max + ""))
                set_data(t4, t4_value);
        },
        d(detaching) {
            if (detaching)
                detach(span0);
            if (detaching)
                detach(t1);
            if (detaching)
                detach(span1);
        }
    };
}

__name(create_each_block$a, "create_each_block$a");

function create_fragment$d(ctx) {
    let header;
    let div0;
    let imagewithfilepicker;
    let t0;
    let div11;
    let div8;
    let div3;
    let div1;
    let inputfordocumentsheet0;
    let t1;
    let div2;
    let t2;
    let t3_value = (ctx[0].itemTypes.race[0]?.name || "none") + "";
    let t3;
    let t4;
    let div4;
    let inputfordocumentsheet1;
    let t5;
    let span;
    let t6_value = ctx[0].system.health.max + "";
    let t6;
    let t7;
    let div7;
    let div5;
    let inputfordocumentsheet2;
    let t8;
    let div6;
    let t9;
    let t10_value = ctx[0].system.advancement.xp.used + "";
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
    inputfordocumentsheet0 = new InputForDocumentSheet({
        props: {
            valuePath: "name",
            label: "name",
            type: "text"
        }
    });
    inputfordocumentsheet1 = new InputForDocumentSheet({
        props: {
            valuePath: "system.health.value",
            label: "health",
            type: "integer"
        }
    });
    inputfordocumentsheet2 = new InputForDocumentSheet({
        props: {
            valuePath: "system.advancement.xp.get",
            type: "number",
            label: "XP earned"
        }
    });
    let each_value_1 = Object.entries(ctx[0].system.attributes);
    let each_blocks_1 = [];
    for (let i = 0; i < each_value_1.length; i += 1) {
        each_blocks_1[i] = create_each_block_1$3(get_each_context_1$3(ctx, each_value_1, i));
    }
    let each_value = Object.entries(ctx[0].system.resources);
    let each_blocks = [];
    for (let i = 0; i < each_value.length; i += 1) {
        each_blocks[i] = create_each_block$a(get_each_context$a(ctx, each_value, i));
    }
    tabs_1 = new Tabs({
        props: { tabs: ctx[2], activeTab }
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
    p(ctx2, [dirty]) {
      if ((!current || dirty & 1) && t3_value !== (t3_value = (ctx2[0].itemTypes.race[0]?.name || "none") + ""))
        set_data(t3, t3_value);
      if ((!current || dirty & 1) && t6_value !== (t6_value = ctx2[0].system.health.max + ""))
        set_data(t6, t6_value);
      if ((!current || dirty & 1) && t10_value !== (t10_value = ctx2[0].system.advancement.xp.used + ""))
        set_data(t10, t10_value);
      if (dirty & 1) {
        each_value_1 = Object.entries(ctx2[0].system.attributes);
        let i;
        for (i = 0; i < each_value_1.length; i += 1) {
            const child_ctx = get_each_context_1$3(ctx2, each_value_1, i);
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
      if (dirty & 1) {
        each_value = Object.entries(ctx2[0].system.resources);
        let i;
        for (i = 0; i < each_value.length; i += 1) {
            const child_ctx = get_each_context$a(ctx2, each_value, i);
          if (each_blocks[i]) {
            each_blocks[i].p(child_ctx, dirty);
          } else {
              each_blocks[i] = create_each_block$a(child_ctx);
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
      if (current)
        return;
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
      if (detaching)
        detach(header);
      destroy_component(imagewithfilepicker);
      destroy_component(inputfordocumentsheet0);
      destroy_component(inputfordocumentsheet1);
      destroy_component(inputfordocumentsheet2);
      destroy_each(each_blocks_1, detaching);
      destroy_each(each_blocks, detaching);
      if (detaching)
        detach(t13);
      if (detaching)
        detach(div12);
      destroy_component(tabs_1);
    }
  };
}

__name(create_fragment$d, "create_fragment$d");
let activeTab = "attributes";
function getTooltipForItemType(item) {
  return `Create new ${item}`;
}
__name(getTooltipForItemType, "getTooltipForItemType");

function instance$d($$self, $$props, $$invalidate) {
    let $doc;
    const doc = getContext("DocumentSheetObject");
    component_subscribe($$self, doc, (value) => $$invalidate(0, $doc = value));
    const { application } = getContext("external");
    setContext("ConfigButtons", {
        edit: {
            class: "fa-solid fa-pen-to-square",
            tooltip: "Edit",
            function: application.showEmbeddedItem
        },
        delete: {
            class: "fa-solid fa-trash-can",
            tooltip: "Delete",
            function: application.deleteEmbeddedItem
        },
        create: {
            class: "fa-solid fa-file-plus",
            tooltip: getTooltipForItemType,
            function: application.createEmbeddedItem.bind(application)
        },
        favorite: {
            class: "fa-solid fa-stars",
            tooltip: "Add to favorite",
            function: application.addToFavorite.bind(application)
        }
    });
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
    const click_handler2 = /* @__PURE__ */ __name((attribute, event) => {
        event.preventDefault;
        return $doc.rollAttributeTest(attribute[0], { event });
    }, "click_handler");
    return [$doc, doc, tabs, click_handler2];
}

__name(instance$d, "instance$d");
class ActorSheet$1 extends SvelteComponent {
  constructor(options) {
      super();
      init(this, options, instance$d, create_fragment$d, safe_not_equal, {});
  }
}

__name(ActorSheet$1, "ActorSheet$1");
const RaceSheet_svelte_svelte_type_style_lang = "";

function get_each_context$9(ctx, list, i) {
    const child_ctx = ctx.slice();
    child_ctx[2] = list[i];
    return child_ctx;
}

__name(get_each_context$9, "get_each_context$9");

function create_each_block$9(ctx) {
    let div;
    let inputfordocumentsheet;
    let t;
    let current;
    inputfordocumentsheet = new InputForDocumentSheet({
        props: {
            valuePath: "system.attributes." + ctx[2][0],
            label: ctx[2][0],
            type: "integer"
        }
    });
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
        p(ctx2, dirty) {
            const inputfordocumentsheet_changes = {};
            if (dirty & 1)
                inputfordocumentsheet_changes.valuePath = "system.attributes." + ctx2[2][0];
            if (dirty & 1)
                inputfordocumentsheet_changes.label = ctx2[2][0];
            inputfordocumentsheet.$set(inputfordocumentsheet_changes);
        },
        i(local) {
            if (current)
                return;
            transition_in(inputfordocumentsheet.$$.fragment, local);
            current = true;
        },
        o(local) {
            transition_out(inputfordocumentsheet.$$.fragment, local);
            current = false;
        },
        d(detaching) {
            if (detaching)
                detach(div);
            destroy_component(inputfordocumentsheet);
        }
    };
}

__name(create_each_block$9, "create_each_block$9");

function create_fragment$c(ctx) {
    let header;
    let imagewithfilepicker;
    let t0;
    let h1;
    let inputfordocumentsheet0;
    let t1;
    let div4;
    let div0;
    let inputfordocumentsheet1;
    let t2;
    let div1;
    let inputfordocumentsheet2;
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
    inputfordocumentsheet0 = new InputForDocumentSheet({
        props: {
            valuePath: "name",
            label: "name",
            type: "text"
        }
    });
    inputfordocumentsheet1 = new InputForDocumentSheet({
        props: {
            valuePath: "system.speed",
            label: "speed",
            type: "integer"
        }
    });
    inputfordocumentsheet2 = new InputForDocumentSheet({
        props: {
            valuePath: "system.health",
            label: "health",
            type: "integer"
        }
    });
    let each_value = Object.entries(ctx[0].system.attributes);
    let each_blocks = [];
    for (let i = 0; i < each_value.length; i += 1) {
        each_blocks[i] = create_each_block$9(get_each_context$9(ctx, each_value, i));
    }
    const out = /* @__PURE__ */ __name((i) => transition_out(each_blocks[i], 1, 1, () => {
        each_blocks[i] = null;
    }), "out");
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
        p(ctx2, [dirty]) {
            if (dirty & 1) {
                each_value = Object.entries(ctx2[0].system.attributes);
                let i;
                for (i = 0; i < each_value.length; i += 1) {
                    const child_ctx = get_each_context$9(ctx2, each_value, i);
                    if (each_blocks[i]) {
                        each_blocks[i].p(child_ctx, dirty);
            transition_in(each_blocks[i], 1);
          } else {
                        each_blocks[i] = create_each_block$9(child_ctx);
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
      if (current)
        return;
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
        if (detaching)
            detach(header);
        destroy_component(imagewithfilepicker);
        destroy_component(inputfordocumentsheet0);
        if (detaching)
            detach(t1);
        if (detaching)
            detach(div4);
        destroy_component(inputfordocumentsheet1);
        destroy_component(inputfordocumentsheet2);
        destroy_each(each_blocks, detaching);
    }
    };
}

__name(create_fragment$c, "create_fragment$c");

function instance$c($$self, $$props, $$invalidate) {
    let $doc;
    const doc = getContext("DocumentSheetObject");
    component_subscribe($$self, doc, (value) => $$invalidate(0, $doc = value));
    return [$doc, doc];
}

__name(instance$c, "instance$c");

class RaceSheet extends SvelteComponent {
    constructor(options) {
        super();
        init(this, options, instance$c, create_fragment$c, safe_not_equal, {});
    }
}

__name(RaceSheet, "RaceSheet");
const FeatureSheet_svelte_svelte_type_style_lang = "";

function get_each_context$8(ctx, list, i) {
    const child_ctx = ctx.slice();
    child_ctx[7] = list[i];
    return child_ctx;
}

__name(get_each_context$8, "get_each_context$8");

function create_if_block$5(ctx) {
    let inputfordocumentsheet0;
    let t;
    let inputfordocumentsheet1;
    let current;
    inputfordocumentsheet0 = new InputForDocumentSheet({
        props: {
            valuePath: "system.level.min",
            type: "integer"
        }
    });
    inputfordocumentsheet1 = new InputForDocumentSheet({
        props: {
            valuePath: "system.level.max",
            type: "integer"
        }
    });
    return {
        c() {
            create_component(inputfordocumentsheet0.$$.fragment);
            t = text("\r\n            /\r\n            ");
            create_component(inputfordocumentsheet1.$$.fragment);
        },
        m(target, anchor) {
            mount_component(inputfordocumentsheet0, target, anchor);
            insert(target, t, anchor);
            mount_component(inputfordocumentsheet1, target, anchor);
            current = true;
        },
        i(local) {
            if (current)
                return;
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
            if (detaching)
                detach(t);
            destroy_component(inputfordocumentsheet1, detaching);
        }
    };
}

__name(create_if_block$5, "create_if_block$5");

function create_each_block$8(ctx) {
    let div1;
    let span;
    let t0_value = ctx[7].name + "";
    let t0;
    let t1;
    let div0;
    let i0;
    let t2;
    let i1;
    let t3;
    let mounted;
    let dispose;

    function click_handler_1() {
        return ctx[5](ctx[7]);
    }

    __name(click_handler_1, "click_handler_1");

    function click_handler_2() {
        return ctx[6](ctx[7]);
    }

    __name(click_handler_2, "click_handler_2");
    return {
        c() {
            div1 = element("div");
            span = element("span");
            t0 = text(t0_value);
            t1 = space();
            div0 = element("div");
            i0 = element("i");
            t2 = space();
            i1 = element("i");
            t3 = space();
            attr(span, "class", "name svelte-13wj1ft");
            attr(i0, "class", "fa-solid fa-trash-can svelte-13wj1ft");
            attr(i0, "data-tooltip", "delete");
            attr(i1, "class", "fa-solid fa-pen-to-square svelte-13wj1ft");
            attr(i1, "data-tooltip", "edit");
            attr(div0, "class", "control svelte-13wj1ft");
            attr(div1, "class", "action svelte-13wj1ft");
        },
        m(target, anchor) {
            insert(target, div1, anchor);
            append(div1, span);
            append(span, t0);
            append(div1, t1);
            append(div1, div0);
            append(div0, i0);
            append(div0, t2);
            append(div0, i1);
            append(div1, t3);
            if (!mounted) {
                dispose = [
                    listen(i0, "click", click_handler_1),
                    listen(i1, "click", click_handler_2)
                ];
                mounted = true;
            }
        },
        p(new_ctx, dirty) {
            ctx = new_ctx;
            if (dirty & 1 && t0_value !== (t0_value = ctx[7].name + ""))
                set_data(t0, t0_value);
        },
        d(detaching) {
            if (detaching)
                detach(div1);
            mounted = false;
            run_all(dispose);
        }
    };
}

__name(create_each_block$8, "create_each_block$8");

function create_fragment$b(ctx) {
    let header;
    let imagewithfilepicker;
    let t0;
    let h1;
    let inputfordocumentsheet;
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
    inputfordocumentsheet = new InputForDocumentSheet({
        props: { valuePath: "name", label: "name" }
    });
    let if_block = ctx[0].system.level.has && create_if_block$5();
    let each_value = ctx[0].system.actionList;
    let each_blocks = [];
    for (let i2 = 0; i2 < each_value.length; i2 += 1) {
        each_blocks[i2] = create_each_block$8(get_each_context$8(ctx, each_value, i2));
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
            if (if_block)
                if_block.c();
            t5 = space();
            fieldset1 = element("fieldset");
            legend1 = element("legend");
            t6 = text("Actions ");
            i = element("i");
            t7 = space();
            for (let i2 = 0; i2 < each_blocks.length; i2 += 1) {
                each_blocks[i2].c();
            }
            attr(header, "class", "svelte-13wj1ft");
            attr(input, "type", "checkbox");
            attr(i, "class", "fa-solid fa-file-plus svelte-13wj1ft");
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
            input.checked = ctx[0].system.level.has;
            append(fieldset0, t4);
            if (if_block)
                if_block.m(fieldset0, null);
            append(main, t5);
            append(main, fieldset1);
            append(fieldset1, legend1);
            append(legend1, t6);
            append(legend1, i);
            append(fieldset1, t7);
            for (let i2 = 0; i2 < each_blocks.length; i2 += 1) {
                each_blocks[i2].m(fieldset1, null);
            }
            current = true;
            if (!mounted) {
                dispose = [
                    listen(input, "change", ctx[2]),
                    listen(input, "change", ctx[3]),
                    listen(i, "click", ctx[4])
                ];
                mounted = true;
            }
        },
        p(ctx2, [dirty]) {
            if (dirty & 1) {
                input.checked = ctx2[0].system.level.has;
            }
            if (ctx2[0].system.level.has) {
                if (if_block) {
                    if (dirty & 1) {
                        transition_in(if_block, 1);
                    }
                }
                else {
                    if_block = create_if_block$5();
                    if_block.c();
                    transition_in(if_block, 1);
                    if_block.m(fieldset0, null);
                }
            }
            else if (if_block) {
                group_outros();
                transition_out(if_block, 1, 1, () => {
                    if_block = null;
                });
                check_outros();
            }
            if (dirty & 1) {
                each_value = ctx2[0].system.actionList;
                let i2;
                for (i2 = 0; i2 < each_value.length; i2 += 1) {
                    const child_ctx = get_each_context$8(ctx2, each_value, i2);
                    if (each_blocks[i2]) {
                        each_blocks[i2].p(child_ctx, dirty);
                    }
                    else {
                        each_blocks[i2] = create_each_block$8(child_ctx);
                        each_blocks[i2].c();
                        each_blocks[i2].m(fieldset1, null);
                    }
                }
                for (; i2 < each_blocks.length; i2 += 1) {
                    each_blocks[i2].d(1);
        }
        each_blocks.length = each_value.length;
      }
    },
    i(local) {
      if (current)
        return;
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
        if (detaching)
            detach(header);
        destroy_component(imagewithfilepicker);
        destroy_component(inputfordocumentsheet);
        if (detaching)
            detach(t1);
        if (detaching)
            detach(main);
        if (if_block)
            if_block.d();
        destroy_each(each_blocks, detaching);
        mounted = false;
        run_all(dispose);
    }
    };
}

__name(create_fragment$b, "create_fragment$b");

function instance$b($$self, $$props, $$invalidate) {
    let $doc;
    const doc = getContext("DocumentSheetObject");
    component_subscribe($$self, doc, (value) => $$invalidate(0, $doc = value));

    function input_change_handler() {
        $doc.system.level.has = this.checked;
        doc.set($doc);
    }

    __name(input_change_handler, "input_change_handler");
    const change_handler = /* @__PURE__ */ __name(() => {
        $doc.update({ system: $doc.system });
    }, "change_handler");
    const click_handler2 = /* @__PURE__ */ __name(async () => {
        await $doc.addAction();
    }, "click_handler");
    const click_handler_1 = /* @__PURE__ */ __name((action) => $doc.removeAction(action.id), "click_handler_1");
    const click_handler_2 = /* @__PURE__ */ __name((action) => action.sheet.render(true), "click_handler_2");
    return [
        $doc,
        doc,
        input_change_handler,
        change_handler,
        click_handler2,
        click_handler_1,
        click_handler_2
    ];
}

__name(instance$b, "instance$b");

class FeatureSheet extends SvelteComponent {
    constructor(options) {
        super();
        init(this, options, instance$b, create_fragment$b, safe_not_equal, {});
    }
}

__name(FeatureSheet, "FeatureSheet");
const preloadHandlebarsTemplates = /* @__PURE__ */ __name(async function () {
    return loadTemplates([
        "systems/ard20/templates/actor/parts/actor-features.html",
        "systems/ard20/templates/actor/parts/actor-items.html",
        "systems/ard20/templates/actor/parts/actor-spells.html",
        "systems/ard20/templates/actor/parts/actor-effects.html",
        "systems/ard20/templates/actor/parts/actor-equip.html",
        "systems/ard20/templates/actor/parts/actor-adv.html",
        "systems/ard20/templates/app/prof-settings.html",
        "systems/ard20/templates/app/feat-settings.html",
        "systems/ard20/templates/app/feat_req.hbs"
    ]);
}, "preloadHandlebarsTemplates");
class DocTemplate {
  static #map = /* @__PURE__ */ new Map();
  static delete(type) {
    return this.#map.delete(type);
  }
  static get(doc) {
    const component = this.#map.get(doc?.type);
    return component ? component : EmptySheet;
  }
  static getByType(type) {
    const component = this.#map.get(type);
    console.log(type);
    return component ? component : EmptySheet;
  }
  static set(type, component) {
    this.#map.set(type, component);
  }
}
__name(DocTemplate, "DocTemplate");
const setSvelteComponents = /* @__PURE__ */ __name(() => {
  DocTemplate.set("item", ItemItemSheet);
  DocTemplate.set("character", ActorSheet$1);
  DocTemplate.set("race", RaceSheet);
  DocTemplate.set("feature", FeatureSheet);
}, "setSvelteComponents");
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
ARd20.CHARACTER_EXP_LEVELS = [0, 300, 900, 2700, 6500, 14e3, 23e3, 34e3, 48e3, 64e3, 85e3, 1e5, 12e4, 14e4, 165e3, 195e3, 225e3, 265e3, 305e3, 355e3];
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
ARd20.AbilXP = [50, 50, 50, 50, 70, 90, 120, 150, 190, 290, 440, 660, 990, 1500, 2700, 4800, 8400, 14700, 25700, 51500, 103e3, 206e3, 412e3, 824e3, 206e4];
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
  light: { chest: 3, gloves: 1, boots: 1, pants: 2, head: 1 },
  medium: { chest: 5, gloves: 2, boots: 2, pants: 3, head: 2 },
  heavy: { chest: 8, gloves: 3, boots: 3, pants: 5, head: 3 }
};
ARd20.RollResult = {
  0: "ARd20.Fumble",
  1: "ARd20.Fail",
  2: "ARd20.Success",
  3: "ARd20.Crit"
};
class ARd20SocketHandler {
  static async updateActorData(data) {
    console.log("socket data", data);
    console.log("Socket Called, its GM:", game.user.isGM, " and its active: ", game.user.active);
    if (!game.user.isGM)
      return;
    const isResponsibleGM = game.users.filter((user) => user.isGM && user.active).some((other) => other.data._id <= game.user.data._id);
    if (!isResponsibleGM)
      return;
    console.log("HERE GM ON SOCKET CALLING");
    const token = await fromUuid(data.tokenId);
    const actor = token?.actor;
    if (actor)
      await actor.update(data.update);
  }
}
__name(ARd20SocketHandler, "ARd20SocketHandler");
const SettingsSubmitButton_svelte_svelte_type_style_lang = "";

function create_fragment$a(ctx) {
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
                dispose = listen(button, "click", ctx[2]);
                mounted = true;
            }
        },
        p: noop,
        i: noop,
        o: noop,
        d(detaching) {
            if (detaching)
                detach(button);
            mounted = false;
            dispose();
        }
    };
}

__name(create_fragment$a, "create_fragment$a");
function SubmitSetting(setting2, data) {
  game.settings.set("ard20", setting2, data);
}
__name(SubmitSetting, "SubmitSetting");

function instance$a($$self, $$props, $$invalidate) {
    let { setting: setting2 } = $$props;
    let { data } = $$props;
    const click_handler2 = /* @__PURE__ */ __name(() => SubmitSetting(setting2, data), "click_handler");
    $$self.$$set = ($$props2) => {
        if ("setting" in $$props2)
            $$invalidate(0, setting2 = $$props2.setting);
        if ("data" in $$props2)
            $$invalidate(1, data = $$props2.data);
    };
    return [setting2, data, click_handler2];
}

__name(instance$a, "instance$a");
class SettingsSubmitButton extends SvelteComponent {
  constructor(options) {
      super();
      init(this, options, instance$a, create_fragment$a, safe_not_equal, { setting: 0, data: 1 });
  }
}
__name(SettingsSubmitButton, "SettingsSubmitButton");
const advancementRateShell_svelte_svelte_type_style_lang = "";

function get_each_context$7(ctx, list, i) {
    const child_ctx = ctx.slice();
    child_ctx[17] = list[i];
    child_ctx[18] = list;
    child_ctx[19] = i;
    return child_ctx;
}

__name(get_each_context$7, "get_each_context$7");
function get_each_context_1$2(ctx, list, i) {
    const child_ctx = ctx.slice();
    child_ctx[20] = list[i];
    child_ctx[21] = list;
    child_ctx[22] = i;
    return child_ctx;
}
__name(get_each_context_1$2, "get_each_context_1$2");
function create_each_block_1$2(ctx) {
    let label;
    let t0_value = ctx[20].longName + "";
    let t0;
    let label_for_value;
    let t1;
    let input;
    let mounted;
    let dispose;

    function input_input_handler() {
        ctx[8].call(input, ctx[21], ctx[22]);
    }

    __name(input_input_handler, "input_input_handler");
    return {
        c() {
            label = element("label");
            t0 = text(t0_value);
            t1 = space();
            input = element("input");
            attr(label, "for", label_for_value = ctx[20].longName);
            attr(input, "placeholder", "shortName");
        },
        m(target, anchor) {
            insert(target, label, anchor);
            append(label, t0);
            insert(target, t1, anchor);
            insert(target, input, anchor);
            set_input_value(input, ctx[20].shortName);
            if (!mounted) {
                dispose = listen(input, "input", input_input_handler);
                mounted = true;
            }
        },
        p(new_ctx, dirty) {
            ctx = new_ctx;
            if (dirty & 2 && t0_value !== (t0_value = ctx[20].longName + ""))
                set_data(t0, t0_value);
            if (dirty & 2 && label_for_value !== (label_for_value = ctx[20].longName)) {
                attr(label, "for", label_for_value);
            }
            if (dirty & 2 && input.value !== ctx[20].shortName) {
        set_input_value(input, ctx[20].shortName);
      }
    },
    d(detaching) {
        if (detaching)
            detach(label);
        if (detaching)
            detach(t1);
        if (detaching)
            detach(input);
        mounted = false;
        dispose();
    }
  };
}
__name(create_each_block_1$2, "create_each_block_1$2");

function create_if_block$4(ctx) {
    let div;
    let t0;
    let t1_value = [...ctx[2][ctx[17]].set].join(", ") + "";
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
        p(ctx2, dirty) {
            if (dirty & 4 && t1_value !== (t1_value = [...ctx2[2][ctx2[17]].set].join(", ") + ""))
                set_data(t1, t1_value);
        },
        d(detaching) {
            if (detaching)
                detach(div);
        }
    };
}

__name(create_if_block$4, "create_if_block$4");

function create_each_block$7(ctx) {
    let div1;
    let label;
    let t1;
    let input;
    let param = ctx[17];
    let t2;
    let div0;
    let raw_value = ctx[5][ctx[17]] + "";
    let t3;
    let t4;
    let br;
    let mounted;
    let dispose;

    function input_handler() {
        return ctx[9](ctx[17]);
    }

    __name(input_handler, "input_handler");
    const assign_input = /* @__PURE__ */ __name(() => ctx[10](input, param), "assign_input");
    const unassign_input = /* @__PURE__ */ __name(() => ctx[10](null, param), "unassign_input");

    function input_input_handler_1() {
        ctx[11].call(input, ctx[17]);
    }

    __name(input_input_handler_1, "input_input_handler_1");
    const assign_div0 = /* @__PURE__ */ __name(() => ctx[12](div0, param), "assign_div0");
    const unassign_div0 = /* @__PURE__ */ __name(() => ctx[12](null, param), "unassign_div0");
    let if_block = ctx[2][ctx[17]].check && create_if_block$4(ctx);
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
            if (if_block)
                if_block.c();
            t4 = space();
            br = element("br");
            attr(label, "for", "AttributeFormula");
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
            set_input_value(input, ctx[1].formulas[ctx[17]]);
            append(div1, t2);
            append(div1, div0);
            div0.innerHTML = raw_value;
            assign_div0();
            append(div1, t3);
            if (if_block)
                if_block.m(div1, null);
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
            if (param !== ctx[17]) {
                unassign_input();
                param = ctx[17];
                assign_input();
            }
            if (dirty & 66 && input.value !== ctx[1].formulas[ctx[17]]) {
                set_input_value(input, ctx[1].formulas[ctx[17]]);
            }
            if (dirty & 32 && raw_value !== (raw_value = ctx[5][ctx[17]] + ""))
                div0.innerHTML = raw_value;
            if (param !== ctx[17]) {
                unassign_div0();
                param = ctx[17];
                assign_div0();
            }
            if (ctx[2][ctx[17]].check) {
                if (if_block) {
                    if_block.p(ctx, dirty);
                }
                else {
                    if_block = create_if_block$4(ctx);
                    if_block.c();
                    if_block.m(div1, null);
                }
            }
            else if (if_block) {
                if_block.d(1);
                if_block = null;
            }
        },
        d(detaching) {
            if (detaching)
                detach(div1);
            unassign_input();
            unassign_div0();
            if (if_block)
                if_block.d();
            if (detaching)
                detach(t4);
            if (detaching)
                detach(br);
            mounted = false;
            run_all(dispose);
        }
    };
}

__name(create_each_block$7, "create_each_block$7");

function create_default_slot$5(ctx) {
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
    let each_value_1 = Object.values(ctx[1].variables);
    let each_blocks_1 = [];
    for (let i = 0; i < each_value_1.length; i += 1) {
        each_blocks_1[i] = create_each_block_1$2(get_each_context_1$2(ctx, each_value_1, i));
    }
    let each_value = ctx[6];
    let each_blocks = [];
    for (let i = 0; i < each_value.length; i += 1) {
        each_blocks[i] = create_each_block$7(get_each_context$7(ctx, each_value, i));
    }
    settingssubmitbutton = new SettingsSubmitButton({
        props: { setting: setting$3, data: ctx[1] }
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
      attr(label, "for", "CustomValues");
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
    p(ctx2, dirty) {
      if (dirty & 2) {
        each_value_1 = Object.values(ctx2[1].variables);
        let i;
        for (i = 0; i < each_value_1.length; i += 1) {
            const child_ctx = get_each_context_1$2(ctx2, each_value_1, i);
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
      if (dirty & 254) {
        each_value = ctx2[6];
        let i;
        for (i = 0; i < each_value.length; i += 1) {
            const child_ctx = get_each_context$7(ctx2, each_value, i);
          if (each_blocks[i]) {
            each_blocks[i].p(child_ctx, dirty);
          } else {
              each_blocks[i] = create_each_block$7(child_ctx);
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
        if (dirty & 2)
            settingssubmitbutton_changes.data = ctx2[1];
        settingssubmitbutton.$set(settingssubmitbutton_changes);
    },
        i(local) {
            if (current)
                return;
            transition_in(settingssubmitbutton.$$.fragment, local);
            current = true;
        },
        o(local) {
            transition_out(settingssubmitbutton.$$.fragment, local);
            current = false;
        },
        d(detaching) {
            if (detaching)
                detach(div3);
            destroy_each(each_blocks_1, detaching);
            destroy_each(each_blocks, detaching);
            destroy_component(settingssubmitbutton);
        }
    };
}
__name(create_default_slot$5, "create_default_slot$5");

function create_fragment$9(ctx) {
    let applicationshell;
    let updating_elementRoot;
    let current;

    function applicationshell_elementRoot_binding(value) {
        ctx[13](value);
    }

    __name(applicationshell_elementRoot_binding, "applicationshell_elementRoot_binding");
    let applicationshell_props = {
        $$slots: { default: [create_default_slot$5] },
        $$scope: { ctx }
    };
    if (ctx[0] !== void 0) {
        applicationshell_props.elementRoot = ctx[0];
    }
    applicationshell = new ApplicationShell({ props: applicationshell_props });
    binding_callbacks.push(() => bind(applicationshell, "elementRoot", applicationshell_elementRoot_binding));
    return {
        c() {
            create_component(applicationshell.$$.fragment);
        },
        m(target, anchor) {
            mount_component(applicationshell, target, anchor);
            current = true;
        },
        p(ctx2, [dirty]) {
            const applicationshell_changes = {};
            if (dirty & 8388670) {
                applicationshell_changes.$$scope = { dirty, ctx: ctx2 };
            }
            if (!updating_elementRoot && dirty & 1) {
                updating_elementRoot = true;
                applicationshell_changes.elementRoot = ctx2[0];
                add_flush_callback(() => updating_elementRoot = false);
            }
            applicationshell.$set(applicationshell_changes);
        },
        i(local) {
            if (current)
                return;
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

__name(create_fragment$9, "create_fragment$9");
const setting$3 = "advancement-rate";
function replaceStrAt(str, index, replacement, endLength) {
    if (index >= str.length) {
        return str.valueOf();
    }
    return str.substring(0, index) + replacement + str.substring(index + endLength);
}
__name(replaceStrAt, "replaceStrAt");
const click_handler = /* @__PURE__ */ __name((e) => {
  e.target.previousElementSibling.focus();
}, "click_handler");
const dblclick_handler = /* @__PURE__ */ __name((e) => {
  e.target.previousElementSibling.focus();
  e.target.previousElementSibling.select();
}, "dblclick_handler");

function instance$9($$self, $$props, $$invalidate) {
    let { elementRoot } = $$props;
    let data = game.settings.get("ard20", setting$3);
    let funcList = Object.getOwnPropertyNames(math);
    let formulaSet = {};
    let spanDiv = {};
    let formulaInput = {};
    let formulaSpan = {};
    let paramArr = ["attributes", "skills", "features"];
    for (let item of paramArr) {
        spanDiv[item] = "";
        formulaSet[item] = { set: /* @__PURE__ */ new Set(), check: false };
        formulaInput[item] = "";
        formulaSpan[item] = data.formulas[item];
    }
    onMount(async () => {
        for (let param of paramArr) {
            console.log(data.formulas[param], param);
            await validateInput(data.formulas[param], param);
        }
    });

    async function validateInput(val, type) {
        console.log(val, type, "ValidateInput function");
        $$invalidate(5, formulaSpan[type] = val, formulaSpan);
        let ind = 0;
        let checkArr = val.split(/[-./+\*,^\s\(\)]+/).map((item) => {
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
                    let lastSpan = formulaSpan[type].lastIndexOf("</span>") > 0 ? formulaSpan[type].lastIndexOf("</span>") + 8 : -1;
                    let wordLastIndex = item.index + formulaSpan[type].length - val.length;
                    $$invalidate(5, formulaSpan[type] = replaceStrAt(formulaSpan[type], Math.max(lastSpan, wordLastIndex), `<span style="color:red">${item.name}</span>`, item.name.length), formulaSpan);
                }
            }
        }
        $$invalidate(2, formulaSet[type].check = formulaSet[type].set.size > 0, formulaSet);
        await tick();
        changeDivPosition();
    }

    __name(validateInput, "validateInput");

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

    __name(changeDivPosition, "changeDivPosition");

    function input_input_handler(each_value_1, variable_index) {
        each_value_1[variable_index].shortName = this.value;
        $$invalidate(1, data);
    }

    __name(input_input_handler, "input_input_handler");
    const input_handler = /* @__PURE__ */ __name((param) => {
        validateInput(formulaInput[param].value, param);
    }, "input_handler");

    function input_binding($$value, param) {
        binding_callbacks[$$value ? "unshift" : "push"](() => {
            formulaInput[param] = $$value;
            $$invalidate(4, formulaInput);
        });
    }

    __name(input_binding, "input_binding");

    function input_input_handler_1(param) {
        data.formulas[param] = this.value;
        $$invalidate(1, data);
    }

    __name(input_input_handler_1, "input_input_handler_1");

    function div0_binding($$value, param) {
        binding_callbacks[$$value ? "unshift" : "push"](() => {
            spanDiv[param] = $$value;
            $$invalidate(3, spanDiv);
        });
    }

    __name(div0_binding, "div0_binding");

    function applicationshell_elementRoot_binding(value) {
        elementRoot = value;
        $$invalidate(0, elementRoot);
    }

    __name(applicationshell_elementRoot_binding, "applicationshell_elementRoot_binding");
    $$self.$$set = ($$props2) => {
        if ("elementRoot" in $$props2)
            $$invalidate(0, elementRoot = $$props2.elementRoot);
    };
    $$self.$$.update = () => {
        if ($$self.$$.dirty & 2) {
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

__name(instance$9, "instance$9");
class Advancement_rate_shell extends SvelteComponent {
  constructor(options) {
      super();
      init(this, options, instance$9, create_fragment$9, safe_not_equal, { elementRoot: 0 });
  }
  get elementRoot() {
    return this.$$.ctx[0];
  }
  set elementRoot(elementRoot) {
    this.$$set({ elementRoot });
    flush();
  }
}
__name(Advancement_rate_shell, "Advancement_rate_shell");
class AdvRateSettingsShim extends FormApplication {
  constructor(options = {}) {
    super({}, options);
    new AdvancementRateFormApp().render(true, { focus: true });
  }
  async _updateObject(event, formData) {
  }
  render() {
    this.close();
  }
}
__name(AdvRateSettingsShim, "AdvRateSettingsShim");
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
__name(AdvancementRateFormApp, "AdvancementRateFormApp");

function get_each_context$6(ctx, list, i) {
    const child_ctx = ctx.slice();
    child_ctx[12] = list[i];
    child_ctx[13] = list;
    child_ctx[14] = i;
    return child_ctx;
}

__name(get_each_context$6, "get_each_context$6");
function get_each_context_1$1(ctx, list, i) {
    const child_ctx = ctx.slice();
    child_ctx[15] = list[i];
    child_ctx[16] = list;
    child_ctx[17] = i;
    return child_ctx;
}
__name(get_each_context_1$1, "get_each_context_1$1");
function create_each_block_1$1(key_1, ctx) {
    let div;
    let input;
    let t;
    let button;
    let mounted;
    let dispose;

    function input_input_handler() {
        ctx[4].call(input, ctx[16], ctx[17]);
    }

    __name(input_input_handler, "input_input_handler");

    function click_handler2() {
        return ctx[5](ctx[15]);
    }

    __name(click_handler2, "click_handler");
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
            set_input_value(input, ctx[15].name);
            append(div, t);
            append(div, button);
            if (!mounted) {
                dispose = [
                    listen(input, "input", input_input_handler),
                    listen(button, "click", click_handler2)
                ];
                mounted = true;
            }
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;
      if (dirty & 2 && input.value !== ctx[15].name) {
        set_input_value(input, ctx[15].name);
      }
    },
    d(detaching) {
      if (detaching)
        detach(div);
      mounted = false;
      run_all(dispose);
    }
  };
}
__name(create_each_block_1$1, "create_each_block_1$1");

function create_each_block$6(key_1, ctx) {
    let div;
    let input;
    let t;
    let button;
    let mounted;
    let dispose;

    function input_input_handler_1() {
        ctx[7].call(input, ctx[13], ctx[14]);
    }

    __name(input_input_handler_1, "input_input_handler_1");

    function click_handler_2() {
        return ctx[8](ctx[12]);
    }

    __name(click_handler_2, "click_handler_2");
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
            set_input_value(input, ctx[12].name);
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
            if (dirty & 2 && input.value !== ctx[12].name) {
                set_input_value(input, ctx[12].name);
            }
        },
        d(detaching) {
            if (detaching)
                detach(div);
            mounted = false;
            run_all(dispose);
        }
    };
}

__name(create_each_block$6, "create_each_block$6");
function create_default_slot$4(ctx) {
    let section;
    let div;
    let t0;
    let each_blocks_1 = [];
    let each0_lookup = /* @__PURE__ */ new Map();
    let t1;
    let button0;
    let t2;
    let hr;
    let t3;
    let each_blocks = [];
    let each1_lookup = /* @__PURE__ */ new Map();
    let t4;
    let button1;
    let t5;
    let settingssubmitbutton;
    let current;
    let mounted;
    let dispose;
    let each_value_1 = ctx[1].packs;
    const get_key = /* @__PURE__ */ __name((ctx2) => ctx2[15].id, "get_key");
    for (let i = 0; i < each_value_1.length; i += 1) {
        let child_ctx = get_each_context_1$1(ctx, each_value_1, i);
        let key = get_key(child_ctx);
        each0_lookup.set(key, each_blocks_1[i] = create_each_block_1$1(key, child_ctx));
    }
    let each_value = ctx[1].folders;
    const get_key_1 = /* @__PURE__ */ __name((ctx2) => ctx2[12].id, "get_key_1");
    for (let i = 0; i < each_value.length; i += 1) {
        let child_ctx = get_each_context$6(ctx, each_value, i);
        let key = get_key_1(child_ctx);
        each1_lookup.set(key, each_blocks[i] = create_each_block$6(key, child_ctx));
    }
  settingssubmitbutton = new SettingsSubmitButton({
    props: { setting: setting$2, data: ctx[1] }
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
          listen(button0, "click", ctx[6]),
          listen(button1, "click", ctx[9])
        ];
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (dirty & 10) {
          each_value_1 = ctx2[1].packs;
          each_blocks_1 = update_keyed_each(each_blocks_1, dirty, get_key, 1, ctx2, each_value_1, each0_lookup, div, destroy_block, create_each_block_1$1, t1, get_each_context_1$1);
      }
      if (dirty & 10) {
          each_value = ctx2[1].folders;
          each_blocks = update_keyed_each(each_blocks, dirty, get_key_1, 1, ctx2, each_value, each1_lookup, div, destroy_block, create_each_block$6, t4, get_each_context$6);
      }
      const settingssubmitbutton_changes = {};
      if (dirty & 2)
        settingssubmitbutton_changes.data = ctx2[1];
      settingssubmitbutton.$set(settingssubmitbutton_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(settingssubmitbutton.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(settingssubmitbutton.$$.fragment, local);
      current = false;
    },
    d(detaching) {
        if (detaching)
            detach(section);
        for (let i = 0; i < each_blocks_1.length; i += 1) {
            each_blocks_1[i].d();
        }
        for (let i = 0; i < each_blocks.length; i += 1) {
            each_blocks[i].d();
        }
        if (detaching)
            detach(t5);
        destroy_component(settingssubmitbutton, detaching);
        mounted = false;
        run_all(dispose);
    }
  };
}
__name(create_default_slot$4, "create_default_slot$4");

function create_fragment$8(ctx) {
    let applicationshell;
    let updating_elementRoot;
    let current;

    function applicationshell_elementRoot_binding(value) {
        ctx[10](value);
    }

    __name(applicationshell_elementRoot_binding, "applicationshell_elementRoot_binding");
    let applicationshell_props = {
        $$slots: { default: [create_default_slot$4] },
        $$scope: { ctx }
    };
    if (ctx[0] !== void 0) {
        applicationshell_props.elementRoot = ctx[0];
    }
    applicationshell = new ApplicationShell({ props: applicationshell_props });
    binding_callbacks.push(() => bind(applicationshell, "elementRoot", applicationshell_elementRoot_binding));
    return {
        c() {
            create_component(applicationshell.$$.fragment);
        },
        m(target, anchor) {
            mount_component(applicationshell, target, anchor);
            current = true;
        },
        p(ctx2, [dirty]) {
            const applicationshell_changes = {};
            if (dirty & 262146) {
                applicationshell_changes.$$scope = { dirty, ctx: ctx2 };
            }
            if (!updating_elementRoot && dirty & 1) {
                updating_elementRoot = true;
                applicationshell_changes.elementRoot = ctx2[0];
                add_flush_callback(() => updating_elementRoot = false);
            }
            applicationshell.$set(applicationshell_changes);
        },
        i(local) {
            if (current)
                return;
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

__name(create_fragment$8, "create_fragment$8");
const setting$2 = "feat";

function instance$8($$self, $$props, $$invalidate) {
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

    __name(addEntry, "addEntry");

    function deleteEntry(type, id) {
        console.log(type);
        const index = data[type].findIndex((entry) => entry.id === id);
        if (index >= 0) {
            console.log(data[type]);
            data[type].splice(index, 1);
            $$invalidate(1, data);
        }
    }

    __name(deleteEntry, "deleteEntry");

    function input_input_handler(each_value_1, pack_index) {
        each_value_1[pack_index].name = this.value;
        $$invalidate(1, data);
    }

    __name(input_input_handler, "input_input_handler");
    const click_handler2 = /* @__PURE__ */ __name((pack) => deleteEntry("packs", pack.id), "click_handler");
    const click_handler_1 = /* @__PURE__ */ __name(() => addEntry("packs"), "click_handler_1");

    function input_input_handler_1(each_value, folder_index) {
        each_value[folder_index].name = this.value;
        $$invalidate(1, data);
    }

    __name(input_input_handler_1, "input_input_handler_1");
    const click_handler_2 = /* @__PURE__ */ __name((folder) => deleteEntry("folders", folder.id), "click_handler_2");
    const click_handler_3 = /* @__PURE__ */ __name(() => addEntry("folders"), "click_handler_3");

    function applicationshell_elementRoot_binding(value) {
        elementRoot = value;
        $$invalidate(0, elementRoot);
    }

    __name(applicationshell_elementRoot_binding, "applicationshell_elementRoot_binding");
    $$self.$$set = ($$props2) => {
        if ("elementRoot" in $$props2)
            $$invalidate(0, elementRoot = $$props2.elementRoot);
        if ("data" in $$props2)
            $$invalidate(1, data = $$props2.data);
    };
    return [
        elementRoot,
        data,
        addEntry,
        deleteEntry,
        input_input_handler,
        click_handler2,
        click_handler_1,
        input_input_handler_1,
        click_handler_2,
        click_handler_3,
        applicationshell_elementRoot_binding
    ];
}

__name(instance$8, "instance$8");
class FeatSetting_shell extends SvelteComponent {
  constructor(options) {
      super();
      init(this, options, instance$8, create_fragment$8, safe_not_equal, { elementRoot: 0, data: 1 });
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
__name(FeatSetting_shell, "FeatSetting_shell");
class FeatSettingsShim extends FormApplication {
  constructor(options = {}) {
    super({}, options);
    new FeatSetting().render(true, { focus: true });
  }
  async _updateObject(event, formData) {
  }
  render() {
    this.close();
  }
}
__name(FeatSettingsShim, "FeatSettingsShim");
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
__name(FeatSetting, "FeatSetting");
const profSettingShell_svelte_svelte_type_style_lang = "";

function get_each_context$5(ctx, list, i) {
    const child_ctx = ctx.slice();
    child_ctx[21] = list[i];
    return child_ctx;
}

__name(get_each_context$5, "get_each_context$5");
function get_each_context_1(ctx, list, i) {
    const child_ctx = ctx.slice();
    child_ctx[24] = list[i];
    child_ctx[25] = list;
    child_ctx[26] = i;
    return child_ctx;
}
__name(get_each_context_1, "get_each_context_1");
function get_each_context_2(ctx, list, i) {
  const child_ctx = ctx.slice();
  child_ctx[27] = list[i];
  return child_ctx;
}
__name(get_each_context_2, "get_each_context_2");
function get_each_context_3(ctx, list, i) {
  const child_ctx = ctx.slice();
  child_ctx[21] = list[i];
  return child_ctx;
}
__name(get_each_context_3, "get_each_context_3");
function create_each_block_3(ctx) {
  let li;
  let span;
  let t0_value = ctx[21].label + "";
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
      attr(li, "class", li_class_value = null_to_empty(ctx[2] === ctx[21].id ? "active" : "") + " svelte-11ce50k");
    },
    m(target, anchor) {
      insert(target, li, anchor);
      append(li, span);
      append(span, t0);
      append(li, t1);
      if (!mounted) {
        dispose = listen(span, "click", function() {
          if (is_function(ctx[9](ctx[21].id)))
            ctx[9](ctx[21].id).apply(this, arguments);
        });
        mounted = true;
      }
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;
      if (dirty[0] & 2 && t0_value !== (t0_value = ctx[21].label + ""))
        set_data(t0, t0_value);
      if (dirty[0] & 1030 && li_class_value !== (li_class_value = null_to_empty(ctx[2] === ctx[21].id ? "active" : "") + " svelte-11ce50k")) {
        attr(li, "class", li_class_value);
      }
    },
    d(detaching) {
      if (detaching)
        detach(li);
      mounted = false;
      dispose();
    }
  };
}
__name(create_each_block_3, "create_each_block_3");

function create_if_block$3(ctx) {
    let div0;
    let button0;
    let t0;
    let t1_value = ctx[21].label + "";
    let t1;
    let t2;
    let button1;
    let t4;
    let button2;
    let t5;
    let t6_value = ctx[21].label + "";
    let t6;
    let t7;
    let hr;
    let t8;
    let div1;
    let each_blocks = [];
    let each_1_lookup = /* @__PURE__ */ new Map();
    let t9;
    let mounted;
    let dispose;

    function click_handler_2() {
        return ctx[13](ctx[21]);
    }

    __name(click_handler_2, "click_handler_2");

    function click_handler_3() {
        return ctx[14](ctx[21]);
    }

    __name(click_handler_3, "click_handler_3");

    function click_handler_4() {
        return ctx[15](ctx[21]);
    }

    __name(click_handler_4, "click_handler_4");
    let each_value_1 = ctx[21].value;
    const get_key = /* @__PURE__ */ __name((ctx2) => ctx2[24].id, "get_key");
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
      if (dirty[0] & 2 && t1_value !== (t1_value = ctx[21].label + ""))
        set_data(t1, t1_value);
      if (dirty[0] & 2 && t6_value !== (t6_value = ctx[21].label + ""))
        set_data(t6, t6_value);
      if (dirty[0] & 1282) {
          each_value_1 = ctx[21].value;
          each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_1, each_1_lookup, div1, destroy_block, create_each_block_1, t9, get_each_context_1);
      }
    },
    d(detaching) {
      if (detaching)
        detach(div0);
      if (detaching)
        detach(t7);
      if (detaching)
        detach(hr);
      if (detaching)
        detach(t8);
      if (detaching)
        detach(div1);
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].d();
      }
      mounted = false;
      run_all(dispose);
    }
  };
}

__name(create_if_block$3, "create_if_block$3");
function create_each_block_2(ctx) {
  let option;
  let t_value = localize(ctx[27][1]) + "";
  let t;
  let option_value_value;
  return {
    c() {
      option = element("option");
      t = text(t_value);
      option.__value = option_value_value = ctx[27][0];
      option.value = option.__value;
    },
    m(target, anchor) {
      insert(target, option, anchor);
      append(option, t);
    },
    p(ctx2, dirty) {
      if (dirty[0] & 2 && t_value !== (t_value = localize(ctx2[27][1]) + ""))
        set_data(t, t_value);
      if (dirty[0] & 1026 && option_value_value !== (option_value_value = ctx2[27][0])) {
        option.__value = option_value_value;
        option.value = option.__value;
      }
    },
    d(detaching) {
      if (detaching)
        detach(option);
    }
  };
}
__name(create_each_block_2, "create_each_block_2");
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
        ctx[16].call(input, ctx[25], ctx[26]);
    }

    __name(input_input_handler, "input_input_handler");
    let each_value_2 = Object.entries(ctx[10][ctx[21].id]);
    let each_blocks = [];
    for (let i = 0; i < each_value_2.length; i += 1) {
        each_blocks[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    }

    function select_change_handler() {
        ctx[17].call(select, ctx[25], ctx[26]);
    }

    __name(select_change_handler, "select_change_handler");

    function click_handler_5() {
        return ctx[18](ctx[24], ctx[21]);
    }

    __name(click_handler_5, "click_handler_5");
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
            if (ctx[24].type === void 0)
                add_render_callback(select_change_handler);
      attr(button, "class", "minus far fa-minus-square svelte-11ce50k");
      attr(div, "class", "flexrow");
      this.first = div;
    },
    m(target, anchor) {
      insert(target, div, anchor);
      append(div, input);
      set_input_value(input, ctx[24].name);
      append(div, t0);
      append(div, select);
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].m(select, null);
      }
      select_option(select, ctx[24].type);
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
      if (dirty[0] & 1026 && input.value !== ctx[24].name) {
        set_input_value(input, ctx[24].name);
      }
      if (dirty[0] & 1026) {
        each_value_2 = Object.entries(ctx[10][ctx[21].id]);
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
      if (dirty[0] & 1026) {
        select_option(select, ctx[24].type);
      }
    },
    d(detaching) {
      if (detaching)
        detach(div);
      destroy_each(each_blocks, detaching);
      mounted = false;
      run_all(dispose);
    }
  };
}
__name(create_each_block_1, "create_each_block_1");

function create_each_block$5(key_1, ctx) {
    let first;
    let if_block_anchor;
    let if_block = ctx[2] === ctx[21].id && create_if_block$3(ctx);
    return {
        key: key_1,
        first: null,
        c() {
            first = empty();
            if (if_block)
                if_block.c();
            if_block_anchor = empty();
            this.first = first;
        },
        m(target, anchor) {
            insert(target, first, anchor);
            if (if_block)
                if_block.m(target, anchor);
            insert(target, if_block_anchor, anchor);
        },
        p(new_ctx, dirty) {
            ctx = new_ctx;
            if (ctx[2] === ctx[21].id) {
                if (if_block) {
                    if_block.p(ctx, dirty);
                }
                else {
                    if_block = create_if_block$3(ctx);
                    if_block.c();
                    if_block.m(if_block_anchor.parentNode, if_block_anchor);
                }
            }
            else if (if_block) {
                if_block.d(1);
                if_block = null;
            }
        },
        d(detaching) {
            if (detaching)
                detach(first);
            if (if_block)
                if_block.d(detaching);
            if (detaching)
                detach(if_block_anchor);
        }
    };
}

__name(create_each_block$5, "create_each_block$5");
function create_default_slot$3(ctx) {
    let div0;
    let button0;
    let t1;
    let button1;
    let t3;
    let ul;
    let t4;
    let div1;
    let each_blocks = [];
    let each1_lookup = /* @__PURE__ */ new Map();
    let t5;
    let settingssubmitbutton;
    let current;
    let mounted;
    let dispose;
    let each_value_3 = Object.values(ctx[1]);
    let each_blocks_1 = [];
    for (let i = 0; i < each_value_3.length; i += 1) {
        each_blocks_1[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
    }
    let each_value = Object.values(ctx[1]);
    const get_key = /* @__PURE__ */ __name((ctx2) => ctx2[21], "get_key");
    for (let i = 0; i < each_value.length; i += 1) {
        let child_ctx = get_each_context$5(ctx, each_value, i);
        let key = get_key(child_ctx);
        each1_lookup.set(key, each_blocks[i] = create_each_block$5(key, child_ctx));
    }
    settingssubmitbutton = new SettingsSubmitButton({
        props: { setting: setting$1, data: ctx[1] }
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
          listen(button0, "click", ctx[11]),
          listen(button1, "click", ctx[12])
        ];
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (dirty[0] & 518) {
        each_value_3 = Object.values(ctx2[1]);
        let i;
        for (i = 0; i < each_value_3.length; i += 1) {
          const child_ctx = get_each_context_3(ctx2, each_value_3, i);
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
      if (dirty[0] & 1398) {
          each_value = Object.values(ctx2[1]);
          each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx2, each_value, each1_lookup, div1, destroy_block, create_each_block$5, null, get_each_context$5);
      }
      const settingssubmitbutton_changes = {};
      if (dirty[0] & 2)
        settingssubmitbutton_changes.data = ctx2[1];
      settingssubmitbutton.$set(settingssubmitbutton_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(settingssubmitbutton.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(settingssubmitbutton.$$.fragment, local);
      current = false;
    },
    d(detaching) {
        if (detaching)
            detach(div0);
        if (detaching)
            detach(t3);
        if (detaching)
            detach(ul);
        destroy_each(each_blocks_1, detaching);
        if (detaching)
            detach(t4);
        if (detaching)
            detach(div1);
        for (let i = 0; i < each_blocks.length; i += 1) {
            each_blocks[i].d();
        }
        if (detaching)
            detach(t5);
        destroy_component(settingssubmitbutton, detaching);
        mounted = false;
        run_all(dispose);
    }
  };
}
__name(create_default_slot$3, "create_default_slot$3");

function create_fragment$7(ctx) {
    let applicationshell;
    let updating_elementRoot;
    let current;

    function applicationshell_elementRoot_binding(value) {
        ctx[19](value);
    }

    __name(applicationshell_elementRoot_binding, "applicationshell_elementRoot_binding");
    let applicationshell_props = {
        $$slots: { default: [create_default_slot$3] },
        $$scope: { ctx }
    };
    if (ctx[0] !== void 0) {
        applicationshell_props.elementRoot = ctx[0];
    }
    applicationshell = new ApplicationShell({ props: applicationshell_props });
    binding_callbacks.push(() => bind(applicationshell, "elementRoot", applicationshell_elementRoot_binding));
    return {
        c() {
            create_component(applicationshell.$$.fragment);
        },
        m(target, anchor) {
            mount_component(applicationshell, target, anchor);
            current = true;
        },
        p(ctx2, dirty) {
            const applicationshell_changes = {};
            if (dirty[0] & 6 | dirty[1] & 2) {
                applicationshell_changes.$$scope = { dirty, ctx: ctx2 };
            }
            if (!updating_elementRoot && dirty[0] & 1) {
                updating_elementRoot = true;
                applicationshell_changes.elementRoot = ctx2[0];
                add_flush_callback(() => updating_elementRoot = false);
            }
            applicationshell.$set(applicationshell_changes);
        },
        i(local) {
            if (current)
                return;
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

__name(create_fragment$7, "create_fragment$7");
const setting$1 = "proficiencies";

function instance$7($$self, $$props, $$invalidate) {
    let data = game.settings.get("ard20", "proficiencies");
    console.log(data);

    function removeAllAll() {
        for (const item of Object.values(data)) {
            item.value = [];
        }
        console.log(data);
        $$invalidate(1, data);
    }

    __name(removeAllAll, "removeAllAll");

    function removeAll(type) {
        $$invalidate(1, data[type].value = [], data);
        $$invalidate(1, data);
    }

    __name(removeAll, "removeAll");

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

    __name(add, "add");

    function setDefaultGroup(type) {
        console.log([...game.settings.settings].filter((set) => set[0] === "ard20.proficiencies")[0][1].default);
        $$invalidate(
            1,
            data[type].value = [
                ...[...game.settings.settings].filter((set) => set[0] === "ard20.proficiencies")[0][1].default[type].value
            ],
            data
        );
        $$invalidate(1, data);
    }

    __name(setDefaultGroup, "setDefaultGroup");

    function setDefaultAll() {
        console.log([...game.settings.settings].filter((set) => set[0] === "ard20.proficiencies")[0][1].default);
        $$invalidate(1, data = duplicate([...game.settings.settings].filter((set) => set[0] === "ard20.proficiencies")[0][1].default));
    }

    __name(setDefaultAll, "setDefaultAll");

    function remove(key, type) {
        const index = data[type].value.findIndex((entry) => entry.id === key);
        if (index >= 0) {
            data[type].value.splice(index, 1);
            $$invalidate(1, data);
        }
    }

    __name(remove, "remove");
    let { elementRoot } = $$props;
    let activeTabValue = "weapon";
    const handleClick = /* @__PURE__ */ __name((tabValue) => () => $$invalidate(2, activeTabValue = tabValue), "handleClick");
    let selectArr = {
        weapon: ARd20.WeaponType,
        armor: {
            light: "light",
            medium: "medium",
            heavy: "heavy"
        },
        tool: {}
    };
    const click_handler2 = /* @__PURE__ */ __name(() => removeAllAll(), "click_handler");
    const click_handler_1 = /* @__PURE__ */ __name(() => setDefaultAll(), "click_handler_1");
    const click_handler_2 = /* @__PURE__ */ __name((item) => add(item.id), "click_handler_2");
    const click_handler_3 = /* @__PURE__ */ __name((item) => setDefaultGroup(item.id), "click_handler_3");
    const click_handler_4 = /* @__PURE__ */ __name((item) => removeAll(item.id), "click_handler_4");

    function input_input_handler(each_value_1, entry_index) {
        each_value_1[entry_index].name = this.value;
        $$invalidate(1, data);
        $$invalidate(10, selectArr);
    }

    __name(input_input_handler, "input_input_handler");

    function select_change_handler(each_value_1, entry_index) {
        each_value_1[entry_index].type = select_value(this);
        $$invalidate(1, data);
        $$invalidate(10, selectArr);
    }

    __name(select_change_handler, "select_change_handler");
    const click_handler_5 = /* @__PURE__ */ __name((entry, item) => remove(entry.id, item.id), "click_handler_5");

    function applicationshell_elementRoot_binding(value) {
        elementRoot = value;
        $$invalidate(0, elementRoot);
    }

    __name(applicationshell_elementRoot_binding, "applicationshell_elementRoot_binding");
    $$self.$$set = ($$props2) => {
        if ("elementRoot" in $$props2)
            $$invalidate(0, elementRoot = $$props2.elementRoot);
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
        click_handler2,
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

__name(instance$7, "instance$7");
class ProfSetting_shell extends SvelteComponent {
  constructor(options) {
      super();
      init(this, options, instance$7, create_fragment$7, safe_not_equal, { elementRoot: 0 }, null, [-1, -1]);
  }
  get elementRoot() {
    return this.$$.ctx[0];
  }
  set elementRoot(elementRoot) {
    this.$$set({ elementRoot });
    flush();
  }
}
__name(ProfSetting_shell, "ProfSetting_shell");
class ProfSettingsShim extends FormApplication {
  constructor(options = {}) {
    super({}, options);
    new ProfSetting().render(true, { focus: true });
  }
  async _updateObject(event, formData) {
  }
  render() {
    this.close();
  }
}
__name(ProfSettingsShim, "ProfSettingsShim");
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

__name(ProfSetting, "ProfSetting");

function get_each_context$4(ctx, list, i) {
    const child_ctx = ctx.slice();
    child_ctx[9] = list[i];
    child_ctx[10] = list;
    child_ctx[11] = i;
    return child_ctx;
}

__name(get_each_context$4, "get_each_context$4");

function create_each_block$4(ctx) {
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
        ctx[4].call(input0, ctx[10], ctx[11]);
    }

    __name(input0_input_handler, "input0_input_handler");

    function input1_input_handler() {
        ctx[5].call(input1, ctx[10], ctx[11]);
    }

    __name(input1_input_handler, "input1_input_handler");

    function click_handler2() {
        return ctx[6](ctx[9]);
    }

    __name(click_handler2, "click_handler");
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
            set_input_value(input0, ctx[9].key);
            append(div, t2);
            append(div, label1);
            append(div, t4);
            append(div, input1);
            set_input_value(input1, ctx[9].label);
            append(div, t5);
            append(div, button);
            if (!mounted) {
                dispose = [
                    listen(input0, "input", input0_input_handler),
                    listen(input1, "input", input1_input_handler),
                    listen(button, "click", click_handler2)
                ];
                mounted = true;
            }
        },
        p(new_ctx, dirty) {
            ctx = new_ctx;
            if (dirty & 2 && input0.value !== ctx[9].key) {
                set_input_value(input0, ctx[9].key);
            }
            if (dirty & 2 && input1.value !== ctx[9].label) {
                set_input_value(input1, ctx[9].label);
            }
        },
        d(detaching) {
            if (detaching)
                detach(div);
            mounted = false;
            run_all(dispose);
        }
    };
}

__name(create_each_block$4, "create_each_block$4");

function create_default_slot$2(ctx) {
    let button;
    let t1;
    let t2;
    let settingssubmitbutton;
    let current;
    let mounted;
    let dispose;
    let each_value = ctx[1];
    let each_blocks = [];
    for (let i = 0; i < each_value.length; i += 1) {
        each_blocks[i] = create_each_block$4(get_each_context$4(ctx, each_value, i));
    }
    settingssubmitbutton = new SettingsSubmitButton({
        props: { setting, data: ctx[1] }
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
        dispose = listen(button, "click", ctx[2]);
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (dirty & 10) {
        each_value = ctx2[1];
        let i;
        for (i = 0; i < each_value.length; i += 1) {
            const child_ctx = get_each_context$4(ctx2, each_value, i);
          if (each_blocks[i]) {
            each_blocks[i].p(child_ctx, dirty);
          } else {
              each_blocks[i] = create_each_block$4(child_ctx);
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
      if (dirty & 2)
        settingssubmitbutton_changes.data = ctx2[1];
      settingssubmitbutton.$set(settingssubmitbutton_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(settingssubmitbutton.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(settingssubmitbutton.$$.fragment, local);
      current = false;
    },
    d(detaching) {
        if (detaching)
            detach(button);
        if (detaching)
            detach(t1);
        destroy_each(each_blocks, detaching);
        if (detaching)
            detach(t2);
        destroy_component(settingssubmitbutton, detaching);
        mounted = false;
        dispose();
    }
  };
}
__name(create_default_slot$2, "create_default_slot$2");

function create_fragment$6(ctx) {
    let applicationshell;
    let updating_elementRoot;
    let current;

    function applicationshell_elementRoot_binding(value) {
        ctx[7](value);
    }

    __name(applicationshell_elementRoot_binding, "applicationshell_elementRoot_binding");
    let applicationshell_props = {
        $$slots: { default: [create_default_slot$2] },
        $$scope: { ctx }
    };
    if (ctx[0] !== void 0) {
        applicationshell_props.elementRoot = ctx[0];
    }
    applicationshell = new ApplicationShell({ props: applicationshell_props });
    binding_callbacks.push(() => bind(applicationshell, "elementRoot", applicationshell_elementRoot_binding));
    return {
        c() {
            create_component(applicationshell.$$.fragment);
        },
        m(target, anchor) {
            mount_component(applicationshell, target, anchor);
            current = true;
        },
        p(ctx2, [dirty]) {
            const applicationshell_changes = {};
            if (dirty & 4098) {
                applicationshell_changes.$$scope = { dirty, ctx: ctx2 };
            }
            if (!updating_elementRoot && dirty & 1) {
                updating_elementRoot = true;
                applicationshell_changes.elementRoot = ctx2[0];
                add_flush_callback(() => updating_elementRoot = false);
            }
            applicationshell.$set(applicationshell_changes);
        },
        i(local) {
            if (current)
                return;
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

__name(create_fragment$6, "create_fragment$6");
const setting = "profLevel";

function instance$6($$self, $$props, $$invalidate) {
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

    __name(addEntry, "addEntry");

    function deleteEntry(id) {
        const index = data.findIndex((entry) => entry.id === id);
        if (index >= 0) {
            data.splice(index, 1);
            $$invalidate(1, data);
        }
    }

    __name(deleteEntry, "deleteEntry");

    function input0_input_handler(each_value, setting_index) {
        each_value[setting_index].key = this.value;
        $$invalidate(1, data);
    }

    __name(input0_input_handler, "input0_input_handler");

    function input1_input_handler(each_value, setting_index) {
        each_value[setting_index].label = this.value;
        $$invalidate(1, data);
    }

    __name(input1_input_handler, "input1_input_handler");
    const click_handler2 = /* @__PURE__ */ __name((setting2) => {
        deleteEntry(setting2.id);
    }, "click_handler");

    function applicationshell_elementRoot_binding(value) {
        elementRoot = value;
        $$invalidate(0, elementRoot);
    }

    __name(applicationshell_elementRoot_binding, "applicationshell_elementRoot_binding");
    $$self.$$set = ($$props2) => {
        if ("elementRoot" in $$props2)
            $$invalidate(0, elementRoot = $$props2.elementRoot);
    };
    return [
        elementRoot,
        data,
        addEntry,
        deleteEntry,
        input0_input_handler,
        input1_input_handler,
        click_handler2,
        applicationshell_elementRoot_binding
    ];
}

__name(instance$6, "instance$6");
class ProfLevelSetting_shell extends SvelteComponent {
  constructor(options) {
      super();
      init(this, options, instance$6, create_fragment$6, safe_not_equal, { elementRoot: 0 });
  }
  get elementRoot() {
    return this.$$.ctx[0];
  }
  set elementRoot(elementRoot) {
    this.$$set({ elementRoot });
    flush();
  }
}
__name(ProfLevelSetting_shell, "ProfLevelSetting_shell");
class ProfLevelSettingShim extends FormApplication {
  constructor(options = {}) {
    super({}, options);
    new ProfLevelSetting().render(true, { focus: true });
  }
  async _updateObject(event, formData) {
  }
  render() {
    this.close();
  }
}
__name(ProfLevelSettingShim, "ProfLevelSettingShim");
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
__name(ProfLevelSetting, "ProfLevelSetting");
const registerSystemSettings = /* @__PURE__ */ __name(function() {
  game.settings.register("ard20", "proficiencies", {
    scope: "world",
    config: false,
    default: {
      weapon: {
        label: "weapon",
        id: "weapon",
        value: [
            { name: "Punch Dagger", type: "amb", id: "Punch Dagger" },
            { name: "Whip Dagger", type: "amb", id: "Whip Dagger" },
            { name: "Gauntlet", type: "amb", id: "Gauntlet" },
            { name: "Hidden Blade", type: "amb", id: "Hidden Blade" },
            { name: "Knucke Axe", type: "amb", id: "Knucke Axe" },
            { name: "Side Baton", type: "amb", id: "Side Baton" },
            { name: "Unarmed strike", type: "amb", id: "Unarmed strike" },
            { name: "Battle Axe", type: "axe", id: "Battle Axe" },
            { name: "Great Axe", type: "axe", id: "Great Axe" },
            { name: "Handaxe", type: "axe", id: "Handaxe" },
            { name: "Hook Sword", type: "axe", id: "Hook Sword" },
            { name: "Khopesh", type: "axe", id: "Khopesh" },
            { name: "Poleaxe", type: "axe", id: "Poleaxe" },
            { name: "Tomahawk", type: "axe", id: "Tomahawk" },
            { name: "Great club", type: "blu", id: "Great club" },
            { name: "Heavy club", type: "blu", id: "Heavy club" },
            { name: "Light Club", type: "blu", id: "Light Club" }
        ]
      },
        armor: { label: "armor", id: "armor", value: [] },
        tool: { label: "tool", id: "tool", value: [] }
    },
      onChange: (value) => {
          console.log("\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0430 \u0438\u0437\u043C\u0435\u043D\u0438\u043B\u0430\u0441\u044C ", value);
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
      onChange: (value) => {
          console.log("\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0430 \u0438\u0437\u043C\u0435\u043D\u0438\u043B\u0430\u0441\u044C", value);
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
      onChange: (value) => {
          console.log("\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0430 \u0438\u0437\u043C\u0435\u043D\u0438\u043B\u0430\u0441\u044C", value);
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
    default: [
      { key: "untrained", label: "Untrained", id: "untrained" },
      { key: "trained", label: "Trained", id: "trained" },
      { key: "expert", label: "Expert", id: "expert" },
      { key: "master", label: "Master", id: "master" },
      { key: "legend", label: "Legend", id: "legend" }
    ]
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
      "1d20": "1d20",
      "2d10": "2d10",
      "3d6": "3d6"
    },
    config: true,
    default: "1d20",
    type: String,
    name: "Main dice-roll type",
    hint: "chose main dice mechanic between 1d20, 2d10 and 3d6"
  });
  game.settings.register("ard20", "actionMouseRewrite", {
    config: false,
    type: Boolean,
    default: false,
    scope: "client"
  });
}, "registerSystemSettings");
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
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "weapons" }]
    });
  }
  getData() {
    const sheetData = {
      proficiencies: game.settings.get("ard20", "proficiencies"),
      config: CONFIG.ARd20
    };
    return sheetData;
  }
  activateListeners(html) {
    super.activateListeners(html);
    html.find(".add").click(this._onAdd.bind(this));
    html.find(".minus").click(this._Delete.bind(this));
  }
  async _onAdd(event) {
    event.preventDefault();
    const proficiencies = game.settings.get("ard20", "proficiencies");
    proficiencies.weapon.push({ name: "name", type: "amb" });
    await game.settings.set("ard20", "proficiencies", proficiencies);
    this.render();
  }
  async _Delete(event) {
    event.preventDefault();
    const proficiencies = game.settings.get("ard20", "proficiencies");
    proficiencies.weapon.splice(event.currentTarget.dataset.key, 1);
    await game.settings.set("ard20", "proficiencies", proficiencies);
    this.render();
  }
  async _updateObject(event, formData) {
      const proficiencies = game.settings.get("ard20", "proficiencies");
      console.log(formData);
      let dirty = false;
      for (let [fieldName, value] of Object.entries(foundry.utils.flattenObject(formData))) {
          const [type, index, propertyName] = fieldName.split(".");
          if (proficiencies[type][index][propertyName] !== value) {
              proficiencies[type][index][propertyName] = value;
              dirty = dirty || true;
          }
          if (dirty) {
              await game.settings.set("ard20", "proficiencies", proficiencies);
          }
      }
  }
}
__name(ProfFormApp, "ProfFormApp");
function create_default_slot$1(ctx) {
    let switch_instance;
    let switch_instance_anchor;
    let current;
    var switch_value = DocTemplate.get(ctx[2]);

    function switch_props(ctx2) {
        return {};
    }

    __name(switch_props, "switch_props");
    if (switch_value) {
        switch_instance = new switch_value(switch_props());
    }
    return {
        c() {
            if (switch_instance)
                create_component(switch_instance.$$.fragment);
            switch_instance_anchor = empty();
        },
        m(target, anchor) {
            if (switch_instance) {
                mount_component(switch_instance, target, anchor);
            }
            insert(target, switch_instance_anchor, anchor);
            current = true;
        },
        p(ctx2, dirty) {
            if (switch_value !== (switch_value = DocTemplate.get(ctx2[2]))) {
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
            if (current)
                return;
            if (switch_instance)
                transition_in(switch_instance.$$.fragment, local);
            current = true;
        },
        o(local) {
            if (switch_instance)
                transition_out(switch_instance.$$.fragment, local);
            current = false;
        },
        d(detaching) {
            if (detaching)
                detach(switch_instance_anchor);
            if (switch_instance)
                destroy_component(switch_instance, detaching);
        }
    };
}
__name(create_default_slot$1, "create_default_slot$1");

function create_fragment$5(ctx) {
    let applicationshell;
    let updating_elementRoot;
    let current;

    function applicationshell_elementRoot_binding(value) {
        ctx[3](value);
    }

    __name(applicationshell_elementRoot_binding, "applicationshell_elementRoot_binding");
    let applicationshell_props = {
        $$slots: { default: [create_default_slot$1] },
        $$scope: { ctx }
    };
    if (ctx[0] !== void 0) {
        applicationshell_props.elementRoot = ctx[0];
    }
    applicationshell = new ApplicationShell({ props: applicationshell_props });
    binding_callbacks.push(() => bind(applicationshell, "elementRoot", applicationshell_elementRoot_binding));
    return {
        c() {
            create_component(applicationshell.$$.fragment);
        },
        m(target, anchor) {
            mount_component(applicationshell, target, anchor);
            current = true;
        },
        p(ctx2, [dirty]) {
            const applicationshell_changes = {};
            if (dirty & 20) {
                applicationshell_changes.$$scope = { dirty, ctx: ctx2 };
            }
            if (!updating_elementRoot && dirty & 1) {
                updating_elementRoot = true;
                applicationshell_changes.elementRoot = ctx2[0];
                add_flush_callback(() => updating_elementRoot = false);
            }
            applicationshell.$set(applicationshell_changes);
        },
        i(local) {
            if (current) {
                return;
            }
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

__name(create_fragment$5, "create_fragment$5");

function instance$5($$self, $$props, $$invalidate) {
    let $storeDoc, $$unsubscribe_storeDoc = noop,
        $$subscribe_storeDoc = /* @__PURE__ */ __name(() => ($$unsubscribe_storeDoc(), $$unsubscribe_storeDoc = subscribe(storeDoc, ($$value) => $$invalidate(2, $storeDoc = $$value)), storeDoc), "$$subscribe_storeDoc");
    $$self.$$.on_destroy.push(() => $$unsubscribe_storeDoc());
    let { elementRoot } = $$props;
    let { storeDoc } = $$props;
    $$subscribe_storeDoc();
    setContext("DocumentSheetObject", storeDoc);

    function applicationshell_elementRoot_binding(value) {
        elementRoot = value;
        $$invalidate(0, elementRoot);
    }

    __name(applicationshell_elementRoot_binding, "applicationshell_elementRoot_binding");
    $$self.$$set = ($$props2) => {
        if ("elementRoot" in $$props2) {
            $$invalidate(0, elementRoot = $$props2.elementRoot);
        }
        if ("storeDoc" in $$props2) {
            $$subscribe_storeDoc($$invalidate(1, storeDoc = $$props2.storeDoc));
        }
    };
    return [elementRoot, storeDoc, $storeDoc, applicationshell_elementRoot_binding];
}

__name(instance$5, "instance$5");

class DocumentShell extends SvelteComponent {
    constructor(options) {
        super();
        init(this, options, instance$5, create_fragment$5, safe_not_equal, { elementRoot: 0, storeDoc: 1 });
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

__name(DocumentShell, "DocumentShell");

class SvelteDocumentSheet extends SvelteApplication {
    #storeDoc = new TJSDocument(void 0, { delete: this.close.bind(this) });
    #storeUnsubscribe;

    constructor(object) {
        super(object);
        Object.defineProperty(this.reactive, "document", {
            get: () => this.#storeDoc.get(),
            set: (document2) => {
                this.#storeDoc.set(document2);
            }
        });
        this.reactive.document = object;
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            title: "No Document Assigned",
            width: 800,
            height: 600,
            resizable: true,
            minimizable: true,
            dragDrop: [{ dragSelector: ".directory-list .item", dropSelector: null }],
            svelte: {
                class: DocumentShell,
                target: document.body,
                props: function () {
                    return { storeDoc: this.#storeDoc };
                }
            }
        });
    }

    _getHeaderButtons() {
        const buttons = super._getHeaderButtons();
        buttons.unshift({
            class: "configure-sheet",
            icon: "fas fa-cog",
            title: "Open sheet configurator",
            onclick: (ev) => this._onCofigureSheet(ev)
        });
        const canConfigure = game.user.isGM || this.reactive.document.isOwner && game.user.can("TOKEN_CONFIGURE");
        if (this.reactive.document.documentName === "Actor") {
            if (canConfigure) {
                buttons.splice(1, 0, {
                    label: this.token ? "Token" : "TOKEN.TitlePrototype",
                    class: "configure-token",
                    icon: "fas fa-user-circle",
                    onclick: (ev) => this._onConfigureToken(ev)
                });
            }
            buttons.unshift({
                class: "character-progress",
                title: "Character Advancement",
                label: "Character Advancement",
                icon: "fa-solid fa-book-sparkles",
                onclick: async (ev) => await this._onCharacterAdvancement(ev)
            });
        }
        return buttons;
    }

    _canDragStart(selector) {
        return true;
    }

    _canDragDrop(selector) {
        return this.reactive.document.isOwner || game.user.isGM;
    }

    _onDragOver(event) {
    }

    _onDragStart(event) {
        {
            const li = event.currentTarget;
            if (event.target.classList.contains("content-link")) {
                return;
            }
            let dragData;
            if (li.dataset.itemId) {
                const item = this.actor.items.get(li.dataset.itemId);
                dragData = item.toDragData();
            }
            if (li.dataset.effectId) {
                const effect = this.actor.effects.get(li.dataset.effectId);
                dragData = effect.toDragData();
            }
            if (!dragData) {
                return;
            }
            event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
        }
    }

    async _onDrop(event) {
        if (this.reactive.document.documentName !== "Actor") {
            return;
        }
        const data = TextEditor.getDragEventData(event);
        const actor = this.reactive.document;
        const allowed = Hooks.call("dropActorSheetData", actor, this, data);
        if (allowed === false) {
            return;
        }
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
        if (!actor.isOwner || !effect) {
            return false;
        }
        if (actor.uuid === effect.parent.uuid) {
            return false;
        }
        return ActiveEffect.create(effect.toObject(), { parent: actor });
    }

    async _onDropActor(event, data, actor) {
        if (!actor.isOwner) {
            return false;
        }
    }

    async _onDropItem(event, data, actor) {
        if (!actor.isOwner) {
            return false;
        }
        const item = await Item.implementation.fromDropData(data);
        const itemData = item.toObject();
        if (actor.uuid === item.parent?.uuid) {
            return this._onSortItem(event, itemData, actor);
        }
        return this._onDropItemCreate(itemData, actor);
  }
  async _onDropFolder(event, data, actor) {
    if (!actor.isOwner) {
      return [];
    }
    if (data.documentName !== "Item") {
      return [];
    }
    const folder = await Folder.implementation.fromDropData(data);
    if (!folder) {
      return [];
    }
    return this._onDropItemCreate(
      folder.contents.map((item) => {
        return game.items.fromCompendium(item);
      })
    );
  }
  async _onDropItemCreate(itemData, actor) {
    itemData = itemData instanceof Array ? itemData : [itemData];
    return actor.createEmbeddedDocuments("Item", itemData);
  }
  _onSortItem(event, itemData, actor) {
    const items = actor.items;
    const source = items.get(itemData._id);
    const dropTarget = event.target.closest("[data-item-id]");
    const target = items.get(dropTarget.dataset.itemId);
    if (source.id === target.id) {
      return;
    }
    const siblings = [];
    for (let el of dropTarget.parentElement.children) {
      const siblingId = el.dataset.itemId;
      if (siblingId && siblingId !== source.id) {
        siblings.push(items.get(el.dataset.itemId));
      }
    }
    const sortUpdates = SortingHelpers.performIntegerSort(source, { target, siblings });
    const updateData = sortUpdates.map((u) => {
      const update2 = u.update;
      update2._id = u.target.data._id;
      return update2;
    });
    return actor.updateEmbeddedDocuments("Item", updateData);
  }
  _onCofigureSheet(event) {
    if (event) {
      event.preventDefault();
    }
    new DocumentSheetConfig(this.reactive.document, {
      top: this.position.top + 40,
      left: this.position.left + (this.position.width - SvelteDocumentSheet.defaultOptions.width) / 2
    }).render(true);
  }
  _onConfigureToken(event) {
    if (event) {
      event.preventDefault();
    }
    const actor = this.reactive.document;
    const token = actor.isToken ? actor.token : actor.prototypeToken;
    new CONFIG.Token.prototypeSheetClass(token, {
      left: Math.max(this.position.left - 560 - 10, 10),
      top: this.position.top
    }).render(true);
  }
  async _onCharacterAdvancement(event) {
    if (event) {
      event.preventDefault();
    }
    const actor = this.reactive.document;
    async function createAditionalData() {
      async function getPacks() {
        let pack_list = [];
        let pack_name = [];
        for (const val of game.settings.get("ard20", "feat").packs) {
          if (game.packs.filter((pack) => pack.metadata.label === val.name).length !== 0) {
            let feat_list = [];
            feat_list.push(Array.from(game.packs.filter((pack) => pack.metadata.label === val.name && pack.documentName === "Item")[0].index));
            feat_list = feat_list.flat();
            for (const feat of feat_list) {
              const new_key = game.packs.filter((pack) => pack.metadata.label === val.name)[0].metadata.package + "." + val.name;
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
      __name(getPacks, "getPacks");
      function getFolders() {
        let folder_list = [];
        let folder_name = [];
        for (let val of game.settings.get("ard20", "feat").folders) {
          if (game.folders.filter((folder) => folder.data.name === val.name).length !== 0) {
            let feat_list = [];
            feat_list.push(game.folders.filter((folder) => folder.data.name === val.name && folder.data.type === "Item")[0].contents);
            feat_list = feat_list.flat();
            for (let feat of feat_list) {
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
      __name(getFolders, "getFolders");
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
        pack_list.forEach((item) => {
          if (item.type === "race") {
            let raceItem = { ...item, chosen: false };
            race_pack_list.push(raceItem);
          }
        });
        folder_list.forEach((item) => {
          if (item.type === "race") {
            let raceItem = { ...item, chosen: false };
            race_folder_list.push(raceItem);
          }
        });
        return race_pack_list.concat(race_folder_list.filter((item) => !pack_name.includes(item.name)));
      }
      __name(getRacesList, "getRacesList");
      async function getFeaturesList() {
        const pack = await getPacks();
        const pack_list = pack.pack_list;
        const pack_name = pack.pack_name;
        const folder = getFolders();
        const folder_list = folder.folder_list;
        let feat_pack_list = [];
        pack_list.forEach((item) => {
          if (item.type === "feature") {
            let FeatureItem = { ...item };
            feat_pack_list.push(FeatureItem);
          }
        });
        let feat_folder_list = [];
        folder_list.forEach((item) => {
          if (item.type === "feature") {
            let FeatureItem = { ...item };
            feat_folder_list.push(FeatureItem);
          }
        });
        let temp_feat_list = feat_pack_list.concat(feat_folder_list.filter((item) => !pack_name.includes(item.name)));
        let learnedFeatures = [];
        actor.itemTypes.feature.forEach((item) => {
            if (item.type === "feature") {
                let FeatureItem = { ...item };
                learnedFeatures.push(FeatureItem);
            }
        });
        return { temp_feat_list, learnedFeatures };
      }
      __name(getFeaturesList, "getFeaturesList");
      for (let i of featList.learnedFeatures) {
        name_array.push(i.name);
      }
      featList.temp_feat_list.forEach((v, k) => {
        if (name_array.includes(v.name)) {
          featList.temp_feat_list[k] = foundry.utils.deepClone(featList.learnedFeatures.filter((item) => item.name === v.name)[0]);
        }
      });
      featList.temp_feat_list = featList.temp_feat_list.filter((item) => {
        if (item.type === "feature") {
            return !name_array.includes(item.name) || item.system.level.current !== item.system.level.max;
        }
      });
      const obj = {
        races: { list: raceList, chosen: "" },
        count: {
          skills: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 },
          feats: { mar: 0, mag: 0, div: 0, pri: 0, psy: 0 }
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
    __name(createAditionalData, "createAditionalData");
    const document2 = {
      actor,
      aditionalData: await createAditionalData()
    };
    new CharacterAdvancement(document2).render(true, { focus: true });
  }
  async close(options = {}) {
    await super.close(options);
    if (this.#storeUnsubscribe) {
      this.#storeUnsubscribe();
      this.#storeUnsubscribe = void 0;
    }
  }
  async #handleDocUpdate(doc, options) {
    const { action, data, documentType } = options;
    if ((action === void 0 || action === "update" || action === "subscribe") && doc) {
        this.reactive.title = doc?.isToken ? `[Token] ${doc?.name}` : doc?.name ?? "No Document Assigned";
    }
  }
  render(force = false, options = {}) {
      if (!this.#storeUnsubscribe) {
          this.#storeUnsubscribe = this.#storeDoc.subscribe(this.#handleDocUpdate.bind(this));
      }
      console.log(this.reactive.document);
      super.render(force, options);
      return this;
  }

    addToFavorite(item) {
        const doc = this.reactive.document;
        const uuid = item.uuid;
        if (doc.documentName !== "Actor") {
            return;
        }
        let favorites = doc.system.favorites;
        favorites.push(uuid);
        doc.update({ "system.favorites": favorites });
    }

    async createEmbeddedItem(type) {
        const doc = this.reactive.document;
        if (doc.documentName !== "Actor") {
            return;
        }
        const itemNumber = doc.itemTypes[type].filter((document2) => {
            return document2.name.slice(0, type.length + 6) === `New ${type} #`;
        }).length;
        await Item.create([{ name: `New ${type} #${itemNumber + 1}`, type }], { parent: doc });
    }

    deleteEmbeddedItem(item) {
        item.delete();
    }

    showEmbeddedItem(item) {
        item.sheet.render(true);
    }

    async updateDocument(path, value) {
        const document2 = this.reactive.document;
        const update2 = {};
        update2[path] = value;
        await document2.update(update2);
    }
}
__name(SvelteDocumentSheet, "SvelteDocumentSheet");
class ARd20TokenDocument extends TokenDocument {
  get isTargeted() {
    return this.object.isTargeted;
  }
  _onUpdateBaseActor(update2 = {}, options = {}) {
      if (!this.isLinked) {
          update2 = foundry.utils.mergeObject(update2, this.actorData, {
              insertKeys: false,
              insertValues: false,
              inplace: false
          });
          this.actor.updateSource(update2, options);
      }
      const c = this.combatant;
      if (c && foundry.utils.hasProperty(update2.system || {}, game.combat.settings.resource)) {
          c.updateResource();
          ui.combat.render();
      }
      if (this.parent.isView) {
          this.object.drawBars();
          if ("effects" in update2) {
              this.object.drawEffects();
          }
      }
  }
}
__name(ARd20TokenDocument, "ARd20TokenDocument");
const TargetComponent_svelte_svelte_type_style_lang = "";

function create_fragment$4(ctx) {
    let div;
    let img;
    let img_src_value;
    let t0;
    let span;
    return {
        c() {
            div = element("div");
            img = element("img");
            t0 = space();
            span = element("span");
            span.textContent = `${ctx[0]}`;
            if (!src_url_equal(img.src, img_src_value = ctx[1]))
                attr(img, "src", img_src_value);
            attr(img, "alt", "token image");
            attr(img, "class", "svelte-1yukstj");
            attr(span, "class", "svelte-1yukstj");
            attr(div, "class", "target svelte-1yukstj");
        },
        m(target, anchor) {
            insert(target, div, anchor);
            append(div, img);
            append(div, t0);
            append(div, span);
        },
        p: noop,
        i: noop,
        o: noop,
        d(detaching) {
            if (detaching)
                detach(div);
        }
    };
}

__name(create_fragment$4, "create_fragment$4");
function getToken(uuid) {
    const token = fromUuidSync(uuid);
    if (token) {
        return { name: token.name, src: token.texture.src };
    }
}
__name(getToken, "getToken");

function instance$4($$self, $$props, $$invalidate) {
    let { uuid } = $$props;
    const { name, src } = getToken(uuid);
    $$self.$$set = ($$props2) => {
        if ("uuid" in $$props2)
            $$invalidate(2, uuid = $$props2.uuid);
    };
    return [name, src, uuid];
}

__name(instance$4, "instance$4");

class TargetComponent extends SvelteComponent {
    constructor(options) {
        super();
        init(this, options, instance$4, create_fragment$4, safe_not_equal, { uuid: 2 });
    }

    get uuid() {
        return this.$$.ctx[2];
    }

    set uuid(uuid) {
        this.$$set({ uuid });
        flush();
    }
}

__name(TargetComponent, "TargetComponent");

function get_each_context$3(ctx, list, i) {
    const child_ctx = ctx.slice();
    child_ctx[3] = list[i];
    return child_ctx;
}

__name(get_each_context$3, "get_each_context$3");

function create_else_block(ctx) {
    let div4;
    let div3;
    let div0;
    let t0;
    let t1;
    let div1;
    let t2;
    let div2;
    let t3_value = ctx[0].total + "";
    let t3;
    let each_value = ctx[0].tooltip;
    let each_blocks = [];
    for (let i = 0; i < each_value.length; i += 1) {
        each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    }
    return {
        c() {
            div4 = element("div");
            div3 = element("div");
            div0 = element("div");
            t0 = text(ctx[2]);
            t1 = space();
            div1 = element("div");
            for (let i = 0; i < each_blocks.length; i += 1) {
                each_blocks[i].c();
            }
            t2 = space();
            div2 = element("div");
            t3 = text(t3_value);
            attr(div0, "class", "dice-formula");
            attr(div1, "class", "dice-tooltip");
            attr(div2, "class", "dice-total");
            attr(div3, "class", "dice-result");
            attr(div4, "class", "dice-roll");
        },
        m(target, anchor) {
            insert(target, div4, anchor);
            append(div4, div3);
            append(div3, div0);
            append(div0, t0);
            append(div3, t1);
            append(div3, div1);
            for (let i = 0; i < each_blocks.length; i += 1) {
                each_blocks[i].m(div1, null);
            }
            append(div3, t2);
            append(div3, div2);
            append(div2, t3);
        },
        p(ctx2, dirty) {
            if (dirty & 4) {
                set_data(t0, ctx2[2]);
            }
            if (dirty & 1) {
                each_value = ctx2[0].tooltip;
                let i;
                for (i = 0; i < each_value.length; i += 1) {
                    const child_ctx = get_each_context$3(ctx2, each_value, i);
                    if (each_blocks[i]) {
                        each_blocks[i].p(child_ctx, dirty);
                    }
                    else {
                        each_blocks[i] = create_each_block$3(child_ctx);
                        each_blocks[i].c();
                        each_blocks[i].m(div1, null);
                    }
                }
                for (; i < each_blocks.length; i += 1) {
                    each_blocks[i].d(1);
                }
                each_blocks.length = each_value.length;
            }
            if (dirty & 1 && t3_value !== (t3_value = ctx2[0].total + "")) {
                set_data(t3, t3_value);
            }
        },
        d(detaching) {
            if (detaching) {
                detach(div4);
            }
            destroy_each(each_blocks, detaching);
        }
    };
}

__name(create_else_block, "create_else_block");

function create_if_block$2(ctx) {
    let html_tag;
    let html_anchor;
    return {
        c() {
            html_tag = new HtmlTag(false);
            html_anchor = empty();
            html_tag.a = html_anchor;
        },
        m(target, anchor) {
            html_tag.m(ctx[0], target, anchor);
            insert(target, html_anchor, anchor);
        },
        p(ctx2, dirty) {
            if (dirty & 1) {
                html_tag.p(ctx2[0]);
            }
        },
        d(detaching) {
            if (detaching) {
                detach(html_anchor);
            }
            if (detaching) {
                html_tag.d();
            }
        }
    };
}

__name(create_if_block$2, "create_if_block$2");

function create_each_block$3(ctx) {
    let section;
    let div;
    let header;
    let span;
    let t0_value = ctx[3].formula + "";
    let t0;
    let t1;
    return {
        c() {
            section = element("section");
            div = element("div");
            header = element("header");
            span = element("span");
            t0 = text(t0_value);
            t1 = space();
            attr(span, "class", "part-formula");
            attr(header, "class", "part-header flexrow");
            attr(div, "class", "dice");
            attr(section, "class", "tooltip-part");
        },
        m(target, anchor) {
            insert(target, section, anchor);
            append(section, div);
            append(div, header);
            append(header, span);
            append(span, t0);
            append(section, t1);
        },
        p(ctx2, dirty) {
            if (dirty & 1 && t0_value !== (t0_value = ctx2[3].formula + "")) {
                set_data(t0, t0_value);
            }
        },
        d(detaching) {
            if (detaching) {
                detach(section);
            }
        }
    };
}

__name(create_each_block$3, "create_each_block$3");

function create_fragment$3(ctx) {
    let if_block_anchor;

    function select_block_type(ctx2, dirty) {
        if (ctx2[1] === "Roll") {
            return create_if_block$2;
        }
        return create_else_block;
    }

    __name(select_block_type, "select_block_type");
    let current_block_type = select_block_type(ctx);
    let if_block = current_block_type(ctx);
    return {
        c() {
            if_block.c();
            if_block_anchor = empty();
        },
        m(target, anchor) {
            if_block.m(target, anchor);
            insert(target, if_block_anchor, anchor);
        },
        p(ctx2, [dirty]) {
            if (current_block_type === (current_block_type = select_block_type(ctx2)) && if_block) {
                if_block.p(ctx2, dirty);
            }
            else {
                if_block.d(1);
                if_block = current_block_type(ctx2);
                if (if_block) {
                    if_block.c();
                    if_block.m(if_block_anchor.parentNode, if_block_anchor);
                }
            }
        },
        i: noop,
        o: noop,
        d(detaching) {
            if_block.d(detaching);
            if (detaching) {
                detach(if_block_anchor);
            }
        }
    };
}

__name(create_fragment$3, "create_fragment$3");

function instance$3($$self, $$props, $$invalidate) {
    let { data } = $$props;
    let { rollClass } = $$props;
    let formula;
    if (rollClass !== "Roll") {
        console.log(data);
        formula = data.formula.replaceAll(/[{}]/g, "");
    }
    $$self.$$set = ($$props2) => {
        if ("data" in $$props2) {
            $$invalidate(0, data = $$props2.data);
        }
        if ("rollClass" in $$props2) {
            $$invalidate(1, rollClass = $$props2.rollClass);
        }
    };
    return [data, rollClass, formula];
}

__name(instance$3, "instance$3");

class RollTooltip extends SvelteComponent {
    constructor(options) {
        super();
        init(this, options, instance$3, create_fragment$3, safe_not_equal, { data: 0, rollClass: 1 });
    }

    get data() {
        return this.$$.ctx[0];
    }

    set data(data) {
        this.$$set({ data });
        flush();
    }

    get rollClass() {
        return this.$$.ctx[1];
    }

    set rollClass(rollClass) {
        this.$$set({ rollClass });
        flush();
    }
}

__name(RollTooltip, "RollTooltip");
const ActionComponent_svelte_svelte_type_style_lang = "";

function get_each_context$2(ctx, list, i) {
    const child_ctx = ctx.slice();
    child_ctx[6] = list[i];
    return child_ctx;
}

__name(get_each_context$2, "get_each_context$2");

function create_if_block_1(ctx) {
    let i;
    return {
        c() {
            i = element("i");
            attr(i, "class", "fa-solid fa-arrow-right svelte-zvelne");
        },
        m(target, anchor) {
            insert(target, i, anchor);
        },
        d(detaching) {
            if (detaching) {
                detach(i);
            }
        }
    };
}

__name(create_if_block_1, "create_if_block_1");

function create_if_block$1(ctx) {
    let await_block_anchor;
    let promise2;
    let current;
    let info = {
        ctx,
        current: null,
        token: null,
        hasCatch: false,
        pending: create_pending_block,
        then: create_then_block,
        catch: create_catch_block,
        value: 9,
        blocks: [, , ,]
    };
    handle_promise(promise2 = ctx[2], info);
    return {
        c() {
            await_block_anchor = empty();
            info.block.c();
        },
        m(target, anchor) {
            insert(target, await_block_anchor, anchor);
            info.block.m(target, info.anchor = anchor);
            info.mount = () => await_block_anchor.parentNode;
            info.anchor = await_block_anchor;
            current = true;
        },
        p(new_ctx, dirty) {
            ctx = new_ctx;
            info.ctx = ctx;
            if (dirty & 4 && promise2 !== (promise2 = ctx[2]) && handle_promise(promise2, info)) {
                ;
            }
            else {
                update_await_block_branch(info, ctx, dirty);
            }
        },
        i(local) {
            if (current) {
                return;
            }
            transition_in(info.block);
            current = true;
        },
        o(local) {
            for (let i = 0; i < 3; i += 1) {
                const block = info.blocks[i];
                transition_out(block);
            }
            current = false;
        },
        d(detaching) {
            if (detaching) {
                detach(await_block_anchor);
            }
            info.block.d(detaching);
            info.token = null;
            info = null;
        }
    };
}

__name(create_if_block$1, "create_if_block$1");

function create_catch_block(ctx) {
    return {
        c: noop,
        m: noop,
        p: noop,
        i: noop,
        o: noop,
        d: noop
    };
}

__name(create_catch_block, "create_catch_block");

function create_then_block(ctx) {
    let rolltooltip;
    let current;
    rolltooltip = new RollTooltip({
        props: {
            data: ctx[9],
            rollClass: ctx[3].class
        }
    });
    return {
        c() {
            create_component(rolltooltip.$$.fragment);
        },
        m(target, anchor) {
            mount_component(rolltooltip, target, anchor);
            current = true;
        },
        p(ctx2, dirty) {
            const rolltooltip_changes = {};
            if (dirty & 4) {
                rolltooltip_changes.data = ctx2[9];
            }
            rolltooltip.$set(rolltooltip_changes);
        },
        i(local) {
            if (current) {
                return;
            }
            transition_in(rolltooltip.$$.fragment, local);
            current = true;
        },
        o(local) {
            transition_out(rolltooltip.$$.fragment, local);
            current = false;
        },
        d(detaching) {
            destroy_component(rolltooltip, detaching);
        }
    };
}

__name(create_then_block, "create_then_block");

function create_pending_block(ctx) {
    return {
        c: noop,
        m: noop,
        p: noop,
        i: noop,
        o: noop,
        d: noop
    };
}

__name(create_pending_block, "create_pending_block");

function create_each_block$2(ctx) {
    let li;
    let actioncomponent;
    let t;
    let current;
    actioncomponent = new ActionComponent({
        props: {
            stat: ctx[6],
            target: ctx[1]
        }
    });
    return {
        c() {
            li = element("li");
            create_component(actioncomponent.$$.fragment);
            t = space();
        },
        m(target, anchor) {
            insert(target, li, anchor);
            mount_component(actioncomponent, li, null);
            append(li, t);
            current = true;
        },
        p(ctx2, dirty) {
            const actioncomponent_changes = {};
            if (dirty & 2) {
                actioncomponent_changes.target = ctx2[1];
            }
            actioncomponent.$set(actioncomponent_changes);
        },
        i(local) {
            if (current) {
                return;
            }
            transition_in(actioncomponent.$$.fragment, local);
            current = true;
        },
        o(local) {
            transition_out(actioncomponent.$$.fragment, local);
            current = false;
        },
        d(detaching) {
            if (detaching) {
                detach(li);
            }
            destroy_component(actioncomponent);
        }
    };
}

__name(create_each_block$2, "create_each_block$2");
function create_fragment$2(ctx) {
    let div1;
    let t0;
    let div0;
    let t1_value = ctx[0].actionName + "";
    let t1;
    let t2;
    let span;
    let t3_value = ctx[0]?.result + "";
    let t3;
    let span_class_value;
    let t4;
    let t5;
    let ul;
    let current;
    let if_block0 = ctx[0].parentID && create_if_block_1();
    let if_block1 = ctx[3] && create_if_block$1(ctx);
    let each_value = ctx[4];
    let each_blocks = [];
    for (let i = 0; i < each_value.length; i += 1) {
        each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    }
    const out = /* @__PURE__ */ __name((i) => transition_out(each_blocks[i], 1, 1, () => {
        each_blocks[i] = null;
    }), "out");
    return {
        c() {
            div1 = element("div");
            if (if_block0)
                if_block0.c();
            t0 = space();
            div0 = element("div");
            t1 = text(t1_value);
            t2 = text(": ");
            span = element("span");
            t3 = text(t3_value);
            t4 = space();
            if (if_block1)
                if_block1.c();
            t5 = space();
            ul = element("ul");
            for (let i = 0; i < each_blocks.length; i += 1) {
                each_blocks[i].c();
            }
            attr(span, "class", span_class_value = "result " + (ctx[0]?.hit ? "hit" : "fail") + " svelte-zvelne");
            attr(div0, "class", "data svelte-zvelne");
            attr(ul, "class", "subActions svelte-zvelne");
            attr(div1, "class", "container svelte-zvelne");
        },
        m(target, anchor) {
            insert(target, div1, anchor);
            if (if_block0)
                if_block0.m(div1, null);
            append(div1, t0);
            append(div1, div0);
            append(div0, t1);
            append(div0, t2);
            append(div0, span);
            append(span, t3);
            append(div0, t4);
            if (if_block1)
                if_block1.m(div0, null);
            append(div1, t5);
            append(div1, ul);
            for (let i = 0; i < each_blocks.length; i += 1) {
                each_blocks[i].m(ul, null);
            }
            current = true;
        },
        p(ctx2, [dirty]) {
            if (ctx2[0].parentID) {
                if (if_block0)
                    ;
                else {
                    if_block0 = create_if_block_1();
                    if_block0.c();
                    if_block0.m(div1, t0);
                }
            }
            else if (if_block0) {
                if_block0.d(1);
                if_block0 = null;
            }
            if ((!current || dirty & 1) && t1_value !== (t1_value = ctx2[0].actionName + ""))
                set_data(t1, t1_value);
            if ((!current || dirty & 1) && t3_value !== (t3_value = ctx2[0]?.result + ""))
                set_data(t3, t3_value);
            if (!current || dirty & 1 && span_class_value !== (span_class_value = "result " + (ctx2[0]?.hit ? "hit" : "fail") + " svelte-zvelne")) {
                attr(span, "class", span_class_value);
            }
            if (ctx2[3])
                if_block1.p(ctx2, dirty);
            if (dirty & 18) {
                each_value = ctx2[4];
                let i;
                for (i = 0; i < each_value.length; i += 1) {
                    const child_ctx = get_each_context$2(ctx2, each_value, i);
                    if (each_blocks[i]) {
                        each_blocks[i].p(child_ctx, dirty);
                        transition_in(each_blocks[i], 1);
                    }
                    else {
                        each_blocks[i] = create_each_block$2(child_ctx);
                        each_blocks[i].c();
                        transition_in(each_blocks[i], 1);
                        each_blocks[i].m(ul, null);
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
            if (current)
                return;
            transition_in(if_block1);
            for (let i = 0; i < each_value.length; i += 1) {
                transition_in(each_blocks[i]);
            }
            current = true;
        },
        o(local) {
            transition_out(if_block1);
            each_blocks = each_blocks.filter(Boolean);
            for (let i = 0; i < each_blocks.length; i += 1) {
                transition_out(each_blocks[i]);
            }
            current = false;
        },
        d(detaching) {
            if (detaching)
                detach(div1);
            if (if_block0)
                if_block0.d();
            if (if_block1)
                if_block1.d();
            destroy_each(each_blocks, detaching);
        }
    };
}
__name(create_fragment$2, "create_fragment$2");
function instance$2($$self, $$props, $$invalidate) {
    let { stat } = $$props;
    let { target } = $$props;
    const rollData = stat.rollData;
    let rollInstance, tooltipDataPromise;
    if (rollData) {
        rollInstance = CONFIG.Dice[rollData.class].fromData(rollData);
        tooltipDataPromise = rollData.class !== "Roll" ? rollInstance.setDataForSvelte() : rollInstance.render();
    }
    const subActions = target.stats.filter((act) => act.parentID === stat.id);
    $$self.$$set = ($$props2) => {
        if ("stat" in $$props2)
            $$invalidate(0, stat = $$props2.stat);
        if ("target" in $$props2)
            $$invalidate(1, target = $$props2.target);
    };
    return [stat, target, tooltipDataPromise, rollData, subActions];
}
__name(instance$2, "instance$2");

class ActionComponent extends SvelteComponent {
    constructor(options) {
        super();
        init(this, options, instance$2, create_fragment$2, safe_not_equal, { stat: 0, target: 1 });
    }

    get stat() {
        return this.$$.ctx[0];
    }

    set stat(stat) {
        this.$$set({ stat });
        flush();
    }

    get target() {
        return this.$$.ctx[1];
    }

    set target(target) {
        this.$$set({ target });
        flush();
    }
}
__name(ActionComponent, "ActionComponent");
const ActionStatisticsShell_svelte_svelte_type_style_lang = "";
function get_each_context$1(ctx, list, i) {
    const child_ctx = ctx.slice();
    child_ctx[4] = list[i];
    return child_ctx;
}
__name(get_each_context$1, "get_each_context$1");
function create_each_block$1(key_1, ctx) {
    let div;
    let targetcomponent;
    let t0;
    let actioncomponent;
    let t1;
    let current;
    targetcomponent = new TargetComponent({ props: { uuid: ctx[4].token } });
    actioncomponent = new ActionComponent({
        props: {
            stat: firstAction(ctx[4]),
            target: ctx[4]
        }
    });
    return {
        key: key_1,
        first: null,
        c() {
            div = element("div");
            create_component(targetcomponent.$$.fragment);
            t0 = space();
            create_component(actioncomponent.$$.fragment);
            t1 = space();
            attr(div, "class", "stat svelte-84ogm7");
            this.first = div;
        },
        m(target, anchor) {
            insert(target, div, anchor);
            mount_component(targetcomponent, div, null);
            append(div, t0);
            mount_component(actioncomponent, div, null);
            append(div, t1);
            current = true;
        },
        p(new_ctx, dirty) {
            ctx = new_ctx;
        },
        i(local) {
            if (current)
                return;
            transition_in(targetcomponent.$$.fragment, local);
            transition_in(actioncomponent.$$.fragment, local);
            current = true;
        },
        o(local) {
            transition_out(targetcomponent.$$.fragment, local);
            transition_out(actioncomponent.$$.fragment, local);
            current = false;
        },
        d(detaching) {
            if (detaching)
                detach(div);
            destroy_component(targetcomponent);
            destroy_component(actioncomponent);
        }
    };
}
__name(create_each_block$1, "create_each_block$1");
function create_default_slot(ctx) {
    let div;
    let each_blocks = [];
    let each_1_lookup = /* @__PURE__ */ new Map();
    let current;
    let each_value = ctx[1];
    const get_key = /* @__PURE__ */ __name((ctx2) => ctx2[4].token, "get_key");
    for (let i = 0; i < each_value.length; i += 1) {
        let child_ctx = get_each_context$1(ctx, each_value, i);
        let key = get_key(child_ctx);
        each_1_lookup.set(key, each_blocks[i] = create_each_block$1(key, child_ctx));
    }
    return {
        c() {
            div = element("div");
            for (let i = 0; i < each_blocks.length; i += 1) {
                each_blocks[i].c();
            }
            attr(div, "class", "container svelte-84ogm7");
        },
        m(target, anchor) {
            insert(target, div, anchor);
            for (let i = 0; i < each_blocks.length; i += 1) {
                each_blocks[i].m(div, null);
            }
            current = true;
        },
        p(ctx2, dirty) {
            if (dirty & 2) {
                each_value = ctx2[1];
                group_outros();
                each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx2, each_value, each_1_lookup, div, outro_and_destroy_block, create_each_block$1, null, get_each_context$1);
                check_outros();
            }
        },
        i(local) {
            if (current)
                return;
            for (let i = 0; i < each_value.length; i += 1) {
                transition_in(each_blocks[i]);
            }
            current = true;
        },
        o(local) {
            for (let i = 0; i < each_blocks.length; i += 1) {
                transition_out(each_blocks[i]);
            }
            current = false;
        },
        d(detaching) {
            if (detaching)
                detach(div);
            for (let i = 0; i < each_blocks.length; i += 1) {
                each_blocks[i].d();
            }
        }
    };
}
__name(create_default_slot, "create_default_slot");
function create_fragment$1(ctx) {
    let applicationshell;
    let updating_elementRoot;
    let current;

    function applicationshell_elementRoot_binding(value) {
        ctx[2](value);
    }

    __name(applicationshell_elementRoot_binding, "applicationshell_elementRoot_binding");
    let applicationshell_props = {
        $$slots: { default: [create_default_slot] },
        $$scope: { ctx }
    };
    if (ctx[0] !== void 0) {
        applicationshell_props.elementRoot = ctx[0];
    }
    applicationshell = new ApplicationShell({ props: applicationshell_props });
    binding_callbacks.push(() => bind(applicationshell, "elementRoot", applicationshell_elementRoot_binding));
    return {
        c() {
            create_component(applicationshell.$$.fragment);
        },
        m(target, anchor) {
            mount_component(applicationshell, target, anchor);
            current = true;
        },
        p(ctx2, [dirty]) {
            const applicationshell_changes = {};
            if (dirty & 128) {
                applicationshell_changes.$$scope = { dirty, ctx: ctx2 };
            }
            if (!updating_elementRoot && dirty & 1) {
                updating_elementRoot = true;
                applicationshell_changes.elementRoot = ctx2[0];
                add_flush_callback(() => updating_elementRoot = false);
            }
            applicationshell.$set(applicationshell_changes);
        },
        i(local) {
            if (current)
                return;
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

__name(create_fragment$1, "create_fragment$1");

function firstAction(target) {
    return target.stats.filter((stat) => stat.parentID === null)[0];
}

__name(firstAction, "firstAction");

function instance$1($$self, $$props, $$invalidate) {
    let { elementRoot } = $$props;
    const { application } = getContext("external");
    const actions = application.statistics;
    console.log(actions);

    function applicationshell_elementRoot_binding(value) {
        elementRoot = value;
        $$invalidate(0, elementRoot);
    }

    __name(applicationshell_elementRoot_binding, "applicationshell_elementRoot_binding");
    $$self.$$set = ($$props2) => {
        if ("elementRoot" in $$props2)
            $$invalidate(0, elementRoot = $$props2.elementRoot);
    };
    return [elementRoot, actions, applicationshell_elementRoot_binding];
}
__name(instance$1, "instance$1");

class ActionStatisticsShell extends SvelteComponent {
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
__name(ActionStatisticsShell, "ActionStatisticsShell");

class ActionStatistics extends SvelteApplication {
    constructor(object) {
        super(object);
        this.prepareData(object);
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            title: "Action Statistics",
            width: 800,
            height: 600,
            resizable: true,
            minimizable: true,
            svelte: {
                class: ActionStatisticsShell,
                target: document.body
            }
        });
    }

    prepareData(object) {
        console.log(object);
        this.statistics = object;
        return;
    }
}
__name(ActionStatistics, "ActionStatistics");
const MyChatMessage_svelte_svelte_type_style_lang = "";
function get_each_context(ctx, list, i) {
    const child_ctx = ctx.slice();
    child_ctx[5] = list[i];
    child_ctx[7] = i;
    return child_ctx;
}
__name(get_each_context, "get_each_context");
function create_if_block(ctx) {
    let div;
    let t0;
    let t1_value = calculateDamage(ctx[5].stats) + "";
    let t1;
    return {
        c() {
            div = element("div");
            t0 = text("Total Damage: ");
            t1 = text(t1_value);
        },
        m(target, anchor) {
            insert(target, div, anchor);
            append(div, t0);
            append(div, t1);
        },
        p(ctx2, dirty) {
            if (dirty & 1 && t1_value !== (t1_value = calculateDamage(ctx2[5].stats) + ""))
                set_data(t1, t1_value);
        },
        d(detaching) {
            if (detaching)
                detach(div);
        }
    };
}
__name(create_if_block, "create_if_block");
function create_each_block(key_1, ctx) {
    let div1;
    let div0;
    let img;
    let img_src_value;
    let t0;
    let span;
    let t1_value = ctx[5].targetName + "";
    let t1;
    let t2;
    let t3;
    let show_if = ctx[5].stats.filter(func).length > 0;
    let t4;
    let i;
    let mounted;
    let dispose;

    function mouseenter_handler() {
        return ctx[2](ctx[5]);
    }

    __name(mouseenter_handler, "mouseenter_handler");

    function mouseleave_handler() {
        return ctx[3](ctx[5]);
    }

    __name(mouseleave_handler, "mouseleave_handler");
    let if_block = show_if && create_if_block(ctx);
    return {
        key: key_1,
        first: null,
        c() {
            div1 = element("div");
            div0 = element("div");
            img = element("img");
            t0 = space();
            span = element("span");
            t1 = text(t1_value);
            t2 = text(":");
            t3 = space();
            if (if_block)
                if_block.c();
            t4 = space();
            i = element("i");
            attr(img, "alt", "target pic");
            if (!src_url_equal(img.src, img_src_value = ctx[5].targetIcon))
                attr(img, "src", img_src_value);
            attr(img, "class", "svelte-1e9olgq");
            attr(span, "class", "svelte-1e9olgq");
            attr(div0, "class", "target svelte-1e9olgq");
            attr(i, "class", "fa-solid fa-square-info");
            attr(div1, "class", "result svelte-1e9olgq");
            this.first = div1;
        },
        m(target, anchor) {
            insert(target, div1, anchor);
            append(div1, div0);
            append(div0, img);
            append(div0, t0);
            append(div0, span);
            append(span, t1);
            append(span, t2);
            append(div1, t3);
            if (if_block)
                if_block.m(div1, null);
            append(div1, t4);
            append(div1, i);
            if (!mounted) {
                dispose = [
                    listen(div0, "mouseenter", mouseenter_handler),
                    listen(div0, "mouseleave", mouseleave_handler),
                    listen(i, "click", ctx[1])
                ];
                mounted = true;
            }
        },
        p(new_ctx, dirty) {
            ctx = new_ctx;
            if (dirty & 1 && !src_url_equal(img.src, img_src_value = ctx[5].targetIcon)) {
                attr(img, "src", img_src_value);
            }
            if (dirty & 1 && t1_value !== (t1_value = ctx[5].targetName + ""))
                set_data(t1, t1_value);
            if (dirty & 1)
                show_if = ctx[5].stats.filter(func).length > 0;
            if (show_if) {
                if (if_block) {
                    if_block.p(ctx, dirty);
                }
                else {
                    if_block = create_if_block(ctx);
                    if_block.c();
                    if_block.m(div1, t4);
                }
            }
            else if (if_block) {
                if_block.d(1);
                if_block = null;
            }
        },
        d(detaching) {
            if (detaching)
                detach(div1);
            if (if_block)
                if_block.d();
            mounted = false;
            run_all(dispose);
        }
    };
}
__name(create_each_block, "create_each_block");
function create_fragment(ctx) {
    let div;
    let t1;
    let each_blocks = [];
    let each_1_lookup = /* @__PURE__ */ new Map();
    let t2;
    let i;
    let mounted;
    let dispose;
    let each_value = ctx[0];
    const get_key = /* @__PURE__ */ __name((ctx2) => ctx2[7], "get_key");
    for (let i2 = 0; i2 < each_value.length; i2 += 1) {
        let child_ctx = get_each_context(ctx, each_value, i2);
        let key = get_key(child_ctx);
        each_1_lookup.set(key, each_blocks[i2] = create_each_block(key, child_ctx));
    }
    return {
        c() {
            div = element("div");
            div.textContent = "this is roll results from attack Action";
            t1 = space();
            for (let i2 = 0; i2 < each_blocks.length; i2 += 1) {
                each_blocks[i2].c();
            }
            t2 = space();
            i = element("i");
            attr(i, "class", "fa-solid fa-square-info");
        },
        m(target, anchor) {
            insert(target, div, anchor);
            insert(target, t1, anchor);
            for (let i2 = 0; i2 < each_blocks.length; i2 += 1) {
                each_blocks[i2].m(target, anchor);
            }
            insert(target, t2, anchor);
            insert(target, i, anchor);
            if (!mounted) {
                dispose = listen(i, "click", ctx[1]);
                mounted = true;
            }
        },
        p(ctx2, [dirty]) {
            if (dirty & 3) {
                each_value = ctx2[0];
                each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx2, each_value, each_1_lookup, t2.parentNode, destroy_block, create_each_block, t2, get_each_context);
            }
        },
        i: noop,
        o: noop,
        d(detaching) {
            if (detaching)
                detach(div);
            if (detaching)
                detach(t1);
            for (let i2 = 0; i2 < each_blocks.length; i2 += 1) {
                each_blocks[i2].d(detaching);
            }
            if (detaching)
                detach(t2);
            if (detaching)
                detach(i);
            mounted = false;
            dispose();
        }
    };
}
__name(create_fragment, "create_fragment");
async function onHoverToken(tokenUUID, hover) {
    const token = await fromUuid(tokenUUID);
    if (token._object) {
        token._object.hover = hover;
        token._object.refresh();
    }
}
__name(onHoverToken, "onHoverToken");
function calculateDamage(stats) {
    return stats.map((stat) => stat.damage ?? 0).reduce((prev, current) => prev + current);
}
__name(calculateDamage, "calculateDamage");
const func = /* @__PURE__ */ __name((stat) => stat.damage, "func");
function instance($$self, $$props, $$invalidate) {
    let { results } = $$props;
    let statisticsWindow = null;

    function openStatistics() {
        if (!statisticsWindow) {
            statisticsWindow = new ActionStatistics(results);
        }
        statisticsWindow.render(true);
    }

    __name(openStatistics, "openStatistics");
    const mouseenter_handler = /* @__PURE__ */ __name((result) => onHoverToken(result.token, true), "mouseenter_handler");
    const mouseleave_handler = /* @__PURE__ */ __name((result) => onHoverToken(result.token, false), "mouseleave_handler");
    $$self.$$set = ($$props2) => {
        if ("results" in $$props2)
            $$invalidate(0, results = $$props2.results);
    };
    return [results, openStatistics, mouseenter_handler, mouseleave_handler];
}
__name(instance, "instance");

class MyChatMessage extends SvelteComponent {
    constructor(options) {
        super();
        init(this, options, instance, create_fragment, safe_not_equal, { results: 0 });
    }
}
__name(MyChatMessage, "MyChatMessage");

class ARd20DamageRoll extends Roll {
    constructor(formula, data, options) {
        super(formula, data, options);
        this.configureDamage(this.terms, this.options);
    }

    configureDamage(terms, options) {
        const { damageType } = options;
        console.log(damageType);
        for (let [index, term] of terms.entries()) {
            if (!(term instanceof OperatorTerm)) {
                term.options.damageType = index !== 0 && this.terms[index - 1] instanceof OperatorTerm ? damageType[index - 1] : damageType[index];
                if (term instanceof PoolTerm) {
                    let poolOptions = Array(term.rolls[0].terms.length).fill(term.options.damageType);
                    this.configureDamage(term.rolls[0].terms, { damageType: poolOptions });
                }
            }
        }
    }

    async setDataForSvelte() {
        const tooltip = this.dice.map((d) => d);
        return {
            formula: this.formula,
            total: Math.round(this.total * 100) / 100,
            tooltip
        };
    }
}
__name(ARd20DamageRoll, "ARd20DamageRoll");
Hooks.once("init", function () {
    console.log("init hoook");
    game.ard20 = {
        documents: {
            ARd20Actor,
            ARd20Item,
            ARd20Action
        },
        rollItemMacro,
        config: ARd20,
        dice: { dice, ARd20DamageRoll },
        prepareAndRollDamage
    };
    CONFIG.ARd20 = ARd20;
    CONFIG.Dice.DamageRoll = DamageRoll;
    CONFIG.Dice.D20Roll = D20Roll;
    CONFIG.Dice.Roll = Roll;
    CONFIG.Dice.ARd20DamageRoll = ARd20DamageRoll;
    CONFIG.Dice.rolls.push(D20Roll);
    CONFIG.Dice.rolls.push(DamageRoll);
    CONFIG.Dice.rolls.push(ARd20DamageRoll);
    game.socket.on("system.ard20", (data) => {
        if (data.operation === "updateActorData") {
            ARd20SocketHandler.updateActorData(data);
        }
    });
    CONFIG.Combat.initiative = {
        formula: "1d20 + @abilities.dex.mod",
        decimals: 2
    };
    CONFIG.Actor.documentClass = ARd20Actor;
    CONFIG.Item.documentClass = ARd20Item;
    CONFIG.Token.documentClass = ARd20TokenDocument;
    CONFIG.Token.objectClass = ARd20Token;
    console.log("register sheets");
    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("ard20", ARd20ActorSheet, { makeDefault: false });
    Actors.registerSheet("ard20", SvelteDocumentSheet, { makeDefault: true });
    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("ard20", ARd20ItemSheet, { makeDefault: false });
    Items.registerSheet("ard20", SvelteDocumentSheet, { makeDefault: true });
    CONFIG.Item.systemDataModels["race"] = RaceDataModel;
    registerSystemSettings();
    game.settings.set("ard20", "actionMouseRewrite", false);
    setSvelteComponents();
    return preloadHandlebarsTemplates();
});
Handlebars.registerHelper("concat", function () {
    var outStr = "";
    for (var arg in arguments) {
        if (typeof arguments[arg] != "object") {
            outStr += arguments[arg];
        }
    }
    return outStr;
});
Handlebars.registerHelper("toLowerCase", function(str) {
  return str.toLowerCase();
});
Handlebars.registerHelper("add", function(value1, value2) {
  return Number(value1) + Number(value2);
});
Hooks.once("ready", async function() {
  Hooks.on("hotbarDrop", (bar, data, slot) => createItemMacro(data, slot));
});
async function createItemMacro(data, slot) {
  if (game instanceof Game) {
    if (data.type !== "Item") {
      return;
    }
    if (!("data" in data) && ui.notifications instanceof Notifications) {
      return ui.notifications.warn("You can only create macro buttons for owned Items");
    }
    const item = data.data;
    const command = `game.ard20.rollItemMacro("${item.name}");`;
    let macroList = game.macros.contents.filter((m) => m.name === item.name && m?.command === command);
    let macroCheck = macroList.length !== 0 ? macroList[0] : null;
    if (macroCheck !== null) {
      let macro = await Macro.create({
        name: item.name,
        type: "script",
        img: item.img,
        command,
        flags: { "ard20.itemMacro": true }
      });
      if (macro instanceof Macro) {
        game.user?.assignHotbarMacro(macro, slot);
      }
    }
    return false;
  }
}
__name(createItemMacro, "createItemMacro");
function rollItemMacro(itemName) {
  if (game instanceof Game) {
    const speaker = ChatMessage.getSpeaker();
    let actor;
    if (speaker.token) {
      actor = game.actors.tokens[speaker.token];
    }
    if (!actor && typeof speaker.actor === "string") {
      actor = game.actors.get(speaker.actor);
    }
    const item = actor ? actor.items.find((i) => i.name === itemName) : null;
    if (!item) {
      return ui.notifications.warn(`Your controlled Actor does not have an item named ${itemName}`);
    }
    return item.roll();
  }
}
__name(rollItemMacro, "rollItemMacro");
Hooks.on("renderChatMessage", (app, html, data) => {
    console.log("rendering chatMessage", app, html, data);
    const flagData = app.getFlag("world", "svelte");
    if (typeof flagData === "object") {
        new MyChatMessage({ target: html[0], props: flagData });
    }
});
Hooks.on("preDeleteChatMessage", (message) => {
    const flagData = message.getFlag("world", "svelte");
    if (typeof flagData === "object" && typeof message?._svelteComponent?.$destroy === "function") {
        message._svelteComponent.$destroy();
    }
});
Hooks.on("renderChatLog", (app, html, data) => ARd20Item.chatListeners(html));
Hooks.on("renderChatPopout", (app, html, data) => ARd20Item.chatListeners(html));
function prepareAndRollDamage(damage) {
    const damageValue = damage.map((dam) => `{${dam[0]}}`);
    console.log("damageValue: ", damageValue);
    const damageType = damage.map((dam) => dam[1]);
    console.log("damageType: ", damageType);
    const damageFormula = damageValue.join(" + ");
    console.log("damageFormula: ", damageFormula);
    return new ARd20DamageRoll(damageFormula, {}, { damageType });
}
__name(prepareAndRollDamage, "prepareAndRollDamage");
export {
    prepareAndRollDamage,
    rollItemMacro
};
//# sourceMappingURL=ard20.js.map
