export const registerSystemSettings = function () {
    game.settings.register('ard20', 'profs', {
        scope: "world",
        config: false,
        default: {
            weapon: [{
                name: "Punch Dagger", type: 'amb'
            }, {
                name: 'Whip Dagger', type: 'amb'
            }, {
                name: 'Gauntlet', type: 'amb'
            }]
        },
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
        const sheetData = {
            profs: game.settings.get('ard20', 'profs'),
            config: CONFIG.ARd20
        }
        return sheetData
    }
    activateListeners (html) {
        super.activateListeners(html)
        html.find('.add').click(this._onAdd.bind(this))
        html.find('.minus').click(this._Delete.bind(this))
    }
    async _onAdd (event) {
        event.preventDefault()
        const profs = game.settings.get('ard20', 'profs')
        profs.push({name: 'name', type: 'amb'})
        await game.settings.set('ard20', 'profs', profs)
        this.render()
    }
    async _Delete (event) {
        event.preventDefault()
        const profs = game.settings.get('ard20', 'profs')
        profs.splice(event.currentTarget.dataset.key, 1)
        await game.settings.set('ard20', 'profs', profs)
        this.render()
    }
    async _updateObject (event, formData) {
        const profs = game.settings.get('ard20', 'profs')
        let dirty = false
        for (let [fieldName, value] of Object.entries(foundry.utils.flattenObject(formData))) {
            const [index, propertyName] = fieldName.split('.')
            if (profs[index][propertyName] !== value) {
                //log({index, propertyName, value});
                profs[index][propertyName] = value
                dirty = dirty || true
            }
            if (dirty) {
                await game.settings.set('ard20', 'profs', profs)
            }
        }
    }
}