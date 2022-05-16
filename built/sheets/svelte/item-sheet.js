import ItemShell from "../svelte/ItemShell.svelte"
import { SvelteApplication } from "@typhonjs-fvtt/runtime/svelte/application";
export class SvelteItemSheet extends SvelteApplication{
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
          //target: document.body
        },
      });
    }
  }