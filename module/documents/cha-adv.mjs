export class CharacterAdvancement extends FormApplication {

    constructor (actor, options) {
        super(actor, {
            closeOnSubmit: false,
            submitOnChange: true,
            submitOnClose: true,
            title: actor.name
        })
    }
    static get defaultOptions () {
        return foundry.utils.mergeObject(super.defaultOptions, {
            title: 'Character Advancement',
            template: 'systems/ard20/templates/actor/parts/cha-adv.html',
            id: 'cha-adv',
            width: 600,
            height: 600,
            closeOnSubmit: true,
            tabs: [{navSelector: '.sheet-tabs', contentSelector: '.sheet-body', initial: 'stats'}]
        })
    }

    getData () {
        const data = {}
        data.actor = this.object
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