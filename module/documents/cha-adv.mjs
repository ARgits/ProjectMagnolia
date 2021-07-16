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
            closeOnSubmit: false,
        })
    }

    getData (options) {
        if (!this.data) {
            this.data = {}
            this.data.original = duplicate(this.object.data.data)
            this.data.advanced = duplicate(this.object.data.adv)
            for (let [k, v] of Object.entries(CONFIG.ARd20.abilities)) {
                this.data.original.abilities[k].mod = Math.floor((this.data.original.abilities[k].value - 10) / 2)
                this.data.advanced.abilities[k].mod = Math.floor((this.data.advanced.abilities[k].value - 10) / 2)
                if (this.data.original.abilities[k].value === this.data.advanced.abilities[k].value) {
                    this.data.advanced.abilities[k].isEq = true
                } else {
                    this.data.advanced.abilities[k].isEq = false
                }
            }
        }
        return {
            abilities: this.data.advanced.abilities
        }
    }

    activateListeners (html) {
        super.activateListeners(html)
        html.find('.change').click(this._onChange.bind(this))
    }
    _onChange (event) {
        const button = event.currentTarget
        const data = this.getData()
        console.log(data)
        switch (button.dataset.action) {
            case 'plus':
                console.log('now', data.abilities[button.dataset.key].value)
                data.abilities[button.dataset.key].value += 1
                console.log('update', data.abilities[button.dataset.key].value)
                break
            case 'minus':
                data.abilities[button.dataset.key].value -= 1
                break
        }
        this.render()
    }
    async _updateObject (event, formData) {
        let updateData = expandObject(formData)
        console.log(updateData)
        const actor = this.object
        const data = actor.data.data
        this.render()
        await actor.update({'data.abilities': updateData.abilities})
    }
}