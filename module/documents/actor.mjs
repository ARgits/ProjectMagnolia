import { d20Roll } from "../dice/dice.js";
/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class ARd20Actor extends Actor {
  /** @override */
  prepareData() {
    // Prepare data for the actor. Calling the super version of this executes
    // the following, in order: data reset (to clear active effects),
    // prepareBaseData(), prepareEmbeddedDocuments() (including active effects),
    // prepareDerivedData().
    super.prepareData();
    this.items.forEach((item) => item.prepareFinalAttributes());
  }
  /** @override */
  prepareBaseData() {
    // Data modifications in this step occur before processing embedded
    // documents or derived data.
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
    const data = actorData.data;
    const flags = actorData.flags.ard20 || {};

    // Make separate methods for each Actor type (character, npc, etc.) to keep
    // things organized.
    this._prepareCharacterData(actorData);
    this._prepareNpcData(actorData);
  }

  /**
   * Prepare Character type specific data
   */
  _prepareCharacterData(actorData) {
    if (actorData.type !== "character") return;

    // Make modifications to data here. For example:
    const data = actorData.data;

    // Loop through ability scores, and add their modifiers to our sheet output.
    for (let [key, ability] of Object.entries(data.abilities)) {
      // Calculate the modifier using d20 rules.
      ability.mod = Math.floor((ability.value - 10) / 2);
    }
    //calculate level and expierence
    const levels = CONFIG.ARd20.CHARACTER_EXP_LEVELS;
    if (data.attributes.xp.used) {
      data.attributes.xp.used = data.attributes.xp.used ?? 0;
    }
    for (let i = 1; i < 21; i++) {
      if (data.attributes.xp.used >= levels[i - 1] && data.attributes.xp.used < levels[i]) {
        data.attributes.level = i;
        data.attributes.xp.level = levels[i];
        data.attributes.xp.level_min = levels[i - 1];
      }
    }
    data.attributes.xp.bar_max = data.attributes.xp.level - data.attributes.xp.level_min;
    data.attributes.xp.bar_min = data.attributes.xp.used - data.attributes.xp.level_min;
    /*
    calculate proficiency bonus and die
    */
    data.attributes.prof_bonus = Math.floor((7 + data.attributes.level) / 4);
    data.attributes.prof_die = "1d" + data.attributes.prof_bonus * 2;
    /*
    calculate character's defences, including damage resistances
    */
    data.defences.stats.reflex = data.defences.stats.reflex ?? {};
    data.defences.stats.reflex.bonus = data.defences.stats.reflex.bonus ?? 0;
    data.defences.stats.reflex.value = 10 + data.attributes.prof_bonus + data.abilities.dex.mod + data.abilities.int.mod + parseInt(data.defences.stats.reflex.bonus);
    data.defences.stats.reflex.label = "Reflex";
    data.defences.stats.fortitude = data.defences.stats.fortitude ?? {};
    data.defences.stats.fortitude.bonus = data.defences.stats.fortitude.bonus ?? 0;
    data.defences.stats.fortitude.value = 10 + data.attributes.prof_bonus + data.abilities.str.mod + data.abilities.con.mod + parseInt(data.defences.stats.fortitude.bonus);
    data.defences.stats.fortitude.label = "Fortitude";
    data.defences.stats.will = data.defences.stats.will ?? {};
    data.defences.stats.will.bonus = data.defences.stats.will.bonus ?? 0;
    data.defences.stats.will.value = 10 + data.attributes.prof_bonus + data.abilities.wis.mod + data.abilities.cha.mod + parseInt(data.defences.stats.will.bonus);
    data.defences.stats.will.label = "Will";
    for (let [key, dr] of Object.entries(CONFIG.ARd20.DamageSubTypes)) {
      if (!(key === "force" || key === "rad" || key === "psyhic")) {
        data.defences.damage.physic[key] = {
          type: data.defences.damage.physic[key]?.type ? data.defences.damage.physic[key].type : "res",
          sens_value: data.defences.damage.physic[key]?.value || data.defences.damage.physic[key]?.type === "imm" ? data.defences.damage.physic[key].value : 0,
          label: game.i18n.localize(CONFIG.ARd20.DamageSubTypes[key]) ?? CONFIG.ARd20.DamageSubTypes[key],
        };
      }
      data.defences.damage.magic[key] = {
        type: data.defences.damage.physic[key]?.type ? data.defences.damage.physic[key].type : "res",
        value: data.defences.damage.magic[key]?.value || data.defences.damage.physic[key]?.type === "imm" ? data.defences.damage.magic[key].value : 0,
        label: game.i18n.localize(CONFIG.ARd20.DamageSubTypes[key]) ?? CONFIG.ARd20.DamageSubTypes[key],
      };
    }
    //calculate rolls for character's skills
    for (let [key, skill] of Object.entries(data.skills)) {
      skill.prof = skill.prof < 2 ? skill.prof : 2;
      if (skill.prof == 0) {
        skill.prof_die = 0;
        skill.prof_bonus = 0;
      }
      if (skill.prof == 1) {
        skill.prof_bonus = 0;
        skill.prof_die = data.attributes.prof_bonus * 2;
      }
      if (skill.prof == 2) {
        skill.prof_die = data.attributes.prof_bonus * 2;
        skill.prof_bonus = data.attributes.prof_bonus;
      }
    }
    //calculate character's armor,weapon and tool proficinecies
    if (!data.profs) {
      data.profs = { weapon: game.settings.get("ard20", "profs").weapon };
    }
    for (let prof of Object.keys(game.settings.get("ard20", "profs").weapon)) {
      data.profs.weapon[prof].value = data.profs.weapon[prof].value ? data.profs.weapon[prof].value : 0;
      data.profs.weapon[prof].type = game.settings.get("ard20", "profs").weapon[prof].type;
      data.profs.weapon[prof].name = game.settings.get("ard20", "profs").weapon[prof].name;
      data.profs.weapon[prof].type_hover = game.i18n.localize(CONFIG.ARd20.WeaponType[data.profs.weapon[prof].type]) ?? CONFIG.ARd20.WeaponType[data.profs.weapon[prof].type];
      data.profs.weapon[prof].type_value = game.i18n.localize(CONFIG.ARd20.prof[data.profs.weapon[prof].value]) ?? CONFIG.ARd20.prof[data.profs.weapon[prof].value];
    }
    if (data.profs.weapon.length > game.settings.get("ard20", "profs").weapon.length) {
      data.profs.splice(game.settings.get("ard20", "profs").weapon.length + 1, data.profs.length - game.settings.get("ard20", "profs").weapon.length);
    }
    data.speed.value = this.itemTypes.race[0]?.data.data.speed + data.abilities.dex.mod + data.speed.bonus;
  }

  /**
   * Prepare NPC type specific data.
   */
  _prepareNpcData(actorData) {
    if (actorData.type !== "npc") return;

    // Make modifications to data here. For example:
    const data = actorData.data;
    data.xp = data.cr * data.cr * 100;
  }

  /**
   * Override getRollData() that's supplied to rolls.
   */
  getRollData() {
    const data = super.getRollData();

    // Prepare character roll data.

    return data;
  }
  /**
   * Roll a generic ability test or saving throw.
   * Prompt the user for input on which variety of roll they want to do.
   * @param {String}abilityId     The ability id (e.g. "str")
   * @param {Object} options      Options which configure how ability tests or saving throws are rolled
   */
  rollAbility(abilityId, options = {}) {
    console.log(abilityId, "Характеристика");
    const label = CONFIG.ARd20.abilities[abilityId];
    new Dialog({
      title: game.i18n.format("ARd20.AbilityPromptTitle", { ability: label }),
      content: `<p>${game.i18n.format("ARd20.AbilityPromptText", { ability: label })}</p>`,
      buttons: {
        test: {
          label: game.i18n.localize("ARd20.ActionAbil"),
          callback: () => this.rollAbilityTest(abilityId, options),
        },
      },
    }).render(true);
  }
  /**
   * Roll an Ability Test
   * Prompt the user for input regarding Advantage/Disadvantage and any Situational Bonus
   * @param {String} abilityId    The ability ID (e.g. "str")
   * @param {Object} options      Options which configure how ability tests are rolled
   * @return {Promise<Roll>}      A Promise which resolves to the created Roll instance
   */

  rollAbilityTest(abilityId, options = {}) {
    const label = CONFIG.ARd20.abilities[abilityId];
    const abl = this.data.data.abilities[abilityId];

    // Construct parts
    const parts = ["@mod"];
    const data = { mod: abl.mod };

    // Add provided extra roll parts now because they will get clobbered by mergeObject below
    if (options.parts?.length > 0) {
      parts.push(...options.parts);
    }

    // Roll and return
    const rollData = foundry.utils.mergeObject(options, {
      parts: parts,
      data: data,
      title: game.i18n.format("ARd20.AbilityPromptTitle", { ability: label }),
      messageData: {
        speaker: options.speaker || ChatMessage.getSpeaker({ actor: this }),
        "flags.ard20.roll": { type: "ability", abilityId },
      },
    });
    return d20Roll(rollData);
  }
  /**
   * Roll a Skill Check
   * Prompt the user for input regarding Advantage/Disadvantage and any Situational Bonus
   * @param {string} skillId      The skill id (e.g. "ins")
   * @param {Object} options      Options which configure how the skill check is rolled
   * @return {Promise<Roll>}      A Promise which resolves to the created Roll instance
   */

  rollSkill(skillId, options = {}) {
    const skl = this.data.data.skills[skillId];

    // Compose roll parts and data
    const parts = ["@prof_die", "@prof_bonus", "@mod"];
    const data = { skills: this.getRollData().skills, prof_type: "skills", prof_value: skillId, abilities: this.getRollData().abilities };

    // Add provided extra roll parts now because they will get clobbered by mergeObject below
    if (options.parts?.length > 0) {
      parts.push(...options.parts);
    }

    // Roll and return
    const rollData = foundry.utils.mergeObject(options, {
      parts: parts,
      data: data,
      title: game.i18n.format("ARd20.SkillPromptTitle", { skill: CONFIG.ARd20.skills[skillId] }),
      messageData: {
        speaker: options.speaker || ChatMessage.getSpeaker({ actor: this }),
        "flags.ard20.roll": { type: "skill", skillId },
      },
      chooseModifier: true,
    });
    return d20Roll(rollData);
  }
}
