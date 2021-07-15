import {ARd20Actor} from "./actor.mjs"
export class CharacterAdvancement extends FormApplication {
    /*    constructor(object,options){
            super(object,options);
            submitOnChange: false
    
        }
      */
    static get defaultOptions () {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["ard20"],
            title: 'Character Advancement',
            template: 'systems/ard20/templates/actor/parts/cha-adv.html',
            id: 'cha-adv',
            width: 600,
            height: 800,
            tabs: [{navSelector: '.sheet-tabs', contentSelector: '.sheet-body', initial: 'stats'}],
            closeOnSubmit: false
        })
    }

    getData (options) {
        const data = {}
        data.original = this.object.data.data
        data.advanced = this.object.data.adv
        for (let [k, v] of Object.entries(CONFIG.ARd20.abilities)) {
            data.original.abilities[k].mod = Math.floor((data.original.abilities[k].value - 10) / 2)
            data.advanced.abilities[k].mod = Math.floor((data.advanced.abilities[k].value - 10) / 2)
            if (data.original.abilities[k].value === data.advanced.abilities[k].value) {
                data.advanced.abilities[k].isEq = true
            } else {
                data.advanced.abilities[k].isEq = false
            }
        }
        return {
            advanced: data.advanced,
            original: data.original
        }
    }

    activateListeners (html) {
        super.activateListeners(html)
        html.find('.change').click(this._onChange.bind(this))
    }
    _onChange (event) {
        const button = event.currentTarget
        const data = this.getData()
        switch (button.dataset.action) {
            case 'plus':
                data.advanced.abilities[button.dataset.key].value += 1
                this.submit()
                break
            case 'minus':
                data.advanced.abilities[button.dataset.key].value -= 1
                this.submit()
                break
            case 'submit':
                this.submit()
                this.close()
                break
        }
        this.render()
        return data
    }
    async _updateObject (event, formData) {
        let updateData = expandObject(formData)
        const actor = this.object
        this.render()
        return actor.update({'data.attributes': updateData})
    }
}