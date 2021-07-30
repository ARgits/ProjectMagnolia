export const registerSystemSettings = function () {
    game.settings.register('ard20', 'profs', {
        scope: "world",
        config: false,
        default: {},
        type: Object,
        onChange: value => {
            console.log('Настройка изменилась ', value)
        }
    })
    game.settings.registerMenu("ard20", "gearProfManage", {
        name: "SETTINGS.ProfManage",
        label: "SETTINGS.ProfManage",
        scope: "world",
        type: ProfFormApp,
        restricted: false,
        icon: "fab fa-buffer"
    })
}
class ProfFormApp extends FormApplication {
    static get defaultOptions () {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["ard20"],
            title: 'Armor/Weapon Proficiencies',
            template: 'systems/ard20/templates/app/prof-settings.html',
            id: 'prof-settings',
            width: 600,
            height: 'auto',
            submitOnChange: true,
            closeOnSubmit: false,
        })
    }
    getData (options) {
        if (!this.data) {
            this.data = {}
            this.data.prof = duplicate(game.settings.get('ard20', 'profs'))
        }
        this.data.config = duplicate(CONFIG.ARd20.WeaponType)
        console.log('Форма ', this)
        for (let [k, v] of Object.entries(this.data.prof)) {
            k.name = k.name ?? ""
            k.type = k.type ?? "amb"
        }
        const templateData = {
            prof: this.data.prof,
            config: this.data.config
        }
        console.log('Данные формы ', this.data)
        console.log('TemplateData ', templateData)
        return templateData
    }
    activateListeners (html) {
        super.activateListeners(html)
        html.find('.add').click(this._onAdd.bind(this))
        html.find('.minus').click(this._Delete.bind(this))
    }
    _onAdd (event) {
        const number = Math.floor(Math.random() * 100)
        let label = "p" + number
        if (this.data.prof.label) {
            while (this.data.prof[label]) {
                label = "p" + Math.floor(Math.random() * 100)
            }
            this.data.prof[label] = {
                name: this.data.prof[label].name ?? "",
                type: ""
            }
        } else {
            this.data.prof[label] = {
                name: this.data.prof[label].name ?? "",
                type: ""
            }
        }
    }
    _Delete (event) {
        const button = event.currentTarget
        Reflect.deleteProperty(this.data.prof, `${[button.dataset.key]}`)
    }
    async _onChangeInput (event) {
        await super._onChangeInput(event)
        console.log('event', event)
        console.log('event data', this.data.prof[event.currentTarget.dataset.key])
        const input = this.form[`prof.${event.currentTarget.dataset.key}.${event.currentTarget.dataset.name}`].value
        console.log(input)
        this.data.prof[event.currentTarget.dataset.key][event.currentTarget.dataset.name] = input

    }
    async _updateObject (event, formData) {
        let updateData = expandObject(formData)
        console.log('UpdateData ', updateData)
        game.settings.set('ard20', 'profs', updateData.prof)
        this.render()
    }
}