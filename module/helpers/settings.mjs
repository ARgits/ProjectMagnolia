export const registerSystemSettings = function () {
    game.settings.register('ard20', 'profs', {
        scope: "world",
        config: false,
        default: {},
        type: Object
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
            closeOnSubmit: false,
        })
    }
    getData (options) {
        if (!this.data) {
            this.data = {}
            this.data.prof = duplicate(game.settings.get('ard20', 'profs'))
            this.data.config = duplicate(CONFIG.ARd20.WeaponType)
            console.log(this)
            console.log(this.data)
            const templateData = {
                prof: this.data.prof,
                config: this.data.config

            }
        }
        console.log(templateData)
        return templateData
    }
    activateListeners (html) {
        super.activateListeners(html)
        html.find('.add').click(this._onAdd.bind(this))
    }
    _onAdd (event) {
        const prof = this.getData().prof
        const number = Object.keys(prof).length
        const label = "p" + number
        this.data.prof[label] = {
            name: String,
            type: String
        }
        this.render()

    }
    async _updateObject (event, formData) {
        let updateData = expandObject(formData)
        console.log(updateData)
        game.settings.set('ard20', 'profs', {default: updateData.prof})
        this.render()
    }
}