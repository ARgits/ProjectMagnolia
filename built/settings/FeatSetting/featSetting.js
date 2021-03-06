import { SvelteApplication } from "@typhonjs-fvtt/runtime/svelte/application";
import FeatSettingShell from './featSetting-shell.svelte'
export class FeatSettingsShim extends FormApplication {
    /**
     * @inheritDoc
     */
    constructor(options = {}) {
      super({}, options);
  
      new FeatSetting().render(true, { focus: true });
    }
  
    async _updateObject(event, formData) {}
    render() {
      this.close();
    }
  }
  class FeatSetting extends SvelteApplication {
    static get defaultOptions() {
      return foundry.utils.mergeObject(super.defaultOptions, {
        classes: ["ard20"],
        title: "Folders and Packs with Features",
        minimizable:true,
        resizable:true,
        width: 400,
        height: 600,
        svelte: {
          class: FeatSettingShell,
          target: document.body,
        },
      });
    }
  }
  