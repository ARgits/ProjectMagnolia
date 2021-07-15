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
            closeOnSubmit:false
        })
    }

    getData (options) {
        const data ={}
        data.original = this.object.data.data
        data.advanced = this.object.data.adv
        for (let [k, v] of Object.entries(CONFIG.ARd20.abilities)) {
            //original.abilities[k] = {}
            //original.abilities[k].value = foundry.utils.getProperty(this.object.data, `data.abilities.${k}.value`)
            data.original.abilities[k].mod = Math.floor((data.original.abilities[k].value - 10) / 2)
            data.advanced.abilities[k].mod = Math.floor((data.advanced.abilities[k].value - 10) / 2)
            //original.abilities[k].label = game.i18n.localize(CONFIG.ARd20.abilities[k]) ?? k
        }
        console.log('Подготовлены данные')
        console.log(data)
        console.log(data.original)
        console.log(data.advanced)
        console.log('----------------------------------')
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
                console.log(data.advanced.abilities[button.dataset.key].value)
                data.advanced.abilities[button.dataset.key].value += 1
                console.log(data.advanced.abilities[button.dataset.key].value)
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
        let data = this.getData()
        console.log('Данные обновляются')
        console.log(data.advanced)
        console.log(data.original)
        //await actor.update({'data.data.abilities':updateData})
        this.render()
        console.log('Данные обновились')
        console.log(data.advanced)
        console.log(data.original)
    }
}