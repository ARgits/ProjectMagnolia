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
        data.abilities = foundry.utils.getProperty(this.object.data.data, 'abilities')
        return data
    }

    activateListeners (html) {
        super.activateListeners(html)
    }

    async _updateObject (event, formData) {
        const actor = this.object
        let updateData = expandObject(formData)
        await actor.update(updateData, {diff: false})
    }
}