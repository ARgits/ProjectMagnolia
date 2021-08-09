
/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class ARd20Actor extends Actor {

    /** @override */
    prepareData () {
        // Prepare data for the actor. Calling the super version of this executes
        // the following, in order: data reset (to clear active effects),
        // prepareBaseData(), prepareEmbeddedDocuments() (including active effects),
        // prepareDerivedData().
        super.prepareData()
        this.items.forEach(item => item.prepareFinalAttributes())
    }

    /** @override */
    prepareBaseData () {
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
    prepareDerivedData () {
        const actorData = this.data
        const data = actorData.data
        const flags = actorData.flags.ard20 || {}

        // Make separate methods for each Actor type (character, npc, etc.) to keep
        // things organized.
        this._prepareCharacterData(actorData)
        this._prepareNpcData(actorData)
    }

    /**
     * Prepare Character type specific data
     */
    _prepareCharacterData (actorData) {
        if (actorData.type !== 'character') return

        // Make modifications to data here. For example:
        const data = actorData.data

        // Loop through ability scores, and add their modifiers to our sheet output.
        for (let [key, ability] of Object.entries(data.abilities)) {
            // Calculate the modifier using d20 rules.
            ability.mod = Math.floor((ability.value - 10) / 2)
        };
        const levels = CONFIG.ARd20.CHARACTER_EXP_LEVELS
        if (data.attributes.xp.used) {
            data.attributes.xp.used = data.attributes.xp.used ?? 0
        }
        for (let i = 1; i < 21; i++) {
            if (data.attributes.xp.used >= levels[i - 1] && data.attributes.xp.used < levels[i]) {
                data.attributes.level = i
                data.attributes.xp.level = levels[i]
                data.attributes.xp.level_min = levels[i - 1]
            }
        }
        data.attributes.xp.bar_max = data.attributes.xp.level - data.attributes.xp.level_min
        data.attributes.xp.bar_min = data.attributes.xp.used - data.attributes.xp.level_min
        data.attributes.prof_bonus = Math.floor((7 + data.attributes.level) / 4)
        data.attributes.prof_die = "1d" + data.attributes.prof_bonus * 2
        data.defences = {
            reflex: {
                bonus = data.defences.reflex.bonus ?? 0,
                value: 8 + data.attributes.prof_bonus + data.abilities.dex.mod + data.abilities.int.mod+data.defences.reflex.bonus,
                label: "Reflex"
            },
            fortitude: {
                bonus = data.defences.fortitude.bonus ?? 0,
                value: 8 + data.attributes.prof_bonus + data.abilities.con.mod + data.abilities.str.mod+data.defences.fortitude.bonus,
                label: "Fortitude"
            },
            will: {
                bonus = data.defences.will.bonus ?? 0,
                value: 8 + data.attributes.prof_bonus + data.abilities.wis.mod + data.abilities.cha.mod+data.defences.will.bonus,
                label: "Will"
            }
        }
        if (!data.defences.damage) {
            data.defences.damage = {
                physic: {},
                magic: {}
            }
        }
        for (let [key, dr] of Object.entries(CONFIG.ARd20.DamageSubTypes)) {
            if (!((key === 'force') || (key === 'rad') || (key === 'psyhic'))) {
                data.defences.damage.physic[key] = {
                    value: data.defences.damage.physic[key]?.value ? data.defences.damage.physic[key].value : 0,
                    label: game.i18n.localize(CONFIG.ARd20.DamageSubTypes[key]) ?? CONFIG.ARd20.DamageSubTypes[key]
                }
            }
            data.defences.damage.magic[key] = {
                value: data.defences.damage.magic[key]?.value ? data.defences.damage.magic[key].value : 0,
                label: game.i18n.localize(CONFIG.ARd20.DamageSubTypes[key]) ?? CONFIG.ARd20.DamageSubTypes[key]
            }
        }
        for (let [key, skill] of Object.entries(data.skills)) {
            skill.prof = (skill.prof < 2) ? skill.prof : 2
            if (skill.prof == 0) {
                skill.roll = "1d20"
            };
            if (skill.prof == 1) {
                skill.roll = "1d20+" + data.attributes.prof_die
            };
            if (skill.prof == 2) {
                skill.roll = "1d20+" + data.attributes.prof_die + "+" + data.attributes.prof_bonus
            }
        }
        if (!data.isReady) {
            data.isReady = false
        }
        if (!data.profs) {
            data.profs = Object.fromEntries(Object.entries(game.settings.get('ard20', 'profs')))
        }
        for (let prof of Object.keys(game.settings.get('ard20', 'profs'))) {
            data.profs[prof].value = data.profs[prof].value ? data.profs[prof].value : 0
            data.profs[prof].type = game.settings.get('ard20', 'profs')[prof].type
            data.profs[prof].name = game.settings.get('ard20', 'profs')[prof].name
            data.profs[prof].type_hover = game.i18n.localize(CONFIG.ARd20.WeaponType[data.profs[prof].type]) ?? CONFIG.ARd20.WeaponType[data.profs[prof].type]
            data.profs[prof].type_value = game.i18n.localize(CONFIG.ARd20.prof[data.profs[prof].value]) ?? CONFIG.ARd20.prof[data.profs[prof].value]
        }
        if (data.profs.length > game.settings.get('ard20', 'profs').length) {
            data.profs.splice(game.settings.get('ard20', 'profs').length + 1, data.profs.length - game.settings.get('ard20', 'profs').length)
        }
    }

    /**
     * Prepare NPC type specific data.
     */
    _prepareNpcData (actorData) {
        if (actorData.type !== 'npc') return

        // Make modifications to data here. For example:
        const data = actorData.data
        data.xp = (data.cr * data.cr) * 100
    }

    /**
     * Override getRollData() that's supplied to rolls.
     */
    getRollData () {
        const data = super.getRollData()

        // Prepare character roll data.
        this._getCharacterRollData(data)
        this._getNpcRollData(data)

        return data
    }

    /**
     * Prepare character roll data.
     */
    _getCharacterRollData (data) {
        if (this.data.type !== 'character') return

        // Copy the ability scores to the top level, so that rolls can use
        // formulas like `@str.mod + 4`.
        if (data.abilities) {
            for (let [k, v] of Object.entries(data.abilities)) {
                data[k] = foundry.utils.deepClone(v)
            }
        }
    }

    /**
     * Prepare NPC roll data.
     */
    _getNpcRollData (data) {
        if (this.data.type !== 'npc') return

        // Process additional NPC data here.
    }

}