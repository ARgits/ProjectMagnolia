export class CharacterAdvancement extends DocumentSheet {
    static get defaultOptions () {
        return mergeObject(super.defaultOptions, {
            title: 'Character Advancement',
            template: '/templates/actor/parts/cha-adv.html',
            id: 'cha-adv',
            width: 600,
            height: 600,
            closeOnSubmit: true,
            tabs: [{navSelector: '.tabs', contentSelector: 'sheet-body', initial: 'stats'}]
        })
    }

    getData () {
        const data = {}
        data.actor = this.object;
        return super.getData().object // the object from the constructor is where we are storing the data
    }

    activateListeners (html) {
        super.activateListeners(html)
    }

    async _updateObject (event, formData) {
        const actor = this.object;
        let updateData = expandObject(formData);
        await actor.update(updateData,{diff:false})
        return
    }
}