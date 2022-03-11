import { SvelteApplication } from "@typhonjs-fvtt/runtime/svelte/application";
import AdvancementRateShell from "./advancement-rate-shell.svelte";
export class AdvRateSettingsShim extends FormApplication {
  /**
   * @inheritDoc
   */
  constructor(options = {}) {
    super({}, options);

    new AdvancementRateFormApp().render(true, { focus: true });
  }

  async _updateObject(event, formData) {}
  render() {
    this.close();
  }
}
class AdvancementRateFormApp extends SvelteApplication {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["ard20"],
      title: "Advancement Rate",
      minimizable:true,
      resizable:true,
      width: 600,
      height: "auto",
      svelte: {
        class: AdvancementRateShell,
        target: document.body,
      },
    });
  }
}
