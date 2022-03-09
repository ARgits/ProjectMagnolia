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
      id: "advancement-rate-setting",
      width: 600,
      height: "auto",
      submitOnChange: true,
      closeOnSubmit: false,
      svelte: {
        class: AdvancementRateShell,
        target: document.body,
        props: {
          variables: game.settings.get("ard20", "advancement-rate").variables,
          formulas: game.settings.get("ard20", "advancement-rate").formulas,
        },
      },
    });
  }
  getData() {
    const sheetData = game.settings.get("ard20", "advancement-rate");
    return sheetData;
  }
  activateListeners(html) {
    super.activateListeners(html);
  }
  async _updateObject(event, formData) {}
}
