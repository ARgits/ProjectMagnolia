import { AdvRateSettingsShim } from "../settings/advancement-rate/advancement-rate.js";
import { FeatSettingsShim } from "../settings/FeatSetting/featSetting.js";
import { ProfSettingsShim } from "../settings/ProfSetting/profSetting.js";
export const registerSystemSettings = function () {
  game.settings.register("ard20", "proficiencies", {
    scope: "world",
    config: false,
    default: {
      weapon: {
        label: "weapon",
        id: "weapon",
        value: [
          { name: "Punch Dagger", type: "amb", id: "Punch Dagger" },
          { name: "Whip Dagger", type: "amb", id: "Whip Dagger" },
          { name: "Gauntlet", type: "amb", id: "Gauntlet" },
          { name: "Hidden Blade", type: "amb", id: "Hidden Blade" },
          { name: "Knucke Axe", type: "amb", id: "Knucke Axe" },
          { name: "Side Baton", type: "amb", id: "Side Baton" },
          { name: "Unarmed strike", type: "amb", id: "Unarmed strike" },
          { name: "Battle Axe", type: "axe", id: "Battle Axe" },
          { name: "Great Axe", type: "axe", id: "Great Axe" },
          { name: "Handaxe", type: "axe", id: "Handaxe" },
          { name: "Hook Sword", type: "axe", id: "Hook Sword" },
          { name: "Khopesh", type: "axe", id: "Khopesh" },
          { name: "Poleaxe", type: "axe", id: "Poleaxe" },
          { name: "Tomahawk", type: "axe", id: "Tomahawk" },
          { name: "Great club", type: "blu", id: "Great club" },
          { name: "Heavy club", type: "blu", id: "Heavy club" },
          { name: "Light Club", type: "blu", id: "Light Club" },
        ],
      },
      armor: { label: "armor", id: "armor", value: [] },
      tool: { label: "tool", id: "tool", value: [] },
    },
    onChange: (value) => {
      console.log("Настройка изменилась ", value);
    },
  });
  game.settings.registerMenu("ard20", "gearProfManage", {
    name: "SETTINGS.ProfManage",
    label: "SETTINGS.ProfManage",
    type: ProfSettingsShim,
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
        skillsCount: {
          shortName: "SC",
          longName: "Skill Count",
        },
        featuresCount: {
          shortName: "FC",
          longName: "featureCount",
        },
        skills: {
          shortName: "SV",
          longName: "skillValue",
        },
        features: {
          shortName: "FL",
          longName: "Feature Level",
        },
        attributes: {
          shortName: "AV",
          longName: "Attribute Value",
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
