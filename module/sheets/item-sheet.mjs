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
    context.type = context.item.type;
    context.effects = prepareActiveEffectCategories(this.item.effects);
    context.select = [];
    if (context.select.length === 0) {
      let arr = context.type === "feature" ? CONFIG.ARd20.source : CONFIG.ARd20.Prop;
      for (let [key, name] of Object.entries(arr)) {
        context.select.push({ id: key, text: game.i18n.localize(name) });
      }
    }
    console.log(context);
    return context;
  }
  _getSubmitData(updateData = {}) {
    console.log('ААААААААААААААААААААААА')
    // Create the expanded update data object
    const fd = new FormDataExtended(this.form, { editors: this.editors });
    let data = fd.toObject();
    if (updateData) data = mergeObject(data, updateData);
    else data = expandObject(data);
    console.log(data)
    // Handle Damage array
    const damage = data.data?.damage;
    if (damage) {
      if(damage.parts)
      damage.parts = Object.values(damage?.parts || {}).map((d) => [d[0] || "", d[1] || ""]);
    else{
      for(let [key,type] of Object.entries(damage)){
        console.log(key,type)
        for (let [key, prof] of Object.entries(type)){
          console.log(key,prof)
          prof.parts = Object.values(prof?.parts || {}).map((d) => [d[0] || "", d[1] || ""])
        }
      }
    }}
    return flattenObject(data);
  }
  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    const edit = !this.isEditable;
    const context = this.getData();
    html[0].querySelectorAll(".select2").forEach((elem) => {
      let value = getProperty(context, $(elem).attr("name"));
      $(`.select2`, html).select2({
        //data: context.select,
        width: "auto",
        dropdownAutoWidth: true,
        disabled: edit,
      });
      //.val(value)
      //.trigger("change");
    });
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
    html.find(".damage-control").click(this._onDamageControl.bind(this));
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
  async _onDamageControl(event) {
    event.preventDefault();
    const a = event.currentTarget;
    if (a.classList.contains("add-damage")) {
      await this._onSubmit(event);
      let path = a.dataset.type ? "data.damage" + a.dataset.type : "data.damage";
      const damage = getProperty(this.item.data, path);
      console.log(damage)
      path += ".parts";
      return this.item.update({ path: damage.parts.concat([["", ""]]) });
    }
    if (a.classList.contains("delete-damage")) {
      await this._onSubmit(event);
      const li = a.closest(".damage-part");
      console.log(li.dataset)
      let path = a.dataset.type ? "data.damage" + a.dataset.type : "data.damage";
      const damage = getProperty(this.item.data, path);
      console.log(damage)
      damage.parts.splice(Number(li.dataset.damagePart), 1);
      path += ".parts";
      return this.item.update({ path: damage.parts });
    }
  }
  async _onSubmit(...args) {
    if (this._tabs[0].active === "Data") this.position.height = "auto";
    await super._onSubmit(...args);
  }
}
