import { onManageActiveEffect, prepareActiveEffectCategories } from "../helpers/effects.mjs";
import { FeatRequirements } from "../helpers/feat_req.mjs";
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
      tabs: [
        { navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" },
        { navSelector: ".data-tabs", contentSelector: ".data-section", initial: "untrained" },
      ],
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
    context.effects = prepareActiveEffectCategories(this.item.effects);
    return context;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;
    html.find(".effect-control").click((ev) => onManageActiveEffect(ev, this.item));
    // Roll handlers, click handlers, etc. would go here.
    html.find(".config-button").click(this._FeatReq.bind(this));
    html.find("button").click(this._ChangeSign.bind(this))
    
  }
  _ChangeSign(event) {
    if (this.item.data.type !== "race") return;
    console.log('КНОПКА')
    const button = event.currentTarget;
    const key = button.dataset.key;
    this.item.data.data.bonus.abil[key].signPlus = !this.item.data.data.bonus.abil[key].signPlus;
  }
  _FeatReq(event) {
    {
      event.preventDefault();
      const button = event.currentTarget;
      let app;
      switch (button.dataset.action) {
        case "feat-req":
          app = new FeatRequirements(this.object);
          break;
      }
      app?.render(true);
    }
  }
}
