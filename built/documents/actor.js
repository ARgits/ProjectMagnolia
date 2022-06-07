import { d20Roll } from "../dice/dice.js";
import { obj_entries, obj_keys, getValues } from "../ard20.js";
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
    const actorData = this.system;
    // Make separate methods for each Actor type (character, npc, etc.) to keep
    // things organized.
    this._prepareCharacterData(actorData);
    this._prepareNpcData(actorData);
  }
  /**
   * Prepare Character type specific data
   */
  _prepareCharacterData(actorData) {
    if (this.type !== "character") return;
    this.prepareAttributes(actorData);
    this.prepareSkills(actorData);
    this.prepareResistances(actorData);
    this.prepareProficiencies(actorData);
    // Make modifications to data here. For example:
    const attributes = actorData.attributes;
    const advancement = actorData.advancement;
    const def_stats = actorData.defences.stats;
    const def_dam = actorData.defences.damage;
    const proficiencies = actorData.proficiencies;
    actorData.mobility.value = 0;
    this.itemTypes.armor.forEach((item) => {
      if (item.type === "armor") {
        if (item.system.equipped) {
          for (let key of obj_keys(def_dam.phys)) {
            let ph = item.system.res.phys[key];
            def_dam.phys[key].bonus += !ph.immune ? parseInt(ph.value) : 0;
          }
          for (let key of obj_keys(def_dam.mag)) {
            let mg = item.system.res.mag[key];
            def_dam.mag[key].bonus += !mg.immune ? parseInt(mg.value) : 0;
          }
          actorData.mobility.value += item.system.mobility.value;
        }
      }
    });
    actorData.mobility.value += actorData.mobility.bonus;
    // Loop through ability scores, and add their modifiers to our sheet output.
    
    let dexMod =
      actorData.mobility.value < 10
        ? attributes.dex.mod
        : actorData.mobility.value < 16
        ? Math.min(2, attributes.dex.mod)
        : Math.min(0, attributes.dex.mod);
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
    def_stats.reflex.value = 10 + 4 * def_stats.reflex.level + dexMod + attributes.int.mod + def_stats.reflex.bonus;
    def_stats.reflex.label = "Reflex";
    def_stats.fortitude.value =
      10 + 4 * def_stats.fortitude.level + attributes.str.mod + attributes.con.mod + def_stats.fortitude.bonus;
    def_stats.fortitude.label = "Fortitude";
    def_stats.will.value =
      10 + 4 * def_stats.will.level + attributes.wis.mod + attributes.cha.mod + def_stats.will.bonus;
    def_stats.will.label = "Will";
    for (let [key, dr] of obj_entries(CONFIG.ARd20.DamageSubTypes)) {
      if (!(key === "force" || key === "radiant" || key === "psychic")) {
        def_dam.phys[key].value =
          def_dam.phys[key]?.value || !def_dam.phys[key]?.immune
            ? def_dam.phys[key]?.value + def_dam.phys[key]?.bonus
            : 0;
        def_dam.phys[key].name =
          game.i18n.localize(CONFIG.ARd20.DamageSubTypes[key]) ?? CONFIG.ARd20.DamageSubTypes[key];
      }
      def_dam.mag[key].value =
        def_dam.mag[key]?.value || !def_dam.mag[key]?.immune
          ? def_dam.mag[key]?.value + def_dam.mag[key]?.bonus
          : 0;
      def_dam.mag[key].name = game.i18n.localize(CONFIG.ARd20.DamageSubTypes[key]) ?? CONFIG.ARd20.DamageSubTypes[key];
    }
    
    //calculate rolls for character's skills
    proficiencies.weapon = game.settings.get("ard20", "proficiencies").weapon.value.map((setting, key) => {
      return {
        name: setting.name,
        type: setting.type,
        value: proficiencies.weapon[key]?.value ?? 0,
        rankName: profLevelSetting[proficiencies.weapon[key]?.value ?? 0].label,
      };
    });
    actorData.speed.value = this.itemTypes.race[0]?.type === "race" ? this.itemTypes.race[0].system.speed : 0;
    actorData.speed.value += attributes.dex.mod + actorData.speed.bonus;
  }
  prepareAttributes(actorData){
    const attributes = actorData.attributes
    for (let [key,attribute] of Object.entries(attributes)) {
      // Calculate the modifier using d20 rules.
      attribute.total = attribute.value + attribute.bonus;
      attribute.mod = (attribute.value - 10)
      attribute.label = game.i18n.localize(CONFIG.ARd20.Attributes[key]) ?? key;
    }
  }
  prepareSkills(actorData){
    const profLevelSetting = game.settings.get("ard20", "profLevel");
    const maxProfLevel = profLevelSetting.length - 1;
    const skills = actorData.skills
    for (let [key, skill] of Object.entries(skills)) {
      skill.level = skill.level < maxProfLevel ? skill.level : maxProfLevel;
      skill.value = skill.level * 4 + skill.bonus;
      skill.name = game.i18n.localize(CONFIG.ARd20.Skills[key]) ?? CONFIG.ARd20.Skills[key];
      skill.rankName = profLevelSetting[skill.level].label;
    }
  }
  /**
   * Prepare NPC type specific data.
   */
  _prepareNpcData(actorData) {
    //@ts-expect-error
    if (this.type !== "npc") return;
    // Make modifications to data here. For example:
    const data = actorData;
    //@ts-expect-error
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
   * Roll an Attribute Test
   * Prompt the user for input regarding Advantage/Disadvantage and any Situational Bonus
   * @param {Number} attributeId    The ability ID (e.g. "str")
   * @param {Object} options      Options which configure how ability tests are rolled
   * @return {Promise<Roll>}      A Promise which resolves to the created Roll instance
   */
  rollAttributeTest(attributeId, options) {
    const label = game.i18n.localize(CONFIG.ARd20.Attributes[attributeId]);
    const actorData = this.system;
    const attributes = actorData.attributes;
    const attr = attributes[attributeId];
    // Construct parts
    const parts = ["@mod"];
    const data = { mod: attr.mod };
    // Add provided extra roll parts now because they will get clobbered by mergeObject below
    if (options?.parts?.length > 0) {
      parts.push(...options.parts);
    }
    // Roll and return
    const rollData = foundry.utils.mergeObject(options, {
      parts: parts,
      data: data,
      title: game.i18n.format("ARd20.AttributePromptTitle", { attribute: label }),
      messageData: {
        speaker: options.speaker || ChatMessage.getSpeaker({ actor: this }) || this.name,
        "flags.ard20.roll": { type: "attribute", attributeId },
      },
    });
    //@ts-expect-error
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
    console.log("rollSkill event:", skillId, "skillID;   ", options, "options;   ");
    const skl = getValues(this.system.skills, skillId);
    // Compose roll parts and data
    const parts = ["@proficiency", "@mod"];
    const data = { attributes: this.getRollData().attributes, proficiency: skl.value };
    // Add provided extra roll parts now because they will get clobbered by mergeObject below
    if (options.parts?.length > 0) {
      parts.push(...options.parts);
    }
    // Roll and return
    const rollData = foundry.utils.mergeObject(options, {
      parts: parts,
      data: data,
      title: game.i18n.format("ARd20.SkillPromptTitle", {
        skill: game.i18n.localize(getValues(CONFIG.ARd20.Skills, skillId)),
      }),
      messageData: {
        speaker: options.speaker || ChatMessage.getSpeaker({ actor: this }),
        "flags.ard20.roll": { type: "skill", skillId },
      },
      chooseModifier: true,
    });
    //@ts-expect-error
    return d20Roll(rollData);
  }
}
