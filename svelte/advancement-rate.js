import { SvelteApplication } from "@typhonjs-fvtt/runtime/svelte/application"
import AdvancementRateShell from './advancement-rate-shell.svelte'
export class AdvancementRateFormApp extends  SvelteApplication{
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["ard20"],
            title: "Advancement Rate",
            template: "systems/ard20/templates/app/advancement-rate-setting.html",
            id: "advancement-rate-setting",
            width: 600,
            height: "auto",
            submitOnChange: true,
            closeOnSubmit: false,
            svelte:{
                class:AdvancementRateShell,
            }
        });
    }
    getData() {
        const sheetData = game.settings.get("ard20", "advancement-rate");
        return sheetData;
    }
    activateListeners(html) {
        super.activateListeners(html);
    }
    async _updateObject(event, formData) { }
}