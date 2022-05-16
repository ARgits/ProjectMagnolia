import ItemShell from "../svelte/ItemShell.svelte";
import { SvelteApplication } from "@typhonjs-fvtt/runtime/svelte/application";
export class SvelteDocumentSheet extends SvelteApplication {
  constructor(object = {}, options = {}) {
    super(options);
    this.object = object;
  }
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["sheet"],
      viewPermission: CONST.DOCUMENT_PERMISSION_LEVELS.LIMITED,
      sheetConfig: true,
      svelte: {
        target: document.body,
      },
    });
  }
  get document() {
    return this.object;
  }
  get id() {
    const name = this.options.id || `${this.document.documentName.toLowerCase()}-sheet`;
    return `${name}-${this.document.id}`;
  }
  get isEditable() {
    let editable = this.options["editable"] && this.document.isOwner;
    if (this.document.pack) {
      const pack = game.packs.get(this.document.pack);
      if (pack.locked) editable = false;
    }
    return editable;
  }
  get title() {
    const name = this.document.name ?? this.document.id;
    const reference = name ? `: ${name}` : "";
    return `${game.i18n.localize(this.document.constructor.metadata.label)}}${reference}`;
  }
  getData(options) {
    const data = this.document.data.toObject(false);
    const isEditable = this.isEditable;
    return {
      cssClass: isEditable ? "editable" : "locked",
      editable: isEditable,
      document: this.document,
      data: data,
      limited: this.document.limited,
      options: this.options,
      owner: this.document.isOwner,
      title: this.title,
    };
  }
}
export class SvelteItemSheet extends SvelteDocumentSheet {
  constructor(object={},options={}){
    options.title = object.title
  }
  get item(){
    return this.object
  }
  get title(){
    return this.item.name
  }
  get actor(){
    return this.item.actor
  }
  
  get id(){
    if(this.actor) return `actor-${this.actor.id}-item-${this.item.id}`
    else return super.id
  }
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["ard20"],
      minimizable: true,
      resizable: true,
      width: 600,
      height: 600,
      svelte: {
        class: ItemShell,
        target: document.body,
      },
      id:"item"
    });
  }

  getData(options = {}) {
    console.log(this.title,'getData')
    console.log(options,'getData options')
    const data = super.getData(options)
    data.item = data.document
    //this.options.title = this.object.name
    return data
  }
}
