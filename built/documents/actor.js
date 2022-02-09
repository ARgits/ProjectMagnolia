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
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ARd20Actor = void 0;
var dice_js_1 = require("../dice/dice.js");
var ard20_1 = require("../ard20");
/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
var ARd20Actor = /** @class */ (function (_super) {
    __extends(ARd20Actor, _super);
    function ARd20Actor() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    //@ts-check
    /** @override */
    ARd20Actor.prototype.prepareData = function () {
        // Prepare data for the actor. Calling the super version of this executes
        // the following, in order: data reset (to clear active effects),
        // prepareBaseData(), prepareEmbeddedDocuments() (including active effects),
        // prepareDerivedData().
        _super.prototype.prepareData.call(this);
        this.items.forEach(function (item) { return item.prepareFinalAttributes(); });
    };
    /**
     * @override
     * Augment the basic actor data with additional dynamic data. Typically,
     * you'll want to handle most of your calculated/derived data in this step.
     * Data calculated in this step should generally not exist in template.json
     * (such as ability modifiers rather than ability scores) and should be
     * available both inside and outside of character sheets (such as if an actor
     * is queried and has a roll executed directly from it).
     */
    ARd20Actor.prototype.prepareDerivedData = function () {
        var actorData = this.data;
        var data = actorData.data;
        var flags = actorData.flags.ard20 || {};
        // Make separate methods for each Actor type (character, npc, etc.) to keep
        // things organized.
        this._prepareCharacterData(actorData);
        this._prepareNpcData(actorData);
    };
    /**
     * Prepare Character type specific data
     */
    ARd20Actor.prototype._prepareCharacterData = function (actorData) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        if (actorData.type !== "character")
            return;
        // Make modifications to data here. For example:
        var data = actorData.data;
        var attributes = data.attributes;
        var advancement = data.advancement;
        var def_stats = data.defences.stats;
        var def_dam = data.defences.damage;
        var proficiencies = data.proficiencies;
        data.mobility.value = 0;
        this.itemTypes.armor.forEach(function (item) {
            if (item.data.type === "armor") {
                if (item.data.data.equipped) {
                    for (var _i = 0, _a = (0, ard20_1.obj_keys)(def_dam.phys); _i < _a.length; _i++) {
                        var key = _a[_i];
                        var ph = item.data.data.res.phys[key];
                        def_dam.phys[key].bonus += ph.type !== "imm" ? ph.value : 0;
                        def_dam.phys[key].type = ph.type === "imm" ? "imm" : def_dam.phys[key].type;
                    }
                    for (var _b = 0, _c = (0, ard20_1.obj_keys)(def_dam.mag); _b < _c.length; _b++) {
                        var key = _c[_b];
                        var mg = item.data.data.res.mag[key];
                        def_dam.mag[key].bonus += mg.type !== "imm" ? mg.value : 0;
                        def_dam.mag[key].type = mg.type === "imm" ? "imm" : def_dam.mag[key].type;
                    }
                    data.mobility.value += item.data.data.mobility.value;
                }
            }
        });
        data.mobility.value += data.mobility.bonus;
        // Loop through ability scores, and add their modifiers to our sheet output.
        for (var _i = 0, _l = Object.values(attributes); _i < _l.length; _i++) {
            var ability = _l[_i];
            // Calculate the modifier using d20 rules.
            ability.total = ability.value + ability.bonus;
            ability.mod = Math.floor((ability.value - 10) / 2);
        }
        var dexMod = data.mobility.value < 10 ? attributes.dex.mod : data.mobility.value < 16 ? Math.min(2, attributes.dex.mod) : Math.min(0, attributes.dex.mod);
        //calculate level and expierence
        var levels = CONFIG.ARd20.CHARACTER_EXP_LEVELS;
        if (advancement.xp.used) {
            advancement.xp.used = (_a = advancement.xp.used) !== null && _a !== void 0 ? _a : 0;
        }
        for (var i = 1; i < 21; i++) {
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
        for (var _m = 0, _o = (0, ard20_1.obj_entries)(CONFIG.ARd20.DamageSubTypes); _m < _o.length; _m++) {
            var _p = _o[_m], key = _p[0], dr = _p[1];
            if (!(key === "force" || key === "rad" || key === "psychic")) {
                def_dam.phys[key].value = ((_b = def_dam.phys[key]) === null || _b === void 0 ? void 0 : _b.value) || ((_c = def_dam.phys[key]) === null || _c === void 0 ? void 0 : _c.type) !== "imm" ? Math.max(isNaN(def_dam.phys[key].value) ? 0 : def_dam.phys[key].value) + def_dam.phys[key].bonus : 0;
                def_dam.phys[key].name = (_d = game.i18n.localize(CONFIG.ARd20.DamageSubTypes[key])) !== null && _d !== void 0 ? _d : CONFIG.ARd20.DamageSubTypes[key];
            }
            def_dam.mag[key].value = ((_e = def_dam.mag[key]) === null || _e === void 0 ? void 0 : _e.value) || ((_f = def_dam.mag[key]) === null || _f === void 0 ? void 0 : _f.type) !== "imm" ? Math.max(isNaN(def_dam.mag[key].value) ? 0 : def_dam.mag[key].value) + def_dam.mag[key].bonus : 0;
            def_dam.mag[key].name = (_g = game.i18n.localize(CONFIG.ARd20.DamageSubTypes[key])) !== null && _g !== void 0 ? _g : CONFIG.ARd20.DamageSubTypes[key];
        }
        //calculate rolls for character's skills
        for (var _q = 0, _r = (0, ard20_1.obj_entries)(data.skills); _q < _r.length; _q++) {
            var _s = _r[_q], key = _s[0], skill = _s[1];
            skill.level = skill.level < 4 ? skill.level : 4;
            skill.value = skill.level * 4 + skill.bonus;
            skill.name = (_h = game.i18n.localize(CONFIG.ARd20.Skills[key])) !== null && _h !== void 0 ? _h : CONFIG.ARd20.Skills[key];
            skill.rankName = (_j = game.i18n.localize((0, ard20_1.getValues)(CONFIG.ARd20.Rank, skill.level))) !== null && _j !== void 0 ? _j : (0, ard20_1.getValues)(CONFIG.ARd20.Rank, skill.level);
        }
        proficiencies.weapon = game.settings.get("ard20", "proficiencies").weapon.map(function (setting, key) {
            var _a;
            return __assign(__assign({}, setting), { value: (_a = proficiencies.weapon[key].value) !== null && _a !== void 0 ? _a : 0 });
        });
        data.speed.value = ((_k = this.itemTypes.race[0]) === null || _k === void 0 ? void 0 : _k.data.type) === "race" ? this.itemTypes.race[0].data.data.speed : 0;
        data.speed.value += attributes.dex.mod + data.speed.bonus;
    };
    /**
     * Prepare NPC type specific data.
     */
    ARd20Actor.prototype._prepareNpcData = function (actorData) {
        //@ts-expect-error
        if (actorData.type !== "npc")
            return;
        // Make modifications to data here. For example:
        var data = actorData.data;
        //@ts-expect-error
        data.xp = data.cr * data.cr * 100;
    };
    /**
     * Override getRollData() that's supplied to rolls.
     */
    ARd20Actor.prototype.getRollData = function () {
        var data = _super.prototype.getRollData.call(this);
        // Prepare character roll data.
        return data;
    };
    /**
     * Roll an Ability Test
     * Prompt the user for input regarding Advantage/Disadvantage and any Situational Bonus
     * @param {Number} attributeId    The ability ID (e.g. "str")
     * @param {Object} options      Options which configure how ability tests are rolled
     * @return {Promise<Roll>}      A Promise which resolves to the created Roll instance
     */
    ARd20Actor.prototype.rollAbilityTest = function (attributeId, options) {
        var label = game.i18n.localize((0, ard20_1.getValues)(CONFIG.ARd20.Attributes, attributeId));
        var actorData = this.data.data;
        var attributes = actorData.attributes;
        var attr = (0, ard20_1.getValues)(attributes, attributeId);
        // Construct parts
        var parts = ["@mod"];
        var data = { mod: attr };
        // Add provided extra roll parts now because they will get clobbered by mergeObject below
        if (options.parts.length > 0) {
            parts.push.apply(parts, options.parts);
        }
        // Roll and return
        var rollData = foundry.utils.mergeObject(options, {
            parts: parts,
            data: data,
            title: game.i18n.format("ARd20.AttributePromptTitle", { attribute: label }),
            messageData: {
                speaker: options.speaker || ChatMessage.getSpeaker({ actor: this }),
                "flags.ard20.roll": { type: "attribute", attributeId: attributeId },
            },
        });
        //@ts-expect-error
        return (0, dice_js_1.d20Roll)(rollData);
    };
    /**
     * Roll a Skill Check
     * Prompt the user for input regarding Advantage/Disadvantage and any Situational Bonus
     * @param {string} skillId      The skill id (e.g. "ins")
     * @param {Object} options      Options which configure how the skill check is rolled
     * @return {Promise<Roll>}      A Promise which resolves to the created Roll instance
     */
    ARd20Actor.prototype.rollSkill = function (skillId, options) {
        var skl = (0, ard20_1.getValues)(this.data.data.skills, skillId);
        // Compose roll parts and data
        var parts = ["@proficiency", "@mod"];
        var data = { attributes: this.getRollData().attributes, proficiency: skl.value };
        // Add provided extra roll parts now because they will get clobbered by mergeObject below
        if (options.parts.length > 0) {
            parts.push.apply(parts, options.parts);
        }
        // Roll and return
        var rollData = foundry.utils.mergeObject(options, {
            parts: parts,
            data: data,
            title: game.i18n.format("ARd20.SkillPromptTitle", { skill: game.i18n.localize((0, ard20_1.getValues)(CONFIG.ARd20.Skills, skillId)) }),
            messageData: {
                speaker: options.speaker || ChatMessage.getSpeaker({ actor: this }),
                "flags.ard20.roll": { type: "skill", skillId: skillId },
            },
            chooseModifier: true,
        });
        //@ts-expect-error
        return (0, dice_js_1.d20Roll)(rollData);
    };
    return ARd20Actor;
}(Actor));
exports.ARd20Actor = ARd20Actor;
