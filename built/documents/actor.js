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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ARd20Actor = void 0;
var dice_js_1 = require("../dice/dice.js");
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
    /** @override */
    ARd20Actor.prototype.prepareBaseData = function () {
        //@ts-check
        // Data modifications in this step occur before processing embedded
        // documents or derived data.
        var actorData = this.data;
        var data = actorData.data;
        var flags = actorData.flags.ard20 || {};
        var def_dam = data.defences.damage;
        var def_stats = data.defences.stats;
        var attributes = data.attributes;
        //const entries = Object.entries as unknown as <K extends string, V>(o: {[s in K]: V}) => [K, V][];
        for (var _i = 0, _a = Object.entries(def_dam.phys); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], dr = _b[1];
            def_dam.phys[key].bonus = 0;
            def_dam.phys[key].type = "res";
        }
        for (var _c = 0, _d = Object.entries(def_dam.mag); _c < _d.length; _c++) {
            var _e = _d[_c], key = _e[0], dr = _e[1];
            def_dam.mag[key].bonus = 0;
            def_dam.mag[key].type = "res";
        }
        for (var _f = 0, _g = Object.entries(def_stats); _f < _g.length; _f++) {
            var _h = _g[_f], key = _h[0], def = _h[1];
            def.bonus = 0;
        }
        for (var _j = 0, _k = Object.entries(attributes); _j < _k.length; _j++) {
            var _l = _k[_j], key = _l[0], ability = _l[1];
            ability.bonus = 0;
        }
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
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
        if (actorData.type !== "character")
            return;
        // Make modifications to data here. For example:
        var data = actorData.data;
        var attributes = data.attributes;
        var advancement = data.advancement;
        var def_stats = data.defences.stats;
        var def_dam = data.defences.damage;
        var proficiencies = data.proficiencies;
        var prof_weapon = proficiencies.weapon;
        var prof_armor = proficiencies.armor;
        var prof_tool = proficiencies.tools;
        var entries = Object.entries;
        data.mobility.value = 0;
        this.itemTypes.armor.forEach(function (item) {
            if (item.data.data.equipped) {
                for (var _i = 0, _a = entries(def_dam.phys); _i < _a.length; _i++) {
                    var _b = _a[_i], key = _b[0], dr = _b[1];
                    var ph = item.data.data.res.phys[key];
                    def_dam.phys[key].bonus += ph !== "imm" ? ph : 0;
                    def_dam.phys[key].type = ph === "imm" ? "imm" : def_dam.phys[key].type;
                }
                for (var _c = 0, _d = entries(def_dam.mag); _c < _d.length; _c++) {
                    var _e = _d[_c], key = _e[0], dr = _e[1];
                    var mg = item.data.data.res.mag[key];
                    def_dam.mag[key].bonus += mg !== "imm" ? mg : 0;
                    def_dam.mag[key].type = mg === "imm" ? "imm" : def_dam.mag[key].type;
                }
                data.mobility.value += item.data.data.mobility;
            }
        });
        data.mobility.value += data.mobility.bonus;
        // Loop through ability scores, and add their modifiers to our sheet output.
        for (var _i = 0, _o = Object.values(attributes); _i < _o.length; _i++) {
            var ability = _o[_i];
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
        for (var _p = 0, _q = obj_entries(CONFIG.ARd20.DamageSubTypes); _p < _q.length; _p++) {
            var _r = _q[_p], key = _r[0], dr = _r[1];
            if (!(key === "force" || key === "rad" || key === "psychic")) {
                def_dam.phys[key].value = ((_b = def_dam.phys[key]) === null || _b === void 0 ? void 0 : _b.value) || ((_c = def_dam.phys[key]) === null || _c === void 0 ? void 0 : _c.type) !== "imm" ? Math.max(isNaN(def_dam.phys[key].value) ? 0 : def_dam.phys[key].value) + def_dam.phys[key].bonus : 0;
                def_dam.phys[key].label = (_d = game.i18n.localize(CONFIG.ARd20.DamageSubTypes[key])) !== null && _d !== void 0 ? _d : CONFIG.ARd20.DamageSubTypes[key];
            }
            def_dam.mag[key].value = ((_e = def_dam.mag[key]) === null || _e === void 0 ? void 0 : _e.value) || ((_f = def_dam.mag[key]) === null || _f === void 0 ? void 0 : _f.type) !== "imm" ? Math.max(isNaN(def_dam.mag[key].value) ? 0 : def_dam.mag[key].value) + def_dam.mag[key].bonus : 0;
            def_dam.mag[key].label = (_g = game.i18n.localize(CONFIG.ARd20.DamageSubTypes[key])) !== null && _g !== void 0 ? _g : CONFIG.ARd20.DamageSubTypes[key];
        }
        //calculate rolls for character's skills
        for (var _s = 0, _t = obj_entries(data.skills); _s < _t.length; _s++) {
            var _u = _t[_s], key = _u[0], skill = _u[1];
            skill.level = skill.level < 4 ? skill.level : 4;
            skill.value = skill.level * 4 + skill.bonus;
            skill.name = (_h = game.i18n.localize(CONFIG.ARd20.Skills[key])) !== null && _h !== void 0 ? _h : CONFIG.ARd20.Skills[key];
            skill.rankName = (_j = game.i18n.localize(getValues(CONFIG.ARd20.Rank, skill.level))) !== null && _j !== void 0 ? _j : getValues(CONFIG.ARd20.Rank, skill.level);
        }
        function obj_entries(obj) {
            return Object.entries(obj);
        }
        function getValues(SourceObject, key) {
            return SourceObject[key];
        }
        function obj_keys(obj) {
            return Object.keys(obj);
        }
        //calculate character's armor,weapon and tool proficinecies
        var weapon_set = game.settings.get("ard20", "proficiencies").weapon;
        for (var _v = 0, _w = obj_keys(weapon_set); _v < _w.length; _v++) {
            var key = _w[_v];
            prof_weapon[key].value = prof_weapon[key].value ? prof_weapon[key].value : 0;
            prof_weapon[key].type = weapon_set[key].type;
            prof_weapon[key].name = weapon_set[key].name;
            prof_weapon[key].type_hover =
                (_k = game.i18n.localize(getValues(CONFIG.ARd20.WeaponType, prof_weapon[key].type))) !== null && _k !== void 0 ? _k : getValues(CONFIG.ARd20.WeaponType, prof_weapon[key].type);
            prof_weapon[key].type_value =
                (_l = game.i18n.localize(CONFIG.ARd20.Rank[prof_weapon[key].value])) !== null && _l !== void 0 ? _l : CONFIG.ARd20.Rank[prof_weapon[key].value];
        }
        if (prof_weapon.length > weapon_set.length) {
            prof_weapon.splice(weapon_set.length + 1, prof_weapon.length - weapon_set.length);
        }
        data.speed.value = ((_m = this.itemTypes.race[0]) === null || _m === void 0 ? void 0 : _m.data.data.speed) + attributes.dex.mod + data.speed.bonus;
    };
    /**
     * Prepare NPC type specific data.
     */
    ARd20Actor.prototype._prepareNpcData = function (actorData) {
        if (actorData.type !== "npc")
            return;
        // Make modifications to data here. For example:
        var data = actorData.data;
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
     * @param {Number} abilityId    The ability ID (e.g. "str")
     * @param {Object} options      Options which configure how ability tests are rolled
     * @return {Promise<Roll>}      A Promise which resolves to the created Roll instance
     */
    ARd20Actor.prototype.rollAbilityTest = function (abilityId, options) {
        var _a;
        if (options === void 0) { options = {}; }
        var label = game.i18n.localize(CONFIG.ARd20.Attributes[abilityId]);
        var abl = this.data.data.attributes;
        // Construct parts
        var parts = ["@mod"];
        var data = { mod: abl.mod };
        // Add provided extra roll parts now because they will get clobbered by mergeObject below
        if (((_a = options.parts) === null || _a === void 0 ? void 0 : _a.length) > 0) {
            parts.push.apply(parts, options.parts);
        }
        // Roll and return
        var rollData = foundry.utils.mergeObject(options, {
            parts: parts,
            data: data,
            title: game.i18n.format("ARd20.AttributePromptTitle", { ability: label }),
            messageData: {
                speaker: options.speaker || ChatMessage.getSpeaker({ actor: this }),
                "flags.ard20.roll": { type: "ability", abilityId: abilityId },
            },
        });
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
        var _a;
        if (options === void 0) { options = {}; }
        var skl = this.data.data.skills[skillId];
        // Compose roll parts and data
        var parts = ["@mod"];
        var data = { attributes: this.getRollData().attributes };
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
        if (((_a = options.parts) === null || _a === void 0 ? void 0 : _a.length) > 0) {
            parts.push.apply(parts, options.parts);
        }
        // Roll and return
        var rollData = foundry.utils.mergeObject(options, {
            parts: parts,
            data: data,
            title: game.i18n.format("ARd20.SkillPromptTitle", { skill: game.i18n.localize(CONFIG.ARd20.skills[skillId]) }),
            messageData: {
                speaker: options.speaker || ChatMessage.getSpeaker({ actor: this }),
                "flags.ard20.roll": { type: "skill", skillId: skillId },
            },
            chooseModifier: true,
        });
        return (0, dice_js_1.d20Roll)(rollData);
    };
    return ARd20Actor;
}(Actor));
exports.ARd20Actor = ARd20Actor;
