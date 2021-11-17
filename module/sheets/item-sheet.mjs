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
    context.isGM = game.user.isGM;
    context.effects = prepareActiveEffectCategories(this.item.effects);
    context.select = {
      feat: [],
    };
    if (context.select.feat.length === 0) {
      for (let [key, name] of Object.entries(CONFIG.ARd20.source)) {
        context.select.feat.push({ id: key, text: game.i18n.localize(name) });
      }
    }
    console.log(context);
    return context;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    const context = this.getData();

    $(".select2.feat", html)
      .select2({
        data: context.select.feat,
        width: "auto",
        dropdownAutoWidth: true,
      })
      .val(context.data.source.value)
      .trigger("change");
    $("select").on("select2:unselect", function (evt) {
      if (!evt.params.originalEvent) {
        return;
      }

      evt.params.originalEvent.stopPropagation();
    });

    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;
    html.find(".effect-control").click((ev) => onManageActiveEffect(ev, this.item));
    // Roll handlers, click handlers, etc. would go here.
    html.find(".config-button").click(this._FeatReq.bind(this));
    html.find("i.rollable").click(this._ChangeSign.bind(this));
  }
  _ChangeSign(event) {
    if (this.item.data.type !== "race") return;
    const button = event.currentTarget;
    const key = button.dataset.key;
    const attr = `data.bonus.abil.${key}.sign`;
    this.item.update({ [attr]: !getProperty(this.item.data, attr) });
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
