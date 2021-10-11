import {damageRoll} from "../dice/dice.js"

/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class ARd20Item extends Item {
  /**
   * Augment the basic Item data model with additional dynamic data.
   */
  prepareData() {
    // As with the actor class, items are documents that can have their data
    // preparation methods overridden (such as prepareBaseData()).
    super.prepareData();
  }
  prepareBaseData() {}
  prepareDerivedData() {
    super.prepareDerivedData();
    const itemData = this.data;
    const labels = (this.labels = {});
    this._prepareSpellData(itemData, labels);
    this._prepareWeaponData(itemData, labels);
    this._prepareFeatureData(itemData, labels);
    this._prepareRaceData(itemData, labels);
    if (!this.isOwned) this.prepareFinalAttributes();
  }
  /**
   *Prepare data for Spells
   */
  _prepareSpellData(itemData, labels) {
    if (itemData.type !== "spell") return;
    const data = itemData.data;
    labels.school = CONFIG.ARd20.SpellSchool[data.school];
  }
  /**
   *Prepare data for weapons
   */
  _prepareWeaponData(itemData, labels) {
    if (itemData.type !== "weapon") return;
    const data = itemData.data;
    const flags = itemData.flags;
    this._SetProperties(data);
    this._setDeflect(data);
    this._setTypeAndSubtype(data, flags, labels);
  }
  _SetProperties(data) {
    for (let [k, v] of Object.entries(data.property.untrained)) {
      v = CONFIG.ARd20.Prop[k] ?? k;
    }
    for (let [k, v] of Object.entries(data.property.basic)) {
      v = CONFIG.ARd20.Prop[k] ?? k;
      if (data.property.untrained[k] === true && k != "awk") {
        data.property.basic[k] = true;
      }
    }
    for (let [k, v] of Object.entries(data.property.master)) {
      v = CONFIG.ARd20.Prop[k] ?? k;
      if (data.property.basic[k] === true && k != "awk") {
        data.property.master[k] = true;
      }
    }
  }
  /**
   *Set deflect die equal to damage die, if not
   */
  _setDeflect(data) {
    for (let [k, v] of Object.entries(CONFIG.ARd20.prof)) {
      v = game.i18n.localize(CONFIG.ARd20.prof[k]) ?? k;
      v = v.toLowerCase();
      data.deflect[v] = data.property[v].def ? data.deflect[v] || data.damage.common[v] : 0;
    }
  }
  _setTypeAndSubtype(data, flags, labels) {
    data.type.value = data.type.value || "amb";
    data.settings = game.settings.get("ard20", "profs").weapon.filter((prof) => prof.type === data.type.value);
    if (this.isOwned && flags.core?.sourceId) {
      let id = this.isOwned ? /Item.(.+)/.exec(flags.core.sourceId)[1] : null;
      console.log(id);
      data.sub_type = this.isOwned && data.sub_type === undefined ? game.items.get(id).data.data.sub_type : data.sub_type;
    }
    data.sub_type = data.settings.filter((prof) => prof.name === data.sub_type)[0] === undefined ? data.settings[0].name : data.sub_type;
    labels.type = game.i18n.localize(CONFIG.ARd20.WeaponType[data.type.value]) ?? CONFIG.ARd20.WeaponType[data.type.value];
    labels.prof = game.i18n.localize(CONFIG.ARd20.prof[data.prof.value]) ?? CONFIG.ARd20.prof[data.prof.value];
    data.prof.label = labels.prof;
    data.type.label = labels.type;
  }
  /**
   *Prepare data for features
   */
  _prepareFeatureData(itemData, labels) {
    if (itemData.type !== "feature") return;
    const data = itemData.data;
    console.log(data);
    // Handle Source of the feature
    data.source.value = data.source.value || "mar";
    labels.source = game.i18n.localize(CONFIG.ARd20.source[data.source.value]);
    data.source.label = labels.source;

    data.keys = [];

    //define levels
    data.level.has = data.level.has !== undefined ? data.level.has : false;
    data.level.max = data.level.has ? data.level.max || 4 : 1;
    data.level.current = this.isOwned ? Math.max(data.level.initial, 1) : 0;

    //define exp cost
    if (data.level.max > 1) {
      let n = (10 - data.level.max) / data.level.max;
      let k = 1.7 + (Math.round(Number((Math.abs(n) * 100).toPrecision(15))) / 100) * Math.sign(n);
      if (data.xp.length < data.level.max) {
        for (let i = 1; i < data.level.max; i++) {
          data.xp.push(Math.round((data.xp[i - 1] * k) / 5) * 5);
        }
      } else {
        for (let i = 1; i < data.level.max; i++) {
          data.xp[i] = Math.round((data.xp[i - 1] * k) / 5) * 5;
        }
      }
    }
    for (let [key, req] of Object.entries(data.req.values)) {
      req.pass = Array.from("0".repeat(data.level.max));
      switch (req.type) {
        case "ability":
          for (let [key, v] of Object.entries(CONFIG.ARd20.abilities)) {
            if (req.name === game.i18n.localize(CONFIG.ARd20.abilities[key])) req.value = key;
          }
          break;
        case "skill":
          for (let [key, v] of Object.entries(CONFIG.ARd20.skills)) {
            if (req.name === game.i18n.localize(CONFIG.ARd20.skills[key])) req.value = key;
          }
          break;
      }
    }
    for (let i = data.req.logic.length; data.level.max > data.req.logic.length; i++) {
      console.log(data.req.logic.length);
      if (i === 0) {
        console.log("меньше");
        data.req.logic.push("1");
      } else {
        console.log("больше");
        data.req.logic.push(data.req.logic[i - 1]);
      }
    }
    for (let i = data.req.logic.length; data.level.max < data.req.logic.length; i--) {
      data.req.logic.splice(data.req.logic.length - 1, 1);
    }
  }
  /**
   * Prepare data for 'race' type of item
   */
  _prepareRaceData(itemData, labels) {
    if (itemData.type !== "race") return;
    const data = itemData.data;
    data.HPdie = CONFIG.ARd20.HPdice.slice(0, 7);
  }
  /**
  Prepare Data that uses actor's data
  */
  prepareFinalAttributes() {
    const data = this.data.data;
    const labels = this.labels;
    labels.abil = {};
    labels.skills = {};
    labels.feats = {};
    const abil = (data.abil = {});
    for (let [k, v] of Object.entries(CONFIG.ARd20.abilities)) {
      v = this.isOwned ? getProperty(this.actor.data, `data.abilities.${k}.mod`) : null;
      abil[k] = v;
    }
    this._prepareWeaponAttr(data, abil);
  }

  _prepareWeaponAttr(data, abil) {
    if (this.data.type === "weapon") {
      data.prof.value = this.isOwned ? Object.values(this.actor?.data.data.profs.weapon).filter((pr) => pr.name === data.sub_type)[0].value : 0;
      this.labels.prof = game.i18n.localize(CONFIG.ARd20.prof[data.prof.value]) ?? CONFIG.ARd20.prof[data.prof.value];
      data.prof.label = this.labels.prof;
      let prof_bonus = 0;
      if (data.prof.value === 0) {
        prof_bonus = 0;
      } else if (data.prof.value === 1) {
        prof_bonus = this.actor.data.data.attributes.prof_die;
      } else if (data.prof.value === 2) {
        prof_bonus = this.actor.data.data.attributes.prof_die + "+" + this.actor.data.data.attributes.prof_bonus;
      }
      this.data.data.damage.common.current = this.data.data.damage.common[this.labels.prof.toLowerCase()] + "+" + abil.str;
      this.data.data.attack = "1d20+" + prof_bonus + "+" + abil.dex;
    }
  }

  /**
   * Prepare a data object which is passed to any Roll formulas which are created related to this Item
   * @private
   */
  getRollData() {
    // If present, return the actor's roll data.
    if (!this.actor) return null;
    const rollData = this.actor.getRollData();
    rollData.item = foundry.utils.deepClone(this.data.data);
    return rollData;
  }
  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */

  async roll({ configureDialog = true, rollMode, createMessage = true } = {}) {
    let item = this.data;
    const iData = this.data.data; //Item data
    const actor = this.actor;
    const aData = actor.data.data; //Actor data
    // Initialize chat data.
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });
    // Otherwise, create a roll and send a chat message from it.
    const targets = game.user.targets
    const ts = targets.size
    if (item.type === "weapon") {
      const rollData = this.getRollData();
      const targets = game.user.targets;
      const ts = targets.size;
      return damageRoll(rollData)
    }
    // If there's no roll data, send a chat message.
    else if (!this.data.data.formula) {
      ChatMessage.create({
        speaker: speaker,
        rollMode: rollMode,
        flavor: label,
        content: item.data.description ?? "",
      });
      return roll;
    }
    
  }
  async AttackCheck(attack,damage,targets) {
    for (let target of targets) {
      let actor = target.actor;
      const reflex = actor.data.data.defences.reflex.value;
      let { value } = actor.data.data.health;
      let obj = {};
      value -= target.data.damage;
      obj["data.health.value"] = value;
      if (target.data.attack >= reflex) {
        console.log("HIT!");
        if (game.user.isGM) {
          console.log("GM");
          await actor.update(obj);
        } else {
          console.log("not GM");
          game.socket.emit("system.ard20", {
            operation: "updateActorData",
            actor: actor,
            update: obj,
            value: value,
          });
        }
      } else console.log("miss");
    }
  }

  /* -------------------------------------------- */
  /*  Chat Message Helpers                        */
  /* -------------------------------------------- */

  static chatListeners(html) {
    html.on("click", ".card-buttons button", this._onChatCardAction.bind(this));
    html.on("click", ".item-name", this._onChatCardToggleContent.bind(this));
  }

  /* -------------------------------------------- */

  /**
   * Handle execution of a chat card action via a click event on one of the card buttons
   * @param {Event} event       The originating click event
   * @returns {Promise}         A promise which resolves once the handler workflow is complete
   * @private
   */
  static async _onChatCardAction(event) {
    event.preventDefault();

    // Extract card data
    const button = event.currentTarget;
    button.disabled = true;
    const card = button.closest(".chat-card");
    const messageId = card.closest(".message").dataset.messageId;
    const message = game.messages.get(messageId);
    const action = button.dataset.action;

    // Validate permission to proceed with the roll
    const isTargetted = action === "save";
    if (!(isTargetted || game.user.isGM || message.isAuthor)) return;

    // Recover the actor for the chat card
    const actor = await this._getChatCardActor(card);
    if (!actor) return;

    // Get the Item from stored flag data or by the item ID on the Actor
    const storedData = message.getFlag("ard20", "itemData");
    const item = storedData ? new this(storedData, { parent: actor }) : actor.items.get(card.dataset.itemId);
    if (!item) {
      return ui.notifications.error(game.i18n.format("ARd20.ActionWarningNoItem", { item: card.dataset.itemId, name: actor.name }));
    }
    const spellLevel = parseInt(card.dataset.spellLevel) || null;

    // Handle different actions
    switch (action) {
      case "attack":
        await item.rollAttack({ event });
        break;
      case "damage":
      case "versatile":
        await item.rollDamage({
          critical: event.altKey,
          event: event,
          spellLevel: spellLevel,
          versatile: action === "versatile",
        });
        break;
      case "formula":
        await item.rollFormula({ event, spellLevel });
        break;
      case "save":
        const targets = this._getChatCardTargets(card);
        for (let token of targets) {
          const speaker = ChatMessage.getSpeaker({ scene: canvas.scene, token: token });
          await token.actor.rollAbilitySave(button.dataset.ability, { event, speaker });
        }
        break;
      case "toolCheck":
        await item.rollToolCheck({ event });
        break;
      case "placeTemplate":
        const template = game.ard20.canvas.AbilityTemplate.fromItem(item);
        if (template) template.drawPreview();
        break;
    }

    // Re-enable the button
    button.disabled = false;
  }

  /* -------------------------------------------- */

  /**
   * Handle toggling the visibility of chat card content when the name is clicked
   * @param {Event} event   The originating click event
   * @private
   */
  static _onChatCardToggleContent(event) {
    event.preventDefault();
    const header = event.currentTarget;
    const card = header.closest(".chat-card");
    const content = card.querySelector(".card-content");
    content.style.display = content.style.display === "none" ? "block" : "none";
  }

  /* -------------------------------------------- */

  /**
   * Get the Actor which is the author of a chat card
   * @param {HTMLElement} card    The chat card being used
   * @return {Actor|null}         The Actor entity or null
   * @private
   */
  static async _getChatCardActor(card) {
    // Case 1 - a synthetic actor from a Token
    if (card.dataset.tokenId) {
      const token = await fromUuid(card.dataset.tokenId);
      if (!token) return null;
      return token.actor;
    }

    // Case 2 - use Actor ID directory
    const actorId = card.dataset.actorId;
    return game.actors.get(actorId) || null;
  }

  /* -------------------------------------------- */

  /**
   * Get the Actor which is the author of a chat card
   * @param {HTMLElement} card    The chat card being used
   * @return {Actor[]}            An Array of Actor entities, if any
   * @private
   */
  static _getChatCardTargets(card) {
    let targets = canvas.tokens.controlled.filter((t) => !!t.actor);
    if (!targets.length && game.user.character) targets = targets.concat(game.user.character.getActiveTokens());
    if (!targets.length) ui.notifications.warn(game.i18n.localize("ARd20.ActionWarningNoToken"));
    return targets;
  }
}
