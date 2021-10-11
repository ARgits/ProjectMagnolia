import { onManageActiveEffect, prepareActiveEffectCategories } from "../helpers/effects.mjs";
import { CharacterAdvancement } from "../helpers/cha-adv.mjs";
import { ARd20Actor } from "../documents/actor.mjs";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class ARd20ActorSheet extends ActorSheet {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["ard20", "sheet", "actor"],
      template: "systems/ard20/templates/actor/actor-sheet.html",
      width: 600,
      height: 600,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "features" }]
    });
  }
  /** @override */
  get template() {
    return `systems/ard20/templates/actor/actor-${this.actor.data.type}-sheet.html`;
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    // Retrieve the data structure from the base sheet. You can inspect or log
    // the context variable to see the structure, but some key properties for
    // sheets are the actor object, the data object, whether or not it's
    // editable, the items array, and the effects array.
    const context = super.getData();

    // Use a safe clone of the actor data for further operations.
    const actorData = context.actor.data;

    // Add the actor's data to context.data for easier access, as well as flags.
    context.data = actorData.data;
    context.flags = actorData.flags;
    context.config = CONFIG.ARd20;
    context.isGM = game.user.isGM;

    // Prepare character data and items.
    if (actorData.type == "character") {
      this._prepareItems(context);
      this._prepareCharacterData(context);
    }

    // Prepare NPC data and items.
    if (actorData.type == "npc") {
      this._prepareItems(context);
    }

    // Add roll data for TinyMCE editors.
    context.rollData = context.actor.getRollData();

    // Prepare active effects
    context.effects = prepareActiveEffectCategories(this.actor.effects);

    return context;
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareCharacterData(context) {
    // Handle ability scores.
    for (let [k, v] of Object.entries(context.data.abilities)) {
      v.label = game.i18n.localize(CONFIG.ARd20.abilities[k]) ?? k;
    }
    for (let [k, v] of Object.entries(context.data.skills)) {
      v.label = game.i18n.localize(CONFIG.ARd20.skills[k]) ?? k;
      v.hover = game.i18n.localize(CONFIG.ARd20.prof[v.prof]) ?? v.prof;
    }
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareItems(context) {
    // Initialize containers.
    const gear = [];
    const features = [];
    const weapons = [];
    const spells = {
      0: [],
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
      6: [],
      7: [],
      8: [],
      9: [],
    };

    // Iterate through items, allocating to containers
    for (let i of context.items) {
      i.img = i.img || DEFAULT_TOKEN;
      // Append to gear.
      if (i.type === "item") {
        gear.push(i);
      }
      // Append to features.
      else if (i.type === "feature") {
        features.push(i);
      }
      // Append to spells.
      else if (i.type === "spell") {
        if (i.data.spellLevel != undefined) {
          spells[i.data.spellLevel].push(i);
        }
      } else if (i.type === "weapon") {
        const isActive = getProperty(i.data, "equipped");

        i.toggleClass = isActive ? "active" : "";
        i.toggleTitle = game.i18n.localize(isActive ? "ARd20.Equipped" : "ARd20.Unequipped");
        weapons.push(i);
      }
    }

    // Assign and return
    context.gear = gear;
    context.features = features;
    context.spells = spells;
    context.weapons = weapons;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Render the item sheet for viewing/editing prior to the editable check.
    html.find(".item-toggle").click(this._onToggleItem.bind(this));
    html.find(".item-edit").click((ev) => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.sheet.render(true);
    });

    // -------------------------------------------------------------
    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Add Inventory Item
    html.find(".item-create").click(this._onItemCreate.bind(this));

    // Delete Inventory Item
    html.find(".item-delete").click((ev) => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.delete();
      li.slideUp(200, () => this.render(false));
    });

    // Active Effect management
    html.find(".effect-control").click((ev) => onManageActiveEffect(ev, this.actor));
    //roll abilities and skills
    html.find(".ability-name").click(this._onRollAbilityTest.bind(this));
    html.find(".skill-name").click(this._onRollSkillCheck.bind(this));
    //open "character advancement" window
    html.find(".config-button").click(this._OnAdvanceMenu.bind(this));
    // Drag events for macros.
    if (this.actor.isOwner) {
      let handler = (ev) => this._onDragStart(ev);
      html.find("li.item").each((i, li) => {
        if (li.classList.contains("inventory-header")) return;
        li.setAttribute("draggable", true);
        li.addEventListener("dragstart", handler, false);
      });
    }
  }
  /**
   * Open @class CharacterAdvancement 
   */
  _OnAdvanceMenu(event) {
    event.preventDefault();
    const button = event.currentTarget;
    let app;
    switch (button.dataset.action) {
      case "adv":
        app = new CharacterAdvancement(this.object);
        break;
    }
    app?.render(true);
  }
  /**
   * Change @param data.equipped
   * by toggling it on sheet
   */
  _onToggleItem(event) {
    event.preventDefault();
    const itemId = event.currentTarget.closest(".item").dataset.itemId;
    const item = this.actor.items.get(itemId);
    //const attr = item.data.type === "spell" ? "data.preparation.prepared" : "data.equipped";
    const attr = "data.equipped";
    return item.update({ [attr]: !getProperty(item.data, attr) });
  }

  _onRollAbilityTest(event) {
    event.preventDefault();
    let ability = event.currentTarget.parentElement.dataset.ability;
    return this.actor.rollAbilityTest(ability, { event: event });
  }
  _onRollSkillCheck(event) {
    event.preventDefault();
    let skill = event.currentTarget.parentElement.dataset.skill;
    return this.actor.rollSkill(skill, { event: event });
  }

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  async _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    // Get the type of item to create.
    const type = header.dataset.type;
    // Grab any data associated with this control.
    const data = duplicate(header.dataset);
    // Initialize a default name.
    const name = `New ${type.capitalize()}`;
    // Prepare the item object.
    const itemData = {
      name: name,
      type: type,
      data: data,
    };
    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.data["type"];

    // Finally, create the item!
    return await Item.create(itemData, { parent: this.actor });
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  _onRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;

    // Handle item rolls.
    if (dataset.rollType) {
      if (dataset.rollType == "item") {
        const itemId = element.closest(".item").dataset.itemId;
        const item = this.actor.items.get(itemId);
        if (item) return item.roll();
      }
      /*else if (dataset.rollType==='weapon'){
        const itemId = element.closest(".item").dataset.itemId
        const item = this.actor.items.get(itemId)
        if (item) return item.DamageRoll()
      }*/
    }
  }
  async _onDropItemCreate(itemData) {
    if(!game.user.isGM){
      ui.notifications.error('you do not have permissions to add items manually')
      return
    }
    ui.notifications.info('All good')
    itemData = itemData instanceof Array ? itemData : [itemData];
    return this.actor.createEmbeddedDocuments("Item", itemData);
  }
}
