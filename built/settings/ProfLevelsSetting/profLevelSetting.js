import { SvelteApplication } from "@typhonjs-fvtt/runtime/svelte/application";
import ProfLevelSettingShell from './profLevelSetting-shell.svelte'
export class ProfLevelSettingsShim extends FormApplication {
    /**
     * @inheritDoc
     */
    constructor(options = {}) {
      super({}, options);
  
      new ProfLevelSetting().render(true, { focus: true });
    }
  
    async _updateObject(event, formData) {}
    render() {
      this.close();
    }
  }
  class ProfLevelSetting extends SvelteApplication {
    static get defaultOptions() {
      return foundry.utils.mergeObject(super.defaultOptions, {
        classes: ["ard20"],
        title: "Levels of proficiencies",
        minimizable:true,
        resizable:true,
        width: 400,
        height: 600,
        svelte: {
          class: ProfLevelSettingShell,
          target: document.body,
        },
      });
    }
  }
  