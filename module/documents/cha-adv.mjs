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

    async getData (options) {
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
            this.data.features = {
                learned: [],
                awail: []
            }
            let feat_list = []
            let temp_feat_list = []
            for (let key of game.settings.get('ard20', 'feat').packs) {
                console.log(key)
                if (game.packs.filter(pack => pack.metadata.label === key).length !== 0) {
                    feat_list.push(Array.from(game.packs.filter(pack => pack.metadata.label === key && pack.metadata.entity === 'Item')[0].index))
                    feat_list = feat_list.flat()
                    console.log('feat_list', feat_list)
                    for (let feat of feat_list) {
                        console.log(feat)
                        let new_key = game.packs.filter(pack => pack.metadata.label === key)[0].metadata.package + "." + key
                        let doc = await game.packs.get(new_key).getDocument(feat._id)
                        temp_feat_list.push(doc)
                    }
                }
            }
            for (let key of game.settings.get('ard20', 'feat').folders) {
                console.log(key)
                if (game.folders.filter(folder => folder.data.name === key).length !== 0) {
                    temp_feat_list.push(game.folders.filter(folder => folder.data.name === key && folder.data.type === 'Item')[0].content)
                    temp_feat_list = temp_feat_list.flat()
                }
            }
            this.data.features.learned = temp_feat_list.filter(feat => feat.data.data.isLearned === true)
            this.data.features.awail = temp_feat_list.filter(feat => feat.data.data.isLearned === false)


            for (let [k, v] of Object.entries(CONFIG.ARd20.skills)) {
                if (this.data.skills[k].prof === 0) {
                    this.data.count.skills[0] += 1
                } else if (this.data.skills[k].prof === 1) {
                    this.data.count.skills[1] += 1
                } else if (this.data.skills[k].prof === 2) {
                    this.data.count.skills[2] += 1
                }
            }
            for (let [k, v] of Object.entries(this.data.features.learned)) {
                console.log(k)
                console.log(v)
                if (v.data.data.source?.value === 'mar') {
                    this.data.count.features.mar += 1
                } else if (v.data.data.source?.value === 'div') {
                    this.data.count.features.div += 1
                } else if (v.data.data.source?.value === 'mag') {
                    this.data.count.features.mag += 1
                } else if (v.data.data.source?.value === 'pri') {
                    this.data.count.features.pri += 1
                } else if (v.data.data.source?.value === 'psy') {
                    this.data.count.features.psy += 1
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
            for (let [k, v] of Object.entries(this.data.profs.weapon)) {
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
            profs: this.data.profs,
            feats: this.data.features
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
                        data.profs.weapon[button.dataset.key].value += 1
                        break
                    case 'minus':
                        data.profs.weapon[button.dataset.key].value -= 1
                        break
                }
                break
            case 'feat':
                switch (button.dataset.action) {
                    case 'plus':
                        data.feats.awail[button.dataset.key].data.data.isLearned = true
                        data.count.features[data.feats.awail[button.dataset.key].data.data.source.value]+=1
                        break
                    case 'minus':
                        data.feats.awail[button.dataset.key].data.data.isLearned = false
                        data.count.features[data.feats.awail[button.dataset.key].data.data.source.value]-=1
                        break
                }

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