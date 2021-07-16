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
            height: 'auto',
            tabs: [{navSelector: '.sheet-tabs', contentSelector: '.sheet-body', initial: 'stats'}],
            closeOnSubmit:false,
        })
    }

    getData (options) {
        const data = {}
        data.actor = this.object
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
            abilities: data.advanced.abilities
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
                data.abilities[button.dataset.key].value += 1
                break
            case 'minus':
                data.abilities[button.dataset.key].value -= 1
                break
        }
        return data
    }
    async _updateObject (event, formData) {
        let updateData = expandObject(formData)
        console.log(updateData)
        const actor = this.object
        const data = actor.data.data
        console.log(data)
        this.render()
    }
}