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
            width: 800,
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
            this.data.profs = duplicate(this.object.data.data.profs)
            this.data.count = {
                skills: {
                    0: 0,
                    1: 0,
                    2: 0
                },
                features: {
                    martial: 0,
                    magical: 0,
                    divine: 0,
                    primal: 0,
                    psyhic: 0
                }
            }
            this.data.content = {
                skills: {},
                features: {}
            }
            this.data.features = duplicate(this.object.data.items.filter((item) => item.data.type === 'feature'))
            if (!game.folders.filter((folder) => (folder.type === 'JournalEntry') && ((folder.data.name === 'Skills') || (folder.data.name === game.i18n.localize("ARd20.skills"))))) {
                this.data.content.skills.value = game.packs.filter((pack) => (pack.metadata.name === 'Skills') || (pack.metadata.name === game.i18n.localize("ARd20.skills")))[0]
            } else {
                this.data.content.skills.value = game.folders.filter((folder) => (folder.data.name === 'Skills') || (folder.data.name === game.i18n.localize("ARd20.skills")))[0]
            }
            this.data.content.features = game.packs.filter((pack) => (pack.metadata.name === 'Features'))

            for (let [k, v] of Object.entries(CONFIG.ARd20.skills)) {
                if (this.data.skills[k].prof === 0) {
                    this.data.count.skills[0] += 1
                } else if (this.data.skills[k].prof === 1) {
                    this.data.count.skills[1] += 1
                } else if (this.data.skills[k].prof === 2) {
                    this.data.count.skills[2] += 1
                }
            }
            for (let [k, v] of Object.entries(this.data.features)) {
                if (this.data.features[k].data.source.value === 'mar') {
                    this.data.count.features.martial += 1
                } else if (this.data.features[k].data.source.value === 'div') {
                    this.data.count.features.divine += 1
                } else if (this.data.features[k].data.source.value === 'mag') {
                    this.data.count.features.magical += 1
                } else if (this.data.features[k].data.source.value === 'pri') {
                    this.data.count.features.primal += 1
                } else if (this.data.features[k].data.source.value === 'psy') {
                    this.data.count.features.psyhic += 1
                }
            }
            this.data.hover = {
                value: "",
                name: ""
            }
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
        for (let [k, v] of Object.entries(CONFIG.ARd20.skills)) {
            this.data.skills[k].hover = game.i18n.localize(CONFIG.ARd20.prof[this.data.skills[k].prof]) ?? this.data.skills[k].prof
            this.data.skills[k].xp = (this.data.skills[k].prof < 2) ? CONFIG.ARd20.skill_xp[this.data.skills[k].prof][this.data.count.skills[this.data.skills[k].prof + 1]] : false

            if (this.data.skills[k].prof === this.object.data.data.skills[k].prof) {
                this.data.skills[k].isEq = true
            } else {
                this.data.skills[k].isEq = false
            }
            if ((this.data.xp.get >= this.data.skills[k].xp) && (this.data.skills[k].prof < 2)) {
                this.data.skills[k].isXP = false
            } else {
                this.data.skills[k].isXP = true
            }
            for (let[k,v] of Object.entries(this.data.profs)){
                v.value_hover = game.i18n.localize(CONFIG.ARd20.prof[v.value]) ?? CONFIG.ARd20.prof[v.value]
            }


        }
        const templateData = {
            abilities: this.data.abilities,
            xp: this.data.xp,
            skills: this.data.skills,
            count: this.data.count,
            content: this.data.content,
            hover: this.data.hover,
            profs: this.data.profs
        }
        console.log(templateData)
        return templateData

    }

    activateListeners (html) {
        super.activateListeners(html)
        html.find('.change').click(this._onChange.bind(this))
        html.find('.skill').mouseover(this._onHover.bind(this))
    }
    _onChange (event) {
        const button = event.currentTarget
        const data = this.data
        switch (button.dataset.type) {
            case 'ability':
                switch (button.dataset.action) {
                    case 'plus':
                        data.abilities[button.dataset.key].value += 1
                        data.xp.get -= data.abilities[button.dataset.key].xp
                        data.xp.used += data.abilities[button.dataset.key].xp
                        break
                    case 'minus':
                        data.abilities[button.dataset.key].value -= 1
                        data.xp.get += CONFIG.ARd20.abil_xp[data.abilities[button.dataset.key].value - 5] ?? CONFIG.ARd20.abil_xp[data.abilities[button.dataset.key].value - 5]
                        data.xp.used -= CONFIG.ARd20.abil_xp[data.abilities[button.dataset.key].value - 5] ?? CONFIG.ARd20.abil_xp[data.abilities[button.dataset.key].value - 5]
                        break
                }
                break
            case 'skill':
                switch (button.dataset.action) {
                    case 'plus':
                        data.skills[button.dataset.key].prof += 1
                        data.xp.get -= data.skills[button.dataset.key].xp
                        data.xp.used += data.skills[button.dataset.key].xp
                        this.data.count.skills[this.data.skills[button.dataset.key].prof] += 1
                        break
                    case 'minus':
                        data.skills[button.dataset.key].prof -= 1
                        this.data.count.skills[this.data.skills[button.dataset.key].prof + 1] -= 1
                        data.xp.get += CONFIG.ARd20.skill_xp[data.skills[button.dataset.key].prof][this.data.count.skills[this.data.skills[button.dataset.key].prof + 1]]
                        data.xp.used -= CONFIG.ARd20.skill_xp[data.skills[button.dataset.key].prof][this.data.count.skills[this.data.skills[button.dataset.key].prof + 1]]
                        break
                }
                break
            case 'prof':
                switch (button.dataset.action) {
                    case 'plus':
                        data.profs[button.dataset.key].value += 1
                        break
                    case 'minus':
                        data.profs[button.dataset.key].value -= 1
                        break
                }
                break

        }
        this.render()
    }
    _onHover (event) {
        const button = event.currentTarget
        const content = this.data.content
        switch (button.dataset.type) {
            case 'skill':
                this.data.hover.value = TextEditor.enrichHTML(content.skills.value?.content.filter((skill) => (skill.data.name === button.dataset.label))[0].data.content)
                this.data.hover.name = button.dataset.label
                break
        }
        this.render()
    }
    async _updateObject (event, formData) {
        let updateData = expandObject(formData)
        console.log(updateData)
        const actor = this.object
        this.render()
        const obj = {}
        obj['data.abilities'] = updateData.abilities
        obj['data.attributes.xp'] = updateData.xp
        obj['data.skills'] = updateData.skills
        obj['data.profs'] = updateData.profs
        console.log(obj)
        await actor.update(obj)
    }
}