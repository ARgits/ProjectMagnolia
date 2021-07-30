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
        restricted: true,
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
        })
    }
    getData (options) {
        if (!this.data) {
            this.data = {}
            this.data.config = duplicate(CONFIG.ARd20.WeaponType)
            console.log('Форма ', this)
            this.data.prof = duplicate(game.settings.get('ard20', 'profs'))
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
        const prof = this.getData().prof
        const number = Object.keys(prof).length
        const label = "p" + number
        this.data.prof[label] = {
            name: "",
            type: ""
        }
        this.render()
    }
    _Delete (event) {
        const button = event.currentTarget
        Reflect.deleteProperty(this.data.prof, `${[button.dataset.key]}`)
        this.render()
    }
    async _updateObject (event, formData) {
        let updateData = expandObject(formData)
        console.log('UpdateData ', updateData)
        game.settings.set('ard20', 'profs', updateData.prof)
        this.render()
    }
}