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
    const attributes = data.attributes;
    //const entries = Object.entries as unknown as <K extends string, V>(o: {[s in K]: V}) => [K, V][];

    for (const dr of Object.values(def_dam.phys)) {
      dr.bonus = 0;
      dr.type = "res";
    }
    for (const dr of Object.values(def_dam.mag)) {
      dr.bonus = 0;
      dr.type = "res";
    }
    def_dam.mag.acid.bonus;
    for (const [key, def] of Object.entries(def_stats)) {
      def.bonus = 0;
    }
    for (const [key, ability] of Object.entries(attributes)) {
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
    const attributes = data.attributes;
    const advancement = data.advancement;
    const def_stats = data.defences.stats;
    const def_dam = data.defences.damage;
    const skills = data.skills;
    data.mobility.value = 0;
    this.itemTypes.armor.forEach((item) => {
      if (item.data.data.equipped) {
        for (let [key, dr] of Object.entries(def_dam.phys)) {
          let ph = item.data.data.res.phys[key];
          def_dam.phys[key].bonus += ph !== "imm" ? ph : 0;
          def_dam.phys[key].type = ph === "imm" ? "imm" : def_dam.phys[key].type;
        }
        for (let [key, dr] of entries(def_dam.mag)) {
          let mg = item.data.data.res.mag[key];
          def_dam.mag[key].bonus += mg !== "imm" ? mg : 0;
          def_dam.mag[key].type = mg === "imm" ? "imm" : def_dam.mag[key].type;
        }
        data.mobility.value += item.data.data.mobility;
      }
    });
    data.mobility.value += data.mobility.bonus;
    // Loop through ability scores, and add their modifiers to our sheet output.
    for (let ability of Object.values(attributes)) {
      // Calculate the modifier using d20 rules.
      ability.total = ability.value + ability.bonus;
      ability.mod = Math.floor((ability.value - 10) / 2);
    }
    let dexMod = data.mobility.value < 10 ? attributes.dex.mod : data.mobility.value < 16 ? Math.min(2, attributes.dex.mod) : Math.min(0, attributes.dex.mod);
    //calculate level and expierence
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
    /*
    calculate proficiency bonus and die
    */
    //advancement.prof_bonus = Math.floor((7 + advancement.level) / 4);
    //advancement.prof_die = "1d" + advancement.prof_bonus * 2;
    /*
    calculate character's defences, including damage resistances
    */

    def_stats.reflex.value = 10 + 4 * def_stats.reflex.level + dexMod + attributes.int.mod + def_stats.reflex.bonus;
    def_stats.reflex.label = "Reflex";
    def_stats.fortitude.value = 10 + 4 * def_stats.fortitude.level + attributes.str.mod + attributes.con.mod + def_stats.fortitude.bonus;
    def_stats.fortitude.label = "Fortitude";
    def_stats.will.value = 10 + 4 * def_stats.will.level + attributes.wis.mod + attributes.cha.mod + def_stats.will.bonus;
    def_stats.will.label = "Will";
    for (let [key, dr] of entries(CONFIG.ARd20.DamageSubTypes)) {
      if (!(key === "force" || key === "rad" || key === "psychic")) {
        def_dam.phys[key].value = def_dam.phys[key]?.value || def_dam.phys[key]?.type !== "imm" ? Math.max(isNaN(def_dam.phys[key].value) ? 0 : def_dam.phys[key].value) + def_dam.phys[key].bonus : 0;
        def_dam.phys[key].label = game.i18n.localize(CONFIG.ARd20.DamageSubTypes[key]) ?? CONFIG.ARd20.DamageSubTypes[key];
      }
      def_dam.mag[key].value = def_dam.mag[key]?.value || def_dam.mag[key]?.type !== "imm" ? Math.max(isNaN(def_dam.mag[key].value) ? 0 : def_dam.mag[key].value) + def_dam.mag[key].bonus : 0;
      def_dam.mag[key].label = game.i18n.localize(CONFIG.ARd20.DamageSubTypes[key]) ?? CONFIG.ARd20.DamageSubTypes[key];
    }
    //calculate rolls for character's skills
    for (let [key, skill] of Object.entries(skills)) {
      skill.level = skill.level < 4 ? skill.level : 4;
      skill.value = skill.level * 4 + skill.bonus;
      skill.rankName = game.i18n.localize(CONFIG.ARd20.Rank[skill.level]) ?? CONFIG.ARd20.Rank[skill.level];
      skill.name = game.i18n.localize(CONFIG.ARd20.Skills[key]) ?? CONFIG.ARd20.Skills[key];
    }
    //calculate character's armor,weapon and tool proficinecies
    for (let [key, prof] of entries(game.settings.get("ard20", "proficiencies").weapon)) {
      data.proficiencies.weapon[key].value = data.proficiencies.weapon[prof].value ? data.proficiencies.weapon[prof].value : 0;
      data.proficiencies.weapon[prof].type = game.settings.get("ard20", "proficiencies").weapon[prof].type;
      data.proficiencies.weapon[prof].name = game.settings.get("ard20", "proficiencies").weapon[prof].name;
      data.proficiencies.weapon[prof].type_hover = game.i18n.localize(CONFIG.ARd20.WeaponType[data.proficiencies.weapon[prof].type]) ?? CONFIG.ARd20.WeaponType[data.proficiencies.weapon[prof].type];
      data.proficiencies.weapon[prof].type_value = game.i18n.localize(CONFIG.ARd20.prof[data.proficiencies.weapon[prof].value]) ?? CONFIG.ARd20.prof[data.proficiencies.weapon[prof].value];
    }
    if (data.proficiencies.weapon.length > game.settings.get("ard20", "proficiencies").weapon.length) {
      data.proficiencies.weapon.splice(game.settings.get("ard20", "proficiencies").weapon.length + 1, data.proficiencies.weapon.length - game.settings.get("ard20", "proficiencies").weapon.length);
    }
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
   * @param {Number} abilityId    The ability ID (e.g. "str")
   * @param {Object} options      Options which configure how ability tests are rolled
   * @return {Promise<Roll>}      A Promise which resolves to the created Roll instance
   */
  rollAbilityTest(abilityId, options) {
    const label = game.i18n.localize(CONFIG.ARd20.Attributes[abilityId]);
    const abl = this.data.data.attributes;

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
      title: game.i18n.format("ARd20.AttributePromptTitle", { ability: label }),
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
    const data = { attributes: this.getRollData().attributes };

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
