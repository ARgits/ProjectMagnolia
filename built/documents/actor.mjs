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
exports.__esModule = true;
exports.ARd20Actor = void 0;
var dice_js_1 = require("../dice/dice.js");
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
        var abilities = data.abilities;
        /**
         * @param {Number} bonus bonus
         * @param {Number} type
         */
        for (var _i = 0, _a = Object.entries(CONFIG.ARd20.DamageSubTypes); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], dr = _b[1];
            if (!(key === "force" || key === "rad" || key === "psyhic")) {
                def_dam.phys[key] = {
                    bonus: 0,
                    type: "res"
                };
            }
            def_dam.mag[key] = {
                bonus: 0,
                type: "res"
            };
        }
        for (var _c = 0, _d = Object.entries(def_stats); _c < _d.length; _c++) {
            var _e = _d[_c], key = _e[0], def = _e[1];
            def.bonus = 0;
        }
        for (var _f = 0, _g = Object.entries(abilities); _f < _g.length; _f++) {
            var _h = _g[_f], key = _h[0], ability = _h[1];
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
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        if (actorData.type !== "character")
            return;
        // Make modifications to data here. For example:
        var data = actorData.data;
        var abilities = data.abilities;
        var attributes = data.attributes;
        var def_stats = data.defences.stats;
        var def_dam = data.defences.damage;
        data.heavyPoints = 0;
        this.itemTypes.armor.forEach(function (item) {
            if (item.data.data.equipped) {
                for (var _i = 0, _a = Object.entries(CONFIG.ARd20.DamageSubTypes); _i < _a.length; _i++) {
                    var _b = _a[_i], key = _b[0], dr = _b[1];
                    if (!(key === "force" || key === "rad" || key === "psyhic")) {
                        var ph = item.data.data.res.phys[key];
                        def_dam.phys[key].bonus += ph !== "imm" ? parseInt(ph) : 0;
                        def_dam.phys[key].type = ph === "imm" ? "imm" : def_dam.phys[key].type;
                    }
                    var mg = item.data.data.res.mag[key];
                    def_dam.mag[key].bonus += mg !== "imm" ? parseInt(mg) : 0;
                    def_dam.mag[key].type = mg === "imm" ? "imm" : def_dam.mag[key].type;
                }
                data.heavyPoints += item.data.data.heavyPoints;
            }
        });
        // Loop through ability scores, and add their modifiers to our sheet output.
        for (var _i = 0, _l = Object.entries(abilities); _i < _l.length; _i++) {
            var _m = _l[_i], key = _m[0], ability = _m[1];
            // Calculate the modifier using d20 rules.
            ability.total = ability.value + ability.bonus;
            ability.mod = Math.floor((ability.value - 10) / 2);
        }
        var dexMod = data.heavyPoints < 10 ? abilities.dex.mod : data.heavyPoints < 16 ? Math.min(2, abilities.dex.mod) : Math.min(0, abilities.dex.mod);
        //calculate level and expierence
        var levels = CONFIG.ARd20.CHARACTER_EXP_LEVELS;
        if (attributes.xp.used) {
            attributes.xp.used = (_a = attributes.xp.used) !== null && _a !== void 0 ? _a : 0;
        }
        for (var i = 1; i < 21; i++) {
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
        for (var _o = 0, _p = Object.entries(CONFIG.ARd20.DamageSubTypes); _o < _p.length; _o++) {
            var _q = _p[_o], key = _q[0], dr = _q[1];
            if (!(key === "force" || key === "rad" || key === "psyhic")) {
                def_dam.phys[key].value =
                    ((_b = def_dam.phys[key]) === null || _b === void 0 ? void 0 : _b.value) || ((_c = def_dam.phys[key]) === null || _c === void 0 ? void 0 : _c.type) !== "imm" ? Math.max(isNaN(def_dam.phys[key].value) ? 0 : def_dam.phys[key].value) + parseInt(def_dam.phys[key].bonus) : 0;
                def_dam.phys[key].label = (_d = game.i18n.localize(CONFIG.ARd20.DamageSubTypes[key])) !== null && _d !== void 0 ? _d : CONFIG.ARd20.DamageSubTypes[key];
            }
            def_dam.mag[key].value =
                ((_e = def_dam.mag[key]) === null || _e === void 0 ? void 0 : _e.value) || ((_f = def_dam.mag[key]) === null || _f === void 0 ? void 0 : _f.type) !== "imm" ? Math.max(isNaN(def_dam.mag[key].value) ? 0 : def_dam.mag[key].value) + parseInt(def_dam.mag[key].bonus) : 0;
            def_dam.mag[key].label = (_g = game.i18n.localize(CONFIG.ARd20.DamageSubTypes[key])) !== null && _g !== void 0 ? _g : CONFIG.ARd20.DamageSubTypes[key];
        }
        //calculate rolls for character's skills
        for (var _r = 0, _s = Object.entries(data.skills); _r < _s.length; _r++) {
            var _t = _s[_r], key = _t[0], skill = _t[1];
            skill.prof = skill.prof < 2 ? skill.prof : 2;
            if (skill.prof == 0) {
                skill.prof_die = 0;
                skill.prof_bonus = 0;
            }
            if (skill.prof == 1) {
                skill.prof_bonus = 0;
                skill.prof_die = "1d".concat(attributes.prof_bonus * 2);
            }
            if (skill.prof == 2) {
                skill.prof_die = "1d".concat(attributes.prof_bonus * 2);
                skill.prof_bonus = attributes.prof_bonus;
            }
        }
        //calculate character's armor,weapon and tool proficinecies
        if (!data.profs) {
            data.profs = { weapon: game.settings.get("ard20", "profs").weapon };
        }
        for (var _u = 0, _v = Object.keys(game.settings.get("ard20", "profs").weapon); _u < _v.length; _u++) {
            var prof = _v[_u];
            data.profs.weapon[prof].value = data.profs.weapon[prof].value ? data.profs.weapon[prof].value : 0;
            data.profs.weapon[prof].type = game.settings.get("ard20", "profs").weapon[prof].type;
            data.profs.weapon[prof].name = game.settings.get("ard20", "profs").weapon[prof].name;
            data.profs.weapon[prof].type_hover = (_h = game.i18n.localize(CONFIG.ARd20.WeaponType[data.profs.weapon[prof].type])) !== null && _h !== void 0 ? _h : CONFIG.ARd20.WeaponType[data.profs.weapon[prof].type];
            data.profs.weapon[prof].type_value = (_j = game.i18n.localize(CONFIG.ARd20.prof[data.profs.weapon[prof].value])) !== null && _j !== void 0 ? _j : CONFIG.ARd20.prof[data.profs.weapon[prof].value];
        }
        if (data.profs.weapon.length > game.settings.get("ard20", "profs").weapon.length) {
            data.profs.splice(game.settings.get("ard20", "profs").weapon.length + 1, data.profs.length - game.settings.get("ard20", "profs").weapon.length);
        }
        data.speed.value = ((_k = this.itemTypes.race[0]) === null || _k === void 0 ? void 0 : _k.data.data.speed) + abilities.dex.mod + data.speed.bonus;
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
     * @param {String} abilityId    The ability ID (e.g. "str")
     * @param {Object} options      Options which configure how ability tests are rolled
     * @return {Promise<Roll>}      A Promise which resolves to the created Roll instance
     */
    ARd20Actor.prototype.rollAbilityTest = function (abilityId, options) {
        var _a;
        if (options === void 0) { options = {}; }
        var label = game.i18n.localize(CONFIG.ARd20.abilities[abilityId]);
        var abl = this.data.data.abilities[abilityId];
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
                "flags.ard20.roll": { type: "ability", abilityId: abilityId }
            }
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
        var data = { abilities: this.getRollData().abilities };
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
                "flags.ard20.roll": { type: "skill", skillId: skillId }
            },
            chooseModifier: true
        });
        return (0, dice_js_1.d20Roll)(rollData);
    };
    return ARd20Actor;
}(Actor));
exports.ARd20Actor = ARd20Actor;
