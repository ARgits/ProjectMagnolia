import EmptySheet from "../sheets/svelte/EmptySheet.svelte";
import ItemItemSheet from "../sheets/svelte/item/ItemItemSheet.svelte";
import ActorSheet from "../sheets/svelte/actor/ActorSheet.svelte";
/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function () {
  return loadTemplates([
    // Actor partials.
    "systems/ard20/templates/actor/parts/actor-features.html",
    "systems/ard20/templates/actor/parts/actor-items.html",
    "systems/ard20/templates/actor/parts/actor-spells.html",
    "systems/ard20/templates/actor/parts/actor-effects.html",
    "systems/ard20/templates/actor/parts/actor-equip.html",
    // Character Advancement
    "systems/ard20/templates/actor/parts/actor-adv.html",
    // Settings
    "systems/ard20/templates/app/prof-settings.html",
    "systems/ard20/templates/app/feat-settings.html",
    // Requirements for features
    "systems/ard20/templates/app/feat_req.hbs",
  ]);
};
/**
 * Class for defining and extracting svelte templates for actor/item types
 */
export class DocTemplate {
  static #map = new Map();

  static delete(type) {
    return this.#map.delete(type);
  }

  static get(doc) {
    const component = this.#map.get(doc?.type);
    return component ? component : EmptySheet;
  }

  static getByType(type) {
    const component = this.#map.get(type);
    console.log(type)
    return component ? component : EmptySheet;
  }

  static set(type, component) {
    this.#map.set(type, component);
  }
}
//set your components
export const setSvelteComponents = () => {
  DocTemplate.set("item", ItemItemSheet);
  DocTemplate.set("character", ActorSheet);
};
