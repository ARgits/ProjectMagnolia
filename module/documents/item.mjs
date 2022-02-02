import { d20Roll, damageRoll, simplifyRollFormula } from "../dice/dice.js";

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
  prepareBaseData() {
    super.prepareBaseData();
    const itemData = this.data;
    this.prepareBaseWeaponData(itemData);
  }
  prepareBaseWeaponData(itemData) {
    const data = itemData.data;
    const properties = data.property;
    for (let [k, v] of Object.entries(CONFIG.ARd20.WeaponProp)) {
      console.log(k, v);
      properties[k] = properties?.[k] || {};
      properties[k].value = properties[k].value || 0;
      properties[k].label = game.i18n.localize(CONFIG.ARd20.WeaponProp[k]) ?? v;
    }
  }
  prepareDerivedData() {
    super.prepareDerivedData();
    const itemData = this.data;
    const labels = (this.labels = {});
    this._prepareSpellData(itemData, labels);
    this._prepareWeaponData(itemData, labels);
    this._prepareFeatureData(itemData, labels);
    this._prepareRaceData(itemData, labels);
    this._prepareArmorData(itemData, labels);
    if (itemData.data.hasAttack) this._prepareAttack(itemData);
    if (itemData.data.hasDamage) this._prepareDamage(itemData);
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
    data.hasAttack = data.hasAttack || true;
    data.hasDamage = data.hasDamage || true;
    //this._SetProperties(data);
    this._setDeflect(data);
    this._setTypeAndSubtype(data, flags, labels);
    for (let [key, type] of Object.entries(data.damage)) {
      if (key !== "current") {
        for (let [key, prof] of Object.entries(type)) {
          prof.formula = "";
          prof.parts.forEach((part) => {
            if (Array.isArray(part[1])) {
              prof.formula += `${part[0]}`;
              part[1].forEach((sub, ind) => {
                if (ind === 0) {
                  prof.formula += ` {${sub[0]} ${sub[1]}`;
                  prof.formula += ind === part[1].length - 1 ? "}" : "";
                } else {
                  prof.formula += ` or ${sub[0]} ${sub[1]}`;
                  prof.formula += ind === part[1].length - 1 ? "}" : "";
                }
              });
            } else prof.formula += `${part[0]} {${part[1]} ${part[2]}}; `;
          });
        }
      }
    }
  }
  /*_SetProperties(data) {
    for (let [k, v] of Object.entries(CONFIG.ARd20.WeaponProp)) {
      console.log(k, v);
      data.property[k];
    }
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
    for (let [k, v] of Object.entries(data.property)) {
      v = game.i18n.localize(CONFIG.ARd20.Rank[k]) ?? k;
      v = v.toLowerCase();
      data.deflect[v] = data.property[v].def ? data.deflect[v] || data.damage.common[v] : 0;
    }
  }
  _setTypeAndSubtype(data, flags, labels) {
    data.type.value = data.type.value || "amb";
    data.settings = game.settings.get("ard20", "proficiencies").weapon.filter((prof) => prof.type === data.type.value);
    if (flags.core?.sourceId) {
      let id = /Item.(.+)/.exec(flags.core.sourceId)[1] || null;
      data.sub_type = data.sub_type === undefined ? game.items?.get(id).data.data.sub_type : data.sub_type;
    }
    data.sub_type = data.settings.filter((prof) => prof.name === data.sub_type).length === 0 ? data.settings[0].name : data.sub_type || data.settings[0].name;
    labels.type = game.i18n.localize(CONFIG.ARd20.WeaponType[data.type.value]) ?? CONFIG.ARd20.WeaponType[data.type.value];
    labels.prof = game.i18n.localize(CONFIG.ARd20.Rank[data.prof.value]) ?? CONFIG.ARd20.Rank[data.prof.value];
    data.prof.label = labels.prof;
    data.type.label = labels.type;
  }
  /**
   *Prepare data for features
   */
  _prepareFeatureData(itemData, labels) {
    if (itemData.type !== "feature") return;
    const data = itemData.data;
    // Handle Source of the feature
    labels.source = [];
    data.source.label = "";
    data.source.value.forEach((value, key) => {
      labels.source.push(game.i18n.localize(CONFIG.ARd20.Source[value]));
      data.source.label += key === 0 ? labels.source[key] : `, ${labels.source[key]}`;
    });
    //labels.source = game.i18n.localize(CONFIG.ARd20.source[data.source.value]);

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
          for (let [key, v] of Object.entries(CONFIG.ARd20.Attributes)) {
            if (req.name === game.i18n.localize(CONFIG.ARd20.Attributes[key])) req.value = key;
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
      if (i === 0) {
        data.req.logic.push("1");
      } else {
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
    data.HPdie = CONFIG.ARd20.HPDice.slice(0, 7);
  }
  /**
   * Prepare data for "armor" type item
   */
  _prepareArmorData(itemData, labels) {
    if (itemData.type !== "armor") return;
    const data = itemData.data;
    for (let [key, dr] of Object.entries(CONFIG.ARd20.DamageSubTypes)) {
      if (!(key === "force" || key === "rad" || key === "psyhic")) {
        data.res.phys[key] = data.res.phys[key] ?? 0;
      }
      data.res.mag[key] = data.res.mag[key] ?? 0;
    }
    data.heavyPoints = CONFIG.ARd20.HeavyPoints[data.type][data.slot];
  }
  /**
  Prepare Data that uses actor's data
  */
  prepareFinalAttributes() {
    const itemData = this.data;
    const data = itemData.data;
    const labels = this.labels;
    labels.abil = {};
    labels.skills = {};
    labels.feats = {};
    const abil = (data.abil = {});
    for (let [k, v] of Object.entries(CONFIG.ARd20.Attributes)) {
      v = this.isOwned ? getProperty(this.actor.data, `data.attributes.${k}.mod`) : null;
      abil[k] = v;
    }
    let prof_bonus = 0;
    if (this.data.type === "weapon") {
      data.prof.value = this.isOwned ? Object.values(this.actor?.data.data.profs.weapon).filter((pr) => pr.name === data.sub_type)[0]?.value : 0;
      this.labels.prof = game.i18n.localize(CONFIG.ARd20.Rank[data.prof.value]) ?? CONFIG.ARd20.Rank[data.prof.value];
      data.prof.label = this.labels.prof;
      prof_bonus = data.prof.value * 4;
      this._prepareAttack(itemData, prof_bonus, abil);
      this._prepareDamage(itemData, abil);
    }
  }
  _prepareAttack(itemData, prof_bonus, abil) {
    const data = itemData.data;
    if (!data.hasAttack) return;
    if (data.atkMod) {
    }
    let mod = itemData.type === "weapon" && abil !== undefined ? abil.dex : data.atkMod;
    data.attack = {
      formula: "1d20+" + prof_bonus + "+" + mod,
      parts: [mod, prof_bonus],
    };
  }
  _prepareDamage(itemData, abil) {
    const data = itemData.data;
    if (!data.hasDamage) return;
    let mod = itemData.type === "weapon" && abil !== undefined ? abil.str : 0;
    const prop = itemData.type === "weapon" ? `damage.common.${this.labels.prof.toLowerCase()}.parts` : "damage.parts";
    let baseDamage = getProperty(data, prop);
    data.damage.current = {
      formula: "",
      parts: baseDamage,
    };
    console.log(baseDamage);
    baseDamage.forEach((part) => {
      data.damage.current.formula += part[0] + `[${part[1]}, ${part[2]}] `;
    });
  }
  /**
   * Prepare a data object which is passed to any Roll formulas which are created related to this Item
   * @private
   */
  getRollData(hasAttack, hasDamage) {
    // If present, return the actor's roll data.
    if (!this.actor) return null;
    const rollData = this.actor.getRollData();
    rollData.item = foundry.utils.deepClone(this.data.data);
    rollData.damageDie = hasDamage ? this.data.data.damage.current.parts[0] : null;
    rollData.mod = hasAttack ? this.data.data.attack.parts[0] : hasDamage ? this.data.data.damage.current.parts[1] : null;
    rollData.prof = hasAttack ? this.data.data.attack.parts[1] : null;
    return rollData;
  }
  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */

  async roll({ configureDialog = true, rollMode, hasDamage = false, hasAttack = false, createMessage = true } = {}) {
    let item = this;
    const id = item.id;
    const iData = this.data.data; //Item data
    const actor = this.actor;
    const aData = actor.data.data;
    hasDamage = iData.hasDamage || hasDamage;
    hasAttack = iData.hasAttack || hasAttack;
    // Initialize chat data.
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });
    const iName = this.name;
    // Otherwise, create a roll and send a chat message from it.
    const targets = Array.from(game.user.targets);
    const mRoll = this.data.data.mRoll || false;
    return item.displayCard({ rollMode, createMessage, hasAttack, hasDamage, targets, mRoll });
  }
  /* -------------------------------------------- */
  /*  Chat Message Helpers                        */
  /* -------------------------------------------- */

  static chatListeners(html) {
    html.on("click", ".card-buttons button", this._onChatCardAction.bind(this));
    html.on("click", ".item-name", this._onChatCardToggleContent.bind(this));
    html.on("click", ".attack-roll .roll-controls .accept", this._rollDamage.bind(this));
    html.on("hover", ".attack-roll .flexrow .value", function (event) {
      event.preventDefault();
      const element = this.closest("li.flexrow");
      element.querySelector(".attack-roll .hover-roll")?.classList.toggle("shown", event.type == "mouseenter");
    });
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
    const card = button.closest(".chat-card");
    const messageId = card.closest(".message").dataset.messageId;
    const message = game.messages.get(messageId);
    const action = button.dataset.action;
    const targetUuid = button.closest(".flexrow").dataset.targetId;

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
      case "damage":
      case "versatile":
        let dam = await item.rollDamage({
          critical: event.altKey,
          event: event,
          spellLevel: spellLevel,
          versatile: action === "versatile",
        });
        //const dom = new DOMParser().parseFromString(message.data.content,"text/html")
        const html = $(message.data.content);
        dam = await dam.render();
        //dom.querySelector('button').replaceWith(dam)
        if (targetUuid) {
          html.find(`[data-targetId="${targetUuid}"]`).find("button").replaceWith(dam);
        } else {
          html.find(".damage-roll").find("button").replaceWith(dam);
        }
        //console.log(dom)
        await message.update({ content: html[0].outerHTML });
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
  async _applyDamage(dam, tData, tHealth, tActor) {
    let value = dam.total;
    console.log("урон до резистов: ", value);
    dam.terms.forEach((term) => {
      if (!(term instanceof OperatorTerm)) {
        let damageType = term.options.damageType;
        let res = tData.defences.damage[damageType[0]][damageType[1]];
        if (res.type === "imm") console.log("Иммунитет");
        console.log("урон уменьшился с ", value);
        value -= res.type === "imm" ? term.total : Math.min(res.value, term.total);
        console.log("до", value);
      }
    });
    console.log(value, "итоговый урон");
    tHealth -= value;
    console.log("хп стало", tHealth);
    let obj = {};
    obj["data.health.value"] = tHealth;
    if (game.user.isGM) {
      await tActor.update(obj);
    } else {
      game.socket.emit("system.ard20", {
        operation: "updateActorData",
        actor: tActor,
        update: obj,
        value: value,
      });
    }
  }
  static async _rollDamage(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const card = element.closest(".chat-card");
    const message = game.messages.get(card.closest(".message").dataset.messageId);
    const targetUuid = element.closest("li.flexrow").dataset.targetId;
    const token = await fromUuid(targetUuid);
    const tActor = token.actor;
    const tData = tActor.data.data;
    let tHealth = tData.health.value;
    console.log(tHealth, "здоровье цели");
    // Recover the actor for the chat card
    const actor = await this._getChatCardActor(card);
    if (!actor) return;
    // Get the Item from stored flag data or by the item ID on the Actor
    const storedData = message.getFlag("ard20", "itemData");
    const item = storedData ? new this(storedData, { parent: actor }) : actor.items.get(card.dataset.itemId);
    if (!item) {
      return ui.notifications.error(game.i18n.format("ARd20.ActionWarningNoItem", { item: card.dataset.itemId, name: actor.name }));
    }
    const dam = await item.rollDamage({
      event: event,
      canMult: false,
    });
    const html = $(message.data.content);
    let damHTML = await dam.render();
    console.log(html.find(`[data-target-id="${targetUuid}"]`).find(".damage-roll")[0]);
    html.find(`[data-target-id="${targetUuid}"]`).find(".damage-roll").append(damHTML);
    html.find(`[data-target-id="${targetUuid}"]`).find(".accept").remove();
    console.log(html[0]);
    await message.update({ content: html[0].outerHTML });
    await item._applyDamage(dam, tData, tHealth, tActor);
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
  /*showRollDetail(event){
    event.preventDefault();
    const elem = event.currentTarget;
    const 
  }*/
  async displayCard({ rollMode, createMessage = true, hasAttack = Boolean(), hasDamage = Boolean(), targets = [], mRoll = Boolean() } = {}) {
    // Render the chat card template
    let atk = {};
    let dc = {};
    let atkHTML = {};
    let dmgHTML = {};
    let result = {};
    let hit = {};
    let dmg = {};
    let dieResultCss = {};
    const def = this.data.data.attack?.def ?? "reflex";
    const token = this.actor.token;
    if (targets.length !== 0) {
      let atkRoll = hasAttack ? await this.rollAttack(mRoll, { canMult: true }) : null;
      let dmgRoll = hasDamage && !hasAttack ? await this.rollDamage({ canMult: true }) : null;
      for (let [key, target] of Object.entries(targets)) {
        if (atkRoll) {
          mRoll = atkRoll.options.mRoll;
          dc[key] = target.actor.data.data.defences.stats[def].value;
          atk[key] = hasAttack ? (Object.keys(atk).length === 0 || !mRoll ? atkRoll : await atkRoll.reroll()) : null;
          console.log(atk[key]);
          atkHTML[key] = hasAttack ? await atk[key].render() : null;
          let d20 = atk[key] ? atk[key].terms[0] : null;
          atk[key] = atk[key].total;
          dieResultCss[key] = d20.total >= d20.options.critical ? "d20crit" : d20.total <= d20.options.fumble ? "d20fumble" : "d20normal";
          result[key] = atk[key] > dc[key] ? "hit" : "miss";
          hit[key] = result[key] === "hit" ? true : false;
        } else {
          mRoll = dmgRoll.options.mRoll;
          dmg[key] = hasDamage ? (Object.keys(dmg).length === 0 || !mRoll ? dmgRoll : await dmgRoll.reroll()) : null;
          dmgHTML[key] = hasDamage ? await dmg[key].render() : null;
        }
      }
    } else {
      atk[0] = hasAttack ? await this.rollAttack(mRoll) : null;
      mRoll = atk[0] ? atk[0].options.mRoll : false;
      atkHTML[0] = hasAttack ? await atk[0].render() : null;
    }
    let templateState = targets.size !== 0 ? (mRoll ? "multiAttack" : "oneAttack") : "noTarget";
    const templateData = {
      actor: this.actor.data,
      tokenId: token?.uuid || null,
      item: this.data,
      data: this.getChatData(),
      labels: this.labels,
      hasAttack,
      hasDamage,
      atk,
      atkHTML,
      targets,
      owner: this.actor.isOwner || game.user.isGM,
      dc,
      result,
      hit,
      dmgHTML,
      dieResultCss,
    };
    const html = await renderTemplate(`systems/ard20/templates/chat/item-card-multiAttack.html`, templateData);

    // Create the ChatMessage data object
    const chatData = {
      user: game.user.data._id,
      type: CONST.CHAT_MESSAGE_TYPES.OTHER,
      content: html,
      flavor: this.data.data.chatFlavor || this.name,
      speaker: ChatMessage.getSpeaker({ actor: this.actor, token }),
      flags: { "core.canPopout": true },
    };

    // If the Item was destroyed in the process of displaying its card - embed the item data in the chat message
    if (this.data.type === "consumable" && !this.actor.items.has(this.id)) {
      chatData.flags["ard20.itemData"] = this.data;
    }

    // Apply the roll mode to adjust message visibility
    ChatMessage.applyRollMode(chatData, rollMode || game.settings.get("core", "rollMode"));

    // Create the Chat Message or return its data
    return createMessage ? ChatMessage.create(chatData) : chatData;
  }

  /**
   * Prepare an object of chat data used to display a card for the Item in the chat log.
   * @param {object} htmlOptions    Options used by the TextEditor.enrichHTML function.
   * @returns {object}              An object of chat data to render.
   */
  getChatData(htmlOptions = {}) {
    const data = foundry.utils.deepClone(this.data.data);
    const labels = this.labels;

    // Rich text description
    //data.description.value = TextEditor.enrichHTML(data.description.value, htmlOptions);

    // Item type specific properties
    const props = [];

    // Equipment properties
    if (data.hasOwnProperty("equipped") && !["loot", "tool"].includes(this.data.type)) {
      /*if (data.attunement === CONFIG.ARd20.attunementTypes.REQUIRED) {
        props.push(game.i18n.localize(CONFIG.ARd20.attunements[CONFIG.ARd20.attunementTypes.REQUIRED]));
      }*/
      props.push(game.i18n.localize(data.equipped ? "ARd20.Equipped" : "ARd20.Unequipped"));
    }

    // Ability activation properties
    if (data.hasOwnProperty("activation")) {
      props.push(labels.activation + (data.activation?.condition ? ` (${data.activation.condition})` : ""), labels.target, labels.range, labels.duration);
    }

    // Filter properties and return
    data.properties = props.filter((p) => !!p);
    return data;
  }
  /* -------------------------------------------- */

  /**
   * Prepare chat card data for weapon type items.
   * @param {object} data     Copy of item data being use to display the chat message.
   * @param {object} labels   Specially prepared item labels.
   * @param {string[]} props  Existing list of properties to be displayed. *Will be mutated.*
   * @private
   */

  /* -------------------------------------------- */

  /**
   * Place an attack roll using an item (weapon, feat, spell, or equipment)
   * Rely upon the d20Roll logic for the core implementation
   *
   * @param {object} options        Roll options which are configured and provided to the d20Roll function
   * @returns {Promise<Roll|null>}   A Promise which resolves to the created Roll instance
   */
  async rollAttack(mRoll = Boolean(), canMult = Boolean(), options = {}) {
    console.log(canMult);
    const itemData = this.data.data;
    const flags = this.actor.data.flags.ard20 || {};
    let title = `${this.name} - ${game.i18n.localize("ARd20.AttackRoll")}`;

    const { parts, rollData } = this.getAttackToHit();
    const targets = game.user.targets;
    if (options.parts?.length > 0) {
      parts.push(...options.parts);
    }
    let rollConfig = {
      parts: parts,
      actor: this.actor,
      data: rollData,
      title: title,
      flavor: title,
      dialogOptions: {
        width: 400,
      },
      chatMessage: true,
      options: {
        create: false,
      },
      targetValue: targets,
      canMult: canMult,
      mRoll: mRoll,
    };
    rollConfig = mergeObject(rollConfig, options);
    const roll = await d20Roll(rollConfig);
    if (roll === false) return null;
    return roll;
  }
  rollDamage({ critical = false, event = null, spellLevel = null, versatile = false, options = {}, mRoll = Boolean(), canMult = Boolean() } = {}) {
    console.log(canMult);
    const iData = this.data.data;
    const aData = this.actor.data.data;
    const parts = iData.damage.current.parts.map((d) => d[0]);
    const damType = iData.damage.current.parts.map((d) =>
      d[1].map((c, ind) => {
        let a = game.i18n.localize(CONFIG.ARd20.DamageTypes[c[0]]);
        let b = game.i18n.localize(CONFIG.ARd20.DamageSubTypes[c[1]]);
        let obj = { key: ind, label: `${a} ${b}` };
        return obj;
      })
    );
    options.damageType = iData.damage.current.parts.map((d) => d[1]);
    const hasAttack = false;
    const hasDamage = true;
    const rollData = this.getRollData(hasAttack, hasDamage);
    const rollConfig = {
      actor: this.actor,
      critical: critical ?? event?.altkey ?? false,
      data: rollData,
      event: event,
      parts: parts,
      canMult: canMult,
      damType: damType,
      mRoll: mRoll,
    };
    return damageRoll(mergeObject(rollConfig, options));
  }
  /**
   * Update a label to the Item detailing its total to hit bonus.
   * Sources:
   * - item entity's innate attack bonus
   * - item's actor's proficiency bonus if applicable
   * - item's actor's global bonuses to the given item type
   * - item's ammunition if applicable
   *
   * @returns {{rollData: object, parts: string[]}|null}  Data used in the item's Attack roll.
   */
  getAttackToHit() {
    const itemData = this.data.data;
    const hasAttack = true;
    const hasDamage = false;
    //if (!this.hasAttack || !itemData) return;
    const rollData = this.getRollData(hasAttack, hasDamage);
    console.log("ROLL DATA", rollData);

    // Define Roll bonuses
    const parts = [];

    // Include the item's innate attack bonus as the initial value and label
    if (itemData.attackBonus) {
      parts.push(itemData.attackBonus);
      this.labels.toHit = itemData.attackBonus;
    }

    // Take no further action for un-owned items
    if (!this.isOwned) return { rollData, parts };

    // Ability score modifier
    parts.push("@prof", "@mod");

    /* Add proficiency bonus if an explicit proficiency flag is present or for non-item features
    if ( !["weapon", "consumable"].includes(this.data.type)) {
      parts.push("@prof");
      if ( this.data.data.prof?.hasProficiency ) {
        rollData.prof = this.data.data.prof.term;
      }
    }
    */

    /* Actor-level global bonus to attack rolls
    const actorBonus = this.actor.data.data.bonuses?.[itemData.actionType] || {};
    if (actorBonus.attack) parts.push(actorBonus.attack);
    */

    /* One-time bonus provided by consumed ammunition
    if (itemData.consume?.type === "ammo" && this.actor.items) {
      const ammoItemData = this.actor.items.get(itemData.consume.target)?.data;

      if (ammoItemData) {
        const ammoItemQuantity = ammoItemData.data.quantity;
        const ammoCanBeConsumed = ammoItemQuantity && ammoItemQuantity - (itemData.consume.amount ?? 0) >= 0;
        const ammoItemAttackBonus = ammoItemData.data.attackBonus;
        const ammoIsTypeConsumable = ammoItemData.type === "consumable" && ammoItemData.data.consumableType === "ammo";
        if (ammoCanBeConsumed && ammoItemAttackBonus && ammoIsTypeConsumable) {
          parts.push("@ammo");
          rollData.ammo = ammoItemAttackBonus;
        }
      }
    }
    */

    // Condense the resulting attack bonus formula into a simplified label
    const roll = new Roll(parts.join("+"), rollData);
    const formula = simplifyRollFormula(roll.formula);
    this.labels.toHit = !/^[+-]/.test(formula) ? `+ ${formula}` : formula;

    // Update labels and return the prepared roll data
    return { rollData, parts };
  }
}
