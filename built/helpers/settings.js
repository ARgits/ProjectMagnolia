import {AdvRateSettingsShim} from '../../svelte/advancement-rate/advancement-rate.js'
import {FeatSettingsShim} from '../../svelte/FeatSetting/featSetting.js'
export const registerSystemSettings = function () {
    game.settings.register("ard20", "proficiencies", {
        scope: "world",
        config: false,
        default: {
            weapon: [
                { name: "Punch Dagger", type: "amb" },
                { name: "Whip Dagger", type: "amb" },
                { name: "Gauntlet", type: "amb" },
                { name: "Hidden Blade", type: "amb" },
                { name: "Knucke Axe", type: "amb" },
                { name: "Side Baton", type: "amb" },
                { name: "Unarmed strike", type: "amb" },
                { name: "Battle Axe", type: "axe" },
                { name: "Great Axe", type: "axe" },
                { name: "Handaxe", type: "axe" },
                { name: "Hook Sword", type: "axe" },
                { name: "Khopesh", type: "axe" },
                { name: "Poleaxe", type: "axe" },
                { name: "Tomahawk", type: "axe" },
                { name: "Great club", type: "blu" },
                { name: "Heavy club", type: "blu" },
                { name: "Light Club", type: "blu" },
            ],
            armor: [],
            tools: [],
            skills: [],
        },
        onChange: (value) => {
            console.log("Настройка изменилась ", value);
        },
    });
    game.settings.registerMenu("ard20", "gearProfManage", {
        name: "SETTINGS.ProfManage",
        label: "SETTINGS.ProfManage",
        type: ProfFormApp,
        restricted: false,
        icon: "fab fa-buffer",
    });
    game.settings.register("ard20", "feat", {
        scope: "world",
        config: false,
        default: {
            packs: [],
            folders: [],
        },
        onChange: (value) => {
            console.log("Настройка изменилась", value);
        },
    });
    game.settings.registerMenu("ard20", "featManage", {
        name: "SETTINGS.FeatureManage",
        label: "SETTINGS.FeatureManage",
        type: FeatSettingsShim,
        restricted: false,
    });
    game.settings.register("ard20", "advancement-rate", {
        scope: "world",
        config: false,
        default: {
            variables: {
                skillCount: {
                    value:5,
                    shortName:'SC',
                    longName:'Skill Count',
                },
                featureCount: {
                    value:5,
                    shortName:'FC',
                    longName:'featureCount'
                },
                skillValue: {
                    value:5,
                    shortName:'SV',
                    longName:'skillValue'
                },
                featureLevel: {
                    value:5,
                    shortName:'FL',
                    longName:'Feature Level'
                },
                attributeValue:{
                    value:5,
                    shortName:'AV',
                    longName:'Attribute Value'
                },
            },
            formulas: {
                skills: "",
                features: "n",
                attributes: "max(floor((AS-10)/2)+2,1)",
            },
        },
        onChange: (value) => {
            console.log("Настройка изменилась", value);
        },
    });
    game.settings.registerMenu("ard20", "advancementRateManage", {
        name: "SETTINGS.AdvancementRateManage",
        label: "SETTINGS.AdvancementRateManage",
        type: AdvRateSettingsShim,
        restricted: false,
    });
};
class ProfFormApp extends FormApplication {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["ard20"],
            title: "Armor/Weapon Proficiencies",
            template: "systems/ard20/templates/app/prof-settings.html",
            id: "prof-settings",
            width: 600,
            height: "auto",
            submitOnChange: true,
            closeOnSubmit: false,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "weapons" }],
        });
    }
    //@ts-expect-error
    getData() {
        const sheetData = {
            proficiencies: game.settings.get("ard20", "proficiencies"),
            config: CONFIG.ARd20,
        };
        return sheetData;
    }
    //@ts-expect-error
    activateListeners(html) {
        super.activateListeners(html);
        html.find(".add").click(this._onAdd.bind(this));
        html.find(".minus").click(this._Delete.bind(this));
    }
    //@ts-expect-error
    async _onAdd(event) {
        event.preventDefault();
        const proficiencies = game.settings.get("ard20", "proficiencies");
        proficiencies.weapon.push({ name: "name", type: "amb" });
        await game.settings.set("ard20", "proficiencies", proficiencies);
        this.render();
    }
    //@ts-expect-error
    async _Delete(event) {
        event.preventDefault();
        const proficiencies = game.settings.get("ard20", "proficiencies");
        proficiencies.weapon.splice(event.currentTarget.dataset.key, 1);
        await game.settings.set("ard20", "proficiencies", proficiencies);
        this.render();
    }
    //@ts-expect-error
    async _updateObject(event, formData) {
        const proficiencies = game.settings.get("ard20", "proficiencies");
        console.log(formData);
        let dirty = false;
        for (let [fieldName, value] of Object.entries(foundry.utils.flattenObject(formData))) {
            const [type, index, propertyName] = fieldName.split(".");
            //@ts-expect-error
            if (proficiencies[type][index][propertyName] !== value) {
                //log({index, propertyName, value});
                //@ts-expect-error
                proficiencies[type][index][propertyName] = value;
                dirty = dirty || true;
            }
            if (dirty) {
                await game.settings.set("ard20", "proficiencies", proficiencies);
            }
        }
    }
}