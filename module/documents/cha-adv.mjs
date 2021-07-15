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
            closeOnSubmit: false,
            submitOnChange: false,
        })
    }

    getData (options) {
        const data = this.object.data
        const original = data.data
        const advanced = data.adv
        for (let [k, v] of Object.entries(CONFIG.ARd20.abilities)) {
            //original.abilities[k] = {}
            //original.abilities[k].value = foundry.utils.getProperty(this.object.data, `data.abilities.${k}.value`)
            original.abilities[k].mod = Math.floor((original.abilities[k].value - 10) / 2)
            advanced.data.abilities[k].mod = Math.floor((advanced.data.abilities[k].value - 10) / 2)
            //original.abilities[k].label = game.i18n.localize(CONFIG.ARd20.abilities[k]) ?? k
        }
        return advanced
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
                console.log(data.abilities[button.dataset.key].value)
                data.abilities[button.dataset.key].value += 1
                console.log(data.abilities[button.dataset.key].value)
                break
            case 'minus':
                data.abilities[button.dataset.key].value -= 1
                break
        }
        return data
    }


    async _updateObject (event, formData) {
        let updateData = expandObject(formData)
        const actor = this.object
        let data = this.getData
        console.log(data)
        console.log(this.object.data.data.abilitites)
        //await actor.update({'data.data.abilities':updateData})
        this.render()
        console.log(data)
        console.log(this.object.data.data.abilitites)
    }
}