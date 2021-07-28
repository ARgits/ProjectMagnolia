export const registerSystemSettings = function () {
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
        })
    }
    getData (options) {
        if (!this.data) {
            this.data = {}
            this.data.prof = duplicate(CONFIG.ARd20.WeaponSubType)
            this.data.config = duplicate(CONFIG.ARd20.WeaponType)
            console.log(this.data)
        }
        const templateData = {
            prof: this.data.prof,
            config: this.data.config
        }

        return templateData
    }
    activateListeners (html) {
        super.activateListeners(html)
        html.find('.add').click(this._onAdd.bind(this))
        html.find('input.prof').change(this._onChange.bind(this))
    }
    _onAdd (event) {
        const prof = this.getData().prof
        const number = Object.keys(prof).length
        this.data.prof[number] = {
            name: "",
            type: ""
        }
        this.render()

    }
    _onChange(event){
        const input = event.currentTarget
        const prof = this.getData().prof
        prof[input.dataset.key].name=!prof[input.dataset.key].name
        this.render()
    }
    async _updateObject (event, formData) {
        let updateData = expandObject(formData)
        console.log(updateData)
        this.render()
    }
}