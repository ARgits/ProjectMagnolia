import { d20Roll } from "../dice/dice.js";
/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class ARd20Actor extends Actor {
  //@ts-check
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
    //@ts-check
    // Data modifications in this step occur before processing embedded
    // documents or derived data.
    const actorData = this.data;
    const data = actorData.data;
    const flags = actorData.flags.ard20 || {};
    const def_dam = data.defences.damage;
    const def_stats = data.defences.stats;
    const abilities = data.abilities;
    /**
     * @param {Number} bonus bonus
     * @param {Number} type
     */
    for (let [key, dr] of Object.entries(CONFIG.ARd20.DamageSubTypes)) {
      if (!(key === "force" || key === "rad" || key === "psyhic")) {
        def_dam.phys[key] = {
          bonus: 0,
          type: "res",
        };
      }
      def_dam.mag[key] = {
        bonus: 0,
        type: "res",
      };
    }
    for (let [key, def] of Object.entries(def_stats)) {
      def.bonus = 0;
    }
    for (let [key, ability] of Object.entries(abilities)) {
      ability.bonus = 0;
    }
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
    const abilities = data.abilities;
    const attributes = data.attributes;
    const def_stats = data.defences.stats;
    const def_dam = data.defences.damage;
    data.heavyPoints = 0;
    this.itemTypes.armor.forEach((item) => {
      for (let [key, dr] of Object.entries(CONFIG.ARd20.DamageSubTypes)) {
        if (item.data.data.equipped) {
          if (!(key === "force" || key === "rad" || key === "psyhic")) {
            let ph = item.data.data.res.phys[key];
            def_dam.phys[key].bonus += ph !== "imm" ? parseInt(ph) : 0;
            def_dam.phys[key].type = ph === "imm" ? "imm" : def_dam.phys[key].type;
          }
          let mg = item.data.data.res.mag[key];
          def_dam.mag[key].bonus += mg !== "imm" ? parseInt(mg) : 0;
          def_dam.mag[key].type = mg === "imm" ? "imm" : def_dam.mag[key].type;
        }
        data.heavyPoints += item.data.data.heavyPoints;
      }
    });
    // Loop through ability scores, and add their modifiers to our sheet output.
    for (let [key, ability] of Object.entries(abilities)) {
      // Calculate the modifier using d20 rules.
      ability.total = ability.value + ability.bonus;
      ability.mod = Math.floor((ability.value - 10) / 2);
    }
    let dexMod = data.heavyPoints < 10 ? abilities.dex.mod : data.heavyPoints < 16 ? Math.min(2, abilities.dex.mod) : Math.min(0, abilities.dex.mod);
    //calculate level and expierence
    const levels = CONFIG.ARd20.CHARACTER_EXP_LEVELS;
    if (attributes.xp.used) {
      attributes.xp.used = attributes.xp.used ?? 0;
    }
    for (let i = 1; i < 21; i++) {
      if (attributes.xp.used >= levels[i - 1] && attributes.xp.used < levels[i]) {
        attributes.level = i;
        attributes.xp.level = levels[i];
        attributes.xp.level_min = levels[i - 1];
      }
    }
    attributes.xp.bar_max = attributes.xp.level - attributes.xp.level_min;
    attributes.xp.bar_min = attributes.xp.used - attributes.xp.level_min;
    /*
    calculate proficiency bonus and die
    */
    attributes.prof_bonus = Math.floor((7 + attributes.level) / 4);
    attributes.prof_die = "1d" + attributes.prof_bonus * 2;
    /*
    calculate character's defences, including damage resistances
    */

    def_stats.reflex.value = 10 + attributes.prof_bonus + dexMod + abilities.int.mod + parseInt(def_stats.reflex.bonus);
    def_stats.reflex.label = "Reflex";
    def_stats.fortitude.value = 10 + attributes.prof_bonus + abilities.str.mod + abilities.con.mod + parseInt(def_stats.fortitude.bonus);
    def_stats.fortitude.label = "Fortitude";
    def_stats.will.value = 10 + attributes.prof_bonus + abilities.wis.mod + abilities.cha.mod + parseInt(def_stats.will.bonus);
    def_stats.will.label = "Will";
    for (let [key, dr] of Object.entries(CONFIG.ARd20.DamageSubTypes)) {
      if (!(key === "force" || key === "rad" || key === "psyhic")) {
        def_dam.phys[key].value =
          def_dam.phys[key]?.value || def_dam.phys[key]?.type !== "imm" ? Math.max(isNaN(def_dam.phys[key].value) ? 0 : def_dam.phys[key].value) + parseInt(def_dam.phys[key].bonus) : 0;
        def_dam.phys[key].label = game.i18n.localize(CONFIG.ARd20.DamageSubTypes[key]) ?? CONFIG.ARd20.DamageSubTypes[key];
      }
      def_dam.mag[key].value =
        def_dam.mag[key]?.value || def_dam.mag[key]?.type !== "imm" ? Math.max(isNaN(def_dam.mag[key].value) ? 0 : def_dam.mag[key].value) + parseInt(def_dam.mag[key].bonus) : 0;
      def_dam.mag[key].label = game.i18n.localize(CONFIG.ARd20.DamageSubTypes[key]) ?? CONFIG.ARd20.DamageSubTypes[key];
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
        skill.prof_die = `1d${attributes.prof_bonus * 2}`;
      }
      if (skill.prof == 2) {
        skill.prof_die = `1d${attributes.prof_bonus * 2}`;
        skill.prof_bonus = attributes.prof_bonus;
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
    data.speed.value = this.itemTypes.race[0]?.data.data.speed + abilities.dex.mod + data.speed.bonus;
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
   * Roll an Ability Test
   * Prompt the user for input regarding Advantage/Disadvantage and any Situational Bonus
   * @param {String} abilityId    The ability ID (e.g. "str")
   * @param {Object} options      Options which configure how ability tests are rolled
   * @return {Promise<Roll>}      A Promise which resolves to the created Roll instance
   */
  rollAbilityTest(abilityId, options = {}) {
    const label = game.i18n.localize(CONFIG.ARd20.abilities[abilityId]);
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
    const parts = ["@mod"];
    const data = { abilities: this.getRollData().abilities };

    //if character'skill have prof_bonus and/or prof_die, they will be added to roll dialog
    if (skl.prof_bonus) {
      parts.unshift("@prof_bonus");
      data.prof_bonus = skl.prof_bonus;
    }
    if (skl.prof_die) {
      parts.unshift("@prof_die");
      data.prof_die = skl.prof_die;
    }

    // Add provided extra roll parts now because they will get clobbered by mergeObject below
    if (options.parts?.length > 0) {
      parts.push(...options.parts);
    }
    // Roll and return
    const rollData = foundry.utils.mergeObject(options, {
      parts: parts,
      data: data,
      title: game.i18n.format("ARd20.SkillPromptTitle", { skill: game.i18n.localize(CONFIG.ARd20.skills[skillId]) }),
      messageData: {
        speaker: options.speaker || ChatMessage.getSpeaker({ actor: this }),
        "flags.ard20.roll": { type: "skill", skillId },
      },
      chooseModifier: true,
    });
    return d20Roll(rollData);
  }
}
