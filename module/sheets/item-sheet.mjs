/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class ARd20ItemSheet extends ItemSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["ard20", "sheet", "item"],
      width: 520,
      height: 480,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }]
    });
  }

  /** @override */
  get template() {
    const path = "systems/ard20/templates/item";
    // Return a single sheet for all item types.
    // return `${path}/item-sheet.html`;

    // Alternatively, you could use the following return statement to do a
    // unique item sheet by type, like `weapon-sheet.html`.
    return `${path}/item-${this.item.data.type}-sheet.html`;
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    // Retrieve base data structure.
    const context = super.getData();

    // Use a safe clone of the item data for further operations.
    const itemData = context.item.data;
    context.labels = this.item.labels;
    context.config = CONFIG.ARd20;
    // Retrieve the roll data for TinyMCE editors.
    context.rollData = {};
    const props = [];
    let actor = this.object?.parent ?? null;
    if (actor) {
      context.rollData = actor.getRollData();
    }
    // Add the actor's data to context.data for easier access, as well as flags.
    context.data = itemData.data;
    context.flags = itemData.flags;
    context.item.isGM = game.user.isGM;
    for (let [k,v] of Object.entries(CONFIG.ARd20.Prop)){
      v = game.i18n.localize(CONFIG.ARd20.Prop[k])
    }
    for (let v of Object.entries(context.data.property.basic)){
      if((context.data.property.untrained[v]==true)&&(v!="awk")){
      data.property.basic[v]=true;
        }
    }
    for (let v of Object.entries(context.data.property.master)){
      if((context.data.property.basic[v]==true)&&(v!="awk")){
      data.property.master[v]=true;
      }
    }
    return context
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Roll handlers, click handlers, etc. would go here.
  }
}
