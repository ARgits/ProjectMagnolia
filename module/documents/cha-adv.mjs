import {ARd20Actor} from "./actor.mjs"
export class CharacterAdvancement extends FormApplication {
    static get defaultOptions () {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["ard20"],
            title: 'Character Advancement',
            template: 'systems/ard20/templates/actor/parts/cha-adv.html',
            id: 'cha-adv',
            width: 600,
            height: "auto",
            tabs: [{navSelector: '.sheet-tabs', contentSelector: '.sheet-body', initial: 'stats'}]
        })
    }

    getData (options) {
        const data = {}
        const abilities = data.abilities = {
        }
        for (let [k, v] of Object.entries(CONFIG.ARd20.abilities)) {
            abilities[k] = {}
            abilities[k].value = foundry.utils.getProperty(this.object.data, `data.abilities.${k}.value`)
            abilities[k].mod = foundry.utils.getProperty(this.object.data, `data.abilities.${k}.mod`)
        }
        return {
            abilities: abilities
        }
    }

    activateListeners (html) {
        super.activateListeners(html)
    }

    async _updateObject (event, formData) {
        const data = foundry.utils.expandObject(formData)
        return this.object.update({'data.abilities': data})
    }
}