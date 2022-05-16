import ItemShell from "../svelte/ItemShell.svelte";
import { SvelteApplication } from "@typhonjs-fvtt/runtime/svelte/application";
export class SvelteItemSheet extends SvelteApplication {
  constructor(object = {}, options = {}) {
    super(options);
    this.object = object;
  }
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["ard20"],
      title: "sheet",
      minimizable: true,
      resizable: true,
      width: 600,
      height: 600,
      svelte: {
        class: ItemShell,
        target: document.body,
      },
    });
  }
  getData(options={}){
    return{
      object:this.object,
      options:this.options,
      title:this.title
    }
  }
}
