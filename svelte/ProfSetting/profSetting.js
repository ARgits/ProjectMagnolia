import { SvelteApplication } from "@typhonjs-fvtt/runtime/svelte/application";
import ProfSettingShell from './profSetting-shell.svelte'
export class ProfSettingsShim extends FormApplication {
    /**
     * @inheritDoc
     */
    constructor(options = {}) {
      super({}, options);
  
      new ProfSetting().render(true, { focus: true });
    }
  
    async _updateObject(event, formData) {}
    render() {
      this.close();
    }
  }
  class ProfSetting extends SvelteApplication {
    static get defaultOptions() {
      return foundry.utils.mergeObject(super.defaultOptions, {
        classes: ["ard20"],
        title: "Sub-types for Proficiencies",
        minimizable:true,
        resizable:true,
        width: 600,
        height: 800,
        svelte: {
          class: ProfSettingShell,
          target: document.body,
        },
      });
    }
  }
  