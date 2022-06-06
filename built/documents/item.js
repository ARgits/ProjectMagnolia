import { getValues, obj_entries } from "../ard20.js";
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
  prepareDerivedData() {
    super.prepareDerivedData();
    const itemData = this.system;
    this.labels = {};
    this._prepareSpellData(itemData);
    this._prepareWeaponData(itemData);
    this._prepareFeatureData(itemData);
    this._prepareRaceData(itemData);
    this._prepareArmorData(itemData);
    if (itemData.hasAttack) this._prepareAttack(itemData);
    if (itemData.hasDamage) this._prepareDamage(itemData);
    if (!this.isOwned) this.prepareFinalAttributes();
  }
  /**
   *Prepare data for Spells
   */
  _prepareSpellData(itemData) {
    if (this.type !== "spell") return;
    const data = itemData;
  }
  /**
   *Prepare data for weapons
   */
  _prepareWeaponData(itemData) {
    if (this.type !== "weapon") return;
    const data = itemData;
    const flags = this.flags;
    data.hasAttack = data.hasAttack || true;
    data.hasDamage = data.hasDamage || true;
    //TODO: this._setDeflect(data);
    this._setTypeAndSubtype(data, flags);
    for (const level of game.settings.get("ard20", "profLevel")) {
      data.damage.common[level.key] = data.damage.common[level.key] ?? {
        formula: "",
        parts: [["", ["", ""]]],
      };
    }
    /*for (let [key, type] of obj_entries(data.damage)) {
            if (key !== "current") {
                for (let [key, prof] of obj_entries(type)) {
                    prof.formula = "";
                    prof.parts.forEach((part) => {
                        if (Array.isArray(part[1])) {
                            prof.formula += `${part[0]}`;
                            part[1].forEach((sub, ind) => {
                                if (ind === 0) {
                                    prof.formula += ` {${sub[0]} ${sub[1]}`;
                                    prof.formula += ind === part[1].length - 1 ? "}" : "";
                                }
                                else {
                                    prof.formula += ` or ${sub[0]} ${sub[1]}`;
                                    prof.formula += ind === part[1].length - 1 ? "}" : "";
                                }
                            });
                        }
                        else
                            prof.formula += `${part[0]} {${part[1]} ${part[2]}}; `;
                    });
                }
            }
        }*/
  }
  /**
   *Set deflect die equal to damage die, if not
   */
  /* TODO:
    _setDeflect(data: object & WeaponDataPropertiesData) {
      for (let [k, v] of obj_entries(CONFIG.ARd20.Rank)) {
        v = game.i18n.localize(CONFIG.ARd20.prof[k]) ?? k;
        v = v.toLowerCase();
        data.deflect[v] = data.property[v].def ? data.deflect[v] || data.damage.common[v] : 0;
      }
    }
    */
  //@ts-expect-error
  _setTypeAndSubtype(data, flags) {
    data.sub_type_array = game.settings
      .get("ard20", "proficiencies")
      .weapon.value.filter((prof) => prof.type === data.type.value);
    if (flags.core?.sourceId) {
      const id = /Item.(.+)/.exec(flags.core.sourceId)[1];
      const item = game.items?.get(id);
      if (item?.type === "weapon") {
        data.sub_type = data.sub_type === undefined ? item.system.sub_type : data.sub_type;
      }
    }
    data.sub_type =
      data.sub_type_array.filter((prof) => prof.name === data.sub_type).length === 0
        ? data.sub_type_array[0].name
        : data.sub_type || data.sub_type_array[0].name;
    data.proficiency.name =
      game.i18n.localize(getValues(CONFIG.ARd20.Rank, data.proficiency.level)) ??
      getValues(CONFIG.ARd20.Rank, data.proficiency.level);
    data.type.name =
      game.i18n.localize(getValues(CONFIG.ARd20.Rank, data.type.value)) ??
      getValues(CONFIG.ARd20.Rank, data.type.value);
  }
  /**
   *Prepare data for features
   */
  _prepareFeatureData(itemData) {
    if (this.type !== "feature") return;
    const data = itemData;
    // Handle Source of the feature
    data.source.label = "";
    data.source.value.forEach((value, key) => {
      let label = game.i18n.localize(getValues(CONFIG.ARd20.Source, value));
      data.source.label += key === 0 ? label : `</br>${label}`;
    });
    //labels.source = game.i18n.localize(CONFIG.ARd20.source[data.source.value]);
    //define levels
    data.level.has = data.level.has !== undefined ? data.level.has : false;
    data.level.max = data.level.has ? data.level.max || 4 : 1;
    data.level.initial = Math.min(data.level.max, data.level.initial);
    data.level.current = this.isOwned ? Math.max(data.level.initial, 1) : 0;
    //define exp cost
    if (data.level.max > 1) {
      let n = (10 - data.level.max) / data.level.max;
      let k = 1.7 + (Math.round(Number((Math.abs(n) * 100).toPrecision(15))) / 100) * Math.sign(n);
      if (data.xp.basicCost.length < data.level.max) {
        for (let i = 1; i < data.level.max; i++) {
          data.xp.basicCost.push(Math.round((data.xp.basicCost[i - 1] * k) / 5) * 5);
          data.xp.AdvancedCost.push(data.xp.basicCost[i]);
        }
      } else {
        for (let i = 1; i < data.level.max; i++) {
          data.xp.basicCost[i] = Math.round((data.xp.basicCost[i - 1] * k) / 5) * 5;
          data.xp.AdvancedCost[i] = data.xp.AdvancedCost[i] ?? data.xp.basicCost[i];
        }
      }
    }
    for (let [key, req] of Object.entries(data.req.values)) {
      req.pass = Array.from({ length: data.level.max }, (i) => (i = false));
      switch (req.type) {
        case "ability":
          for (let [key, v] of obj_entries(CONFIG.ARd20.Attributes)) {
            if (req.name === game.i18n.localize(CONFIG.ARd20.Attributes[key])) req.value = key;
          }
          break;
        case "skill":
          for (let [key, v] of obj_entries(CONFIG.ARd20.Skills)) {
            if (req.name === game.i18n.localize(CONFIG.ARd20.Skills[key])) req.value = key;
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
  _prepareRaceData(itemData) {
    if (this.type !== "race") return;
  }
  /**
   * Prepare data for "armor" type item
   */
  _prepareArmorData(itemData) {
    if (this.type !== "armor") return;
    const data = itemData;
    for (let [key, dr] of obj_entries(CONFIG.ARd20.DamageSubTypes)) {
      if (!(key === "force" || key === "radiant" || key === "psychic")) {
        data.res.phys[key].value = parseInt(data.res.phys[key].value) || 0;
        data.res.phys[key].value += data.res.phys[key].value !== "imm" ? data.res.phys[key].bonus : "";
      }
      data.res.mag[key].value = parseInt(data.res.mag[key].value) || 0;
      data.res.mag[key].value += data.res.mag[key].value !== "imm" ? data.res.mag[key].bonus : "";
    }
    data.mobility.value = data.mobility.value ?? CONFIG.ARd20.HeavyPoints[data.type][data.slot];
    data.mobility.value += data.mobility.bonus;
  }
  /**
    Prepare Data that uses actor's data
    */
  prepareFinalAttributes() {
    const itemData = this.system;
    //@ts-expect-error
    const abil = (itemData.abil = {});
    for (let [k, v] of obj_entries(CONFIG.ARd20.Attributes)) {
      abil[k] = this.isOwned ? getProperty(this.actor.system, `data.attributes.${k}.mod`) : null;
    }
    let prof_bonus = 0;
    if (itemData.type === "weapon") {
      const data = itemData;
      data.proficiency.level = this.isOwned
        ? this.actor?.system.proficiencies.weapon.filter((pr) => pr.name === data.sub_type)[0].value
        : 0;
      data.proficiency.levelName = game.settings.get("ard20", "profLevel")[data.proficiency.level].label;
      data.proficiency.key = game.settings.get("ard20", "profLevel")[data.proficiency.level].key;
      prof_bonus = data.proficiency.level * 4;
    }
    if (itemData.hasAttack) this._prepareAttack(itemData, prof_bonus, abil);
    if (itemData.hasDamage) this._prepareDamage(itemData, abil);
  }
  _prepareAttack(itemData, prof_bonus, abil) {
    const data = itemData;
    if (!data.hasAttack) return;
    //@ts-expect-error
    let mod = itemData.type === "weapon" && abil !== undefined ? abil.dex : data.atkMod;
    //@ts-expect-error
    data.attack = {
      formula: "1d20+" + prof_bonus + "+" + mod,
      parts: [mod, prof_bonus],
    };
  }
  _prepareDamage(itemData, abil) {
    const data = itemData;
    if (!data.hasDamage) return;
    let mod = itemData.type === "weapon" && abil !== undefined ? abil.str : 0;
    const prop = itemData.type === "weapon" ? `damage.common.${data.proficiency.key}.parts` : "damage.parts";
    let baseDamage = getProperty(data, prop);
    //@ts-expect-error
    data.damage.current = {
      formula: "",
      parts: baseDamage,
    };
    baseDamage?.forEach((part, key) => {
      console.log("baseDamage for current damage", part);
      //@ts-expect-error
      data.damage.current.formula += part[0] + `[`;
      part[1].forEach((subPart, subKey) => {
        data.damage.current.formula +=
          game.i18n.localize(CONFIG.ARd20.DamageTypes[subPart[0]]) +
          ` ${game.i18n.localize(CONFIG.ARd20.DamageSubTypes[subPart[1]])}`;
        data.damage.current.formula += subKey === part[1].length - 1 ? "]" : " or<br/>";
      });
      data.damage.current.formula += key === baseDamage.length - 1 ? "" : "<br/>+<br/>";
    });
  }
  /**
   * Prepare a data object which is passed to any Roll formulas which are created related to this Item
   * @private
   */
  //@ts-expect-error
  getRollData() {
    // If present, return the actor's roll data.
    if (!this.actor) return null;
    const rollData = this.actor.getRollData();
    const hasDamage = this.system.hasDamage;
    const hasAttack = this.system.hasAttack;
    //@ts-expect-error
    rollData.item = foundry.utils.deepClone(this.system);
    //@ts-expect-error
    rollData.damageDie = hasDamage ? this.system.damage.current.parts[0] : null;
    //@ts-expect-error
    rollData.mod = hasAttack
      ? //@ts-expect-error
        this.system.attack.parts[0]
      : hasDamage
      ? //@ts-expect-error
        this.system.damage.current.parts[1]
      : null;
    //@ts-expect-error
    rollData.prof = hasAttack ? this.system.attack.parts[1] : null;
    return rollData;
  }
  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  //@ts-expect-error
  async roll({ configureDialog = true, rollMode, hasDamage = false, hasAttack = false, createMessage = true }) {
    let item = this;
    const id = item.id;
    const iData = this.system; //Item data
    const actor = this.actor;
    const aData = actor?.system;
    hasDamage = iData.hasDamage || hasDamage;
    hasAttack = iData.hasAttack || hasAttack;
    // Initialize chat data.
    const speaker = ChatMessage.getSpeaker({ actor: actor });
    const iName = this.name;
    // Otherwise, create a roll and send a chat message from it.
    const targets = Array.from(game.user.targets);
    //@ts-expect-error
    const mRoll = this.system.mRoll || false;
    //@ts-expect-error
    return item.displayCard({ rollMode, createMessage, hasAttack, hasDamage, targets, mRoll });
  }
  /* -------------------------------------------- */
  /*  Chat Message Helpers                        */
  /* -------------------------------------------- */
  static chatListeners(html) {
    html.on("click", ".card-buttons button", this._onChatCardAction.bind(this));
    html.on("click", ".item-name", this._onChatCardToggleContent.bind(this));
    html.on("click", ".attack-roll .roll-controls .accept", this._rollDamage.bind(this));
    html.trigger("click");
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
  //@ts-expect-error
  static async _onChatCardAction(event) {
    console.log(event);
    event.stopImmediatePropagation();
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
    //@ts-expect-error
    const item = storedData ? new this(storedData, { parent: actor }) : actor.items.get(card.dataset.itemId);
    if (!item) {
      return ui.notifications.error(
        game.i18n.format("ARd20.ActionWarningNoItem", { item: card.dataset.itemId, name: actor.name })
      );
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
          //@ts-expect-error
          const speaker = ChatMessage.getSpeaker({ scene: canvas.scene, token: token });
          //@ts-expect-error
          await token.actor.rollAbilitySave(button.dataset.ability, { event, speaker });
        }
        break;
      case "toolCheck":
        await item.rollToolCheck({ event });
        break;
      case "placeTemplate":
        ///@ts-expect-error
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
  async _applyDamage(dam, tData, tHealth, tActor, tokenId) {
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
      console.log("GM applying damage");
      console.log(tActor);
      await tActor.update(obj);
    } else {
      console.log("not GM applying damage");
      game.socket.emit("system.ard20", {
        operation: "updateActorData",
        tokenId: tokenId,
        update: obj,
        value: value,
      });
    }
  }
  static async _rollDamage(event) {
    event.stopImmediatePropagation();
    const element = event.currentTarget;
    const card = element.closest(".chat-card");
    const message = game.messages.get(card.closest(".message").dataset.messageId);
    const targetUuid = element.closest("li.flexrow").dataset.targetId;
    const token = await fromUuid(targetUuid);
    //@ts-expect-error
    const tActor = token?.actor;
    const tData = tActor.system;
    let tHealth = tData.health.value;
    console.log(tHealth, "здоровье цели");
    // Recover the actor for the chat card
    const actor = await this._getChatCardActor(card);
    if (!actor) return;
    // Get the Item from stored flag data or by the item ID on the Actor
    const storedData = message.getFlag("ard20", "itemData");
    //@ts-expect-error
    const item = storedData ? new this(storedData, { parent: actor }) : actor.items.get(card.dataset.itemId);
    if (!item) {
      return ui.notifications.error(
        game.i18n.format("ARd20.ActionWarningNoItem", { item: card.dataset.itemId, name: actor.name })
      );
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
    await item._applyDamage(dam, tData, tHealth, tActor, targetUuid);
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
      //@ts-expect-error
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
    //@ts-expect-error
    if (!targets.length && game.user.character) targets = targets.concat(game.user.character.getActiveTokens());
    if (!targets.length) ui.notifications.warn(game.i18n.localize("ARd20.ActionWarningNoToken"));
    return targets;
  }
  /*showRollDetail(event){
      event.preventDefault();
      const elem = event.currentTarget;
      const
    }*/
  async displayCard({
    //@ts-expect-error
    rollMode,
    createMessage = true,
    hasAttack = Boolean(),
    hasDamage = Boolean(),
    targets = [],
    mRoll = Boolean(),
  } = {}) {
    // Render the chat card template
    let atk = {};
    let dc = {};
    let atkHTML = {};
    let dmgHTML = {};
    let result = {};
    let hit = {};
    let dmg = {};
    let dieResultCss = {};
    //@ts-expect-error
    const def = this.system.attack?.def ?? "reflex";
    const token = this.actor.token;
    if (targets.length !== 0) {
      //@ts-expect-error
      let atkRoll = hasAttack ? await this.rollAttack(mRoll, { canMult: true }) : null;
      let dmgRoll = hasDamage && !hasAttack ? await this.rollDamage({ canMult: true }) : null;
      for (let [key, target] of Object.entries(targets)) {
        if (atkRoll) {
          mRoll = atkRoll.options.mRoll;
          //@ts-expect-error
          dc[key] = target.actor.system.defences.stats[def].value;
          //@ts-expect-error
          atk[key] = hasAttack ? (Object.keys(atk).length === 0 || !mRoll ? atkRoll : await atkRoll.reroll()) : null;
          //@ts-expect-error
          console.log(atk[key]);
          //@ts-expect-error
          atkHTML[key] = hasAttack ? await atk[key].render() : null;
          //@ts-expect-error
          let d20 = atk[key] ? atk[key].terms[0] : null;
          //@ts-expect-error
          atk[key] = atk[key].total;
          //@ts-expect-error
          dieResultCss[key] =
            d20.total >= d20.options.critical ? "d20crit" : d20.total <= d20.options.fumble ? "d20fumble" : "d20normal";
          //@ts-expect-error
          result[key] = atk[key] > dc[key] ? "hit" : "miss";
          //@ts-expect-error
          hit[key] = result[key] === "hit" ? true : false;
        } else {
          mRoll = dmgRoll.options.mRoll;
          //@ts-expect-error
          dmg[key] = hasDamage ? (Object.keys(dmg).length === 0 || !mRoll ? dmgRoll : await dmgRoll.reroll()) : null;
          //@ts-expect-error
          dmgHTML[key] = hasDamage ? await dmg[key].render() : null;
        }
      }
    } else {
      //@ts-expect-error
      atk[0] = hasAttack ? await this.rollAttack(mRoll) : null;
      //@ts-expect-error
      mRoll = atk[0] ? atk[0].options.mRoll : false;
      //@ts-expect-error
      atkHTML[0] = hasAttack ? await atk[0].render() : null;
    }
    //@ts-expect-error
    let templateState = targets.size !== 0 ? (mRoll ? "multiAttack" : "oneAttack") : "noTarget";
    const templateData = {
      //@ts-expect-error
      actor: this.actor.system,
      tokenId: token?.uuid || null,
      item: this,
      data: this.getChatData(),
      //@ts-expect-error
      labels: this.labels,
      hasAttack,
      hasDamage,
      atk,
      atkHTML,
      targets,
      //@ts-expect-error
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
      //@ts-expect-error
      flavor: this.system.chatFlavor || this.name,
      //@ts-expect-error
      speaker: ChatMessage.getSpeaker({ actor: this.actor, token }),
      flags: { "core.canPopout": true },
    };
    // If the Item was destroyed in the process of displaying its card - embed the item data in the chat message
    /*
        if (this.data.type === "consumable" && !this.actor.items.has(this.id)) {
          chatData.flags["ard20.itemData"] = this.data;
        }*/
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
    const data = foundry.utils.deepClone(this.system);
    // Rich text description
    //data.description.value = TextEditor.enrichHTML(data.description.value, htmlOptions);
    // Item type specific properties
    const props = [];
    // Equipment properties
    /*if (data.hasOwnProperty("equipped") && !["loot", "tool"].includes(this.data.type)) {
          /*if (data.attunement === CONFIG.ARd20.attunementTypes.REQUIRED) {
            props.push(game.i18n.localize(CONFIG.ARd20.attunements[CONFIG.ARd20.attunementTypes.REQUIRED]));
          }*/
    /*props.push(game.i18n.localize(data.equipped ? "ARd20.Equipped" : "ARd20.Unequipped"));
        }
    
        // Ability activation properties
        if (data.hasOwnProperty("activation")) {
          props.push(labels.activation + (data.activation?.condition ? ` (${data.activation.condition})` : ""), labels.target, labels.range, labels.duration);
        }
    
        // Filter properties and return
        data.properties = props.filter((p) => !!p);
        */
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
    const itemData = this.system;
    //@ts-expect-error
    const flags = this.actor.flags.ard20 || {};
    let title = `${this.name} - ${game.i18n.localize("ARd20.AttackRoll")}`;
    const { parts, rollData } = this.getAttackToHit();
    const targets = game.user.targets;
    //@ts-expect-error
    if (options.parts?.length > 0) {
      //@ts-expect-error
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
    //@ts-expect-error
    rollConfig = mergeObject(rollConfig, options);
    //@ts-expect-error
    const roll = await d20Roll(rollConfig);
    if (roll === false) return null;
    return roll;
  }
  rollDamage({
    critical = false,
    event = null,
    spellLevel = null,
    versatile = false,
    options = {},
    mRoll = Boolean(),
    canMult = Boolean(),
  } = {}) {
    console.log(canMult);
    const iData = this.system;
    const aData = this.actor.system;
    //@ts-expect-error
    const parts = iData.damage.current.parts.map((d) => d[0]);
    //@ts-expect-error
    const damType = iData.damage.current.parts.map((d) =>
      d[1].map((c, ind) => {
        //@ts-expect-error
        let a = game.i18n.localize(CONFIG.ARd20.DamageTypes[c[0]]);
        //@ts-expect-error
        let b = game.i18n.localize(CONFIG.ARd20.DamageSubTypes[c[1]]);
        let obj = { key: ind, label: `${a} ${b}` };
        return obj;
      })
    );
    //@ts-expect-error
    options.damageType = iData.damage.current.parts.map((d) => d[1]);
    const hasAttack = false;
    const hasDamage = true;
    //@ts-expect-error
    const rollData = this.getRollData(hasAttack, hasDamage);
    const rollConfig = {
      actor: this.actor,
      //@ts-expect-error
      critical: critical ?? event?.altkey ?? false,
      data: rollData,
      event: event,
      parts: parts,
      canMult: canMult,
      damType: damType,
      mRoll: mRoll,
    };
    //@ts-expect-error
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
    const itemData = this.system;
    const hasAttack = true;
    const hasDamage = false;
    //if (!this.hasAttack || !itemData) return;
    //@ts-expect-error
    const rollData = this.getRollData(hasAttack, hasDamage);
    console.log("ROLL DATA", rollData);
    // Define Roll bonuses
    const parts = [];
    // Include the item's innate attack bonus as the initial value and label
    //@ts-expect-error
    if (itemData.attackBonus) {
      //@ts-expect-error
      parts.push(itemData.attackBonus);
      //@ts-expect-error
      this.labels.toHit = itemData.attackBonus;
    }
    // Take no further action for un-owned items
    if (!this.isOwned) return { rollData, parts };
    // Ability score modifier
    parts.push("@prof", "@mod");
    /* Add proficiency bonus if an explicit proficiency flag is present or for non-item features
        if ( !["weapon", "consumable"].includes(this.data.type)) {
          parts.push("@prof");
          if ( this.system.prof?.hasProficiency ) {
            rollData.prof = this.system.prof.term;
          }
        }
        */
    /* Actor-level global bonus to attack rolls
        const actorBonus = this.actor.system.bonuses?.[itemData.actionType] || {};
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
    //@ts-expect-error
    const roll = new Roll(parts.join("+"), rollData);
    //@ts-expect-error
    const formula = simplifyRollFormula(roll.formula);
    //@ts-expect-error
    this.labels.toHit = !/^[+-]/.test(formula) ? `+ ${formula}` : formula;
    // Update labels and return the prepared roll data
    return { rollData, parts };
  }
}
