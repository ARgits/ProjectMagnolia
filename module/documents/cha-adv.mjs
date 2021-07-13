import {ARd20Actor} from "./actor.mjs"
export class CharacterAdvancement extends FormApplication {
    static get defaultOptions () {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["ard20"],
            title: 'Character Advancement',
            template: 'systems/ard20/templates/actor/parts/cha-adv.html',
            id: 'cha-adv',
            width: 600,
            height: 800,
            tabs: [{navSelector: '.sheet-tabs', contentSelector: '.sheet-body', initial: 'stats'}]
        })
    }

    getData (options) {
        const original = {}
        const advanced = {}
        original.abilities = {
        }
        for (let [k, v] of Object.entries(CONFIG.ARd20.abilities)) {
            original.abilities[k] = {}
            original.abilities[k].value = foundry.utils.getProperty(this.object.data, `data.abilities.${k}.value`)
            original.abilities[k].mod = foundry.utils.getProperty(this.object.data, `data.abilities.${k}.mod`)
            original.abilities[k].label = game.i18n.localize(CONFIG.ARd20.abilities[k]) ?? k
        }
        advanced.abilities = original.abilities
        return {
            original: original,
            advanced: advanced
        }
    }

    activateListeners (html) {
        super.activateListeners(html)
 //       html.find('.change').click(this._Change(this))
    }
    /*   _Change(event){
       super._Change(event);
           const button = event.currentTarget;
           let value;
           switch(button.dataset.action){
               
               case "plus": 
               app = 
               break;} 
           }
   
           */

    async _updateObject (event, formData) {
        const data = foundry.utils.expandObject(formData)
        return this.object.update({'data.abilities': data})
    }
}