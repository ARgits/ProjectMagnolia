import { Object.entries } from "../ard20.js";
import { onManageActiveEffect, prepareActiveEffectCategories } from "../helpers/effects.js";
import { FeatRequirements } from "../helpers/feat_req.js";
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
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }],
    });
  }
  /** @override */
  get template() {
    const path = "systems/ard20/templates/item";
    return `${path}/item-${this.item.data.type}-sheet.html`;
  }
  /* -------------------------------------------- */
  /** @override */
  getData() {
    // Retrieve base data structure.
    const context = super.getData();
    // Use a safe clone of the item data for further operations.
    //@ts-expect-error
    const itemData = context.item.data;
    //@ts-expect-error
    context.config = CONFIG.ARd20;
    // Retrieve the roll data for TinyMCE editors.
    //@ts-expect-error
    context.rollData = {};
    let actor = this.object?.parent ?? null;
    if (actor) {
      //@ts-expect-error
      context.rollData = actor.getRollData();
    }
    // Add the actor's data to context.data for easier access, as well as flags.
    //@ts-expect-error
    context.data = itemData.data;
    //@ts-expect-error
    context.flags = itemData.flags;
    //@ts-expect-error
    context.isGM = game.user!.isGM;
    //@ts-expect-error
    context.type = context.item.type;
    //@ts-expect-error
    context.effects = prepareActiveEffectCategories(this.item.effects);
    return context;
  }
  _getSubmitData(updateData = {}) {
    // Create the expanded update data object
    if (this.form === null) return;
    //@ts-expect-error
    const fd = new FormDataExtended(this.form, { editors: this.editors });
    let data = fd.toObject();
    if (updateData) data = mergeObject(data, updateData);
    else data = expandObject(data);
    // Handle Damage array
    //@ts-expect-error
    const damage = data.data?.damage;
    if (damage) {
      if (damage.parts) {
        damage.damType = Object.values(damage?.damType || {});
        damage.parts = Object.values(damage?.parts || {}).map(function (d, ind) {
          let a: any[] = [];
          if (damage.damType[ind].length !== 0) {
            damage.damType[ind].forEach((sub: any, i: number) => a.push(JSON.parse(damage.damType[ind][i])));
          }
          //@ts-expect-error
          return [d[0] || "", a];
        });
      } else {
        for (let [key, type] of Object.entries(damage)) {
          for (let [k, prof] of Object.entries(type)) {
            prof.damType = Object.values(prof?.damType || {});
            prof.parts = Object.values(prof?.parts || {}).map(function (d, ind) {
              let a: any[] = [];
              if (prof.damType[ind].length !== 0 && prof.damType[ind][0] !== "") {
                prof.damType[ind].forEach((sub: any, i: number) => a.push(JSON.parse(prof.damType[ind][i])));
              }
              //@ts-expect-error
              return [d[0] || "", a];
            });
          }
        }
      }
    }
    return flattenObject(data);
  }
  /* -------------------------------------------- */

  /** @override */
  activateListeners(html: any) {
    super.activateListeners(html);
    const edit = !this.isEditable;
    const context = this.getData();
    //@ts-expect-error
    function formatSelection(state) {
      const parent = $(state.element).parent().prop("tagName");
      if (!state.id || parent !== "OPTGROUP") return state.text;
      const optgroup = $(state.element).parent().attr("label");
      const subtype = state.element.value.match(/(\w+)/g)[1];
      const url = `systems/ard20/css/${subtype}.svg`;
      return `<div><img style="width:15px; background-color:black; margin-left:2px" src=${url} />${optgroup} ${state.text}</div>`;
    }
    //@ts-expect-error
    function formatResult(state) {
      const parent = $(state.element).parent().prop("tagName");
      if (!state.id || parent !== "OPTGROUP") return state.text;
      const subtype = state.element.value.match(/(\w+)/g)[1];
      const url = `systems/ard20/css/${subtype}.svg`;
      return `<div><img style="width:15px; background-color:black; margin-left:2px" src=${url} /> ${state.text}</div>`;
    }

    $(`select.select2`, html)
      //@ts-expect-error
      .select2({
        theme: "filled",
        width: "auto",
        dropdownAutoWidth: true,
        disabled: edit,
        templateSelection: formatSelection,
        templateResult: formatResult,
        //@ts-expect-error
        escapeMarkup: function (m) {
          return m;
        },
      })
      //@ts-expect-error
      .val(function (index: number, value) {
        //@ts-expect-error
        const name = $("select.select2", html)[index].name;
        const val = getProperty(context, name);
        return val;
      })
      .trigger("change");
    $("select").on("select2:unselect", function (evt) {
      //@ts-expect-error
      if (!evt.params.originalEvent) {
        return;
      }
      //@ts-expect-error
      evt.params.originalEvent.stopPropagation();
    });
    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;
    //@ts-expect-error
    html.find(".effect-control").click((ev: MouseEvent) => onManageActiveEffect(ev, this.item));
    // Roll handlers, click handlers, etc. would go here.
    html.find(".config-button").click(this._FeatReq.bind(this));
    html.find(".damage-control").click(this._onDamageControl.bind(this));
  }
  //@ts-expect-error
  _FeatReq(event) {
    event.preventDefault();
    const button = event.currentTarget;
    let app;
    switch (button.dataset.action) {
      case "feat-req":
        //@ts-expect-error
        app = new FeatRequirements(this.object);
        break;
    }
    app?.render(true);
  }
  //@ts-expect-error
  async _onDamageControl(event) {
    event.preventDefault();
    const a = event.currentTarget;
    if (a.classList.contains("add-damage")) {
      //await this._onSubmit(event);
      let path = a.dataset.type ? "data.damage" + a.dataset.type : "data.damage";
      const damage = getProperty(this.item.data, path);
      damage.damType = damage.damType || [];
      const partsPath = path + ".parts";
      const damTypePath = path + ".damType";
      const update: { [index: string]: any[] } = {};
      update[partsPath] = damage.parts.concat([["", ["", ""]]]);
      update[damTypePath] = damage.damType?.concat([[""]]);
      await this.item.update(update);
    }
    if (a.classList.contains("delete-damage")) {
      //await this._onSubmit(event);
      const li = a.closest(".damage-part");
      let path = a.dataset.type ? "data.damage" + a.dataset.type : "data.damage";
      const damage = getProperty(this.item.data, path);
      console.log(damage);
      damage.parts.splice(Number(li.dataset.damagePart), 1);
      damage.damType.splice(Number(li.dataset.damagePart), 1);
      const partsPath = path + ".parts";
      const damTypePath = path + ".damType";
      const update: { [index: string]: any[] } = {};
      update[partsPath] = damage.parts;
      update[damTypePath] = damage.damType;
      await this.item.update(update);
    }
  }
  //@ts-expect-error
  async _onSubmit(...args) {
    if (this._tabs[0].active === "data") this.position.height = "auto";
    //@ts-expect-error
    await super._onSubmit(...args);
  }
}
