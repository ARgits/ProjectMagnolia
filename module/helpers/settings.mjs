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
            closeOnSubmit: false,
        })
    }
    getData (options) {
        if (!this.data) {
            const data = this.data = {}
            const prof = data.prof = CONFIG.ARd20.WeaponSubType
        }
        this.data.html = $(this._element.children[1])
        console.log(this)
        const templateData = {
            html: this.data.html
        }
        return templateData
    }
    activateListeners (html) {
        super.activateListeners(html)
        html.find('.add').click(this._onAdd.bind(this))
    }
    _onAdd (event) {
        const html = this.getData().html
        console.log(html)
        let div = html.find('div')
        console.log(div)
        div.add("<input class='item' type='text' name='prof1' />").appendTo(div)
        console.log(div)
        this.render()

    }
    async _updateObject (event, formData) {}
}