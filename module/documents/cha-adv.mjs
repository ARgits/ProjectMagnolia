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
        })
    }

    getData (options) {
        if (!this.data) {
            this.data = {}
            this.data.abilities = duplicate(this.object.data.data.abilities)
            this.data.skills = duplicate(this.object.data.data.skills)
            this.data.xp = duplicate(this.object.data.data.attributes.xp)
        }
        for (let [k, v] of Object.entries(CONFIG.ARd20.abilities)) {
            this.data.abilities[k].mod = Math.floor((this.data.abilities[k].value - 10) / 2)
            this.data.abilities[k].xp = CONFIG.ARd20.abil_xp[this.data.abilities[k].value - 5]
            if (this.data.abilities[k].value === this.object.data.data.abilities[k].value) {
                this.data.abilities[k].isEq = true
            } else {
                this.data.abilities[k].isEq = false
            }
            if (this.data.xp.get >= this.data.abilities[k].xp) {
                this.data.abilities[k].isXP = false
            } else {
                this.data.abilities[k].isXP = true
            }
        }
        const templateData = {
            abilities: this.data.abilities,
            xp: this.data.xp
        }
        return templateData

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
                data.xp.get -= data.abilities[button.dataset.key].xp
                data.xp.used += data.abilities[button.dataset.key].xp
                break
            case 'minus':
                data.abilities[button.dataset.key].value -= 1
                data.xp.get += CONFIG.ARd20.abil_xp[data.abilities[button.dataset.key].value - 6] ?? CONFIG.ARd20.abil_xp[data.abilities[button.dataset.key].value - 5]
                data.xp.used -= CONFIG.ARd20.abil_xp[data.abilities[button.dataset.key].value - 6] ?? CONFIG.ARd20.abil_xp[data.abilities[button.dataset.key].value - 5]
                break
        }
        this.render()
    }
    async _updateObject (event, formData) {
        let updateData = expandObject(formData)
        console.log(updateData)
        const actor = this.object
        this.render()
        const obj={}
        obj['data.abilities'] = updateData.abilities
        obj['data.attributes.xp'] = updateData.xp
        console.log(obj)
        await actor.update(obj)
    }
}